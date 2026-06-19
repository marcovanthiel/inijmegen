// Admin UI: WYSIWYG editor (Quill v2) voor de hoofdtekst.

(function () {
  'use strict';

  const editorEl = document.getElementById('quill-editor');
  const hiddenField = document.getElementById('f_body_md');
  if (!editorEl || !hiddenField || typeof Quill === 'undefined') return;

  const toolbar = [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote'],
    ['clean'],
  ];

  const quill = new Quill('#quill-editor', {
    theme: 'snow',
    modules: { toolbar },
    placeholder: 'Schrijf hier de tekst van de pagina…',
  });

  // Bestaande content laden. Als de opgeslagen waarde markdown is (uit de
  // tijd vóór de WYSIWYG), converteren we 'm bij laden naar HTML; daarna
  // wordt alles als HTML opgeslagen. marked passeert al-bestaande HTML
  // 1:1, dus heen-en-weer is verlies­vrij.
  const initial = hiddenField.value || '';
  const looksLikeHtml = /^\s*<[a-z!]/i.test(initial);
  const initialHtml =
    looksLikeHtml || typeof marked === 'undefined'
      ? initial
      : marked.parse(initial);
  quill.root.innerHTML = initialHtml;

  function sync() {
    // getSemanticHTML levert nettere output dan root.innerHTML (geen
    // Quill-specifieke wrappers).
    hiddenField.value = quill.getSemanticHTML();
  }
  quill.on('text-change', sync);

  const form = hiddenField.closest('form');
  if (form) form.addEventListener('submit', sync);
})();
