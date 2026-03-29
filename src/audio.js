// audio.js – Web Audio API

let actx       = null;
let masterGain = null;
let volume     = (() => { try { const v = parseFloat(localStorage.getItem('pacman-vol')); return isNaN(v) ? 0.7 : v; } catch { return 0.7; } })();
let muted      = (() => { try { return localStorage.getItem('pacman-muted') === '1'; } catch { return false; } })();

function getCtx() {
  if (!actx) {
    actx       = new AudioContext();
    masterGain = actx.createGain();
    masterGain.gain.value = muted ? 0 : volume;
    masterGain.connect(actx.destination);
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

// ── Interne Hilfe ─────────────────────────────────────────
function beep(freq, dur, type = 'square', vol = 0.25) {
  const ac  = getCtx();
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  osc.type          = type;
  osc.frequency.value = freq;
  g.gain.value      = vol;
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  osc.connect(g);
  g.connect(masterGain);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

// ── Waka ─────────────────────────────────────────────────
let wakaFlip = false;
export function playWaka() {
  wakaFlip = !wakaFlip;
  beep(wakaFlip ? 440 : 280, 0.07, 'square', 0.18);
}

// ── Siren ─────────────────────────────────────────────────
let sirenOsc  = null;
let sirenLfo  = null;
let sirenGain = null;

export function startSiren(level = 1) {
  stopSiren();
  const ac  = getCtx();

  sirenGain = ac.createGain();
  sirenGain.gain.value = 0.07;
  sirenGain.connect(masterGain);

  sirenOsc = ac.createOscillator();
  sirenOsc.type = 'sawtooth';
  sirenOsc.frequency.value = 200 + level * 30;
  sirenOsc.connect(sirenGain);

  sirenLfo = ac.createOscillator();
  const lfoG = ac.createGain();
  lfoG.gain.value = 40;
  sirenLfo.frequency.value = 2 + level * 0.5;
  sirenLfo.connect(lfoG);
  lfoG.connect(sirenOsc.frequency);

  sirenLfo.start();
  sirenOsc.start();
}

export function stopSiren() {
  if (sirenGain) { sirenGain.disconnect(); sirenGain = null; }
  if (sirenOsc)  { try { sirenOsc.stop(); } catch(_){} sirenOsc = null; }
  if (sirenLfo)  { try { sirenLfo.stop(); } catch(_){} sirenLfo = null; }
}

// ── Frightened ────────────────────────────────────────────
let frightGain = null;
let frightOsc  = null;

export function startFrightened() {
  stopSiren();
  stopFrightened();
  const ac  = getCtx();

  frightGain = ac.createGain();
  frightGain.gain.value = 0.05;
  frightGain.connect(masterGain);

  frightOsc = ac.createOscillator();
  frightOsc.type = 'sine';
  frightOsc.frequency.value = 180;
  frightOsc.connect(frightGain);
  frightOsc.start();
}

export function stopFrightened() {
  if (frightGain) { frightGain.disconnect(); frightGain = null; }
  if (frightOsc)  { try { frightOsc.stop(); } catch(_){} frightOsc = null; }
}

// ── Geist fressen ─────────────────────────────────────────
export function playEatGhost() {
  [600, 800, 500].forEach((f, i) => beep(f, 0.06, 'square', 0.28));
}

// ── Tod ───────────────────────────────────────────────────
export function playDeath() {
  stopSiren();
  [480, 400, 320, 240, 180, 120, 80].forEach((f, i) => {
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = f;
    const t = ac.currentTime + i * 0.1;
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + 0.1);
  });
}

// ── Bonus-Spiel Sounds ────────────────────────────────────

let bonusMelodyTimeout = null;
let bonusBassTimeout   = null;
let bonusMelodyOscs    = [];

// Fröhliche Bonus-Melodie (eigene Komposition, Mario-inspiriert)
export function startBonusMelody() {
  stopBonusMelody();
  const ac = getCtx();

  // Melodie-Noten: [freq, dauer_ms]
  // Fröhlich, aufsteigend, eingängig – Dur-Tonleiter-basiert
  const melody = [
    // Phrase 1: aufsteigende Quinte
    [523, 150], [587, 150], [659, 150], [698, 150], [784, 300], [0, 100],
    [659, 150], [784, 300], [0, 100],
    // Phrase 2: springend
    [523, 150], [659, 150], [784, 150], [880, 300], [0, 100],
    [784, 150], [659, 150], [523, 300], [0, 150],
    // Phrase 3: Bridge
    [698, 150], [784, 150], [880, 200], [784, 150], [698, 150], [659, 300], [0, 100],
    // Phrase 4: Finale
    [523, 150], [659, 200], [784, 150], [1047, 400], [0, 200],
    [880, 150], [784, 150], [659, 150], [784, 400], [0, 300],
  ];

  // Bass-Begleitung: [freq, dauer_ms]
  const bass = [
    [131, 600], [131, 600], [165, 600], [165, 600],
    [175, 600], [175, 600], [131, 600], [131, 600],
    [175, 600], [196, 600], [220, 600], [196, 600],
    [131, 600], [165, 600], [196, 600], [131, 600],
  ];

  function playNote(freq, dur, type, vol) {
    if (freq === 0) return null;
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type  = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur / 1000 - 0.01);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(ac.currentTime + dur / 1000);
    bonusMelodyOscs.push(osc);
    return osc;
  }

  let mi = 0;
  function nextMelody() {
    if (mi >= melody.length) { mi = 0; } // Loop
    const [f, d] = melody[mi++];
    playNote(f, d, 'square', 0.14);
    bonusMelodyTimeout = setTimeout(nextMelody, d);
  }

  let bi = 0;
  function nextBass() {
    if (bi >= bass.length) { bi = 0; }
    const [f, d] = bass[bi++];
    playNote(f, d, 'triangle', 0.10);
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

// Münze einsammeln
export function playBonusCoin() {
  const ac = getCtx();
  // Aufsteigender Doppel-Ping (wie Mario-Münze)
  const notes = [[988, 0.06], [1319, 0.12]];
  let t = ac.currentTime;
  for (const [f, d] of notes) {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type  = 'square';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d - 0.005);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + d);
    t += d * 0.5;
  }
}

// Sprung
export function playBonusJump() {
  const ac  = getCtx();
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  osc.type  = 'square';
  osc.frequency.setValueAtTime(200, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.12);
  g.gain.setValueAtTime(0.13, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  osc.connect(g); g.connect(masterGain);
  osc.start(); osc.stop(ac.currentTime + 0.15);
}

// Geist/Goomba platttreten
export function playBonusStomp() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  osc.type  = 'square';
  osc.frequency.setValueAtTime(400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.15);
  g.gain.setValueAtTime(0.2, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  osc.connect(g); g.connect(masterGain);
  osc.start(); osc.stop(ac.currentTime + 0.18);
}

// ?-Block treffen
export function playBonusBlock() {
  const ac = getCtx();
  const notes = [[523, 0.04], [784, 0.08]];
  let t = ac.currentTime;
  for (const [f, d] of notes) {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type  = 'triangle';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d - 0.005);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + d);
    t += d;
  }
}

