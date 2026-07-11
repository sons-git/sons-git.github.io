// -------------------------------------------------------------
// sfx.js — Web Audio SFX + ambient music.
//
// v3 (2025-11) — "outer space" ambient + per-section SFX palette.
//
// Music design (space, not drone):
//   Removed the sawtooth pad (too warm/analog). New bed is:
//     • sub sine at 40 Hz with 12 s LFO on amplitude (breathing bass)
//     • wind-noise: filtered pink-ish noise, slow bandpass sweep
//     • sparse bell events: FM chimes at random intervals on a
//       minor pentatonic scale, panned to random positions with
//       long reverb tails
//   Music bus lowered to 0.022 (was 0.05) so it sits UNDER voices
//   and never fights the SFX layer.
//
// SFX palette (all filtered / FM synthesised, no pure sines):
//   Universal:
//     • blip()     — hover on interactive item
//     • click()    — click on any interactive element
//     • whoosh()   — section boundary crossing
//     • chime()    — trophy verify flip
//     • tick()     — cert stamp
//   Section-specific:
//     • analyze()  — trophy hold pulse (rhythmic soft ticks)
//     • laser()    — Skills scan-fan fire
//     • broadcast()— Vision item mapped
//     • hum(el)    — Contact meta hover (sustained; returns handle
//                    with .stop() to release)
//     • journey()  — Journey timeline item hover (chirp variant)
//     • verify()   — Recognition alt-blip (softer, warmer)
//
// Every section-specific SFX has its own filter / envelope so a
// visitor can hear what SENTINEL is doing without looking.
// -------------------------------------------------------------

const STORAGE_KEY = 'sfx-enabled';

let ctx = null;
let masterGain = null;
let sfxBus = null;
let musicBus = null;
let reverb = null;
let enabled = true;
let ambientHandles = null;
let unlocked = false;

try {
  enabled = window.localStorage.getItem(STORAGE_KEY) !== 'false';
} catch (_e) { /* localStorage unavailable */ }

// -------------------------------------------------------------
// Context + master graph. Built lazily on the first user gesture.
// -------------------------------------------------------------
function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();

  masterGain = ctx.createGain();
  masterGain.gain.value = 1.0;
  masterGain.connect(ctx.destination);

  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.14;
  sfxBus.connect(masterGain);

  // Music at 1.2 % — barely present, just atmosphere.
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.012;
  musicBus.connect(masterGain);

  reverb = createSpace(ctx, sfxBus);

  return ctx;
}

// -------------------------------------------------------------
// Cheap "space" via a 2-tap dampened delay network. Attaches to
// the SFX bus — every SFX picks up ~100 ms of decorrelated tail.
// -------------------------------------------------------------
function createSpace(c, output) {
  // Bigger, longer, darker reverb — everything sits in a cathedral.
  // Cinematic ambient design leans on space, not on the source.
  const input = c.createGain();
  input.gain.value = 1;

  // Dry slightly reduced so the wet dominates and sounds don't feel
  // stone-close to the ear.
  const dry = c.createGain(); dry.gain.value = 0.85;
  input.connect(dry).connect(output);

  const wet = c.createGain();
  wet.gain.value = 0.55;
  // 4-tap dampened delay network — longer taps, higher feedback,
  // heavier lowpass damping. Reads as a large room decay.
  const d1 = c.createDelay(1.5); d1.delayTime.value = 0.083;
  const d2 = c.createDelay(1.5); d2.delayTime.value = 0.121;
  const d3 = c.createDelay(1.5); d3.delayTime.value = 0.163;
  const d4 = c.createDelay(1.5); d4.delayTime.value = 0.211;
  const fb = c.createGain(); fb.gain.value = 0.55;
  const damp = c.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 2800;
  damp.Q.value = 0.5;

  input.connect(d1);
  input.connect(d2);
  input.connect(d3);
  input.connect(d4);
  d1.connect(damp);
  d2.connect(damp);
  d3.connect(damp);
  d4.connect(damp);
  damp.connect(fb);
  fb.connect(d1); fb.connect(d2); fb.connect(d3); fb.connect(d4);
  damp.connect(wet).connect(output);

  return { input };
}

