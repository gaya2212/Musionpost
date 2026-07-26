import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildCreditsPayload, CreditsExportError } from '@/lib/credits/export';
import type { Json } from '@/lib/supabase/types';

async function verifyOwnership(projectId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: NextResponse.json({ error: 'Sign in to view credits.' }, { status: 401 }) };
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('artist_profile_id', user.id)
    .maybeSingle();

  if (!project) {
    return { supabase, error: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };
  }

  return { supabase, error: null };
}

/** Returns the Credits.fm-shaped payload preview so the artist can see the credit list before it exports. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, error } = await verifyOwnership(id);
  if (error) return error;

  try {
    const payload = await buildCreditsPayload(supabase, id);
    return NextResponse.json({ payload });
  } catch (err) {
    const message = err instanceof CreditsExportError ? err.message : 'Unable to build the credits payload.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Writes the current payload to the credits_export queue as 'pending'. Actual Credits.fm API push is deferred post-MVP. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, error } = await verifyOwnership(id);
  if (error) return error;

  try {
    const payload = await buildCreditsPayload(supabase, id);

    const { error: insertError } = await supabase.from('credits_export').insert({
      project_id: id,
      isrc: payload.isrc,
      iswc: payload.iswc,
      payload: payload as unknown as Json,
      status: 'pending',
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message || 'Unable to queue the export.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof CreditsExportError ? err.message : 'Unable to build the credits payload.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
