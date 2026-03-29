// charselect.js – Charakter-Auswahl (built-in + custom)

import { loadCustomSkins } from './skinstorage.js';
import { drawCustomSkin }  from './customskin.js';

// ── Built-in Skins ────────────────────────────────────────────
export const CHARACTERS = ['pacman', 'cat', 'dog', 'sonic', 'pikachu', 'felori', 'wuffels'];
const LABELS            = ['PAC-MAN', 'KATZE', 'HUND', 'SONIC', 'PIKACHU', 'FELORI', 'WUFFELS'];

// ── Custom Skins (wird bei Aufruf refreshCustomSkins() geladen) ─
let _custom = [];

export function refreshCustomSkins() {
  _custom = loadCustomSkins();
}

function _all() {
  return [...CHARACTERS, ..._custom];
}

// Gibt den gewählten Eintrag zurück: string (built-in) oder Skin-Objekt (custom)
export function getSelectedChar(cs) {
  return _all()[cs.index] ?? CHARACTERS[0];
}

// ── Grid-Layout ───────────────────────────────────────────────
const GRID_XS   = [37, 112, 187];
const GRID_TOP  = 62;
const ROW_H     = 58;
const GRID_BOT  = 258; // untere Grenze für sichtbare Zellen
const MAX_ROWS  = Math.floor((GRID_BOT - GRID_TOP) / ROW_H); // 3

function _pos(i, scrollRow) {
  return { x: GRID_XS[i % 3], y: GRID_TOP + (Math.floor(i / 3) - scrollRow) * ROW_H };
}

function _scrollRow(index, totalSlots) {
  const selectedRow = Math.floor(index / 3);
  const totalRows   = Math.ceil(totalSlots / 3);
  if (totalRows <= MAX_ROWS) return 0;
  return Math.min(Math.max(0, selectedRow - MAX_ROWS + 2), totalRows - MAX_ROWS);
}

// ── State ─────────────────────────────────────────────────────
export function createCharSelect() {
  return { active: false, index: 0 };
}

export function updateCharSelect(cs, e) {
  const n = _all().length + 1; // +1 für CREATE-Slot
  if (e.key === 'ArrowLeft')  cs.index = (cs.index - 1 + n) % n;
  if (e.key === 'ArrowRight') cs.index = (cs.index + 1) % n;
  if (e.key === 'ArrowUp')    cs.index = Math.max(0, cs.index - 3);
  if (e.key === 'ArrowDown')  cs.index = Math.min(n - 1, cs.index + 3);
}

export function isCreateSlot(cs) {
  return cs.index === _all().length;
}

export function getSelectedCustomId(cs) {
  const item = _all()[cs.index];
  return (typeof item === 'object') ? item.id : null;
}

