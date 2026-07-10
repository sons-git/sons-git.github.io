// Scroll-driven state: section index, progress rail, nav active link,
// and a shared `scrollState` object that other modules (scene.js) can read.

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

  function updateProgress() {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const p = docH > 0 ? Math.max(0, Math.min(1, scrollY / docH)) : 0;
    scrollState.scrollY = scrollY;
    scrollState.progress = p;
    if (railFill) railFill.style.height = (p * 100).toFixed(2) + '%';
  }

  // Detect active section by comparing scroll to section midpoints.
  function updateActiveSection() {
    const viewportMid = window.scrollY + window.innerHeight * 0.4;
    let active = 0;
    for (let i = 0; i < sections.length; i++) {
      const rect = sections[i].getBoundingClientRect();
      const top = rect.top + window.scrollY;
      if (top <= viewportMid) active = i;
    }
    if (active !== scrollState.section) {
      const prev = scrollState.section;
      scrollState.section = active;
      const section = sections[active];
      const idx = String(active + 1).padStart(2, '0');
      const label = section.dataset.label || '';
      if (railIndex) railIndex.textContent = idx;
      if (railLabel) railLabel.textContent = label;
      // Nav active state
      navLinks.forEach((a) => a.classList.remove('is-active'));
      const targetId = section.id;
      const link = navLinks.find((a) => a.getAttribute('href') === '#' + targetId);
      if (link) link.classList.add('is-active');
      if (onSectionChange) onSectionChange(active, prev, section);
    }
  }

  function onScroll() {
    updateProgress();
    updateActiveSection();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  return {
    destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
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
