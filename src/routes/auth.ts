import { Hono } from 'hono';
import type { AppContext } from '../env';
import { renderLogin, renderForgot, renderReset } from '../views/admin-views';
import { verifyPassword, hashPassword } from '../lib/password';
import { createSession, destroySession } from '../lib/session';
import { audit } from '../lib/db';
import { sendMail } from '../lib/mail';

export const authApp = new Hono<AppContext>();

authApp.get('/login', (c) => {
  const next = c.req.query('next') ?? '';
  return c.html(renderLogin({ next }));
});

authApp.post('/login', async (c) => {
  const form = await c.req.formData();
  const email = String(form.get('email') ?? '').toLowerCase().trim();
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '');

  if (!email || !password) {
    return c.html(renderLogin({ email, error: 'Vul e-mail en wachtwoord in.', next }));
  }

  const user = await c.env.DB.prepare(
    'SELECT id, pw_hash FROM users WHERE email = ?',
  )
    .bind(email)
    .first<{ id: number; pw_hash: string }>();

  // Constant-tijd: hash een dummy als gebruiker niet bestaat.
  const dummy = '$pbkdf2$210000$AAAA$AAAA';
  const ok = user
    ? await verifyPassword(password, user.pw_hash)
    : (await verifyPassword(password, dummy), false);

  if (!user || !ok) {
    await audit(c.env, null, 'login.fail', email);
    return c.html(
      renderLogin({ email, error: 'Onjuiste inloggegevens.', next }),
      401,
    );
  }

  await createSession(c, user.id);
  await c.env.DB.prepare(
    'UPDATE users SET last_login = unixepoch() WHERE id = ?',
  )
    .bind(user.id)
    .run();
  await audit(c.env, user.id, 'login.ok', null);

  const redirectTo = next && next.startsWith('/admin') ? next : '/admin';
  return c.redirect(redirectTo);
});

authApp.post('/logout', async (c) => {
  await destroySession(c);
  return c.redirect('/admin/login');
});

// ── Wachtwoord vergeten ──────────────────────────────────────────────

authApp.get('/forgot', (c) => c.html(renderForgot({})));

authApp.post('/forgot', async (c) => {
  const form = await c.req.formData();
  const email = String(form.get('email') ?? '').toLowerCase().trim();
  const user = await c.env.DB.prepare(
    'SELECT id, name FROM users WHERE email = ?',
  )
    .bind(email)
    .first<{ id: number; name: string }>();

  if (user) {
    const token = randomToken(32);
    const expires = Math.floor(Date.now() / 1000) + 3600;
    await c.env.DB.prepare(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
    )
      .bind(token, expires, user.id)
      .run();
    const resetUrl = `https://${c.env.SITE_HOST}/admin/reset?token=${token}`;
    await sendMail(c.env, {
      to: email,
      subject: 'Wachtwoord resetten — Stichting Gemeenschapsservice Nijmegen Stad en Land',
      text: `Hoi ${user.name},

Je hebt een wachtwoordreset aangevraagd voor het beheer van de website van de Stichting Gemeenschapsservice Nijmegen Stad en Land.
Klik op onderstaande link om een nieuw wachtwoord in te stellen (geldig 1 uur):

${resetUrl}

Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.`,
    });
    await audit(c.env, user.id, 'reset.requested', null);
  }

  // Altijd dezelfde respons om enumeratie te voorkomen.
  return c.html(renderForgot({ sent: true }));
});

authApp.get('/reset', async (c) => {
  const token = c.req.query('token') ?? '';
  if (!token) return c.redirect('/admin/login');
  return c.html(renderReset({ token }));
});

authApp.post('/reset', async (c) => {
  const form = await c.req.formData();
  const token = String(form.get('token') ?? '');
  const pw = String(form.get('password') ?? '');
  const pw2 = String(form.get('password2') ?? '');

  if (pw.length < 10) {
    return c.html(renderReset({ token, error: 'Wachtwoord moet minimaal 10 tekens zijn.' }));
  }
  if (pw !== pw2) {
    return c.html(renderReset({ token, error: 'Wachtwoorden komen niet overeen.' }));
  }

  const now = Math.floor(Date.now() / 1000);
  const user = await c.env.DB.prepare(
    'SELECT id FROM users WHERE reset_token = ? AND reset_expires > ?',
  )
    .bind(token, now)
    .first<{ id: number }>();

  if (!user) {
    return c.html(
      renderReset({ token, error: 'Resetlink is verlopen. Vraag een nieuwe aan.' }),
    );
  }

  const hash = await hashPassword(pw);
  await c.env.DB.prepare(
    'UPDATE users SET pw_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
  )
    .bind(hash, user.id)
    .run();
  await audit(c.env, user.id, 'reset.completed', null);
  await createSession(c, user.id);
  return c.redirect('/admin');
});

function randomToken(bytes: number): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
