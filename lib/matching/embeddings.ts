import 'server-only';
import { STAGE_DESCRIPTIONS, type Stage } from '@/lib/workflow/stages';

const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Calls OpenAI's embeddings endpoint directly via fetch (no SDK dependency).
 * Returns null when OPENAI_API_KEY isn't configured — callers decide
 * whether that's fatal (e.g. the generate-matches route) or something to
 * degrade gracefully around.
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenAI embeddings request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const json = (await response.json()) as { data: { embedding: number[] }[] };
  return json.data[0]?.embedding ?? null;
}

type ProEmbeddingInput = {
  proType: string;
  specialties: string[];
  genres: string[];
  notableCredits: unknown;
  bio: string | null;
};

/** Pro embedding source text: pro_type + specialties + genres + notable_credits + bio. */
export function buildProEmbeddingText(pro: ProEmbeddingInput): string {
  const creditsText = Array.isArray(pro.notableCredits)
    ? (pro.notableCredits as { note?: string }[]).map((c) => c.note).filter(Boolean).join('. ')
    : '';

  return [pro.proType.replace(/_/g, ' '), pro.specialties.join(', '), pro.genres.join(', '), creditsText, pro.bio ?? '']
    .filter(Boolean)
    .join('. ');
}

type ProjectEmbeddingInput = {
  artistGenres: string[];
  projectDescription: string | null;
  stage: Stage;
};

/** Project embedding source text, built at match time: artist genres + project.description + stage + STAGE_DESCRIPTIONS[stage]. */
export function buildProjectEmbeddingText(input: ProjectEmbeddingInput): string {
  return [input.artistGenres.join(', '), input.projectDescription ?? '', input.stage.replace(/_/g, ' '), STAGE_DESCRIPTIONS[input.stage]]
    .filter(Boolean)
    .join('. ');
}

/** Cosine similarity between two equal-length embedding vectors, in [-1, 1]. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
