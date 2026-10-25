/* Floating document settings. No chat service, framework or remote endpoint. */
(() => {
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>';
  const container = document.createElement('div');
  container.className = 'document-tools';
  container.innerHTML = `
    <button type="button" class="document-tools-launcher" aria-label="Opciones de documentos" aria-haspopup="dialog" aria-controls="document-mode-dialog" aria-expanded="false" title="Documentos · Arrastra para mover; usa las flechas con el teclado">
      ${icon}<span>Documentos</span>
    </button>
    <dialog id="document-mode-dialog" class="document-mode-dialog" aria-labelledby="document-mode-title" aria-describedby="document-mode-description">
      <div class="document-mode-heading">
        <span class="document-mode-icon">${icon}</span>
        <button type="button" class="document-mode-close" aria-label="Cerrar opciones de documentos" autofocus>×</button>
      </div>
      <h2 id="document-mode-title">Tus documentos</h2>
      <p id="document-mode-description">Elige de dónde se obtienen las plantillas.</p>
      <div class="document-mode-options" role="group" aria-label="Modo de documentos">
        <button type="button" class="document-mode-option is-active" aria-pressed="true" id="document-mode-static">
          <span class="document-mode-option-title">Modo estático <span class="document-mode-badge">Activo</span></span>
          <span>Usa los documentos incluidos en el portal. No necesita un servidor adicional.</span>
        </button>
        <button type="button" class="document-mode-option" disabled aria-pressed="false">
          <span class="document-mode-option-title">Modo servidor <span class="document-mode-badge">Próximamente</span></span>
          <span>Obtendrá las plantillas desde el servidor cuando esté disponible.</span>
        </button>
      </div>
      <div class="document-mode-footer">
        <p>Puedes arrastrar el botón flotante para moverlo.</p>
        <button type="button" class="document-mode-reset">Restablecer posición</button>
      </div>
      <button type="button" class="document-mode-done">Listo</button>
    </dialog>`;
  document.body.append(container);

  const launcher = container.querySelector('.document-tools-launcher');
  const dialog = container.querySelector('dialog');
  const storageKey = 'sigps.document-tools.position.v1';
  let position = null, gesture = null, dragged = false;
  const bounds = () => ({x: Math.max(12, innerWidth - launcher.offsetWidth - 12), y: Math.max(12, innerHeight - launcher.offsetHeight - 12)});
  function place(x, y) {
    const max = bounds();
    position = {x: Math.max(12, Math.min(x, max.x)), y: Math.max(12, Math.min(y, max.y))};
    Object.assign(launcher.style, {left: position.x + 'px', top: position.y + 'px', right: 'auto', bottom: 'auto'});
  }
  function remember() {
    const max = bounds();
    try { localStorage.setItem(storageKey, JSON.stringify({x: position.x / max.x, y: position.y / max.y})); } catch { /* Position is optional. */ }
  }
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored && [stored.x, stored.y].every(n => Number.isFinite(n) && n >= 0 && n <= 1)) {
      const max = bounds(); place(stored.x * max.x, stored.y * max.y);
    }
  } catch { /* Work normally when storage is blocked. */ }

  launcher.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const rect = launcher.getBoundingClientRect();
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top};
    dragged = false;
    launcher.setPointerCapture(event.pointerId);
  });
  launcher.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!dragged && Math.hypot(dx, dy) < 6) return;
    dragged = true;
    launcher.classList.add('is-dragging');
    place(gesture.left + dx, gesture.top + dy);
  });
  function finish(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (dragged) remember();
    gesture = null;
    launcher.classList.remove('is-dragging');
    if (launcher.hasPointerCapture(event.pointerId)) launcher.releasePointerCapture(event.pointerId);
  }
  launcher.addEventListener('pointerup', finish);
  launcher.addEventListener('pointercancel', finish);
  launcher.addEventListener('lostpointercapture', finish);
  launcher.addEventListener('click', event => {
    if (dragged && event.detail !== 0) { dragged = false; return; }
    if (!dialog.open) dialog.showModal();
    launcher.setAttribute('aria-expanded', 'true');
  });
  launcher.addEventListener('keydown', event => {
    const direction = {ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16]}[event.key];
    if (!direction) return;
    event.preventDefault();
    const rect = launcher.getBoundingClientRect();
    place(rect.left + direction[0], rect.top + direction[1]); remember();
  });
  window.addEventListener('resize', () => { if (position) place(position.x, position.y); });
  container.querySelector('.document-mode-reset').addEventListener('click', () => {
    position = null;
    launcher.removeAttribute('style');
    try { localStorage.removeItem(storageKey); } catch { /* Optional preference. */ }
  });
  for (const selector of ['.document-mode-close', '.document-mode-done', '#document-mode-static']) {
    container.querySelector(selector).addEventListener('click', () => dialog.close());
  }
  let backdrop = false;
  dialog.addEventListener('pointerdown', event => { backdrop = event.target === dialog; });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (backdrop && event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    backdrop = false;
  });
  dialog.addEventListener('close', () => {
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus({preventScroll: true});
  });
})();
