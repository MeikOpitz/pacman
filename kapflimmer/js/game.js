// KAP FLIMMER – Spiel: Regeln, Story, Bildschirme
'use strict';
const cv = document.getElementById('scr'), ctx = cv.getContext('2d'), img = ctx.createImageData(SW, SH), fb = Buf(SW, SH);
const NIGHT = [
  { name: 'NEBEL', need: 3, hp: 5, tent: 2, song: 'n0' },
  { name: 'STURM', need: 4, hp: 7, tent: 3, song: 'n1' },
  { name: 'KNUTS NACHT', need: 5, hp: 9, tent: 4, song: 'n2' },
  { name: 'FREISPIEL', need: 5, hp: 10, tent: 4, song: 'n3' }];
const STORY = {
  intro: [
    { pic: 'tower', l: ['KAP FLIMMER.', '', 'SEIT HUNDERT JAHREN WEIST DER', 'ALTE LEUCHTTURM DEN KUTTERN', 'DEN WEG IN DIE BUCHT.'] },
    { pic: 'tower', l: ['HEUTE NACHT IST DIE LAMPE', 'ERLOSCHEN. NEBEL ZIEHT AUF -', 'UND DIE GANZE FLOTTE IST', 'NOCH DRAUSSEN AUF SEE.'] },
    { pic: 'fenja', l: ['WÄRTERIN FENJA BLEIBT NUR', 'EINES: DIE GLÜHPERLE, DAS', 'HERZ DER LAMPE.', '', "'DANN SCHIESSEN WIR DAS LICHT", "EBEN VON HAND IN DIE NACHT!'"] },
    { pic: 'kraken', l: ['DOCH TIEF UNTER DEM TURM', 'KANN ES JEMAND GAR NICHT', 'LEIDEN, WENN ES HELL WIRD ...'] }],
  after0: [
    { pic: 'kraken', l: ['KNUT, DER KRAKE, TAUCHT AB.', 'DER NEBEL LICHTET SICH.', '', 'DIE ERSTEN KUTTER LIEGEN', 'SICHER IM HAFEN.'] },
    { pic: 'fenja', l: ["FENJA SCHAUT ZUM HORIZONT:", "'DAS WAR ERST DER ANFANG.", "DA BRAUT SICH WAS ZUSAMMEN.'"] }],
  after1: [
    { pic: 'tower', l: ['DER STURM ZIEHT WEITER.', 'DER TURM STEHT NOCH.', '', 'ABER DAS WASSER IN DER', 'BUCHT FÄRBT SICH DUNKEL ...'] },
    { pic: 'kraken', l: ['KNUT IST JETZT RICHTIG', 'SAUER. HEUTE NACHT HOLT ER', 'SICH DIE PERLE SELBST.'] }],
  after2: [
    { pic: 'kraken', l: ['KNUT BLINZELT INS LICHT.', 'DANN GÄHNT ER.', '', "'ICH WOLLTE DOCH BLOSS", "SCHLAFEN. ES IST SO HELL", "HIER OBEN!'"] },
    { pic: 'fenja', l: ['FENJA ÜBERLEGT KURZ. DANN', 'NÄHT SIE AUS ALTEM SEGELTUCH', 'EINEN RIESIGEN VORHANG', 'FÜR KNUTS HÖHLE.'] },
    { pic: 'tower', l: ['SEITDEM SCHLÄFT DER KRAKE', 'TIEF UND FEST. UND WENN DIE', 'LAMPE MAL FLACKERT, HÄLT ER', 'DIE PERLE MIT ACHT ARMEN WARM.'] },
    { pic: 'tower', l: ['MORGENGRAUEN ÜBER', 'KAP FLIMMER.', '', 'ALLE KUTTER SIND DAHEIM.', '', 'ENDE - DANKE FÜRS SPIELEN!'] }]
};

// ---------- Eingabe ----------
const key = {}, prev = {}, JP = {};
const KM = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down',
  k: 'a', x: 'a', ' ': 'a', j: 'b', z: 'b', y: 'b', l: 'c', c: 'c', Enter: 'start', p: 'start', Shift: 'select', m: 'mute' };
addEventListener('keydown', e => { const k = KM[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k) { key[k] = 1; e.preventDefault(); AU.init(); } });
addEventListener('keyup', e => { const k = KM[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k) key[k] = 0; });
function bindTouch() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k, on = e => { e.preventDefault(); key[k] = 1; el.classList.add('on'); AU.init(); }, off = e => { e.preventDefault(); key[k] = 0; el.classList.remove('on'); };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  });
  const dp = document.getElementById('dpad'); let pid = null;
  const set = e => { const r = dp.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5, dz = 0.13;
    key.left = x < -dz ? 1 : 0; key.right = x > dz ? 1 : 0; key.up = y < -dz * 1.6 ? 1 : 0; key.down = y > dz * 1.6 ? 1 : 0; };
  const clr = () => { key.left = key.right = key.up = key.down = 0; pid = null; };
  dp.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { dp.setPointerCapture(pid); } catch (x) { } set(e); AU.init(); });
  dp.addEventListener('pointermove', e => { if (e.pointerId === pid) { e.preventDefault(); set(e); } });
  dp.addEventListener('pointerup', clr); dp.addEventListener('pointercancel', clr);
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
}
function pollInput() { for (const k of ['left', 'right', 'up', 'down', 'a', 'b', 'c', 'start', 'select', 'mute']) { JP[k] = key[k] && !prev[k]; prev[k] = key[k]; } }
const buzz = n => { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) { } };

