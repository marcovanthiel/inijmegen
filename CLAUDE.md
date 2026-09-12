# CLAUDE.md — inijmegen.nl

Gedeeld overdrachtsdocument voor toekomstige Claude-sessies én Marco.
Houd dit bestand actueel.

## Project

Website voor de **Stichting Gemeenschapsservice Nijmegen Stad en
Land** (ANBI, opgericht 23 mei 1984). Vervangt de WordPress-site
op `gemeenschapsservicenijmegensenl.nl`.

Sinds 2026-06-19 is dit géén statische site meer maar een
Cloudflare Worker met content in D1 + PDFs in R2 — zodat het bestuur
zelf via een admin-UI teksten en jaarstukken kan beheren.

## Architectuur

```
                   ┌─────────────────────┐
   inijmegen.nl ──▶│   Cloudflare Worker │
                   │  (Hono, src/index)  │
                   └──────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   D1 (DB)              R2 (PDC)              ASSETS-binding
   • users              • PDF-bestanden       • CSS/JS/img
   • sessions           per jaar              uit ./public/assets
   • pages              jaarstukken/
   • settings              <year>/
   • jaarstukken             <file>.pdf
   • audit_log
```

- **Publieke site** wordt server-side gerenderd vanuit `pages` + `settings` +
  `jaarstukken` in D1, met Cache-Tag-headers en `cache.delete` op slug bij
  een save.
- **Admin** onder `/admin/*` met email + wachtwoord (PBKDF2, sessie-cookie
  HMAC-getekend, sessions in D1 voor revocation).
- **AI-hulp**: Claude Haiku 4.5 via `/admin/api/ai/transform`. Stijlgids in
  `src/routes/ai.ts` (formele toon, u-vorm, ANBI-context).

## Hosting & deploy

- **Repo**: `marcovanthiel/inijmegen` (public)
- **Cloudflare account-ID**: `04865fcd4034789d3970c1b51950227c`
- **Zone-ID inijmegen.nl**: `ba3e94308254e738fe3cb55be0db524d`
- **Worker-service**: `inijmegen`
- **D1 database**: `inijmegen-cms` (binding `DB`)
- **R2 bucket**: `inijmegen-pdc` (binding `PDC`)

### Pipeline

```
push naar main → .github/workflows/deploy.yml
              → npm ci
              → cloudflare/wrangler-action@v3 (wrangler deploy)
              → Worker live in ~15s
```

Vereiste GH secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Vereiste Worker-secrets (via `wrangler secret put <NAME>`):
- `SESSION_SECRET` — 32+ random bytes hex, voor cookie HMAC
- `ANTHROPIC_API_KEY` — voor AI-hulp in admin
- (mail loopt via de Cloudflare Email Sending-binding `EMAIL`, geen key nodig)

Vars in `wrangler.toml` `[vars]`: `SITE_NAME`, `SITE_HOST`, `MAIL_FROM`.

## Lokaal ontwikkelen

```bash
npm install
npm run db:apply:local    # 001_init.sql in lokale D1
npm run seed:local        # 002_seed.sql (pages + settings)

# .dev.vars aanmaken met SESSION_SECRET en ANTHROPIC_API_KEY
echo "SESSION_SECRET=$(node -e 'process.stdout.write(require(\"crypto\").randomBytes(32).toString(\"hex\"))')" > .dev.vars
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .dev.vars

npm run dev               # wrangler dev op http://127.0.0.1:8787
```

Voor admin-test lokaal: handmatig een user in D1 invoegen met
`pw_hash` van `scripts/create-first-user.sh` (of via hashPassword in een
node-snippet).

## Eerste-keer-deploy (productie)

1. `wrangler login` (eenmalig)
2. `wrangler d1 create inijmegen-cms` → `database_id` in `wrangler.toml` zetten
3. `wrangler r2 bucket create inijmegen-pdc`
4. `wrangler secret put SESSION_SECRET` (random 32-byte hex)
5. `wrangler secret put ANTHROPIC_API_KEY`
6. `wrangler email sending enable goededoelennijmegenstadenland.nl` (Email Sending onboarden; zet DNS)
7. `npm run db:apply:remote && npm run seed:remote`
8. `bash scripts/seed-pdc.sh remote` (oude PDC-PDFs → R2 + D1)
9. `git push` of `npm run deploy`
10. `bash scripts/create-first-user.sh "<naam>" <email> admin` → reset-link openen

