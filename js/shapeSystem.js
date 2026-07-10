// -------------------------------------------------------------
// shapeSystem.js — SENTINEL's shape pool + cross-fade state machine.
//
// Owns eight pre-built meshes ("presets") sharing a uniforms block with
// the companion's centerpiece material. Only one preset is dominant at a
// time (opacity ≈ 1); when `setPreset(name)` is called, the outgoing
// preset cross-fades to 0 and the incoming preset cross-fades to 1 over
// 0.55 s with smoothstep easing.
//
// The system exposes a `nudge(name, { transient, duration })` API for
// short-lived overrides (Poked / Zoom / Constellation / Reach in the
// design's transient-state DSL). When the nudge expires the shape
// returns to the last section baseline via cross-fade.
//
// Design references:
//   §SENTINEL Character System · Shape Morphing / Morph Transition
//   §Algorithms · 2. Shape morph blend
//   §Error Handling E3
//   Acceptance: R1.1–R1.8, R11.4, R13.5
//
// Integration (task 6.2): companion.js constructs its shared material
// + wireMaterial, then mounts `createShapeSystem({ radius, material,
// wireMaterial, prefersReduced }).root` onto the shell in place of the
// hand-built body + wire meshes. Companion also exposes the returned
// system so orchestrator / interactions can call `setPreset` and
// `nudge` directly.
// -------------------------------------------------------------

import * as THREE from 'three';

// -----------------------------------------------------------------------
// Preset table — geometry constructors per design §SENTINEL · Shape Morphing.
// All presets share BODY_RADIUS = 26 so halo / core / scan-ring
// (owned by companion) never need to resize between morphs.
// -----------------------------------------------------------------------
const PRESET_BUILDERS = {
  orb:     (r) => new THREE.IcosahedronGeometry(r, 2),
  prism:   (r) => new THREE.OctahedronGeometry(r, 0),
  ring:    (r) => new THREE.TorusGeometry(r, r * 0.08, 8, 48),
  shard:   (r) => new THREE.TetrahedronGeometry(r, 0),
  lattice: (r) => new THREE.IcosahedronGeometry(r, 3),
  seal:    (r) => new THREE.TorusKnotGeometry(r * 0.6, r * 0.18, 64, 8),
  halo:    (r) => new THREE.RingGeometry(r * 0.9, r * 1.1, 48),
  arrow:   (r) => new THREE.ConeGeometry(r * 0.9, r * 1.6, 5),
};

// Twin config: solid + wire pair by default; lattice is wire-only,
// halo is solid-only (billboarded so it always faces the camera).
const PRESET_TWINS = {
  orb:     { solid: true,  wire: true  },
  prism:   { solid: true,  wire: true  },
  ring:    { solid: true,  wire: true  },
  shard:   { solid: true,  wire: true  },
  lattice: { solid: false, wire: true  }, // wire === 'only'
  // seal + arrow — wire-only (2025-11 v6). Low-radial-segment geometry
  // (torus knot with 8 radial segments; cone with 5) plus a solid mesh
  // with normal blending under an additive wire overlay makes the
  // SENTINEL flicker between "wireframe" and "filled" as the shape
  // rotates: interior edges from the wire cross the solid front-face
  // and create shifting bright bands depending on angle. Wire-only
  // reads clean at every angle without the blending conflict.
  seal:    { solid: false, wire: true  },
  halo:    { solid: true,  wire: false, billboard: true }, // solid-only, billboarded
  arrow:   { solid: false, wire: true  },
};

const PRESET_NAMES = Object.keys(PRESET_BUILDERS);
const FALLBACK = 'orb';

// -----------------------------------------------------------------------
// Math helpers
// -----------------------------------------------------------------------
const clamp01   = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const lerp       = (a, b, t) => a + (b - a) * t;
const bellCurve  = (p) => 4 * p * (1 - p); // peak 1.0 at p = 0.5

