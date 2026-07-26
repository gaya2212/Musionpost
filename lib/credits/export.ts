import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { CreditsExportPayload } from './types';

export class CreditsExportError extends Error {}

/** Builds a Credits.fm-shaped payload for a project (MVP_ARCHITECTURE.md Section 11). */
export async function buildCreditsPayload(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<CreditsExportPayload> {
  const { data: project } = await supabase.from('projects').select('id, title, status, updated_at').eq('id', projectId).single();

  if (!project) {
    throw new CreditsExportError('Project not found.');
  }

  const { data: collaborators } = await supabase
    .from('project_collaborators')
    .select('pro_profile_id, role, status, completed_at')
    .eq('project_id', projectId)
    .in('status', ['accepted', 'completed']);

  const contributorIds = (collaborators ?? []).map((c) => c.pro_profile_id);

  const { data: profiles } = contributorIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', contributorIds)
    : { data: [] as { id: string; display_name: string }[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const contributors = (collaborators ?? [])
    .map((c) => {
      const profile = profileById.get(c.pro_profile_id);
      if (!profile) return null;
      return {
        profileId: c.pro_profile_id,
        displayName: profile.display_name,
        role: c.role,
        ipi: null,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return {
    projectId: project.id,
    title: project.title,
    isrc: null,
    iswc: null,
    contributors,
    completedAt: project.status === 'completed' ? project.updated_at : null,
  };
}
