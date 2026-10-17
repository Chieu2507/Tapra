if (!customElements.get('scrolling-story')) {
  class ScrollingStory extends HTMLElement {
    connectedCallback() {
      if (this.abort) return;
      this.steps = Array.from(this.querySelectorAll('[data-story-step]'));
      if (!this.steps.length) return;
      this.copies = this.steps.map(step => step.querySelector('[data-story-copy]'));
      this.media = this.steps.map(step => step.querySelector('[data-story-media]'));
      this.current = 0;
      this.target = 0;
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.abort = new AbortController();
      const options = {signal: this.abort.signal};
      this.style.setProperty('--story-count', this.steps.length);
      this.steps.forEach((step, i) => step.style.setProperty('--story-row', i + 1));
      if (this.dataset.pagination === 'true') {
        this.indicators = document.createElement('div');
        this.indicators.className = 'scrolling-story__indicators';
        this.buttons = this.steps.map((step, i) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'scrolling-story__indicator';
          button.setAttribute('aria-label', step.querySelector('h2,h3,h4')?.textContent.trim() || String(i + 1));
          button.addEventListener('click', () => {
            this.copies[i].scrollIntoView({block: 'center', behavior: this.reduced.matches ? 'instant' : 'smooth'});
          }, options);
          this.indicators.append(button);
          return button;
        });
        this.append(this.indicators);
      }
      this.show(0);
      this.setAttribute('data-ready', '');
      this.request = () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
          this.frame = null;
          const bounds = this.getBoundingClientRect();
          if (bounds.bottom < 0 || bounds.top > innerHeight) return;
          const mobile = innerWidth < 768;
          const threshold = innerHeight * (mobile ? .78 : .55);
          let index = 0;
          this.copies.forEach((copy, i) => {
            const rect = copy.getBoundingClientRect();
            // The mobile copy includes space for the sticky media above it.
            const padding = mobile ? parseFloat(getComputedStyle(copy).paddingTop) : 0;
            if (rect.top + padding <= threshold) index = i;
          });
          this.go(index);
        });
      };
      addEventListener('scroll', this.request, {...options, passive: true});
      addEventListener('resize', this.request, options);
      this.addEventListener('shopify:block:select', event => {
        const step = event.target.closest('[data-story-step]');
        const i = this.steps.indexOf(step);
        if (i >= 0) {
          this.cancelMotion();
          this.show(i);
          this.target = i;
          this.copies[i].scrollIntoView({block: 'center', behavior: 'instant'});
        }
      }, options);
      this.reduced.addEventListener('change', () => {
        this.cancelMotion();
        this.show(this.target);
      }, options);
      this.request();
    }
    show(index) {
      this.current = index;
      this.media.forEach((media, i) => {
        const active = i === index;
        media.toggleAttribute('data-active', active);
        media.inert = !active;
        if (active) media.removeAttribute('aria-hidden');
        else media.setAttribute('aria-hidden', 'true');
      });
      this.buttons?.forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
    }
    go(index) {
      this.target = index;
      if (this.current === index || this.animation) return;
      if (this.reduced.matches || this.dataset.animate !== 'true' || !this.media[0].animate || this.contains(document.activeElement)) {
        // Preserve focus when a merchant or keyboard user is inside a media slot.
        if (!this.media[this.current].contains(document.activeElement)) this.show(index);
        return;
      }
      const outgoing = this.media[this.current];
      this.animation = outgoing.animate([
        {transform: 'perspective(1200px) rotateY(0) rotateZ(0)'},
        {transform: 'perspective(1200px) rotateY(90deg) rotateZ(-3deg)'}
      ], {duration: 240, easing: 'ease-in', fill: 'forwards'});
      this.animation.onfinish = () => {
        const old = this.animation;
        this.show(this.target);
        old.cancel();
        this.animation = this.media[this.current].animate([
          {transform: 'perspective(1200px) rotateY(-90deg) rotateZ(3deg)'},
          {transform: 'perspective(1200px) rotateY(0) rotateZ(0)'}
        ], {duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)'});
        this.animation.onfinish = () => {
          this.animation = null;
          this.go(this.target);
        };
      };
    }
    cancelMotion() {
      if (this.animation) {
        this.animation.onfinish = null;
        this.animation.cancel();
        this.animation = null;
      }
    }
    disconnectedCallback() {
      this.abort?.abort();
      this.abort = null;
      cancelAnimationFrame(this.frame);
      this.frame = null;
      this.cancelMotion();
      this.indicators?.remove();
      this.buttons = null;
      this.removeAttribute('data-ready');
      this.media?.forEach(media => {
        media.inert = false;
        media.removeAttribute('aria-hidden');
      });
    }
  }
  customElements.define('scrolling-story', ScrollingStory);
}
