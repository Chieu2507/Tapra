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
      section.querySelectorAll('.ce-list').forEach(list => {
        const rows = [...list.querySelectorAll(':scope > .ce-item')];
        list.addEventListener('pointerover', event => {
          if (event.pointerType !== 'mouse') return;
          const hovered = event.target.closest('.ce-item');
          if (!rows.includes(hovered)) return;
          rows.forEach(row => {
            if (row !== hovered && row.classList.contains('is-editor-selected')) {
              row.classList.remove('is-editor-selected');
              row.classList.add('is-editor-suppressed');
            }
          });
        }, { signal });
        section.addEventListener('shopify:block:select', event => {
          const row = event.target.closest('.ce-item');
          if (!rows.includes(row)) return;
          row.classList.remove('is-editor-suppressed');
          row.classList.add('is-editor-selected');
        }, { signal });
      });
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
        let current = null, revealFrame = 0, cleanupTimer = 0, layer = 0;
        const frozen = new Set();
        const instant = (preview, change) => {
          preview.style.transition = 'none';
          change();
          preview.getBoundingClientRect();
          preview.style.transition = '';
        };
        const position = () => {
          if (!current) return;
          const rowRect = current.getBoundingClientRect();
          stage.style.setProperty('--ce-preview-y', `${rowRect.top - list.getBoundingClientRect().top + rowRect.height / 2}px`);
        };
        const clean = () => {
          previews.forEach((preview, index) => {
            if (preview && rows[index] !== current) instant(preview, () => preview.classList.remove('is-visible', 'is-current', 'is-leaving'));
          });
          frozen.forEach(preview => preview.remove());
          frozen.clear();
        };
        const preserve = preview => {
          if (!preview.classList.contains('is-visible') && !preview.classList.contains('is-leaving')) return;
          // Freeze the painted clip before recycling this image for a new wipe.
          const copy = preview.cloneNode(true);
          copy.classList.remove('is-current');
          copy.style.clipPath = getComputedStyle(preview).clipPath;
          copy.style.transition = 'none';
          stage.append(copy);
          frozen.add(copy);
        };
        const activate = row => {
          if (!rows.includes(row) || row === current) return;
          const preview = previews[rows.indexOf(row)];
          if (!preview) return;
          cancelAnimationFrame(revealFrame);
          clearTimeout(cleanupTimer);
          const first = !current;
          const fromBottom = current && rows.indexOf(row) > rows.indexOf(current);
          current = row;
          rows.forEach(item => { item.classList.remove('is-preview-active'); });
          row.classList.add('is-preview-active');
          previews.forEach(p => p?.classList.remove('is-current'));
          if (first && !stage.classList.contains('is-exiting')) stage.style.transition = 'none';
          position();
          stage.getBoundingClientRect();
          stage.style.transition = '';
          preserve(preview);
          // Every hover immediately starts a new top layer, keeping its painted backing.
          instant(preview, () => {
            preview.classList.remove('is-visible', 'is-leaving');
            preview.dataset.ceRevealFrom = fromBottom ? 'bottom' : 'top';
            preview.style.zIndex = String(++layer);
          });
          stage.classList.remove('is-exiting');
          stage.classList.add('is-active');
          revealFrame = requestAnimationFrame(() => {
            if (current !== row) return;
            preview.classList.add('is-visible', 'is-current');
            if (motion.matches) clean();
            else scheduleCleanup(preview);
          });
        };
        const scheduleCleanup = preview => {
          // Retain the backing stack beyond the wipe, including rapid changes.
          // 450ms wipe -> 600ms cleanup, derived from CSS rather than a second clock.
          const duration = getComputedStyle(preview).transitionDuration.split(',')[0].trim();
          const milliseconds = parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
          cleanupTimer = setTimeout(clean, Number.isFinite(milliseconds) ? milliseconds * 4 / 3 : 0);
        };
        const leave = () => {
          const selected = rows.find(row => !row.classList.contains('is-editor-suppressed') && (row.classList.contains('is-editor-selected') || row.matches(':focus-visible')));
          if (selected) { activate(selected); return; }
          cancelAnimationFrame(revealFrame);
          clearTimeout(cleanupTimer);
          current = null;
          rows.forEach(row => row.classList.remove('is-preview-active'));
          previews.forEach(p => {
            p?.classList.remove('is-current');
            if (p?.classList.contains('is-visible')) {
              p.classList.remove('is-visible');
              p.classList.add('is-leaving');
            }
          });
          stage.classList.remove('is-active');
          stage.classList.add('is-exiting');
          if (motion.matches) clean();
        };
        stage.addEventListener('transitionend', event => {
          if (event.target === stage && event.propertyName === 'clip-path' && !current) clean();
        }, { signal });
        list.addEventListener('pointerover', event => {
          if (event.pointerType === 'mouse') activate(event.target.closest('.ce-item'));
        }, { signal });
        list.addEventListener('focusin', event => activate(event.target.closest('.ce-item')), { signal });
        list.addEventListener('focusout', event => { if (!list.contains(event.relatedTarget)) leave(); }, { signal });
        list.addEventListener('pointerleave', leave, { signal });
        section.addEventListener('shopify:block:select', event => activate(event.target.closest('.ce-item')), { signal });
        section.addEventListener('shopify:block:deselect', event => { event.target.closest('.ce-item')?.classList.remove('is-editor-selected'); leave(); }, { signal });
        motion.addEventListener('change', () => { if (motion.matches) { clearTimeout(cleanupTimer); clean(); } }, { signal });
        const observer = new ResizeObserver(position);
        observer.observe(list);
        signal.addEventListener('abort', () => {
          cancelAnimationFrame(revealFrame);
          clearTimeout(cleanupTimer);
          observer.disconnect();
          frozen.forEach(preview => preview.remove());
          frozen.clear();
          rows.forEach(row => row.classList.remove('is-preview-active'));
          previews.forEach((preview, index) => { if (preview) { preview.classList.remove('is-visible', 'is-current', 'is-leaving'); preview.style.cssText = ''; delete preview.dataset.ceRevealFrom; rows[index].append(preview); } });
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
