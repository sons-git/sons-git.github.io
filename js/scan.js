// -------------------------------------------------------------
// Cinematic scanner v2 — the "movie laser scan" overlay for the Work section.
//
// A rectangular scan zone that appears over the currently-focused project card.
// Rendered as a single centered Plane in overlay orthographic pixel space with
// a pixel-space fragment shader (imported from ./shaders.js) that draws:
//   • Corner L-brackets (pixel-thick arms)
//   • Faint HUD grid pattern
//   • Bright horizontal scan line that sweeps top → bottom on a loop
//   • Soft glow halo behind the scan line
//   • Subtle outer border
//
// Key fixes over v1 (see design.md §Cinematic Scanner):
//   • Centered PlaneGeometry (no geom.translate). Position uses rect *centre*
//     in overlay pixel space:  centerY_overlay = viewport.h − (top + h/2).
//   • Feature sizes (corner arm, thickness, scan line, glow, grid) are all
//     passed in pixels so the visual reads consistently across any rect
//     aspect ratio.
//   • NormalBlending + renderOrder = 10 so the panel reads as an ink overlay
//     drawing above trail + halo but below SENTINEL's body.
//   • Master-opacity lerp coefficient 0.18. While targetRect ≠ null the
//     visible floor is clamped at 0.35 so the scanner never disappears
//     during Work reads. mesh.visible flips off once uOpacity ≤ 0.02.
//   • On retarget where the centre moves > 200 px, dip uOpacity ≤ 0.55
//     producing an "acquiring" beat.
//   • ?scan-debug=1 forces full opacity, forces visibility, draws a magenta
//     1 px DOM outline on the source rect, and console.logs every setTarget.
//
// Public API (unchanged shape + new gates):
//   mesh                            — Plane in overlay pixel space
//   setTarget(rect | null)          — DOM rect { left, top, width, height }
//   setColor(THREE.Color)           — tint (usually matches SENTINEL hue)
//   setEnabled(bool)                — orchestrator gate; false = fade out
//                                     immediately as if setTarget(null)
//   setPrefersReduced(bool)         — reduced-motion gate; true = never
//                                     become visible, overriding any target
//   update(dt)                      — per-frame; drives sweep + opacity
//   dispose()
// -------------------------------------------------------------

import * as THREE from 'three';
import { scanVert, scanFrag } from './shaders.js';

const SCAN_PERIOD  = 1.4;   // seconds — one top-to-bottom sweep
const MARGIN       = 12;    // pixel margin around targetRect on each side
const OPACITY_LERP = 0.18;  // per-frame lerp coefficient toward target opacity
const OPACITY_FLOOR = 0.35; // minimum visible opacity while active (R5.4)
const OPACITY_HIDE  = 0.02; // hide mesh once opacity ≤ this (R5.10)
const RETARGET_DIP  = 0.55; // opacity cap on large retarget (R5.8)
const RETARGET_DELTA = 200; // px centre distance that triggers the dip

// Read the ?scan-debug=1 flag once at module init. Guarded so this file is
// safe to import in non-browser contexts (harness / node).
function readDebugFlag() {
  try {
    if (typeof window === 'undefined' || !window.location) return false;
    const p = new URLSearchParams(window.location.search);
    return p.get('scan-debug') === '1';
  } catch (_e) {
    return false;
  }
}

/**
 * Create the cinematic scanner overlay.
 *
 * @returns {{
 *   mesh: THREE.Mesh,
 *   setTarget: (rect: { left: number, top: number, width: number, height: number } | null) => void,
 *   setColor: (c: THREE.Color) => void,
 *   setEnabled: (b: boolean) => void,
 *   setPrefersReduced: (b: boolean) => void,
 *   update: (dt: number) => void,
 *   dispose: () => void,
 * }}
 */