// ---------- Zustand ----------
const G = { scr: 'title', t: 0, score: 0, hi: 0, balls: 3, night: 0, boats: 0, mult: 1, lanes: [0, 0, 0], kick: true, save: 0, holeLit: false, lampT: 0, boss: null,
  tilt: false, heat: 0, bumps: 0, dmg: false, pause: false, cam: 152, shake: 0, msg: null, charge: 0, story: null, page: 0, after: null, spins: 0, won: false, tally: null, rec: false };
let balls = [], fx = [], pops = [], table = null, pal = null, titleBuf = null, TL = null, bankT = 0, holeT = 0, holeBall = null, autoT = 0, stillT = 0;
const spin = { a: 0, w: 0 }, ev = [];
try { const s = JSON.parse(localStorage.getItem('kapflimmer') || '{}'); G.hi = s.hi || 0; G.dmg = !!s.dmg; } catch (e) { }
function save() { try { localStorage.setItem('kapflimmer', JSON.stringify({ hi: G.hi, dmg: G.dmg })); } catch (e) { } }
const cfg = () => NIGHT[Math.min(G.night, 3)];
const need = () => cfg().need, bossHp = () => cfg().hp + Math.max(0, G.night - 3) * 2;
function setPal() { pal = makePal(G.scr === 'title' || G.scr === 'over' ? 0 : Math.min(G.night, 3), G.dmg); }
function go(s) { G.scr = s; G.t = 0; setPal(); }
function say(s, big) { G.msg = { s, t: big ? 150 : 100 }; }
function add(n, x, y) { if (G.tilt) return; n *= G.lampT > 0 ? 2 : 1; G.score += n; if (x !== undefined && pops.length < 8) pops.push({ x, y, s: String(n), t: 40 }); }
function spark(x, y, c, n) { for (let i = 0; i < (n || 5) && fx.length < 60; i++) { const a = Math.random() * 6.283, v = 0.6 + Math.random() * 1.4; fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 12 + Math.random() * 10 | 0, c }); } }

function newGame() { G.score = 0; G.balls = 3; G.night = 0; G.won = false; G.rec = false; startStory('intro', () => startNight()); AU.music('title'); }
function startStory(id, after) { G.story = STORY[id]; G.page = 0; G.after = after; go('story'); }
function startNight() { G.boats = 0; G.boss = null; TB.reset(); bankT = 0; go('card'); AU.music(cfg().song); resetBall(); }
function resetBall() { G.mult = 1; G.lanes = [0, 0, 0]; G.kick = true; G.holeLit = false; G.lampT = 0; G.tilt = false; G.heat = 0; G.bumps = 0; G.spins = 0; G.save = -1; balls = []; fx = []; pops = []; holeBall = null; serve(); }
function serve(auto) { balls.push({ x: 151.5, y: 270 - TB.BR, vx: 0, vy: 0, held: 0, pass: 0, lane: -1, cool: 0, skill: 1, gold: balls.length > 0 }); if (auto) autoT = 40; G.charge = 0; }
const inLane = b => b.x > 147 && b.y > 250 && Math.abs(b.vy) < 0.3;

