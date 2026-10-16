/* Canvas keycap assembly. Each section owns its clock, input and teardown. */
(() => {
  if (customElements.get('shatter-lifecycle')) return;
  const instances = new Map();
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));

  class Shatter {
    constructor(root) {
      this.root = root;
      this.slides = [...root.querySelectorAll('[data-shatter-slide]')];
      this.abort = new AbortController();
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.mobile = matchMedia('(max-width: 767.98px)');
      this.back = root.querySelector('[data-shatter-back]');
      this.front = root.querySelector('[data-shatter-front]');
      this.ctx = this.front.getContext('2d');
      this.ctxBack = this.back.getContext('2d');
      this.progress = root.querySelector('[data-shatter-progress]');
      this.cursor = root.querySelector('[data-shatter-cursor]');
      this.assembleButton = root.querySelector('[data-shatter-assemble]');
      this.pauseButton = root.querySelector('[data-shatter-pause]');
      this.index = 0;
      this.idle = 0;
      this.pieces = [];
      this.images = new Map();
      this.pauses = new Set();
      this.timeouts = new Set();
      this.pointer = { x: -999, y: -999 };
      this.light = { x: 0, y: 0, intensity: 0 };
      this.visible = false;
      this.holding = false;
      this.toggleAssembly = false;
      this.interval = clamp(Number(root.dataset.interval) || 8, 4, 20) * 1000;
      this.interaction = root.dataset.interaction === 'true';
      this.pagination = root.querySelector('[data-shatter-pagination]');
      this.buttons = this.slides.map((slide, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(index + 1);
        button.setAttribute('aria-label', `${index + 1} / ${this.slides.length}`);
        button.setAttribute('aria-controls', slide.id = `${root.closest('[id]').id}-shatter-${index}`);
        this.pagination.append(button);
        this.listen(button, 'click', () => this.go(index, true));
        return button;
      });
      this.pauseButton.hidden = root.dataset.autoplay !== 'true' || this.slides.length < 2;
      this.progress.parentElement.hidden ||= this.pauseButton.hidden;
      this.pagination.hidden ||= this.slides.length < 2;
      this.show(0);
      this.bind();
      root.classList.add('is-ready');
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(root);
      this.intersection = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        if (!this.visible) this.release();
        this.synchronize();
      });
      this.intersection.observe(root);
      this.prepare(0).then(() => {
        if (this.abort.signal.aborted) return;
        this.resize();
        this.slides.forEach((_, i) => { if (i) this.prepare(i); });
      });
    }
    listen(target, type, fn, options = {}) {
      target.addEventListener(type, fn, { ...options, signal: this.abort.signal });
    }
    later(fn, delay) {
      const id = setTimeout(() => { this.timeouts.delete(id); if (!this.abort.signal.aborted) fn(); }, delay);
      this.timeouts.add(id);
      return id;
    }
    source(index) {
      const image = this.slides[index]?.querySelector('img');
      return image?.currentSrc || image?.src || '';
    }
    async prepare(index) {
      const image = this.slides[index]?.querySelector('img');
      if (!image) return null;
      image.loading = 'eager';
      try { await image.decode(); } catch { /* keep server fallback on load failure */ }
      if (this.abort.signal.aborted) return null;
      const source = this.source(index);
      if (!source) return null;
      if (!this.images.has(source)) {
        this.images.set(source, new Promise(resolve => {
          const art = new Image();
          art.crossOrigin = 'anonymous';
          art.onload = () => resolve(art);
          art.onerror = () => resolve(null);
          art.src = source;
        }));
      }
      const art = await this.images.get(source);
      if (this.abort.signal.aborted) return null;
      if (!this.art) { this.art = art; this.artIndex = index; }
      return art;
    }
    show(index) {
      this.index = index;
      this.slides.forEach((slide, i) => {
        slide.hidden = i !== index;
        slide.inert = i !== index;
      });
      this.buttons.forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
    }
    async go(index, manual = false, immediate = false) {
      if (!this.slides.length || this.abort.signal.aborted) return;
      index = (index + this.slides.length) % this.slides.length;
      if (!immediate && (this.transition || this.loading || this.holding || index === this.index)) return;
      const intent = this.intent = (this.intent || 0) + 1;
      this.loading = true;
      const art = await this.prepare(index);
      if (intent !== this.intent || this.abort.signal.aborted) return;
      this.loading = false;
      this.idle = 0;
      if (manual) this.root.querySelector('[data-shatter-announcement]').textContent = this.slides[index].querySelector('.shatter__heading').textContent;
      if (immediate || this.motion.matches || !this.visible || !this.art || !art) {
        this.transition = null;
        this.art = art;
        this.artIndex = index;
        this.show(index);
        this.clearText();
        this.resize();
        return;
      }
      this.transition = { start: performance.now(), index, art, swapped: false };
      this.burst(true);
      this.textExit();
      this.synchronize();
    }
    clearText() {
      this.root.querySelectorAll('.shatter__heading > span').forEach(el => {
        el.style.transition = ''; el.style.opacity = ''; el.style.transform = '';
      });
    }
    textExit() {
      this.slides[this.index].querySelectorAll('.shatter__heading > span').forEach((el, i) => {
        el.style.transition = 'opacity 650ms ease-in, transform 650ms ease-in';
        el.style.opacity = '0';
        el.style.transform = `translateY(${i ? 30 : -30}px)`;
      });
    }
    swap() {
      const transition = this.transition;
      if (!transition || transition.swapped) return;
      transition.swapped = true;
      this.art = transition.art;
      this.artIndex = transition.index;
      this.show(transition.index);
      this.build();
      const spans = this.slides[this.index].querySelectorAll('.shatter__heading > span');
      spans.forEach((el, i) => {
        el.style.transition = 'none'; el.style.opacity = '0';
        el.style.transform = `translateY(${i ? -30 : 30}px)`;
      });
      this.slides[this.index].getBoundingClientRect();
      spans.forEach(el => {
        el.style.transition = `opacity 1000ms ${ease}, transform 1000ms ${ease}`;
        el.style.opacity = '1'; el.style.transform = 'none';
      });
      this.later(() => { if (!this.transition) this.clearText(); }, 1150);
    }
    settle() {
      if (this.transition) {
        this.art = this.transition.art;
        this.artIndex = this.transition.index;
        this.show(this.transition.index);
        this.transition = null;
        this.build();
      }
      this.clearText();
    }
    bind() {
      this.listen(this.pauseButton, 'click', () => {
        if (this.pauses.has('manual')) this.pauses.delete('manual'); else this.pauses.add('manual');
        this.updateControls();
      });
      if (this.assembleButton) this.listen(this.assembleButton, 'click', () => {
        this.toggleAssembly = !this.toggleAssembly;
        this.setHold(this.toggleAssembly);
      });
      this.listen(this.root, 'focusin', () => this.pauses.add('focus'));
      this.listen(this.root, 'focusout', e => { if (!this.root.contains(e.relatedTarget)) this.pauses.delete('focus'); });
      this.listen(this.root, 'keydown', e => {
        if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.index + (e.key === 'ArrowRight' ? 1 : -1), true); }
        if (e.key === 'Escape') { this.toggleAssembly = false; this.setHold(false); }
      });
      const content = e => !e.target.closest('button, a, input, select, textarea, [data-shatter-control]');
      this.listen(this.root, 'pointermove', e => {
        const r = this.root.getBoundingClientRect();
        if (e.pointerType === 'mouse') {
          this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
          this.cursor.style.transform = `translate(${this.pointer.x}px,${this.pointer.y}px)`;
          this.cursor.style.opacity = this.interaction && content(e) && !this.motion.matches ? '1' : '0';
        }
        if (this.pending && !this.holding && Math.hypot(e.clientX - this.pending.x, e.clientY - this.pending.y) > 12) this.release();
      }, { passive: true });
      this.listen(this.root, 'pointerdown', e => {
        if (!this.interaction || this.motion.matches || !content(e) || this.transition || (e.pointerType === 'mouse' && e.button !== 0)) return;
        this.pending = { x: e.clientX, y: e.clientY, pointer: e.pointerId };
        this.holdTimer = this.later(() => { if (this.pending) this.setHold(true); }, e.pointerType === 'touch' ? 260 : 200);
      });
      this.listen(window, 'pointerup', () => this.release());
      this.listen(window, 'pointercancel', () => this.release());
      this.listen(window, 'blur', () => this.release());
      this.listen(this.root, 'pointerleave', () => {
        this.pointer = { x: -999, y: -999 }; this.cursor.style.opacity = '0'; this.release();
      });
      this.listen(this.root, 'click', e => {
        if (this.interaction && content(e) && performance.now() > (this.suppressUntil || 0)) this.burst();
      });
      this.listen(this.root, 'contextmenu', e => { if (this.pending || this.holding) e.preventDefault(); });
      this.listen(document, 'visibilitychange', () => { this.release(); this.synchronize(); });
      this.listen(this.motion, 'change', () => { this.release(); this.settle(); this.resize(); });
      this.listen(this.mobile, 'change', () => {
        const intent = this.intent = (this.intent || 0) + 1;
        this.prepare(this.index).then(art => {
          if (this.abort.signal.aborted || intent !== this.intent) return;
          this.art = art; this.resize();
        });
      });
      this.listen(this.root, 'shopify:block:select', e => {
        const index = this.slides.indexOf(e.target.closest('[data-shatter-slide]'));
        if (index >= 0) { this.pauses.add('editor'); this.release(); this.go(index, false, true); }
      });
      this.listen(this.root, 'shopify:block:deselect', () => this.pauses.delete('editor'));
      const wrapper = this.root.closest('.shopify-section') || this.root;
      this.listen(wrapper, 'shopify:section:select', () => this.pauses.add('section'));
      this.listen(wrapper, 'shopify:section:deselect', () => this.pauses.delete('section'));
    }
    updateControls() {
      const paused = this.pauses.has('manual');
      this.pauseButton.setAttribute('aria-pressed', String(paused));
      this.pauseButton.textContent = paused ? this.pauseButton.dataset.playLabel : this.pauseButton.dataset.pauseLabel;
    }
    setHold(value) {
      if (value && (this.motion.matches || this.transition)) return;
      this.holding = value;
      this.root.classList.toggle('is-holding', value);
      this.assembleButton?.setAttribute('aria-pressed', String(value));
      const label = this.cursor.querySelector('span');
      label.textContent = value ? label.dataset.releaseLabel : label.dataset.holdLabel;
      if (!value) this.pieces.forEach(p => { p.until = 0; p.burstUntil = 0; });
    }
    release() {
      clearTimeout(this.holdTimer); this.timeouts.delete(this.holdTimer); this.pending = null;
      if (this.holding && !this.toggleAssembly) { this.suppressUntil = performance.now() + 400; this.setHold(false); }
    }
    resize() {
      if (this.abort.signal.aborted) return;
      const rect = this.root.getBoundingClientRect();
      this.width = rect.width; this.height = rect.height;
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      for (const [canvas, ctx] of [[this.front, this.ctx], [this.back, this.ctxBack]]) {
        canvas.width = Math.round(this.width * this.dpr); canvas.height = Math.round(this.height * this.dpr);
        ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }
      this.build();
      this.root.classList.toggle('is-canvas', !!this.art && !!this.ctx && !!this.ctxBack && !this.motion.matches);
      this.synchronize();
    }
    crop() {
      const image = this.art;
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const focal = (this.mobile.matches ? this.slides[this.index].dataset.mobileFocus : this.slides[this.index].dataset.focus).split(' ').map(parseFloat);
      return [clamp(image.naturalWidth * (focal[0] / 100) - side / 2, 0, image.naturalWidth - side), clamp(image.naturalHeight * (focal[1] / 100) - side / 2, 0, image.naturalHeight - side), side, side];
    }
    scatter(p) {
      const random = Math.random(), angle = Math.atan2(p.hy - this.cy, p.hx - this.cx) + (Math.random() - .5) * (.5 + .9 * random);
      let distance = this.size * (.06 + .25 * p.ring + 1.15 * Math.pow(random, 1.7));
      if (Math.random() < .16) distance = this.size * (.015 + .09 * Math.random());
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const limit = Math.min(cos > .001 ? (this.width - 24 - p.hx) / cos : cos < -.001 ? (24 - p.hx) / cos : Infinity, sin > .001 ? (this.height - 24 - p.hy) / sin : sin < -.001 ? (24 - p.hy) / sin : Infinity);
      if (distance > limit) distance = Math.max(0, limit) * (.5 + .45 * Math.random());
      return [p.hx + cos * distance, p.hy + sin * distance];
    }
    build() {
      if (!this.width || !this.height) return;
      this.size = Math.min(this.height * .64, this.width * .52);
      this.cx = this.width / 2; this.cy = this.height / 2;
      const cells = [];
      for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) cells.push({ x, y, distance: Math.hypot((x + .5) / 9 - .5, (y + .5) / 9 - .5) });
      const threshold = cells.map(p => p.distance).sort((a, b) => a - b)[56];
      const max = Math.max(...cells.map(p => p.distance));
      this.pieces = cells.map(cell => {
        const p = { hx: this.cx - this.size / 2 + (cell.x + .5) * this.size / 9, hy: this.cy - this.size / 2 + (cell.y + .5) * this.size / 9, base: cell.distance <= threshold, ring: Math.max(0, (cell.distance - threshold) / (max - threshold)), vx: 0, vy: 0, va: 0, until: 0, phase: Math.random() * Math.PI * 2, z: Math.random() > .42 };
        [p.sx, p.sy] = this.scatter(p); p.sa = (Math.random() - .5) * 6;
        p.x = p.base ? p.hx : p.sx; p.y = p.base ? p.hy : p.sy; p.a = p.base ? 0 : p.sa;
        return p;
      });
    }
    burst(force = false) {
      if (this.motion.matches || this.holding || (!force && this.transition)) return;
      const now = performance.now();
      this.pieces.forEach(p => {
        const angle = Math.atan2(p.y - this.cy, p.x - this.cx) + (Math.random() - .5) * 1.2;
        const scale = (force ? .6 : 1) * (1 + Math.hypot(p.x - this.cx, p.y - this.cy) / this.size * .3);
        const distance = (50 + Math.random() * 90) * scale;
        p.ex = p.x + Math.cos(angle) * distance; p.ey = p.y + Math.sin(angle) * distance;
        p.vx += Math.cos(angle) * (2.5 + Math.random() * 4) * scale;
        p.vy += Math.sin(angle) * (2.5 + Math.random() * 4) * scale;
        p.va += (Math.random() - .5) * .2; p.burstUntil = now + (force ? 800 : 650);
      });
    }
    synchronize() {
      const animate = this.visible && !document.hidden && !this.motion.matches && this.slides.length;
      if (!animate) {
        cancelAnimationFrame(this.raf); this.raf = 0; this.settle();
        return;
      }
      if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(now => this.tick(now)); }
    }
    tick(now) {
      if (this.abort.signal.aborted) return;
      const dt = Math.min(now - this.last, 50), f = Math.min(dt / 16.7, 2.5); this.last = now;
      let alpha = 1;
      if (this.transition) {
        const elapsed = now - this.transition.start;
        if (elapsed < 1000) alpha = Math.max(1 - elapsed / 900, 0);
        else { this.swap(); alpha = Math.min((elapsed - 1000) / 600, 1); }
        if (elapsed > 1700) { this.transition = null; this.idle = 0; alpha = 1; }
      } else if (!this.holding && !this.pauses.size && !this.loading && this.root.dataset.autoplay === 'true' && this.slides.length > 1) {
        this.idle += dt;
        if (this.idle >= this.interval) this.go(this.index + 1);
      }
      this.progress.style.transform = `scaleX(${Math.min(this.idle / this.interval, 1)})`;
      if (this.art && this.ctx && this.ctxBack) {
        try { this.draw(now, f, alpha); }
        catch { this.art = null; this.root.classList.remove('is-canvas'); }
      }
      this.raf = requestAnimationFrame(t => this.tick(t));
    }
    draw(now, f, alpha) {
      const size = this.size / 9, time = now / 1000;
      let assembled = 0;
      for (const ctx of [this.ctx, this.ctxBack]) { ctx.clearRect(0, 0, this.width, this.height); ctx.globalAlpha = alpha; }
      const lightOn = document.documentElement.hasAttribute('data-surface-light-enabled');
      const near = this.pointer.x > -900 && this.interaction;
      const target = near && lightOn ? clamp(1 - Math.hypot(Math.max(Math.abs(this.pointer.x - this.cx) - this.size / 2, 0), Math.max(Math.abs(this.pointer.y - this.cy) - this.size / 2, 0)) / 200) : 0;
      this.light.x += (this.pointer.x - this.light.x) * (1 - Math.pow(.9, f));
      this.light.y += (this.pointer.y - this.light.y) * (1 - Math.pow(.9, f));
      this.light.intensity += (target - this.light.intensity) * (1 - Math.pow(.9, f));
      const light = this.light;
      const color = getComputedStyle(this.root).getPropertyValue('--heading-color').trim() || '#ffffff';
      if (light.intensity > .004) {
        const glow = this.ctxBack.createRadialGradient(light.x, light.y, 0, light.x, light.y, 312);
        glow.addColorStop(0, color); glow.addColorStop(1, 'transparent');
        this.ctxBack.globalAlpha = alpha * .25 * light.intensity;
        this.ctxBack.fillStyle = glow; this.ctxBack.fillRect(0, 0, this.width, this.height);
        this.ctxBack.globalAlpha = alpha;
      }
      const crop = this.crop();
      this.pieces.forEach(p => {
        const home = this.holding || p.base || now < p.until;
        let x, y, angle, spring, damping;
        if (!this.holding && now < (p.burstUntil || 0)) { x = p.ex; y = p.ey; angle = p.a; spring = .004; damping = .93; }
        else if (home) { x = p.hx; y = p.hy; angle = 0; spring = this.holding ? .014 : .007; damping = this.holding ? .82 : .84; }
        else { x = p.sx + Math.sin(time * .6 + p.phase) * 10; y = p.sy + Math.cos(time * .5 + p.phase) * 10; angle = p.sa + Math.sin(time * .4 + p.phase) * .08; spring = .01; damping = .86; }
        p.vx = (p.vx + (x - p.x) * spring * f) * Math.pow(damping, f);
        p.vy = (p.vy + (y - p.y) * spring * f) * Math.pow(damping, f);
        p.va = (p.va + (angle - p.a) * (home ? .007 : .01) * f) * Math.pow(damping, f);
        p.x += p.vx * f; p.y += p.vy * f; p.a += p.va * f;
        if (near && !this.transition && !p.base && Math.hypot(this.pointer.x - p.x, this.pointer.y - p.y) < 85) p.until = now + 2800;
      });
      const order = this.pieces.slice().sort((a, b) => Math.hypot(b.x - b.hx, b.y - b.hy) - Math.hypot(a.x - a.hx, a.y - a.hy));
      order.forEach(p => {
        const distance = Math.hypot(p.x - p.hx, p.y - p.hy), amount = Math.min(distance / 140, 1);
        if (distance < 6) assembled++;
        const ctx = p.z || distance < 20 ? this.ctx : this.ctxBack;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.beginPath();
        ctx.roundRect(-size / 2 - size * .006, -size / 2 - size * .006, size * 1.012, size * 1.012, this.holding && distance < 6 ? 0 : size * .07);
        ctx.shadowColor = `rgba(191,227,255,${.08 * amount})`;
        ctx.shadowBlur = 10 * amount; ctx.shadowOffsetX = (p.x - this.cx) * .03 * amount; ctx.shadowOffsetY = (p.y - this.cy) * .03 * amount;
        ctx.fillStyle = color; ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.save(); ctx.clip();
        ctx.drawImage(this.art, ...crop, this.cx - this.size / 2 - p.hx, this.cy - this.size / 2 - p.hy, this.size, this.size);
        ctx.restore();
        if (!(this.holding && distance < 6)) {
          ctx.strokeStyle = distance < 6 ? 'rgba(5,13,36,.28)' : 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke();
          if (distance < 6) {
            if (light.intensity > .004) {
              const dx = light.x - p.x, dy = light.y - p.y;
              const lx = dx * Math.cos(p.a) + dy * Math.sin(p.a), ly = -dx * Math.sin(p.a) + dy * Math.cos(p.a);
              const gradient = ctx.createRadialGradient(lx, ly, 0, lx, ly, 204);
              gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent');
              ctx.strokeStyle = gradient; ctx.globalAlpha = alpha * .28 * light.intensity; ctx.lineWidth = 4.5; ctx.stroke(); ctx.globalAlpha = alpha;
            }
            ctx.beginPath(); ctx.roundRect(-size * .38, -size * .38, size * .76, size * .76, size * .05);
            ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1; ctx.stroke();
          }
        }
        ctx.restore();
      });
      this.ctx.globalAlpha = this.ctxBack.globalAlpha = 1;
      const percent = Math.round(assembled / this.pieces.length * 100);
      if (percent !== this.percent) {
        this.percent = percent;
        this.root.querySelector('[data-shatter-percent]').textContent = `${percent}%`;
        this.root.querySelector('[data-shatter-assembly-bar]').style.width = `${percent}%`;
      }
    }
    destroy() {
      this.intent = (this.intent || 0) + 1;
      this.abort.abort(); cancelAnimationFrame(this.raf);
      this.timeouts.forEach(clearTimeout); this.timeouts.clear();
      this.observer.disconnect(); this.intersection.disconnect();
      this.pagination.replaceChildren(); this.clearText();
      this.root.classList.remove('is-ready', 'is-canvas', 'is-holding');
    }
  }
  const setup = container => {
    const roots = [...container.querySelectorAll('[data-shatter]')];
    if (container.matches?.('[data-shatter]')) roots.unshift(container);
    roots.forEach(root => { if (!instances.has(root)) instances.set(root, new Shatter(root)); });
  };
  const teardown = container => instances.forEach((controller, root) => {
    if (container === root || container.contains(root)) { controller.destroy(); instances.delete(root); }
  });
  // Registration also prevents duplicate bootstrap listeners after Editor loads.
  customElements.define('shatter-lifecycle', class extends HTMLElement {});
  document.addEventListener('shopify:section:load', e => { teardown(e.target); setup(e.target); });
  document.addEventListener('shopify:section:unload', e => teardown(e.target));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup(document), { once: true });
  else setup(document);
})();
