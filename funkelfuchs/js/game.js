// FUNKELFUCHS – Spiellogik: Physik, Gegner, Boss, Kamera, Menüs
'use strict';
const cv = document.getElementById('scr'), ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;

// ---------- Eingabe ----------
const key = {}, prev = {}, JP = {};
const KM = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down',
  k: 'a', x: 'a', ' ': 'a', j: 'b', z: 'b', y: 'b', c: 'b', Enter: 'start', p: 'start', Shift: 'select', m: 'select' };
addEventListener('keydown', e => { const k = KM[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k) { key[k] = 1; e.preventDefault(); AU.init(); } });
addEventListener('keyup', e => { const k = KM[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k) key[k] = 0; });
function bindTouch() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k, on = e => { e.preventDefault(); key[k] = 1; el.classList.add('on'); AU.init(); }, off = e => { e.preventDefault(); key[k] = 0; el.classList.remove('on'); };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  });
  const dp = document.getElementById('dpad'); let pid = null;
  const set = e => { const r = dp.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    key.left = x < -0.1 ? 1 : 0; key.right = x > 0.1 ? 1 : 0; key.up = y < -0.28 ? 1 : 0; key.down = y > 0.28 ? 1 : 0; };
  const clr = () => { key.left = key.right = key.up = key.down = 0; pid = null; };
  dp.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { dp.setPointerCapture(pid); } catch (x) { } set(e); AU.init(); });
  dp.addEventListener('pointermove', e => { if (e.pointerId === pid) { e.preventDefault(); set(e); } });
  dp.addEventListener('pointerup', clr); dp.addEventListener('pointercancel', clr);
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
}
function pollInput() { for (const k of ['left', 'right', 'up', 'down', 'a', 'b', 'start', 'select']) { JP[k] = key[k] && !prev[k]; prev[k] = key[k]; } }
const buzz = n => { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) { } };

// ---------- Zustand ----------
const SAVE_KEY = 'funkelfuchs2';
const NL = LEVELS.length;
let save = { un: 0, sh: LEVELS.map(() => 0), done: 0 };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.sh) { save = s; while (save.sh.length < NL) save.sh.push(0); } } catch (e) { }
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } };
const bits = n => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };
const G = { st: 'title', t: 0, lvl: 0, lives: 3, coins: 0, score: 0, sel: 0, pause: false, cards: null, ci: 0, after: null };
let L = null, TL = null, E = [], P = null, parts = [], floats = [], bumps = [], checkpoint = null, gotSh = 0, bossOn = null;
const BG = {}, cam = { x: 0, y: 0 };
const SOL = { '#': 1, S: 1, B: 1, '?': 1, H: 1, U: 1 };
const tile = (tx, ty) => tx < 0 || tx >= L.W ? '#' : ty < 0 || ty >= L.H ? ' ' : L.t[ty][tx];
const ov = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const rnd = (a, b) => a + Math.random() * (b - a);
const STORY = {
  intro: [
    { th: 'meadow', pic: 'fox', l: ['IM FUNKELTAL LEUCHTET JEDE NACHT', 'DIE GROSSE MONDLATERNE.', 'IHR LICHT LÄSST DIE FUNKEL', 'VOM HIMMEL TANZEN.'] },
    { th: 'night', pic: 'boss', l: ['DOCH HEUTE BLEIBT ES DUNKEL.', 'GRUMMEL, DIE GEWITTERWOLKE, HAT', 'DIE LATERNE ZERBROCHEN UND IHRE', 'MONDSCHERBEN IM TAL VERSTREUT.'] },
    { th: 'meadow', pic: 'umb', l: ['FENNA SCHNAPPT SICH OMAS', 'ALTEN REGENSCHIRM.', '', "'NA WARTE, GRUMMEL!'", 'AUF ZUM MONDTURM!'] }],
  end: [
    { th: 'night', pic: 'boss', l: ['GRUMMEL PLUMPST AUF DEN TURM', "UND SCHNIEFT. 'ALLE MÖGEN DAS", 'MONDLICHT. MICH MAG KEINER.', "ICH WOLLTE AUCH MAL LEUCHTEN.'"] },
    { th: 'night', pic: 'umb', l: ['FENNA SPANNT DEN SCHIRM AUF', 'UND SETZT SICH DANEBEN.', '', "'OHNE REGEN GÄBE ES IM TAL", "KEINE EINZIGE BLUME, GRUMMEL.'"] },
    { th: 'meadow', pic: 'lamp', l: ['SEITDEM GIESST GRUMMEL JEDEN', 'MORGEN DIE WIESEN - UND NACHTS', 'PUTZT ER DIE MONDLATERNE, BIS SIE', 'HELLER FUNKELT ALS JE ZUVOR.'] },
    { th: 'meadow', pic: 'fox', l: ['ENDE', '', 'DANKE FÜRS SPIELEN!', '', 'FINDEST DU ALLE 24 MONDSCHERBEN?'] }]
};
const HINTS = [[4, 'A: SPRINGEN   B HALTEN: RENNEN'], [21, 'IN DER LUFT A HALTEN: SCHIRM'], [44, 'B: SCHWEIFWIRBEL'], [56, 'KNACK DIE KISTEN!']];