// -----------------------------------------------------------------------
// Clone a shared ShaderMaterial template so this preset owns its own
// `uOpacity` uniform (needed for independent cross-fade) while every
// other uniform (uTime, uDistortion, uHover, uColorA/B/C, uIdleGlow,
// uCursorPull, etc.) remains SHARED BY REFERENCE with the template.
//
// Sharing by reference is essential: when companion.js writes uTime
// or uHover on the template each frame, every preset material picks
// up the change automatically — otherwise noise animation would freeze
// on fading presets.
// -----------------------------------------------------------------------
function cloneMaterialWithOwnOpacity(template, { forceWireframe = false } = {}) {
  const src = template.uniforms || {};
  const uniforms = {};
  for (const key of Object.keys(src)) {
    if (key === 'uOpacity') {
      // Own copy so this preset's fade is independent
      const seed = src.uOpacity && typeof src.uOpacity.value === 'number' ? src.uOpacity.value : 1;
      uniforms.uOpacity = { value: seed };
    } else {
      // Shared reference — companion drives these each frame
      uniforms[key] = src[key];
    }
  }
  if (!uniforms.uOpacity) uniforms.uOpacity = { value: 1 };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader:   template.vertexShader,
    fragmentShader: template.fragmentShader,
    transparent:    template.transparent    !== undefined ? template.transparent    : true,
    depthWrite:     template.depthWrite     !== undefined ? template.depthWrite     : false,
    depthTest:      template.depthTest      !== undefined ? template.depthTest      : true,
    blending:       template.blending       !== undefined ? template.blending       : THREE.AdditiveBlending,
    side:           template.side           !== undefined ? template.side           : THREE.FrontSide,
    wireframe:      forceWireframe || !!template.wireframe,
  });
}

// -----------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------
/**
 * Build a shape system for SENTINEL.
 *
 * @param {Object}                opts
 * @param {number}                [opts.radius=26]      Shared bounding radius.
 * @param {THREE.ShaderMaterial}  opts.material         Solid material template (shared uniforms).
 * @param {THREE.ShaderMaterial}  opts.wireMaterial     Wireframe material template (shared uniforms).
 * @param {boolean}               [opts.prefersReduced] If true, setPreset teleports instead of cross-fading.
 * @param {'high'|'low'}          [opts.orbQuality='high'] Icosahedron subdivision for the `orb` preset —
 *                                                        'high' → 2 (320 tris, desktop default),
 *                                                        'low'  → 1 (80 tris, mobile drop per §Performance
 *                                                        Considerations · isMobile).
 *
 * @returns {{
 *   root: THREE.Group,
 *   setPreset: (name: string) => void,
 *   nudge: (name: string, opts?: { transient?: boolean, duration?: number }) => void,
 *   update: (dt: number) => void,
 *   current: () => string,
 *   setPrefersReduced: (v: boolean) => void,
 *   dispose: () => void,
 * }}
 */
