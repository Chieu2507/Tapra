(() => {
  if (customElements.get('lh-editorial-text')) return;
  const tracks = new WeakMap();
  const speeds = { slow: .65, medium: 1, fast: 1.5 };
  const clamp = value => Math.max(0, Math.min(1, value));

  class EditorialText extends HTMLElement {
    static get observedAttributes() {
      return ['data-editorial-reveal', 'data-editorial-speed', 'data-editorial-opacity'];
    }
    attributeChangedCallback(name, previous, next) {
      if (previous === next || !this.isConnected) return;
      this.teardown();
      this.setup();
    }
    connectedCallback() {
      queueMicrotask(() => { if (this.isConnected && !this.controller) this.setup(); });
    }
    disconnectedCallback() { this.teardown(); }

    setup() {
      this.base = this.querySelector('.editorial-text-block__base');
      if (!this.base || this.dataset.editorialReveal !== 'true') return;
      this.original = this.base.innerHTML;
      this.units = [];
      this.frame = 0;
      this.selected = false;
      this.controller = new AbortController();
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.anchor = this.closest('.parallax-section__inner') || this;
      this.track = this.closest('[data-scroll-reading-track]');
      this.panel = this.track?.querySelector('[data-scroll-reading-panel]');
      if (this.panel) {
        if (!tracks.has(this.track)) tracks.set(this.track, new Set());
        tracks.get(this.track).add(this);
      }
      const walker = document.createTreeWalker(this.base, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        const accessible = document.createElement('span');
        accessible.className = 'visually-hidden';
        accessible.textContent = node.textContent;
        fragment.append(accessible);
        for (const character of node.textContent) {
          const letter = document.createElement('span');
          letter.className = 'editorial-reading-letter';
          letter.setAttribute('aria-hidden', 'true');
          letter.textContent = character;
          fragment.append(letter);
          this.units.push(letter);
        }
        node.replaceWith(fragment);
      });
      const options = { signal: this.controller.signal };
      this.schedule = () => {
        if (!this.frame) this.frame = requestAnimationFrame(() => this.update());
      };
      window.addEventListener('scroll', this.schedule, { ...options, passive: true });
      window.addEventListener('resize', this.schedule, options);
      this.motion.addEventListener('change', this.schedule, options);
      this.resizeObserver = new ResizeObserver(this.schedule);
      this.resizeObserver.observe(this.base);
      if (this.panel) this.resizeObserver.observe(this.panel);
      document.addEventListener('shopify:block:select', event => {
        if (event.target !== this && !event.target.contains(this)) return;
        this.selected = true;
        this.schedule();
      }, options);
      document.addEventListener('shopify:block:deselect', event => {
        if (event.target !== this && !event.target.contains(this)) return;
        this.selected = false;
        this.schedule();
      }, options);
      this.update();
    }

    update() {
      this.frame = 0;
      const speed = speeds[this.dataset.editorialSpeed] || 1;
      const opacity = clamp(Number(this.dataset.editorialOpacity) / 100);
      const viewport = window.innerHeight;
      const top = this.anchor.getBoundingClientRect().top;
      const height = this.base.getBoundingClientRect().height;
      let progress = clamp((viewport * .85 - top) / Math.max(height + viewport * .5 / speed, 1));
      if (this.panel) {
        if (this.motion.matches) {
          this.clearTrack();
        } else {
          if (!this.track.hasAttribute('data-reading-sticky')) this.track.setAttribute('data-reading-sticky', '');
          const panelHeight = this.panel.getBoundingClientRect().height;
          const stickyTop = Math.min(0, (viewport - panelHeight) / 2);
          // All enabled Editorial blocks share one pinned interval.
          const slowest = Math.min(...Array.from(tracks.get(this.track), owner => speeds[owner.dataset.editorialSpeed] || 1));
          const distance = Math.max(viewport, panelHeight) / slowest;
          this.setTrackProperty('--reading-panel-height', `${panelHeight}px`);
          this.setTrackProperty('--reading-scroll-distance', `${distance}px`);
          this.setTrackProperty('--reading-sticky-top', `${stickyTop}px`);
          progress = clamp((stickyTop - this.track.getBoundingClientRect().top) / distance);
        }
      }
      if (this.motion.matches || this.selected) progress = 1;
      const edge = progress * (this.units.length + 16);
      this.units.forEach((unit, index) => {
        const value = String(opacity + (1 - opacity) * clamp((edge - index) / 16));
        if (unit.style.opacity !== value) unit.style.opacity = value;
      });
    }

    setTrackProperty(name, value) {
      if (this.track.style.getPropertyValue(name) !== value) this.track.style.setProperty(name, value);
    }

    clearTrack() {
      this.track.removeAttribute('data-reading-sticky');
      this.track.style.removeProperty('--reading-panel-height');
      this.track.style.removeProperty('--reading-scroll-distance');
      this.track.style.removeProperty('--reading-sticky-top');
    }

    teardown() {
      if (!this.controller) return;
      this.controller.abort();
      this.controller = null;
      cancelAnimationFrame(this.frame);
      this.resizeObserver.disconnect();
      if (this.panel) {
        const owners = tracks.get(this.track);
        owners.delete(this);
        if (!owners.size) {
          this.clearTrack();
          tracks.delete(this.track);
        }
      }
      this.base.innerHTML = this.original;
      this.units = [];
    }
  }
  customElements.define('lh-editorial-text', EditorialText);
})();
