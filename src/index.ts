/**
 * Minimal Worker-entrypoint voor inijmegen.nl.
 *
 * Doet drie dingen:
 *   1. www.inijmegen.nl → 301 naar de apex (canonical).
 *   2. Security-headers op elke response (Workers Static Assets
 *      ondersteunt `_headers` op papier, maar in de praktijk werd het
 *      hier genegeerd; we zetten ze hier direct).
 *   3. Lange cache-control op statische assets (/assets/* en /pdc/*).
 *
 * Voor al het andere: pure proxy naar de Static Assets binding — geen
 * eigen routing, geen API. Resultaat is functioneel identiek aan een
 * static-only Worker, plus security-headers + www-redirect.
 */

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. www → apex (preserveert pad + query).
    if (url.hostname === 'www.inijmegen.nl') {
      url.hostname = 'inijmegen.nl';
      return Response.redirect(url.toString(), 301);
    }

    // 2. Asset ophalen.
    const res = await env.ASSETS.fetch(request);

    // 3. Headers verrijken. Cloudflare cached responses; daarom altijd
    // een nieuwe Response bouwen i.p.v. de live response te muteren.
    const h = new Headers(res.headers);

    h.set('X-Content-Type-Options', 'nosniff');
    h.set('X-Frame-Options', 'SAMEORIGIN');
    h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    h.set(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()',
    );
    h.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );

    // 4. Cache-control per pad. Default (HTML-pagina's) blijft op de
    // wrangler-default (must-revalidate) zodat content-updates direct
    // doorkomen.
    if (url.pathname.startsWith('/assets/')) {
      h.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.pathname.startsWith('/pdc/')) {
      h.set('Cache-Control', 'public, max-age=2592000');
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: h,
    });
  },
} satisfies ExportedHandler<Env>;
