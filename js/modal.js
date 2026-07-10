// Project detail modal. Simple, keyboard-accessible.
//
// v2 (Task 13.1) — adds a micro-SENTINEL SVG in the modal header that
// mirrors the character's current hue (read via companion.getHue()) and
// its mode label (read from #companion-label in the DOM), plus a
// documents_in particle handoff on close so the case study "folds back"
// into SENTINEL rather than just disappearing. Per R15.3 the mini-
// SENTINEL is CSS-only — no second WebGL context.
//
// Boot ordering note: modal.js is initialized in main.js's boot BEFORE
// scene.js has instantiated the companion. To avoid the chicken/egg we
// take lazy accessors (`getCompanion`, `getBuddyPos`) rather than a
// bound reference — main.js (Task 12.1) will pass closures that read
// the scene's live state each open/close.
//
// Requirements: R8.2, R8.3, R8.4, R15.3
// Design: §Interaction Layer · Click Behaviors

import { projects } from './data.js';
import { escapeHtml } from './util.js';

let modal, body, panel, hud, hudLabel;
let lastFocused = null;

let getCompanion = null;
let getBuddyPos = null;
let prefersReduced = false;

let hudRafId = 0;

// SENTINEL palette — kept in sync with companion.js's CYAN/VIOLET so the
// mini-SENTINEL colour lerp reads identical to the real one.
const CYAN   = { r: 0x6e, g: 0xe7, b: 0xf9 };
const VIOLET = { r: 0xa7, g: 0x8b, b: 0xfa };

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function hueToRgb(h) {
  const t = clamp01(h);
  const r = Math.round(lerp(CYAN.r, VIOLET.r, t));
  const g = Math.round(lerp(CYAN.g, VIOLET.g, t));
  const b = Math.round(lerp(CYAN.b, VIOLET.b, t));
  return `rgb(${r},${g},${b})`;
}

/**
 * initModal — wires up the modal open/close and mounts the micro-
 * SENTINEL header.
 *
 * @param {object} [opts]
 * @param {() => object|null} [opts.getCompanion] — returns the live
 *   companion object (from scene.js). Called at open/close time so it
 *   can be `null` at initModal() time (boot order — scene isn't up
 *   yet). Companion must expose `getHue()`, `setEmissionDir(dx, dy)`,
 *   and `emit('documents_in')`.
 * @param {() => {x:number, y:number}|null} [opts.getBuddyPos] —
 *   returns SENTINEL's current overlay position in DOM pixel space
 *   (x from left, y from top). Falls back to the bottom-right home if
 *   omitted.
 * @param {boolean} [opts.prefersReduced] — when true, skips the
 *   directional documents_in emit on close (R11.x — reduced motion
 *   avoids directional particle bursts).
 */
export function initModal(opts = {}) {
  modal = document.getElementById('modal');
  body = document.getElementById('modal-body');
  if (!modal || !body) return;
  panel = modal.querySelector('.modal__panel');

  getCompanion = typeof opts.getCompanion === 'function' ? opts.getCompanion : null;
  getBuddyPos  = typeof opts.getBuddyPos  === 'function' ? opts.getBuddyPos  : null;
  prefersReduced = !!opts.prefersReduced;

  buildHud();

  // Backdrop + close button close the modal
  modal.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', close);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  // Delegate: card click opens project modal.
  // NOTE (Task 10.1): interactions.js will fire companion.emit('documents_out')
  // in this same click path — the burst plays as the modal opens and the
  // mini-SENTINEL fades in immediately after, acting as the "landed"
  // frame of the handoff.
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-project-id]');
    if (!card) return;
    e.preventDefault();
    open(card.dataset.projectId);
  });

  // Keyboard: Enter / Space on a focused card opens the modal too
  // (R11.6 — cards render as <article role="button"> / <li role="button">,
  // which are not natively activated by keyboard the way <button> is).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const target = e.target;
    if (!target || typeof target.closest !== 'function') return;
    const card = target.closest('[data-project-id]');
    if (!card) return;
    e.preventDefault();
    open(card.dataset.projectId);
  });
}

/**
 * buildHud — constructs a small 32×32 SVG icon composed of a soft
 * halo, a dashed rotating ring, and a solid core. All motion is CSS-
 * driven (see .modal__hud rules in style.css). We use currentColor on
 * the fills/strokes so re-tinting is a single style.color write.
 */
