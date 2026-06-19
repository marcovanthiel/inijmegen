-- Initiële content voor inijmegen.nl. Direct vertaald uit build.py.
-- Toepassen NA 001_init.sql: `npm run seed:remote`.
-- Idempotent: gebruik INSERT OR REPLACE.

-- ── Settings ────────────────────────────────────────────────────────

INSERT OR REPLACE INTO settings (key, value) VALUES
  ('kvk', '41056683'),
  ('rsin', '806308527'),
  ('iban', 'NL73 ABNA 0498 5374 39'),
  ('opgericht', '23 mei 1984'),
  ('voorzitter', 'René Wilderom'),
  ('penningmeester', 'Hans Hendriks'),
  ('secretaris', 'Marijke van Veen'),
  ('contact_secretaris', 'Secretaris<br>Lodewijkstraat 8<br>6585 KM Mook'),
  ('contact_penningmeester', 'Penningmeester<br>Herckenrathweg 6<br>6681 DD Bemmel');

-- ── Pages ───────────────────────────────────────────────────────────

INSERT OR REPLACE INTO pages
  (slug, nav_label, nav_order, in_nav, title, description,
   hero_image, hero_eyebrow, hero_title, hero_lede, hero_compact, body_md)
VALUES
  ('/', 'Home', 0, 1,
   'Stichting Gemeenschapsservice Nijmegen Stad en Land',
   'Statutaire doelstelling, beleid en verantwoording van de Stichting Gemeenschapsservice Nijmegen Stad en Land.',
   'hero-home-classic.jpeg',
   'Service Above Self',
   'Sociaal-charitatieve doelen, met zorg ondersteund',
   'Sinds 1984 ondersteunt onze stichting projecten van algemeen maatschappelijk belang — in nauwe samenwerking met Rotaryclub Nijmegen Stad en Land.',
   0,
   '<div class="card"><h2>Onze doelstelling</h2><p>De stichting heeft de volgende statutaire doelstelling:</p><blockquote><p>Haar financiële middelen, zo veel als naar het oordeel van het bestuur mogelijk, te besteden voor doeleinden, die een sociaal&nbsp;–&nbsp;charitatief karakter hebben.</p></blockquote><p>Hoe dan ook dient een zeer overwegend deel van de geldmiddelen van de stichting dienstbaar gemaakt te worden aan de behartiging van doelstellingen die als van algemeen maatschappelijk belang kunnen worden beschouwd.</p><p>Deze doelstellingen mogen liggen zowel in Nederland als daarbuiten.</p></div>'),

  ('/stichting', 'De stichting', 1, 1,
   'De stichting · Gemeenschapsservice Nijmegen Stad en Land',
   'Doelstelling, oprichtingsgegevens en contactgegevens van de stichting.',
   'hero-stichting-classic.jpeg',
   'Over ons',
   'Onze doelstelling en gegevens',
   'Een korte introductie van wie wij zijn en waarvoor wij staan.',
   1,
   '## Doelstelling

De stichting heeft de volgende statutaire doelstelling: haar financiële middelen, zo veel als naar het oordeel van het bestuur mogelijk, te besteden voor doeleinden die een sociaal-charitatief karakter hebben.

Hoe dan ook dient een zeer overwegend deel van de geldmiddelen van de stichting dienstbaar gemaakt te worden aan de behartiging van doelstellingen die als van algemeen maatschappelijk belang kunnen worden beschouwd. Deze doelstellingen mogen liggen zowel in Nederland als daarbuiten.

## Gegevens van de stichting

- **Opgericht:** {{opgericht}}
- **KvK-nummer:** {{kvk}}
- **RSIN:** {{rsin}}
- **Bankrelatie:** {{iban}}

## Contact

{{contact_secretaris}}

{{contact_penningmeester}}'),

  ('/bestuur', 'Bestuur', 2, 1,
   'Bestuur · Gemeenschapsservice Nijmegen Stad en Land',
   'Samenstelling van het bestuur en beloningsbeleid.',
   'hero-bestuur-classic.jpeg',
   'Bestuur',
   'De mensen die de koers zetten',
   'Voorzitter, penningmeester en secretaris — allen onbezoldigd.',
   1,
   '## Samenstelling

- **Voorzitter:** {{voorzitter}}
- **Penningmeester:** {{penningmeester}}
- **Secretaris:** {{secretaris}}

### Beloningsbeleid

Het bestuur ontvangt voor haar werkzaamheden geen beloning. De organisatiekosten worden bewust zo laag mogelijk gehouden, zodat de fondsen zoveel mogelijk ten goede komen aan de gesteunde doelen.'),

  ('/beleidsplan', 'Beleidsplan', 3, 1,
   'Beleidsplan · Gemeenschapsservice Nijmegen Stad en Land',
   'Beleidsplan over fondsenwerving, bestedingsbeleid en organisatiekosten.',
   'hero-bestuur-classic.jpeg',
   'Beleidsplan',
   'Hoe wij werven en hoe wij besteden',
   'Drie aandachtsgebieden, één leidend principe: zoveel mogelijk geld naar het goede doel.',
   1,
   '## Fondsenwerving

Teneinde haar statutaire doelstelling te kunnen verwezenlijken is het van groot belang fondsen te werven. Dankzij de nauwe relatie met Rotaryclub Nijmegen Stad en Land worden de meeste middelen verkregen door tussenkomst van (leden van) deze Rotaryclub. Het wervingsbeleid van de stichting is er op gericht om de fondsenwerving via genoemde Rotaryclub te stimuleren en waar nodig te ondersteunen.

## Bestedingsbeleid — drie aandachtsgebieden

### 1. Projecten ter beoordeling van het bestuur

Daarvoor gelden de toetsingscriteria zoals opgesteld door Rotaryclub Nijmegen Stad en Land. Aan onze stichting is een Raad van Advies verbonden die het bestuur adviseert over projectaanvragen. Bij haar werkzaamheden neemt de Raad de toetsstenen tot uitgangspunt. Het beleid is er enerzijds op gericht om projectvoorstellen te ontvangen en anderzijds te bewaken dat de besluitvorming over projectvoorstellen langs deze weg verloopt.

### 2. Projecten ter beoordeling van het bestuur van Rotaryclub Nijmegen Stad en Land

Het beleid is er op gericht dat de gemaakte afspraken dienaangaande juist worden toegepast.

### 3. Spontane acties

Het beleid spitst zich toe op beoordeling van de ethische aanvaardbaarheid van een voorgesteld project alsmede, bij positieve oordeelsvorming, de juiste afwikkeling van dergelijke acties.

## Organisatiekosten

Met betrekking tot de organisatiekosten wordt het bestaande beleid om deze zo laag mogelijk te houden voortgezet, onder andere inhoudend dat de leden van de Raad van Advies en het bestuur geen beloning ontvangen.

## Verantwoording

De financiële verantwoording over elk boekjaar wordt opgenomen in een jaarverslag. Een samenvatting van het jaarverslag is via deze website beschikbaar onder [Jaarstukken](/jaarstukken).'),

  ('/voorwaarden', 'Voorwaarden', 4, 1,
   'Voorwaarden voor geldelijke bijdrage · Gemeenschapsservice Nijmegen Stad en Land',
   'Welke informatie moet een aanvraag bevatten, en welke toetsstenen gebruikt het bestuur.',
   'hero-home-classic.jpeg',
   'Voorwaarden',
   'Een aanvraag voor een bijdrage',
   'Wat we van een aanvraag verwachten, en hoe we tot een besluit komen.',
   1,
   '## Een aanvraag indienen

Goede doelen kunnen aanvragen indienen voor een geldelijke bijdrage van de stichting. Een aanvraag dient ten minste de volgende informatie te bevatten:

- Statutaire naam van de aanvrager, diens adres en eventueel inschrijving bij de Kamer van Koophandel.
- Naam en contactgegevens van de contactpersoon.
- Beknopte omschrijving van het project waarvoor de bijdrage wordt gevraagd.
- Periode waarin het project wordt gerealiseerd.
- Voorgenomen wijze van financiering van het project.
- Het gevraagde bedrag, zo mogelijk ondersteund door een kostenberekening, offerte of iets dergelijks.
- Voor bedragen van € 1.000 en hoger: een voorstel voor de wijze waarop, ná realisatie van het project, zowel inhoudelijke als financiële verantwoording wordt afgelegd.

Het bestuur legt de aanvragen voor aan haar Raad van Advies. Na verkregen advies neemt het bestuur een besluit.

## Toetsstenen

Zowel de Raad van Advies als het bestuur gebruiken de onderstaande toetsstenen bij de beoordeling van de aanvragen:

- Goede doelen zullen in beginsel liggen in het werkgebied van onze club ("rond de kerk"). Uitzonderingen zijn, mits deugdelijk gemotiveerd, mogelijk daar waar een enge relatie ligt tussen het betreffende goede doel en de persoonlijke betrokkenheid van een lid van onze Rotaryclub.
- Goede doelen zullen geen betrekking hebben op het lenigen van noden waarin reeds door overheden of daaraan gelieerde instellingen (zoals ZBO''s) wordt voorzien.
- Goede doelen die al door grotere bijdragen van andere goede-doelen-stichtingen worden gesteund, zullen alleen bij uitzondering in aanmerking komen.
- Bij beoordeling wordt de ethische aanvaardbaarheid van het doel betrokken.'),

  ('/jaarstukken', 'Jaarstukken', 5, 1,
   'Jaarstukken · Gemeenschapsservice Nijmegen Stad en Land',
   'Jaarstukken van de stichting — openbare verantwoording in PDF.',
   'hero-stichting-classic.jpeg',
   'Verantwoording',
   'Onze jaarstukken',
   'Openbare verantwoording over hoe wij onze middelen besteden, jaar na jaar.',
   1,
   '## Verantwoording in PDF

Hieronder vindt u de jaarstukken van de stichting van de afgelopen jaren. Klik op een document om de PDF te openen of te downloaden.');