function toSfxBus() { return reverb ? reverb.input : sfxBus; }

// -------------------------------------------------------------
// Autoplay unlock
// -------------------------------------------------------------
function unlock() {
  if (unlocked) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  unlocked = true;
  if (enabled) startAmbient();
}
window.addEventListener('pointerdown', unlock, { once: true, passive: true });
window.addEventListener('keydown', unlock, { once: true });

function play(fn) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  try { fn(c, toSfxBus()); } catch (_e) { /* silent */ }
}

// -------------------------------------------------------------
// Shared FM voice helper — carrier + modulator envelope.
// -------------------------------------------------------------
function fmVoice(c, output, {
  carrierFreq, modFreq, modIndex,
  attack = 0.005, decay = 0.08, peak = 0.3,
  filterFreq = null, filterQ = 1, filterType = 'bandpass',
}) {
  const now = c.currentTime;
  const car = c.createOscillator();
  const mod = c.createOscillator();
  const modGain = c.createGain();
  const outGain = c.createGain();

  car.type = 'sine';
  mod.type = 'sine';
  car.frequency.value = carrierFreq;
  mod.frequency.value = modFreq;
  modGain.gain.value = modFreq * modIndex;
  mod.connect(modGain).connect(car.frequency);

  outGain.gain.setValueAtTime(0, now);
  outGain.gain.linearRampToValueAtTime(peak, now + attack);
  outGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

  let last = outGain;
  if (filterFreq != null) {
    const filt = c.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = filterFreq;
    filt.Q.value = filterQ;
    outGain.connect(filt);
    last = filt;
  }
  car.connect(outGain);
  last.connect(output);

  car.start(now); mod.start(now);
  car.stop(now + attack + decay + 0.05);
  mod.stop(now + attack + decay + 0.05);
}

// -------------------------------------------------------------
// Rotation helper — the sound of a spinning object in space.
// Base tone + tremolo (amp LFO) + vibrato (pitch LFO) at the same
// rate. Rate can ramp from startRate to endRate over the duration,
// which produces the accelerating "wuh-wuh-wuh" of a disc spooling
// up. Filter is lowpass so the tone stays warm; no harsh edges.
// -------------------------------------------------------------
function rotate(c, out, {
  baseFreq = 130,
  startRate = 1.5,
  endRate = 6,
  duration = 0.8,
  peak = 0.28,
  filterFreq = 800,
  filterQ = 2.5,
}) {
  const now = c.currentTime;
  const stopAt = now + duration + 0.15;

  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = baseFreq;

  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = filterFreq;
  filt.Q.value = filterQ;

  // Amp LFO — the "wuh" tremolo. Base 0 with LFO adding on top so
  // the tremolo depth is fully controllable and never dips below 0.
  const lfo = c.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(startRate, now);
  lfo.frequency.exponentialRampToValueAtTime(endRate, now + duration);
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = peak * 0.5;
  lfo.connect(lfoDepth);

  const outGain = c.createGain();
  outGain.gain.setValueAtTime(0, now);
  outGain.gain.linearRampToValueAtTime(peak * 0.55, now + 0.1);
  outGain.gain.linearRampToValueAtTime(peak * 0.45, now + duration - 0.1);
  outGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.1);
  lfoDepth.connect(outGain.gain);

  // Vibrato — subtle pitch modulation at the same rate keeps the
  // wobble coherent. Depth is 3 % of base freq, tiny but audible.
  const vib = c.createOscillator();
  vib.type = 'sine';
  vib.frequency.setValueAtTime(startRate, now);
  vib.frequency.exponentialRampToValueAtTime(endRate, now + duration);
  const vibDepth = c.createGain();
  vibDepth.gain.value = baseFreq * 0.03;
  vib.connect(vibDepth).connect(osc.frequency);

  osc.connect(filt).connect(outGain).connect(out);

  osc.start(now); lfo.start(now); vib.start(now);
  osc.stop(stopAt); lfo.stop(stopAt); vib.stop(stopAt);
}

