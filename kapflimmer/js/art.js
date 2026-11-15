// KAP FLIMMER – Software-Renderer (indizierter Framebuffer), Palette, Font, Sprites, Tischgemälde
'use strict';
const SW = 160, SH = 144, HUD = 8, VH = SH - HUD;
// Palette-Indizes
const K = 1, N1 = 2, N2 = 3, N3 = 4, T1 = 5, T2 = 6, T3 = 7, FO = 8, WH = 9, SA = 10, OC = 11, BR = 12, DB = 13, RD = 14, DR = 15, YL = 16, OR = 17, PK = 18, PU = 19, GR = 20, DG = 21;
const BASE = ['#000000', '#10121f', 0, 0, 0, 0, 0, 0, '#c8ecd8', '#f6f0dc', '#e6cf94', '#c8963c', '#7a4a34', '#46283a', '#d8484a', '#8c2a44', '#ffd95a', '#f08a3a', '#e87aa0', '#8a4a9a', '#8a9ab8', '#4a5878'];
const NIGHTS = [
  ['#141a30', '#1e2c52', '#30487a', '#1b4a5c', '#27747c', '#56b4a4'],   // Nebel
  ['#17152b', '#272149', '#443a74', '#27365a', '#38588a', '#6c9cc0'],   // Sturm
  ['#1d1222', '#371a36', '#5e2c50', '#1a3846', '#266066', '#58a890'],   // Krakennacht
  ['#2b2748', '#544070', '#a05c78', '#234a66', '#3a7c8c', '#7cc4b0']];  // Morgengrauen
const DMG = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]];
function makePal(night, dmg) {
  const p = new Uint32Array(32), src = BASE.slice(); NIGHTS[night % 4].forEach((c, i) => src[2 + i] = c);
  src.forEach((h, i) => { let r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    if (dmg) { const l = r * 0.3 + g * 0.55 + b * 0.15, c = DMG[l < 40 ? 0 : l < 92 ? 1 : l < 165 ? 2 : 3]; r = c[0]; g = c[1]; b = c[2]; }
    p[i] = 0xff000000 | (b << 16) | (g << 8) | r; });
  return p;
}
// Aufhell-Tabelle für den Leuchtkegel
const LIT = new Uint8Array(32); for (let i = 0; i < 32; i++) LIT[i] = i;
[[N1, N2], [N2, N3], [N3, GR], [T1, T2], [T2, T3], [T3, FO], [DG, GR], [DB, BR], [BR, OC], [DR, RD], [GR, WH], [OC, SA]].forEach(([a, b]) => LIT[a] = b);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

// ---------- Pixelpuffer ----------
function Buf(w, h) { return { w, h, d: new Uint8Array(w * h) }; }
function px(b, x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < b.w && y < b.h) b.d[y * b.w + x] = c; }
function gp(b, x, y) { return x >= 0 && y >= 0 && x < b.w && y < b.h ? b.d[y * b.w + x] : 0; }
function rect(b, x, y, w, h, c) { x = Math.round(x); y = Math.round(y); for (let j = Math.max(0, y); j < Math.min(b.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(b.w, x + w); i++) b.d[j * b.w + i] = c; }
function line(b, x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (;;) { px(b, x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
function disc(b, cx, cy, r, c) { const r2 = r * r; for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= r2) px(b, x, y, c); } }
function poly(b, p, c) { // Scanline-Füllung
  let y0 = 1e9, y1 = -1e9; p.forEach(q => { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(b.h - 1, Math.ceil(y1)); y++) { const xs = [], yc = y + 0.5;
    for (let i = 0; i < p.length; i++) { const a = p[i], q = p[(i + 1) % p.length]; if ((a[1] <= yc) !== (q[1] <= yc)) xs.push(a[0] + (yc - a[1]) / (q[1] - a[1]) * (q[0] - a[0])); }
    xs.sort((m, n) => m - n); for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.max(0, Math.round(xs[i])); x < Math.min(b.w, Math.round(xs[i + 1])); x++) b.d[y * b.w + x] = c; }
}
function thick(b, p, r, c) { for (let i = 0; i + 1 < p.length; i++) { const a = p[i], q = p[i + 1], n = Math.ceil(Math.hypot(q[0] - a[0], q[1] - a[1]) * 2) || 1; for (let k = 0; k <= n; k++) disc(b, a[0] + (q[0] - a[0]) * k / n, a[1] + (q[1] - a[1]) * k / n, r, c); } }
function outlineBuf(b, oc, only) { const m = []; for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) { if (b.d[y * b.w + x]) continue;
  const t = v => v && (!only || v === only); if (t(gp(b, x - 1, y)) || t(gp(b, x + 1, y)) || t(gp(b, x, y - 1)) || t(gp(b, x, y + 1))) m.push(y * b.w + x); } m.forEach(i => b.d[i] = oc); return b; }
function blit(b, s, x, y, flip, lut) { x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < s.h; j++) { const yy = y + j; if (yy < 0 || yy >= b.h) continue;
    for (let i = 0; i < s.w; i++) { const c = s.d[j * s.w + (flip ? s.w - 1 - i : i)]; if (!c) continue; const xx = x + i; if (xx >= 0 && xx < b.w) b.d[yy * b.w + xx] = lut ? lut[c] : c; } } }
