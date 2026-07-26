import type { CandidatePro } from './filters';

const WEIGHTS = {
  vectorSimilarity: 0.6,
  genreOverlap: 0.2,
  verifiedBonus: 0.1,
  recency: 0.1,
};

// The spec states the verified bonus contributes 0.05 for "witnessed" and
// 0.10 for "documented" to the final score. With a 0.1 weight on this term,
// that means the raw (pre-weight) bonus is 0.5 for witnessed and 1.0 for
// documented — 0.1 * 0.5 = 0.05, 0.1 * 1.0 = 0.10.
const VERIFIED_BONUS_RAW: Record<string, number> = {
  unverified: 0,
  witnessed: 0.5,
  documented: 1,
};

const RECENCY_FULL_CREDIT_DAYS = 7;
const RECENCY_ZERO_CREDIT_DAYS = 90;

function genreOverlapScore(proGenres: string[], artistGenres: string[]): number {
  if (!proGenres.length || !artistGenres.length) return 0;
  const proSet = new Set(proGenres.map((g) => g.toLowerCase()));
  const artistSet = new Set(artistGenres.map((g) => g.toLowerCase()));
  const intersection = Array.from(proSet).filter((g) => artistSet.has(g));
  const union = new Set([...Array.from(proSet), ...Array.from(artistSet)]);
  return intersection.length / union.size;
}

function recencyScore(updatedAt: string): number {
  const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate <= RECENCY_FULL_CREDIT_DAYS) return 1;
  if (daysSinceUpdate >= RECENCY_ZERO_CREDIT_DAYS) return 0;
  const span = RECENCY_ZERO_CREDIT_DAYS - RECENCY_FULL_CREDIT_DAYS;
  return 1 - (daysSinceUpdate - RECENCY_FULL_CREDIT_DAYS) / span;
}

export type MatchReasoning = {
  matched_genres: string[];
  location_match: 'same_city' | 'remote' | 'none';
  recent_credits_relevance: number;
  why_shown: string;
  // Captured at generation time (the engine runs with admin access) so a
  // matched-but-not-yet-accepted pro can see what they're being invited to
  // without granting them broader read access to a private project row —
  // "matches: pro_profile_id = auth.uid()" only proves they're party to
  // the match itself, not that they should see the full project.
  project_title: string;
};

export type ScoredMatch = {
  candidate: CandidatePro;
  score: number;
  reasoning: MatchReasoning;
};

/** Step 3 of the matching pipeline: score fusion (MVP_ARCHITECTURE.md Section 8). */
export function scoreMatch(
  candidate: CandidatePro,
  vectorSimilarity: number,
  artistGenres: string[],
  artistLocation: string | null,
  projectTitle: string,
): ScoredMatch {
  const clampedSimilarity = Math.max(0, Math.min(1, vectorSimilarity));
  const genreScore = genreOverlapScore(candidate.genres, artistGenres);
  const verifiedRaw = VERIFIED_BONUS_RAW[candidate.verifiedStatus] ?? 0;
  const recency = recencyScore(candidate.updatedAt);

  const score =
    WEIGHTS.vectorSimilarity * clampedSimilarity +
    WEIGHTS.genreOverlap * genreScore +
    WEIGHTS.verifiedBonus * verifiedRaw +
    WEIGHTS.recency * recency;

  const matchedGenres = candidate.genres.filter((g) => artistGenres.some((ag) => ag.toLowerCase() === g.toLowerCase()));

  const locationMatch: MatchReasoning['location_match'] =
    artistLocation && candidate.location && candidate.location.toLowerCase() === artistLocation.toLowerCase()
      ? 'same_city'
      : 'remote';

  const whyParts: string[] = [];
  if (matchedGenres.length) {
    whyParts.push(`${matchedGenres.length} shared genre${matchedGenres.length === 1 ? '' : 's'}`);
  }
  if (locationMatch === 'same_city') {
    whyParts.push('based in the same city');
  }
  if (candidate.verifiedStatus !== 'unverified') {
    whyParts.push(`${candidate.verifiedStatus} on Musion`);
  }

  return {
    candidate,
    score: Math.round(score * 1000) / 1000,
    reasoning: {
      matched_genres: matchedGenres,
      location_match: locationMatch,
      recent_credits_relevance: Math.round(clampedSimilarity * 100) / 100,
      why_shown: whyParts.length ? whyParts.join(' and ') : 'Matches this stage’s professional type.',
      project_title: projectTitle,
    },
  };
}
