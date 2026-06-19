import { html, raw, type HtmlString } from '../lib/html';
import type { PageRow, JaarstukRow, UserRow } from '../lib/db';
import { renderAdminLayout } from './admin-layout';
import type { SessionUser } from '../env';

// ── Login ────────────────────────────────────────────────────────────

export function renderLogin(opts: {
  email?: string;
  error?: string;
  next?: string;
}): string {
  const body = html`<div class="login-card">
  <div class="login-card__brand">
    <strong>Stichting Gemeenschapsservice</strong>
    <span>Nijmegen Stad en Land</span>
  </div>
  <h1>Inloggen</h1>
  ${opts.error ? html`<div class="flash flash--err">${opts.error}</div>` : raw('')}
  <form method="post" action="/admin/login">
    <input type="hidden" name="next" value="${opts.next ?? ''}">
    <label>
      <span>E-mailadres</span>
      <input type="email" name="email" value="${opts.email ?? ''}" required autofocus autocomplete="username">
    </label>
    <label>
      <span>Wachtwoord</span>
      <input type="password" name="password" required autocomplete="current-password">
    </label>
    <button type="submit" class="btn btn--primary">Inloggen</button>
  </form>
  <p class="muted"><a href="/admin/forgot">Wachtwoord vergeten?</a></p>
</div>`;
  return renderAdminLayout({ title: 'Inloggen', body });
}

export function renderForgot(opts: { sent?: boolean; email?: string }): string {
  const body = html`<div class="login-card">
  <h1>Wachtwoord vergeten</h1>
  ${opts.sent
    ? html`<div class="flash flash--ok">Als dit e-mailadres bekend is, hebben we een resetlink gestuurd.</div><p><a href="/admin/login">Terug naar inloggen</a></p>`
    : html`<form method="post" action="/admin/forgot">
        <label>
          <span>E-mailadres</span>
          <input type="email" name="email" value="${opts.email ?? ''}" required autofocus>
        </label>
        <button type="submit" class="btn btn--primary">Resetlink sturen</button>
      </form>
      <p class="muted"><a href="/admin/login">Terug naar inloggen</a></p>`}
</div>`;
  return renderAdminLayout({ title: 'Wachtwoord vergeten', body });
}

export function renderReset(opts: {
  token: string;
  error?: string;
}): string {
  const body = html`<div class="login-card">
  <h1>Nieuw wachtwoord instellen</h1>
  ${opts.error ? html`<div class="flash flash--err">${opts.error}</div>` : raw('')}
  <form method="post" action="/admin/reset">
    <input type="hidden" name="token" value="${opts.token}">
    <label>
      <span>Nieuw wachtwoord (minimaal 10 tekens)</span>
      <input type="password" name="password" minlength="10" required autofocus autocomplete="new-password">
    </label>
    <label>
      <span>Herhaal wachtwoord</span>
      <input type="password" name="password2" minlength="10" required autocomplete="new-password">
    </label>
    <button type="submit" class="btn btn--primary">Opslaan</button>
  </form>
</div>`;
  return renderAdminLayout({ title: 'Wachtwoord instellen', body });
}

// ── Dashboard ────────────────────────────────────────────────────────

export function renderDashboard(opts: {
  user: SessionUser;
  pages: PageRow[];
  jaarstukken: JaarstukRow[];
}): string {
  const { user, pages, jaarstukken } = opts;
  const lastChanged = [...pages].sort((a, b) => b.updated_at - a.updated_at)[0];
  const body = html`<div class="dash">
  <h1>Welkom, ${user.name.split(' ')[0]}</h1>
  <p class="muted">Hier beheer je de teksten en jaarstukken van inijmegen.nl. Wijzigingen zijn direct zichtbaar op de website.</p>

  <div class="dash-grid">
    <a class="dash-card" href="/admin/pages">
      <h3>Pagina's bewerken</h3>
      <p>${pages.length} pagina${pages.length === 1 ? '' : 's'}</p>
      ${lastChanged ? html`<small>Laatst gewijzigd: ${lastChanged.nav_label} · ${fmtDate(lastChanged.updated_at)}</small>` : raw('')}
    </a>
    <a class="dash-card" href="/admin/jaarstukken">
      <h3>Jaarstukken</h3>
      <p>${jaarstukken.length} document${jaarstukken.length === 1 ? '' : 'en'}</p>
      <small>${jaarstukken[0]?.year ? `Meest recent: ${jaarstukken[0].year}` : 'Nog geen jaarstukken'}</small>
    </a>
    <a class="dash-card" href="/admin/settings">
      <h3>Stichtingsgegevens</h3>
      <p>KvK, IBAN, contactadressen</p>
      <small>Verschijnen automatisch in de footer en op pagina's</small>
    </a>
  </div>

  <div class="dash-tip">
    <h3>Tip: gebruik de AI-assistent</h3>
    <p>Bij elk tekstveld vind je een <strong>AI-knop</strong>. Die helpt je de toon consistent te houden, tikfouten te vinden en de tekst beknopt te maken. De suggestie verschijnt naast je tekst — je beslist zelf of je 'm overneemt.</p>
  </div>
</div>`;
  return renderAdminLayout({ title: 'Overzicht', user, body, active: 'dashboard' });
}

