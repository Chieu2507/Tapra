const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {loadLiquid,stripShopifyMetadata}=require('./helpers/liquid-engine.cjs');
const Liquid=loadLiquid();
const engine=new Liquid();
const blog=stripShopifyMetadata(fs.readFileSync('sections/blog-posts.liquid','utf8'))
 .replace(/{%\s*style\s*%}|{%\s*endstyle\s*%}/g,'')
 .replace(/{%\s*render 'component-stylesheet'[^%]*%}/g,'')
 .replace(/{% content_for 'block', type: 'view-all-button',[\s\S]*?%}/g,'{{ action_markup }}')
 .replace(/{% content_for[\s\S]*?%}/g,'<div>Content</div>');
test('disabled or unavailable Blog action creates no empty flex/grid item',async()=>{
 const html=await engine.parseAndRender(blog,{section:{settings:{},blocks:[]},action_markup:'  \n '});
 assert.doesNotMatch(html,/class="blog-posts__actions"/);
 assert.match(html,/class="blog-posts__list"/);
});
test('available Blog action retains its wrapper and link',async()=>{
 const html=await engine.parseAndRender(blog,{section:{settings:{},blocks:[]},action_markup:'<a href="/blogs/news">View all</a>'});
 assert.match(html,/<div class="blog-posts__actions"><a href="\/blogs\/news">View all<\/a><\/div>/);
});
const source=fs.readFileSync('sections/featured-product.liquid','utf8');
const style=source.slice(source.indexOf('{% capture featured_product_style %}'),source.indexOf('{% assign featured_product_style ='))+'{{ featured_product_style }}';
test('mobile featured product overrides support zero without changing desktop values',async()=>{
 const html=await engine.parseAndRender(style,{section:{settings:{header_gap:48,box_padding_mobile:20,customize_mobile_header_gap:true,header_gap_mobile:0,customize_mobile_box_bottom_padding:true,box_padding_bottom_mobile:0}}});
 assert.match(html,/--featured-product-header-gap: 48px/);
 assert.match(html,/--featured-product-header-gap-mobile: 0px/);
 assert.match(html,/--featured-product-box-padding-bottom-mobile: 0px/);
});
test('disabled mobile overrides preserve legacy featured product fallback',async()=>{
 const html=await engine.parseAndRender(style,{section:{settings:{header_gap:48,box_padding_mobile:20,customize_mobile_header_gap:false,header_gap_mobile:36,customize_mobile_box_bottom_padding:false,box_padding_bottom_mobile:28}}});
 assert.doesNotMatch(html,/--featured-product-header-gap-mobile:|--featured-product-box-padding-bottom-mobile:/);
 assert.match(html,/--featured-product-box-padding-mobile: 20px/);
});
