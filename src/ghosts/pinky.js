// pinky.js – Pink, zielt 4 Tiles vor Pac-Man

import { createGhost, updateGhost, drawGhost, MODE } from '../ghost.js';
import { TILE } from '../maze.js';
import { DIR } from '../pacman.js';

const DX = { [DIR.LEFT]: -1, [DIR.RIGHT]: 1, [DIR.UP]: 0,  [DIR.DOWN]: 0 };
const DY = { [DIR.LEFT]:  0, [DIR.RIGHT]: 0, [DIR.UP]: -1, [DIR.DOWN]: 1 };

export function createPinky() {
  const g = createGhost('pinky', '#ffb8ff', 13, 14, 2, 0);
  g.releaseTimer = 3000;
  return g;
}

function chaseTarget(pac) {
  const col = Math.floor(pac.x / TILE) + DX[pac.dir] * 4;
  const row = Math.floor(pac.y / TILE) + DY[pac.dir] * 4;
  return { col, row };
}

export function updatePinky(pinky, dt, pac, level = 1) {
  if (pinky.mode === MODE.HOUSE) {
    pinky.releaseTimer -= dt;
    if (pinky.releaseTimer > 0) return;
    pinky.mode = MODE.SCATTER;
    pinky.dir = DIR.UP;
    pinky.targetX = pinky.x;
    pinky.targetY = pinky.y - TILE;
  }
  updateGhost(pinky, dt, pac, chaseTarget, level);
}

export function drawPinky(ctx, pinky) {
  drawGhost(ctx, pinky);
}
