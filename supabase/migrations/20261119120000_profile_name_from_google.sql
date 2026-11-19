-- Anzeigename aus Google übernehmen (Schritt 6). Spezifikation: docs/specs/google-login.md
--
-- Google liefert bei der Registrierung `full_name` bzw. `name`, aber weder
-- `username` noch `display_name`. Bisher bekam das Profil dann den
-- Ersatznamen `user_…` auch als Anzeigenamen. Jetzt dient der Name von Google
-- als Anzeigename; der Nutzername bleibt der Ersatzname bis zum Onboarding.
--
-- Ersetzt nur die Funktion aus 20261117120000_create_profiles.sql (gleiche
-- Signatur, Rechte bleiben erhalten). Keine Tabelle wird geändert oder gelöscht.

create or replace function public.create_profile_from_metadata(user_id uuid, meta jsonb)
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

  -- Neu: ohne display_name den Namen von Google (full_name, sonst name),
  -- auf 40 Zeichen gekürzt.
  final_display := btrim(coalesce(
    nullif(btrim(meta ->> 'display_name'), ''),
    nullif(btrim(meta ->> 'full_name'), ''),
    nullif(btrim(meta ->> 'name'), ''),
    ''
  ));
  if char_length(final_display) > 40 then
    final_display := btrim(left(final_display, 40));
  end if;
  if char_length(final_display) < 1 then
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

-- Wie bisher: nur Trigger und Migrationen rufen die Funktion auf, nicht die API.
revoke execute on function public.create_profile_from_metadata(uuid, jsonb)
  from public, anon, authenticated;
