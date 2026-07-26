import Link from 'next/link';
import { RiAddLine } from '@remixicon/react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STAGE_LABELS, STAGE_COLORS, type Stage } from '@/lib/workflow/stages';
import { computeProgress, type ProjectStage } from '@/lib/workflow/state-machine';
import { ProjectCard } from '@/components/project/ProjectCard';
import { buttonClasses } from '@/components/ui/Button';
import type { Profile } from '@/lib/auth/guards';

const TABS = [
  { id: 'all', label: 'All projects' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export async function ArtistProjectsList({ profile, tab }: { profile: Profile; tab?: string }) {
  const activeTab: TabId = TABS.some((t) => t.id === tab) ? (tab as TabId) : 'all';
  const supabase = await createServerSupabaseClient();

  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('artist_profile_id', profile.id)
    .order('created_at', { ascending: false });

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

  const { data: collaboratorsData } = projectIds.length
    ? await supabase
        .from('project_collaborators')
        .select('project_id, pro_profile_id, profiles:pro_profile_id(display_name)')
        .in('project_id', projectIds)
    : { data: [] as { project_id: string; pro_profile_id: string; profiles: { display_name: string } | null }[] };

  const collaboratorNamesByProject = new Map<string, string[]>();
  (collaboratorsData ?? []).forEach((row) => {
    if (!row.profiles) return;
    const list = collaboratorNamesByProject.get(row.project_id) ?? [];
    list.push(row.profiles.display_name);
    collaboratorNamesByProject.set(row.project_id, list);
  });

  const filteredProjects = projects.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in_progress') return p.status === 'active' || p.status === 'paused';
    return p.status === activeTab;
  });

  return (
    <main className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xl font-bold text-app-fg-1">My Projects</div>
          <div className="mt-0.5 text-[13px] text-app-fg-2">{projects.length} projects total</div>
        </div>
        <Link href="/projects/new" className={buttonClasses('primary', 'md')}>
          <RiAddLine size={16} /> New project
        </Link>
      </div>

      <div className="mb-5 flex">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/projects${t.id === 'all' ? '' : `?tab=${t.id}`}`}
            className={`-ml-px border px-4 py-2 text-[13px] font-medium transition first:ml-0 first:rounded-l-app-md last:rounded-r-app-md ${
              activeTab === t.id
                ? 'z-10 border-app-primary bg-app-primary text-white'
                : 'border-app-border bg-app-surface text-app-fg-2 hover:bg-app-surface-2'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-app-xl border border-app-border bg-app-surface p-8 text-center">
          <p className="text-sm font-medium text-app-fg-1">
            {projects.length === 0 ? "You don't have any projects yet." : 'No projects in this view.'}
          </p>
          <p className="mt-1 text-[13px] text-app-fg-2">
            {projects.length === 0
              ? 'Start one to begin moving through the six-stage workflow.'
              : 'Try a different tab.'}
          </p>
          {projects.length === 0 ? (
            <Link href="/projects/new" className={`mt-4 inline-flex ${buttonClasses('primary', 'md')}`}>
              Create your first project
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              stageLabel={STAGE_LABELS[project.current_stage as Stage]}
              stageColor={STAGE_COLORS[project.current_stage as Stage]}
              progress={computeProgress(stagesByProject.get(project.id) ?? [])}
              collaboratorNames={collaboratorNamesByProject.get(project.id) ?? []}
            />
          ))}
        </div>
      )}
    </main>
  );
}