// ── Draw ──────────────────────────────────────────────────────
export function drawCharSelect(ctx, cs) {
  const all = _all();
  const W = 224;

  ctx.fillStyle = '#0d0d1f';
  ctx.fillRect(0, 0, W, 288);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#aaddff';
  ctx.font = 'bold 9px Orbitron, sans-serif';
  ctx.fillText('CHARAKTER WÄHLEN', W / 2, 22);
  ctx.fillStyle = '#556688';
  ctx.font = '6px Orbitron, sans-serif';
  ctx.fillText('◄  ►  ENTER', W / 2, 34);
  ctx.fillStyle = '#3a4a5a';
  ctx.font = '4px Orbitron, sans-serif';
  ctx.fillText('NUR OPTISCH \u2013 GAMEPLAY BLEIBT GLEICH', W / 2, 44);
  ctx.fillText('ESC = ZURÜCK', W / 2, 52);

  const totalSlots = all.length + 1; // +1 für CREATE
  const scroll = _scrollRow(cs.index, totalSlots);

  for (let i = 0; i < all.length; i++) {
    const { x, y } = _pos(i, scroll);
    if (y + 28 < 40 || y - 28 > GRID_BOT) continue; // außerhalb sichtbar
    const selected = cs.index === i;
    const item     = all[i];
    const isCustom = typeof item === 'object';
    const label    = isCustom ? item.name : LABELS[i];

    // Rahmen
    ctx.strokeStyle = selected ? '#FFD700' : (isCustom ? '#336633' : '#223366');
    ctx.lineWidth   = selected ? 1.5 : 0.75;
    if (selected) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 4; }
    ctx.strokeRect(x - 28, y - 28, 56, 48);
    ctx.shadowBlur = 0;

    // Figur
    drawCharPreview(ctx, item, x, y, 12);

    // Name
    ctx.fillStyle = selected ? '#FFD700' : (isCustom ? '#55aa55' : '#556688');
    ctx.font      = selected ? 'bold 5.5px Orbitron, sans-serif' : '5px Orbitron, sans-serif';
    ctx.fillText(label, x, y + 26);
  }

  // ── CREATE-Slot ──────────────────────────────────────────────
  const createIdx = all.length;
  {
    const { x, y } = _pos(createIdx, scroll);
    if (y + 28 >= 40 && y - 28 <= GRID_BOT) {
      const selected = cs.index === createIdx;
      ctx.strokeStyle = selected ? '#FFD700' : '#1a3a1a';
      ctx.lineWidth   = selected ? 1.5 : 0.75;
      if (selected) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 4; }
      ctx.strokeRect(x - 28, y - 28, 56, 48);
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = selected ? '#aaffaa' : '#2a5a2a';
      ctx.font        = '16px sans-serif';
      ctx.fillText('+', x, y + 8);
      ctx.fillStyle   = selected ? '#FFD700' : '#2a5a2a';
      ctx.font        = selected ? 'bold 5px Orbitron, sans-serif' : '4.5px Orbitron, sans-serif';
      ctx.fillText('NEUER SKIN', x, y + 26);
    }
  }

  // ── Scroll-Indikatoren ─────────────────────────────────────
  if (scroll > 0) {
    ctx.fillStyle = '#556688';
    ctx.font = '7px sans-serif';
    ctx.fillText('▲', W / 2, 50);
  }
  const totalRows = Math.ceil(totalSlots / 3);
  if (scroll + MAX_ROWS < totalRows) {
    ctx.fillStyle = '#556688';
    ctx.font = '7px sans-serif';
    ctx.fillText('▼', W / 2, GRID_BOT + 8);
  }

  // ── Hinweise für eigene Skins ────────────────────────────────
  if (typeof all[cs.index] === 'object') {
    ctx.fillStyle = '#225533';
    ctx.font      = '4.5px Orbitron, sans-serif';
    ctx.fillText('E = BEARBEITEN', W / 2, 275);
    ctx.fillStyle = '#552222';
    ctx.fillText('DEL = LÖSCHEN', W / 2, 284);
  }

  ctx.textAlign = 'left';
}

// ── Vorschau ──────────────────────────────────────────────────
export function drawCharPreview(ctx, item, x, y, r) {
  if (typeof item === 'object') {
    drawCustomSkin(ctx, x, y, r, 0, item);
    return;
  }
  const fn = { pacman: drawPacman, cat: drawCat, dog: drawDog, sonic: drawSonic, pikachu: drawPikachu, felori: drawFelori, wuffels: drawWuffels };
  fn[item]?.(ctx, x, y, r, 0);
}

