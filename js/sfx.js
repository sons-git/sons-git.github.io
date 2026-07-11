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

  // Music at 2.2 % — quiet enough to be atmosphere, not competition.
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.022;
  musicBus.connect(masterGain);

  reverb = createSpace(ctx, sfxBus);

  return ctx;
}

// -------------------------------------------------------------
// Cheap "space" via a 2-tap dampened delay network. Attaches to
// the SFX bus — every SFX picks up ~100 ms of decorrelated tail.
// -------------------------------------------------------------
function createSpace(c, output) {
  const input = c.createGain();
  input.gain.value = 1;

  input.connect(output); // dry

  const wet = c.createGain();
  wet.gain.value = 0.3;
  const d1 = c.createDelay(0.5); d1.delayTime.value = 0.055;
  const d2 = c.createDelay(0.5); d2.delayTime.value = 0.093;
  const fb = c.createGain(); fb.gain.value = 0.35;
  const damp = c.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 4200;

  input.connect(d1);
  input.connect(d2);
  d1.connect(damp).connect(fb).connect(d1);
  d1.connect(wet);
  d2.connect(wet);
  wet.connect(output);

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
// Universal SFX
// -------------------------------------------------------------

let lastBlipAt = 0;
export function blip() {
  const nowT = performance.now();
  if (nowT - lastBlipAt < 90) return;
  lastBlipAt = nowT;
  play((c, out) => {
    const t0 = c.currentTime;
    fmVoice(c, out, {
      carrierFreq: 3200, modFreq: 480, modIndex: 1.8,
      attack: 0.003, decay: 0.055, peak: 0.20,
    });
    // Air-layer noise burst at high frequency for texture.
    const buf = c.createBuffer(1, 512, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < 512; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = 'highpass';
    filt.frequency.value = 4200; filt.Q.value = 4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.045, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    src.connect(filt).connect(g).connect(out);
    src.start(t0); src.stop(t0 + 0.06);
  });
}

let lastClickAt = 0;
export function click() {
  const nowT = performance.now();
  if (nowT - lastClickAt < 60) return;
  lastClickAt = nowT;
  play((c, out) => {
    const now = c.currentTime;
    const nb = c.createBuffer(1, 512, c.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < 512; i++) nd[i] = Math.random() * 2 - 1;
    const nsrc = c.createBufferSource(); nsrc.buffer = nb;
    const nfilt = c.createBiquadFilter();
    nfilt.type = 'bandpass'; nfilt.frequency.value = 3400; nfilt.Q.value = 6;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.4, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    nsrc.connect(nfilt).connect(ng).connect(out);
    nsrc.start(now); nsrc.stop(now + 0.04);

    fmVoice(c, out, {
      carrierFreq: 750, modFreq: 320, modIndex: 2.4,
      attack: 0.001, decay: 0.09, peak: 0.28,
    });
  });
}

export function whoosh() {
  play((c, out) => {
    const now = c.currentTime;
    const dur = 0.42;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const n = Math.random() * 2 - 1;
      last = (last + n * 0.15) * 0.94;
      d[i] = last;
    }
    const src = c.createBufferSource(); src.buffer = buf;

    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.Q.value = 9;
    filt.frequency.setValueAtTime(180, now);
    filt.frequency.exponentialRampToValueAtTime(2400, now + dur);

    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.5, now + 0.08);
    g.gain.linearRampToValueAtTime(0.3, now + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt).connect(g).connect(out);
    src.start(now); src.stop(now + dur + 0.02);

    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1400, now + dur);
    const og = c.createGain();
    og.gain.setValueAtTime(0, now + 0.05);
    og.gain.linearRampToValueAtTime(0.05, now + 0.15);
    og.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(og).connect(out);
    osc.start(now + 0.05); osc.stop(now + dur + 0.02);
  });
}

