import {getSwiperCarousel} from './swiper-runtime-12.2.0.js';

if (!customElements.get('editorial-testimonials')) {
  class EditorialTestimonials extends HTMLElement {
    connectedCallback() {
      if (this.abort) return;
      this.viewport = this.querySelector('[data-swiper-carousel]');
      this.wrapper = this.viewport?.querySelector('.swiper-wrapper');
      if (!this.wrapper) return;
      this.abort = new AbortController();
      const options = {signal: this.abort.signal};
      this.previous = this.querySelector('[data-carousel-fraction-previous]');
      this.next = this.querySelector('[data-carousel-fraction-next]');
      this.controls = [this.previous, this.next].filter(Boolean).map(node => ({node,parent:node.parentNode,next:node.nextSibling}));
      this.mobile = matchMedia('(max-width:1149px)');
      this.style.setProperty('--editorial-preview-gap', `${Number(this.dataset.previewGap) || 32}px`);
      this.sides = ['previous', 'next'].map(direction => {
        const side = document.createElement('div');
        side.className = `testimonial-editorial__side testimonial-editorial__side--${direction}`;
        side.hidden = true;
        const preview = document.createElement('button');
        preview.type = 'button';
        preview.className = `testimonial-editorial__preview testimonial-editorial__preview--${direction}`;
        preview.addEventListener('click', () => (direction === 'previous' ? this.previous : this.next)?.click(), options);
        side.append(preview);
        this.append(side);
        return side;
      });
      this.sync = () => {
        const swiper = getSwiperCarousel(this.viewport);
        if (!swiper || swiper.destroyed) return;
        if (this.swiper !== swiper) {
          this.unbind();
          this.swiper = swiper;
          this.loopPreventsSliding = swiper.params.loopPreventsSliding;
          // Fade can miss its virtual transition end when the responsive layout changes.
          // Keep native controls responsive, including rapid inputs, for this presentation.
          swiper.params.loopPreventsSliding = false;
          this.swiper.on('slideChange update slidesUpdated', this.requestSync);
        }
        const slides = Array.from(this.wrapper.children).filter(slide => slide.matches('[data-testimonial-editorial-review]') && !slide.matches('[data-carousel-loop-clone],.swiper-slide-clone,.swiper-slide-duplicate'));
        if (swiper.params.loop) slides.sort((a,b) => Number(a.dataset.swiperSlideIndex) - Number(b.dataset.swiperSlideIndex));
        const active = swiper.params.loop ? swiper.realIndex : swiper.activeIndex;
        const layout = this.dataset.adjacentPreviews === 'true' && slides.length > 1 && !this.mobile.matches;
        this.setAttribute('data-editorial-layout', String(layout));
        if (layout) {
          if (this.previous) this.sides[0].prepend(this.previous);
          if (this.next) this.sides[1].append(this.next);
        } else this.restoreControls();
        this.sides.forEach((side,index) => {
          side.hidden = !layout;
          if (!layout) return;
          let target = active + (index === 0 ? -1 : 1);
          if (swiper.params.loop) target = ((target % slides.length) + slides.length) % slides.length;
          this.renderPreview(side.querySelector('button.testimonial-editorial__preview'), slides[target], index);
        });
      };
      this.requestSync = () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
          this.frame = null;
          this.sync();
        });
      };
      this.mobile.addEventListener('change', this.requestSync, options);
      this.observer = new MutationObserver(this.requestSync);
      this.observer.observe(this.viewport, {attributes:true,attributeFilter:['data-swiper-ready']});
      this.observer.observe(this.wrapper, {childList:true,subtree:true,characterData:true});
      this.requestSync();
    }
    renderPreview(button, slide, index) {
      button.hidden = !slide;
      if (!slide) return;
      const author = slide.querySelector('[data-testimonial-author]');
      const name = author?.querySelector('.heading-block')?.textContent.trim() || '';
      const authorDetail = author?.querySelector('.text-block')?.textContent.trim() || '';
      const detail = authorDetail.split('·').pop().trim();
      const source = slide.querySelector('[data-testimonial-photo] img');
      const label = (index === 0 ? this.previous : this.next)?.getAttribute('aria-label') || '';
      button.setAttribute('aria-label', name ? `${label}: ${name}` : label);
      // Recreate only decorative previews; authored blocks and editor IDs remain untouched.
      const children = [];
      if (source) {
        const image = document.createElement('img');
        image.src = source.currentSrc || source.src;
        image.alt = '';
        image.className = index === 0 ? 'testimonial-editorial__avatar' : 'testimonial-editorial__cover';
        children.push(image);
      }
      for (const [text, className] of [[name,'testimonial-editorial__name'],[detail,'testimonial-editorial__detail']]) {
        if (!text) continue;
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        children.push(span);
      }
      if (index === 0 && slide.dataset.previewText) {
        const summary = document.createElement('span');
        summary.className = 'testimonial-editorial__summary';
        summary.textContent = slide.dataset.previewText;
        children.push(summary);
      }
      button.replaceChildren(...children);
    }
    restoreControls() {
      this.controls?.forEach(({node,parent,next}) => {
        if (node.parentNode === parent) return;
        parent.insertBefore(node, next?.parentNode === parent ? next : null);
      });
    }
    unbind() {
      if (this.swiper && !this.swiper.destroyed) {
        this.swiper.off('slideChange update slidesUpdated', this.requestSync);
        if (this.swiper.params) this.swiper.params.loopPreventsSliding = this.loopPreventsSliding;
      }
      this.swiper = null;
    }
    disconnectedCallback() {
      this.abort?.abort();
      this.abort = null;
      this.observer?.disconnect();
      cancelAnimationFrame(this.frame);
      this.frame = null;
      this.unbind();
      this.restoreControls();
      this.sides?.forEach(side => side.remove());
      this.removeAttribute('data-editorial-layout');
    }
  }
  customElements.define('editorial-testimonials', EditorialTestimonials);
}