function blitC(b, s, cx, cy, flip, lut) { blit(b, s, cx - s.w / 2, cy - s.h / 2, flip, lut); }

// ---------- Pixel-Font 3x5 ----------
const FONT = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227',
  J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25573', R: '65655',
  S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71122', 8: '75757', 9: '75716',
  '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', ':': '02020', "'": '22000', '/': '11244',
  '+': '02720', '(': '12221', ')': '42224', 'Ä': '52755', 'Ö': '52552', 'Ü': '50557', '"': '55000', '>': '42124', '<': '12421', '*': '05250', '%': '51245'
};
const WIDE = { M: [5, 17, 27, 21, 17, 17], W: [5, 17, 17, 21, 27, 17], N: [4, 9, 13, 11, 9, 9] };
const glyph = ch => WIDE[ch] || (FONT[ch] ? [3, +FONT[ch][0], +FONT[ch][1], +FONT[ch][2], +FONT[ch][3], +FONT[ch][4]] : null);
function text(b, s, x, y, c, sc) { sc = sc || 1; s = String(s).toUpperCase(); x = Math.round(x);
  for (let i = 0; i < s.length; i++) { const f = glyph(s[i]); if (!f) { x += 4 * sc; continue; } const w = f[0];
    for (let r = 0; r < 5; r++) for (let q = 0; q < w; q++) if (f[r + 1] & (1 << (w - 1 - q))) rect(b, x + q * sc, y + r * sc, sc, sc, c); x += (w + 1) * sc; } }
function textW(s, sc) { sc = sc || 1; s = String(s).toUpperCase(); let n = 0; for (let i = 0; i < s.length; i++) n += (WIDE[s[i]] ? WIDE[s[i]][0] : 3) + 1; return n * sc - sc; }
function textC(b, s, cx, y, c, sc) { text(b, s, cx - textW(s, sc) / 2, y, c, sc); }
function textO(b, s, x, y, c, sc, oc) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) text(b, s, x + i, y + j, oc || K, sc); text(b, s, x, y, c, sc); }
function textCO(b, s, cx, y, c, sc, oc) { textO(b, s, Math.round(cx - textW(s, sc) / 2), y, c, sc, oc); }

