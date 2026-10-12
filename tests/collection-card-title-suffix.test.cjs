const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const liquid = new (loadLiquid())();
liquid.registerFilter('t', key => key);
const source = stripShopifyMetadata(fs.readFileSync('blocks/collection-card-title.liquid', 'utf8'));

test('collection display suffix is optional, exact and never empties the title', async () => {
  for (const [title, suffix, expected] of [
    ['Walks Wofyn', '', 'Walks Wofyn'],
    ['Walks Wofyn', 'Wofyn', 'Walks'],
    ['Wofyn Walks', 'Wofyn', 'Wofyn Walks'],
    ['Wofyn', 'Wofyn', 'Wofyn'],
    ['Walks', 'Longer than the title', 'Walks'],
    ['Walks Wofyn', 'wofyn', 'Walks Wofyn'],
  ]) {
    const html = await liquid.parseAndRender(source, {
      closest: { collection: { title, products_count: 3 } },
      block: { settings: { omit_title_suffix: suffix, heading_size: 'md', html_tag: 'h3' } },
    });
    assert.match(html, new RegExp(`<h3[^>]*>\\s*${expected}\\s*</h3>`));
  }
});
