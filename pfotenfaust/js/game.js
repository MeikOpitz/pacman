// PFOTENFAUST – Spiel-Logik
'use strict';
const cv = document.getElementById('scr'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const GRAV = 0.18, rnd = n => Math.random() * n, rint = n => Math.random() * n | 0;

const DOGS = [
  { id: 'rex', name: 'REX', sub: 'KNOCHENKEULE', spd: 1.15, jmp: 3.7, hp: 12, dmg: 4, reach: 20, at: 15, st: [3, 3, 3] },
  { id: 'bruno', name: 'BRUNO', sub: 'BOX-PFOTEN', spd: 0.95, jmp: 3.65, hp: 16, dmg: 6, reach: 16, at: 19, st: [5, 2, 5] },
  { id: 'lotte', name: 'LOTTE', sub: 'TENNISBÄLLE', spd: 1.42, jmp: 4.0, hp: 9, dmg: 3, reach: 12, at: 13, ranged: 1, st: [2, 5, 2] }
];
const LV = [
  { name: 'HINTERHOF', theme: 'alley', len: 1280, mus: 'a', waves: ['t', 'tt', 'tw', 'ttt', 'wtt'], pits: [], plats: [[430, 92, 44], [830, 92, 44]],
    props: [[110, 'can'], [330, 'can'], [640, 'crate'], [900, 'can']], boss: 'kalle' },
  { name: 'FISCHMARKT', theme: 'harbor', len: 1500, mus: 'b', waves: ['tw', 'tj', 'wtt', 'f', 'jwt', 'ftw'], pits: [[500, 520], [1000, 1020]], drop: 1,
    plats: [[300, 92, 40], [700, 92, 50], [1120, 92, 40]], props: [[150, 'crate'], [420, 'crate'], [860, 'crate'], [1180, 'crate']], boss: 'graete' },
  { name: 'ALTSTADT-DÄCHER', theme: 'roofs', len: 1620, mus: 'a', waves: ['jj', 'tj', 'jwj', 'fj', 'jjw', 'tjwj'], drop: 1,
    pits: [[250, 270], [470, 492], [660, 682], [900, 920], [1120, 1142], [1300, 1320]], plats: [[360, 92, 40], [760, 92, 44], [1200, 90, 40]],
    props: [[180, 'crate'], [580, 'can'], [1020, 'crate']], boss: 'schatten' },
  { name: 'WOLLKNÄUEL-FABRIK', theme: 'factory', len: 1640, mus: 'b', waves: ['v', 'tv', 'fw', 'vjv', 'ffw', 'tvwj', 'fvf'], pits: [],
    plats: [[340, 92, 44], [800, 92, 44], [1100, 92, 44], [1500, 90, 36], [1580, 90, 36]], props: [[130, 'crate'], [460, 'crate'], [950, 'can'], [1250, 'crate']], boss: 'saug' },
  { name: 'VILLA SCHNURR', theme: 'villa', len: 1700, mus: 'a', waves: ['tj', 'fw', 'vv', 'jjw', 'ff', 'tvwj', 'fjfw'], pits: [],
    plats: [[380, 92, 44], [900, 92, 44], [1300, 92, 44]], props: [[140, 'vase'], [300, 'vase'], [560, 'vase'], [760, 'vase'], [1060, 'vase'], [1380, 'vase']], boss: 'baron' }
];
const BOSS = {
  kalle: { name: 'KRALLEN-KALLE', hp: 110, say: 'MEIN HOF, MEINE REGELN, FLOHTEPPICH!' },
  graete: { name: "KÄPT'N GRÄTE", hp: 130, say: 'ARRR! IHR ENDET ALS FISCHFUTTER!' },
  schatten: { name: 'SCHATTENPFOTE', hp: 140, say: '... (MIAU.)' },
  saug: { name: 'SAUGNATOR 3000', hp: 170, say: 'ALLE HUNDEHAARE WERDEN ENTFERNT!' },
  baron: { name: 'BARON VON SCHNURR', hp: 200, say: 'DER GOLDENE KNOCHEN GEHÖRT MIR. FÜR IMMER!' }
};
const STORY = [
  ['WUFFINGEN, MITTERNACHT.', '', 'DER GOLDENE KNOCHEN,', 'SCHATZ ALLER HUNDE DER STADT,', 'IST AUS DEM RATHAUS VERSCHWUNDEN!'],
  ['AM TATORT: WEISSE HAARE,', 'KRATZSPUREN ...', 'UND EIN MONOKEL-PUTZTUCH.', '', 'DAS SAMTPFOTEN-SYNDIKAT!'],
  ['IHR ANFÜHRER, DER FEINE', 'BARON VON SCHNURR, LACHT SICH', 'IN SEINER VILLA INS PFÖTCHEN.', '', 'ABER NICHT MEHR LANGE ...'],
  ['DREI HUNDE NEHMEN DIE', 'FÄHRTE AUF:', '', 'REX, BRUNO UND LOTTE -', 'DIE PFOTENFAUST!']
];
const AFTER = [
  ["KALLE WINSELT: 'DER KNOCHEN?", "LÄNGST AM HAFEN, AUF", "KÄPT'N GRÄTES KUTTER!'"],
  ['IM FRACHTRAUM: NUR FISCH.', 'ABER PFOTENSPUREN FÜHREN', 'HINAUF AUF DIE DÄCHER ...'],
  ['SCHATTENPFOTE VERPUFFT IM', 'RAUCH. UNTEN BRUMMT DIE', 'WOLLKNÄUEL-FABRIK DES BARONS.'],
  ['DER SAUGNATOR IST SCHROTT.', 'JETZT BLEIBT NUR NOCH EINS:', 'DIE VILLA SCHNURR!']
];
const ENDING = [
  ["DER BARON SCHNIEFT: 'ICH WOLLTE", "DOCH NUR ... EIN EINZIGES MAL", "DARAN KNABBERN. NIEMAND LÄDT", "KATZEN ZUM KNOCHENFEST EIN!'"],
  ['DIE DREI SEHEN SICH AN.', '', "REX BRUMMT: 'DANN KOMM HALT", "MIT. ABER DIE WOLLE", "BLEIBT ZU HAUSE.'"],
  ['SEITDEM FEIERT WUFFINGEN', 'DAS KNOCHENFEST GEMEINSAM.', '', 'ES GIBT WURST. UND THUNFISCH.', 'UND ERSTAUNLICH WENIG ÄRGER.'],
  ['', 'ENDE', '', 'DANKE FÜRS SPIELEN!']
];

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
    key.left = x < -dz ? 1 : 0; key.right = x > dz ? 1 : 0; key.up = y < -dz * 1.6 ? 1 : 0; key.down = y > dz * 1.6 ? 1 : 0;
    dp.dataset.d = (key.left ? 'l' : '') + (key.right ? 'r' : '') + (key.up ? 'u' : '') + (key.down ? 'd' : ''); };
  const clr = () => { key.left = key.right = key.up = key.down = 0; pid = null; dp.dataset.d = ''; };
  dp.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { dp.setPointerCapture(pid); } catch (x) { } set(e); AU.init(); });
  dp.addEventListener('pointermove', e => { if (e.pointerId === pid) { e.preventDefault(); set(e); } });
  dp.addEventListener('pointerup', clr); dp.addEventListener('pointercancel', clr);
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
}
function pollInput() { for (const k of ['left', 'right', 'up', 'down', 'a', 'b', 'c', 'start', 'select', 'mute']) { JP[k] = key[k] && !prev[k]; prev[k] = key[k]; } }

// ---------- Zustand ----------
const G = { scr: 'title', t: 0, lvl: 0, score: 0, hi: 0, saved: 0, hp: [0, 0, 0], out: [0, 0, 0], cur: 0, wuff: 0, cam: 0, shake: 0, hs: 0, dmg: false, page: 0, sel: 0, pause: false, menu: 0 };
let L = null, P = null, en = [], shots = [], items = [], fx = [], props = [], haz = [], HID = 1;
try { const s = JSON.parse(localStorage.getItem('pfotenfaust') || '{}'); G.saved = s.lvl || 0; G.hi = s.hi || 0; G.dmg = !!s.dmg; } catch (e) { }
function save() { try { localStorage.setItem('pfotenfaust', JSON.stringify({ lvl: G.saved, hi: G.hi, dmg: G.dmg })); } catch (e) { } }

