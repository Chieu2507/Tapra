const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
class Element {
 constructor(classes = '', top = 0) {
  this.classList = new Set(classes.split(' ').filter(Boolean));
  const add=this.classList.add.bind(this.classList);
  this.classList.add=(...names)=>names.forEach(add);
  this.classList.contains = this.classList.has.bind(this.classList);
  this.classList.remove = (...names) => names.forEach(n => this.classList.delete(n));
  this.children = []; this.listeners = {}; this.top = top; this.dataset = {}; this.isConnected = true;
  this.style = {setProperty(k,v) {this[k]=v;}};
 }
 set className(s) { s.split(' ').forEach(n=>this.classList.add(n)); }
 cloneNode() {const copy=new Element([...this.classList].join(' '),this.top);Object.assign(copy.style,this.style);Object.assign(copy.dataset,this.dataset);return copy;}
 setAttribute() {}
 append(el) { if(el.parent) el.parent.children=el.parent.children.filter(c=>c!==el); this.children.push(el); el.parent=this; }
 remove() {this.parent.children=this.parent.children.filter(c=>c!==this);}
 getBoundingClientRect() {return {top:this.top,height:100,width:1000};}
 addEventListener(name,cb,opts={}) { (this.listeners[name] ||= []).push(cb); opts.signal?.addEventListener('abort',()=>{this.listeners[name]=this.listeners[name].filter(f=>f!==cb);},{once:true}); }
 fire(name,event={}) {(this.listeners[name]||[]).forEach(f=>f(event));}
 querySelectorAll() {return [];}
 querySelector(selector) {return selector==='.ce-item__preview' ? this.children.find(c=>c.classList.contains('ce-item__preview')) : null;}
 closest(selector) {return selector==='.ce-item' && this.classList.contains('ce-item') ? this : null;}
 matches() {return false;}
 contains(el) {return this===el || this.children.some(c=>c.contains(el));}
}
function fixture(images=[]) {
 const list=new Element(), section=new Element(); section.dataset.ceParallax='none';
 const rows=[0,100,200].map(top=>new Element('ce-item',top));
 const previews=rows.map((row,i)=>{const p=new Element('ce-item__preview');if(images[i])p.querySelectorAll=()=>[images[i]];row.append(p);list.append(row);return p;});
 list.querySelectorAll=()=>rows; section.querySelectorAll=()=>[list]; section.append(list);
 const doc=new Element();doc.readyState='complete';doc.querySelectorAll=()=>[section];doc.createElement=()=>new Element();
 let seq=0;const frames=new Map(),timers=new Map(); const flush=()=>{const batch=[...frames.values()];frames.clear();batch.forEach(cb=>cb());};
 vm.runInNewContext(fs.readFileSync('assets/collection-editorial.js','utf8'),{window:{},document:doc,AbortController,getComputedStyle:()=>({transitionDuration:'0.45s',clipPath:'inset(0px 0px 42%)'}),setTimeout:(cb,delay)=>{timers.set(++seq,{cb,delay});return seq;},clearTimeout:id=>timers.delete(id),ResizeObserver:class{observe(){} disconnect(){}},matchMedia:()=>({matches:false,addEventListener(){}}),requestAnimationFrame:cb=>{frames.set(++seq,cb);return seq;},cancelAnimationFrame:id=>frames.delete(id)});
 const stage=list.children.find(c=>c.classList.contains('ce-preview-stage'));
 return {list,section,rows,previews,doc,stage,flush,frames,timers,settle:()=>{const batch=[...timers.values()];timers.clear();batch.forEach(t=>t.cb());}};
}
test('incoming preview wipes over the previous image, leaves upward and restores markup on editor unload',()=>{
 const {list,section,rows,previews,doc,stage,flush,frames,settle,timers}=fixture();
 assert.equal(stage.children.length,3);
 list.fire('pointerover',{pointerType:'mouse',target:rows[0]});flush();
 assert(previews[0].classList.contains('is-current'));
 stage.fire('transitionend',{propertyName:'clip-path',target:previews[0]});
 list.fire('pointerover',{pointerType:'mouse',target:rows[1]});
 assert(previews[0].classList.contains('is-visible'));
 flush();assert(previews.slice(0,2).every(p=>p.classList.contains('is-visible')));
 assert(+previews[1].style.zIndex>+previews[0].style.zIndex);
 settle();
 assert(!previews[0].classList.contains('is-visible'));
 list.fire('pointerleave');assert(previews[1].classList.contains('is-leaving'));
 doc.fire('shopify:section:unload',{target:section});
 assert(!list.children.includes(stage));
 rows.forEach((row,i)=>assert(row.children.includes(previews[i])));
 assert.equal(frames.size,0);assert.equal(timers.size,0);
});

