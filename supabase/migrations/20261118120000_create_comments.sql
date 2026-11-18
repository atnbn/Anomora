-- Kommentartabelle für ANIMORA (Schritt 4). Spezifikation: docs/specs/comments.md
--
-- Kommentare und Antworten unter echten Beiträgen und in Episodendiskussionen.
-- Die Datenbank prüft dieselben Regeln wie src/lib/validation/comments.ts und
-- schützt die Daten mit Row Level Security. Diese Migration legt nur an und
-- löscht nichts.

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  -- Ziel Beitrag …
  post_id uuid references public.posts (id) on delete cascade,
  -- … oder Ziel Episode (Anime + Folgennummer, unabhängig vom Titel im Slug).
  anime_id text,
  episode_number integer,
  -- Eine Antwortebene; Antworten verschwinden mit ihrem Kommentar.
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null,
  contains_spoiler boolean not null default false,
  created_at timestamptz not null default now(),
  constraint comments_body_length
    check (
      body = btrim(body, E' \t\r\n')
      and char_length(body) between 2 and 600
    ),
  constraint comments_anime_id_format
    check (anime_id is null or anime_id ~ '^(a-[a-z0-9-]{1,60}|anilist-[0-9]{1,10})$'),
  constraint comments_episode_number_range
    check (episode_number is null or episode_number between 1 and 10000),
  constraint comments_one_target
    check (
      (post_id is not null and anime_id is null and episode_number is null)
      or (post_id is null and anime_id is not null and episode_number is not null)
    )
);

comment on table public.comments is
  'Kommentare und Antworten zu Beiträgen oder Episoden. Likes und Moderation folgen in eigenen Schritten.';

create index comments_post_created_at_idx
  on public.comments (post_id, created_at)
  where post_id is not null;
create index comments_episode_created_at_idx
  on public.comments (anime_id, episode_number, created_at)
  where anime_id is not null;
create index comments_parent_idx
  on public.comments (parent_id)
  where parent_id is not null;
create index comments_author_idx
  on public.comments (author_id);

-- ---------------------------------------------------------------------------
-- Antworten prüfen: nur auf Wurzelkommentare und mit demselben Ziel
-- ---------------------------------------------------------------------------

create function public.check_comment_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent public.comments%rowtype;
begin
  if new.parent_id is null then
    return new;
  end if;

  select * into parent from public.comments where id = new.parent_id;
  if not found then
    raise exception 'Der Kommentar, auf den geantwortet wird, existiert nicht.'
      using errcode = '23503';
  end if;
  if parent.parent_id is not null then
    raise exception 'Antworten auf Antworten sind nicht erlaubt.'
      using errcode = '23514';
  end if;
  if parent.post_id is distinct from new.post_id
     or parent.anime_id is distinct from new.anime_id
     or parent.episode_number is distinct from new.episode_number then
    raise exception 'Eine Antwort muss dasselbe Ziel haben wie ihr Kommentar.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Kommentare lassen sich nicht ändern, deshalb reicht die Prüfung beim Anlegen.
create trigger comments_check_parent
  before insert on public.comments
  for each row execute function public.check_comment_parent();

-- ---------------------------------------------------------------------------
-- Zugriffsregeln (RLS) und Spaltenrechte
-- ---------------------------------------------------------------------------

alter table public.comments enable row level security;

create policy "Kommentare sind öffentlich lesbar"
  on public.comments
  for select
  to anon, authenticated
  using (true);

create policy "Nutzer kommentieren nur im eigenen Namen"
  on public.comments
  for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Nutzer löschen nur eigene Kommentare"
  on public.comments
  for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- Keine Update-Regel: Kommentare können nicht bearbeitet werden.
-- ID, Autor und Zeitstempel setzt nur die Datenbank.
revoke all on table public.comments from anon, authenticated;
grant select on table public.comments to anon, authenticated;
grant insert (post_id, anime_id, episode_number, parent_id, body, contains_spoiler)
  on table public.comments to authenticated;
grant delete on table public.comments to authenticated;

-- ---------------------------------------------------------------------------
-- Kommentarzahlen für Feed, Episodenliste und Dashboard
-- ---------------------------------------------------------------------------

-- security invoker: Es gelten dieselben Leserechte (RLS) wie bei der Tabelle.
create function public.post_comment_counts(post_ids uuid[])
returns table (post_id uuid, comment_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.post_id, count(*)
  from public.comments c
  where c.post_id = any (post_ids)
  group by c.post_id;
$$;

create function public.episode_comment_counts(anime_ids text[])
returns table (anime_id text, episode_number integer, comment_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.anime_id, c.episode_number, count(*)
  from public.comments c
  where c.anime_id = any (anime_ids)
  group by c.anime_id, c.episode_number;
$$;

grant execute on function public.post_comment_counts(uuid[])
  to anon, authenticated;
grant execute on function public.episode_comment_counts(text[])
  to anon, authenticated;