function go(scr) { G.scr = scr; G.t = 0; G.page = 0; }
function newGame(lvl) { G.lvl = lvl; G.score = 0; resetDogs(); G.wuff = 0; G.pickNext = 'intro'; go('pick'); G.sel = 0; AU.music('title'); }
function resetDogs() { DOGS.forEach((d, i) => { G.hp[i] = d.hp; G.out[i] = 0; }); }
function startLevel() {
  const d = LV[G.lvl]; en = []; shots = []; items = []; fx = []; props = []; haz = [];
  const n = d.waves.length, x0 = 190, x1 = d.len - 330;
  L = { d, bg: buildBG(d.theme), waves: d.waves.map((w, i) => ({ x: Math.round(x0 + (x1 - x0) * i / (n - 1)), s: w, q: [], left: 0 })), wi: 0, lock: null, boss: null, bossT: 0, done: 0, goT: 0, startScore: G.score };
  d.props.forEach(([x, t]) => props.push({ x, t, hp: 2, fl: 0 }));
  d.plats.forEach((p, i) => { if (p[0] < d.len - 200) items.push({ x: p[0] + p[2] / 2, y: p[1] - 1, vy: 0, t: ['wurst', 'keks', 'bone'][i % 3], fix: 1 }); });
  G.cam = 0; G.wuff = Math.min(G.wuff, 100);
  P = { x: 30, y: GY, vx: 0, vy: 0, face: 1, st: 'idle', t: 0, combo: 0, inv: 60, onG: true, duck: false, jatk: 0, hitId: 0, an: 0, safeX: 30, drop: 0 };
  go('intro');
}
const groundAt = x => !L.d.pits.some(p => x > p[0] && x < p[1]);
const addFx = (x, y, type, o) => fx.push(Object.assign({ x, y, vx: 0, vy: 0, t: 0, life: 20, type }, o || {}));
function burst(x, y, n, type) { for (let i = 0; i < n; i++) addFx(x, y, type || 'star', { vx: rnd(3) - 1.5, vy: -rnd(2.4) - 0.3, life: 16 + rint(14), g: 0.1 }); }
function popup(x, y, s) { addFx(x, y, 'txt', { s, vy: -0.5, life: 40 }); }
function addScore(n, x, y) { G.score += n; if (G.score > G.hi) G.hi = G.score; if (x != null) popup(x, y, '+' + n); }

// ---------- Spieler ----------
function pBox() { return [P.x - 4, P.y - (P.duck ? 13 : 23), P.x + 4, P.y]; }
function hitP(x0, y0, x1, y1, dmg, dir) {
  if (x0 > x1) { const t = x0; x0 = x1; x1 = t; } const b = pBox();
  if (x1 < b[0] || x0 > b[2] || y1 < b[1] || y0 > b[3]) return false; return hurtP(dmg, dir);
}
function hurtP(dmg, dir) {
  if (P.inv > 0 || P.st === 'ko' || P.st === 'bark' || G.scr !== 'play') return false;
  G.hp[G.cur] -= dmg; G.shake = 8; P.jatk = 0; P.combo = 0; burst(P.x, P.y - 14, 4);
  if (G.hp[G.cur] <= 0) { G.hp[G.cur] = 0; P.st = 'ko'; P.t = 0; P.vy = -2.6; P.vx = dir * 1.4; P.onG = false; AU.sfx('ko'); }
  else { P.st = 'hurt'; P.t = 18; P.vx = dir * 1.7; P.vy = -1.6; P.onG = false; P.inv = 80; AU.sfx('hurt'); }
  return true;
}
function bark() {
  G.wuff = 0; P.st = 'bark'; P.t = 50; G.shake = 26; AU.sfx('bark'); G.flash = 8;
  for (let i = 0; i < 3; i++) addFx(P.x + P.face * 8, P.y - 20, 'ring', { life: 40, d: i * 8 });
  shots = shots.filter(s => !s.foe); haz = [];
  en.forEach(e => { if (e.st !== 'dead' && !e.hid && e.x > G.cam - 20 && e.x < G.cam + 180) hitE(e, e.boss ? 14 : 12, e.x > P.x ? 1 : -1, true); });
}
function strikeBox() {
  const D = DOGS[G.cur], f = P.face;
  if (!P.onG) return [P.x + f * 2, P.y - 14, P.x + f * 17, P.y + 1];
  return P.duck ? [P.x + f * 2, P.y - 12, P.x + f * (D.reach + 1), P.y] : [P.x + f * 1, P.y - 27, P.x + f * D.reach, P.y - 3];
}
function doHits(dmg, strong) {
  let b = strikeBox(); if (b[0] > b[2]) b = [b[2], b[1], b[0], b[3]];
  let any = false;
  for (const e of en) {
    if (e.st === 'dead' || e.hid || e.lastHit === P.hitId) continue;
    if (b[2] < e.x - e.hw || b[0] > e.x + e.hw || b[3] < e.y - e.hh || b[1] > e.y) continue;
    e.lastHit = P.hitId; hitE(e, dmg, P.face, strong); any = true;
  }
  for (const pr of props) { if (pr.hp > 0 && pr.lastHit !== P.hitId && b[2] > pr.x - 6 && b[0] < pr.x + 6 && b[3] > GY - 14) { pr.lastHit = P.hitId; hitProp(pr); any = true; } }
  for (const s of shots) if (s.foe && !s.hard && s.x > b[0] - 2 && s.x < b[2] + 2 && s.y > b[1] - 2 && s.y < b[3] + 2) { s.life = 0; burst(s.x, s.y, 3); AU.sfx('hit'); addScore(20); }
  return any;
}
function hitProp(pr) {
  pr.hp--; pr.fl = 6; AU.sfx('hit'); burst(pr.x, GY - 8, 3);
  if (pr.hp <= 0) { burst(pr.x, GY - 8, 8, 'poof'); const r = Math.random(); items.push({ x: pr.x, y: GY - 10, vy: -2, t: r < 0.4 ? 'wurst' : r < 0.7 ? 'keks' : 'bone' }); addScore(50); }
}
function hitE(e, dmg, dir, strong) {
  if (e.st === 'dead' || e.st === 'dying' || e.st === 'gone') return;
  if (e.weak) dmg = Math.round(dmg * 1.5);
  e.hp -= dmg; e.flash = 7; G.hs = strong ? 5 : 3; G.wuff = Math.min(100, G.wuff + (P.st === 'bark' ? 0 : 5));
  burst(e.x - dir * 2, e.y - e.hh * 0.6, strong ? 6 : 3); AU.sfx(strong ? 'big' : 'hit');
  if (e.hp <= 0) {
    if (e.boss) { e.st = 'dying'; e.t = 0; e.an = 'hurt'; e.fr = 0; shots = shots.filter(s => !s.foe); haz = []; en.forEach(o => { if (o !== e && o.st !== 'dead') { o.hp = 0; o.st = 'dead'; o.t = 0; o.vx = 1; o.vy = -3; } }); AU.music(null); return; }
    e.st = 'dead'; e.t = 0; e.vx = dir * (strong ? 3 : 2); e.vy = -3; e.onG = false; addScore(e.pts, e.x, e.y - 28); AU.sfx('miau');
    const r = Math.random(); if (r < 0.34) items.push({ x: e.x, y: e.y - 12, vy: -2.2, t: r < 0.1 ? 'wurst' : r < 0.2 ? 'keks' : 'bone' });
  } else if (!e.armor || (strong && !e.boss)) { e.st = 'hurt'; e.t = strong ? 24 : 15; e.vx = dir * (strong ? 2.6 : 1.3); if (strong && e.onG) { e.vy = -2; e.onG = false; } }
}
function updPlayer() {
  const D = DOGS[G.cur]; if (P.inv > 0) P.inv--; if (P.drop > 0) P.drop--;
  const py = P.y;
  if (P.st === 'ko') {
    P.t++; P.x += P.vx; if (P.onG) P.vx *= 0.8;
    if (P.t > 100) { G.out[G.cur] = 1; if (G.out.every(o => o)) { go('over'); AU.music('over'); } else { G.pickNext = 'play'; G.sel = G.out.findIndex(o => !o); go('pick'); } }
  } else if (P.st === 'hurt') { P.x += P.vx; P.vx *= 0.9; if (--P.t <= 0 && P.onG) P.st = 'idle'; if (P.t < -30) P.st = 'idle'; }
  else if (P.st === 'bark') { if (--P.t <= 0) P.st = 'idle'; }
  else {
    let mv = (key.right ? 1 : 0) - (key.left ? 1 : 0);
    if (P.st === 'atk') {
      P.t++; const a0 = Math.floor(D.at * 0.35), a1 = Math.floor(D.at * 0.7);
      if (D.ranged) { if (P.t === a0) throwBall(); }
      else if (P.t >= a0 && P.t <= a1) { if (P.t === a0) AU.sfx('swish'); doHits(P.combo === 2 ? Math.round(D.dmg * 1.6) : D.dmg, P.combo === 2); }
      if (JP.b && P.t > a0) P.queue = 1;
      if (P.t >= D.at) {
        if (P.queue && (D.ranged || P.combo < 2)) { P.combo = D.ranged ? 0 : P.combo + 1; P.t = 0; P.queue = 0; P.hitId = ++HID; if (mv) P.face = mv; P.x += P.face * 2; }
        else { P.st = 'idle'; P.cdT = P.combo === 2 ? 8 : 0; P.combo = 0; }
      }
      if (P.onG) mv = 0;
    } else {
      P.duck = P.onG && key.down && !key.a;
      if (mv) P.face = mv;
      if (JP.b) {
        if (!P.onG) { if (!P.jatk) { P.jatk = 1; P.hitId = ++HID; AU.sfx('swish'); } }
        else { P.st = 'atk'; P.t = 0; P.queue = 0; P.combo = 0; P.hitId = ++HID; }
      }
      if (JP.a && P.onG) {
        if (key.down && P.y < GY) { P.drop = 12; P.onG = false; P.y += 1; }
        else { P.vy = -D.jmp; P.onG = false; P.duck = false; AU.sfx('jump'); }
      }
      if (JP.c && G.wuff >= 100 && P.onG) bark();
      if (P.duck) mv = 0;
    }
    if (P.jatk && !P.onG) doHits(D.dmg, false);
    P.vx = mv * D.spd; P.x += P.vx; if (mv && P.onG) P.an += D.spd;
  }
  // Physik
  if (!P.onG) { P.vy = Math.min(P.vy + GRAV, 5); P.y += P.vy; }
  else {
    const onPlat = P.y < GY && L.d.plats.some(p => p[1] === P.y && P.x >= p[0] - 2 && P.x <= p[0] + p[2] + 2);
    if (!onPlat && (P.y < GY || !groundAt(P.x))) { P.onG = false; P.vy = 0; }
  }
  if (!P.onG && P.vy >= 0) {
    if (!P.drop) for (const p of L.d.plats) if (py <= p[1] && P.y >= p[1] && P.x >= p[0] - 2 && P.x <= p[0] + p[2] + 2) { P.y = p[1]; land(); break; }
    if (!P.onG && P.y >= GY && py <= GY + 1 && groundAt(P.x)) { P.y = GY; land(); }
  }
  if (P.y > GY + 1) { const pit = L.d.pits.find(p => P.x > p[0] - 6 && P.x < p[1] + 6); if (pit) P.x = Math.max(pit[0] + 4, Math.min(pit[1] - 4, P.x)); }
  if (P.y > H + 30) {
    P.x = P.safeX; P.y = GY - 40; P.vy = 0; P.vx = 0; P.jatk = 0;
    if (P.st !== 'ko') { P.inv = 0; if (!hurtP(3, 0)) { G.hp[G.cur] = Math.max(0, G.hp[G.cur] - 3); } P.inv = 100; if (P.st !== 'ko') { P.st = 'idle'; P.vx = 0; } }
    else { P.y = GY; P.onG = true; }
  }
  if (P.onG && P.y === GY && groundAt(P.x - 8) && groundAt(P.x + 8)) P.safeX = P.x;
  P.x = Math.max(G.cam + 6, Math.min(G.cam + W - 6, P.x));
}
function land() { P.onG = true; P.vy = 0; P.jatk = 0; if (P.st === 'atk' && P.t > 4) { P.st = 'idle'; P.combo = 0; } }
function throwBall() {
  if (shots.filter(s => !s.foe).length >= 3) return; AU.sfx('thr');
  shots.push({ x: P.x + P.face * 8, y: P.y - (P.duck ? 6 : 15), vx: P.face * 2.7, vy: P.duck ? -0.2 : -0.9, g: 0.07, type: 'ball', foe: 0, dmg: DOGS[2].dmg, life: 70, b: 1 });
}

