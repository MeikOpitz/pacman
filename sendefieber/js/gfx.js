// Sendefieber – Pixelgrafik: Hochhaus-Querschnitt mit Kamera, Räume, Figuren (alles prozedural gezeichnet)
import { RIVALS } from './data.js';

export const W = 240, H = 426;
const FH = 104, NF = 5, ROOF = 96, WORLD_H = ROOF + NF * FH + 14;
const XL = 8, SH_L = 100, SH_R = 140, XR = 232, LIFT_X = 120, RW = 92;
const floorY = f => ROOF + (NF - f) * FH;

export const ROOMS = [
  { id: 'foyer', floor: 0, side: 'L', sign: 'PFORTE' },
  { id: 'exit', floor: 0, side: 'R', sign: 'AUSGANG' },
  { id: 'dealer', floor: 1, side: 'L', sign: 'PROGRAMME' },
  { id: 'agency', floor: 1, side: 'R', sign: 'WERBUNG' },
  { id: 'office', floor: 2, side: 'L', sign: 'DEIN BUERO' },
  { id: 'news', floor: 2, side: 'R', sign: 'REDAKTION' },
  { id: 'rival0', floor: 3, side: 'L', sign: 'R. SCHMALZ' },
  { id: 'rival1', floor: 3, side: 'R', sign: 'BASS FM' },
  { id: 'boss', floor: 4, side: 'L', sign: 'CHEF' },
  { id: 'tech', floor: 4, side: 'R', sign: 'TECHNIK' },
].map(r => ({ ...r, left: r.side === 'L' ? XL : SH_R, x: r.side === 'L' ? XL + 74 : SH_R + 18 }));

