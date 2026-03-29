// clyde.js – Orange, flieht wenn zu nah an Pac-Man

import { createGhost, updateGhost, drawGhost, MODE } from '../ghost.js';
import { TILE } from '../maze.js';
import { DIR } from '../pacman.js';

export function createClyde() {
  const g = createGhost('clyde', '#ffb852', 15, 14, 0, 30);
  g.releaseTimer = 10000;
  return g;
}

function chaseTarget(pac, clyde) {
  const pacCol = Math.floor(pac.x / TILE);
  const pacRow = Math.floor(pac.y / TILE);
  const cCol   = Math.floor(clyde.x / TILE);
  const cRow   = Math.floor(clyde.y / TILE);
  const d2 = (pacCol - cCol) ** 2 + (pacRow - cRow) ** 2;
  // Wenn > 8 Tiles entfernt: verfolge Pac-Man, sonst: Scatter-Ecke
  return d2 > 64
    ? { col: pacCol, row: pacRow }
    : { col: 0, row: 30 };
}

export function createClydeUpdater(clyde) {
  return function updateClyde(c, dt, pac, level = 1) {
    if (c.mode === MODE.HOUSE) {
      c.releaseTimer -= dt;
      if (c.releaseTimer > 0) return;
      c.mode = MODE.SCATTER;
      c.dir = DIR.UP;
      c.targetX = c.x;
      c.targetY = c.y - TILE;
    }
    updateGhost(c, dt, pac, (p) => chaseTarget(p, clyde), level);
  };
}

export function drawClyde(ctx, clyde) {
  drawGhost(ctx, clyde);
}
