const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const json = p => JSON.parse(read(p).replace(/^\/\*[\s\S]*?\*\/\s*/, ''));
const current = json('config/settings_data.json').current;
const schema = json('config/settings_schema.json');
const Liquid = loadLiquid();
const engine = new Liquid();
const source = read('snippets/css-variables.liquid').replace(/{%\s*(?:end)?style\s*%}/g, '');
const render = changes => engine.parseAndRender(source, {settings: {...current, ...changes, color_schemes: Object.entries(current.color_schemes).map(([id,v]) => ({id,...v}))}});

test('guide typography and alpha colors reach the generated CSS', async () => {
  const css = await render({});
  for (const value of ['--font-heading-display: 72px', '--font-heading-xl: 44px', '--font-heading-lg: 32px', '--font-heading-md: 26px', '--font-heading-sm: 20px', '--font-heading-display: 60px', '--font-heading-display: 48px', '--font-body-line-height: 1.5', '--font-eyebrow-letter-spacing: 0.12em', '--text-muted-color: rgba(191,227,255,0.72)', '--background-component-color: rgba(191,227,255,0.14)']) assert.ok(css.includes(value), value);
  assert.equal(Object.keys(current.color_schemes).length, 5);
  for (const group of schema) for (const setting of group.settings || []) {
    const value = current[setting.id];
    if (setting.type === 'range' && value !== undefined) {
      assert.ok(value >= setting.min && value <= setting.max, setting.id);
      assert.ok(Math.abs((value-setting.min)/setting.step - Math.round((value-setting.min)/setting.step)) < .001, setting.id);
    }
  }
});

test('zero hover and glass values survive Liquid fallbacks', async () => {
  const css = await render({button_hover_lift: 0, button_shadow_opacity: 0, button_icon_nudge: 0, glass_opacity: 0, glass_blur: 0});
  for (const value of ['--motion-distance-hover: -0px', '--button-shadow-opacity: 0%', '--button-icon-nudge: 0px', '--glass-opacity: 0%', '--glass-blur: 0px']) assert.ok(css.includes(value), value);
});

test('glass is an explicit Group opt-in and renders through the shared kernel', async () => {
  const groupEngine = new Liquid({fs:{resolve:(_root,name)=>path.resolve('snippets',name+'.liquid'),exists:async()=>true,readFile:async p=>stripShopifyMetadata(fs.readFileSync(p,'utf8'))}});
  groupEngine.registerFilter('asset_url',v=>v);groupEngine.registerFilter('stylesheet_tag',v=>v);
  const source = stripShopifyMetadata(read('snippets/group-content.liquid'));
  const render = settings => groupEngine.parseAndRender(source, {block:{settings},children:'Content',section:{index:1},request:{}});
  assert.doesNotMatch(await render({}), /class="[^"]*theme-glass/);
  assert.match(await render({use_theme_glass:true}), /class="[^"]*theme-glass/);
});
