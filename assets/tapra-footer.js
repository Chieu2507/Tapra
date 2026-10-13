/* Scroll reveal owned by the footer; each instance cleans up on editor unload. */
(() => {
  if (window.TapraFooter) { window.TapraFooter.init(document); return; }
  const instances = new Map();
  const selector = '[data-tapra-footer]';
  function mount(root) {
    if (instances.has(root)) return;
    const surface = root.querySelector('.tapra-footer');
    const wordmark = root.querySelector('[data-footer-wordmark]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let disposed = false;
    const reset = () => {
      surface.style.transform = '';
      if (wordmark) { wordmark.style.transform = ''; wordmark.style.opacity = ''; }
    };
    const update = () => {
      frame = 0;
      if (disposed) return;
      if (motion.matches || root.dataset.footerEditing === 'true' || root.dataset.scrollEffect !== 'true' || root.contains(document.activeElement)) { reset(); return; }
      const rect = root.getBoundingClientRect();
      const height = Math.min(rect.height, window.innerHeight);
      if (!height) { reset(); return; }
      const visible = Math.max(0, Math.min(height, window.innerHeight - rect.top));
      const progress = visible / height;
      surface.style.transform = `translate3d(0, ${-(height - visible).toFixed(1)}px, 0)`;
      if (wordmark) {
        wordmark.style.transform = `translate3d(0, ${((1 - progress) * wordmark.parentElement.offsetHeight * .5).toFixed(1)}px, 0)`;
        wordmark.style.opacity = (.35 + .65 * progress).toFixed(2);
      }
    };
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    motion.addEventListener('change', schedule);
    root.addEventListener('focusin', schedule);
    root.addEventListener('focusout', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    const destroy = () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
      root.removeEventListener('focusin', schedule);
      root.removeEventListener('focusout', schedule);
      reset();
      delete root.dataset.footerEditing;
      instances.delete(root);
    };
    destroy.schedule = schedule;
    instances.set(root, destroy);
    schedule();
  }
  const init = (scope) => {
    if (scope.matches?.(selector)) mount(scope);
    scope.querySelectorAll(selector).forEach(mount);
  };
  window.TapraFooter = { init };
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:unload', (event) => {
    for (const [root, destroy] of instances) if (event.target.contains(root)) destroy();
  });
  for (const name of ['shopify:block:select', 'shopify:block:deselect']) {
    document.addEventListener(name, event => {
      for (const [root, destroy] of instances) if (root.contains(event.target)) {
        root.dataset.footerEditing = String(name === 'shopify:block:select');
        destroy.schedule();
      }
    });
  }
  init(document);
})();
