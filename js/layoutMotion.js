// Scroll- and cursor-linked motion engine.
//
// Registers one recipe per section. Each recipe owns a target selector and
// a `vars(progress, cursor)` function that returns a `{ '--css-var': value }`
// map. Every animation frame (coalesced from `scroll`, `resize`, and
// `mousemove`), progress is recomputed for every recipe, smoothed with a
// one-pole IIR filter, and written back as CSS custom properties.
//
// Design references:
//   §Scroll-Linked Motion Engine, §Algorithms · 6, §Data Models (LAYOUT_RECIPES)
//
// Requirements:
//   R6.1  — one recipe per section, keyed by SECTION_BEHAVIORS[i].layout
//   R6.2  — Hero:        --hero-fade, --hero-y, --parallax-{x,y}
//   R6.3  — Approach:    --tilt in [-6°, +6°], 0° at centered progress
//   R6.4  — Journey:     --tl-fill from 0% to 100%
//   R6.5  — Work:        --card-parallax on .work__spotlight only (±16px felt-range)
//   R6.6  — Skills:      --constellation-drift (per-item wobble ≤ ±1px in CSS)
//   R6.7  — Vision:      --vision-{back,mid,front}-y parallax layers
//   R6.8  — Contact:     --contact-lift
//   R6.9  — write only when smoothed progress delta > 1/1000
//   R6.10 — prefersReduced → no-op
//   R11.3 — reduced-motion honored at DOM layer
//   R13.4 — tight viewport (< 720px) skips parallax + Skills wobble

import { clamp } from './util.js';

// ---------------------------------------------------------------
// LAYOUT_RECIPES — verbatim from design §Data Models.
// Each recipe declares:
//   target        — CSS selector for the section container
//   vars(p,c)     — pure fn: smoothed section progress ∈ [0,1] + cursor NDC
//                   ({ x, y } in [-1,1]) → { '--var-name': stringValue }
//   parallaxVars  — subset of vars() output that are considered "parallax"
//                   and therefore skipped on tight viewport (R13.4)
//   skipOnTight   — true if the entire recipe is dropped on tight viewport
//                   (used for Skills constellation-drift, R13.4)
// ---------------------------------------------------------------
export const LAYOUT_RECIPES = {
  hero: {
    target: '.hero',
    // 2025-11 fix — `computeProgress` returns 0.5 when a section fully
    // occupies the viewport (its top edge is at the viewport top, its
    // bottom edge at the viewport bottom). The old vars formula
    // `1 - p * 1.2` treated p=0 as "hero at rest", so at boot the hero
    // read as 40% opacity (`1 - 0.5 * 1.2 = 0.4`) and the IIR smoothing
    // ramped it there from 1 over ~250 ms — the "lights up then dims"
    // symptom, with every mousemove tick accelerating the convergence.
    //
    // Remap `p` into a scroll-out fraction: 0 while hero occupies the
    // viewport, ramps to 1 as the hero leaves the top. Fade + y-shift
    // now stay at rest values while the user is IN the hero and only
    // kick in when they scroll past.
    vars: (p, cursor) => {
      const scrollOut = Math.max(0, Math.min(1, (p - 0.5) * 2));
      return {
        '--hero-fade':  String(1 - scrollOut * 1.2),
        '--hero-y':     `${scrollOut * -60}px`,
        '--parallax-x': `${cursor.x * 4}px`,
        '--parallax-y': `${cursor.y * 3}px`,
      };
    },
    parallaxVars: ['--parallax-x', '--parallax-y'],
  },
  approach: {
    target: '#about',
    vars: (p) => ({
      // (0.5 - p) * 12 sweeps from +6° (top of section) through 0° (centered)
      // to -6° (bottom of section). R6.3.
      '--tilt': `${(0.5 - p) * 12}deg`,
    }),
  },
  journey: {
    target: '#experience',
    vars: (p) => ({
      // Bias so the fill visibly reaches 100% shortly before the section
      // exits the viewport. Matches design §Data Models.
      '--tl-fill': `${clamp(p * 1.4 - 0.1, 0, 1) * 100}%`,
    }),
  },
  work: {
    target: '#work',
    vars: (p, cursor) => ({
      // Consumed by CSS scoped to `.work__spotlight` only (R6.5).
      '--card-parallax': `${p * -30}px`,
      '--work-cursor-x': `${cursor.x * 6}px`,
    }),
    parallaxVars: ['--card-parallax', '--work-cursor-x'],
  },
  skills: {
    target: '#skills',
    vars: (p) => ({
      // Drives the per-item wobble on `.mf-list li` via CSS. R6.6.
      '--constellation-drift': String(p),
    }),
    // Entire wobble effect is disabled on tight viewport (R13.4).
    skipOnTight: true,
  },
  recognition: {
    target: '#recognition',
    vars: (p) => ({ '--award-shimmer': String(p) }),
  },
  vision: {
    target: '#vision',
    vars: (p, cursor) => ({
      // Three-layer parallax — back at 0.3×, mid at 0.85× (mid actually
      // reads slower here to sit under the pull-quote), front at 1.1×.
      // R6.7.
      '--vision-back-y':   `${p * -80}px`,
      '--vision-mid-y':    `${p * -30}px`,
      '--vision-front-y':  `${p *  20}px`,
      '--vision-cursor-x': `${cursor.x * 8}px`,
    }),
    parallaxVars: [
      '--vision-back-y', '--vision-mid-y', '--vision-front-y', '--vision-cursor-x',
    ],
  },
  contact: {
    target: '#contact',
    vars: (p) => ({ '--contact-lift': `${p * -20}px` }),
  },
};

