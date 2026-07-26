import { RiUserStarLine } from '@remixicon/react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STAGE_LABELS, type Stage } from '@/lib/workflow/stages';
import type { MatchReasoning } from '@/lib/matching/scoring';
import { Avatar } from '@/components/ui/Avatar';
import { MatchDecisionActions } from '@/components/match/MatchDecisionActions';
import type { Profile } from '@/lib/auth/guards';

export async function ProMatchesFeed({ profile }: { profile: Profile }) {
  const supabase = await createServerSupabaseClient();

  const { data: matchesData } = await supabase
    .from('matches')
    .select('id, project_id, stage, score, reasoning')
    .eq('pro_profile_id', profile.id)
    .eq('decision', 'pending')
    .order('score', { ascending: false });

  const matches = matchesData ?? [];
  const projectIds = matches.map((m) => m.project_id);

  const { data: projectsData } = projectIds.length
    ? await supabase.from('projects').select('id, title, description, artist_profile_id').in('id', projectIds)
    : { data: [] as { id: string; title: string; description: string | null; artist_profile_id: string }[] };

  const projectById = new Map((projectsData ?? []).map((p) => [p.id, p]));
  const artistIds = Array.from(new Set((projectsData ?? []).map((p) => p.artist_profile_id)));

  const { data: artistsData } = artistIds.length
    ? await supabase.from('profiles').select('id, display_name, avatar_url, location').in('id', artistIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null; location: string | null }[] };

  const artistById = new Map((artistsData ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-6">
        <div className="text-xl font-bold text-app-fg-1">Matches</div>
        <div className="mt-0.5 text-[13px] text-app-fg-2">Incoming project invites matched to your profile.</div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-app-xl border border-app-border bg-app-surface p-8 text-center">
          <RiUserStarLine size={28} className="mx-auto mb-3 text-app-fg-3" />
          <p className="text-sm font-medium text-app-fg-1">No pending match invites right now.</p>
          <p className="mt-1 text-[13px] text-app-fg-2">
            Invites show up here when the matching engine finds a project that fits your profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {matches.map((match) => {
            // The project row may not be readable yet — a pending match
            // only proves this pro is party to the match itself, not that
            // they've been accepted onto a private project (RLS is
            // intentionally that strict). Never drop the match from the
            // list over that: fall back to the title captured at
            // generation time, when the engine had full access.
            const project = projectById.get(match.project_id);
            const artist = project ? artistById.get(project.artist_profile_id) : undefined;
            const reasoning = match.reasoning as unknown as MatchReasoning | null;
            const title = project?.title ?? reasoning?.project_title ?? 'A project';

            return (
              <div key={match.id} className="flex flex-col gap-3.5 rounded-app-xl border border-app-border bg-app-surface p-5 shadow-app-sm">
                <div className="flex items-start gap-3">
                  {artist ? <Avatar name={artist.display_name} src={artist.avatar_url} size="md" /> : null}
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-app-fg-1">{title}</div>
                    <div className="mt-0.5 text-xs text-app-fg-2">
                      {artist?.display_name ?? 'An artist'} · {STAGE_LABELS[match.stage as Stage]}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-app-primary">{Math.round(match.score * 100)}% match</div>
                  </div>
                </div>

                {reasoning?.why_shown ? <p className="text-[12px] text-app-fg-2">{reasoning.why_shown}</p> : null}
                {project?.description ? <p className="line-clamp-2 text-[12px] text-app-fg-2">{project.description}</p> : null}

                <MatchDecisionActions matchId={match.id} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
