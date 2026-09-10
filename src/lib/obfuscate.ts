const EMAIL_RE = /(?:mailto:)?[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function encode(s: string): string {
  let out = '';
  for (const ch of s) out += `&#${ch.codePointAt(0)};`;
  return out;
}

// Entity-encodeert e-mailadressen (incl. mailto:-prefix) in de uiteindelijke
// HTML. Browsers decoderen entities transparant, maar simpele harvesters die
// op @-patronen grepen zien niets. Werkt ook voor adressen die het bestuur
// later via de admin in content zet.
export function obfuscateEmails(htmlStr: string): string {
  return htmlStr.replace(EMAIL_RE, (m) => encode(m));
}
