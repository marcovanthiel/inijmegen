#!/usr/bin/env python3
"""Statische page-generator voor de stichting-website.

Houdt header/footer op één plek en genereert alle .html bestanden in
de repo-root. Run lokaal vóór commit: `python3 build.py`.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent

NAV = [
    ("/", "Home"),
    ("/stichting", "De stichting"),
    ("/bestuur", "Bestuur"),
    ("/beleidsplan", "Beleidsplan"),
    ("/voorwaarden", "Voorwaarden"),
    ("/jaarstukken", "Jaarstukken"),
]


def nav_html(active: str) -> str:
    items = []
    for href, label in NAV:
        cls = "active" if href == active else ""
        items.append(f'<li><a class="{cls}" href="{href}">{label}</a></li>')
    return "\n      ".join(items)


def page(
    *,
    slug: str,
    title: str,
    description: str,
    nav_active: str,
    hero_image: str,
    hero_eyebrow: str,
    hero_title: str,
    hero_lede: str,
    body: str,
    hero_compact: bool = False,
) -> str:
    nav_items = nav_html(nav_active)
    hero_cls = "hero--compact" if hero_compact else ""
    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_NL">
<meta name="theme-color" content="#17458f">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css">
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
      {nav_items}
    </ul>
  </nav>
</header>

<section class="hero {hero_cls}">
  <div class="hero__bg" style="background-image:url('/assets/img/{hero_image}')"></div>
  <div class="wrap hero__inner">
    <span class="hero__eyebrow">{hero_eyebrow}</span>
    <h1>{hero_title}</h1>
    <p class="lede">{hero_lede}</p>
  </div>
</section>

<main class="section">
  <div class="wrap">
{body}
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
        <p>Secretaris<br>Lodewijkstraat 8<br>6585 KM Mook</p>
        <p>Penningmeester<br>Herckenrathweg 6<br>6681 DD Bemmel</p>
      </div>
      <div>
        <h4>Gegevens</h4>
        <p>KvK 41056683<br>RSIN 806308527<br>IBAN NL73 ABNA 0498 5374 39</p>
      </div>
      <div>
        <h4>Documenten</h4>
        <p><a href="/jaarstukken">Jaarstukken</a><br>
        <a href="/beleidsplan">Beleidsplan</a><br>
        <a href="/voorwaarden">Voorwaarden geldelijke bijdrage</a></p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span id="year">2026</span> Stichting Gemeenschapsservice Nijmegen Stad en Land</span>
      <span>Opgericht 23 mei 1984 &middot; ANBI</span>
    </div>
  </div>
</footer>

<script>
  document.getElementById('year').textContent = new Date().getFullYear();
  const t = document.getElementById('navToggle');
  const l = document.getElementById('navLinks');
  if (t && l) t.addEventListener('click', () => {{
    const open = l.classList.toggle('open');
    t.setAttribute('aria-expanded', String(open));
  }});
</script>
</body>
</html>
"""


# ────────────────────────────────────────────────────────────────────────
# Pagina-inhouden
# ────────────────────────────────────────────────────────────────────────

