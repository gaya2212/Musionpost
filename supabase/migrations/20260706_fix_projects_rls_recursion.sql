-- Fixes "infinite recursion detected in policy for relation ..." on
-- projects / project_stages / project_collaborators.
--
-- projects.artist_profile_id already equals auth.uid() for the owner, so
-- the "manage own" policy never needs to look at profiles at all. The
-- public-read policy only needs profiles for the *other people's public
-- project* case, so the owner path short-circuits before ever touching it.
--
-- This also restores project_stages/project_collaborators to a strictly
-- one-directional dependency on projects (never the reverse), which is
-- what schema.sql already documents. Run this in the Supabase SQL editor.

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