// ── Pages list + edit ────────────────────────────────────────────────

export function renderPagesList(opts: {
  user: SessionUser;
  pages: PageRow[];
}): string {
  const body = html`<div class="container">
  <h1>Pagina's</h1>
  <p class="muted">Klik op een pagina om de inhoud te bewerken.</p>
  <ul class="page-list">
    ${opts.pages.map(
      (p) => html`<li>
      <a href="/admin/pages/${encodeURIComponent(p.slug)}">
        <div>
          <strong>${p.nav_label}</strong>
          <small class="muted">${p.slug}</small>
        </div>
        <small class="muted">${fmtDate(p.updated_at)}</small>
      </a>
    </li>`,
    )}
  </ul>
</div>`;
  return renderAdminLayout({
    title: "Pagina's",
    user: opts.user,
    body,
    active: 'pages',
  });
}

export function renderPageEdit(opts: {
  user: SessionUser;
  page: PageRow;
  heroImages: string[];
  saved?: boolean;
}): string {
  const { page, heroImages, saved } = opts;
  const body = html`<div class="container">
  <div class="page-header">
    <div>
      <a class="back" href="/admin/pages">&larr; Pagina's</a>
      <h1>${page.nav_label}</h1>
      <small class="muted">${page.slug}</small>
    </div>
    <a class="btn btn--ghost" href="${page.slug}" target="_blank" rel="noopener">Open op website ↗</a>
  </div>

  <form method="post" action="/admin/pages/${encodeURIComponent(page.slug)}" class="edit-form" id="editForm">
    <fieldset>
      <legend>Hero (bovenkant van de pagina)</legend>
      <label>
        <span>Bovenste regel (eyebrow)</span>
        <input type="text" name="hero_eyebrow" value="${page.hero_eyebrow}" required>
      </label>
      <label>
        <span>Titel</span>
        ${aiField('hero_title', html`<input type="text" id="f_hero_title" name="hero_title" value="${page.hero_title}" required>`)}
      </label>
      <label>
        <span>Korte ondertitel</span>
        ${aiField('hero_lede', html`<input type="text" id="f_hero_lede" name="hero_lede" value="${page.hero_lede}" required>`)}
      </label>
      <label>
        <span>Hero-foto</span>
        <select name="hero_image">
          ${heroImages.map(
            (img) =>
              html`<option value="${img}" ${img === page.hero_image ? raw('selected') : raw('')}>${img}</option>`,
          )}
        </select>
      </label>
      <label class="inline">
        <input type="checkbox" name="hero_compact" value="1" ${page.hero_compact ? raw('checked') : raw('')}>
        <span>Compacte hero (kleinere hoogte)</span>
      </label>
    </fieldset>

    <fieldset>
      <legend>SEO / metadata</legend>
      <label>
        <span>Browsertitel</span>
        <input type="text" name="title" value="${page.title}" required>
      </label>
      <label>
        <span>Korte omschrijving (voor Google + sociale media)</span>
        <textarea name="description" rows="2" maxlength="200" required>${page.description}</textarea>
      </label>
    </fieldset>

    <fieldset>
      <legend>Hoofdtekst</legend>
      <p class="muted small">Schrijf in <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noopener">Markdown</a>. Gebruik <code>{{kvk}}</code>, <code>{{iban}}</code> etc. om gegevens uit "Stichtingsgegevens" automatisch in te voegen.</p>
      ${aiField(
        'body_md',
        html`<textarea id="f_body_md" name="body_md" rows="20" class="md-editor">${page.body_md}</textarea>`,
        { multiline: true },
      )}
      <div class="preview-box">
        <button type="button" class="btn btn--ghost" id="previewBtn">Voorbeeld tonen</button>
        <div id="previewArea" class="preview hidden"></div>
      </div>
    </fieldset>

    <div class="form-actions">
      <button type="submit" class="btn btn--primary">Opslaan</button>
      ${saved ? html`<span class="saved-indicator">Opgeslagen ✓</span>` : raw('')}
    </div>
  </form>
</div>
${aiPanel()}
<script src="/assets/js/admin.js"></script>`;
  return renderAdminLayout({
    title: page.nav_label,
    user: opts.user,
    body,
    active: 'pages',
  });
}

