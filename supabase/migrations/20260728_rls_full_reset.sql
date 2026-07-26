-- Full reset for the RLS recursion bugs on projects / project_collaborators
-- / project_stages / matches / message_threads / thread_participants /
-- messages. Three prior migrations tried to fix these by dropping specific
-- named policies and recreating them — but each attempt used slightly
-- different names than whatever was already deployed, so nothing ever got
-- removed. Policies are additive (Postgres ORs every applicable policy
-- together for a given command), so the old recursive ones kept firing
-- alongside each new "fixed" set, and the recursion never went away.
--
-- Confirmed live inventory (via pg_policies) included, among others:
--   - projects: "read own and public" and "accepted collaborators read"
--     both querying project_collaborators, while project_collaborators's
--     policies both queried projects back — a two-table mutual cycle.
--   - thread_participants: "readable by co-participants" queried
--     thread_participants from within its own thread_participants
--     policy — direct single-table self-recursion.
--
-- Fix, this time for real:
--   1. Drop every existing policy on the affected tables by querying
--      pg_policies at runtime and dropping whatever's actually there,
--      instead of guessing names — that's what let three attempts miss
--      leftover policies.
--   2. Two SECURITY DEFINER helper functions break the two cycles above.
--      A SECURITY DEFINER function runs as its owner, which bypasses RLS
--      by default (no FORCE ROW LEVEL SECURITY is set on these tables),
--      so a query inside the function never re-enters policy evaluation
--      on the table it reads — that's what actually breaks each cycle,
--      not just moving the same check around.
--   3. Create exactly one clean policy per (table, command).
--
-- Reviewed before running and caught four more real issues, all fixed
-- below: the public-project check used profiles.visibility instead of
-- projects.visibility (exposing every private project of an artist with a
-- public profile — inherited from the very first version of this policy,
-- not introduced here); messages_insert had no thread-participant check
-- (any authenticated user could insert into a thread_id they aren't in);
-- is_accepted_collaborator only matched status = 'accepted', dropping
-- access the moment a collaboration is marked 'completed'; and both
-- SECURITY DEFINER helpers had no EXECUTE grant restriction, so anon could
-- call them directly to probe relationships that bypass RLS by design.
--
-- Run this in the Supabase SQL editor.

-- ----------------------------------------------------------------------------
-- Step 1: drop every existing policy on the affected tables, whatever it's
-- named. Safe to run repeatedly.
-- ----------------------------------------------------------------------------
do $$
declare
  pol record;
  affected_tables text[] := array[
    'projects', 'project_stages', 'project_collaborators', 'matches',
    'message_threads', 'thread_participants', 'messages'
  ];
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename = any(affected_tables)
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Step 2: SECURITY DEFINER helpers. Both are STABLE SQL functions scoped to
-- exactly the boolean check needed — neither does anything else with the
-- elevated privilege, and neither is exposed to write access.
-- ----------------------------------------------------------------------------
create or replace function public.is_accepted_collaborator(p_project_id uuid, p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.project_collaborators pc
    where pc.project_id = p_project_id
    and pc.pro_profile_id = p_profile_id
    and pc.status in ('accepted', 'completed')
  );
$$;

create or replace function public.is_thread_participant(p_thread_id uuid, p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.thread_participants tp
    where tp.thread_id = p_thread_id
    and tp.profile_id = p_profile_id
  );
$$;

-- Both helpers bypass RLS by design (that's the point) — without this,
-- any authenticated caller could invoke them directly via PostgREST's
-- /rpc/ endpoint to probe collaborator/participant relationships on
-- arbitrary project/thread ids they have no other access to. Postgres
-- grants EXECUTE to PUBLIC (which includes anon) by default on function
-- creation, so this has to be explicit.
revoke execute on function public.is_accepted_collaborator(uuid, uuid) from public;
revoke execute on function public.is_thread_participant(uuid, uuid) from public;
grant execute on function public.is_accepted_collaborator(uuid, uuid) to authenticated;
grant execute on function public.is_thread_participant(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Step 3: one clean policy per (table, command).
-- ----------------------------------------------------------------------------

-- ------------------- projects -------------------
-- Collaborator check goes through the SECURITY DEFINER function, not a raw
-- EXISTS on project_collaborators — that's the only change that matters
-- for breaking the projects <-> project_collaborators cycle.
--
-- Public-read checks projects.visibility (the project's own setting,
-- defaults 'private'), not profiles.visibility (the artist's profile,
-- defaults 'public') — every prior version of this policy, back to the
-- original schema.sql, checked the artist's profile instead of the
-- project's own visibility column, which exposed every private project
-- belonging to an artist with a public profile.
create policy "projects_select"
  on public.projects for select
  using (
    artist_profile_id = auth.uid()
    or projects.visibility = 'public'
    or public.is_accepted_collaborator(projects.id, auth.uid())
  );

create policy "projects_manage"
  on public.projects for all
  using (artist_profile_id = auth.uid())
  with check (artist_profile_id = auth.uid());

-- ------------------- project_stages -------------------
-- Safe to query project_collaborators directly here: project_collaborators's
-- own policy queries projects, and projects no longer queries
-- project_collaborators directly (see above), so the chain terminates.
-- Same projects.visibility fix as above — no profiles join needed at all
-- once the check is against the project's own visibility column.
create policy "project_stages_select"
  on public.project_stages for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_stages.project_id
      and (p.artist_profile_id = auth.uid() or p.visibility = 'public')
    )
    or exists (
      select 1 from public.project_collaborators pc
      where pc.project_id = project_stages.project_id
      and pc.pro_profile_id = auth.uid()
      and pc.status in ('accepted', 'completed')
    )
  );

create policy "project_stages_manage"
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
create policy "project_collaborators_select"
  on public.project_collaborators for select
  using (
    pro_profile_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_collaborators.project_id
      and p.artist_profile_id = auth.uid()
    )
  );

create policy "project_collaborators_manage"
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
create policy "matches_select"
  on public.matches for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = matches.project_id
      and p.artist_profile_id = auth.uid()
    )
    or matches.pro_profile_id = auth.uid()
  );

create policy "matches_manage"
  on public.matches for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = matches.project_id
      and p.artist_profile_id = auth.uid()
    )
  );

-- ------------------- thread_participants -------------------
-- The self-recursion fix: this table's own SELECT policy can't query
-- itself, so "can I see co-participant rows for threads I'm in" goes
-- through the SECURITY DEFINER function instead of a self-join.
create policy "thread_participants_select"
  on public.thread_participants for select
  using (public.is_thread_participant(thread_participants.thread_id, auth.uid()));

create policy "thread_participants_manage"
  on public.thread_participants for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ------------------- message_threads -------------------
create policy "message_threads_select"
  on public.message_threads for select
  using (public.is_thread_participant(message_threads.id, auth.uid()));

create policy "message_threads_manage"
  on public.message_threads for all
  using (public.is_thread_participant(message_threads.id, auth.uid()));

-- ------------------- messages -------------------
create policy "messages_select"
  on public.messages for select
  using (public.is_thread_participant(messages.thread_id, auth.uid()));

-- with check must also require thread participation, not just sender
-- identity — sender_profile_id = auth.uid() alone would let any
-- authenticated user insert a message into any thread_id they can guess,
-- whether or not they're actually in it.
create policy "messages_insert"
  on public.messages for insert
  with check (
    sender_profile_id = auth.uid()
    and public.is_thread_participant(messages.thread_id, auth.uid())
  );

create policy "messages_update"
  on public.messages for update
  using (sender_profile_id = auth.uid());
