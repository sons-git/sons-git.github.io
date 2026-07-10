// -------------------------------------------------------------
// Movement trail — a triangle-strip ribbon that follows the buddy.
//
// Technique (like spite/THREE.MeshLine but implemented natively for 2D
// orthographic overlay):
//   • Circular history buffer of past N positions.
//   • Each history point contributes 2 vertices — offset perpendicular
//     to the local path direction.
//   • Width tapers from `HEAD_WIDTH` at the head to 0 at the tail.
//   • Custom fragment shader fades along UV.x (tail-ward) and across UV.y
//     (edges of ribbon) so it looks like a soft trail of light.
//
// Additive blending + fade shader means no hard edges — reads as motion.
// -------------------------------------------------------------

import * as THREE from 'three';

const MAX_POINTS  = 40;
const HEAD_WIDTH  = 12;   // px at the newest end
const OFF_SCREEN  = -100000;

const trailVert = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const trailFrag = /* glsl */`
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uHue;
  varying vec2  vUv;
  void main() {
    // Along-length fade: bright at head (uv.x = 0), transparent at tail (1)
    float along = 1.0 - vUv.x;
    along = along * along;                // curved fade

    // Across-width fade: bright center, transparent edges
    float across = 1.0 - abs(vUv.y * 2.0 - 1.0);
    across = pow(across, 0.85);

    vec3 color = mix(uColorA, uColorB, uHue);
    float alpha = along * across * 0.9;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createTrail() {
  // Position: 2 vertices per point (top edge, bottom edge)
  const positions = new Float32Array(MAX_POINTS * 2 * 3);
  const uvs       = new Float32Array(MAX_POINTS * 2 * 2);
  for (let i = 0; i < MAX_POINTS * 2 * 3; i++) positions[i] = OFF_SCREEN;

  // UV layout — uv.x = position along ribbon (0 head → 1 tail),
  //             uv.y = 0 for top edge, 1 for bottom edge
  for (let i = 0; i < MAX_POINTS; i++) {
    const t = i / (MAX_POINTS - 1);
    uvs[i * 4 + 0] = t; uvs[i * 4 + 1] = 0; // top
    uvs[i * 4 + 2] = t; uvs[i * 4 + 3] = 1; // bottom
  }

  // Triangle-strip indices — two triangles per pair of consecutive points
  const indices = [];
  for (let i = 0; i < MAX_POINTS - 1; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(indices);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color(0x6ee7f9) },
      uColorB: { value: new THREE.Color(0xa78bfa) },
      uHue:    { value: 0 },
    },
    vertexShader: trailVert,
    fragmentShader: trailFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.frustumCulled = false;

  // Circular history — head is the newest position
  const history = new Array(MAX_POINTS);
  for (let i = 0; i < MAX_POINTS; i++) history[i] = null;
  let head = 0;
  let filled = 0;

  function push(x, y) {
    history[head] = { x, y };
    head = (head + 1) % MAX_POINTS;
    if (filled < MAX_POINTS) filled++;
  }

  // Fill the ribbon by walking history newest → oldest
  function computeRibbon() {
    const posAttr = geom.attributes.position;
    for (let i = 0; i < MAX_POINTS; i++) {
      // Slot i in the ribbon = i-steps-back in history
      // Newest is at (head - 1 + MAX_POINTS) % MAX_POINTS
      const hi = (head - 1 - i + MAX_POINTS * 2) % MAX_POINTS;
      const p  = i < filled ? history[hi] : null;

      if (!p) {
        positions[i * 6 + 0] = OFF_SCREEN;
        positions[i * 6 + 1] = OFF_SCREEN;
        positions[i * 6 + 2] = 0;
        positions[i * 6 + 3] = OFF_SCREEN;
        positions[i * 6 + 4] = OFF_SCREEN;
        positions[i * 6 + 5] = 0;
        continue;
      }

      // Direction toward the older neighbour so perpendicular is consistent
      const nextIdx = i + 1 < filled ? (hi - 1 + MAX_POINTS) % MAX_POINTS : hi;
      const n = history[nextIdx] || p;
      let dx = p.x - n.x;
      let dy = p.y - n.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.001) { dx /= len; dy /= len; } else { dx = 1; dy = 0; }

      // Perpendicular (rotate 90° CCW)
      const px = -dy;
      const py =  dx;

      // Taper: full width at head, zero at tail
      const alongT = i / MAX_POINTS;
      const w = HEAD_WIDTH * (1 - alongT) * (1 - alongT);

      positions[i * 6 + 0] = p.x + px * w;
      positions[i * 6 + 1] = p.y + py * w;
      positions[i * 6 + 2] = 0;
      positions[i * 6 + 3] = p.x - px * w;
      positions[i * 6 + 4] = p.y - py * w;
      positions[i * 6 + 5] = 0;
    }
    posAttr.needsUpdate = true;
  }

  let lastX = null, lastY = null;

  function update(dt, buddyX, buddyY, hue) {
    if (lastX == null) {
      lastX = buddyX; lastY = buddyY;
      push(buddyX, buddyY);
      return;
    }
    const dx = buddyX - lastX;
    const dy = buddyY - lastY;
    const dist = Math.hypot(dx, dy);

    // Push points along the path — one every ~6px so fast motion is dense
    if (dist > 1.5) {
      const steps = Math.min(6, Math.ceil(dist / 6));
      for (let s = 0; s < steps; s++) {
        const t = (s + 1) / steps;
        push(lastX + dx * t, lastY + dy * t);
      }
    } else {
      // Slow: still push periodically so trail keeps drifting/fading
      push(buddyX, buddyY);
    }
    lastX = buddyX; lastY = buddyY;

    computeRibbon();
    mat.uniforms.uHue.value = hue;
  }

  function dispose() {
    geom.dispose();
    mat.dispose();
  }

  return { mesh, update, dispose };
}
