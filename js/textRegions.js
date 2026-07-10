// -------------------------------------------------------------
// textRegions.js — text-safe placement for SENTINEL.
//
// Owns two responsibilities:
//   1. Cache DOM rects of "primary reading zones" the buddy must
//      never obscure (rebuilt on section change + resize, never per
//      frame — R4.9, R13.6).
//   2. Given a target rect (element SENTINEL is currently "reading")
//      and the previous safe point, return a screen-space point that
//      is inside the viewport, at least BUDDY_R + 8 px from every
//      cached text rect, and biased toward the right-gutter on wide
//      screens (R4.1–R4.7).
//
// Mobile bypass (R4.8): when viewport width < 720 px, the algorithm is
// skipped and the buddy is pinned bottom-right, 90 px from each edge.
//
// Algorithm — scored greedy with hysteresis (2025-11 v2).
//   The prior deterministic priority order snapped between discrete
//   slots (feels stiff) and didn't honour `prev`, so hovering different
//   items in the same section teleported SENTINEL. Standard practice
//   in D3 force layouts, tooltip libraries (Flook, Popper), and
//   path-planning literature is to score many candidates by clearance
//   + stickiness and return the best. That approach:
//     • generates a dense fan of candidates (12 angles × 2 radii = 24)
//       plus right/left gutter anchors,
//     • scores each by min-distance to every cached text rect,
//     • adds a stickiness bonus for candidates near `prev` so SENTINEL
//       stays put when possible (smooth motion), and
//     • adds a right-gutter bonus on wide screens (design bias).
//   Best score wins. If no candidate clears the text-avoidance
//   threshold, the highest-scoring candidate is returned anyway
//   (graceful degradation — E5 tier 1).
//
// See design.md §Position Awareness and §Algorithms · 3.
// -------------------------------------------------------------

import { SECTION_BEHAVIORS } from './data.js';

// -------------------------------------------------------------
// Constants — pulled from design.md §Position Awareness.
// -------------------------------------------------------------
export const BUDDY_R = 55;         // buddy visual radius incl. halo edge
export const MARGIN  = 70;         // preferred gap between buddy and target
export const EDGE_PAD = 40;        // min distance from viewport edges
export const TEXT_PAD = 8;         // extra pad past BUDDY_R for text rejection

const MOBILE_BREAKPOINT = 720;
const WIDE_BREAKPOINT   = 1200;

// Scoring weights — tuned so stickiness dominates when clearance is
// already "good enough" (SENTINEL stays where it is), but clearance
// dominates when the current spot is bad (SENTINEL moves to safety).
const W_CLEARANCE       = 1.0;   // raw px of min-distance from any text
const W_STICKINESS      = 0.9;   // px of proximity to `prev` (inverse dist)
const W_RIGHT_BIAS      = 0.35;  // small bias toward right-of-target on wide
const W_TARGET_CENTER   = 0.15;  // small bias toward vertical centre of target
const CLEARANCE_ENOUGH  = 40;    // clearance beyond this doesn't score higher
const STICKINESS_RADIUS = 180;   // beyond this, sticky bonus decays to 0
const OVERLAP_PENALTY   = 4000;  // massive penalty for a point inside text

// Candidate generation — 12 angles × 2 radii = 24 candidates.
// Angles start at "right" and step 30° clockwise; two radii so we can
// pick a tight-in spot when the target is small or a comfortable
// offset when the target is wide. Cap radius at 140 px so SENTINEL
// stays visibly near the hovered element on wide rows.
const CANDIDATE_ANGLES = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
const RADIUS_MIN_CAP = 90;
const RADIUS_MAX_CAP = 140;

// Default reading-zone selectors (design §Position Awareness).
// `.card__title` / `.card__summary` are scoped to the currently
// focused card via `.sentinel-focused`, so unfocused cards remain
// available as adjacent-target sites.
export const DEFAULT_TEXT_SELECTORS = [
  '.section__lead',
  '.section__title',
  '.hero__title',
  '.hero__sub',
  '.hero__eyebrow',
  '.principle__body',
  '.principle__title',
  '.tl-desc',
  '.tl-title',
  '.sentinel-focused .card__title',
  '.sentinel-focused .card__summary',
  '.card.sentinel-focused .card__title',
  '.card.sentinel-focused .card__summary',
  '.skill-group h3',
  '.skill-group li',
  '.mf-list li',
  '.recog__name',
  '.recog__note',
  '.vision__lead',
  '.vision__item p',
  '.contact-huge a',
  '.contact__email',
];

