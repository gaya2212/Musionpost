import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';

const bodySchema = z.object({
  threadId: z.string().uuid(),
});

/**
 * Notifies the other thread participant(s) by email that a new message
 * arrived. Runs partly on the service role because recipient email
 * addresses live in auth.users, which profiles/thread_participants RLS
 * has no visibility into (by design — nothing else needs it). Caller's
 * own session still gates *who* can trigger this: they must be a
 * participant in the thread they're notifying about.
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
    return NextResponse.json({ error: 'Invalid thread id.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to send messages.' }, { status: 401 });
  }

  const { data: participantRows } = await supabase
    .from('thread_participants')
    .select('profile_id')
    .eq('thread_id', parsed.data.threadId);

  const isParticipant = (participantRows ?? []).some((row) => row.profile_id === user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: 'Not a participant in this thread.' }, { status: 403 });
  }

  const recipientIds = (participantRows ?? []).map((row) => row.profile_id).filter((id) => id !== user.id);
  if (!recipientIds.length) {
    return NextResponse.json({ success: true, notified: 0 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ success: true, notified: 0, note: 'Email notifications are not configured.' });
  }

  const [{ data: senderProfile }, { data: recipientProfiles }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase.from('profiles').select('id, display_name').in('id', recipientIds),
  ]);

  let notified = 0;

  for (const recipient of recipientProfiles ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(recipient.id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const { sent } = await sendEmail({
      to: email,
      subject: `${senderProfile?.display_name ?? 'Someone'} sent you a message on Musion`,
      html: `<p><strong>${senderProfile?.display_name ?? 'Someone'}</strong> sent you a new message on Musion.</p><p><a href="https://app.musion.one/messages?thread=${parsed.data.threadId}">Open the conversation</a></p>`,
    });

    if (sent) notified += 1;
  }

  return NextResponse.json({ success: true, notified });
}
