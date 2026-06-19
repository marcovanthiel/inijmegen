import { html, raw, type HtmlString } from '../lib/html';
import type { PageRow } from '../lib/db';

export interface LayoutOpts {
  page: {
    title: string;
    description: string;
    hero_image: string;
    hero_eyebrow: string;
    hero_title: string;
    hero_lede: string;
    hero_compact: boolean;
    slug: string;
  };
  navPages: PageRow[];
  settings: Record<string, string>;
  body: HtmlString;
  extraHead?: HtmlString;
}

function nav(navPages: PageRow[], activeSlug: string): HtmlString {
  return html`${navPages.map(
    (p) => html`<li><a class="${p.slug === activeSlug ? 'active' : ''}" href="${p.slug === '/' ? '/' : p.slug}">${p.nav_label}</a></li>`,
  )}`;
}

export function renderLayout(opts: LayoutOpts): string {
  const { page, navPages, settings, body, extraHead } = opts;
  const heroCls = page.hero_compact ? 'hero--compact' : '';
  const navItems = nav(navPages, page.slug);
  const fullHtml = html`<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${raw(page.title)}</title>
<meta name="description" content="${page.description}">
<meta property="og:title" content="${raw(page.title)}">
<meta property="og:description" content="${page.description}">
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_NL">
<meta name="theme-color" content="#17458f">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css">
${extraHead ?? raw('')}
</head>
<body>
<header class="site-header">
  <nav class="nav" aria-label="Hoofdmenu">
    <a class="nav__logo" href="/" aria-label="Home">
      <span>Stichting Gemeenschapsservice</span>
      <small>Nijmegen Stad en Land</small>
    </a>
    <button class="nav__toggle" id="navToggle" aria-label="Menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav__links" id="navLinks">
      ${navItems}
    </ul>
  </nav>
</header>

<section class="hero ${heroCls}">
  <div class="hero__bg" style="background-image:url('/assets/img/${page.hero_image}')"></div>
  <div class="wrap hero__inner">
    <span class="hero__eyebrow">${page.hero_eyebrow}</span>
    <h1>${raw(page.hero_title)}</h1>
    <p class="lede">${raw(page.hero_lede)}</p>
  </div>
</section>

<main class="section">
  <div class="wrap">
${body}
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <h4>Contact</h4>
        <p>Stichting Gemeenschapsservice<br>Nijmegen Stad en Land</p>
        <p class="muted">Aanvragen via de <a href="/voorwaarden">voorwaarden-pagina</a>.</p>
      </div>
      <div>
        <h4>Bestuur</h4>
        <p>${raw(settings.contact_secretaris ?? 'Secretaris<br>Lodewijkstraat 8<br>6585 KM Mook')}</p>
        <p>${raw(settings.contact_penningmeester ?? 'Penningmeester<br>Herckenrathweg 6<br>6681 DD Bemmel')}</p>
      </div>
      <div>
        <h4>Gegevens</h4>
        <p>KvK ${settings.kvk ?? '41056683'}<br>RSIN ${settings.rsin ?? '806308527'}<br>IBAN ${raw(settings.iban ?? 'NL73&nbsp;ABNA&nbsp;0498&nbsp;5374&nbsp;39')}</p>
      </div>
      <div>
        <h4>Documenten</h4>
        <p><a href="/jaarstukken">Jaarstukken</a><br>
        <a href="/beleidsplan">Beleidsplan</a><br>
        <a href="/voorwaarden">Voorwaarden geldelijke bijdrage</a></p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span id="year"></span> Stichting Gemeenschapsservice Nijmegen Stad en Land</span>
      <span>Opgericht 23 mei 1984 &middot; ANBI</span>
    </div>
  </div>
</footer>

<script>
  document.getElementById('year').textContent = new Date().getFullYear();
  const t = document.getElementById('navToggle');
  const l = document.getElementById('navLinks');
  if (t && l) t.addEventListener('click', () => {
    const open = l.classList.toggle('open');
    t.setAttribute('aria-expanded', String(open));
  });
</script>
</body>
</html>`;
  return fullHtml.toString();
}
