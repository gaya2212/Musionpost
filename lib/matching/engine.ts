import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { Stage } from '@/lib/workflow/stages';
import { getArtistMatchContext, getHardFilteredCandidates, type CandidatePro } from './filters';
import { getEmbedding, buildProEmbeddingText, buildProjectEmbeddingText, cosineSimilarity } from './embeddings';
import { scoreMatch, type ScoredMatch } from './scoring';

type AdminClient = SupabaseClient<Database>;

const VECTOR_SHORTLIST_SIZE = 50;
const FINAL_MATCH_COUNT = 10;

export class MatchingEngineError extends Error {}

/** Looks up a candidate's stored embedding, computing and persisting one if it's missing. */
async function getOrCreateProEmbedding(supabase: AdminClient, candidate: CandidatePro): Promise<number[] | null> {
  const { data: existing } = await supabase.from('pro_profiles').select('embedding').eq('profile_id', candidate.profileId).single();

  if (existing?.embedding) {
    // pgvector returns embeddings as a string like "[0.1,0.2,...]" over PostgREST.
    const raw = existing.embedding as unknown;
    if (Array.isArray(raw)) return raw as number[];
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as number[];
      } catch {
        // fall through to regenerate
      }
    }
  }

  const embedding = await getEmbedding(buildProEmbeddingText(candidate));
  if (embedding) {
    await supabase.from('pro_profiles').update({ embedding: JSON.stringify(embedding) }).eq('profile_id', candidate.profileId);
  }
  return embedding;
}

/**
 * Step 2-4 of the matching pipeline (MVP_ARCHITECTURE.md Section 8).
 * Step 1 (hard filters) lives in filters.ts. Degrades gracefully when
 * OPENAI_API_KEY isn't configured: vector similarity contributes 0 instead
 * of failing the whole pipeline, so genre/verified/recency scoring still
 * produces a ranked, explainable result.
 */
export async function generateMatches(
  supabase: AdminClient,
  projectId: string,
  stage: Stage,
): Promise<ScoredMatch[]> {
  const { data: project } = await supabase.from('projects').select('title, artist_profile_id, description').eq('id', projectId).single();

  if (!project) {
    throw new MatchingEngineError('Project not found.');
  }

  const artist = await getArtistMatchContext(supabase, project.artist_profile_id);
  const candidates = await getHardFilteredCandidates(supabase, stage, artist);

  if (!candidates.length) {
    return [];
  }

  const projectEmbedding = await getEmbedding(
    buildProjectEmbeddingText({ artistGenres: artist.genres, projectDescription: project.description, stage }),
  );

  const withSimilarity = await Promise.all(
    candidates.map(async (candidate) => {
      let similarity = 0;
      if (projectEmbedding) {
        const proEmbedding = await getOrCreateProEmbedding(supabase, candidate);
        if (proEmbedding) {
          similarity = cosineSimilarity(projectEmbedding, proEmbedding);
        }
      }
      return { candidate, similarity };
    }),
  );

  const shortlist = withSimilarity.sort((a, b) => b.similarity - a.similarity).slice(0, VECTOR_SHORTLIST_SIZE);

  const scored = shortlist
    .map(({ candidate, similarity }) => scoreMatch(candidate, similarity, artist.genres, artist.location, project.title))
    .sort((a, b) => b.score - a.score)
    .slice(0, FINAL_MATCH_COUNT);

  await persistMatches(supabase, projectId, stage, scored);

  return scored;
}

/**
 * `matches` has no unique constraint on (project_id, stage, pro_profile_id),
 * so this can't use a DB-level upsert — and a plain upsert would be wrong
 * anyway: re-running matching shouldn't overwrite a match the artist
 * already accepted, rejected, or saved. Only rows still 'pending' get
 * refreshed; everything else (and every genuinely new candidate) is
 * inserted or left alone.
 */
async function persistMatches(supabase: AdminClient, projectId: string, stage: Stage, scored: ScoredMatch[]): Promise<void> {
  const proProfileIds = scored.map((m) => m.candidate.profileId);
  const { data: existingRows } = await supabase
    .from('matches')
    .select('id, pro_profile_id, decision')
    .eq('project_id', projectId)
    .eq('stage', stage)
    .in('pro_profile_id', proProfileIds);

  const existingByProId = new Map((existingRows ?? []).map((row) => [row.pro_profile_id, row]));
  const now = new Date().toISOString();

  for (const match of scored) {
    const existing = existingByProId.get(match.candidate.profileId);

    if (!existing) {
      const { error } = await supabase.from('matches').insert({
        project_id: projectId,
        stage,
        pro_profile_id: match.candidate.profileId,
        score: match.score,
        reasoning: match.reasoning,
        shown_at: now,
        decision: 'pending',
      });
      if (error) throw new MatchingEngineError(error.message);
      continue;
    }

    if (existing.decision === 'pending') {
      const { error } = await supabase
        .from('matches')
        .update({ score: match.score, reasoning: match.reasoning, shown_at: now })
        .eq('id', existing.id);
      if (error) throw new MatchingEngineError(error.message);
    }
  }
}