// -------------------------------------------------------------
// Universal SFX — ambient / space language, no game bleeps.
// -------------------------------------------------------------

let lastBlipAt = 0;
export function blip() {
  // "Shimmer" — very short high-frequency wash. No tone. Reads as
  // "SENTINEL noticed" without ever sounding like a game menu.
  const nowT = performance.now();
  if (nowT - lastBlipAt < 90) return;
  lastBlipAt = nowT;
  play((c, out) => {
    const t0 = c.currentTime;
    const buf = c.createBuffer(1, 1024, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 5000;
    filt.Q.value = 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.08, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
    src.connect(filt).connect(g).connect(out);
    src.start(t0); src.stop(t0 + 0.13);
  });
}

let lastClickAt = 0;
export function click() {
  // "Thud" — deep short pulse in the sub-low range with a slow
  // decay. Sits under everything and picks up the reverb send for
  // an ambient tail. No noise burst, no bright transient.
  const nowT = performance.now();
  if (nowT - lastClickAt < 80) return;
  lastClickAt = nowT;
  play((c, out) => {
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.35, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(g).connect(out);
    osc.start(now); osc.stop(now + 0.25);
  });
}

export function whoosh() {
  // Cinematic swell — sustained low tone that rises briefly then
  // fades back into the reverb. No noise, no bandpass sharpness.
  play((c, out) => {
    const now = c.currentTime;
    const dur = 0.9;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + dur * 0.5);
    osc.frequency.exponentialRampToValueAtTime(180, now + dur);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 900;
    filt.Q.value = 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.28, now + 0.18);
    g.gain.linearRampToValueAtTime(0.18, now + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(filt).connect(g).connect(out);
    osc.start(now); osc.stop(now + dur + 0.05);
  });
}

export function chime() {
  // Deep sustained triad, slow attack. Reverb does most of the work.
  play((c, out) => {
    const notes = [220, 330, 440]; // A3 + E4 + A4 — open fifth into octave
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const filt = c.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 1600; filt.Q.value = 0.7;
      const g = c.createGain();
      const start = c.currentTime + i * 0.02;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.13, start + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);
      osc.connect(filt).connect(g).connect(out);
      osc.start(start); osc.stop(start + 1.5);
    });
  });
}

export function tick() {
  // Distant water-drop — soft sine chime, no noise. Long tail comes
  // from the reverb bus.
  play((c, out) => {
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.09, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(g).connect(out);
    osc.start(now); osc.stop(now + 0.32);
  });
}

// -------------------------------------------------------------
// Section entry cues — one distinct sound per section, matching the
// mode SENTINEL switches into. Called from main.js onSectionChange
// in place of the generic whoosh. Each is 300-600 ms.
//
//   0 hero       — soft wake pad
//   1 approach   — analyze arpeggio + rising bandpass
//   2 journey    — spool-up whine (SENTINEL's spin accelerates)
//   3 work       — targeting lock click
//   4 skills     — buffer-load tick cascade
//   5 recognition— stamp thunk + bell tail
//   6 vision     — bloom triad (perfect fifth open)
//   7 contact    — descending listen pad + hum onset
// -------------------------------------------------------------