PDC = [
    ("2025", "rapport-inzake-jaarstukken-2025", "jaarstukken-2025.pdf", "Rapport inzake jaarstukken 2025", "Mei 2026"),
    ("2024", "rapport-inzake-jaarstukken-2024", "jaarstukken-2024.pdf", "Rapport inzake jaarstukken 2024", "Januari 2025"),
    ("2023", "rapport-inzake-jaarstukken-2023", "jaarstukken-2023.pdf", "Rapport inzake jaarstukken 2023", "Mei 2024"),
    ("2022", "rapport-inzake-jaarstukken-2022", "rapport-inzake-jaarstukken-2022.pdf", "Rapport inzake jaarstukken 2022", "Februari 2023"),
    ("2021", "rapport-inzake-jaarstukken-2021", "jaarstukken-2021.pdf", "Rapport inzake jaarstukken 2021", "Februari 2022"),
    ("2020", "rapport-inzake-jaarstukken-2020", "jaarstukken-2020.pdf", "Rapport inzake jaarstukken 2020", "Mei 2021"),
    ("2018", "rapport-inzake-jaarstukken-2018", "jaarstukken-2018.pdf", "Rapport inzake jaarstukken 2018", "Maart 2019"),
    ("2017", "rapport-inzake-jaarstukken-2017", "jaarstukken-2017.pdf", "Rapport inzake jaarstukken 2017", "Februari 2018"),
    ("2016", "rapport-inzake-jaarstukken-2016", "jaarstukken-2016.pdf", "Rapport inzake jaarstukken 2016", "Juni 2017"),
    ("2015", "rapport-inzake-jaarstukken-2015", "jaarstukken-2015.pdf", "Rapport inzake jaarstukken 2015", "Juni 2016"),
]


def home_body() -> str:
    return """
    <p class="lede">De Stichting Gemeenschapsservice Nijmegen Stad en Land ondersteunt sociaal-charitatieve projecten van algemeen maatschappelijk belang &mdash; in Nederland en daarbuiten. Wij werken vanuit een nauwe samenwerking met Rotaryclub Nijmegen Stad en Land.</p>

    <h2>Wat u kunt vinden op deze site</h2>
    <div class="grid">
      <a class="tile" href="/stichting">
        <h3>De stichting</h3>
        <p>Doelstelling, gegevens en contact.</p>
      </a>
      <a class="tile" href="/bestuur">
        <h3>Bestuur</h3>
        <p>Voorzitter, penningmeester en secretaris.</p>
      </a>
      <a class="tile" href="/beleidsplan">
        <h3>Beleidsplan</h3>
        <p>Onze richtlijnen voor fondsenwerving en besteding.</p>
      </a>
      <a class="tile" href="/voorwaarden">
        <h3>Voorwaarden</h3>
        <p>Hoe een goed doel een aanvraag indient.</p>
      </a>
      <a class="tile" href="/jaarstukken">
        <h3>Jaarstukken</h3>
        <p>Onze jaarlijkse verantwoording in PDF.</p>
      </a>
    </div>
"""


def stichting_body() -> str:
    return """
    <div class="card">
      <h2>Doelstelling</h2>
      <p>De stichting heeft de volgende statutaire doelstelling: haar financi&euml;le middelen, zo veel als naar het oordeel van het bestuur mogelijk, te besteden voor doeleinden die een sociaal&ndash;charitatief karakter hebben.</p>
      <p>Hoe dan ook dient een zeer overwegend deel van de geldmiddelen van de stichting dienstbaar gemaakt te worden aan de behartiging van doelstellingen die als van algemeen maatschappelijk belang kunnen worden beschouwd. Deze doelstellingen mogen liggen zowel in Nederland als daarbuiten.</p>
    </div>

    <div class="card">
      <h2>Gegevens van de stichting</h2>
      <dl class="dl-table">
        <dt>Opgericht</dt>
        <dd>23 mei 1984</dd>
        <dt>KvK-nummer</dt>
        <dd>41056683</dd>
        <dt>RSIN</dt>
        <dd>806308527</dd>
        <dt>Bankrelatie</dt>
        <dd>NL73&nbsp;ABNA&nbsp;0498&nbsp;5374&nbsp;39</dd>
      </dl>
    </div>

    <div class="card">
      <h2>Contact</h2>
      <dl class="dl-table">
        <dt>Secretaris</dt>
        <dd>Lodewijkstraat 8<br>6585&nbsp;KM Mook</dd>
        <dt>Penningmeester</dt>
        <dd>Herckenrathweg 6<br>6681&nbsp;DD Bemmel</dd>
      </dl>
    </div>
"""