// Tod im Bonusspiel
export function playBonusDeath() {
  stopBonusMelody();
  const ac = getCtx();
  // Absteigend, traurig
  const notes = [392, 350, 311, 280, 233, 200, 175, 150];
  notes.forEach((f, i) => {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type  = 'square';
    osc.frequency.value = f;
    const t = ac.currentTime + i * 0.09;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + 0.09);
  });
}

// Gewonnen-Fanfare
export function playBonusWin() {
  stopBonusMelody();
  const ac = getCtx();
  const notes = [
    [523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.15],
    [0, 0.05], [880, 0.1], [1047, 0.3],
  ];
  let t = ac.currentTime;
  for (const [f, d] of notes) {
    if (f > 0) {
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type  = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d - 0.01);
      osc.connect(g); g.connect(masterGain);
      osc.start(t); osc.stop(t + d);
    }
    t += d;
  }
}

// ── Frucht erscheint ──────────────────────────────────────
export function playFruitSpawn() {
  const ac = getCtx();
  const notes = [[660, 0.06], [880, 0.10]];
  let t = ac.currentTime;
  for (const [f, d] of notes) {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type  = 'sine';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d - 0.005);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + d);
    t += d * 0.6;
  }
}

// ── Pause (AudioContext suspend/resume) ───────────────────
export function suspendAudio() {
  if (actx && actx.state === 'running') actx.suspend();
}

export function resumeAudio() {
  if (actx && actx.state === 'suspended') actx.resume();
}

// ── Intro ─────────────────────────────────────────────────
export function playIntro() {
  const ac = getCtx();
  const notes = [
    [494,0.1],[494,0.1],[494,0.1],[392,0.3],
    [494,0.1],[0,0.1],[587,0.4],[0,0.2],[392,0.3],
  ];
  let t = ac.currentTime;
  for (const [f, dur] of notes) {
    if (f > 0) {
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur - 0.01);
      osc.connect(g); g.connect(masterGain);
      osc.start(t); osc.stop(t + dur);
    }
    t += dur;
  }
}
