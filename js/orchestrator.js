// -------------------------------------------------------------
// Orchestrator — SENTINEL's brain.
//
// This module knows what's on screen. It maintains a per-section "program"
// (a list of steps) and advances through it while the user is in that
// section. Each step tells the buddy:
//   • where to go            (via a DOM element reference)
//   • what mode to be in     (analyze/index/verify/…)
//   • what shape to wear     (orb/prism/ring/shard/…)  ← v5
//   • whether to focus DOM   (adds `.sentinel-focused`) ← v5
//   • what to emit           (pulse/documents_in/checkmark/…)
//
// On every section change the orchestrator re-reads `SECTION_BEHAVIORS[i]`
// (from `data.js`) and pushes the section's baseline into every wired
// subsystem within a single frame:
//   • shapeSystem.setPreset(behavior.shape)
//   • companion.setMode(behavior.baselineMode)
//   • layoutMotion.activate(behavior.layout)
//   • scanner.setEnabled(behavior.scanner === true)
//   • textRegions.refresh()
//
// All wired subsystems are optional — the orchestrator is happy running
// alone (as it did in v4) if nothing has been injected yet. This keeps
// scene.js free to wire subsystems piecemeal as they land.
//
// Design refs:
//   §Components · orchestrator.js       — step schema
//   §Algorithms · 1                     — section change response
//   §Data Models                        — SECTION_BEHAVIORS lookups
//   §Error Handling E4                  — zero-size rect fallback
//   §Position Awareness                 — pickSafePosition + stickiness
// Requirements: R1.1, R4.1, R6.1, R7.1–R7.8, R12.1, R12.3, R14.4
// -------------------------------------------------------------

import { scrollState } from './scroll.js';
import { SECTION_BEHAVIORS } from './data.js';

// DOM registry — refreshed each time we build a new program so it always
// reflects the current DOM (helps if content is added later or nodes change).
const REG = {
  refresh() {
    const qsa = (sel) => Array.from(document.querySelectorAll(sel));
    this.hero        = [document.querySelector('.hero__eyebrow')].filter(Boolean);
    this.approach    = qsa('.principle');
    this.timeline    = qsa('.tl-item');
    // v5 Work layout: one spotlight + N reading-list rows.
    // Falls back to legacy `.card` selector if the new markup is not yet in place.
    this.work        = qsa('#work-grid .work__spotlight, #work-grid .work__row');
    if (this.work.length === 0) this.work = qsa('#work-grid .card');
    // v5 Skills manifest lists. Legacy `.skill-group` fallback.
    this.skills      = qsa('.mf-group');
    if (this.skills.length === 0) this.skills = qsa('.skill-group');
    // v5 Recognition: trophies + cert-table rows. Legacy `.recog__item` fallback.
    this.recognition = qsa('.trophy, .cert-table tr');
    if (this.recognition.length === 0) this.recognition = qsa('.recog__item');
    // v5 Vision: numbered interests. Legacy `.vision__item` fallback.
    this.vision      = qsa('.vision-int');
    if (this.vision.length === 0) this.vision = qsa('.vision__item');
    // v5 Contact: meta strip items + email. Legacy `.contact-card` fallback.
    this.contactMeta = qsa('.contact__meta li');
    this.contactHuge = document.querySelector('.contact__email, .contact-huge a');
    this.contactLegacy = qsa('.contact-card');
  },
};

// Reactive mode (post-v5 polish, 2025-11):
// SENTINEL no longer auto-walks a per-section program. Cycling through
// elements with `.sentinel-focused` felt obtrusive — a pulsing outline
// on cards every 2–3 seconds — so the auto-loop is switched off and
// SENTINEL becomes reactive-only:
//   • On section change, it adopts the section's baseline (shape / mode /
//     layout recipe / scanner enabled) and sits at `home`.
//   • Hover / click bindings in `interactions.js` still drive setLookAt,
//     reachTowards, shape nudges, and particle emits.
//   • No `.sentinel-focused` class is added by the orchestrator anymore.
//
// The DOM registry (`REG`) and per-section programs are kept in commented
// form below in case we want to re-enable a cinematic "tour" mode later,
// but the live path just returns an empty program. The `update()` loop
// already has a "no program → return baseline at section home" branch
// that produces exactly the reactive-idle behavior we want.
function buildProgram(_behavior) {
  REG.refresh();
  return [];
}

