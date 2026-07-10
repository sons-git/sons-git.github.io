// -------------------------------------------------------------
// GLSL shaders for the scene.
// - Ashima Arts 3D simplex noise (MIT) is inlined for use in both
//   the icosahedron vertex shader and the background plane fragment.
// - Fresnel + gradient fragment for the centerpiece.
// -------------------------------------------------------------

// Ashima Arts / Stefan Gustavson 3D simplex noise — MIT licensed.
// https://github.com/ashima/webgl-noise
export const snoise3D = /* glsl */`
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

// -------------------------------------------------------------
// Centerpiece icosahedron — vertex distortion + fresnel gradient
// -------------------------------------------------------------
export const centerpieceVert = /* glsl */`
uniform float uTime;
uniform float uDistortion;
uniform float uHover;

varying vec3 vNormal;
varying vec3 vViewPos;
varying float vDistortion;

${snoise3D}

void main() {
  vec3 pos = position;
  float t = uTime * 0.25;
  float n1 = snoise(pos * 0.9 + vec3(t));
  float n2 = snoise(pos * 2.4 - vec3(t * 1.3));
  float n = n1 + n2 * 0.5;
  float d = n * uDistortion * (1.0 + uHover * 0.9);
  pos += normal * d;
  vDistortion = d;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

export const centerpieceFrag = /* glsl */`
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uHover;
uniform float uOpacity;
uniform float uIdleGlow;   // 0..1 — floor emissive so idle never reads gray

varying vec3 vNormal;
varying vec3 vViewPos;
varying float vDistortion;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewPos);
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  float m = clamp(vDistortion * 0.5 + 0.5, 0.0, 1.0);
  // Body-color floor at 40% (was 0% via 'm * 0.7'). At low displacement
  // ('m ~ 0', common outside Hero where distortion is smaller / noise
  // patterns are calmer) the mix used to land almost entirely on
  // uColorA (near-black DEEP), which read as grey/washed-out patches.
  // Anchor at 40% body-color minimum so every mode carries visible
  // cyan/violet across the whole surface, not just at bright peaks.
  // NOTE: don't use backticks in this comment — it lives inside a JS
  // template literal and stray backticks close it early (crashes boot).
  vec3 grad = mix(uColorA, uColorB, 0.4 + m * 0.45);
  grad = mix(grad, uColorC, fresnel * (0.35 + uHover * 0.25));
  vec3 col = grad + fresnel * 0.22;
  col *= 0.72;                       // global brightness clamp (matches Hero look)
  // Idle-glow tint — cyan/violet mix at 12 % contribution (original Hero
  // calibration). Combined with the body-color floor above, SENTINEL
  // reads strongly tinted regardless of mode. Companion pins uIdleGlow
  // at 1.0 across all modes so every section gets the Hero look.
  col += mix(uColorB, uColorC, 0.5) * uIdleGlow * 0.12;
  gl_FragColor = vec4(col, uOpacity);
}
`;

// -------------------------------------------------------------
// Background plane — full-screen shader gradient with subtle noise
// Very low intensity so text stays readable.
// -------------------------------------------------------------
export const bgVert = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.999, 1.0); // clip-space fullscreen
}
`;

export const bgFrag = /* glsl */`
uniform vec2  uResolution;
uniform vec2  uMouse;
uniform float uTime;
uniform float uScroll;
uniform vec3  uSectionTint;   // default = vec3(1.0) — subtle per-section palette bias
varying vec2 vUv;

${snoise3D}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 centered = uv - 0.5;
  centered.x *= uResolution.x / uResolution.y;

  // Base — very dark. This is what the site's paint sits on.
  vec3 dark = vec3(0.023, 0.024, 0.043);

  // Two-tone slow gradient noise (VERY subtle — mostly hidden by content)
  float n1 = snoise(vec3(centered * 1.4, uTime * 0.03));
  float n2 = snoise(vec3(centered * 3.5, uTime * 0.05));
  float n = n1 * 0.55 + n2 * 0.25;

  vec3 cyan   = vec3(0.43, 0.90, 0.98);
  vec3 violet = vec3(0.66, 0.55, 0.98);

  // Mouse influence — softly brighten near cursor
  float mDist = length(centered - vec2((uMouse.x - 0.5) * uResolution.x / uResolution.y, uMouse.y - 0.5));
  float mouseGlow = smoothstep(0.9, 0.0, mDist) * 0.10;

  vec3 col = dark;
  col += violet * max(n, 0.0) * 0.045;   // halved
  col += cyan   * max(-n, 0.0) * 0.04;   // halved
  col += cyan * mouseGlow * 0.6;

  // Scroll adds a barely-perceptible tint shift
  col += vec3(0.015, 0.0, 0.02) * uScroll * 0.5;

  // Radial vignette keeps edges dark
  float vig = smoothstep(1.35, 0.35, length(centered));
  col *= mix(0.5, 1.0, vig);

  // Optional per-section palette bias — subliminal color-of-context, not lightshow.
  // uSectionTint defaults to vec3(1.0) which leaves the color untouched.
  col *= mix(vec3(1.0), uSectionTint, 0.15);

  gl_FragColor = vec4(col, 1.0);
}
`;

// -------------------------------------------------------------
// Cinematic scanner v2 — pixel-space overlay for the Work section.
//
// Rendered as a single Plane in overlay orthographic pixel space, positioned
// at the target rect's centre with scale = (rect.w + 2*margin, rect.h + 2*margin).
// All feature sizes (corner arm, sweep-line thickness, HUD grid spacing) are
// passed in as pixel uniforms so the visual reads the same across any rect
// aspect ratio.
//
// Composite: panel(0.06) + max(bracket, grid, edge) + scanLine + scanGlow.
// -------------------------------------------------------------

export const scanVert = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const scanFrag = /* glsl */`
precision highp float;

