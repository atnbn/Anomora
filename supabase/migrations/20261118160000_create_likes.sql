-- Likes und Lesezeichen für ANIMORA (Schritt 5). Spezifikation: docs/specs/likes.md
--
-- Likes auf echte Beiträge und Kommentare sowie private Lesezeichen auf
-- Beiträge. Einzelne Einträge sieht nur die eigene Person; Zahlen liefern
-- Funktionen für alle. Diese Migration legt nur an und löscht nichts.

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Jedes Konto liked einen Beitrag höchstens einmal.
  primary key (post_id, user_id)
);

create table public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

comment on table public.post_likes is
  'Likes auf Beiträge. Einzelne Likes sieht nur die eigene Person, Zahlen liefert post_like_counts.';
comment on table public.comment_likes is
  'Likes auf Kommentare. Einzelne Likes sieht nur die eigene Person, Zahlen liefert comment_like_counts.';
comment on table public.post_saves is
  'Private Lesezeichen auf Beiträge.';

-- „Meine Likes“ und „meine Lesezeichen“ laden.
create index post_likes_user_idx on public.post_likes (user_id);
create index comment_likes_user_idx on public.comment_likes (user_id);
create index post_saves_user_idx on public.post_saves (user_id);

-- ---------------------------------------------------------------------------
-- Zugriffsregeln (RLS) und Spaltenrechte
-- ---------------------------------------------------------------------------

alter table public.post_likes enable row level security;
alter table public.comment_likes enable row level security;
alter table public.post_saves enable row level security;

create policy "Nutzer sehen nur eigene Beitrags-Likes"
  on public.post_likes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Nutzer liken nur im eigenen Namen"
  on public.post_likes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Nutzer entfernen nur eigene Beitrags-Likes"
  on public.post_likes for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Nutzer sehen nur eigene Kommentar-Likes"
  on public.comment_likes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Nutzer liken Kommentare nur im eigenen Namen"
  on public.comment_likes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Nutzer entfernen nur eigene Kommentar-Likes"
  on public.comment_likes for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Nutzer sehen nur eigene Lesezeichen"
  on public.post_saves for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Nutzer speichern nur im eigenen Namen"
  on public.post_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Nutzer entfernen nur eigene Lesezeichen"
  on public.post_saves for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Ohne Anmeldung kein Zugriff auf einzelne Einträge. user_id und
-- created_at setzt nur die Datenbank; Ändern gibt es nicht.
revoke all on table public.post_likes from anon, authenticated;
revoke all on table public.comment_likes from anon, authenticated;
revoke all on table public.post_saves from anon, authenticated;

grant select, delete on table public.post_likes to authenticated;
grant insert (post_id) on table public.post_likes to authenticated;
grant select, delete on table public.comment_likes to authenticated;
grant insert (comment_id) on table public.comment_likes to authenticated;
grant select, delete on table public.post_saves to authenticated;
grant insert (post_id) on table public.post_saves to authenticated;

-- ---------------------------------------------------------------------------
-- Like-Zahlen für alle
-- ---------------------------------------------------------------------------

-- security definer: Einzelne Likes sind nur für die eigene Person lesbar,
-- die Zahlen sollen aber alle sehen. Die Funktionen liefern nur Zahlen,
-- keine Namen.
create function public.post_like_counts(post_ids uuid[])
returns table (post_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select l.post_id, count(*)
  from public.post_likes l
  where l.post_id = any (post_ids)
  group by l.post_id;
$$;

create function public.comment_like_counts(comment_ids uuid[])
returns table (comment_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select l.comment_id, count(*)
  from public.comment_likes l
  where l.comment_id = any (comment_ids)
  group by l.comment_id;
$$;

revoke execute on function public.post_like_counts(uuid[]) from public;
revoke execute on function public.comment_like_counts(uuid[]) from public;
grant execute on function public.post_like_counts(uuid[])
  to anon, authenticated;
grant execute on function public.comment_like_counts(uuid[])
  to anon, authenticated;
