// Sessies worden gestored in D1, met een random ID. Cookie bevat alleen
// `<id>.<hmac>` zodat een gestolen cookie zonder DB-record waardeloos is
// en wij elke sessie kunnen intrekken.

import type { Context } from 'hono';
import type { AppContext, SessionUser } from '../env';

const COOKIE_NAME = 'inijmegen_session';
const SESSION_DAYS = 30;

function randomHex(bytes: number): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data),
  );
  return Array.from(new Uint8Array(sig), (x) => x.toString(16).padStart(2, '0')).join('');
}

export async function createSession(
  c: Context<AppContext>,
  userId: number,
): Promise<string> {
  const id = randomHex(32);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const ip = c.req.header('CF-Connecting-IP') ?? '';
  const ua = (c.req.header('User-Agent') ?? '').slice(0, 200);
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, userId, expiresAt, ip, ua)
    .run();
  const sig = await hmac(c.env.SESSION_SECRET, id);
  const value = `${id}.${sig}`;
  c.header(
    'Set-Cookie',
    `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
  );
  return id;
}

export async function destroySession(c: Context<AppContext>): Promise<void> {
  const id = await readSessionId(c);
  if (id) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
  }
  c.header(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}

async function readSessionId(c: Context<AppContext>): Promise<string | null> {
  const raw = c.req.header('Cookie') ?? '';
  const match = raw.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  const [id, sig] = match[1].split('.');
  if (!id || !sig) return null;
  const expected = await hmac(c.env.SESSION_SECRET, id);
  if (expected !== sig) return null;
  return id;
}

export async function loadUser(
  c: Context<AppContext>,
): Promise<SessionUser | null> {
  const id = await readSessionId(c);
  if (!id) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?`,
  )
    .bind(id, now)
    .first<{ id: number; email: string; name: string; role: string }>();
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === 'admin' ? 'admin' : 'editor',
  };
}

export async function requireAuth(
  c: Context<AppContext>,
  next: () => Promise<void>,
): Promise<Response | void> {
  const user = await loadUser(c);
  if (!user) {
    const next_url = encodeURIComponent(new URL(c.req.url).pathname);
    return c.redirect(`/admin/login?next=${next_url}`);
  }
  c.set('user', user);
  await next();
}