function aiField(
  name: string,
  field: HtmlString,
  opts: { multiline?: boolean } = {},
): HtmlString {
  return html`<div class="ai-field ${opts.multiline ? 'ai-field--block' : ''}">
    ${field}
    <button type="button" class="ai-btn" data-ai-field="${name}" title="AI-hulp">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>
      AI
    </button>
  </div>`;
}

function aiPanel(): HtmlString {
  return html`<div class="ai-panel hidden" id="aiPanel" aria-hidden="true">
  <div class="ai-panel__head">
    <strong>AI-assistent</strong>
    <button type="button" class="link" id="aiClose">Sluiten</button>
  </div>
  <div class="ai-panel__body">
    <div class="ai-actions">
      <button type="button" class="btn btn--ghost" data-ai-action="improve">Verbeter tekst</button>
      <button type="button" class="btn btn--ghost" data-ai-action="shorten">Maak korter</button>
      <button type="button" class="btn btn--ghost" data-ai-action="formal">Formeler maken</button>
      <button type="button" class="btn btn--ghost" data-ai-action="check">Controleer toon &amp; spelling</button>
    </div>
    <label class="ai-instructions">
      <span>Eigen instructie (optioneel)</span>
      <textarea id="aiInstruction" rows="2" placeholder="Bv: maak het persoonlijker, of voeg een zin toe over..."></textarea>
    </label>
    <button type="button" class="btn btn--primary" id="aiCustomBtn">Eigen instructie uitvoeren</button>
    <div class="ai-result" id="aiResult"></div>
  </div>
</div>`;
}

// ── Jaarstukken ──────────────────────────────────────────────────────

export function renderJaarstukken(opts: {
  user: SessionUser;
  items: JaarstukRow[];
  flash?: { type: 'ok' | 'err'; msg: string };
}): string {
  const body = html`<div class="container">
  <h1>Jaarstukken</h1>
  <p class="muted">Upload jaarstukken als PDF. Ze verschijnen automatisch op de publieke pagina, gesorteerd op jaar.</p>

  <details class="upload-box" open>
    <summary><strong>+ Nieuw jaarstuk toevoegen</strong></summary>
    <form method="post" action="/admin/jaarstukken" enctype="multipart/form-data">
      <div class="row">
        <label>
          <span>Jaar</span>
          <input type="number" name="year" min="1984" max="2100" required>
        </label>
        <label>
          <span>Titel</span>
          <input type="text" name="title" value="Rapport inzake jaarstukken" required>
        </label>
        <label>
          <span>Gepubliceerd</span>
          <input type="text" name="published" placeholder="bv. Mei 2026" required>
        </label>
      </div>
      <label>
        <span>PDF-bestand</span>
        <input type="file" name="pdf" accept="application/pdf" required>
      </label>
      <button type="submit" class="btn btn--primary">Uploaden</button>
    </form>
  </details>

  <table class="data-table">
    <thead>
      <tr><th>Jaar</th><th>Titel</th><th>Gepubliceerd</th><th>Grootte</th><th></th></tr>
    </thead>
    <tbody>
      ${opts.items.map(
        (j) => html`<tr>
        <td><strong>${j.year}</strong></td>
        <td>${j.title}</td>
        <td>${j.published}</td>
        <td class="muted">${j.size_bytes ? fmtBytes(j.size_bytes) : ''}</td>
        <td class="actions">
          <a href="/pdc/${j.year}" target="_blank" rel="noopener" class="link">Bekijk</a>
          <form method="post" action="/admin/jaarstukken/${j.id}/delete" class="inline" onsubmit="return confirm('Jaarstuk ${j.year} verwijderen?')">
            <button type="submit" class="link link--danger">Verwijderen</button>
          </form>
        </td>
      </tr>`,
      )}
    </tbody>
  </table>
</div>`;
  return renderAdminLayout({
    title: 'Jaarstukken',
    user: opts.user,
    body,
    active: 'jaarstukken',
    flash: opts.flash,
  });
}

// ── Settings ─────────────────────────────────────────────────────────