// ---------- Gegner ----------
const ETYPE = {
  t: { type: 'thug', spec: 'thug', hp: 10, spd: 0.55, rng: 15, wt: 22, reach: 18, dmg: 2, pts: 100 },
  w: { type: 'thrower', spec: 'thrower', hp: 8, pts: 150, dmg: 2 },
  j: { type: 'jumper', spec: 'jumper', hp: 8, pts: 150, dmg: 2 },
  f: { type: 'thug', spec: 'fat', hp: 28, spd: 0.34, rng: 18, wt: 32, reach: 22, dmg: 3, pts: 300, armor: 1, hw: 8 },
  v: { type: 'vac', spec: 'thug', hp: 12, pts: 200, dmg: 2, hw: 11, vac: 1 }
};
function spawn(ch, side) {
  const T = ETYPE[ch], drop = L.d.drop && !T.vac;
  let x = G.cam + (side > 0 ? W + 14 : -14), y = GY;
  if (drop) { for (let i = 0; i < 20; i++) { x = G.cam + 14 + rnd(W - 28); if (groundAt(x - 8) && groundAt(x + 8) && Math.abs(x - P.x) > 28) break; } y = -8; }
  const e = Object.assign({ x, y, vx: 0, vy: 0, face: -side, st: 'walk', t: 0, cd: 30 + rint(60), flash: 0, hw: 6, hh: 24, onG: !drop, an: 'walk', fr: 0, at: rint(30), in: drop }, T);
  e.S = SPECS[T.spec]; e.spd = (e.spd || 0.6) * (0.9 + rnd(0.25)); en.push(e); return e;
}
function emove(e, vx) {
  if (e.onG && !groundAt(e.x + vx + Math.sign(vx) * 5)) return false;
  e.x += vx; if (e.in && !e.vac) e.x = Math.max(G.cam + 5, Math.min(G.cam + W - 5, e.x)); return true;
}
const to = (e, st, t) => { e.st = st; e.t = t || 0; };
function shoot(o) { shots.push(Object.assign({ vx: 0, vy: 0, g: 0, foe: 1, dmg: 2, life: 240 }, o)); }
const AI = {
  thug(e, dx, ad, dir) {
    if (e.st === 'walk') { e.face = dir; if (ad > e.rng) { emove(e, dir * e.spd); e.an = 'walk'; } else if (Math.abs(P.y - e.y) < 30) to(e, 'wind', e.wt); else e.an = 'idle'; }
    else if (e.st === 'wind') { e.an = 'wind'; e.fr = 0; if (--e.t <= 0) { to(e, 'atk', 14); AU.sfx('swish'); } }
    else if (e.st === 'atk') { e.an = e.armor ? 'atk2' : 'atk1'; e.fr = 1; if (e.t > 7) hitP(e.x + e.face * 2, e.y - 24, e.x + e.face * e.reach, e.y - 2, e.dmg, e.face); if (--e.t <= 0) to(e, 'cool', 34 + rint(40)); }
    else if (e.st === 'cool') { e.an = 'idle'; if (e.t > 22) { if (emove(e, -e.face * 0.35)) e.an = 'walk'; } if (--e.t <= 0) to(e, 'walk'); }
  },
  thrower(e, dx, ad, dir) {
    if (e.st === 'walk') { e.face = dir; e.an = 'idle'; if (ad < 46) { if (emove(e, -dir * 0.6)) e.an = 'walk'; } else if (ad > 86) { emove(e, dir * 0.6); e.an = 'walk'; }
      if (--e.cd <= 0 && e.in) to(e, 'wind', 24); }
    else if (e.st === 'wind') { e.an = 'thr'; e.fr = 0; if (--e.t <= 0) { const low = Math.random() < 0.35; shoot({ x: e.x + e.face * 8, y: e.y - (low ? 5 : 18), vx: e.face * 1.5, type: 'fishbone' }); to(e, 'atk', 18); AU.sfx('thr'); } }
    else if (e.st === 'atk') { e.an = 'thr'; e.fr = 1; if (--e.t <= 0) { to(e, 'walk'); e.cd = 90 + rint(70); } }
    else to(e, 'walk');
  },
  jumper(e, dx, ad, dir) {
    if (e.st === 'walk') { e.face = dir; if (ad > 54) { emove(e, dir * 0.85); e.an = 'walk'; } else if (ad < 28) { e.an = emove(e, -dir * 0.7) ? 'walk' : 'idle'; if (--e.cd <= -40) to(e, 'wind', 18); } else { e.an = 'idle'; if (--e.cd <= 0) to(e, 'wind', 18); } }
    else if (e.st === 'wind') { e.an = 'duck'; e.fr = 0; if (--e.t <= 0) { e.st = 'leap'; e.vx = e.face * Math.min(2.2, ad / 30 + 0.5); e.vy = -3.3; e.onG = false; AU.sfx('jump'); } }
    else if (e.st === 'leap') { e.an = 'jatk'; e.fr = 0; e.x += e.vx; hitP(e.x - 5, e.y - 18, e.x + 9 * e.face, e.y, e.dmg, e.face); if (e.onG) to(e, 'cool', 45); }
    else if (e.st === 'cool') { e.an = 'idle'; if (--e.t <= 0) { to(e, 'walk'); e.cd = 20 + rint(40); } }
  },
  vac(e) {
    e.vacA = 1; e.in = e.x > G.cam && e.x < G.cam + W;
    if (e.st === 'walk') e.st = 'ride';
    if (e.st === 'ride') { e.x += e.face * 1.5; if (P.y > e.y - 12) hitP(e.x - 10, e.y - 10, e.x + 10, e.y, e.dmg, e.face);
      if ((e.face > 0 && e.x > G.cam + W + 26) || (e.face < 0 && e.x < G.cam - 26)) to(e, 'turn', 45); }
    else if (e.st === 'turn') { if (--e.t <= 0) { e.face = -e.face; e.st = 'ride'; } }
  },
  boss(e, dx, ad, dir) {
    const half = e.hp < e.max / 2, cl = G.cam + 14, cr = G.cam + W - 14; e.weak = 0;
    if (e.st === 'dying') { e.t++; e.an = 'hurt'; e.fr = 0; if (e.t % 8 === 0) { burst(e.x + rnd(30) - 15, e.y - rnd(36), 5, 'poof'); AU.sfx('boom'); G.shake = 6; }
      if (e.t > 110) { e.st = 'gone'; e.hid = 1; addScore(2000 + G.lvl * 500, e.x, e.y - 30); L.done = 1; L.doneT = 0; if (G.lvl === 4) items.push({ x: e.x, y: e.y - 30, vy: -2, t: 'gold' }); } return; }
    if (e.st === 'gone') return;
    if (e.st === 'enter') { e.an = 'walk'; e.face = -1; e.x -= 0.6; if (e.x <= G.cam + 124) to(e, 'talk', 0); return; }
    if (e.st === 'talk') { e.an = 'idle'; return; }
    BAI[e.kind](e, dx, ad, dir, half, cl, cr);
  }
};
const BAI = {
  kalle(e, dx, ad, dir, half, cl, cr) {
    const sp = half ? 0.8 : 0.5;
    switch (e.st) {
      case 'walk': e.face = dir; e.an = 'walk'; if (ad > 27) e.x += dir * sp; else { e.n = (e.n || 0) + 1; if (e.n % 3 === 0) to(e, 'prep', 42); else to(e, 'wind', half ? 22 : 32); } break;
      case 'wind': e.an = 'wind'; e.fr = 0; if (--e.t <= 0) { to(e, 'slam', 16); AU.sfx('swish'); } break;
      case 'slam': e.an = 'atk2'; e.fr = 1; if (e.t === 12) { G.shake = 8; AU.sfx('big'); burst(e.x + e.face * 22, GY - 2, 6, 'poof'); } if (e.t <= 12 && e.t > 5) hitP(e.x, e.y - 34, e.x + e.face * 34, e.y, 3, e.face); if (--e.t <= 0) to(e, 'cool', half ? 30 : 46); break;
      case 'cool': e.an = 'idle'; if (--e.t <= 0) to(e, 'walk'); break;
      case 'prep': e.an = 'duck'; e.fr = 0; e.face = dir; e.x += (e.t & 2 ? 1 : -1); if (--e.t <= 0) { to(e, 'dash', 0); AU.sfx('miau'); } break;
      case 'dash': e.an = 'dash'; e.fr = 0; e.x += e.face * 2.5; hitP(e.x - 8, e.y - 30, e.x + e.face * 16, e.y, 3, e.face);
        if (e.x < cl || e.x > cr) { e.x = Math.max(cl, Math.min(cr, e.x)); G.shake = 12; AU.sfx('boom'); to(e, 'pant', 100); } break;
      case 'pant': e.an = 'pant'; e.weak = 1; if (--e.t <= 0) to(e, 'walk'); break;
    }
  },
  graete(e, dx, ad, dir, half, cl, cr) {
    switch (e.st) {
      case 'walk': e.face = dir; e.an = 'walk'; if (ad < 50 && e.x > cl + 4 && e.x < cr - 4) e.x -= dir * 0.6; else if (ad > 90) e.x += dir * 0.6; else e.an = 'idle';
        if (--e.cd <= 0) { e.n = half ? 4 : 3; to(e, 'wind', 22); } break;
      case 'wind': e.an = 'thr'; e.fr = 0; e.face = dir; if (--e.t <= 0) { const T = 62, tx = P.x + (e.n % 2 ? 0 : (rnd(50) - 25)); shoot({ x: e.x, y: e.y - 34, vx: (tx - e.x) / T, vy: -0.1 * T / 2 - 0.3, g: 0.1, type: 'anchor', dmg: 3, hard: 1 }); AU.sfx('thr'); to(e, 'thr', 14); } break;
      case 'thr': e.an = 'thr'; e.fr = 1; if (--e.t <= 0) { if (--e.n > 0) to(e, 'wind', 12); else to(e, 'aim', 30); } break;
      case 'aim': e.an = 'wind'; e.fr = 0; e.face = dir; if (--e.t <= 0) { to(e, 'lunge', 30); AU.sfx('swish'); } break;
      case 'lunge': e.an = 'dash'; e.fr = 0; e.x += e.face * 2.7; e.x = Math.max(cl, Math.min(cr, e.x)); hitP(e.x, e.y - 28, e.x + e.face * 28, e.y - 4, 3, e.face); if (--e.t <= 0) to(e, 'pant', half ? 60 : 85); break;
      case 'pant': e.an = 'pant'; e.weak = 1; if (--e.t <= 0) { to(e, 'walk'); e.cd = 40; } break;
    }
  },
  schatten(e, dx, ad, dir, half, cl, cr) {
    switch (e.st) {
      case 'walk': to(e, 'tele', 34); burst(e.x, e.y - 18, 8, 'poof'); AU.sfx('tele'); e.hid = 1; break;
      case 'tele': if (--e.t <= 0) { e.x = (P.x - G.cam < 80) ? cr - 8 : cl + 8; e.y = GY; e.hid = 0; e.face = e.x > P.x ? -1 : 1; burst(e.x, e.y - 18, 8, 'poof'); e.n = half ? 5 : 3; to(e, 'wind', 22); } break;
      case 'wind': e.an = 'thr'; e.fr = 0; if (--e.t <= 0) { const low = (e.n + (e.pat = e.pat || rint(2))) % 2; shoot({ x: e.x + e.face * 8, y: e.y - (low ? 5 : 19), vx: e.face * 2.1, type: 'shur' }); AU.sfx('thr'); to(e, 'thr', 10); } break;
      case 'thr': e.an = 'thr'; e.fr = 1; if (--e.t <= 0) { if (--e.n > 0) to(e, 'wind', half ? 12 : 17); else { e.pat = 0; e.st = 'leap'; e.vy = -4.4; e.vx = (P.x - e.x) / 46; e.onG = false; AU.sfx('jump'); } } break;
      case 'leap': e.an = e.vy < 0 ? 'jump' : 'jatk'; e.fr = 0; e.face = e.vx > 0 ? 1 : -1; e.x += e.vx; e.x = Math.max(cl, Math.min(cr, e.x)); if (e.vy > 0) hitP(e.x - 6, e.y - 20, e.x + e.face * 14, e.y, 3, e.face); if (e.onG) { G.shake = 5; to(e, 'pant', half ? 55 : 80); } break;
      case 'pant': e.an = 'pant'; e.weak = 1; if (--e.t <= 0) to(e, 'walk'); break;
    }
  },
  saug(e, dx, ad, dir, half, cl, cr) {
    e.fr2 = (G.t >> 3) & 1; e.open = 0;
    switch (e.st) {
      case 'walk': e.face = dir; if (--e.cd <= 0) { e.n = ((e.n || 0) + 1) % 3; to(e, ['rev', 'suck', 'spit'][e.n], [40, half ? 150 : 110, 20][e.n]); if (e.n === 2) e.k = half ? 4 : 3; } break;
      case 'rev': e.x -= e.face * 0.3 * (e.t & 4 ? 1 : -1) + e.face * 0.2; e.fr2 = (G.t >> 1) & 1; if (--e.t <= 0) { to(e, 'dash'); AU.sfx('boom'); } break;
      case 'dash': e.x += e.face * (half ? 3.1 : 2.6); if (P.y > e.y - 20) hitP(e.x - 24, e.y - 20, e.x + 26 * e.face, e.y, 3, e.face);
        if (e.x < cl + 16 || e.x > cr - 16) { e.x = Math.max(cl + 16, Math.min(cr - 16, e.x)); G.shake = 14; AU.sfx('boom'); to(e, 'pant', 95); } break;
      case 'pant': e.weak = 1; if (e.t % 12 === 0) addFx(e.x - e.face * 6 + rnd(10) - 5, e.y - 40, 'star', { vy: -0.4, life: 20 }); if (--e.t <= 0) { e.st = 'walk'; e.cd = 30; } break;
      case 'suck': e.open = 1; e.face = dir; if (P.st !== 'ko' && P.st !== 'bark') P.x += dir * -0.75;
        if (G.t % 4 === 0) addFx(e.x + e.face * (40 + rnd(60)), GY - 4 - rnd(26), 'wind', { vx: -e.face * 2.5, life: 16 });
        if (ad < 34 && P.y > e.y - 22) { if (hurtP(3, e.face)) { P.vx = e.face * 3; AU.sfx('big'); } } if (--e.t <= 0) { e.st = 'walk'; e.cd = 50; } break;
      case 'spit': e.open = 1; if (--e.t <= 0) { shoot({ x: e.x + e.face * 24, y: e.y - 10, vx: e.face * (1 + rnd(1.2)), vy: -2.6 - rnd(1), g: 0.12, type: 'yarn', bounce: 3 }); AU.sfx('thr'); if (--e.k > 0) e.t = 26; else { e.st = 'walk'; e.cd = 60; } } break;
    }
  },
  baron(e, dx, ad, dir, half, cl, cr) {
    switch (e.st) {
      case 'walk': e.face = dir; e.an = 'walk'; if (ad < 44 && e.x > cl + 4 && e.x < cr - 4) e.x -= dir * 0.7; else if (ad > 80) e.x += dir * 0.7; else e.an = 'idle';
        if (half && !e.called) { e.called = 1; to(e, 'call', 60); AU.sfx('miau'); break; }
        if (--e.cd <= 0) { e.n = ((e.n || 0) + 1) % (half ? 4 : 3); if (ad < 34) { to(e, 'wind', 20); } else if (e.n === 0) { e.k = half ? 5 : 3; to(e, 'laser', 20); } else if (e.n === 1 || e.n === 2) { e.k = half ? 3 : 2; to(e, 'yarn', 20); } else { to(e, 'tele', 30); burst(e.x, e.y - 20, 8, 'poof'); AU.sfx('tele'); e.hid = 1; } } break;
      case 'call': e.an = 'win'; e.fr = (G.t >> 3) & 1; if (e.t === 30) { spawn('t', 1); spawn('j', -1); } if (--e.t <= 0) { to(e, 'walk'); e.cd = 60; } break;
      case 'laser': e.an = 'win'; e.fr = 0; if (--e.t <= 0) { haz.push({ x: Math.max(cl, Math.min(cr, P.x + P.vx * 20)), t: 0 }); AU.sfx('sel'); if (--e.k > 0) e.t = half ? 20 : 28; else { to(e, 'pant', 70); } } break;
      case 'yarn': e.an = 'thr'; e.fr = e.t > 8 ? 0 : 1; e.face = dir; if (--e.t <= 0) { shoot({ x: e.x + e.face * 10, y: e.y - 26, vx: e.face * (1.2 + rnd(0.8)), vy: -2.4, g: 0.12, type: 'yarn', bounce: 3 }); AU.sfx('thr'); if (--e.k > 0) e.t = 30; else { to(e, 'walk'); e.cd = 50; } } break;
      case 'tele': if (--e.t <= 0) { e.x = Math.max(cl, Math.min(cr, P.x - P.face * 26)); e.hid = 0; e.face = e.x > P.x ? -1 : 1; burst(e.x, e.y - 20, 8, 'poof'); to(e, 'wind', 16); } break;
      case 'wind': e.an = 'wind'; e.fr = 0; if (--e.t <= 0) { to(e, 'slam', 14); AU.sfx('swish'); } break;
      case 'slam': e.an = 'atk1'; e.fr = 1; if (e.t > 6) hitP(e.x, e.y - 30, e.x + e.face * 32, e.y - 2, 3, e.face); if (--e.t <= 0) { to(e, 'walk'); e.cd = half ? 30 : 50; } break;
      case 'pant': e.an = 'pant'; e.weak = 1; if (--e.t <= 0) { to(e, 'walk'); e.cd = 30; } break;
    }
  }
};
function updEnemy(e) {
  if (e.flash > 0) e.flash--; e.at++;
  const dx = P.x - e.x, ad = Math.abs(dx), dir = dx > 0 ? 1 : -1;
  if (!e.in && e.x > G.cam + 6 && e.x < G.cam + W - 6) e.in = true;
  if (e.st === 'dead') { e.x += e.vx; e.vy += GRAV; e.y += e.vy; if (++e.t > 46) { e.rm = 1; burst(e.x, Math.min(e.y, GY) - 10, 6, 'poof'); } return; }
  if (e.st === 'hurt') { e.an = 'hurt'; e.fr = 0; emove(e, e.vx); e.vx *= 0.86; if (--e.t <= 0 && e.onG) { e.st = 'walk'; e.cd = Math.max(e.cd, 20); } }
  else if (!e.in && !e.vac && !e.boss && e.onG) { e.face = e.x < G.cam + W / 2 ? 1 : -1; e.x += e.face * 0.9; e.an = 'walk'; }
  else AI[e.type](e, dx, ad, dir);
  if (!e.onG) { e.vy += GRAV; e.y += e.vy; if (e.vy > 0 && e.y >= GY && e.y - e.vy <= GY + 1 && groundAt(e.x)) { e.y = GY; e.vy = 0; e.onG = true; } }
  else if (!groundAt(e.x) && !e.boss) { e.onG = false; e.vy = 0; }
  if (e.y > H + 40) { e.rm = 1; if (e.hp > 0) addScore(e.pts, e.x, GY - 10); }
}

