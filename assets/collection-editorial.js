(() => {
  if (window.collectionEditorialInitialized) return;
  window.collectionEditorialInitialized = true;
  const controllers = new Map();
  const setup = root => {
    root.querySelectorAll('[data-ce-section]').forEach(section => {
      if (controllers.has(section)) return;
      const controller = new AbortController();
      const { signal } = controller;
      let frame = 0;
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => {
        frame = 0;
        if (motion.matches) return;
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
        section.style.setProperty('--ce-parallax-y', `${(progress - .5) * rect.height * .16}px`);
        section.style.setProperty('--ce-parallax-x', `${(progress - .5) * rect.width * .16}px`);
        section.style.setProperty('--ce-parallax-scale', `${1 + progress * .15}`);
        section.style.setProperty('--ce-fixed-position', `${progress * 100}%`);
      };
      const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
      if (section.dataset.ceParallax !== 'none' && section.querySelector('.ce-background')) {
        addEventListener('scroll', schedule, { passive: true, signal });
        addEventListener('resize', schedule, { passive: true, signal });
        motion.addEventListener('change', schedule, { signal });
        schedule();
      }
      controllers.set(section, () => { controller.abort(); cancelAnimationFrame(frame); });
    });
  };
  const teardown = root => {
    controllers.forEach((destroy, section) => {
      if (root === section || root.contains(section)) { destroy(); controllers.delete(section); }
    });
  };
  document.addEventListener('shopify:section:load', event => { teardown(event.target); setup(event.target); });
  document.addEventListener('shopify:section:unload', event => teardown(event.target));
  for (const type of ['select', 'deselect']) document.addEventListener(`shopify:block:${type}`, event => {
    event.target.closest('.ce-item')?.classList.toggle('is-editor-selected', type === 'select');
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup(document), { once: true });
  else setup(document);
})();
