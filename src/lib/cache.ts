// Wist Cloudflare-cache voor specifieke tags na een content-wijziging,
// zodat publieke bezoekers meteen de nieuwe versie zien.

import type { Env } from '../env';

// Cache-tags purgen vereist een Enterprise-plan. Op een gewone account
// gebruiken we cache.delete via de Workers Cache API per URL.
//
// Voor inijmegen.nl is dat genoeg: na een save kennen we de URLs van de
// betroffen pagina's en kunnen die direct uit de edge-cache verwijderen.

export async function purgePaths(
  env: Env,
  paths: string[],
): Promise<void> {
  const host = env.SITE_HOST;
  const cache = caches.default;
  await Promise.all(
    paths.map((p) =>
      cache.delete(new Request(`https://${host}${p}`), { ignoreMethod: true }),
    ),
  );
}

export async function purgeAllPublic(env: Env): Promise<void> {
  // Voor settings of nav-wijzigingen: purgen we alle bekende slugs.
  const res = await env.DB.prepare('SELECT slug FROM pages').all<{ slug: string }>();
  const paths = (res.results ?? []).map((r) => r.slug);
  await purgePaths(env, paths);
}