export function renderSettings(opts: {
  user: SessionUser;
  settings: Record<string, string>;
  flash?: { type: 'ok' | 'err'; msg: string };
}): string {
  const fields: Array<[string, string, string, 'text' | 'textarea']> = [
    ['kvk', 'KvK-nummer', '41056683', 'text'],
    ['rsin', 'RSIN', '806308527', 'text'],
    ['iban', 'IBAN', 'NL73 ABNA 0498 5374 39', 'text'],
    ['opgericht', 'Oprichtingsdatum', '23 mei 1984', 'text'],
    ['voorzitter', 'Voorzitter', 'René Wilderom', 'text'],
    ['penningmeester', 'Penningmeester', 'Hans Hendriks', 'text'],
    ['secretaris', 'Secretaris', 'Marijke van Veen', 'text'],
    ['contact_secretaris', 'Adres secretaris (HTML toegestaan)', '', 'textarea'],
    ['contact_penningmeester', 'Adres penningmeester (HTML toegestaan)', '', 'textarea'],
  ];
  const body = html`<div class="container">
  <h1>Stichtingsgegevens</h1>
  <p class="muted">Deze gegevens worden automatisch overal op de site getoond — in de footer én op pagina's waar je <code>{{kvk}}</code>, <code>{{iban}}</code> e.d. gebruikt.</p>

  <form method="post" action="/admin/settings" class="edit-form">
    ${fields.map(
      ([key, label, placeholder, type]) =>
        type === 'textarea'
          ? html`<label>
            <span>${label}</span>
            <textarea name="${key}" rows="3" placeholder="${placeholder}">${opts.settings[key] ?? ''}</textarea>
            <small class="muted">Verwijzing in tekst: <code>{{${key}}}</code></small>
          </label>`
          : html`<label>
            <span>${label}</span>
            <input type="text" name="${key}" value="${opts.settings[key] ?? ''}" placeholder="${placeholder}">
            <small class="muted">Verwijzing in tekst: <code>{{${key}}}</code></small>
          </label>`,
    )}
    <div class="form-actions">
      <button type="submit" class="btn btn--primary">Opslaan</button>
    </div>
  </form>
</div>`;
  return renderAdminLayout({
    title: 'Gegevens',
    user: opts.user,
    body,
    active: 'settings',
    flash: opts.flash,
  });
}

// ── Users ────────────────────────────────────────────────────────────

export function renderUsers(opts: {
  user: SessionUser;
  users: UserRow[];
  flash?: { type: 'ok' | 'err'; msg: string };
}): string {
  const body = html`<div class="container">
  <h1>Gebruikers</h1>
  <p class="muted">Personen met toegang tot het beheer.</p>

  <details class="upload-box">
    <summary><strong>+ Nieuwe gebruiker uitnodigen</strong></summary>
    <form method="post" action="/admin/users">
      <div class="row">
        <label>
          <span>Naam</span>
          <input type="text" name="name" required>
        </label>
        <label>
          <span>E-mailadres</span>
          <input type="email" name="email" required>
        </label>
        <label>
          <span>Rol</span>
          <select name="role">
            <option value="editor">Redacteur</option>
            <option value="admin">Beheerder (kan ook gebruikers toevoegen)</option>
          </select>
        </label>
      </div>
      <button type="submit" class="btn btn--primary">Uitnodiging sturen</button>
      <small class="muted">De nieuwe gebruiker krijgt een e-mail met een link om een wachtwoord in te stellen.</small>
    </form>
  </details>

  <table class="data-table">
    <thead>
      <tr><th>Naam</th><th>E-mail</th><th>Rol</th><th>Laatst ingelogd</th><th></th></tr>
    </thead>
    <tbody>
      ${opts.users.map(
        (u) => html`<tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.role === 'admin' ? 'Beheerder' : 'Redacteur'}</td>
        <td class="muted">${u.last_login ? fmtDate(u.last_login) : 'nooit'}</td>
        <td class="actions">
          ${u.id !== opts.user.id
            ? html`<form method="post" action="/admin/users/${u.id}/delete" class="inline" onsubmit="return confirm('${u.name} verwijderen?')">
            <button type="submit" class="link link--danger">Verwijderen</button>
          </form>`
            : html`<span class="muted">(jij)</span>`}
        </td>
      </tr>`,
      )}
    </tbody>
  </table>
</div>`;
  return renderAdminLayout({
    title: 'Gebruikers',
    user: opts.user,
    body,
    active: 'users',
    flash: opts.flash,
  });
}

// ── Utilities ────────────────────────────────────────────────────────

function fmtDate(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
