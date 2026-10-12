const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const Liquid = loadLiquid();
const source = stripShopifyMetadata(fs.readFileSync('blocks/blog-card-meta.liquid', 'utf8'));
const engine = new Liquid();
engine.registerFilter('handleize', value => String(value));
const article = { title: 'A real post', published_at: '2025-08-18T00:00:00Z', author: 'A & B', comments_count: 3 };
const settings = { show_date: true, show_date_icon: false, show_author: false, show_comment_count: false, date_format: 'long', separator_icon: 'slash', size: 'sm' };
const render = (overrides = {}, resource = article, designMode = false) => engine.parseAndRender(source, {
  closest: { article: resource }, request: { design_mode: designMode },
  block: { settings: { ...settings, ...overrides }, shopify_attributes: 'data-editor="meta"' },
});

test('saved Meta without a display choice retains date content and editor identity', async () => {
  const html = await render();
  assert.match(html, /<time datetime="2025-08-18">August 18, 2025<\/time>/);
  assert.doesNotMatch(html, /blog-card-meta--badge|color-scheme/);
  assert.equal((html.match(/data-editor="meta"/g) || []).length, 1);
});

test('badges retain live details and ordering, use their scheme and omit separators', async () => {
  const html = await render({ display_type: 'badge', badge_color_scheme: { id: 'scheme-2' }, show_author: true, show_comment_count: true,
    details_order: 'comment_author_date', show_comment_icon: false, author_prefix: '', author_display_type: 'text' });
  assert.match(html, /blog-card-meta--badge/);
  assert.equal((html.match(/section-color-scope scheme-2/g) || []).length, 3);
  assert.ok(html.indexOf('3 comments') < html.indexOf('A &amp; B'));
  assert.ok(html.indexOf('A &amp; B') < html.indexOf('<time'));
  assert.doesNotMatch(html, /class="blog-card-meta__separator"/);
  assert.equal((html.match(/<time /g) || []).length, 1);
  assert.equal((html.match(/data-editor="meta"/g) || []).length, 1);
});

test('invalid display values fall back to content', async () => {
  const html = await render({ display_type: 'invalid' });
  assert.doesNotMatch(html, /blog-card-meta--badge/);
  assert.match(html, /August 18, 2025/);
});

test('disabled details emit no badge surface; blank resources preserve the editor placeholder', async () => {
  assert.equal((await render({ display_type: 'badge', show_date: false })).trim(), '');
  const html = await render({ display_type: 'badge' }, null, true);
  assert.match(html, /blog-card-meta--badge/);
  assert.match(html, /February 03, 2026/);
  assert.doesNotMatch(html, /<time /);
});

test('compact date badges keep the semantic date and selected article context', async () => {
  const html = await render({ display_type: 'badge', badge_position: 'bottom_left', badge_style: 'compact', date_format: 'day_month' });
  assert.match(html, /blog-card-meta--bottom-left blog-card-meta--compact/);
  assert.match(html, /<time datetime="2025-08-18">18 Aug 2025<\/time>/);
  assert.equal((html.match(/<time /g) || []).length, 1);
  assert.equal((html.match(/data-editor="meta"/g) || []).length, 1);
  assert.doesNotMatch(await render({ display_type: 'badge' }), /blog-card-meta--compact/);
  assert.doesNotMatch(await render({ display_type: 'content', badge_style: 'compact' }), /blog-card-meta--compact/);
});