// ---------- Welt ----------
function updWorld() {
  const d = L.d;
  // Wellen
  if (!L.lock && !L.boss && L.wi < L.waves.length && P.x >= L.waves[L.wi].x) {
    const w = L.waves[L.wi]; L.lock = w; w.q = w.s.split('').map((c, i) => ({ c, t: 20 + i * 55, side: i % 2 ? -1 : 1 })); w.camX = Math.max(G.cam, Math.min(w.x - 64, d.len - W));
  }
  if (L.lock) {
    const w = L.lock; w.q.forEach(q => { if (q.t-- === 0) spawn(q.c, G.cam < 20 ? 1 : q.side); }); w.q = w.q.filter(q => q.t >= 0);
    if (!w.q.length && !en.length) { L.lock = null; L.wi++; L.goT = 150; addScore(100); }
  } else if (!L.boss && L.wi >= L.waves.length && P.x > d.len - 120) {
    const B = BOSS[d.boss], S = d.boss === 'saug' ? SPECS.jumper : SPECS[d.boss];
    L.boss = { x: G.cam + W + 40, y: GY, vx: 0, vy: 0, face: -1, st: 'enter', t: 0, cd: 50, flash: 0, hw: d.boss === 'saug' ? 22 : 9, hh: 36, onG: true, an: 'walk', fr: 0, at: 0, in: true,
      type: 'boss', kind: d.boss, boss: 1, armor: 1, hp: B.hp, max: B.hp, S, pts: 0, saug: d.boss === 'saug' };
    en.push(L.boss); AU.music('boss');
  }
  if (L.boss && L.boss.st === 'talk') { L.bossT++; if (L.bossT > 170 || (L.bossT > 30 && (JP.a || JP.b))) { L.boss.st = 'walk'; L.boss.cd = 40; } }
  // Kamera
  let tgt = P.x - 64; const maxC = L.lock ? L.lock.camX : (L.boss ? d.len - W : Math.min(d.len - W, L.wi < L.waves.length ? L.waves[L.wi].x - 64 + 1 : d.len - W));
  tgt = Math.max(G.cam, Math.min(tgt, maxC)); if (L.boss) tgt = d.len - W;
  G.cam += Math.max(-2, Math.min(2, tgt - G.cam)); if (G.cam < 0) G.cam = 0;
  // Geschosse
  for (const s of shots) {
    s.x += s.vx; s.vy += s.g; s.y += s.vy; s.life--;
    if (s.y >= GY - 2 && groundAt(s.x)) { if (s.b || s.bounce > 0) { s.y = GY - 2; s.vy = -Math.abs(s.vy) * (s.b ? 0.5 : 0.85); if (s.b) s.b--; else s.bounce--; } else if (s.g) { s.life = 0; burst(s.x, GY - 2, 3, 'poof'); if (s.type === 'anchor') { G.shake = 4; AU.sfx('hit'); } } }
    if (s.x < G.cam - 20 || s.x > G.cam + W + 20 || s.y > H + 10) s.life = 0;
    if (s.foe) { if (hitP(s.x - 3, s.y - 3, s.x + 3, s.y + 3, s.dmg, s.vx > 0 ? 1 : -1)) s.life = 0; }
    else {
      for (const e of en) if (e.st !== 'dead' && !e.hid && s.x > e.x - e.hw - 2 && s.x < e.x + e.hw + 2 && s.y > e.y - e.hh && s.y < e.y) { hitE(e, s.dmg, s.vx > 0 ? 1 : -1, false); s.life = 0; break; }
      for (const pr of props) if (s.life > 0 && pr.hp > 0 && Math.abs(s.x - pr.x) < 7 && s.y > GY - 14) { hitProp(pr); s.life = 0; }
      for (const o of shots) if (o.foe && !o.hard && o.life > 0 && Math.abs(o.x - s.x) < 5 && Math.abs(o.y - s.y) < 5) { o.life = 0; s.life = 0; burst(s.x, s.y, 3); }
    }
  }
  shots = shots.filter(s => s.life > 0);
  // Laser
  for (const h of haz) { h.t++; if (h.t === 40) { AU.sfx('laser'); G.shake = 4; } if (h.t >= 40 && h.t < 54) hitP(h.x - 5, 14, h.x + 5, GY, 3, P.x > h.x ? 1 : -1); }
  haz = haz.filter(h => h.t < 58);
  // Items
  for (const it of items) {
    if (!it.fix) { it.vy += GRAV; it.y += it.vy; if (it.y >= GY - 1 && groundAt(it.x)) { it.y = GY - 1; it.vy = 0; } if (it.y > H + 10) it.rm = 1; it.age = (it.age || 0) + 1; if (it.age > 600 && it.t !== 'gold') it.rm = 1; }
    if (P.st !== 'ko' && Math.abs(it.x - P.x) < 10 && it.y > P.y - 26 && it.y < P.y + 6) {
      it.rm = 1; AU.sfx('pick');
      if (it.t === 'wurst') { G.hp[G.cur] = Math.min(DOGS[G.cur].hp, G.hp[G.cur] + 5); popup(it.x, it.y - 10, 'LECKER!'); }
      else if (it.t === 'keks') { G.wuff = Math.min(100, G.wuff + 40); popup(it.x, it.y - 10, 'WUFF+'); }
      else if (it.t === 'gold') { addScore(5000, it.x, it.y - 10); L.gold = 1; }
      else addScore(200, it.x, it.y - 10);
    }
  }
  items = items.filter(i => !i.rm);
  for (const f of fx) { f.t++; f.x += f.vx; f.y += f.vy; if (f.g) f.vy += f.g; }
  fx = fx.filter(f => f.t < f.life + (f.d || 0));
  props.forEach(p => { if (p.fl > 0) p.fl--; });
  if (L.goT > 0) L.goT--;
  if (L.done) { L.doneT++; if (L.doneT === 20) { AU.music('win'); P.st = 'idle'; } if (L.doneT > 200 && (G.lvl < 4 || L.gold || L.doneT > 900)) levelClear(); }
}
function levelClear() {
  G.bonus = G.hp.reduce((a, b) => a + b, 0) * 50; G.score += G.bonus; if (G.score > G.hi) G.hi = G.score;
  if (G.lvl >= 4) { G.saved = 0; save(); go('ending'); AU.music('title'); return; }
  G.saved = Math.max(G.saved, G.lvl + 1); save(); go('clear');
}