// -------------------------------------------------------------
// Pure helpers — exported for test harness (task 3.2 / P1).
// -------------------------------------------------------------

/** Euclidean distance from a point to an axis-aligned rect. 0 if inside. */
export function distancePointToRect(px, py, rect) {
  const dx = Math.max(rect.left - px, 0, px - rect.right);
  const dy = Math.max(rect.top - py, 0, py - rect.bottom);
  return Math.hypot(dx, dy);
}

/** Point sits inside viewport with `pad` clearance from every edge. */
export function insideViewport(point, viewport, pad) {
  return (
    point.x >= pad &&
    point.x <= viewport.w - pad &&
    point.y >= pad &&
    point.y <= viewport.h - pad
  );
}

/** Build the 12-angle × 2-radius candidate ring around a target rect. */
export function buildCandidates(targetRect) {
  const cx = targetRect.left + targetRect.width / 2;
  const cy = targetRect.top + targetRect.height / 2;
  const half = Math.max(targetRect.width, targetRect.height) / 2;
  const rInner = Math.min(RADIUS_MAX_CAP, Math.max(RADIUS_MIN_CAP, MARGIN + half * 0.6));
  const rOuter = Math.min(RADIUS_MAX_CAP + 40, MARGIN + half + 40);
  const out = [];
  for (const a of CANDIDATE_ANGLES) {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    out.push({ x: cx + ca * rInner, y: cy + sa * rInner, angle: a });
    out.push({ x: cx + ca * rOuter, y: cy + sa * rOuter, angle: a });
  }
  return out;
}

// -------------------------------------------------------------
// Factory
// -------------------------------------------------------------

/**
 * @param {Object} [opts]
 * @param {string[]} [opts.selectors]   CSS selectors of protected text zones.
 * @param {() => number} [opts.getSectionIndex]
 *   Callback returning the current section index (0..7). Used only for the
 *   tier-2 fallback to look up `SECTION_BEHAVIORS[i].home`. Defaults to 0.
 * @returns {{
 *   refresh: () => void,
 *   list: () => Array<{left:number,top:number,right:number,bottom:number,width:number,height:number}>,
 *   pickSafePosition: (target: {left:number,top:number,width:number,height:number}, prev?: {x:number,y:number}|null) => {x:number,y:number},
 *   dispose: () => void
 * }}
 */
