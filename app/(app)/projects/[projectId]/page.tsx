import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireOnboarded } from '@/lib/auth/guards';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STAGE_LABELS, STAGE_DESCRIPTIONS, STAGE_COLORS, type Stage } from '@/lib/workflow/stages';
import type { ProjectStage } from '@/lib/workflow/state-machine';
import { StageTimeline } from '@/components/workflow/StageTimeline';
import { AdvanceStageAction } from '@/components/project/AdvanceStageAction';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

const collaboratorStatusTone: Record<string, 'green' | 'yellow' | 'gray' | 'red' | 'blue'> = {
  invited: 'yellow',
  accepted: 'green',
  completed: 'blue',
  declined: 'red',
  removed: 'gray',
};

// Parses a Postgres `date` column (YYYY-MM-DD, no time) using the local
// timezone constructor so it doesn't shift a day backward the way
// `new Date('YYYY-MM-DD')` (parsed as UTC midnight) can when displayed.
const formatDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
};

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const profile = await requireOnboarded();
  const supabase = await createServerSupabaseClient();

  // No owner filter here — RLS ("projects: read own and public") already
  // scopes this to the artist who owns it, an accepted collaborator, or a
  // public project. Anyone else gets no row back, same as a 404.
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();

  if (!project) {
    notFound();
  }

  const isOwner = project.artist_profile_id === profile.id;

  const { data: stagesData } = await supabase
    .from('project_stages')
    .select('stage, status')
    .eq('project_id', projectId);

  const stages = (stagesData ?? []) as ProjectStage[];
  const currentStage = project.current_stage as Stage;

  const { data: collaboratorsData } = await supabase
    .from('project_collaborators')
    .select('id, pro_profile_id, stage, role, status')
    .eq('project_id', projectId)
    .order('invited_at', { ascending: false });

  const collaborators = collaboratorsData ?? [];
  const collaboratorProfileIds = collaborators.map((c) => c.pro_profile_id);

  const { data: collaboratorProfilesData } = collaboratorProfileIds.length
    ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', collaboratorProfileIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };

  const collaboratorProfileById = new Map((collaboratorProfilesData ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-4xl px-8 py-7">
      <div className="flex items-center justify-between gap-3">
        <Link href="/projects" className="text-[13px] font-medium text-app-primary transition hover:text-app-primary-hover">
          ← Back to projects
        </Link>
        {isOwner ? (
          <Link href={`/projects/${project.id}/credits`} className="text-[13px] font-medium text-app-fg-2 transition hover:text-app-fg-1">
            Credits →
          </Link>
        ) : null}
      </div>

      <div className="mt-4 rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: STAGE_COLORS[currentStage] }}>
          {STAGE_LABELS[currentStage]}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-app-fg-1">{project.title}</h1>
        {project.working_title ? (
          <p className="mt-1 text-[13px] text-app-fg-2">Working title: {project.working_title}</p>
        ) : null}
        {project.description ? <p className="mt-4 max-w-2xl text-[13px] text-app-fg-2">{project.description}</p> : null}
        {project.target_completion_date ? (
          <p className="mt-2 text-[13px] text-app-fg-2">
            Target completion: {formatDateOnly(project.target_completion_date)}
          </p>
        ) : null}

        <div className="mt-10">
          <StageTimeline projectId={project.id} currentStage={currentStage} stages={stages} />
        </div>

        <Link
          href={`/projects/${project.id}/${currentStage}`}
          className="mt-8 block rounded-app-lg border border-app-border bg-app-surface-2 p-5 transition hover:border-app-primary"
        >
          <p className="text-[13px] font-semibold text-app-fg-1">{STAGE_LABELS[currentStage]}</p>
          <p className="mt-1 text-[13px] text-app-fg-2">{STAGE_DESCRIPTIONS[currentStage]}</p>
          <p className="mt-2 text-[12px] font-semibold text-app-primary">Open this stage →</p>
        </Link>

        {isOwner ? (
          <div className="mt-6">
            <AdvanceStageAction projectId={project.id} currentStage={currentStage} stages={stages} />
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-app-xl border border-app-border bg-app-surface p-6 shadow-app-sm sm:p-8">
        <div className="mb-3 text-sm font-semibold text-app-fg-1">Team</div>
        {collaborators.length === 0 ? (
          <p className="text-[13px] text-app-fg-2">
            No one has joined this project yet. Invite collaborators from any stage page.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {collaborators.map((collaborator) => {
              const collabProfile = collaboratorProfileById.get(collaborator.pro_profile_id);
              if (!collabProfile) return null;
              return (
                <Link
                  key={collaborator.id}
                  href={`/projects/${project.id}/${collaborator.stage}`}
                  className="flex items-center gap-3 rounded-app-md border border-app-border p-3.5 transition hover:border-app-primary"
                >
                  <Avatar name={collabProfile.display_name} src={collabProfile.avatar_url} size="sm" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-app-fg-1">{collabProfile.display_name}</div>
                    <div className="text-[12px] text-app-fg-2">
                      {collaborator.role} · {STAGE_LABELS[collaborator.stage as Stage]}
                    </div>
                  </div>
                  <Badge tone={collaboratorStatusTone[collaborator.status] ?? 'gray'} className="capitalize">{collaborator.status}</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
