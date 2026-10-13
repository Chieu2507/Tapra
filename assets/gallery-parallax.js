(() => {
  if (window.GalleryParallax) { window.GalleryParallax.init(document); return; }
  const states = new Map();
  const selector = '[data-gallery-parallax][data-gallery-layout="parallax"]';
  const clamp = value => Math.max(0, Math.min(1, value));
  function mount(root) {
    if (states.has(root)) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 767.98px)');
    const controller = new AbortController();
    const options = { signal: controller.signal };
    let items = [], columns = [], count = 0, firstColumns = false, frame = 0, visible = true;
    const isEditor = () => Boolean(window.Shopify?.designMode);
    function group() {
      const current = [...root.querySelectorAll('.gallery-image')];
      const style = getComputedStyle(root);
      const nextCount = Math.max(1, parseInt(style.getPropertyValue(mobile.matches ? '--gallery-grid-columns-mobile' : '--gallery-grid-columns'), 10) || 1);
      const nextFirst = mobile.matches && root.dataset.mobileColumnsMode === 'first_columns' && !isEditor();
      if (nextCount === count && nextFirst === firstColumns && current.length === items.length && current.every(item => items.includes(item))) return;
      items = current.sort((a, b) => (Number(a.dataset.galleryOrder) || 0) - (Number(b.dataset.galleryOrder) || 0));
      items.forEach((item, index) => { if (!item.hasAttribute('data-gallery-order')) item.dataset.galleryOrder = String(index); });
      columns.forEach(column => column.remove());
      count = nextCount; firstColumns = nextFirst;
      const desktopCount = Math.max(1, parseInt(style.getPropertyValue('--gallery-grid-columns'), 10) || count);
      const actualCount = firstColumns ? desktopCount : count;
      columns = Array.from({ length: actualCount }, (_, index) => {
        const column = document.createElement('div');
        column.className = 'gallery-parallax__column';
        column.hidden = index >= count;
        column.style.setProperty('--gallery-parallax-column-stagger', index % 2 ? style.getPropertyValue('--gallery-parallax-stagger') : '0px');
        root.append(column); return column;
      });
      items.forEach((item, index) => columns[index % actualCount].append(item));
      root.classList.add('is-parallax-ready');
    }
    function update() {
      frame = 0;
      group();
      const accessible = isEditor() || root.contains(document.activeElement);
      root.dataset.galleryAccessible = String(accessible);
      const rect = root.getBoundingClientRect();
      const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
      const distance = parseFloat(getComputedStyle(root).getPropertyValue('--gallery-parallax-distance')) || 0;
      columns.forEach((column, index) => {
        const direction = root.dataset.parallaxDirection === 'down' ? 1 : root.dataset.parallaxDirection === 'up' ? -1 : index % 2 ? 1 : -1;
        column.style.transform = accessible || motion.matches ? '' : `translate3d(0, ${((progress * 2 - 1) * distance * direction).toFixed(2)}px, 0)`;
      });
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', () => { if (visible) schedule(); }, { ...options, passive: true });
    window.addEventListener('resize', schedule, { ...options, passive: true });
    root.addEventListener('focusin', schedule, options);
    root.addEventListener('focusout', schedule, options);
    motion.addEventListener('change', schedule, options);
    mobile.addEventListener('change', schedule, options);
    const resize = new ResizeObserver(schedule); resize.observe(root);
    const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) schedule(); }); intersection.observe(root);
    const mutations = new MutationObserver(schedule); mutations.observe(root, { childList: true, subtree: true });
    group(); schedule();
    document.fonts?.ready.then(() => { if (!controller.signal.aborted) schedule(); });
    states.set(root, () => {
      controller.abort(); cancelAnimationFrame(frame); resize.disconnect(); intersection.disconnect(); mutations.disconnect();
      items.forEach(item => { root.append(item); delete item.dataset.galleryOrder; });
      columns.forEach(column => column.remove());
      root.classList.remove('is-parallax-ready'); delete root.dataset.galleryAccessible;
      states.delete(root);
    });
  }
  const init = scope => {
    if (scope.matches?.(selector)) mount(scope);
    scope.querySelectorAll(selector).forEach(mount);
  };
  window.GalleryParallax = { init };
  document.addEventListener('shopify:section:load', event => init(event.target));
  document.addEventListener('shopify:section:unload', event => {
    for (const [root, destroy] of states) if (event.target.contains(root)) destroy();
  });
  document.addEventListener('shopify:block:select', event => {
    for (const root of states.keys()) if (root.contains(event.target)) root.dataset.galleryAccessible = 'true';
  });
  init(document);
})();