// ---------- Level laden ----------
function spawn(d) {
  const e = Object.assign({ vx: 0, vy: 0, t: 0, dir: -1 }, d), cb = d.y + TS; // cb = Unterkante der Zelle
  switch (d.k) {
    case 'coin': e.w = 10; e.h = 10; break;
    case 'shard': if (gotSh & (1 << d.id)) return null; e.w = 14; e.h = 14; e.old = save.sh[L.i] & (1 << d.id); break;
    case 'knurps': case 'piek': case 'nuss': e.w = 14; e.h = 12; e.x += 1; e.y = cb - 12; e.foe = 1; break;
    case 'hopsi': e.w = 14; e.h = 10; e.x += 1; e.y = cb - 10; e.foe = 1; e.wait = 60; break;
    case 'spucker': e.w = 12; e.h = 14; e.x += 2; e.y = cb - 14; e.foe = 1; e.t = 60; break;
    case 'flatter': e.w = 14; e.h = 9; e.x += 1; e.bx = e.x; e.by = e.y; e.foe = 1; e.t = Math.floor(hash(d.x, d.y) * 200); break;
    case 'plat': e.w = d.w || 48; e.h = 8; e.bx = e.x; e.by = e.y; e.dx = e.dy = 0; break;
    case 'spring': e.w = 14; e.h = 10; e.x += 1; e.y = cb - 10; e.an = 0; break;
    case 'check': e.w = 10; e.h = 24; e.lit = checkpoint && checkpoint.x === e.x - 2; break;
    case 'goal': e.w = 20; e.h = 48; break;
    case 'boss': e.w = 48; e.h = 28; e.by = e.y; e.hp = 5; e.st = 'wait'; e.ph = 0; e.n = 0; e.foe = 0; break;
  }
  return e;
}
function loadLevel(i, keep) {
  G.lvl = i; if (!keep) { checkpoint = null; gotSh = 0; }
  L = buildLevel(i); TL = renderTiles(L); if (!BG[L.theme]) BG[L.theme] = makeBG(L.theme);
  E = []; parts = []; floats = []; bumps = []; bossOn = null;
  L.ents.forEach(d => { const e = spawn(d); if (e) E.push(e); });
  const s = checkpoint || L.start;
  P = { x: s.x, y: s.y, w: 10, h: 14, vx: 0, vy: 0, dir: 1, ground: false, hp: 3, inv: 0, coy: 0, buf: 0, glide: false, jumped: false, sw: 0, swCd: 0, kb: 0, drop: 0, ride: null, anim: 0, combo: 0, dead: 0, t: 0, pb: 0, win: 0 };
  cam.x = Math.max(0, Math.min(L.W * TS - VW, P.x - 100)); cam.y = Math.max(0, Math.min(L.H * TS - VH, P.y - 106));
  AU.music(L.music);
}
function startLevel(i, keep) { loadLevel(i, keep); G.st = 'card'; G.t = 0; }

// ---------- Effekte ----------
function puff(x, y, n, c, sp, life) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: rnd(-1, 1) * (sp || 1), vy: rnd(-1, 1) * (sp || 1), t: 0, max: (life || 18) + rnd(0, 8), c, sz: Math.random() < 0.5 ? 2 : 1, g: 0 }); }
function sparkle(x, y, n) { for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-0.4, 0.4), vy: rnd(-0.9, -0.1), t: 0, max: 20 + rnd(0, 12), c: Math.random() < 0.5 ? '#ffffff' : '#ffd850', star: 1, g: 0 }); }
function debris(x, y) { for (let i = 0; i < 6; i++) parts.push({ x: x + rnd(2, 14), y: y + rnd(2, 14), vx: rnd(-1.6, 1.6), vy: rnd(-3.4, -1), t: 0, max: 40, c: i % 2 ? PAL.n : PAL.a, sz: 3, g: 0.22 }); }
function float(x, y, s) { floats.push({ x, y, s, t: 0 }); }
function addCoin(n) { G.coins += n || 1; G.score += 10; if (G.coins >= 100) { G.coins -= 100; G.lives++; AU.sfx('extra'); float(P.x, P.y - 10, '1UP'); } }
function coinPop(tx, ty) { addCoin(); AU.sfx('coin'); parts.push({ x: tx * TS + 3, y: ty * TS - 10, vx: 0, vy: -3.2, t: 0, max: 26, spr: SP.coin, g: 0.2 }); }
const COMBO = [100, 200, 400, 800, 1000];
function award(x, y, n) { if (n >= COMBO.length) { G.lives++; AU.sfx('extra'); float(x, y, '1UP'); } else { G.score += COMBO[n]; float(x, y, COMBO[n]); } }

// ---------- Kachel-Physik ----------
function mvX(e) {
  e.hitX = 0; e.x += e.vx; const y0 = Math.floor(e.y / TS), y1 = Math.floor((e.y + e.h - 0.01) / TS);
  if (e.vx > 0) { const tx = Math.floor((e.x + e.w - 0.01) / TS); for (let ty = y0; ty <= y1; ty++) if (SOL[tile(tx, ty)]) { e.x = tx * TS - e.w; e.hitX = 1; e.hitT = [tx, ty]; break; } }
  else if (e.vx < 0) { const tx = Math.floor(e.x / TS); for (let ty = y0; ty <= y1; ty++) if (SOL[tile(tx, ty)]) { e.x = (tx + 1) * TS; e.hitX = -1; e.hitT = [tx, ty]; break; } }
}
function mvY(e) {
  const oy = e.y; e.y += e.vy; e.ground = false; e.head = null; const x0 = Math.floor(e.x / TS), x1 = Math.floor((e.x + e.w - 0.01) / TS);
  if (e.vy >= 0) { const ty = Math.floor((e.y + e.h - 0.01) / TS);
    for (let tx = x0; tx <= x1; tx++) { const c = tile(tx, ty); if (SOL[c] || (c === '=' && oy + e.h <= ty * TS + 0.01 && !(e.drop > 0))) { e.y = ty * TS - e.h; e.vy = 0; e.ground = true; break; } } }
  else { const ty = Math.floor(e.y / TS), cx = Math.floor((e.x + e.w / 2) / TS); let hit = null;
    for (let tx = x0; tx <= x1; tx++) if (SOL[tile(tx, ty)] && (!hit || tx === cx)) hit = [tx, ty];
    if (hit) { e.y = (ty + 1) * TS; e.vy = 0; e.head = hit; } }
}
function hitBlock(tx, ty, quiet) {
  const c = tile(tx, ty);
  if (c === 'B') { L.t[ty][tx] = ' '; debris(tx * TS, ty * TS); AU.sfx('crack'); G.score += 10; if (hash(tx, ty) < 0.35) coinPop(tx, ty); }
  else if (c === '?' || c === 'H') { L.t[ty][tx] = 'U'; bumps.push({ tx, ty, t: 8 }); AU.sfx('bump');
    if (c === '?') coinPop(tx, ty); else E.push({ k: 'berry', x: tx * TS + 2, y: ty * TS - 12, w: 12, h: 11, vx: 0.6, vy: -2.6, t: 0, dir: 1 }); }
  else { if (!quiet && c !== '#') AU.sfx('bump'); return; }
  for (const e of E) if (e.foe && !e.dead && e.x + e.w > tx * TS && e.x < tx * TS + TS && Math.abs(e.y + e.h - ty * TS) < 3) knock(e, 0);
}
function knock(e, dir, n) { if (e.dead) return; e.dead = 1; e.vy = -3.6; e.vx = dir * 1.3; AU.sfx('kick'); award(e.x, e.y - 6, n || 0); puff(e.x + 7, e.y + 6, 5, '#ffffff', 1.2); }

