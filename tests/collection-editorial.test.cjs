const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadLiquid,stripShopifyMetadata}=require('./helpers/liquid-engine.cjs');
const source=file=>fs.readFileSync(file,'utf8');
const schema=file=>JSON.parse(source(file).split('{% schema %}')[1].split('{% endschema %}')[0]);
const defaults=file=>Object.fromEntries(schema(file).settings.filter(s=>'default'in s).map(s=>[s.id,s.default]));
const engine=new(loadLiquid())({fs:{resolve:(_r,f)=>path.resolve('snippets',f+'.liquid'),exists:async()=>true,readFile:async f=>stripShopifyMetadata(source(f))}});
engine.registerFilter('placeholder_svg_tag',(name,cls)=>`<svg class="${cls||''}" data-placeholder="${name}"></svg>`);
engine.registerFilter('t',key=>key==='collection_editorial.collection_title'?'Collection title':key);
engine.registerFilter('image_url',(img,args)=>'/image/'+img.id);
engine.registerFilter('image_tag',url=>`<img src="${url}" alt="">`);
const item=(settings={})=>engine.parseAndRender(stripShopifyMetadata(source('blocks/_collection-editorial-item.liquid')),{block:{settings,shopify_attributes:'data-editor-item="one"'},section:{index:3},request:{}});
async function list(settings,children){return engine.parseAndRender(stripShopifyMetadata(source('blocks/_collection-editorial-list.liquid')).replace(/{% content_for 'blocks' %}/,'{{ children }}'),{block:{settings:{...defaults('blocks/_collection-editorial-list.liquid'),...settings}},children});}
async function content(role,settings){return engine.parseAndRender("{% render 'collection-editorial-content', block: block, role: role %}",{role,block:{settings},request:{design_mode:true},section:{index:3}});}
test('resource rows use custom title, resource URL/count and a separate decorative preview',async()=>{
 const html=await item({custom_title:'Keyboards <special>',collection:{title:'Original',url:'/collections/keyboards',all_products_count:12,featured_image:{id:1}}});
 assert.match(html,/<a href="\/collections\/keyboards"/);assert.match(html,/Keyboards &lt;special&gt;/);assert.match(html,/ce-item__count">12/);assert.match(html,/ce-item__preview" aria-hidden="true"/);assert.equal((html.match(/data-editor-item/g)||[]).length,1);
});
test('empty collection stays useful without a dead link or invented product count',async()=>{
 const html=await item();assert.match(html,/<div class="ce-item(?: surface-light)?"/);assert.match(html,/Collection title/);assert.doesNotMatch(html,/href=|ce-item__count/);
});
test('parent list renders semantic title tags and controls count/navigation without JavaScript',async()=>{
 const children=await item({collection:{title:'Boards',url:'/collections/boards',all_products_count:3}});
 for(const tag of ['div','h1','h2','h3','h4','h5','h6']){
  const html=await list({html_tag:tag,show_product_count:false,show_navigation_icon:false},children);
  assert.match(html,new RegExp('<'+tag+' class="ce-item__title">Boards</'+tag+'>'));assert.doesNotMatch(html,/ce-title-tag/);assert.match(html,/data-ce-count="false" data-ce-navigation="false"/);
 }
});
test('mobile padding zero survives a nonzero desktop setting',async()=>{
 const html=await content('text',{text:'<p>Words</p>',font:'body',text_size:'md',padding_top:40,padding_bottom:30,customize_mobile_padding:true,padding_top_mobile:0,padding_bottom_mobile:0});
 assert.match(html,/--ce-pt:40px/);assert.match(html,/--ce-pt-mobile:0px/);assert.match(html,/--ce-pb-mobile:0px/);
});
test('editorial markers preserve the shared progressive text controller and inline image links',async()=>{
 const html=await content('rich',{text:'Story [img1] here [img2]',heading_size:'xl',show_image_1:true,image_1:{id:2},image_link_1:'/pages/story',image_new_tab_1:true,image_width_1:150,image_width_mobile_1:100,show_image_2:false,enable_scroll_reveal:true,start_opacity:30,scroll_speed:'slow'});
 assert.match(html,/<lh-editorial-text/);assert.match(html,/data-editorial-reveal="true"/);assert.match(html,/editorial-text-block__base/);assert.match(html,/href="\/pages\/story"/);assert.match(html,/target="_blank"/);assert.doesNotMatch(html,/\[img[12]\]/);
});
test('rich button labels are opt-in; existing callers continue escaping text',async()=>{
 for(const rich of [false,true]){
  const html=await engine.parseAndRender("{% render 'theme-button', label: label, label_html: rich, url: '/collections/all' %}",{label:'<strong>View all</strong>',rich});
  assert.match(html,rich?/<strong>View all<\/strong>/:/&lt;strong&gt;View all&lt;\/strong&gt;/);
 }
});
test('fixed slots, strict child roles and all preset values remain valid',()=>{
 const sec=schema('sections/collection-list-editorial.liquid');assert.deepEqual(sec.enabled_on.templates,['index']);assert(!sec.settings.some(s=>/anchor/.test(s.id||'')));
 const roles=schema('blocks/_collection-editorial-header.liquid').blocks.map(b=>b.type);assert.equal(roles.length,5);
 const walk=b=>{const sch=schema('blocks/'+b.type+'.liquid');const fields=Object.fromEntries(sch.settings.filter(s=>s.id).map(s=>[s.id,s]));for(const[k,v]of Object.entries(b.settings||{})){const f=fields[k];assert(f,b.type+':'+k);if(f.options)assert(f.options.some(o=>o.value===v));if(f.type==='range')assert(v>=f.min&&v<=f.max&&(v-f.min)%f.step===0);}for(const child of b.blocks||[])walk(child);};sec.presets[0].blocks.forEach(walk);
 for(const name of fs.readdirSync('blocks').filter(f=>f.startsWith('_collection-editorial-'))){const sch=schema('blocks/'+name);for(const f of sch.settings){if(f.options)assert(f.options.some(o=>o.value===f.default),name+':'+f.id);if(f.type==='range')assert((f.default-f.min)%f.step===0,name+':'+f.id);}}
});

