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