// ---------- Spielerin ----------
function hurt() {
  if (P.inv > 0 || P.dead || P.win) return;
  P.hp--; buzz(60);
  if (P.hp <= 0) return die();
  P.inv = 110; P.vy = -3; P.vx = -P.dir * 1.8; P.kb = 12; P.glide = false; AU.sfx('hurt');
}
function die(pit) { if (P.dead) return; P.dead = 1; P.hp = 0; P.t = pit ? 40 : 0; P.vy = pit ? 0 : -6; P.vx = 0; AU.music(null); AU.sfx('die'); buzz(200); }
function afterDeath() { G.lives--; if (G.lives < 0) { G.st = 'over'; G.t = 0; AU.music('over'); } else startLevel(G.lvl, true); }
function kickNut(e) { e.vx = (P.x + P.w / 2 < e.x + e.w / 2 ? 1 : -1) * 3.2; e.grace = 16; e.combo = 0; AU.sfx('kick'); }
function stompFoe(e) {
  P.vy = key.a ? -5.8 : -3.8; P.jumped = true; P.glide = false; AU.sfx('stomp'); puff(e.x + e.w / 2, e.y, 4, '#ffffff', 1);
  if (e.k === 'nuss') { if (!e.nut) { e.nut = 1; e.vx = 0; award(e.x, e.y - 6, P.combo++); } else if (e.vx) e.vx = 0; else kickNut(e); e.grace = 16; return; }
  award(e.x, e.y - 6, P.combo++);
  if (e.k === 'knurps') { e.sq = 26; e.foe = 0; } else { e.dead = 1; e.vy = 0; e.vx = 0; }
}
function updPlayer() {
  const p = P;
  if (p.dead) { p.t++; if (p.t > 16) { p.vy += 0.3; p.y += p.vy; } if (p.t > 110) afterDeath(); return; }
  if (p.win) { p.win++; p.vx *= 0.8; p.vy = Math.min(p.vy + 0.38, 5.5); mvX(p); mvY(p); if (p.ground && p.win < 70 && p.win % 24 === 1) p.vy = -3.4; return; }
  if (p.inv > 0) p.inv--; if (p.swCd > 0) p.swCd--; if (p.sw > 0) p.sw--; if (p.drop > 0) p.drop--;
  // Mitfahren auf Plattformen
  if (p.ride) { const r = p.ride; if (r.rm || p.x + p.w <= r.x || p.x >= r.x + r.w) p.ride = null; else { p.x += r.dx; p.y = r.y - p.h; } }
  const run = key.b, ax = p.ground ? 0.16 : 0.11, max = p.glide ? 1.9 : run ? 2.5 : 1.5;
  let d = (key.right ? 1 : 0) - (key.left ? 1 : 0);
  if (p.kb > 0) { p.kb--; d = 0; }
  if (d) { if (p.ground && p.vx * d < -1) { if (G.t % 4 === 0) puff(p.x + 5, p.y + p.h, 1, '#fff8e8', 0.4); } p.vx += d * ax * (p.vx * d < 0 ? 2 : 1); if (Math.abs(p.vx) > max) p.vx -= Math.sign(p.vx) * Math.min(0.12, Math.abs(p.vx) - max); p.dir = d; }
  else { p.vx *= p.ground ? 0.8 : 0.97; if (Math.abs(p.vx) < 0.05) p.vx = 0; }
  // Sprung
  if (p.ground) { p.coy = 7; p.combo = 0; } else p.coy--;
  if (JP.a) p.buf = 7; else p.buf--;
  if (p.buf > 0 && p.coy > 0) {
    const fy = Math.floor((p.y + p.h + 1) / TS), a = tile(Math.floor(p.x / TS), fy), b = tile(Math.floor((p.x + p.w - 0.01) / TS), fy);
    if (key.down && !p.ride && !SOL[a] && !SOL[b] && (a === '=' || b === '=')) { p.drop = 10; p.y += 1; p.buf = 0; p.coy = 0; }
    else { p.vy = -(5.75 + Math.abs(p.vx) * 0.22); p.coy = 0; p.buf = 0; p.ride = null; p.jumped = true; p.glide = false; AU.sfx('jump'); puff(p.x + 5, p.y + p.h, 3, '#fff8e8', 0.5); }
  } else if (JP.a && !p.ground && !p.ride) { p.glide = true; AU.sfx('glide'); }
  if (!key.a) p.glide = false;
  // Schweifwirbel
  if (JP.b && p.swCd <= 0) { p.sw = 16; p.swCd = 28; AU.sfx('swipe'); }
  if (p.sw > 0) { const hb = { x: p.x - 12, y: p.y - 2, w: p.w + 24, h: p.h + 3 };
    for (const e of E) { if (!e.foe || e.dead || !ov(hb, e)) continue;
      if (e.k === 'nuss' && e.nut) { if (!e.vx && !(e.grace > 0)) kickNut(e); } else if (e.k !== 'bolt') knock(e, p.x < e.x ? 1 : -1); }
    if (p.sw === 12) for (const sx of [hb.x, hb.x + hb.w]) for (const sy of [p.y + 2, p.y + p.h - 3]) if (tile(Math.floor(sx / TS), Math.floor(sy / TS)) === 'B') hitBlock(Math.floor(sx / TS), Math.floor(sy / TS)); }
  // Schwerkraft
  p.vy += p.vy < 0 ? (key.a || !p.jumped ? 0.3 : 0.9) : 0.38;
  if (p.glide && p.vy > 0.9) p.vy = Math.max(0.9, p.vy - 0.6);
  if (p.vy > 5.5) p.vy = 5.5;
  p.pb = p.y + p.h;
  mvX(p); mvY(p);
  if (p.head) hitBlock(p.head[0], p.head[1]);
  // Plattformen (von oben betretbar)
  if (p.vy >= 0 && !p.ground) for (const e of E) { if (e.k !== 'plat') continue;
    if (p.x + p.w > e.x && p.x < e.x + e.w && p.pb <= Math.max(e.y, e.y - e.dy) + 1.5 && p.y + p.h >= e.y) { p.y = e.y - p.h; p.vy = 0; p.ground = true; p.ride = e; if (e.mode === 'f' && !e.fall) e.fall = 1; break; } }
  if (!p.ground) p.ride = null; else if (p.ride && !(p.x + p.w > p.ride.x && p.x < p.ride.x + p.ride.w)) p.ride = null;
  if (p.ground) { p.glide = false; p.jumped = false; }
  if (bossOn) p.x = Math.max(bossOn.ax, Math.min(bossOn.ax + bossOn.aw - p.w, p.x));
  p.anim += Math.abs(p.vx);
  // Dornen
  for (let tx = Math.floor((p.x + 2) / TS); tx <= Math.floor((p.x + p.w - 2) / TS); tx++) { const ty = Math.floor((p.y + p.h - 1) / TS); if (tile(tx, ty) === '^' && p.y + p.h > ty * TS + 10) hurt(); }
  if (p.y > L.H * TS + 24) die(true);
  // Begegnungen
  for (const e of E) {
    if (e.dead || e.rm || !ov(p, e)) continue;
    switch (e.k) {
      case 'coin': e.rm = 1; addCoin(); AU.sfx('coin'); sparkle(e.x + 5, e.y + 5, 3); break;
      case 'shard': e.rm = 1; gotSh |= 1 << e.id; G.score += 1000; AU.sfx('shard'); sparkle(e.x + 7, e.y + 7, 14); float(e.x, e.y - 6, 1000); break;
      case 'berry': e.rm = 1; AU.sfx('berry'); if (p.hp < 3) p.hp++; else { G.score += 500; float(e.x, e.y - 6, 500); } sparkle(e.x + 6, e.y + 5, 6); break;
      case 'check': if (!e.lit) { e.lit = 1; checkpoint = { x: e.x - 2, y: e.y + e.h - 14 }; AU.sfx('check'); sparkle(e.x + 5, e.y + 5, 10); } break;
      case 'goal': if (!p.win) { p.win = 1; e.lit = 1; G.st = 'clear'; G.t = 0; AU.music('win'); sparkle(e.x + 10, e.y + 12, 24); } break;
      case 'spring': if (p.vy > 0 && p.pb <= e.y + 7) { p.vy = -8.7; p.jumped = false; p.glide = false; e.an = 14; AU.sfx('spring'); } break;
      default:
        if (!e.foe) break;
        if (e.k === 'nuss' && e.nut && !e.vx && !(e.grace > 0) && !(p.vy > 0.2 && p.pb <= e.y + 7)) { kickNut(e); break; }
        if (p.vy > 0.2 && p.pb <= e.y + 7 && e.k !== 'piek' && e.k !== 'seed' && e.k !== 'bolt') stompFoe(e);
        else if (!(e.k === 'nuss' && e.nut && (e.grace > 0 || !e.vx))) hurt();
    }
  }
}