## Repo-structuur

```
.
├── wrangler.toml          # Worker-config met D1 + R2 bindings
├── package.json
├── tsconfig.json
├── schema/
│   ├── 001_init.sql       # tabellen
│   └── 002_seed.sql       # initiële pages + settings
├── scripts/
│   ├── seed-pdc.sh        # bestaande pdc/-PDF's → R2 + D1
│   └── create-first-user.sh
├── src/
│   ├── index.ts           # Hono entry, routing, security headers
│   ├── env.ts             # Env types + SessionUser
│   ├── lib/
│   │   ├── password.ts    # PBKDF2 hash + verify
│   │   ├── session.ts     # signed cookie, requireAuth middleware
│   │   ├── db.ts          # query helpers + audit()
│   │   ├── markdown.ts    # marked + sanitize + interpolate
│   │   ├── html.ts        # html`` tagged template (auto-escape)
│   │   ├── cache.ts       # purgePaths via Workers Cache API
│   │   └── mail.ts        # Cloudflare Email Sending (EMAIL-binding) voor reset/uitnodigingen
│   ├── routes/
│   │   ├── public.ts      # publieke site + PDC-streaming + sitemap
│   │   ├── auth.ts        # login, logout, forgot, reset
│   │   ├── admin.ts       # dashboard, pages, jaarstukken, settings, users
│   │   └── ai.ts          # Claude Haiku transform endpoint
│   └── views/
│       ├── layout.ts      # publieke site layout
│       ├── public.ts      # render publieke pagina + 404
│       ├── admin-layout.ts
│       └── admin-views.ts # alle admin-screens
├── public/
│   ├── assets/
│   │   ├── css/style.css  # publieke site
│   │   ├── css/admin.css  # admin UI
│   │   ├── js/admin.js    # admin UI (AI-paneel + preview)
│   │   └── img/           # hero-foto's + favicon
│   └── robots.txt
└── pdc/                   # tijdelijk: bron-PDF's vóór seed-pdc.sh
```

## Content-model

- **`pages`**: één rij per slug (`/`, `/stichting`, etc.). Velden voor
  hero (eyebrow/title/lede/image/compact), SEO (title/description) en
  hoofdtekst (`body_md` in markdown).
- **`settings`**: key-value voor stichting-gegevens die overal terugkomen
  (kvk, rsin, iban, voorzitter, contact_voorzitter, contact_secretaris,
  contact_penningmeester, ...). Tekst op pagina's gebruikt `{{kvk}}`-style
  placeholders die voor render worden vervangen. Wijzig één keer in
  Gegevens → het past zich overal aan. De drie `contact_*`-keys voeden de
  footer (HTML toegestaan). Afspraak bestuur (sept 2026): géén fysieke
  adressen op de site, alleen e-mailadressen.
- **`jaarstukken`**: één rij per jaar, met R2-key naar de PDF. Upload via
  admin → R2 `put` + D1 upsert + cache purge van `/jaarstukken`.

## AI-stijlgids

Staat in `src/routes/ai.ts` als `STYLE_GUIDE`. Vier vaste acties
(improve/shorten/formal/check) + vrij instructie-veld. Model:
`claude-haiku-4-5-20251001`. AI krijgt nooit secrets — alleen de
geselecteerde tekst + de stijlgids.

## Bekende keuzes

- **Geen `_redirects`**: handmatig in `public.ts` als 301-handler.
- **`run_worker_first = true`** zodat Worker code voor assets draait
  (security headers + admin auth).
- **PBKDF2 i.p.v. bcrypt/argon2**: native via WebCrypto, geen wasm.
- **Hono i.p.v. custom router**: handler-compositie + middleware,
  TypeScript-vriendelijk, ~13kb.
- **Cache purge per pagina** (geen Cache-Tag API, want die vereist
  Enterprise). `cache.delete` per slug is voldoende.

## E-mail: spambescherming + role-aliassen