// One-pole IIR smoothing coefficient. Design §Algorithms · 6.
const IIR_ALPHA = 0.15;
// Threshold below which a smoothed-progress change is discarded (R6.9).
const WRITE_EPS = 1 / 1000;
// Tight viewport threshold. R13.4.
const TIGHT_PX = 720;

/**
 * Boots the layout motion engine.
 *
 * @param {Object} opts
 * @param {boolean} opts.prefersReduced  — if true, returns a no-op instance.
 * @returns {{ activate: (recipeKey: string | null) => void,
 *             dispose:  () => void }}
 */
export function initLayoutMotion({ prefersReduced } = {}) {
  // R6.10, R11.3 — reduced-motion: never write, never listen.
  if (prefersReduced) {
    return { activate: () => {}, dispose: () => {} };
  }

  // Cursor NDC — mousemove is the only writer. Range [-1, 1] on both axes.
  const cursor = { x: 0, y: 0 };

  // Resolve DOM elements once at init; recipes with missing targets are
  // silently skipped so this module can boot on partial DOMs.
  /** @type {Array<{ key: string, el: HTMLElement, varsFn: Function,
   *                 parallaxVars: string[], skipOnTight: boolean,
   *                 smoothed: number, lastWrittenP: number }>} */
  const activeRecipes = [];
  for (const [key, recipe] of Object.entries(LAYOUT_RECIPES)) {
    const el = /** @type {HTMLElement | null} */ (document.querySelector(recipe.target));
    if (!el) continue;
    activeRecipes.push({
      key,
      el,
      varsFn: recipe.vars,
      parallaxVars: recipe.parallaxVars || [],
      skipOnTight: !!recipe.skipOnTight,
      smoothed: 0,
      lastWrittenP: Number.NEGATIVE_INFINITY,
    });
  }

  let disposed = false;
  let rafPending = false;
  // eslint-disable-next-line no-unused-vars
  let currentKey = null;
  let wasTight = window.innerWidth < TIGHT_PX;

  function isTight() {
    return window.innerWidth < TIGHT_PX;
  }

  // Raw section progress:
  //   0 when the section's top edge sits at the viewport bottom (just entering)
  //   1 when the section's bottom edge sits at the viewport top (just leaving)
  function computeProgress(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = vh + rect.height;
    if (total <= 0) return 0;
    const passed = vh - rect.top;
    return clamp(passed / total, 0, 1);
  }

  function clearRecipeVars(r) {
    // Used on tight-viewport transition to strip stale values.
    r.el.style.removeProperty('--constellation-drift');
    for (const name of r.parallaxVars) {
      r.el.style.removeProperty(name);
    }
    // Force the next write to pass the threshold gate.
    r.lastWrittenP = Number.NEGATIVE_INFINITY;
  }

  function tick() {
    rafPending = false;
    if (disposed) return;

    const tight = isTight();
    if (tight !== wasTight) {
      if (tight) {
        // Crossed into tight: drop the vars we're about to stop updating.
        for (const r of activeRecipes) {
          if (r.skipOnTight || r.parallaxVars.length) clearRecipeVars(r);
        }
      } else {
        // Crossed out of tight: force fresh writes.
        for (const r of activeRecipes) {
          r.lastWrittenP = Number.NEGATIVE_INFINITY;
        }
      }
      wasTight = tight;
    }

    for (const r of activeRecipes) {
      // R13.4 — Skills constellation-drift is entirely disabled on tight.
      if (tight && r.skipOnTight) continue;

      const raw = computeProgress(r.el);
      // One-pole IIR: smoothed += (raw - smoothed) * alpha.
      r.smoothed += (raw - r.smoothed) * IIR_ALPHA;

      // R6.9 — only write when smoothed delta exceeds threshold.
      if (Math.abs(r.smoothed - r.lastWrittenP) <= WRITE_EPS) continue;
      r.lastWrittenP = r.smoothed;

      const nextVars = r.varsFn(r.smoothed, cursor);
      // Parallax vars are dropped on tight (R13.4); the rest still update
      // so `--hero-fade`, `--tilt`, `--tl-fill`, etc. remain live.
      const skip = tight && r.parallaxVars.length
        ? new Set(r.parallaxVars)
        : null;

      for (const name in nextVars) {
        if (skip && skip.has(name)) continue;
        r.el.style.setProperty(name, nextVars[name]);
      }
    }
  }

  function schedule() {
    if (rafPending || disposed) return;
    rafPending = true;
    requestAnimationFrame(tick);
  }

  function onScroll() { schedule(); }
  function onResize() { schedule(); }
  function onMouseMove(e) {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    cursor.x = (e.clientX / w) * 2 - 1;
    cursor.y = (e.clientY / h) * 2 - 1;
    schedule();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // Prime the pump so first-paint values are written.
  schedule();

  /**
   * Hint that a new section became active. Recipes always run in the
   * background so this is a lightweight nudge that forces an immediate
   * repaint of the newly-focused section. Unknown keys are ignored.
   */
  function activate(recipeKey) {
    currentKey = recipeKey || null;
    schedule();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouseMove);
  }

  return { activate, dispose };
}