// ---------- Spiel-Update ----------
function updatePlay() {
  if (JP.start) { G.pause = !G.pause; AU.sfx('sel'); }
  if (G.pause) return;
  const fl = TB.flippers, L = !G.tilt && (key.left || key.b), R = !G.tilt && (key.right || key.a);
  if (L && !fl[0].on || R && !fl[1].on) { AU.sfx('flip'); if (L && !fl[0].on) G.lanes.push(G.lanes.shift()); else G.lanes.unshift(G.lanes.pop()); }
  fl[0].on = L ? 1 : 0; fl[1].on = R ? 1 : 0;
  // Abschuss
  const lb = balls.find(inLane);
  if (lb) { if (autoT > 0) { if (--autoT === 0) launch(lb, 0.12 + Math.random() * 0.1); }
    else if (key.a || key.down) G.charge = Math.min(1, G.charge + 1 / 50);
    else if (G.charge > 0) launch(lb, G.charge);
    if (G.charge > 0) { lb.y = 270 + G.charge * 6 - TB.BR; lb.vy = 0; } }
  TB.floor.y0 = TB.floor.y1 = 270 + G.charge * 6;
  // Rütteln
  if ((JP.c || JP.up) && !G.tilt && balls.some(b => !b.held && !inLane(b))) { balls.forEach(b => { if (!b.held && !inLane(b)) { b.vy -= 1.1; b.vx += (Math.random() - 0.5) * 1.6; } });
    G.shake = 8; G.heat += 1; AU.sfx('nudge'); buzz(30); if (G.heat > 2.6) { G.tilt = true; G.save = 0; say('TILT!', 1); AU.sfx('tilt'); } }
  G.heat = Math.max(0, G.heat - 0.008);
  // Krake
  TB.dyn.length = 0; const B = G.boss;
  if (B) { B.t++; if (B.hitT > 0) B.hitT--;
    if (B.dead) { if (--B.dead <= 0) { G.boss = null; nightWon(); return; } if (B.dead % 6 === 0) spark(B.x + (Math.random() - 0.5) * 20, B.y + (Math.random() - 0.5) * 16, PK, 4); }
    else if (B.t > 70) { B.x = 75 + Math.sin(B.t * 0.017) * (6 + G.night * 2); TB.dyn.push({ x: B.x, y: B.y, r: 10, kick: 1.6, kind: 'boss', ref: 0 });
      B.tent.forEach((tn, i) => { const a = B.t * tn.sp + tn.ph, r = 24 + 6 * Math.sin(B.t * 0.04 + i * 2); tn.x = B.x + Math.cos(a) * r; tn.y = B.y + Math.sin(a) * r * 0.8; TB.dyn.push({ x: tn.x, y: tn.y, r: 3.2, kick: 1.2, kind: 'tent', ref: i }); }); } }
  ev.length = 0; TB.step(balls, ev);
  for (const e of ev) {
    if (e.t === 'bump') { const c = TB.bumpers[e.i]; c.t = 8; G.bumps++; add(100, c.x, c.y - 10); AU.sfx('bump'); spark(c.x, c.y, YL, 4); buzz(12); }
    else if (e.t === 'sling') { TB.slings[e.i].t = 8; add(50); AU.sfx('sling'); buzz(10); }
    else if (e.t === 'target') { const t = TB.targets[e.i]; if (!t.up) continue; t.up = false; add(500, t.x0 + 8, t.y0); AU.sfx('target'); spark(t.x0, t.y0, SA, 5);
      if (TB.targets.every(q => !q.up)) { bankT = 50; add(5000); if (!G.boss && G.boats < need()) boatHome(); else say('HAFEN VOLL! 5000'); } }
    else if (e.t === 'boss' && B && !B.dead && B.hitT <= 0 && e.v > 0.6) { B.hitT = 24; B.hp--; add(2000, B.x, B.y - 16); AU.sfx('bosshit'); G.shake = 6; spark(B.x, B.y, PK, 10); buzz(40);
      if (B.hp <= 0) { B.dead = 110; AU.sfx('boom'); AU.music(null); say('KNUT GIBT AUF!', 1); add(25000 * (G.night + 1)); G.save = 600; } }
    else if (e.t === 'tent') { AU.sfx('tent'); add(10); }
    else if (e.t === 'shot') { /* Flipperschuss */ }
    else if (e.t === 'clack') AU.sfx('clack');
    else if (e.t === 'wall' && e.v > 2.5) AU.sfx('wall');
  }
  TB.bumpers.forEach(c => c.t > 0 && c.t--); TB.slings.forEach(s => s.t > 0 && s.t--);
  if (bankT > 0 && --bankT === 0) TB.targets.forEach(t => t.up = true);
  // Sensoren
  for (const b of balls) { if (b.cool > 0) b.cool--; if (b.held) continue;
    if (G.save < 0 && b.x < 143) G.save = 60 * 14;
    // obere Bahnen
    if (b.y > 33 && b.y < 41 && b.x > 59.5 && b.x < 101.5) { const i = Math.min(2, Math.floor((b.x - 59.5) / 14));
      if (b.lane !== i) { b.lane = i; AU.sfx('lane'); if (b.skill) { add(2000, b.x, 30); say('VOLLTREFFER! 2000'); b.skill = 0; }
        if (!G.lanes[i]) { G.lanes[i] = 1; add(300, b.x, 30); if (G.lanes.every(v => v)) lampOn(); } else add(100); } } else b.lane = -1;
    if (b.skill && b.x < 143 && (b.y > 60 || b.vy > 1.5)) b.skill = 0;
    // Wetterhahn
    if (b.x < 17 && b.y > 112 && b.y < 132 && (b.py - 122) * (b.y - 122) <= 0 && b.py !== undefined) spin.w += b.vy * 0.5;
    // Einlauf-Bahnen: Strudel scharf
    if (b.y > 203 && b.y < 213 && (b.x < 28 && b.x > 18 || b.x > 121 && b.x < 131)) { if (!b.inl) { b.inl = 1; add(250); if (!G.holeLit) { G.holeLit = true; AU.sfx('lane'); say('STRUDEL OFFEN'); } } } else b.inl = 0;
    // Rettungsring in den Auslauf-Bahnen
    if (b.y > 238 && b.y < 262 && b.vy > 0 && (b.x < 16 || b.x > 133 && b.x < 144) && G.kick && !G.tilt) { G.kick = false; b.vy = -7.2; b.vx = b.x < 80 ? 0.12 : -0.12; b.y = 238; say('RETTUNGSRING!'); AU.sfx('save'); spark(b.x, b.y, RD, 8); }
    // Strudel
    if (!holeBall && !b.cool && Math.hypot(b.x - TB.HOLE.x, b.y - TB.HOLE.y) < 4.8) { holeBall = b; b.held = 1; b.x = TB.HOLE.x; b.y = TB.HOLE.y; b.vx = b.vy = 0; holeT = 55; AU.sfx('hole'); }
    b.py = b.y;
  }
  if (holeBall && --holeT <= 0) { const b = holeBall; holeBall = null; b.held = 0; b.cool = 40; b.x = TB.HOLE.x - 7; b.y = TB.HOLE.y + 8; b.vx = -1.5 - Math.random() * 0.5; b.vy = 1.4; holeAward(); }
  // Wetterhahn dreht
  if (Math.abs(spin.w) > 0.02) { const a0 = spin.a; spin.a += spin.w * 0.5; spin.w *= 0.972; if (Math.floor(a0 / Math.PI) !== Math.floor(spin.a / Math.PI)) { add(100); AU.sfx('spin'); if (++G.spins % 12 === 0 && !G.holeLit) { G.holeLit = true; say('STRUDEL OFFEN'); } } }
  // Hänger lösen
  const fb0 = balls[0]; if (fb0 && !fb0.held && !inLane(fb0) && Math.hypot(fb0.vx, fb0.vy) < 0.05 && fb0.y < 236) { if (++stillT > 120) { fb0.vx = (Math.random() - 0.5) * 2; fb0.vy = -1.5; stillT = 0; } } else stillT = 0;
  // Verlust
  for (let i = balls.length - 1; i >= 0; i--) if (balls[i].y > TB.TH + 5) balls.splice(i, 1);
  if (G.save > 0) G.save--; if (G.lampT > 0) G.lampT--;
  if (!balls.length) {
    if (G.save > 0 && !G.tilt) { G.save = Math.min(G.save, 240); serve(1); say('NOCHMAL GLÜCK GEHABT!'); AU.sfx('save'); }
    else if (G.boss && G.boss.dead) serve(1);
    else { AU.sfx('drain'); const bonus = G.tilt ? 0 : (G.boats * 1000 + G.bumps * 50) * G.mult; G.tally = { boats: G.boats * 1000, bumps: G.bumps * 50, mult: G.mult, bonus, shown: 0 }; go('tally'); }
  }
  // Kamera
  let ty = 152; if (balls.length) { const b = balls.reduce((m, q) => q.y > m.y ? q : m); ty = b.x > 147 && b.y > 200 ? 152 : b.y - 74 + Math.max(-14, Math.min(14, b.vy * 5)); }
  if (G.boss && G.boss.t < 70) ty = 96;
  ty = Math.max(0, Math.min(TB.TH - VH, ty)); G.cam += (ty - G.cam) * 0.16; if (G.shake > 0) G.shake--;
  for (let i = fx.length - 1; i >= 0; i--) { const p = fx[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.05; if (--p.t <= 0) fx.splice(i, 1); }
  for (let i = pops.length - 1; i >= 0; i--) { pops[i].y -= 0.35; if (--pops[i].t <= 0) pops.splice(i, 1); }
  if (G.msg && --G.msg.t <= 0) G.msg = null;
  if (G.score > G.hi) { G.hi = G.score; G.rec = true; }
}
function launch(b, c) { b.y = 270 - TB.BR; TB.floor.y0 = TB.floor.y1 = 270; b.vy = -(4.95 + 2.45 * c); b.skill = 1; G.charge = 0; AU.sfx('launch'); buzz(20); }
function lampOn() { G.lanes = [0, 0, 0]; G.mult = Math.min(5, G.mult + 1); G.lampT = 60 * 25; add(3000); say('LEUCHTFEUER! ALLES X2', 1); AU.sfx('lamp'); }
function boatHome() { G.boats++; AU.sfx('horn'); buzz(60);
  if (G.boats >= need()) { say('ALLE KUTTER DAHEIM!', 1); G.boss = { hp: bossHp(), max: bossHp(), x: 75, y: 160, t: 0, hitT: 0, dead: 0, tent: Array.from({ length: cfg().tent }, (_, i) => ({ sp: (0.022 + G.night * 0.003) * (i & 1 ? -1 : 1), ph: i * 1.7, x: 75, y: 160 })) };
    AU.music('boss'); setTimeout(() => { AU.sfx('roar'); if (G.scr === 'play' && G.boss) say('KNUT TAUCHT AUF!', 1); }, 900); }
  else say('KUTTER ' + G.boats + '/' + need() + ' DAHEIM!', 1); }
function holeAward() {
  if (!G.holeLit) { add(1000, TB.HOLE.x, TB.HOLE.y - 10); return; } G.holeLit = false;
  const o = ['pts', 'save']; if (!G.kick) o.push('ring', 'ring'); if (G.mult < 5) o.push('mult'); if (!G.boss && G.boats < need() - 1) o.push('boat'); if (balls.length < 2) o.push('multi', 'multi'); if (G.balls < 5 && Math.random() < 0.25) o.push('extra');
  const a = o[Math.random() * o.length | 0]; AU.sfx('award');
  if (a === 'pts') { add(7500); say('STRANDGUT: 7500'); }
  else if (a === 'save') { G.save = 60 * 20; say('STRANDGUT: SCHUTZNETZ'); }
  else if (a === 'ring') { G.kick = true; say('STRANDGUT: RETTUNGSRING'); }
  else if (a === 'mult') { G.mult++; say('STRANDGUT: BONUS X' + G.mult); }
  else if (a === 'boat') { say('STRANDGUT: EIN KUTTER!'); boatHome(); }
  else if (a === 'multi') { serve(1); G.save = Math.max(G.save, 60 * 8); say('ZWILLINGSPERLE!', 1); }
  else { G.balls++; say('EXTRA-PERLE!', 1); AU.sfx('extra'); }
}
function nightWon() { AU.music('win'); balls = []; G.balls = Math.min(5, G.balls + 1);
  const n = G.night; G.night++;
  if (n < 3) startStory('after' + Math.min(n, 2), () => { if (n === 2) G.won = true; startNight(); }); else startNight(); }

// ---------- Update: übrige Bildschirme ----------
function update() {
  pollInput(); G.t++;
  if (JP.select) { G.dmg = !G.dmg; save(); setPal(); AU.sfx('sel'); }
  if (JP.mute) AU.setMute(!AU.muted);
  const ok = JP.a || JP.start || JP.b;
  if (G.scr === 'title') { AU.music('title'); if (ok && G.t > 20) { AU.sfx('ok'); newGame(); } }
  else if (G.scr === 'story') { const p = G.story[G.page], len = p.l.join('').length;
    if (G.t * 0.6 < len && G.t % 4 === 0) AU.sfx('txt');
    if (ok) { if (G.t * 0.6 < len) G.t = 9999; else if (++G.page >= G.story.length) { AU.sfx('ok'); G.after(); } else { G.t = 0; AU.sfx('sel'); } } }
  else if (G.scr === 'card') { if ((ok && G.t > 30) || G.t > 200) { go('play'); G.cam = 152; } }
  else if (G.scr === 'play') updatePlay();
  else if (G.scr === 'tally') { const T = G.tally; if (T.shown < T.bonus) { T.shown = Math.min(T.bonus, T.shown + Math.max(50, Math.ceil(T.bonus / 60 / 50) * 50)); if (G.t % 3 === 0) AU.sfx('count'); }
    if ((ok && G.t > 25) || G.t > 260) { G.score += T.bonus; if (G.score > G.hi) { G.hi = G.score; G.rec = true; } G.balls--; save();
      if (G.balls <= 0) { go('over'); AU.music('over'); } else { resetBall(); go('play'); } } }
  else if (G.scr === 'over') { if (ok && G.t > 60) { go('title'); AU.sfx('ok'); } }
}

// ---------- Zeichnen ----------
function hud() {
  rect(fb, 0, 0, SW, HUD, K); rect(fb, 0, HUD - 1, SW, 1, DG);
  text(fb, String(G.score).padStart(7, '0'), 2, 1, WH);
  if (G.lampT > 0 && (G.lampT > 180 || (G.t >> 3) & 1)) text(fb, 'X2', 32, 1, YL);
  const B = G.boss;
  if (B && !B.dead) { text(fb, 'KNUT', 46, 1, PK); for (let i = 0; i < B.max; i++) rect(fb, 64 + i * 4, 2, 3, 3, i < B.hp ? PK : DG); }
  else for (let i = 0; i < need(); i++) blit(fb, i < G.boats ? SPR.boat : SPR.boatOff, 48 + i * 9, 0);
  for (let i = 0; i < G.balls; i++) blit(fb, SPR.pearl, SW - 6 - i * 5, 2);
  if (G.save > 0 && ((G.save > 120) || (G.t >> 2) & 1)) text(fb, 'NETZ', 112, 1, T3);
}
function drawPlay() {
  const cam = Math.round(G.cam + (G.shake > 0 ? ((G.t & 2) - 1) * Math.min(2, G.shake / 2) : 0)), oy = cam - HUD, t = G.t;
  const c0 = Math.max(0, Math.min(TB.TH - VH, cam));
  fb.d.set(table.d.subarray(c0 * SW, (c0 + VH) * SW), HUD * SW);
  const Y = y => Math.round(y - c0 + HUD);
  // Leuchtkegel
  lampGlow(fb, { x: LAMP.x, y: 0, lw: LAMP.lw, yL: Y(LAMP.yL), lampH: LAMP.lampH }, G.lampT > 0, t);
  if (G.lampT > 0) { const th = t * 0.035, lx = LAMP.x, ly = LAMP.y, fade = G.lampT < 120 && (t >> 2) & 1;
    if (!fade) for (let sy = HUD; sy < SH; sy++) { const wy = sy + c0 - HUD, dy = wy - ly; for (let x = 6; x < 147; x++) { if (!table.mask[wy * SW + x]) continue; const dx = x - lx; if (dx * dx + dy * dy < 30) continue;
      let a = (Math.atan2(dy, dx) - th) % Math.PI; if (a < 0) a += Math.PI; if (a > Math.PI / 2) a = Math.PI - a;
      if (a < 0.17 || (a < 0.26 && ((x + sy) & 1))) { const i = sy * SW + x; fb.d[i] = LIT[fb.d[i]]; } } } }
  // beleuchtete Einlagen
  TB.LANES.forEach((x, i) => { if (G.lanes[i]) { disc(fb, x, Y(37), 1.6, YL); px(fb, x, Y(37), WH); } });
  for (let i = 0; i < 4; i++) if (G.mult > i + 1) text(fb, (i + 2) + 'X', 57 + i * 10, Y(212), YL);
  if (G.kick) { blitC(fb, SPR.ring, 10.5, Y(214)); blitC(fb, SPR.ring, 138.5, Y(214)); }
  if (G.holeLit && (t >> 3) & 1) { disc(fb, 23, Y(208), 1.4, YL); disc(fb, 126.5, Y(208), 1.4, YL); }
  // Strudel
  blitC(fb, (G.holeLit ? SPR.holeLit : SPR.hole)[(t >> 3) & 3], TB.HOLE.x, Y(TB.HOLE.y));
  // Wetterhahn
  { const w = Math.cos(spin.a), hw = Math.round(Math.abs(w) * 4.5); rect(fb, 6, Y(122) - 1, 1, 3, K); rect(fb, 16, Y(122) - 1, 1, 3, K); rect(fb, 11 - hw, Y(122) - 1, hw * 2 + 1, 3, K); rect(fb, 11 - hw, Y(122), hw * 2 + 1, 1, w > 0 ? YL : OR); }
  // Ziele
  TB.targets.forEach((g, i) => { if (g.up) blitC(fb, SPR.tgt, (g.x0 + g.x1) / 2 + g.nx, Y((g.y0 + g.y1) / 2 + g.ny - 1)); });
  // Schleudern
  TB.slings.forEach((s, i) => { if (s.t > 0) { const sg = i ? -1 : 1, A = s.p[0], C = s.p[2]; line(fb, A[0] + sg * 3, Y(A[1] + 3), C[0] + sg * 2, Y(C[1] - 3), WH); line(fb, A[0] + sg * 2, Y(A[1] + 3), C[0] + sg, Y(C[1] - 3), YL); } });
  // Bojen
  TB.bumpers.forEach(c => blitC(fb, c.t > 0 ? SPR.buoyLit : SPR.buoy, c.x + 0.5, Y(c.y) + (c.t > 4 ? 1 : 0) + 0.5));
  // Krake
  const B = G.boss;
  if (B) { const rise = Math.min(1, B.t / 70), sink = B.dead ? B.dead / 110 : 1, vis = !B.dead || (B.dead >> 1) & 1;
    for (let r = 0; r < 3; r++) { const rr = 12 + r * 4 + ((t >> 3) % 4); for (let a = 0; a < 6.28; a += 0.2) if (((a * 5 + t / 4) | 0) & 1) px(fb, B.x + Math.cos(a) * rr, Y(B.y + 6 + Math.sin(a) * rr * 0.35), FO); }
    if (vis && rise >= 1) B.tent.forEach((tn, i) => { for (let k = 0; k <= 8; k++) { const u = k / 8, wob = Math.sin(t * 0.12 + i + u * 4) * 3 * Math.sin(u * 3.14), x = B.x + (tn.x - B.x) * u - (tn.y - B.y) / 26 * wob, y = B.y + (tn.y - B.y) * u + (tn.x - B.x) / 26 * wob;
      disc(fb, x, Y(y), k === 8 ? 3.4 : 2.6, K); } for (let k = 0; k <= 8; k++) { const u = k / 8, wob = Math.sin(t * 0.12 + i + u * 4) * 3 * Math.sin(u * 3.14), x = B.x + (tn.x - B.x) * u - (tn.y - B.y) / 26 * wob, y = B.y + (tn.y - B.y) * u + (tn.x - B.x) / 26 * wob;
      disc(fb, x, Y(y), k === 8 ? 2.4 : 1.6, k === 8 ? PK : PU); } });
    if (vis) { const s = B.hitT > 0 || B.dead ? SPR.krakenHit : SPR.kraken, yo = (1 - rise) * 14 + (1 - sink) * 12 + (B.hitT > 12 ? 1 : 0); blitC(fb, s, B.x + 0.5, Y(B.y + yo), 0, B.hitT > 18 ? WHITE : null); } }
  // Abschuss-Feder
  { const py = 270 + Math.round(G.charge * 6); rect(fb, 148, Y(py), 8, 2, GR); rect(fb, 148, Y(py) + 2, 8, 1, K); for (let y = py + 4; y < 282; y += 3) rect(fb, 150, Y(y), 4, 1, DG);
  }
  // Flipper
  TB.flippers.forEach(f => { const tp = TB.tip(f); capsule(fb, f.px, f.py, tp[0], tp[1], 3, 2, G.tilt ? GR : WH, G.tilt ? DG : GR, c0 - HUD); disc(fb, f.px, Y(f.py), 1.2, RD); });
  // Kugeln, Funken, Punkte
  balls.forEach(b => blitC(fb, b.gold ? SPR.ballG : SPR.ball, b.x + 0.5, Y(b.y) + 0.5));
  fx.forEach(p => px(fb, p.x, Y(p.y), p.t < 5 ? OR : p.c));
  pops.forEach(p => textCO(fb, p.s, p.x, Y(p.y), YL, 1));
  hud();
  if (G.charge > 0) { rect(fb, 100, 134, 44, 7, K); rect(fb, 102, 136, Math.round(40 * G.charge), 3, G.charge > 0.25 ? OR : YL); rect(fb, 102 + 6, 135, 1, 5, WH); }
  if (G.msg) { const s = G.msg.s, sc = s.length <= 12 ? 2 : 1, y = 58; if (G.msg.t > 8 || (t & 1)) textCO(fb, s, 80, y, (t >> 2) & 1 ? YL : WH, sc); }
  if (balls.some(inLane) && !G.charge && autoT <= 0 && (t >> 4) & 1) textCO(fb, 'A HALTEN: ABSCHUSS', 76, 100, WH, 1);
  if (G.pause) { dim(); frame(18, 44, 124, 56); textC(fb, 'PAUSE', 80, 50, YL, 2); textC(fb, 'LINKS / B: LINKER FLIPPER', 80, 66, WH); textC(fb, 'A: RECHTER FLIPPER', 80, 73, WH); textC(fb, 'HOCH / RING: RÜTTELN', 80, 80, WH); textC(fb, 'SELECT: FARBE', 80, 87, GR); }
}
function dim() { for (let i = HUD * SW; i < fb.d.length; i++) if (((i % SW) + ((i / SW) | 0)) & 1) fb.d[i] = K; }
function frame(x, y, w, h) { rect(fb, x - 2, y - 2, w + 4, h + 4, K); rect(fb, x - 1, y - 1, w + 2, h + 2, SA); rect(fb, x, y, w, h, N1); }
function buildTitle() {
  const b = Buf(SW, SH); let sd = 5; const rnd = () => (sd = (sd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) b.d[y * SW + x] = y < 100 ? N1 + Math.min(2, Math.floor(Math.max(0, (y - 20) / 40) + bay(x, y) * 0.999)) : T1 + Math.min(2, Math.floor((y - 100) / 34 + 0.12 * Math.sin(y * 0.7 + Math.sin(x * 0.08) * 2) + bay(x + (y >> 2), y >> 1) * 0.999));
  for (let i = 0; i < 46; i++) { const x = rnd() * 160 | 0, y = rnd() * 80 | 0, big = rnd() < 0.15; px(b, x, y, big ? WH : GR); if (big) { px(b, x - 1, y, GR); px(b, x + 1, y, GR); px(b, x, y - 1, GR); px(b, x, y + 1, GR); } }
  disc(b, 30, 24, 12, SA); disc(b, 28, 22, 9.5, WH); disc(b, 37, 19, 10.5, N1); cloud(b, 44, 86, 46, N3, DG); cloud(b, 2, 62, 28, N3, DG);
  for (let x = 0; x < 160; x++) if ((x * 7) % 5 < 3) px(b, x, 100, T3);
  for (let i = 0; i < 30; i++) { const x = rnd() * 150 | 0, y = 104 + rnd() * 38 | 0; rect(b, x, y, 2 + rnd() * 5 | 0, 1, rnd() < 0.3 ? FO : T3); }
  rock(b, 124, 106, 40, 40); TL = lighthouse(b, 124, 26, 1.3);
  for (let x = 84; x < 160; x++) if ((x * 3) % 4) px(b, x, 141 + ((x >> 2) & 1), FO);
  return b;
}
function logo(s, cx, y, sc) { const w = textW(s, sc), t = Buf(w + 2, 5 * sc + 3); text(t, s, 1, 1, YL, sc);
  for (let j = 0; j < t.h; j++) for (let i = 0; i < t.w; i++) if (t.d[j * t.w + i]) t.d[j * t.w + i] = j <= sc ? WH : j > 3 * sc ? OR : YL;
  const o = Buf(t.w + 2, t.h + 3); blit(o, t, 1, 1); outlineBuf(o, K); for (let j = o.h - 2; j > 0; j--) for (let i = 0; i < o.w; i++) if (!o.d[j * o.w + i] && o.d[(j - 1) * o.w + i] === K) o.d[j * o.w + i] = DB;
  blit(fb, o, Math.round(cx - o.w / 2), y); }
function beam(L, th, x0, x1, y0, y1) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const dx = x - L.x, dy = y - L.y; if (dx * dx + dy * dy < 40) continue; let a = (Math.atan2(dy, dx) - th) % Math.PI; if (a < 0) a += Math.PI; if (a > Math.PI / 2) a = Math.PI - a;
  if (a < 0.13 || (a < 0.2 && ((x + y) & 1))) { const i = y * SW + x; fb.d[i] = LIT[fb.d[i]]; } } }