- **Obfuscatie (live sinds 10-9-2026)**: `src/lib/obfuscate.ts` entity-encodeert
  álle e-mailadressen (incl. `mailto:`) in de publieke HTML, centraal in
  `renderLayout`. Browsers decoderen transparant; harvesters die op
  @-patronen grepen zien niets. Geldt automatisch ook voor adressen die het
  bestuur later via de admin toevoegt.
- **Role-aliassen (deels open)**: voorzitter@ / secretaris@ /
  penningmeester@inijmegen.nl via Cloudflare Email Routing, forwards naar de
  privé-adressen van René / Marijke / Hans. Volgorde:
  1. API-token rechten geven (Account: Email Routing Addresses Edit; Zone:
     Email Routing Rules Edit, DNS Edit, Zone Settings Edit) óf wizard in
     dashboard → zone inijmegen.nl → E-mail → Email Routing.
  2. Routing aanzetten (zet MX + SPF; zone had nog géén mailrecords) en de
     drie regels + bestemmingsadressen aanmaken. Elk bestuurslid krijgt een
     verificatiemail van Cloudflare en moet die bevestigen.
  3. Pas daarná `scripts/switch-mail-aliases.sh` draaien: zet settings +
     paginateksten in live D1 om naar de aliassen (eerder omzetten = bounces).
  4. Testmail naar de drie aliassen sturen en doorkomst verifiëren.
- **Uitgaande mail via Cloudflare Email Sending** (sinds 11-9-2026, vervangt
  Resend): de Worker verstuurt via de `send_email`-binding `EMAIL`
  (`src/lib/mail.ts`, `env.EMAIL.send({...})`). Geen API-key. Afzender
  `MAIL_FROM=noreply@goededoelennijmegenstadenland.nl`; dat domein moet
  onboarded zijn (`wrangler email sending enable ...`, zet zelf DKIM/SPF-DNS).
  De binding is "unrestricted", dus mag naar willekeurige ontvangers (wachtwoord-
  reset naar bestuursleden). Inkomende role-aliassen zijn een aparte kwestie
  (Email Routing, zie hieronder).

## Domeinmigratie (afgerond 11-9-2026)

De site draait sinds 11-9-2026 op **goededoelennijmegenstadenland.nl**
(+ www). Uitgevoerd: zone actief in Cloudflare (`efe5defd90533813df87af1878200e32`),
beide hostnames als custom domain aan de Worker `inijmegen` gekoppeld,
`SITE_HOST` en de sitemap-URL in `public/robots.txt` omgezet. **inijmegen.nl
(+ www) is losgekoppeld van de Worker; er is op verzoek GEEN redirect** — die
URL's serveren de site niet meer. De Worker-service houdt de naam `inijmegen`
(hernoemen is onnodig en disruptief).

**Uitgaande mail: omgezet naar Cloudflare Email Sending (11/12-9-2026) — WERKT.**
Code + config live (binding `EMAIL`, `MAIL_FROM=noreply@goededoelennijmegenstadenland.nl`,
Resend verwijderd). Domein **onboarded 12-9-2026** met
`wrangler email sending enable goededoelennijmegenstadenland.nl` (token kreeg
Email Sending: Edit). Cloudflare zette zelf de mailrecords: MX + DKIM + SPF op
`cf-bounce.goededoelennijmegenstadenland.nl` (return-path/selector = `cf-bounce`)
en `_dmarc` op `p=reject`. Subdomein enabled (tag 50f3029e…). Testmail vanaf
noreply@ bevestigd werkend (kort na onboarden gaf de send even
`sender_not_configured` = verificatie-propagatie; loste vanzelf op). NB in prod is
als Worker-secret alléén `SESSION_SECRET` gezet; `ANTHROPIC_API_KEY` ontbreekt,
dus AI-hulp werkt nog niet (aparte Anthropic-key nodig).

