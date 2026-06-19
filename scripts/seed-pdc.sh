#!/usr/bin/env bash
# Uploadt de bestaande pdc/-PDF's naar R2 en voegt metadata in D1 toe.
# Run één keer na initial setup: `bash scripts/seed-pdc.sh remote`
# Voor lokale dev: `bash scripts/seed-pdc.sh local`

set -euo pipefail

cd "$(dirname "$0")/.."

MODE="${1:-remote}"
case "$MODE" in
  local)  D1_FLAG="--local"; R2_FLAG="--local";;
  remote) D1_FLAG="--remote"; R2_FLAG="--remote";;
  *) echo "Gebruik: $0 [local|remote]"; exit 1;;
esac

# Indeling: year|title|published|local_file
ENTRIES=(
  "2025|Rapport inzake jaarstukken 2025|Mei 2026|jaarstukken-2025.pdf"
  "2024|Rapport inzake jaarstukken 2024|Januari 2025|jaarstukken-2024.pdf"
  "2023|Rapport inzake jaarstukken 2023|Mei 2024|jaarstukken-2023.pdf"
  "2022|Rapport inzake jaarstukken 2022|Februari 2023|rapport-inzake-jaarstukken-2022.pdf"
  "2021|Rapport inzake jaarstukken 2021|Februari 2022|jaarstukken-2021.pdf"
  "2020|Rapport inzake jaarstukken 2020|Mei 2021|jaarstukken-2020.pdf"
  "2018|Rapport inzake jaarstukken 2018|Maart 2019|jaarstukken-2018.pdf"
  "2017|Rapport inzake jaarstukken 2017|Februari 2018|jaarstukken-2017.pdf"
  "2016|Rapport inzake jaarstukken 2016|Juni 2017|jaarstukken-2016.pdf"
  "2015|Rapport inzake jaarstukken 2015|Juni 2016|jaarstukken-2015.pdf"
)

SQL=""
for entry in "${ENTRIES[@]}"; do
  IFS='|' read -r year title published file <<< "$entry"
  src="pdc/$file"
  if [[ ! -f "$src" ]]; then
    echo "Skip: $src bestaat niet"
    continue
  fi
  safe_name="jaarstukken-${year}.pdf"
  key="jaarstukken/${year}/${safe_name}"
  size=$(wc -c < "$src" | tr -d ' ')

  echo "→ $year: upload naar R2 ($key, $size bytes)"
  npx wrangler r2 object put "inijmegen-pdc/$key" $R2_FLAG --file "$src" --content-type "application/pdf"

  # Escape single quotes voor SQL.
  esc_title=${title//\'/\'\'}
  esc_published=${published//\'/\'\'}

  SQL+="
INSERT INTO jaarstukken (year, title, published, r2_key, filename, size_bytes)
  VALUES (${year}, '${esc_title}', '${esc_published}', '${key}', '${safe_name}', ${size})
  ON CONFLICT(year) DO UPDATE SET
    title = excluded.title,
    published = excluded.published,
    r2_key = excluded.r2_key,
    filename = excluded.filename,
    size_bytes = excluded.size_bytes,
    uploaded_at = unixepoch();"
done

if [[ -z "$SQL" ]]; then
  echo "Geen PDF's gevonden om in te voegen."
  exit 0
fi

echo "→ D1 metadata invoegen..."
echo "$SQL" > /tmp/seed-pdc.sql
npx wrangler d1 execute inijmegen-cms $D1_FLAG --file=/tmp/seed-pdc.sql
rm /tmp/seed-pdc.sql

echo "Klaar. ${#ENTRIES[@]} jaarstukken in R2 + D1."
