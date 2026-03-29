// audio.js – Modern Web Audio Synthesis
// Weiche, satte Sounds mit Filtern, Reverb, Layering und ADSR-Envelopes

let actx       = null;
let masterGain = null;
let compressor = null;
let reverbGain = null;
let reverbConv = null;
let dryGain    = null;
let volume     = (() => { try { const v = parseFloat(localStorage.getItem('pacman-vol')); return isNaN(v) ? 0.7 : v; } catch { return 0.7; } })();
let muted      = (() => { try { return localStorage.getItem('pacman-muted') === '1'; } catch { return false; } })();

// ── Reverb Impuls generieren (synthetisch) ────────────────
function createReverbImpulse(ac, duration = 0.6, decay = 2.5) {
  const rate = ac.sampleRate;
  const len  = rate * duration;
  const buf  = ac.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function getCtx() {
  if (!actx) {
    actx = new AudioContext();

    // Master Compressor → gleichmäßige Lautstärke
    compressor = actx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value      = 12;
    compressor.ratio.value     = 4;
    compressor.attack.value    = 0.003;
    compressor.release.value   = 0.15;

    masterGain = actx.createGain();
    masterGain.gain.value = muted ? 0 : volume;

    // Dry/Wet Reverb Mix
    dryGain = actx.createGain();
    dryGain.gain.value = 0.75;

    reverbConv = actx.createConvolver();
    reverbConv.buffer = createReverbImpulse(actx, 0.6, 2.5);
    reverbGain = actx.createGain();
    reverbGain.gain.value = 0.25;

    // Routing: masterGain → compressor → dry + reverb → destination
    masterGain.connect(compressor);
    compressor.connect(dryGain);
    compressor.connect(reverbConv);
    reverbConv.connect(reverbGain);
    dryGain.connect(actx.destination);
    reverbGain.connect(actx.destination);
  }
  return actx;
}

function applyGain() {
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
}

// ── Lautstärke & Mute ─────────────────────────────────────
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  applyGain();
  try { localStorage.setItem('pacman-vol', volume); } catch {}
}

export function toggleMute() {
  muted = !muted;
  applyGain();
  try { localStorage.setItem('pacman-muted', muted ? '1' : '0'); } catch {}
  return muted;
}

export function getVolume() { return volume; }
export function isMuted()   { return muted; }

// ── Hilfsfunktionen ───────────────────────────────────────

// Oszillator mit Filter + Envelope
function synth({ freq, type = 'sine', detune = 0, dur, vol = 0.2,
                 attack = 0.005, decay = 0, sustain = 1, release = 0.05,
                 filterType = null, filterFreq = 2000, filterQ = 1,
                 filterEnv = 0, startTime = null }) {
  const ac = getCtx();
  const t  = startTime ?? ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  // Attack
  g.gain.linearRampToValueAtTime(vol, t + attack);
  // Decay → Sustain
  if (decay > 0) {
    g.gain.linearRampToValueAtTime(vol * sustain, t + attack + decay);
  }
  // Release
  const releaseStart = t + dur - release;
  g.gain.setValueAtTime(vol * (decay > 0 ? sustain : 1), releaseStart);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(g);

  // Optional Filter
  if (filterType) {
    const flt = ac.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.value = filterFreq;
    flt.Q.value = filterQ;
    // Filter Envelope
    if (filterEnv !== 0) {
      flt.frequency.setValueAtTime(filterFreq, t);
      flt.frequency.exponentialRampToValueAtTime(
        Math.max(20, filterFreq + filterEnv), t + dur * 0.7
      );
    }
    g.connect(flt);
    flt.connect(masterGain);
  } else {
    g.connect(masterGain);
  }

  osc.start(t);
  osc.stop(t + dur + 0.05);
  return osc;
}

// Layered Sound (mehrere Oszillatoren gleichzeitig)
function layered(configs) {
  return configs.map(c => synth(c));
}

// Noise-Burst (für perkussive Sounds)
function noiseBurst({ dur = 0.08, vol = 0.1, filterFreq = 3000, filterQ = 1, startTime = null }) {
  const ac = getCtx();
  const t  = startTime ?? ac.currentTime;
  const len = ac.sampleRate * dur;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buf;

  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);

  const flt = ac.createBiquadFilter();
  flt.type = 'bandpass';
  flt.frequency.value = filterFreq;
  flt.Q.value = filterQ;

  src.connect(flt);
  flt.connect(g);
  g.connect(masterGain);
  src.start(t);
  src.stop(t + dur + 0.01);
}