function draw() {
  const t = G.t;
  if (G.scr === 'title' || G.scr === 'over') {
    fb.d.set(titleBuf.d); lampGlow(fb, TL, true, t); beam(TL, t * 0.02, 0, SW, 0, SH);
    if (G.scr === 'title') { logo('KAP', 50, 34, 3); logo('FLIMMER', 50, 54, 3); textCO(fb, 'DER FLIPPER VOM LEUCHTTURM', 54, 79, FO);
      if ((t >> 4) & 1) textCO(fb, 'START DRÜCKEN', 46, 112, WH); textCO(fb, 'REKORD ' + G.hi, 46, 126, YL); }
    else { logo('AUS', 50, 20, 3); textCO(fb, 'DIE PERLEN SIND VERSUNKEN', 54, 46, FO); textCO(fb, 'PUNKTE', 46, 62, GR); logo(String(G.score), 46, 70, 2);
      textCO(fb, G.rec ? 'NEUER REKORD!' : 'REKORD ' + G.hi, 46, 92, G.rec && (t >> 3) & 1 ? WH : YL); textCO(fb, 'NACHT ' + (G.night + 1) + (G.won ? ' - KNUT SCHLÄFT' : ''), 46, 104, FO); if (t > 60 && (t >> 4) & 1) textCO(fb, 'START', 46, 122, WH); }
  } else if (G.scr === 'story') {
    fb.d.fill(K); const p = G.story[G.page]; rect(fb, 6, 6, 148, 60, N1); for (let y = 6; y < 66; y++) for (let x = 6; x < 154; x++) fb.d[y * SW + x] = y < 44 ? N1 + (bay(x, y) < (y - 14) / 40 ? 1 : 0) : T1 + (bay(x + (y >> 2), y >> 1) < (y - 44) / 30 ? 1 : 0);
    for (let i = 0; i < 14; i++) px(fb, 10 + (i * 53) % 140, 9 + (i * 29) % 30, i % 4 ? GR : WH);
    if (p.pic === 'tower') { const L = lighthouse(fb, 80, 12, 0.72); lampGlow(fb, L, G.story !== STORY.intro || G.page === 0, t); if (G.story !== STORY.intro || G.page === 0) beam(L, t * 0.03, 7, 153, 7, 65); rect(fb, 60, 62, 40, 4, DG); rect(fb, 60, 61, 40, 1, K); }
    else if (p.pic === 'fenja') { rect(fb, 6, 52, 148, 14, DB); rect(fb, 6, 51, 148, 1, K); blitC(fb, SPR.fenja, 80, 43 + ((t >> 5) & 1)); blitC(fb, SPR.ballG, 104, 40 - ((t >> 4) & 1)); for (let a = 0; a < 6; a++) px(fb, 104 + Math.cos(a + t * 0.05) * 7, 40 + Math.sin(a + t * 0.05) * 7, YL); }
    else { for (let a = 0; a < 6.28; a += 0.2) if (((a * 5 + t / 5) | 0) & 1) px(fb, 80 + Math.cos(a) * 26, 54 + Math.sin(a) * 6, FO); blitC(fb, G.story === STORY.after2 ? SPR.krakenZ : SPR.kraken, 80, 44 + Math.sin(t * 0.05) * 2); if (G.story === STORY.after2) text(fb, 'Z', 96 + ((t >> 4) & 3), 30 - ((t >> 4) & 3), WH); }
    rect(fb, 5, 5, 150, 1, SA); rect(fb, 5, 66, 150, 1, SA); rect(fb, 5, 5, 1, 62, SA); rect(fb, 154, 5, 1, 62, SA);
    let n = Math.floor(t * 0.6), y = 76; for (const l of p.l) { if (n <= 0) break; text(fb, l.slice(0, n), 12, y, l.startsWith("'") || l.endsWith("'") ? YL : WH); n -= l.length; y += 9; }
    if (n > 0 && (t >> 4) & 1) text(fb, '>', 148, 134, YL);
    text(fb, (G.page + 1) + '/' + G.story.length, 8, 134, DG);
  } else if (G.scr === 'card') {
    fb.d.fill(K); for (let y = 30; y < 114; y++) for (let x = 0; x < SW; x++) fb.d[y * SW + x] = y < 80 ? N1 + (bay(x, y) < (y - 40) / 40 ? 1 : 0) : T1 + (bay(x, y >> 1) < (y - 80) / 34 ? 1 : 0);
    rect(fb, 0, 29, SW, 1, SA); rect(fb, 0, 114, SW, 1, SA);
    textCO(fb, G.night < 3 ? 'NACHT ' + (G.night + 1) : 'NACHT ' + (G.night + 1) + ' - FREISPIEL', 80, 40, FO); logo(cfg().name, 80, 50, cfg().name.length > 6 ? 2 : 3);
    for (let i = 0; i < need(); i++) blit(fb, SPR.boat, 80 - need() * 5 + i * 10, 84 + Math.round(Math.sin(t * 0.08 + i) * 1.5));
    textCO(fb, 'HOL ' + need() + ' KUTTER HEIM!', 80, 98, WH); if (G.t > 30 && (t >> 4) & 1) textC(fb, 'A', 80, 124, YL);
  } else if (G.scr === 'play') drawPlay();
  else if (G.scr === 'tally') { drawPlay(); dim(); hud(); frame(26, 36, 108, 76); const T = G.tally;
    textC(fb, G.tilt ? 'TILT - KEIN BONUS' : 'PERLE VERSUNKEN', 80, 42, G.tilt ? RD : YL);
    text(fb, 'KUTTER', 34, 56, WH); text(fb, String(T.boats).padStart(6, ' '), 102, 56, WH); text(fb, 'BOJEN', 34, 65, WH); text(fb, String(T.bumps).padStart(6, ' '), 102, 65, WH);
    text(fb, 'LEUCHTFEUER', 34, 74, WH); text(fb, ('X' + T.mult).padStart(6, ' '), 102, 74, YL); rect(fb, 34, 82, 92, 1, DG);
    text(fb, 'BONUS', 34, 87, FO); text(fb, String(T.shown).padStart(6, ' '), 102, 87, YL);
    textC(fb, G.balls > 1 ? 'NOCH ' + (G.balls - 1) + (G.balls === 2 ? ' PERLE' : ' PERLEN') : 'LETZTE PERLE VERLOREN', 80, 101, G.balls > 1 ? T3 : RD); }
  present(ctx, img, fb, pal);
}

// ---------- Start ----------
defSprites(); table = buildTable(); titleBuf = buildTitle(); setPal(); bindTouch();
let last = 0, acc = 0;
function loop(ts) { acc += Math.min(100, ts - last); last = ts; let n = 0; while (acc >= 1000 / 60 && n++ < 5) { update(); acc -= 1000 / 60; } if (n > 4) acc = 0; draw(); requestAnimationFrame(loop); }
requestAnimationFrame(ts => { last = ts; loop(ts); });
window.__G = { G, TB, key, step: n => { for (let i = 0; i < n; i++) update(); draw(); }, get balls() { return balls; }, boatHome, lampOn, serve };
