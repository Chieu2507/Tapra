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
    function group() {
      const current = [...root.querySelectorAll('.gallery-image')];
      const style = getComputedStyle(root);
      const nextCount = Math.min(Math.max(1, current.length), Math.max(1, parseInt(style.getPropertyValue(mobile.matches ? '--gallery-grid-columns-mobile' : '--gallery-grid-columns'), 10) || 1));
      const nextFirst = mobile.matches && root.dataset.mobileColumnsMode === 'first_columns';
      if (nextCount === count && nextFirst === firstColumns && current.length === items.length && current.every(item => items.includes(item))) return;
      const focused = root.contains(document.activeElement) ? document.activeElement : null;
      let nextOrder = Math.max(-1, ...current.filter(item => item.hasAttribute('data-gallery-order')).map(item => Number(item.dataset.galleryOrder))) + 1;
      current.forEach(item => { if (!item.hasAttribute('data-gallery-order')) item.dataset.galleryOrder = String(nextOrder++); });
      items = current.sort((a, b) => Number(a.dataset.galleryOrder) - Number(b.dataset.galleryOrder));
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
      root.classList.toggle('is-parallax-ready', items.length > 0);
      root.style.setProperty('--gallery-parallax-visible-columns', count);
      if (focused?.isConnected) focused.focus({ preventScroll: true });
    }
    function update() {
      frame = 0;
      group();
      // Editor selection must not expand the masked viewport or regroup columns.
      // Storefront keyboard navigation still exposes clipped content.
      const accessible = !window.Shopify?.designMode && root.contains(document.activeElement);
      root.dataset.galleryAccessible = String(accessible);
      const style = getComputedStyle(root);
      const configuredHeight = parseFloat(style.getPropertyValue(mobile.matches ? '--gallery-parallax-height-mobile' : '--gallery-parallax-height')) || 640;
      const visibleColumns = columns.filter(column => !column.hidden && column.children.length);
      const shortest = visibleColumns.length ? Math.min(...visibleColumns.map(column => column.offsetHeight)) : 0;
      const viewportHeight = Math.min(configuredHeight, shortest);
      const requestedDistance = parseFloat(style.getPropertyValue('--gallery-parallax-distance')) || 0;
      const distance = Math.min(requestedDistance, Math.max(0, (shortest - viewportHeight) / 2));
      const stagger = Math.min(parseFloat(style.getPropertyValue('--gallery-parallax-stagger')) || 0, Math.max(0, (shortest - viewportHeight) / 2 - distance));
      root.style.setProperty('--gallery-parallax-effective-distance', distance + 'px');
      root.style.setProperty('--gallery-parallax-rendered-height', viewportHeight + 'px');
      columns.forEach((column, index) => column.style.setProperty('--gallery-parallax-column-stagger', (index % 2 ? stagger : 0) + 'px'));
      const rect = root.getBoundingClientRect();
      const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
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
    const destroy = () => {
      controller.abort(); cancelAnimationFrame(frame); resize.disconnect(); intersection.disconnect(); mutations.disconnect();
      items.forEach(item => { root.append(item); delete item.dataset.galleryOrder; });
      columns.forEach(column => column.remove());
      root.classList.remove('is-parallax-ready'); delete root.dataset.galleryAccessible;
      for (const key of ['--gallery-parallax-visible-columns', '--gallery-parallax-rendered-height', '--gallery-parallax-effective-distance']) root.style.removeProperty(key);
      states.delete(root);
    };
    destroy.schedule = schedule;
    states.set(root, destroy);
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
  for (const name of ['shopify:block:select', 'shopify:block:deselect']) {
    document.addEventListener(name, event => {
      for (const [root, destroy] of states) if (root.contains(event.target)) {
        destroy.schedule();
      }
    });
  }
  init(document);
})();
