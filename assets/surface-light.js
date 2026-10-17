/* Shared proximity spotlight for bordered boxes; surface-light is an explicit opt-in. */
(() => {
  const root = document.documentElement;
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const items = new Map();
  let frame = 0, scanFrame = 0, pointerX = 0, pointerY = 0, pointerTarget = null, inside = false, running = false;
  const wake = () => { if (running && !frame) frame = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { const item = items.get(entry.target); if (item) item.visible = entry.isIntersecting; });
    wake();
  }, { rootMargin: '200px' });
  const surfaceTone = element => {
    // Resolve the visible solid surface rather than inheriting the text/accent color.
    for (let node = element; node; node = node.parentElement) {
      const color = getComputedStyle(node).backgroundColor;
      const channels = color.match(/^rgba?\(([^)]+)\)$/)?.[1].match(/[\d.]+/g)?.map(Number);
      if (!channels || (channels.length > 3 && channels[3] < .95)) continue;
      const [r,g,b] = channels.slice(0,3).map(value => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      });
      return .2126*r + .7152*g + .0722*b < .025 ? '#000' : '#fff';
    }
    return '#fff';
  };
  const scan = () => {
    scanFrame = 0;
    if (!running) return;
    const selector = [root.hasAttribute('data-surface-light-enabled') ? '.surface-light' : '', root.hasAttribute('data-button-light-enabled') ? '.button-light' : ''].filter(Boolean).join(',') || ':not(*)';
    items.forEach((item, element) => {
      if (!element.isConnected || !element.matches(selector)) { observer.unobserve(element); element.style.setProperty('--surface-light-opacity', '0'); items.delete(element); }
    });
    document.querySelectorAll(selector).forEach(element => {
      if (element.classList.contains('surface-light')) element.style.setProperty('--surface-light-tone', surfaceTone(element));
      if (items.has(element)) return;
      items.set(element, { element, reach: element.classList.contains('button-light') ? 100 : 170, x: 0, y: 0, intensity: 0, tightness: 0, visible: false });
      observer.observe(element);
    });
    wake();
  };
  const update = () => {
    frame = 0;
    let moving = false;
    const writes = [];
    items.forEach(item => {
      if (!item.visible && item.intensity === 0) return;
      const { element } = item;
      const header = element.classList.contains('surface-light--header');
      const rect = element.getBoundingClientRect();
      const hidden = !rect.width || !rect.height || element.closest('[hidden], [inert], [aria-hidden="true"]');
      let target = 0;
      if (inside && !hidden && item.visible) {
        const distance = Math.hypot(Math.max(rect.left - pointerX, 0, pointerX - rect.right), Math.max(rect.top - pointerY, 0, pointerY - rect.bottom));
        target = Math.max(0, 1 - distance / item.reach);
        target = target * target * (3 - 2 * target);
      }
      if (item.intensity < .02 && target > 0) { item.x = pointerX - rect.left; item.y = pointerY - rect.top; }
      const x = pointerX - rect.left, y = pointerY - rect.top;
      const positionEase = header ? .1 : .12;
      item.x += (x - item.x) * positionEase;
      item.y += (y - item.y) * positionEase;
      item.intensity += (target - item.intensity) * (target > item.intensity ? (header ? .1 : .12) : (header ? .05 : .06));
      const control = header && pointerTarget?.closest?.('.header-menu__summary, .header-menu__link, .header-menu__tertiary-link, .header__mobile-drawer-item > details > summary, .header__mobile-drawer-item > a, .header__mobile-drawer-submenu a, .header__mobile-drawer-submenu-details > summary, .header-mega-menu__banner, .header-localization__summary, [data-header-menu-back]');
      const targetTightness = header && inside && !hidden && (!element.classList.contains('header-top--compact') || element.classList.contains('header-top--menu-open')) && control && element.contains(control) ? 1 : 0;
      item.tightness += (targetTightness - item.tightness) * .14;
      if (Math.abs(targetTightness - item.tightness) < .004) item.tightness = targetTightness;
      if (Math.abs(target - item.intensity) < .004) item.intensity = target;
      writes.push(() => {
        element.style.setProperty('--surface-light-x', `${item.x.toFixed(1)}px`);
        element.style.setProperty('--surface-light-y', `${item.y.toFixed(1)}px`);
        element.style.setProperty('--surface-light-opacity', item.intensity.toFixed(3));
        if (header) {
          element.style.setProperty('--surface-light-glow-radius', `${(190 - 115 * item.tightness).toFixed(1)}px`);
          element.style.setProperty('--surface-light-edge-radius', `${(140 - 90 * item.tightness).toFixed(1)}px`);
          element.style.setProperty('--surface-light-strength', (.36 + .2 * item.tightness).toFixed(3));
        }
      });
      if (item.intensity !== target || item.tightness !== targetTightness || (target > 0 && (Math.abs(x - item.x) > .1 || Math.abs(y - item.y) > .1))) moving = true;
    });
    writes.forEach(write => write());
    if (moving) frame = requestAnimationFrame(update);
  };
  const mutations = new MutationObserver(records => {
    if (records.some(record => record.type === 'childList' || record.target.matches?.('.surface-light, .button-light') || items.has(record.target)) && !scanFrame) scanFrame = requestAnimationFrame(scan);
  });
  const synchronize = () => {
    running = (root.hasAttribute('data-surface-light-enabled') || root.hasAttribute('data-button-light-enabled')) && hover.matches && !reducedMotion.matches;
    if (running) { scan(); mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); }
    else {
      mutations.disconnect(); observer.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(scanFrame); frame = scanFrame = 0;
      items.forEach(({ element }) => element.style.setProperty('--surface-light-opacity', '0'));
      items.clear();
    }
  };
  document.addEventListener('pointermove', event => {
    if (!running || event.pointerType === 'touch') return;
    pointerX = event.clientX; pointerY = event.clientY; pointerTarget = event.target; inside = true; wake();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { inside = false; wake(); });
  window.addEventListener('blur', () => { inside = false; wake(); });
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake, { passive: true });
  document.addEventListener('close', wake, true);
  hover.addEventListener('change', synchronize);
  reducedMotion.addEventListener('change', synchronize);
  new MutationObserver(synchronize).observe(root, { attributes: true, attributeFilter: ['data-surface-light-enabled', 'data-button-light-enabled'] });
  synchronize();
})();
