// Publieke site: jaartal in footer + mobiel navigatiemenu.
// Geëxternaliseerd uit de inline <script> zodat de CSP script-src 'self' kan
// afdwingen (geen 'unsafe-inline') — mitigeert geïnjecteerde inline scripts.
document.getElementById('year').textContent = new Date().getFullYear();
const t = document.getElementById('navToggle');
const l = document.getElementById('navLinks');
if (t && l)
  t.addEventListener('click', () => {
    const open = l.classList.toggle('open');
    t.setAttribute('aria-expanded', String(open));
  });
// Deploy-versie (versie + git-commit) uit /assets/version.json in de footer.
fetch('/assets/version.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
  var v = document.getElementById('siteVersion');
  if (v && d && d.version) v.textContent = 'v' + d.version + (d.commit ? ' · ' + d.commit : '');
}).catch(function () {});
