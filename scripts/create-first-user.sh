#!/usr/bin/env bash
# Maakt de eerste admin-user aan met een resetlink (geen wachtwoord nog).
# Gebruik: `bash scripts/create-first-user.sh "Marco van Thiel" marco@marcovanthiel.nl admin`

set -euo pipefail
cd "$(dirname "$0")/.."

NAME="${1:?'Naam ontbreekt'}"
EMAIL="${2:?'E-mail ontbreekt'}"
ROLE="${3:-admin}"

# 32-byte hex token voor reset.
TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
EXPIRES=$(($(date +%s) + 7 * 86400))

# Dummy hash (gebruiker stelt direct wachtwoord in via resetlink).
DUMMY_HASH='pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

# Escape single quotes.
ESC_NAME=${NAME//\'/\'\'}
ESC_EMAIL=${EMAIL//\'/\'\'}

SQL="INSERT INTO users (email, name, pw_hash, role, reset_token, reset_expires)
     VALUES ('${ESC_EMAIL}', '${ESC_NAME}', '${DUMMY_HASH}', '${ROLE}', '${TOKEN}', ${EXPIRES})
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       role = excluded.role,
       reset_token = excluded.reset_token,
       reset_expires = excluded.reset_expires;"

echo "$SQL" | npx wrangler d1 execute inijmegen-cms --remote --command "$SQL"

echo ""
echo "──────────────────────────────────────────────────────────────"
echo "User aangemaakt: $NAME <$EMAIL> ($ROLE)"
echo "Stel een wachtwoord in via:"
echo ""
echo "  https://inijmegen.nl/admin/reset?token=$TOKEN"
echo ""
echo "(Link is 7 dagen geldig.)"
echo "──────────────────────────────────────────────────────────────"
