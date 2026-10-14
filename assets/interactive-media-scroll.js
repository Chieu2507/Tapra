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
        if (this.contains(event.target) && !event.target.closest('[data-full-media-content]')) { this.editing = true; this.update(); }
      }, options);
      document.addEventListener('shopify:block:deselect', () => { this.editing = false; this.schedule(); }, options);
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
      this.media?.closest('lh-interactive-media-item')?.setScrollFull?.(false);
      for (const property of ['--scroll-left', '--scroll-top', '--scroll-x', '--scroll-y', '--scroll-width', '--scroll-height', '--scroll-radius', '--scroll-blend', '--scroll-header-opacity']) this.stage?.style.removeProperty(property);
    }
    measure() {
      this.reset();
      this.measuredWidth = this.getBoundingClientRect().width;
      this.headerHeight = this.content.querySelector('.block-header')?.getBoundingClientRect().height || 0;
      if (this.motion.matches) return;
      const initial = this.media.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;
      const style = getComputedStyle(this.stage);
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const otherHeight = this.content.getBoundingClientRect().height - initial.height;
      const available = viewportHeight - padding - otherHeight;
      // Keep long content readable rather than clipping it into a pinned scene.
      if (initial.width <= 0 || initial.height <= 0 || available < 96) return;
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
      this.update();
    }
    update() {
      if (!this.classList.contains('is-scroll-ready')) return;
      const track = this.getBoundingClientRect();
      const stage = this.stage.getBoundingClientRect();
      const distance = Math.max(1, track.height - stage.height);
      const progress = this.editing ? 0 : Math.max(0, Math.min(1, -track.top / distance));
      if (progress === this.progress) return;
      this.progress = progress;
      this.media.closest('lh-interactive-media-item')?.setScrollFull?.(progress >= 0.999);
      const slot = this.mediaSlot.getBoundingClientRect();
      const parent = this.media.offsetParent.getBoundingClientRect();
      this.stage.style.setProperty('--scroll-left', `${slot.left - parent.left}px`);
      this.stage.style.setProperty('--scroll-top', `${slot.top - parent.top}px`);
      const x = (stage.left - slot.left) * progress;
      const y = (stage.top - slot.top) * progress;
      this.stage.style.setProperty('--scroll-x', `${x}px`);
      this.stage.style.setProperty('--scroll-y', `${y}px`);
      this.stage.style.setProperty('--scroll-width', `${this.initialWidth + (stage.width - this.initialWidth) * progress}px`);
      this.stage.style.setProperty('--scroll-height', `${this.initialHeight + (stage.height - this.initialHeight) * progress}px`);
      this.stage.style.setProperty('--scroll-radius', `${this.radius * (1 - progress)}px`);
      this.stage.style.setProperty('--scroll-blend', String(1 - progress));
      this.stage.style.setProperty('--scroll-header-opacity', String(Math.max(0, 1 - progress * 3)));
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
