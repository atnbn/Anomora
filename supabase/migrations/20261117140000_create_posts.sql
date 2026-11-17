-- Beitragstabelle für ANIMORA (Schritt 3). Spezifikation: docs/specs/posts.md
--
-- Beiträge von Supabase-Konten ziehen aus dem Browser in eine Tabelle.
-- Die Datenbank prüft dieselben Regeln wie src/lib/validation/posts.ts und
-- schützt die Daten mit Row Level Security. Diese Migration legt nur an und
-- löscht nichts.

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  body text not null,
  category text not null default 'discussion',
  anime_id text,
  contains_spoiler boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint posts_body_length
    check (
      body = btrim(body, E' \t\r\n')
      and char_length(body) between 3 and 1000
    ),
  constraint posts_category_valid
    check (category in ('discussion', 'fanart', 'cosplay', 'news', 'collection')),
  -- Kuratierte Anime (a-one-piece) oder AniList-Ergebnisse (anilist-21).
  -- Kein Fremdschlüssel: Anime liegen nicht in der Datenbank.
  constraint posts_anime_id_format
    check (anime_id is null or anime_id ~ '^(a-[a-z0-9-]{1,60}|anilist-[0-9]{1,10})$')
);

comment on table public.posts is
  'Community-Beiträge von Supabase-Konten. Bilder, Likes und Kommentare folgen in eigenen Schritten.';

-- Feed, Profilseiten und Anime-Seiten lesen jeweils die neuesten Beiträge.
create index posts_created_at_idx
  on public.posts (created_at desc);
create index posts_author_created_at_idx
  on public.posts (author_id, created_at desc);
create index posts_anime_created_at_idx
  on public.posts (anime_id, created_at desc)
  where anime_id is not null;

-- ---------------------------------------------------------------------------
-- edited_at setzen, wenn sich Text oder Spoiler-Hinweis ändert
-- ---------------------------------------------------------------------------

create function public.set_post_edited_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body
     or new.contains_spoiler is distinct from old.contains_spoiler then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger posts_set_edited_at
  before update on public.posts
  for each row execute function public.set_post_edited_at();

-- ---------------------------------------------------------------------------
-- Zugriffsregeln (RLS) und Spaltenrechte
-- ---------------------------------------------------------------------------

alter table public.posts enable row level security;

create policy "Beiträge sind öffentlich lesbar"
  on public.posts
  for select
  to anon, authenticated
  using (true);

create policy "Nutzer erstellen Beiträge nur im eigenen Namen"
  on public.posts
  for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Nutzer ändern nur eigene Beiträge"
  on public.posts
  for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Nutzer löschen nur eigene Beiträge"
  on public.posts
  for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- author_id füllt die Datenbank selbst (auth.uid()). ID, Autor und
-- Zeitstempel sind für Nutzer weder beim Anlegen noch beim Ändern setzbar.
revoke all on table public.posts from anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant insert (body, category, anime_id, contains_spoiler)
  on table public.posts to authenticated;
grant update (body, contains_spoiler)
  on table public.posts to authenticated;
grant delete on table public.posts to authenticated;