// ---------- Gegner & Objekte ----------
function walker(e, sp, edge) {
  e.vy = Math.min(e.vy + 0.35, 5); e.vx = e.dir * sp; mvX(e); if (e.hitX) e.dir = -e.dir; mvY(e);
  if (edge && e.ground) { const fx = e.dir > 0 ? e.x + e.w + 1 : e.x - 1, c = tile(Math.floor(fx / TS), Math.floor((e.y + e.h + 2) / TS)); if (!SOL[c] && c !== '=') e.dir = -e.dir; }
}
function updEnt(e) {
  if (e.dead) { e.vy += 0.3; e.x += e.vx; e.y += e.vy; if (e.y > cam.y + VH + 40) e.rm = 1; return; }
  if (e.k === 'plat') { e.t++; const px = e.x, py = e.y, s = 0.5 - 0.5 * Math.cos(G.lt * 0.022);
    if (e.mode === 'h') e.x = e.bx + e.range * s; else if (e.mode === 'v') e.y = e.by - e.range * s;
    else if (e.fall) { e.fall++; if (e.fall > 26) { e.vy = Math.min(e.vy + 0.14, 4); e.y += e.vy; } else e.x = e.bx + (e.fall % 4 < 2 ? 1 : -1); if (e.fall > 260) { e.fall = 0; e.vy = 0; e.y = e.by; e.x = e.bx; puff(e.x + e.w / 2, e.y + 4, 8, '#ffffff', 1.5); } }
    e.dx = e.x - px; e.dy = e.y - py; return; }
  if (e.k === 'boss') return updBoss(e);
  if (e.x < cam.x - 90 || e.x > cam.x + VW + 90) return;
  e.t++; if (e.grace > 0) e.grace--;
  switch (e.k) {
    case 'knurps': if (e.sq) { if (--e.sq <= 0) e.rm = 1; } else walker(e, 0.5, false); break;
    case 'piek': walker(e, 0.4, true); break;
    case 'nuss':
      if (!e.nut) walker(e, 0.6, true);
      else { e.vy = Math.min(e.vy + 0.35, 5); mvX(e); if (e.hitX) { hitBlock(e.hitT[0], e.hitT[1], true); e.vx = -e.vx; AU.sfx('bump'); } mvY(e);
        if (e.vx) for (const f of E) if (f !== e && f.foe && !f.dead && f.k !== 'bolt' && ov(e, f)) knock(f, Math.sign(e.vx), ++e.combo); }
      break;
    case 'hopsi': e.vy = Math.min(e.vy + 0.3, 5); if (e.ground) { e.vx = 0; if (e.t > e.wait) { e.dir = P.x < e.x ? -1 : 1; e.vy = -4.6; e.vx = e.dir * 1.1; e.t = 0; e.wait = 45 + Math.random() * 45; } } mvX(e); if (e.hitX) e.vx = 0; mvY(e); break;
    case 'spucker': e.dir = P.x < e.x ? -1 : 1; if (e.t > 130 && Math.abs(P.x - e.x) < 150) { e.t = 0; AU.sfx('spit'); E.push({ k: 'seed', x: e.x + (e.dir > 0 ? 12 : -6), y: e.y + 3, w: 6, h: 6, vx: e.dir * 1.7, vy: 0, t: 0, foe: 1, dir: e.dir }); } break;
    case 'seed': e.x += e.vx; if (e.t > 220 || SOL[tile(Math.floor((e.x + 3) / TS), Math.floor((e.y + 3) / TS))]) { e.rm = 1; puff(e.x + 3, e.y + 3, 4, PAL.g, 1); } break;
    case 'flatter': e.x = e.bx + Math.sin(e.t * 0.025) * 40; e.y = e.by + Math.sin(e.t * 0.08) * 8; e.dir = Math.cos(e.t * 0.025) > 0 ? 1 : -1; break;
    case 'berry': e.vy = Math.min(e.vy + 0.25, 4); e.vx = e.dir * 0.6; mvX(e); if (e.hitX) e.dir = -e.dir; mvY(e); break;
    case 'bolt': e.vy = Math.min(e.vy + 0.12, 3.2); e.y += e.vy; if (e.y + e.h >= e.gy) { e.rm = 1; puff(e.x + 3, e.gy - 2, 8, '#ffe870', 1.6); AU.sfx('crack'); } break;
    case 'spring': if (e.an > 0) e.an--; break;
  }
  if (e.y > L.H * TS + 60) e.rm = 1;
}
function updBoss(e) {
  const p = P, mid = e.ax + e.aw / 2, span = e.aw - 32 - e.w;
  if (e.st === 'wait') { if (p.x > e.ax + 28) { e.st = 'intro'; e.t = 0; bossOn = e; AU.music('boss'); AU.sfx('roar'); } return; }
  e.t++; if (e.flash > 0) e.flash--;
  const spd = 1 + (5 - e.hp) * 0.17, toHover = () => { e.st = 'hover'; e.t = 1; e.n = 0; e.ph = Math.acos(1 - 2 * Math.max(0, Math.min(1, (e.x - e.ax - 16) / span))); };
  if (e.st === 'intro') { if (e.t > 80) toHover(); }
  else if (e.st === 'hover') { e.ph += 0.02 * spd; e.x = e.ax + 16 + span * (0.5 - 0.5 * Math.cos(e.ph)); e.y += (e.by + Math.sin(e.t * 0.07) * 4 - e.y) * 0.1;
    if (e.t % Math.round(58 / spd) === 0) { if (e.n >= (e.hp <= 2 ? 4 : 3)) { e.st = 'tele'; e.t = 0; } else { e.n++; AU.sfx('bolt');
      for (const o of e.hp <= 2 ? [-12, 12] : [0]) E.push({ k: 'bolt', x: e.x + e.w / 2 - 3 + o, y: e.y + e.h - 6, w: 6, h: 9, vx: 0, vy: 0.4, t: 0, foe: 1, gy: e.gy }); } } }
  else if (e.st === 'tele') { if (e.t > 44) { e.st = 'dive'; e.t = 0; e.sx = e.x; e.tx = e.x + e.w / 2 < mid ? e.ax + e.aw - 16 - e.w : e.ax + 16; AU.sfx('roar'); } }
  else if (e.st === 'dive') { const u = Math.min(1, e.t / (140 / spd)); e.x = e.sx + (e.tx - e.sx) * u; e.y = e.by + (e.gy - e.h - 8 - e.by) * Math.sin(Math.PI * u); if (u >= 1) toHover(); }
  else if (e.st === 'stun') { e.y += (e.by - e.y) * 0.06; if (e.t > 60) toHover(); }
  else if (e.st === 'dead') { e.y += 0.25; if (e.t % 6 === 0) { puff(e.x + rnd(0, e.w), e.y + rnd(0, e.h), 6, '#ffffff', 1.5); sparkle(e.x + rnd(0, e.w), e.y + rnd(0, e.h), 3); } if (e.t % 20 === 0) AU.sfx('crack');
    if (e.t > 150) { save.un = Math.max(save.un, NL - 1); save.sh[G.lvl] |= gotSh; save.done = 1; persist(); G.st = 'story'; G.cards = STORY.end; G.ci = 0; G.t = 0; G.after = 'title'; AU.music('title'); } return; }
  if (ov(p, e) && !p.dead) {
    if (p.vy > 0 && p.pb <= e.y + 12 && e.st !== 'stun') { e.hp--; e.flash = 24; p.vy = key.a ? -6 : -4.6; p.jumped = true; p.glide = false; AU.sfx('bosshit'); buzz(80); puff(p.x + 5, p.y + p.h, 10, '#ffffff', 2); G.score += 1000;
      if (e.hp <= 0) { e.st = 'dead'; e.t = 0; AU.music(null); AU.sfx('boom'); E.forEach(f => { if (f.k === 'bolt') f.rm = 1; }); G.score += 5000; } else { e.st = 'stun'; e.t = 0; } }
    else if (e.st !== 'stun' && e.st !== 'intro') hurt();
  }
}