// ── Waka (weicher Chomp) ──────────────────────────────────
let wakaFlip = false;
export function playWaka() {
  wakaFlip = !wakaFlip;
  const f = wakaFlip ? 380 : 260;
  // Gedämpfter Pulse mit LowPass
  synth({
    freq: f, type: 'triangle', dur: 0.08, vol: 0.18,
    attack: 0.003, release: 0.03,
    filterType: 'lowpass', filterFreq: 1200, filterQ: 2
  });
  // Leiser Sub-Layer für Fülle
  synth({
    freq: f * 0.5, type: 'sine', dur: 0.06, vol: 0.08,
    attack: 0.003, release: 0.02
  });
}

// ── Siren (atmosphärischer Drone) ─────────────────────────
let sirenNodes = [];

export function startSiren(level = 1) {
  stopSiren();
  const ac = getCtx();
  const baseFreq = 140 + level * 20;

  // Haupt-Drone: tiefer Sinus mit langsamem LFO
  const osc1 = ac.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = baseFreq;

  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = baseFreq + 3; // Leichtes Detune → Chorus
  osc2.detune.value = 8;

  // LFO auf Lautstärke (Pulsieren)
  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 1.5 + level * 0.3;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain);

  // Gain
  const g1 = ac.createGain();
  g1.gain.value = 0.04;
  const g2 = ac.createGain();
  g2.gain.value = 0.03;

  lfoGain.connect(g1.gain);
  lfoGain.connect(g2.gain);

  // LowPass für Wärme
  const flt = ac.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.value = 400 + level * 40;
  flt.Q.value = 3;

  // LFO auf Filter
  const lfo2 = ac.createOscillator();
  lfo2.type = 'sine';
  lfo2.frequency.value = 0.3;
  const lfo2G = ac.createGain();
  lfo2G.gain.value = 80;
  lfo2.connect(lfo2G);
  lfo2G.connect(flt.frequency);

  osc1.connect(g1);
  osc2.connect(g2);
  g1.connect(flt);
  g2.connect(flt);
  flt.connect(masterGain);

  lfo.start(); lfo2.start();
  osc1.start(); osc2.start();

  sirenNodes = [osc1, osc2, lfo, lfo2, g1, g2, lfoGain, lfo2G, flt];
}

export function stopSiren() {
  for (const n of sirenNodes) {
    try { if (n.stop) n.stop(); } catch(_) {}
    try { n.disconnect(); } catch(_) {}
  }
  sirenNodes = [];
}

// ── Frightened (pulsierender Filter-Sweep) ────────────────
let frightNodes = [];

export function startFrightened() {
  stopSiren();
  stopFrightened();
  const ac = getCtx();

  // Tiefer Drone
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = 120;

  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 123; // Detune für Unruhe

  const g = ac.createGain();
  g.gain.value = 0.06;

  // Pulsierender Filter
  const flt = ac.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.value = 300;
  flt.Q.value = 8;

  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 3;
  const lfoG = ac.createGain();
  lfoG.gain.value = 200;
  lfo.connect(lfoG);
  lfoG.connect(flt.frequency);

  osc.connect(g);
  osc2.connect(g);
  g.connect(flt);
  flt.connect(masterGain);
  osc.start(); osc2.start(); lfo.start();

  frightNodes = [osc, osc2, lfo, g, lfoG, flt];
}

export function stopFrightened() {
  for (const n of frightNodes) {
    try { if (n.stop) n.stop(); } catch(_) {}
    try { n.disconnect(); } catch(_) {}
  }
  frightNodes = [];
}

// ── Geist fressen (Bass-Drop + Shimmer) ───────────────────
export function playEatGhost() {
  const ac = getCtx();
  const t  = ac.currentTime;

  // Bass-Drop
  synth({
    freq: 300, type: 'sine', dur: 0.2, vol: 0.3,
    attack: 0.005, decay: 0.08, sustain: 0.3, release: 0.08,
    filterType: 'lowpass', filterFreq: 800, filterQ: 3
  });

  // Shimmer (hoher Sinus schnell abklingend)
  synth({
    freq: 1200, type: 'sine', dur: 0.15, vol: 0.12,
    attack: 0.003, release: 0.06, startTime: t + 0.03
  });
  synth({
    freq: 1600, type: 'sine', dur: 0.12, vol: 0.08,
    attack: 0.003, release: 0.05, startTime: t + 0.05
  });

  // Noise-Akzent
  noiseBurst({ dur: 0.06, vol: 0.06, filterFreq: 4000, filterQ: 2 });
}

