const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const schema = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]);

test('typed media slots enforce one marquee and the matching media without offering either in Add block', () => {
  for (const kind of ['image', 'video']) {
    const file = `blocks/media-item-${kind}.liquid`;
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const data = schema(file);
    assert.deepEqual(data.blocks.map(b => b.type), ['heading', 'text', 'button', 'buttons']);
    assert.equal((source.match(/content_for 'block', type: '_media-item-marquee'/g) || []).length, 1);
    assert.equal((source.match(new RegExp(`content_for 'block', type: '${kind}'`, 'g')) || []).length, 1);
    for (const type of ['_media-item-marquee', kind]) {
      const slots = data.presets[0].blocks.filter(b => b.type === type);
      assert.equal(slots.length, 1);
      assert.equal(slots[0].static, true);
    }
  }
});

function playerFixture() {
  let Item;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/interactive-media-item.js'), 'utf8'), {
    HTMLElement: class {}, customElements: { get() {}, define(name, value) { Item = value; } },
    clearTimeout, setTimeout, queueMicrotask,
    getComputedStyle: element => ({ getPropertyValue: key => element.style?.[key] || '' }),
  });
  const item = new Item();
  const events = {};
  const clone = { matches: () => true, addEventListener: (name, callback) => { events[name] = callback; }, removeAttribute() {}, play: () => Promise.resolve(), pause() {} };
  let settle;
  const animation = { finished: new Promise(resolve => { settle = resolve; }), cancel() {} };
  const content = {};
  const classes = { add() {}, remove() {} };
  const player = { source: { cloneNode: () => clone }, media: { querySelector: () => null }, button: { setAttribute() {} } };
  Object.assign(item, {
    style: { '--motion-duration-surface': '600ms', '--motion-duration-reveal': '900ms', '--motion-duration-standard': '280ms', '--motion-ease-surface': 'cubic-bezier(.76, 0, .24, 1)' },
    motion: { matches: false }, dataset: { mediaKind: 'video', playback: 'full_section' },
    sectionRoot: { append() {}, querySelector: () => content, classList: classes },
    expansion: { classList: classes, style: { setProperty(key, value) { this[key] = value; } }, append() {}, querySelector: () => ({ replaceChildren() {} }), querySelectorAll: selector => selector === 'video' ? [clone] : [], animate: () => animation },
    closeButton: { focus() {} }, expansionFrames: () => [], positionClose() {},
    append() {}, closest() { return null; }, calls: [], setFullContent(visible) { this.calls.push(visible); },
  });
  return { item, player, events, settle };
}

test('video content waits for both full expansion and actual playback', async () => {
  const { item, player, events, settle } = playerFixture();
  item.expand(player);
  events.playing();
  assert.deepEqual(item.calls, []);
  settle();
  await Promise.resolve();
  assert.deepEqual(item.calls, [true]);
  item.collapse();
  assert.equal(item.calls.at(-1), false);
});

test('expanded playback inherits only the base Video overlay, including disabled and gradient values', () => {
  for (const overlay of ['transparent', 'rgba(0, 0, 0, 0.4)', 'linear-gradient(0deg, black, transparent)']) {
    const { item, player } = playerFixture();
    player.media.style = { '--video-block-overlay': overlay };
    item.expand(player);
    assert.equal(item.expansion.style['--media-player-overlay'], overlay);
  }
  for (const kind of ['image', 'video']) assert.ok(!schema(`blocks/media-item-${kind}.liquid`).settings.some(setting => setting.id === 'content_overlay_opacity'));
});

test('a canceled opening cannot reveal content after the video starts late', async () => {
  const { item, player, events, settle } = playerFixture();
  item.expand(player);
  item.collapse();
  events.playing();
  settle();
  await Promise.resolve();
  assert.equal(item.calls.includes(true), false);
});

test('closing animates from the visible player bounds and hides only after the animation finishes', async () => {
  const { item, player } = playerFixture();
  item.expand(player);
  item.expansion.getBoundingClientRect = () => ({ left: 80, top: 90, width: 500, height: 300 });
  item.sectionRoot.getBoundingClientRect = () => ({ left: 0, top: 0 });
  item.expansionFrames = () => [{ left: '150px', top: '200px', width: '300px', height: '200px' }, { width: '1000px' }];
  let finish, captured;
  item.expansion.animate = (frames, options) => {
    captured = { frames, options };
    return { finished: new Promise(resolve => { finish = resolve; }), cancel() {} };
  };
  item.collapse();
  assert.equal(item.expansion.hidden, false);
  assert.equal(captured.frames[0].width, '500px');
  assert.equal(captured.frames[1].width, '300px');
  assert.equal(captured.options.duration, 600);
  finish();
  await Promise.resolve();
  assert.equal(item.expansion.hidden, true);
});

