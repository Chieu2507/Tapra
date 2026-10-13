const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadLiquid,stripShopifyMetadata} = require('./helpers/liquid-engine.cjs');
const Liquid = loadLiquid();
const engine = new Liquid({fs:{resolve:(_root,name)=>path.resolve('snippets',name+'.liquid'),exists:async()=>true,readFile:async p=>stripShopifyMetadata(fs.readFileSync(p,'utf8'))}});
engine.registerFilter('asset_url',v=>v);engine.registerFilter('stylesheet_tag',v=>`<link href="${v}">`);
const schema = p=>JSON.parse(fs.readFileSync(p,'utf8').split('{% schema %}')[1].split('{% endschema %}')[0]);
const source=stripShopifyMetadata(fs.readFileSync('snippets/group-content.liquid','utf8'));
const render=(settings,container_class)=>engine.parseAndRender(source,{container_class,block:{settings},section:{index:1},request:{},children:'<span>A</span><span>B</span>'});
test('horizontal wrap is opt-in and follows the mobile row; mobile stacking remains supported',async()=>{
 const old=await render({direction:'horizontal'});assert.match(old,/--layout-flow-wrap: nowrap/);assert.match(old,/--layout-flow-wrap-mobile: nowrap/);
 const wrapped=await render({direction:'horizontal',wrap:true});assert.match(wrapped,/--layout-flow-wrap: wrap/);assert.match(wrapped,/--layout-flow-wrap-mobile: wrap/);assert.match(wrapped,/<span>A<\/span><span>B<\/span>/);
 const stacked=await render({direction:'horizontal',wrap:true,customize_mobile_alignment:true});assert.match(stacked,/--layout-flow-direction-mobile: column/);
 const vertical=await render({direction:'vertical',wrap:true});assert.match(vertical,/--layout-flow-wrap: nowrap/);
});
test('Gallery header and Group share every common setting and one renderer',()=>{
 const g=schema('blocks/group.liquid').settings;const h=schema('blocks/gallery-header-group.liquid').settings;
 for(const field of g.filter(s=>s.id))assert.deepEqual(h.find(s=>s.id===field.id),field);
 for(const p of ['blocks/group.liquid','blocks/gallery-header-group.liquid'])assert.match(fs.readFileSync(p,'utf8'),/render 'group-content'/);
});
test('Instagram tags are three direct eyebrows in one wrapping group',()=>{
 const raw=fs.readFileSync('templates/index.json','utf8');const j=JSON.parse(raw.slice(raw.indexOf('{')));
 let tags;const walk=b=>{for(const [k,v] of Object.entries(b||{})){if(k==='instagram_tags')tags=v;walk(v.blocks);}};walk(j.sections.instagram_gallery.blocks);
 assert(tags);assert.equal(tags.settings.direction,'horizontal');assert.equal(tags.settings.wrap,true);assert.equal(Object.keys(tags.blocks).length,3);assert(Object.values(tags.blocks).every(b=>b.type==='eyebrow'));
});

test('page container stays outside Group so Group padding cannot remove page margins', async()=>{
 const html=await render({direction:'vertical',width:'fill'},'gallery-header-group container page-width');
 assert.match(html,/<div class="gallery-header-group container page-width">\s*<div\s+class="group /);
 assert.doesNotMatch(html,/class="group [^"]*container/);
});
