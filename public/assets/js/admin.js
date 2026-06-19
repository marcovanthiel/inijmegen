// Admin UI: live preview voor markdown-velden + AI-assistent.

(function () {
  'use strict';

  // ── Markdown live-preview ──────────────────────────────────────────
  const previewBtn = document.getElementById('previewBtn');
  const previewArea = document.getElementById('previewArea');
  const bodyField = document.getElementById('f_body_md');

  if (previewBtn && previewArea && bodyField) {
    previewBtn.addEventListener('click', async () => {
      if (!previewArea.classList.contains('hidden')) {
        previewArea.classList.add('hidden');
        previewBtn.textContent = 'Voorbeeld tonen';
        return;
      }
      previewBtn.textContent = 'Bezig…';
      try {
        const res = await fetch('/admin/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ md: bodyField.value }),
        });
        const data = await res.json();
        previewArea.innerHTML = data.html;
        previewArea.classList.remove('hidden');
        previewBtn.textContent = 'Voorbeeld verbergen';
      } catch (e) {
        previewArea.textContent = 'Voorbeeld kon niet worden geladen.';
        previewArea.classList.remove('hidden');
        previewBtn.textContent = 'Voorbeeld tonen';
      }
    });

    // Auto-refresh bij typen (debounced).
    let timer;
    bodyField.addEventListener('input', () => {
      if (previewArea.classList.contains('hidden')) return;
      clearTimeout(timer);
      timer = setTimeout(() => previewBtn.click() === previewBtn.click(), 600);
    });
  }

  // ── AI-paneel ──────────────────────────────────────────────────────
  const aiPanel = document.getElementById('aiPanel');
  const aiClose = document.getElementById('aiClose');
  const aiResult = document.getElementById('aiResult');
  const aiInstruction = document.getElementById('aiInstruction');
  const aiCustomBtn = document.getElementById('aiCustomBtn');

  let activeField = null;

  document.querySelectorAll('[data-ai-field]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fieldName = btn.dataset.aiField;
      activeField = document.getElementById('f_' + fieldName);
      if (!activeField) return;
      aiPanel.classList.remove('hidden');
      aiResult.classList.remove('has-result');
      aiResult.textContent = '';
    });
  });

  if (aiClose) {
    aiClose.addEventListener('click', () => {
      aiPanel.classList.add('hidden');
      activeField = null;
    });
  }

  async function runAi(payload) {
    if (!activeField) return;
    aiResult.classList.add('has-result');
    aiResult.textContent = 'AI denkt na…';
    try {
      const res = await fetch('/admin/api/ai/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          text: activeField.value,
          field: activeField.name,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Onbekende fout.');
      }
      const data = await res.json();
      renderResult(data.text);
    } catch (e) {
      aiResult.textContent = 'Fout: ' + e.message;
    }
  }

  function renderResult(text) {
    aiResult.textContent = '';
    const pre = document.createElement('div');
    pre.style.whiteSpace = 'pre-wrap';
    pre.textContent = text;
    aiResult.appendChild(pre);

    const actions = document.createElement('div');
    actions.className = 'ai-result__actions';

    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'btn btn--primary';
    apply.textContent = 'Overnemen';
    apply.addEventListener('click', () => {
      if (activeField) {
        activeField.value = text;
        activeField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      aiPanel.classList.add('hidden');
      activeField = null;
    });

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn btn--ghost';
    copy.textContent = 'Kopiëren';
    copy.addEventListener('click', () => {
      navigator.clipboard.writeText(text);
      copy.textContent = 'Gekopieerd ✓';
    });

    actions.appendChild(apply);
    actions.appendChild(copy);
    aiResult.appendChild(actions);
  }

  document.querySelectorAll('[data-ai-action]').forEach((btn) => {
    btn.addEventListener('click', () => runAi({ action: btn.dataset.aiAction }));
  });

  if (aiCustomBtn) {
    aiCustomBtn.addEventListener('click', () => {
      const instruction = aiInstruction.value.trim();
      if (!instruction) {
        aiResult.classList.add('has-result');
        aiResult.textContent = 'Vul eerst een instructie in.';
        return;
      }
      runAi({ instruction });
    });
  }
})();