test("late home placement includes Editorial styles in the shared deferred bundle",()=>{
 assert.match(source("assets/deferred-template-components.css"),/\.ce-item__preview/);
 assert.match(source("assets/deferred-template-components.css"),/\.ce-content--rich/);
});
const sectionRender=overrides=>engine.parseAndRender(stripShopifyMetadata(source('sections/collection-list-editorial.liquid')).replace(/{%\s*content_for[^%]*%}/g,'').replace(/{%\s*style\s*%}/g,'<style>').replace(/{%\s*endstyle\s*%}/g,'</style>'),{section:{id:'editorial-audit',index:1,settings:{...defaults('sections/collection-list-editorial.liquid'),...overrides}},settings:{color_schemes:{'scheme-1':{settings:{background:'#ffffff'}}}},request:{page_type:'index'}});
test('section exposes canonical Layout, Appearance and final Padding groups',()=>{
 const fields=schema('sections/collection-list-editorial.liquid').settings;
 assert.deepEqual(fields.filter(f=>f.type==='header').map(f=>f.content),['t:general.layout','t:general.gap','t:general.appearance','t:general.padding']);
 const ids=fields.filter(f=>f.id).map(f=>f.id);
 assert.deepEqual(ids.slice(-5),['padding_top','padding_bottom','customize_mobile_padding','padding_top_mobile','padding_bottom_mobile']);
 assert.equal(ids.indexOf('background_color'),ids.indexOf('color_scheme')+1);
 assert.equal(fields.find(f=>f.id==='mobile_alignment').visible_if,'{{ section.settings.customize_mobile_alignment }}');
 for(const id of ['desktop_alignment','mobile_alignment'])assert.equal(fields.find(f=>f.id===id).type,'text_alignment');
});
test('mobile alignment inherits desktop until explicitly customized',async()=>{
 let html=await sectionRender({desktop_alignment:'right',mobile_alignment:'left',customize_mobile_alignment:false});
 assert.match(html,/data-ce-align="right" data-ce-align-mobile="right"/);
 html=await sectionRender({desktop_alignment:'right',mobile_alignment:'center',customize_mobile_alignment:true});
 assert.match(html,/data-ce-align="right" data-ce-align-mobile="center"/);
});
test('section spacing uses the shared surface, preserves mobile zero and inherits desktop when disabled',async()=>{
 let html=await sectionRender({padding_top:80,padding_bottom:60,customize_mobile_padding:true,padding_top_mobile:0,padding_bottom_mobile:0});
 assert.match(html,/class="section-spacing collection-editorial-section/);assert.doesNotMatch(html,/<section\b/);
 assert.match(html,/--section-padding-top:80px/);assert.match(html,/--section-padding-top-mobile:0px/);
 html=await sectionRender({padding_top:80,customize_mobile_padding:false,padding_top_mobile:0});
 assert.doesNotMatch(html,/--section-padding-top-mobile/);
});
test('background override covers the Shopify wrapper while retaining the selected scheme tokens',async()=>{
 const html=await sectionRender({background_color:'#112233',section_width:'page_width'});
 assert.match(html,/#shopify-section-editorial-audit \{ background: #112233;/);assert.match(html,/--ce-background:#112233/);assert.match(html,/section-color-scope scheme-1/);assert.match(html,/container page-width ce-section-stack/);
 const fallback=await sectionRender({background_color:''});assert.match(fallback,/--ce-background:#ffffff/);
 const bleed=await sectionRender({section_width:'full_bleed'});assert.match(bleed,/container full-width ce-section-stack ce-full-bleed/);
});
test('Collection title shares Heading visual options, custom size bounds and HTML Tag labels',()=>{
 const fields=Object.fromEntries(schema('blocks/_collection-editorial-list.liquid').settings.filter(f=>f.id).map(f=>[f.id,f]));
 const heading=Object.fromEntries(schema('blocks/heading.liquid').settings.filter(f=>f.id).map(f=>[f.id,f]));
 for(const id of ['heading_size','heading_size_mobile'])assert.deepEqual(fields[id].options,heading.heading_size.options);
 assert.equal(fields.heading_size.label,'t:labels.heading_size');assert.equal(fields.heading_size_mobile.label,'t:labels.mobile_size');
 for(const key of ['min','max','step','unit','default']){assert.equal(fields.custom_heading_size[key],heading.custom_heading_size[key]);assert.equal(fields.custom_heading_size_mobile[key],heading.custom_heading_size[key]);}
 assert.deepEqual(fields.html_tag.options,heading.html_tag.options);assert.equal(fields.html_tag.label,heading.html_tag.label);assert.equal(fields.html_tag.info,heading.html_tag.info);
});
test('custom desktop and mobile Collection title sizes stay independent from HTML semantics',async()=>{
 const child=await item({custom_title:'Custom collection'});
 const html=await list({heading_size:'custom',custom_heading_size:58,heading_size_mobile:'custom',custom_heading_size_mobile:28,html_tag:'h3'},child);
 assert.match(html,/--ce-title-size:58px/);assert.match(html,/--ce-title-size-mobile:28px/);assert.match(html,/<h3 class="ce-item__title">Custom collection<\/h3>/);
});
test('Collection corner radius shares all Image options and resolves every preset',async()=>{
 const fields=schema('blocks/_collection-editorial-list.liquid').settings;
 const canonical=schema('blocks/image.liquid').settings;
 assert.deepEqual(fields.find(f=>f.id==='corner_radius').options,canonical.find(f=>f.id==='corner_radius').options);
 for(const [value,expected]of [['square','var(--radius-square)'],['rounded','var(--radius-rounded)'],['full','var(--radius-pill)'],... [2,4,6,8,12,16,24,32].map(n=>['radius_'+n,'var(--radius-'+n+')']),['custom','17px']]){
  const html=await list({corner_radius:value,custom_corner_radius:17},'');assert(html.includes('--ce-radius:'+expected+';'),value);
 }
});
test('navigation picker renders every icon and button treatment without nested interactive elements',async()=>{
 const child=await item({collection:{title:'Boards',url:'/collections/boards'}});
 const fields=schema('blocks/_collection-editorial-list.liquid').settings;
 for(const id of ['navigation_icon','navigation_style'])assert.equal(fields.find(f=>f.id===id).visible_if,'{{ block.settings.show_navigation_icon }}');
 for(const option of fields.find(f=>f.id==='navigation_icon').options){
  for(const style of ['icon','button']){
   const html=await list({show_navigation_icon:true,navigation_icon:option.value,navigation_style:style},child);
   assert.match(html,/ce-item__icon/);assert.match(html,/<svg/);assert.doesNotMatch(html,/<button\b|data-ce-navigation-slot/);assert.equal((html.match(/<a\b/g)||[]).length,1);
   if(style==='button')assert.match(html,/<span class="btn btn-primary[^\"]*btn--icon/);
   else assert.doesNotMatch(html,/btn-primary/);
  }
 }
 const hidden=await list({show_navigation_icon:false},child);assert.doesNotMatch(hidden,/ce-item__icon|data-ce-navigation-slot/);
});
test('numbering follows rendered child order and disappears completely when disabled',async()=>{
 const rows=(await item({custom_title:'Last added'}))+(await item({custom_title:'First added'}));
 const html=await list({show_numbers:true,number_padding_right:0,number_padding_right_mobile:18},rows);
 assert.match(html,/ce-item__number" aria-hidden="true">01<\/span>\s*<div class="ce-item__text"><div class="ce-item__title">Last added/);
 assert.match(html,/ce-item__number" aria-hidden="true">02<\/span>\s*<div class="ce-item__text"><div class="ce-item__title">First added/);
 assert.match(html,/--ce-number-gap:0px/);assert.match(html,/--ce-number-gap-mobile:18px/);
 assert.doesNotMatch(html,/data-ce-number-slot/);
 assert.doesNotMatch(await list({show_numbers:false},rows),/class="ce-item__number"|data-ce-number-slot/);
});
test('news rows support a custom destination and escape descriptions',async()=>{
 const html=await item({custom_title:'Guide',custom_link:'/blogs/news/guide',description:'Small <script>story</script>',collection:{url:'/collections/boards'}});
 assert.match(html,/<a href="\/blogs\/news\/guide"/);assert.match(html,/Small &lt;script&gt;story&lt;\/script&gt;/);
});
test('configured News reuses Editorial and all its settings satisfy their owning schemas',()=>{
 const file=source('templates/index.json');const news=JSON.parse(file.slice(file.indexOf('{'))).sections.news;
 assert.equal(news.type,'collection-list-editorial');
 const verify=(node,file)=>{const fields=Object.fromEntries(schema(file).settings.filter(f=>f.id).map(f=>[f.id,f]));for(const[id,value]of Object.entries(node.settings||{})){const f=fields[id];assert(f,file+':'+id);if(f.options)assert(f.options.some(o=>o.value===value),id);if(f.type==='range')assert(value>=f.min&&value<=f.max&&(value-f.min)%f.step===0,id);}for(const block of Object.values(node.blocks||{}))verify(block,'blocks/'+block.type+'.liquid');};
 verify(news,'sections/collection-list-editorial.liquid');assert.equal(news.blocks['collection-list'].block_order.length,6);
});
