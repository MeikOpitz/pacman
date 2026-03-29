// ghost.js – Ghost Basisklasse

import { TILE, COLS, ROWS, isWalkableForGhost, tileAt } from './maze.js';
import { DIR } from './pacman.js';
import { getLevelSpeeds, GHOST as GHOST_CFG } from './config.js';

export { getLevelSpeeds };
export const MODE = { SCATTER: 0, CHASE: 1, FRIGHTENED: 2, EATEN: 3, HOUSE: 4 };

// Tunnel-Zone: Seitenkorridore
function isInTunnel(ghost) {
  const col = Math.floor(ghost.x / TILE);
  const row = Math.floor(ghost.y / TILE);
  return row === GHOST_CFG.TUNNEL_ROW && (col < GHOST_CFG.TUNNEL_LEFT || col > GHOST_CFG.TUNNEL_RIGHT);
}

const DX = { [DIR.LEFT]: -1, [DIR.RIGHT]: 1, [DIR.UP]: 0,  [DIR.DOWN]: 0 };
const DY = { [DIR.LEFT]:  0, [DIR.RIGHT]: 0, [DIR.UP]: -1, [DIR.DOWN]: 1 };
const OPPOSITE = { [DIR.LEFT]: DIR.RIGHT, [DIR.RIGHT]: DIR.LEFT, [DIR.UP]: DIR.DOWN, [DIR.DOWN]: DIR.UP };

export function createGhost(name, color, startCol, startRow, scatterCol, scatterRow) {
  const x = startCol * TILE + TILE / 2;
  const y = startRow * TILE + TILE / 2;
  return {
    name,
    color,
    x, y,
    dir: DIR.LEFT,
    mode: MODE.HOUSE,
    scatterTarget: { col: scatterCol, row: scatterRow },
    frightTimer: 0,
    frightBlink: 0,
    // Ziel-Tile-Center für saubere Bewegung
    targetX: x,
    targetY: y,
  };
}

function dist(ax, ay, bx, by) {
  return (ax - bx) ** 2 + (ay - by) ** 2;
}

// Wählt beste Richtung zum Ziel (kein Umkehren erlaubt)
function chooseDir(ghost, targetCol, targetRow) {
  const col = Math.floor(ghost.x / TILE);
  const row = Math.floor(ghost.y / TILE);
  const opp = OPPOSITE[ghost.dir];

  const dirs = [DIR.UP, DIR.LEFT, DIR.DOWN, DIR.RIGHT];
  let bestDir = null;
  let bestDist = Infinity;

  for (const d of dirs) {
    if (d === opp) continue;
    const nc = col + DX[d];
    const nr = row + DY[d];
    if (!isWalkableForGhost(nc, nr)) continue;
    const d2 = dist(nc, nr, targetCol, targetRow);
    if (d2 < bestDist) { bestDist = d2; bestDir = d; }
  }
  // Fallback: umkehren statt in Wand laufen
  if (bestDir === null) bestDir = opp;
  return bestDir;
}

function chooseRandomDir(ghost) {
  const col = Math.floor(ghost.x / TILE);
  const row = Math.floor(ghost.y / TILE);
  const opp = OPPOSITE[ghost.dir];
  const dirs = [DIR.UP, DIR.LEFT, DIR.DOWN, DIR.RIGHT]
    .filter(d => d !== opp && isWalkableForGhost(col + DX[d], row + DY[d]));
  // Fallback: umkehren
  return dirs.length ? dirs[Math.floor(Math.random() * dirs.length)] : opp;
}

const HOME = { col: GHOST_CFG.HOUSE_COL, row: GHOST_CFG.HOUSE_ROW };