test('both media animation directions follow the inherited root motion tokens', () => {
  const { item, player } = playerFixture();
  item.style['--motion-duration-surface'] = '.85s';
  item.style['--motion-ease-surface'] = 'linear';
  const timings = [];
  item.expansion.animate = (frames, options) => { timings.push(options); return { finished: new Promise(() => {}), cancel() {} }; };
  item.expand(player);
  item.collapse();
  assert.equal(timings.length, 2);
  assert.ok(timings.every(value => value.duration === 850 && value.easing === 'linear'));
});

test('scroll-owned expansion focuses native playback controls; ordinary expansion focuses Close', async () => {
  for (const sticky of [true, false]) {
    const { item, player, settle } = playerFixture();
    let videoFocus = 0, closeFocus = 0;
    const clone = player.source.cloneNode();
    clone.focus = () => videoFocus++;
    item.closeButton.focus = () => closeFocus++;
    item.closest = () => ({ classList: { contains: () => sticky }, completeFor() {} });
    item.expand(player);
    settle();
    await Promise.resolve();
    assert.equal(videoFocus, sticky ? 1 : 0);
    assert.equal(closeFocus, sticky ? 0 : 1);
    assert.equal(item.usesScrollPlayback(), sticky);
  }
});

test('open and close preserve the overlay, including scroll events during the closing animation', async () => {
  const { item, player, events, settle } = playerFixture();
  const hosts = [];
  item.fullContent = { classList: { add() {}, remove() {} } };
  item.renderScrollContent = (progress, host) => hosts.push({ progress, host });
  item.scrollProgress = .7;
  item.closest = () => ({ capturePosition: () => ({ progress: .7 }), restorePosition() {}, completeFor() {} });
  item.expand(player);
  events.playing();
  settle();
  await Promise.resolve();
  assert.equal(item.calls.includes(false), false, 'opening must not hide the existing overlay');
  item.collapse();
  item.setScrollProgress(.7);
  assert.equal(hosts.at(-1).host, item.expansion, 'scroll cannot reparent content into the poster before close finishes');
  assert.equal(item.calls.includes(false), false, 'closing must fade the existing overlay rather than hide it');
  await Promise.resolve();
  assert.equal(item.closingPlayer, null);
  assert.equal(hosts.at(-1).host, undefined, 'normal scroll ownership resumes after close finishes');
  clearTimeout(item.contentTransitionTimer);
});

test('explicit close restores the scroll snapshot, while automatic dismissal never rewinds the page', () => {
  const { item, player } = playerFixture();
  const snapshot = { progress: .3 };
  const restored = [];
  item.closest = () => ({ capturePosition: () => snapshot, restorePosition: value => {
    assert.equal(item.activePlayer, null, 'restoring scroll must not recursively trigger reverse-scroll dismissal');
    assert.equal(item.closingPlayer, player);
    restored.push(value);
  }, completeFor() {} });
  item.expand(player);
  item.collapse({ animate: false });
  assert.deepEqual(restored, [snapshot]);
  item.expand(player);
  item.collapse({ animate: false, restoreFocus: false });
  assert.equal(restored.length, 1);
});

test('scroll snapshots restore the same zoom fraction after a viewport resize', () => {
  let Scroll;
  const positions = [];
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/interactive-media-scroll.js'), 'utf8'), {
    HTMLElement: class {}, customElements: { get() {}, define(name, value) { Scroll = value; } },
    window: { scrollY: 2000, scrollTo: value => positions.push(value.top) },
  });
  const scroll = new Scroll();
  Object.assign(scroll, {
    classList: { contains: () => true }, getBoundingClientRect: () => ({ top: -324, height: 1800 }),
    stage: { getBoundingClientRect: () => ({ height: 720 }) }, update() {},
  });
  const snapshot = scroll.capturePosition();
  assert.equal(snapshot.progress, .3);
  scroll.getBoundingClientRect = () => ({ top: -1200, height: 3000 });
  scroll.stage.getBoundingClientRect = () => ({ height: 1000 });
  scroll.restorePosition(snapshot);
  assert.equal(positions[0], 1400);
});

