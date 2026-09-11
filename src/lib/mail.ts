import type { Env } from '../env';

// E-mail via Cloudflare Email Sending (de `send_email`-binding `EMAIL`, gezet in
// wrangler.toml). Geen API-key nodig; het afzenddomein (MAIL_FROM) moet wel
// onboarded zijn via `wrangler email sending enable <domein>`.
//
// Is de binding niet aanwezig (lokale dev zonder `remote: true`), dan loggen we
// alleen — zo staat bij een wachtwoord-reset de reset-URL in de wrangler-output.

export async function sendMail(
  env: Env,
  msg: { to: string; subject: string; text: string; html?: string },
): Promise<void> {
  if (!env.EMAIL) {
    console.log('[mail] geen EMAIL-binding — mail niet verzonden:', msg);
    return;
  }
  try {
    await env.EMAIL.send({
      to: msg.to,
      from: { email: env.MAIL_FROM, name: env.SITE_NAME },
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
  } catch (err) {
    console.error('[mail] Cloudflare Email Sending-fout:', err);
    throw new Error('Mailverzending mislukt');
  }
}
