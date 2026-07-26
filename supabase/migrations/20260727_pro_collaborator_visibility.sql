-- Two things in one file:
--
-- 1. Re-asserts the projects/project_stages/project_collaborators and
--    message_threads/thread_participants/messages RLS fixes from
--    20260706_fix_projects_rls_recursion.sql and
--    20260726_fix_messaging_rls_recursion.sql. Live-testing after those
--    were reportedly run still shows "infinite recursion detected in
--    policy for relation projects/project_collaborators/thread_participants"
--    on all four tables — so whatever ran didn't take. This is safe to
--    run again regardless (idempotent drop-if-exists + create), and
--    doesn't depend on which of the two theories is right (partial run,
--    wrong project, etc).
--
-- 2. Adds RLS gaps found while building the pro-facing dashboard: a pro
--    who is an ACCEPTED collaborator on a project could not read that
--    project, its stages, or their own incoming match invites — the
--    existing policies only ever considered the artist (owner) or public
--    visibility, never collaborator status. Without this, "projects a pro
--    is an accepted collaborator on" and "incoming match invites for a
--    pro" are both permanently empty regardless of what the UI queries.
--
-- Run this in the Supabase SQL editor.

-- ------------------- projects -------------------
drop policy if exists "projects: read own and public" on public.projects;
drop policy if exists "projects: manage own" on public.projects;

create policy "projects: read own and public"
  on public.projects for select
  using (
    artist_profile_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = projects.artist_profile_id
      and p.visibility = 'public'
    )
    or exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = projects.id
      and pc.pro_profile_id = auth.uid()
      and pc.status = 'accepted'
    )
  );

create policy "projects: manage own"
  on public.projects for all
  using (artist_profile_id = auth.uid())
  with check (artist_profile_id = auth.uid());

-- ------------------- project_stages -------------------
drop policy if exists "project_stages: read project participants" on public.project_stages;
drop policy if exists "project_stages: manage own" on public.project_stages;

create policy "project_stages: read project participants"
  on public.project_stages for select
  using (
    exists (
      select 1 from public.projects p
      join public.profiles artist on artist.id = p.artist_profile_id
      where p.id = project_stages.project_id
      and (artist.id = auth.uid() or artist.visibility = 'public')
    )
    or exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = project_stages.project_id
      and pc.pro_profile_id = auth.uid()
      and pc.status = 'accepted'
    )
  );

create policy "project_stages: manage own"
  on public.project_stages for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_stages.project_id
      and p.artist_profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_stages.project_id
      and p.artist_profile_id = auth.uid()
    )
  );

-- ------------------- project_collaborators -------------------
drop policy if exists "project_collaborators: read own or project owner" on public.project_collaborators;
drop policy if exists "project_collaborators: manage own" on public.project_collaborators;

create policy "project_collaborators: read own or project owner"
  on public.project_collaborators for select
  using (
    pro_profile_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_collaborators.project_id
      and p.artist_profile_id = auth.uid()
    )
  );

create policy "project_collaborators: manage own"
  on public.project_collaborators for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_collaborators.project_id
      and p.artist_profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_collaborators.project_id
      and p.artist_profile_id = auth.uid()
    )
  );

-- ------------------- matches -------------------
drop policy if exists "matches: read own" on public.matches;
drop policy if exists "matches: manage own" on public.matches;

create policy "matches: read own"
  on public.matches for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = matches.project_id
      and p.artist_profile_id = auth.uid()
    )
    or matches.pro_profile_id = auth.uid()
  );

create policy "matches: manage own"
  on public.matches for all
  using (exists (
    select 1 from public.projects p
    where p.id = matches.project_id
    and p.artist_profile_id = auth.uid()
  ));

-- ------------------- message_threads -------------------
drop policy if exists "message_threads: read participant" on public.message_threads;
drop policy if exists "message_threads: manage participant" on public.message_threads;

create policy "message_threads: read participant"
  on public.message_threads for select
  using (exists (
    select 1 from public.thread_participants tp
    where tp.thread_id = message_threads.id
    and tp.profile_id = auth.uid()
  ));

create policy "message_threads: manage participant"
  on public.message_threads for all
  using (exists (
    select 1 from public.thread_participants tp
    where tp.thread_id = message_threads.id
    and tp.profile_id = auth.uid()
  ));

-- ------------------- thread_participants -------------------
drop policy if exists "thread_participants: read own" on public.thread_participants;
drop policy if exists "thread_participants: manage own" on public.thread_participants;

create policy "thread_participants: read own"
  on public.thread_participants for select
  using (profile_id = auth.uid());

create policy "thread_participants: manage own"
  on public.thread_participants for all
  using (profile_id = auth.uid());

-- ------------------- messages -------------------
drop policy if exists "messages: read thread participant" on public.messages;
drop policy if exists "messages: insert own" on public.messages;
drop policy if exists "messages: update own" on public.messages;

create policy "messages: read thread participant"
  on public.messages for select
  using (exists (
    select 1 from public.thread_participants tp
    where tp.thread_id = messages.thread_id
    and tp.profile_id = auth.uid()
  ));

create policy "messages: insert own"
  on public.messages for insert
  with check (sender_profile_id = auth.uid());

create policy "messages: update own"
  on public.messages for update
  using (sender_profile_id = auth.uid());
