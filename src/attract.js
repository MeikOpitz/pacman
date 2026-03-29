// attract.js – Attract Mode / Title Screen

import { drawGhost } from './ghost.js';
import { loadHiScores } from './hiscore.js';
import { getDifficulty, setDifficulty } from './config.js';

const BLINK_MS = 500;

export function createAttract() {
  return {
    active:     true,
    blinkTimer: 0,
    blinkOn:    true,
    demoX:      -20,
    ghostX:     -50,
  };
}

export function updateAttract(attract, dt) {
  attract.blinkTimer += dt;
  if (attract.blinkTimer >= BLINK_MS) {
    attract.blinkTimer = 0;
    attract.blinkOn    = !attract.blinkOn;
  }
  attract.demoX  += 0.6;
  attract.ghostX += 0.5;
  if (attract.demoX > 244) {
    attract.demoX  = -20;
    attract.ghostX = -50;
  }
}

export function drawAttract(ctx, attract) {
  const W = 224, H = 288;

  // Hintergrund (dunkel)
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  // ── Demo-Animation (Pac-Man flieht vor Geistern) ────────
  drawMiniPacman(ctx, attract.demoX, 274);
  drawMiniGhostSimple(ctx, attract.ghostX,      274, '#ff4444');
  drawMiniGhostSimple(ctx, attract.ghostX - 18, 274, '#ffaaff');

  // ── Haupt-Popup-Box ──────────────────────────────────────
  const bx = 12, by = 8, bw = 200, bh = 252;
  // Schatten
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx + 3, by + 3, bw, bh);
  // Box
  ctx.fillStyle = '#0d0d2a';
  ctx.fillRect(bx, by, bw, bh);
  // Rahmen (neon)
  ctx.strokeStyle = '#3a7fff';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#1a4fff';
  ctx.shadowBlur  = 4;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.shadowBlur  = 0;

  const F = 'Orbitron, sans-serif';
  ctx.textAlign = 'center';

  // Titel
  ctx.font = 'bold 20px ' + F;
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur  = 6;
  ctx.fillText('PAC-MAN', W / 2, by + 28);
  ctx.shadowBlur = 0;

  // Trennlinie
  ctx.strokeStyle = '#2244aa';
  ctx.lineWidth   = 0.75;
  ctx.beginPath();
  ctx.moveTo(bx + 12, by + 35);
  ctx.lineTo(bx + bw - 12, by + 35);
  ctx.stroke();

  // ── HI-SCORE LISTE ─────────────────────────────────────────
  const scores = loadHiScores();

  ctx.font      = 'bold 7px ' + F;
  ctx.fillStyle = '#cc8800';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur  = 3;
  ctx.fillText('TOP SCORES', W / 2, by + 50);
  ctx.shadowBlur = 0;

  if (scores.length > 0) {
    for (let i = 0; i < scores.length; i++) {
      const entry = scores[i];
      const ey = by + 64 + i * 14;
      const rank = String(i + 1) + '.';
      const name = entry.name.padEnd(10);
      const pts  = String(entry.score).padStart(7, '0');

      // Rang-Farbe
      ctx.textAlign = 'left';
      ctx.font = 'bold 6px ' + F;
      if (i === 0) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur  = 3;
      } else if (i === 1) {
        ctx.fillStyle = '#c0c0c0';
      } else if (i === 2) {
        ctx.fillStyle = '#cd7f32';
      } else {
        ctx.fillStyle = '#7788bb';
      }
      ctx.fillText(rank, bx + 14, ey);
      ctx.fillText(name, bx + 30, ey);
      ctx.textAlign = 'right';
      ctx.fillText(pts, bx + bw - 14, ey);
      ctx.shadowBlur = 0;
    }
  } else {
    ctx.font = '5px ' + F;
    ctx.fillStyle = '#334466';
    ctx.fillText('NOCH KEINE SCORES', W / 2, by + 68);
  }

  // Trennlinie nach Scores
  const scoreEndY = by + 64 + Math.max(scores.length, 1) * 14 + 6;
  ctx.strokeStyle = '#2244aa';
  ctx.lineWidth   = 0.75;
  ctx.beginPath();
  ctx.moveTo(bx + 12, scoreEndY);
  ctx.lineTo(bx + bw - 12, scoreEndY);
  ctx.stroke();

  // ── Geister-Reihe (kompakt, eine Zeile) ─────────────────────
  const gy = scoreEndY + 14;
  const gcolors = ['#ff4444', '#ffaaff', '#44ffff', '#ffbb44'];
  const gnicks  = ['BLINKY', 'PINKY', 'INKY', 'CLYDE'];
  for (let i = 0; i < 4; i++) {
    const gx = bx + 16 + i * 48;
    drawMiniGhostSimple(ctx, gx, gy - 4, gcolors[i]);
    ctx.textAlign = 'center';
    ctx.font      = '4px ' + F;
    ctx.fillStyle = gcolors[i];
    ctx.fillText(gnicks[i], gx + 5, gy + 10);
  }

  // Punkte-Legende (kompakt)
  const py = gy + 22;
  ctx.textAlign = 'left';
  ctx.font      = '5px ' + F;
  ctx.fillStyle = '#ffddcc';
  ctx.fillRect(bx + 40, py - 3, 3, 3);
  ctx.fillText('= 10',  bx + 48, py);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + 90, py - 5, 5, 5);
  ctx.fillStyle = '#ffddcc';
  ctx.fillText('= 50',  bx + 100, py);

  // Trennlinie
  ctx.strokeStyle = '#2244aa';
  ctx.lineWidth   = 0.75;
  ctx.beginPath();
  ctx.moveTo(bx + 12, py + 8);
  ctx.lineTo(bx + bw - 12, py + 8);
  ctx.stroke();

  // Credits
  ctx.textAlign  = 'center';
  ctx.font       = '5px ' + F;
  ctx.fillStyle  = '#6677cc';
  ctx.fillText('© 2026 Meik Opitz', W / 2, py + 20);
  ctx.fillStyle  = '#445588';
  ctx.fillText('mit KI Unterstützung', W / 2, py + 30);

  // Difficulty selector
  const diff = getDifficulty();
  const dy = py + 38;
  ctx.font = '5px ' + F;
  ctx.fillStyle = diff === 'easy' ? '#55cc55' : '#445566';
  ctx.fillText('EASY', W / 2 - 30, dy);
  ctx.fillStyle = '#3a4a6a';
  ctx.fillText('/', W / 2, dy);
  ctx.fillStyle = diff === 'normal' ? '#5588ff' : '#445566';
  ctx.fillText('NORMAL', W / 2 + 18, dy);
  // Indicator arrow
  if (diff === 'easy') {
    ctx.fillStyle = '#55cc55'; ctx.font = '5px sans-serif';
    ctx.fillText('▸', W / 2 - 46, dy);
  } else {
    ctx.fillStyle = '#5588ff'; ctx.font = '5px sans-serif';
    ctx.fillText('▸', W / 2 + 6, dy);
  }
  ctx.font = '3.5px ' + F;
  ctx.fillStyle = '#3a4a6a';
  ctx.fillText('◄► SCHWIERIGKEIT', W / 2, dy + 8);

  // PRESS ENTER (blinkend)
  if (attract.blinkOn) {
    ctx.font      = '7px ' + F;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 4;
    ctx.fillText('PRESS ENTER', W / 2, dy + 24);
    ctx.shadowBlur  = 0;
  }

  // Steuerungshinweise
  ctx.font      = '4px ' + F;
  ctx.fillStyle = '#3a4a6a';
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) {
    ctx.fillText('SWIPE = BEWEGEN    TAP = OK', W / 2, dy + 34);
  } else {
    ctx.fillText('PFEILTASTEN = BEWEGEN    ENTER = OK', W / 2, dy + 34);
  }

  ctx.textAlign = 'left';
}

function drawMiniGhostSimple(ctx, x, y, color) {
  const r = 5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + r, y, r, Math.PI, 0);
  ctx.lineTo(x + r * 2, y + r * 1.4);
  ctx.lineTo(x + r * 1.4, y + r * 0.9);
  ctx.lineTo(x + r, y + r * 1.4);
  ctx.lineTo(x + r * 0.6, y + r * 0.9);
  ctx.lineTo(x, y + r * 1.4);
  ctx.closePath();
  ctx.fill();
  // Augen
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + r * 0.6, y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 1.4, y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
}

function drawMiniPacman(ctx, x, y) {
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, 6, 0.35, Math.PI * 2 - 0.35);
  ctx.closePath();
  ctx.fill();
}
