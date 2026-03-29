// fruit.js – Bonus-Items (level- und charakter-spezifisch)

import { TILE } from './maze.js';
import { FRUIT as FRUIT_CFG } from './config.js';

export const FRUIT_X = 13.5 * TILE;
export const FRUIT_Y = 23 * TILE + TILE / 2;

// Original Pac-Man Frucht-Tabelle
const FRUIT_TABLE = [
  { type: 'cherry',     score:  100 }, // L1
  { type: 'strawberry', score:  300 }, // L2
  { type: 'orange',     score:  500 }, // L3
  { type: 'orange',     score:  500 }, // L4
  { type: 'apple',      score:  700 }, // L5
  { type: 'apple',      score:  700 }, // L6
  { type: 'melon',      score: 1000 }, // L7
  { type: 'melon',      score: 1000 }, // L8
  { type: 'galaxian',   score: 2000 }, // L9
  { type: 'galaxian',   score: 2000 }, // L10
  { type: 'bell',       score: 3000 }, // L11
  { type: 'bell',       score: 3000 }, // L12
  { type: 'key',        score: 5000 }, // L13+
];

function _fruitForLevel(level) {
  return FRUIT_TABLE[Math.min(level - 1, FRUIT_TABLE.length - 1)];
}

export function createFruit() {
  return { active: false, timer: 0, score: 0, type: 'cherry', spawned: 0 };
}

export function resetFruit(fruit) {
  fruit.active  = false;
  fruit.timer   = 0;
  fruit.spawned = 0;
}

export function trySpawnFruit(fruit, remaining, level) {
  if (fruit.active) return;
  const { type, score } = _fruitForLevel(level);
  if (fruit.spawned === 0 && remaining <= FRUIT_CFG.SPAWN_THRESHOLD_1) {
    fruit.active  = true;
    fruit.timer   = FRUIT_CFG.DURATION;
    fruit.type    = type;
    fruit.score   = score;
    fruit.spawned = 1;
  } else if (fruit.spawned === 1 && remaining <= FRUIT_CFG.SPAWN_THRESHOLD_2) {
    fruit.active  = true;
    fruit.timer   = FRUIT_CFG.DURATION;
    fruit.type    = type;
    fruit.score   = score;
    fruit.spawned = 2;
  }
}

export function updateFruit(fruit, dt) {
  if (!fruit.active) return;
  fruit.timer -= dt;
  if (fruit.timer <= 0) fruit.active = false;
}

export function checkFruitCollision(fruit, pac) {
  if (!fruit.active) return 0;
  const dx = pac.x - FRUIT_X;
  const dy = pac.y - FRUIT_Y;
  if (dx * dx + dy * dy < TILE * TILE * 1.5) {
    fruit.active = false;
    return fruit.score;
  }
  return 0;
}

// ── Fruit Sprite Cache ────────────────────────────────────────
const FRUIT_SPRITE_SIZE = 20; // px (genug für größte Frucht)
const fruitSpriteCache = new Map();

const FRUIT_DRAW_MAP = {
  cherry:     drawCherry,
  strawberry: drawStrawberry,
  orange:     drawOrange,
  apple:      drawApple,
  melon:      drawMelon,
  galaxian:   drawGalaxian,
  bell:       drawBell,
  key:        drawKey,
  bone:       drawBone,
  fish:       drawFish,
  ring:       drawRing,
  pokeball:   drawPokeball,
};

function _getFruitSprite(type) {
  let sprite = fruitSpriteCache.get(type);
  if (!sprite) {
    const oc = document.createElement('canvas');
    oc.width = FRUIT_SPRITE_SIZE; oc.height = FRUIT_SPRITE_SIZE;
    const c = oc.getContext('2d');
    const cx = FRUIT_SPRITE_SIZE / 2;
    const cy = FRUIT_SPRITE_SIZE / 2;
    (FRUIT_DRAW_MAP[type] ?? drawCherry)(c, cx, cy);
    sprite = oc;
    fruitSpriteCache.set(type, sprite);
  }
  return sprite;
}

function _charFruitType(character) {
  if (character === 'dog')    return 'bone';
  if (character === 'cat')    return 'fish';
  if (character === 'sonic')  return 'ring';
  if (character === 'pikachu' || character === 'felori' || character === 'wuffels') return 'pokeball';
  return null;
}