// ---------- Schritt ----------
function stepPlay() {
  G.lt = (G.lt || 0) + 1;
  for (const e of E) if (e.k === 'plat') updEnt(e);
  updPlayer();
  if (G.st !== 'play' && G.st !== 'clear') return;
  for (const e of E) if (e.k !== 'plat') updEnt(e);
  E = E.filter(e => !e.rm);
  for (const q of parts) { q.t++; q.vy += q.g; q.x += q.vx; q.y += q.vy; } parts = parts.filter(q => q.t < q.max);
  for (const f of floats) { f.t++; f.y -= 0.5; } floats = floats.filter(f => f.t < 40);
  for (const b of bumps) b.t--; bumps = bumps.filter(b => b.t > 0);
  // Kamera
  let tx = P.x + 5 - VW / 2 + P.dir * 22, ty = P.y - 106, lo = 0, hi = L.W * TS - VW;
  if (bossOn) { lo = bossOn.ax - 16; hi = bossOn.ax + bossOn.aw + 16 - VW; }
  if (!P.dead) { cam.x += (Math.max(lo, Math.min(hi, tx)) - cam.x) * 0.09; cam.y += (Math.max(0, Math.min(L.H * TS - VH, ty)) - cam.y) * 0.08; }
}
function step() {
  pollInput(); G.t++;
  if (JP.select) { AU.setMute(!AU.muted); }
  switch (G.st) {
    case 'title':
      if (!L) { loadLevel(0); AU.music('title'); }
      cam.x = (G.t * 0.35) % (L.W * TS - VW); cam.y = 64;
      if (save.un > 0) { if (JP.right) { G.sel = Math.min(save.un, G.sel + 1); AU.sfx('sel'); } if (JP.left) { G.sel = Math.max(0, G.sel - 1); AU.sfx('sel'); } }
      if (JP.a || JP.start) { AU.sfx('ok'); G.lives = 3; G.coins = 0; G.score = 0;
        if (G.sel === 0) { G.st = 'story'; G.cards = STORY.intro; G.ci = 0; G.t = 0; G.after = 'level'; AU.music('title'); } else startLevel(G.sel); }
      break;
    case 'story':
      if ((JP.a || JP.start) && G.t > 12) { const full = G.cards[G.ci].l.join('').length; if (G.t * 0.8 < full) G.t = 9999; else { G.ci++; G.t = 0; AU.sfx('sel');
        if (G.ci >= G.cards.length) { if (G.after === 'level') startLevel(0); else { G.st = 'title'; G.t = 0; L = null; G.sel = 0; } } } }
      else if (G.t % 3 === 0 && G.t * 0.8 < G.cards[G.ci].l.join('').length) AU.sfx('txt');
      break;
    case 'card': if (G.t > 100 || (G.t > 20 && (JP.a || JP.start))) { G.st = 'play'; G.t = 0; } break;
    case 'play':
      if (JP.start) { G.pause = !G.pause; AU.sfx('sel'); }
      if (!G.pause) stepPlay();
      break;
    case 'clear':
      stepPlay();
      if (G.t === 1) { save.sh[G.lvl] |= gotSh; save.un = Math.max(save.un, Math.min(NL - 1, G.lvl + 1)); persist(); }
      if (G.t > 110 && (JP.a || JP.start)) { AU.sfx('ok'); startLevel(Math.min(NL - 1, G.lvl + 1)); }
      break;
    case 'over': if (G.t > 60 && (JP.a || JP.start)) { G.lives = 3; G.coins = 0; G.score = 0; startLevel(G.lvl); } break;
  }
}

