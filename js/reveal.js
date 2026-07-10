// -------------------------------------------------------------
// Reveal engine — named recipes + reduced-motion fallback.
//
// Requirements: R10.1–R10.6, R11.3
// Design: §Reveal System Upgrade, §Algorithms · 7
//
// Owns [data-reveal] visibility. Extracted from scroll.js so
// scroll.js can focus purely on scroll state + section change.
//
// Recipes:
//   default (or "")            → rv-fade-up
//   stagger                    → 80ms × child index on each direct child
//                                (children get --delay + rv-fade-up)
//   fan                        → rv-fan (children of .manifesto get
//                                per-index --fan-x / --fan-r if unset)
//   flip                       → rv-flip
//   stamp                      → rv-stamp
//   slide-from=left|right|top|bottom → rv-slide-{dir}
//   typewriter                 → per-character terminal-typing reveal.
//                                Walks text nodes inside `el`, wraps each
//                                character in a <span class="rv-type-char">
//                                and animation-delays them sequentially.
//                                Appends a blinking `.rv-type-caret` that
//                                fades once the last char lands.
//                                HTML structure (bold, em, links) is
//                                preserved because we only touch text nodes.
//
// Per-element overrides:
//   data-reveal-delay="120"    → integer ms delay for that element's
//                                animation-delay (and legacy
//                                --reveal-delay / --delay CSS vars).
//   data-reveal-speed="30"     → typewriter recipe only: ms per character.
//                                Default 30 ms/char (~33 char/sec).
//
// Under prefersReduced (R10.5, R11.3):
//   All recipes collapse to `.is-visible-static` — the reduced-motion
//   media query in style.css handles the opacity-only 250 ms fade.
//   No transforms, no scales, no keyframe animations are applied.
//
// The `.is-visible` class from v4 CSS is also added so the existing
// transition rule keeps working while task 11.3 lands the rv-* keyframes.
// -------------------------------------------------------------

const VALID_DIRS = new Set(['left', 'right', 'top', 'bottom']);

/**
 * Wire up the reveal IntersectionObserver.
 *
 * @param {Object} opts
 * @param {boolean} [opts.prefersReduced=false] — collapse every recipe to
 *   the `.is-visible-static` opacity-only fade.
 * @returns {{ destroy(): void }}
 */
export function initReveal({ prefersReduced = false } = {}) {
  const els = Array.from(document.querySelectorAll('[data-reveal]'));

  function revealIfDue(el) {
    if (!el || el.dataset.revealed === '1') return;
    applyRecipe(el, prefersReduced);
    el.dataset.revealed = '1';
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealIfDue(entry.target);
        observer.unobserve(entry.target);
      });
    },
    // Generous rootMargin so animations pre-fire before the element is
    // fully in view — user scrolling fast (Recognition is section 5,
    // well below the fold) will still catch the animation mid-play
    // instead of arriving after it's already finished.
    { threshold: 0.02, rootMargin: '120px 0px 120px 0px' }
  );

  els.forEach((el) => io.observe(el));

  // Defensive scroll-based sweep (2025-11 fix).
  //
  // The IntersectionObserver above is the primary trigger, but the user
  // reported Recognition trophies never animating despite the observer
  // being wired. Rather than continue guessing at the cause (perspective
  // transforms + overflow, browser-specific IO quirks, layout timing,
  // etc.), this sweep force-checks every un-revealed [data-reveal]
  // element against the viewport on scroll and reveals any that are in
  // view. It's a belt-and-suspenders pass — cheap because the check
  // short-circuits on `data-revealed="1"` and only reads
  // getBoundingClientRect for un-revealed items.
  const VIEW_MARGIN = 120;
  let sweepPending = false;
  function sweep() {
    sweepPending = false;
    const vh = window.innerHeight;
    for (const el of els) {
      if (el.dataset.revealed === '1') continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < -VIEW_MARGIN || r.top > vh + VIEW_MARGIN) continue;
      if (r.width === 0 && r.height === 0) continue; // not yet laid out
      revealIfDue(el);
      io.unobserve(el);
    }
  }
  function onScroll() {
    if (sweepPending) return;
    sweepPending = true;
    requestAnimationFrame(sweep);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // Prime the pump — catches anything already in view at boot.
  requestAnimationFrame(sweep);

  return {
    destroy() {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    },
  };
}

/**
 * Apply the named recipe class(es) to a single revealed element.
 * Also marks the element with `.is-visible` for v4 CSS compatibility.
 */
