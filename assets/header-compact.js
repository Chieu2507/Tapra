/* Compact shell enhancement. Menu, overlays, cart and utilities retain their
   existing block/controller ownership. */
(() => {
  const instances = new Map();
  const initialize = (scope = document) => {
    scope.querySelectorAll('.header-top--compact').forEach(root => {
      if (instances.has(root)) return;
      const controller = new AbortController();
      const options = { signal: controller.signal };
      const surfaceDuration = () => {
        const value = getComputedStyle(root).getPropertyValue('--motion-duration-surface').trim();
        return (parseFloat(value) || 0) * (value.endsWith('ms') ? 1 : 1000);
      };
      const drawer = root.querySelector('[data-header-mobile-drawer]');
      if (!drawer) return;
      const summaries = [...drawer.querySelectorAll('[data-mobile-drawer-details] > summary')];
      const navigation = [...drawer.querySelectorAll('.header__mobile-drawer-item > a, .header__mobile-drawer-item > details > summary')];
      drawer.querySelectorAll('.header__mobile-drawer-list > li').forEach((item, index) => item.style.setProperty('--compact-item-index', index));
      let columnsVisible = window.innerWidth >= 768;
      let fastTimer, hoverTimer, measureFrame = 0, footerFrame = 0, openingUntil = 0;
      const cancelHover = () => { clearTimeout(hoverTimer); hoverTimer = null; };
      const setVariable = (element, name, value) => {
        if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
      };
      const synchronizeFooter = () => {
        footerFrame = 0;
        if (drawer.dataset.state === 'closing' || !root.classList.contains('header-top--menu-open')) return;
        const targetHeight = parseFloat(root.style.getPropertyValue('--compact-shell-height')) || 0;
        const shift = window.innerWidth >= 768 && targetHeight ? root.getBoundingClientRect().height - targetHeight : 0;
        setVariable(root, '--compact-footer-shift', `${shift}px`);
        root.classList.toggle('header-compact--resizing', Math.abs(shift) > 0.5);
      };
      const scheduleFooter = () => { if (!footerFrame) footerFrame = requestAnimationFrame(synchronizeFooter); };
      const scheduleMeasure = () => { if (!measureFrame) measureFrame = requestAnimationFrame(() => { measureFrame = 0; measure(); }); };
      const followPanel = () => {
        // Keep the opening curve intact; fast sizing is only for later panel changes.
        if (performance.now() < openingUntil) return;
        root.classList.add('header-compact--fast');
        clearTimeout(fastTimer);
        fastTimer = setTimeout(() => root.classList.remove('header-compact--fast'), surfaceDuration());
      };
      const measure = () => {
        // Preserve shell measurements throughout the exit transition.
        if (drawer.dataset.state === 'closing') return;
        if (!root.classList.contains('header-top--menu-open')) {
          if (document.querySelector(".search-overlay--compact:is([data-state='opening'], [data-state='open'], [data-state='closing'])")) return;
          setVariable(root, '--compact-footer-shift', '0px');
          root.classList.remove('header-compact--resizing');
          return;
        }
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
          const mega = active?.querySelector('[data-header-mega-menu]');
          const megaStyle = mega && getComputedStyle(mega);
          if (active) setVariable(active, '--compact-banner-width', megaStyle?.getPropertyValue('--mega-banner-width') || '40%');
          if (active) setVariable(active, '--compact-banner-gap', megaStyle?.getPropertyValue('--mega-menu-gap') || '12px');
          setVariable(root, '--compact-menu-columns', String(Number(megaStyle?.getPropertyValue('--mega-menu-columns')) || active?.querySelector(':scope > ul')?.children.length || 4));
          if (active) setVariable(active, '--compact-submenu-max-width', mega?.classList.contains('header-mega-menu--submenu-limited') ? megaStyle.getPropertyValue('--mega-menu-max-width') : 'none');
          active?.querySelectorAll('[data-mobile-drawer-submenu-details]').forEach(details => { if (!details.open) details.open = true; });
          const height = Math.max(summaries.length * 52, active?.scrollHeight || 0, 180);
          setVariable(root, '--compact-menu-height', `${height}px`);
        }
        const surface = drawer.querySelector('.header__mobile-drawer-surface');
        if (surface) {
          const shellStyle = getComputedStyle(root);
          const targetHeight = 64 + surface.offsetHeight + parseFloat(shellStyle.paddingTop) + parseFloat(shellStyle.paddingBottom) + parseFloat(shellStyle.borderTopWidth) + parseFloat(shellStyle.borderBottomWidth);
          setVariable(root, '--compact-shell-height', `${targetHeight}px`);
          synchronizeFooter();
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
        scheduleMeasure();
      };
      navigation.forEach(summary => {
        if (drawer.dataset.dropdownTrigger !== 'click') {
          summary.addEventListener('pointerenter', () => {
            cancelHover();
            // Keep the current panel while the pointer crosses nearby rows.
            hoverTimer = setTimeout(() => { hoverTimer = null; choose(summary); }, 160);
          }, options);
          summary.addEventListener('pointerleave', cancelHover, options);
        }
        summary.addEventListener('focus', () => { cancelHover(); choose(summary); }, options);
        summary.addEventListener('click', cancelHover, options);
      });
      drawer.addEventListener('toggle', scheduleMeasure, { ...options, capture: true });
      drawer.addEventListener('click', () => { followPanel(); scheduleMeasure(); }, options);
      drawer.addEventListener('click', event => {
        if (window.innerWidth < 768 || !event.target.closest('[data-mobile-drawer-submenu-details] > summary')) return;
        if (event.target.closest('a')) return;
        event.preventDefault();
        event.stopPropagation();
      }, { ...options, capture: true });
      const synchronizeOpenMenu = (preserveSelection = false) => {
        cancelHover();
        openingUntil = performance.now() + surfaceDuration();
        clearTimeout(fastTimer);
        root.classList.remove('header-compact--fast');
        navigation.forEach(control => control.classList.remove('is-compact-menu-active'));
        if (window.innerWidth >= 768) {
          const selected = preserveSelection ? summaries.find(control => control.parentElement.open) : null;
          if (selected || summaries[0]) choose(selected || summaries[0]);
        }
        scheduleMeasure();
      };
      drawer.addEventListener('open', () => synchronizeOpenMenu(), options);
      drawer.addEventListener('closing', cancelHover, options);
      document.addEventListener('pointerdown', event => {
        const insideLocalization = [...drawer.querySelectorAll('[data-localization-dialog-id]')].some(details => {
          const dialog = document.getElementById(details.dataset.localizationDialogId);
          return dialog && !dialog.hidden && dialog.contains(event.target);
        });
        if (insideLocalization) return;
        if (root.classList.contains('header-top--menu-open') && !root.contains(event.target)) {
          window.ThemeOverlay?.get(drawer)?.close({ restoreFocus: false });
        }
      }, options);
      document.addEventListener('shopify:block:select', event => {
        if (!root.contains(event.target) || event.target.closest('.header-logo, .header-cart, .header-menu-toggle')) return;
        if (!root.classList.contains('header-top--menu-open')) root.querySelector('.header-menu-toggle')?.click();
      }, options);
      drawer.addEventListener('close', () => { openingUntil = 0; clearTimeout(fastTimer); root.classList.remove('header-compact--fast'); scheduleMeasure(); }, options);
      window.addEventListener('resize', scheduleMeasure, options);
      drawer.addEventListener('load', scheduleMeasure, { ...options, capture: true });
      document.fonts?.ready.then(() => { if (!controller.signal.aborted) scheduleMeasure(); });
      const observer = new ResizeObserver(scheduleMeasure);
      const shellObserver = new ResizeObserver(scheduleFooter);
      drawer.querySelectorAll('.header__mobile-drawer-submenu').forEach(panel => observer.observe(panel));
      observer.observe(drawer.querySelector('.header__mobile-drawer-surface'));
      shellObserver.observe(root);
      instances.set(root, { controller, observer, shellObserver, clearTimer: () => { cancelAnimationFrame(measureFrame); cancelAnimationFrame(footerFrame); cancelHover(); clearTimeout(fastTimer); root.classList.remove('header-compact--fast'); } });
      // Catch an open event that happened before this deferred script was ready.
      if (root.classList.contains('header-top--menu-open') && ['opening', 'open'].includes(drawer.dataset.state)) synchronizeOpenMenu(true);
    });
  };
  document.addEventListener('shopify:section:load', event => initialize(event.target));
  document.addEventListener('shopify:section:unload', event => {
    instances.forEach((instance, root) => {
      if (!event.target.contains(root)) return;
      instance.controller.abort();
      instance.observer.disconnect();
      instance.shellObserver.disconnect();
      instance.clearTimer();
      instances.delete(root);
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initialize(), { once: true });
  else initialize();
})();
