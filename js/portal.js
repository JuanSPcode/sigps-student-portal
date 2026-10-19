document.addEventListener('DOMContentLoaded', () => {
  const filters = Array.from(document.querySelectorAll('[data-stage-filter]'));
  const groups = Array.from(document.querySelectorAll('[data-stage]'));

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const selectedStage = filter.dataset.stageFilter;
      const shouldClear = filter.getAttribute('aria-pressed') === 'true';

      filters.forEach((button) => {
        const isSelected = !shouldClear && button === filter;
        button.setAttribute('aria-pressed', String(isSelected));
        button.classList.toggle('is-active', isSelected);
      });

      groups.forEach((group) => {
        group.hidden = !shouldClear && group.dataset.stage !== selectedStage;
      });
    });
  });

  const checklist = Array.from(document.querySelectorAll('.checklist-item input[type="checkbox"]'));
  const checklistCount = document.querySelector('#checklist-count');
  const clearChecklist = document.querySelector('.checklist-reset');

  function updateChecklistCount() {
    if (!checklistCount) return;
    const checkedCount = checklist.filter((item) => item.checked).length;
    checklistCount.textContent = String(checkedCount);
  }

  checklist.forEach((item) => item.addEventListener('change', updateChecklistCount));

  if (clearChecklist) {
    clearChecklist.addEventListener('click', () => {
      checklist.forEach((item) => {
        item.checked = false;
      });
      updateChecklistCount();
    });
  }
});