// Cinematic pad helper — sustained tone with slow attack + long
// decay. Optional filter sweep for movement without pitch change.
function pad(c, out, {
  freq, wave = 'triangle',
  attack = 0.15, decay = 1.0, peak = 0.16,
  filterStart = null, filterEnd = null, filterQ = 0.8,
}) {
  const now = c.currentTime;
  const stopAt = now + attack + decay + 0.15;

  const osc = c.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;

  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.Q.value = filterQ;
  const fStart = filterStart != null ? filterStart : Math.max(400, freq * 3);
  const fEnd   = filterEnd   != null ? filterEnd   : fStart;
  filt.frequency.setValueAtTime(fStart, now);
  filt.frequency.linearRampToValueAtTime(fEnd, now + attack + decay);

  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

  osc.connect(filt).connect(g).connect(out);
  osc.start(now); osc.stop(stopAt);
}

export function enterHero() {
  // Warm pad — root + fifth, sustained.
  play((c, out) => {
    pad(c, out, { freq: 110, attack: 0.4, decay: 1.4, peak: 0.10 });
    pad(c, out, { freq: 165, attack: 0.5, decay: 1.4, peak: 0.08, wave: 'sine' });
  });
}

export function enterApproach() {
  // Analytical — sustained pad opens its filter over ~1 s. Reads
  // as SENTINEL focusing / narrowing attention. No arpeggio.
  play((c, out) => {
    pad(c, out, {
      freq: 165, attack: 0.15, decay: 1.1, peak: 0.14,
      filterStart: 300, filterEnd: 1400, filterQ: 2,
    });
    pad(c, out, {
      freq: 220, attack: 0.25, decay: 1.0, peak: 0.09,
      filterStart: 400, filterEnd: 1600, filterQ: 1.4,
    });
  });
}

export function enterJourney() {
  // Spinning disc in space — accelerating "wuh-wuh" via tremolo +
  // vibrato at the same rate, ramping from slow to fast over 900ms.
  // Matches SENTINEL's ring accelerating from rotSpeed ~1.6 to
  // ~5.5 in trace mode. Uses the shared `rotate` helper so the
  // sound is defined once and can be reused for any spin event.
  play((c, out) => {
    rotate(c, out, {
      baseFreq: 130,
      startRate: 1.4,
      endRate: 6.5,
      duration: 0.9,
      peak: 0.32,
      filterFreq: 780,
      filterQ: 2.4,
    });
  });
}

export function enterWork() {
  // Scanning drift — one sustained tone with slow filter sweep.
  // No servo click, no confirmation tick. Just SENTINEL settling
  // into "index" mode.
  play((c, out) => {
    pad(c, out, {
      freq: 147, attack: 0.2, decay: 1.0, peak: 0.15,
      filterStart: 500, filterEnd: 1100, filterQ: 2.2,
    });
    pad(c, out, {
      freq: 220, attack: 0.28, decay: 0.9, peak: 0.08,
      filterStart: 700, filterEnd: 1400, filterQ: 1.4,
    });
  });
}

export function enterSkills() {
  // Dense sustained texture — five close-tuned sines forming a
  // shimmering cluster. Reads as "SENTINEL parsing" through a
  // wall of soft harmonics, not a cascade of clicks.
  play((c, out) => {
    const roots = [220, 233.08, 247, 261.63, 277.18]; // A3-C#4 cluster
    const now = c.currentTime;
    roots.forEach((freq) => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const filt = c.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 1400; filt.Q.value = 0.8;
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      osc.connect(filt).connect(g).connect(out);
      osc.start(now); osc.stop(now + 1.2);
    });
  });
}

export function enterRecognition() {
  // Metal bell — single deep sustained struck tone with LONG
  // decay. No snap, no broadband transient. The reverb send does
  // the rest.
  play((c, out) => {
    const now = c.currentTime;
    // Fundamental
    const oscA = c.createOscillator();
    oscA.type = 'triangle';
    oscA.frequency.value = 165; // E3
    // Inharmonic partial for metallic colour (no FM, just added tone)
    const oscB = c.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.value = 165 * 2.76; // ~455 Hz — inharmonic
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    const gB = c.createGain();
    gB.gain.setValueAtTime(0, now);
    gB.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gB.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 2000; filt.Q.value = 0.7;
    oscA.connect(g);
    oscB.connect(gB);
    g.connect(filt); gB.connect(filt);
    filt.connect(out);
    oscA.start(now); oscB.start(now);
    oscA.stop(now + 1.7); oscB.stop(now + 1.3);
  });
}