// ── Tod (dramatischer Sweep + Reverb) ─────────────────────
export function playDeath() {
  stopSiren();
  stopFrightened();
  const ac = getCtx();
  const t  = ac.currentTime;

  // Dramatischer absteigender Sweep
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.9);

  const flt = ac.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.setValueAtTime(3000, t);
  flt.frequency.exponentialRampToValueAtTime(100, t + 0.8);
  flt.Q.value = 4;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.22, t);
  g.gain.setValueAtTime(0.22, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

  osc.connect(flt);
  flt.connect(g);
  g.connect(masterGain);
  osc.start(t);
  osc.stop(t + 1.05);

  // Sub-Bass Rumble
  synth({
    freq: 60, type: 'sine', dur: 0.8, vol: 0.15,
    attack: 0.01, release: 0.3, startTime: t + 0.1
  });

  // Noise-Tail
  noiseBurst({ dur: 0.3, vol: 0.06, filterFreq: 1500, filterQ: 0.5, startTime: t + 0.05 });
}

// ── Bonus-Spiel Sounds ────────────────────────────────────

let bonusMelodyTimeout = null;
let bonusBassTimeout   = null;
let bonusMelodyOscs    = [];

export function startBonusMelody() {
  stopBonusMelody();
  const ac = getCtx();

  const melody = [
    [523, 150], [587, 150], [659, 150], [698, 150], [784, 300], [0, 100],
    [659, 150], [784, 300], [0, 100],
    [523, 150], [659, 150], [784, 150], [880, 300], [0, 100],
    [784, 150], [659, 150], [523, 300], [0, 150],
    [698, 150], [784, 150], [880, 200], [784, 150], [698, 150], [659, 300], [0, 100],
    [523, 150], [659, 200], [784, 150], [1047, 400], [0, 200],
    [880, 150], [784, 150], [659, 150], [784, 400], [0, 300],
  ];

  const bass = [
    [131, 600], [131, 600], [165, 600], [165, 600],
    [175, 600], [175, 600], [131, 600], [131, 600],
    [175, 600], [196, 600], [220, 600], [196, 600],
    [131, 600], [165, 600], [196, 600], [131, 600],
  ];

  function playNote(freq, dur, type, vol, filterFreq) {
    if (freq === 0) return null;
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    const flt = ac.createBiquadFilter();
    osc.type  = type;
    osc.frequency.value = freq;
    flt.type = 'lowpass';
    flt.frequency.value = filterFreq || 2500;
    flt.Q.value = 1;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur / 1000 - 0.01);
    osc.connect(flt);
    flt.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(ac.currentTime + dur / 1000);
    bonusMelodyOscs.push(osc);
    return osc;
  }

  let mi = 0;
  function nextMelody() {
    if (mi >= melody.length) { mi = 0; }
    const [f, d] = melody[mi++];
    playNote(f, d, 'triangle', 0.14, 3000);
    bonusMelodyTimeout = setTimeout(nextMelody, d);
  }

  let bi = 0;
  function nextBass() {
    if (bi >= bass.length) { bi = 0; }
    const [f, d] = bass[bi++];
    playNote(f, d, 'sine', 0.10, 600);
    bonusBassTimeout = setTimeout(nextBass, d);
  }

  nextMelody();
  nextBass();
}

export function stopBonusMelody() {
  if (bonusMelodyTimeout) { clearTimeout(bonusMelodyTimeout); bonusMelodyTimeout = null; }
  if (bonusBassTimeout)   { clearTimeout(bonusBassTimeout);   bonusBassTimeout = null; }
  for (const osc of bonusMelodyOscs) { try { osc.stop(); } catch(_){} }
  bonusMelodyOscs = [];
}

// Münze einsammeln (Bling!)
export function playBonusCoin() {
  const ac = getCtx();
  const t  = ac.currentTime;

  synth({
    freq: 988, type: 'sine', dur: 0.08, vol: 0.16,
    attack: 0.002, release: 0.03, startTime: t
  });
  synth({
    freq: 1319, type: 'sine', dur: 0.18, vol: 0.14,
    attack: 0.002, decay: 0.06, sustain: 0.4, release: 0.06,
    startTime: t + 0.04
  });
  // Shimmer
  synth({
    freq: 2638, type: 'sine', dur: 0.1, vol: 0.04,
    attack: 0.002, release: 0.04, startTime: t + 0.06
  });
}

// Sprung
export function playBonusJump() {
  const ac  = getCtx();
  const t   = ac.currentTime;
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  const flt = ac.createBiquadFilter();
  osc.type  = 'triangle';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(550, t + 0.1);
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.18);
  flt.type = 'lowpass';
  flt.frequency.value = 2000;
  flt.Q.value = 2;
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(flt); flt.connect(g); g.connect(masterGain);
  osc.start(t); osc.stop(t + 0.22);
}

