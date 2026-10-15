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
      section.querySelectorAll('[data-ce-preview="reveal"]').forEach(list => {
        const rows = [...list.querySelectorAll(':scope > .ce-item')];
        const stage = document.createElement('div');
        stage.className = 'ce-preview-stage';
        stage.setAttribute('aria-hidden', 'true');
        const previews = rows.map(row => {
          const preview = row.querySelector('.ce-item__preview');
          if (preview) stage.append(preview);
          return preview;
        });
        list.append(stage);
        let current = null, pending = null, animating = false, leaving = null, revealFrame = 0, layer = 0;
        const position = () => {
          const row = pending || current;
          if (!row) return;
          const rowRect = row.getBoundingClientRect();
          stage.style.setProperty('--ce-preview-y', `${rowRect.top - list.getBoundingClientRect().top + rowRect.height / 2}px`);
        };
        const clean = () => previews.forEach((preview, index) => {
          if (preview && rows[index] !== current) preview.classList.remove('is-visible', 'is-current', 'is-leaving');
        });
        const activate = row => {
          if (!rows.includes(row)) return;
          if (animating) {
            pending = row === current ? null : row;
            position();
            return;
          }
          if (row === current) return;
          const preview = previews[rows.indexOf(row)];
          if (!preview) return;
          cancelAnimationFrame(revealFrame);
          const first = !current;
          current = row;
          pending = null;
          leaving = null;
          animating = !motion.matches;
          // Keep previous images underneath until the incoming wipe finishes.
          previews.forEach(p => p?.classList.remove('is-current'));
          if (first) stage.style.transition = 'none';
          position();
          stage.getBoundingClientRect();
          stage.style.transition = '';
          preview.style.transition = 'none';
          preview.classList.remove('is-visible', 'is-leaving');
          preview.style.zIndex = String(++layer);
          preview.getBoundingClientRect();
          preview.style.transition = '';
          stage.classList.add('is-active');
          revealFrame = requestAnimationFrame(() => {
            preview.classList.add('is-visible', 'is-current');
            if (motion.matches) finish();
          });
        };
        const finish = () => {
          animating = false;
          clean();
          const next = pending;
          pending = null;
          if (next && next !== current) activate(next);
        };
        const leave = () => {
          const selected = rows.find(row => row.classList.contains('is-editor-selected') || row.matches(':focus-visible'));
          if (selected) { activate(selected); return; }
          cancelAnimationFrame(revealFrame);
          leaving = previews.filter(p => p?.classList.contains('is-visible')).sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0] || null;
          current = null;
          pending = null;
          animating = false;
          previews.forEach(p => { p?.classList.remove('is-current'); if (p?.classList.contains('is-visible')) p.classList.add('is-leaving'); });
          stage.classList.remove('is-active');
          if (motion.matches) clean();
        };
        stage.addEventListener('transitionend', event => {
          if (event.propertyName !== 'clip-path') return;
          if (current && event.target === previews[rows.indexOf(current)] && event.target.classList.contains('is-current')) finish();
          else if (!current && event.target === leaving) { clean(); leaving = null; }
        }, { signal });
        list.addEventListener('pointerover', event => {
          if (event.pointerType === 'mouse') activate(event.target.closest('.ce-item'));
        }, { signal });
        list.addEventListener('focusin', event => activate(event.target.closest('.ce-item')), { signal });
        list.addEventListener('focusout', event => { if (!list.contains(event.relatedTarget)) leave(); }, { signal });
        list.addEventListener('pointerleave', leave, { signal });
        section.addEventListener('shopify:block:select', event => activate(event.target.closest('.ce-item')), { signal });
        section.addEventListener('shopify:block:deselect', event => { event.target.closest('.ce-item')?.classList.remove('is-editor-selected'); leave(); }, { signal });
        motion.addEventListener('change', () => { if (motion.matches) finish(); }, { signal });
        const observer = new ResizeObserver(position);
        observer.observe(list);
        signal.addEventListener('abort', () => {
          cancelAnimationFrame(revealFrame);
          observer.disconnect();
          previews.forEach((preview, index) => { if (preview) { preview.classList.remove('is-visible', 'is-current', 'is-leaving'); preview.style.cssText = ''; rows[index].append(preview); } });
          stage.remove();
        }, { once: true });
      });
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
