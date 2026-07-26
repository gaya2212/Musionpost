import Link from 'next/link';
import { RiUserStarLine, RiBriefcaseLine, RiCheckboxCircleLine } from '@remixicon/react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STAGE_LABELS, STAGE_COLORS, type Stage } from '@/lib/workflow/stages';
import { proTypeLabels } from '@/lib/validation/pro';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { MatchDecisionActions } from '@/components/match/MatchDecisionActions';
import type { Profile } from '@/lib/auth/guards';
import type { MatchReasoning } from '@/lib/matching/scoring';

export async function ProDashboard({ profile }: { profile: Profile }) {
  const supabase = await createServerSupabaseClient();

  const { data: proProfile } = await supabase
    .from('pro_profiles')
    .select('pro_type, genres, specialties, rate_range, portfolio_urls')
    .eq('profile_id', profile.id)
    .maybeSingle();

  const completionItems = [
    { label: 'Profile photo', done: Boolean(profile.avatar_url) },
    { label: 'Bio', done: Boolean(profile.bio) },
    { label: 'Location', done: Boolean(profile.location) },
    { label: 'Genres', done: Boolean(proProfile?.genres?.length) },
    { label: 'Specialties', done: Boolean(proProfile?.specialties?.length) },
    { label: 'Rate range', done: Boolean(proProfile?.rate_range) },
    { label: 'Portfolio links', done: Boolean(proProfile?.portfolio_urls?.length) },
  ];
  const completionPercent = Math.round((completionItems.filter((i) => i.done).length / completionItems.length) * 100);

  const { data: pendingMatchesData } = await supabase
    .from('matches')
    .select('id, project_id, stage, score, reasoning')
    .eq('pro_profile_id', profile.id)
    .eq('decision', 'pending')
    .order('score', { ascending: false })
    .limit(3);

  const pendingMatches = pendingMatchesData ?? [];
  const matchProjectIds = pendingMatches.map((m) => m.project_id);

  const { data: matchProjectsData } = matchProjectIds.length
    ? await supabase.from('projects').select('id, title, artist_profile_id').in('id', matchProjectIds)
    : { data: [] as { id: string; title: string; artist_profile_id: string }[] };

  const matchProjectById = new Map((matchProjectsData ?? []).map((p) => [p.id, p]));
  const matchArtistIds = Array.from(new Set((matchProjectsData ?? []).map((p) => p.artist_profile_id)));

  const { data: matchArtistsData } = matchArtistIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', matchArtistIds)
    : { data: [] as { id: string; display_name: string }[] };

  const matchArtistById = new Map((matchArtistsData ?? []).map((p) => [p.id, p]));

  const { data: collaborationsData } = await supabase
    .from('project_collaborators')
    .select('id, project_id, role, stage')
    .eq('pro_profile_id', profile.id)
    .eq('status', 'accepted');

  const collaborations = collaborationsData ?? [];
  const collabProjectIds = collaborations.map((c) => c.project_id);

  const { data: collabProjectsData } = collabProjectIds.length
    ? await supabase.from('projects').select('id, title, current_stage, artist_profile_id').in('id', collabProjectIds)
    : { data: [] as { id: string; title: string; current_stage: string; artist_profile_id: string }[] };

  const collabProjectById = new Map((collabProjectsData ?? []).map((p) => [p.id, p]));
  const collabArtistIds = Array.from(new Set((collabProjectsData ?? []).map((p) => p.artist_profile_id)));

  const { data: collabArtistsData } = collabArtistIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', collabArtistIds)
    : { data: [] as { id: string; display_name: string }[] };

  const collabArtistById = new Map((collabArtistsData ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-6">
        <div className="text-xl font-bold text-app-fg-1">Dashboard</div>
        <div className="mt-0.5 text-[13px] text-app-fg-2">
          Good to see you, {profile.display_name.split(' ')[0]}. Here&apos;s your overview.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Pending match invites</span>
              <Link href="/matches" className="text-[12px] font-semibold text-app-primary hover:underline">
                See all
              </Link>
            </div>
            {pendingMatches.length === 0 ? (
              <div className="rounded-app-xl border border-app-border bg-app-surface p-6 text-center">
                <RiUserStarLine size={24} className="mx-auto mb-2 text-app-fg-3" />
                <p className="text-[13px] text-app-fg-2">No pending match invites right now.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pendingMatches.map((match) => {
                  const project = matchProjectById.get(match.project_id);
                  const artist = project ? matchArtistById.get(project.artist_profile_id) : undefined;
                  // The project row may not be readable yet — a pending
                  // match only proves this pro is party to the match
                  // itself, not that they've been accepted onto a private
                  // project. The title captured at generation time (when
                  // the engine had full access) covers that gap.
                  const reasoning = match.reasoning as unknown as MatchReasoning | null;
                  const title = project?.title ?? reasoning?.project_title ?? 'A project';
                  return (
                    <div key={match.id} className="rounded-app-xl border border-app-border bg-app-surface p-4">
                      <div className="mb-3 flex items-center gap-2.5">
                        {artist ? <Avatar name={artist.display_name} size="sm" /> : null}
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold text-app-fg-1">{title}</div>
                          <div className="text-[11px] text-app-fg-2">
                            {artist ? `${artist.display_name} · ` : ''}
                            {STAGE_LABELS[match.stage as Stage]} · {Math.round(match.score * 100)}% match
                          </div>
                        </div>
                      </div>
                      <MatchDecisionActions matchId={match.id} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Active collaborations</div>
            {collaborations.length === 0 ? (
              <div className="rounded-app-xl border border-app-border bg-app-surface p-6 text-center">
                <RiBriefcaseLine size={24} className="mx-auto mb-2 text-app-fg-3" />
                <p className="text-[13px] text-app-fg-2">
                  No active collaborations yet. Accept a match invite or browse{' '}
                  <Link href="/discover" className="font-semibold text-app-primary hover:underline">
                    Discover
                  </Link>{' '}
                  to get noticed.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {collaborations.map((collab) => {
                  const project = collabProjectById.get(collab.project_id);
                  if (!project) return null;
                  const artist = collabArtistById.get(project.artist_profile_id);
                  const stage = project.current_stage as Stage;
                  return (
                    <Link
                      key={collab.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between gap-3 rounded-app-xl border border-app-border bg-app-surface p-4 shadow-app-sm transition hover:border-app-primary"
                    >
                      <div>
                        <div className="text-sm font-semibold text-app-fg-1">{project.title}</div>
                        <div className="mt-0.5 text-[12px] text-app-fg-2">
                          {artist ? `${artist.display_name} · ` : ''}
                          {collab.role}
                        </div>
                      </div>
                      <span
                        className="shrink-0 rounded-app-pill px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: `${STAGE_COLORS[stage]}18`, color: STAGE_COLORS[stage] }}
                      >
                        {STAGE_LABELS[stage]}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Profile completion</div>
          <div className="rounded-app-xl border border-app-border bg-app-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-2xl font-bold text-app-fg-1">{completionPercent}%</span>
              {proProfile ? <Badge tone={proProfile ? 'blue' : 'gray'}>{proTypeLabels[proProfile.pro_type as keyof typeof proTypeLabels]}</Badge> : null}
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-app-pill bg-app-surface-2">
              <div className="h-full rounded-app-pill bg-app-primary transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            <ul className="space-y-2">
              {completionItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[13px]">
                  <RiCheckboxCircleLine size={16} className={item.done ? 'text-app-green' : 'text-app-fg-3'} />
                  <span className={item.done ? 'text-app-fg-1' : 'text-app-fg-2'}>{item.label}</span>
                </li>
              ))}
            </ul>
            {completionPercent < 100 ? (
              <Link href="/settings" className="mt-4 inline-block text-[12px] font-semibold text-app-primary hover:underline">
                Complete your profile →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