export function createScanner() {
  // Centered plane — DO NOT geom.translate. Position uses the rect *centre*
  // so aspect stretching stays symmetric and the corner brackets land on the
  // right corners regardless of rect size (R5.3, design §Cinematic Scanner).
  const geom = new THREE.PlaneGeometry(1, 1);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uScanY:    { value: 1 },
      uOpacity:  { value: 0 },
      uColor:    { value: new THREE.Color(0x6ee7f9) },
      uSizePx:   { value: new THREE.Vector2(200, 200) },
      // Pixel-space feature uniforms — defaults per task 5.1.
      uCornerPx: { value: 22 },
      uThickPx:  { value: 2 },
      uScanPx:   { value: 2 },
      uGlowPx:   { value: 40 },
      uGridPx:   { value: 32 },
    },
    vertexShader: scanVert,
    fragmentShader: scanFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,   // R5 — panel + brackets composite via
                                      // shader; normal alpha for final output.
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.renderOrder = 10;              // above trail + halo, below body (R5.6)
  // Park far off-screen until the first setTarget lands. Prevents a stray
  // 1×1 plane from flashing at the overlay origin on boot.
  mesh.position.set(-99999, 0, 0);

  // ---- Internal state --------------------------------------------------

  // Last rect requested by the caller. This is what setEnabled/setPrefersReduced
  // gate against without destroying the caller's intent.
  let requestedTarget = null;

  // Centre of the previous target — used for the retarget-dip test.
  let prevCenter = null;

  // Sweep phase, 0..1. Advances by dt/SCAN_PERIOD every frame while active.
  let scanT = 0;

  // Gates. Both default to "not blocking" so the scanner is ready to render
  // as soon as scene.js wires the media-query state and the orchestrator
  // enables the section.
  let enabled = true;
  let prefersReduced = false;

  // ?scan-debug=1 aids (design §Cinematic Scanner · Debugging Aids, R5.9).
  const DEBUG = readDebugFlag();
  let debugOutline = null;
  if (DEBUG && typeof document !== 'undefined' && document.body) {
    debugOutline = document.createElement('div');
    debugOutline.setAttribute('data-scan-debug', '1');
    debugOutline.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'z-index:9999',
      'border:1px solid #ff00ff',
      'box-sizing:border-box',
      'display:none',
      'left:0',
      'top:0',
      'width:0',
      'height:0',
    ].join(';');
    document.body.appendChild(debugOutline);
  }

  // ---- Helpers ---------------------------------------------------------

  // Effective target after applying the enabled + reduced-motion gates.
  // When gated off, the scanner fades toward invisible as if setTarget(null)
  // had been called — but we keep `requestedTarget` intact so a later
  // setEnabled(true) doesn't require the caller to re-issue setTarget.
  function effectiveTarget() {
    if (!enabled) return null;
    if (prefersReduced) return null;
    return requestedTarget;
  }

  // ---- Public API ------------------------------------------------------

  function setTarget(rect) {
    if (DEBUG) {
      // Log every call — including nulls — so retarget beats and clears are
      // both visible when diagnosing the scanner.
      // eslint-disable-next-line no-console
      console.log('[scanner] setTarget', rect ? { ...rect } : null);
    }

    const next = rect
      ? {
          left:   rect.left,
          top:    rect.top,
          width:  rect.width,
          height: rect.height,
        }
      : null;

    // Retarget-dip: on a large centre move, cap opacity below RETARGET_DIP so
    // the scanner visibly re-acquires the new target (R5.8). Only fires when
    // both prev and next centres exist — an initial acquisition should not
    // dip on first appearance.
    if (next && prevCenter) {
      const cx = next.left + next.width  / 2;
      const cy = next.top  + next.height / 2;
      const dx = cx - prevCenter.x;
      const dy = cy - prevCenter.y;
      if (Math.hypot(dx, dy) > RETARGET_DELTA) {
        mat.uniforms.uOpacity.value = Math.min(
          mat.uniforms.uOpacity.value,
          RETARGET_DIP
        );
      }
    }

    requestedTarget = next;
    prevCenter = next
      ? { x: next.left + next.width / 2, y: next.top + next.height / 2 }
      : null;
  }

  function setColor(c) {
    mat.uniforms.uColor.value.copy(c);
  }

  // Orchestrator gate. When set to false, the scanner behaves as if
  // setTarget(null) had been called — opacity lerps toward 0 and mesh.visible
  // flips off once uOpacity ≤ OPACITY_HIDE. The caller's requestedTarget is
  // preserved so setEnabled(true) resumes at the last known rect.
  function setEnabled(b) {
    enabled = !!b;
  }

  // Reduced-motion gate. When true, the scanner must not become visible
  // regardless of any active target (R5.2, R11.3).
  function setPrefersReduced(b) {
    prefersReduced = !!b;
  }

  function update(dt) {
    const target = effectiveTarget();

    // Master opacity lerp toward 1 (active) or 0 (inactive). Coefficient 0.18
    // means we settle in ~5–6 frames at 60 fps (R5.4).
    let op = mat.uniforms.uOpacity.value;
    const targetOp = target ? 1 : 0;
    op += (targetOp - op) * OPACITY_LERP;

    // Visible floor only applies while we have an active effective target.
    // When disabled or reduced-motion is on, we want a clean fade to 0.
    if (target && op < OPACITY_FLOOR) op = OPACITY_FLOOR;

    mat.uniforms.uOpacity.value = op;
    mesh.visible = op > OPACITY_HIDE;

    if (target) {
      // Rect + margin, in DOM pixel space.
      const w  = target.width  + 2 * MARGIN;
      const h  = target.height + 2 * MARGIN;
      const cx = target.left + target.width  / 2;
      const cy = target.top  + target.height / 2;

      const viewportH = (typeof window !== 'undefined') ? window.innerHeight : 0;

      // Overlay Y-up: the overlay camera has (top: viewport.h, bottom: 0), so
      // world_y increases visually upward. Flip DOM top-down cy through the
      // viewport height to place the mesh centre correctly (R5.3).
      mesh.position.set(cx, viewportH - cy, 0);
      mesh.scale.set(w, h, 1);
      mat.uniforms.uSizePx.value.set(w, h);

      // Advance sweep phase and wrap.
      scanT = (scanT + dt / SCAN_PERIOD) % 1;
      if (scanT < 0) scanT += 1;

      // Top-to-bottom visual sweep (R5.7). In THREE.PlaneGeometry the vertex
      // at local (+0.5, +0.5) carries uv = (1, 1) and, with the overlay Y-up
      // ortho, sits at the *visual top* of the rect. The shader renders the
      // scan line at uv.y = uScanY, so uScanY = 1 → visual top and
      // uScanY = 0 → visual bottom. To sweep top → bottom as time advances,
      // uScanY must decrease from 1 to 0, hence  1 − scanT.
      mat.uniforms.uScanY.value = 1 - scanT;
    }

    // ?scan-debug=1 — force fully visible on the source rect and paint a
    // magenta 1 px outline in the DOM (R5.9, design §Cinematic Scanner).
    if (DEBUG) {
      if (requestedTarget) {
        mat.uniforms.uOpacity.value = 1;
        mesh.visible = true;

        // Even in debug mode we still need the mesh positioned over the rect,
        // regardless of the gates. Recompute here in case the effective target
        // block above was skipped due to setEnabled(false) / prefersReduced.
        if (!target) {
          const w  = requestedTarget.width  + 2 * MARGIN;
          const h  = requestedTarget.height + 2 * MARGIN;
          const cx = requestedTarget.left + requestedTarget.width  / 2;
          const cy = requestedTarget.top  + requestedTarget.height / 2;
          const viewportH = (typeof window !== 'undefined') ? window.innerHeight : 0;
          mesh.position.set(cx, viewportH - cy, 0);
          mesh.scale.set(w, h, 1);
          mat.uniforms.uSizePx.value.set(w, h);
        }

        if (debugOutline) {
          debugOutline.style.display = 'block';
          debugOutline.style.left   = requestedTarget.left   + 'px';
          debugOutline.style.top    = requestedTarget.top    + 'px';
          debugOutline.style.width  = requestedTarget.width  + 'px';
          debugOutline.style.height = requestedTarget.height + 'px';
        }
      } else if (debugOutline) {
        debugOutline.style.display = 'none';
      }
    }
  }

  function dispose() {
    if (debugOutline && debugOutline.parentNode) {
      debugOutline.parentNode.removeChild(debugOutline);
    }
    geom.dispose();
    mat.dispose();
  }

  return {
    mesh,
    setTarget,
    setColor,
    setEnabled,
    setPrefersReduced,
    update,
    dispose,
  };
}