def bestuur_body() -> str:
    return """
    <div class="card">
      <h2>Samenstelling</h2>
      <dl class="dl-table">
        <dt>Voorzitter</dt>
        <dd>Ren&eacute; Wilderom</dd>
        <dt>Penningmeester</dt>
        <dd>Hans Hendriks</dd>
        <dt>Secretaris</dt>
        <dd>Marijke van Veen</dd>
      </dl>
    </div>

    <div class="card">
      <h3>Beloningsbeleid</h3>
      <p>Het bestuur ontvangt voor haar werkzaamheden geen beloning. De organisatiekosten worden bewust zo laag mogelijk gehouden, zodat de fondsen zoveel mogelijk ten goede komen aan de gesteunde doelen.</p>
    </div>
"""


def beleidsplan_body() -> str:
    return """
    <div class="card">
      <h2>Fondsenwerving</h2>
      <p>Teneinde haar statutaire doelstelling te kunnen verwezenlijken is het van groot belang fondsen te werven. Dankzij de nauwe relatie met Rotaryclub Nijmegen Stad en Land worden de meeste middelen verkregen door tussenkomst van (leden van) deze Rotaryclub. Het wervingsbeleid van de stichting is er op gericht om de fondsenwerving via genoemde Rotaryclub te stimuleren en waar nodig te ondersteunen.</p>
    </div>

    <div class="card">
      <h2>Bestedingsbeleid &mdash; drie aandachtsgebieden</h2>

      <h3>1. Projecten ter beoordeling van het bestuur</h3>
      <p>Daarvoor gelden de toetsingscriteria zoals opgesteld door Rotaryclub Nijmegen Stad en Land. Aan onze stichting is een Raad van Advies verbonden die het bestuur adviseert over projectaanvragen. Bij haar werkzaamheden neemt de Raad de toetsstenen tot uitgangspunt. Het beleid is er enerzijds op gericht om projectvoorstellen te ontvangen en anderzijds te bewaken dat de besluitvorming over projectvoorstellen langs deze weg verloopt.</p>

      <h3>2. Projecten ter beoordeling van het bestuur van Rotaryclub Nijmegen Stad en Land</h3>
      <p>Het beleid is er op gericht dat de gemaakte afspraken dienaangaande juist worden toegepast.</p>

      <h3>3. Spontane acties</h3>
      <p>Het beleid spitst zich toe op beoordeling van de ethische aanvaardbaarheid van een voorgesteld project alsmede, bij positieve oordeelsvorming, de juiste afwikkeling van dergelijke acties.</p>
    </div>

    <div class="card">
      <h2>Organisatiekosten</h2>
      <p>Met betrekking tot de organisatiekosten wordt het bestaande beleid om deze zo laag mogelijk te houden voortgezet, onder andere inhoudend dat de leden van de Raad van Advies en het bestuur geen beloning ontvangen.</p>
    </div>

    <div class="card">
      <h2>Verantwoording</h2>
      <p>De financi&euml;le verantwoording over elk boekjaar wordt opgenomen in een jaarverslag. Een samenvatting van het jaarverslag is via deze website beschikbaar onder <a href="/jaarstukken">Jaarstukken</a>.</p>
    </div>
"""


