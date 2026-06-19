// Markdown rendering met `marked`. Niet-vertrouwde HTML wordt weggefilterd:
// alleen een whitelist van veilige tags blijft over.

import { marked } from 'marked';

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'a', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr',
  'dl', 'dt', 'dd', 'div', 'span',
]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'rel', 'target']),
  div: new Set(['class']),
  span: new Set(['class']),
};

marked.setOptions({ gfm: true, breaks: false });

function sanitize(html: string): string {
  // Strip <script>, <style>, <iframe>, <object>, on*-attrs, javascript:-URLs.
  html = html.replace(
    /<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi,
    '',
  );
  html = html.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  html = html.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
  html = html.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"');
  html = html.replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'");

  // Whitelist-check op tag-niveau (extra defense).
  html = html.replace(/<\/?([a-z][a-z0-9]*)([^>]*)>/gi, (m, tag, attrs) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return '';
    const allowedAttrs = ALLOWED_ATTRS[lower];
    if (!allowedAttrs) return `<${m.startsWith('</') ? '/' : ''}${lower}>`;
    const cleaned = (attrs as string).replace(
      /\s+([a-z-]+)\s*=\s*("([^"]*)"|'([^']*)')/gi,
      (_full, name, _q, dq, sq) => {
        if (!allowedAttrs.has(name.toLowerCase())) return '';
        return ` ${name}="${(dq ?? sq).replace(/"/g, '&quot;')}"`;
      },
    );
    return `<${m.startsWith('</') ? '/' : ''}${lower}${cleaned}>`;
  });

  return html;
}

export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  return sanitize(html);
}

// Eenvoudige interpolatie voor settings: vervang {{key}} in tekst.
export function interpolate(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(/\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi, (_m, k) => {
    return values[k] ?? `{{${k}}}`;
  });
}
