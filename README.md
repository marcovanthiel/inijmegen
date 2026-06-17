# inijmegen.nl

Statische website voor de **Stichting Gemeenschapsservice Nijmegen Stad
en Land** (ANBI, opgericht 1984).

Proefmigratie van `gemeenschapsservicenijmegensenl.nl` (WordPress) naar
een statische Cloudflare-Worker.

- Live: https://inijmegen.nl/ (na zone-activatie)
- Repo: https://github.com/marcovanthiel/inijmegen

## Lokaal bouwen

```bash
python3 build.py
# open index.html
```

## Een nieuwe jaarstukken-PDF toevoegen

1. PDF in `pdc/` plaatsen
2. Entry bovenin `build.py` (`PDC = [...]`) toevoegen
3. `git commit && git push` — GitHub Actions deployt automatisch

Zie `CLAUDE.md` voor de volledige werkwijze en architectuurkeuzes.