// ---------- Farben ----------
const hexRgb = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const shadeCache = {};
function shade(c, f) {
  const k = c + f;
  if (shadeCache[k]) return shadeCache[k];
  const [r, g, b] = hexRgb(c).map(v => Math.max(0, Math.min(255, Math.round(v * f))));
  return (shadeCache[k] = `rgb(${r},${g},${b})`);
}
function mix(a, b, f) { const x = hexRgb(a), y = hexRgb(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * f)).join(',')})`; }
const SKY = [[0, '#05051a', '#0e0e30', 1], [4.5, '#05051a', '#141440', 1], [6, '#2a2a70', '#f08a5a', 0.5], [8, '#2f7fe0', '#aee0fa', 0],
  [17, '#2f7fe0', '#aee0fa', 0], [19, '#3a3080', '#f47a40', 0.4], [21, '#08082a', '#16163e', 1], [24.1, '#05051a', '#0e0e30', 1]];
function skyAt(h) {
  let i = 0; while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], f = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
  return { top: mix(a[1], b[1], f), bot: mix(a[2], b[2], f), n: a[3] + (b[3] - a[3]) * f };
}

// ---------- 3x5-Pixelschrift ----------
const F = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', '.': '000000000000010', '-': '000000111000000', '!': '010010010000010', ':': '000010000010000',
  '%': '101001010100101', ' ': '000000000000000',
};

// ---------- Zeichenstift ----------
function pen(ctx) {
  const g = {
    ctx,
    R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); },
    box(x, y, w, h, c) { g.R(x, y, w, h, c); g.R(x, y, w, 1, shade(c, 1.25)); g.R(x, y, 1, h, shade(c, 1.12)); g.R(x, y + h - 1, w, 1, shade(c, 0.6)); g.R(x + w - 1, y, 1, h, shade(c, 0.75)); },
    txt(s, x, y, c, k = 1) {
      ctx.fillStyle = c;
      for (const ch of String(s).toUpperCase()) {
        const gl = F[ch] || F[' '];
        for (let i = 0; i < 15; i++) if (gl[i] === '1') ctx.fillRect(x + (i % 3) * k, y + ((i / 3) | 0) * k, k, k);
        x += 4 * k;
      }
    },
    disc(cx, cy, r, c) { ctx.fillStyle = c; for (let j = -r; j <= r; j++) { const hw = Math.round(Math.sqrt(r * r - j * j)); ctx.fillRect(cx - hw, cy + j, hw * 2 + 1, 1); } },
    line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; ctx.fillStyle = c; for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); },
    glow(x, y, wTop, wBot, h, a) { ctx.fillStyle = `rgba(255,236,160,${a})`; ctx.beginPath(); ctx.moveTo(x - wTop, y); ctx.lineTo(x + wTop, y); ctx.lineTo(x + wBot, y + h); ctx.lineTo(x - wBot, y + h); ctx.fill(); },
  };
  return g;
}
const txtW = (s, k = 1) => String(s).length * 4 * k - k;

// ---------- Figuren ----------
export const NPCS = {
  foyer:  { name: 'Pförtner Pachulke', skin: '#e8b890', hair: '#9a9a9a', shirt: '#3a5a9c', pants: '#22335a', acc: 'cap', tie: '#22335a', moustache: true },
  exit:   { name: 'Ausgang' },
  dealer: { name: 'Rillen-Rudi', skin: '#d9a070', hair: '#5a3a1a', shirt: '#d8501e', pants: '#3a4a7a', hairStyle: 'afro', acc: 'headphones' },
  agency: { name: 'Gloria Klimper', skin: '#f4cdb0', hair: '#e8c030', shirt: '#a02a7a', hairStyle: 'long', acc: 'glasses', dress: true, lips: '#e0204a' },
  office: { name: 'Dein Büro' },
  news:   { name: 'Redakteur Ticker', skin: '#e0b088', hair: '#2a2a2a', shirt: '#e8e8dc', pants: '#4a4a55', tie: '#b02020', moustache: true },
  rival0: { name: 'Sülzmann (Radio Schmalz)', skin: '#f0c0a0', hair: '#f0e8d8', shirt: '#e86aa6', pants: '#f4f4f4', suit: true, tie: '#fff0a0', hairStyle: 'bun' },
  rival1: { name: 'DJ Dezibel (Bass FM)', skin: '#b07850', hair: '#151515', shirt: '#1a9ab8', pants: '#1a1a22', acc: 'shades', hairStyle: 'afro' },
  boss:   { name: 'Direktor Wummer', skin: '#e8a888', hair: '#777', shirt: '#2a2a3a', pants: '#2a2a3a', suit: true, tie: '#c02020', hairStyle: 'bald', acc: 'cigar', wide: true },
  tech:   { name: 'Technikerin Lötkolb', skin: '#e8b890', hair: '#c8401a', shirt: '#e8e0d0', pants: '#3a5a9c', overall: '#3a5a9c', hairStyle: 'long' },
};
const PLAYER = { skin: '#e8b890', hair: '#4a3018', shirt: '#2e9c62', pants: '#2a3458', tie: '#e8c020' };

function person(g, x, y, p, f = 0, dir = 1) {
  x = Math.round(x); y = Math.round(y);
  const P = (a, b, w, h, c) => g.R(dir > 0 ? x + a : x - a - w, y + b, w, h, c);
  const sh = p.shirt, sh2 = shade(sh, 0.72), pa = p.pants || '#2a3050', pa2 = shade(pa, 0.72), sk = p.skin, sk2 = shade(sk, 0.82), hair = p.hair;
  const a = f ? [2, 0, -2, 0][f - 1] : 0, bob = f === 2 || f === 4 ? -1 : 0, ww = p.wide ? 2 : 0;
  g.R(x - 9, y - 1, 18, 2, 'rgba(0,0,0,.22)');
  // Beine
  if (p.dress) {
    P(-4 - a, -13, 3, 11, sk2); P(1 + a, -13, 3, 11, sk);
    P(-5 - a, -2, 5, 2, '#b01840'); P(1 + a, -2, 5, 2, '#d0204a');
  } else {
    P(-5 - a, -17, 5, 15, pa2); P(0 + a, -17, 5, 15, pa);
    P(-5 - a, -2, 6, 2, '#101014'); P(0 + a, -2, 6, 2, '#1c1c22');
  }
  const b = bob;
  // Arme hinten
  P(-10 - ww, -32 + b + (a > 0 ? 1 : 0), 3, 12, sh2); P(-10 - ww, -20 + b + (a > 0 ? 1 : 0), 3, 3, sk2);
  // Rumpf
  P(-7 - ww, -33 + b, 14 + ww * 2, 16, sh); P(-7 - ww, -33 + b, 3, 16, sh2); P(6 + ww, -33 + b, 1, 16, shade(sh, 1.2));
  if (p.dress) { P(-8, -20 + b, 16, 8, sh); P(-9, -14 + b, 18, 3, sh2); P(-2, -33 + b, 5, 3, sk); }
  else P(-7 - ww, -19 + b, 14 + ww * 2, 2, shade(pa, 0.5));
  if (p.overall) { P(-7, -27 + b, 14, 10, p.overall); P(-5, -33 + b, 2, 7, p.overall); P(3, -33 + b, 2, 7, p.overall); P(-1, -25 + b, 3, 3, shade(p.overall, 1.4)); }
  if (p.suit) { P(-2, -33 + b, 5, 10, '#f4f4f4'); P(-3, -33 + b, 2, 8, sh2); P(3, -33 + b, 2, 8, sh2); P(-1, -22 + b, 1, 1, '#e8c020'); }
  if (p.tie) { if (!p.suit) P(-1, -33 + b, 4, 3, '#f4f4f4'); P(0, -32 + b, 2, 9, p.tie); }
  // Arm vorn
  P(7 + ww, -32 + b + (a < 0 ? 1 : 0), 3, 12, sh); P(7 + ww, -20 + b + (a < 0 ? 1 : 0), 3, 3, sk);
  // Kopf
  P(-2, -35 + b, 5, 2, sk2);
  P(-5, -46 + b, 11, 11, sk); P(-5, -46 + b, 2, 11, sk2); P(-6, -42 + b, 1, 3, sk2); P(-5, -36 + b, 1, 1, sk2); P(5, -36 + b, 1, 1, sk2);
  P(0, -42 + b, 2, 2, '#fff'); P(1, -42 + b, 1, 2, '#18181e'); P(4, -42 + b, 2, 2, '#fff'); P(5, -42 + b, 1, 2, '#18181e');
  P(0, -44 + b, 2, 1, shade(hair, 0.7)); P(4, -44 + b, 2, 1, shade(hair, 0.7));
  P(3, -40 + b, 1, 2, sk2); P(1, -37 + b, 4, 1, p.lips || '#9a3a2a');
  const hs = p.hairStyle || 'short', h2 = shade(hair, 1.25);
  if (hs === 'bald') { P(-6, -44 + b, 2, 5, hair); P(5, -43 + b, 1, 3, hair); P(0, -46 + b, 3, 1, shade(sk, 1.15)); }
  else if (hs === 'afro') { P(-8, -52 + b, 16, 8, hair); P(-8, -46 + b, 3, 7, hair); P(5, -46 + b, 3, 4, hair); P(-5, -51 + b, 6, 1, h2); }
  else { P(-6, -49 + b, 12, 4, hair); P(-6, -46 + b, 2, 6, hair); P(-3, -48 + b, 6, 1, h2); }
  if (hs === 'long') { P(-7, -46 + b, 3, 14, hair); P(5, -45 + b, 2, 10, hair); }
  if (hs === 'bun') P(-9, -51 + b, 4, 4, hair);
  if (p.moustache) P(0, -38 + b, 6, 2, shade(hair, 0.7));
  if (p.acc === 'cap') { P(-6, -51 + b, 12, 5, '#22335a'); P(-6, -51 + b, 12, 1, '#3a5090'); P(3, -47 + b, 6, 2, '#141c38'); P(-1, -50 + b, 3, 2, '#e8c020'); }
  if (p.acc === 'glasses') { P(-1, -43 + b, 8, 1, '#18181e'); P(-1, -40 + b, 3, 1, '#18181e'); P(4, -40 + b, 3, 1, '#18181e'); P(-1, -43 + b, 1, 4, '#18181e'); P(6, -43 + b, 1, 4, '#18181e'); P(2, -43 + b, 2, 3, '#18181e'); }
  if (p.acc === 'shades') { P(-1, -43 + b, 8, 3, '#101014'); P(0, -43 + b, 2, 1, '#5ad1e8'); }
  if (p.acc === 'cigar') { P(5, -37 + b, 5, 2, '#6a3a1a'); P(10, -37 + b, 1, 2, '#ff8840'); }
  if (p.acc === 'headphones') { P(-6, -53 + b, 12, 2, '#222'); P(-8, -46 + b, 3, 7, '#222'); P(-8, -45 + b, 1, 5, '#e83a3a'); }
}

// ---------- Möbel & Bausteine ----------
function wallpaper(g, x, y, w, h, c, kind) {
  g.R(x, y, w, h, c);
  const d = shade(c, 0.9), l = shade(c, 1.1);
  if (kind === 'stripes') for (let i = 3; i < w; i += 8) g.R(x + i, y, 3, h, d);
  if (kind === 'dots') for (let j = 5; j < h; j += 8) for (let i = (j % 16 > 7 ? 2 : 6); i < w - 1; i += 8) g.R(x + i, y + j, 2, 2, l);
  if (kind === 'brick') for (let j = 0; j < h; j += 6) { g.R(x, y + j, w, 1, d); for (let i = (j % 12 ? 0 : 5); i < w; i += 10) g.R(x + i, y + j, 1, 6, d); }
  if (kind === 'grid') { for (let i = 0; i < w; i += 12) g.R(x + i, y, 1, h, d); for (let j = 0; j < h; j += 12) g.R(x, y + j, w, 1, d); }
  g.R(x, y, w, 5, 'rgba(0,0,0,.2)'); g.R(x, y + 5, w, 4, 'rgba(0,0,0,.09)');
}
function wainscot(g, x, fy, w, c) {
  g.R(x, fy - 32, w, 32, c); g.R(x, fy - 33, w, 2, shade(c, 1.3)); g.R(x, fy - 31, w, 1, shade(c, 0.7));
  for (let i = 4; i < w; i += 11) { g.R(x + i, fy - 28, 1, 22, shade(c, 0.75)); g.R(x + i + 1, fy - 28, 1, 22, shade(c, 1.15)); }
}
function baseboard(g, x, fy, w, c) { g.R(x, fy - 4, w, 4, shade(c, 0.5)); g.R(x, fy - 4, w, 1, shade(c, 0.8)); }
function floorStrip(g, x, fy, w, kind, c) {
  if (kind === 'tiles') for (let i = 0; i < w; i += 6) g.R(x + i, fy - 2, 6, 2, (i / 6) % 2 ? '#d8d0c0' : '#55505a');
  else if (kind === 'parquet') { g.R(x, fy - 2, w, 2, c); for (let i = 0; i < w; i += 9) g.R(x + i, fy - 2, 1, 2, shade(c, 0.7)); }
  else { g.R(x, fy - 2, w, 2, c); for (let i = 1; i < w; i += 3) g.R(x + i, fy - 2, 1, 1, shade(c, 1.2)); }
}
function win(g, x, y, w, h, env, curtain) {
  g.box(x - 2, y - 2, w + 4, h + 4, '#e8e4d8');
  g.R(x, y, w, h, env.sky.top); g.R(x, y + (h * 0.45 | 0), w, h - (h * 0.45 | 0), env.sky.bot);
  const lit = env.sky.n > 0.5;
  for (let i = 0, bx = x + 1; bx < x + w - 4; i++) {
    const bw = 5 + (i * 7) % 6, bh = 6 + (i * 11) % (h * 0.5 | 0);
    g.R(bx, y + h - bh, Math.min(bw, x + w - bx), bh, lit ? '#141430' : '#5a6a8a');
    if (lit) for (let k = 2; k < bh - 2; k += 4) g.R(bx + 1 + (k + i) % 3, y + h - bh + k, 1, 2, '#ffe880');
    bx += bw + 1;
  }
  g.R(x + (w >> 1), y, 1, h, '#e8e4d8'); g.R(x, y + (h >> 1), w, 1, '#e8e4d8');
  g.R(x + 1, y + 1, 2, h * 0.4 | 0, 'rgba(255,255,255,.3)');
  g.R(x - 3, y + h + 2, w + 6, 2, '#c8c2b0');
  if (curtain) { g.R(x - 3, y - 3, 5, h + 5, curtain); g.R(x + w - 2, y - 3, 5, h + 5, curtain); g.R(x - 3, y - 4, w + 6, 2, shade(curtain, 0.6)); g.R(x - 1, y - 2, 1, h + 3, shade(curtain, 0.7)); g.R(x + w, y - 2, 1, h + 3, shade(curtain, 0.7)); }
}
function lamp(g, cx, y0, env, c = '#e8d8a0') {
  g.R(cx, y0, 1, 5, '#222'); g.R(cx - 4, y0 + 5, 9, 2, shade(c, 0.7)); g.R(cx - 6, y0 + 7, 13, 3, c); g.R(cx - 3, y0 + 10, 7, 1, '#fffbe0');
  g.glow(cx, y0 + 10, 5, 30, 86, 0.05 + env.sky.n * 0.07);
}
function desk(g, x, fy, w, h, c) {
  g.R(x + 2, fy - h + 3, w - 4, h - 3, shade(c, 0.8)); g.box(x, fy - h, w, 4, shade(c, 1.2));
  g.R(x + 3, fy - h + 4, 2, h - 4, shade(c, 0.55)); g.R(x + w - 5, fy - h + 4, 2, h - 4, shade(c, 0.55));
  const dw = Math.min(16, (w - 12) >> 1);
  g.box(x + w - 6 - dw, fy - h + 6, dw, 6, c); g.R(x + w - 6 - (dw >> 1) - 1, fy - h + 8, 3, 1, '#e8d080');
  if (h > 20) { g.box(x + w - 6 - dw, fy - h + 13, dw, 6, c); g.R(x + w - 6 - (dw >> 1) - 1, fy - h + 15, 3, 1, '#e8d080'); }
}
function plant(g, x, fy, s = 1) {
  const h = 20 * s | 0;
  g.box(x - 4, fy - 9, 9, 9, '#a8502a'); g.R(x - 5, fy - 10, 11, 2, '#c8683a');
  g.R(x, fy - 9 - h, 1, h, '#2a6a2a');
  for (let i = 0; i < 5; i++) { const yy = fy - 12 - i * (h / 5 | 0), ww = 4 + (i % 2) * 3; g.R(x - ww, yy - 2, ww, 3, '#3a9a4a'); g.R(x + 1, yy - 4, ww, 3, '#2e7e3a'); g.R(x - ww, yy - 2, ww, 1, '#5ac06a'); }
  g.R(x - 2, fy - 13 - h, 5, 4, '#3a9a4a');
}
function frame(g, x, y, w, h, c, fc = '#c8a020') { g.box(x, y, w, h, fc); g.R(x + 2, y + 2, w - 4, h - 4, c); }
function clock(g, cx, cy, min, r = 6) {
  g.disc(cx, cy, r + 1, '#2a2a30'); g.disc(cx, cy, r, '#f4f0e0');
  const ah = (min / 720) * Math.PI * 2, am = (min / 60) * Math.PI * 2;
  g.line(cx, cy, cx + Math.sin(ah) * (r - 3), cy - Math.cos(ah) * (r - 3), '#18181e');
  g.line(cx, cy, cx + Math.sin(am) * (r - 1), cy - Math.cos(am) * (r - 1), '#b02020');
}
function monitor(g, x, y, on, c = '#3ae86a') {
  g.box(x, y, 15, 12, '#c8c4b4'); g.R(x + 2, y + 2, 11, 7, on ? '#0c2a14' : '#18181e');
  if (on) { g.R(x + 3, y + 3, 6, 1, c); g.R(x + 3, y + 5, 8, 1, c); g.R(x + 3, y + 7, 4, 1, c); }
  g.R(x + 5, y + 12, 5, 2, '#a8a494'); g.R(x + 2, y + 14, 11, 1, '#a8a494');
}
function speaker(g, x, fy, w, h, env) {
  g.box(x, fy - h, w, h, '#18181e');
  const cx = x + (w >> 1), pulse = (env.t * 5 | 0) % 2;
  g.disc(cx, fy - h + 7, 3, '#3a3a44'); g.disc(cx, fy - h + 7, 1, '#888');
  g.disc(cx, fy - (h >> 1) + 5, (w >> 1) - 3 + pulse, '#3a3a44'); g.disc(cx, fy - (h >> 1) + 5, (w >> 1) - 6, '#22222a'); g.disc(cx, fy - (h >> 1) + 5, 2, '#5ad1e8');
}

// ---------- Räume ----------
function drawRoom(g, room, env) {
  const x = room.left, fy = floorY(room.floor), y0 = fy - FH + 6, id = room.id, st = env.st, t = env.t, R = g.R;
  const npc = (lx, dir, front) => { person(g, x + lx, fy - (front || 0), NPCS[id], 0, dir); };
  if (id === 'foyer') {
    wallpaper(g, x, y0, RW, FH - 6, '#d8c8a0', 'plain'); wainscot(g, x, fy, RW, '#8a6a42'); floorStrip(g, x, fy, RW, 'tiles');
    lamp(g, x + 20, y0, env);
    g.box(x + 6, y0 + 24, 30, 24, '#6a4a2a'); for (let i = 0; i < 12; i++) { R(x + 9 + (i % 4) * 7, y0 + 27 + ((i / 4) | 0) * 7, 1, 1, '#222'); R(x + 9 + (i % 4) * 7, y0 + 28 + ((i / 4) | 0) * 7, 2, 4, i % 5 ? '#e8c020' : '#c0c0c8'); }
    clock(g, x + 50, y0 + 30, st ? st.minute : 600, 7);
    frame(g, x + 62, y0 + 22, 24, 18, '#2a4a7a'); g.txt('RABATZ', x + 63, y0 + 26, '#ffe860'); g.txt('97.3', x + 67, y0 + 33, '#fff');
    npc(22, 1, 10);
    desk(g, x + 4, fy, 46, 26, '#7a5a34'); R(x + 4, fy - 30, 46, 4, '#9a7a4a'); R(x + 4, fy - 30, 46, 1, '#c8a870');
    g.box(x + 10, fy - 36, 8, 6, '#2a2a30'); R(x + 12, fy - 34, 2, 2, '#3ae86a'); R(x + 30, fy - 34, 10, 4, '#f4f0e0'); R(x + 31, fy - 33, 8, 1, '#8a8a8a');
    plant(g, x + 84, fy, 1.4);
  } else if (id === 'exit') {
    wallpaper(g, x, y0, RW, FH - 6, '#d8c8a0', 'plain'); wainscot(g, x, fy, RW, '#8a6a42'); floorStrip(g, x, fy, RW, 'tiles');
    lamp(g, x + 76, y0, env);
    // Glastür mit Blick nach draußen
    g.box(x + 48, y0 + 24, 40, 68, '#4a4a58'); R(x + 51, y0 + 27, 34, 65, env.sky.top); R(x + 51, y0 + 56, 34, 36, env.sky.bot);
    R(x + 51, y0 + 78, 34, 14, env.sky.n > 0.5 ? '#1a1a2a' : '#6a6a72'); R(x + 51, y0 + 84, 34, 2, '#e8e060');
    R(x + 74, y0 + 50, 2, 30, '#2a2a30'); R(x + 71, y0 + 48, 8, 3, env.sky.n > 0.3 ? '#ffe880' : '#888');
    if (env.sky.n > 0.3) g.glow(x + 75, y0 + 51, 2, 9, 28, 0.18);
    R(x + 67, y0 + 27, 2, 65, '#4a4a58'); R(x + 53, y0 + 30, 3, 22, 'rgba(255,255,255,.3)'); R(x + 71, y0 + 30, 3, 22, 'rgba(255,255,255,.3)');
    R(x + 63, y0 + 60, 2, 8, '#e8c020'); R(x + 71, y0 + 60, 2, 8, '#e8c020');
    g.box(x + 54, y0 + 11, 28, 11, '#0c4a1c'); g.txt('EXIT', x + 58, y0 + 14, (t * 2 | 0) % 6 ? '#8fff9a' : '#4a9a5a'); R(x + 76, y0 + 15, 3, 3, '#8fff9a');
    R(x + 46, fy - 2, 44, 2, '#7a2a2a');
    plant(g, x + 12, fy, 1.2); g.box(x + 26, fy - 16, 10, 16, '#3a3a44'); R(x + 28, fy - 26, 1, 12, '#b02020'); R(x + 32, fy - 24, 1, 10, '#2a4a9a');
  } else if (id === 'dealer') {
    wallpaper(g, x, y0, RW, FH - 6, '#c8824a', 'stripes'); baseboard(g, x, fy, RW, '#c8824a'); floorStrip(g, x, fy, RW, 'parquet', '#8a5a2a');
    lamp(g, x + 20, y0, env, '#e86a3a');
    const cols = ['#e83a3a', '#e8c020', '#3a8ae8', '#3ac86a', '#e87ad8', '#f4f4f4', '#8a5ae8', '#f08a2a'];
    g.box(x + 3, y0 + 18, 58, 50, '#5a3818');
    for (let s = 0; s < 4; s++) {
      R(x + 5, y0 + 20 + s * 12, 54, 10, '#2a1808');
      for (let i = 0; i < 18; i++) { const hh = 7 + (i * 5 + s) % 3; R(x + 5 + i * 3, y0 + 30 + s * 12 - hh, 2, hh, cols[(i * 7 + s * 3) % 8]); R(x + 5 + i * 3, y0 + 31 + s * 12 - hh, 2, 1, 'rgba(255,255,255,.35)'); }
    }
    g.disc(x + 76, y0 + 30, 9, '#151518'); g.disc(x + 76, y0 + 30, 6, '#2a2a30'); g.disc(x + 76, y0 + 30, 3, '#e83a3a'); g.disc(x + 76, y0 + 30, 0, '#fff');
    g.disc(x + 72, y0 + 52, 6, '#151518'); g.disc(x + 72, y0 + 52, 2, '#e8c020');
    npc(28, 1, 5);
    desk(g, x + 6, fy, 50, 24, '#6a4220');
    g.box(x + 10, fy - 33, 14, 9, '#3a3a44'); R(x + 12, fy - 31, 6, 3, '#9ae8a0'); R(x + 20, fy - 31, 2, 2, '#e83a3a'); R(x + 12, fy - 27, 10, 1, '#888');
    g.box(x + 32, fy - 28, 18, 4, '#2a2a30'); g.disc(x + 40, fy - 29, 5, '#151518'); g.disc(x + 40, fy - 29, 1, '#e8c020'); g.line(x + 47, fy - 33, x + 43, fy - 29, '#c8c8d0');
  } else if (id === 'agency') {
    wallpaper(g, x, y0, RW, FH - 6, '#b8689c', 'dots'); baseboard(g, x, fy, RW, '#b8689c'); floorStrip(g, x, fy, RW, 'carpet', '#5a3a6a');
    lamp(g, x + 76, y0, env, '#f4f4f4');
    frame(g, x + 6, y0 + 20, 22, 30, '#f8e058', '#f4f4f4'); g.disc(x + 17, y0 + 32, 6, '#e83a3a'); for (let i = 0; i < 8; i++) g.line(x + 17, y0 + 32, x + 17 + Math.cos(i * 0.785) * 10, y0 + 32 + Math.sin(i * 0.785) * 10, '#e86a1a'); g.disc(x + 17, y0 + 32, 4, '#e83a3a'); g.txt('ZISCH', x + 8, y0 + 43, '#18181e');
    frame(g, x + 32, y0 + 26, 18, 24, '#58c8f8', '#f4f4f4'); R(x + 39, y0 + 31, 4, 3, '#f4f4f4'); R(x + 37, y0 + 34, 8, 11, '#e83a7a'); R(x + 38, y0 + 37, 6, 3, '#fff');
    // Flipchart
    R(x + 8, fy - 40, 1, 40, '#888'); R(x + 24, fy - 40, 1, 40, '#888'); g.box(x + 5, fy - 44, 23, 24, '#f4f4ee'); g.line(x + 8, fy - 25, x + 14, fy - 31, '#e83a3a'); g.line(x + 14, fy - 31, x + 18, fy - 28, '#e83a3a'); g.line(x + 18, fy - 28, x + 25, fy - 40, '#e83a3a');
    npc(64, -1);
    desk(g, x + 40, fy, 48, 22, '#e4e4f0');
    g.box(x + 46, fy - 29, 9, 7, '#e83a3a'); R(x + 47, fy - 31, 7, 2, '#b02020'); R(x + 74, fy - 34, 1, 12, '#888'); R(x + 70, fy - 37, 9, 4, '#f8e058');
    R(x + 60, fy - 24, 9, 2, '#f4f4f4'); plant(g, x + 34, fy, 0.9);
  } else if (id === 'office') {
    wallpaper(g, x, y0, RW, FH - 6, '#78b494', 'stripes'); baseboard(g, x, fy, RW, '#78b494'); floorStrip(g, x, fy, RW, 'carpet', '#3a5a6a');
    lamp(g, x + 20, y0, env);
    // Sendeplan-Tafel
    g.box(x + 4, y0 + 18, 48, 30, '#f4f0e0'); R(x + 5, y0 + 19, 46, 6, '#3a5a9c'); g.txt('SENDEPLAN', x + 9, y0 + 20, '#fff');
    for (let i = 0; i < 6; i++) {
      const s = st && st.today[i];
      R(x + 7 + i * 7, y0 + 27, 6, 18, !s ? '#ccc' : s.show ? (s.result ? '#3a9a4a' : '#e8a020') : '#d83a3a');
      if (s && s.ad) R(x + 8 + i * 7, y0 + 40, 4, 3, '#f8f060');
      R(x + 7 + i * 7, y0 + 27, 6, 1, 'rgba(255,255,255,.4)');
    }
    win(g, x + 62, y0 + 20, 22, 28, env, '#e8d8a0');
    desk(g, x + 4, fy, 44, 24, '#8a6238');
    monitor(g, x + 8, fy - 39, true); R(x + 26, fy - 27, 9, 3, '#b02020'); R(x + 27, fy - 29, 7, 2, '#d83a3a'); g.box(x + 38, fy - 30, 5, 6, '#f4f4f4'); R(x + 39, fy - 32 - ((t * 3 | 0) % 2), 1, 2, 'rgba(255,255,255,.5)');
    g.box(x + 52, fy - 24, 12, 24, '#6a7a8a'); R(x + 54, fy - 21, 8, 1, '#3a4450'); R(x + 54, fy - 13, 8, 1, '#3a4450'); R(x + 57, fy - 18, 2, 1, '#d8d8d8'); R(x + 57, fy - 10, 2, 1, '#d8d8d8');
    plant(g, x + 86, fy, 1);
  } else if (id === 'news') {
    wallpaper(g, x, y0, RW, FH - 6, '#a4a8bc', 'grid'); baseboard(g, x, fy, RW, '#a4a8bc'); floorStrip(g, x, fy, RW, 'carpet', '#4a4a5a');
    lamp(g, x + 80, y0, env, '#d8d8e0');
    g.box(x + 36, y0 + 26, 52, 28, '#3a7ab8'); R(x + 40, y0 + 31, 10, 8, '#5ab85a'); R(x + 42, y0 + 39, 6, 9, '#5ab85a'); R(x + 56, y0 + 29, 9, 6, '#5ab85a'); R(x + 58, y0 + 35, 8, 12, '#5ab85a'); R(x + 67, y0 + 30, 16, 9, '#5ab85a'); R(x + 76, y0 + 43, 7, 5, '#5ab85a');
    R(x + 61, y0 + 33, 2, 2, (t * 2 | 0) % 2 ? '#ff4a4a' : '#8a1a1a');
    const m = st ? st.minute : 600; clock(g, x + 44, y0 + 17, m, 4); clock(g, x + 60, y0 + 17, m + 360, 4); clock(g, x + 76, y0 + 17, m + 540, 4);
    g.box(x + 6, y0 + 30, 20, 16, '#2a2a30'); R(x + 8, y0 + 32, 16, 11, (t * 4 | 0) % 8 ? '#3a5a9c' : '#5a7abc'); R(x + 10, y0 + 39, 12, 2, '#e83a3a'); g.txt('NEWS', x + 9, y0 + 33, '#fff');
    npc(66, -1);
    desk(g, x + 40, fy, 50, 24, '#6a6e80');
    g.box(x + 44, fy - 33, 14, 9, '#3a3a44'); const pf = (t * 5 | 0) % 4; R(x + 47, fy - 40 - pf, 8, 8 + pf, '#f4f4ee'); R(x + 48, fy - 38 - pf, 5, 1, '#888'); R(x + 48, fy - 36 - pf, 6, 1, '#888');
    R(x + 74, fy - 27, 11, 3, '#f4f4ee'); R(x + 76, fy - 29, 11, 2, '#e4e4d8'); R(x + 73, fy - 31, 10, 2, '#f4f4ee');
    g.box(x + 22, fy - 12, 10, 12, '#55555f'); R(x + 24, fy - 15, 3, 3, '#f4f4ee'); R(x + 28, fy - 14, 3, 2, '#e4e4d8'); R(x + 16, fy - 2, 3, 2, '#f4f4ee');
  } else if (id === 'rival0') {
    wallpaper(g, x, y0, RW, FH - 6, '#f4b0cc', 'dots'); baseboard(g, x, fy, RW, '#f4b0cc'); floorStrip(g, x, fy, RW, 'carpet', '#c85a8a');
    lamp(g, x + 20, y0, env, '#ffd0e0');
    const hc = (t * 2 | 0) % 4 ? '#ff3a7a' : '#ff8ab0';
    g.disc(x + 16, y0 + 28, 6, hc); g.disc(x + 28, y0 + 28, 6, hc); for (let i = 0; i < 12; i++) R(x + 10 + i, y0 + 30 + i, 25 - i * 2, 1, hc); R(x + 13, y0 + 25, 3, 2, '#ffd0e0');
    frame(g, x + 44, y0 + 22, 22, 22, '#3a2a30'); g.disc(x + 55, y0 + 33, 7, '#e8c020'); g.disc(x + 55, y0 + 33, 2, '#3a2a30'); R(x + 51, y0 + 28, 3, 1, '#fff8c0');
    frame(g, x + 70, y0 + 26, 16, 18, '#f8e8f0', '#f4f4f4'); R(x + 76, y0 + 31, 4, 4, '#f0c0a0'); R(x + 74, y0 + 35, 8, 6, '#e86aa6');
    // Sofa
    g.box(x + 4, fy - 30, 50, 18, '#e85a9a'); g.box(x + 2, fy - 22, 8, 20, '#d04a88'); g.box(x + 48, fy - 22, 8, 20, '#d04a88'); g.box(x + 9, fy - 16, 40, 12, '#f47ab0'); R(x + 28, fy - 16, 1, 12, '#d04a88'); R(x + 6, fy - 3, 3, 3, '#5a3020'); R(x + 49, fy - 3, 3, 3, '#5a3020');
    g.box(x + 14, fy - 24, 10, 9, '#fff0a0');
    npc(34, 1);
    R(x + 62, fy - 20, 2, 20, '#c8a020'); g.box(x + 56, fy - 22, 14, 3, '#e8c84a'); g.box(x + 60, fy - 31, 6, 9, '#5ab8e8'); R(x + 62, fy - 40, 1, 9, '#3a8a3a'); g.disc(x + 62, fy - 42, 3, '#ff5a8a'); g.disc(x + 59, fy - 38, 2, '#ffe060'); g.disc(x + 66, fy - 39, 2, '#fff');
  } else if (id === 'rival1') {
    wallpaper(g, x, y0, RW, FH - 6, '#24243a', 'brick'); baseboard(g, x, fy, RW, '#24243a'); floorStrip(g, x, fy, RW, 'carpet', '#18182a');
    // Neon-Blitz und Equalizer
    const zc = (t * 3 | 0) % 5 ? '#5ad1e8' : '#b8f0ff';
    g.line(x + 10, y0 + 18, x + 18, y0 + 30, zc); g.line(x + 18, y0 + 30, x + 12, y0 + 32, zc); g.line(x + 12, y0 + 32, x + 22, y0 + 46, zc); g.line(x + 11, y0 + 18, x + 19, y0 + 30, zc); g.line(x + 13, y0 + 32, x + 23, y0 + 46, zc);
    for (let i = 0; i < 9; i++) { const hh = 4 + ((Math.sin(t * 7 + i * 1.7) + 1) * 9 | 0); for (let k = 0; k < hh; k += 3) R(x + 30 + i * 6, y0 + 46 - k, 4, 2, k > 14 ? '#ff4a6a' : k > 8 ? '#f8e058' : '#5ae86a'); }
    g.disc(x + 46, y0 + 9, 6, '#c8c8d8'); for (let i = 0; i < 7; i++) R(x + 41 + (i * 5) % 10, y0 + 5 + (i * 3) % 9, 2, 2, ((t * 6 | 0) + i) % 3 ? '#fff' : '#8a8a9a'); R(x + 46, y0, 1, 3, '#888');
    for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * 2.1; g.ctx.fillStyle = ['rgba(90,209,232,.1)', 'rgba(232,90,209,.1)', 'rgba(248,224,88,.1)'][i]; g.ctx.beginPath(); g.ctx.moveTo(x + 46, y0 + 12); g.ctx.lineTo(x + 46 + Math.sin(a) * 40 - 6, fy); g.ctx.lineTo(x + 46 + Math.sin(a) * 40 + 6, fy); g.ctx.fill(); }
    speaker(g, x + 72, fy, 18, 44, env); speaker(g, x + 74, fy - 44, 14, 20, env);
    npc(54, -1);
    g.box(x + 34, fy - 22, 38, 22, '#2e2e42'); g.box(x + 32, fy - 25, 42, 4, '#4a4a66');
    g.disc(x + 42, fy - 27, 6, '#101014'); g.disc(x + 42, fy - 27, 2, '#e85ad1'); g.disc(x + 64, fy - 27, 6, '#101014'); g.disc(x + 64, fy - 27, 2, '#5ad1e8');
    g.line(x + 42, fy - 27, x + 42 + Math.cos(t * 6) * 5, fy - 27 + Math.sin(t * 6) * 5, '#55555f'); g.line(x + 64, fy - 27, x + 64 + Math.cos(t * 6 + 2) * 5, fy - 27 + Math.sin(t * 6 + 2) * 5, '#55555f');
    for (let i = 0; i < 5; i++) R(x + 49 + i * 2, fy - 28 + (i * 3) % 4, 1, 3, '#e8e8f0');
    for (let i = 0; i < 6; i++) R(x + 38 + i * 5, fy - 16, 3, 2, ((t * 4 | 0) + i) % 3 ? '#3ae86a' : '#e83a3a');
    g.txt('BASS FM', x + 40, fy - 10, '#5ad1e8');
  } else if (id === 'boss') {
    wallpaper(g, x, y0, RW, FH - 6, '#7a2e34', 'stripes'); wainscot(g, x, fy, RW, '#4a2414'); floorStrip(g, x, fy, RW, 'carpet', '#8a1a2a');
    lamp(g, x + 22, y0, env, '#e8c84a');
    win(g, x + 6, y0 + 16, 30, 38, env, '#5a1420');
    frame(g, x + 46, y0 + 18, 22, 28, '#2a4a3a'); R(x + 53, y0 + 24, 8, 8, '#e8a888'); R(x + 51, y0 + 32, 12, 12, '#2a2a3a'); R(x + 56, y0 + 32, 2, 6, '#c02020'); R(x + 53, y0 + 23, 2, 3, '#777'); R(x + 59, y0 + 23, 2, 3, '#777');
    g.txt('CHEF', x + 49, y0 + 48, '#e8c84a');
    // Ledersessel + Chef
    g.box(x + 22, fy - 52, 24, 40, '#3a1a10'); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) R(x + 27 + i * 7, fy - 47 + j * 8, 1, 1, '#c8a020');
    person(g, x + 34, fy - 6, NPCS.boss, 0, 1);
    desk(g, x + 8, fy, 58, 28, '#5a2412'); R(x + 8, fy - 28, 58, 1, '#a85a30');
    g.box(x + 14, fy - 33, 12, 5, '#c8a020'); g.txt('BOSS', x + 13, fy - 20, '#c8a020');
    R(x + 52, fy - 30, 8, 2, '#18181e'); R(x + 54, fy - 33, 4, 3, '#18181e'); g.disc(x + 50, fy - 31, 2, '#3a8a5a');
    const s = (t * 1.5) % 5; R(x + 46 + s, fy - 50 - s * 3, 2, 2, `rgba(220,220,220,${0.7 - s * 0.13})`); R(x + 48 + s * 0.6, fy - 56 - s * 3, 2, 2, `rgba(220,220,220,${0.5 - s * 0.1})`);
    g.box(x + 72, fy - 30, 16, 30, '#4a4e58'); g.disc(x + 80, fy - 18, 4, '#2a2e36'); g.line(x + 80, fy - 18, x + 80 + Math.cos(t) * 3, fy - 18 + Math.sin(t) * 3, '#c8c8d0'); R(x + 85, fy - 20, 2, 5, '#c8a020');
  } else if (id === 'tech') {
    wallpaper(g, x, y0, RW, FH - 6, '#5e6c7c', 'grid'); baseboard(g, x, fy, RW, '#5e6c7c'); floorStrip(g, x, fy, RW, 'tiles');
    lamp(g, x + 76, y0, env, '#c8d8e8');
    for (let k = 0; k < 3; k++) {
      const bx = x + 32 + k * 19, on = st && k <= st.tx;
      g.box(bx, fy - 74, 17, 74, '#2a2e3a'); R(bx + 2, fy - 72, 13, 70, '#383e4c');
      // Bandmaschine
      g.box(bx + 2, fy - 71, 13, 16, '#55606e'); const a = on ? t * 4 + k : 0;
      for (const cx of [bx + 5, bx + 11]) { g.disc(cx, fy - 64, 2, '#c8c8d0'); g.line(cx, fy - 64, cx + Math.cos(a) * 2, fy - 64 + Math.sin(a) * 2, '#2a2a30'); }
      for (let i = 0; i < 8; i++) R(bx + 3 + (i % 4) * 3, fy - 52 + ((i / 4) | 0) * 4, 2, 2, !on ? '#4a4a55' : ((t * 3 + i * 1.3 + k) | 0) % 3 ? '#3ae83a' : '#e8c020');
      g.box(bx + 3, fy - 42, 11, 8, '#101014'); if (on) { const v = 2 + ((Math.sin(t * 5 + k) + 1) * 3 | 0); R(bx + 4, fy - 36, v, 1, '#3ae86a'); R(bx + 4, fy - 39, 9 - v, 1, '#e8c020'); }
      for (let i = 0; i < 4; i++) R(bx + 3, fy - 30 + i * 5, 11, 3, '#22262e');
      R(bx + 4, fy - 8, 9, 5, '#101014');
    }
    g.box(x + 6, y0 + 28, 18, 18, '#e8c020'); for (let i = 0; i < 7; i++) R(x + 14 - i * 0.5 - 0.5, y0 + 32 + i, 1 + i, 1, '#18181e'); R(x + 14, y0 + 36, 2, 3, '#e8c020');
    g.box(x + 6, fy - 46, 10, 16, '#888e9a'); R(x + 10, fy - 44, 2, 12, '#3a3e48'); R(x + 9, st && st.tx > 1 ? fy - 44 : fy - 36, 4, 4, '#e83a3a');
    for (let i = 0; i < 3; i++) g.line(x + 26, fy - 8 - i * 3, x + 34, fy - 4 - i * 2, ['#e83a3a', '#3a8ae8', '#e8c020'][i]);
    npc(62, -1);
    g.box(x + 76, fy - 9, 14, 9, '#c02020'); R(x + 80, fy - 12, 6, 3, '#8a1414');
  }
  // Türschild
  const sw = txtW(room.sign, 2) + 6, sx = room.side === 'L' ? x + RW - sw - 2 : x + 2;
  g.box(sx, y0 + 1, sw, 14, '#16161e');
  g.txt(room.sign, sx + 3, y0 + 3, id === 'office' ? '#8fff9a' : id.startsWith('rival') ? RIVALS[+id[5]].color : '#ffe9a0', 2);
}

// ---------- Szene ----------
export class Scene {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.g = pen(this.ctx);
    this.p = { x: ROOMS[4].x, floor: 2, state: 'idle', dir: -1, anim: 0 };
    this.carY = floorY(2); this.target = null; this.cb = null; this.t = 0;
    this.follow = true; this.cam = this.camTarget();
  }
  get H() { return this.cv.height; }
  camTarget() { const y = this.p.state === 'ride' ? this.carY : floorY(this.p.floor); return Math.max(0, Math.min(WORLD_H - this.H, y - this.H * 0.6)); }
  pan(dy) { this.follow = false; this.cam = Math.max(0, Math.min(WORLD_H - this.H, this.cam + dy)); }
  roomAt(lx, ly) {
    const wy = ly + this.cam, f = Math.floor((floorY(0) - wy) / FH);
    if (f < 0 || f >= NF || wy < ROOF || (lx > SH_L && lx < SH_R)) return null;
    return ROOMS.find(r => r.floor === f && r.side === (lx < LIFT_X ? 'L' : 'R')) || null;
  }
  goTo(room, cb) {
    if (this.p.state === 'ride') return;
    this.target = room; this.cb = cb; this.follow = true;
    this.p.state = room.floor === this.p.floor ? 'walk' : 'toLift';
  }
  update(dt) {
    this.t += dt;
    const p = this.p, WALK = 78, LIFT = 190;
    const walkTo = tx => {
      const d = tx - p.x, step = WALK * dt;
      p.dir = d >= 0 ? 1 : -1; p.anim += dt * 9;
      if (Math.abs(d) <= step) { p.x = tx; return true; }
      p.x += Math.sign(d) * step; return false;
    };
    const liftTo = ty => {
      const d = ty - this.carY, step = LIFT * dt;
      if (Math.abs(d) <= step) { this.carY = ty; return true; }
      this.carY += Math.sign(d) * step; return false;
    };
    if (p.state === 'toLift') { if (walkTo(LIFT_X)) p.state = 'wait'; }
    else if (p.state === 'wait') { if (liftTo(floorY(p.floor))) p.state = 'ride'; }
    else if (p.state === 'ride') { if (liftTo(floorY(this.target.floor))) { p.floor = this.target.floor; p.state = 'walk'; } }
    else if (p.state === 'walk') {
      if (walkTo(this.target.x)) { p.state = 'idle'; const cb = this.cb; this.cb = null; if (cb) cb(this.target); }
    }
    if (this.follow) this.cam += (this.camTarget() - this.cam) * Math.min(1, dt * 5);
  }

  // Großes Raumbild für den Dialogkopf
  drawBanner(canvas, id, st) {
    const room = ROOMS.find(r => r.id === id), c = canvas.getContext('2d'), g = pen(c);
    const focus = { foyer: 26, exit: 62, dealer: 30, agency: 60, office: 30, news: 60, rival0: 34, rival1: 54, boss: 36, tech: 58 }[id];
    const ox = Math.max(0, Math.min(RW - canvas.width, focus - canvas.width / 2));
    c.save(); c.translate(-(room.left + ox), -(floorY(room.floor) - canvas.height));
    drawRoom(g, room, { st, t: this.t, sky: skyAt((st ? st.minute : 600) / 60) });
    c.restore();
  }

  draw(st, onAir) {
    const c = this.ctx, g = this.g, R = g.R, t = this.t, H = this.H, cam = Math.round(Math.max(0, Math.min(WORLD_H - H, this.cam)));
    const h = (st ? st.minute : 600) / 60, sky = skyAt(h), env = { st, t, sky };
    // Himmel (Bildschirmraum, mit leichter Parallaxe)
    for (let y = 0; y < H; y += 6) R(0, y, W, 6, mix2(sky.top, sky.bot, Math.min(1, (y + cam * 0.5) / 190)));
    if (sky.n > 0.05) { c.globalAlpha = sky.n; for (let i = 0; i < 40; i++) R((i * 53 + 17) % W, (i * 37 + 9) % 150 - cam * 0.3, 1, 1, (i + (t * 1.5 | 0)) % 7 ? '#fff' : '#99a'); g.disc(64, 26 - cam * 0.3 | 0, 9, '#f4f0d0'); g.disc(60, 23 - cam * 0.3 | 0, 7, sky.top); c.globalAlpha = 1; }
    if (sky.n < 0.9 && h > 5.5 && h < 20.5) { const k = (h - 6) / 14, sx = 20 + k * 200, sy = 80 - Math.sin(k * Math.PI) * 60 - cam * 0.3; c.globalAlpha = 1 - sky.n * 0.6; g.disc(sx | 0, sy | 0, 10, '#fff0a0'); g.disc(sx | 0, sy | 0, 8, '#ffd840'); c.globalAlpha = 1; }
    c.globalAlpha = 0.85 - sky.n * 0.6;
    for (let i = 0; i < 3; i++) { const cx = ((t * (3 + i) + i * 110) % (W + 80)) - 40, cy = 20 + i * 22 - cam * 0.4; R(cx, cy, 34, 6, '#fff'); R(cx + 6, cy - 4, 18, 4, '#fff'); R(cx + 4, cy + 6, 24, 2, '#e0e8f4'); }
    c.globalAlpha = 1;
    c.save(); c.translate(0, -cam);
    // Skyline hinter dem Dach
    const lit = sky.n > 0.5;
    for (let i = 0; i < 12; i++) { const bx = i * 21 - 4, bh = 14 + (i * 13) % 26; R(bx, ROOF - bh, 20, bh + 4, lit ? '#10102a' : '#6a7a9a'); for (let k = 3; k < bh - 2; k += 5) for (let j = 2; j < 17; j += 5) if ((i + k + j) % 3) R(bx + j, ROOF - bh + k, 2, 2, lit ? '#ffe880' : '#8a9ab8'); }
    // Gebäude
    R(XL - 4, ROOF, XR - XL + 8, NF * FH, '#6e6e84');
    for (const room of ROOMS) if (floorY(room.floor) > cam - 4 && floorY(room.floor) - FH < cam + H) drawRoom(g, room, env);
    // Geschossdecken
    for (let f = 0; f <= NF; f++) { const y = floorY(f); if (f < NF) { R(XL, y - FH, XR - XL, 6, '#54546a'); R(XL, y - FH, XR - XL, 1, '#3a3a4c'); R(XL, y - FH + 5, XR - XL, 1, '#7a7a92'); } }
    // Aufzugschacht
    R(SH_L, ROOF, 40, NF * FH, '#1c1c28');
    for (let y = ROOF; y < ROOF + NF * FH; y += 8) { R(SH_L + 1, y, 38, 1, '#262636'); for (let i = (y % 16 ? 5 : 13); i < 38; i += 16) R(SH_L + i, y, 1, 8, '#262636'); }
    R(SH_L, ROOF, 2, NF * FH, '#4a4a60'); R(SH_R - 2, ROOF, 2, NF * FH, '#4a4a60'); R(SH_L + 4, ROOF, 1, NF * FH, '#33334a'); R(SH_R - 5, ROOF, 1, NF * FH, '#33334a');
    const cy = Math.round(this.carY);
    R(LIFT_X - 2, ROOF, 1, cy - 62 - ROOF, '#8a8a9a'); R(LIFT_X + 1, ROOF, 1, cy - 62 - ROOF, '#5a5a6a');
    for (let f = 0; f < NF; f++) {
      const y = floorY(f); R(SH_L, y, 40, 2, '#54546a'); R(SH_L, y - FH, 40, 6, '#54546a'); R(SH_L, y - FH + 5, 40, 1, '#7a7a92');
      const here = Math.abs(cy - y) < 3; g.box(LIFT_X - 7, y - FH + 9, 15, 14, '#16161e'); g.txt(String(f), LIFT_X - 2, y - FH + 11, here ? '#ffe860' : '#6a6a8a', 2);
    }
    // Kabine
    R(SH_L + 3, cy - 64, 34, 3, '#8a8a9a'); g.box(SH_L + 3, cy - 61, 34, 61, '#b8a878'); R(SH_L + 5, cy - 59, 30, 56, '#ece0b4'); R(SH_L + 5, cy - 59, 30, 5, '#fff8d8');
    R(SH_L + 5, cy - 30, 30, 2, '#c8a020'); for (let i = 0; i < 4; i++) R(SH_L + 9 + i * 8, cy - 27, 1, 24, '#d8cc9c'); R(SH_L + 5, cy - 3, 30, 3, '#7a6a48');
    g.box(SH_L + 29, cy - 46, 5, 10, '#55555f'); R(SH_L + 31, cy - 44, 1, 1, '#3ae86a'); R(SH_L + 31, cy - 41, 1, 1, '#e83a3a');
    const p = this.p;
    if (p.state === 'ride') person(g, LIFT_X, cy - 3, PLAYER, 0, 1);
    else person(g, p.x, floorY(p.floor), PLAYER, p.state === 'walk' || p.state === 'toLift' ? 1 + ((p.anim | 0) % 4) : 0, p.dir);
    // Außenwände
    for (const wx of [XL - 4, XR]) { R(wx, ROOF, 4, NF * FH, '#8a8aa0'); R(wx, ROOF, 1, NF * FH, '#a4a4bc'); R(wx + 3, ROOF, 1, NF * FH, '#5a5a70'); }
    // Dach
    R(XL - 6, ROOF - 6, XR - XL + 12, 6, '#8a8aa0'); R(XL - 6, ROOF - 6, XR - XL + 12, 1, '#b4b4cc'); R(XL - 6, ROOF - 1, XR - XL + 12, 1, '#4a4a60');
    // Leuchtschrift
    R(22, ROOF - 16, 2, 10, '#55556a'); R(94, ROOF - 16, 2, 10, '#55556a'); g.line(24, ROOF - 16, 34, ROOF - 6, '#44445a'); g.line(94, ROOF - 16, 84, ROOF - 6, '#44445a');
    g.box(8, ROOF - 46, 102, 30, '#14141e');
    if (lit) { c.fillStyle = 'rgba(255,74,106,.16)'; c.fillRect(2, ROOF - 52, 114, 42); }
    const fl = (t * 7 | 0) % 23 === 0;
    g.txt('RADIO', 20, ROOF - 43, fl ? '#7a2a3a' : '#ff5a7a', 2); g.txt('RABATZ', 14, ROOF - 30, '#ffe860', 3);
    // Sendemast (wächst mit dem Ausbau)
    const tx = st ? st.tx : 0, top = 30 - tx * 5;
    for (let y = ROOF - 6; y > top; y--) { const hw = 1 + ((y - top) / (ROOF - 6 - top)) * 7; R(LIFT_X + 20 - hw, y, 1, 1, '#d0d0e0'); R(LIFT_X + 20 + hw, y, 1, 1, '#a0a0b4'); if ((y - top) % 7 === 0) R(LIFT_X + 20 - hw, y, hw * 2, 1, '#b8b8cc'); if ((y - top) % 14 < 7) R(LIFT_X + 20 - hw + ((y - top) % 7) * hw * 2 / 7, y, 1, 1, '#8a8aa0'); }
    R(LIFT_X + 19, top - 8, 2, 9, '#e8e8f4'); R(LIFT_X + 18, top - 11, 4, 3, (t * 2 | 0) % 2 ? '#ff3030' : '#801010');
    if (onAir) { const k = (t * 3 | 0) % 3; for (let i = 0; i <= k; i++) for (let a = -0.9; a <= 0.9; a += 0.15) { const r = 9 + i * 7; R(LIFT_X + 20 + Math.cos(a) * r, top - 9 + Math.sin(a) * r, 1, 1, '#ffe860'); R(LIFT_X + 20 - Math.cos(a) * r, top - 9 + Math.sin(a) * r, 1, 1, '#ffe860'); } }
    if (tx >= 1) { R(182, ROOF - 30, 1, 24, '#c8c8d8'); R(178, ROOF - 26, 9, 1, '#c8c8d8'); R(180, ROOF - 21, 5, 1, '#c8c8d8'); }
    if (tx >= 3) { R(212, ROOF - 22, 2, 16, '#8a8a9a'); g.disc(210, ROOF - 26, 8, '#d8d8e4'); g.disc(212, ROOF - 27, 6, '#a8a8b8'); g.line(210, ROOF - 26, 203, ROOF - 34, '#55556a'); }
    if (tx >= 4) { g.disc(226, ROOF - 14, 5, '#d8d8e4'); g.disc(227, ROOF - 15, 3, '#a8a8b8'); }
    g.box(170, ROOF - 62, 54, 16, '#14141e'); g.txt('ON AIR', 174, ROOF - 59, onAir ? ((t * 2 | 0) % 8 ? '#ff4040' : '#ff9090') : '#4a1a1a', 2);
    if (onAir && lit) { c.fillStyle = 'rgba(255,64,64,.14)'; c.fillRect(165, ROOF - 67, 64, 26); }
    R(176, ROOF - 46, 2, 40, '#55556a'); R(216, ROOF - 46, 2, 40, '#55556a');
    // Gehweg
    const gy = floorY(0); R(0, gy, W, 14, '#4a4a52'); R(0, gy, W, 2, '#8a8a92'); for (let i = 0; i < W; i += 20) R(i, gy + 2, 1, 5, '#3a3a42'); R(0, gy + 7, W, 1, '#2a2a30'); R(0, gy + 8, W, 6, '#26262c');
    c.restore();
  }
}
function mix2(a, b, f) {
  const pa = a.match(/\d+/g).map(Number), pb = b.match(/\d+/g).map(Number);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * f)).join(',')})`;
}
