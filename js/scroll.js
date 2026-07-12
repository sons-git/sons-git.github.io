// Scroll-driven state: section index, progress rail, nav active link,
// and a shared `scrollState` object that other modules (scene.js) can read.
//
// Performance notes (2025-11):
//   • Scroll handler is rAF-throttled — we defer the work to the next
//     animation frame regardless of how many scroll events fire, so
//     fast wheel/trackpad scrolls don't run the detection loop dozens
//     of times per frame.
//   • Section tops are cached on init and on resize. Reading
//     `getBoundingClientRect` for every section on every scroll pixel
//     is the classic layout-thrash pattern; caching turns the hot
//     path into a simple numeric compare.

export const scrollState = {
  progress: 0,     // 0..1 over full page height
  section: 0,      // active section index (from data-section on <section>)
  sectionCount: 1,
  scrollY: 0,
};

export function initScroll({ onSectionChange } = {}) {
  const sections = Array.from(document.querySelectorAll('[data-section]'))
    .sort((a, b) => Number(a.dataset.section) - Number(b.dataset.section));
  scrollState.sectionCount = sections.length;

  const railFill = document.getElementById('rail-fill');
  const railIndex = document.getElementById('rail-index');
  const railLabel = document.getElementById('rail-label');
  const navLinks = Array.from(document.querySelectorAll('.nav__links a'));

  // Cached section top positions (in absolute document Y). Rebuilt on
  // resize, font-load, and any explicit layout invalidation.
  let sectionTops = new Array(sections.length).fill(0);
  function cacheSectionTops() {
    for (let i = 0; i < sections.length; i++) {
      const r = sections[i].getBoundingClientRect();
      sectionTops[i] = r.top + window.scrollY;
    }
  }

  function updateProgress() {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const p = docH > 0 ? Math.max(0, Math.min(1, scrollY / docH)) : 0;
    scrollState.scrollY = scrollY;
    scrollState.progress = p;
    if (railFill) railFill.style.height = (p * 100).toFixed(2) + '%';
  }

  // Detect active section by comparing scroll to cached section tops.
  // No getBoundingClientRect per scroll — the tops are stable until
  // layout changes (resize / font-load / content reflow).
  function updateActiveSection() {
    const viewportMid = window.scrollY + window.innerHeight * 0.4;
    let active = 0;
    for (let i = 0; i < sectionTops.length; i++) {
      if (sectionTops[i] <= viewportMid) active = i;
    }
    if (active !== scrollState.section) {
      const prev = scrollState.section;
      scrollState.section = active;
      const section = sections[active];
      const idx = String(active + 1).padStart(2, '0');
      const label = section.dataset.label || '';
      if (railIndex) railIndex.textContent = idx;
      if (railLabel) railLabel.textContent = label;
      navLinks.forEach((a) => a.classList.remove('is-active'));
      const targetId = section.id;
      const link = navLinks.find((a) => a.getAttribute('href') === '#' + targetId);
      if (link) link.classList.add('is-active');
      if (onSectionChange) onSectionChange(active, prev, section);
    }
  }

  // rAF-throttle. Coalesces bursts of scroll events into one update
  // per frame — cheap `scrollY` reads still happen on the raw event
  // path when other modules poll `scrollState.scrollY`, but the
  // expensive path (section detection + DOM writes) is gated.
  let rafPending = false;
  function tick() {
    rafPending = false;
    updateProgress();
    updateActiveSection();
  }
  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(tick);
  }

  function onResize() {
    // Layout changed — rebuild caches, then run a normal tick.
    cacheSectionTops();
    onScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize, { passive: true });
  }
  // Font-load reflow — cached tops shift when Space Grotesk / JetBrains
  // Mono replace the fallback fonts.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(onResize).catch(() => {});
  }

  cacheSectionTops();
  updateProgress();
  updateActiveSection();

  return {
    destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
      }
    },
  };
}

// Reveal ownership moved to `reveal.js` (Task 8.1) — this module now
// owns scroll state + section change detection only.

// Card hover tracking — sets --mx / --my custom properties for the radial glow.
export function initCardHover() {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', mx + '%');
      card.style.setProperty('--my', my + '%');
    });
  });
}