function applyRecipe(el, prefersReduced) {
  const recipe = (el.dataset.reveal || 'default').trim() || 'default';
  const delay = parseDelay(el.dataset.revealDelay);

  // Reduced-motion path — collapse everything to opacity-only fade.
  // R10.5 / R11.3: no transforms, no scales, no keyframe animations.
  if (prefersReduced) {
    applyDelay(el, delay);
    el.classList.add('is-visible-static');
    el.classList.add('is-visible'); // v4 compat — safe under the media query
    return;
  }

  if (recipe === 'stagger') {
    // R10.2: children get 80 ms × index delay + rv-fade-up.
    const children = Array.from(el.children);
    children.forEach((child, i) => {
      const childDelay = delay + i * 80;
      applyDelay(child, childDelay);
      child.classList.add('rv-fade-up');
      child.classList.add('is-visible');
    });
    // Mark container revealed so the base [data-reveal] opacity:0 lifts.
    applyDelay(el, delay);
    el.classList.add('is-visible');
    return;
  }

  if (recipe === 'typewriter') {
    applyTypewriter(el, delay);
    el.classList.add('is-visible');
    return;
  }

  if (recipe === 'fan') {
    // If this fan element is a row inside .manifesto, seed per-child
    // --fan-x / --fan-r from its sibling index. Only when not already set,
    // so authored values in HTML / renderers win.
    seedFanVarsIfInManifesto(el);
    el.classList.add('rv-fan');
  } else if (recipe === 'flip') {
    el.classList.add('rv-flip');
  } else if (recipe === 'stamp') {
    el.classList.add('rv-stamp');
  } else if (recipe.startsWith('slide-from=')) {
    const dir = recipe.slice('slide-from='.length).trim();
    if (VALID_DIRS.has(dir)) {
      el.classList.add(`rv-slide-${dir}`);
    } else {
      el.classList.add('rv-fade-up');
    }
  } else {
    // 'default' or unknown → fade-up.
    el.classList.add('rv-fade-up');
  }

  applyDelay(el, delay);
  el.classList.add('is-visible');
}

/**
 * Parse the `data-reveal-delay` value into a non-negative integer.
 */
function parseDelay(raw) {
  if (raw == null || raw === '') return 0;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Write the reveal delay to every convention the CSS may read:
 *   - `--delay`         → new rv-* keyframes (task 11.3)
 *   - `--reveal-delay`  → v4 transition-delay
 *   - inline `animation-delay` / `transition-delay` as safe fallbacks
 */
function applyDelay(el, delay) {
  if (delay <= 0) return;
  const ms = delay + 'ms';
  el.style.setProperty('--delay', ms);
  el.style.setProperty('--reveal-delay', ms);
  el.style.animationDelay = ms;
  el.style.transitionDelay = ms;
}

/**
 * When a `.manifesto__row` (or any child of `.manifesto`) uses
 * `data-reveal="fan"`, ensure the row has --fan-x / --fan-r set so the
 * `rv-fan` keyframe (task 11.3) can produce a fan-in pattern.
 *
 * Only writes when the properties are not already set inline — authored
 * values win.
 */
/**
 * Typewriter recipe — walk text nodes inside `el`, wrap each char in a
 * <span class="rv-type-char"> with a staged animation-delay so characters
 * pop in sequentially like terminal output. Preserves nested tags (e.g.
 * <em>, <a>) because we only replace text nodes. Appends a blinking caret
 * that fades once the last char lands.
 *
 * Whitespace-only text nodes between tags are skipped so they don't eat
 * animation slots; whitespace inside a mixed text node (e.g. the space
 * in "Trung Son") is preserved and contributes to the timing.
 *
 * Speed is `data-reveal-speed` (ms per char) or 30 ms default.
 * Extra `delay` (ms) is applied before the first char.
 */
function applyTypewriter(el, delay) {
  const speedRaw = parseInt(el.dataset.revealSpeed || '', 10);
  const speed = Number.isFinite(speedRaw) && speedRaw > 0 ? speedRaw : 30;

  // Collect text nodes in document order, skipping pure-whitespace ones.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.trim().length > 0) textNodes.push(n);
  }
  if (textNodes.length === 0) return;

  // Replace each text node with a fragment of per-char spans. Track a
  // running char index so delays are continuous across text nodes and
  // nested tags.
  let charIdx = 0;
  textNodes.forEach((textNode) => {
    const frag = document.createDocumentFragment();
    const value = textNode.nodeValue;
    for (let i = 0; i < value.length; i++) {
      const ch = value[i];
      const span = document.createElement('span');
      span.className = 'rv-type-char';
      span.textContent = ch;
      span.style.animationDelay = (delay + charIdx * speed) + 'ms';
      frag.appendChild(span);
      charIdx += 1;
    }
    textNode.parentNode.replaceChild(frag, textNode);
  });

  // Blinking caret at the end. Fades out shortly after the last char pops.
  el.classList.add('rv-typewriter');
  const caret = document.createElement('span');
  caret.className = 'rv-type-caret';
  caret.setAttribute('aria-hidden', 'true');
  el.appendChild(caret);

  // Total type-in time + a short hold so the caret sits on the final char
  // for a beat before fading. `both` fill mode on the char animation keeps
  // each char opaque after its cue.
  const totalMs = delay + charIdx * speed + 260;
  setTimeout(() => {
    caret.classList.add('rv-type-caret--done');
  }, totalMs);
}

function seedFanVarsIfInManifesto(el) {
  const parent = el.parentElement;
  if (!parent || !parent.classList.contains('manifesto')) return;

  const siblings = Array.from(parent.children);
  const idx = siblings.indexOf(el);
  if (idx < 0) return;

  const mid = (siblings.length - 1) / 2;
  const offset = idx - mid; // negative for early rows, positive for later

  if (!el.style.getPropertyValue('--fan-x')) {
    el.style.setProperty('--fan-x', (offset * 14).toFixed(2) + 'px');
  }
  if (!el.style.getPropertyValue('--fan-r')) {
    el.style.setProperty('--fan-r', (offset * 3).toFixed(2) + 'deg');
  }
}
