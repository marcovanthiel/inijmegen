import type { Env } from '../env';

export interface PageRow {
  slug: string;
  nav_label: string;
  nav_order: number;
  in_nav: number;
  title: string;
  description: string;
  hero_image: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_lede: string;
  hero_compact: number;
  body_md: string;
  updated_at: number;
  updated_by: number | null;
}

export interface JaarstukRow {
  id: number;
  year: number;
  title: string;
  published: string;
  r2_key: string;
  filename: string;
  size_bytes: number | null;
  uploaded_at: number;
}

export interface UserRow {
  id: number;
  email: string;
  name: string;
  pw_hash: string;
  role: string;
  created_at: number;
  last_login: number | null;
  reset_token: string | null;
  reset_expires: number | null;
}

export async function getPage(env: Env, slug: string): Promise<PageRow | null> {
  return env.DB.prepare('SELECT * FROM pages WHERE slug = ?')
    .bind(slug)
    .first<PageRow>();
}

export async function listPages(env: Env): Promise<PageRow[]> {
  const res = await env.DB.prepare(
    'SELECT * FROM pages ORDER BY nav_order',
  ).all<PageRow>();
  return res.results ?? [];
}

export async function listNavPages(env: Env): Promise<PageRow[]> {
  const res = await env.DB.prepare(
    'SELECT * FROM pages WHERE in_nav = 1 ORDER BY nav_order',
  ).all<PageRow>();
  return res.results ?? [];
}

export async function listJaarstukken(env: Env): Promise<JaarstukRow[]> {
  const res = await env.DB.prepare(
    'SELECT * FROM jaarstukken ORDER BY year DESC',
  ).all<JaarstukRow>();
  return res.results ?? [];
}

export async function getSettings(
  env: Env,
): Promise<Record<string, string>> {
  const res = await env.DB.prepare(
    'SELECT key, value FROM settings',
  ).all<{ key: string; value: string }>();
  const out: Record<string, string> = {};
  for (const r of res.results ?? []) out[r.key] = r.value;
  return out;
}

export async function audit(
  env: Env,
  userId: number | null,
  action: string,
  target: string | null,
  detail: object | null = null,
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO audit_log (user_id, action, target, detail) VALUES (?, ?, ?, ?)',
  )
    .bind(userId, action, target, detail ? JSON.stringify(detail) : null)
    .run();
}