export function createShapeSystem({
  radius = 26,
  material,
  wireMaterial,
  prefersReduced = false,
  orbQuality = 'high',
} = {}) {
  if (!material || !wireMaterial) {
    throw new Error('[shapeSystem] createShapeSystem requires { material, wireMaterial } templates.');
  }

  const root = new THREE.Group();
  const presets = {};   // name → { solid?, wire?, geometry, def }
  const aliases = {};   // name → alias when a preset fails to build (E3)
  const _tmpQuat = new THREE.Quaternion();

  // -------------------------------------------------------------------
  // Build all eight presets once (R1.2, R13.5). Wrap each geometry
  // constructor in try/catch (E3) — on failure alias the preset to `orb`
  // and warn, keeping the system alive.
  // -------------------------------------------------------------------
  // Mobile perf drop for the orb preset (design §Performance Considerations ·
  // isMobile). 'low' → subdivision 1 (80 tris), 'high' → subdivision 2 (320
  // tris). Applied only to `orb`; other presets keep their design triangle
  // budget because they are only mounted transiently on morph.
  const orbSubdivision = orbQuality === 'low' ? 1 : 2;

  for (const name of PRESET_NAMES) {
    const def = PRESET_TWINS[name];
    let geometry = null;

    try {
      if (name === 'orb') {
        geometry = new THREE.IcosahedronGeometry(radius, orbSubdivision);
      } else {
        geometry = PRESET_BUILDERS[name](radius);
      }
    } catch (err) {
      // E3: preset constructor threw — alias to fallback, warn, continue.
      console.warn(
        `[shapeSystem] Preset '${name}' failed to build — aliasing to '${FALLBACK}'.`,
        err
      );
      aliases[name] = FALLBACK;
      continue;
    }

    const entry = { def, geometry };

    if (def.solid) {
      const mat = cloneMaterialWithOwnOpacity(material, { forceWireframe: false });
      const mesh = new THREE.Mesh(geometry, mat);
      // Slight inset so the wire twin doesn't Z-fight the solid surface.
      mesh.scale.setScalar(0.98);
      // Hidden until _showOnly() below assigns opacity.
      mesh.visible = false;
      mat.uniforms.uOpacity.value = 0;

      // Halo billboard: keep the flat ring facing the camera regardless
      // of the shell's rotation. Cheap: run once per render.
      if (def.billboard) {
        mesh.onBeforeRender = function (_renderer, _scene, camera) {
          this.quaternion.copy(camera.quaternion);
          if (this.parent) {
            this.parent.getWorldQuaternion(_tmpQuat).invert();
            this.quaternion.premultiply(_tmpQuat);
          }
        };
      }

      entry.solid = mesh;
      root.add(mesh);
    }

    if (def.wire) {
      const mat = cloneMaterialWithOwnOpacity(wireMaterial, { forceWireframe: true });
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.visible = false;
      mat.uniforms.uOpacity.value = 0;

      entry.wire = mesh;
      root.add(mesh);
    }

    presets[name] = entry;
  }

  // Guarantee the fallback exists. If even `orb` failed to build (should
  // never happen with default parameters) surface the error loudly — the
  // rest of the system depends on `orb` as the safe default.
  if (!presets[FALLBACK]) {
    throw new Error(`[shapeSystem] Fallback preset '${FALLBACK}' failed to build; cannot continue.`);
  }

  // Shared uniforms — we read/write uHover during the bell-curve bump.
  const sharedUniforms = material.uniforms;

  // -------------------------------------------------------------------
  // State machine
  // -------------------------------------------------------------------
  let currentPreset      = FALLBACK; // dominant preset (never an alias)
  let baselinePreset     = FALLBACK; // last section-baseline set via setPreset()
  let prefersReducedFlag = !!prefersReduced;

  const transition = {
    active:    false,
    t:         0,
    dur:       0.55,   // R1.4
    from:      FALLBACK,
    to:        FALLBACK,
    fromStart: 1,      // opacity of `from` at the transition start (usually 1)
    toStart:   0,      // opacity of `to`   at the transition start (usually 0)
  };

  const nudgeState = { active: false, remaining: 0 };

  // Anticipation impulse on the shape's own root scale (R1.6). Companion
  // scales the shell separately for breathing / pulse — those compose
  // multiplicatively through parent → child, so applying scale on `root`
  // is the correct hook without touching companion internals.
  let shellImpulse = 1.0;

  // Prime the scene: dominant preset visible, others hidden.
  _showOnly(FALLBACK);

  // -------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------
  function _resolveAlias(name) {
    let n = name;
    // Follow the alias chain (at most one hop in practice).
    let hops = 0;
    while (aliases[n] && hops++ < 8) n = aliases[n];
    if (!presets[n]) n = FALLBACK;
    return n;
  }

  function _setPresetOpacity(name, opacity) {
    const p = presets[name];
    if (!p) return;
    const v = clamp01(opacity);
    if (p.solid) {
      p.solid.material.uniforms.uOpacity.value = v;
      p.solid.visible = v > 0.001;
    }
    if (p.wire) {
      p.wire.material.uniforms.uOpacity.value = v;
      p.wire.visible = v > 0.001;
    }
  }

  function _readPresetOpacity(name) {
    const p = presets[name];
    if (!p) return 0;
    const m = p.solid || p.wire;
    return m ? m.material.uniforms.uOpacity.value : 0;
  }

  function _showOnly(name) {
    for (const p of PRESET_NAMES) {
      _setPresetOpacity(p, p === name ? 1 : 0);
    }
  }

  function _beginTransition(from, to) {
    // If we're overriding an in-flight transition, capture the outgoing
    // preset's current visible opacity as the new "fromStart" so it can
    // continue to decrease monotonically (no snap-back to 1.0 flash).
    let fromStart = 1;
    let toStart = 0;
    if (transition.active) {
      if (from === transition.to) {
        fromStart = _readPresetOpacity(from);
      } else if (from === transition.from) {
        fromStart = _readPresetOpacity(from);
      }
      if (to === transition.from) {
        toStart = _readPresetOpacity(to);
      } else if (to === transition.to) {
        toStart = _readPresetOpacity(to);
      }
      // Snap any leftover third-preset to 0 so only the two active meshes remain.
      if (transition.from !== from && transition.from !== to) {
        _setPresetOpacity(transition.from, 0);
      }
      if (transition.to !== from && transition.to !== to) {
        _setPresetOpacity(transition.to, 0);
      }
    }

    transition.active    = true;
    transition.t         = 0;
    transition.from      = from;
    transition.to        = to;
    transition.fromStart = fromStart;
    transition.toStart   = toStart;

    // Anticipation kick on the shape group (R1.6).
    shellImpulse = 1.18;
  }

  function _teleport(to) {
    _showOnly(to);
    transition.active = false;
    shellImpulse = 1.0;
    root.scale.setScalar(1);
  }

  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------

  /**
   * Change the section baseline shape. Cross-fades over 0.55 s under
   * normal motion, or teleports under prefers-reduced-motion.
   */
  function setPreset(name) {
    const target = _resolveAlias(name);
    baselinePreset = target;

    if (target === currentPreset && !transition.active) return;

    if (prefersReducedFlag) {
      _teleport(target);
      currentPreset = target;
      return;
    }

    _beginTransition(currentPreset, target);
    currentPreset = target;
  }

  /**
   * Short-lived shape override. `duration` seconds after being nudged
   * the system decays back to the baseline set by the most recent
   * `setPreset` call. If `transient: false`, behaves like setPreset.
   */
  function nudge(name, opts = {}) {
    const { transient = true, duration = 1.4 } = opts;
    if (!transient) {
      setPreset(name);
      return;
    }

    const target = _resolveAlias(name);

    // Already at target — just extend / refresh the nudge timer.
    if (target === currentPreset && !transition.active) {
      nudgeState.active = true;
      nudgeState.remaining = Math.max(nudgeState.remaining, duration);
      return;
    }

    if (prefersReducedFlag) {
      _teleport(target);
      currentPreset = target;
    } else {
      _beginTransition(currentPreset, target);
      currentPreset = target;
    }

    nudgeState.active = true;
    nudgeState.remaining = duration;
  }

  /**
   * Toggle the prefers-reduced-motion flag at runtime (E6). If a
   * transition is in flight when reduced-motion turns on, snap to
   * its target so we don't leave the shape stuck mid-blend.
   */
  function setPrefersReduced(v) {
    const wasReduced = prefersReducedFlag;
    prefersReducedFlag = !!v;

    if (!wasReduced && prefersReducedFlag && transition.active) {
      _teleport(transition.to);
      currentPreset = transition.to;
    }
  }

  /**
   * Per-frame tick. Drives the cross-fade, the shared uHover bell-curve
   * bump, the anticipation-scale decay, and the transient-nudge timer.
   */
  function update(dt) {
    // --- Cross-fade + uHover bump -----------------------------------
    if (transition.active) {
      transition.t += dt;
      const raw = transition.t / transition.dur;
      const done = raw >= 1;
      const p = done ? 1 : raw;
      const e = smoothstep(p);

      // Opacity endpoints: (fromStart, toStart) at t=0 → (0, 1) at t=dur.
      // For a clean transition fromStart=1 and toStart=0 → this reduces to
      // the P8 property statement: (1, 0) → (0, 1).
      _setPresetOpacity(transition.from, lerp(transition.fromStart, 0, e));
      _setPresetOpacity(transition.to,   lerp(transition.toStart,   1, e));

      // Shared uHover distortion bump peaked at the midpoint (R1.6).
      if (sharedUniforms && sharedUniforms.uHover) {
        const bump = 0.6 * bellCurve(p);
        if (bump > sharedUniforms.uHover.value) {
          sharedUniforms.uHover.value = bump;
        }
      }

      if (done) {
        transition.active = false;
        // Snap final endpoints exactly to (0, 1) (R1.5).
        _setPresetOpacity(transition.from, 0);
        _setPresetOpacity(transition.to,   1);
      }
    }

    // --- Anticipation scale decay -----------------------------------
    // shellImpulse starts at 1.18 on setPreset, decays exponentially
    // back to 1.0 with a ~150 ms halflife.
    if (Math.abs(shellImpulse - 1) > 0.001) {
      root.scale.setScalar(shellImpulse);
      shellImpulse = lerp(shellImpulse, 1.0, Math.min(1, dt * 4));
    } else if (root.scale.x !== 1) {
      root.scale.setScalar(1);
      shellImpulse = 1.0;
    }

    // --- Transient nudge decay --------------------------------------
    if (nudgeState.active) {
      nudgeState.remaining -= dt;
      if (nudgeState.remaining <= 0) {
        nudgeState.active = false;
        // Return to the section baseline (R1.7).
        if (currentPreset !== baselinePreset) {
          const target = _resolveAlias(baselinePreset);
          if (prefersReducedFlag) {
            _teleport(target);
            currentPreset = target;
          } else {
            _beginTransition(currentPreset, target);
            currentPreset = target;
          }
        }
      }
    }
  }

  /** Currently dominant preset name. */
  function current() {
    return currentPreset;
  }

  /**
   * Read the current opacity of a preset by name — dev / property-test hook.
   *
   * Reads from the same `uOpacity` uniform the cross-fade writes to each
   * frame (solid twin if present, otherwise wire), so the value reflects
   * the visible state. Returns 0 for unknown or aliased-away presets so
   * callers don't have to special-case the failure mode.
   *
   * Consumed by:
   *   • dev/p8-shape-monotonicity.js (Task 2.2, P8) — records per-preset
   *     opacity traces across a 0.55 s transition and asserts endpoints
   *     `(1,0)` at `t=0` and `(0,1)` at `t=dur` plus monotonicity.
   *
   * Not part of the acceptance-criteria surface (R1.1–R1.8) — this is
   * a testability escape hatch. Kept outside `current()` so property
   * tests never have to reach into `.material.uniforms.uOpacity.value`.
   */
  function getPresetOpacity(name) {
    return _readPresetOpacity(_resolveAlias(name));
  }

  /**
   * True while a cross-fade is in flight. Consumed by the P4 property
   * test (Task 6.3) so proximity-latency assertions can honor the
   * "OR blocked by an active shape morph transition" clause — during
   * a cross-fade the shape group is scaling and cross-fading, which
   * may briefly dampen the proximity response.
   */
  function isTransitioning() {
    return transition.active;
  }

  function dispose() {
    // Geometry is shared between the solid + wire twin of each preset,
    // but BufferGeometry.dispose() is idempotent so calling it via the
    // scene traversal is safe.
    root.traverse((o) => {
      if (o.isMesh) {
        if (o.material && typeof o.material.dispose === 'function') o.material.dispose();
        if (o.geometry && typeof o.geometry.dispose === 'function') o.geometry.dispose();
      }
    });
    for (const name of Object.keys(presets)) presets[name] = null;
  }

  return {
    root,
    setPreset,
    nudge,
    update,
    current,
    getPresetOpacity,
    isTransitioning,
    setPrefersReduced,
    dispose,
  };
}