test('editor selecting the visible video preserves partial zoom while selecting a covered item reveals it', () => {
  let Scroll;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/interactive-media-scroll.js'), 'utf8'), {
    HTMLElement: class {}, customElements: { get() {}, define(name, value) { Scroll = value; } },
  });
  const scroll = new Scroll();
  const video = { closest: () => null }, image = { closest: () => null };
  const first = { inert: false, contains: target => target === video };
  const second = { inert: true, contains: target => target === image };
  let updates = 0;
  Object.assign(scroll, { items: [first, second], progress: .43, contains: () => true, update() { updates++; } });
  scroll.selectBlock(video);
  assert.equal(scroll.progress, .43);
  assert.equal(scroll.editingPosition, undefined);
  assert.equal(updates, 0, 'selection must not reset or recompute the current zoom');
  scroll.selectBlock(image);
  assert.equal(scroll.editingPosition, 1.85);
  assert.equal(updates, 1, 'a covered item remains reachable from the sidebar');
  first.inert = true;
  scroll.selectBlock(video);
  assert.equal(scroll.editingPosition, 0);
});

test('opening a video completes its sticky scroll track', () => {
  const { item, player } = playerFixture();
  const completed = [];
  item.closest = () => ({ completeFor: media => completed.push(media) });
  item.expand(player);
  assert.deepEqual(completed, [player.media]);
});

test('sticky completion advances only the tracked video and consumes the remaining zoom distance', () => {
  let Scroll;
  const scrolls = [];
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/interactive-media-scroll.js'), 'utf8'), {
    HTMLElement: class {}, customElements: { get() {}, define(name, value) { Scroll = value; } },
    window: { scrollY: 1000, scrollTo: value => scrolls.push(value) },
  });
  const scroll = new Scroll();
  const tracked = {};
  Object.assign(scroll, {
    media: tracked, items: [{ querySelector: () => tracked }], classList: { contains: () => true },
    stage: { getBoundingClientRect: () => ({ height: 720 }) },
    getBoundingClientRect: () => ({ top: -200, height: 1800 }), update() {},
  });
  scroll.completeFor({ closest: () => ({}) });
  assert.equal(scrolls.length, 0);
  scroll.completeFor({ closest: () => tracked });
  assert.equal(scrolls[0].top, 1880);
  assert.equal(scrolls[0].behavior, 'instant');
  scroll.editingPosition = 0;
  const later = {};
  scroll.items.push({ querySelector: () => later });
  scroll.getBoundingClientRect = () => ({ top: -200, height: 2880 });
  scroll.completeFor({ closest: () => tracked });
  scroll.completeFor({ closest: () => later });
  assert.equal(scroll.editingPosition, undefined, 'explicit Play releases the editor preview position');
  assert.equal(scrolls[1].top, 1880, 'the first video finishes only its own segment');
  assert.equal(scrolls[2].top, 2960, 'the second video finishes the final segment');
});

test('migrated demo keeps static slots outside block_order and valid rich text', () => {
  const source = fs.readFileSync(path.join(root, 'templates/index.json'), 'utf8');
  const item = JSON.parse(source.slice(source.indexOf('{'))).sections.tapra_media.blocks.block_1;
  assert.equal(item.type, 'media-item-video');
  assert.deepEqual(Object.keys(item.blocks).filter(id => item.blocks[id].static).sort(), ['marquee', 'media']);
  assert.ok(item.block_order.every(id => !item.blocks[id].static));
  const walk = block => {
    const data = schema(`blocks/${block.type}.liquid`);
    for (const setting of data.settings || []) {
      const value = block.settings?.[setting.id];
      if (setting.type === 'richtext' && value) assert.match(value, /^<(p|ul|ol|h[1-6])(?:\s[^>]*)?>/, `${block.type}.${setting.id}`);
    }
    for (const child of Object.values(block.blocks || {})) walk(child);
  };
  walk(item);
});

