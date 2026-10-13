/* Shared proximity spotlight. Opt in with surface-light, or its --button / --line variant. */
(() => {
  const root = document.documentElement;
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = [
    ['.image-card, .collection-card-kernel', 'surface-light--image', 170],
    ['.surface-light:not(.surface-light--button):not(.surface-light--line), .product-card, .blog-card, .testimonial-item, .component-overlay__panel', '', 170],
    ['.btn:not(.header-menu-toggle):not(.btn--tertiary):not(.link-underline), .surface-light--button', 'surface-light--button', 100],
    ['.footer__container, .surface-light--line', 'surface-light--line', 40],
  ];
  const items = new Map();
  let frame = 0, scanFrame = 0, pointerX = 0, pointerY = 0, inside = false, running = false;
  const wake = () => { if (running && !frame) frame = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { const item = items.get(entry.target); if (item) item.visible = entry.isIntersecting; });
    wake();
  }, { rootMargin: '200px' });
  const scan = () => {
    scanFrame = 0;
    if (!running) return;
    items.forEach((item, element) => {
      if (!element.isConnected) { observer.unobserve(element); items.delete(element); }
    });
    groups.forEach(([selector, variant, reach]) => {
      document.querySelectorAll(selector).forEach(element => {
        if (items.has(element)) return;
        element.classList.add('surface-light');
        if (variant) element.classList.add(variant);
        items.set(element, { element, reach, x: 0, y: 0, intensity: 0, visible: false });
        observer.observe(element);
      });
    });
    wake();
  };
  const update = () => {
    frame = 0;
    let moving = false;
    items.forEach(item => {
      if (!item.visible && item.intensity === 0) return;
      const { element } = item;
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
      item.x += (x - item.x) * .12;
      item.y += (y - item.y) * .12;
      item.intensity += (target - item.intensity) * (target > item.intensity ? .12 : .06);
      if (Math.abs(target - item.intensity) < .004) item.intensity = target;
      element.style.setProperty('--surface-light-x', `${item.x.toFixed(1)}px`);
      element.style.setProperty('--surface-light-y', `${item.y.toFixed(1)}px`);
      element.style.setProperty('--surface-light-opacity', item.intensity.toFixed(3));
      if (item.intensity !== target || (target > 0 && (Math.abs(x - item.x) > .1 || Math.abs(y - item.y) > .1))) moving = true;
    });
    if (moving) frame = requestAnimationFrame(update);
  };
  const mutations = new MutationObserver(records => {
    if (records.some(record => record.addedNodes.length || record.removedNodes.length) && !scanFrame) scanFrame = requestAnimationFrame(scan);
  });
  const synchronize = () => {
    running = root.hasAttribute('data-surface-light-enabled') && hover.matches && !reducedMotion.matches;
    if (running) { scan(); mutations.observe(document.body, { childList: true, subtree: true }); }
    else {
      mutations.disconnect(); observer.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(scanFrame); frame = scanFrame = 0;
      items.forEach(({ element }) => element.style.setProperty('--surface-light-opacity', '0'));
      items.clear();
    }
  };
  document.addEventListener('pointermove', event => {
    if (!running || event.pointerType === 'touch') return;
    pointerX = event.clientX; pointerY = event.clientY; inside = true; wake();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { inside = false; wake(); });
  window.addEventListener('blur', () => { inside = false; wake(); });
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake, { passive: true });
  document.addEventListener('close', wake, true);
  hover.addEventListener('change', synchronize);
  reducedMotion.addEventListener('change', synchronize);
  new MutationObserver(synchronize).observe(root, { attributes: true, attributeFilter: ['data-surface-light-enabled'] });
  synchronize();
})();
