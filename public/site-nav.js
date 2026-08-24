(() => {
  const menu = document.createElement('header');
  menu.className = 'site-global-nav';
  menu.innerHTML = `
    <button class="site-menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu">
      <span class="site-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
      <span>Menu</span>
    </button>
    <nav id="site-menu" class="site-menu" aria-label="Site navigation" hidden>
      <a href="/">Towing Calculator</a>
      <a href="/#vin-form">VIN Lookup</a>
      <a href="/#trailer-fit">What RAM Fits My Trailer?</a>
      <a href="/ram-towing-guides">Towing Guides</a>
      <a href="/how-ramtow-calculates-towing-capacity">How RAM Tow Works</a>
      <a href="/disclaimer">Disclaimer</a>
    </nav>
  `;

  document.body.prepend(menu);

  const toggle = menu.querySelector('.site-menu-toggle');
  const panel = menu.querySelector('.site-menu');
  const setOpen = (isOpen) => {
    toggle.setAttribute('aria-expanded', String(isOpen));
    panel.hidden = !isOpen;
  };

  toggle.addEventListener('click', () => {
    setOpen(panel.hidden);
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setOpen(false);
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!panel.hidden && !menu.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