def voorwaarden_body() -> str:
    return """
    <div class="card">
      <h2>Een aanvraag indienen</h2>
      <p>Goede doelen kunnen aanvragen indienen voor een geldelijke bijdrage van de stichting. Een aanvraag dient ten minste de volgende informatie te bevatten:</p>
      <ul>
        <li>Statutaire naam van de aanvrager, diens adres en eventueel inschrijving bij de Kamer van Koophandel.</li>
        <li>Naam en contactgegevens van de contactpersoon.</li>
        <li>Beknopte omschrijving van het project waarvoor de bijdrage wordt gevraagd.</li>
        <li>Periode waarin het project wordt gerealiseerd.</li>
        <li>Voorgenomen wijze van financiering van het project.</li>
        <li>Het gevraagde bedrag, zo mogelijk ondersteund door een kostenberekening, offerte of iets dergelijks.</li>
        <li>Voor bedragen van &euro;&nbsp;1.000 en hoger: een voorstel voor de wijze waarop, n&aacute; realisatie van het project, zowel inhoudelijke als financi&euml;le verantwoording wordt afgelegd.</li>
      </ul>
      <p>Het bestuur legt de aanvragen voor aan haar Raad van Advies. Na verkregen advies neemt het bestuur een besluit.</p>
    </div>

    <div class="card">
      <h2>Toetsstenen</h2>
      <p>Zowel de Raad van Advies als het bestuur gebruiken de onderstaande toetsstenen bij de beoordeling van de aanvragen:</p>
      <ul>
        <li>Goede doelen zullen in beginsel liggen in het werkgebied van onze club (&ldquo;rond de kerk&rdquo;). Uitzonderingen zijn, mits deugdelijk gemotiveerd, mogelijk daar waar een enge relatie ligt tussen het betreffende goede doel en de persoonlijke betrokkenheid van een lid van onze Rotaryclub.</li>
        <li>Goede doelen zullen geen betrekking hebben op het lenigen van noden waarin reeds door overheden of daaraan gelieerde instellingen (zoals ZBO&rsquo;s) wordt voorzien.</li>
        <li>Goede doelen die al door grotere bijdragen van andere goede-doelen-stichtingen worden gesteund, zullen alleen bij uitzondering in aanmerking komen.</li>
        <li>Bij beoordeling wordt de ethische aanvaardbaarheid van het doel betrokken.</li>
      </ul>
    </div>
"""


def jaarstukken_body() -> str:
    items = []
    for year, _slug, fn, title, when in PDC:
        items.append(f"""
      <li>
        <a href="/pdc/{fn}" target="_blank" rel="noopener">
          <span class="icon">PDF</span>
          <span class="meta">
            <strong>{title}</strong>
            <small>{when} &middot; PDF</small>
          </span>
          <svg class="download-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>
      </li>""")
    return f"""
    <div class="card">
      <h2>Verantwoording in PDF</h2>
      <p>Hieronder vindt u de jaarstukken van de stichting van de afgelopen jaren. Klik op een document om de PDF te openen of te downloaden.</p>
      <ul class="pdc-list">{''.join(items)}
      </ul>
    </div>
"""


