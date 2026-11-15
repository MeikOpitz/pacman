// KAP FLIMMER – Chiptune-Audio im Handheld-Stil (WebAudio, keine Samples)
// Vier Stimmen wie beim Vorbild-Soundchip: 2x Puls (Melodie + Arpeggio), 1x Wave (Bass), 1x Rauschen (Drums)
'use strict';
const AU = (() => {
  let ac = null, master = null, muted = false, cur = null, timer = null, step = 0, nextT = 0, song = null, noiseBuf = null, pulse = {}, wave = null, silent = null;
  const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const semi = n => { const m = /^([a-g])(#?)(\d)$/.exec(n); return m ? SEMI[m[1]] + (m[2] ? 1 : 0) + (+m[3] - 4) * 12 - 9 : null; };
  const fq = s => 440 * Math.pow(2, s / 12);
  const bars = a => a.map(b => { const t = b.split(' '); while (t.length < 16) t.push('-'); return t.slice(0, 16); }).flat();
  // Akkord "Am", "F", "A#" -> [Grundton-Halbton (Oktave 2), Moll?]
  const chord = c => { const m = /^([A-G]#?)(m?)$/.exec(c); return { r: semi(m[1].toLowerCase() + '2'), minor: !!m[2] }; };
  const S = (bpm, chords, lead, o) => Object.assign({ bpm, chords: chords.split(' ').map(chord), lead: bars(lead) }, o || {});
  const SONGS = {
    title: S(112, 'Dm C Dm A Dm C F A', [
      'd5 ~ a4 ~ d5 ~ e5 ~ f5 ~ ~ e5 d5 ~ ~ -', 'e5 ~ c5 ~ e5 ~ g5 ~ e5 ~ ~ d5 c5 ~ ~ -',
      'd5 ~ a4 ~ d5 ~ e5 ~ f5 ~ g5 ~ a5 ~ ~ -', 'a5 ~ g5 ~ e5 ~ c#5 ~ e5 ~ ~ ~ ~ ~ - -',
      'a5 ~ ~ f5 ~ ~ d5 ~ a5 ~ g5 ~ f5 ~ e5 ~', 'g5 ~ ~ e5 ~ ~ c5 ~ g5 ~ f5 ~ e5 ~ d5 ~',
      'f5 ~ a5 ~ c6 ~ a5 ~ f5 ~ e5 ~ d5 ~ e5 ~', 'e5 ~ ~ ~ c#5 ~ ~ ~ a4 ~ c#5 ~ e5 ~ ~ -']),
    n0: S(126, 'Am F C G Am F G E', [
      'a4 - c5 e5 - c5 a4 - e5 ~ d5 - c5 - b4 -', 'a4 - c5 f5 - c5 a4 - f5 ~ e5 - c5 - a4 -',
      'g4 - c5 e5 - c5 g4 - g5 ~ e5 - d5 - c5 -', 'g4 - b4 d5 - b4 g4 - d5 ~ b4 - d5 - g5 -',
      'a5 ~ ~ e5 ~ ~ c5 ~ a5 ~ g5 ~ e5 ~ c5 ~', 'a5 ~ ~ f5 ~ ~ c5 ~ f5 ~ g5 ~ a5 ~ c6 ~',
      'b5 ~ ~ g5 ~ ~ d5 ~ g5 ~ a5 ~ b5 ~ d6 ~', 'e6 ~ ~ b5 ~ ~ g#5 ~ e5 ~ g#5 ~ b5 ~ ~ -']),
    n1: S(148, 'Em Em C D Em G Am B', [
      'e5 - e5 g5 - e5 - b5 ~ a5 - g5 e5 - d5 -', 'e5 - e5 g5 - e5 - d6 ~ b5 - a5 g5 - a5 -',
      'c5 - c5 e5 - c5 - g5 ~ e5 - g5 a5 - g5 -', 'd5 - d5 f#5 - a5 - d6 ~ b5 - a5 f#5 - d5 -',
      'b5 ~ b5 a5 - g5 - e5 ~ g5 - a5 b5 ~ ~ -', 'd6 ~ d6 b5 - a5 - g5 ~ a5 - b5 a5 ~ ~ -',
      'c6 ~ c6 b5 - a5 - g5 ~ e5 - g5 a5 - g5 -', 'b5 - a5 - f#5 - d#5 - b4 - d#5 - f#5 - b5 ~']),
    n2: S(138, 'Cm Cm G# G Cm D# Fm G', [
      'c5 - g4 c5 d#5 - c5 - g5 - f5 - d#5 - d5 -', 'c5 - g4 c5 d#5 - g5 - c6 - a#5 - g5 - d#5 -',
      'g#4 - d#5 g#5 - d#5 - c5 d#5 - g#5 - c6 - g#5 -', 'g4 - d5 g5 - d5 - b4 d5 - g5 - b5 - d6 -',
      'c6 ~ ~ g5 ~ ~ d#5 ~ c6 ~ a#5 ~ g5 ~ d#5 ~', 'a#5 ~ ~ g5 ~ ~ d#5 ~ a#5 ~ g5 ~ a#5 ~ d#6 ~',
      'c6 ~ g#5 ~ f5 ~ g#5 ~ c6 ~ d6 ~ c6 ~ g#5 ~', 'b5 ~ ~ ~ d6 ~ ~ ~ g5 ~ b5 ~ d6 ~ g6 ~']),
    n3: S(132, 'F C Dm A# F C A# C', [
      'f5 ~ a5 c6 ~ ~ a5 ~ f6 ~ ~ e6 ~ c6 ~ ~', 'e5 ~ g5 c6 ~ ~ g5 ~ e6 ~ ~ d6 ~ c6 ~ ~',
      'd5 ~ f5 a5 ~ ~ f5 ~ d6 ~ ~ c6 ~ a5 ~ ~', 'a#5 ~ d6 f6 ~ d6 ~ a#5 c6 ~ d6 ~ e6 ~ g6 ~',
      'a6 ~ ~ f6 ~ ~ c6 ~ a6 ~ g6 ~ f6 ~ c6 ~', 'g6 ~ ~ e6 ~ ~ c6 ~ g6 ~ f6 ~ e6 ~ c6 ~',
      'f6 ~ d6 ~ a#5 ~ d6 ~ f6 ~ g6 ~ f6 ~ d6 ~', 'e6 ~ ~ ~ g6 ~ ~ ~ c6 ~ d6 ~ e6 ~ g6 ~']),
    boss: S(170, 'Dm Dm A# C Dm Dm Gm A', [
      'd5 d5 - d5 f5 - d5 - a4 - d5 - f5 - g5 -', 'a5 ~ g5 - f5 - d5 - f5 g5 f5 - d5 - c5 -',
      'a#4 a#4 - a#4 d5 - a#4 - f4 - a#4 - d5 - f5 -', 'e5 - c5 - g4 - c5 - e5 - g5 - e5 - c5 -',
      'd6 ~ ~ a5 ~ ~ f5 ~ d6 ~ c6 ~ a5 ~ f5 ~', 'd6 ~ ~ a5 ~ ~ f5 ~ g5 ~ a5 ~ c6 ~ d6 ~',
      'a#5 ~ ~ g5 ~ ~ d5 ~ a#5 ~ a5 ~ g5 ~ d5 ~', 'a5 - c#6 - e6 - c#6 - a5 - g5 - e5 - c#5 -'], { arp16: 1 }),
    win: S(150, 'C F', ['g5 c6 e6 g6 ~ e6 g6 ~ c7 ~ ~ ~ ~ ~ - -', '- - - - - - - - - - - - - - - -'], { once: 1 }),
    over: S(92, 'Dm Dm', ['a5 ~ f5 ~ d5 ~ c5 ~ d5 ~ ~ ~ ~ ~ - -', '- - - - - - - - - - - - - - - -'], { once: 1 })
  };
  function mkPulse(duty) { // Pulswelle mit Tastverhältnis wie beim Handheld-Soundchip
    const n = 48, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    return ac.createPeriodicWave(re, im);
  }
  function unlockIOS() { // iOS: Stummschalter würde WebAudio sonst stumm lassen
    try { if (navigator.audioSession) { navigator.audioSession.type = 'playback'; return; } } catch (e) { }
    if (!/iP(hone|ad|od)/.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent))) return;
    try {
      if (!silent) {
        const n = 2000, b = new Uint8Array(44 + n), dv = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
        w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
        dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); w(36, 'data'); dv.setUint32(40, n, true); b.fill(128, 44);
        let s = ''; b.forEach(c => s += String.fromCharCode(c));
        silent = new Audio('data:audio/wav;base64,' + btoa(s)); silent.loop = true; silent.setAttribute('playsinline', '');
      }
      silent.play().catch(() => { });
    } catch (e) { }
  }
  function init() {
    if (ac) { if (ac.state !== 'running') { ac.resume().catch(() => { }); unlockIOS(); } return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 6; comp.connect(ac.destination);
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(comp);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      pulse = { 12: mkPulse(0.125), 25: mkPulse(0.25), 50: mkPulse(0.5) };
      const re = new Float32Array(8), im = new Float32Array(8); im[1] = 1; im[3] = 0.3; im[5] = 0.12; wave = ac.createPeriodicWave(re, im);
      unlockIOS(); if (ac.state !== 'running') ac.resume().catch(() => { });
      if (cur) { const c = cur; cur = null; music(c); }
    } catch (e) { ac = null; }
  }
  // Stimme: w = 12/25/50 (Puls), 'wave' (Bass) oder Oszillator-Typ
  function tone(f0, f1, dur, w, vol, t, vib) {
    if (!ac) return; t = t || ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    if (pulse[w]) o.setPeriodicWave(pulse[w]); else if (w === 'wave') o.setPeriodicWave(wave); else o.type = w || 'square';
    o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (vib && dur > 0.2) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 6; lg.gain.value = f0 * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.12); l.stop(t + dur); }
    vol = vol || 0.12; g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol * 0.7, t + Math.min(0.04, dur * 0.3)); g.gain.linearRampToValueAtTime(vol * 0.45, t + dur * 0.9); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, f, t) {
    if (!ac) return; t = t || ac.currentTime;
    const s = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter(); s.buffer = noiseBuf;
    fl.type = f < 0 ? 'highpass' : 'lowpass'; fl.frequency.value = Math.abs(f || 3000);
    g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  const now = () => ac ? ac.currentTime : 0;
  const SFX = {
    flip: () => { noise(0.025, 0.12, 2200); tone(170, 110, 0.05, 50, 0.1); },
    bump: () => { noise(0.05, 0.16, 2600); tone(540, 240, 0.09, 50, 0.13); },
    sling: () => { noise(0.03, 0.1, -3000); tone(300, 760, 0.07, 25, 0.11); },
    target: () => { const t = now(); tone(880, 880, 0.05, 50, 0.1, t); tone(660, 660, 0.09, 50, 0.1, t + 0.05); },
    lane: () => tone(1175, 1175, 0.09, 25, 0.09),
    lamp: () => { const t = now(); [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, f, 0.1, 25, 0.11, t + i * 0.06)); },
    spin: () => tone(1480, 1480, 0.025, 12, 0.05),
    launch: () => { noise(0.18, 0.14, -1800); tone(160, 900, 0.22, 25, 0.11); },
    drain: () => { const t = now(); [392, 330, 262, 196, 131].forEach((f, i) => tone(f, f * 0.94, 0.14, 25, 0.13, t + i * 0.12)); },
    save: () => { const t = now(); tone(392, 392, 0.07, 50, 0.1, t); tone(587, 587, 0.07, 50, 0.1, t + 0.07); tone(784, 784, 0.16, 50, 0.1, t + 0.14); },
    hole: () => { const t = now(); for (let i = 0; i < 6; i++) tone(700 - i * 80, 500 - i * 60, 0.07, 12, 0.09, t + i * 0.07); },
    award: () => { const t = now(); [659, 784, 988, 1319].forEach((f, i) => tone(f, f, 0.09, 50, 0.1, t + i * 0.08)); },
    horn: () => { const t = now(); tone(147, 147, 0.5, 'wave', 0.3, t); tone(110, 110, 0.55, 12, 0.1, t); tone(220, 220, 0.5, 'wave', 0.12, t + 0.02); },
    bosshit: () => { noise(0.14, 0.3, 1200); tone(210, 70, 0.16, 50, 0.18); },
    tent: () => { noise(0.05, 0.14, 1500); tone(260, 180, 0.07, 12, 0.12); },
    roar: () => { const t = now(); tone(95, 55, 0.7, 12, 0.3, t); noise(0.6, 0.22, 500, t); tone(140, 70, 0.5, 'wave', 0.2, t + 0.1); },
    boom: () => { noise(0.5, 0.4, 500); tone(110, 30, 0.45, 50, 0.22); },
    tilt: () => { const t = now(); for (let i = 0; i < 3; i++) tone(120, 100, 0.14, 12, 0.22, t + i * 0.17); },
    nudge: () => noise(0.08, 0.2, 600),
    clack: () => tone(1900, 1500, 0.02, 50, 0.07),
    wall: () => noise(0.015, 0.05, 1800),
    count: () => tone(1320, 1320, 0.03, 50, 0.06),
    extra: () => { const t = now(); [784, 988, 1175, 1568, 1175, 1568].forEach((f, i) => tone(f, f, 0.08, 25, 0.12, t + i * 0.08)); },
    sel: () => tone(660, 660, 0.05, 50, 0.09),
    ok: () => { const t = now(); tone(660, 660, 0.06, 50, 0.1, t); tone(990, 990, 0.12, 50, 0.1, t + 0.06); },
    txt: () => tone(980, 980, 0.02, 50, 0.03)
  };
  function sfx(n) { if (ac && !muted && SFX[n]) try { SFX[n](); } catch (e) { } }
  function tick() {
    if (!ac || !song || ac.state !== 'running') return;
    const sp = 60 / song.bpm / 4;
    if (nextT < ac.currentTime - 0.3) nextT = ac.currentTime + 0.05; // nach Pause/Tab-Wechsel neu aufsetzen
    while (nextT < ac.currentTime + 0.15) {
      const n = song.lead.length; if (song.once && step >= n) { song = null; return; }
      const s = step % n, bar = Math.floor(s / 16) % song.chords.length, q = s % 16, t = nextT, ch = song.chords[bar];
      // Puls 1: Melodie (mit gehaltenen Noten und Vibrato)
      const l = song.lead[s];
      if (l !== '-' && l !== '~') { let len = 1; while (len < 16 && song.lead[(s + len) % n] === '~' && s + len < n) len++; const f = fq(semi(l)); tone(f, f, sp * (len - 0.15), 25, 0.085, t, len > 2); tone(f, f, sp * (len - 0.15), 25, 0.022, t + sp * 1.5); }
      // Puls 2: Arpeggio über den Akkord
      const tri = [0, ch.minor ? 3 : 4, 7, 12];
      if (!song.once && (song.arp16 || q % 2 === 0)) { const k = song.arp16 ? q % 4 : [0, 1, 2, 1, 3, 2, 1, 2][q >> 1], f = fq(ch.r + 24 + tri[k]); tone(f, f, sp * (song.arp16 ? 0.9 : 1.7), 12, 0.035, t); }
      // Wave: Bass
      if (q % 2 === 0) { const k = q >> 1, off = song.once ? 0 : [0, 0, 12, 0, 7, 0, 12, 7][k], f = fq(ch.r + off); tone(f, f, sp * 1.75, 'wave', 0.24, t); }
      // Rauschen: Drums
      if (!song.once) { if (q % 8 === 0 || q === 10) tone(130, 38, 0.11, 'sine', 0.3, t); if (q % 8 === 4) noise(0.09, 0.13, 5000, t); else if (q % 2 === 0) noise(0.025, 0.04, -7000, t); if (q === 14 && bar % 4 === 3) noise(0.06, 0.1, 5000, t + sp); }
      nextT += sp; step++;
    }
  }
  function music(n) {
    if (cur === n && song) return; cur = n; song = null;
    if (!ac || !n || !SONGS[n]) return;
    song = SONGS[n]; step = 0; nextT = ac.currentTime + 0.08;
    if (!timer) timer = setInterval(tick, 25);
  }
  function setMute(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.8; }
  // Freischalten: Browser zählen nur Loslassen/Klick/Taste als Nutzergeste (Tippen-Beginn reicht nicht)
  for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) addEventListener(ev, init, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (ac) { if (document.hidden) ac.suspend(); else ac.resume().catch(() => { }); } });
  return { init, sfx, music, setMute, get muted() { return muted; }, get state() { return ac ? ac.state : 'none'; }, get _ac() { return ac; }, get _master() { return master; } };
})();
