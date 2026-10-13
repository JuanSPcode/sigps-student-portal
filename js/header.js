document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.header-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!toggleBtn || !navMenu) return;

  function toggleMobileMenu() {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    navMenu.classList.toggle('is-open', !isExpanded);

    const icon = toggleBtn.querySelector('svg');
    if (icon) {
      icon.innerHTML = !isExpanded
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>';
    }
  }

  function closeMobileMenu() {
    toggleBtn.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('is-open');
    const icon = toggleBtn.querySelector('svg');
    if (icon) {
      icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>';
    }
  }

  toggleBtn.addEventListener('click', toggleMobileMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeMobileMenu();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      closeMobileMenu();
      toggleBtn.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('is-open') &&
        !navMenu.contains(e.target) &&
        !toggleBtn.contains(e.target)) {
      closeMobileMenu();
    }
  });
});