export function createTextRegions(opts = {}) {
  const selectors = Array.isArray(opts.selectors) && opts.selectors.length
    ? opts.selectors.slice()
    : DEFAULT_TEXT_SELECTORS.slice();
  const getSectionIndex = typeof opts.getSectionIndex === 'function'
    ? opts.getSectionIndex
    : () => 0;

  let cache = [];
  let disposed = false;

  // -----------------------------------------------------------
  // Cache management — called by scene.js on section change +
  // window resize. Also called on-demand from pickSafePosition
  // when rects may have gone stale on scroll (viewport-relative).
  // -----------------------------------------------------------
  function refresh() {
    if (disposed || typeof document === 'undefined') return;
    const rects = [];
    for (const sel of selectors) {
      let nodes;
      try {
        nodes = document.querySelectorAll(sel);
      } catch (err) {
        // Invalid selector — skip silently, don't kill the batch.
        continue;
      }
      for (const el of nodes) {
        if (!el || typeof el.getBoundingClientRect !== 'function') continue;
        const r = el.getBoundingClientRect();
        // Skip zero-size rects (hidden / detached elements).
        if (r.width <= 0 || r.height <= 0) continue;
        rects.push({
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        });
      }
    }
    cache = rects;
  }

  function list() {
    return cache.slice();
  }

  // -----------------------------------------------------------
  // Section home fallback — reads SECTION_BEHAVIORS[idx].home
  // (normalized 0..1) and maps to viewport pixels.
  // -----------------------------------------------------------
  function sectionHomePoint(viewport) {
    const idx = getSectionIndex() | 0;
    const behavior = SECTION_BEHAVIORS[idx] || SECTION_BEHAVIORS[0];
    const home = (behavior && behavior.home) || { x: 0.78, y: 0.34 };
    return {
      x: home.x * viewport.w,
      y: home.y * viewport.h,
    };
  }

  // -----------------------------------------------------------
  // Score a candidate. Higher is better. Contributors:
  //   • clearance    — min distance to any cached text rect,
  //                    saturated at CLEARANCE_ENOUGH so we don't
  //                    over-reward far-away positions.
  //   • stickiness   — proximity to `prev` (smooth motion between
  //                    hovers). Decays linearly to 0 at STICKINESS_RADIUS.
  //   • rightBias    — small bonus for being right-of-target on
  //                    wide screens (design intent — right gutter home).
  //   • targetProx   — small bonus for being near the target's
  //                    vertical centre so SENTINEL parks at reading
  //                    height rather than corners.
  //   • overlap      — huge penalty for a point that's inside any
  //                    text rect (distance 0). Only used as a
  //                    tiebreaker when nothing clears.
  // -----------------------------------------------------------
  function scoreCandidate(cand, targetRect, prev, viewport, textCache) {
    // Edge check — out-of-viewport is disqualified outright.
    if (!insideViewport(cand, viewport, EDGE_PAD)) return -Infinity;

    let minClear = Infinity;
    for (const t of textCache) {
      const d = distancePointToRect(cand.x, cand.y, t);
      if (d < minClear) minClear = d;
      if (minClear <= 0) break;  // inside a rect — no need to keep checking
    }

    let score = 0;

    // Clearance — saturated. A candidate 200 px from any text is no
    // better than one 40 px from any text (both are "safe enough").
    const clearance = Math.min(minClear, CLEARANCE_ENOUGH);
    score += clearance * W_CLEARANCE;

    // Overlap penalty — if the point is closer than BUDDY_R + TEXT_PAD
    // to any text rect it's considered overlapping. Strong penalty so
    // scored candidates only lose to non-overlapping ones.
    if (minClear < BUDDY_R + TEXT_PAD) {
      const overlap = (BUDDY_R + TEXT_PAD) - minClear;
      score -= overlap * (OVERLAP_PENALTY / (BUDDY_R + TEXT_PAD));
    }

    // Stickiness — bonus for candidates near `prev`. Linear decay to
    // 0 at STICKINESS_RADIUS. When SENTINEL is already in a good
    // spot, this keeps it there instead of hopping to an equally
    // good but distant alternative.
    if (prev && isFinite(prev.x) && isFinite(prev.y)) {
      const d = Math.hypot(cand.x - prev.x, cand.y - prev.y);
      const proximity = Math.max(0, STICKINESS_RADIUS - d);
      score += proximity * W_STICKINESS;
    }

    // Right-gutter bias — only on wide screens. Design intent is
    // SENTINEL rests in the right gutter unless doing so overlaps text.
    if (viewport.w >= WIDE_BREAKPOINT) {
      const targetCX = targetRect.left + targetRect.width / 2;
      if (cand.x > targetCX) {
        score += Math.min(120, cand.x - targetCX) * W_RIGHT_BIAS;
      }
    }

    // Target centre proximity — pulls SENTINEL toward reading height
    // (not floating above or below the block).
    const targetCY = targetRect.top + targetRect.height / 2;
    const vDist = Math.abs(cand.y - targetCY);
    score += Math.max(0, 160 - vDist) * W_TARGET_CENTER;

    return score;
  }

  // -----------------------------------------------------------
  // pickSafePosition — scored greedy with stickiness.
  //
  // Rebuilds the cache on every call because rects are viewport-
  // relative (scroll invalidates them). The selector list is ~20
  // items — sub-millisecond cost on any modern browser.
  //
  // Returns the highest-scoring candidate. If every candidate scored
  // -Infinity (all outside viewport, impossible under normal layouts),
  // falls back to the section home point.
  // -----------------------------------------------------------
  function pickSafePosition(targetRect, prev) {
    const viewport = {
      w: typeof window !== 'undefined' ? window.innerWidth : 1440,
      h: typeof window !== 'undefined' ? window.innerHeight : 900,
    };

    if (viewport.w < MOBILE_BREAKPOINT) {
      return { x: viewport.w - 90, y: viewport.h - 90 };
    }

    if (
      !targetRect ||
      !isFinite(targetRect.left) ||
      !isFinite(targetRect.top) ||
      !(targetRect.width > 0) ||
      !(targetRect.height > 0)
    ) {
      return sectionHomePoint(viewport);
    }

    // Refresh cache every call — viewport-relative rects go stale on
    // scroll. Cheap for our selector count.
    refresh();

    const candidates = buildCandidates(targetRect);

    // Score all candidates. Track the best score and its point.
    let bestScore = -Infinity;
    let best = null;
    for (const c of candidates) {
      const s = scoreCandidate(c, targetRect, prev, viewport, cache);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    if (best && bestScore > -Infinity) {
      return { x: best.x, y: best.y };
    }

    return sectionHomePoint(viewport);
  }

  function dispose() {
    disposed = true;
    cache = [];
  }

  return { refresh, list, pickSafePosition, dispose };
}
