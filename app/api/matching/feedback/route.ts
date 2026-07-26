import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const bodySchema = z.object({
  matchId: z.string().uuid(),
  decision: z.enum(['accepted', 'rejected', 'saved']),
  feedback: z.string().trim().max(2000).optional(),
});

/**
 * A match can be acted on by either side: the artist deciding whether to
 * pursue a suggested pro, or the pro deciding whether to take an incoming
 * invite. "matches: manage own" RLS only ever granted the artist write
 * access (and project_collaborators writes are artist-only too), so a
 * pro's own session can't perform either write — this authenticates the
 * caller via their own session (now readable by both sides after the
 * matches SELECT policy was broadened), manually checks they're one of
 * the two legitimate parties, then does the actual writes with the
 * service role.
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
    return NextResponse.json({ error: 'Invalid feedback payload.', issues: parsed.error.issues }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to record a decision.' }, { status: 401 });
  }

  const { data: match } = await supabase
    .from('matches')
    .select('id, project_id, stage, pro_profile_id')
    .eq('id', parsed.data.matchId)
    .maybeSingle();

  if (!match) {
    return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
  }

  const { data: project } = await supabase.from('projects').select('artist_profile_id').eq('id', match.project_id).maybeSingle();

  const isArtist = project?.artist_profile_id === user.id;
  const isPro = match.pro_profile_id === user.id;

  if (!isArtist && !isPro) {
    return NextResponse.json({ error: 'Not authorized to decide on this match.' }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server is not configured for this action right now.' }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from('matches')
    .update({
      decision: parsed.data.decision,
      decided_at: new Date().toISOString(),
      ...(parsed.data.feedback ? { feedback: parsed.data.feedback } : {}),
    })
    .eq('id', match.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message || 'Unable to record your decision.' }, { status: 500 });
  }

  // Accepting a match closes the loop into a real collaborator
  // relationship instead of just flipping a status nobody acts on. Whoever
  // accepted has already confirmed their side, so their status starts
  // 'accepted' directly; the other side's status stays whatever it was
  // (or 'invited' if this is a brand-new row), since they haven't acted yet.
  if (parsed.data.decision === 'accepted') {
    const { data: existingCollaborator } = await admin
      .from('project_collaborators')
      .select('id, status')
      .eq('project_id', match.project_id)
      .eq('stage', match.stage)
      .eq('pro_profile_id', match.pro_profile_id)
      .maybeSingle();

    if (!existingCollaborator) {
      const { data: proProfile } = await admin
        .from('pro_profiles')
        .select('pro_type')
        .eq('profile_id', match.pro_profile_id)
        .single();

      await admin.from('project_collaborators').insert({
        project_id: match.project_id,
        stage: match.stage,
        pro_profile_id: match.pro_profile_id,
        role: proProfile?.pro_type ?? 'collaborator',
        status: isPro ? 'accepted' : 'invited',
        ...(isPro ? { accepted_at: new Date().toISOString() } : {}),
      });
    } else if (isPro && existingCollaborator.status === 'invited') {
      await admin.from('project_collaborators').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', existingCollaborator.id);
    }
  }

  return NextResponse.json({ success: true });
}