test('later media slide over the first full media, reverse with scrolling and stop covered playback', () => {
  let Scroll;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/interactive-media-scroll.js'), 'utf8'), {
    HTMLElement: class {}, customElements: { get() {}, define(name, value) { Scroll = value; } },
  });
  const makeItem = () => ({
    values: {}, style: { setProperty(key, value) { this[key] = value; } },
    setAttribute(key, value) { this.values[key] = value; },
    setScrollProgress(value) { this.progress = value; },
  });
  const first = makeItem(), second = makeItem();
  const scroll = new Scroll();
  scroll.items = [first, second];
  scroll.updateLayers(.5);
  assert.equal(first.progress, .5);
  assert.equal(second.style['--scroll-layer-y'], '100%');
  first.activePlayer = {};
  first.collapse = options => { first.activePlayer = null; assert.equal(options.restoreFocus, false); };
  scroll.updateLayers(1.3);
  assert.equal(first.activePlayer, null);
  assert.equal(first.inert, true);
  assert.equal(first.progress, 1.3, 'outgoing copy keeps the scroll position instead of resetting');
  assert.ok(Math.abs(parseFloat(second.style['--scroll-layer-y']) - 50) < .001);
  scroll.updateLayers(1.85);
  assert.equal(second.style['--scroll-layer-y'], '0%');
  assert.ok(Math.abs(second.progress - .85) < .001);
  scroll.updateLayers(.8);
  assert.equal(first.inert, false);
  assert.equal(second.inert, true);
  assert.equal(second.progress, 0);
  assert.equal(second.style['--scroll-layer-y'], '100%');
  first.activePlayer = {};
  first.collapse = options => {
    assert.equal(options.animate, false);
    assert.equal(options.restoreFocus, false);
    assert.equal(options.resumeScroll, true);
    first.activePlayer = null;
  };
  scroll.scrollEpsilon = 1 / 1080;
  scroll.updateLayers(1 - .5 / 1080);
  assert.ok(first.activePlayer, 'subpixel rounding after programmatic completion must not dismiss the expanded player');
  scroll.updateLayers(.75);
  assert.equal(first.activePlayer, null, 'reverse scrolling releases manual expansion to the scroll scene');
  assert.equal(first.progress, .75);
});

test('reverse-scroll handoff preserves the playing frame, audio and paused state', async () => {
  const { item } = playerFixture();
  const classes = new Set();
  let plays = 0;
  const source = { matches: type => type === 'video', muted: true, controls: false, play() { plays++; return Promise.resolve(); } };
  const player = { source, media: { classList: { add: (...values) => values.forEach(value => classes.add(value)) } }, button: { setAttribute() {} } };
  const expanded = { currentTime: 7.25, muted: false, volume: .6, paused: false, ended: false };
  item.expansion.querySelector = () => expanded;
  item.resumeScrollPlayer(player);
  await Promise.resolve();
  assert.equal(source.currentTime, 7.25);
  assert.equal(source.muted, false);
  assert.equal(source.volume, .6);
  assert.equal(plays, 1);
  assert.equal(player.scrollAutoplay, true);
  assert.ok(classes.has('has-started'));
  assert.ok(classes.has('is-scroll-autoplay'));
  expanded.paused = true;
  item.resumeScrollPlayer(player);
  assert.equal(plays, 1, 'a paused expanded video stays paused during reverse zoom');
});

test('the Media item Marquee slot exposes no Elara/composition effects and reuses the shared renderer', () => {
  const data = schema('blocks/_media-item-marquee.liquid');
  assert.ok(data.blocks.some(block => block.type === '_marquee-heading'));
  assert.ok(schema('blocks/_marquee-heading.liquid').presets.some(preset => preset.name === 'Heading'));
  const ids = data.settings.map(s => s.id);
  for (const id of ['use_elara_layout', 'show_top_divider', 'show_bottom_divider', 'show_blurred_edges', 'enable_parallax']) assert.ok(!ids.includes(id));
  for (const id of ['animation_speed', 'animation_direction', 'gap_desktop', 'gap_mobile', 'width', 'color_type', 'padding_top']) assert.ok(ids.includes(id));
  for (const kind of ['image', 'video']) {
    const parent = schema(`blocks/media-item-${kind}.liquid`);
    for (const id of ['marquee_top_divider', 'marquee_bottom_divider', 'marquee_parallax', 'blend_edges']) assert.ok(parent.settings.some(s => s.id === id));
  }
  for (const file of ['blocks/marquee.liquid', 'blocks/_media-item-marquee.liquid']) {
    assert.ok(fs.readFileSync(path.join(root, file), 'utf8').includes("render 'marquee-content'"));
  }
});

