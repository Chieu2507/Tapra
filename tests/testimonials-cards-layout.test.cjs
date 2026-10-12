const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const Liquid = loadLiquid();
const section = fs.readFileSync(path.join(__dirname, '../sections/testimonials-cards.liquid'), 'utf8');
const schema = JSON.parse(section.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
const source = stripShopifyMetadata(section)
  .replace(/{% content_for 'block',[^%]*%}/g, '<h2>Reviews</h2>')
  .replace(/{% content_for 'blocks' %}/g, '<article class="swiper-slide testimonial-item">First review</article><article class="swiper-slide testimonial-item">Second review</article>');
const engine = new Liquid({
  partials: ['snippets'], extname: '.liquid',
  fs: {
    resolve: (root, file, ext) => file + (file.endsWith(ext) ? '' : ext),
    exists: async file => fs.existsSync(path.join(__dirname, '../snippets', file)),
    readFile: async file => stripShopifyMetadata(fs.readFileSync(path.join(__dirname, '../snippets', file), 'utf8')),
    existsSync: file => fs.existsSync(path.join(__dirname, '../snippets', file)),
    readFileSync: file => stripShopifyMetadata(fs.readFileSync(path.join(__dirname, '../snippets', file), 'utf8')),
  },
});
engine.registerFilter('t', value => value);
engine.registerFilter('asset_url', value => value);
engine.registerTag('style', { parse(token, remain) {
  this.templates = [];
  const stream = this.liquid.parser.parseStream(remain).on('template', t => this.templates.push(t)).on('tag:endstyle', () => stream.stop());
  stream.start();
}, *render(ctx, emitter) { yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter); } });

for (const layout of ['grid', 'carousel', undefined, 'invalid']) {
  test(`Testimonials preserves review markup and selects ${layout || 'saved default'} layout`, async () => {
    const settings = Object.fromEntries(schema.settings.filter(s => s.id && s.default !== undefined).map(s => [s.id, s.default]));
    if (layout === undefined) delete settings.layout_type;
    else settings.layout_type = layout;
    const output = await engine.parseAndRender(source, { section: { id: 'reviews', settings } });
    const expected = layout === 'grid' ? 'grid' : 'carousel';
    assert.match(output, new RegExp(`data-swiper-layout="${expected}"`));
    assert.equal((output.match(/First review/g) || []).length, 1);
    assert.equal((output.match(/Second review/g) || []).length, 1);
    if (expected === 'grid') assert.doesNotMatch(output, /data-carousel-block|data-carousel-pagination|data-theme-module/);
    else {
      assert.match(output, /data-carousel-block/);
      assert.match(output, /data-carousel-pagination/);
      assert.match(output, /carousel-block.js/);
    }
    for (const device of ['desktop', 'tablet', 'mobile']) {
      assert.match(output, new RegExp(`--testimonials-columns-${device}: ${settings['columns_' + device]}`));
      assert.match(output, new RegExp(`data-swiper-columns-${device}="${settings['columns_' + device]}"`));
    }
  });
}

test('carousel can hide pagination and apply merchant column and gap overrides', async () => {
  const output = await engine.parseAndRender(source, { section: { id: 'reviews', settings: {
    layout_type: 'carousel', columns_desktop: '4', columns_tablet: '3', columns_mobile: '2',
    gap_desktop: 40, gap_mobile: 20, show_pagination: false,
  } } });
  assert.doesNotMatch(output, /data-carousel-pagination/);
  assert.match(output, /data-swiper-columns-desktop="4"/);
  assert.match(output, /--testimonials-columns-tablet: 3/);
  assert.match(output, /--testimonials-columns-mobile: 2/);
  assert.match(output, /--testimonials-gap-desktop: 40px/);
  assert.match(output, /--testimonials-gap-mobile: 20px/);
});

for (const position of ['header', 'bottom']) {
  test(`navigation is rendered once at the ${position} position`, async () => {
    const output = await engine.parseAndRender(source, { section: { id: 'reviews', settings: {
      layout_type: 'carousel', show_navigation: true, navigation_position: position,
      columns_desktop: '2', columns_tablet: '1', columns_mobile: '1',
    } } });
    assert.equal((output.match(/data-carousel-previous/g) || []).length, 1);
    assert.equal((output.match(/data-carousel-next/g) || []).length, 1);
    if (position === 'header') assert.ok(output.indexOf('data-carousel-next') < output.indexOf('First review'));
    else assert.ok(output.indexOf('data-carousel-previous') > output.indexOf('Second review'));
  });
}
