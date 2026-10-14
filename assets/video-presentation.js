(() => {
  if (customElements.get('lh-video-presentation')) return;
  class VideoPresentation extends HTMLElement {
    connectedCallback() {
      if (this.controller) return;
      this.controller = new AbortController();
      const options = { signal: this.controller.signal };
      this.media = this.querySelector(':scope > .video');
      this.button = this.media?.querySelector('.video__play');
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.mouse = matchMedia('(hover: hover) and (pointer: fine)');
      this.current = { x: 0, y: 0, scale: 1 };
      this.target = { ...this.current };
      const reset = () => { this.target = { x: 0, y: 0, scale: 1 }; this.animate(); };
      if (this.dataset.magnetic === 'true' && this.button) {
        this.media.addEventListener('pointermove', event => {
          if (event.pointerType !== 'mouse' || !this.mouse.matches || this.motion.matches || this.button.matches(':focus-visible')) return;
          const bounds = this.media.getBoundingClientRect();
          const limitX = Math.max(0, (bounds.width - this.button.offsetWidth) / 2 - 12);
          const limitY = Math.max(0, (bounds.height - this.button.offsetHeight) / 2 - 12);
          this.target = {
            x: Math.max(-limitX, Math.min(limitX, (event.clientX - bounds.left - bounds.width / 2) * .5)),
            y: Math.max(-limitY, Math.min(limitY, (event.clientY - bounds.top - bounds.height / 2) * .5)),
            scale: 1.1,
          };
          this.animate();
        }, options);
        this.media.addEventListener('pointerleave', reset, options);
        this.button.addEventListener('focus', reset, options);
        this.motion.addEventListener('change', reset, options);
        this.mouse.addEventListener('change', reset, options);
      }
      this.dialog = this.querySelector('[data-video-dialog]');
      this.template = this.querySelector('[data-video-dialog-template]');
      this.trigger = this.querySelector('[data-video-dialog-open]');
      this.trigger?.addEventListener('click', () => {
        if (!window.ThemeOverlay || !this.dialog) return;
        this.overlay ||= window.ThemeOverlay.get(this.dialog);
        const mount = this.dialog.querySelector('[data-video-dialog-mount]');
        mount.replaceChildren(this.template.content.cloneNode(true));
        this.overlay.open({ opener: this.trigger });
        // This play request follows an explicit click, including with reduced motion.
        mount.querySelector('video')?.play()?.catch(() => {});
      }, options);
      // Stop playback as closing begins; remove external frames after the fade finishes.
      this.dialog?.addEventListener('closing', () => {
        this.dialog.querySelectorAll('video').forEach(video => video.pause());
        this.dialog.querySelectorAll('iframe').forEach(frame => frame.remove());
      }, options);
      this.dialog?.addEventListener('close', () => this.dialog.querySelector('[data-video-dialog-mount]')?.replaceChildren(), options);
      this.visibility = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) this.media?.querySelectorAll('video').forEach(video => video.pause());
      });
      this.visibility.observe(this);
    }
    animate() {
      if (this.frame) return;
      const tick = () => {
        this.frame = 0;
        let moving = false;
        for (const key of ['x', 'y', 'scale']) {
          const difference = this.target[key] - this.current[key];
          this.current[key] = this.motion.matches || Math.abs(difference) < .001 ? this.target[key] : this.current[key] + difference * .12;
          moving ||= Math.abs(this.target[key] - this.current[key]) > .001;
        }
        this.button?.style.setProperty('--magnetic-x', `${this.current.x}px`);
        this.button?.style.setProperty('--magnetic-y', `${this.current.y}px`);
        this.button?.style.setProperty('--magnetic-scale', String(this.current.scale));
        if (moving) this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }
    disconnectedCallback() {
      // Overlay portals may move descendants; only destroy after a real removal.
      queueMicrotask(() => {
        if (this.isConnected) return;
        this.controller?.abort();
        this.controller = null;
        cancelAnimationFrame(this.frame);
        this.frame = 0;
        this.visibility?.disconnect();
        this.media?.querySelectorAll('video').forEach(video => video.pause());
        this.overlay?.destroy();
        this.overlay = null;
      });
    }
  }
  customElements.define('lh-video-presentation', VideoPresentation);
})();
