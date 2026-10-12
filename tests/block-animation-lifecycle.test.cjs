const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture({delay = 150, type = 'slide-bottom', preserveOpacity = false} = {}) {
  let changed;
  let motionChanged;
  const classes = new Set();
  const played = [];
  const slideClasses = new Set(['swiper-slide-active']);
  const slide = { classList: { contains: c => slideClasses.has(c) }, matches: s => s.includes('.slideshow__swiper .swiper-slide'), contains: e => e === block,
    isConnected: true, getClientRects: () => [{}], closest: s => s === '.slideshow__swiper .swiper-slide' ? slide : null };
  const viewport = { getBoundingClientRect: () => ({ top: 100, bottom: 920, left: 0, right: 1920 }) };
  const block = {
    dataset: { blockAnimation: type, animationDelay: String(delay), animationPreserveOpacity: String(preserveOpacity) }, isConnected: true,
    parentElement: { closest: () => null }, querySelectorAll: () => [],
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    closest: s => s === '.slideshow' ? viewport : s === '.slideshow__swiper .swiper-slide' ? slide : null,
    getClientRects: () => [{}], getBoundingClientRect: () => ({ top: 700, bottom: 750, left: 0, right: 300 }),
    animate: (frames, options) => { const animation = { finished: new Promise(() => {}), cancel: () => { animation.cancelled = true; } }; played.push({ frames, options, animation }); return animation; },
  };
  const document = {
    body: { dataset: {} }, addEventListener() {},
    querySelectorAll: s => s === '[data-block-animation], [data-component-reveal]' ? [block] : [],
  };
  const context = {
    window: {}, document, innerWidth: 1920, innerHeight: 450,
    matchMedia: () => ({ matches: false, addEventListener(event, callback) { motionChanged = callback; } }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    IntersectionObserver: class { observe() {} unobserve() {} },
    MutationObserver: class { constructor(fn) { changed = fn; } observe() {} },
  };
  vm.runInNewContext(fs.readFileSync('assets/block-animations.js', 'utf8'), context);
  return { block, slide, played, classes, slideClasses, changed: records => changed(records), motionChanged: () => motionChanged() };
}

test('changing reduced-motion preference cancels entrances and leaves content visible', () => {
  const h = fixture();
  h.classes.add('reveal-pending');
  h.motionChanged();
  assert.equal(h.played[0].animation.cancelled, true);
  assert.equal(h.classes.has('reveal-pending'), false);
  assert.equal(h.played.length, 1);
});

test('all active slideshow contents reveal even below the editor viewport', () => {
  const h = fixture();
  assert.equal(h.played.length, 1);
  assert.equal(h.classes.has('reveal-pending'), false);
  assert.equal(h.played[0].frames[0].transform, 'translateY(32px)');
});

test('zero and 75ms delays remain distinct instead of collapsing to 150ms', () => {
  assert.equal(fixture({delay:0}).played[0].options.delay, 0);
  assert.equal(fixture({delay:75}).played[0].options.delay, 75);
});

test('hero media stays opaque while moving and fade never writes a slide transform', () => {
  const hero = fixture({delay:0,type:'slide-left',preserveOpacity:true});
  assert.equal(hero.played[0].frames[0].opacity, 1);
  assert.equal(hero.played[0].frames[0].transform, 'translateX(-32px)');
  const fade = fixture({type:'fade'});
  assert.ok(fade.played[0].frames.every(frame => frame.transform === undefined));
});

test('changing an existing block animation cancels and replays without toggling section visibility', () => {
  const h = fixture();
  h.block.dataset.blockAnimation = 'fade';
  h.changed([{ type: 'attributes', attributeName: 'data-block-animation', target: h.block }]);
  assert.equal(h.played[0].animation.cancelled, true);
  assert.equal(h.played.length, 2);
  assert.equal(h.played[1].frames[0].transform, undefined);
  h.block.dataset.animationDelay = '450';
  h.changed([{ type: 'attributes', attributeName: 'data-animation-delay', target: h.block }]);
  assert.equal(h.played.length, 3);
  assert.equal(h.played[2].options.delay, 450);
  h.block.dataset.blockAnimation = 'none';
  h.changed([{ type: 'attributes', attributeName: 'data-block-animation', target: h.block }]);
  assert.equal(h.played[2].animation.cancelled, true);
  assert.equal(h.classes.has('reveal-pending'), false);
});

test('deactivation resets contents and the next activation replays them', () => {
  const h = fixture();
  h.slideClasses.clear();
  h.changed([{ type: 'attributes', attributeName: 'class', target: h.slide }]);
  assert.equal(h.classes.has('reveal-pending'), true);
  assert.equal(h.played[0].animation.cancelled, true);
  h.slideClasses.add('swiper-slide-active');
  h.changed([{ type: 'attributes', attributeName: 'class', target: h.slide }]);
  assert.equal(h.played.length, 2);
  assert.equal(h.classes.has('reveal-pending'), false);
});
