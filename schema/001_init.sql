-- Initial schema voor inijmegen CMS.
-- Toepassen: `npm run db:apply:remote` (of :local voor wrangler dev).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  pw_hash      TEXT NOT NULL,            -- PBKDF2-SHA256, base64-encoded "iter:salt:hash"
  role         TEXT NOT NULL DEFAULT 'editor', -- 'admin' of 'editor'
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login   INTEGER,
  reset_token  TEXT,
  reset_expires INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,          -- random 32-byte hex
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at  INTEGER NOT NULL,
  ip          TEXT,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Pagina-metadata. Body staat in `pages.body_md` als markdown.
-- Hero-velden staan apart zodat de admin ze met losse formvelden bewerkt.
CREATE TABLE IF NOT EXISTS pages (
  slug          TEXT PRIMARY KEY,         -- '/', '/stichting', etc.
  nav_label     TEXT NOT NULL,
  nav_order     INTEGER NOT NULL,
  in_nav        INTEGER NOT NULL DEFAULT 1,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  hero_image    TEXT NOT NULL,
  hero_eyebrow  TEXT NOT NULL,
  hero_title    TEXT NOT NULL,
  hero_lede     TEXT NOT NULL,
  hero_compact  INTEGER NOT NULL DEFAULT 0,
  body_md       TEXT NOT NULL DEFAULT '',
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_by    INTEGER REFERENCES users(id)
);

-- Vrije key-value voor stichtings-info die op meerdere pagina's terugkomt
-- (KvK, RSIN, IBAN, contactadressen, footer-tekst). Editor kan dit op
-- één plek bewerken zodat alles consistent blijft.
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_by  INTEGER REFERENCES users(id)
);

-- Jaarstukken: metadata in D1, PDF zelf in R2 onder `r2_key`.
CREATE TABLE IF NOT EXISTS jaarstukken (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  year        INTEGER NOT NULL,
  title       TEXT NOT NULL,
  published   TEXT NOT NULL,             -- bv. "Mei 2026"
  r2_key      TEXT NOT NULL,             -- bv. "jaarstukken/2025/jaarstukken-2025.pdf"
  filename    TEXT NOT NULL,             -- originele bestandsnaam voor downloads
  size_bytes  INTEGER,
  uploaded_at INTEGER NOT NULL DEFAULT (unixepoch()),
  uploaded_by INTEGER REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jaarstukken_year ON jaarstukken(year);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,              -- 'login', 'page.save', 'jaarstuk.upload', etc.
  target     TEXT,                       -- bv. slug of jaarstuk-id
  detail     TEXT,                       -- JSON met extra info
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at);
