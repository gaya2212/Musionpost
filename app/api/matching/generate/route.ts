import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STAGES } from '@/lib/workflow/stages';
import { generateMatches, MatchingEngineError } from '@/lib/matching/engine';

const bodySchema = z.object({
  projectId: z.string().uuid(),
  stage: z.enum(STAGES),
});

/**
 * Runs with the service role because the engine caches pro embeddings on
 * pro_profiles rows the caller doesn't own — "pro_profiles: manage own"
 * RLS restricts that to the profile's own owner, so no authenticated
 * artist session could ever do this write. Ownership of the *project* is
 * still verified against the caller's own session first.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project or stage.', issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to generate matches.' }, { status: 401 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', parsed.data.projectId)
    .eq('artist_profile_id', user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server is not configured for matching right now.' }, { status: 500 });
  }

  try {
    const matches = await generateMatches(admin, parsed.data.projectId, parsed.data.stage);
    return NextResponse.json({ matches: matches.map((m) => ({ proProfileId: m.candidate.profileId, score: m.score })) });
  } catch (error) {
    const message = error instanceof MatchingEngineError ? error.message : 'Unable to generate matches right now.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