export function updateGhost(ghost, dt, pac, getChaseTarget, level = 1) {
  if (ghost.mode === MODE.HOUSE) return;

  // EATEN: schnell zurück zum Ghost-House (immer 120 px/s)
  if (ghost.mode === MODE.EATEN) {
    const speed = GHOST_CFG.EATEN_SPEED / 1000;
    const step = speed * dt;
    const dx = HOME.col * TILE + TILE/2 - ghost.x;
    const dy = HOME.row * TILE + TILE/2 - ghost.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d <= step) {
      ghost.x = HOME.col * TILE + TILE/2;
      ghost.y = HOME.row * TILE + TILE/2;
      ghost.targetX = ghost.x;
      ghost.targetY = ghost.y;
      ghost.mode = MODE.SCATTER;
    } else {
      ghost.x += (dx/d) * step;
      ghost.y += (dy/d) * step;
    }
    return;
  }

  // Tunnel-Wrapping nur auf Tunnel-Zeile (Row 14)
  const ghostRow = Math.floor(ghost.y / TILE);
  if (ghostRow === 14) {
    if (ghost.x < -TILE)             { ghost.x += COLS * TILE; ghost.targetX += COLS * TILE; }
    if (ghost.x > (COLS + 1) * TILE) { ghost.x -= COLS * TILE; ghost.targetX -= COLS * TILE; }
  } else {
    // Außerhalb Tunnel: X hart begrenzen, damit Geister nicht aus dem Spielfeld laufen
    const minX = TILE / 2, maxX = (COLS - 0.5) * TILE;
    if (ghost.x < minX) { ghost.x = minX; ghost.targetX = Math.max(ghost.targetX, minX); }
    if (ghost.x > maxX) { ghost.x = maxX; ghost.targetX = Math.min(ghost.targetX, maxX); }
  }
  // Y-Begrenzung: Geister bleiben im Spielfeld (targetY mitschieben)
  const minY = TILE / 2, maxY = (ROWS - 0.5) * TILE;
  if (ghost.y < minY) { ghost.y = minY; if (ghost.targetY < minY) ghost.targetY = minY; }
  if (ghost.y > maxY) { ghost.y = maxY; if (ghost.targetY > maxY) ghost.targetY = maxY; }

  if (ghost.mode === MODE.FRIGHTENED) {
    ghost.frightTimer -= dt;
    if (ghost.frightTimer <= 0) ghost.mode = MODE.SCATTER;
  }

  const speeds = getLevelSpeeds(level);
  let spd;
  if (ghost.mode === MODE.FRIGHTENED) spd = speeds.ghostFright;
  else if (isInTunnel(ghost))         spd = speeds.ghostTunnel;
  else                                spd = speeds.ghost;
  const step = (spd / 1000) * dt;

  const dx = ghost.targetX - ghost.x;
  const dy = ghost.targetY - ghost.y;
  const d  = Math.abs(dx) + Math.abs(dy);

  if (d <= step) {
    // Tile-Center erreicht: einrasten und nächste Richtung wählen
    ghost.x = ghost.targetX;
    ghost.y = ghost.targetY;

    // Im Tunnel (außerhalb Map-Grenzen): Richtung beibehalten, nicht umkehren
    const tCol = Math.floor(ghost.x / TILE);
    const tRow = Math.floor(ghost.y / TILE);
    if (tCol >= 0 && tCol < COLS && tRow >= 0 && tRow < ROWS) {
      if (ghost.mode === MODE.FRIGHTENED) {
        ghost.dir = chooseRandomDir(ghost);
      } else {
        const t = ghost.mode === MODE.SCATTER ? ghost.scatterTarget : getChaseTarget(pac);
        ghost.dir = chooseDir(ghost, t.col, t.row);
      }
    }

    ghost.targetX = ghost.x + DX[ghost.dir] * TILE;
    ghost.targetY = ghost.y + DY[ghost.dir] * TILE;
  } else {
    // Weiter zum Ziel bewegen
    ghost.x += DX[ghost.dir] * step;
    ghost.y += DY[ghost.dir] * step;
  }
}

export function frightenGhost(ghost, level = 1) {
  if (ghost.mode === MODE.EATEN || ghost.mode === MODE.HOUSE) return;
  const dur = getLevelSpeeds(level).frightDur;
  if (dur <= 0) return; // Level 17+: Power Pellet wirkungslos
  ghost.mode = MODE.FRIGHTENED;
  ghost.frightTimer = dur;
  ghost.frightBlink = Math.max(GHOST_CFG.FRIGHT_BLINK_MIN, dur * GHOST_CFG.FRIGHT_BLINK_PCT);
  const oldDir = ghost.dir;
  ghost.dir = OPPOSITE[oldDir];
  // Target auf vorigen Tile-Center zurücksetzen, damit der Ghost sofort
  // wieder tile-gebunden läuft und nicht unkontrolliert durch Wände geht
  ghost.targetX = ghost.targetX - DX[oldDir] * TILE;
  ghost.targetY = ghost.targetY - DY[oldDir] * TILE;
}

