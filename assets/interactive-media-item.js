(() => {
  if (customElements.get('lh-interactive-media-item')) return;
  class InteractiveMediaItem extends HTMLElement {
    connectedCallback() {
      if (this.controller) return;
      this.controller = new AbortController();
      const options = { signal: this.controller.signal };
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.mouse = matchMedia('(hover: hover) and (pointer: fine)');
      this.players = [];
      this.dialog = this.querySelector('[data-item-video-dialog]');
      const externalButton = this.querySelector('[data-item-external-play]');
      this.querySelectorAll(':scope > .video-block > .video').forEach(media => {
        const source = media.querySelector('video, iframe');
        if (!source) return;
        // Keep external embeds detached until the parent popup is opened.
        if (this.dataset.playback === 'popup' && source.matches('iframe')) {
          source.remove();
          media.append(externalButton.content.cloneNode(true));
          media.setAttribute('data-video-ready', '');
        }
        if (this.dataset.playback === 'popup' && source.matches('video')) {
          source.autoplay = false;
          source.removeAttribute('autoplay');
          source.pause();
          source.controls = false;
          if (!media.querySelector('.video__play')) media.append(externalButton.content.cloneNode(true));
          media.setAttribute('data-video-ready', '');
        }
        const button = media.querySelector('.video__play');
        if (button) {
          button.dataset.playLabel = this.dataset.playLabel;
          if (button.getAttribute('aria-pressed') !== 'true') button.setAttribute('aria-label', this.dataset.playLabel);
        }
        const player = { media, source, button, current: { x: 0, y: 0, scale: 1 }, target: { x: 0, y: 0, scale: 1 }, frame: 0 };
        this.players.push(player);
        if (this.dataset.playback === 'popup' && button) {
          button.setAttribute('aria-haspopup', 'dialog');
          button.setAttribute('aria-controls', this.dialog.id);
          // Capture before the base Video's inline play handler.
          button.addEventListener('click', event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            source.pause?.();
            this.open(player);
          }, { ...options, capture: true });
        }
        const reset = () => { player.target = { x: 0, y: 0, scale: 1 }; this.animate(player); };
        if (this.dataset.magnetic !== 'true' || !button) return;
        media.addEventListener('pointermove', event => {
          if (event.pointerType !== 'mouse' || !this.mouse.matches || this.motion.matches || button.matches(':focus-visible')) return;
          const bounds = media.getBoundingClientRect();
          const limitX = Math.max(0, (bounds.width - button.offsetWidth) / 2 - 12);
          const limitY = Math.max(0, (bounds.height - button.offsetHeight) / 2 - 12);
          player.target = {
            x: Math.max(-limitX, Math.min(limitX, (event.clientX - bounds.left - bounds.width / 2) * .5)),
            y: Math.max(-limitY, Math.min(limitY, (event.clientY - bounds.top - bounds.height / 2) * .5)), scale: 1.1,
          };
          this.animate(player);
        }, options);
        media.addEventListener('pointerleave', reset, options);
        button.addEventListener('focus', reset, options);
        this.motion.addEventListener('change', reset, options);
        this.mouse.addEventListener('change', reset, options);
      });
      this.dialog?.addEventListener('closing', () => {
        this.dialog.querySelectorAll('video').forEach(video => video.pause());
        this.dialog.querySelectorAll('iframe').forEach(frame => frame.remove());
      }, options);
      this.dialog?.addEventListener('close', () => this.dialog.querySelector('[data-item-video-mount]')?.replaceChildren(), options);
    }
    open(player) {
      if (!window.ThemeOverlay || !this.dialog) return;
      this.overlay ||= window.ThemeOverlay.get(this.dialog);
      const clone = player.source.cloneNode(true);
      if (clone.matches('video')) {
        clone.controls = true;
        clone.autoplay = false;
        clone.removeAttribute('autoplay');
      } else {
        const url = new URL(clone.src);
        url.searchParams.set('autoplay', '1');
        clone.src = url.href;
      }
      this.dialog.querySelector('[data-item-video-mount]').replaceChildren(clone);
      this.overlay.open({ opener: player.button });
      clone.play?.()?.catch(() => {});
    }
    animate(player) {
      if (player.frame) return;
      const tick = () => {
        player.frame = 0;
        let moving = false;
        for (const key of ['x', 'y', 'scale']) {
          const difference = player.target[key] - player.current[key];
          player.current[key] = this.motion.matches || Math.abs(difference) < .001 ? player.target[key] : player.current[key] + difference * .12;
          moving ||= Math.abs(player.target[key] - player.current[key]) > .001;
        }
        player.button?.style.setProperty('--magnetic-x', `${player.current.x}px`);
        player.button?.style.setProperty('--magnetic-y', `${player.current.y}px`);
        player.button?.style.setProperty('--magnetic-scale', String(player.current.scale));
        if (moving) player.frame = requestAnimationFrame(tick);
      };
      player.frame = requestAnimationFrame(tick);
    }
    disconnectedCallback() {
      queueMicrotask(() => {
        if (this.isConnected) return;
        this.controller?.abort();
        this.controller = null;
        this.players?.forEach(player => {
          cancelAnimationFrame(player.frame);
          player.source.pause?.();
          if (player.source.matches('iframe')) {
            player.button?.remove();
            player.media.append(player.source);
          }
        });
        this.overlay?.destroy();
        this.overlay = null;
      });
    }
  }
  customElements.define('lh-interactive-media-item', InteractiveMediaItem);
})();
