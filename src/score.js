// score.js – Punkte, Leben, Level

import { SCORE, PAC, getStartLives, getExtraLifeScore } from './config.js';

export function createScore() {
  return {
    score:     0,
    hiScore:   (() => { try { return parseInt(localStorage.getItem('pacman-hi') || '0', 10); } catch { return 0; } })(),
    lives:     getStartLives(),
    level:     1,
    extraLife: false,
  };
}

export function addScore(state, points) {
  state.score += points;
  if (state.score > state.hiScore) {
    state.hiScore = state.score;
    try { localStorage.setItem('pacman-hi', state.hiScore); } catch {}
  }
  if (!state.extraLife && state.score >= getExtraLifeScore()) {
    state.lives++;
    state.extraLife = true;
  }
}

export function loseLife(state) {
  state.lives--;
}

export function nextLevel(state) {
  state.level++;
  state.score; // bleibt erhalten
}

// drawLifeIcon defined below drawHUD

// DOM-Elemente für Seitenpanels
const _sideScore   = document.getElementById('side-score');
const _sideHi      = document.getElementById('side-hiscore');
const _sideLevel   = document.getElementById('side-level');
const _sideLives   = document.getElementById('lives-display');

export function drawHUD(ctx, state) {
  // Seitenpanels aktualisieren (DOM)
  if (_sideScore)  _sideScore.textContent  = String(state.score).padStart(6, '0');
  if (_sideHi)     _sideHi.textContent     = String(state.hiScore).padStart(6, '0');
  if (_sideLevel)  _sideLevel.textContent  = state.level;
  if (_sideLives) {
    const n = Math.min(state.lives - 1, 5);
    if (_sideLives.childElementCount !== n) {
      _sideLives.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'life-dot';
        _sideLives.appendChild(d);
      }
    }
  }

  // Mini-HUD im Canvas (Fallback für schmale Bildschirme)
  const F = 'Orbitron, sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 224, 9);
  ctx.textAlign = 'left';
  ctx.font = `5px ${F}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(String(state.score).padStart(6, '0'), 2, 7);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#aaddff';
  ctx.fillText('L' + state.level, 112, 7);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffdd44';
  ctx.fillText(String(state.hiScore).padStart(6, '0'), 222, 7);
  ctx.textAlign = 'left';

  // Leben unten
  for (let i = 0; i < Math.min(state.lives - 1, 5); i++) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    const lx = 5 + i * 10, ly = 283;
    ctx.moveTo(lx + 3, ly + 3);
    ctx.arc(lx + 3, ly + 3, 3, 0.4, Math.PI * 2 - 0.4);
    ctx.closePath();
    ctx.fill();
  }
}