function buildHud() {
  if (!panel) return;
  hud = document.createElement('div');
  hud.className = 'modal__hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `
    <svg class="modal__hud-svg" width="32" height="32" viewBox="0 0 32 32">
      <circle class="modal__hud-halo" cx="16" cy="16" r="14" fill="currentColor" opacity="0.22"/>
      <circle class="modal__hud-ring" cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.9"/>
      <circle class="modal__hud-core" cx="16" cy="16" r="3.6" fill="currentColor"/>
    </svg>
    <span class="modal__hud-label"></span>
  `;
  hudLabel = hud.querySelector('.modal__hud-label');
  // Insert as the first child of the panel so it sits above the body,
  // aligned with the close button on the top edge.
  panel.insertBefore(hud, panel.firstChild);
}

/**
 * Refresh hue + label from the live companion + label element. Runs
 * on every frame while the modal is open so mode changes and hue
 * drift (R2.4) stay in sync with the real SENTINEL.
 */
function refreshHud() {
  if (!hud) return;
  const companion = getCompanion && getCompanion();
  const hue = companion && typeof companion.getHue === 'function' ? companion.getHue() : 0;
  hud.style.color = hueToRgb(hue);
  const labelEl = document.getElementById('companion-label');
  if (hudLabel) hudLabel.textContent = (labelEl && labelEl.textContent) || 'SYSTEM · READY';
}

function startHudLoop() {
  if (hudRafId) cancelAnimationFrame(hudRafId);
  const step = () => {
    refreshHud();
    hudRafId = requestAnimationFrame(step);
  };
  hudRafId = requestAnimationFrame(step);
}
function stopHudLoop() {
  if (hudRafId) cancelAnimationFrame(hudRafId);
  hudRafId = 0;
}

function open(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;

  body.innerHTML = `
    <span class="modal__badge">${escapeHtml(p.badge)}</span>
    <h2 class="modal__title">${escapeHtml(p.title)}</h2>
    <p class="modal__subtitle">${escapeHtml(p.subtitle)}</p>
    <div class="modal__meta">
      <div><span class="k">Year</span><span class="v">${escapeHtml(p.year)}</span></div>
      <div><span class="k">Role</span><span class="v">${escapeHtml(p.role)}</span></div>
    </div>
    <div class="modal__stack">
      ${p.stack.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join('')}
    </div>
    ${p.sections
      .map(
        (s) => `
        <div class="modal__section">
          <h3>${escapeHtml(s.heading)}</h3>
          <p>${escapeHtml(s.body)}</p>
        </div>`
      )
      .join('')}
  `;

  lastFocused = document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Snapshot state immediately + start tracking loop so the HUD stays
  // in sync with SENTINEL's hue/mode label while the modal is open.
  refreshHud();
  if (hud) {
    // Restart the "arrive" animation each open by toggling the class.
    hud.classList.remove('is-in');
    void hud.offsetWidth; // force reflow so the transition re-triggers
    hud.classList.add('is-in');
  }
  startHudLoop();

  // Focus close button for a11y
  const closeBtn = modal.querySelector('.modal__close');
  if (closeBtn) closeBtn.focus();
}

function close() {
  // Documents_in handoff — fire BEFORE hiding so scene.js still sees a
  // valid emissionDir. Under prefersReduced we skip the directional
  // burst per the reduced-motion contract.
  const companion = getCompanion && getCompanion();
  if (companion && !prefersReduced) {
    try {
      // Origin: modal panel center in DOM pixel space (screen-Y-down).
      const rect = panel && panel.getBoundingClientRect();
      const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const originY = rect ? rect.top  + rect.height / 2 : window.innerHeight / 2;

      // Target: SENTINEL's overlay position. Fall back to the bottom-
      // right home if the caller didn't provide a live getter (still
      // gives a reasonable arc for the particles to travel).
      const bp = getBuddyPos && getBuddyPos();
      const buddyX = bp && typeof bp.x === 'number' ? bp.x : window.innerWidth  - 90;
      const buddyY = bp && typeof bp.y === 'number' ? bp.y : window.innerHeight - 110;

      // companion.emit('documents_in') spawns particles at
      // `emissionDir` (interpreted in overlay pixel space, Y-up,
      // relative to buddy at the origin) and drifts them back toward
      // the buddy. So we need the vector FROM buddy TO the modal
      // origin, converted to overlay space (flip Y).
      const dx =   originX - buddyX;
      const dy = -(originY - buddyY);
      if (typeof companion.setEmissionDir === 'function') {
        companion.setEmissionDir(dx, dy);
      }
      if (typeof companion.emit === 'function') {
        companion.emit('documents_in');
      }
    } catch (err) {
      // Handoff is a nice-to-have; never block the close on it.
    }
  }

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (hud) hud.classList.remove('is-in');
  stopHudLoop();
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}