test('Media item renders owned effects and preserves zero mobile padding overrides', async () => {
  const { loadLiquid } = require('./helpers/liquid-engine.cjs');
  const Liquid = loadLiquid();
  const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid' });
  engine.registerTag('doc', { parse(token, tokens) { while (tokens.length) if (tokens.shift().name === 'enddoc') break; }, render() { return ''; } });
  const html = await engine.renderFile('interactive-media-item', {
    item_block: { settings: { marquee_top_divider: true, marquee_bottom_divider: true, marquee_parallax: true } },
    media_kind: 'image', marquee: '<div data-media-marquee data-marquee-parallax="false">Content</div>',
  });
  for (const attr of ['data-marquee-top-divider', 'data-marquee-bottom-divider', 'data-marquee-parallax="true"']) assert.ok(html.includes(attr));
  const renderSpacing = customize => engine.renderFile('interactive-media-item', {
    item_block: { settings: { padding_top: 32, padding_top_mobile: 0, customize_mobile_padding: customize } }, media_kind: 'video',
  });
  const mobile = await renderSpacing(true);
  assert.ok(mobile.includes('--media-item-padding-top: 32px;'));
  assert.ok(mobile.includes('--media-item-padding-top-mobile: 0px;'));
  assert.ok(!(await renderSpacing(false)).includes('--media-item-padding-top-mobile:'), 'disabled mobile customization inherits desktop spacing');
});

test('Media items preserve the shared section layout without independent sticky wrappers', async () => {
  const { loadLiquid } = require('./helpers/liquid-engine.cjs');
  const Liquid = loadLiquid();
  const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid' });
  engine.registerTag('doc', { parse(token, tokens) { while (tokens.length) if (tokens.shift().name === 'enddoc') break; }, render() { return ''; } });
  for (const [count, enabled] of [[1, true], [2, true], [3, true], [2, false]]) {
    const html = await engine.renderFile('interactive-media-item', {
      section: { blocks: Array.from({ length: count }, () => ({ type: '@theme' })), settings: { sticky_scroll: enabled, section_width: 'page_width' } },
      item_block: { settings: {} }, media_kind: 'image', media: '<div class="image-block">Image</div>', marquee: '', content: '',
    });
    assert.equal(html.includes('lh-interactive-media-scroll'), false, `${count} items, sticky ${enabled}`);
    assert.equal((html.match(/<lh-interactive-media-item /g) || []).length, 1);
  }
});

test('scroll content fades and rises continuously and waits for exit duration before hiding', async () => {
  const { item } = playerFixture();
  const tokens = () => { const values = new Set(); return { add: v => values.add(v), remove: v => values.delete(v), contains: v => values.has(v) }; };
  const styles = new Map();
  let copies = 0;
  const copy = { removeAttribute() {}, setAttribute() {}, classList: tokens() };
  const button = { setAttribute() {}, removeAttribute() {}, cloneNode() { copies++; return copy; } };
  const content = { children: [{}], append() {} };
  item.fullContent = { classList: tokens(), querySelector: () => content, style: { setProperty: (key, value) => styles.set(key, value) } };
  item.style['--motion-duration-surface'] = '10ms';
  item.setFullContent = visible => {
    item.calls.push(visible);
    item.fullContent.classList[visible ? 'add' : 'remove']('is-visible');
  };
  item.players = [{ media: { classList: tokens() }, button }];
  item.sectionRoot.clientHeight = 720;
  item.setScrollProgress(.5);
  assert.equal(item.calls.at(-1), false);
  item.setScrollProgress(.7);
  const partial = Number(styles.get('--media-scroll-copy-opacity'));
  const travel = parseFloat(styles.get('--media-scroll-copy-travel'));
  assert.ok(partial > 0 && partial < 1);
  assert.ok(travel > 0);
  item.setScrollProgress(.85);
  assert.ok(Number(styles.get('--media-scroll-copy-opacity')) < 1, 'copy continues revealing through the later scroll range');
  item.setScrollProgress(.95);
  assert.equal(Number(styles.get('--media-scroll-copy-opacity')), 1);
  assert.equal(parseFloat(styles.get('--media-scroll-copy-travel')), 0);
  assert.equal(button.inert, false);
  item.setScrollProgress(1.3);
  assert.ok(Math.abs(Number(styles.get('--media-scroll-copy-opacity')) - .5) < .001);
  assert.ok(parseFloat(styles.get('--media-scroll-copy-travel')) < 0);
  const outgoingTravel = parseFloat(styles.get('--media-scroll-copy-travel'));
  item.setScrollProgress(1.6);
  assert.equal(Number(styles.get('--media-scroll-copy-opacity')), 0);
  assert.equal(button.inert, false);
  item.setScrollProgress(1.3);
  assert.equal(parseFloat(styles.get('--media-scroll-copy-travel')), outgoingTravel);
  item.setScrollProgress(1);
  assert.equal(Number(styles.get('--media-scroll-copy-opacity')), 1);
  assert.equal(parseFloat(styles.get('--media-scroll-copy-travel')), 0);
  item.setScrollProgress(.7);
  assert.equal(Number(styles.get('--media-scroll-copy-opacity')), partial);
  item.scrollContentSampleTime = Date.now() - 1000;
  item.setScrollProgress(.69);
  assert.equal(item.fullContent.classList.contains('is-scroll-hiding'), false, 'slow reverse scroll tracks position without a duration');
  item.scrollContentSampleTime = Date.now();
  item.setScrollProgress(.5);
  assert.equal(item.calls.at(-1), true, 'fast reverse scrolling must leave content mounted during its exit');
  assert.ok(item.fullContent.classList.contains('is-scroll-hiding'));
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(item.calls.at(-1), false);
  assert.equal(button.inert, false);
  assert.equal(copies, 0);
});

