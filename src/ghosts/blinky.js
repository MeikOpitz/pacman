// blinky.js – Roter Geist, verfolgt Pac-Man direkt

import { createGhost, updateGhost, drawGhost, MODE } from '../ghost.js';
import { TILE } from '../maze.js';
import { DIR } from '../pacman.js';

export function createBlinky() {
  // Startet außerhalb Ghost-House, oben rechts Scatter
  // Startet auf der Ghost-House Tür, Scatter-Ecke oben rechts
  return createGhost('blinky', '#ff0000', 13, 12, 25, 0);
}

function chaseTarget(pac) {
  return {
    col: Math.floor(pac.x / TILE),
    row: Math.floor(pac.y / TILE),
  };
}

export function updateBlinky(blinky, dt, pac, level = 1) {
  if (blinky.mode === MODE.HOUSE) {
    blinky.mode = MODE.SCATTER;
    blinky.dir = DIR.UP;
    blinky.targetX = blinky.x;
    blinky.targetY = blinky.y - TILE;
  }
  updateGhost(blinky, dt, pac, chaseTarget, level);
}

export function drawBlinky(ctx, blinky) {
  drawGhost(ctx, blinky);
}
