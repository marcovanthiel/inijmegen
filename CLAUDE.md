# CLAUDE.md — inijmegen.nl

Gedeeld overdrachtsdocument voor toekomstige Claude-sessies én Marco.
Houd dit bestand actueel.

## Project

Statische website voor de **Stichting Gemeenschapsservice Nijmegen Stad
en Land** (ANBI, opgericht 1984). Vervangt op termijn de WordPress-site
op `gemeenschapsservicenijmegensenl.nl`. Op dit moment een **proef­
migratie** naar `inijmegen.nl`.

## Hosting & deploy

- **Repo**: `marcovanthiel/inijmegen` (public)
- **Live**: `https://inijmegen.nl/` zodra de Cloudflare-zone actief is
  (status was "pending" bij start). Tot die tijd via de Worker-route.
- **Cloudflare account-ID**: `04865fcd4034789d3970c1b51950227c`
- **Zone-ID inijmegen.nl**: `ba3e94308254e738fe3cb55be0db524d`
- **Worker-service**: `inijmegen` (Workers Static Assets, géén code-
  handler)

### Pipeline

```
push naar main → .github/workflows/deploy.yml
              → python3 build.py   (genereert .html-bestanden)
              → cloudflare/wrangler-action@v3
              → site live in ~20s
```

Vereiste GH secrets (zet via `gh secret set`):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Handmatig opnieuw deployen: **Actions tab → Run workflow**.

## Bouwen — `build.py`

Eén Python-script genereert alle pagina's vanuit één template (header,
hero, footer, scripts). Inhoud per pagina staat in `*_body()`-functies
in dezelfde file. Voordeel: changes aan nav of footer hoeven maar op
één plek.

```bash
python3 build.py   # genereert *.html in repo-root
```

GitHub Actions runt dit automatisch vóór elke deploy.

## Repo-structuur

```
.
├── wrangler.toml        # Worker-config (html_handling auto-trailing-slash)
├── .assetsignore        # node_modules + build.py + CLAUDE.md → niet als asset
├── .github/workflows/
│   └── deploy.yml       # build + deploy bij push naar main
├── build.py             # statische page-generator
├── _headers             # security + cache-control
├── robots.txt
├── sitemap.xml
├── index.html           # (gegenereerd) — Home
├── stichting.html       # (gegenereerd) — Over de stichting
├── bestuur.html         # (gegenereerd) — Bestuur
├── beleidsplan.html     # (gegenereerd) — Beleidsplan
├── voorwaarden.html     # (gegenereerd) — Voorwaarden bijdrage
├── jaarstukken.html     # (gegenereerd) — Jaarstukken (PDC-lijst)
├── 404.html             # (gegenereerd)
├── assets/
│   ├── css/style.css
│   ├── img/             # hero-foto's + favicon
│   └── js/
└── pdc/                 # alle jaarstukken-PDFs (PDC)
```

## Inhoudelijke informatie

- ANBI-stichting (KvK 41056683, RSIN 806308527)
- Opgericht 23 mei 1984
- Bestuur: René Wilderom (vz), Hans Hendriks (penn.), Marijke van Veen (secr.)
- Onbezoldigd bestuur
- IBAN NL73 ABNA 0498 5374 39
- Nauw verbonden met Rotaryclub Nijmegen Stad en Land

## PDC (jaarstukken)

9 PDF's in `pdc/`. Lijst staat in `build.py → PDC`. Bij nieuw boekjaar:
- PDF in `pdc/` zetten
- Entry toevoegen aan de `PDC`-lijst bovenin `build.py`
- Commit + push → auto-deploy

## Bekende keuzes

### `_redirects` niet gebruikt
Workers Static Assets ondersteunt `_redirects` met status `200`-rewrite
niet betrouwbaar (zie de issue die we bij nijmegenduckstad.nl hadden).
Gebruik in plaats daarvan `html_handling = "auto-trailing-slash"` in
wrangler.toml — clean URLs zonder extra config.

### `_headers` blijft wel
Workers Static Assets respecteert het Pages-format `_headers`-bestand
voor security-headers en cache-control.

### `.assetsignore` is cruciaal
Anders worden `node_modules/` (workerd-binary 122 MiB) én `CLAUDE.md` /
`build.py` mee-geüpload als asset.

## Changelog

- **2026-06-17**: Eerste commit. Inhoud + 9 PDF's overgenomen uit de
  WordPress-site, structuur opnieuw opgebouwd met `build.py` +
  wrangler/GH-Actions.
