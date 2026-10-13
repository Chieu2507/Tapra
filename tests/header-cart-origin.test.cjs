const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/cart-drawer.js', 'utf8');
const start = source.indexOf('  const prepareCompactMotion =');
const end = source.indexOf("  window.addEventListener('resize'", start);

test('cart handoff preserves hidden parent navigation and the current submenu slide position', () => {
  const originalNodes = [
    { opacity: '1', visibility: 'visible', transform: 'none' },
    { opacity: '1', visibility: 'hidden', transform: 'none' },
    { opacity: '1', visibility: 'visible', transform: 'matrix(1, 0, 0, 1, 37, 0)', translate: '0px 4px' },
    { opacity: '1', visibility: 'visible', transform: 'matrix(.707, .707, -.707, .707, 0, 0)', top: '5px', right: '.8px', width: '20px' },
  ];
  const copies = originalNodes.map((_node, index) => ({ style: {}, matches: () => index === 3 }));
  const original = { ...originalNodes[0], querySelectorAll: () => originalNodes.slice(1) };
  const copy = { ...copies[0], querySelectorAll: () => copies.slice(1) };
  const freezeStart = source.indexOf('    const freezeVisual =');
  const freezeEnd = source.indexOf('    freezeVisual(container', freezeStart);
  const context = { getComputedStyle: node => node };
  vm.runInNewContext(source.slice(freezeStart, freezeEnd) + ';this.freeze = freezeVisual;', context);
  context.freeze(original, copy);
  assert.equal(copies[1].style.visibility, 'hidden');
  assert.equal(copies[2].style.transform, 'matrix(1, 0, 0, 1, 37, 0)');
  assert.equal(copies[2].style.translate, '0px 4px');
  assert.equal(copies[2].style.animation, 'none');
  assert.equal(copies[2].style.transition, 'none');
  assert.equal(copies[3].style.top, '5px');
  assert.equal(copies[3].style.right, '.8px');
  assert.equal(copies[3].style.width, '20px');
});

test('Compact cart originates at the resting pill and expands within the right gutter', () => {
  for (const viewport of [320, 390, 768, 1920]) {
    const values = {};
    const drawer = { classList: { toggle() {} }, style: { setProperty: (key, value) => { values[key] = parseFloat(value); } } };
    const header = { classList: { contains: () => false }, getBoundingClientRect: () => ({ top: 16, width: 900 }) };
    const context = {
      document: { querySelector: () => header }, window: { innerWidth: viewport },
      getComputedStyle: () => ({ getPropertyValue: key => key === '--compact-width' ? '288px' : 'calc(50px + 24px)', paddingTop: '12px', paddingBottom: '12px' }),
    };
    vm.runInNewContext(source.slice(start, end) + ';this.prepare = prepareCompactMotion;', context);
    context.prepare(drawer);
    const rest = values['--compact-cart-rest-width'];
    const width = Math.min(410, viewport - 24);
    const left = viewport / 2 - rest / 2 + values['--compact-cart-shift'] + values['--compact-cart-expand-shift'] * 2;
    assert.equal(left + width, viewport - 12);
    assert(left >= 12);
    assert.equal(values['--compact-cart-rest-height'], 74);
    assert.equal(values['--compact-cart-origin-width'], 900);
    assert.equal(viewport / 2 - rest / 2 + values['--compact-cart-origin-shift'], viewport / 2 - 450);
  }
});

test('a Basic header clears Compact cart mode without reading geometry', () => {
  let compact;
  const context = { document: { querySelector: () => null } };
  vm.runInNewContext(source.slice(start, end) + ';this.prepare = prepareCompactMotion;', context);
  context.prepare({ classList: { toggle: (name, enabled) => { compact = enabled; } } });
  assert.equal(compact, false);
});

test('Compact popup morph centers the final panel from either pill or expanded menu', () => {
  for (const viewport of [320, 390, 1920]) {
    for (const originHeight of [50, 680]) {
      const values = {};
      const header = { classList: { contains: () => originHeight > 50 }, getBoundingClientRect: () => ({ top: 16, width: 288, height: originHeight }) };
      const drawer = { dataset: { cartPresentation: 'popup' }, classList: { toggle() {} }, style: { setProperty: (key, value) => { values[key] = parseFloat(value); } } };
      const context = {
        document: { querySelector: () => header }, window: { innerWidth: viewport, innerHeight: 844 },
        getComputedStyle: node => ({ getPropertyValue: key => ({ '--component-overlay-width': '550px', '--compact-width': '288px', '--compact-rest-height': '50px' })[key] || '', paddingTop: '0px', paddingBottom: '0px' }),
      };
      vm.runInNewContext(source.slice(start, end) + ';this.prepare = prepareCompactMotion;', context);
      context.prepare(drawer);
      const width = values['--compact-popup-width'], height = values['--compact-popup-height'];
      assert.equal(16 + values['--compact-popup-center-shift'] + values['--compact-popup-grow-shift'], (844 - height) / 2);
      assert.equal(viewport / 2 - values['--compact-cart-rest-width'] / 2 + (values['--compact-cart-rest-width'] - width) / 2, (viewport - width) / 2);
    }
  }
});

test('mobile fullscreen menu hands off its current geometry but returns to the floating top inset', () => {
  const values = {};
  const header = {
    classList: { contains: () => true },
    getBoundingClientRect: () => ({ top: 0, width: 390, height: 844 }),
  };
  const context = {
    document: { querySelector: () => header }, window: { innerWidth: 390 },
    getComputedStyle: () => ({
      getPropertyValue: key => ({ '--compact-width': '288px', '--compact-rest-height': '50px', '--header-compact-top': '16px' })[key] || '',
      borderRadius: '0px', paddingTop: '0px', paddingBottom: '0px',
    }),
  };
  vm.runInNewContext(source.slice(start, end) + ';this.prepare = prepareCompactMotion;', context);
  context.prepare({ classList: { toggle() {} }, style: { setProperty: (key, value) => { values[key] = value; } } });
  assert.equal(values['--compact-cart-origin-width'], '390px');
  assert.equal(values['--compact-cart-origin-height'], '844px');
  assert.equal(values['--compact-cart-origin-top'], '0px');
  assert.equal(values['--compact-cart-origin-radius'], '0px');
  assert.equal(values['--compact-cart-top'], 'calc(16px + env(safe-area-inset-top, 0px))');
  assert.equal(values['--compact-cart-rest-height'], '50px');
});

test('Full mobile cart expands around the center to exactly fill the viewport', () => {
  for (const viewport of [320, 390, 767]) {
    const values = {};
    const header = { classList: { contains: () => false }, getBoundingClientRect: () => ({ top: 16, width: 288, height: 50 }) };
    const context = {
      document: { querySelector: () => header }, window: { innerWidth: viewport },
      getComputedStyle: () => ({ getPropertyValue: key => ({ '--compact-width': '288px', '--compact-rest-height': '50px', '--drawer-mobile-mode': 'full', '--drawer-mobile-gutter': '0px' })[key] || '', paddingTop: '0px', paddingBottom: '0px' }),
    };
    vm.runInNewContext(source.slice(start, end) + ';this.prepare = prepareCompactMotion;', context);
    context.prepare({ classList: { toggle() {} }, style: { setProperty: (key, value) => { values[key] = parseFloat(value); } } });
    const left = viewport / 2 - values['--compact-cart-rest-width'] / 2 + values['--compact-cart-shift'] + values['--compact-cart-open-translate'];
    assert.equal(left, 0);
    assert.equal(values['--compact-cart-shift'], 0);
    assert.equal(left + viewport, viewport);
  }
});
