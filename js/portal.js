document.addEventListener('DOMContentLoaded', () => {
  const checklist = Array.from(document.querySelectorAll('.checklist-item input[type="checkbox"]'));
  const checklistCount = document.querySelector('#checklist-count');
  const clearChecklist = document.querySelector('.checklist-reset');
  const printChecklist = document.querySelector('[data-checklist-print]');
  const downloadChecklist = document.querySelector('[data-checklist-download]');
  const storagePrefix = 'sigps-portal-checklist-v1:';

  function updateChecklistCount() {
    if (!checklistCount) return;
    checklistCount.textContent = String(checklist.filter((item) => item.checked).length);
  }

  checklist.forEach((item) => {
    const key = `${storagePrefix}${item.dataset.checklistId}`;
    try {
      item.checked = sessionStorage.getItem(key) === 'true';
    } catch {
      item.checked = false;
    }

    item.addEventListener('change', () => {
      try {
        sessionStorage.setItem(key, String(item.checked));
      } catch {}
      updateChecklistCount();
    });
  });

  clearChecklist?.addEventListener('click', () => {
    checklist.forEach((item) => {
      item.checked = false;
      try {
        sessionStorage.removeItem(`${storagePrefix}${item.dataset.checklistId}`);
      } catch {}
    });
    updateChecklistCount();
  });

  printChecklist?.addEventListener('click', () => window.print());

  downloadChecklist?.addEventListener('click', () => {
    const groups = Array.from(document.querySelectorAll('.checklist-group')).map((group) => {
      const title = group.querySelector('legend')?.textContent.trim() ?? '';
      const groupItems = Array.from(group.querySelectorAll('input[type="checkbox"]')).map((item) => {
        const label = item.closest('label')?.querySelector('span')?.textContent.trim() ?? '';
        return `<li><label><input type="checkbox"${item.checked ? ' checked' : ''}> ${label}</label></li>`;
      }).join('\n');
      return `<section><h2>${title}</h2><ul>${groupItems}</ul></section>`;
    }).join('\n');
    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Checklist de servicio social · FMO–UES</title>
<style>
body{max-width:800px;margin:40px auto;padding:0 24px;color:#202a38;font:16px/1.6 Arial,sans-serif}h1{color:#991b32}section{margin:28px 0;padding:18px;border:1px solid #dee3ea;border-radius:10px}ul{padding:0;list-style:none}li{margin:12px 0}input{width:18px;height:18px;vertical-align:middle;accent-color:#991b32}@media print{body{margin:0 auto}section{break-inside:avoid}}
</style>
</head>
<body>
<main><h1>Checklist informativo de servicio social</h1><p>FMO–UES · Unidad de Proyección Social</p>${groups}<p>Esta guía es informativa. No verifica documentos ni confirma entregas; consulta los requisitos oficiales con la UPS.</p></main>
</body>
</html>`;
    const file = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'checklist-servicio-social.html';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  updateChecklistCount();
});
