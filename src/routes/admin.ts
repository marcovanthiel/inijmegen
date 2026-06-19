import { Hono } from 'hono';
import type { AppContext } from '../env';
import { requireAuth } from '../lib/session';
import {
  listPages,
  listJaarstukken,
  getPage,
  getSettings,
  audit,
  type UserRow,
} from '../lib/db';
import {
  renderDashboard,
  renderPagesList,
  renderPageEdit,
  renderJaarstukken,
  renderSettings,
  renderUsers,
} from '../views/admin-views';
import { purgePaths, purgeAllPublic } from '../lib/cache';
import { hashPassword } from '../lib/password';
import { sendMail } from '../lib/mail';

export const adminApp = new Hono<AppContext>();

// Alle admin-routes vereisen auth.
adminApp.use('*', requireAuth);

// ── Dashboard ────────────────────────────────────────────────────────

adminApp.get('/', async (c) => {
  const user = c.get('user')!;
  const [pages, jaarstukken] = await Promise.all([
    listPages(c.env),
    listJaarstukken(c.env),
  ]);
  return c.html(renderDashboard({ user, pages, jaarstukken }));
});

// ── Pages ────────────────────────────────────────────────────────────

adminApp.get('/pages', async (c) => {
  const user = c.get('user')!;
  const pages = await listPages(c.env);
  return c.html(renderPagesList({ user, pages }));
});

const HERO_IMAGES = [
  'hero-home-classic.jpeg',       // Kronenburgertoren met fontein
  'hero-stichting-classic.jpeg',  // De Oversteek bij nacht
  'hero-bestuur-classic.jpeg',    // Waalbrug overdag
  'hero-home.jpeg',
  'hero-stichting.jpeg',
  'hero-bestuur.jpeg',
  'hero-beleid.jpeg',
  'hero-voorwaarden.jpeg',
  'hero-jaarstukken.jpeg',
];

adminApp.get('/pages/:slug', async (c) => {
  const user = c.get('user')!;
  const slug = decodeURIComponent(c.req.param('slug'));
  const page = await getPage(c.env, slug);
  if (!page) return c.redirect('/admin/pages');
  return c.html(
    renderPageEdit({
      user,
      page,
      heroImages: HERO_IMAGES,
      saved: c.req.query('saved') === '1',
    }),
  );
});

adminApp.post('/pages/:slug', async (c) => {
  const user = c.get('user')!;
  const slug = decodeURIComponent(c.req.param('slug'));
  const form = await c.req.formData();

  await c.env.DB.prepare(
    `UPDATE pages SET
       title = ?, description = ?,
       hero_image = ?, hero_eyebrow = ?, hero_title = ?, hero_lede = ?,
       hero_compact = ?, body_md = ?,
       updated_at = unixepoch(), updated_by = ?
     WHERE slug = ?`,
  )
    .bind(
      String(form.get('title') ?? ''),
      String(form.get('description') ?? ''),
      String(form.get('hero_image') ?? 'hero-home.jpeg'),
      String(form.get('hero_eyebrow') ?? ''),
      String(form.get('hero_title') ?? ''),
      String(form.get('hero_lede') ?? ''),
      form.get('hero_compact') ? 1 : 0,
      String(form.get('body_md') ?? ''),
      user.id,
      slug,
    )
    .run();

  await purgePaths(c.env, [slug]);
  await audit(c.env, user.id, 'page.save', slug);

  return c.redirect(`/admin/pages/${encodeURIComponent(slug)}?saved=1`);
});

// ── Jaarstukken ──────────────────────────────────────────────────────

adminApp.get('/jaarstukken', async (c) => {
  const user = c.get('user')!;
  const items = await listJaarstukken(c.env);
  const flash = parseFlash(c.req.query('flash'));
  return c.html(renderJaarstukken({ user, items, flash }));
});

adminApp.post('/jaarstukken', async (c) => {
  const user = c.get('user')!;
  const form = await c.req.formData();
  const year = parseInt(String(form.get('year') ?? '0'), 10);
  const title = String(form.get('title') ?? '').trim();
  const published = String(form.get('published') ?? '').trim();
  const file = form.get('pdf') as unknown as
    | { name: string; type: string; size: number; stream: () => ReadableStream }
    | string
    | null;

  if (!year || !title || !published || !file || typeof file === 'string' || !file.name) {
    return c.redirect('/admin/jaarstukken?flash=err:Vul alle velden in.');
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return c.redirect('/admin/jaarstukken?flash=err:Alleen PDF-bestanden zijn toegestaan.');
  }
  if (file.size > 25 * 1024 * 1024) {
    return c.redirect('/admin/jaarstukken?flash=err:PDF is groter dan 25 MB.');
  }

  const safeName = `jaarstukken-${year}.pdf`;
  const r2_key = `jaarstukken/${year}/${safeName}`;

  await c.env.PDC.put(r2_key, file.stream(), {
    httpMetadata: { contentType: 'application/pdf' },
  });

  await c.env.DB.prepare(
    `INSERT INTO jaarstukken (year, title, published, r2_key, filename, size_bytes, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(year) DO UPDATE SET
       title = excluded.title,
       published = excluded.published,
       r2_key = excluded.r2_key,
       filename = excluded.filename,
       size_bytes = excluded.size_bytes,
       uploaded_at = unixepoch(),
       uploaded_by = excluded.uploaded_by`,
  )
    .bind(year, title, published, r2_key, safeName, file.size, user.id)
    .run();

  await purgePaths(c.env, ['/jaarstukken']);
  await audit(c.env, user.id, 'jaarstuk.upload', String(year), {
    size: file.size,
  });

  return c.redirect(`/admin/jaarstukken?flash=ok:Jaarstuk ${year} opgeslagen.`);
});

