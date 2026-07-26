import 'server-only';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'Musion <notifications@musion.one>';

/**
 * Sends via Resend's REST API directly (no SDK dependency). No-ops when
 * RESEND_API_KEY isn't configured rather than throwing — email notification
 * is a nice-to-have, not something that should break the action that
 * triggered it (e.g. sending a message).
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: 'RESEND_API_KEY is not configured.' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { sent: false, error: `Resend request failed (${response.status}): ${body.slice(0, 300)}` };
  }

  return { sent: true };
}
