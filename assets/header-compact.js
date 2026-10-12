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
      const navigation = [...drawer.querySelectorAll('.header__mobile-drawer-item > a, .header__mobile-drawer-item > details > summary')];
      drawer.querySelectorAll('.header__mobile-drawer-list > li').forEach((item, index) => item.style.setProperty('--compact-item-index', index));
      let columnsVisible = window.innerWidth >= 768;
      let fastTimer;
      const followPanel = () => {
        root.classList.add('header-compact--fast');
        clearTimeout(fastTimer);
        fastTimer = setTimeout(() => root.classList.remove('header-compact--fast'), 420);
      };
      const measure = () => {
        if (!root.classList.contains('header-top--menu-open')) return;
        const showColumns = window.innerWidth >= 768;
        if (showColumns !== columnsVisible) {
          drawer.querySelectorAll('[data-mobile-drawer-submenu-details]').forEach(details => {
            details.open = false;
            details.classList.remove('is-mobile-submenu-active');
          });
          columnsVisible = showColumns;
        }
        const active = drawer.querySelector('[data-mobile-drawer-details][open] > .header__mobile-drawer-submenu');
        if (showColumns) {
          active?.querySelectorAll('[data-mobile-drawer-submenu-details]').forEach(details => { details.open = true; });
          const height = Math.max(summaries.length * 52, active?.scrollHeight || 0, 180);
          root.style.setProperty('--compact-menu-height', `${height}px`);
        }
        const surface = drawer.querySelector('.header__mobile-drawer-surface');
        if (surface) {
          const targetHeight = 64 + surface.offsetHeight + 2;
          root.style.setProperty('--compact-shell-height', `${targetHeight}px`);
          // The content adopts its new height immediately; the shell animates.
          // Keep utilities at the animated bottom rather than the target bottom.
          const footerShift = showColumns ? root.getBoundingClientRect().height - targetHeight : 0;
          root.style.setProperty('--compact-footer-shift', `${footerShift}px`);
        }
      };
      const choose = summary => {
        if (!root.classList.contains('header-top--menu-open') || window.innerWidth < 768) return;
        navigation.forEach(control => control.classList.toggle('is-compact-menu-active', control === summary));
        if (summary.tagName === 'SUMMARY') {
          if (!summary.parentElement.open) { followPanel(); summary.click(); }
        } else {
          followPanel();
          summaries.forEach(control => { control.parentElement.open = false; });
        }
        measure();
      };
      navigation.forEach(summary => {
        summary.addEventListener('pointerenter', () => choose(summary), options);
        summary.addEventListener('focus', () => choose(summary), options);
      });
      drawer.addEventListener('toggle', measure, { ...options, capture: true });
      drawer.addEventListener('click', () => { followPanel(); requestAnimationFrame(measure); }, options);
      drawer.addEventListener('click', event => {
        if (window.innerWidth < 768 || !event.target.closest('[data-mobile-drawer-submenu-details] > summary')) return;
        if (event.target.closest('a')) return;
        event.preventDefault();
        event.stopPropagation();
      }, { ...options, capture: true });
      drawer.addEventListener('open', () => {
        navigation.forEach(control => control.classList.remove('is-compact-menu-active'));
        if (window.innerWidth >= 768 && summaries[0]) choose(summaries[0]);
        measure();
      }, options);
      document.addEventListener('pointerdown', event => {
        const insideLocalization = [...drawer.querySelectorAll('[data-localization-dialog-id]')].some(details => {
          const dialog = document.getElementById(details.dataset.localizationDialogId);
          return dialog && !dialog.hidden && dialog.contains(event.target);
        });
        if (insideLocalization) return;
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
      observer.observe(drawer.querySelector('.header__mobile-drawer-surface'));
      observer.observe(root);
      instances.set(root, { controller, observer, clearTimer: () => { clearTimeout(fastTimer); root.classList.remove('header-compact--fast'); } });
    });
  };
  document.addEventListener('shopify:section:load', event => initialize(event.target));
  document.addEventListener('shopify:section:unload', event => {
    instances.forEach((instance, root) => {
      if (!event.target.contains(root)) return;
      instance.controller.abort();
      instance.observer.disconnect();
      instance.clearTimer();
      instances.delete(root);
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
  else initialize();
})();
