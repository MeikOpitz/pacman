// inky.js – Cyan, komplexe Berechnung mit Blinky

import { createGhost, updateGhost, drawGhost, MODE } from '../ghost.js';
import { TILE } from '../maze.js';
import { DIR } from '../pacman.js';

const DX = { [DIR.LEFT]: -1, [DIR.RIGHT]: 1, [DIR.UP]: 0,  [DIR.DOWN]: 0 };
const DY = { [DIR.LEFT]:  0, [DIR.RIGHT]: 0, [DIR.UP]: -1, [DIR.DOWN]: 1 };

export function createInky() {
  const g = createGhost('inky', '#00ffff', 11, 14, 27, 30);
  g.releaseTimer = 6000;
  return g;
}

function chaseTarget(pac, blinky) {
  // 2 Tiles vor Pac-Man, dann von Blinky spiegeln
  const pivotCol = Math.floor(pac.x / TILE) + DX[pac.dir] * 2;
  const pivotRow = Math.floor(pac.y / TILE) + DY[pac.dir] * 2;
  const bCol = Math.floor(blinky.x / TILE);
  const bRow = Math.floor(blinky.y / TILE);
  return {
    col: pivotCol + (pivotCol - bCol),
    row: pivotRow + (pivotRow - bRow),
  };
}

export function createInkyUpdater(blinky) {
  return function updateInky(inky, dt, pac, level = 1) {
    if (inky.mode === MODE.HOUSE) {
      inky.releaseTimer -= dt;
      if (inky.releaseTimer > 0) return;
      inky.mode = MODE.SCATTER;
      inky.dir = DIR.UP;
      inky.targetX = inky.x;
      inky.targetY = inky.y - TILE;
    }
    updateGhost(inky, dt, pac, (p) => chaseTarget(p, blinky), level);
  };
}

export function drawInky(ctx, inky) {
  drawGhost(ctx, inky);
}