PAGES = [
    {
        "filename": "index.html",
        "slug": "/",
        "title": "Stichting Gemeenschapsservice Nijmegen Stad en Land",
        "description": "Statutaire doelstelling, beleid en verantwoording van de Stichting Gemeenschapsservice Nijmegen Stad en Land.",
        "hero_image": "hero-home.jpeg",
        "hero_eyebrow": "Service Above Self",
        "hero_title": "Sociaal-charitatieve doelen, met zorg ondersteund",
        "hero_lede": "Sinds 1984 ondersteunt onze stichting projecten van algemeen maatschappelijk belang &mdash; in nauwe samenwerking met Rotaryclub Nijmegen Stad en Land.",
        "nav_active": "/",
        "body": home_body(),
    },
    {
        "filename": "stichting.html",
        "slug": "/stichting",
        "title": "De stichting &middot; Gemeenschapsservice Nijmegen Stad en Land",
        "description": "Doelstelling, oprichtingsgegevens en contactgegevens van de stichting.",
        "hero_image": "hero-stichting.jpeg",
        "hero_eyebrow": "Over ons",
        "hero_title": "Onze doelstelling en gegevens",
        "hero_lede": "Een korte introductie van wie wij zijn en waarvoor wij staan.",
        "nav_active": "/stichting",
        "body": stichting_body(),
        "hero_compact": True,
    },
    {
        "filename": "bestuur.html",
        "slug": "/bestuur",
        "title": "Bestuur &middot; Gemeenschapsservice Nijmegen Stad en Land",
        "description": "Samenstelling van het bestuur en beloningsbeleid.",
        "hero_image": "hero-bestuur.jpeg",
        "hero_eyebrow": "Bestuur",
        "hero_title": "De mensen die de koers zetten",
        "hero_lede": "Voorzitter, penningmeester en secretaris &mdash; allen onbezoldigd.",
        "nav_active": "/bestuur",
        "body": bestuur_body(),
        "hero_compact": True,
    },
    {
        "filename": "beleidsplan.html",
        "slug": "/beleidsplan",
        "title": "Beleidsplan &middot; Gemeenschapsservice Nijmegen Stad en Land",
        "description": "Beleidsplan over fondsenwerving, bestedingsbeleid en organisatiekosten.",
        "hero_image": "hero-beleid.jpeg",
        "hero_eyebrow": "Beleidsplan",
        "hero_title": "Hoe wij werven en hoe wij besteden",
        "hero_lede": "Drie aandachtsgebieden, &eacute;&eacute;n leidend principe: zoveel mogelijk geld naar het goede doel.",
        "nav_active": "/beleidsplan",
        "body": beleidsplan_body(),
        "hero_compact": True,
    },
    {
        "filename": "voorwaarden.html",
        "slug": "/voorwaarden",
        "title": "Voorwaarden voor geldelijke bijdrage &middot; Gemeenschapsservice Nijmegen Stad en Land",
        "description": "Welke informatie moet een aanvraag bevatten, en welke toetsstenen gebruikt het bestuur.",
        "hero_image": "hero-voorwaarden.jpeg",
        "hero_eyebrow": "Voorwaarden",
        "hero_title": "Een aanvraag voor een bijdrage",
        "hero_lede": "Wat we van een aanvraag verwachten, en hoe we tot een besluit komen.",
        "nav_active": "/voorwaarden",
        "body": voorwaarden_body(),
        "hero_compact": True,
    },
    {
        "filename": "jaarstukken.html",
        "slug": "/jaarstukken",
        "title": "Jaarstukken &middot; Gemeenschapsservice Nijmegen Stad en Land",
        "description": "Jaarstukken van de stichting &mdash; openbare verantwoording in PDF.",
        "hero_image": "hero-jaarstukken.jpeg",
        "hero_eyebrow": "Verantwoording",
        "hero_title": "Onze jaarstukken",
        "hero_lede": "Openbare verantwoording over hoe wij onze middelen besteden, jaar na jaar.",
        "nav_active": "/jaarstukken",
        "body": jaarstukken_body(),
        "hero_compact": True,
    },
]


def build_404() -> str:
    return page(
        slug="404",
        title="Pagina niet gevonden &middot; Gemeenschapsservice Nijmegen Stad en Land",
        description="Deze pagina bestaat niet (meer).",
        nav_active="",
        hero_image="hero-home.jpeg",
        hero_eyebrow="404",
        hero_title="Deze pagina bestaat niet",
        hero_lede="Misschien is de link verouderd. Keer terug naar <a href=\"/\">de homepage</a> of bekijk de <a href=\"/jaarstukken\">jaarstukken</a>.",
        body="",
        hero_compact=True,
    )


def build():
    for p in PAGES:
        out = page(
            slug=p["slug"],
            title=p["title"],
            description=p["description"],
            nav_active=p["nav_active"],
            hero_image=p["hero_image"],
            hero_eyebrow=p["hero_eyebrow"],
            hero_title=p["hero_title"],
            hero_lede=p["hero_lede"],
            body=p["body"],
            hero_compact=p.get("hero_compact", False),
        )
        (ROOT / p["filename"]).write_text(out)
        print(f"wrote {p['filename']:30} ({len(out):,} bytes)")
    (ROOT / "404.html").write_text(build_404())
    print("wrote 404.html")


if __name__ == "__main__":
    build()
