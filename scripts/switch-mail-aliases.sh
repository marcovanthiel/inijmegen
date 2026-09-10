#!/bin/bash
# Zet in de LIVE D1 de privé-mailadressen van het bestuur om naar de
# role-aliassen (Cloudflare Email Routing). Pas uitvoeren nadat de
# routing-regels actief zijn en de bestemmingsadressen zijn geverifieerd,
# anders bouncen mails naar de aliassen.
#
# Gebruik: CLOUDFLARE_API_TOKEN=... bash scripts/switch-mail-aliases.sh
# Bij de domeinmigratie: DOMAIN=goededoelennijmegenstadenland.nl meegeven
# (en dit script draaien nadat de routing op dat domein staat).
set -e
cd "$(dirname "$0")/.."
DOMAIN="${DOMAIN:-inijmegen.nl}"

run() { npx wrangler d1 execute inijmegen-cms --remote --command "$1"; }

run "UPDATE settings SET value='Voorzitter: René Wilderom<br><a href=\"mailto:voorzitter@$DOMAIN\">voorzitter@$DOMAIN</a>' WHERE key='contact_voorzitter'"
run "UPDATE settings SET value='Secretaris: Marijke van Veen<br><a href=\"mailto:secretaris@$DOMAIN\">secretaris@$DOMAIN</a>' WHERE key='contact_secretaris'"
run "UPDATE settings SET value='Penningmeester: Hans Hendriks<br><a href=\"mailto:penningmeester@$DOMAIN\">penningmeester@$DOMAIN</a>' WHERE key='contact_penningmeester'"

for paar in "renewilderom@gmail.com:voorzitter" "marijke.van.veen@wxs.nl:secretaris" "hans.c.m.hendriks@gmail.com:penningmeester" \
            "voorzitter@inijmegen.nl:voorzitter" "secretaris@inijmegen.nl:secretaris" "penningmeester@inijmegen.nl:penningmeester"; do
  oud="${paar%%:*}"; rol="${paar##*:}"
  run "UPDATE pages SET body_md = REPLACE(body_md, '$oud', '$rol@$DOMAIN'), updated_at = CURRENT_TIMESTAMP WHERE body_md LIKE '%$oud%'"
done

echo "Klaar. Edge-cache verloopt binnen 5 minuten vanzelf; controleer daarna https://$DOMAIN/bestuur"
