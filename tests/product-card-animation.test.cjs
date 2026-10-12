const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture({ hidden = false, columns = 4, reduced = false, promoIndex = -1, imageCards = false, blogCards = false, introDelay = null, merchantDelay = 0 } = {}) {
  let changed;
  const events = {};
  const cards = [];
  const selectCards = selector => cards.filter(card => (!imageCards || selector.includes("article.image-card") || selector.includes("[data-block-animation]")) && (!card.promo || selector.includes(".promo-card") || (selector.includes("[data-component-reveal]") && "componentReveal" in card.dataset)));
  const panel = {
    hidden,
    isConnected: true,
    getClientRects: () => panel.hidden ? [] : [{}],
    closest: selector => selector.includes('[hidden]') && panel.hidden ? panel : null,
    matches: selector => selector.includes('[role="tabpanel"]'),
    contains: element => cards.includes(element),
    querySelectorAll: selector => selector.startsWith('.collection-list-view-all') ? [] : selectCards(selector),
  };
  const list = { querySelectorAll: selectCards };
  const heading = {dataset:{blockAnimation:'slide-bottom',animationDelay:String(introDelay)},isConnected:true,
    closest:()=>null,getClientRects:()=>[{}],compareDocumentPosition:()=>4};
  const section = {querySelectorAll:()=>[heading,...cards]};
  for (let index = 0; index < 4; index++) {
    const top = () => panel.hidden ? 0 : 100 + Math.floor(index / columns) * 300;
    const item = { getBoundingClientRect: () => ({ top: top() }) };
    const played = [];
    const card = {
      dataset: {animationDelay:String(merchantDelay)}, played, isConnected: true, promo: index === promoIndex,
      parentElement: { closest: () => null },
      classList: { add() {}, remove() {} },
      matches: selector => selector.includes(imageCards ? 'article.image-card' : index === promoIndex ? '.promo-card' : '.product-card'),
      closest(selector) {
        if (blogCards && selector.includes('.blog-card')) return card;
        if (selector === '.shopify-section') return introDelay === null ? null : section;
        if (blogCards && selector === '.blog-list__item, .swiper-slide') return item;
        if (blogCards && selector.includes('[data-blog-list]')) return list;
        if (blogCards && selector.includes('.product-collection-grid')) return null;
        if (selector === '.product-collection-grid__item') return item;
        if (selector.includes('.product-collection-grid')) return list;
        if (selector.includes('[hidden]') && panel.hidden) return panel;
        return null;
      },
      querySelectorAll: () => [],
      getClientRects: () => panel.hidden ? [] : [{}],
      // Simulate cards at different points in an existing translateY animation.
      getBoundingClientRect: () => ({ top: top() + index * 10, bottom: top() + 200, left: 0, right: 200 }),
      animate(frames, options) {
        played.push({ frames, options });
        return { finished: new Promise(() => {}), cancel() {} };
      },
    };
    cards.push(card);
  }
  vm.runInNewContext(fs.readFileSync('assets/block-animations.js', 'utf8'), {
    window: {}, innerWidth: 1920, innerHeight: 2000,
    document: { body: { dataset: {} }, querySelectorAll: selector => selector.startsWith('.collection-list-view-all') ? [] : selectCards(selector),
      addEventListener: (name, fn) => { events[name] = fn; } },
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    IntersectionObserver: class { observe() {} unobserve() {} },
    MutationObserver: class { constructor(fn) { changed = fn; } observe() {} },
  });
  return { cards, panel, events, activate() { panel.hidden = false; changed([{ type: 'attributes', attributeName: 'hidden', target: panel }]); } };
}

test('product grids stagger cards using stable layout positions', () => {
  const h = fixture();
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [150, 225, 300, 375]);
  assert.ok(h.cards.every(card => card.played[0].frames[0].transform === 'translateY(32px)'));
});

test('blog rows use stable item wrappers, follow the header and retain merchant delay', () => {
  const h = fixture({blogCards:true,introDelay:100,merchantDelay:50});
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [300,375,450,525]);
});

test('stacked mobile blog cards restart stagger for each new row', () => {
  const h = fixture({blogCards:true,columns:1});
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [150,150,150,150]);
});

test('opening a hidden mobile tab recalculates stagger per two-column row', () => {
  const h = fixture({ hidden: true, columns: 2 });
  assert.ok(h.cards.every(card => card.played.length === 0));
  h.activate();
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [150, 225, 150, 225]);
  h.events['shopify:section:load']({ target: h.panel });
  assert.ok(h.cards.every(card => card.played.length === 1));
});

test('product grid stagger respects reduced motion', () => {
  const h = fixture({ reduced: true });
  assert.ok(h.cards.every(card => card.played.length === 0));
});

test('promo cards share product entrance and row stagger', () => {
  const h = fixture({ promoIndex: 1 });
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [150,225,300,375]);
  assert.equal(h.cards[1].dataset.blockAnimation, 'slide-bottom');
  assert.deepEqual(h.cards[1].played[0].frames, h.cards[0].played[0].frames);
  assert.equal(h.cards[1].played[0].options.duration, h.cards[0].played[0].options.duration);
});
test('promo animation follows hidden tab activation and reduced motion', () => {
  const h = fixture({ hidden:true, columns:2, promoIndex:1 });
  assert.equal(h.cards[1].played.length,0);h.activate();
  assert.equal(h.cards[1].played[0].options.delay,225);
  const reduced = fixture({ reduced:true, promoIndex:1 });
  assert.equal(reduced.cards[1].played.length,0);
});

test('image cards animate the complete article with the same row stagger', () => {
  const h = fixture({ imageCards: true });
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [150, 225, 300, 375]);
  assert.ok(h.cards.every(card => card.dataset.blockAnimation === 'slide-bottom'));
  const reduced = fixture({ imageCards: true, reduced: true });
  assert.ok(reduced.cards.every(card => card.played.length === 0));
});
