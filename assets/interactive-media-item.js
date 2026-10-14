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
      this.expansion = this.querySelector('[data-media-expansion]');
      if (this.expansion) this.expansion.dataset.blend = this.dataset.blend;
      this.closeButton = this.expansion?.querySelector('[data-media-collapse]');
      this.closeButton?.addEventListener('click', () => this.collapse(), options);
      window.addEventListener('scroll', () => {
        if (!this.activePlayer) return;
        const bounds = this.sectionRoot.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= document.documentElement.clientHeight) {
          this.collapse({ animate: false, restoreFocus: false });
        } else this.positionClose();
      }, { ...options, passive: true });
      window.addEventListener('resize', () => { if (this.activePlayer) this.positionClose(); }, options);
      this.sectionRoot?.addEventListener('keydown', event => {
        if (event.key === 'Escape' && this.activePlayer && !this.usesScrollPlayback()) { event.preventDefault(); this.collapse(); }
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
        source.addEventListener('pause', () => {
          // The base player hides native controls on pause. Keep them available
          // while the scroll-owned player is visible so it can be resumed.
          queueMicrotask(() => { if (player.scrollAutoplay && source.matches('video')) source.controls = true; });
        }, options);
        if (this.dataset.playback === 'full_section' && button) {
          button.setAttribute('aria-expanded', 'false');
          button.setAttribute('aria-controls', this.expansion.id);
          // Capture before the base Video's inline play handler.
          media.addEventListener('click', event => this.openFromMedia(event, player), { ...options, capture: true });
        } else if (button) {
          media.addEventListener('click', event => {
            if (event.target.closest('[data-full-media-content]')) return;
            player.inlineManual = true;
            this.closest('lh-interactive-media-scroll')?.resumeScroll?.();
          }, { ...options, capture: true });
        }
        const reset = () => { player.target = { x: 0, y: 0, scale: 1 }; this.animate(player); };
        if (this.dataset.magnetic !== 'true' || !button) return;
        media.addEventListener('pointermove', event => {
          if (this.activePlayer || event.pointerType !== 'mouse' || !this.mouse.matches || this.motion.matches || button.matches(':focus-visible')) return;
          const bounds = { ...media.getBoundingClientRect().toJSON() };
          const reveal = media.closest('.interactive-media-scroll-target');
          if (reveal) {
            const style = getComputedStyle(reveal);
            const inset = edge => parseFloat(style.getPropertyValue(`--scroll-clip-${edge}`)) || 0;
            bounds.left += inset('left');
            bounds.top += inset('top');
            bounds.width -= inset('left') + inset('right');
            bounds.height -= inset('top') + inset('bottom');
          }
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
    openFromMedia(event, player) {
      if (this.dataset.playback !== 'full_section' || event.target.closest('[data-full-media-content]')) return;
      // Native controls remain interactive at full size. After reverse zoom,
      // clicking the video must expand it again, even if autoplay was latched.
      if (player.media.classList.contains('is-scroll-autoplay') && this.scrollProgress >= .6) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      player.source.pause?.();
      this.expand(player);
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
        this.contentReturnTimer = setTimeout(() => this.returnContent(), this.motion.matches ? 0 : this.motionDuration('--motion-duration-standard'));
      }
    }
    returnContent() {
      if (this.contentHome?.isConnected && this.fullContent) this.contentHome.after(this.fullContent);
    }
    resetScrollCopy() {
      this.fullContent?.classList.remove('is-scroll-copy');
      if (this.players[0]?.button) {
        this.players[0].button.inert = Boolean(this.players[0].scrollAutoplay);
        if (!this.players[0].scrollAutoplay) this.players[0].button.removeAttribute('aria-hidden');
      }
    }
    setScrollPlayback(progress, active = true) {
      const player = this.players?.[0];
      if (!player || this.activePlayer || this.closingPlayer) return;
      if (player.inlineManual && !player.scrollAutoplay) {
        if (active) return;
        player.source.pause?.();
        player.inlineManual = false;
      }
      if (!active || progress <= 0 || this.motion.matches) { this.stopScrollPlayback(progress <= 0 || this.motion.matches); return; }
      if (progress < .6 || player.scrollAutoplay) return;
      const source = player.source;
      const epoch = player.scrollEpoch = (player.scrollEpoch || 0) + 1;
      player.scrollAutoplay = true;
      const ready = () => {
        if (!player.scrollAutoplay || player.scrollEpoch !== epoch) return;
        player.media.classList.add('is-scroll-autoplay');
        if (player.button) { player.button.inert = true; player.button.setAttribute('aria-hidden', 'true'); }
      };
      if (source.matches('video')) {
        player.scrollMuted = source.muted;
        player.scrollControls = source.controls;
        source.muted = true;
        source.playsInline = true;
        source.controls = true;
        source.play()?.then(ready, () => {
          if (player.scrollEpoch === epoch) this.stopScrollPlayback();
        });
      } else {
        player.scrollSrc = source.src;
        const url = new URL(source.src);
        url.searchParams.set('autoplay', '1');
        url.searchParams.set('mute', '1');
        url.searchParams.set('muted', '1');
        source.src = url.href;
        player.media.append(source);
        ready();
      }
    }
    stopScrollPlayback(restorePoster = true) {
      const player = this.players?.[0];
      if (!player) return;
      if (!player.scrollAutoplay) {
        if (restorePoster && player.media.classList.contains('is-scroll-autoplay')) {
          player.media.classList.remove('is-scroll-autoplay', 'is-playing', 'has-started');
          if (player.button) { player.button.inert = false; player.button.removeAttribute('aria-hidden'); }
        }
        return;
      }
      player.scrollAutoplay = false;
      player.scrollEpoch = (player.scrollEpoch || 0) + 1;
      const source = player.source;
      if (source.matches('video')) {
        source.pause();
        source.muted = player.scrollMuted;
        source.controls = player.scrollControls;
      } else {
        if (this.dataset.playback === 'full_section') source.remove();
        source.src = player.scrollSrc;
      }
      if (restorePoster) {
        player.media.classList.remove('is-scroll-autoplay', 'is-playing', 'has-started');
        if (player.button) { player.button.inert = false; player.button.removeAttribute('aria-hidden'); }
      }
    }
    setScrollProgress(progress) {
      this.scrollProgress = progress;
      if (this.activePlayer) return;
      this.renderScrollContent(progress, this.closingPlayer ? this.expansion : undefined);
    }
    renderScrollContent(progress, host) {
      const player = this.players[0];
      if (!this.fullContent?.querySelector('.interactive-media-item__content')?.children.length) return;
      const fade = Math.max(0, Math.min(1, (progress - .6) / .35));
      const enter = fade * fade * (3 - 2 * fade);
      const exit = Math.max(0, Math.min(1, (progress - 1) / .6));
      const leave = exit * exit * (3 - 2 * exit);
      const opacity = enter * (1 - leave);
      const playerTransition = this.fullContent.classList.contains('is-player-transition');
      this.fullContent.classList.add('is-scroll-copy');
      this.fullContent.style.setProperty('--media-scroll-copy-opacity', String(opacity));
      this.fullContent.style.setProperty('--media-scroll-copy-travel', `${Math.min(255, this.sectionRoot.clientHeight * .35) * (1 - enter - leave)}px`);
      // Keep scroll styling even at zero so hiding cannot fall back to the
      // ordinary playback transition. Both directions follow scroll directly.
      this.setFullContent(fade > 0 || playerTransition, host || player?.media || this.querySelector(':scope > .image-block') || this.sectionRoot);
    }
    motionDuration(token = '--motion-duration-surface') {
      const value = getComputedStyle(this).getPropertyValue(token).trim();
      return (parseFloat(value) || 0) * (value.endsWith('ms') ? 1 : 1000);
    }
    surfaceMotion() {
      return { duration: this.motionDuration(), easing: getComputedStyle(this).getPropertyValue('--motion-ease-surface').trim() || 'ease' };
    }
    expansionFrames(player) {
      const section = this.sectionRoot.getBoundingClientRect();
      const media = player.media.getBoundingClientRect();
      const reveal = player.media.closest?.('.interactive-media-scroll-target');
      if (reveal && this.usesScrollPlayback()) {
        const canvas = { left: '0px', top: '0px', width: `${section.width}px`, height: `${section.height}px`, borderRadius: '0px' };
        return [
          { ...canvas, left: `${media.left - section.left}px`, top: `${media.top - section.top}px`, clipPath: getComputedStyle(player.media).clipPath },
          { ...canvas, clipPath: 'inset(0px 0px 0px 0px round 0px)' },
        ];
      }
      return [
        { left: `${media.left - section.left}px`, top: `${media.top - section.top}px`, width: `${media.width}px`, height: `${media.height}px`, borderRadius: getComputedStyle(player.media).borderRadius },
        { left: '0px', top: '0px', width: `${section.width}px`, height: `${section.height}px`, borderRadius: '0px' },
      ];
    }
    usesScrollPlayback() {
      return Boolean(this.scrollOwner?.classList?.contains('is-scroll-ready'));
    }
    positionClose() {
      if (this.usesScrollPlayback()) return;
      const bounds = this.sectionRoot.getBoundingClientRect();
      this.expansion.style.setProperty('--media-collapse-top', `${Math.max(16, Math.min(bounds.height - 56, 16 - bounds.top))}px`);
    }
    expand(player) {
      if (!this.expansion || !this.sectionRoot || this.activePlayer) return;
      this.scrollOwner = this.closest('lh-interactive-media-scroll');
      this.scrollBeforeOpen = this.scrollOwner?.capturePosition?.();
      this.autoplayBeforeOpen = Boolean(player.scrollAutoplay);
      this.stopScrollPlayback();
      expandedSections.get(this.sectionRoot)?.collapse({ animate: false, restoreFocus: false });
      this.expansionEpoch = (this.expansionEpoch || 0) + 1;
      this.expansionAnimation?.cancel();
      this.closingPlayer = null;
      expandedSections.set(this.sectionRoot, this);
      this.activePlayer = player;
      this.expansion.style.setProperty('--media-player-overlay', getComputedStyle(player.media).getPropertyValue('--video-block-overlay').trim() || 'transparent');
      if (this.fullContent) {
        if (!this.scrollBeforeOpen) this.resetScrollCopy();
        clearTimeout(this.contentTransitionTimer);
        clearTimeout(this.contentReturnTimer);
        this.fullContent.classList.add('is-player-transition');
        this.expansion.append(this.fullContent);
      }
      this.expansion.classList.remove('is-collapsing');
      const clone = player.source.cloneNode(true);
      const epoch = this.expansionEpoch;
      let settled = this.motion.matches;
      let started = false;
      const reveal = () => {
        if (started && settled && this.activePlayer === player && this.expansionEpoch === epoch) {
          if (this.scrollBeforeOpen) this.renderScrollContent(1, this.expansion);
          else this.setFullContent(true, this.expansion);
          if (this.fullContent) this.contentTransitionTimer = setTimeout(() => this.fullContent?.classList.remove('is-player-transition'), this.motion.matches ? 0 : this.motionDuration('--motion-duration-reveal'));
        }
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
      this.closest('lh-interactive-media-scroll')?.completeFor?.(player.media);
      this.expansion.querySelector('[data-full-media-mount]').replaceChildren(clone);
      this.sectionRoot.append(this.expansion);
      this.expansion.hidden = false;
      player.button?.setAttribute('aria-expanded', 'true');
      this.positionClose();
      this.sectionRoot.querySelector('.interactive-media__content').inert = true;
      this.sectionRoot.classList.add('is-media-expanded');
      const focusClose = () => {
        if (this.activePlayer !== player || this.expansionEpoch !== epoch) return;
        if (this.usesScrollPlayback()) {
          clone.tabIndex = 0;
          clone.focus({ preventScroll: true });
        } else this.closeButton.focus({ preventScroll: true });
      };
      if (!this.motion.matches) {
        this.expansionAnimation = this.expansion.animate(frames, this.surfaceMotion());
        this.expansionAnimation.finished.then(() => { settled = true; reveal(); focusClose(); }, () => {});
      } else queueMicrotask(focusClose);
      clone.play?.()?.catch(() => {});
    }
    resumeScrollPlayer(player) {
      const current = this.expansion.querySelector('video');
      const source = player.source;
      if (!current || !source.matches('video')) return;
      const playing = !current.paused && !current.ended;
      player.scrollMuted = source.muted;
      player.scrollControls = source.controls;
      player.scrollAutoplay = true;
      player.scrollEpoch = (player.scrollEpoch || 0) + 1;
      const epoch = player.scrollEpoch;
      source.currentTime = current.currentTime;
      source.muted = current.muted;
      source.volume = current.volume;
      source.controls = true;
      player.media.classList.add('is-scroll-autoplay', 'has-started');
      if (player.button) { player.button.inert = true; player.button.setAttribute('aria-hidden', 'true'); }
      if (playing) source.play()?.catch(() => {
        if (player.scrollEpoch === epoch) this.stopScrollPlayback();
      });
    }
    collapse({ animate = true, restoreFocus = true, resumeScroll = false } = {}) {
      const player = this.activePlayer;
      if (!player) return;
      const visualBounds = this.expansion.getBoundingClientRect?.();
      const visualRadius = visualBounds ? getComputedStyle(this.expansion).borderRadius : null;
      clearTimeout(this.contentTransitionTimer);
      this.fullContent?.classList.add('is-player-transition');
      this.activePlayer = null;
      this.closingPlayer = player;
      // Restoring scroll updates the scene synchronously. Mark closing first
      // so reverse-scroll handoff cannot recursively dismiss this animation.
      if (restoreFocus) this.scrollOwner?.restorePosition?.(this.scrollBeforeOpen);
      if (this.fullContent) this.renderScrollContent(this.scrollProgress ?? 0, this.expansion);
      else this.setFullContent(false);
      const epoch = this.expansionEpoch = (this.expansionEpoch || 0) + 1;
      this.expansionAnimation?.cancel();
      this.expansion.classList.add('is-collapsing');
      if (resumeScroll) this.resumeScrollPlayer(player);
      this.expansion.querySelectorAll('video').forEach(video => video.pause());
      this.expansion.querySelectorAll('iframe').forEach(frame => frame.remove());
      this.sectionRoot.classList.remove('is-media-expanded');
      this.sectionRoot.querySelector('.interactive-media__content').inert = false;
      player.button?.setAttribute('aria-expanded', 'false');
      expandedSections.delete(this.sectionRoot);
      const finish = () => {
        if (this.expansionEpoch !== epoch) return;
        this.closingPlayer = null;
        this.expansion.hidden = true;
        this.expansion.classList.remove('is-collapsing');
        this.expansion.querySelector('[data-full-media-mount]').replaceChildren();
        this.append(this.expansion);
        this.fullContent?.classList.remove('is-player-transition');
        if (this.scrollProgress !== undefined) this.setScrollProgress(this.scrollProgress);
        else this.setFullContent(false);
        if (restoreFocus && player.button?.isConnected) player.button.focus({ preventScroll: true });
        if (this.scrollProgress !== undefined) this.setScrollPlayback(restoreFocus && this.autoplayBeforeOpen ? Math.max(.6, this.scrollProgress) : this.scrollProgress, !this.inert);
        this.scrollBeforeOpen = null;
      };
      if (animate && !this.motion.matches) {
        const frames = this.expansionFrames(player).reverse();
        if (visualBounds?.width > 0) {
          const section = this.sectionRoot.getBoundingClientRect();
          frames[0] = { left: `${visualBounds.left - section.left}px`, top: `${visualBounds.top - section.top}px`, width: `${visualBounds.width}px`, height: `${visualBounds.height}px`, borderRadius: visualRadius };
        }
        this.expansionAnimation = this.expansion.animate(frames, this.surfaceMotion());
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
        clearTimeout(this.contentTransitionTimer);
        this.returnContent();
        this.contentHome?.remove();
        this.expansionAnimation?.cancel();
        this.resetScrollCopy();
        this.stopScrollPlayback();
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