export function enterVision() {
  // Bloom chord — three notes SIMULTANEOUSLY (not staggered) with
  // slow attack + long decay. Reads as pure expansion.
  play((c, out) => {
    const notes = [220, 330, 440]; // A3 + E4 + A4
    notes.forEach((freq) => {
      pad(c, out, {
        freq, wave: 'triangle',
        attack: 0.2, decay: 1.4, peak: 0.11,
        filterStart: 1200, filterEnd: 1600, filterQ: 0.7,
      });
    });
  });
}

export function enterContact() {
  // Descending settle — one sustained tone that glides down and
  // fades. "SENTINEL entering await mode."
  play((c, out) => {
    const now = c.currentTime;
    const dur = 1.1;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + dur);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 1200; filt.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(filt).connect(g).connect(out);
    osc.start(now); osc.stop(now + dur + 0.05);
  });
}

// Dispatcher — main.js calls this on section change instead of
// generic whoosh. Falls back to whoosh for unknown indices.
const SECTION_ENTER = [
  enterHero, enterApproach, enterJourney, enterWork,
  enterSkills, enterRecognition, enterVision, enterContact,
];
export function enterSection(idx) {
  const fn = SECTION_ENTER[idx | 0];
  if (fn) fn(); else whoosh();
}

// -------------------------------------------------------------
// Section-specific SFX
// -------------------------------------------------------------

// Trophy hold pulse — soft breath tone, no pitch stepping. Reads
// as "SENTINEL analysing" through gentle continuous presence.
export function analyze() {
  play((c, out) => {
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 260; // sits under the chime range
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 700;
    filt.Q.value = 1.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(filt).connect(g).connect(out);
    osc.start(now); osc.stop(now + 0.28);
  });
}

// Skills scan-fan — airy sustained sweep. Lowpass (warm) rather
// than bandpass (harsh), no FM whine. Reads as wave of energy
// passing across the target, not a laser.
let lastLaserAt = 0;
export function laser() {
  const nowT = performance.now();
  if (nowT - lastLaserAt < 300) return;
  lastLaserAt = nowT;
  play((c, out) => {
    const now = c.currentTime;
    const dur = 0.7;

    // Warm noise wash with gentle lowpass sweep.
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const n = Math.random() * 2 - 1;
      last = (last + n * 0.15) * 0.96;
      d[i] = last;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.Q.value = 1.2;
    filt.frequency.setValueAtTime(400, now);
    filt.frequency.exponentialRampToValueAtTime(1600, now + dur * 0.55);
    filt.frequency.exponentialRampToValueAtTime(600, now + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.2, now + 0.15);
    g.gain.linearRampToValueAtTime(0.12, now + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt).connect(g).connect(out);
    src.start(now); src.stop(now + dur + 0.02);

    // Sub tonal presence under the sweep.
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + dur * 0.5);
    osc.frequency.exponentialRampToValueAtTime(180, now + dur);
    const og = c.createGain();
    og.gain.setValueAtTime(0, now);
    og.gain.linearRampToValueAtTime(0.08, now + 0.15);
    og.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(og).connect(out);
    osc.start(now); osc.stop(now + dur + 0.02);
  });
}

// Vision map — expanding chord swell. Three notes simultaneously,
// slow attack, long decay. No stagger (would read as arpeggio).
let lastBroadcastAt = 0;
export function broadcast() {
  const nowT = performance.now();
  if (nowT - lastBroadcastAt < 200) return;
  lastBroadcastAt = nowT;
  play((c, out) => {
    const notes = [220, 330, 440]; // A3 E4 A4 — open shape
    const now = c.currentTime;
    notes.forEach((freq) => {
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const filt = c.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 1800; filt.Q.value = 0.7;
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.1, now + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      osc.connect(filt).connect(g).connect(out);
      osc.start(now); osc.stop(now + 1.2);
    });
  });
}