// ---------- Sprites aus Pixel-Karten ----------
const CH = { '.': 0, k: K, a: N1, b: N2, c: N3, d: T1, e: T2, f: T3, o: FO, w: WH, s: SA, y: OC, n: BR, m: DB, r: RD, R: DR, l: YL, g: OR, p: PK, u: PU, h: GR, H: DG };
function map(rows, ol) { const b = Buf(rows[0].length + (ol ? 2 : 0), rows.length + (ol ? 2 : 0)), o = ol ? 1 : 0;
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) b.d[(y + o) * b.w + x + o] = CH[r[x]] || 0; }); return ol ? outlineBuf(b, K) : b; }
const WHITE = new Uint8Array(32).fill(WH); WHITE[0] = 0; WHITE[K] = K;
const SPR = {};
function defSprites() {
  SPR.ball = map(['..kkk..', '.kwwok.', 'kwwoook', 'kwoooek', 'koooehk', '.koehk.', '..kkk..']);
  SPR.ballG = map(['..kkk..', '.kwwlk.', 'kwwlllk', 'kwlllgk', 'klllggk', '.klggk.', '..kkk..']);
  SPR.pearl = map(['.ww.', 'wooo', 'oooe', '.oe.']);
  SPR.boat = map(['...k...', '..rk...', '.rrk...', '...k...', 'yyyyyyy', '.ynnny.']);
  SPR.boatOff = map(['...H...', '..HH...', '.HHH...', '...H...', 'HHHHHHH', '.HHHHH.']);
  SPR.ring = map(['.rwr.', 'r...w', 'w...r', 'r...w', '.wrw.'], 1);
  SPR.ringOff = map(['.HHH.', 'H...H', 'H...H', 'H...H', '.HHH.']);
  SPR.tgt = map(['..r..', '.rr..', '..k..', 'sssss', 'ysssy', '.yyy.'], 1);
  SPR.kraken = map([
    '......uuuuuuu......', '....uuppppuuuuu....', '...uppppuuuuuuuu...', '..uuppuuuuuuuuuuu..', '..upuuuuuuuuuuuuu..',
    '.uuuuuuuuuuuuuuuuu.', '.uukkkuuuuuuukkkuu.', '.uuwwkkuuuuukkwwuu.', '.uuwkwwuuuuuwwkwuu.', '.uuwwwwuuuuuwwwwuu.',
    '.uuuuuuuuuuuuuuuuu.', '..uuuuuuRRRuuuuuu..', '..uuRuuuuuuuuuRuu..', '...uuuuRuuuRuuuu...', '....uu.uuu.uuu.....'], 1);
  SPR.krakenHit = map([
    '......uuuuuuu......', '....uuppppuuuuu....', '...uppppuuuuuuuu...', '..uuppuuuuuuuuuuu..', '..upuuuuuuuuuuuuu..',
    '.uuuuuuuuuuuuuuuuu.', '.uukuuukuuukuuukuu.', '.uuukukuuuuukukuuu.', '.uuuukuuuuuuukuuuu.', '.uuukukuuuuukukuuu.',
    '.uukuuukuuukuuukuu.', '..uuuuuRRRRRuuuuu..', '..uuRuuRkkkRuuRuu..', '...uuuuRRRRRuuuu...', '....uu.uuu.uuu.....'], 1);
  SPR.krakenZ = map([
    '......uuuuuuu......', '....uuppppuuuuu....', '...uppppuuuuuuuu...', '..uuppuuuuuuuuuuu..', '..upuuuuuuuuuuuuu..',
    '.uuuuuuuuuuuuuuuuu.', '.uuuuuuuuuuuuuuuuu.', '.uuuuuuuuuuuuuuuuu.', '.uukkkkuuuuukkkkuu.', '.uuuuuuuuuuuuuuuuu.',
    '.uuuuuuuuuuuuuuuuu.', '..uuuuuuRRRuuuuuu..', '..uuRuuuuuuuuuRuu..', '...uuuuRuuuRuuuu...', '....uu.uuu.uuu.....'], 1);
  SPR.fenja = map([
    '....yyyyyy....', '...yyyyyyyy...', '..yyyyyyyyyy..', '.kkkkkkkkkkkk.', '..hssssssssh..', '..hskssssksh..', '..hsssssssssh.', '..hssspppssh..', '...hsssssshh..', '....hhsshh....',
    '...llllllll...', '..llllgllllll.', '.lllllgllllll.', '.lllllgllllll.', '.llsllgllsll..', '..ss.llll.ss..'], 1);
  // Boje (Bumper), von oben
  const buoy = lit => { const b = Buf(17, 17); for (let y = 0; y < 17; y++) for (let x = 0; x < 17; x++) { const dx = x - 8, dy = y - 8, d = Math.hypot(dx, dy); let c = 0;
    if (d <= 7.6) { const q = (Math.floor((Math.atan2(dy, dx) + Math.PI + 0.4) / (Math.PI / 2)) & 1), sh = dx + dy > 4;
      c = d > 6.7 ? K : d > 4.4 ? (q ? (sh ? GR : WH) : (lit ? OR : sh ? DR : RD)) : d > 3.4 ? K : lit ? WH : (dx + dy < -1 ? WH : dx + dy > 2 ? OR : YL); }
    b.d[y * 17 + x] = c; } return b; };
  SPR.buoy = buoy(0); SPR.buoyLit = buoy(1);
  // Strudel, 4 Drehphasen, unbeleuchtet/beleuchtet
  SPR.hole = []; SPR.holeLit = [];
  for (let f = 0; f < 4; f++) for (const lit of [0, 1]) { const b = Buf(13, 13); for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) { const dx = x - 6, dy = y - 6, d = Math.hypot(dx, dy); if (d > 5.6) continue;
    const s = Math.sin(Math.atan2(dy, dx) * 2 + d * 0.9 - f * Math.PI / 2); b.d[y * 13 + x] = d < 1.3 ? K : s > 0.35 ? (lit ? WH : FO) : s > -0.3 ? (lit ? YL : T3) : (lit ? OR : T1); } (lit ? SPR.holeLit : SPR.hole).push(b); }
}

