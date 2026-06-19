import { html, raw, type HtmlString } from '../lib/html';
import type { SessionUser } from '../env';

export interface AdminLayoutOpts {
  title: string;
  user?: SessionUser;
  body: HtmlString;
  active?: string;
  flash?: { type: 'ok' | 'err'; msg: string };
}

export function renderAdminLayout(opts: AdminLayoutOpts): string {
  const { title, user, body, active, flash } = opts;
  return html`<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Beheer · inijmegen.nl</title>
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
${user ? renderTopbar(user, active) : raw('')}
<main class="admin-main">
  ${flash ? html`<div class="flash flash--${flash.type}">${flash.msg}</div>` : raw('')}
  ${body}
</main>
</body>
</html>`.toString();
}

function renderTopbar(user: SessionUser, active?: string): HtmlString {
  const items: Array<[string, string, string]> = [
    ['dashboard', '/admin', 'Overzicht'],
    ['pages', '/admin/pages', "Pagina's"],
    ['jaarstukken', '/admin/jaarstukken', 'Jaarstukken'],
    ['settings', '/admin/settings', 'Gegevens'],
  ];
  if (user.role === 'admin') items.push(['users', '/admin/users', 'Gebruikers']);
  return html`<header class="admin-top">
  <div class="admin-top__inner">
    <a class="admin-brand" href="/admin">
      <strong>inijmegen.nl</strong>
      <span>Beheer</span>
    </a>
    <nav class="admin-nav">
      ${items.map(
        ([key, href, label]) =>
          html`<a class="${key === active ? 'active' : ''}" href="${href}">${label}</a>`,
      )}
    </nav>
    <div class="admin-user">
      <span>${user.name}</span>
      <a href="/" target="_blank" rel="noopener" title="Bekijk site">↗</a>
      <form method="post" action="/admin/logout" class="inline">
        <button type="submit" class="link">Uitloggen</button>
      </form>
    </div>
  </div>
</header>`;
}
