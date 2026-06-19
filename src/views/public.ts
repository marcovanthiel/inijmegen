import type { Context } from 'hono';
import type { AppContext } from '../env';
import {
  getPage,
  listNavPages,
  getSettings,
  listJaarstukken,
} from '../lib/db';
import { renderLayout } from './layout';
import { renderMarkdown, interpolate } from '../lib/markdown';
import { html, raw } from '../lib/html';

export async function renderPage(
  c: Context<AppContext>,
  slug: string,
): Promise<Response> {
  const env = c.env;
  const [page, navPages, settings] = await Promise.all([
    getPage(env, slug),
    listNavPages(env),
    getSettings(env),
  ]);

  if (!page) return render404(c);

  let bodyHtml: string;
  if (slug === '/jaarstukken') {
    bodyHtml = await renderJaarstukkenBody(c);
  } else {
    bodyHtml = renderMarkdown(interpolate(page.body_md, settings));
  }

  const html_out = renderLayout({
    page: {
      title: page.title,
      description: page.description,
      hero_image: page.hero_image,
      hero_eyebrow: page.hero_eyebrow,
      hero_title: page.hero_title,
      hero_lede: page.hero_lede,
      hero_compact: page.hero_compact === 1,
      slug: page.slug,
    },
    navPages,
    settings,
    body: raw(bodyHtml),
  });

  return new Response(html_out, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'Cache-Tag': `page:${page.slug},nav,settings`,
    },
  });
}

async function renderJaarstukkenBody(
  c: Context<AppContext>,
): Promise<string> {
  const [page, jaarstukken, settings] = await Promise.all([
    getPage(c.env, '/jaarstukken'),
    listJaarstukken(c.env),
    getSettings(c.env),
  ]);
  const intro = page
    ? renderMarkdown(interpolate(page.body_md, settings))
    : '';
  const items = jaarstukken.map(
    (j) => html`
      <li>
        <a href="/pdc/${j.year}" target="_blank" rel="noopener">
          <span class="icon">PDF</span>
          <span class="meta">
            <strong>${j.title}</strong>
            <small>${j.published} &middot; PDF</small>
          </span>
          <svg class="download-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>
      </li>`,
  );
  return html`
    <div class="card">
      ${raw(intro)}
      <ul class="pdc-list">${items}
      </ul>
    </div>
  `.toString();
}

export async function render404(c: Context<AppContext>): Promise<Response> {
  const [navPages, settings] = await Promise.all([
    listNavPages(c.env),
    getSettings(c.env),
  ]);
  const body = html`<div class="card"><p>Misschien is de link verouderd. Keer terug naar <a href="/">de homepage</a> of bekijk de <a href="/jaarstukken">jaarstukken</a>.</p></div>`;
  const html_out = renderLayout({
    page: {
      title: 'Pagina niet gevonden · ' + c.env.SITE_NAME,
      description: 'Deze pagina bestaat niet (meer).',
      hero_image: 'hero-home.jpeg',
      hero_eyebrow: '404',
      hero_title: 'Deze pagina bestaat niet',
      hero_lede: '',
      hero_compact: true,
      slug: '',
    },
    navPages,
    settings,
    body,
  });
  return new Response(html_out, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
