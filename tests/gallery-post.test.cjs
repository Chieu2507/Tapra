const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');
const Liquid = loadLiquid();
const engine = new Liquid({fs: {
 resolve: (_root, name) => path.resolve('snippets', name + '.liquid'),
 exists: async () => true,
 readFile: async file => stripShopifyMetadata(fs.readFileSync(file, 'utf8')),
}});
engine.registerFilter('placeholder_svg_tag', (name, cls) => `<svg class="${cls}" data-placeholder="${name}"></svg>`);
engine.registerFilter('asset_url', value => `/assets/${value}`);
engine.registerFilter('stylesheet_tag', value => `<link rel="stylesheet" href="${value}">`);
engine.registerFilter('t', value => value);
function defaults(file) {
 const source = fs.readFileSync(file, 'utf8');
 const schema = JSON.parse(source.split('{% schema %}')[1].split('{% endschema %}')[0]);
 return Object.fromEntries(schema.settings.filter(s => 'default' in s).map(s => [s.id, s.default]));
}
const render = settings => engine.parseAndRender(stripShopifyMetadata(fs.readFileSync('blocks/gallery-image.liquid','utf8')), {
 block: { settings: {...defaults('blocks/gallery-image.liquid'), ...settings} },
 settings: {}, section: {index: 3}, request: {page_type:'page'},
});
test('existing overlay defaults retain square media and social overlay', async () => {
 const html = await render({});
 assert.match(html, /gallery-image--style-button/);
 assert.match(html, /gallery-image__overlay/);
 assert.match(html, /--gallery-image-ratio: 1;/);
 assert.doesNotMatch(html, /gallery-image__profile|gallery-image__badge/);
});
test('post cards render escaped editable badges, profile and display-only likes', async () => {
 const html = await render({overlay_style:'post', tag:'@tapra', avatar_initials:'TP', badge_left:'Desk <setup>', badge_right:'Build', show_likes:true, likes_count:'3,307', social_url:'https://www.instagram.com/', image_ratio:'3 / 4'});
 assert.match(html, /gallery-image--post/);
 assert.match(html, /--gallery-image-ratio: 3 \/ 4/);
 assert.match(html, /Desk &lt;setup&gt;/);
 assert.match(html, /gallery-image__username link-underline/);
 assert.match(html, /gallery-image__likes/);
 assert.match(html, /M12 20\.5s-7\.5/);
 assert.match(html, /3,307/);
 assert.doesNotMatch(html, /gallery-image__overlay|<button/);
});
test('post cards without profile content omit the footer', async () => {
 const html = await render({overlay_style:'post',tag:'',show_likes:false});
 assert.doesNotMatch(html, /gallery-image__profile/);
 assert.match(html, /data-placeholder="image"/);
});
test('gallery parallax preset stays editable and does not rely on Custom CSS', () => {
 const source = fs.readFileSync('sections/gallery-image-grid.liquid','utf8');
 const schema = JSON.parse(source.split('{% schema %}')[1].split('{% endschema %}')[0]);
 const gallery = schema.presets.at(-1).blocks.find(b => b.type === 'gallery-grid');
 assert.equal(gallery.settings.layout, 'parallax');
 assert.equal(gallery.settings.columns_desktop, 5);
 assert.equal(gallery.settings.columns_mobile, '2');
 assert.equal(gallery.blocks.length, 15);
 assert(gallery.blocks.every(block => block.type === 'gallery-image' && block.settings.overlay_style === 'post'));
 assert.doesNotMatch(JSON.stringify(schema.presets.at(-1)), /custom_css/);
 const bundle = fs.readFileSync('assets/deferred-template-components.css','utf8');
 assert.match(bundle,/gallery-parallax__column/);
 assert.match(bundle,/gallery-image--post/);
});
test('every preset value matches the owning block schema, including nested blocks', () => {
 const getSchema = file => JSON.parse(fs.readFileSync(file,'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]);
 function validate(block) {
  const schema = getSchema('blocks/'+block.type+'.liquid');
  const fields = Object.fromEntries(schema.settings.filter(s => s.id).map(s => [s.id,s]));
  for (const [key,value] of Object.entries(block.settings || {})) {
   const field = fields[key]; assert(field, block.type+' unknown setting '+key);
   if (field.options) assert(field.options.some(option => option.value === value),block.type+' invalid '+key+': '+value);
   if (field.type === 'range') assert(value >= field.min && value <= field.max && (value-field.min)%field.step === 0,block.type+' invalid range '+key);
   if (field.type === 'richtext' && value) assert.match(value,/^<(p|ul|ol|h[1-6])>/);
  }
  for (const child of block.blocks || []) validate(child);
 }
 for (const block of getSchema('sections/gallery-image-grid.liquid').presets.at(-1).blocks) validate(block);
});

test('Gallery image shares Image ratio and radius options and resolves custom proportions', async () => {
 const schema = p => JSON.parse(fs.readFileSync(p,'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]);
 const gallery = schema('blocks/gallery-image.liquid').settings;
 const image = schema('blocks/image.liquid').settings;
 for (const [a,b] of [['image_ratio','image_ratio_desktop'],['corner_radius','corner_radius']]) {
  assert.deepEqual(gallery.find(s=>s.id===a).options,image.find(s=>s.id===b).options);
 }
 const html = await render({image_ratio:'custom',image_ratio_custom_width:2,image_ratio_custom_height:3,corner_radius:'full'});
 assert.match(html,/--gallery-image-ratio: 0.666/);
 assert.match(html,/--gallery-image-radius: var\(--radius-pill\)/);
});
