// -------------------------------------------------------------
// scanFan.js — WebGL laser-fan scan effect for the overlay scene.
//
// Adapted from prisoner849's CodePen demo (mdxQjeW) — a PlaneGeometry
// whose vertices are remapped into a polar fan, then rendered with
// a MeshBasicMaterial patched via onBeforeCompile to composite:
//   • mainWave  — moving sine wave along the fan's angular axis
//   • sideLines — bright edges at the fan's outer angular limits
//   • scanLine  — thin bar sweeping angularly back-and-forth
//   • fadeOut   — power-curve fade from emitter toward the tip
//
// Design intent for SENTINEL:
//   Mount into the ortho overlay scene (same one SENTINEL lives in),
//   position at SENTINEL's overlay coords each frame, rotate around Z
//   to point at a hover target, and pulse in/out on `fireAt`. Reads
//   as "SENTINEL fires a scanning laser cone" — matches the movie /
//   Iron-Man scan brief the user asked for.
//
// Public API:
//   createScanFan(THREE, opts?) → { mesh, setPosition, fireAt, update, dispose }
//     mesh          THREE.Mesh — add to overlayScene
//     setPosition(x, y)         — move the anchor point (SENTINEL)
//     fireAt(x, y, opts?)       — orient at target + activate fade-in
//     update(dt)                — advance shader time + fade
//     dispose()                 — free geometry / material
//
// The module accepts `THREE` as an argument rather than importing so
// scene.js's already-loaded Three (via importmap) is the one used,
// keeping bundle-graph simple.
// -------------------------------------------------------------

/**
 * @param {typeof import('three')} THREE
 * @param {object} [opts]
 * @param {number} [opts.inner]       — inner (emitter-side) radius, px
 * @param {number} [opts.outer]       — outer (tip-side) radius, px
 * @param {number} [opts.spreadDeg]   — total angular spread of the fan
 * @param {number} [opts.color]       — hex color (default cyan accent)
 * @param {number} [opts.segAngular]  — angular tessellation
 * @param {number} [opts.segRadial]   — radial tessellation
 * @param {number} [opts.activeMs]    — how long the fan stays lit per fire
 * @param {number} [opts.fadeInMs]    — fade-in duration
 * @param {number} [opts.fadeOutMs]   — fade-out duration after activeMs
 * @returns {{
 *   mesh: any,
 *   uniforms: { time: { value: number } },
 *   setPosition: (x: number, y: number) => void,
 *   fireAt: (x: number, y: number, opts?: { duration?: number }) => void,
 *   update: (dt: number) => void,
 *   dispose: () => void,
 * }}
 */