const FALLBACK_MODES = ['idle', 'analyze', 'trace', 'index', 'parse', 'verify', 'broadcast', 'await'];
const FALLBACK_SHAPES = ['orb', 'prism', 'ring', 'shard', 'lattice', 'seal', 'halo', 'arrow'];

// Tight viewport ⇒ SENTINEL pins to `orb` and skips shape morphs (R13.4).
// Exported so scene.js / interactions.js / tests can share the exact same
// predicate the orchestrator uses to gate `shapeSystem.setPreset` calls.
export function isTight() {
  return window.innerWidth < 720;
}

/**
 * Look up a section's behavior. Falls back to a synthesized default that
 * mirrors v4 semantics for any out-of-range index — this keeps things
 * running even mid-scroll when `scrollState.section` is briefly `-1`.
 */
function behaviorFor(section) {
  const b = SECTION_BEHAVIORS[section];
  if (b) return b;
  const idx = Math.max(0, Math.min(FALLBACK_MODES.length - 1, section | 0));
  return {
    idx,
    name: `section-${idx}`,
    label: `SECTION ${idx}`,
    shape: FALLBACK_SHAPES[idx] || 'orb',
    baselineMode: FALLBACK_MODES[idx] || 'idle',
    program: null,
    layout: null,
    layoutStructure: null,
    home: { x: 0.85, y: 0.5 },
    scanner: false,
  };
}

/**
 * Create the orchestrator. All subsystem dependencies are optional so this
 * can be constructed in isolation for testing or during the piecemeal
 * migration described in the tasks doc. `scene.js` will hand in the wired
 * versions in Task 12.1.
 *
 * @param {object} deps
 * @param {object} [deps.companion]     — { setMode(mode) }
 * @param {object} [deps.shapeSystem]   — { setPreset(name) }
 * @param {object} [deps.scanner]       — { setEnabled(bool) }
 * @param {object} [deps.layoutMotion]  — { activate(recipeKey) }
 * @param {object} [deps.textRegions]   — { refresh(), pickSafePosition(rect, prev) }
 * @param {(el, prev) => void} [deps.onFocusChange]
 */
