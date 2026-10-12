/* Compact shell enhancement. Menu, overlays, cart and utilities retain their
   existing block/controller ownership. */
(() => {
  const instances = new Map();
  const initialize = (scope = document) => {
    scope.querySelectorAll('.header-top--compact').forEach(root => {
      if (instances.has(root)) return;
      const controller = new AbortController();
      const options = { signal: controller.signal };
      const drawer = root.querySelector('[data-header-mobile-drawer]');
      if (!drawer) return;
      const summaries = [...drawer.querySelectorAll('[data-mobile-drawer-details] > summary')];
      let columnsVisible = window.innerWidth >= 768;
      const measure = () => {
        const showColumns = window.innerWidth >= 768;
        if (showColumns !== columnsVisible) {
          drawer.querySelectorAll('[data-mobile-drawer-submenu-details]').forEach(details => {
            details.open = false;
            details.classList.remove('is-mobile-submenu-active');
          });
          columnsVisible = showColumns;
        }
        if (window.innerWidth < 768) return;
        const active = drawer.querySelector('[data-mobile-drawer-details][open] > .header__mobile-drawer-submenu');
        active?.querySelectorAll('[data-mobile-drawer-submenu-details]').forEach(details => { details.open = true; });
        const height = Math.max(summaries.length * 52, active?.scrollHeight || 0, 180);
        root.style.setProperty('--compact-menu-height', `${height}px`);
      };
      const choose = summary => {
        if (!root.classList.contains('header-top--menu-open') || window.innerWidth < 768) return;
        if (!summary.parentElement.open) summary.click();
        measure();
      };
      summaries.forEach(summary => {
        summary.addEventListener('pointerenter', () => choose(summary), options);
        summary.addEventListener('focus', () => choose(summary), options);
      });
      drawer.addEventListener('toggle', measure, { ...options, capture: true });
      drawer.addEventListener('click', event => {
        if (window.innerWidth < 768 || !event.target.closest('[data-mobile-drawer-submenu-details] > summary')) return;
        if (event.target.closest('a')) return;
        event.preventDefault();
        event.stopPropagation();
      }, { ...options, capture: true });
      drawer.addEventListener('open', () => {
        if (window.innerWidth >= 768 && summaries[0]) choose(summaries[0]);
        measure();
      }, options);
      document.addEventListener('pointerdown', event => {
        if (root.classList.contains('header-top--menu-open') && !root.contains(event.target)) {
          window.ThemeOverlay?.get(drawer)?.close({ restoreFocus: true });
        }
      }, options);
      document.addEventListener('shopify:block:select', event => {
        if (!root.contains(event.target) || event.target.closest('.header-logo, .header-cart, .header-menu-toggle')) return;
        if (!root.classList.contains('header-top--menu-open')) root.querySelector('.header-menu-toggle')?.click();
      }, options);
      window.addEventListener('resize', measure, options);
      const observer = new ResizeObserver(measure);
      drawer.querySelectorAll('.header__mobile-drawer-submenu').forEach(panel => observer.observe(panel));
      instances.set(root, { controller, observer });
    });
  };
  document.addEventListener('shopify:section:load', event => initialize(event.target));
  document.addEventListener('shopify:section:unload', event => {
    instances.forEach((instance, root) => {
      if (!event.target.contains(root)) return;
      instance.controller.abort();
      instance.observer.disconnect();
      instances.delete(root);
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
  else initialize();
})();
