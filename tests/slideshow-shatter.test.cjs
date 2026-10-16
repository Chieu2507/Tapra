const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const source = fs.readFileSync('assets/slideshow-shatter.js', 'utf8');
const context = { document: { hidden: false }, Math, Map, Set, Promise, AbortController, performance: { now: () => 1000 }, clearTimeout, setTimeout, cancelAnimationFrame() {}, requestAnimationFrame() { return 1; }, customElements: { get() { return false; } } };
vm.runInNewContext(source.slice(0, source.indexOf("  customElements.define('slideshow-shatter'")) + '\n globalThis.Shatter = Shatter; })();', context);
const Subject = context.Shatter;
const classes = () => ({ toggle() {}, remove() {} });
function fixture() {
 const controller = Object.create(Subject.prototype);
 Object.assign(controller, { abort: new AbortController(), motion: { matches: false }, visible: true, art: { id: 'old' }, slides: [0, 1, 2].map(i => ({ hidden: false, inert: false, querySelectorAll: () => [], getBoundingClientRect: () => ({}), querySelector: () => ({ textContent: `Story ${i}` }) })), buttons: [0, 1, 2].map(() => ({ setAttribute() {} })), pauses: new Set(), root: { classList: classes(), querySelector: () => ({}), querySelectorAll: () => [] }, pieces: [], cursor: { querySelector: () => ({ dataset: {} }) }, timeouts: new Set(), index: 0, width: 1280, height: 720, prepare: async i => ({ id: i }), clearText() {}, resize() {}, burst() {}, textExit() {} });
 return controller;
}
test('assembly geometry has 81 pieces with exactly 57 initially home, bounded to the viewport', () => {
 const c = fixture(); c.build();
 assert.equal(c.pieces.length, 81); assert.equal(c.pieces.filter(p => p.base).length, 57);
 for (const p of c.pieces) { assert(p.sx >= 24 && p.sx <= 1256); assert(p.sy >= 24 && p.sy <= 696); }
});
test('manual pagination wraps and waits for a decoded target before leaving the current slide', async () => {
 const c = fixture(); let resolve;
 c.prepare = () => new Promise(r => { resolve = r; });
 const change = c.go(4, true);
 assert.equal(c.index, 0); assert.equal(c.transition, undefined);
 resolve({ id: 'ready' }); await change;
 assert.equal(c.transition.index, 1); assert.equal(c.transition.art.id, 'ready');
});
test('a newer editor selection wins over a slow earlier image decode', async () => {
 const c = fixture(); const ready = new Map(); c.prepare = i => new Promise(r => ready.set(i, r));
 const old = c.go(1, false, true); const latest = c.go(2, false, true);
 ready.get(2)({ id: 2 }); await latest; ready.get(1)({ id: 1 }); await old;
 assert.equal(c.index, 2); assert.equal(c.art.id, 2);
});
test('reduced motion changes slides immediately without starting the simulation transition', async () => {
 const c = fixture(); c.motion.matches = true; await c.go(1, true);
 assert.equal(c.index, 1); assert.equal(c.transition, null); assert.equal(c.slides[0].inert, true); assert.equal(c.slides[1].hidden, false);
});
test('failed image decode switches to the real server fallback rather than breaking the carousel', async () => {
 const c = fixture(); c.prepare = async () => null; await c.go(2, true);
 assert.equal(c.index, 2); assert.equal(c.art, null); assert.equal(c.transition, null);
});
test('hold pauses transition entry and release suppresses the synthesized burst', async () => {
 const c = fixture(); c.setHold(true); assert.equal(c.holding, true);
 await c.go(1); assert.equal(c.index, 0); assert.equal(c.transition, undefined);
 c.release(); assert.equal(c.holding, false); assert(c.suppressUntil > 1000);
});
test('hide or unload cannot leave an invisible outgoing heading and unresolved slide transition', () => {
 const c = fixture(); c.transition = { index: 2, art: { id: 2 } }; c.visible = false;
 c.synchronize(); assert.equal(c.index, 2); assert.equal(c.transition, null); assert.equal(c.raf, 0);
});
test('destroy cancels future image work and releases owned resources', () => {
 const c = fixture(); let disconnected = 0;
 c.observer = c.intersection = { disconnect() { disconnected++; } }; c.pagination = { replaceChildren() {} };
 c.destroy(); assert(c.abort.signal.aborted); assert.equal(disconnected, 2); assert.equal(c.timeouts.size, 0);
});
const schema = file => JSON.parse(fs.readFileSync(file, 'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]);
test('all section preset and homepage settings satisfy their own schema bounds and block types', () => {
 const section = schema('sections/slideshow-shatter.liquid');
 const block = schema('blocks/_slideshow-shatter-slide.liquid');
 const verify = (settings, definition) => {
  const fields = Object.fromEntries(definition.settings.filter(f => f.id).map(f => [f.id, f]));
  for (const [key, value] of Object.entries(settings || {})) { const f = fields[key]; assert(f, key); if (f.options) assert(f.options.some(o => o.value === value), key); if (f.type === 'range') assert(value >= f.min && value <= f.max && (value - f.min) % f.step === 0, key); }
 };
 for (const preset of section.presets) for (const b of preset.blocks) { assert.equal(b.type, section.blocks[0].type); verify(b.settings, block); for (const child of Object.values(b.blocks || {})) { assert.equal(child.type, '_slideshow-shatter-content'); assert.equal(child.static, true); verify(child.settings, schema('blocks/_slideshow-shatter-content.liquid')); for (const leaf of Object.values(child.blocks || {})) verify(leaf.settings, schema('blocks/' + leaf.type + '.liquid')); } }
 const raw = fs.readFileSync('templates/index.json', 'utf8'); const page = JSON.parse(raw.slice(raw.indexOf('{')));
 if (page.sections.shatter) { verify(page.sections.shatter.settings, section); for (const b of Object.values(page.sections.shatter.blocks)) { verify(b.settings, block); for (const child of Object.values(b.blocks || {})) { assert.equal(child.type, '_slideshow-shatter-content'); assert.equal(child.static, true); verify(child.settings, schema('blocks/_slideshow-shatter-content.liquid')); for (const leaf of Object.values(child.blocks || {})) verify(leaf.settings, schema('blocks/' + leaf.type + '.liquid')); } } }
});
test('Content composes native Heading and owns responsive placement while Slide owns padding', async () => {
 const engine = new (loadLiquid())({ fs: { resolve: (_r, f) => path.resolve('snippets', f + '.liquid'), exists: async () => true, readFile: async f => stripShopifyMetadata(fs.readFileSync(f, 'utf8')) } });
 engine.registerFilter('placeholder_svg_tag', () => '<svg></svg>');
 const defaults = file => Object.fromEntries(schema(file).settings.filter(f => 'default' in f).map(f => [f.id, f.default]));
 const heading = await engine.parseAndRender(stripShopifyMetadata(fs.readFileSync('blocks/heading.liquid', 'utf8')), { block: { shopify_attributes: 'data-editor="heading"', settings: { ...defaults('blocks/heading.liquid'), html_tag: 'h2', heading_size: 'xl', text: '<p>Native heading</p>' } } });
 const content = stripShopifyMetadata(fs.readFileSync('blocks/_slideshow-shatter-content.liquid', 'utf8')).replace(/{% content_for 'blocks' %}/g, '{{ children }}');
 const render = settings => engine.parseAndRender(content, { children: heading, block: { shopify_attributes: 'data-editor="content"', settings: { ...defaults('blocks/_slideshow-shatter-content.liquid'), ...settings } } });
 const html = await render({ position: 'center_right', customize_mobile_position: true, position_mobile: 'bottom_center', gap_mobile: 0 });
 assert.match(html, /<h2[^>]*heading-xl/); assert.match(html, /Native heading/); assert.match(html, /data-editor="heading"/); assert.match(html, /data-editor="content"/);
 assert.match(html, /--shatter-content-x:end/); assert.match(html, /--shatter-content-y:center/); assert.match(html, /--shatter-content-x-mobile:center/); assert.match(html, /--shatter-content-y-mobile:end/); assert.match(html, /--shatter-content-gap-mobile:0px/);
 const inherited = await render({ position: 'center_right', customize_mobile_position: false, position_mobile: 'bottom_left' });
 assert.match(inherited, /--shatter-content-x-mobile:end/); assert.match(inherited, /--shatter-content-y-mobile:center/);
 const slide = stripShopifyMetadata(fs.readFileSync('blocks/_slideshow-shatter-slide.liquid', 'utf8')).replace(/{% content_for 'block', type: '_slideshow-shatter-content', id: 'content-[12]' %}/g, '');
 const slideHtml = await engine.parseAndRender(slide, { block: { id: 'one', settings: { ...defaults('blocks/_slideshow-shatter-slide.liquid'), content_padding_top_mobile: 0 } }, section: { blocks: [{ id: 'one' }] } });
 assert.match(slideHtml, /--shatter-content-top-mobile:0px/);
});

test('a slow initial image cannot overwrite a newer editor selection', async () => {
 const c = fixture(); const ready = new Map(); c.prepare = i => new Promise(r => ready.set(i, r));
 const startup = c.initializeArtwork(); const selected = c.go(2, false, true);
 ready.get(2)({ id: 2 }); await selected; ready.get(0)({ id: 0 }); await startup;
 assert.equal(c.index, 2); assert.equal(c.art.id, 2);
});
test('a mobile source refresh cancels stale navigation without leaving the carousel loading forever', async () => {
 const c = fixture(); const ready = new Map(); c.prepare = i => new Promise(r => ready.set(i, r));
 const pending = c.go(1); const refresh = c.refreshSource();
 ready.get(0)({ id: 'mobile' }); await refresh; ready.get(1)({ id: 'old desktop' }); await pending;
 assert.equal(c.index, 0); assert.equal(c.art.id, 'mobile'); assert.equal(c.loading, false);
 c.prepare = async () => ({ id: 2 }); await c.go(2, false, true); assert.equal(c.index, 2);
});

test('rapid manual clicks accept the latest target while a transition is active', async () => {
 const c = fixture(); await c.go(1, true);
 assert.equal(c.index, 1); assert.equal(c.transition.swapped, true);
 await c.go(2, true); assert.equal(c.index, 2); assert.equal(c.transition.index, 2);
 await c.go(0, true); assert.equal(c.index, 0); assert.equal(c.transition.index, 0);
});
test('pagination acknowledges a click immediately and stale image preparation cannot replace the latest click', async () => {
 const c = fixture(); const ready = new Map(); c.prepare = i => new Promise(r => ready.set(i, r));
 const second = c.go(1, true); assert.equal(c.requestedIndex, 1);
 const third = c.go(2, true); assert.equal(c.requestedIndex, 2);
 ready.get(2)({ id: 2 }); await third; ready.get(1)({ id: 1 }); await second;
 assert.equal(c.index, 2); assert.equal(c.art.id, 2); assert.equal(c.requestedIndex, 2);
});

test('mouse pagination focus does not freeze progress after a click', () => {
 const c = fixture(); c.updateFocusPause({ matches: () => false });
 assert.equal(c.pauses.has('focus'), false);
});
test('keyboard focus pauses autoplay until pointer input takes over, preserving manual pause', () => {
 const c = fixture(); c.pauses.add('manual');
 const button = { matches: selector => selector === ':focus-visible' };
 c.updateFocusPause(button); assert(c.pauses.has('focus'));
 c.updateFocusPause(button, true); assert.equal(c.pauses.has('focus'), false); assert(c.pauses.has('manual'));
});

test('section heights and pagination use the native slideshow contracts with independently editable media and Content slots', () => {
 const fields = file => Object.fromEntries(schema(file).settings.filter(f => f.id).map(f => [f.id, f]));
 const own = fields('sections/slideshow-shatter.liquid'), native = fields('sections/slideshow.liquid');
 for (const id of ['desktop_height', 'mobile_height', 'pagination_bullet_style', 'pagination_position_desktop', 'pagination_position_mobile']) assert.deepEqual(own[id].options, native[id].options, id);
 assert.deepEqual(own.pagination_type.options, native.pagination_type.options.filter(o => o.value !== 'progress_bar'));
 assert.equal(own.show_progress.visible_if, '{{ section.settings.autoplay }}');
 assert.deepEqual(own.section_width.options.map(o => o.label), ['Page width', 'Full width', 'Full width (no padding)']);
 assert(own.pause_on_hover); assert.equal(own.interval.min, 3); assert.equal(own.interval.max, 10);
 const slide = schema('blocks/_slideshow-shatter-slide.liquid'); assert.equal(slide.blocks, undefined, 'static Content slots must not offer unused dynamic blocks');
 assert(!slide.settings.some(f => ['title_top', 'title_bottom', 'fluid_heading', 'heading_size'].includes(f.id)));
 const content = schema('blocks/_slideshow-shatter-content.liquid'); assert.deepEqual(content.blocks.map(b => b.type), ['heading', 'text', 'eyebrow', 'button']);
 assert(!slide.settings.some(f => f.id?.includes('position')));
 assert.equal(slide.presets[0].blocks.filter(b => b.type === '_slideshow-shatter-content' && b.static).length, 2);
});

test('Editor section selection keeps autoplay running, while selected blocks offer a working Play control', () => {
 const c = fixture(); const handlers = new Map();
 context.window = {};
 c.listen = (target, event, handler) => handlers.set(event + (target === c.pauseButton ? ':pause' : ''), handler);
 c.pauseButton = { dataset: { playLabel: 'Play', pauseLabel: 'Pause' }, setAttribute(key, value) { this[key] = value; } };
 c.root.dataset = { autoplay: 'true', showProgress: 'true' };
 c.progress = { parentElement: {} }; c.pagination = {};
 c.go = () => {}; c.bind();
 assert.equal(handlers.has('shopify:section:select'), false);
 handlers.get('shopify:block:select')({ target: { closest: () => c.slides[1] } });
 assert(c.pauses.has('editor')); assert.equal(c.pauseButton['aria-label'], 'Play');
 handlers.get('click:pause')();
 assert.equal(c.pauses.size, 0); assert.equal(c.pauseButton['aria-label'], 'Pause');
 handlers.get('click:pause')(); assert(c.pauses.has('manual'));
 handlers.get('shopify:block:deselect')(); assert(c.pauses.has('manual'));
});

test('Content size, alignment and spacing follow native Header settings with responsive inheritance', async () => {
 const definition = schema('blocks/_slideshow-shatter-content.liquid');
 const native = Object.fromEntries(schema('blocks/header.liquid').settings.filter(f => f.id).map(f => [f.id, f]));
 for (const f of definition.settings.filter(f => f.id && native[f.id])) {
  assert.deepEqual(f.options, native[f.id].options, f.id);
  if (f.type === 'range') for (const key of ['min', 'max', 'step']) assert.equal(f[key], native[f.id][key], f.id + '.' + key);
 }
 const defaults = Object.fromEntries(definition.settings.filter(f => 'default' in f).map(f => [f.id, f.default]));
 const engine = new (loadLiquid())({ fs: { resolve: (_r, f) => path.resolve('snippets', f + '.liquid'), exists: async () => true, readFile: async f => stripShopifyMetadata(fs.readFileSync(f, 'utf8')) } });
 const source = stripShopifyMetadata(fs.readFileSync('blocks/_slideshow-shatter-content.liquid', 'utf8')).replace(/{% content_for 'blocks' %}/g, '');
 const render = settings => engine.parseAndRender(source, { block: { settings: { ...defaults, ...settings } } });
 const inherited = await render({ position: 'bottom_right', width: 'custom', max_width: 820, padding_top: 24, padding_left: 20, customize_mobile_padding: false, padding_top_mobile: 0 });
 assert.match(inherited, /size-style size-style--contain/); assert.match(inherited, /--size-style-width: 100%/); assert.match(inherited, /--size-style-max-width: 820px/);
 assert.doesNotMatch(inherited, /--size-style-width-mobile:/); assert.match(inherited, /--shatter-content-padding-top:24px/); assert.doesNotMatch(inherited, /--shatter-content-padding-top-mobile:/);
 assert.match(inherited, /--shatter-content-align:right/); assert.match(inherited, /--shatter-content-items:end/);
 const mobile = await render({ width: 'custom', max_width: 820, customize_mobile_size: true, width_mobile: 'fill', inherit_alignment: false, alignment: 'center', customize_mobile_alignment: true, alignment_mobile: 'left', padding_top: 24, customize_mobile_padding: true, padding_top_mobile: 0, padding_right_mobile: 16, gap_desktop: 24, gap_mobile: 20 });
 assert.match(mobile, /--size-style-max-width-mobile: 100%/); assert.match(mobile, /--shatter-content-padding-top-mobile:0px/); assert.match(mobile, /--shatter-content-padding-right-mobile:16px/);
 assert.match(mobile, /--shatter-content-align:center/); assert.match(mobile, /--shatter-content-align-mobile:left/); assert.match(mobile, /--shatter-content-gap:24px/); assert.match(mobile, /--shatter-content-gap-mobile:20px/);
 const customMobile = await render({ customize_mobile_size: true, width_mobile: 'custom', max_width_mobile: 360 });
 assert.match(customMobile, /--size-style-width-mobile: 100%/); assert.match(customMobile, /--size-style-max-width-mobile: 360px/);
});