export function createOrchestrator({
  companion,
  shapeSystem,
  scanner,
  layoutMotion,
  textRegions,
  onFocusChange,
} = {}) {
  let currentSection = -1;
  let currentBehavior = behaviorFor(0);
  let program = [];
  let stepIdx = 0;
  let stepElapsed = 0;
  let stepEmitted = false;
  let focused = null;
  // Previous safe point for stickiness in `textRegions.pickSafePosition`
  // (design §Position Awareness — anti-flicker).
  let previousSafePoint = null;
  // E4: any step encountering a zero-size rect sets this so the program
  // is rebuilt on the next section change (design §Error Handling E4).
  let needsRebuild = false;
  // Reactive hover target (2025-11 polish). Interactions.js writes an
  // element here on hover-in and null on hover-out. When non-null, the
  // orchestrator surfaces it as `element` + `targetRect` + hover-picked
  // safePosition each frame, so scene.js's existing scanner + emission
  // + companion-move pipes light up without needing a program step.
  let hoverEl = null;
  // Anchor mode — how SENTINEL is placed relative to `hoverEl`:
  //   'auto'  — default. Uses textRegions.pickSafePosition (scored,
  //             right-biased, sticky). Fits most sections.
  //   'below' — SENTINEL parks directly below the target rect with a
  //             gap. Used in Contact so the scan-fan visibly rises
  //             from SENTINEL up into the meta item.
  let hoverAnchor = 'auto';

  function unfocus() {
    if (focused) {
      focused.classList.remove('sentinel-focused');
      if (onFocusChange) onFocusChange(null, focused);
      focused = null;
    }
  }

  function focus(el) {
    if (focused === el) return;
    unfocus();
    if (el) {
      el.classList.add('sentinel-focused');
      if (onFocusChange) onFocusChange(el);
      focused = el;
    }
  }

  function sectionHomePoint(behavior) {
    const home = behavior.home || { x: 0.85, y: 0.5 };
    return {
      x: home.x * window.innerWidth,
      y: home.y * window.innerHeight,
    };
  }

  function applyBehavior(behavior) {
    // Design §Algorithms · 1 — every wired subsystem gets the new baseline
    // synchronously within a single frame of the section change.
    if (shapeSystem) {
      // Tight viewport pins to `orb` (R13.4); otherwise use the per-
      // section preset. Body material now uses NormalBlending (see
      // companion.js) so sparse shapes read as solid geometry rather
      // than translucent wireframes.
      shapeSystem.setPreset(isTight() ? 'orb' : behavior.shape);
    }
    if (companion) companion.setMode(behavior.baselineMode);
    if (layoutMotion && behavior.layout) layoutMotion.activate(behavior.layout);
    if (scanner) scanner.setEnabled(behavior.scanner === true);
    if (textRegions) textRegions.refresh();
  }

  function ensureSection() {
    if (scrollState.section === currentSection && !needsRebuild) return;
    unfocus();
    previousSafePoint = null;
    currentSection = scrollState.section;
    currentBehavior = behaviorFor(currentSection);
    program = buildProgram(currentBehavior);
    stepIdx = 0;
    stepElapsed = 0;
    stepEmitted = false;
    needsRebuild = false;
    applyBehavior(currentBehavior);
  }

  /**
   * Advance the schedule one frame.
   *
   * @param {number} dt — seconds since last update
   * @returns {{
   *   mode: string,
   *   shape: string,
   *   element: Element|null,
   *   targetRect: DOMRect|null,
   *   safePosition: {x:number,y:number}|null,
   *   emit: string|null,
   * }}
   *
   * `safePosition` is in DOM top-down space (y grows downward). Callers that
   * render in overlay Y-up space should convert via `viewport.h − y`.
   * `emit` is populated ONLY on the frame a step begins.
   */
  function update(dt) {
    ensureSection();

    // Reactive-mode branch: no auto-program, but if the user is hovering
    // something interactions.js has told us about, surface it as the
    // current target so scene.js drives SENTINEL, the scanner (in Work),
    // and particle emission direction toward it.
    if (program.length === 0) {
      unfocus();
      const baseMode  = currentBehavior.baselineMode || FALLBACK_MODES[currentSection] || 'idle';
      const baseShape = currentBehavior.shape || FALLBACK_SHAPES[currentSection] || 'orb';

      if (hoverEl) {
        const rect = hoverEl.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          const home = sectionHomePoint(currentBehavior);
          let safe = null;

          if (hoverAnchor === 'below') {
            // Force placement directly beneath the target rect with a
            // 60 px gap. Clamped to viewport edge padding so items
            // near the bottom of the screen still get a valid point.
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const EDGE_PAD = 40;
            safe = {
              x: Math.max(EDGE_PAD, Math.min(vw - EDGE_PAD, rect.left + rect.width / 2)),
              y: Math.max(EDGE_PAD, Math.min(vh - EDGE_PAD, rect.bottom + 60)),
            };
          } else if (textRegions && typeof textRegions.pickSafePosition === 'function') {
            // Default 'auto' — scored, right-biased, sticky. If it
            // falls through to section home (tier-2), override with
            // pickAdjacentPosition so SENTINEL still parks near the
            // element rather than flying to home on edge items.
            safe = textRegions.pickSafePosition(rect, previousSafePoint);
            if (safe && Math.abs(safe.x - home.x) < 2 && Math.abs(safe.y - home.y) < 2) {
              safe = pickAdjacentPosition(rect);
            }
          } else {
            safe = pickAdjacentPosition(rect);
          }

          if (safe) previousSafePoint = safe;
          return {
            mode: baseMode,
            shape: baseShape,
            element: hoverEl,
            targetRect: rect,
            safePosition: safe || home,
            emit: null,
          };
        }
      }

      return {
        mode: baseMode,
        shape: baseShape,
        element: null,
        targetRect: null,
        safePosition: sectionHomePoint(currentBehavior),
        emit: null,
      };
    }

    let step = program[stepIdx];
    stepElapsed += dt;

    // Advance to next step if this one is finished.
    if (stepElapsed >= step.duration) {
      stepIdx = (stepIdx + 1) % program.length;
      stepElapsed = 0;
      stepEmitted = false;
      step = program[stepIdx];
    }

    // Resolve the step's target rect and guard against zero-size (E4).
    // A zero-size rect means the element is display:none, in a collapsed
    // ancestor, or detached — falling through to section home is the safe
    // move, and we mark the program dirty so the next section change gives
    // us a fresh DOM registry.
    let targetRect = null;
    let effectiveElement = step.element || null;
    if (effectiveElement) {
      const rect = effectiveElement.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        targetRect = rect;
      } else {
        // Zero-size rect: treat as element:null for THIS frame + mark
        // rebuild on next section change.
        effectiveElement = null;
        needsRebuild = true;
      }
    }

    // Focus/unfocus DOM element. `step.focus === false` opts out of the
    // `.sentinel-focused` class (design §Components · orchestrator.js).
    const shouldFocus = step.focus !== false && effectiveElement !== null;
    focus(shouldFocus ? effectiveElement : null);

    // Compute safe screen position. When a targetRect is available, ask
    // `textRegions` for a text-avoiding placement with previous-point
    // stickiness. When there's no target, fall back to section home.
    let safePosition = null;
    if (targetRect) {
      if (textRegions && typeof textRegions.pickSafePosition === 'function') {
        safePosition = textRegions.pickSafePosition(targetRect, previousSafePoint);
      } else {
        // Legacy fallback path — same shape API but no text awareness.
        safePosition = pickAdjacentPosition(targetRect);
      }
    } else {
      safePosition = sectionHomePoint(currentBehavior);
    }
    if (safePosition) previousSafePoint = safePosition;

    // Fire emit exactly once per step. Skip the emit on the zero-size
    // fallback frame — no point aiming particles at a ghost element.
    let emitNow = null;
    if (!stepEmitted && step.emit && targetRect) {
      emitNow = step.emit;
      stepEmitted = true;
    } else if (!stepEmitted && step.emit && !step.element) {
      // Element-less steps (e.g. vision broadcast) still fire their emit.
      emitNow = step.emit;
      stepEmitted = true;
    }

    return {
      mode: step.mode,
      shape: step.shape || currentBehavior.shape,
      element: effectiveElement,
      targetRect,
      safePosition,
      emit: emitNow,
    };
  }

  function dispose() {
    unfocus();
    hoverEl = null;
  }

  /**
   * Reactive hover hook — interactions.js calls this on hover-in with the
   * hovered element and on hover-out with `null`. The next `update()`
   * frame will surface the hover element as `element` + `targetRect` +
   * hover-picked safe position so scene.js re-uses its normal pipes to
   * move SENTINEL, retarget the scanner (in Work), and aim particles.
   *
   * Passing the same element that's already active is idempotent.
   * Passing `null` clears the hover state; SENTINEL returns to its
   * section home on the next tick.
   *
   * @param {Element|null} el
   */
  /**
   * Set the hover target for reactive-mode positioning.
   * @param {Element|null} el
   * @param {{ anchor?: 'auto'|'below' }} [opts]
   *   `anchor: 'below'` forces SENTINEL to sit directly beneath the
   *   target with a 60 px gap (used in Contact so the fan visibly
   *   emanates from below). Defaults to 'auto' (scored placement).
   */
  function setHoverTarget(el, opts = {}) {
    hoverEl = el || null;
    hoverAnchor = (opts && opts.anchor === 'below') ? 'below' : 'auto';
    if (!hoverEl) {
      previousSafePoint = null;
      hoverAnchor = 'auto';
    }
  }

  return { update, dispose, setHoverTarget };
}

