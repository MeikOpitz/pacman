// renderer.js – Modernes Canvas Rendering (Neon-Stil)
// Wände werden in Offscreen-Canvas gecacht (einmal pro Level)

import { grid, COLS, ROWS, TILE, T } from './maze.js';

const BG        = '#0d0d1f';
const WALL_FILL = '#080818';
const WALL_LINE = '#3a7fff';
const WALL_GLOW = '#1a4fff';

// ── Offscreen-Canvas für statische Wände ──
let wallCache = null;
let wallCacheDirty = true;

export function invalidateMazeCache() {
  wallCacheDirty = true;
}

function isWallAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
  return grid[row][col] === T.WALL;
}

function buildWallCache() {
  const w = COLS * TILE;
  const h = ROWS * TILE;

  if (!wallCache) {
    wallCache = document.createElement('canvas');
    wallCache.width  = w;
    wallCache.height = h;
  }

  const c = wallCache.getContext('2d');
  c.clearRect(0, 0, w, h);

  // Hintergrund
  c.fillStyle = BG;
  c.fillRect(0, 0, w, h);

  // Wand-Füllungen (dunkel)
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] === T.WALL) {
        c.fillStyle = WALL_FILL;
        c.fillRect(col * TILE, row * TILE, TILE, TILE);
      }
    }
  }

  // Neon-Kanten der Wände
  c.strokeStyle = WALL_LINE;
  c.lineWidth = 1;
  c.shadowColor = WALL_GLOW;
  c.shadowBlur = 2;
  c.beginPath();

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] !== T.WALL) continue;
      const x = col * TILE;
      const y = row * TILE;

      if (!isWallAt(col, row - 1)) { c.moveTo(x, y);        c.lineTo(x + TILE, y);        }
      if (!isWallAt(col, row + 1)) { c.moveTo(x, y + TILE);  c.lineTo(x + TILE, y + TILE); }
      if (!isWallAt(col - 1, row)) { c.moveTo(x, y);        c.lineTo(x, y + TILE);        }
      if (!isWallAt(col + 1, row)) { c.moveTo(x + TILE, y); c.lineTo(x + TILE, y + TILE); }
    }
  }
  c.stroke();
  c.shadowBlur = 0;

  wallCacheDirty = false;
}

export function drawMaze(ctx) {
  // Wand-Cache bei Bedarf neu bauen
  if (wallCacheDirty) buildWallCache();

  // Gecachte Wände in einem Aufruf zeichnen
  ctx.drawImage(wallCache, 0, 0);

  // Pellets & Power Pellets (dynamisch – werden gegessen)
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = grid[row][col];
      const x = col * TILE + TILE / 2;
      const y = row * TILE + TILE / 2;

      if (tile === T.PELLET) {
        ctx.fillStyle = '#ffddcc';
        ctx.shadowColor = '#ff9966';
        ctx.shadowBlur = 1.5;
        ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.shadowBlur = 0;
      } else if (tile === T.POWER) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#aaddff';
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
}
