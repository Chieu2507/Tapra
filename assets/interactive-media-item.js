(() => {
  if (customElements.get('lh-interactive-media-item')) return;
  const expandedSections = new WeakMap();
  class InteractiveMediaItem extends HTMLElement {
    connectedCallback() {
      if (this.controller) return;
      this.controller = new AbortController();
      const options = { signal: this.controller.signal };
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.mouse = matchMedia('(hover: hover) and (pointer: fine)');
      this.players = [];
      this.sectionRoot = this.closest('.interactive-media');
      this.fullContent = this.querySelector('[data-full-media-content]');
      if (this.fullContent) {
        this.contentHome = document.createComment('Full media content');
        this.fullContent.before(this.contentHome);
      }
      if (this.fullContent) {
        this.copyObserver = new ResizeObserver(() => {
          if (this.fullContent.classList.contains('is-scroll-copy')) this.measureScrollCopy();
        });
        this.copyObserver.observe(this.fullContent.querySelector('.interactive-media-item__content'));
      }
      this.expansion = this.querySelector('[data-media-expansion]');
      if (this.expansion) this.expansion.dataset.blend = this.dataset.blend;
      this.closeButton = this.expansion?.querySelector('[data-media-collapse]');
      this.closeButton?.addEventListener('click', () => this.collapse(), options);
      window.addEventListener('scroll', () => { if (this.activePlayer) this.positionClose(); }, { ...options, passive: true });
      window.addEventListener('resize', () => { if (this.activePlayer) this.positionClose(); }, options);
      this.sectionRoot?.addEventListener('keydown', event => {
        if (event.key === 'Escape' && this.activePlayer) { event.preventDefault(); this.collapse(); }
      }, options);
      const externalButton = this.querySelector('[data-item-external-play]');
      this.querySelectorAll(':scope > .video-block > .video').forEach(media => {
        const source = media.querySelector('video, iframe');
        if (!source) return;
        // Keep external embeds detached until the item is expanded.
        if (this.dataset.playback === 'full_section' && source.matches('iframe')) {
          source.remove();
          media.append(externalButton.content.cloneNode(true));
          media.setAttribute('data-video-ready', '');
        }
        if (this.dataset.playback === 'full_section' && source.matches('video')) {
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
        if (this.dataset.playback === 'full_section' && button) {
          button.setAttribute('aria-expanded', 'false');
          button.setAttribute('aria-controls', this.expansion.id);
          // Capture before the base Video's inline play handler.
          media.addEventListener('click', event => {
            if (event.target.closest('[data-full-media-content]')) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            source.pause?.();
            this.expand(player);
          }, { ...options, capture: true });
        }
        const reset = () => { player.target = { x: 0, y: 0, scale: 1 }; this.animate(player); };
        if (this.dataset.magnetic !== 'true' || !button) return;
        media.addEventListener('pointermove', event => {
          if (this.activePlayer || event.pointerType !== 'mouse' || !this.mouse.matches || this.motion.matches || button.matches(':focus-visible')) return;
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
    }
    setFullContent(visible, host = this.sectionRoot) {
      if (!this.fullContent) return;
      clearTimeout(this.contentReturnTimer);
      if (visible && host && this.fullContent.parentElement !== host) host.append(this.fullContent);
      this.fullContent.inert = !visible;
      this.fullContent.setAttribute('aria-hidden', String(!visible));
      this.fullContent.classList.toggle('is-visible', visible);
      if (!visible) {
        if (this.fullContent.contains(document.activeElement)) {
          const target = this.players[0]?.button || this.querySelector('.image-block');
          if (target) { if (!target.hasAttribute('tabindex') && !target.matches('button')) target.tabIndex = -1; target.focus({ preventScroll: true }); }
        }
        this.contentReturnTimer = setTimeout(() => this.returnContent(), this.motion.matches ? 0 : 240);
      }
    }
    returnContent() {
      if (this.contentHome?.isConnected && this.fullContent) this.contentHome.after(this.fullContent);
    }
    measureScrollCopy() {
      const player = this.players[0];
      if (!player?.button || !this.fullContent) return;
      const copy = this.fullContent.querySelector('.interactive-media-item__content');
      const buttonHeight = player.button.offsetHeight;
      const gap = parseFloat(getComputedStyle(this.fullContent).getPropertyValue('--media-content-play-gap')) || 32;
      const offset = (copy.getBoundingClientRect().height + gap) / 2 * (this.scrollCopyOpacity || 0);
      this.fullContent.style.setProperty('--media-content-play-size', `${buttonHeight}px`);
      player.button.style.setProperty('--scroll-play-offset', `${offset}px`);
    }
    resetScrollCopy() {
      if (!this.fullContent) return;
      this.fullContent.classList.remove('is-scroll-copy');
      this.players[0]?.button?.style.removeProperty('--scroll-play-offset');
    }
    setScrollProgress(progress) {
      this.scrollProgress = progress;
      if (this.dataset.mediaKind !== 'video') { this.setScrollFull(progress >= .999); return; }
      const player = this.players[0];
      if (this.activePlayer || !player || !this.fullContent?.querySelector('.interactive-media-item__content')?.children.length) return;
      const fade = Math.max(0, Math.min(1, (progress - .65) / .35));
      this.scrollCopyOpacity = fade * fade * (3 - 2 * fade);
      if (fade > 0) {
        this.fullContent.classList.add('is-scroll-copy');
        this.fullContent.style.setProperty('--media-scroll-copy-opacity', String(this.scrollCopyOpacity));
        this.setFullContent(true, player.media);
        this.measureScrollCopy();
      } else {
        this.setFullContent(false);
        this.resetScrollCopy();
      }
    }
    setScrollFull(full) {
      if (this.dataset.mediaKind !== 'image' || full === this.scrollFull) return;
      this.scrollFull = full;
      this.setFullContent(full);
    }
    expansionFrames(player) {
      const section = this.sectionRoot.getBoundingClientRect();
      const media = player.media.getBoundingClientRect();
      return [
        { left: `${media.left - section.left}px`, top: `${media.top - section.top}px`, width: `${media.width}px`, height: `${media.height}px`, borderRadius: getComputedStyle(player.media).borderRadius },
        { left: '0px', top: '0px', width: `${section.width}px`, height: `${section.height}px`, borderRadius: '0px' },
      ];
    }
    positionClose() {
      const bounds = this.sectionRoot.getBoundingClientRect();
      this.expansion.style.setProperty('--media-collapse-top', `${Math.max(16, Math.min(bounds.height - 56, 16 - bounds.top))}px`);
    }
    expand(player) {
      if (!this.expansion || !this.sectionRoot || this.activePlayer) return;
      expandedSections.get(this.sectionRoot)?.collapse({ animate: false, restoreFocus: false });
      this.expansionEpoch = (this.expansionEpoch || 0) + 1;
      expandedSections.set(this.sectionRoot, this);
      this.activePlayer = player;
      if (this.fullContent) { this.setFullContent(false); this.resetScrollCopy(); }
      this.expansion.classList.remove('is-collapsing');
      const clone = player.source.cloneNode(true);
      const epoch = this.expansionEpoch;
      let settled = this.motion.matches;
      let started = false;
      const reveal = () => {
        if (started && settled && this.activePlayer === player && this.expansionEpoch === epoch) this.setFullContent(true, this.expansion);
      };
      clone.addEventListener(clone.matches('video') ? 'playing' : 'load', () => { started = true; reveal(); }, { once: true });
      if (clone.matches('video')) {
        clone.controls = true;
        clone.autoplay = false;
        clone.removeAttribute('autoplay');
        const poster = player.media.querySelector('.video__cover img');
        if (poster) clone.poster = poster.currentSrc || poster.src;
      } else {
        const url = new URL(clone.src);
        url.searchParams.set('autoplay', '1');
        clone.src = url.href;
      }
      const frames = this.expansionFrames(player);
      this.expansion.querySelector('[data-full-media-mount]').replaceChildren(clone);
      this.sectionRoot.append(this.expansion);
      this.expansion.hidden = false;
      player.button?.setAttribute('aria-expanded', 'true');
      this.positionClose();
      this.sectionRoot.querySelector('.interactive-media__content').inert = true;
      this.closeButton.focus({ preventScroll: true });
      this.sectionRoot.classList.add('is-media-expanded');
      if (!this.motion.matches) {
        this.expansionAnimation = this.expansion.animate(frames, { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' });
        this.expansionAnimation.finished.then(() => { settled = true; reveal(); }, () => {});
      }
      clone.play?.()?.catch(() => {});
    }
    collapse({ animate = true, restoreFocus = true } = {}) {
      const player = this.activePlayer;
      if (!player) return;
      this.activePlayer = null;
      this.setFullContent(false);
      const epoch = this.expansionEpoch = (this.expansionEpoch || 0) + 1;
      this.expansionAnimation?.cancel();
      this.expansion.classList.add('is-collapsing');
      this.expansion.querySelectorAll('video').forEach(video => video.pause());
      this.expansion.querySelectorAll('iframe').forEach(frame => frame.remove());
      this.sectionRoot.classList.remove('is-media-expanded');
      this.sectionRoot.querySelector('.interactive-media__content').inert = false;
      player.button?.setAttribute('aria-expanded', 'false');
      expandedSections.delete(this.sectionRoot);
      const finish = () => {
        if (this.expansionEpoch !== epoch) return;
        this.expansion.hidden = true;
        this.expansion.classList.remove('is-collapsing');
        this.expansion.querySelector('[data-full-media-mount]').replaceChildren();
        this.append(this.expansion);
        if (this.scrollProgress !== undefined) this.setScrollProgress(this.scrollProgress);
        if (restoreFocus && player.button?.isConnected) player.button.focus({ preventScroll: true });
      };
      if (animate && !this.motion.matches) {
        const frames = this.expansionFrames(player).reverse();
        this.expansionAnimation = this.expansion.animate(frames, { duration: 400, easing: 'cubic-bezier(.22,1,.36,1)' });
        this.expansionAnimation.finished.then(finish, finish);
      } else finish();
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
        this.collapse({ animate: false, restoreFocus: false });
        clearTimeout(this.contentReturnTimer);
        this.returnContent();
        this.contentHome?.remove();
        this.expansionAnimation?.cancel();
        this.copyObserver?.disconnect();
        this.resetScrollCopy();
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

      });
    }
  }
  customElements.define('lh-interactive-media-item', InteractiveMediaItem);
})();
