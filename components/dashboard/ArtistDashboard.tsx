import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RiAddLine, RiMusic2Line, RiGroupLine, RiUserStarLine, RiBarChartLine } from '@remixicon/react';
import { StatCard } from '@/components/app-shell/StatCard';
import { ProjectCard } from '@/components/project/ProjectCard';
import { STAGES, STAGE_LABELS, STAGE_COLORS, type Stage } from '@/lib/workflow/stages';
import { computeProgress, type ProjectStage } from '@/lib/workflow/state-machine';
import { buttonClasses } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MatchDecisionActions } from '@/components/match/MatchDecisionActions';
import type { Profile } from '@/lib/auth/guards';

export async function ArtistDashboard({ profile }: { profile: Profile }) {
  const supabase = await createServerSupabaseClient();

  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('artist_profile_id', profile.id)
    .order('updated_at', { ascending: false });

  const projects = projectsData ?? [];
  const projectIds = projects.map((p) => p.id);

  const { data: stagesData } = projectIds.length
    ? await supabase.from('project_stages').select('project_id, stage, status').in('project_id', projectIds)
    : { data: [] as { project_id: string; stage: string; status: string }[] };

  const stagesByProject = new Map<string, ProjectStage[]>();
  (stagesData ?? []).forEach((row) => {
    const list = stagesByProject.get(row.project_id) ?? [];
    list.push({ stage: row.stage as Stage, status: row.status as ProjectStage['status'] });
    stagesByProject.set(row.project_id, list);
  });

  const activeCount = projects.filter((p) => p.status === 'active').length;

  const progressList = projects.map((p) => computeProgress(stagesByProject.get(p.id) ?? []));
  const avgCompletion = progressList.length
    ? Math.round(progressList.reduce((sum, v) => sum + v, 0) / progressList.length)
    : 0;

  const { count: collaboratorCount } = projectIds.length
    ? await supabase
        .from('project_collaborators')
        .select('pro_profile_id', { count: 'exact', head: true })
        .in('project_id', projectIds)
    : { count: 0 };

  const { count: pendingMatchesCount } = projectIds.length
    ? await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('decision', 'pending')
    : { count: 0 };

  const recentProjects = projects.slice(0, 3);
  const recentProjectIds = recentProjects.map((p) => p.id);

  const { data: recentCollaboratorsData } = recentProjectIds.length
    ? await supabase
        .from('project_collaborators')
        .select('project_id, profiles:pro_profile_id(display_name)')
        .in('project_id', recentProjectIds)
    : { data: [] as { project_id: string; profiles: { display_name: string } | null }[] };

  const collaboratorNamesByProject = new Map<string, string[]>();
  (recentCollaboratorsData ?? []).forEach((row) => {
    if (!row.profiles) return;
    const list = collaboratorNamesByProject.get(row.project_id) ?? [];
    list.push(row.profiles.display_name);
    collaboratorNamesByProject.set(row.project_id, list);
  });

  const pipelineProject = projects.find((p) => p.status === 'active') ?? projects[0];
  const pipelineStages = pipelineProject ? stagesByProject.get(pipelineProject.id) ?? [] : [];

  const { data: pendingMatchesData } = projectIds.length
    ? await supabase
        .from('matches')
        .select('id, pro_profile_id, score, project_id')
        .in('project_id', projectIds)
        .eq('decision', 'pending')
        .order('score', { ascending: false })
        .limit(2)
    : { data: [] as { id: string; pro_profile_id: string; score: number; project_id: string }[] };

  const pendingMatches = pendingMatchesData ?? [];
  const inviteProfileIds = pendingMatches.map((m) => m.pro_profile_id);

  const { data: inviteProfilesData } = inviteProfileIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', inviteProfileIds)
    : { data: [] as { id: string; display_name: string }[] };

  const inviteProfileById = new Map((inviteProfilesData ?? []).map((p) => [p.id, p]));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xl font-bold text-app-fg-1">Dashboard</div>
          <div className="mt-0.5 text-[13px] text-app-fg-2">
            Good to see you, {profile.display_name.split(' ')[0]}. Here&apos;s your overview.
          </div>
        </div>
        <Link href="/projects/new" className={buttonClasses('primary', 'md')}>
          <RiAddLine size={16} /> New project
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <StatCard value={String(activeCount)} label="Active projects" icon={RiMusic2Line} color="var(--color-app-primary)" />
        <StatCard value={String(collaboratorCount ?? 0)} label="Collaborators" icon={RiGroupLine} color="var(--color-app-pink)" />
        <StatCard value={String(pendingMatchesCount ?? 0)} label="Pending matches" icon={RiUserStarLine} color="var(--color-app-green)" />
        <StatCard value={`${avgCompletion}%`} label="Avg. completion" icon={RiBarChartLine} color="var(--color-app-yellow)" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Recent projects</div>
          {recentProjects.length === 0 ? (
            <div className="rounded-app-xl border border-app-border bg-app-surface p-8 text-center">
              <p className="text-sm font-medium text-app-fg-1">No projects yet.</p>
              <p className="mt-1 text-[13px] text-app-fg-2">Start one to begin moving through the six-stage workflow.</p>
              <Link href="/projects/new" className={`mt-4 inline-flex ${buttonClasses('primary', 'md')}`}>
                Create your first project
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  stageLabel={STAGE_LABELS[p.current_stage as Stage]}
                  stageColor={STAGE_COLORS[p.current_stage as Stage]}
                  progress={computeProgress(stagesByProject.get(p.id) ?? [])}
                  collaboratorNames={collaboratorNamesByProject.get(p.id) ?? []}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {pendingMatches.length > 0 ? (
            <div className="mb-5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Pending matches</span>
                <Link href="/matches" className="text-[12px] font-semibold text-app-primary hover:underline">
                  See all
                </Link>
              </div>
              <div className="flex flex-col gap-2.5">
                {pendingMatches.map((match) => {
                  const pro = inviteProfileById.get(match.pro_profile_id);
                  const project = projectById.get(match.project_id);
                  if (!pro) return null;
                  return (
                    <div key={match.id} className="rounded-app-xl border border-app-border bg-app-surface p-4">
                      <div className="mb-3 flex items-center gap-2.5">
                        <Avatar name={pro.display_name} size="sm" />
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold text-app-fg-1">{pro.display_name}</div>
                          <div className="text-[11px] text-app-fg-2">
                            {Math.round(match.score * 100)}% match{project ? ` · ${project.title}` : ''}
                          </div>
                        </div>
                      </div>
                      <MatchDecisionActions matchId={match.id} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-3">Pipeline stages</div>
          <div className="rounded-app-xl border border-app-border bg-app-surface p-3">
            {pipelineProject ? (
              <div className="flex flex-col gap-0.5">
                {STAGES.map((stage, i) => {
                  const status = pipelineStages.find((s) => s.stage === stage)?.status ?? 'not_started';
                  const isCurrent = stage === pipelineProject.current_stage;
                  return (
                    <Link
                      key={stage}
                      href={`/projects/${pipelineProject.id}`}
                      className={`flex items-center gap-2.5 rounded-app-md px-3.5 py-2.5 text-[13px] transition hover:bg-app-surface-2 ${
                        isCurrent ? 'bg-app-primary-light' : ''
                      }`}
                      title={status}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: isCurrent ? STAGE_COLORS[stage] : 'var(--color-app-border)' }}
                      />
                      <span
                        className={`flex-1 ${isCurrent ? 'font-semibold' : ''}`}
                        style={{ color: isCurrent ? STAGE_COLORS[stage] : 'var(--color-app-fg-2)' }}
                      >
                        {STAGE_LABELS[stage]}
                      </span>
                      <span className="text-[11px] text-app-fg-3">0{i + 1}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="p-4 text-[13px] text-app-fg-2">Create a project to see its pipeline here.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
