// PFOTENFAUST – Chiptune-Audio (WebAudio, keine Samples)
'use strict';
const AU = (() => {
  let ac = null, master = null, muted = false, cur = null, timer = null, step = 0, nextT = 0, song = null, noiseBuf = null;
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const hz = n => { const m = /^([a-g])(#?)(\d)$/.exec(n); if (!m) return 0; return 440 * Math.pow(2, (NOTE[m[1]] + (m[2] ? 1 : 0) + (+m[3] - 4) * 12 - 9) / 12); };
  const bars = a => a.map(b => { const t = b.split(' '); while (t.length < 16) t.push('-'); return t.slice(0, 16); }).flat();
  const SONGS = {
    title: { bpm: 118, roots: ['c2', 'a1', 'f2', 'g2'], lead: bars([
      'e5 - g5 - c6 - - g5 - e5 - g5 - - a5 -', 'e5 - a5 - c6 - - a5 - e5 - a5 - - g5 -',
      'f5 - a5 - c6 - - a5 - f5 - a5 c6 - d6 -', 'd6 - b5 - g5 - - b5 - d6 - b5 - g5 - -']) },
    a: { bpm: 150, roots: ['a2', 'a2', 'f2', 'g2', 'a2', 'c3', 'f2', 'e2'], lead: bars([
      'a4 - a4 c5 - a4 - e5 - d5 - c5 a4 - g4 -', 'a4 - a4 c5 - a4 - g5 - e5 - d5 c5 - d5 -',
      'f4 - f4 a4 - f4 - c5 - a4 - c5 d5 - c5 -', 'g4 - g4 b4 - d5 - g5 - e5 - d5 b4 - g4 -',
      'e5 - e5 d5 - c5 - a4 - c5 - d5 e5 - - -', 'g5 - g5 e5 - d5 - c5 - d5 - e5 d5 - - -',
      'f5 - f5 e5 - d5 - c5 - a4 - c5 d5 - c5 -', 'e5 - d5 - b4 - g#4 - e4 - g#4 - b4 - e5 -']) },
    b: { bpm: 138, roots: ['d2', 'd2', 'a#1', 'c2', 'd2', 'f2', 'g2', 'a2'], lead: bars([
      'd5 - - a4 d5 - f5 - e5 - d5 - c5 - a4 -', 'd5 - - a4 d5 - f5 - g5 - f5 - e5 - c5 -',
      'a#4 - - f4 a#4 - d5 - c5 - a#4 - a4 - f4 -', 'c5 - - g4 c5 - e5 - g5 - e5 - c5 - e5 -',
      'd5 f5 a5 - g5 - f5 - e5 - d5 - e5 - f5 -', 'f5 a5 c6 - a5 - g5 - f5 - e5 - f5 - g5 -',
      'g5 - d5 - g5 - a#5 - a5 - g5 - f5 - d5 -', 'a5 - e5 - c#5 - e5 - a5 - g5 - e5 - c#5 -']) },
    boss: { bpm: 172, roots: ['e2', 'e2', 'c2', 'd2'], lead: bars([
      'e5 e5 - e5 g5 - e5 - b4 - e5 - g5 - a5 -', 'b5 - a5 - g5 - e5 - g5 a5 g5 - e5 - d5 -',
      'c5 c5 - c5 e5 - c5 - g4 - c5 - e5 - g5 -', 'f#5 - d5 - a4 - d5 - f#5 - a5 - f#5 - d#5 -']) },
    win: { bpm: 150, once: 1, roots: ['c3', 'f2'], lead: bars(['c5 e5 g5 c6 - g5 c6 - e6 - - - - - - -', '- - - - - - - - - - - - - - - -']) },
    over: { bpm: 100, once: 1, roots: ['a1', 'a1'], lead: bars(['e5 - d5 - c5 - b4 - a4 - - - - - - -', '- - - - - - - - - - - - - - - -']) }
  };
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (cur) { const c = cur; cur = null; music(c); }
    } catch (e) { ac = null; }
  }
  function tone(f0, f1, dur, type, vol, t) {
    if (!ac) return; t = t || ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'square';
    o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, fq, t) {
    if (!ac) return; t = t || ac.currentTime;
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); s.buffer = noiseBuf;
    f.type = fq < 0 ? 'highpass' : 'lowpass'; f.frequency.value = Math.abs(fq || 3000);
    g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  const SFX = {
    jump: () => tone(280, 620, 0.12, 'square', 0.08),
    swish: () => noise(0.07, 0.08, -2500),
    hit: () => { noise(0.09, 0.22, 1800); tone(190, 60, 0.1, 'square', 0.12); },
    big: () => { noise(0.2, 0.3, 900); tone(140, 40, 0.22, 'sawtooth', 0.16); },
    hurt: () => tone(420, 110, 0.25, 'sawtooth', 0.14),
    pick: () => { const t = ac ? ac.currentTime : 0; tone(880, 880, 0.07, 'square', 0.09, t); tone(1320, 1320, 0.12, 'square', 0.09, t + 0.07); },
    thr: () => tone(720, 320, 0.09, 'square', 0.07),
    bark: () => { const t = ac ? ac.currentTime : 0; for (let i = 0; i < 2; i++) { tone(260, 90, 0.16, 'sawtooth', 0.25, t + i * 0.2); noise(0.14, 0.2, 1200, t + i * 0.2); } },
    ko: () => { const t = ac ? ac.currentTime : 0; [520, 440, 350, 260, 180].forEach((f, i) => tone(f, f * 0.9, 0.12, 'square', 0.12, t + i * 0.11)); },
    boom: () => { noise(0.45, 0.35, 500); tone(110, 30, 0.4, 'sawtooth', 0.2); },
    sel: () => tone(660, 660, 0.04, 'square', 0.07),
    ok: () => { const t = ac ? ac.currentTime : 0; tone(660, 660, 0.06, 'square', 0.09, t); tone(990, 990, 0.1, 'square', 0.09, t + 0.06); },
    laser: () => tone(1500, 180, 0.3, 'sawtooth', 0.12),
    miau: () => { tone(700, 1100, 0.1, 'triangle', 0.14); tone(1100, 500, 0.22, 'triangle', 0.14, ac ? ac.currentTime + 0.1 : 0); },
    tele: () => tone(200, 1400, 0.2, 'triangle', 0.1),
    txt: () => tone(980, 980, 0.015, 'square', 0.03)
  };
  function sfx(n) { if (ac && !muted && SFX[n]) try { SFX[n](); } catch (e) { } }
  function tick() {
    if (!ac || !song) return;
    const sp = 60 / song.bpm / 4;
    while (nextT < ac.currentTime + 0.12) {
      const n = song.lead.length, s = step % n, bar = Math.floor(s / 16) % song.roots.length, q = s % 16, t = nextT;
      if (song.once && step >= n) { song = null; return; }
      const l = song.lead[s]; if (l !== '-') { const f = hz(l); tone(f, f, sp * 1.7, 'square', 0.055, t); tone(f * 1.005, f * 1.005, sp * 1.7, 'square', 0.025, t); }
      const rf = hz(song.roots[bar]);
      if (q % 2 === 0) tone(rf * (q % 4 === 2 ? 2 : 1), rf * (q % 4 === 2 ? 2 : 1), sp * 1.6, 'triangle', 0.16, t);
      if (!song.once) { if (q % 8 === 0) tone(120, 40, 0.1, 'sine', 0.25, t); if (q % 8 === 4) noise(0.07, 0.09, 4000, t); else if (q % 2 === 0) noise(0.02, 0.03, -6000, t); }
      nextT += sp; step++;
    }
  }
  function music(n) {
    if (cur === n && song) return; cur = n; song = null;
    if (!ac || !n) return;
    song = SONGS[n]; step = 0; nextT = ac.currentTime + 0.06;
    if (!timer) timer = setInterval(tick, 30);
  }
  function setMute(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; }
  return { init, sfx, music, setMute, get muted() { return muted; } };
})();