export function chime() {
  play((c, out) => {
    const dyad = [
      { car: 1400, mod: 700, idx: 3.0 },
      { car: 2100, mod: 900, idx: 2.4 },
    ];
    dyad.forEach((v, i) => {
      const c2 = c.createOscillator();
      const m2 = c.createOscillator();
      const modGain = c.createGain();
      const outGain = c.createGain();
      c2.type = 'sine'; m2.type = 'sine';
      c2.frequency.value = v.car;
      m2.frequency.value = v.mod;
      modGain.gain.value = v.mod * v.idx;
      m2.connect(modGain).connect(c2.frequency);

      const start = c.currentTime + i * 0.06;
      outGain.gain.setValueAtTime(0, start);
      outGain.gain.linearRampToValueAtTime(0.16, start + 0.01);
      outGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
      c2.connect(outGain).connect(out);
      c2.start(start); m2.start(start);
      c2.stop(start + 0.8); m2.stop(start + 0.8);
    });
  });
}

export function tick() {
  play((c, out) => {
    const now = c.currentTime;
    const buf = c.createBuffer(1, 256, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < 256; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 4200; filt.Q.value = 5;
    const g = c.createGain();
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
    src.connect(filt).connect(g).connect(out);
    src.start(now); src.stop(now + 0.03);
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

export function enterHero() {
  play((c, out) => {
    // Very soft — Hero is already a big visual moment, don't stack
    // a loud sound on it. Just a warm pad swell.
    const now = c.currentTime;
    const dur = 0.7;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.1, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(out);
    osc.start(now); osc.stop(now + dur + 0.02);
  });
}

export function enterApproach() {
  play((c, out) => {
    // Analytical: rising bandpass noise + short 3-note ascending
    // arpeggio (data queried).
    const now = c.currentTime;
    const dur = 0.35;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.Q.value = 8;
    filt.frequency.setValueAtTime(400, now);
    filt.frequency.exponentialRampToValueAtTime(1800, now + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.28, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt).connect(g).connect(out);
    src.start(now); src.stop(now + dur);

    // Ascending arpeggio (data probes)
    const notes = [1200, 1600, 2400];
    notes.forEach((freq, i) => {
      fmVoice(c, out, {
        carrierFreq: freq, modFreq: freq * 0.5, modIndex: 1.4,
        attack: 0.003, decay: 0.08, peak: 0.11,
      });
    });
  });
}

export function enterJourney() {
  // Spool-up whine — matches the ring's rotSpeed jump from ~1.6 to
  // ~5.5 in trace mode. Rising sine sweep + widening noise, resolves
  // at the top pitch. Duration ~600 ms so the audio ramp lines up
  // with the ring visibly accelerating.
  play((c, out) => {
    const now = c.currentTime;
    const dur = 0.6;

    // Sine glissando 200 → 2600 Hz.
    const osc = c.createOscillator();
    osc.type = 'sawtooth'; // sawtooth for that "servo/motor" edge
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(2600, now + dur);
    const oscFilt = c.createBiquadFilter();
    oscFilt.type = 'lowpass';
    oscFilt.frequency.setValueAtTime(600, now);
    oscFilt.frequency.exponentialRampToValueAtTime(4000, now + dur);
    oscFilt.Q.value = 6;
    const og = c.createGain();
    og.gain.setValueAtTime(0, now);
    og.gain.linearRampToValueAtTime(0.16, now + 0.08);
    og.gain.linearRampToValueAtTime(0.10, now + dur - 0.05);
    og.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.1);
    osc.connect(oscFilt).connect(og).connect(out);
    osc.start(now); osc.stop(now + dur + 0.15);

    // Widening noise (spinning airflow)
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const src = c.createBufferSource(); src.buffer = buf;
    const nfilt = c.createBiquadFilter();
    nfilt.type = 'bandpass';
    nfilt.frequency.setValueAtTime(500, now);
    nfilt.frequency.exponentialRampToValueAtTime(3400, now + dur);
    nfilt.Q.value = 4;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0, now);
    ng.gain.linearRampToValueAtTime(0.14, now + 0.1);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(nfilt).connect(ng).connect(out);
    src.start(now); src.stop(now + dur);

    // Short "lock" tone at the top of the sweep — SENTINEL settles
    // into the fast-spin state.
    setTimeout(() => {
      play((cc, oo) => {
        fmVoice(cc, oo, {
          carrierFreq: 2600, modFreq: 1300, modIndex: 1.2,
          attack: 0.003, decay: 0.14, peak: 0.10,
        });
      });
    }, dur * 1000 - 20);
  });
}

export function enterWork() {
  play((c, out) => {
    // Targeting lock — sharp servo click + brief high burst.
    // Feels like a mechanism engaging.
    const now = c.currentTime;

    // Servo click (short bandpass noise)
    const buf = c.createBuffer(1, 256, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < 256; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    src.connect(filt).connect(g).connect(out);
    src.start(now); src.stop(now + 0.05);

    // FM click tone (targeting)
    fmVoice(c, out, {
      carrierFreq: 900, modFreq: 450, modIndex: 3.0,
      attack: 0.001, decay: 0.12, peak: 0.22,
    });

    // High confirmation tick
    setTimeout(() => {
      play((cc, oo) => {
        const nb = cc.createBuffer(1, 200, cc.sampleRate);
        const nd = nb.getChannelData(0);
        for (let i = 0; i < 200; i++) nd[i] = Math.random() * 2 - 1;
        const ns = cc.createBufferSource(); ns.buffer = nb;
        const nf = cc.createBiquadFilter();
        nf.type = 'bandpass'; nf.frequency.value = 4200; nf.Q.value = 6;
        const ng = cc.createGain();
        const t = cc.currentTime;
        ng.gain.setValueAtTime(0.25, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        ns.connect(nf).connect(ng).connect(oo);
        ns.start(t); ns.stop(t + 0.04);
      });
    }, 120);
  });
}

export function enterSkills() {
  // Buffer-load tick cascade — 5 rapid ticks stepping up in pitch,
  // matches the parse mode's dense/granular character.
  play((c, out) => {
    const freqs = [2400, 2800, 3200, 3600, 4200];
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        play((cc, oo) => {
          const now = cc.currentTime;
          const buf = cc.createBuffer(1, 200, cc.sampleRate);
          const d = buf.getChannelData(0);
          for (let j = 0; j < 200; j++) d[j] = Math.random() * 2 - 1;
          const src = cc.createBufferSource(); src.buffer = buf;
          const filt = cc.createBiquadFilter();
          filt.type = 'bandpass'; filt.frequency.value = freq; filt.Q.value = 8;
          const g = cc.createGain();
          g.gain.setValueAtTime(0.2, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
          src.connect(filt).connect(g).connect(oo);
          src.start(now); src.stop(now + 0.03);
        });
      }, i * 55);
    });
  });
}

export function enterRecognition() {
  play((c, out) => {
    // Metallic stamp: low thud + broadband snap + bell tail.
    const now = c.currentTime;

    // Low thud (stamp landing)
    fmVoice(c, out, {
      carrierFreq: 140, modFreq: 60, modIndex: 3.0,
      attack: 0.002, decay: 0.18, peak: 0.35,
    });

    // Broadband snap (impact)
    const buf = c.createBuffer(1, 512, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < 512; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 2200; filt.Q.value = 4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    src.connect(filt).connect(g).connect(out);
    src.start(now); src.stop(now + 0.05);

    // Bell tail (metal ringing)
    setTimeout(() => {
      play((cc, oo) => {
        fmVoice(cc, oo, {
          carrierFreq: 1800, modFreq: 900, modIndex: 2.8,
          attack: 0.003, decay: 0.55, peak: 0.10,
        });
      });
    }, 60);
  });
}

export function enterVision() {
  // Bloom triad — root + fifth + octave, staggered 80 ms apart,
  // each with reverb. Reads as SENTINEL broadcasting outward.
  play((c, out) => {
    const notes = [
      { car: 880,  mod: 440, idx: 1.6, peak: 0.14 },
      { car: 1320, mod: 660, idx: 1.4, peak: 0.11 },
      { car: 1760, mod: 880, idx: 1.2, peak: 0.09 },
    ];
    notes.forEach((v, i) => {
      setTimeout(() => {
        play((cc, oo) => {
          fmVoice(cc, oo, {
            carrierFreq: v.car, modFreq: v.mod, modIndex: v.idx,
            attack: 0.006, decay: 0.6, peak: v.peak,
          });
        });
      }, i * 80);
    });
  });
}

export function enterContact() {
  play((c, out) => {
    // Listen — descending gentle sine + soft noise fade. The
    // "settling in to await" moment.
    const now = c.currentTime;
    const dur = 0.5;

    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g).connect(out);
    osc.start(now); osc.stop(now + dur + 0.02);

    // Soft noise (breath fading in)
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.25;
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 900; filt.Q.value = 1.5;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0, now);
    ng.gain.linearRampToValueAtTime(0.06, now + 0.15);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt).connect(ng).connect(out);
    src.start(now); src.stop(now + dur);
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

// Trophy hold pulse — soft rhythmic tick with rising pitch to
// signal "SENTINEL is analysing." Called by interactions.js during
// the 1s hold-to-verify sequence.
let analyzeCount = 0;
export function analyze() {
  play((c, out) => {
    const now = c.currentTime;
    const step = (analyzeCount++ % 4);
    const freq = 1600 + step * 200;
    fmVoice(c, out, {
      carrierFreq: freq, modFreq: freq * 0.5, modIndex: 1.2,
      attack: 0.002, decay: 0.09, peak: 0.14,
      filterFreq: freq * 1.2, filterQ: 3,
    });
  });
}

// Skills scan-fan — laser sweep sound. Rising resonant filter on
// filtered noise, plus a metallic FM tail. Rate-limited so the
// per-group cooldown isn't the only guard.
let lastLaserAt = 0;
export function laser() {
  const nowT = performance.now();
  if (nowT - lastLaserAt < 300) return;
  lastLaserAt = nowT;
  play((c, out) => {
    const now = c.currentTime;
    const dur = 0.55;

    // Noise sweep
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const n = Math.random() * 2 - 1;
      last = (last + n * 0.2) * 0.92;
      d[i] = last;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.Q.value = 14;
    filt.frequency.setValueAtTime(500, now);
    filt.frequency.exponentialRampToValueAtTime(3200, now + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.4, now + 0.04);
    g.gain.linearRampToValueAtTime(0.25, now + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt).connect(g).connect(out);
    src.start(now); src.stop(now + dur + 0.02);

    // FM whine on top
    fmVoice(c, out, {
      carrierFreq: 2400, modFreq: 3600, modIndex: 0.6,
      attack: 0.03, decay: dur - 0.05, peak: 0.10,
    });
  });
}

// Vision map — broadcast ping. Rising bell with echo tail so it
// reads as "SENTINEL surveyed and pinned this coordinate."
let lastBroadcastAt = 0;
export function broadcast() {
  const nowT = performance.now();
  if (nowT - lastBroadcastAt < 200) return;
  lastBroadcastAt = nowT;
  play((c, out) => {
    fmVoice(c, out, {
      carrierFreq: 1800, modFreq: 1200, modIndex: 2.2,
      attack: 0.005, decay: 0.55, peak: 0.18,
      filterFreq: 2400, filterQ: 6, filterType: 'lowpass',
    });
    // Second harmonic layer up a fifth
    setTimeout(() => {
      play((c2, out2) => {
        fmVoice(c2, out2, {
          carrierFreq: 2700, modFreq: 1600, modIndex: 1.8,
          attack: 0.005, decay: 0.4, peak: 0.10,
        });
      });
    }, 90);
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

// Journey timeline — quick dropping chirp for timeline item hovers.
export function journey() {
  play((c, out) => {
    fmVoice(c, out, {
      carrierFreq: 1400, modFreq: 900, modIndex: 1.6,
      attack: 0.004, decay: 0.14, peak: 0.16,
    });
  });
}

// Recognition alt-blip — softer, warmer variant used when the
// user hovers a recognition item (trophies specifically).
export function verify() {
  play((c, out) => {
    fmVoice(c, out, {
      carrierFreq: 1800, modFreq: 900, modIndex: 1.2,
      attack: 0.005, decay: 0.1, peak: 0.15,
    });
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
