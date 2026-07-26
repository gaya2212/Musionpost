import Link from 'next/link';
import { RiMusic2Line } from '@remixicon/react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STAGE_LABELS, STAGE_COLORS, type Stage } from '@/lib/workflow/stages';
import { Avatar } from '@/components/ui/Avatar';
import type { Profile } from '@/lib/auth/guards';

export async function ProProjectsList({ profile }: { profile: Profile }) {
  const supabase = await createServerSupabaseClient();

  const { data: collaborationsData } = await supabase
    .from('project_collaborators')
    .select('project_id, role, stage')
    .eq('pro_profile_id', profile.id)
    .eq('status', 'accepted');

  const collaborations = collaborationsData ?? [];
  const projectIds = collaborations.map((c) => c.project_id);

  const { data: projectsData } = projectIds.length
    ? await supabase.from('projects').select('*').in('id', projectIds)
    : { data: [] as { id: string; title: string; current_stage: string; artist_profile_id: string }[] };

  const projectById = new Map((projectsData ?? []).map((p) => [p.id, p]));
  const artistIds = Array.from(new Set((projectsData ?? []).map((p) => p.artist_profile_id)));

  const { data: artistsData } = artistIds.length
    ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', artistIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };

  const artistById = new Map((artistsData ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-5">
        <div className="text-xl font-bold text-app-fg-1">My Projects</div>
        <div className="mt-0.5 text-[13px] text-app-fg-2">
          Projects you&apos;re an accepted collaborator on — {collaborations.length} total
        </div>
      </div>

      {collaborations.length === 0 ? (
        <div className="rounded-app-xl border border-app-border bg-app-surface p-8 text-center">
          <RiMusic2Line size={24} className="mx-auto mb-2 text-app-fg-3" />
          <p className="text-sm font-medium text-app-fg-1">No collaborations yet.</p>
          <p className="mt-1 text-[13px] text-app-fg-2">
            Accept a pending match invite from your{' '}
            <Link href="/dashboard" className="font-semibold text-app-primary hover:underline">
              dashboard
            </Link>{' '}
            or get discovered by keeping your{' '}
            <Link href="/profile" className="font-semibold text-app-primary hover:underline">
              profile
            </Link>{' '}
            up to date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {collaborations.map((collab) => {
            const project = projectById.get(collab.project_id);
            if (!project) return null;
            const artist = artistById.get(project.artist_profile_id);
            const stage = project.current_stage as Stage;

            return (
              <Link
                key={collab.project_id}
                href={`/projects/${project.id}`}
                className="flex flex-col gap-3 rounded-app-xl border border-app-border bg-app-surface p-5 shadow-app-sm transition hover:border-app-primary hover:shadow-app-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-app-fg-1">{project.title}</div>
                  <span
                    className="shrink-0 rounded-app-pill px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: `${STAGE_COLORS[stage]}18`, color: STAGE_COLORS[stage] }}
                  >
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                <div className="text-[12px] text-app-fg-2">Your role: {collab.role}</div>
                {artist ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={artist.display_name} src={artist.avatar_url} size="xs" />
                    <span className="text-[12px] text-app-fg-2">{artist.display_name}</span>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
