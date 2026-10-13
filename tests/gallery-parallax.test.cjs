const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture({itemCount = 15, firstColumns = false, animate = false} = {}) {
 const frames = [], events = new Map(), observers = [], animations = [];
 let sequence = 0;
 const document = {activeElement:null,addEventListener:(name,callback)=>events.set(name,callback)};
 class Node {
  constructor(card=false) { this.card=card;this.children=[];this.parent=null;this.dataset={};this.hidden=false;this.style={values:{},setProperty(k,v){this.values[k]=String(v);},removeProperty(k){delete this.values[k];},getPropertyValue(k){return this.values[k]||'';}};const classes=new Set();this.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k),contains:k=>classes.has(k)};this.listeners=new Map(); }
  append(node){node.remove();node.parent=this;this.children.push(node);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
  querySelectorAll(){return this.children.flatMap(n=>n.card?[n]:n.querySelectorAll());}
  contains(node){return node===this||this.children.some(n=>n.contains(node));}
  hasAttribute(key){return key==='data-gallery-order'&&this.dataset.galleryOrder!==undefined;}
  addEventListener(name,callback,options={}){this.listeners.set(name,callback);options.signal?.addEventListener('abort',()=>this.listeners.delete(name));}
  matches(){return false;}
  get isConnected(){return root.contains(this);}
  focus(){document.activeElement=this;}
  get offsetHeight(){return this.card?400:this.children.length*400+Math.max(0,this.children.length-1)*14;}
 }
 if (animate) {
  Node.prototype.animate = function(keyframes, options) {
   const animation={node:this,keyframes,options,cancelled:false,finished:new Promise(()=>{}),cancel(){this.cancelled=true;}};
   animations.push(animation);return animation;
  };
  Node.prototype.getBoundingClientRect = function() {
   const width=root.dataset.galleryAccessible==='true'?180:308;
   return {left:0,top:root.top,width,height:this.offsetHeight};
  };
 }
 const root=new Node();root.dataset={galleryLayout:'parallax',mobileColumnsMode:firstColumns?'first_columns':'redistribute',parallaxDirection:'alternating'};root.top=1000;root.getBoundingClientRect=()=>({top:root.top,height:parseFloat(root.style.values['--gallery-parallax-rendered-height'])||820});
 Array.from({length:itemCount},(_,index)=>{const n=new Node(true);n.order=index;root.append(n);});
 document.querySelectorAll=()=>[root];document.createElement=()=>new Node();
 const window={innerHeight:1000,listeners:new Map(),addEventListener:Node.prototype.addEventListener};
 const motion={matches:false,listeners:new Map(),addEventListener:Node.prototype.addEventListener};const mobile={matches:false,listeners:new Map(),addEventListener:Node.prototype.addEventListener};
 class Observer{constructor(callback){this.callback=callback;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 const values={'--gallery-grid-columns':'5','--gallery-grid-columns-mobile':'2','--gallery-parallax-stagger':'0px','--gallery-parallax-height':'820px','--gallery-parallax-height-mobile':'640px','--gallery-parallax-distance':'130'};
 const context={window,document,AbortController,matchMedia:query=>query.includes('reduce')?motion:mobile,ResizeObserver:Observer,MutationObserver:Observer,IntersectionObserver:Observer,getComputedStyle:()=>({getPropertyValue:key=>root.style.values[key]||values[key]||''}),requestAnimationFrame:callback=>{frames.push({id:++sequence,callback});return sequence;},cancelAnimationFrame:id=>{const f=frames.find(f=>f.id===id);if(f)f.callback=()=>{};}};
 vm.runInNewContext(fs.readFileSync('assets/gallery-parallax.js','utf8'),context);
 const flush=()=>{let steps=0;while(frames.length){if(++steps>20)throw Error('Animation frame loop');frames.shift().callback();}};flush();
 return {root,window,motion,mobile,document,events,observers,animations,flush};
}
test('parallax preserves all original cards and alternates column movement on scroll',()=>{
 const f=fixture();assert.equal(f.root.children.length,5);assert.equal(f.root.querySelectorAll().length,15);
 const before=f.root.children.map(n=>n.style.transform);assert.notEqual(before[0],before[1]);
 f.root.top=-500;f.window.listeners.get('scroll')();f.flush();
 assert.notEqual(f.root.children[0].style.transform,before[0]);
 assert.equal(f.root.style.values['--gallery-parallax-effective-distance'],'130px');
});
test('mobile redistributes all cards or explicitly hides the later desktop columns',()=>{
 for(const firstColumns of [false,true]) {
  const f=fixture({firstColumns});f.mobile.matches=true;f.mobile.listeners.get('change')();f.flush();
  assert.equal(f.root.children.length,firstColumns?5:2);
  assert.equal(f.root.children.filter(n=>!n.hidden).length,2);
  assert.equal(f.root.querySelectorAll().length,15);
  const visible=f.root.children.filter(n=>!n.hidden).flatMap(n=>n.children);
  assert.equal(visible.length,firstColumns?6:15);
  f.mobile.matches=false;f.mobile.listeners.get('change')();f.flush();
  assert.equal(f.root.children.length,5);assert.equal(f.root.querySelectorAll().length,15);
 }
});
test('short and empty galleries cannot translate away their only content',()=>{
 const f=fixture({itemCount:1});assert.equal(f.root.children.length,1);
 assert.equal(f.root.style.values['--gallery-parallax-effective-distance'],'0px');
 assert.equal(f.root.style.values['--gallery-parallax-rendered-height'],'400px');
 const empty=fixture({itemCount:0});assert.equal(empty.root.classList.contains('is-parallax-ready'),false);
});
test('reduced motion and keyboard focus expose masked cards',()=>{
 const f=fixture({firstColumns:true});f.motion.matches=true;f.motion.listeners.get('change')();f.flush();assert(f.root.children.every(n=>n.style.transform===''));
 f.motion.matches=false;f.document.activeElement=f.root.querySelectorAll()[0];f.root.listeners.get('focusin')();f.flush();assert.equal(f.root.dataset.galleryAccessible,'true');assert(f.root.children.every(n=>n.style.transform===''));

});
test('unload restores source order and removes listeners and observers; reload is idempotent',()=>{
 const f=fixture();const target={contains:n=>n===f.root,querySelectorAll:()=>[f.root]};
 const originalListener=f.window.listeners.get('scroll');f.events.get('shopify:section:load')({target});assert.equal(f.window.listeners.get('scroll'),originalListener);
 f.events.get('shopify:section:unload')({target});f.flush();assert.equal(f.window.listeners.size,0);assert(f.observers.every(o=>o.disconnected));
 assert.deepEqual(f.root.children.map(n=>n.order),Array.from({length:15},(_,i)=>i));assert.equal(f.root.classList.contains('is-parallax-ready'),false);
 f.events.get('shopify:section:load')({target});f.flush();assert.equal(f.root.children.length,5);assert.equal(f.root.querySelectorAll().length,15);
});

test('editor selection reveals all cards and deselection restores parallax even with editor focus',()=>{
 const f=fixture({firstColumns:true});f.window.Shopify={designMode:true};f.mobile.matches=true;f.mobile.listeners.get('change')();f.flush();
 const card=f.root.children[4].children[0];
 f.events.get('shopify:block:select')({target:card});f.document.activeElement=card;f.root.listeners.get('focusin')();f.flush();
 assert.equal(f.root.dataset.galleryAccessible,'true');assert.equal(f.root.children.length,2);
 assert.equal(f.root.children.flatMap(n=>n.children).length,15);assert(f.root.children.every(n=>!n.hidden&&n.style.transform===''));
 f.events.get('shopify:block:deselect')({target:card});f.flush();assert.equal(f.root.dataset.galleryAccessible,'false');assert.equal(f.root.children.length,5);
 assert(f.root.children.filter(n=>!n.hidden).every(n=>n.style.transform!==''));
});
test('revealed fixed-width galleries use fluid tracks without clipping, including the deferred bundle',()=>{
 for(const file of ['assets/component-gallery-parallax.css','assets/deferred-template-components.css']) {
  const css=fs.readFileSync(file,'utf8');const selector=css.match(/\.gallery-grid\[data-gallery-item-sizing=['"]?fixed['"]?\]\[data-gallery-accessible=['"]?true['"]?\]\.is-parallax-ready\s*\{([^}]+)\}/);
  assert(selector,file+' reveal override');assert.match(selector[1],/minmax\(0,\s*1fr\)/);assert.match(selector[1],/overflow:\s*visible/);
 }
});

test('editor layout transitions animate once, cancel on reversal and clean up on unload',()=>{
 const f=fixture({animate:true});f.window.Shopify={designMode:true};const card=f.root.querySelectorAll()[0];
 assert.equal(f.animations.length,0);
 f.events.get('shopify:block:select')({target:card});f.flush();
 assert.equal(f.root.dataset.galleryTransition,'true');assert.equal(f.animations.length,16);
 assert(f.animations.some(a=>a.node===f.root&&a.keyframes[0].height));
 assert(f.animations.filter(a=>a.node!==f.root).every(a=>a.keyframes[0].transform.includes('scale(1.711')));
 const first=[...f.animations];f.window.listeners.get('scroll')();f.flush();assert.equal(f.animations.length,16);
 f.events.get('shopify:block:deselect')({target:card});f.flush();assert(first.every(a=>a.cancelled));assert.equal(f.animations.length,32);
 f.events.get('shopify:section:unload')({target:{contains:n=>n===f.root}});assert(f.animations.every(a=>a.cancelled));assert.equal(f.root.dataset.galleryTransition,undefined);
});
test('reduced motion skips and cancels editor layout transitions',()=>{
 const f=fixture({animate:true});f.window.Shopify={designMode:true};const card=f.root.querySelectorAll()[0];
 f.events.get('shopify:block:select')({target:card});f.flush();assert(f.animations.length>0);
 f.motion.matches=true;f.motion.listeners.get('change')();f.flush();assert(f.animations.every(a=>a.cancelled));
 const count=f.animations.length;f.events.get('shopify:block:deselect')({target:card});f.flush();assert.equal(f.animations.length,count);
});
