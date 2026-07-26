-- Fixes "infinite recursion detected in policy for relation
-- thread_participants" hit when inserting/reading messages. The policies
-- in schema.sql for message_threads / thread_participants / messages are
-- already correct and non-recursive — this was found by live-testing a
-- real message send, which failed even though the tables' current policy
-- text (below) has no cycle. That means the live database has an older,
-- buggy version of these policies deployed that predates the current
-- schema.sql, the same root cause as the projects/project_collaborators
-- recursion fixed in 20260706_fix_projects_rls_recursion.sql. This
-- reasserts the known-good definitions regardless of whatever's currently
-- live. Run this in the Supabase SQL editor.

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
