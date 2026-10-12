const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const liquid = new (loadLiquid())();
liquid.registerFilter('t', key => key);
function source(file) {
  return stripShopifyMetadata(fs.readFileSync(file, 'utf8'))
    .replace(/{%\s*content_for 'blocks'\s*%}/g, 'NESTED_HOTSPOTS')
    .replace(/{%\s*content_for 'block',.*?%}/g, 'STATIC_BLOCK')
    .replace(/{%\s*render 'product-callout-hotspot',.*?%}/g, 'LEGACY_HOTSPOT')
    .replace(/{%\s*render[\s\S]*?%}/g, '');
}
test('gallery preserves legacy hotspot data and switches cleanly to nested points', async () => {
  for (const [settings, marker, absent] of [
    [{}, 'LEGACY_HOTSPOT', 'NESTED_HOTSPOTS'],
    [{use_nested_hotspots:false}, 'LEGACY_HOTSPOT', 'NESTED_HOTSPOTS'],
    [{use_nested_hotspots:true}, 'NESTED_HOTSPOTS', 'LEGACY_HOTSPOT'],
  ]) {
    const html = await liquid.parseAndRender(source('blocks/gallery-hotspot.liquid'), {block:{settings}});
    assert.ok(html.includes(marker));
    assert.ok(!html.includes(absent));
  }
});
test('Header position uses peer labels and preserves one header with independent mobile order', async () => {
  for (const [settings, desktop, mobile] of [
    [{}, 'left', 'above'],
    [{header_position:'above',mobile_header_position:'below'}, 'above', 'below'],
    [{header_position:'beside',mobile_header_position:'below'}, 'left', 'below'],
    [{header_position:'beside',mobile_header_position:'invalid'}, 'left', 'above'],
  ]) {
    const html = await liquid.parseAndRender(source('sections/hotspot-gallery.liquid'), {section:{settings}});
    assert.ok(html.includes(`data-header-position="${desktop}"`));
    assert.ok(html.includes(`data-mobile-header-position="${mobile}"`));
    assert.ok(!html.includes('class="hotspot-gallery__header-above"'));
    assert.equal((html.match(/class="hotspot-gallery__header /g)||[]).length,1);
  }
});