// ─── PAC-MAN ───────────────────────────────────────────────
export function drawPacman(ctx, x, y, r, mouthAngle, dir = 1) {
  const ROT = [Math.PI, 0, Math.PI * 1.5, Math.PI / 2];
  const rot = ROT[dir] ?? 0;
  const m = (mouthAngle * Math.PI) / 180 || 0.35;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 1, 0, 0, r);
  grad.addColorStop(0, '#ffe566');
  grad.addColorStop(1, '#f0a800');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, m, Math.PI * 2 - m);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(r * 0.1, -r * 0.55, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── KATZE ─────────────────────────────────────────────────
export function drawCat(ctx, x, y, r, mouthAngle) {
  const s = r / 12;
  ctx.fillStyle = '#ee8822';
  ctx.beginPath(); ctx.moveTo(x - 9*s, y - 8*s); ctx.lineTo(x - 5*s, y - 16*s); ctx.lineTo(x - 1*s, y - 8*s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 1*s, y - 8*s); ctx.lineTo(x + 5*s, y - 16*s); ctx.lineTo(x + 9*s, y - 8*s); ctx.fill();
  ctx.fillStyle = '#ffaabb';
  ctx.beginPath(); ctx.moveTo(x - 7.5*s, y - 9*s); ctx.lineTo(x - 5*s, y - 14*s); ctx.lineTo(x - 2.5*s, y - 9*s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 2.5*s, y - 9*s); ctx.lineTo(x + 5*s, y - 14*s); ctx.lineTo(x + 7.5*s, y - 9*s); ctx.fill();
  const g = ctx.createRadialGradient(x - 2*s, y - 3*s, 1, x, y, r);
  g.addColorStop(0, '#ffa040'); g.addColorStop(1, '#cc6600');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffddcc';
  ctx.beginPath(); ctx.ellipse(x, y + 3*s, 6*s, 5*s, 0, 0, Math.PI * 2); ctx.fill();
  for (const ex of [-4*s, 4*s]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 3.5*s, 3*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#33bb44';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 2*s, 2.5*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 1*s, 2*s, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#ff7799';
  ctx.beginPath(); ctx.ellipse(x, y + 1*s, 2*s, 1.5*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5*s;
  for (const [x1,y1,x2,y2] of [[-12*s,1*s,-5*s,2*s],[-12*s,4*s,-5*s,3*s],[5*s,2*s,12*s,1*s],[5*s,3*s,12*s,4*s]]) {
    ctx.beginPath(); ctx.moveTo(x+x1, y+y1); ctx.lineTo(x+x2, y+y2); ctx.stroke();
  }
  if (mouthAngle > 2) {
    const m = (mouthAngle * Math.PI) / 180;
    ctx.fillStyle = '#cc3344';
    ctx.beginPath(); ctx.arc(x, y + 4*s, 3*s, m*0.4, Math.PI - m*0.4); ctx.fill();
  }
}

// ─── HUND ──────────────────────────────────────────────────
export function drawDog(ctx, x, y, r, mouthAngle) {
  const s = r / 12;
  ctx.fillStyle = '#8b5e3c';
  ctx.beginPath(); ctx.ellipse(x - 11*s, y + 2*s, 6*s, 10*s, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 11*s, y + 2*s, 6*s, 10*s, 0.2, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(x - 2*s, y - 3*s, 1, x, y, r);
  g.addColorStop(0, '#d4956a'); g.addColorStop(1, '#a06030');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8c09a';
  ctx.beginPath(); ctx.ellipse(x, y + 4*s, 7*s, 5*s, 0, 0, Math.PI * 2); ctx.fill();
  for (const ex of [-4*s, 4*s]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 3.5*s, 3.5*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#663300';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 2.5*s, 2.5*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x + ex, y - 2*s, 1.5*s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + ex + 1*s, y - 3*s, 0.7*s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(x, y + 2*s, 3.5*s, 2.5*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#664422'; ctx.lineWidth = 0.8*s; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + 5*s); ctx.lineTo(x - 4*s, y + 7*s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + 5*s); ctx.lineTo(x + 4*s, y + 7*s); ctx.stroke();
}

// ─── SONIC ─────────────────────────────────────────────────
export function drawSonic(ctx, x, y, r, mouthAngle) {
  const s = r / 12;
  ctx.fillStyle = '#1144cc';
  ctx.beginPath(); ctx.moveTo(x - 3*s, y - r + 1*s); ctx.lineTo(x, y - r - 11*s); ctx.lineTo(x + 3*s, y - r + 1*s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 3*s, y - r + 3*s); ctx.lineTo(x + 13*s, y - r - 5*s); ctx.lineTo(x + 7*s, y - r + 5*s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 6*s, y - 2*s); ctx.lineTo(x + 17*s, y - 9*s); ctx.lineTo(x + 8*s, y + 3*s); ctx.fill();
  const g = ctx.createRadialGradient(x - 2*s, y - 3*s, 1, x, y, r);
  g.addColorStop(0, '#4488ff'); g.addColorStop(1, '#0022aa');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5c89a';
  ctx.beginPath(); ctx.ellipse(x + 2*s, y + 3*s, 8*s, 8*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(x + 1*s, y - 1*s, 6*s, 5*s, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22aa22';
  ctx.beginPath(); ctx.ellipse(x + 2*s, y - 1*s, 4*s, 4*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(x + 2*s, y - 1*s, 2.5*s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + 3.5*s, y - 2.5*s, 1*s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#cc4400';
  ctx.beginPath(); ctx.ellipse(x + 9*s, y + 3*s, 2.5*s, 2*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#882200'; ctx.lineWidth = 0.8*s;
  ctx.beginPath(); ctx.arc(x + 7*s, y + 3*s, 3*s, 0, Math.PI * 0.8); ctx.stroke();
}

// ─── PIKACHU ───────────────────────────────────────────────
export function drawPikachu(ctx, x, y, r, mouthAngle) {
  for (const ex of [-1, 1]) {
    ctx.fillStyle = '#ffe033';
    ctx.beginPath();
    ctx.moveTo(x + ex * r * 0.25, y - r * 0.6);
    ctx.lineTo(x + ex * r * 0.15, y - r * 2.8);
    ctx.lineTo(x + ex * r * 0.9,  y - r * 2.0);
    ctx.lineTo(x + ex * r * 0.85, y - r * 0.7);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(x + ex * r * 0.2,  y - r * 2.2);
    ctx.lineTo(x + ex * r * 0.15, y - r * 2.8);
    ctx.lineTo(x + ex * r * 0.9,  y - r * 2.0);
    ctx.lineTo(x + ex * r * 0.65, y - r * 1.8);
    ctx.closePath(); ctx.fill();
  }
  const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.05, x, y, r);
  g.addColorStop(0, '#ffe866'); g.addColorStop(1, '#e8b800');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ee1111';
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.ellipse(x - r * 0.72, y + r * 0.25, r * 0.42, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r * 0.72, y + r * 0.25, r * 0.42, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  for (const ex of [-r * 0.32, r * 0.32]) {
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(x + ex, y - r * 0.2, r * 0.2, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + ex + r * 0.07, y - r * 0.3, r * 0.08, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#663300';
  ctx.beginPath(); ctx.ellipse(x, y - r * 0.04, r * 0.13, r * 0.09, 0, 0, Math.PI * 2); ctx.fill();
  const mw = r * 0.36;
  ctx.strokeStyle = '#663300'; ctx.lineWidth = Math.max(0.5, r * 0.09);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - mw, y + r * 0.2); ctx.lineTo(x - mw*0.5, y + r * 0.42);
  ctx.lineTo(x, y + r * 0.2); ctx.lineTo(x + mw*0.5, y + r * 0.42);
  ctx.lineTo(x + mw, y + r * 0.2);
  ctx.stroke();
}

// ─── FELORI ────────────────────────────────────────────────
export function drawFelori(ctx, x, y, r, mouthAngle) {
  const s = r / 12;
  ctx.fillStyle = '#55bb33';
  ctx.beginPath(); ctx.moveTo(x - 9*s, y - 8*s); ctx.lineTo(x - 5*s, y - 16*s); ctx.lineTo(x - 1*s, y - 8*s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 1*s, y - 8*s); ctx.lineTo(x + 5*s, y - 16*s); ctx.lineTo(x + 9*s, y - 8*s); ctx.fill();
  ctx.fillStyle = '#aae855';
  ctx.beginPath(); ctx.moveTo(x - 7.5*s, y - 9*s); ctx.lineTo(x - 5*s, y - 14*s); ctx.lineTo(x - 2.5*s, y - 9*s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 2.5*s, y - 9*s); ctx.lineTo(x + 5*s, y - 14*s); ctx.lineTo(x + 7.5*s, y - 9*s); ctx.fill();
  const g = ctx.createRadialGradient(x - 2*s, y - 3*s, 1, x, y, r);
  g.addColorStop(0, '#88dd55'); g.addColorStop(1, '#339922');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ccee99';
  ctx.beginPath(); ctx.ellipse(x, y + 3*s, 6*s, 5*s, 0, 0, Math.PI * 2); ctx.fill();
  for (const ex of [-4*s, 4*s]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 3.5*s, 3*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#228844';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 2*s, 2.5*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 1*s, 2*s, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#ff99bb';
  ctx.beginPath(); ctx.ellipse(x, y + 1*s, 2*s, 1.5*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ccffcc'; ctx.lineWidth = 0.5*s;
  for (const [x1,y1,x2,y2] of [[-12*s,1*s,-5*s,2*s],[-12*s,4*s,-5*s,3*s],[5*s,2*s,12*s,1*s],[5*s,3*s,12*s,4*s]]) {
    ctx.beginPath(); ctx.moveTo(x+x1, y+y1); ctx.lineTo(x+x2, y+y2); ctx.stroke();
  }
  if (mouthAngle > 2) {
    const m = (mouthAngle * Math.PI) / 180;
    ctx.fillStyle = '#2a7730';
    ctx.beginPath(); ctx.arc(x, y + 4*s, 3*s, m*0.4, Math.PI - m*0.4); ctx.fill();
  }
}

// ─── WUFFELS ───────────────────────────────────────────────
export function drawWuffels(ctx, x, y, r, mouthAngle) {
  const s = r / 12;
  ctx.fillStyle = '#d86010';
  ctx.beginPath(); ctx.moveTo(x - 8*s, y - 8*s); ctx.lineTo(x - 6*s, y - 15*s); ctx.lineTo(x - 2*s, y - 8*s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 2*s, y - 8*s); ctx.lineTo(x + 6*s, y - 15*s); ctx.lineTo(x + 8*s, y - 8*s); ctx.fill();
  ctx.fillStyle = '#f5dea0';
  ctx.beginPath(); ctx.moveTo(x - 7*s, y - 9*s); ctx.lineTo(x - 6*s, y - 13*s); ctx.lineTo(x - 3*s, y - 9*s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 3*s, y - 9*s); ctx.lineTo(x + 6*s, y - 13*s); ctx.lineTo(x + 7*s, y - 9*s); ctx.fill();
  const g = ctx.createRadialGradient(x - 2*s, y - 3*s, 1, x, y, r);
  g.addColorStop(0, '#f09040'); g.addColorStop(1, '#c05010');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(20,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(x - 6*s, y - 4*s, 1.2*s, 4*s, 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 6*s, y - 4*s, 1.2*s, 4*s, -0.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y - 7*s, 3*s, 1*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5dea0';
  ctx.beginPath(); ctx.ellipse(x, y + 3*s, 7*s, 5*s, 0, 0, Math.PI * 2); ctx.fill();
  for (const ex of [-4*s, 4*s]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 3.5*s, 3*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7b3800';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 2.2*s, 2.5*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 1.2*s, 1.8*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + ex + 1*s, y - 3*s, 0.7*s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(x, y + 1*s, 3*s, 2*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#7a3500'; ctx.lineWidth = 0.8*s; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + 4*s); ctx.lineTo(x - 3.5*s, y + 7*s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + 4*s); ctx.lineTo(x + 3.5*s, y + 7*s); ctx.stroke();
}
