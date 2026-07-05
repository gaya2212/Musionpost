-- ============================================================================
-- Musion MVP Initial Schema
-- Version: 0.1
-- Target: Supabase Postgres 15 with pgvector
-- ============================================================================
-- Run this file against a fresh Supabase project. It creates all core tables,
-- enums, RLS policies, indexes, and triggers for the MVP.
--
-- After running, generate types with:
--   supabase gen types typescript --project-id <your-project> > lib/supabase/types.ts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role as enum ('artist', 'pro', 'both');

create type pro_type as enum (
  'producer',
  'engineer_mix',
  'engineer_master',
  'studio',
  'session_musician',
  'vocal_coach',
  'marketing',
  'pr',
  'designer',
  'distribution'
);

create type budget_range as enum (
  'under_500',
  '500_2k',
  '2k_10k',
  '10k_plus'
);

create type artist_stage as enum (
  'first_release',
  'building_catalog',
  'established'
);

create type availability_status as enum ('open', 'limited', 'closed');

create type verified_status as enum ('unverified', 'witnessed', 'documented');

create type workflow_stage as enum (
  'ideation',
  'recording',
  'mixing_mastering',
  'promotion_design',
  'distribution',
  'community'
);

create type project_status as enum ('active', 'paused', 'completed', 'archived');

create type project_visibility as enum ('private', 'team_only', 'public');

create type project_stage_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'skipped'
);

create type collaborator_status as enum (
  'invited',
  'accepted',
  'declined',
  'completed',
  'removed'
);

create type match_decision as enum ('pending', 'accepted', 'rejected', 'saved');

create type credential_tier as enum ('witnessed', 'documented');

create type credential_status as enum ('draft', 'issued', 'revoked');

create type credits_export_status as enum ('pending', 'exported', 'failed');

-- ----------------------------------------------------------------------------
-- profiles: extends auth.users with app-level data
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'artist',
  display_name text not null,
  slug text unique,
  avatar_url text,
  bio text,
  location text,
  timezone text,
  onboarding_complete boolean not null default false,
  visibility project_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_slug_idx on public.profiles(slug);

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'New user'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- artist_profiles
-- ----------------------------------------------------------------------------
create table public.artist_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  primary_genres text[] not null default '{}',
  secondary_genres text[] not null default '{}',
  influences text,
  project_goals text,
  budget_range budget_range,
  stage artist_stage,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index artist_profiles_embedding_idx on public.artist_profiles
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index artist_profiles_genres_idx on public.artist_profiles using gin(primary_genres);

-- ----------------------------------------------------------------------------
-- pro_profiles
-- ----------------------------------------------------------------------------
create table public.pro_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  pro_type pro_type not null,
  specialties text[] not null default '{}',
  genres text[] not null default '{}',
  notable_credits jsonb not null default '[]',
  rate_range budget_range,
  availability_status availability_status not null default 'open',
  portfolio_urls text[] not null default '{}',
  remote_ok boolean not null default true,
  verified_status verified_status not null default 'unverified',
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pro_profiles_pro_type_idx on public.pro_profiles(pro_type);
create index pro_profiles_availability_idx on public.pro_profiles(availability_status);
create index pro_profiles_verified_idx on public.pro_profiles(verified_status);
create index pro_profiles_embedding_idx on public.pro_profiles
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index pro_profiles_genres_idx on public.pro_profiles using gin(genres);
create index pro_profiles_specialties_idx on public.pro_profiles using gin(specialties);

-- ----------------------------------------------------------------------------
-- waitlist_entries: public form, no auth required to submit
-- ----------------------------------------------------------------------------
create table public.waitlist_entries (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role_interest user_role,
  location text,
  referrer text,
  metadata jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  unique(email)
);

create index waitlist_entries_email_idx on public.waitlist_entries(email);

-- ----------------------------------------------------------------------------
-- projects
-- ----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  artist_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  working_title text,
  description text,
  current_stage workflow_stage not null default 'ideation',
  stage_started_at timestamptz not null default now(),
  target_completion_date date,
  status project_status not null default 'active',
  visibility project_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_artist_idx on public.projects(artist_profile_id);
create index projects_stage_idx on public.projects(current_stage);
create index projects_status_idx on public.projects(status);

-- ----------------------------------------------------------------------------
-- project_stages: per-stage state and artifacts
-- ----------------------------------------------------------------------------
create table public.project_stages (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage workflow_stage not null,
  status project_stage_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  artifacts jsonb not null default '{}',
  notes text,
  unique(project_id, stage)
);

create index project_stages_project_idx on public.project_stages(project_id);

-- ----------------------------------------------------------------------------
-- project_collaborators
-- ----------------------------------------------------------------------------
create table public.project_collaborators (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  pro_profile_id uuid not null references public.profiles(id) on delete cascade,
  stage workflow_stage not null,
  role text not null,
  status collaborator_status not null default 'invited',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  contribution_notes text,
  unique(project_id, pro_profile_id, stage)
);

create index collaborators_project_idx on public.project_collaborators(project_id);
create index collaborators_pro_idx on public.project_collaborators(pro_profile_id);
create index collaborators_status_idx on public.project_collaborators(status);

-- ----------------------------------------------------------------------------
-- matches: AI-generated match suggestions
-- ----------------------------------------------------------------------------
create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage workflow_stage not null,
  pro_profile_id uuid not null references public.profiles(id) on delete cascade,
  score float not null,
  reasoning jsonb not null default '{}',
  decision match_decision not null default 'pending',
  shown_at timestamptz not null default now(),
  decided_at timestamptz,
  feedback text
);