/**
 * @deprecated v5 — use `textRegions.pickSafePosition(rect, prev)` instead.
 *
 * Legacy screen-space picker that only considers the target element's
 * bounding rect, not the surrounding text regions. Kept exported for
 * backward compatibility with call sites that have not yet been migrated
 * to the text-aware `textRegions` module. New code should not use this.
 */
export function pickAdjacentPosition(rect) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const margin = 70;
  const spaceRight = w - rect.right;
  const spaceLeft  = rect.left;
  const spaceTop   = rect.top;
  const spaceBot   = h - rect.bottom;

  // Prefer the horizontal side with more room, provided it's enough.
  if (spaceRight >= margin + 30 && spaceRight >= spaceLeft) {
    return { x: rect.right + margin, y: rect.top + rect.height / 2 };
  }
  if (spaceLeft >= margin + 30) {
    return { x: rect.left - margin, y: rect.top + rect.height / 2 };
  }
  // Element takes most of the width — try above or below
  if (spaceTop >= margin + 30) {
    return { x: rect.left + rect.width / 2, y: rect.top - margin };
  }
  if (spaceBot >= margin + 30) {
    return { x: rect.left + rect.width / 2, y: rect.bottom + margin };
  }
  // Nothing fits — fallback to the corner
  return { x: rect.right + 20, y: rect.top + rect.height / 2 };
}
