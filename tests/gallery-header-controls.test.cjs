const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadLiquid,stripShopifyMetadata}=require('./helpers/liquid-engine.cjs');
const Liquid=loadLiquid();
const engine=new Liquid({fs:{resolve:(_root,name)=>path.resolve('snippets',name+'.liquid'),exists:async()=>true,readFile:async file=>stripShopifyMetadata(fs.readFileSync(file,'utf8'))}});
const render=(file,settings)=>engine.parseAndRender(stripShopifyMetadata(fs.readFileSync(file,'utf8')),{block:{settings},settings:{},request:{design_mode:false}});
test('eyebrow colors and typography are local opt-in controls',async()=>{
 const regular=await render('blocks/eyebrow.liquid',{text:'<p>Instagram</p>'});
 assert.doesNotMatch(regular,/eyebrow-block--custom-type|--eyebrow-font-size/);
 const custom=await render('blocks/eyebrow.liquid',{text:'<p>12K followers</p>',show_background:true,background_color:'#ffffff00',border_color:'#ffffff24',customize_typography:true,font_size:10,font_role:'monospace',text_transform:'uppercase',letter_spacing:.8});
 assert.match(custom,/eyebrow-block--background/);assert.match(custom,/eyebrow-block--custom-type/);assert.match(custom,/--eyebrow-font-size: 10px/);assert.match(custom,/--eyebrow-letter-spacing: 0\.8px/);assert.match(custom,/--eyebrow-background: #ffffff00/);
});
test('button overrides remain opt-in and preserve the shared CTA markup',async()=>{
 const regular=await render('blocks/button.liquid',{button_label:'Follow',button_link:'https://www.instagram.com/',button_style:'tertiary'});
 assert.doesNotMatch(regular,/button-block--custom-radius|button-block--custom-style|button-block--icon-background/);
 const custom=await render('blocks/button.liquid',{button_label:'Follow on Instagram',button_link:'https://www.instagram.com/',button_style:'secondary',corner_radius:'pill',show_icon:true,icon:'arrow_up_right',icon_background_color:'#ffffff2e',icon_padding:10,customize_button_style:true,font_size:14,font_weight:'600',text_transform:'none',button_padding_start:22,button_padding_end:6,icon_gap:14});
 assert.match(custom,/btn-secondary/);assert.match(custom,/button-block--custom-radius/);assert.match(custom,/button-block--icon-background/);assert.match(custom,/--button-block-font-size: 14px/);assert.match(custom,/--button-block-radius: var\(--radius-pill\)/);
});
test('active Instagram header contains four eyebrow blocks and no Custom CSS',()=>{
 const source=fs.readFileSync('templates/index.json','utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const header=JSON.parse(source).sections.instagram_gallery.blocks.insta_1;
 const all=[];function visit(block){all.push(block);Object.values(block.blocks||{}).forEach(visit);}visit(header);
 const eyebrows=all.filter(b=>b.type==='eyebrow');assert.equal(eyebrows.length,4);assert(eyebrows.every(b=>b.settings.show_background));assert.equal(eyebrows.filter(b=>b.settings.show_icon).length,3);assert.doesNotMatch(JSON.stringify(header),/custom_css/);
});
