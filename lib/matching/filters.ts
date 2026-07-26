import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { STAGE_PROS, type Stage } from '@/lib/workflow/stages';

type AdminClient = SupabaseClient<Database>;

export type CandidatePro = {
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  location: string | null;
  proType: string;
  specialties: string[];
  genres: string[];
  notableCredits: unknown;
  bio: string | null;
  rateRange: string | null;
  verifiedStatus: string;
  updatedAt: string;
};

// Budget/rate buckets are ordinal, not true numeric ranges, so "overlap"
// here means the same bucket or an adjacent one — strict equality would
// exclude reasonable near-matches (e.g. an artist at 500_2k should still
// see pros priced 2k_10k), and no bound at all defeats the point of a
// hard filter.
const RATE_ORDER = ['under_500', '500_2k', '2k_10k', '10k_plus'] as const;

function adjacentRateBuckets(budgetRange: string | null): string[] {
  if (!budgetRange) return [...RATE_ORDER];
  const index = RATE_ORDER.indexOf(budgetRange as (typeof RATE_ORDER)[number]);
  if (index === -1) return [...RATE_ORDER];
  return RATE_ORDER.filter((_, i) => Math.abs(i - index) <= 1);
}

export type ArtistMatchContext = {
  location: string | null;
  genres: string[];
  budgetRange: string | null;
};

export async function getArtistMatchContext(supabase: AdminClient, artistProfileId: string): Promise<ArtistMatchContext> {
  const [{ data: profile }, { data: artistProfile }] = await Promise.all([
    supabase.from('profiles').select('location').eq('id', artistProfileId).single(),
    supabase.from('artist_profiles').select('primary_genres, secondary_genres, budget_range').eq('profile_id', artistProfileId).single(),
  ]);

  return {
    location: profile?.location ?? null,
    genres: [...(artistProfile?.primary_genres ?? []), ...(artistProfile?.secondary_genres ?? [])],
    budgetRange: artistProfile?.budget_range ?? null,
  };
}

/** Step 1 of the matching pipeline: hard SQL filters (MVP_ARCHITECTURE.md Section 8). */
export async function getHardFilteredCandidates(
  supabase: AdminClient,
  stage: Stage,
  artist: ArtistMatchContext,
): Promise<CandidatePro[]> {
  const stageProTypes = STAGE_PROS[stage];
  const allowedRates = adjacentRateBuckets(artist.budgetRange);

  let query = supabase
    .from('pro_profiles')
    .select('profile_id, pro_type, specialties, genres, notable_credits, rate_range, availability_status, verified_status, updated_at, remote_ok')
    .in('pro_type', stageProTypes)
    .neq('availability_status', 'closed');

  if (artist.genres.length) {
    query = query.overlaps('genres', artist.genres);
  }

  // A pro with no rate_range set hasn't been priced yet — don't exclude
  // them from a hard filter meant to catch clear budget mismatches, only
  // narrow among pros who have actually stated a rate.
  const { data: proRows } = await query;
  const candidates = (proRows ?? []).filter((p) => !p.rate_range || allowedRates.includes(p.rate_range));

  const profileIds = candidates.map((c) => c.profile_id);
  if (!profileIds.length) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, location, bio, visibility')
    .in('id', profileIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const results: CandidatePro[] = [];

  for (const pro of candidates) {
    const profile = profileById.get(pro.profile_id);
    if (!profile || profile.visibility !== 'public') continue;

    const locationMatch = Boolean(
      artist.location && profile.location && profile.location.toLowerCase() === artist.location.toLowerCase(),
    );
    if (!locationMatch && !pro.remote_ok) continue;

    results.push({
      profileId: pro.profile_id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      location: profile.location,
      proType: pro.pro_type,
      specialties: pro.specialties,
      genres: pro.genres,
      notableCredits: pro.notable_credits,
      bio: profile.bio,
      rateRange: pro.rate_range,
      verifiedStatus: pro.verified_status,
      updatedAt: pro.updated_at,
    });
  }

  return results;
}
