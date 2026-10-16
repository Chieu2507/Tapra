const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const Liquid = loadLiquid();
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const schema = file => JSON.parse(read(file).match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid' });
engine.registerTag('doc', {
  parse(token, tokens) { while (tokens.length) { if (tokens.shift().name === 'enddoc') break; } },
  render() { return ''; }
});
const source = file => stripShopifyMetadata(read(file))
  .replace(/{% javascript %}[\s\S]*?{% endjavascript %}/g, '')
  .replace(/{% content_for 'blocks' %}/g, '{{ children }}');
const render = (file, settings) => engine.parseAndRender(source(file), {
  block: { settings: { ...settings, use_elara_layout: true }, shopify_attributes: 'data-shopify-editor-block="parent"' },
  children: '<div>Content</div>'
});

test('Marquee renders direction, divider, mask, parallax and local scheme controls', async () => {
  const html = await render('blocks/marquee.liquid', {
    animation_direction: 'forward', enable_parallax: false, show_top_divider: true,
    show_bottom_divider: true, show_blurred_edges: true, alignment: 'bottom',
    width: 'custom', custom_width: 50, color_type: 'scheme', color_scheme: 'scheme-2'
  });
  for (const value of ['marquee--forward', 'data-marquee-top-divider',
    'data-marquee-bottom-divider', 'data-marquee-blurred-edges',
    'data-marquee-parallax="false"', '--marquee-align: flex-end',
    '--marquee-width: 50%', 'color-scheme scheme-2']) assert.ok(html.includes(value), value);
  assert.equal((html.match(/Content/g) || []).length, 1);
});

test('Marquee preserves zero gaps/padding/static legacy speed and safe invalid speed', async () => {
  const html = await render('blocks/marquee.liquid', {
    gap_desktop: 0, gap_mobile: 0, padding_top: 10, customize_mobile_padding: true,
    padding_top_mobile: 0, animation_speed: 0
  });
  for (const value of ['--marquee-gap: 0px', '--marquee-gap-mobile: 0px',
    '--marquee-padding-top-mobile: 0px', 'marquee--static']) assert.ok(html.includes(value), value);
  assert.match(await render('blocks/marquee.liquid', { animation_speed: -3 }), /data-marquee-speed="0.6"/);
});

test('Accordion supports body/accent questions, mobile width, Plus and legacy answer sizes', async () => {
  const html = await render('blocks/faq_accordion.liquid', {
    style: 'boxed', icon: 'plus', question_font: 'accent', question_body_font_size: 'lg',
    width: 'custom', custom_width: 60, limit_width: true, max_width: 850,
    customize_mobile_size: true, width_mobile: 'fill', limit_width_mobile: false,
    color_type: 'color_scheme', color_scheme: 'scheme-2', answer_font_size: 'xl',
    customize_mobile_font_size: true, answer_font_size_mobile: 'sm'
  });
  for (const value of ['faq-accordion--icon-plus', '--faq-item-question-family: var(--font-accent-family)',
    '--faq-item-question-size: var(--font-body-lg)', '--size-style-width-mobile: 100%',
    '--size-style-max-width-mobile: 100%', '--faq-item-answer-size: var(--font-body-xl)',
    '--faq-item-answer-size-mobile: var(--font-body-sm)', 'color-scheme scheme-2']) assert.ok(html.includes(value), value);
});

test('compact image ratios and custom heading typography consume local tokens', async () => {
  for (const ratio of ['1_1', '4_5', '3_4', '2_3', '16_9', '3_2', '4_3']) {
    const html = await engine.parseAndRender("{% render 'image-ratio-value', setting: ratio %}", { ratio: 'ratio_' + ratio });
    assert.equal(html.trim(), ratio.replace('_', ' / '));
  }
  const html = await render('blocks/_marquee-heading.liquid', {
    text: 'Hello', heading_size: 'custom', font: 'accent', custom_heading_size: 60,
    custom_mobile: true, custom_heading_size_mobile: 24, opacity: 100, letter_spacing: 'tight'
  });
  for (const value of ['--mq-font:var(--font-accent-family)', '--mq-size:60px',
    '--mq-size-mobile:24px', '--mq-tracking:-0.025em']) assert.ok(html.includes(value), value);
});

test('existing template/preset trees remain accepted and all compact dependencies exist', () => {
  const rebuilt = new Set(['marquee', 'faq_accordion', 'faq_item']);
  const parent = schema('blocks/marquee.liquid');
  assert.ok(parent.blocks.some(b => b.type === 'marquee-item'));
  assert.equal(parent.blocks.filter(b => b.type.startsWith('_marquee-')).length, 9);
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    if (rebuilt.has(value.type) || value.type?.startsWith('_marquee-')) {
      const def = schema('blocks/' + value.type + '.liquid');
      const settings = new Map(def.settings.filter(s => s.id).map(s => [s.id, s]));
      for (const [id, val] of Object.entries(value.settings || {})) {
        const s = settings.get(id);
        assert.ok(s, `${value.type}: missing setting ${id}`);
        if (s.options) assert.ok(s.options.some(o => o.value === val), `${value.type}.${id}: ${val}`);
        if (s.type === 'range') assert.ok(val >= s.min && val <= s.max, `${value.type}.${id}: ${val}`);
      }
      const allowed = (def.blocks || []).map(b => b.type);
      for (const child of Object.values(value.blocks || {})) {
        assert.ok(allowed.includes(child.type) || allowed.includes('@theme') || allowed.includes('@app'), `${value.type} rejects ${child.type}`);
      }
    }
    Object.values(value).forEach(walk);
  };
  for (const dir of ['sections', 'blocks']) {
    for (const file of fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.liquid'))) {
      walk(schema(`${dir}/${file}`).presets || []);
    }
  }
  for (const file of fs.readdirSync(path.join(root, 'templates')).filter(f => f.endsWith('.json'))) {
    walk(JSON.parse(read('templates/' + file).replace(/\/\*[\s\S]*?\*\//g, '')));
  }
});

test('rebuilt JavaScript parses and every literal snippet dependency exists', () => {
  const files = ['marquee', 'faq_accordion', 'faq_item', ...schema('blocks/marquee.liquid').blocks
    .filter(b => b.type.startsWith('_marquee-')).map(b => b.type)];
  for (const name of files) {
    const text = read('blocks/' + name + '.liquid');
    for (const match of text.matchAll(/{% javascript %}([\s\S]*?){% endjavascript %}/g)) new vm.Script(match[1]);
    for (const match of text.matchAll(/render\s+'([^']+)'/g)) {
      assert.ok(fs.existsSync(path.join(root, 'snippets', match[1] + '.liquid')), match[1]);
    }
  }
});

test('Text marquee preserves legacy section types with natural height and valid saved placement', async () => {
  const text = read('sections/text-marquee-custom.liquid');
  const def = schema('sections/text-marquee-custom.liquid');
  assert.equal(def.name, 'Text marquee (custom)');
  assert.equal(fs.existsSync(path.join(root, 'sections/scrolling-text-star-separator.liquid')), true);
  assert.ok(!def.settings.some(s => s.id === 'height' || s.content === 't:general.size'));
  assert.doesNotMatch(text, /section_height_mode|section\.settings\.height|height-fill|Scrolling Text Images/);
  assert.ok(!schema('blocks/_marquee-group.liquid').settings.some(s => s.id === 'height' || s.content === 'Size'));
  const html = await engine.parseAndRender(source('sections/text-marquee-custom.liquid'), {
    section: { settings: { use_elara_layout: true, height: 'fill', direction: 'horizontal', section_width: 'full_width_no_padding',
      customize_mobile_alignment: true, alignment_mobile: 'center', gap_desktop: 0, gap_mobile: 0 } }, children: '<div>Content</div>'
  });
  assert.match(html, /section-spacing elara-text-marquee-custom/);
  assert.match(html, /layout-flow--mobile-vertical/);
  assert.match(html, /--layout-flow-gap: 0px/);
  assert.match(html, /--layout-flow-gap-mobile: 0px/);
  assert.doesNotMatch(html, /height-fill/);
  const allowed = def.blocks.map(b => b.type);
  for (const folder of ['templates', 'sections']) {
    for (const file of fs.readdirSync(path.join(root, folder)).filter(f => f.endsWith('.json'))) {
      const data = JSON.parse(read(`${folder}/${file}`).replace(/\/\*[\s\S]*?\*\//g, ''));
      for (const section of Object.values(data.sections || {})) {
        if (section.type === 'scrolling-text-star-separator') assert.ok(fs.existsSync(path.join(root, 'sections/' + section.type + '.liquid')));
        if (section.type === 'text-marquee-custom') {
          for (const block of Object.values(section.blocks || {})) assert.ok(allowed.includes(block.type));
        }
      }
    }
  }
});

test('Marquee appearance and four-sided Padding groups are ordered consistently across slots', async () => {
  const paddingIds = ['padding_top', 'padding_bottom', 'padding_left', 'padding_right', 'customize_mobile_padding', 'padding_top_mobile', 'padding_bottom_mobile', 'padding_left_mobile', 'padding_right_mobile'];
  for (const file of ['blocks/marquee.liquid', 'blocks/_media-item-marquee.liquid', 'blocks/_crossed-scrolling-ribbon.liquid']) {
    const fields = schema(file).settings;
    const start = fields.findIndex(f => f.type === 'header' && f.content === 'Padding');
    assert.deepEqual(fields.slice(start + 1).map(f => f.id), paddingIds, file);
    assert(fields.findIndex(f => f.id === 'background_color') < start, file);
  }
  const html = await render('blocks/marquee.liquid', { padding_left: 32, padding_right: 24, customize_mobile_padding: true, padding_left_mobile: 0, padding_right_mobile: 16, background_color: '#BFE3FF' });
  for (const value of ['--marquee-padding-left: 32px', '--marquee-padding-right: 24px', '--marquee-padding-left-mobile: 0px', '--marquee-padding-right-mobile: 16px', '--marquee-background-color: #BFE3FF']) assert.ok(html.includes(value), value);
  const inherited = await render('blocks/marquee.liquid', { padding_left: 32, customize_mobile_padding: false, padding_left_mobile: 0 });
  assert.ok(!inherited.includes('--marquee-padding-left-mobile:'));
});
