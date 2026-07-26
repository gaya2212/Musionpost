import { RiUserStarLine } from '@remixicon/react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { proTypeLabels } from '@/lib/validation/pro';
import type { ProType, Stage } from '@/lib/workflow/stages';
import { STAGE_LABELS } from '@/lib/workflow/stages';
import type { MatchReasoning } from '@/lib/matching/scoring';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Tag } from '@/components/ui/Tag';
import { MatchDecisionActions } from '@/components/match/MatchDecisionActions';
import type { Profile } from '@/lib/auth/guards';

export async function ArtistMatchesFeed({ profile }: { profile: Profile }) {
  const supabase = await createServerSupabaseClient();

  const { data: projects } = await supabase.from('projects').select('id').eq('artist_profile_id', profile.id);
  const projectIds = (projects ?? []).map((p) => p.id);

  const { data: matchesData } = projectIds.length
    ? await supabase
        .from('matches')
        .select('*')
        .in('project_id', projectIds)
        .eq('decision', 'pending')
        .order('score', { ascending: false })
    : { data: [] as { id: string; pro_profile_id: string; score: number; reasoning: unknown; stage: string }[] };

  const matches = matchesData ?? [];
  const proProfileIds = matches.map((m) => m.pro_profile_id);

  const { data: proProfilesData } = proProfileIds.length
    ? await supabase.from('pro_profiles').select('*').in('profile_id', proProfileIds)
    : { data: [] as { profile_id: string; pro_type: string; genres: string[]; specialties: string[]; verified_status: string }[] };

  const { data: profilesData } = proProfileIds.length
    ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', proProfileIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };

  const proByProfileId = new Map((proProfilesData ?? []).map((p) => [p.profile_id, p]));
  const profileById = new Map((profilesData ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-6xl px-8 py-7">
      <div className="mb-6">
        <div className="text-xl font-bold text-app-fg-1">Matches</div>
        <div className="mt-0.5 text-[13px] text-app-fg-2">Smart-matched to your current project needs.</div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-app-xl border border-app-border bg-app-surface p-8 text-center">
          <RiUserStarLine size={28} className="mx-auto mb-3 text-app-fg-3" />
          <p className="text-sm font-medium text-app-fg-1">No pending matches right now.</p>
          <p className="mt-1 text-[13px] text-app-fg-2">
            Matches show up here once the matching engine finds collaborators for your active projects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {matches.map((match) => {
            const pro = proByProfileId.get(match.pro_profile_id);
            const proProfile = profileById.get(match.pro_profile_id);
            if (!pro || !proProfile) return null;
            const reasoning = match.reasoning as unknown as MatchReasoning | null;

            return (
              <div key={match.id} className="flex flex-col gap-3.5 rounded-app-xl border border-app-border bg-app-surface p-5 shadow-app-sm">
                <div className="flex items-start gap-3">
                  <Avatar name={proProfile.display_name} src={proProfile.avatar_url} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-sm font-semibold text-app-fg-1">
                      {proProfile.display_name}
                      {pro.verified_status !== 'unverified' ? <VerifiedBadge /> : null}
                    </div>
                    <div className="mt-0.5 text-xs text-app-fg-2">
                      {proTypeLabels[pro.pro_type as ProType]} · {STAGE_LABELS[match.stage as Stage]}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-app-primary">{Math.round(match.score * 100)}% match</div>
                  </div>
                </div>

                {reasoning?.why_shown ? <p className="text-[12px] text-app-fg-2">{reasoning.why_shown}</p> : null}

                <div className="flex flex-wrap gap-1.5">
                  {pro.genres.slice(0, 3).map((genre) => (
                    <Tag key={genre}>{genre}</Tag>
                  ))}
                </div>

                <MatchDecisionActions matchId={match.id} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
