

  (() => {
    const runtimeKey = Symbol.for('theme.elara-marquee.runtime');
    if (window[runtimeKey]) return;
    window[runtimeKey] = true;
    const instances = new WeakMap();
    const selector = '.elara-marquee--block';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const prepareClone = (clone) => {
      clone.setAttribute('aria-hidden', 'true');
      if (!window.Shopify?.designMode) clone.setAttribute('inert', '');
      // Keep Shopify block attributes so copies select their source in the editor.
      [clone, ...clone.querySelectorAll('*')].forEach((element) => {
        element.removeAttribute('id');
        // Hidden/inert copies cannot enter the shared reveal lifecycle.
        // Render their content immediately instead of inheriting opacity: 0.
        element.classList.remove('reveal-pending');
        element.removeAttribute('data-marquee-animation');
        if (element.hasAttribute('data-countdown-announcement')) element.removeAttribute('aria-live');
        if (element.hasAttribute('data-block-animation') || element.hasAttribute('data-component-reveal')) {
          element.setAttribute('data-block-animation', 'none');
          element.removeAttribute('data-component-reveal');
        }
        if (element.matches('a, button, input, select, textarea, [tabindex]')) {
          element.setAttribute('tabindex', '-1');
        }
      });
    };

    const initialize = (marquee) => {
      if (!marquee || instances.has(marquee) || reducedMotion.matches || marquee.classList.contains('elara-marquee--static')) return;

      const track = marquee.querySelector('.elara-marquee__track');
      const viewport = marquee.querySelector('.elara-marquee__viewport');
      if (!track || !viewport) return;

      let frame = 0;
      let scrollFrame = 0;
      let pointerFrame = 0;
      let inspectorActive = Boolean(window.Shopify?.inspectMode);
      let pointerPosition = null;
      let lastScrollY = window.scrollY;
      let parallaxPixels = 0;
      let lastParallaxFrame = 0;
      let destroyed = false;
      let measuredLayout = '';
      const originalItems = () => [...track.children].filter((item) => !item.hasAttribute('data-marquee-clone'));
      const observeMutations = () => mutationObserver.observe(track, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
      });

      const syncClones = () => {
        if (destroyed) return;
        mutationObserver.disconnect();
        const previousAnimation = track.getAnimations().find((animation) => animation.animationName?.startsWith('marquee-scroll-'));
        const previousDuration = Number(previousAnimation?.effect?.getComputedTiming().duration);
        const previousPhase = previousDuration && previousAnimation.currentTime !== null ? Number(previousAnimation.currentTime) / previousDuration : 0;
        marquee.classList.add('elara-marquee--measuring');
        track.querySelectorAll('[data-marquee-clone]').forEach((clone) => clone.remove());
        const items = originalItems().filter((item) => item.getClientRects().length && item.getBoundingClientRect().width > 0);
        resizeObserver.disconnect();
        resizeObserver.observe(viewport);
        items.forEach((item) => resizeObserver.observe(item));

        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        // Include the trailing gap so the next cycle starts at the exact seam.
        const distance = items.reduce((width, item) => {
          const style = getComputedStyle(item);
          return width + item.getBoundingClientRect().width + (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0) + gap;
        }, 0);
        measuredLayout = layoutSignature();
        if (items.length === 0 || distance <= 0 || viewport.clientWidth === 0) {
          marquee.classList.remove('elara-marquee--ready', 'elara-marquee--measuring');
          track.style.removeProperty('--marquee-loop-distance');
          observeMutations();
          return;
        }

        // Keep a full viewport of content beyond the end of one animation cycle.
        const copyCount = Math.max(1, Math.ceil((viewport.clientWidth + gap) / distance));
        const fragment = document.createDocumentFragment();
        for (let setIndex = 0; setIndex < copyCount; setIndex += 1) {
          items.forEach((item) => {
            const clone = item.cloneNode(true);
            prepareClone(clone);
            clone.dataset.marqueeClone = 'true';
            fragment.appendChild(clone);
          });
        }
        track.appendChild(fragment);
        track.style.setProperty('--marquee-loop-distance', `${distance}px`);
        // Keep speed in pixels/second so adding content does not accelerate it.
        const speed = Math.max(0.1, Math.min(2, Number(marquee.dataset.marqueeSpeed) || 0.6));
        track.style.setProperty('--marquee-duration', `${distance / (60 * speed)}s`);
        marquee.classList.add('elara-marquee--ready');
        marquee.classList.remove('elara-marquee--measuring');
        const animation = track.getAnimations().find((entry) => entry.animationName?.startsWith('marquee-scroll-'));
        if (animation && previousAnimation) animation.currentTime = previousPhase * distance / (60 * speed) * 1000;
        observeMutations();
      };

      const scheduleSync = () => {
        if (destroyed || frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          syncClones();
        });
      };
      const layoutSignature = () => [
        viewport.clientWidth,
        getComputedStyle(track).columnGap,
        ...originalItems().map((item) => item.getBoundingClientRect().width.toFixed(2))
      ].join(':');
      const mutationObserver = new MutationObserver((mutations) => {
        if (mutations.some((mutation) => {
          const element = mutation.target.nodeType === Node.ELEMENT_NODE ? mutation.target : mutation.target.parentElement;
          if (element?.closest('[data-marquee-clone]')) return false;
          if (element?.closest('[data-countdown-value], [data-countdown-announcement], [data-coupon-status]')) return false;
          if (mutation.type === 'attributes') {
            if (mutation.target === track) return false;
            if (mutation.attributeName.startsWith('data-shopify-editor')) return false;
          }
          return true;
        })) scheduleSync();
      });
      const resizeObserver = new ResizeObserver(() => {
        if (layoutSignature() !== measuredLayout) scheduleSync();
      });

      // Inspector overlays can receive the pointer instead of a marquee child.
      // Capture its coordinates in the preview document, then test this instance.
      const updateInspectorHover = () => {
        if (!inspectorActive || !pointerPosition) {
          marquee.classList.remove('elara-marquee--inspector-hover');
          return;
        }
        const bounds = marquee.getBoundingClientRect();
        const { x, y } = pointerPosition;
        marquee.classList.toggle('elara-marquee--inspector-hover',
          x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom);
      };
      const handlePointerMove = (event) => {
        if (event.pointerType === 'touch') return;
        pointerPosition = { x: event.clientX, y: event.clientY };
        if (!inspectorActive || pointerFrame) return;
        pointerFrame = requestAnimationFrame(() => {
          pointerFrame = 0;
          if (!destroyed) updateInspectorHover();
        });
      };
      const clearPointer = () => {
        pointerPosition = null;
        marquee.classList.remove('elara-marquee--inspector-hover');
      };
      const handlePointerOut = (event) => {
        if (!event.relatedTarget) clearPointer();
      };
      const activateInspector = () => {
        inspectorActive = true;
        updateInspectorHover();
      };
      const deactivateInspector = () => {
        inspectorActive = false;
        updateInspectorHover();
      };
      const editorMode = Boolean(window.Shopify?.designMode);
      if (editorMode) {
        // Inspector selection/focus must not hold motion after the pointer leaves.
        marquee.classList.add('elara-marquee--editor');
        document.addEventListener('pointermove', handlePointerMove, true);
        document.addEventListener('pointerout', handlePointerOut, true);
        document.addEventListener('shopify:inspector:activate', activateInspector);
        document.addEventListener('shopify:inspector:deactivate', deactivateInspector);
        window.addEventListener('blur', clearPointer);
        window.addEventListener('resize', updateInspectorHover);
      }

      const isPaused = () => marquee.matches(':hover') ||
        (!editorMode && marquee.matches(':focus-within')) || marquee.classList.contains('elara-marquee--inspector-hover');
      const smoothParallax = (timestamp) => {
        scrollFrame = 0;
        if (destroyed) return;
        if (editorMode) updateInspectorHover();
        const bounds = viewport.getBoundingClientRect();
        if (isPaused() || bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
          parallaxPixels = 0;
          lastParallaxFrame = 0;
          return;
        }
        const elapsed = lastParallaxFrame ? Math.min(32, timestamp - lastParallaxFrame) : 16;
        lastParallaxFrame = timestamp;
        // Drain scroll displacement over frames instead of jumping on every wheel event.
        const pixels = parallaxPixels * (1 - Math.exp(-elapsed / 100));
        parallaxPixels -= pixels;
        const distance = parseFloat(track.style.getPropertyValue('--marquee-loop-distance'));
        if (distance) track.getAnimations().forEach((animation) => {
          if (!['marquee-scroll-left', 'marquee-scroll-right'].includes(animation.animationName)) return;
          const duration = Number(animation.effect?.getComputedTiming().duration);
          if (!duration || animation.currentTime === null) return;
          const time = Number(animation.currentTime) + pixels / distance * duration;
          animation.currentTime = ((time % duration) + duration) % duration;
        });
        if (Math.abs(parallaxPixels) > 0.05) scrollFrame = requestAnimationFrame(smoothParallax);
        else { parallaxPixels = 0; lastParallaxFrame = 0; }
      };
      const handleScroll = () => {
        const delta = Math.max(-100, Math.min(100, window.scrollY - lastScrollY));
        lastScrollY = window.scrollY;
        if (destroyed || isPaused()) return;
        parallaxPixels = Math.max(-200, Math.min(200, parallaxPixels + delta * (delta < 0 ? 0.7 : 0.35)));
        if (!scrollFrame) scrollFrame = requestAnimationFrame(smoothParallax);
      };
      // Reuse the scrolling-text phase shift wherever the marquee block is placed.
      const scrollReactive = marquee.dataset.marqueeParallax !== 'false';
      if (scrollReactive) window.addEventListener('scroll', handleScroll, { passive: true });

      instances.set(marquee, {
        destroy: () => {
          destroyed = true;
          cancelAnimationFrame(frame);
          cancelAnimationFrame(scrollFrame);
          cancelAnimationFrame(pointerFrame);
          clearPointer();
          if (editorMode) {
            marquee.classList.remove('elara-marquee--editor');
            document.removeEventListener('pointermove', handlePointerMove, true);
            document.removeEventListener('pointerout', handlePointerOut, true);
            document.removeEventListener('shopify:inspector:activate', activateInspector);
            document.removeEventListener('shopify:inspector:deactivate', deactivateInspector);
            window.removeEventListener('blur', clearPointer);
            window.removeEventListener('resize', updateInspectorHover);
          }
          if (scrollReactive) window.removeEventListener('scroll', handleScroll);
          resizeObserver.disconnect();
          mutationObserver.disconnect();
        }
      });
      document.fonts?.ready.then(() => {
        if (!destroyed && layoutSignature() !== measuredLayout) scheduleSync();
      });
      syncClones();
    };

    const destroy = (marquee) => {
      const state = instances.get(marquee);
      if (!state) return;
      state.destroy();
      marquee.querySelectorAll('[data-marquee-clone]').forEach((clone) => clone.remove());
      const track = marquee.querySelector('.elara-marquee__track');
      track?.style.removeProperty('--marquee-loop-distance');
      track?.style.removeProperty('--marquee-duration');
      marquee.classList.remove('elara-marquee--ready', 'elara-marquee--measuring');
      instances.delete(marquee);
    };

    const initializeRoot = (root = document) => {
      if (root.matches?.(selector)) initialize(root);
      root.querySelectorAll?.(selector).forEach(initialize);
    };

    const destroyRoot = (root) => {
      if (root.matches?.(selector)) destroy(root);
      root.querySelectorAll?.(selector).forEach(destroy);
    };

    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) destroyRoot(document);
      else initializeRoot();
    });

    document.addEventListener('shopify:section:load', (event) => initializeRoot(event.target));
    document.addEventListener('shopify:section:unload', (event) => destroyRoot(event.target));

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initializeRoot(), { once: true });
    } else {
      initializeRoot();
    }
  })();
