// pacman.js – Pac-Man Logik

import { TILE, COLS, isWalkable, tileAt, eatTile, T } from './maze.js';
import { drawCat, drawDog, drawSonic, drawPikachu, drawFelori, drawWuffels, drawPacman as drawPacmanShape } from './charselect.js';
import { drawCustomSkin } from './customskin.js';
import { getLevelSpeeds, PAC } from './config.js';

export const DIR = { LEFT: 0, RIGHT: 1, UP: 2, DOWN: 3 };

function getPacSpeed(level) {
  return getLevelSpeeds(level).pac;
}

const DX = { [DIR.LEFT]: -1, [DIR.RIGHT]: 1, [DIR.UP]: 0,  [DIR.DOWN]: 0  };
const DY = { [DIR.LEFT]:  0, [DIR.RIGHT]: 0, [DIR.UP]: -1, [DIR.DOWN]: 1  };

export function createPacman(character = 'pacman') {
  return {
    x: 13.5 * TILE,
    y: 23.5 * TILE,
    dir:        DIR.LEFT,
    nextDir:    DIR.LEFT,
    mouthAngle: 0,
    mouthDir:   1,
    character,
    skinData:   null,
    deathAnim:  0,
  };
}

function tileCoord(px) {
  return Math.floor(px / TILE);
}

// Nächstes Tile in Bewegungsrichtung prüfen
function canMove(x, y, dir) {
  const nx = x + DX[dir] * (TILE / 2 + 1);
  const ny = y + DY[dir] * (TILE / 2 + 1);
  return isWalkable(tileCoord(nx), tileCoord(ny));
}

export function updatePacman(pac, dt, level = 1) {
  // Tunnel nur auf Zeile 14
  const pacRow = Math.floor(pac.y / TILE);
  if (pacRow === 14) {
    if (pac.x < 0)          pac.x = COLS * TILE;
    if (pac.x > COLS * TILE) pac.x = 0;
  } else {
    pac.x = Math.max(TILE / 2, Math.min((COLS - 0.5) * TILE, pac.x));
  }

  // Richtungswechsel wenn möglich + senkrechte Achse auf Tile-Mitte einrasten
  const wantsTurn = pac.nextDir !== pac.dir;
  const perpendicular = wantsTurn && (
    (pac.dir <= 1 && pac.nextDir >= 2) || // horizontal → vertikal
    (pac.dir >= 2 && pac.nextDir <= 1)    // vertikal → horizontal
  );

  let turnX = pac.x;
  let turnY = pac.y;

  // Cornering: wenn senkrechter Turn gewünscht aber an aktueller Position
  // nicht möglich, prüfe ob die nächste Tile-Mitte in Laufrichtung nah genug ist
  if (perpendicular && !canMove(pac.x, pac.y, pac.nextDir)) {
    const CORNER_TOLERANCE = PAC.CORNER_TOLERANCE;
    const centerX = Math.floor(pac.x / TILE) * TILE + TILE / 2;
    const centerY = Math.floor(pac.y / TILE) * TILE + TILE / 2;
    // Nächste Tile-Mitte in Laufrichtung
    const nextCX = centerX + DX[pac.dir] * TILE;
    const nextCY = centerY + DY[pac.dir] * TILE;
    const distToNext = Math.abs(pac.x - nextCX) + Math.abs(pac.y - nextCY);
    if (distToNext <= CORNER_TOLERANCE && canMove(nextCX, nextCY, pac.nextDir)) {
      turnX = nextCX;
      turnY = nextCY;
    }
  }

  if (canMove(turnX, turnY, pac.nextDir)) {
    pac.x = turnX;
    pac.y = turnY;
    pac.dir = pac.nextDir;
    if (pac.dir === DIR.UP || pac.dir === DIR.DOWN) {
      pac.x = Math.floor(pac.x / TILE) * TILE + TILE / 2;
    } else {
      pac.y = Math.floor(pac.y / TILE) * TILE + TILE / 2;
    }
  }

  // Bewegen (level-abhängige Geschwindigkeit)
  const step = (getPacSpeed(level) / 1000) * dt;
  if (canMove(pac.x, pac.y, pac.dir)) {
    pac.x += DX[pac.dir] * step;
    pac.y += DY[pac.dir] * step;
  }

  // Pellet fressen
  const col = Math.floor(pac.x / TILE);
  const row = Math.floor(pac.y / TILE);
  const tile = tileAt(col, row);
  let scored = 0;
  pac.atePower = false;
  if (tile === T.PELLET) { eatTile(col, row); scored = 10; }
  if (tile === T.POWER)  { eatTile(col, row); scored = 50; pac.atePower = true; }
  pac.scored = scored;

  // Mund-Animation
  pac.mouthAngle += pac.mouthDir * PAC.MOUTH_SPEED;
  if (pac.mouthAngle >= PAC.MOUTH_MAX) pac.mouthDir = -1;
  if (pac.mouthAngle <= 0)             pac.mouthDir =  1;
}

export function drawPacman(ctx, pac) {
  const r = TILE / 2 - 1;
  const x = pac.x;
  const y = pac.y;

  if (pac.deathAnim > 0) {
    _drawDeath(ctx, pac, x, y, r);
    return;
  }

  const mouth = pac.mouthAngle;
  if (pac.character === 'cat')    { drawCat(ctx, x, y, r, mouth);    return; }
  if (pac.character === 'dog')    { drawDog(ctx, x, y, r, mouth);    return; }
  if (pac.character === 'sonic')  { drawSonic(ctx, x, y, r, mouth);  return; }
  if (pac.character === 'pikachu'){ drawPikachu(ctx, x, y, r, mouth); return; }
  if (pac.character === 'felori') { drawFelori(ctx, x, y, r, mouth);  return; }
  if (pac.character === 'wuffels'){ drawWuffels(ctx, x, y, r, mouth); return; }
  if (pac.character === 'custom' && pac.skinData) { drawCustomSkin(ctx, x, y, r, mouth, pac.skinData); return; }
  drawPacmanShape(ctx, x, y, r, mouth, pac.dir);
}

function _drawDeath(ctx, pac, x, y, r) {
  const t = pac.deathAnim; // 0 → 1

  if (pac.character === 'pacman' || !pac.character) {
    // Mund öffnet sich bis zum Halbkreis (t 0→0.6), dann schrumpft alles (t 0.6→1)
    const m     = 0.35 + t * (Math.PI - 0.35) * Math.min(1, t / 0.6);
    const scale = t < 0.6 ? 1 : Math.max(0, 1 - (t - 0.6) / 0.4);
    if (scale <= 0) return;
    const ROT = [Math.PI, 0, Math.PI * 1.5, Math.PI / 2];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ROT[pac.dir] ?? 0);
    ctx.scale(scale, scale);
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    grad.addColorStop(0, '#ffe566');
    grad.addColorStop(1, '#f0a800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, m, Math.PI * 2 - m);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    // Andere Charaktere: drehen und schrumpfen
    const scale = Math.max(0, 1 - t);
    if (scale <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * Math.PI * 3);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
    if (pac.character === 'cat')     drawCat(ctx, x, y, r, 20);
    else if (pac.character === 'dog')     drawDog(ctx, x, y, r, 20);
    else if (pac.character === 'sonic')   drawSonic(ctx, x, y, r, 20);
    else if (pac.character === 'pikachu') drawPikachu(ctx, x, y, r, 20);
    else if (pac.character === 'felori')  drawFelori(ctx, x, y, r, 20);
    else if (pac.character === 'wuffels') drawWuffels(ctx, x, y, r, 20);
    ctx.restore();
  }
}
