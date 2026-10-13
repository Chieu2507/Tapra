const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('sections/search-overlay.liquid', 'utf8');
const start = source.indexOf('  const synchronizePanelPadding =');
const end = source.indexOf('  const watchCompactGeometry =', start);

function panelTop({ rowHeight, top = 16, padding = 0, border = 1, viewport = 1280 }) {
  const values = {};
  const row = { getBoundingClientRect: () => ({ bottom: top + border + padding + rowHeight }) };
  const headerTop = {
    classList: { contains: () => true },
    querySelector: selector => selector === '.header__row' ? row : null,
    getBoundingClientRect: () => ({ top, left: 12, width: 366, bottom: top + 680 }),
  };
  const overlay = {
    hidden: true,
    classList: { toggle() {} },
    querySelector: () => null,
    style: { setProperty: (name, value) => { values[name] = value; } },
  };
  const style = {
    borderTopWidth: `${border}px`, borderLeftWidth: `${border}px`,
    borderRightWidth: `${border}px`, borderBottomWidth: `${border}px`,
    paddingTop: `${padding}px`, paddingBottom: `${padding}px`,
  };
  const context = { state: {}, window: { innerWidth: viewport, getComputedStyle: () => style }, getComputedStyle: () => style };
  vm.runInNewContext(source.slice(start, end) + ';this.sync = synchronizePanelPadding;', context);
  context.sync({ querySelector: () => headerTop }, overlay);
  return values['--search-overlay-top'];
}

test('Compact search anchors to the final row while opening or reopening mid-animation', () => {
  for (const rowHeight of [48, 49.8, 56, 63.5, 64]) {
    assert.equal(panelTop({ rowHeight }), '81px');
  }
});

test('mobile search preserves the shell top, safe-area padding and border in its anchor', () => {
  for (const rowHeight of [48, 56, 64]) {
    assert.equal(panelTop({ rowHeight, top: 0, padding: 24, border: 0, viewport: 390 }), '88px');
    assert.equal(panelTop({ rowHeight, top: 16, padding: 12, border: 1, viewport: 390 }), '93px');
  }
});
