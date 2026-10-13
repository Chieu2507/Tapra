const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture(height = 800) {
  const events = new Map();
  const surface = { style: {} }, wordmark = { style: {}, parentElement: { offsetHeight: 300 } };
  const root = { dataset: { scrollEffect: 'true' }, top: 1000, querySelector: s => s === '.tapra-footer' ? surface : wordmark, contains: value => value === 'focused', getBoundingClientRect: () => ({ top: root.top, height }), addEventListener() {}, removeEventListener() {} };
  const document = { activeElement: null, querySelectorAll: () => [root], addEventListener: (name, callback) => events.set(name, callback) };
  const motion = { matches: false, addEventListener: (name, callback) => events.set('motion', callback), removeEventListener() {} };
  const queue = [];
  let disconnected = false;
  const window = { innerHeight: 1000, addEventListener: (name, callback) => events.set(name, callback), removeEventListener: name => events.delete(name) };
  const context = { window, document, matchMedia: () => motion, ResizeObserver: class { observe() {} disconnect() { disconnected = true; } }, requestAnimationFrame: callback => { queue.push(callback); return queue.length; }, cancelAnimationFrame() {} };
  vm.runInNewContext(fs.readFileSync('assets/tapra-footer.js', 'utf8'), context);
  const flush = () => { while (queue.length) queue.shift()(); };
  flush();
  return { root, surface, wordmark, window, document, motion, events, flush, disconnected: () => disconnected };
}
test('scroll reveal progresses and finishes even when the footer is taller than the viewport', () => {
  for (const height of [800, 1500]) {
    const f = fixture(height);
    assert.equal(f.wordmark.style.opacity, '0.35');
    f.root.top = 500; f.events.get('scroll')(); f.flush();
    assert(Number(f.wordmark.style.opacity) > .35 && Number(f.wordmark.style.opacity) < 1);
    f.root.top = 0; f.events.get('scroll')(); f.flush();
    assert.equal(f.wordmark.style.opacity, '1.00');
    assert.equal(f.surface.style.transform, 'translate3d(0, 0px, 0)');
  }
});
test('reduced motion, disabled effects and keyboard focus reset transforms', () => {
  const f = fixture();
  for (const enable of [() => { f.motion.matches = true; }, () => { f.root.dataset.scrollEffect = 'false'; }, () => { f.document.activeElement = 'focused'; }]) {
    f.motion.matches = false; f.window.Shopify = {}; f.root.dataset.scrollEffect = 'true'; f.document.activeElement = null;
    enable(); f.events.get('scroll')(); f.flush();
    assert.equal(f.surface.style.transform, ''); assert.equal(f.wordmark.style.opacity, '');
  }
});
test('section unload removes listeners and reload initializes a fresh instance once', () => {
  const f = fixture();
  const target = { contains: value => value === f.root, querySelectorAll: () => [f.root] };
  f.events.get('shopify:section:unload')({ target });
  assert.equal(f.disconnected(), true); assert.equal(f.events.has('scroll'), false);
  assert.equal(f.surface.style.transform, '');
  f.events.get('shopify:section:load')({ target }); f.flush();
  assert.equal(f.events.has('scroll'), true); assert.equal(f.wordmark.style.opacity, '0.35');
  const listener = f.events.get('scroll');
  f.window.TapraFooter.init(target);
  assert.equal(f.events.get('scroll'), listener);
});

test('editor preview animates, pauses for block selection and resumes on deselection', () => {
 const f=fixture();f.window.Shopify={designMode:true};f.events.get('scroll')();f.flush();assert.equal(f.wordmark.style.opacity,'0.35');
 f.events.get('shopify:block:select')({target:'focused'});f.flush();assert.equal(f.surface.style.transform,'');
 f.events.get('shopify:block:deselect')({target:'focused'});f.flush();assert.equal(f.wordmark.style.opacity,'0.35');
});