function update() {
  G.t++; pollInput();
  if (JP.select) { G.dmg = !G.dmg; save(); AU.sfx('sel'); }
  if (JP.mute) AU.setMute(!AU.muted);
  const ok = JP.a || JP.b || JP.start;
  switch (G.scr) {
    case 'title':
      AU.music('title');
      if (G.saved > 0 && (JP.up || JP.down)) { G.menu ^= 1; AU.sfx('sel'); }
      if (ok && G.t > 20) { AU.init(); AU.sfx('ok'); if (G.saved > 0 && G.menu === 1) newGame(G.saved); else go('story'); }
      break;
    case 'story':
      if (ok || G.t > 520) { AU.sfx('sel'); if (JP.start || G.page >= STORY.length - 1) newGame(0); else { G.page++; G.t = 0; } }
      break;
    case 'pick':
      if (JP.left || JP.right) { let s = G.sel; for (let i = 0; i < 3; i++) { s = (s + (JP.left ? 2 : 1)) % 3; if (!G.out[s]) break; } G.sel = s; AU.sfx('sel'); }
      if (ok && G.t > 15 && !G.out[G.sel]) { G.cur = G.sel; AU.sfx('ok'); AU.sfx('bark'); if (G.pickNext === 'intro') startLevel(); else { P.st = 'idle'; P.inv = 150; P.y = GY - 30; P.x = P.safeX; P.onG = false; P.vy = 0; P.vx = 0; go('play'); } }
      break;
    case 'intro': if (G.t > 130 || (G.t > 30 && ok)) { go('play'); AU.music('s' + (G.lvl + 1)); } break;
    case 'play':
      if (JP.start) { G.pause = !G.pause; AU.sfx('sel'); }
      if (G.pause) break;
      if (G.hs > 0) { G.hs--; break; }
      if (!(L.boss && L.boss.st === 'talk')) { updPlayer(); } else { P.st = 'idle'; }
      if (G.scr !== 'play') break;
      en.forEach(updEnemy); en = en.filter(e => !e.rm); updWorld();
      if (G.shake > 0) G.shake--; if (G.flash > 0) G.flash--;
      break;
    case 'clear': if (G.t > 60 && ok) { G.lvl++; resetDogs(); G.pickNext = 'intro'; G.sel = G.cur; go('pick'); AU.music('title'); } break;
    case 'over': if (G.t > 60 && ok) { G.score = L.startScore; resetDogs(); G.wuff = 0; G.pickNext = 'intro'; G.sel = 0; go('pick'); AU.music('title'); } break;
    case 'ending': if (G.t > 50 && ok) { if (G.page >= ENDING.length - 1) { go('title'); } else { G.page++; G.t = 0; AU.sfx('sel'); } } break;
  }
}