**Inkomende role-aliassen (apart, nog open).** voorzitter@/secretaris@/
penningmeester@goededoelennijmegenstadenland.nl via **Email Routing**: token mist
die rechten (Email Routing Rules/Addresses Edit) én de drie bestuursleden moeten
elk een Cloudflare-verificatiemail bevestigen. Daarna de displayed adressen
omzetten met `DOMAIN=goededoelennijmegenstadenland.nl bash
scripts/switch-mail-aliases.sh` (+ fallbacks in `src/views/layout.ts` + seed).
Bestemmingen bestuur staan in dat script (Gmail/wxs-adressen). Zolang dit niet
staat, tonen footer/bestuurspagina nog @inijmegen.nl-adressen die niet ontvangen.

- Cosmetische inijmegen.nl-vermeldingen in codecommentaar (`src/index.ts`,
  `src/lib/cache.ts`) zijn gelaten; puur toelichting, geen functie.

## Changelog

- **2026-09-11** (2): Uitgaande mail van **Resend → Cloudflare Email Sending**
  (`send_email`-binding `EMAIL`, `src/lib/mail.ts` herschreven, RESEND uit env +
  wrangler + docs, `MAIL_FROM`=noreply@goededoelennijmegenstadenland.nl).
  Typecheck + dry-run groen (binding "unrestricted"). Resteert: domein onboarden
  (`wrangler email sending enable`) — tokenrecht Email Sending edit nodig.
- **2026-09-11**: Domeinmigratie naar **goededoelennijmegenstadenland.nl**
  (+ www) afgerond: custom domains aan de Worker, `SITE_HOST` + sitemap
  omgezet, **inijmegen.nl losgekoppeld zonder redirect** (op verzoek).
  E-mail (MAIL_FROM + role-aliassen) bewust nog op inijmegen.nl — zie
  "Domeinmigratie".
- **2026-09-10** (5): Spambescherming e-mail: entity-encoding van alle
  adressen in publieke HTML (`src/lib/obfuscate.ts`), role-aliassen in
  fallbacks + seed, `scripts/switch-mail-aliases.sh` voor de live-D1-flip.
  Open: Email Routing aanzetten (token-rechten of dashboard) en daarna de
  flip draaien — zie sectie "E-mail".
- **2026-09-10** (4): Toegankelijkheidsverklaring toegevoegd op
  `/toegankelijkheid` (D1-pagina, in_nav 0, ook in seed) + footerlink in
  kolom Documenten; streven WCAG 2.2 AA, melden via de secretaris.
- **2026-09-10** (3): Naamswijziging: de site heet **Goede Doelen
  Nijmegen Stad en Land**, met de stichtingsnaam als subtitel in header,
  footer en admin. SITE_NAME-var en paginatitels (D1 + seed) mee. Mobiel
  logoblok compacter. Toekomstig domein: goededoelennijmegenstadenland.nl
  (zie "Geplande domeinmigratie").
- **2026-09-10** (2): Onderhoudsronde: hono 4.13.7, marked 18.0.12,
  wrangler 4.130, typescript 7.0.2, setup-node v7 (SHA-gepind);
  dependabot-PR's #4/#6/#13/#14 als één commit verwerkt en gesloten.
  `npm audit` en dependabot-alerts: 0. Let op: `overrides.sharp ^0.35.4`
  in package.json vangt libheif-CVE's onder miniflare af — verwijderen
  zodra miniflare zelf sharp ≥ 0.35.4 meelevert.
- **2026-09-10**: Tekstwijzigingen bestuur (doc MvV/HH): nieuwe
  doelstellingstekst op /stichting, e-mailadres per bestuurslid op
  /bestuur, fysieke adressen overal verwijderd (settings + footer +
  fallbacks + seed), nieuwe setting `contact_voorzitter`. Live D1 direct
  bijgewerkt via `wrangler d1 execute --remote` (edge-cache verloopt
  binnen 5 min vanzelf; audit_log heeft van zulke directe edits géén
  regel). Fix: `@cloudflare/workers-types` → v5 (peer-eis wrangler
  4.116; npm ci in CI faalde op ERESOLVE) en de dependabot-ignore voor
  die major verwijderd.
- **2026-06-19**: Statische site → dynamische Worker. D1 voor content,
  R2 voor PDC, admin met email/wachtwoord, AI-hulp via Claude Haiku
  4.5. `build.py` verwijderd.
- **2026-06-17**: Eerste statische versie.
