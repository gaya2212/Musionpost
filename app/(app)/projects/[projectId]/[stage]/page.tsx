import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireOnboarded } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STAGES, STAGE_LABELS, STAGE_DESCRIPTIONS, STAGE_COLORS, STAGE_PROS, type Stage } from '@/lib/workflow/stages';
import type { ProjectStage } from '@/lib/workflow/state-machine';
import { proTypeLabels } from '@/lib/validation/pro';
import type { MatchReasoning } from '@/lib/matching/scoring';
import { StageTimeline } from '@/components/workflow/StageTimeline';
import { AdvanceStageAction } from '@/components/project/AdvanceStageAction';
import { StageArtifactNotes } from '@/components/project/StageArtifactNotes';
import { GenerateMatchesAction } from '@/components/match/GenerateMatchesAction';
import { MatchDecisionActions } from '@/components/match/MatchDecisionActions';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Badge } from '@/components/ui/Badge';

const collaboratorStatusTone: Record<string, 'green' | 'yellow' | 'gray' | 'red' | 'blue'> = {
  invited: 'yellow',
  accepted: 'green',
  completed: 'blue',
  declined: 'red',
  removed: 'gray',
};

export default async function ProjectStagePage({
  params,
}: {
  params: Promise<{ projectId: string; stage: string }>;
}) {
  const { projectId, stage: stageParam } = await params;

  if (!STAGES.includes(stageParam as Stage)) {
    notFound();
  }
  const stage = stageParam as Stage;

  const profile = await requireOnboarded();
  const supabase = await createServerSupabaseClient();

  // No owner filter — RLS scopes this to the artist who owns it or an
  // accepted collaborator, same reasoning as the project overview page.
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();

  if (!project) {
    notFound();
  }

  const isOwner = project.artist_profile_id === profile.id;

  const { data: stagesData } = await supabase.from('project_stages').select('*').eq('project_id', projectId);
  const stages = (stagesData ?? []) as (ProjectStage & { artifacts: { notes?: string } | null })[];
  const currentStage = project.current_stage as Stage;
  const thisStageRow = stages.find((s) => s.stage === stage);

  const { data: collaboratorsData } = await supabase
    .from('project_collaborators')
    .select('id, pro_profile_id, role, status')
    .eq('project_id', projectId)
    .eq('stage', stage);

  const collaborators = collaboratorsData ?? [];
  const collaboratorProfileIds = collaborators.map((c) => c.pro_profile_id);

  const { data: collaboratorProfilesData } = collaboratorProfileIds.length
    ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', collaboratorProfileIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };

  const collaboratorProfileById = new Map((collaboratorProfilesData ?? []).map((p) => [p.id, p]));

  const stageProTypes = STAGE_PROS[stage];

  const { data: matchesData } = await supabase
    .from('matches')
    .select('id, pro_profile_id, score, reasoning')
    .eq('project_id', projectId)
    .eq('stage', stage)
    .eq('decision', 'pending')
    .order('score', { ascending: false });

  const matches = matchesData ?? [];
  const matchProfileIds = matches.map((m) => m.pro_profile_id);

  const [{ data: matchProProfilesData }, { data: matchProfilesData }] = await Promise.all([
    matchProfileIds.length
      ? supabase.from('pro_profiles').select('profile_id, pro_type, verified_status').in('profile_id', matchProfileIds)
      : Promise.resolve({ data: [] as { profile_id: string; pro_type: string; verified_status: string }[] }),
    matchProfileIds.length
      ? supabase.from('profiles').select('id, display_name, avatar_url').in('id', matchProfileIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string; avatar_url: string | null }[] }),
  ]);

  const matchProProfileById = new Map((matchProProfilesData ?? []).map((p) => [p.profile_id, p]));
  const matchProfileById = new Map((matchProfilesData ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-4xl px-8 py-7">
      <Link href={`/projects/${projectId}`} className="text-[13px] font-medium text-app-primary transition hover:text-app-primary-hover">
        ← Back to {project.title}
      </Link>

      <div className="mt-4">
        <StageTimeline projectId={projectId} currentStage={currentStage} stages={stages} viewingStage={stage} />
      </div>

      <div className="mt-8 rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: STAGE_COLORS[stage] }}>
          {STAGE_LABELS[stage]}
        </p>
        <p className="mt-2 text-[15px] text-app-fg-2">{STAGE_DESCRIPTIONS[stage]}</p>

        {isOwner && stage === currentStage ? (
          <div className="mt-6">
            <AdvanceStageAction projectId={projectId} currentStage={currentStage} stages={stages} />
          </div>
        ) : (
          <div className="mt-6">
            <Badge tone={thisStageRow?.status === 'completed' ? 'green' : thisStageRow?.status === 'skipped' ? 'gray' : 'blue'}>
              {thisStageRow?.status === 'completed'
                ? 'Completed'
                : thisStageRow?.status === 'skipped'
                  ? 'Skipped'
                  : thisStageRow?.status === 'in_progress'
                    ? 'In progress'
                    : 'Not started'}
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm sm:p-8">
        <div className="mb-3 text-sm font-semibold text-app-fg-1">Stage notes</div>
        {isOwner ? (
          <StageArtifactNotes projectId={projectId} stage={stage} initialNotes={thisStageRow?.artifacts?.notes ?? ''} />
        ) : (
          <p className="text-[13px] text-app-fg-2">
            {thisStageRow?.artifacts?.notes || 'No notes yet from the project owner.'}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm sm:p-8">
        <div className="mb-3 text-sm font-semibold text-app-fg-1">Collaborators on this stage</div>
        {collaborators.length === 0 ? (
          <p className="text-[13px] text-app-fg-2">No one has been invited to this stage yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {collaborators.map((collaborator) => {
              const collabProfile = collaboratorProfileById.get(collaborator.pro_profile_id);
              if (!collabProfile) return null;
              return (
                <div key={collaborator.id} className="flex items-center gap-3 rounded-app-md border border-app-border p-3.5">
                  <Avatar name={collabProfile.display_name} src={collabProfile.avatar_url} size="sm" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-app-fg-1">{collabProfile.display_name}</div>
                    <div className="text-[12px] text-app-fg-2">{collaborator.role}</div>
                  </div>
                  <Badge tone={collaboratorStatusTone[collaborator.status] ?? 'gray'} className="capitalize">{collaborator.status}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isOwner ? (
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-app-fg-1">
            {proTypeLabels[stageProTypes[0]] ? `Matched pros for ${STAGE_LABELS[stage]}` : 'Matched pros'}
          </div>
          <GenerateMatchesAction projectId={projectId} stage={stage} label={matches.length ? 'Refresh matches' : 'Find matches'} />
        </div>
        {matches.length === 0 ? (
          <div className="rounded-app-xl border border-app-border bg-app-surface p-6 text-center">
            <p className="text-[13px] text-app-fg-2">No matches yet — click &ldquo;Find matches&rdquo; to run the matching engine for this stage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
            {matches.map((match) => {
              const pro = matchProProfileById.get(match.pro_profile_id);
              const matchProfile = matchProfileById.get(match.pro_profile_id);
              if (!pro || !matchProfile) return null;
              const reasoning = match.reasoning as unknown as MatchReasoning | null;

              return (
                <div key={match.id} className="flex flex-col gap-3 rounded-app-xl border border-app-border bg-app-surface p-4 shadow-app-sm">
                  <div className="flex items-start gap-3">
                    <Avatar name={matchProfile.display_name} src={matchProfile.avatar_url} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-[13px] font-semibold text-app-fg-1">
                        {matchProfile.display_name}
                        {pro.verified_status !== 'unverified' ? <VerifiedBadge size={13} /> : null}
                      </div>
                      <div className="text-[12px] text-app-fg-2">{proTypeLabels[pro.pro_type as keyof typeof proTypeLabels]}</div>
                      <div className="mt-0.5 text-[11px] font-semibold text-app-primary">{Math.round(match.score * 100)}% match</div>
                    </div>
                  </div>
                  {reasoning?.why_shown ? <p className="text-[12px] text-app-fg-2">{reasoning.why_shown}</p> : null}
                  <MatchDecisionActions matchId={match.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      ) : null}
    </main>
  );
}
