(() => {
  if (customElements.get('lh-interactive-media-scroll')) return;
  class InteractiveMediaScroll extends HTMLElement {
    connectedCallback() {
      if (this.controller || this.dataset.enabled !== 'true') return;
      this.controller = new AbortController();
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.stage = this.querySelector('.interactive-media');
      this.content = this.querySelector('.interactive-media__content');
      this.media = this.querySelector('.interactive-media-item > :is(.video-block, .image-block)');
      if (!this.stage || !this.media) return;
      this.items = [...this.querySelectorAll('.interactive-media__items > lh-interactive-media-item')];
      this.layers = this.items.slice(1);
      const options = { signal: this.controller.signal };
      this.schedule = () => {
        if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.update(); });
      };
      this.measureSoon = () => {
        cancelAnimationFrame(this.measureFrame);
        this.measureFrame = requestAnimationFrame(() => this.measure());
      };
      window.addEventListener('scroll', this.schedule, { ...options, passive: true });
      window.addEventListener('resize', this.measureSoon, options);
      this.motion.addEventListener('change', this.measureSoon, options);
      this.addEventListener('load', this.measureSoon, { ...options, capture: true });
      document.addEventListener('shopify:block:select', event => {
        if (this.contains(event.target) && !event.target.closest('[data-full-media-content]')) {
          const index = this.items.findIndex(item => item === event.target || item.contains(event.target));
          this.editingPosition = index > 0 ? index + .85 : 0;
          this.progress = -1;
          this.update();
        }
      }, options);
      document.addEventListener('shopify:block:deselect', () => { this.editingPosition = undefined; this.progress = -1; this.schedule(); }, options);
      this.observer = new ResizeObserver(() => {
        const width = this.getBoundingClientRect().width;
        const headerHeight = this.content.querySelector('.block-header')?.getBoundingClientRect().height || 0;
        if (width !== this.measuredWidth || headerHeight !== this.headerHeight) this.measureSoon();
      });
      this.observer.observe(this);
      const header = this.content.querySelector('.block-header');
      if (header) this.observer.observe(header);
      document.fonts?.ready.then(() => { if (this.isConnected) this.measureSoon(); });
      this.measureSoon();
    }
    reset() {
      this.classList.remove('is-scroll-ready');
      this.progress = -1;
      if (this.mediaSlot) {
        this.mediaSlot.remove();
        this.mediaSlot = null;
      }
      this.media?.classList.remove('interactive-media-scroll-target');
      this.media?.closest('lh-interactive-media-item')?.setScrollProgress?.(0);
      for (const item of this.items || []) {
        item.classList.remove('interactive-media-scroll-layer');
        item.style.removeProperty('--scroll-layer-y');
        item.style.removeProperty('--scroll-layer-index');
        item.inert = false;
        item.removeAttribute('aria-hidden');
        item.querySelector(':scope > :is(.video-block, .image-block)')?.classList.remove('interactive-media-scroll-cover');
        item.setScrollProgress?.(0);
        item.stopScrollPlayback?.();
      }
      this.style.removeProperty('--media-scroll-count');
      for (const property of ['--scroll-left', '--scroll-top', '--scroll-x', '--scroll-y', '--scroll-width', '--scroll-height', '--scroll-radius', '--scroll-blend', '--scroll-header-opacity']) this.stage?.style.removeProperty(property);
    }
    measure() {
      this.reset();
      this.measuredWidth = this.getBoundingClientRect().width;
      this.headerHeight = this.content.querySelector('.block-header')?.getBoundingClientRect().height || 0;
      if (this.motion.matches) return;
      // Only the first poster participates in the original header/media layout.
      // Later items are full-size layers within that same sticky stage.
      this.layers.forEach((item, index) => {
        item.classList.add('interactive-media-scroll-layer');
        item.style.setProperty('--scroll-layer-index', String(index + 2));
        item.style.setProperty('--scroll-layer-y', '100%');
        item.inert = true;
        item.setAttribute('aria-hidden', 'true');
      });
      const initial = this.media.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;
      const style = getComputedStyle(this.stage);
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const otherHeight = this.content.getBoundingClientRect().height - initial.height;
      const available = viewportHeight - padding - otherHeight;
      // Keep long content readable rather than clipping it into a pinned scene.
      if (initial.width <= 0 || initial.height <= 0 || available < 96) { this.reset(); return; }
      const fit = Math.min(1, available / initial.height);
      this.initialWidth = initial.width * fit;
      this.initialHeight = initial.height * fit;
      this.radius = parseFloat(getComputedStyle(this.media.querySelector('.video-block__media, .image-block__media')).borderTopLeftRadius) || 0;
      this.mediaSlot = document.createElement('div');
      this.mediaSlot.className = 'interactive-media-scroll-slot';
      this.mediaSlot.style.width = `${this.initialWidth}px`;
      this.mediaSlot.style.height = `${this.initialHeight}px`;
      this.media.before(this.mediaSlot);
      this.media.classList.add('interactive-media-scroll-target');
      this.stage.style.setProperty('--scroll-width', `${this.initialWidth}px`);
      this.stage.style.setProperty('--scroll-height', `${this.initialHeight}px`);
      this.stage.style.setProperty('--scroll-radius', `${this.radius}px`);
      this.classList.add('is-scroll-ready');
      this.style.setProperty('--media-scroll-count', String(this.items.length));
      this.layers.forEach(item => item.querySelector(':scope > :is(.video-block, .image-block)')?.classList.add('interactive-media-scroll-cover'));
      this.update();
    }
    completeFor(media) {
      if (!this.classList.contains('is-scroll-ready')) return;
      const index = this.items.findIndex(item => item.querySelector(':scope > .video-block') === media?.closest('.video-block'));
      if (index < 0) return;
      const track = this.getBoundingClientRect();
      const distance = Math.max(0, track.height - this.stage.getBoundingClientRect().height);
      // Opening completes this item's segment without skipping later layers.
      window.scrollTo({ top: window.scrollY + track.top + distance * (index + 1) / this.items.length, behavior: 'instant' });
      this.update();
    }
    update() {
      if (!this.classList.contains('is-scroll-ready')) return;
      const track = this.getBoundingClientRect();
      const stage = this.stage.getBoundingClientRect();
      const distance = Math.max(1, track.height - stage.height);
      const position = this.editingPosition ?? Math.max(0, Math.min(this.items.length, -track.top / distance * this.items.length));
      const visible = stage.bottom > 0 && stage.top < document.documentElement.clientHeight;
      if (position === this.progress && visible === this.visible) return;
      this.visible = visible;
      this.progress = position;
      const progress = Math.min(1, position);
      this.updateLayers(position);
      const zoom = Math.min(1, progress / .6);
      const slot = this.mediaSlot.getBoundingClientRect();
      const parent = this.media.offsetParent.getBoundingClientRect();
      this.stage.style.setProperty('--scroll-left', `${slot.left - parent.left}px`);
      this.stage.style.setProperty('--scroll-top', `${slot.top - parent.top}px`);
      const x = (stage.left - slot.left) * zoom;
      const y = (stage.top - slot.top) * zoom;
      this.stage.style.setProperty('--scroll-x', `${x}px`);
      this.stage.style.setProperty('--scroll-y', `${y}px`);
      this.stage.style.setProperty('--scroll-width', `${this.initialWidth + (stage.width - this.initialWidth) * zoom}px`);
      this.stage.style.setProperty('--scroll-height', `${this.initialHeight + (stage.height - this.initialHeight) * zoom}px`);
      this.stage.style.setProperty('--scroll-radius', `${this.radius * (1 - zoom)}px`);
      this.stage.style.setProperty('--scroll-blend', String(1 - zoom));
      this.stage.style.setProperty('--scroll-header-opacity', String(Math.max(0, 1 - progress * 3)));
    }
    updateLayers(position) {
      // A segment first reveals the full-size incoming layer, then its copy.
      const activeIndex = Math.min(this.items.length - 1, Math.max(0, Math.ceil(position) - 1));
      this.items.forEach((item, index) => {
        const local = Math.max(0, position - index);
        if (index > 0) item.style.setProperty('--scroll-layer-y', `${100 * (1 - Math.min(1, local / .6))}%`);
        const active = index === activeIndex;
        if (!active && item.activePlayer) item.collapse({ animate: false, restoreFocus: false });
        item.inert = !active;
        item.setAttribute('aria-hidden', String(!active));
        // Keep outgoing copy tied to the next layer's entrance, even though
        // its controls are already inert. Reversing scroll reverses the fade.
        item.setScrollProgress?.(index === this.items.length - 1 ? Math.min(1, local) : local);
        item.setScrollPlayback?.(local, active && this.visible !== false);
      });
    }
    disconnectedCallback() {
      queueMicrotask(() => {
        if (this.isConnected) return;
        this.controller?.abort();
        this.observer?.disconnect();
        cancelAnimationFrame(this.frame);
        cancelAnimationFrame(this.measureFrame);
        this.reset();
        this.controller = null;
      });
    }
  }
  customElements.define('lh-interactive-media-scroll', InteractiveMediaScroll);
})();