// ---------- Leuchtturm (für Tisch und Titelbild) ----------
function lighthouse(b, cx, top, s) { // top = Dachspitze; gibt Lampen-Mittelpunkt zurück
  const R = v => Math.round(v * s), roofH = R(6), lampH = R(9), galH = R(3), towH = R(52);
  const yL = top + roofH, yG = yL + lampH, yT = yG + galH, yB = yT + towH, w0 = R(6), w1 = R(9.5);
  // Turm mit Streifen
  for (let y = yT; y < yB; y++) { const t = (y - yT) / towH, hw = Math.round(w0 + (w1 - w0) * t), band = Math.floor(t * 4) & 1;
    for (let x = -hw; x <= hw; x++) { const sh = x > hw * 0.35; let c = band ? (sh ? DR : RD) : (sh ? GR : WH); if (x === -hw || x === hw) c = K; if (!band && !sh && x === -hw + 1) c = WH; px(b, cx + x, y, c); } }
  for (let i = 1; i < 4; i++) { const y = yT + Math.round(towH * i / 4), hw = Math.round(w0 + (w1 - w0) * i / 4); rect(b, cx - hw + 1, y, hw * 2 - 1, 1, i & 1 ? DR : DG); }
  rect(b, cx - R(1), yT + R(8), R(2) + 1, R(3) + 1, K); rect(b, cx - R(1), yT + R(30), R(2) + 1, R(3) + 1, K);
  rect(b, cx - R(2), yB - R(7), R(4) + 1, R(7), DB); rect(b, cx - R(2) - 1, yB - R(7) - 1, R(4) + 3, 1, K); rect(b, cx - R(2) - 1, yB - R(7), 1, R(7), K); rect(b, cx + R(2) + 1, yB - R(7), 1, R(7), K);
  // Galerie
  rect(b, cx - w0 - R(3), yG, (w0 + R(3)) * 2 + 1, galH, K); rect(b, cx - w0 - R(3) + 1, yG, (w0 + R(3)) * 2 - 1, 1, DG);
  for (let x = -w0 - R(3); x <= w0 + R(3); x += 2) px(b, cx + x, yG - 1, K);
  // Lampenraum
  const lw = R(4.5); rect(b, cx - lw - 1, yL, lw * 2 + 3, lampH, K); rect(b, cx - lw, yL + 1, lw * 2 + 1, lampH - 1, DG);
  rect(b, cx - Math.round(lw / 3), yL + 1, 1, lampH - 1, K); rect(b, cx + Math.round(lw / 3), yL + 1, 1, lampH - 1, K);
  // Dach
  for (let y = 0; y < roofH; y++) { const hw = Math.round((lw + 2) * (y + 1) / roofH); for (let x = -hw; x <= hw; x++) px(b, cx + x, top + y, x === -hw || x === hw || y === roofH - 1 ? K : x > 0 ? DR : RD); }
  rect(b, cx, top - R(3), 1, R(3), K); px(b, cx, top - R(3) - 1, YL);
  return { x: cx, y: yL + Math.round(lampH / 2), lw, yL, lampH, yB };
}
function lampGlow(b, L, on, t) { // Lampenfenster zur Laufzeit
  const c = on ? ((t >> 3) & 1 ? WH : YL) : DG; for (let y = L.yL + 1; y < L.yL + L.lampH; y++) for (let x = -L.lw; x <= L.lw; x++) { if (gp(b, L.x + x, y) !== K) px(b, L.x + x, y, on && x === 0 ? WH : c); } }
function rock(b, cx, y, w, h) { const p = [[cx - w, y + h], [cx - w * 0.8, y + h * 0.45], [cx - w * 0.45, y + 2], [cx + w * 0.3, y], [cx + w * 0.75, y + h * 0.35], [cx + w, y + h]];
  const t = Buf(b.w, b.h); poly(t, p, DG); outlineBuf(t, K);
  for (let i = 0; i < t.d.length; i++) if (t.d[i]) { const x = i % b.w, yy = (i / b.w) | 0; let c = t.d[i]; if (c === DG) { const u = (x - cx) / w, v = (yy - y) / h; c = u - v < -0.5 ? GR : ((x * 7 + yy * 13) % 17 === 0 ? K : (x * 3 + yy * 5) % 19 === 0 ? GR : DG); } b.d[i] = c; } }