adminApp.post('/jaarstukken/:id/delete', async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'), 10);
  const row = await c.env.DB.prepare(
    'SELECT year, r2_key FROM jaarstukken WHERE id = ?',
  )
    .bind(id)
    .first<{ year: number; r2_key: string }>();
  if (!row) return c.redirect('/admin/jaarstukken?flash=err:Niet gevonden.');

  await c.env.PDC.delete(row.r2_key);
  await c.env.DB.prepare('DELETE FROM jaarstukken WHERE id = ?').bind(id).run();
  await purgePaths(c.env, ['/jaarstukken']);
  await audit(c.env, user.id, 'jaarstuk.delete', String(row.year));

  return c.redirect(`/admin/jaarstukken?flash=ok:Jaarstuk ${row.year} verwijderd.`);
});

// ── Settings ─────────────────────────────────────────────────────────

adminApp.get('/settings', async (c) => {
  const user = c.get('user')!;
  const settings = await getSettings(c.env);
  const flash = parseFlash(c.req.query('flash'));
  return c.html(renderSettings({ user, settings, flash }));
});

adminApp.post('/settings', async (c) => {
  const user = c.get('user')!;
  const form = await c.req.formData();
  const stmts = [];
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string') continue;
    if (!/^[a-z_][a-z0-9_]*$/i.test(key)) continue;
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO settings (key, value, updated_by) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value,
           updated_at = unixepoch(), updated_by = excluded.updated_by`,
      ).bind(key, value, user.id),
    );
  }
  if (stmts.length > 0) await c.env.DB.batch(stmts);
  await purgeAllPublic(c.env);
  await audit(c.env, user.id, 'settings.save', null);
  return c.redirect('/admin/settings?flash=ok:Opgeslagen.');
});

// ── Users (alleen voor admin) ────────────────────────────────────────

adminApp.get('/users', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.redirect('/admin');
  const res = await c.env.DB.prepare(
    'SELECT * FROM users ORDER BY created_at',
  ).all<UserRow>();
  const flash = parseFlash(c.req.query('flash'));
  return c.html(
    renderUsers({ user, users: res.results ?? [], flash }),
  );
});

adminApp.post('/users', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.redirect('/admin');
  const form = await c.req.formData();
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').toLowerCase().trim();
  const role = String(form.get('role') ?? 'editor');
  if (!name || !email) {
    return c.redirect('/admin/users?flash=err:Naam en e-mail zijn verplicht.');
  }
  const token = Array.from(
    crypto.getRandomValues(new Uint8Array(32)),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
  const expires = Math.floor(Date.now() / 1000) + 7 * 86400;
  const placeholderHash = await hashPassword(token);

  try {
    await c.env.DB.prepare(
      `INSERT INTO users (email, name, pw_hash, role, reset_token, reset_expires)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(email, name, placeholderHash, role === 'admin' ? 'admin' : 'editor', token, expires)
      .run();
  } catch (e) {
    return c.redirect('/admin/users?flash=err:Dat e-mailadres bestaat al.');
  }

  const url = `https://${c.env.SITE_HOST}/admin/reset?token=${token}`;
  await sendMail(c.env, {
    to: email,
    subject: 'Welkom bij het beheer van de Stichting Gemeenschapsservice Nijmegen Stad en Land',
    text: `Hoi ${name},

Je bent uitgenodigd om mee te werken aan de website van Stichting
Gemeenschapsservice Nijmegen Stad en Land.

Stel je wachtwoord in via onderstaande link (geldig 7 dagen):

${url}

Hierna log je in op https://${c.env.SITE_HOST}/admin met je e-mailadres
en het wachtwoord dat je net hebt gekozen.`,
  });
  await audit(c.env, user.id, 'user.invite', email);
  return c.redirect('/admin/users?flash=ok:Uitnodiging verstuurd.');
});

adminApp.post('/users/:id/delete', async (c) => {
  const user = c.get('user')!;
  if (user.role !== 'admin') return c.redirect('/admin');
  const id = parseInt(c.req.param('id'), 10);
  if (id === user.id) return c.redirect('/admin/users?flash=err:Je kunt jezelf niet verwijderen.');
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  await audit(c.env, user.id, 'user.delete', String(id));
  return c.redirect('/admin/users?flash=ok:Gebruiker verwijderd.');
});

function parseFlash(
  raw: string | undefined,
): { type: 'ok' | 'err'; msg: string } | undefined {
  if (!raw) return undefined;
  const m = raw.match(/^(ok|err):(.*)$/);
  if (!m) return undefined;
  return { type: m[1] as 'ok' | 'err', msg: m[2] };
}