// ---------- Zeichnen ----------
function pFrame() {
  const F = SPECS[DOGS[G.cur].id].F, D = DOGS[G.cur];
  if (P.st === 'ko') return P.onG ? F.ko[0] : F.hurt[0];
  if (P.st === 'hurt') return F.hurt[0];
  if (P.st === 'bark') return F.bark[0];
  if (L.done && L.doneT > 20) return F.win[(G.t >> 3) & 1];
  if (!P.onG) return P.jatk ? F.jatk[0] : F.jump[0];
  if (P.st === 'atk') { const i = P.t < D.at * 0.35 ? 0 : 1; if (D.ranged) return P.duck ? F.datk[i] : F.thr[i]; return P.duck ? F.datk[i] : F[['atk1', 'atk2', 'atk3'][P.combo]][i]; }
  if (P.duck) return F.duck[0];
  if (P.vx) return F.walk[(P.an / 5 | 0) & 3];
  return F.idle[(G.t >> 4) & 1];
}
function shadow(x, y, w) { ctx.fillStyle = 'rgba(10,6,20,0.35)'; ctx.fillRect(Math.round(x - w), GY, w * 2, 2); ctx.fillRect(Math.round(x - w + 2), GY + 2, w * 2 - 4, 1); }
function drawWorld() {
  const cam = Math.round(G.cam), sx = G.shake ? rint(3) - 1 : 0, sy = G.shake ? rint(3) - 1 : 0, bg = L.bg, th = bg.th;
  ctx.save(); ctx.translate(sx, sy);
  let o = -Math.round(cam * 0.2) % BGW; ctx.drawImage(bg.far, o, 0); ctx.drawImage(bg.far, o + BGW, 0);
  o = -Math.round(cam * 0.6) % BGW; ctx.drawImage(bg.mid, o, 0); ctx.drawImage(bg.mid, o + BGW, 0);
  for (let x = -(cam % 32); x < W; x += 32) ctx.drawImage(bg.fl, x, GY);
  for (const p of L.d.pits) { const x = p[0] - cam; if (x > W || x + p[1] - p[0] < 0) continue; ctx.fillStyle = th.pit; ctx.fillRect(x, GY, p[1] - p[0], H - GY);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, GY, 2, H - GY); ctx.fillRect(x + p[1] - p[0] - 2, GY, 2, H - GY);
    if (th.water) { ctx.fillStyle = '#5a8ad0'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 3 + ((G.t >> 3) + i * 7) % (p[1] - p[0] - 8), GY + 6 + i * 5, 4, 1); } }
  for (const p of L.d.plats) { const x = p[0] - cam; ctx.fillStyle = th.plat[1]; ctx.fillRect(x, p[1], p[2], 5); ctx.fillStyle = th.plat[0]; ctx.fillRect(x, p[1], p[2], 2); ctx.fillStyle = K; ctx.fillRect(x, p[1] + 5, p[2], 1); ctx.fillRect(x + 3, p[1] + 6, 2, 3); ctx.fillRect(x + p[2] - 5, p[1] + 6, 2, 3); }
  for (const pr of props) if (pr.hp > 0) { const c = SPR[pr.t]; if (pr.fl) ctx.globalAlpha = 0.5; sprB(ctx, c, pr.x - cam + (pr.fl ? rint(3) - 1 : 0), GY); ctx.globalAlpha = 1; }
  for (const h of haz) { const x = Math.round(h.x - cam); if (h.t < 40) { if (h.t & 4) { ctx.fillStyle = '#ff4a4a'; ctx.fillRect(x - 5, GY - 1, 10, 2); ctx.fillRect(x, 14, 1, GY - 14); } }
    else { ctx.fillStyle = '#ff4a6a'; ctx.fillRect(x - 5, 14, 10, GY - 14); ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, 14, 4, GY - 14); } }
  for (const it of items) { const c = SPR[it.t], bob = it.fix ? Math.round(Math.sin(G.t / 10) * 1.5) : 0; if (it.age > 480 && (G.t & 4)) continue; sprB(ctx, c, it.x - cam, it.y + bob); if (it.t === 'gold' && (G.t & 8)) sprC(ctx, SPR.star[0], it.x - cam + 6, it.y - 8); }
  for (const e of en) {
    if (e.hid) continue; const x = e.x - cam; if (x < -40 || x > W + 40) continue;
    if (e.st === 'dead' && (e.t & 2)) continue;
    if (e.y <= GY) shadow(x, GY, e.saug ? 22 : e.vac ? 10 : 6);
    if (e.saug) spr(ctx, SPR.saug[e.open ? 'open' : 'idle'][e.fr2 | 0], x + (e.st === 'dying' ? rint(3) - 1 : 0), e.y, e.face, e.flash);
    else if (e.vacA) spr(ctx, SPR.vac[(G.t >> 2) & 1], x, e.y, e.face, e.flash);
    else { const fr = e.S.F[e.an] || e.S.F.idle, n = fr.length; let i = e.fr; if (e.an === 'walk') i = (e.at >> 3) % n; else if (e.an === 'idle' || e.an === 'pant') i = (e.at >> 4) % n; spr(ctx, fr[Math.min(i, n - 1)], x, e.y, e.st === 'dead' && (e.t & 8) ? -e.face : e.face, e.flash); }
    if (e.st === 'wind' && !e.boss && (e.t & 4)) { ctx.fillStyle = '#ff4a4a'; ctx.fillRect(Math.round(x) - 1, e.y - 36, 2, 4); ctx.fillRect(Math.round(x) - 1, e.y - 31, 2, 1); }
  }
  if (!(P.inv > 0 && P.st !== 'hurt' && (G.t & 2))) { if (P.y <= GY && groundAt(P.x)) shadow(P.x - cam, GY, 6); spr(ctx, pFrame(), P.x - cam, P.y, P.face, false); }
  for (const s of shots) { const c = SPR[s.type]; sprC(ctx, Array.isArray(c) ? c[(G.t >> 2) & 1] : (s.vx < 0 && s.type === 'fishbone' ? (SPR.fbL || (SPR.fbL = flipCv(c))) : c), s.x - cam, s.y); }
  for (const f of fx) {
    const x = f.x - cam, t = f.t - (f.d || 0); if (t < 0) continue;
    if (f.type === 'txt') textO(ctx, f.s, Math.round(x - textW(f.s) / 2), Math.round(f.y), '#f0c838');
    else if (f.type === 'ring') { const r = t * 3; ctx.fillStyle = t & 1 ? '#fff' : '#f0c838'; for (let a = 0; a < 20; a++) ctx.fillRect(Math.round(x + Math.cos(a * 0.314) * r), Math.round(f.y + Math.sin(a * 0.314) * r * 0.7), 2, 2); }
    else if (f.type === 'wind') { ctx.fillStyle = '#dfe8f0'; ctx.fillRect(Math.round(x), Math.round(f.y), 5, 1); }
    else sprC(ctx, SPR[f.type][t > f.life / 2 ? 1 : 0], x, f.y);
  }
  ctx.restore();
  if (G.flash > 0 && (G.flash & 2)) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, 0, W, H); }
}
function bar(x, y, w, v, max, c1, c0) { ctx.fillStyle = K; ctx.fillRect(x - 1, y - 1, w + 2, 5); ctx.fillStyle = c0; ctx.fillRect(x, y, w, 3); ctx.fillStyle = c1; ctx.fillRect(x, y, Math.max(0, Math.round(w * v / max)), 3); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, Math.max(0, Math.round(w * v / max)), 1); }
function drawHUD() {
  const D = DOGS[G.cur]; ctx.fillStyle = K; ctx.fillRect(0, 0, W, 14); ctx.fillStyle = '#5c2e78'; ctx.fillRect(0, 14, W, 1);
  text(ctx, D.name, 2, 2, WH); bar(27, 3, D.hp * 2, G.hp[G.cur], D.hp, '#e0483a', '#4a1c28');
  const full = G.wuff >= 100; text(ctx, 'WUFF', 2, 8, full && (G.t & 8) ? '#fff' : '#f0c838'); bar(27, 9, 32, G.wuff, 100, full && (G.t & 8) ? '#fff' : '#f0c838', '#4a3a18');
  for (let i = 0; i < 3; i++) { const c = SPECS[DOGS[i].id]; ctx.fillStyle = G.out[i] ? '#3a3448' : c.fur; ctx.fillRect(68 + i * 7, 3, 5, 5); ctx.fillStyle = G.out[i] ? '#3a3448' : c.cloth; ctx.fillRect(68 + i * 7, 8, 5, 3); if (i === G.cur) { ctx.fillStyle = WH; ctx.fillRect(68 + i * 7, 12, 5, 1); } }
  text(ctx, String(G.score).padStart(6, '0'), W - 25, 2, WH); text(ctx, 'L' + (G.lvl + 1) + '-' + Math.min(L.wi + 1, L.waves.length + 1) , W - 25, 8, '#8e96b4');
  if (L.boss && L.boss.st !== 'gone') { const b = L.boss; textO(ctx, BOSS[b.kind].name, 4, H - 13, WH); bar(4, H - 6, W - 8, Math.max(0, b.hp), b.max, '#b060e0', '#2a1838'); }
  if (L.goT > 0 && (G.t & 16) && !L.lock) { textO(ctx, 'LOS! >', W - 30, 22, '#f0c838'); }
  if (full && !L.boss && (G.t & 32)) textO(ctx, 'WUFF BEREIT!', 2, 18, '#f0c838');
  if (L.boss && L.boss.st === 'talk') dialog(BOSS[L.boss.kind].name, BOSS[L.boss.kind].say, L.bossT);
  if (L.done && L.doneT > 30) { textCO(ctx, G.lvl === 4 && !L.gold ? 'HOL DIR DEN KNOCHEN!' : 'GESCHAFFT!', W / 2, 40, '#f0c838', G.lvl === 4 && !L.gold ? 1 : 2); }
  if (G.pause) { ctx.fillStyle = 'rgba(10,6,20,0.7)'; ctx.fillRect(0, 0, W, H); textCO(ctx, 'PAUSE', W / 2, 50, WH, 2); textC(ctx, 'START: WEITER', W / 2, 74, '#8e96b4'); textC(ctx, 'SELECT: FARBMODUS', W / 2, 84, '#8e96b4'); }
}
function wrap(s, n) { const out = []; let l = ''; s.split(' ').forEach(w => { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); }); if (l) out.push(l); return out; }
function dialog(name, s, t) {
  ctx.fillStyle = K; ctx.fillRect(4, 92, W - 8, 36); ctx.fillStyle = '#f0c838'; ctx.fillRect(4, 92, W - 8, 1); ctx.fillRect(4, 127, W - 8, 1); ctx.fillRect(4, 92, 1, 36); ctx.fillRect(W - 5, 92, 1, 36);
  text(ctx, name + ':', 9, 96, '#f0c838'); let n = Math.floor(t * 0.7); if (n < s.length && t % 3 === 0) AU.sfx('txt');
  wrap(s, 36).forEach((l, i) => { text(ctx, l.slice(0, Math.max(0, n)), 9, 105 + i * 7, WH); n -= l.length; });
}
function panel(lines, t, y0) { let n = Math.floor(t * 0.6); lines.forEach((l, i) => { textC(ctx, l.slice(0, Math.max(0, n)) + ' '.repeat(Math.max(0, l.length - Math.max(0, n))), W / 2, y0 + i * 9, l === 'ENDE' ? '#f0c838' : WH); n -= l.length; }); return n < 0; }
function starsBg(c1, c2) { ctx.fillStyle = c1; ctx.fillRect(0, 0, W, H); ctx.fillStyle = c2; for (let i = 0; i < 40; i++) ctx.fillRect((i * 53 + (G.t >> 2) * (1 + i % 3)) % W, (i * 37) % H, 1, 1); }
function drawTitle() {
  const b = TITLEBG || (TITLEBG = buildBG('alley')); ctx.drawImage(b.far, -((G.t >> 3) % BGW), 0); ctx.drawImage(b.far, BGW - ((G.t >> 3) % BGW), 0);
  for (let x = 0; x < W; x += 32) ctx.drawImage(b.fl, x, GY);
  ctx.fillStyle = 'rgba(20,10,40,0.45)'; ctx.fillRect(0, 0, W, 62);
  const y = 10 + Math.round(Math.sin(G.t / 30) * 1.5);
  textO(ctx, 'PFOTEN', 21, y + 2, '#5c2e78', 5); textO(ctx, 'PFOTEN', 20, y, '#f0c838', 5);
  textO(ctx, 'FAUST', 31, y + 30, '#5c2e78', 5); textO(ctx, 'FAUST', 30, y + 28, '#f6f0dc', 5);
  textCO(ctx, 'DIE HUNDE VON WUFFINGEN', W / 2, 66, '#f09aa8');
  const w = (G.t >> 3) & 3; spr(ctx, SPECS.bruno.F.idle[(G.t >> 4) & 1], 30, GY, 1); spr(ctx, SPECS.rex.F[G.t % 240 < 30 ? 'atk1' : 'idle'][G.t % 240 < 30 ? 1 : (G.t >> 4) & 1], 52, GY, 1); spr(ctx, SPECS.lotte.F.win[(G.t >> 3) & 1], 72, GY, 1);
  spr(ctx, SPECS.thug.F.walk[w], 112, GY, -1); spr(ctx, SPECS.jumper.F.idle[(G.t >> 4) & 1], 130, GY, -1); spr(ctx, SPECS.baron.F.idle[(G.t >> 4) & 1], 148, GY - 0, -1);
  if (G.saved > 0) { textCO(ctx, (G.menu === 0 ? '> ' : '  ') + 'NEUES SPIEL', W / 2, 76, G.menu === 0 ? WH : '#8e96b4'); textCO(ctx, (G.menu === 1 ? '> ' : '  ') + 'WEITER: LEVEL ' + (G.saved + 1), W / 2, 84, G.menu === 1 ? WH : '#8e96b4'); }
  else if (G.t & 32) textCO(ctx, 'START DRÜCKEN', W / 2, 80, WH);
  text(ctx, 'HI ' + String(G.hi).padStart(6, '0'), 2, H - 7, '#8e96b4'); text(ctx, 'SELECT: FARBE', W - 53, H - 7, '#8e96b4');
}
let TITLEBG = null;
function drawPick() {
  starsBg('#1a1638', '#463270'); textCO(ctx, G.pickNext === 'play' ? 'WER SPRINGT EIN?' : 'WÄHLE DEINEN HUND', W / 2, 8, '#f0c838');
  DOGS.forEach((d, i) => {
    const x = 28 + i * 52, S = SPECS[d.id], sel = i === G.sel;
    ctx.fillStyle = sel ? '#5c2e78' : '#2a2250'; ctx.fillRect(x - 22, 22, 44, 62); if (sel) { ctx.fillStyle = '#f0c838'; ctx.fillRect(x - 22, 22, 44, 1); ctx.fillRect(x - 22, 83, 44, 1); ctx.fillRect(x - 22, 22, 1, 62); ctx.fillRect(x + 21, 22, 1, 62); }
    ctx.fillStyle = '#3c2e68'; ctx.fillRect(x - 14, 66, 28, 3);
    if (G.out[i]) { ctx.globalAlpha = 0.45; spr(ctx, S.F.ko[0], x, 66, 1); ctx.globalAlpha = 1; textC(ctx, 'K.O.', x, 36, '#e0483a'); }
    else spr(ctx, sel ? S.F.win[(G.t >> 3) & 1] : S.F.idle[(G.t >> 4) & 1], x, 66, 1);
    textC(ctx, d.name, x, 73, sel ? WH : '#8e96b4'); if (!G.out[i]) bar(x - 12, 79, 24, G.hp[i], d.hp, '#e0483a', '#4a1c28');
  });
  const d = DOGS[G.sel]; textC(ctx, 'WAFFE: ' + d.sub, W / 2, 92, WH);
  ['KRAFT', 'TEMPO', 'LEBEN'].forEach((n, i) => { text(ctx, n, 38, 102 + i * 8, '#f09aa8'); for (let k = 0; k < 5; k++) { ctx.fillStyle = k < d.st[i] ? '#f0c838' : '#3c2e68'; ctx.fillRect(66 + k * 11, 102 + i * 8, 9, 5); } });
  if (G.t & 32) textC(ctx, '< > WÄHLEN   A: LOS!', W / 2, 132, '#8e96b4');
}
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  switch (G.scr) {
    case 'title': drawTitle(); break;
    case 'story': starsBg('#120e28', '#3c2e68'); { const sp = [SPECS.baron, SPECS.thug, SPECS.baron, SPECS.rex][G.page];
      if (G.page === 3) { spr(ctx, SPECS.bruno.F.idle[0], 58, 56, 1); spr(ctx, SPECS.rex.F.win[(G.t >> 3) & 1], 80, 56, 1); spr(ctx, SPECS.lotte.F.idle[1], 100, 56, 1); }
      else if (G.page === 0) { sprC(ctx, SPR.gold, W / 2, 40 + Math.sin(G.t / 12) * 3); if (G.t & 8) sprC(ctx, SPR.star[0], W / 2 + 8, 34); }
      else spr(ctx, sp.F[G.page === 2 ? 'win' : 'walk'][(G.t >> 3) & 1], W / 2, 58, G.page === 1 ? -1 : 1);
      panel(STORY[G.page], G.t, 72); if (G.t & 32) text(ctx, 'A >', W - 16, H - 9, '#f0c838'); text(ctx, 'START: ÜBERSPRINGEN', 3, H - 9, '#5a6082'); } break;
    case 'pick': drawPick(); break;
    case 'intro': ctx.fillStyle = K; ctx.fillRect(0, 0, W, H); textC(ctx, 'LEVEL ' + (G.lvl + 1), W / 2, 44, '#f09aa8', 2); textC(ctx, L.d.name, W / 2, 66, WH, L.d.name.length > 12 ? 1 : 2);
      spr(ctx, SPECS[DOGS[G.cur].id].F.walk[(G.t >> 3) & 3], 20 + G.t, 112, 1); textC(ctx, 'BOSS: ' + BOSS[L.d.boss].name, W / 2, 124, '#8e96b4'); break;
    case 'play': drawWorld(); drawHUD(); break;
    case 'clear': starsBg('#1a1638', '#463270'); textCO(ctx, 'LEVEL ' + (G.lvl + 1) + ' GESCHAFFT!', W / 2, 12, '#f0c838', 1);
      DOGS.forEach((d, i) => spr(ctx, SPECS[d.id].F.win[((G.t >> 3) + i) & 1], 56 + i * 24, 54, 1));
      textC(ctx, 'LEBENS-BONUS  +' + G.bonus, W / 2, 62, WH); textC(ctx, 'PUNKTE  ' + G.score, W / 2, 71, WH);
      panel(AFTER[G.lvl], Math.max(0, G.t - 30), 88); if (G.t > 60 && (G.t & 32)) textC(ctx, 'A: WEITER', W / 2, 130, '#f0c838'); break;
    case 'over': ctx.fillStyle = '#14081a'; ctx.fillRect(0, 0, W, H); textC(ctx, 'GAME OVER', W / 2, 30, '#e0483a', 3); spr(ctx, SPECS.baron.F.win[(G.t >> 3) & 1], W / 2, 92, 1);
      textC(ctx, "'HRR HRR HRR! BRAVE HÜNDCHEN.'", W / 2, 100, '#f09aa8'); if (G.t > 60 && (G.t & 32)) textC(ctx, 'A: NOCHMAL VERSUCHEN', W / 2, 120, WH); break;
    case 'ending': starsBg('#2a1638', '#8a4aa8');
      if (G.page === 0) spr(ctx, SPECS.baron.F.pant[(G.t >> 4) & 1], W / 2, 56, 1);
      else if (G.page === 3) { sprC(ctx, SPR.gold, W / 2, 30 + Math.sin(G.t / 12) * 3); textC(ctx, 'PUNKTE ' + G.score, W / 2, 118, '#f0c838'); }
      else { DOGS.forEach((d, i) => spr(ctx, SPECS[d.id].F.win[((G.t >> 3) + i) & 1], 40 + i * 22, 56, 1)); spr(ctx, SPECS.baron.F[G.page === 2 ? 'win' : 'idle'][(G.t >> 3) & 1], 124, 56, -1); }
      panel(ENDING[G.page], G.t, 70); if (G.t > 50 && (G.t & 32)) text(ctx, 'A >', W - 16, H - 9, '#f0c838'); break;
  }
  if (G.dmg) { const im = ctx.getImageData(0, 0, W, H), d = im.data, pal = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]];
    for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15, c = pal[l < 48 ? 0 : l < 105 ? 1 : l < 170 ? 2 : 3]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
    ctx.putImageData(im, 0, 0); }
}

// ---------- Start ----------
defSpecs(); defSprites(); bindTouch();
let last = 0, acc = 0;
function loop(ts) { acc += Math.min(100, ts - last); last = ts; let n = 0; while (acc >= 1000 / 60 && n++ < 5) { update(); acc -= 1000 / 60; } if (n > 4) acc = 0; draw(); requestAnimationFrame(loop); }
requestAnimationFrame(ts => { last = ts; loop(ts); });
window.__G = { G, step: n => { for (let i = 0; i < n; i++) update(); draw(); }, key, get P() { return P; }, get L() { return L; }, get en() { return en; } };