// Contact meta hover — sustained low hum that rises from silence
// when engaged, fades back when released. Returns { stop } handle.
export function hum() {
  if (!enabled) return { stop: () => {} };
  const c = ensureCtx();
  if (!c) return { stop: () => {} };
  if (c.state === 'suspended') c.resume();
  const now = c.currentTime;

  const out = toSfxBus();
  const osc1 = c.createOscillator();
  const osc2 = c.createOscillator();
  osc1.type = 'triangle'; osc2.type = 'triangle';
  osc1.frequency.value = 220;   // A3
  osc2.frequency.value = 330;   // E4 (perfect fifth)
  const filt = c.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = 900; filt.Q.value = 3;
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.09, now + 0.25);
  osc1.connect(filt); osc2.connect(filt);
  filt.connect(g).connect(out);
  osc1.start(now); osc2.start(now);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      const nowS = c.currentTime;
      g.gain.cancelScheduledValues(nowS);
      g.gain.setValueAtTime(g.gain.value, nowS);
      g.gain.linearRampToValueAtTime(0, nowS + 0.25);
      setTimeout(() => { try { osc1.stop(); osc2.stop(); } catch (_e) {} }, 300);
    },
  };
}

// Journey timeline — soft low-register breath, no chirp. Distinct
// from blip by being lower and slightly longer.
export function journey() {
  play((c, out) => {
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 165; // E3
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 650; filt.Q.value = 1.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.11, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(filt).connect(g).connect(out);
    osc.start(now); osc.stop(now + 0.3);
  });
}

// Recognition trophy hover — warm sustained glow. No transient.
export function verify() {
  play((c, out) => {
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 330; // E4
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.09, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    osc.connect(filt).connect(g).connect(out);
    osc.start(now); osc.stop(now + 0.4);
  });
}