function cloud(b, x, y, w, c, hi) { const t = Buf(b.w, b.h); for (let i = 0; i < w; i += 5) disc(t, x + i, y - 2 - 3 * Math.sin(i / w * Math.PI), 3.5 + 2 * Math.sin(i / w * Math.PI), 1);
  for (let i = 0; i < t.d.length; i++) if (t.d[i]) { const xx = i % b.w, yy = (i / b.w) | 0; if (yy > y) continue; if (b.mask && !b.mask[i]) continue; b.d[i] = !t.d[i - b.w] ? hi : c; } }

// ---------- Tischgemälde ----------
let LAMP = null;
function buildTable() {
  const W = TB.TW, H = TB.TH, b = Buf(W, H), m = Buf(W, H);
  poly(m, TB.outer, 1); b.mask = m.d;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let c;
    if (m.d[y * W + x]) {
      if (x >= 147) c = (((y + 60 - Math.abs(x - 151) * 2) % 14) < 2 && y < 262) ? N2 : N1;        // Abschussbahn
      else if (y < 132) { const g = y < 30 ? 0 : y < 84 ? (y - 30) / 54 : 1 + Math.max(0, (y - 104) / 28); c = N1 + Math.min(2, Math.floor(g + bay(x, y) * 0.999)); }
      else { const g = Math.max(0, Math.min(1, (y - 134) / 62 + 0.1 * Math.sin(y * 0.55 + Math.sin(x * 0.09 + y * 0.04) * 2.4))); c = T1 + Math.min(2, Math.floor(g + bay(x + (y >> 2), y >> 1) * 0.999)); }
    } else { const row = Math.floor(y / 9), off = (row * 37) % 23; c = y % 9 === 0 || (x + off) % 31 === 0 ? K : ((x * 5 + row * 11 + ((y % 9) * 3)) % 17 === 0 ? BR : DB); }
    b.d[y * W + x] = c; }
  // Sterne, Mond, Wolken
  let sd = 11; const rnd = () => (sd = (sd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 70; i++) { const x = 6 + rnd() * 138 | 0, y = 8 + rnd() * 108 | 0; if (!m.d[y * W + x] || x > 146) continue; const big = rnd() < 0.14; px(b, x, y, big ? WH : rnd() < 0.5 ? GR : N3); if (big) { px(b, x - 1, y, GR); px(b, x + 1, y, GR); px(b, x, y - 1, GR); px(b, x, y + 1, GR); } }
  disc(b, 33, 45, 6.2, SA); disc(b, 32, 44, 4.6, WH); disc(b, 36.5, 42.5, 5.2, N1); px(b, 29, 48, OC); px(b, 31, 50, OC);
  cloud(b, 100, 58, 34, N3, DG); cloud(b, 20, 106, 30, N3, DG); cloud(b, 108, 116, 26, N3, DG);
  // Horizont + Glitzern
  for (let x = 6; x < 144; x++) if ((x * 7) % 5 < 3) px(b, x, 132, T3);
  for (let i = 0; i < 46; i++) { const x = 8 + rnd() * 132 | 0, y = 136 + rnd() * 138 | 0, w = 2 + (rnd() * 4 | 0); for (let k = 0; k < w; k++) if (m.d[y * W + x + k] && x + k < 144) px(b, x + k, y, y > 200 && rnd() < 0.4 ? FO : T3); }
  // Insel mit Leuchtturm
  rock(b, 75, 180, 21, 15);
  LAMP = lighthouse(b, 75, 110, 1);
  for (let x = 52; x < 99; x++) if ((x * 3) % 4) px(b, x, 195 + ((x >> 2) & 1), FO);
  // Einlagen (unbeleuchtet)
  TB.LANES.forEach(x => { disc(b, x, 37, 2.2, K); disc(b, x, 37, 1.2, DG); });
  ['2X', '3X', '4X', '5X'].forEach((s, i) => text(b, s, 57 + i * 10, 212, T1));
  blitC(b, SPR.ringOff, 10.5, 214); blitC(b, SPR.ringOff, 138.5, 214);
  [[23, 208], [126.5, 208]].forEach(p => { disc(b, p[0], p[1], 2.2, K); disc(b, p[0], p[1], 1.2, DG); });
  // Schürze unten
  for (const sg of [1, -1]) { const X = x => sg > 0 ? x : 149 - x, p = [[X(18), 237], [X(46), 251], [X(53), H], [X(18), H]], t = Buf(W, H); poly(t, p, DB);
    for (let i = 0; i < t.d.length; i++) if (t.d[i]) { const x = i % W, y = (i / W) | 0; b.d[i] = !gp(t, x, y - 1) || !gp(t, x + sg, y) ? K : (y % 7 === 0 ? K : (x * 3 + y * 5) % 13 === 0 ? BR : DB); } }
  // Rand: Messingschiene um das Spielfeld
  const rim = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!m.d[y * W + x]) { let n = 0, n2 = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const v = gp(m, x + i, y + j); if (v) { n2++; if (Math.abs(i) + Math.abs(j) <= 1) n++; } } if (n) rim.push(y * W + x, K); else if (n2) rim.push(y * W + x, (x + y) % 9 === 0 ? SA : OC); }
  for (let i = 0; i < rim.length; i += 2) b.d[rim[i]] = rim[i + 1];
  // Feste Körper
  TB.solids.forEach((p, i) => { const t = Buf(W, H); poly(t, p, 1); const stone = p === TB.WEDGE, sling = i >= TB.solids.length - 2;
    for (let j = 0; j < t.d.length; j++) if (t.d[j]) { const x = j % W, y = (j / W) | 0, edge = !gp(t, x - 1, y) || !gp(t, x + 1, y) || !gp(t, x, y - 1) || !gp(t, x, y + 1) || y === 0; let c;
      if (stone) c = edge ? K : (y % 6 === 0 || (x + (Math.floor(y / 6) & 1) * 4) % 8 === 0) ? K : (!gp(t, x - 2, y) || !gp(t, x, y - 2)) ? GR : DG;
      else if (sling) c = edge ? K : DB;
      else c = edge ? K : (y % 9 === 0 ? K : x === 145 ? BR : DB);
      b.d[j] = c; } });
  TB.slings.forEach((s, i) => { const [A, B, C] = s.p, sg = i ? -1 : 1, cx = (A[0] + B[0] + C[0]) / 3, cy = (A[1] + B[1] + C[1]) / 3, q = s.p.map(v => [cx + (v[0] - cx) * 0.45, cy + (v[1] - cy) * 0.45]);
    poly(b, q, OC); line(b, A[0] + sg, A[1] + 2, C[0] - sg, C[1] - 2, RD); line(b, A[0] + sg * 2, A[1] + 3, C[0], C[1] - 3, RD); px(b, A[0] + (i ? -1 : 0), A[1] + 1, SA); px(b, C[0] - (i ? 0 : 1), C[1] - 1, SA); px(b, B[0] + (i ? -1 : 0), B[1] - 1, SA); });
  // Schienen und Pfosten
  TB.rails.forEach(r => { thick(b, r.p, r.r + 0.9, K); thick(b, r.p, r.r - 0.1, OC); r.p.forEach((q, i) => { if (i < r.p.length - 1) line(b, q[0] - 0.6, q[1] - 0.6, r.p[i + 1][0] - 0.6, r.p[i + 1][1] - 0.6, SA); }); });
  // Ziel-Schlitze an der Hafenmauer
  TB.targets.forEach(t => line(b, t.x0 - t.nx * 2, t.y0 - t.ny * 2, t.x1 - t.nx * 2, t.y1 - t.ny * 2, N1));
  line(b, TB.gate.x0, TB.gate.y0, TB.gate.x1, TB.gate.y1, GR);
  // Strudel-Grund
  disc(b, TB.HOLE.x, TB.HOLE.y, 5.8, K);
  return b;
}

// ---------- Rotierte Kapsel (Flipper) ----------
function capsule(b, x0, y0, x1, y1, r0, r1, c, hi, oy) {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy, R = Math.max(r0, r1) + 2;
  for (let y = Math.floor(Math.min(y0, y1) - R); y <= Math.ceil(Math.max(y0, y1) + R); y++) for (let x = Math.floor(Math.min(x0, x1) - R); x <= Math.ceil(Math.max(x0, x1) + R); x++) {
    let t = ((x - x0) * dx + (y - y0) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const ex = x - (x0 + dx * t), ey = y - (y0 + dy * t), d = Math.hypot(ex, ey), r = r0 + (r1 - r0) * t;
    if (d <= r + 1) px(b, x, y - oy, d > r ? K : ey > r * 0.3 ? hi : c); }
}
function present(ctx, img, fb, pal) { const u = new Uint32Array(img.data.buffer); for (let i = 0; i < u.length; i++) u[i] = pal[fb.d[i]]; ctx.putImageData(img, 0, 0); }
