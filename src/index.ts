/**
 * Worker-entrypoint voor inijmegen.nl.
 *
 * Vroeger was dit een dunne proxy naar Workers Static Assets. Nu host
 * de Worker zelf:
 *   - de publieke site (server-side gerenderd uit D1 + R2)
 *   - /admin/* voor het bestuur (login, pagina-edit, jaarstukken, AI)
 *
 * Statische assets (CSS, hero-foto's, favicon, admin.js) blijven via
 * de ASSETS-binding, gemount onder /assets/*.
 */

import { Hono } from 'hono';
import type { AppContext } from './env';
import { publicApp } from './routes/public';
import { authApp } from './routes/auth';
import { adminApp } from './routes/admin';
import { aiApp } from './routes/ai';
import { render404 } from './views/public';

const app = new Hono<AppContext>();

// 1. www → apex.
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === `www.${c.env.SITE_HOST}`) {
    url.hostname = c.env.SITE_HOST;
    return c.redirect(url.toString(), 301);
  }
  return next();
});

// 2. Security-headers op alle Worker-responses (assets-binding zet eigen
// headers via _headers).
app.use('*', async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'SAMEORIGIN');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()',
  );
  h.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
});

// 3. Statische assets (CSS/JS/img). Worker delegeert naar ASSETS-binding.
app.get('/assets/*', (c) => c.env.ASSETS.fetch(c.req.raw));
app.get('/robots.txt', (c) => c.env.ASSETS.fetch(c.req.raw));
app.get('/favicon.ico', (c) => c.env.ASSETS.fetch(c.req.raw));

// 4. Admin (login + dashboard).
app.route('/admin', authApp);
app.route('/admin', adminApp);
app.route('/admin/api/ai', aiApp);

// 5. Publieke site.
app.route('/', publicApp);

// 6. Fallback 404 (rendert via D1 voor consistente layout).
app.notFound(async (c) => render404(c));

export default {
  fetch: app.fetch,
};
