// intermission.js – Zwischenszene: Geist jagt Pac-Man → Pac-Man jagt Geist

import { drawCharPreview, drawPacman } from './charselect.js';
import { drawCustomSkin }              from './customskin.js';

// ── Timing ────────────────────────────────────────────────────
const PHASE1 = 2000; // Ghost jagt Pac → beide exit links
const FLASH  = 2450; // ZAP-Flash (Power Pellet gegessen)
const PHASE2 = 4300; // Pac jagt frightened Ghost → beide exit rechts
const TOTAL  = 4800;

const POWER_X = 22; // x-Position des Power Pellets

// ── State ─────────────────────────────────────────────────────
export function createIntermission() {
  return { active: false, timer: 0, level: 1, character: 'pacman', skinData: null };
}

export function startIntermission(inter, level, character, skinData) {
  inter.active    = true;
  inter.timer     = 0;
  inter.level     = level;
  inter.character = character;
  inter.skinData  = skinData ?? null;
}

export function updateIntermission(inter, dt) {
  if (!inter.active) return;
  inter.timer += dt;
  if (inter.timer >= TOTAL) inter.active = false;
}

// ── Render ────────────────────────────────────────────────────
export function drawIntermission(ctx, inter) {
  const t  = inter.timer;
  const W  = 224;
  const H  = 288;
  const CY = 152; // vertikale Mitte der Charaktere
  const R  = 14;  // Charakter-Radius

  // ── Hintergrund ───────────────────────────────────────────
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  // Subtiles Grid
  ctx.strokeStyle = 'rgba(20,35,90,0.35)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 16) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Boden-Linie
  ctx.strokeStyle = 'rgba(50,80,200,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, CY + R + 8); ctx.lineTo(W, CY + R + 8); ctx.stroke();

  // ── "LEVEL N CLEAR!" ──────────────────────────────────────
  const titleA = Math.min(1, t / 300) * (1 - Math.max(0, (t - 900) / 400));
  if (titleA > 0) {
    ctx.textAlign   = 'center';
    ctx.fillStyle   = `rgba(255,215,0,${titleA.toFixed(2)})`;
    ctx.shadowColor = `rgba(255,180,0,${titleA.toFixed(2)})`;
    ctx.shadowBlur  = 8;
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.fillText(`LEVEL ${inter.level} CLEAR!`, W / 2, 40);
    ctx.shadowBlur = 0;
    ctx.textAlign  = 'left';
  }

  // ── Phase 1: Ghost jagt Pac-Man (rechts → links) ──────────
  if (t > 150 && t < FLASH + 80) {
    const p1     = Math.min(1, Math.max(0, (t - 150) / (PHASE1 - 150)));
    const pacX   = _lerp(258, -52, p1);
    const ghostX = _lerp(292, -18, p1);

    // Power Pellet links – verschwindet wenn Pac drüber läuft
    if (pacX > POWER_X - R) {
      const pulse = 0.55 + Math.sin(t / 110) * 0.45;
      ctx.fillStyle   = `rgba(255,255,255,${pulse.toFixed(2)})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur  = 10;
      ctx.beginPath(); ctx.arc(POWER_X, CY, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur  = 0;
    }

    // Speed lines
    _speedLines(ctx, ghostX + R + 4, CY, 28, 'rgba(200,80,255,0.28)', false);
    _speedLines(ctx, pacX   + R + 4, CY, 22, 'rgba(80,180,255,0.22)', false);

    _drawGhost(ctx, ghostX, CY, R, 'normal', t);
    _drawPlayer(ctx, inter, pacX, CY, R, t, 0); // dir 0 = links
  }

  // ── ZAP-Flash ─────────────────────────────────────────────
  if (t >= PHASE1 && t < FLASH) {
    const fp = (t - PHASE1) / (FLASH - PHASE1);
    // Weißer Blitz
    if (fp < 0.4) {
      const fa = (1 - fp / 0.4) * 0.9;
      ctx.fillStyle = `rgba(255,255,255,${fa.toFixed(2)})`;
      ctx.fillRect(0, 0, W, H);
    }
    // "ZAP!" Text
    const za = Math.min(1, fp / 0.25) * (1 - Math.max(0, (fp - 0.55) / 0.3));
    if (za > 0) {
      ctx.textAlign   = 'center';
      ctx.fillStyle   = `rgba(255,230,0,${za.toFixed(2)})`;
      ctx.shadowColor = `rgba(255,190,0,${za.toFixed(2)})`;
      ctx.shadowBlur  = 12;
      ctx.font = 'bold 18px Orbitron, sans-serif';
      ctx.fillText('ZAP!', W / 2, CY - 30);
      ctx.shadowBlur  = 0;
      ctx.textAlign   = 'left';
    }
  }

  // ── Phase 2: Pac-Man jagt frightened Ghost (links → rechts) ─
  if (t >= FLASH && t < TOTAL - 250) {
    const p2     = Math.min(1, Math.max(0, (t - FLASH) / (PHASE2 - FLASH)));
    const ghostX = _lerp(-18, 292, p2); // Ghost flüchtet (etwas voraus)
    const pacX   = _lerp(-52, 258, p2); // Pac verfolgt

    // Speed lines (Richtung rechts → Linien nach links)
    _speedLines(ctx, ghostX - R - 4, CY, 28, 'rgba(80,80,255,0.28)', true);
    _speedLines(ctx, pacX   - R - 4, CY, 22, 'rgba(255,220,50,0.22)', true);

    // Ghost blinkt wenn p2 > 0.68 (kurz vor Ende)
    const fMode = (p2 > 0.68 && Math.floor(t / 130) % 2 === 0) ? 'frightFlash' : 'frightened';
    _drawGhost(ctx, ghostX, CY, R, fMode, t);
    _drawPlayer(ctx, inter, pacX, CY, R, t, 1); // dir 1 = rechts

    // "RUN!" Text
    const ra = Math.min(1, (t - FLASH) / 250) * (1 - Math.max(0, (t - FLASH - 750) / 250));
    if (ra > 0) {
      ctx.textAlign   = 'center';
      ctx.fillStyle   = `rgba(80,255,180,${ra.toFixed(2)})`;
      ctx.shadowColor = `rgba(0,200,130,${ra.toFixed(2)})`;
      ctx.shadowBlur  = 7;
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillText('RUN!', W / 2, CY - 30);
      ctx.shadowBlur  = 0;
      ctx.textAlign   = 'left';
    }
  }

  // ── Fade In / Out ─────────────────────────────────────────
  if (t < 200) {
    ctx.fillStyle = `rgba(0,0,0,${(1 - t / 200).toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (t > TOTAL - 450) {
    const a = Math.min(1, (t - (TOTAL - 450)) / 450);
    ctx.fillStyle = `rgba(0,0,0,${a.toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ── Helpers ───────────────────────────────────────────────────
function _lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function _speedLines(ctx, x, cy, len, color, goRight) {
  ctx.strokeStyle = color;
  ctx.lineWidth   = 0.8;
  ctx.lineCap     = 'butt';
  const dir = goRight ? -1 : 1;
  for (let i = -3; i <= 3; i++) {
    const l = len * (0.5 + (3 - Math.abs(i)) * 0.1);
    ctx.beginPath();
    ctx.moveTo(x, cy + i * 4.5);
    ctx.lineTo(x + dir * l, cy + i * 4.5);
    ctx.stroke();
  }
}

// ── Ghost ─────────────────────────────────────────────────────
function _drawGhost(ctx, x, y, r, mode, t) {
  const normal    = mode === 'normal';
  const frightened = mode === 'frightened';
  const flash     = mode === 'frightFlash';

  const color = normal ? '#ff2244' : flash ? '#eeeeee' : '#2244ff';

  ctx.shadowColor = color;
  ctx.shadowBlur  = normal ? 9 : 14;

  // Körper
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.arc(x, y, r, Math.PI, 0);                // oberer Halbkreis
  ctx.lineTo(x + r, y + r * 0.9);              // rechte Seite runter
  // 3 Wellenbögen unten (Quadratic-Bezier)
  const bw = (r * 2) / 3;
  for (let i = 0; i < 3; i++) {
    const ex  = x + r - (i + 1) * bw;
    const mid = x + r - (i + 0.5) * bw;
    ctx.quadraticCurveTo(mid, y + r * 0.9 + r * 0.42, ex, y + r * 0.9);
  }
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  if (normal) {
    // Augen weiß + blaue Pupille
    for (const ex of [-r * 0.33, r * 0.33]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(x + ex, y - r * 0.12, r * 0.27, r * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2233ee';
      ctx.beginPath(); ctx.ellipse(x + ex + r * 0.09, y - r * 0.08, r * 0.14, r * 0.21, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Frightened: Zickzack-Mund
    const lineColor = flash ? '#ff3333' : '#88aaff';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth   = r * 0.1;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    const pts = [-0.42, -0.21, 0, 0.21, 0.42];
    ctx.moveTo(x + pts[0] * r, y + r * 0.22);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(x + pts[i] * r, y + r * 0.22 + (i % 2 === 0 ? r * 0.17 : -r * 0.17));
    }
    ctx.stroke();
    // Augen: Punkte oder X
    if (flash) {
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth   = r * 0.13;
      for (const ex of [-r * 0.33, r * 0.33]) {
        ctx.beginPath(); ctx.moveTo(x + ex - r * 0.11, y - r * 0.3); ctx.lineTo(x + ex + r * 0.11, y - r * 0.06); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + ex + r * 0.11, y - r * 0.3); ctx.lineTo(x + ex - r * 0.11, y - r * 0.06); ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#88aaff';
      for (const ex of [-r * 0.33, r * 0.33]) {
        ctx.beginPath(); ctx.arc(x + ex, y - r * 0.18, r * 0.1, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

// ── Player ────────────────────────────────────────────────────
function _drawPlayer(ctx, inter, x, y, r, t, dir) {
  const mouth = Math.max(4, Math.abs(Math.sin(t / 80)) * 38);
  if (inter.character === 'custom' && inter.skinData) {
    drawCustomSkin(ctx, x, y, r, mouth, inter.skinData);
  } else if (inter.character === 'pacman') {
    drawPacman(ctx, x, y, r, mouth, dir);
  } else {
    drawCharPreview(ctx, inter.character, x, y, r);
  }
}