// ── Sprite-Cache für Ghost-Bodies ──────────────────────────────
// Pre-rendert jeden Ghost-Farbvariante einmal in Offscreen-Canvas
// Varianten: 4 Geist-Farben + Frightened (blau) + Frightened-Flash (weiß)
const GHOST_SPRITE_SIZE = 16; // px (genug Platz für Body + Glow)
const ghostSpriteCache = new Map();

function _buildGhostSprite(bodyColor, glow) {
  const size = GHOST_SPRITE_SIZE;
  const oc = document.createElement('canvas');
  oc.width = size; oc.height = size;
  const c = oc.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  const r = TILE / 2 - 1;

  // Glow
  c.shadowColor = bodyColor;
  c.shadowBlur  = glow;

  // Gradient
  const grad = c.createRadialGradient(cx - 1, cy - 2, 1, cx, cy, r + 1);
  grad.addColorStop(0, lighten(bodyColor));
  grad.addColorStop(1, bodyColor);
  c.fillStyle = grad;

  // Körper
  c.beginPath();
  c.arc(cx, cy - 1, r, Math.PI, 0);
  c.lineTo(cx + r, cy + r);
  const w = r * 2 / 3;
  c.lineTo(cx + r - w, cy + r - 2);
  c.lineTo(cx,          cy + r);
  c.lineTo(cx - r + w, cy + r - 2);
  c.lineTo(cx - r,      cy + r);
  c.closePath();
  c.fill();
  c.shadowBlur = 0;

  return oc;
}

function _getGhostSprite(bodyColor, glow) {
  const key = bodyColor + '|' + glow;
  let sprite = ghostSpriteCache.get(key);
  if (!sprite) {
    sprite = _buildGhostSprite(bodyColor, glow);
    ghostSpriteCache.set(key, sprite);
  }
  return sprite;
}

export function drawGhost(ctx, ghost) {
  const x = ghost.x;
  const y = ghost.y;

  const frightened = ghost.mode === MODE.FRIGHTENED;
  const flashing   = frightened && ghost.frightBlink > 0 && ghost.frightTimer < ghost.frightBlink && Math.floor(ghost.frightTimer / GHOST_CFG.FLASH_INTERVAL) % 2 === 0;
  const bodyColor  = frightened ? (flashing ? '#ffffff' : '#2233ff') : ghost.color;
  const glow       = frightened ? 1.5 : 2.5;

  // Gecachten Body-Sprite zeichnen
  const sprite = _getGhostSprite(bodyColor, glow);
  const half = GHOST_SPRITE_SIZE / 2;
  ctx.drawImage(sprite, x - half, y - half);

  // Augen (prozedural – kostengünstig, richtungsunabhängig)
  if (!frightened) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x - 2, y - 2, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 2, y - 2, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3399ff';
    ctx.beginPath(); ctx.arc(x - 1, y - 2, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3, y - 2, 1, 0, Math.PI * 2); ctx.fill();
  } else {
    // Ängstliche Augen
    ctx.fillStyle = flashing ? '#ff4444' : '#ffff00';
    ctx.fillRect(x - 3, y - 3, 2, 2);
    ctx.fillRect(x + 1, y - 3, 2, 2);
    // Zitternder Mund
    ctx.fillStyle = flashing ? '#ff4444' : '#ffff00';
    ctx.fillRect(x - 3, y + 1, 1, 1);
    ctx.fillRect(x - 1, y + 2, 1, 1);
    ctx.fillRect(x + 1, y + 1, 1, 1);
    ctx.fillRect(x + 3, y + 2, 1, 1);
  }
}

function lighten(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 60);
  const g = Math.min(255, ((n >> 8)  & 0xff) + 60);
  const b = Math.min(255, ((n)       & 0xff) + 60);
  return `rgb(${r},${g},${b})`;
}