test('rapid hover matches the reference: immediate new top layer, old stack retained for 600ms',()=>{
 const {list,rows,previews,flush,timers,settle}=fixture();
 const hover=i=>{list.fire('pointerover',{pointerType:'mouse',target:rows[i]});flush();};
 hover(0);hover(1);hover(2);
 assert(previews[2].classList.contains('is-current'));
 assert(previews.every(p=>p.classList.contains('is-visible')));
 assert.equal(timers.size,1);
 assert.equal([...timers.values()][0].delay,600);
 hover(0);
 assert(previews[0].classList.contains('is-current'));
 assert(+previews[0].style.zIndex>+previews[2].style.zIndex);
 settle();
 assert(previews[0].classList.contains('is-visible'));
 assert(!previews[1].classList.contains('is-visible'));
 assert(!previews[2].classList.contains('is-visible'));
});
test('leave cancels cleanup and re-entry starts immediately without reviving an obsolete target',()=>{
 const {list,rows,previews,flush,timers}=fixture();
 const hover=i=>{list.fire('pointerover',{pointerType:'mouse',target:rows[i]});flush();};
 hover(0);hover(2);list.fire('pointerleave');
 assert.equal(timers.size,0);
 assert(previews[2].classList.contains('is-leaving'));
 assert(!previews[2].classList.contains('is-visible'));
 hover(1);assert(previews[1].classList.contains('is-current'));
});
test('preview wipe follows row direction without delaying rapid changes',()=>{
 const {list,rows,previews,flush}=fixture();
 const hover=i=>{list.fire('pointerover',{pointerType:'mouse',target:rows[i]});flush();};
 hover(1);assert.equal(previews[1].dataset.ceRevealFrom,'top');
 hover(2);assert.equal(previews[2].dataset.ceRevealFrom,'bottom');
 hover(0);assert.equal(previews[0].dataset.ceRevealFrom,'top');
 assert(previews[0].classList.contains('is-current'));
 assert(rows[0].classList.contains('is-preview-active'));
 assert(!rows[1].classList.contains('is-preview-active'));
});
test('hovering another row revokes editor preview until that row is explicitly selected again',()=>{
 const {list,section,rows,previews,flush}=fixture();
 section.fire('shopify:block:select',{target:rows[0]});flush();
 assert(rows[0].classList.contains('is-editor-selected'));
 list.fire('pointerover',{pointerType:'mouse',target:rows[1]});flush();
 assert(!rows[0].classList.contains('is-editor-selected'));
 assert(rows[0].classList.contains('is-editor-suppressed'));
 assert(!rows[0].classList.contains('is-preview-active'));
 assert(rows[1].classList.contains('is-preview-active'));
 list.fire('pointerleave');flush();
 assert(!previews.some(p=>p.classList.contains('is-current')),'sidebar selection must not reactivate on leave');
 section.fire('shopify:block:select',{target:rows[0]});flush();
 assert(rows[0].classList.contains('is-editor-selected'));
 assert(!rows[0].classList.contains('is-editor-suppressed'));
 assert(previews[0].classList.contains('is-current'));
 assert(rows[0].classList.contains('is-preview-active'));
 assert(!rows[1].classList.contains('is-preview-active'));
});