// -------------------------------------------------------------
// Ambient — Hans Zimmer-style scifi atmosphere (v4).
//
// Design brief: think Interstellar / Dune / Blade Runner 2049 —
// sustained harmonic layers, deep sub, high shimmer, huge reverb,
// no percussion, no bells, no plinks. Movement comes from slow
// LFOs on filters + individual voice amplitudes, not from active
// note events. Chord stays on Am9 (A minor 9) throughout; the
// perceived movement is entirely textural.
//
// Layers:
//   (1) Sub bass drone at 55 Hz (A1). 15-second amp LFO — feels
//       like the room breathing.
//   (2) Chord pad — 5 detuned sawtooth voices spelling Am9
//       (A2 C3 E3 G3 B3) through a shared lowpass with 28-second
//       filter LFO. Each voice has its own slow amp LFO at a
//       different rate so their relative levels drift — creates
//       constant motion inside a static chord.
//   (3) High shimmer — highpass-filtered noise at ~4 kHz with a
//       35-second amp LFO. Very quiet. Adds "void sparkle."
//   (4) Choir-like formant — filtered noise passing through two
//       resonant bandpass filters tuned to vowel-ish formants.
//       Fades in slowly and drifts.
//
// Master music bus stays at 0.022 for balance with SFX (0.14).
// -------------------------------------------------------------
function startAmbient() {
  if (ambientHandles) return;
  const c = ensureCtx();
  if (!c || !musicBus) return;

  const now = c.currentTime;
  const fadeIn = 8; // long lift-in so unmute isn't jarring

  // -------- (1) Sub bass drone --------
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 55; // A1

  const subLfo = c.createOscillator();
  subLfo.type = 'sine';
  subLfo.frequency.value = 1 / 15;
  const subLfoGain = c.createGain();
  subLfoGain.gain.value = 0.28;
  subLfo.connect(subLfoGain);

  const subGain = c.createGain();
  subGain.gain.setValueAtTime(0, now);
  subGain.gain.linearRampToValueAtTime(0.5, now + fadeIn);
  subLfoGain.connect(subGain.gain);
  sub.connect(subGain).connect(musicBus);

  // -------- (2) Am9 chord pad --------
  // Frequencies for A2 C3 E3 G3 B3 — the 1 b3 5 b7 9 of Am.
  const chordFreqs = [110.0, 130.81, 164.81, 196.0, 246.94];
  // Very tiny detune per voice for slow beating.
  const detunes    = [ +2, -3, +1, -2, +3 ]; // cents

  // Shared lowpass filter with slow LFO for the chord bus. This is
  // where the "movement" of a static chord comes from — you're
  // hearing the same notes but the filter uncovers different
  // partials over time.
  const chordFilt = c.createBiquadFilter();
  chordFilt.type = 'lowpass';
  chordFilt.Q.value = 4;
  const chordFiltLfo = c.createOscillator();
  chordFiltLfo.type = 'sine';
  chordFiltLfo.frequency.value = 1 / 28;
  const chordFiltLfoGain = c.createGain();
  chordFiltLfoGain.gain.value = 480;
  chordFiltLfo.connect(chordFiltLfoGain).connect(chordFilt.frequency);
  chordFilt.frequency.value = 700; // centre; LFO swings ±480

  const chordBus = c.createGain();
  chordBus.gain.setValueAtTime(0, now);
  chordBus.gain.linearRampToValueAtTime(0.45, now + fadeIn);
  chordFilt.connect(chordBus).connect(musicBus);

  const voices = chordFreqs.map((freq, i) => {
    // Two sawtooths per voice, slightly detuned, mixed together —
    // gives the pad thickness without being buzzy.
    const oscA = c.createOscillator();
    const oscB = c.createOscillator();
    oscA.type = 'sawtooth';
    oscB.type = 'sawtooth';
    oscA.frequency.value = freq;
    oscB.frequency.value = freq;
    oscA.detune.value =  detunes[i];
    oscB.detune.value = -detunes[i] * 1.3;

    const voiceGain = c.createGain();
    // Each voice's individual amp LFO — different rate per voice
    // so the group breathes asynchronously. Base around 0.55, swing
    // ±0.15, so no voice ever fully drops out.
    const vLfo = c.createOscillator();
    vLfo.type = 'sine';
    vLfo.frequency.value = 1 / (18 + i * 4); // 18, 22, 26, 30, 34 s
    const vLfoGain = c.createGain();
    vLfoGain.gain.value = 0.15;
    vLfo.connect(vLfoGain);

    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(0.55, now + fadeIn);
    vLfoGain.connect(voiceGain.gain);

    oscA.connect(voiceGain);
    oscB.connect(voiceGain);
    voiceGain.connect(chordFilt);

    return { oscA, oscB, voiceGain, vLfo };
  });

  // -------- (3) High shimmer --------
  const shimBuf = c.createBuffer(1, c.sampleRate * 6, c.sampleRate);
  const sd = shimBuf.getChannelData(0);
  for (let i = 0; i < sd.length; i++) sd[i] = (Math.random() * 2 - 1) * 0.4;
  const shim = c.createBufferSource();
  shim.buffer = shimBuf;
  shim.loop = true;

  const shimFilt = c.createBiquadFilter();
  shimFilt.type = 'highpass';
  shimFilt.frequency.value = 3800;
  shimFilt.Q.value = 1;

  const shimLfo = c.createOscillator();
  shimLfo.type = 'sine';
  shimLfo.frequency.value = 1 / 35;
  const shimLfoGain = c.createGain();
  shimLfoGain.gain.value = 0.06;
  shimLfo.connect(shimLfoGain);

  const shimGain = c.createGain();
  shimGain.gain.setValueAtTime(0, now);
  shimGain.gain.linearRampToValueAtTime(0.08, now + fadeIn);
  shimLfoGain.connect(shimGain.gain);
  shim.connect(shimFilt).connect(shimGain).connect(musicBus);

  // -------- (4) Choir-like formant --------
  const chorBuf = c.createBuffer(1, c.sampleRate * 6, c.sampleRate);
  const cd = chorBuf.getChannelData(0);
  let x = 0;
  for (let i = 0; i < cd.length; i++) {
    x = (x + (Math.random() * 2 - 1) * 0.1) * 0.98;
    cd[i] = x;
  }
  const chor = c.createBufferSource();
  chor.buffer = chorBuf;
  chor.loop = true;

  // Two bandpass filters in series — an "ah" formant (F1 ~700 Hz,
  // F2 ~1100 Hz). Gives the noise a vocal-ish colour.
  const chorF1 = c.createBiquadFilter();
  chorF1.type = 'bandpass'; chorF1.Q.value = 8; chorF1.frequency.value = 720;
  const chorF2 = c.createBiquadFilter();
  chorF2.type = 'bandpass'; chorF2.Q.value = 8; chorF2.frequency.value = 1100;

  // Very slow LFO drifts the formants slightly — reads as vowel
  // shift from "ah" to "oh" and back.
  const chorLfo = c.createOscillator();
  chorLfo.type = 'sine';
  chorLfo.frequency.value = 1 / 42;
  const chorLfoGain = c.createGain();
  chorLfoGain.gain.value = 140;
  chorLfo.connect(chorLfoGain).connect(chorF1.frequency);
  const chorLfoGain2 = c.createGain();
  chorLfoGain2.gain.value = 220;
  chorLfo.connect(chorLfoGain2).connect(chorF2.frequency);

  const chorGain = c.createGain();
  chorGain.gain.setValueAtTime(0, now);
  chorGain.gain.linearRampToValueAtTime(0.18, now + fadeIn);
  chor.connect(chorF1).connect(chorF2).connect(chorGain).connect(musicBus);

  // -------- start everything --------
  sub.start(now); subLfo.start(now);
  chordFiltLfo.start(now);
  voices.forEach(v => { v.oscA.start(now); v.oscB.start(now); v.vLfo.start(now); });
  shim.start(now); shimLfo.start(now);
  chor.start(now); chorLfo.start(now);

  ambientHandles = {
    sub, subLfo, subGain,
    chordFiltLfo, chordBus, voices,
    shim, shimLfo, shimGain,
    chor, chorLfo, chorGain,
  };
}

