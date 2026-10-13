/* Delegation also covers Theme Editor rerenders and deferred overlay content. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let surface, frame = 0, pointerX = 0, pointerY = 0, x = 0, y = 0;
  const clear = () => {
    surface?.style.setProperty('--surface-light-opacity', '0');
    surface = null;
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const update = () => {
    frame = 0;
    if (!surface?.isConnected || surface.closest('[hidden], [inert]')) { clear(); return; }
    const rect = surface.getBoundingClientRect();
    const targetX = pointerX - rect.left;
    const targetY = pointerY - rect.top;
    x += (targetX - x) * .2;
    y += (targetY - y) * .2;
    surface.style.setProperty('--surface-light-x', `${x.toFixed(1)}px`);
    surface.style.setProperty('--surface-light-y', `${y.toFixed(1)}px`);
    if (Math.abs(targetX - x) > .1 || Math.abs(targetY - y) > .1) frame = requestAnimationFrame(update);
  };
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reducedMotion.matches) { clear(); return; }
    const next = event.target.closest?.('.surface-light');
    if (!next) { clear(); return; }
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (next !== surface) {
      clear();
      surface = next;
      const rect = surface.getBoundingClientRect();
      x = pointerX - rect.left;
      y = pointerY - rect.top;
      surface.style.setProperty('--surface-light-opacity', '1');
    }
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  document.addEventListener('pointerleave', clear);
  window.addEventListener('blur', clear);
  window.addEventListener('scroll', clear, { passive: true });
  reducedMotion.addEventListener('change', clear);
})();