uniform float uScanY;       // 0..1 vertical position of scan line (top -> bottom)
uniform float uOpacity;     // master fade
uniform vec3  uColor;       // tint (usually matches SENTINEL hue)
uniform vec2  uSizePx;      // pixel dims of the rect (width, height)
uniform float uCornerPx;    // corner arm length in pixels (e.g. 22)
uniform float uThickPx;     // corner arm thickness in pixels (e.g. 2)
uniform float uScanPx;      // scan line thickness in pixels (e.g. 2)
uniform float uGlowPx;      // scan line glow radius in pixels (e.g. 40)
uniform float uGridPx;      // grid line spacing in pixels (e.g. 32)

varying vec2 vUv;

// Distance from a corner in local pixel space -> 1 if inside an L-bracket.
// 'd' is the vector from the corner to the current pixel, already flipped so
// that the arms extend along +x and +y. 'arm' is the arm length, 'thick' the
// arm thickness (both in pixels).
float cornerBracket(vec2 d, float arm, float thick) {
  float h = step(0.0, d.x) * step(d.x, arm)   * step(0.0, d.y) * step(d.y, thick);
  float v = step(0.0, d.x) * step(d.x, thick) * step(0.0, d.y) * step(d.y, arm);
  return max(h, v);
}

void main() {
  vec2 px = vUv * uSizePx;                    // pixel coords within rect
  vec2 dTL = px;                              // top-left corner (uv 0,0)
  vec2 dTR = vec2(uSizePx.x - px.x, px.y);    // top-right
  vec2 dBL = vec2(px.x, uSizePx.y - px.y);    // bottom-left
  vec2 dBR = uSizePx - px;                    // bottom-right

  float bracket = 0.0;
  bracket = max(bracket, cornerBracket(dTL, uCornerPx, uThickPx));
  bracket = max(bracket, cornerBracket(dTR, uCornerPx, uThickPx));
  bracket = max(bracket, cornerBracket(dBL, uCornerPx, uThickPx));
  bracket = max(bracket, cornerBracket(dBR, uCornerPx, uThickPx));

  // Scan line — thickness in pixels
  float scanYpx  = uScanY * uSizePx.y;
  float dScan    = abs(px.y - scanYpx);
  float scanLn   = smoothstep(uScanPx, 0.0, dScan);
  float scanGlow = smoothstep(uGlowPx, 0.0, dScan) * 0.22;

  // HUD grid — pixel-spaced, thin. distance-to-nearest-line gives visible
  // hairlines regardless of rect aspect ratio.
  float gridV = step(uSizePx.x, mod(px.x, uGridPx) + 1.0) * 0.0
              + smoothstep(1.0, 0.0, min(mod(px.x, uGridPx), uGridPx - mod(px.x, uGridPx))) * 0.10;
  float gridH = smoothstep(1.0, 0.0, min(mod(px.y, uGridPx), uGridPx - mod(px.y, uGridPx))) * 0.10;
  float grid  = (gridV + gridH);

  // Outer border
  float edge = 0.0;
  edge = max(edge, smoothstep(1.5, 0.0, min(px.x, uSizePx.x - px.x)));
  edge = max(edge, smoothstep(1.5, 0.0, min(px.y, uSizePx.y - px.y)));
  edge *= 0.28;

  // Layered compositing:
  //   panel-tint: faint fill so the zone reads as "captured"
  //   brackets:   solid ink
  //   scan+glow:  additive
  //   grid+edge:  additive ink
  vec3  col   = uColor;
  float panel = 0.06;                         // faint fill
  float ink   = max(bracket, max(grid, edge));
  float add   = scanLn + scanGlow;

  float alpha = clamp(panel + ink + add, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha * uOpacity);
}
`;