// ---------- Zeichnen ----------
const D = (s, x, y, fl) => ctx.drawImage(fl ? s.l : s.r, Math.round(x), Math.round(y));
function drawBG(th, cx, cy) {
  const b = BG[th] || (BG[th] = makeBG(th));
  let o = -Math.floor(cx * 0.15) % b.BW; for (let x = o; x < VW; x += b.BW) ctx.drawImage(b.far, x, 0);
  o = -Math.floor(cx * 0.4) % b.BW; const ny = Math.round((64 - cy) * 0.25) - 8; for (let x = o; x < VW; x += b.BW) ctx.drawImage(b.near, x, ny);
}
function drawWorld() {
  const cx = Math.round(cam.x), cy = Math.round(cam.y);
  drawBG(L.theme, cam.x, cam.y);
  ctx.drawImage(TL, cx, cy, VW, VH, 0, 0, VW, VH);
  // bewegliche Kacheln
  for (let ty = Math.floor(cy / TS); ty <= Math.floor((cy + VH) / TS); ty++) for (let tx = Math.floor(cx / TS); tx <= Math.floor((cx + VW) / TS); tx++) {
    const c = tile(tx, ty); if (c !== 'B' && c !== '?' && c !== 'H' && c !== 'U') continue;
    let oy = 0; for (const b of bumps) if (b.tx === tx && b.ty === ty) oy = -Math.round(Math.sin(b.t / 8 * Math.PI) * 5);
    D(c === 'B' ? SP.crate : c === 'U' ? SP.used : (G.t >> 4) % 4 === 0 ? SP.bonus2 : SP.bonus, tx * TS - cx, ty * TS - cy + oy);
  }
  if (G.lvl === 0 && G.st !== 'title') for (const [hx, s] of HINTS) { const sx = hx * TS - cx; if (sx > -120 && sx < VW + 20) textCO(ctx, s, sx + 40, 30, '#ffffff', 1); }
  for (const e of E) { const x = e.x - cx, y = e.y - cy; if (x < -60 || x > VW + 20 || y < -60 || y > VH + 30) continue; drawEnt(e, x, y); }
  drawPlayer(cx, cy);
  for (const q of parts) { const x = Math.round(q.x - cx), y = Math.round(q.y - cy);
    if (q.spr) D(q.spr, x, y); else if (q.star) { ctx.fillStyle = q.c; const s = q.t < q.max * 0.6 ? 1 : 0; ctx.fillRect(x - s, y, 1 + s * 2, 1); ctx.fillRect(x, y - s, 1, 1 + s * 2); } else { ctx.fillStyle = q.c; ctx.fillRect(x, y, q.sz, q.sz); } }
  for (const f of floats) textO(ctx, f.s, f.x - cx, f.y - cy, f.s === '1UP' ? '#70f070' : '#ffffff', 1);
}
function drawEnt(e, x, y) {
  const t = G.t;
  if (e.dead) { ctx.drawImage(entSprite(e).u, Math.round(x - 1), Math.round(y)); return; }
  switch (e.k) {
    case 'coin': { const w = [10, 6, 2, 6][((t >> 3) + (e.x >> 4)) % 4]; ctx.drawImage(SP.coin.r, Math.round(x + (10 - w) / 2), Math.round(y + Math.sin(t * 0.08 + e.x) * 1.5), w, 10); break; }
    case 'shard': if (e.old) ctx.globalAlpha = 0.45; D(SP.shard, x, y + Math.sin(t * 0.06) * 3); ctx.globalAlpha = 1; if (t % 12 === 0 && !e.old) sparkle(e.x + 7, e.y + 7, 1); break;
    case 'berry': D(SP.berry, x, y); break;
    case 'knurps': if (e.sq) ctx.drawImage(SP.knurps.r, Math.round(x - 2), Math.round(y + 8), 18, 5); else D((e.t >> 3) % 2 ? SP.knurps : SP.knurps2, x - 1, y - 2, e.dir < 0); break;
    case 'piek': D(SP.piek, x - 1, y - 2 + ((e.t >> 4) % 2), e.dir < 0); break;
    case 'nuss': if (e.nut) { const s = e.vx && (e.t >> 2) % 2; ctx.drawImage(s ? SP.nut.u : SP.nut.r, Math.round(x - 1), Math.round(y)); } else D(SP.nuss, x - 1, y - 2 + ((e.t >> 3) % 2), e.dir > 0); break;
    case 'hopsi': if (e.ground) D(SP.hopsi, x - 1, y - 2 + (e.t > e.wait - 10 ? 1 : 0), e.dir > 0); else D(SP.hopsiJ, x - 1, y - 3, e.dir > 0); break;
    case 'spucker': D(SP.spuck, x - 2 + (e.t > 112 ? -e.dir : 0), y - 2, e.dir < 0); break;
    case 'seed': D(SP.seed, x, y); break;
    case 'flatter': D((e.t >> 3) % 2 ? SP.flatA : SP.flatB, x - 1, y - 1); break;
    case 'bolt': if ((t >> 1) % 2) D(SP.bolt, x, y, (t >> 2) % 2); else { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x + 2), Math.round(y), 2, 9); } break;
    case 'plat': { const c = THEMES[L.theme].cloudPlat; D(e.w === 32 ? (c ? SP.platCS : SP.platS) : (c ? SP.platC : SP.plat), x, y - 1); break; }
    case 'spring': if (e.an > 6) ctx.drawImage(SP.spring.r, Math.round(x - 1), Math.round(y + 2), 16, 8); else if (e.an > 0) ctx.drawImage(SP.spring.r, Math.round(x - 1), Math.round(y - 12), 16, 22); else D(SP.spring, x - 1, y - 6); break;
    case 'check': D(e.lit ? SP.lamp1 : SP.lamp0, x, y); if (e.lit && t % 16 === 0) sparkle(e.x + 5, e.y + 5, 1); break;
    case 'goal': ctx.drawImage((e.lit ? SP.lamp1 : SP.lamp0).r, Math.round(x), Math.round(y), 20, 48); if (!e.lit) textCO(ctx, 'ZIEL', x + 10, y - 9 + Math.sin(t * 0.1) * 2, '#ffd850', 1); else if (t % 6 === 0) sparkle(e.x + 10, e.y + 12, 2); break;
    case 'boss': drawBoss(e, x, y); break;
  }
}
function entSprite(e) { return { knurps: SP.knurps, piek: SP.piek, nuss: e.nut ? SP.nut : SP.nuss, hopsi: SP.hopsi, spucker: SP.spuck, flatter: SP.flatA, seed: SP.seed }[e.k] || SP.knurps; }
function drawBoss(e, x, y) {
  if (e.st === 'wait') return;
  let ox = 0; if (e.st === 'tele' || e.st === 'intro') ox = (G.t >> 1) % 2 ? 1 : -1; if (e.st === 'dead') ox = (G.t % 4 < 2 ? 2 : -2);
  x = Math.round(x - 2 + ox); y = Math.round(y - 4);
  D(e.flash > 0 && (G.t >> 1) % 2 ? SP.bossH : SP.boss, x, y);
  const K = PAL.k, ex = [x + 15, x + 30], ey = y + 16, R2 = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h); };
  const lx = Math.max(-1, Math.min(1, Math.round((P.x - e.x - 20) / 40))), sad = e.st === 'stun' || e.st === 'dead';
  for (const i of [0, 1]) { const a = ex[i];
    if (sad) { R2(a, ey + 1, 6, 1, K); R2(a + 1, ey, 1, 3, K); R2(a + 4, ey, 1, 3, K); }
    else { R2(a - 1, ey - 1, 8, 7, K); R2(a, ey, 6, 5, e.st === 'tele' || e.st === 'dive' ? '#ffe870' : '#ffffff'); R2(a + 2 + lx, ey + 2, 2, 3, K); for (let j = 0; j < 4; j++) R2(i ? a + 5 - j * 2 : a - 1 + j * 2, ey - 5 + j, 3, 2, K); } }
  if (sad) R2(x + 21, y + 26, 10, 2, K), R2(x + 20, y + 27, 2, 2, K), R2(x + 30, y + 27, 2, 2, K);
  else R2(x + 20, y + 26, 12, 2, K), R2(x + 22, y + 24, 2, 2, '#ffffff'), R2(x + 28, y + 24, 2, 2, '#ffffff');
  if (e.st === 'hover' && e.t % Math.round(58 / (1 + (5 - e.hp) * 0.17)) > 40 && (G.t >> 1) % 2) R2(x + 24, y + 31, 4, 3, '#ffe870');
}
function drawPlayer(cx, cy) {
  const p = P; if (p.inv > 0 && (G.t >> 1) % 2 && !p.dead) return;
  let s, fl = p.dir < 0;
  if (p.dead || p.kb > 0) s = SP.fox_hurt;
  else if (p.win) s = p.ground ? SP.fox_idle : SP.fox_jump;
  else if (!p.ground) s = p.vy < 0 ? SP.fox_jump : SP.fox_fall;
  else if (Math.abs(p.vx) > 0.25) s = [SP.fox_runA, SP.fox_idle, SP.fox_runB, SP.fox_idle][Math.floor(p.anim / 7) % 4];
  else s = SP.fox_idle;
  if (p.sw > 0) fl = (p.sw >> 2) % 2 ? !fl : fl;
  const x = Math.round(p.x - cx) - 3, y = Math.round(p.y - cy) - 4;
  if (p.glide && !p.dead) D(SP.umb, x + (fl ? -1 : 1), y - 8, fl);
  D(s, x, y, fl);
  if (p.sw > 0) { const a = (16 - p.sw) / 16, r = 13; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 9; i++) { const an = a * Math.PI * 4 - i * 0.22; ctx.fillRect(Math.round(x + 8 + Math.cos(an) * r), Math.round(y + 12 + Math.sin(an) * 4), i < 4 ? 2 : 1, i < 4 ? 2 : 1); } }
}
function drawHUD() {
  for (let i = 0; i < 3; i++) D(i < P.hp ? SP.heart : SP.heartE, 4 + i * 9, 4);
  const got = gotSh | save.sh[G.lvl]; for (let i = 0; i < 3; i++) D(got & (1 << i) ? SP.shardS : SP.shardE, 5 + i * 8, 14);
  D(SP.coin, 92, 3); textO(ctx, 'x', 105, 7, '#ffffff', 1); textO(ctx, String(G.coins).padStart(2, '0'), 111, 3, '#ffffff', 2);
  D(SP.fhead, 196, 3); textO(ctx, 'x' + Math.max(0, G.lives), 207, 5, '#ffffff', 1);
  const sc = String(G.score).padStart(6, '0'); textO(ctx, sc, VW - 5 - textW(sc, 1), 14, '#ffffff', 1);
  if (AU.muted) textO(ctx, 'TON AUS', 4, VH - 9, '#ffffff', 1);
}
function panel(x, y, w, h) { ctx.fillStyle = PAL.k; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#fff2dc'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.fillStyle = '#343060'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4); }
function render() {
  const t = G.t;
  if (G.st === 'title') {
    drawWorld0();
    const ly = 34 + Math.round(Math.sin(t * 0.05) * 2);
    textCO(ctx, 'FUNKEL', 120, ly, '#ffd850', 4); textCO(ctx, 'FUCHS', 120, ly + 26, '#f08838', 4);
    ctx.drawImage(SP.fox_idle.r, 28, ly + 4, 32, 36); ctx.drawImage(SP.umb.r, 30, ly - 12, 32, 18);
    ctx.drawImage(SP.shard.r, 186, ly + 6 + Math.round(Math.sin(t * 0.08) * 2), 28, 28);
    if (save.un > 0) { textCO(ctx, (G.sel > 0 ? '<  ' : '   ') + 'LEVEL ' + (G.sel + 1) + ': ' + LEVELS[G.sel].name + (G.sel < save.un ? '  >' : '   '), 120, 104, '#ffffff', 1);
      textCO(ctx, 'MONDSCHERBEN ' + save.sh.reduce((a, b) => a + bits(b), 0) + '/' + NL * 3, 120, 114, '#a8e8f8', 1); }
    if ((t >> 5) % 2) textCO(ctx, 'A ODER START DRÜCKEN', 120, 128, '#ffffff', 1);
    textCO(ctx, 'EIN HÜPFSPIEL IM TASCHENFORMAT', 120, 148, '#fff2dc', 1);
  } else if (G.st === 'story') {
    const c = G.cards[G.ci]; drawBG(c.th, t * 0.5, 64);
    ctx.fillStyle = THEMES[c.th].g2; ctx.fillRect(0, 86, VW, 74); ctx.fillStyle = THEMES[c.th].g1; ctx.fillRect(0, 86, VW, 4); ctx.fillStyle = PAL.k; ctx.fillRect(0, 85, VW, 1);
    const by = Math.round(Math.sin(t * 0.08) * 2);
    if (c.pic === 'boss') { ctx.drawImage(SP.boss.r, 130, 14 + by, 78, 51); ctx.fillStyle = PAL.k; ctx.fillRect(156, 40 + by, 8, 8); ctx.fillRect(178, 40 + by, 8, 8); ctx.fillStyle = '#fff'; ctx.fillRect(158, 42 + by, 4, 4); ctx.fillRect(180, 42 + by, 4, 4); ctx.drawImage(SP.fox_idle.r, 40, 50, 32, 36); }
    else if (c.pic === 'umb') { ctx.drawImage(SP.umb.r, 106, 16 + by, 32, 18); ctx.drawImage(SP.fox_jump.r, 104, 32 + by, 32, 36); }
    else if (c.pic === 'lamp') { ctx.drawImage(SP.lamp1.r, 150, 14, 30, 72); ctx.drawImage(SP.fox_idle.r, 80, 50, 32, 36); ctx.drawImage(SP.boss.r, 14, 10 + by, 52, 34); if (t % 8 === 0) sparkle(0, 0, 0); }
    else ctx.drawImage(SP.fox_idle.r, 104, 50 + (c.th === 'meadow' ? 0 : 0), 32, 36);
    panel(8, 96, VW - 16, 58);
    let n = Math.floor(t * 0.8); c.l.forEach((s, i) => { const part = s.slice(0, Math.max(0, n)); n -= s.length; text(ctx, part, 120 - textW(s, 1) / 2, 103 + i * 9, '#ffffff', 1); });
    if ((t >> 4) % 2) text(ctx, '>', VW - 20, 144, '#ffd850', 1);
  } else if (G.st === 'card') {
    ctx.fillStyle = '#1a1430'; ctx.fillRect(0, 0, VW, VH);
    textCO(ctx, 'LEVEL ' + (G.lvl + 1), 120, 48, '#a8e8f8', 2); textCO(ctx, L.name, 120, 68, '#ffd850', 3);
    D(SP.fhead, 104, 100); textO(ctx, 'x ' + G.lives, 118, 102, '#ffffff', 1);
    for (let i = 0; i < 3; i++) D((gotSh | save.sh[G.lvl]) & (1 << i) ? SP.shardS : SP.shardE, 108 + i * 9, 116);
  } else {
    drawWorld(); drawHUD();
    if (G.pause) { panel(80, 62, 80, 30); textCO(ctx, 'PAUSE', 120, 72, '#ffffff', 2); }
    if (G.st === 'clear' && t > 60) { panel(50, 44, 140, 74); textCO(ctx, 'GESCHAFFT!', 120, 52, '#ffd850', 2);
      textCO(ctx, 'PUNKTE  ' + G.score, 120, 72, '#ffffff', 1);
      for (let i = 0; i < 3; i++) ctx.drawImage(((gotSh | save.sh[G.lvl]) & (1 << i) ? SP.shardS : SP.shardE).r, 96 + i * 18, 82, 12, 12);
      if (t > 110 && (t >> 4) % 2) textCO(ctx, 'A: WEITER', 120, 104, '#a8e8f8', 1); }
    if (G.st === 'over') { panel(60, 54, 120, 50); textCO(ctx, 'GAME OVER', 120, 64, '#f08838', 2); if (t > 60 && (t >> 4) % 2) textCO(ctx, 'A: NOCHMAL VERSUCHEN', 120, 86, '#ffffff', 1); }
  }
}
function drawWorld0() { const cx = Math.round(cam.x), cy = Math.round(cam.y); drawBG(L.theme, cam.x, cam.y); ctx.drawImage(TL, cx, cy, VW, VH, 0, 0, VW, VH);
  for (const e of E) { const x = e.x - cx, y = e.y - cy; if (x > -60 && x < VW + 20 && e.k !== 'boss') drawEnt(e, x, y); }
  for (let ty = 4; ty < L.H; ty++) for (let tx = Math.floor(cx / TS); tx <= Math.floor((cx + VW) / TS); tx++) { const c = tile(tx, ty); if (c === 'B' || c === '?' || c === 'H') D(c === 'B' ? SP.crate : SP.bonus, tx * TS - cx, ty * TS - cy); } }

// ---------- Schleife ----------
let last = 0, acc = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(100, ts - last); last = ts; acc += dt; let n = 0;
  while (acc >= 1000 / 60 && n < 4) { step(); acc -= 1000 / 60; n++; }
  if (n === 4) acc = 0;
  render();
}
bindTouch();
const q = new URLSearchParams(location.search);
if (q.has('lvl')) { G.lives = 3; startLevel(+q.get('lvl')); }
window.DBG = { G, get P() { return P; }, get E() { return E; }, get L() { return L; }, cam, step, render, key, startLevel, get checkpoint() { return checkpoint; } };
requestAnimationFrame(frame);