test('scroll autoplay starts muted at full zoom, keeps playing while shrinking and stops at the poster', async () => {
  const { item } = playerFixture();
  let plays = 0, pauses = 0;
  const classes = new Set();
  const source = { muted: false, controls: false, matches: type => type === 'video', play() { plays++; return Promise.resolve(); }, pause() { pauses++; } };
  const player = { source, media: { classList: { contains: value => classes.has(value), add: value => classes.add(value), remove: (...values) => values.forEach(value => classes.delete(value)) } }, button: { setAttribute() {}, removeAttribute() {} } };
  item.players = [player];
  item.setScrollPlayback(.5);
  assert.equal(plays, 0);
  item.setScrollPlayback(.6);
  await Promise.resolve();
  assert.equal(plays, 1);
  assert.equal(source.muted, true);
  assert.equal(source.controls, true);
  assert.equal(player.button.inert, true);
  assert.ok(classes.has('is-scroll-autoplay'));
  item.setScrollPlayback(.2);
  assert.equal(pauses, 0);
  item.setScrollPlayback(.9, false);
  assert.equal(pauses, 1);
  assert.ok(classes.has('is-scroll-autoplay'), 'covered video does not flash its Play button');
  item.setScrollPlayback(.9);
  await Promise.resolve();
  assert.equal(plays, 2);
  item.setScrollPlayback(0);
  assert.equal(pauses, 2);
  assert.equal(source.muted, false);
  assert.equal(source.controls, false);
  assert.equal(player.button.inert, false);
  assert.ok(!classes.has('is-scroll-autoplay'));
  item.setScrollPlayback(.9);
  item.setScrollPlayback(.9, false);
  await Promise.resolve();
  assert.ok(!classes.has('is-scroll-autoplay'), 'a late play promise cannot revive a covered player');
  item.motion.matches = true;
  item.setScrollPlayback(1);
  assert.equal(plays, 3, 'reduced motion does not start autoplay');
});

test('full-section click expands a partially zoomed video even after autoplay, while inline never expands', () => {
  const { item } = playerFixture();
  let opens = 0, pauses = 0, prevented = 0;
  const player = { source: { pause() { pauses++; } }, media: { classList: { contains: () => true } } };
  const event = { target: { closest: () => null }, preventDefault() { prevented++; }, stopImmediatePropagation() {} };
  item.expand = () => opens++;
  item.scrollProgress = .3;
  item.openFromMedia(event, player);
  assert.equal(opens, 1);
  assert.equal(pauses, 1);
  assert.equal(prevented, 1);
  item.scrollProgress = .9;
  item.openFromMedia(event, player);
  assert.equal(opens, 1, 'full-size native controls are not intercepted');
  item.dataset.playback = 'inline';
  item.scrollProgress = .3;
  item.openFromMedia(event, player);
  assert.equal(opens, 1);
});

test('manual inline playback is independent of zoom progress and retains its audio state', () => {
  const { item } = playerFixture();
  item.dataset.playback = 'inline';
  let pauses = 0;
  const source = { muted: false, pause() { pauses++; }, play() { throw new Error('scroll must not restart manual inline playback'); } };
  const player = { source, inlineManual: true };
  item.players = [player];
  for (const progress of [.3, .7, 1, .2, 0]) item.setScrollPlayback(progress);
  assert.equal(pauses, 0);
  assert.equal(source.muted, false);
  // Another item takes over, so the offscreen inline video stops as well.
  player.media = { classList: { contains: () => false } };
  item.setScrollPlayback(.7, false);
  assert.equal(pauses, 1);
});