// Geist/Goomba platttreten
export function playBonusStomp() {
  const ac = getCtx();
  const t  = ac.currentTime;

  // Impact
  synth({
    freq: 300, type: 'triangle', dur: 0.12, vol: 0.2,
    attack: 0.003, release: 0.05,
    filterType: 'lowpass', filterFreq: 600, filterQ: 3, filterEnv: -400
  });
  // Noise-Punch
  noiseBurst({ dur: 0.05, vol: 0.1, filterFreq: 2000, filterQ: 2, startTime: t });
  // Sub
  synth({
    freq: 80, type: 'sine', dur: 0.15, vol: 0.12,
    attack: 0.003, release: 0.06, startTime: t
  });
}

// ?-Block treffen
export function playBonusBlock() {
  const ac = getCtx();
  const t  = ac.currentTime;

  synth({
    freq: 523, type: 'triangle', dur: 0.06, vol: 0.18,
    attack: 0.002, release: 0.02, startTime: t,
    filterType: 'lowpass', filterFreq: 3000, filterQ: 2
  });
  synth({
    freq: 784, type: 'sine', dur: 0.12, vol: 0.15,
    attack: 0.002, decay: 0.04, sustain: 0.4, release: 0.04,
    startTime: t + 0.04
  });
  noiseBurst({ dur: 0.03, vol: 0.05, filterFreq: 5000, filterQ: 1, startTime: t });
}

// Tod im Bonusspiel
export function playBonusDeath() {
  stopBonusMelody();
  const ac = getCtx();
  const t  = ac.currentTime;

  // Absteigender Sweep
  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(500, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.7);

  const flt = ac.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.setValueAtTime(2000, t);
  flt.frequency.exponentialRampToValueAtTime(150, t + 0.6);

  const g = ac.createGain();
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

  osc.connect(flt); flt.connect(g); g.connect(masterGain);
  osc.start(t); osc.stop(t + 0.8);
}

// Gewonnen-Fanfare
export function playBonusWin() {
  stopBonusMelody();
  const ac = getCtx();
  const t  = ac.currentTime;

  const notes = [
    [523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.18],
    [0, 0.05], [880, 0.1], [1047, 0.35],
  ];
  let time = t;
  for (const [f, d] of notes) {
    if (f > 0) {
      synth({
        freq: f, type: 'triangle', dur: d, vol: 0.2,
        attack: 0.005, decay: d * 0.3, sustain: 0.5, release: d * 0.2,
        startTime: time,
        filterType: 'lowpass', filterFreq: 4000, filterQ: 1
      });
      // Harmonic layer
      synth({
        freq: f * 2, type: 'sine', dur: d * 0.7, vol: 0.05,
        attack: 0.005, release: d * 0.3, startTime: time
      });
    }
    time += d;
  }
}

// ── Frucht erscheint (Bling) ─────────────────────────────
export function playFruitSpawn() {
  const ac = getCtx();
  const t  = ac.currentTime;

  synth({
    freq: 660, type: 'sine', dur: 0.08, vol: 0.14,
    attack: 0.003, release: 0.03, startTime: t
  });
  synth({
    freq: 880, type: 'sine', dur: 0.15, vol: 0.12,
    attack: 0.003, decay: 0.05, sustain: 0.4, release: 0.05,
    startTime: t + 0.05
  });
  synth({
    freq: 1760, type: 'sine', dur: 0.1, vol: 0.04,
    attack: 0.003, release: 0.04, startTime: t + 0.07
  });
}

// ── Pause (AudioContext suspend/resume) ───────────────────
export function suspendAudio() {
  if (actx && actx.state === 'running') actx.suspend();
}

export function resumeAudio() {
  if (actx && actx.state === 'suspended') actx.resume();
}

// ── Intro (voller Sound mit Detune + Filter) ──────────────
export function playIntro() {
  const ac = getCtx();
  const notes = [
    [494,0.1],[494,0.1],[494,0.1],[392,0.3],
    [494,0.1],[0,0.1],[587,0.4],[0,0.2],[392,0.3],
  ];
  let t = ac.currentTime;
  for (const [f, dur] of notes) {
    if (f > 0) {
      // Hauptstimme
      synth({
        freq: f, type: 'triangle', dur, vol: 0.22,
        attack: 0.008, decay: dur * 0.3, sustain: 0.5, release: dur * 0.2,
        detune: 4, startTime: t,
        filterType: 'lowpass', filterFreq: 3000, filterQ: 1.5
      });
      // Leichter Chorus
      synth({
        freq: f, type: 'sine', dur: dur * 0.8, vol: 0.06,
        attack: 0.01, release: dur * 0.3,
        detune: -6, startTime: t
      });
    }
    t += dur;
  }
}
