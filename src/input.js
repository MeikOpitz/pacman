// input.js – Keyboard + Touch Input

import { DIR } from './pacman.js';

function fireKey(key) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

// Set by main.js to block touch-to-key conversion during overlays (skin editor etc.)
let touchBlocked = false;
export function setTouchBlocked(v) { touchBlocked = v; }

export function setupInput(pac) {
  // ── Tastatur ──────────────────────────────────────────────
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowLeft':  pac.nextDir = DIR.LEFT;  e.preventDefault(); break;
      case 'ArrowRight': pac.nextDir = DIR.RIGHT; e.preventDefault(); break;
      case 'ArrowUp':    pac.nextDir = DIR.UP;    e.preventDefault(); break;
      case 'ArrowDown':  pac.nextDir = DIR.DOWN;  e.preventDefault(); break;
    }
  });

  // ── Swipe auf Canvas ──────────────────────────────────────
  let tx = 0, ty = 0;
  const canvas = document.getElementById('screen');

  canvas.addEventListener('touchstart', (e) => {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (touchBlocked) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    // Tap (kaum Bewegung) → Enter
    if (adx < 20 && ady < 20) { fireKey('Enter'); return; }
    // Swipe → Richtung + keydown für Menüs
    if (adx > ady) {
      pac.nextDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
      fireKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    } else {
      pac.nextDir = dy > 0 ? DIR.DOWN : DIR.UP;
      fireKey(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    }
  }, { passive: true });

  // ── D-Pad ─────────────────────────────────────────────────
  const dpadMap = [
    ['dpad-up',    DIR.UP,    'ArrowUp'],
    ['dpad-down',  DIR.DOWN,  'ArrowDown'],
    ['dpad-left',  DIR.LEFT,  'ArrowLeft'],
    ['dpad-right', DIR.RIGHT, 'ArrowRight'],
  ];

  for (const [id, dir, key] of dpadMap) {
    const btn = document.getElementById(id);
    if (!btn) continue;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      pac.nextDir = dir;
      btn.classList.add('pressed');
      // Also fire keydown for bonus game input
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }, { passive: false });

    btn.addEventListener('touchend', () => {
      btn.classList.remove('pressed');
      window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    });
  }

}
