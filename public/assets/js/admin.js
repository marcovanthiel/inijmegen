// Admin UI: live preview voor markdown-velden.

(function () {
  'use strict';

  const previewBtn = document.getElementById('previewBtn');
  const previewArea = document.getElementById('previewArea');
  const bodyField = document.getElementById('f_body_md');

  if (!previewBtn || !previewArea || !bodyField) return;

  async function refreshPreview() {
    try {
      const res = await fetch('/admin/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ md: bodyField.value }),
      });
      const data = await res.json();
      previewArea.innerHTML = data.html;
    } catch (e) {
      previewArea.textContent = 'Voorbeeld kon niet worden geladen.';
    }
  }

  previewBtn.addEventListener('click', async () => {
    if (!previewArea.classList.contains('hidden')) {
      previewArea.classList.add('hidden');
      previewBtn.textContent = 'Voorbeeld tonen';
      return;
    }
    previewBtn.textContent = 'Bezig…';
    await refreshPreview();
    previewArea.classList.remove('hidden');
    previewBtn.textContent = 'Voorbeeld verbergen';
  });

  // Auto-refresh bij typen (debounced) wanneer preview open is.
  let timer;
  bodyField.addEventListener('input', () => {
    if (previewArea.classList.contains('hidden')) return;
    clearTimeout(timer);
    timer = setTimeout(refreshPreview, 600);
  });
})();
