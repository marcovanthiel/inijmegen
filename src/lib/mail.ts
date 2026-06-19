import type { Env } from '../env';

// E-mail via Resend. Als RESEND_API_KEY niet gezet is, loggen we alleen
// (handig voor lokale dev — de reset-URL staat dan in de wrangler-output).

export async function sendMail(
  env: Env,
  msg: { to: string; subject: string; text: string; html?: string },
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log('[mail] geen RESEND_API_KEY — mail niet verzonden:', msg);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[mail] Resend-fout', res.status, body);
    throw new Error(`Mailverzending mislukt (${res.status})`);
  }
}
