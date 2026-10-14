const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function fixture({hasSummary=false,initialActive=false,motionDuration="600ms"}={}){
 const frames=new Map(),timers=new Map(),observers=[];let id=0,now=0,reads=0,writes=0,height=50;
 class Node{
  constructor(){this.listeners=new Map();this.dataset={};this.values={};this.style={getPropertyValue:k=>this.values[k]||'',setProperty:(k,v)=>{writes++;this.values[k]=String(v);}};const classes=new Set();this.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)};}
  addEventListener(k,f){const a=this.listeners.get(k)||[];a.push(f);this.listeners.set(k,a);}
  emit(k,e={target:{closest:()=>null}}){(this.listeners.get(k)||[]).forEach(f=>f(e));}
  querySelectorAll(){return [];}
 }
 const surface=new Node();Object.defineProperty(surface,'offsetHeight',{get(){reads++;return 200;}});
 const summary=new Node();summary.tagName='SUMMARY';summary.parentElement={open:initialActive};let clicks=0;summary.click=()=>{clicks++;summary.parentElement.open=true;};
 const drawer=new Node();drawer.querySelectorAll=s=>hasSummary&&(s==='[data-mobile-drawer-details] > summary'||s.includes('.header__mobile-drawer-item > a'))?[summary]:[];drawer.dataset.state='open';drawer.querySelector=s=>s==='.header__mobile-drawer-surface'?surface:null;
 const root=new Node();root.classList.add('header-top--menu-open');root.querySelector=()=>drawer;root.getBoundingClientRect=()=>({height});root.contains=()=>false;
 const document=new Node();document.readyState='complete';document.querySelectorAll=()=>[root];document.querySelector=()=>null;
 const window=new Node();window.innerWidth=1200;
 class Observer{constructor(callback){this.callback=callback;this.targets=[];observers.push(this);}observe(n){this.targets.push(n);}disconnect(){this.disconnected=true;}}
 vm.runInNewContext(fs.readFileSync('assets/header-compact.js','utf8'),{document,window,AbortController,ResizeObserver:Observer,requestAnimationFrame:f=>{frames.set(++id,f);return id;},cancelAnimationFrame:i=>frames.delete(i),setTimeout:(f,delay)=>{timers.set(++id,{f,delay});return id;},clearTimeout:i=>timers.delete(i),performance:{now:()=>now},getComputedStyle:()=>({getPropertyValue:()=>motionDuration,paddingTop:'0px',paddingBottom:'0px',borderTopWidth:'0px',borderBottomWidth:'0px'})});
 const flush=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(f=>f());};
 return {root,drawer,document,observers,flush,summary,timers,flushTimers:()=>{const pending=[...timers.values()];timers.clear();pending.forEach(t=>t.f());},clicks:()=>clicks,setNow:v=>now=v,setHeight:v=>height=v,reads:()=>reads,writes:()=>writes,frames};
}
test('quick pointer crossings retain the active panel; dwelling selects after 160ms',()=>{
 const f=fixture({hasSummary:true,initialActive:true});f.flush();f.summary.parentElement.open=false;
 f.summary.emit('pointerenter');assert.equal(f.clicks(),0);assert.equal([...f.timers.values()][0].delay,160);
 f.summary.emit('pointerleave');f.flushTimers();assert.equal(f.clicks(),0);
 f.summary.emit('pointerenter');f.flushTimers();assert.equal(f.clicks(),1);
});
test('closing or unloading cancels pending hover, while keyboard focus selects immediately',()=>{
 for(const action of ['closing','unload','focus']){
  const f=fixture({hasSummary:true,initialActive:true});f.flush();f.summary.parentElement.open=false;f.summary.emit('pointerenter');
  if(action==='closing')f.drawer.emit('closing');
  else if(action==='unload')f.document.emit('shopify:section:unload',{target:{contains:n=>n===f.root}});
  else f.summary.emit('focus');
  f.flushTimers();assert.equal(f.clicks(),action==='focus'?1:0);
 }
});
test('content measurement is coalesced and repeated unchanged writes are avoided',()=>{
 const f=fixture();f.drawer.emit('open');for(let i=0;i<20;i++)f.observers[0].callback();assert.equal(f.frames.size,1);f.flush();assert.equal(f.reads(),1);
 const writes=f.writes();f.observers[0].callback();f.flush();assert.equal(f.writes(),writes);
});
test('shell animation frames move utilities without remeasuring menu contents',()=>{
 const f=fixture();f.drawer.emit('open');f.flush();const reads=f.reads();
 for(let i=0;i<20;i++){f.setHeight(50+i*10);f.observers[1].callback();f.flush();}
 assert.equal(f.reads(),reads);assert.equal(f.root.values['--compact-footer-shift'],'-24px');
});
test('opening keeps the 600ms curve; subsequent panel changes can use fast sizing',()=>{
 const f=fixture();f.drawer.emit('open');f.drawer.emit('click');f.flush();assert.equal(f.root.classList.contains('header-compact--fast'),false);
 f.setNow(700);f.drawer.emit('click');assert.equal(f.root.classList.contains('header-compact--fast'),true);
});
test('Compact JS timing follows the inherited surface duration in seconds',()=>{
 const f=fixture({motionDuration:'0.9s'});f.drawer.emit('open');f.setNow(700);f.drawer.emit('click');assert.equal(f.root.classList.contains('header-compact--fast'),false);
 f.setNow(1000);f.drawer.emit('click');assert.equal(f.root.classList.contains('header-compact--fast'),true);assert.ok([...f.timers.values()].some(t=>t.delay===900));
});
test('closing preserves target measurements and unload cancels queued work',()=>{
 const f=fixture();f.drawer.emit('open');f.flush();const target=f.root.values['--compact-shell-height'];
 f.drawer.dataset.state='closing';f.observers[0].callback();f.flush();assert.equal(f.root.values['--compact-shell-height'],target);
 f.observers[0].callback();f.observers[1].callback();f.document.emit('shopify:section:unload',{target:{contains:n=>n===f.root}});assert.equal(f.frames.size,0);assert(f.observers.every(o=>o.disconnected));
});

test('late Compact initialization recovers an already-open menu without waiting for another click',()=>{
 const f=fixture({hasSummary:true});f.flush();assert.equal(f.summary.parentElement.open,true);assert.equal(f.clicks(),1);assert.equal(f.root.values['--compact-shell-height'],'264px');
 const selected=fixture({hasSummary:true,initialActive:true});selected.flush();assert.equal(selected.clicks(),0);assert.equal(selected.summary.parentElement.open,true);
});
test('primary header selects the first Compact submenu without depending on the deferred enhancement',()=>{
 const source=fs.readFileSync('assets/header.js','utf8');const start=source.indexOf('  const prepareCompactMenu =');const end=source.indexOf('  const setHeaderMenuState =',start);
 const window={innerWidth:1920};const context={window};vm.runInNewContext(source.slice(start,end)+';this.prepare=prepareCompactMenu;',context);
 let clicks=0,active=false;const drawer={querySelector:s=>s.endsWith('[open]')?(active?{}:null):{click(){clicks++;active=true;}}};
 context.prepare({dataset:{headerStyle:'compact'}},drawer);assert.equal(clicks,1);context.prepare({dataset:{headerStyle:'compact'}},drawer);assert.equal(clicks,1);
 active=false;window.innerWidth=390;context.prepare({dataset:{headerStyle:'compact'}},drawer);assert.equal(clicks,1);
 window.innerWidth=1920;context.prepare({dataset:{headerStyle:'classic'}},drawer);assert.equal(clicks,1);
});
