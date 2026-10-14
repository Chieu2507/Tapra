const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const Liquid = loadLiquid();
const engine = new Liquid();
engine.registerFilter('image_url', image => image.url);
engine.registerFilter('image_tag', url => `<img src="${url}" alt="">`);
engine.registerFilter('video_tag', () => '<video src="/video.mp4"></video>');
engine.registerFilter('placeholder_svg_tag', (_, className) => `<svg class="${className}"></svg>`);
const source = stripShopifyMetadata(fs.readFileSync(path.join(__dirname, '../snippets/video.liquid'), 'utf8'))
  .replace(/{% javascript %}[\s\S]*?{% endjavascript %}/g, '')
  .replace(/{% render 'icon'[^%]*%}/g, '<svg></svg>');
const cover = { url: '/cover.jpg' };

test('empty video displays a selected cover without a fake Play control or placeholder styling', async () => {
  for (const autoplay of [false, true]) {
    const html = await engine.parseAndRender(source, { poster: cover, autoplay });
    assert.match(html, /class="video__cover"/);
    assert.match(html, /src="\/cover.jpg"/);
    assert.doesNotMatch(html, /placeholder-image|video__placeholder|data-video-play|<video/);
  }
});

test('removing the cover from an empty video restores the shared image placeholder', async () => {
  const html = await engine.parseAndRender(source, {});
  assert.match(html, /placeholder-image/);
  assert.match(html, /class="video__placeholder"/);
  assert.doesNotMatch(html, /data-video-cover|data-video-play/);
});

test('uploaded-video cover and play controls retain their existing autoplay behavior', async () => {
  const video = { preview_image: { width: 1600, height: 900 } };
  const manual = await engine.parseAndRender(source, { video, poster: cover, autoplay: false });
  assert.match(manual, /src="\/cover.jpg"/);
  assert.match(manual, /data-video-play/);
  const automatic = await engine.parseAndRender(source, { video, poster: cover, autoplay: true });
  assert.match(automatic, /<video/);
  assert.doesNotMatch(automatic, /data-video-cover|data-video-play/);
});