create index matches_project_idx on public.matches(project_id);
create index matches_pro_idx on public.matches(pro_profile_id);
create index matches_decision_idx on public.matches(decision);
create index matches_project_stage_idx on public.matches(project_id, stage);

-- ----------------------------------------------------------------------------
-- message_threads & messages
-- ----------------------------------------------------------------------------
create table public.message_threads (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table public.thread_participants (
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (thread_id, profile_id)
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_thread_idx on public.messages(thread_id);
create index messages_created_idx on public.messages(created_at desc);

-- ----------------------------------------------------------------------------
-- verified_credentials: Musion Verified (integration stubbed)
-- ----------------------------------------------------------------------------
create table public.verified_credentials (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tier credential_tier not null,
  status credential_status not null default 'draft',
  contributors jsonb not null default '[]',
  issued_at timestamptz,
  issuer_signature text,
  c2pa_manifest_url text,
  created_at timestamptz not null default now()
);

create index credentials_project_idx on public.verified_credentials(project_id);

-- ----------------------------------------------------------------------------
-- credits_export: Credits.fm export queue (integration stubbed)
-- ----------------------------------------------------------------------------
create table public.credits_export (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  isrc text,
  iswc text,
  payload jsonb not null,
  status credits_export_status not null default 'pending',
  exported_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index credits_export_status_idx on public.credits_export(status);
create index credits_export_project_idx on public.credits_export(project_id);

-- ============================================================================
-- Row Level Security
-- Every table gets RLS. Nothing is public by default.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.pro_profiles enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.projects enable row level security;
alter table public.project_stages enable row level security;
alter table public.project_collaborators enable row level security;
alter table public.matches enable row level security;
alter table public.message_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.verified_credentials enable row level security;
alter table public.credits_export enable row level security;

-- ------------------- profiles -------------------
create policy "profiles: public profiles are readable by anyone"
  on public.profiles for select
  using (visibility = 'public');

create policy "profiles: own profile always readable"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ------------------- artist_profiles -------------------
create policy "artist_profiles: readable if parent is readable"
  on public.artist_profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = artist_profiles.profile_id
      and (p.visibility = 'public' or p.id = auth.uid())
    )
  );

create policy "artist_profiles: manage own"
  on public.artist_profiles for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ------------------- pro_profiles -------------------
create policy "pro_profiles: readable if parent is readable"
  on public.pro_profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = pro_profiles.profile_id
      and (p.visibility = 'public' or p.id = auth.uid())
    )
  );

create policy "pro_profiles: manage own"
  on public.pro_profiles for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ------------------- waitlist_entries -------------------
-- Public insert, no read for regular users (service role bypasses RLS)
create policy "waitlist_entries: insert public"
  on public.waitlist_entries for insert
  with check (true);

create policy "waitlist_entries: no read"
  on public.waitlist_entries for select
  using (false);

-- ------------------- projects -------------------
create policy "projects: read own and public"
  on public.projects for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = projects.artist_profile_id
      and (p.visibility = 'public' or p.id = auth.uid())
    )
  );

create policy "projects: manage own"
  on public.projects for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = projects.artist_profile_id
      and p.id = auth.uid()
    )
  );

-- ------------------- project_stages -------------------
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
      join public.profiles artist on artist.id = p.artist_profile_id
      where p.id = project_stages.project_id
      and artist.id = auth.uid()
    )
  );

-- ------------------- project_collaborators -------------------
create policy "project_collaborators: read own or project owner"
  on public.project_collaborators for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_collaborators.project_id
      and (p.artist_profile_id = auth.uid() or project_collaborators.pro_profile_id = auth.uid())
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
  );

-- ------------------- matches -------------------
create policy "matches: read own"
  on public.matches for select
  using (exists (
    select 1 from public.projects p
    where p.id = matches.project_id
    and p.artist_profile_id = auth.uid()
  ));

create policy "matches: manage own"
  on public.matches for all
  using (exists (
    select 1 from public.projects p
    where p.id = matches.project_id
    and p.artist_profile_id = auth.uid()
  ));

-- ------------------- message_threads -------------------
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
create policy "thread_participants: read own"
  on public.thread_participants for select
  using (profile_id = auth.uid());

create policy "thread_participants: manage own"
  on public.thread_participants for all
  using (profile_id = auth.uid());

-- ------------------- messages -------------------
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

-- ------------------- verified_credentials -------------------
create policy "verified_credentials: read own"
  on public.verified_credentials for select
  using (exists (
    select 1 from public.projects p
    where p.id = verified_credentials.project_id
    and p.artist_profile_id = auth.uid()
  ));

create policy "verified_credentials: manage own"
  on public.verified_credentials for all
  using (exists (
    select 1 from public.projects p
    where p.id = verified_credentials.project_id
    and p.artist_profile_id = auth.uid()
  ));

-- ------------------- credits_export -------------------
create policy "credits_export: read own"
  on public.credits_export for select
  using (exists (
    select 1 from public.projects p
    where p.id = credits_export.project_id
    and p.artist_profile_id = auth.uid()
  ));

create policy "credits_export: manage own"
  on public.credits_export for all
  using (exists (
    select 1 from public.projects p
    where p.id = credits_export.project_id
    and p.artist_profile_id = auth.uid()
  ));
