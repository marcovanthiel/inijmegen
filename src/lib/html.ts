// Tagged template helper. Escapt automatisch interpolaties, behalve als
// die zelf via `raw()` zijn gemarkeerd of een array van HtmlString zijn.

const RAW = Symbol('raw-html');

export type HtmlString = { [RAW]: true; toString(): string };

function isRaw(v: unknown): v is HtmlString {
  return typeof v === 'object' && v !== null && (v as any)[RAW] === true;
}

export function raw(s: string): HtmlString {
  return {
    [RAW]: true,
    toString() {
      return s;
    },
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): HtmlString {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += renderValue(values[i]) + strings[i + 1];
  }
  return raw(out);
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined || v === false) return '';
  if (isRaw(v)) return v.toString();
  if (Array.isArray(v)) return v.map(renderValue).join('');
  return escapeHtml(String(v));
}