export function createScanFan(THREE, opts = {}) {
  const {
    inner       = 26,
    outer       = 540,
    spreadDeg   = 44,
    color       = 0x6ee7f9,
    segAngular  = 72,
    segRadial   = 20,
    activeMs    = 1400,
    fadeInMs    = 220,
    fadeOutMs   = 380,
  } = opts;

  // ---- Geometry — flat plane remapped into polar fan --------
  //
  // Vertex remap (from the codepen reference):
  //   y = 1 - uv.y            → 0 at UV top (near), 1 at UV bottom (far)
  //   radius = inner + (outer − inner) * y
  //   newX = cos(x · spread) · radius,  newY = sin(x · spread) · radius
  //
  // The original PlaneGeometry x-coord is in [-0.5, +0.5], so
  // `x · spread` sweeps [-spread/2, +spread/2] — total angular width
  // equals `spread` radians. The fan then lives in the local XY plane
  // opening along +X.
  const spread = THREE.MathUtils.degToRad(spreadDeg);
  const geom = new THREE.PlaneGeometry(1, 1, segAngular, segRadial);
  const pos = geom.attributes.position;
  const uv  = geom.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const yUv = 1 - uv.getY(i);
    const radius = inner + (outer - inner) * yUv;
    const x = pos.getX(i);
    pos.setXY(i, Math.cos(x * spread) * radius, Math.sin(x * spread) * radius);
  }
  pos.needsUpdate = true;
  geom.computeBoundingSphere();
  geom.computeBoundingBox();

  // ---- Material + shader patch -------------------------------
  //
  // Injected fragment code (post-`#include <color_fragment>`):
  //   mainWave    — cyclic amplitude wave crossing the fan
  //   sideLines   — smoothstep peaks at |vUv.x - 0.5| > 0.45, i.e.,
  //                 fan edges only. Reads as "reach" boundary lines.
  //   scanLine    — thin bar at vUv.x = sin(t·2.7)·0.5+0.5 sweeping
  //                 back and forth across the fan angularly
  //   fadeOut     — pow(vUv.y, 2.7); vUv.y = 1 at emitter (bright),
  //                 0 at tip (invisible)
  //   alpha       — max(mainWave, sideLines, scanLine) · fadeOut · opacity
  //
  // `time` is our own uniform. The material's built-in `opacity`
  // uniform (from `mat.opacity`) is already declared by Three.js's
  // shader chunks and automatically multiplied into `diffuseColor.a`
  // downstream of `<color_fragment>`, so we do NOT redeclare it —
  // a duplicate `uniform float opacity` gave a GLSL "redefinition"
  // compile error and dropped the fan entirely. Instead we drive
  // `mat.opacity` from JS and let Three apply the fade.
  const uniforms = {
    time: { value: 0 },
  };

  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0,   // starts hidden; `fireAt` fades this in
  });
  mat.defines = { USE_UV: '' };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.time = uniforms.time;
    shader.fragmentShader =
      `uniform float time;\n${shader.fragmentShader}`
        .replace(
          '#include <color_fragment>',
          `
          #include <color_fragment>
          float t = time;
          float mainWave = sin((vUv.x - t * 0.2) * 1.5 * PI2) * 0.5 + 0.5;
          mainWave = mainWave * 0.25 + 0.25;
          mainWave *= (sin(t * PI2 * 5.) * 0.5 + 0.5) * 0.25 + 0.75;
          float sideLines = smoothstep(0.45, 0.5, abs(vUv.x - 0.5));
          float scanLineSin = abs(vUv.x - (sin(t * 2.7) * 0.5 + 0.5));
          float scanLine = smoothstep(0.01, 0., scanLineSin);
          float fadeOut = pow(vUv.y, 2.7);
          float a = 0.;
          a = max(a, mainWave);
          a = max(a, sideLines);
          a = max(a, scanLine);
          diffuseColor.a = a * fadeOut;
          `,
        );
  };

  const mesh = new THREE.Mesh(geom, mat);
  mesh.renderOrder = 9;    // above trail (0..1), below scanner (10)
  mesh.visible = false;
  // Fan lives in the overlay's XY plane (ortho camera looks down -Z).
  // No initial rotation needed — `fireAt` sets rotation.z per shot.

  // ---- Fade + direction state --------------------------------
  //
  // `masterOpacity` is a smooth follower of `targetOpacity`. `fireAt`
  // sets targetOpacity=1 and schedules a return to 0 after `activeMs`.
  // Update() eases master toward target with per-direction rates so
  // fade-in feels snappier than fade-out. Mesh visibility gates on
  // master > 0.01.
  // ---- Live-tracking state ------------------------------------
  let masterOpacity = 0;
  let targetOpacity = 0;
  let masterScale   = 0;   // 0 = fully retracted, 1 = full reach
  let targetScale   = 0;
  let fadeOutHandle = null;
  let trackingEl    = null;
  // Reach — extra scalar (0..1+) that scales the fan's local outer
  // radius so its tip lands exactly on the target. Set each frame
  // by scene.js via `setReach(distancePx)`. When left at 1, the fan
  // runs at its full built-in length (`outer` local units).
  let reachRatio = 1;
  // Origin mode — controls where the fan's emitter sits.
  //   'sentinel' — default. Scene.js keeps the emitter locked to
  //                SENTINEL's overlay position each frame (fan shoots
  //                out from SENTINEL toward the target).
  //   'below'    — used for contact meta items. Scene.js positions
  //                the emitter directly below the target's bottom
  //                edge (with a small offset) each frame, and aims
  //                the fan upward into the target. Reads as "beam of
  //                light rising from under the item."
  let originMode = 'sentinel';

  function setPosition(x, y) {
    mesh.position.set(x, y, 0);
  }

  function aimAt(x, y) {
    const dx = x - mesh.position.x;
    const dy = y - mesh.position.y;
    mesh.rotation.z = Math.atan2(dy, dx);
  }

  function setTarget(el, opts = {}) {
    trackingEl = el || null;
    originMode = opts.origin === 'below' ? 'below' : 'sentinel';
    targetOpacity = 1;
    targetScale   = 1;
    mesh.visible = true;

    if (fadeOutHandle) { clearTimeout(fadeOutHandle); fadeOutHandle = null; }
    // `persist: true` — no auto fade-out. Caller must call clearTarget()
    // when the interaction ends (e.g. on hover-leave). Used for the
    // contact meta strip so the fan stays lit as long as the cursor
    // holds the item, not for a fixed duration.
    if (!opts.persist) {
      const duration = opts.duration != null ? opts.duration : activeMs;
      fadeOutHandle = setTimeout(() => {
        targetOpacity = 0;
        targetScale   = 0;
        trackingEl    = null;
        originMode    = 'sentinel';
      }, duration);
    }
  }

  function clearTarget() {
    trackingEl    = null;
    originMode    = 'sentinel';
    targetOpacity = 0;
    targetScale   = 0;
    if (fadeOutHandle) { clearTimeout(fadeOutHandle); fadeOutHandle = null; }
  }

  function getTrackingEl() { return trackingEl; }
  function getOriginMode() { return originMode; }

  /**
   * Set the fan's reach in overlay pixels. Scene.js calls this each
   * frame while a target is active; the fan mesh is uniformly scaled
   * so its tip lands exactly at `pixels` distance from the emitter.
   * Uniform (both x and y) rather than x-only keeps the fan's shape
   * proportional — a shorter reach also narrows the beam a little,
   * which reads as "focused" rather than "squished."
   */
  function setReach(pixels) {
    if (!isFinite(pixels) || pixels <= 0) { reachRatio = 1; return; }
    reachRatio = Math.max(0.1, Math.min(2, pixels / outer));
  }

  function fireAt(x, y, fireOpts = {}) {
    const duration = fireOpts.duration != null ? fireOpts.duration : activeMs;
    aimAt(x, y);
    targetOpacity = 1;
    targetScale   = 1;
    mesh.visible = true;
    if (fadeOutHandle) clearTimeout(fadeOutHandle);
    fadeOutHandle = setTimeout(() => { targetOpacity = 0; targetScale = 0; }, duration);
  }

  function update(dt) {
    uniforms.time.value += dt;
    const dtSec = Math.max(0.0001, dt);

    // Opacity ease.
    const tauIn  = fadeInMs  / 1000;
    const tauOut = fadeOutMs / 1000;
    const rateOp = targetOpacity > masterOpacity
      ? 1 - Math.exp(-dtSec / tauIn)
      : 1 - Math.exp(-dtSec / tauOut);
    masterOpacity += (targetOpacity - masterOpacity) * rateOp;
    mat.opacity = masterOpacity;

    // Scale ease (shoot-out / retract along the fan's radial axis).
    // Shoot-out is snappy (~180ms), retract is a bit slower (~280ms).
    const tauScaleIn  = 0.18;
    const tauScaleOut = 0.28;
    const rateSc = targetScale > masterScale
      ? 1 - Math.exp(-dtSec / tauScaleIn)
      : 1 - Math.exp(-dtSec / tauScaleOut);
    masterScale += (targetScale - masterScale) * rateSc;
    // Uniform scale by masterScale × reachRatio. Master handles the
    // shoot-out / retract; reach clips the fan so its tip lands on
    // the tracked element rather than always reaching `outer` (540).
    const s = masterScale * reachRatio;
    mesh.scale.set(s, s, 1);

    if (masterOpacity < 0.005 && targetOpacity < 0.005 && masterScale < 0.01) {
      mesh.visible = false;
    }
  }

  function dispose() {
    if (fadeOutHandle) { clearTimeout(fadeOutHandle); fadeOutHandle = null; }
    try { geom.dispose(); } catch (_e) { /* noop */ }
    try { mat.dispose();  } catch (_e) { /* noop */ }
  }

  return { mesh, uniforms, setPosition, aimAt, setTarget, setReach, clearTarget, getTrackingEl, getOriginMode, fireAt, update, dispose };
}
