if (!customElements.get('shop-setup')) {
  class ShopSetup extends HTMLElement {
    connectedCallback() {
      if (this.abort) return;
      this.abort = new AbortController();
      const options = {signal: this.abort.signal};
      this.items = Array.from(this.querySelectorAll('[data-setup-item]'));
      this.photo = this.querySelector('.shop-setup__photo');
      this.image = this.photo?.querySelector('img');
      this.layer = this.querySelector('[data-setup-hotspots]');
      this.panel = this.querySelector('[data-setup-panel]');
      this.list = this.querySelector('[data-setup-list]');
      this.toggle = this.querySelector('[data-setup-toggle]');
      this.dots = this.items.map(item => item.querySelector('[data-setup-dot]'));
      this.rows = this.items.map(item => item.querySelector('[data-setup-row]'));
      this.items.forEach((item, i) => {
        this.dots[i].querySelector('span').textContent = String(i + 1);
        this.rows[i].querySelector('.shop-setup__number').textContent = String(i + 1);
        if (this.dataset.hotspots === 'true') this.layer.append(this.dots[i]);
      });
      this.panel.hidden = this.dataset.items !== 'true' || !this.items.length;
      this.toggle.hidden = this.dataset.collapse !== 'true' || this.panel.hidden;
      this.setCollapsed(this.dataset.collapsed === 'true' && !this.toggle.hidden);
      this.addEventListener('click', event => {
        if (event.target.closest('[data-setup-toggle]') === this.toggle) {
          this.setCollapsed(this.toggle.getAttribute('aria-expanded') === 'true');
          return;
        }
        const target = event.target.closest('[data-setup-dot]');
        if (target && this.layer.contains(target)) {
          this.setCollapsed(false);
          this.activate(this.dots.indexOf(target));
        }
      }, options);
      ['pointerover', 'focusin'].forEach(type => this.addEventListener(type, event => {
        const target = event.target.closest('[data-setup-item],[data-setup-dot]');
        if (!target || !this.contains(target)) return;
        const index = this.items.findIndex(item => item.dataset.itemId === target.dataset.itemId);
        this.activate(index);
      }, options));
      ['pointerout', 'focusout'].forEach(type => this.addEventListener(type, event => {
        const target = event.target.closest('[data-setup-item],[data-setup-dot]');
        if (!target || !this.contains(target)) return;
        const next = event.relatedTarget?.closest?.('[data-setup-item],[data-setup-dot]');
        if (next?.dataset.itemId === target.dataset.itemId) return;
        if (type === 'pointerout' && target.contains(document.activeElement)) return;
        this.activate(-1);
      }, options));
      this.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !this.toggle.hidden) this.setCollapsed(true);
      }, options);
      this.addEventListener('shopify:block:select', event => {
        const item = event.target.closest('[data-setup-item]');
        if (!item) return;
        this.setCollapsed(false);
        this.activate(this.items.indexOf(item));
      }, options);
      this.requestPosition = () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
          this.frame = null;
          this.positionDots();
        });
      };
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.requestPosition);
        if (this.photo) this.resizeObserver.observe(this.photo);
        if (this.image) this.resizeObserver.observe(this.image);
      }
      addEventListener('resize', this.requestPosition, options);
      this.image?.addEventListener('load', this.requestPosition, options);
      this.requestPosition();
    }
    activate(index) {
      this.items.forEach((item, i) => {
        item.toggleAttribute('data-active', i === index);
        this.dots[i].setAttribute('aria-pressed', String(i === index));
      });
    }
    setCollapsed(collapsed) {
      const restoreFocus = collapsed && this.list.contains(document.activeElement);
      this.panel.classList.toggle('is-collapsed', collapsed);
      this.list.inert = collapsed;
      this.list.setAttribute('aria-hidden', String(collapsed));
      this.toggle.setAttribute('aria-expanded', String(!collapsed));
      const label = this.toggle.querySelector('.btn__text');
      // Update only the label text; preserve the native Button icon subtree.
      if (label) {
        const text = Array.from(label.childNodes).find(node => node.nodeType === 3 && node.textContent.trim());
        if (text) text.textContent = collapsed ? this.toggle.dataset.showLabel : this.toggle.dataset.hideLabel;
      }
      if (restoreFocus) this.toggle.focus({preventScroll: true});
    }
    positionDots() {
      if (!this.image?.naturalWidth || !this.layer) return;
      const frame = this.layer.getBoundingClientRect();
      const rect = this.image.getBoundingClientRect();
      const style = getComputedStyle(this.image);
      const naturalWidth = this.image.naturalWidth;
      const naturalHeight = this.image.naturalHeight;
      const scale = style.objectFit === 'contain' ? Math.min(rect.width / naturalWidth, rect.height / naturalHeight) : Math.max(rect.width / naturalWidth, rect.height / naturalHeight);
      const position = style.objectPosition.split(' ').map(value => value.endsWith('%') ? parseFloat(value) / 100 : .5);
      const originX = rect.left - frame.left + (rect.width - naturalWidth * scale) * position[0];
      const originY = rect.top - frame.top + (rect.height - naturalHeight * scale) * (position[1] ?? .5);
      const mobile = innerWidth < 768;
      this.items.forEach((item, i) => {
        const variables = getComputedStyle(item);
        const x = parseFloat(variables.getPropertyValue(mobile ? '--setup-x-mobile' : '--setup-x')) || 0;
        const y = parseFloat(variables.getPropertyValue(mobile ? '--setup-y-mobile' : '--setup-y')) || 0;
        const left = originX + x / 100 * naturalWidth * scale;
        const top = originY + y / 100 * naturalHeight * scale;
        const dot = this.dots[i];
        // Cropped-out items remain available in the list; don't pin them to a false location.
        dot.hidden = this.dataset.hotspots !== 'true' || left < 0 || left > frame.width || top < 0 || top > frame.height;
        dot.style.left = `${Math.max(18, Math.min(frame.width - 18, left))}px`;
        dot.style.top = `${Math.max(18, Math.min(frame.height - 18, top))}px`;
        dot.toggleAttribute('data-right', left > frame.width * .6);
      });
    }
    disconnectedCallback() {
      this.abort?.abort();
      this.abort = null;
      this.resizeObserver?.disconnect();
      cancelAnimationFrame(this.frame);
      this.frame = null;
      this.items?.forEach((item, i) => {
        this.dots[i].hidden = true;
        item.prepend(this.dots[i]);
      });
      if (this.list) {
        this.list.inert = false;
        this.list.removeAttribute('aria-hidden');
      }
      this.panel?.classList.remove('is-collapsed');
      if (this.toggle) this.toggle.hidden = true;
    }
  }
  customElements.define('shop-setup', ShopSetup);
}