function stopAmbient() {
  if (!ambientHandles || !ctx) return;
  const now = ctx.currentTime;
  const {
    sub, subLfo, subGain,
    chordFiltLfo, chordBus, voices,
    shim, shimLfo, shimGain,
    chor, chorLfo, chorGain,
  } = ambientHandles;

  const fadeOut = 0.6;
  [subGain, chordBus, shimGain, chorGain].forEach(g => {
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, now + fadeOut);
  });

  setTimeout(() => {
    try {
      sub.stop(); subLfo.stop();
      chordFiltLfo.stop();
      voices.forEach(v => { v.oscA.stop(); v.oscB.stop(); v.vLfo.stop(); });
      shim.stop(); shimLfo.stop();
      chor.stop(); chorLfo.stop();
    } catch (_e) {}
    ambientHandles = null;
  }, (fadeOut + 0.1) * 1000);
}

// -------------------------------------------------------------
// Enabled state controls
// -------------------------------------------------------------

export function setEnabled(v) {
  const wasEnabled = enabled;
  enabled = !!v;
  try { window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false'); }
  catch (_e) { /* ignore */ }

  if (enabled) {
    ensureCtx();
    if (unlocked) startAmbient();
  } else if (wasEnabled) {
    stopAmbient();
  }
}

export function toggle() {
  setEnabled(!enabled);
  return enabled;
}

export function isEnabled() {
  return enabled;
}
