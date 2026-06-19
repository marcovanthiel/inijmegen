import { Hono } from 'hono';
import type { AppContext } from '../env';
import { renderPage, render404 } from '../views/public';
import { listPages } from '../lib/db';

export const publicApp = new Hono<AppContext>();

publicApp.get('/', (c) => renderPage(c, '/'));

// Sitemap.
publicApp.get('/sitemap.xml', async (c) => {
  const pages = await listPages(c.env);
  const host = `https://${c.env.SITE_HOST}`;
  const urls = pages
    .map(
      (p) => `  <url>
    <loc>${host}${p.slug === '/' ? '/' : p.slug}</loc>
    <changefreq>monthly</changefreq>
  </url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
});

// PDC: streamen vanuit R2. `/pdc/<year>` of `/pdc/<filename>`.
publicApp.get('/pdc/:identifier', async (c) => {
  const id = c.req.param('identifier');
  let row: { r2_key: string; filename: string } | null = null;
  if (/^\d{4}$/.test(id)) {
    row = await c.env.DB.prepare(
      'SELECT r2_key, filename FROM jaarstukken WHERE year = ?',
    )
      .bind(parseInt(id, 10))
      .first();
  } else {
    row = await c.env.DB.prepare(
      'SELECT r2_key, filename FROM jaarstukken WHERE filename = ?',
    )
      .bind(id)
      .first();
  }
  if (!row) return render404(c);
  const obj = await c.env.PDC.get(row.r2_key);
  if (!obj) return render404(c);
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${row.filename}"`,
      'Cache-Control': 'public, max-age=2592000',
      'Cache-Tag': `pdc:${row.r2_key}`,
    },
  });
});

// Trailing-slash → non-trailing 301.
publicApp.get('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return c.redirect(url.toString(), 301);
  }
  return next();
});

// Catch-all voor pagina-slugs.
publicApp.get('/:slug', (c) => {
  const slug = '/' + c.req.param('slug');
  return renderPage(c, slug);
});
