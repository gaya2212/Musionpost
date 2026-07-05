import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { artistOnboardingSchema } from '@/lib/validation/artist';

/**
 * Finishes artist onboarding after client-side `signUp()`. Runs with the
 * service role because email confirmation is required on this project, so
 * the browser has no session (and therefore no auth.uid()) to satisfy the
 * artist_profiles/pro_profiles RLS policies until the user confirms.
 * `userId` + `email` are cross-checked against the just-created auth user
 * via the admin API so this can't be used to overwrite an arbitrary profile.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = artistOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check the highlighted fields and try again.', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { userId, email, displayName, location, primaryGenres, projectGoals, budgetRange } = parsed.data;

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({ error: 'Server is not configured for account setup right now.' }, { status: 500 });
  }

  const { data: authUser, error: authLookupError } = await admin.auth.admin.getUserById(userId);

  if (authLookupError || !authUser.user || authUser.user.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'We could not verify this account. Please sign up again.' }, { status: 403 });
  }

  const { data: existingProfile, error: profileLookupError } = await admin
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', userId)
    .single();

  if (profileLookupError || !existingProfile) {
    return NextResponse.json({ error: 'We could not find your account. Please sign up again.' }, { status: 404 });
  }

  if (existingProfile.onboarding_complete) {
    return NextResponse.json({ error: 'This account has already completed onboarding.' }, { status: 409 });
  }

  const { error: profileUpdateError } = await admin
    .from('profiles')
    .update({
      role: 'artist',
      display_name: displayName,
      location: location || null,
      onboarding_complete: true,
    })
    .eq('id', userId);

  if (profileUpdateError) {
    return NextResponse.json({ error: 'Unable to save your profile. Please try again.' }, { status: 500 });
  }

  const { error: artistProfileError } = await admin.from('artist_profiles').insert({
    profile_id: userId,
    primary_genres: primaryGenres,
    secondary_genres: [],
    project_goals: projectGoals || null,
    budget_range: budgetRange,
  });

  if (artistProfileError) {
    return NextResponse.json({ error: 'Unable to save your artist details. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
