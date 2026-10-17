(() => {
  if (customElements.get('animated-counter')) return;
  class AnimatedCounter extends HTMLElement {
    connectedCallback() {
      this.stop();
      this.output = this.querySelector('[data-counter-value]');
      this.target = Number(this.dataset.value);
      if (!this.output || !Number.isFinite(this.target)) return;
      const decimals = Math.max(0, Math.min(3, Number(this.dataset.decimals) || 0));
      this.finalText = new Intl.NumberFormat(document.documentElement.lang || 'en', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: this.dataset.grouping === 'true'
      }).format(this.target);
      this.output.textContent = this.finalText;
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.onMotion = () => { if (this.motion.matches) this.finish(); };
      this.motion.addEventListener('change', this.onMotion);
      if (this.dataset.animate !== 'true' || this.motion.matches || !('IntersectionObserver' in window)) return;
      this.observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          this.observer.disconnect();
          this.start();
        }
      }, { threshold: 0.5 });
      this.observer.observe(this);
    }
    start() {
      const decimals = Math.max(0, Math.min(3, Number(this.dataset.decimals) || 0));
      const duration = Math.max(200, Math.min(5000, Number(this.dataset.duration) || 1400));
      const format = new Intl.NumberFormat(document.documentElement.lang || 'en', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: this.dataset.grouping === 'true'
      });
      this.finalText = format.format(this.target);
      const started = performance.now();
      const frame = now => {
        const progress = Math.min(1, Math.max(0, (now - started) / duration));
        this.output.textContent = format.format(this.target * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) this.frame = requestAnimationFrame(frame);
        else this.finish();
      };
      this.frame = requestAnimationFrame(frame);
    }
    finish() {
      cancelAnimationFrame(this.frame);
      this.observer?.disconnect();
      if (this.output && this.finalText != null) this.output.textContent = this.finalText;
    }
    stop() {
      this.finish();
      if (this.onMotion) this.motion?.removeEventListener('change', this.onMotion);
    }
    disconnectedCallback() { this.stop(); }
  }
  customElements.define('animated-counter', AnimatedCounter);
})();
