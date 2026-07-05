import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { proOnboardingSchema } from '@/lib/validation/pro';

/**
 * Mirrors app/api/onboarding/artist/route.ts. See that file for why this
 * runs with the service role instead of the browser's Supabase session.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = proOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check the highlighted fields and try again.', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { userId, email, displayName, location, proType, specialties, genres, rateRange, notableCredits, portfolioLinks } =
    parsed.data;

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
      role: 'pro',
      display_name: displayName,
      location: location || null,
      onboarding_complete: true,
    })
    .eq('id', userId);

  if (profileUpdateError) {
    return NextResponse.json({ error: 'Unable to save your profile. Please try again.' }, { status: 500 });
  }

  const { error: proProfileError } = await admin.from('pro_profiles').insert({
    profile_id: userId,
    pro_type: proType,
    specialties,
    genres,
    notable_credits: notableCredits ? [{ note: notableCredits }] : [],
    rate_range: rateRange,
    portfolio_urls: portfolioLinks,
  });

  if (proProfileError) {
    return NextResponse.json({ error: 'Unable to save your professional details. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
