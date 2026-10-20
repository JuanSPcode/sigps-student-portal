document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.header-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!toggleBtn || !navMenu) return;

  function setMobileMenuOpen(isOpen) {
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    toggleBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    navMenu.classList.toggle('is-open', isOpen);

    const icon = toggleBtn.querySelector('svg');
    if (icon) {
      const path = icon.querySelector('path');
      if (path) {
        path.setAttribute('d', isOpen
          ? 'M6 18L18 6M6 6l12 12'
          : 'M4 6h16M4 12h16M4 18h16');
      }
    }
  }

  function toggleMobileMenu() {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    setMobileMenuOpen(!isExpanded);
  }

  const closeMobileMenu = () => setMobileMenuOpen(false);

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

  const desktopViewport = window.matchMedia('(min-width: 769px)');
  const closeWhenDesktop = (event) => {
    if (event.matches) closeMobileMenu();
  };
  if (desktopViewport.addEventListener) {
    desktopViewport.addEventListener('change', closeWhenDesktop);
  } else {
    desktopViewport.addListener(closeWhenDesktop);
  }
});
