-- Profiltabelle für ANIMORA (Schritt 2). Spezifikation: docs/specs/profiles.md
--
-- Profilangaben ziehen aus den Nutzer-Metadaten in eine eigene Tabelle.
-- Die Datenbank prüft dieselben Regeln wie src/lib/validation/auth.ts und
-- schützt die Daten mit Row Level Security.

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text,
  avatar_hue smallint not null default 28,
  onboarding_complete boolean not null default false,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  constraint profiles_display_name_length
    check (
      display_name = btrim(display_name)
      and char_length(display_name) between 1 and 40
    ),
  constraint profiles_bio_length
    check (bio is null or char_length(bio) <= 160),
  constraint profiles_avatar_hue_range
    check (avatar_hue between 0 and 360),
  constraint profiles_role_valid
    check (role in ('member', 'moderator'))
);

comment on table public.profiles is
  'Öffentliche Profilangaben je Supabase-Konto. Die E-Mail-Adresse steht bewusst nicht hier.';

-- „Kenji“ und „kenji“ dürfen nicht gleichzeitig existieren.
create unique index profiles_username_lower_key
  on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- updated_at automatisch setzen
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Zugriffsregeln (RLS) und Spaltenrechte
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "Profile sind öffentlich lesbar"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy "Nutzer ändern nur ihr eigenes Profil"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Anlegen und Löschen gibt es über die API nicht: Profile entstehen per
-- Trigger und verschwinden mit dem Konto. Rolle, ID und Zeitstempel sind
-- für Nutzer nicht änderbar.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_hue, onboarding_complete)
  on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Profil aus den Metadaten anlegen (Registrierung und bestehende Konten)
-- ---------------------------------------------------------------------------

-- Ersatzname, falls der gewünschte Name ungültig oder vergeben ist.
create function public.fallback_username(user_id uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'user_' || left(replace(user_id::text, '-', ''), 12);
$$;

create function public.create_profile_from_metadata(user_id uuid, meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := btrim(coalesce(meta ->> 'username', ''));
  hue_text text := meta ->> 'avatar_hue';
  final_username text;
  final_display text;
  final_bio text := nullif(btrim(coalesce(meta ->> 'bio', '')), '');
  final_hue smallint := 28;
  final_onboarding boolean := coalesce(meta ->> 'onboarding_complete', '') = 'true';
begin
  if exists (select 1 from public.profiles where id = user_id) then
    return;
  end if;

  if wanted ~ '^[A-Za-z0-9_]{3,24}$'
     and not exists (
       select 1 from public.profiles where lower(username) = lower(wanted)
     ) then
    final_username := wanted;
  else
    final_username := public.fallback_username(user_id);
  end if;

  final_display := btrim(coalesce(meta ->> 'display_name', ''));
  if char_length(final_display) not between 1 and 40 then
    final_display := final_username;
  end if;

  if final_bio is not null then
    final_bio := left(final_bio, 160);
  end if;

  if hue_text ~ '^\d{1,3}$' and hue_text::integer between 0 and 360 then
    final_hue := hue_text::smallint;
  end if;

  begin
    insert into public.profiles
      (id, username, display_name, bio, avatar_hue, onboarding_complete)
    values
      (user_id, final_username, final_display, final_bio, final_hue, final_onboarding);
  exception when unique_violation then
    -- Gleichzeitige Registrierung mit demselben Namen: Ersatzname nehmen,
    -- damit die Registrierung nicht an der Profiltabelle scheitert.
    insert into public.profiles
      (id, username, display_name, bio, avatar_hue, onboarding_complete)
    values
      (user_id, public.fallback_username(user_id), final_display, final_bio,
       final_hue, final_onboarding)
    on conflict (id) do nothing;
  end;
end;
$$;

-- Nur der Trigger und diese Migration rufen die Funktion auf, nicht die API.
revoke execute on function public.create_profile_from_metadata(uuid, jsonb)
  from public, anon, authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.create_profile_from_metadata(new.id, new.raw_user_meta_data);
  return new;
end;
$$;

revoke execute on function public.handle_new_user()
  from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Nutzername vor der Registrierung prüfen
-- ---------------------------------------------------------------------------

create function public.username_available(name text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(name, '') ~ '^[A-Za-z0-9_]{3,24}$'
    and not exists (
      select 1 from public.profiles where lower(username) = lower(name)
    );
$$;

grant execute on function public.username_available(text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Bereits registrierte Konten übernehmen (einmalig, in Anmeldereihenfolge)
-- ---------------------------------------------------------------------------

do $$
declare
  account record;
begin
  for account in
    select id, raw_user_meta_data
    from auth.users
    order by created_at
  loop
    perform public.create_profile_from_metadata(
      account.id,
      coalesce(account.raw_user_meta_data, '{}'::jsonb)
    );
  end loop;
end;
$$;
