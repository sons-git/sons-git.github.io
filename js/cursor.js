// Custom cursor + magnetic hover effect.
// The dot follows the mouse instantly. The ring lags slightly for a smooth trailing feel.
// No CSS transitions on transform — JS drives position every frame.

export function initCursor() {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover) return { destroy() {} };

  const cursor = document.querySelector('.cursor');
  if (!cursor) return { destroy() {} };
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');

  document.documentElement.classList.add('has-cursor');

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y };

  function onMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    // Dot updates immediately — no lag
    dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
  }
  window.addEventListener('mousemove', onMove, { passive: true });

  // Hover state — grow ring on interactive elements
  const hoverSelector = '[data-cursor="hover"], a, button, .card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(hoverSelector)) {
      cursor.classList.add('is-hover');
    }
  }, true);
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(hoverSelector)) {
      cursor.classList.remove('is-hover');
    }
  }, true);

  // Magnetic pull for [data-magnetic]
  //
  // We drive `style.translate` (a separate CSS property, Chrome 104+ /
  // Firefox 72+ / Safari 14.1+), NOT `style.transform`. The reveal
  // engine's `.rv-fade-up` animation runs with `both` fill mode, so its
  // `to { transform: none }` overrides any inline `transform` set on the
  // same element per the CSS animation spec. `translate` sits on its own
  // property track and composes with `transform`, so the magnetic pull
  // survives once reveal locks the element at `transform: none`.
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.25;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.25;
      el.style.translate = `${dx}px ${dy}px`;
    });
    el.addEventListener('mouseleave', () => { el.style.translate = ''; });
  });

  // Ring trails with smoothing
  let raf;
  function tick() {
    // Higher lerp = snappier ring. Was 0.18 which felt like molasses.
    ringPos.x += (mouse.x - ringPos.x) * 0.35;
    ringPos.y += (mouse.y - ringPos.y) * 0.35;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.classList.remove('has-cursor');
    },
  };
}
