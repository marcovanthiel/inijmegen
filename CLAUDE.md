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
- `RESEND_API_KEY` — voor wachtwoord-reset + uitnodigings-mail

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
6. `wrangler secret put RESEND_API_KEY`
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
│   │   └── mail.ts        # Resend voor reset/uitnodigingen
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
  (kvk, rsin, iban, voorzitter, contact_secretaris, ...). Tekst op
  pagina's gebruikt `{{kvk}}`-style placeholders die voor render worden
  vervangen. Wijzig één keer in Gegevens → het past zich overal aan.
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

## Changelog

- **2026-06-19**: Statische site → dynamische Worker. D1 voor content,
  R2 voor PDC, admin met email/wachtwoord, AI-hulp via Claude Haiku
  4.5. `build.py` verwijderd.
- **2026-06-17**: Eerste statische versie.