export function drawFruit(ctx, fruit, character) {
  if (!fruit.active) return;
  if (fruit.timer < FRUIT_CFG.FLASH_START && Math.floor(fruit.timer / FRUIT_CFG.FLASH_INTERVAL) % 2 === 0) return;

  const type = _charFruitType(character) ?? fruit.type;
  const sprite = _getFruitSprite(type);
  const half = FRUIT_SPRITE_SIZE / 2;
  ctx.drawImage(sprite, FRUIT_X - half, FRUIT_Y - half);
}

// ── Kirsche ───────────────────────────────────────────────────
function drawCherry(ctx, x, y) {
  ctx.strokeStyle = '#338833'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 1.5, y - 1); ctx.lineTo(x - 3, y - 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 1.5, y - 1); ctx.lineTo(x + 1, y - 5); ctx.stroke();
  ctx.fillStyle = '#44aa22';
  ctx.beginPath(); ctx.ellipse(x - 1, y - 5, 2.2, 1.1, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dd0000';
  ctx.beginPath(); ctx.arc(x - 3,   y + 1, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 1.5, y + 1, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.arc(x - 3.8, y - 0.2, 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 0.7, y - 0.2, 0.9, 0, Math.PI * 2); ctx.fill();
}

// ── Erdbeere ──────────────────────────────────────────────────
function drawStrawberry(ctx, x, y) {
  // Blätter
  ctx.fillStyle = '#44aa22';
  ctx.beginPath(); ctx.ellipse(x - 2,   y - 4, 2.2, 1.2, -0.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 1.5, y - 4, 2.2, 1.2,  0.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - 0.5, y - 4.5, 1.5, 1,  0,   0, Math.PI * 2); ctx.fill();
  // Frucht
  ctx.fillStyle = '#ee2233';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 1.5, y + 2.5);
  ctx.lineTo(x, y + 5.5);
  ctx.lineTo(x + 1.5, y + 2.5);
  ctx.fill();
  // Samen
  ctx.fillStyle = '#ffeeaa';
  for (const [sx, sy] of [[-1.2, -1.2], [1.2, -0.8], [0, 0.8], [-1.5, 1.5], [1.5, 1.5]]) {
    ctx.beginPath(); ctx.arc(x + sx, y + sy, 0.55, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Orange ────────────────────────────────────────────────────
function drawOrange(ctx, x, y) {
  ctx.fillStyle = '#ff8800';
  ctx.beginPath(); ctx.arc(x, y + 0.5, 3.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,100,0.35)';
  ctx.beginPath(); ctx.ellipse(x - 1.3, y - 0.8, 1.5, 1.0, -0.4, 0, Math.PI * 2); ctx.fill();
  // Stiel + Blatt
  ctx.strokeStyle = '#555'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(x, y - 3.5); ctx.lineTo(x, y - 5.5); ctx.stroke();
  ctx.fillStyle = '#44aa22';
  ctx.beginPath(); ctx.ellipse(x + 2, y - 4.5, 2.5, 1.1, 0.5, 0, Math.PI * 2); ctx.fill();
}

// ── Apfel ─────────────────────────────────────────────────────
function drawApple(ctx, x, y) {
  ctx.fillStyle = '#dd1111';
  ctx.beginPath(); ctx.arc(x - 0.8, y + 0.5, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 0.8, y + 0.5, 3.2, 0, Math.PI * 2); ctx.fill();
  // Stiel
  ctx.strokeStyle = '#553300'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x, y - 2.5); ctx.lineTo(x + 1, y - 5); ctx.stroke();
  // Blatt
  ctx.fillStyle = '#44aa22';
  ctx.beginPath(); ctx.ellipse(x + 2.5, y - 4.5, 2.5, 1.2, -0.5, 0, Math.PI * 2); ctx.fill();
  // Glanz
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(x - 2, y - 1, 1.0, 1.6, 0.2, 0, Math.PI * 2); ctx.fill();
}

// ── Melone ────────────────────────────────────────────────────
function drawMelon(ctx, x, y) {
  ctx.fillStyle = '#33aa44';
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#228833'; ctx.lineWidth = 0.7;
  for (const a of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 4, a, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.ellipse(x - 1.5, y - 1.5, 1.4, 1.0, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#553300'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y - 6); ctx.stroke();
}

// ── Galaxian (Raumschiff) ─────────────────────────────────────
function drawGalaxian(ctx, x, y) {
  // Flügel
  ctx.fillStyle = '#ee2244';
  ctx.beginPath(); ctx.moveTo(x - 2, y + 1); ctx.lineTo(x - 6.5, y + 4); ctx.lineTo(x - 2, y + 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 2, y + 1); ctx.lineTo(x + 6.5, y + 4); ctx.lineTo(x + 2, y + 3); ctx.closePath(); ctx.fill();
  // Rumpf
  ctx.fillStyle = '#3355ff';
  ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x - 2.5, y + 3); ctx.lineTo(x + 2.5, y + 3); ctx.closePath(); ctx.fill();
  // Cockpit
  ctx.fillStyle = '#aaddff';
  ctx.beginPath(); ctx.ellipse(x, y - 0.5, 1.5, 2.2, 0, 0, Math.PI * 2); ctx.fill();
}

// ── Glocke ────────────────────────────────────────────────────
function drawBell(ctx, x, y) {
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.bezierCurveTo(x + 5, y - 5, x + 5.5, y + 1, x + 4.5, y + 2);
  ctx.lineTo(x - 4.5, y + 2);
  ctx.bezierCurveTo(x - 5.5, y + 1, x - 5, y - 5, x, y - 5);
  ctx.fill();
  // Klöppel
  ctx.fillStyle = '#cc9900';
  ctx.beginPath(); ctx.arc(x, y + 3.5, 1.5, 0, Math.PI * 2); ctx.fill();
  // Glanz
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.ellipse(x - 2, y - 1.5, 1.1, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  // Öse
  ctx.strokeStyle = '#cc9900'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y - 5.5, 1.2, 0, Math.PI * 2); ctx.stroke();
}

// ── Schlüssel ─────────────────────────────────────────────────
function drawKey(ctx, x, y) {
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  // Griff-Ring
  ctx.beginPath(); ctx.arc(x - 2.5, y - 1, 2.8, 0, Math.PI * 2); ctx.stroke();
  // Schaft
  ctx.beginPath(); ctx.moveTo(x + 0.3, y - 1); ctx.lineTo(x + 6, y - 1); ctx.stroke();
  // Zähne
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x + 3.5, y - 1); ctx.lineTo(x + 3.5, y + 1.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 5.5, y - 1); ctx.lineTo(x + 5.5, y + 1.8); ctx.stroke();
}

// ── Knochen ───────────────────────────────────────────────────
function drawBone(ctx, x, y) {
  ctx.fillStyle = '#f0ead8';
  ctx.beginPath(); ctx.arc(x - 5.5, y - 1.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 5.5, y + 1.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5.5, y - 1.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5.5, y + 1.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.rect(x - 4.5, y - 1, 9, 2); ctx.fill();
}

// ── Fisch ─────────────────────────────────────────────────────
function drawFish(ctx, x, y) {
  ctx.fillStyle = '#cc8844';
  ctx.beginPath(); ctx.ellipse(x - 1, y, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 3, y); ctx.lineTo(x + 7, y - 3); ctx.lineTo(x + 7, y + 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#eecc99';
  ctx.beginPath(); ctx.ellipse(x - 1.5, y + 0.5, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(x - 3, y - 0.5, 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - 3.3, y - 0.8, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#886633'; ctx.lineWidth = 0.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(x + i * 1.5, y - 1.5); ctx.lineTo(x + i * 1.5, y + 1.5); ctx.stroke();
  }
}

// ── Sonic-Ring ────────────────────────────────────────────────
function drawRing(ctx, x, y) {
  ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
  ctx.shadowColor = '#FFD700'; ctx.shadowBlur  = 3;
  ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur  = 0;
  ctx.strokeStyle = '#ffe97a'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc(x - 1, y - 1, 2.8, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
}

// ── Pokéball ──────────────────────────────────────────────────
function drawPokeball(ctx, x, y) {
  const r = 4.5;
  ctx.fillStyle = '#dd1111';
  ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill();
}
