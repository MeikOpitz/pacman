// Sendefieber – Pixelgrafik: Hochhaus-Querschnitt, Figuren, Porträts (alles prozedural gezeichnet)
import { RIVALS } from './data.js';

export const W = 180, H = 320;
const FLOOR_H = 50, GROUND = 312, SHAFT_L = 78, SHAFT_R = 102, LIFT_X = 90;
const floorY = f => GROUND - f * FLOOR_H;

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
].map(r => ({ ...r, x: r.side === 'L' ? 44 : 136, left: r.side === 'L' ? 6 : SHAFT_R }));

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
export function text(ctx, s, x, y, c) {
  ctx.fillStyle = c;
  for (const ch of String(s).toUpperCase()) {
    const g = F[ch] || F[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(x + (i % 3), y + ((i / 3) | 0), 1, 1);
    x += 4;
  }
}
const textW = s => String(s).length * 4 - 1;

// ---------- Figuren ----------
export const NPCS = {
  foyer:  { name: 'Pförtner Pachulke', skin: '#e8b890', hair: '#888', shirt: '#3a5a8c', acc: 'cap' },
  exit:   { name: 'Ausgang', skin: '#e8b890', hair: '#444', shirt: '#555', acc: 'none' },
  dealer: { name: 'Rillen-Rudi', skin: '#d9a070', hair: '#5a3a1a', shirt: '#c8421e', acc: 'headphones' },
  agency: { name: 'Gloria Klimper', skin: '#f0c8a8', hair: '#d8b020', shirt: '#8c2a6a', acc: 'glasses', big: true },
  office: { name: 'Dein Büro', skin: '#e8b890', hair: '#3a2a1a', shirt: '#2e8c5a', acc: 'none' },
  news:   { name: 'Redakteur Ticker', skin: '#e0b088', hair: '#222', shirt: '#d8d8c8', acc: 'moustache' },
  rival0: { name: 'Sülzmann (Radio Schmalz)', skin: '#f0c0a0', hair: '#e8e0d0', shirt: '#e86aa6', acc: 'none', big: true },
  rival1: { name: 'DJ Dezibel (Bass FM)', skin: '#b88058', hair: '#111', shirt: '#208ca8', acc: 'shades' },
  boss:   { name: 'Direktor Wummer', skin: '#e8a888', hair: '#666', shirt: '#2a2a3a', acc: 'cigar', bald: true },
  tech:   { name: 'Technikerin Lötkolb', skin: '#e8b890', hair: '#b83a1a', shirt: '#d8a020', acc: 'none', big: true },
};
const PLAYER = { skin: '#e8b890', hair: '#3a2a1a', shirt: '#2e8c5a', pants: '#24304a' };

function person(ctx, x, y, p, frame = 0, dir = 1) {
  const r = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  const pants = p.pants || '#33333f';
  // Beine
  r(-3, -5, 3, frame === 1 ? 4 : 5, pants); r(1, -5, 3, frame === 2 ? 4 : 5, pants);
  r(-3 - (frame === 1 ? dir : 0), -1, 3, 1, '#111'); r(1 + (frame === 2 ? dir : 0), -1, 3, 1, '#111');
  // Körper
  r(-4, -12, 9, 7, p.shirt);
  r(-5, -11, 1, 5, p.shirt); r(5, -11, 1, 5, p.shirt);
  r(-5, -6, 1, 1, p.skin); r(5, -6, 1, 1, p.skin);
  // Kopf
  r(-3, -18, 7, 6, p.skin);
  if (!p.bald) r(-3, -19, 7, 2, p.hair); else r(-3, -17, 1, 2, p.hair), r(3, -17, 1, 2, p.hair);
  if (p.big) { r(-4, -18, 1, 5, p.hair); r(4, -18, 1, 5, p.hair); }
  r(dir > 0 ? 0 : -1, -16, 1, 1, '#111'); r(dir > 0 ? 2 : 1, -16, 1, 1, '#111');
  if (p.acc === 'cap') { r(-3, -20, 7, 2, '#22335a'); r(dir > 0 ? 2 : -5, -18, 4, 1, '#22335a'); }
  if (p.acc === 'cigar') r(dir > 0 ? 3 : -5, -14, 3, 1, '#6a3a1a');
  if (p.acc === 'shades') r(-2, -16, 5, 1, '#111');
  if (p.acc === 'headphones') { r(-4, -17, 1, 3, '#222'); r(4, -17, 1, 3, '#222'); r(-3, -20, 7, 1, '#222'); }
  if (p.acc === 'moustache') r(-1, -14, 4, 1, '#222');
}

// Porträt für die Raum-Dialoge (24x24)
export function drawPortrait(canvas, id) {
  const p = NPCS[id] || NPCS.office, c = canvas.getContext('2d');
  const r = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  r(0, 0, 24, 24, '#3a4a7a'); r(0, 16, 24, 8, '#2a365a');
  r(3, 19, 18, 5, p.shirt); r(5, 18, 14, 1, p.shirt); r(10, 16, 4, 3, p.skin);
  r(7, 5, 10, 12, p.skin); r(6, 8, 1, 5, p.skin); r(17, 8, 1, 5, p.skin);
  if (p.bald) { r(6, 7, 1, 4, p.hair); r(17, 7, 1, 4, p.hair); }
  else { r(7, 3, 10, 3, p.hair); r(6, 4, 1, 4, p.hair); r(17, 4, 1, 4, p.hair); }
  if (p.big) { r(5, 4, 2, 12, p.hair); r(17, 4, 2, 12, p.hair); r(7, 2, 10, 2, p.hair); }
  r(9, 9, 2, 2, '#fff'); r(13, 9, 2, 2, '#fff'); r(10, 10, 1, 1, '#111'); r(14, 10, 1, 1, '#111');
  r(11, 12, 2, 1, '#00000030'); r(10, 14, 4, 1, '#8a3a2a');
  if (p.acc === 'glasses') { c.strokeStyle = '#111'; c.lineWidth = 1; c.strokeRect(8.5, 8.5, 3, 3); c.strokeRect(12.5, 8.5, 3, 3); }
  if (p.acc === 'shades') { r(8, 9, 4, 2, '#111'); r(12, 9, 4, 2, '#111'); }
  if (p.acc === 'cap') { r(6, 2, 12, 4, '#22335a'); r(6, 6, 12, 1, '#111'); r(11, 3, 2, 2, '#e8c020'); }
  if (p.acc === 'cigar') { r(14, 14, 6, 1, '#6a3a1a'); r(20, 14, 1, 1, '#f84'); r(20, 11, 1, 2, '#ccc'); r(21, 9, 1, 2, '#aaa'); }
  if (p.acc === 'headphones') { r(5, 7, 2, 6, '#222'); r(17, 7, 2, 6, '#222'); r(6, 2, 12, 2, '#222'); }
  if (p.acc === 'moustache') { r(9, 13, 6, 1, '#222'); r(8, 14, 1, 1, '#222'); r(15, 14, 1, 1, '#222'); }
}

// ---------- Szene ----------
export class Scene {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.p = { x: 44, floor: 2, state: 'idle', dir: 1, anim: 0 };
    this.carY = floorY(2); this.target = null; this.cb = null; this.t = 0;
  }
  get busy() { return this.p.state !== 'idle'; }
  roomAt(lx, ly) {
    const f = Math.floor((GROUND - ly) / FLOOR_H);
    if (f < 0 || f > 4 || (lx > SHAFT_L && lx < SHAFT_R)) return null;
    return ROOMS.find(r => r.floor === f && r.side === (lx < LIFT_X ? 'L' : 'R')) || null;
  }
  goTo(room, cb) {
    if (this.p.state === 'ride') return; // im Aufzug nicht umentscheiden
    this.target = room; this.cb = cb;
    this.p.state = room.floor === this.p.floor ? 'walk' : 'toLift';
  }
  update(dt) {
    this.t += dt;
    const p = this.p, WALK = 62, LIFT = 115;
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
  }

  draw(st, onAir) {
    const c = this.ctx, t = this.t;
    const r = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    // Himmel je nach Uhrzeit
    const h = (st ? st.minute : 600) / 60;
    const sky = h < 5.5 ? ['#0a0a28', '#1a1a48'] : h < 7.5 ? ['#3a3a78', '#e8946a'] : h < 18 ? ['#4a9ae8', '#a8d8f8']
      : h < 20.5 ? ['#3a3a88', '#f07848'] : ['#0a0a28', '#1a1a48'];
    const night = h < 6 || h >= 20;
    for (let y = 0; y < 62; y += 4) r(0, y, W, 4, y < 28 ? sky[0] : sky[1]);
    r(0, 26, W, 2, sky[1]); r(0, 22, W, 1, sky[1]);
    if (night) for (let i = 0; i < 16; i++) r((i * 47 + 13) % W, (i * 29 + 5) % 44, 1, 1, (i + (t | 0)) % 5 ? '#fff' : '#886');
    else { r(150, 10, 10, 10, '#f8e058'); r(152, 8, 6, 14, '#f8e058'); r(148, 12, 14, 6, '#f8e058'); }
    // Nachbarhäuser
    r(0, 44, 4, 276, '#2a2a40'); r(176, 36, 4, 284, '#2a2a40');
    // Dach & Antenne
    r(2, 58, 176, 4, '#55556a'); r(20, 54, 30, 4, '#6a6a80'); r(120, 52, 14, 6, '#6a6a80');
    r(89, 14, 2, 44, '#c8c8d8'); r(84, 22, 12, 1, '#c8c8d8'); r(86, 30, 8, 1, '#c8c8d8'); r(80, 50, 20, 8, '#88889a');
    r(89, 11, 2, 3, (t * 2 | 0) % 2 ? '#f33' : '#800');
    if (onAir) {
      const k = (t * 3 | 0) % 3; c.fillStyle = '#ffe860';
      for (let i = 0; i <= k; i++) { c.fillRect(81 - i * 5, 12 - i * 2, 1, 5 + i * 4); c.fillRect(98 + i * 5, 12 - i * 2, 1, 5 + i * 4); }
    }
    r(140, 46, 30, 9, '#181820'); text(c, 'ON AIR', 144, 48, onAir ? '#f44' : '#522');
    // Gebäude
    r(4, 62, 172, 250, '#77778c');
    r(0, GROUND, W, 8, '#3a3a3a'); r(0, GROUND, W, 1, '#5a5a5a');
    for (const room of ROOMS) this.drawRoom(c, r, room, st, t);
    // Decken & Schacht
    for (let f = 0; f <= 5; f++) r(4, floorY(f) - (f ? 0 : 0), 172, 2, '#44445a');
    r(SHAFT_L, 62, 24, 250, '#22222e'); r(SHAFT_L, 62, 1, 250, '#55556a'); r(SHAFT_R - 1, 62, 1, 250, '#55556a');
    r(LIFT_X - 1, 62, 1, this.carY - 62 - 30, '#666'); r(LIFT_X, 62, 1, this.carY - 62 - 30, '#444');
    for (let f = 0; f < 5; f++) { r(SHAFT_L, floorY(f), 24, 2, '#44445a'); text(c, String(f), SHAFT_L + 2, floorY(f) - 47, '#77a'); }
    // Kabine
    const cy = Math.round(this.carY);
    r(SHAFT_L + 2, cy - 30, 20, 30, '#b8a878'); r(SHAFT_L + 3, cy - 29, 18, 27, '#e8dcb0'); r(SHAFT_L + 2, cy - 2, 20, 2, '#7a6a48');
    r(SHAFT_L + 3, cy - 29, 18, 2, '#fff8d8');
    const p = this.p;
    if (p.state === 'ride') person(c, LIFT_X, cy - 2, PLAYER, 0, 1);
    else person(c, p.x, floorY(p.floor), PLAYER, p.state === 'idle' || p.state === 'wait' ? 0 : 1 + ((p.anim | 0) % 2), p.dir);
    if (night) { c.fillStyle = 'rgba(10,10,60,0.18)'; c.fillRect(0, 0, W, H); }
  }

  drawRoom(c, r, room, st, t) {
    const x = room.left, fy = floorY(room.floor), y0 = fy - FLOOR_H + 2, w = 72, id = room.id;
    const wall = { foyer: '#b8a888', exit: '#b8a888', dealer: '#c88a5a', agency: '#b06a9a', office: '#6aa888', news: '#a8a8b8',
      rival0: '#f0a8c8', rival1: '#28283a', boss: '#7a3a3a', tech: '#5a6a7a' }[id];
    r(x, y0, w, FLOOR_H - 2, wall);
    r(x, fy - 6, w, 6, '#00000030'); r(x, fy - 1, w, 1, '#00000040');
    const L = room.side === 'L', ox = a => x + (L ? a : w - a); // ox: Abstand von der Außenwand
    const npcX = x + (L ? 16 : w - 16);
    if (id === 'foyer') {
      r(x + 4, y0 + 14, 16, 12, '#6a5a3a'); for (let i = 0; i < 6; i++) r(x + 6 + (i % 3) * 5, y0 + 16 + ((i / 3) | 0) * 5, 2, 3, '#e8c020');
      person(c, npcX, fy, NPCS.foyer, 0, 1); r(x + 6, fy - 12, 24, 12, '#7a5a3a'); r(x + 5, fy - 13, 26, 2, '#9a7a4a');
      r(x + 54, fy - 16, 6, 16, '#3a7a3a'); r(x + 55, fy - 5, 4, 5, '#8a4a2a');
    } else if (id === 'exit') {
      r(x + 44, y0 + 12, 22, 34, '#88c8e8'); r(x + 54, y0 + 12, 2, 34, '#44445a'); r(x + 44, y0 + 12, 22, 2, '#44445a');
      r(x + 46, y0 + 16, 3, 10, '#c8e8f8'); r(x + 48, y0 + 5, 14, 6, '#1a6a2a'); text(c, 'EXIT', x + 49, y0 + 6, '#afa');
      r(x + 8, fy - 14, 5, 14, '#3a7a3a'); r(x + 7, fy - 5, 7, 5, '#8a4a2a');
    } else if (id === 'dealer') {
      const cols = ['#e83a3a', '#e8c020', '#3a8ae8', '#3ac86a', '#e87ad8', '#f8f8f8'];
      for (let s = 0; s < 3; s++) { r(x + 4, y0 + 12 + s * 9, 36, 1, '#5a3a1a'); for (let i = 0; i < 11; i++) r(x + 5 + i * 3, y0 + 6 + s * 9, 2, 6, cols[(i * 7 + s * 3) % 6]); }
      r(x + 28, fy - 10, 22, 10, '#5a3a1a'); r(x + 27, fy - 11, 24, 2, '#8a5a2a');
      r(x + 31, fy - 15, 8, 4, '#222'); r(x + 34, fy - 14, 2, 2, '#e83a3a');
      person(c, npcX, fy, NPCS.dealer, 0, 1);
    } else if (id === 'agency') {
      r(x + 6, y0 + 12, 12, 14, '#f8e058'); r(x + 8, y0 + 15, 8, 3, '#e83a3a'); r(x + 8, y0 + 20, 8, 2, '#222');
      r(x + 22, y0 + 12, 12, 14, '#58c8f8'); r(x + 26, y0 + 15, 4, 8, '#fff');
      r(x + 30, fy - 10, 26, 10, '#d8d8e8'); r(x + 29, fy - 11, 28, 2, '#f8f8f8'); r(x + 46, fy - 16, 6, 5, '#3a3a4a');
      person(c, npcX, fy, NPCS.agency, 0, -1);
    } else if (id === 'office') {
      // Sendeplan an der Wand: spiegelt den heutigen Plan
      r(x + 6, y0 + 12, 28, 16, '#f8f8e8'); r(x + 6, y0 + 12, 28, 3, '#3a5a8c');
      if (st) st.today.forEach((s, i) => r(x + 8 + i * 4, y0 + 17, 3, 9, s.show ? (s.result ? '#3a8a3a' : '#e8a020') : '#d83a3a'));
      r(x + 44, fy - 10, 24, 10, '#7a5a3a'); r(x + 43, fy - 11, 26, 2, '#9a7a4a');
      r(x + 48, fy - 17, 8, 6, '#c8c8b8'); r(x + 49, fy - 16, 6, 4, (t * 2 | 0) % 2 ? '#3a8a5a' : '#2a6a4a');
      r(x + 60, fy - 14, 4, 3, '#e83a3a'); r(x + 38, fy - 14, 4, 14, '#3a7a3a');
    } else if (id === 'news') {
      r(x + 30, y0 + 11, 36, 16, '#58a8d8'); r(x + 34, y0 + 14, 8, 6, '#6ac86a'); r(x + 46, y0 + 13, 10, 9, '#6ac86a'); r(x + 58, y0 + 18, 5, 5, '#6ac86a');
      r(x + 6, fy - 10, 28, 10, '#6a6a7a'); r(x + 5, fy - 11, 30, 2, '#8a8a9a');
      r(x + 8, fy - 17, 9, 6, '#3a3a3a'); r(x + 10, fy - 20 - ((t * 4 | 0) % 3), 5, 4 + ((t * 4 | 0) % 3), '#f8f8f8');
      r(x + 22, fy - 13, 8, 2, '#f8f8f8'); r(x + 24, fy - 15, 8, 2, '#e8e8d8');
      person(c, npcX, fy, NPCS.news, 0, -1);
    } else if (id === 'rival0') {
      r(x + 24, y0 + 12, 14, 12, '#e83a7a'); r(x + 26, y0 + 10, 4, 4, '#e83a7a'); r(x + 32, y0 + 10, 4, 4, '#e83a7a'); r(x + 28, y0 + 24, 6, 3, '#e83a7a'); r(x + 30, y0 + 27, 2, 2, '#e83a7a');
      r(x + 44, fy - 12, 22, 12, '#f8d8e8'); r(x + 46, fy - 20, 3, 8, '#3a7a3a'); r(x + 44, fy - 23, 7, 4, '#f85a8a');
      person(c, npcX, fy, NPCS.rival0, 0, 1);
    } else if (id === 'rival1') {
      for (const bx of [8, 26]) { r(x + bx, fy - 30, 14, 30, '#111'); r(x + bx + 3, fy - 27, 8, 8, '#444'); r(x + bx + 5, fy - 25, 4, 4, (t * 6 | 0) % 2 ? '#5ad1e8' : '#222'); r(x + bx + 2, fy - 16, 10, 12, '#444'); r(x + bx + 5, fy - 13, 4, 6, '#222'); }
      for (let i = 0; i < 6; i++) { const hh = 3 + ((Math.sin(t * 7 + i * 1.7) + 1) * 5 | 0); r(x + 6 + i * 6, y0 + 20 - hh, 4, hh, i % 2 ? '#5ad1e8' : '#e85ad1'); }
      person(c, npcX, fy, NPCS.rival1, 0, -1);
    } else if (id === 'boss') {
      r(x + 8, y0 + 10, 20, 16, '#c8a020'); r(x + 10, y0 + 12, 16, 12, '#3a5a3a'); r(x + 15, y0 + 15, 6, 6, '#e8b890');
      r(x + 18, fy - 12, 34, 12, '#3a1a0a'); r(x + 17, fy - 13, 36, 2, '#5a2a1a'); r(x + 40, fy - 17, 6, 4, '#e8c020');
      person(c, x + 26, fy - 4, NPCS.boss, 0, 1); r(x + 18, fy - 12, 34, 12, '#3a1a0a'); r(x + 17, fy - 13, 36, 2, '#5a2a1a');
      const s = (t * 2) % 6; r(x + 30 + s / 2, fy - 22 - s, 2, 2, '#ccc');
      r(x + 60, fy - 20, 6, 20, '#3a7a3a');
    } else if (id === 'tech') {
      for (let k = 0; k < 3; k++) { const bx = x + 26 + k * 15; r(bx, fy - 36, 12, 36, '#2a2a3a'); r(bx + 1, fy - 35, 10, 34, '#3a3a4a');
        for (let i = 0; i < 6; i++) r(bx + 2 + (i % 2) * 5, fy - 33 + ((i / 2) | 0) * 6, 3, 2, ((t * 3 + i * 1.3 + k) | 0) % 3 ? (st && k <= st.tx ? '#3ae83a' : '#555') : '#e8c020');
        r(bx + 2, fy - 12, 8, 6, '#111'); }
      person(c, npcX - 4, fy, NPCS.tech, 0, 1);
    }
    // Türschild
    const sw = textW(room.sign) + 4, sx = L ? x + w - sw - 2 : x + 2;
    r(sx, y0 + 1, sw, 8, '#181820'); text(c, room.sign, sx + 2, y0 + 3, id === 'office' ? '#8f8' : id.startsWith('rival') ? RIVALS[+id[5]].color : '#f8e8a0');
  }
}
