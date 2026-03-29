// input.js – Keyboard + Swipe (Touch & Maus) Input

import { DIR } from './pacman.js';

function fireKey(key) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

// Set by main.js to block touch-to-key conversion during overlays (skin editor etc.)
let touchBlocked = false;
export function setTouchBlocked(v) { touchBlocked = v; }

const SWIPE_THRESHOLD = 15; // Mindest-Pixel für Swipe-Erkennung

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

  // ── Swipe-Handler (gemeinsam für Touch & Maus) ────────────
  function handleSwipe(startX, startY, endX, endY) {
    if (touchBlocked) return;
    const dx = endX - startX;
    const dy = endY - startY;
    const adx = Math.abs(dx), ady = Math.abs(dy);

    // Tap / Klick (kaum Bewegung) → Enter
    if (adx < SWIPE_THRESHOLD && ady < SWIPE_THRESHOLD) {
      fireKey('Enter');
      return;
    }

    // Swipe → Richtung + keydown für Menüs/Bonusgame
    let key;
    if (adx > ady) {
      pac.nextDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
      key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
    } else {
      pac.nextDir = dy > 0 ? DIR.DOWN : DIR.UP;
      key = dy > 0 ? 'ArrowDown' : 'ArrowUp';
    }
    fireKey(key);
    // Für Bonusgame: kurzes keyup nach 200ms (simuliert gehaltene Taste)
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    }, 200);
  }

  // ── Touch-Swipe (ganzer Body) ─────────────────────────────
  let tx = 0, ty = 0;

  document.body.addEventListener('touchstart', (e) => {
    // Ignore touches on UI controls
    if (e.target.closest('#audio-controls') || e.target.closest('#pause-btn')) return;
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, { passive: true });

  document.body.addEventListener('touchend', (e) => {
    if (e.target.closest('#audio-controls') || e.target.closest('#pause-btn')) return;
    handleSwipe(tx, ty, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: true });

  // ── Maus-Drag (Klick + Ziehen → Richtung) ────────────────
  let mx = 0, my = 0, mouseDown = false;

  document.body.addEventListener('mousedown', (e) => {
    if (e.target.closest('#audio-controls') || e.target.closest('#pause-btn')) return;
    mx = e.clientX;
    my = e.clientY;
    mouseDown = true;
  });

  document.body.addEventListener('mouseup', (e) => {
    if (!mouseDown) return;
    mouseDown = false;
    if (e.target.closest('#audio-controls') || e.target.closest('#pause-btn')) return;
    handleSwipe(mx, my, e.clientX, e.clientY);
  });
}