test('returning to a still-visible image preserves its painted clip before resetting it',()=>{
 const {list,rows,previews,stage,flush,settle}=fixture();
 const hover=i=>{list.fire('pointerover',{pointerType:'mouse',target:rows[i]});flush();};
 hover(0);hover(1);hover(0);
 const backing=stage.children.filter(p=>!previews.includes(p) && !p.classList.contains('is-preview-backing'));
 assert.equal(backing.length,1);
 assert.equal(backing[0].style.clipPath,'inset(0px 0px 42%)');
 assert.equal(backing[0].style.transition,'none');
 assert(+backing[0].style.zIndex<+previews[0].style.zIndex);
 settle();assert.equal(stage.children.length,4);
});
test('fast re-entry retains its backing until the new reveal completes',()=>{
 const {list,rows,previews,stage,flush,settle}=fixture();
 list.fire('pointerover',{pointerType:'mouse',target:rows[0]});flush();
 list.fire('pointerleave');assert(stage.classList.contains('is-exiting'));
 list.fire('pointerover',{pointerType:'mouse',target:rows[0]});flush();
 assert(!stage.classList.contains('is-exiting'));
 assert(stage.children.some(p=>!previews.includes(p) && !p.classList.contains('is-preview-backing')));
 settle();assert.equal(stage.children.length,4);
});

test('real images decode before revealing and late decode cannot revive an obsolete hover',async()=>{
 let firstReady,secondReady;
 const first={loading:'lazy',decode:()=>new Promise(resolve=>{firstReady=resolve;})};
 const second={loading:'lazy',decode:()=>new Promise(resolve=>{secondReady=resolve;})};
 const {list,rows,previews,stage,flush}=fixture([first,second]);
 list.fire('pointerover',{pointerType:'mouse',target:rows[0]});
 list.fire('pointerover',{pointerType:'mouse',target:rows[1]});
 assert.equal(first.loading,'eager');assert.equal(second.loading,'eager');
 assert(!previews.some(p=>p.classList.contains('is-current')));
 firstReady();await new Promise(setImmediate);flush();
 assert(!previews[0].classList.contains('is-current'));
 secondReady();await new Promise(setImmediate);flush();
 assert(previews[1].classList.contains('is-current'));
 const base=stage.children.find(p=>p.classList.contains('is-preview-backing'));
 assert.equal(base.style.clipPath,'inset(0)');
 assert.equal(base.style.zIndex,'0');
});
test('opposite directional wipes retain an opaque base through rapid reversals',()=>{
 const {list,rows,stage,flush,settle}=fixture();
 for(const index of [0,1,2,1,0,2]) {
  list.fire('pointerover',{pointerType:'mouse',target:rows[index]});flush();
  const base=stage.children.find(p=>p.classList.contains('is-preview-backing'));
  assert.equal(base.style.clipPath,'inset(0)');
 }
 settle();assert.equal(stage.children.length,4,'only the originals and one stable base remain');
});
test('scroll activates the row under a stationary pointer and clears it when the list moves away',()=>{
 const {list,rows,previews,doc,flush}=fixture();
 list.fire('pointerover',{pointerType:'mouse',clientX:700,clientY:250,target:rows[0]});flush();
 assert(previews[0].classList.contains('is-current'));
 doc.elementFromPoint=(x,y)=>{assert.equal(x,700);assert.equal(y,250);return rows[1];};
 doc.fire('scroll');flush();flush();
 assert(previews[1].classList.contains('is-current'));
 assert(rows[1].classList.contains('is-pointer-active'));
 assert(!rows[0].classList.contains('is-pointer-active'));
 doc.elementFromPoint=()=>null;
 doc.fire('scroll');flush();
 assert(!previews.some(p=>p.classList.contains('is-current')));
});
test('pointer leave and editor unload cancel scroll hit testing',()=>{
 const {list,rows,section,doc,frames,flush}=fixture();
 list.fire('pointerover',{pointerType:'mouse',clientX:700,clientY:250,target:rows[0]});flush();
 doc.elementFromPoint=()=>rows[1];doc.fire('scroll');
 doc.fire('pointerleave');assert.equal(frames.size,0);
 doc.fire('scroll');assert.equal(frames.size,0);
 list.fire('pointerover',{pointerType:'mouse',clientX:700,clientY:250,target:rows[0]});
 doc.fire('scroll');doc.fire('shopify:section:unload',{target:section});
 assert.equal(frames.size,0);
 assert(!list.classList.contains('is-pointer-tracked'));
});
