// bonusgame.js – Mario-Style Bonus-Spiel (Intermission 1)

import { drawCharPreview } from './charselect.js';
import { drawCustomSkin }  from './customskin.js';
import { startBonusMelody, stopBonusMelody, playBonusCoin, playBonusJump,
         playBonusStomp, playBonusBlock, playBonusDeath, playBonusWin } from './audio.js';
import { TIMER } from './config.js';

const W = 224, H = 288;
const GRAVITY   = 0.0012;  // px/ms²
const JUMP_VEL  = -0.38;   // px/ms
const MOVE_SPEED = 0.08;   // px/ms
const GROUND_Y  = 220;     // Boden-Y
const TIME_LIMIT = 25000;  // 25 Sekunden

// ── Level-Daten ──────────────────────────────────────────────────
const PLATFORMS = [
  { x: 0,   y: GROUND_Y, w: 120, h: 12 },                        // Start-Boden
  { x: 168, y: GROUND_Y, w: 60,  h: 12 },                        // Mittelboden
  { x: 140, y: 175, w: 32, h: 6, moving: true, minY: 168, maxY: 182, speed: 0.0012 },
  { x: 195, y: 150, w: 32, h: 6, moving: true, minY: 143, maxY: 157, speed: 0.0015 },
  { x: 228, y: GROUND_Y, w: 80,  h: 12 },
  { x: 310, y: GROUND_Y, w: 200, h: 12 },
];

// Question-Mark-Blöcke (schweben, statisch, geben Punkte)
const Q_BLOCKS = [
  { x: 50,  y: 180, hit: false },
  { x: 250, y: 185, hit: false },
  { x: 360, y: 175, hit: false },
];

// Röhren (Pipes) als Dekoration / Hindernis
const PIPES = [
  { x: 100, h: 24 },   // kleines Rohr
  { x: 420, h: 36 },   // großes Rohr
];

// Wolken (Parallax-Hintergrund)
const CLOUDS = [
  { x: 30,  y: 30,  w: 28, h: 10 },
  { x: 130, y: 18,  w: 20, h: 8 },
  { x: 250, y: 25,  w: 32, h: 11 },
  { x: 370, y: 14,  w: 24, h: 9 },
  { x: 460, y: 32,  w: 26, h: 10 },
];

// Hügel im Hintergrund
const HILLS = [
  { x: 10,  r: 35 },
  { x: 200, r: 25 },
  { x: 350, r: 40 },
  { x: 480, r: 30 },
];

// Büsche
const BUSHES = [
  { x: 60,  w: 20 },
  { x: 175, w: 14 },
  { x: 290, w: 22 },
  { x: 440, w: 16 },
];

const FLAG_X = 480;

const ITEM_TYPES = {
  pacman:  'cherry',
  cat:     'fish',
  dog:     'bone',
  sonic:   'ring',
  pikachu: 'pokeball',
  felori:  'cherry',
  wuffels: 'bone',
  custom:  'cherry',
};

function _makeItems() {
  return [
    { x: 40,  y: GROUND_Y - 20, collected: false },
    { x: 80,  y: GROUND_Y - 20, collected: false },
    { x: 175, y: 155,            collected: false },
    { x: 210, y: 130,            collected: false },
    { x: 260, y: GROUND_Y - 20, collected: false },
    { x: 340, y: GROUND_Y - 20, collected: false },
    { x: 400, y: GROUND_Y - 20, collected: false },
    { x: 440, y: GROUND_Y - 20, collected: false },
  ];
}

function _makeGhosts() {
  return [
    { x: 280, y: GROUND_Y - 12, vx: -0.04, alive: true, squishTimer: 0 },
    { x: 380, y: GROUND_Y - 12, vx: -0.05, alive: true, squishTimer: 0 },
  ];
}

function _makeDandelion() {
  return { x: 330, y: GROUND_Y - 18, spores: [], spawnTimer: 0 };
}

// ── State ────────────────────────────────────────────────────────
export function createBonusGame() {
  return { active: false };
}

export function startBonusGame(bg, character, skinData, score) {
  bg.active     = true;
  bg.character  = character;
  bg.skinData   = skinData;
  bg.baseScore  = score;
  bg.timer      = 0;
  bg.result     = null;    // 'win' | 'fail'
  bg.resultTimer = 0;

  // Player
  bg.px  = 20;
  bg.py  = GROUND_Y - 14;
  bg.vx  = 0;
  bg.vy  = 0;
  bg.onGround = true;
  bg.dir = 1;
  bg.inputLeft  = false;
  bg.inputRight = false;
  bg.inputJump  = false;

  // Level
  bg.platforms  = PLATFORMS.map(p => ({ ...p, baseY: p.y }));
  bg.qBlocks    = Q_BLOCKS.map(q => ({ ...q }));
  bg.items      = _makeItems();
  bg.ghosts     = _makeGhosts();
  bg.dandelion  = _makeDandelion();
  bg.cameraX    = 0;
  bg.collected  = 0;
  bg.ghostKills = 0;
  bg.bonusPoints = 0;
  bg.coinPopups = [];  // { x, y, timer }

  // Intro-Phase: Steuerungshinweise bevor es losgeht
  bg.intro = true;
  bg.introTimer = 2500; // ms
}

// ── Input ────────────────────────────────────────────────────────
export function bonusGameInput(bg, e, down) {
  if (!bg.active || bg.result || bg.intro) return;
  if (e.key === 'ArrowLeft')  bg.inputLeft  = down;
  if (e.key === 'ArrowRight') bg.inputRight = down;
  if (e.key === 'ArrowUp' || e.key === ' ') bg.inputJump = down;
}

export function bonusGameSetDir(bg, dir) {
  if (!bg.active || bg.result || bg.intro) return;
  bg.inputLeft  = dir === 0;
  bg.inputRight = dir === 1;
  bg.inputJump  = dir === 2;
}

// ── Update ───────────────────────────────────────────────────────
export function updateBonusGame(bg, dt) {
  if (!bg.active) return;

  // Intro-Phase: Countdown, dann Melodie starten
  if (bg.intro) {
    bg.introTimer -= dt;
    if (bg.introTimer <= 0) {
      bg.intro = false;
      startBonusMelody();
    }
    return;
  }

  if (bg.result) {
    bg.resultTimer += dt;
    if (bg.resultTimer > 2000) bg.active = false;
    return;
  }

  bg.timer += dt;
  if (bg.timer >= TIME_LIMIT) { _fail(bg); return; }

  // Coin popups
  for (let i = bg.coinPopups.length - 1; i >= 0; i--) {
    bg.coinPopups[i].timer -= dt;
    bg.coinPopups[i].y -= 0.03 * dt;
    if (bg.coinPopups[i].timer <= 0) bg.coinPopups.splice(i, 1);
  }

  // ── Player-Bewegung ──────────────────────────────────
  bg.vx = 0;
  if (bg.inputLeft)  { bg.vx = -MOVE_SPEED; bg.dir = -1; }
  if (bg.inputRight) { bg.vx =  MOVE_SPEED; bg.dir =  1; }

  if (bg.inputJump && bg.onGround) {
    bg.vy = JUMP_VEL;
    bg.onGround = false;
    bg.inputJump = false;
    playBonusJump();
  }

  bg.vy += GRAVITY * dt;
  bg.px += bg.vx * dt;
  bg.py += bg.vy * dt;

  if (bg.px < 8) bg.px = 8;

  // ── Plattform-Kollision ──────────────────────────────
  bg.onGround = false;
  for (const p of bg.platforms) {
    if (p.moving) {
      p.y = p.baseY + Math.sin(bg.timer * p.speed) * ((p.maxY - p.minY) / 2);
    }
    if (bg.px + 6 > p.x && bg.px - 6 < p.x + p.w &&
        bg.py + 14 >= p.y && bg.py + 14 <= p.y + 8 && bg.vy >= 0) {
      bg.py = p.y - 14;
      bg.vy = 0;
      bg.onGround = true;
    }
  }

  // ── Question-Block Kollision (von unten) ─────────────
  for (const q of bg.qBlocks) {
    if (q.hit) continue;
    const bx = q.x, by = q.y, bs = 10;
    // Kopf trifft Block von unten
    if (bg.px + 6 > bx - bs/2 && bg.px - 6 < bx + bs/2 &&
        bg.py - 6 <= by + bs/2 && bg.py - 6 >= by - bs/2 && bg.vy < 0) {
      q.hit = true;
      bg.vy = 0;
      bg.bonusPoints += 50;
      bg.coinPopups.push({ x: bx, y: by - 12, timer: 600 });
      playBonusBlock();
    }
    // Kann auch von oben drauf stehen
    if (bg.px + 6 > bx - bs/2 && bg.px - 6 < bx + bs/2 &&
        bg.py + 14 >= by - bs/2 && bg.py + 14 <= by + 4 && bg.vy >= 0) {
      bg.py = by - bs/2 - 14;
      bg.vy = 0;
      bg.onGround = true;
    }
  }

  // ── Pipe-Kollision ───────────────────────────────────
  for (const pipe of PIPES) {
    const px = pipe.x, pw = 16, py = GROUND_Y - pipe.h, ph = pipe.h;
    if (bg.px + 6 > px && bg.px - 6 < px + pw) {
      // Von oben drauf
      if (bg.py + 14 >= py && bg.py + 14 <= py + 6 && bg.vy >= 0) {
        bg.py = py - 14;
        bg.vy = 0;
        bg.onGround = true;
      }
      // Seitlich blockieren
      else if (bg.py + 10 > py && bg.py < py + ph) {
        if (bg.vx > 0 && bg.px - 6 < px) bg.px = px - 6;
        if (bg.vx < 0 && bg.px + 6 > px + pw) bg.px = px + pw + 6;
      }
    }
  }

  // In Klippe gefallen
  if (bg.py > H + 20) { _fail(bg); return; }

  // ── Kamera ───────────────────────────────────────────
  bg.cameraX = Math.max(0, bg.px - 70);

  // ── Items einsammeln ─────────────────────────────────
  for (const item of bg.items) {
    if (item.collected) continue;
    if (Math.abs(bg.px - item.x) < 10 && Math.abs(bg.py - item.y) < 14) {
      item.collected = true;
      bg.collected++;
      bg.bonusPoints += 100;
      bg.coinPopups.push({ x: item.x, y: item.y - 8, timer: 500 });
      playBonusCoin();
    }
  }

  // ── Geister ──────────────────────────────────────────
  for (const g of bg.ghosts) {
    if (!g.alive) {
      g.squishTimer += dt;
      continue;
    }
    g.x += g.vx * dt;

    const dx = bg.px - g.x, dy = bg.py - g.y;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 14) {
      if (bg.vy > 0 && bg.py < g.y - 4) {
        g.alive = false;
        g.squishTimer = 0;
        bg.vy = JUMP_VEL * 0.6;
        bg.ghostKills++;
        bg.bonusPoints += 200;
        bg.coinPopups.push({ x: g.x, y: g.y - 10, timer: 600 });
        playBonusStomp();
      } else {
        _fail(bg);
        return;
      }
    }
  }

  // ── Pusteblume (Piranha-Pflanze-artig) ─────────────
  const d = bg.dandelion;
  d.spawnTimer += dt;
  if (d.spawnTimer > 2000) {
    d.spawnTimer = 0;
    d.spores.push({ x: d.x, y: d.y - 6, vx: -0.06, vy: -0.12 });
  }
  for (const s of d.spores) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += GRAVITY * 0.6 * dt;
    if (Math.abs(bg.px - s.x) < 8 && Math.abs(bg.py - s.y) < 10) {
      _fail(bg);
      return;
    }
  }
  d.spores = d.spores.filter(s => s.y < H + 10);

  // ── Fahne erreicht ───────────────────────────────────
  if (bg.px >= FLAG_X) {
    bg.result = 'win';
    bg.resultTimer = 0;
    const allCollected = bg.collected === bg.items.length;
    bg.bonusPoints *= allCollected ? 3 : 2;
    playBonusWin();
  }
}

function _fail(bg) {
  bg.result = 'fail';
  bg.resultTimer = 0;
  bg.bonusPoints = 0;
  playBonusDeath();
}

// ── Render ───────────────────────────────────────────────────────
export function drawBonusGame(ctx, bg) {
  // ── Intro-Overlay ─────────────────────────────────
  if (bg.intro) {
    _drawIntro(ctx, bg);
    return;
  }

  const cx = bg.cameraX;

  // ── Himmel (Gradient wie SMB) ──────────────────────
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#5c94fc');
  sky.addColorStop(1, '#88b4fc');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Unter dem Boden: Erde
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // ── Wolken (Parallax 0.3) ─────────────────────────
  for (const cl of CLOUDS) {
    const sx = cl.x - cx * 0.3;
    if (sx > -40 && sx < W + 40) {
      _drawCloud(ctx, sx, cl.y, cl.w, cl.h);
    }
  }

  // ── Hügel (Parallax 0.5) ──────────────────────────
  for (const h of HILLS) {
    const sx = h.x - cx * 0.5;
    if (sx > -50 && sx < W + 50) {
      _drawHill(ctx, sx, h.r);
    }
  }

  // ── Büsche (Parallax 0.8) ─────────────────────────
  for (const b of BUSHES) {
    const sx = b.x - cx * 0.8;
    if (sx > -30 && sx < W + 30) {
      _drawBush(ctx, sx, b.w);
    }
  }

  // Timer
  ctx.textAlign = 'center';
  ctx.font = 'bold 6px Orbitron, sans-serif';
  const remaining = Math.max(0, Math.ceil((TIME_LIMIT - bg.timer) / 1000));
  ctx.fillStyle = remaining <= 5 ? '#ff4444' : '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 2;
  ctx.fillText('TIME: ' + remaining, W / 2, 10);

  ctx.fillStyle = '#ffdd44';
  ctx.fillText('BONUS: ' + bg.bonusPoints, W / 2, 20);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  ctx.save();
  ctx.translate(-cx, 0);

  // ── Boden-Blöcke (Brick-Pattern) ──────────────────
  for (const p of bg.platforms) {
    _drawBrickPlatform(ctx, p.x, p.y, p.w, p.h, p.moving);
  }

  // ── Pipes (grüne Röhren) ──────────────────────────
  for (const pipe of PIPES) {
    _drawPipe(ctx, pipe.x, GROUND_Y - pipe.h, 16, pipe.h);
  }

  // ── Question-Blöcke ───────────────────────────────
  for (const q of bg.qBlocks) {
    _drawQBlock(ctx, q.x, q.y, q.hit, bg.timer);
  }

  // ── Items ─────────────────────────────────────────
  const itemType = ITEM_TYPES[bg.character] || 'cherry';
  for (const item of bg.items) {
    if (item.collected) continue;
    _drawItem(ctx, item.x, item.y, itemType, bg.timer);
  }

  // ── Pusteblume (Piranha-Pflanze) ──────────────────
  _drawPiranhaPlant(ctx, bg.dandelion, bg.timer);
  for (const s of bg.dandelion.spores) {
    // Feuerball statt Spore
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Geister (Goomba-artig) ────────────────────────
  for (const g of bg.ghosts) {
    if (!g.alive) {
      if (g.squishTimer < 500) {
        ctx.fillStyle = '#8b4513';
        ctx.globalAlpha = 1 - g.squishTimer / 500;
        ctx.fillRect(g.x - 7, g.y + 6, 14, 3);
        ctx.globalAlpha = 1;
      }
      continue;
    }
    _drawGoomba(ctx, g.x, g.y, bg.timer);
  }

  // ── Fahne ─────────────────────────────────────────
  _drawFlag(ctx, FLAG_X, GROUND_Y);

  // ── Spieler ───────────────────────────────────────
  _drawPlayer(ctx, bg);

  // ── Coin-Popups ───────────────────────────────────
  for (const p of bg.coinPopups) {
    const a = Math.min(1, p.timer / 200);
    ctx.fillStyle = `rgba(255,215,0,${a.toFixed(2)})`;
    ctx.font = 'bold 5px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+', p.x, p.y);
    ctx.textAlign = 'left';
  }

  ctx.restore();

  // ── Result-Overlay ────────────────────────────────
  if (bg.result) {
    const a = Math.min(1, bg.resultTimer / 400);
    ctx.fillStyle = `rgba(0,0,0,${(a * 0.6).toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    if (bg.result === 'win') {
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillStyle = `rgba(255,215,0,${a.toFixed(2)})`;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.fillText('BONUS!', W / 2, 120);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 8px Orbitron, sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
      ctx.fillText('+' + bg.bonusPoints + ' PTS', W / 2, 145);
    } else {
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillStyle = `rgba(255,60,60,${a.toFixed(2)})`;
      ctx.fillText('TOO BAD!', W / 2, 130);
      ctx.font = '6px Orbitron, sans-serif';
      ctx.fillStyle = `rgba(150,150,200,${a.toFixed(2)})`;
      ctx.fillText('KEIN BONUS', W / 2, 150);
    }
    ctx.textAlign = 'left';
  }
}

// ── Mario-Style Zeichenhelfer ────────────────────────────────────

function _drawBrickPlatform(ctx, x, y, w, h, isMoving) {
  const bw = 8, bh = 6; // Brick-Größe
  const baseColor = isMoving ? '#d89048' : '#c84c0c';
  const lightColor = isMoving ? '#f8b878' : '#e09040';
  const darkColor = isMoving ? '#a06020' : '#883400';

  for (let row = 0; row < Math.ceil(h / bh); row++) {
    const offset = (row % 2) * (bw / 2);
    for (let bx = 0; bx < w; bx += bw) {
      const dx = x + bx + offset;
      const dy = y + row * bh;
      if (dx >= x + w) continue;
      const dw = Math.min(bw, x + w - dx);
      const dh = Math.min(bh, y + h - dy);

      // Brick body
      ctx.fillStyle = baseColor;
      ctx.fillRect(dx, dy, dw, dh);
      // Highlight (top + left)
      ctx.fillStyle = lightColor;
      ctx.fillRect(dx, dy, dw, 1);
      ctx.fillRect(dx, dy, 1, dh);
      // Shadow (bottom + right)
      ctx.fillStyle = darkColor;
      ctx.fillRect(dx, dy + dh - 1, dw, 1);
      ctx.fillRect(dx + dw - 1, dy, 1, dh);
    }
  }
}

function _drawQBlock(ctx, x, y, hit, t) {
  const s = 10; // Blockgröße
  const bx = x - s / 2, by = y - s / 2;

  if (hit) {
    // Leerer Block (dunkel)
    ctx.fillStyle = '#886644';
    ctx.fillRect(bx, by, s, s);
    ctx.fillStyle = '#664422';
    ctx.fillRect(bx, by + s - 1, s, 1);
    ctx.fillRect(bx + s - 1, by, 1, s);
    ctx.fillStyle = '#aa8866';
    ctx.fillRect(bx, by, s, 1);
    ctx.fillRect(bx, by, 1, s);
  } else {
    // Gelber ?-Block
    ctx.fillStyle = '#ffa000';
    ctx.fillRect(bx, by, s, s);
    // Highlights
    ctx.fillStyle = '#ffcc44';
    ctx.fillRect(bx, by, s, 1);
    ctx.fillRect(bx, by, 1, s);
    // Shadow
    ctx.fillStyle = '#885500';
    ctx.fillRect(bx, by + s - 1, s, 1);
    ctx.fillRect(bx + s - 1, by, 1, s);
    // "?" Zeichen (pulsierend)
    const pulse = 0.7 + Math.sin(t / 300) * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${pulse.toFixed(2)})`;
    ctx.font = 'bold 7px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', x, y + 3);
    ctx.textAlign = 'left';
  }
}

function _drawPipe(ctx, x, y, w, h) {
  // Rohr-Körper
  ctx.fillStyle = '#00a800';
  ctx.fillRect(x + 1, y + 6, w - 2, h - 6);
  // Highlight
  ctx.fillStyle = '#48d848';
  ctx.fillRect(x + 2, y + 6, 3, h - 6);
  // Shadow
  ctx.fillStyle = '#005800';
  ctx.fillRect(x + w - 4, y + 6, 2, h - 6);
  // Rohr-Rand oben (breiter)
  ctx.fillStyle = '#00a800';
  ctx.fillRect(x - 1, y, w + 2, 7);
  ctx.fillStyle = '#48d848';
  ctx.fillRect(x, y, 3, 7);
  ctx.fillStyle = '#005800';
  ctx.fillRect(x + w - 2, y, 2, 7);
  // Oberer Rand Highlight
  ctx.fillStyle = '#48d848';
  ctx.fillRect(x - 1, y, w + 2, 1);
}

function _drawCloud(ctx, x, y, w, h) {
  ctx.fillStyle = '#ffffff';
  const r = h * 0.6;
  ctx.beginPath();
  ctx.ellipse(x, y + h * 0.3, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - w * 0.25, y + h * 0.5, w * 0.3, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.25, y + h * 0.5, w * 0.35, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function _drawHill(ctx, x, r) {
  ctx.fillStyle = '#48a848';
  ctx.beginPath();
  ctx.arc(x, GROUND_Y, r, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#68c868';
  ctx.beginPath();
  ctx.arc(x, GROUND_Y, r * 0.7, Math.PI + 0.3, -0.3);
  ctx.closePath();
  ctx.fill();
}

function _drawBush(ctx, x, w) {
  ctx.fillStyle = '#48a848';
  const h = w * 0.5;
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y - 1, w * 0.5, h, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#68c868';
  ctx.beginPath();
  ctx.ellipse(x, GROUND_Y - 1, w * 0.35, h * 0.7, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
}

function _drawPlayer(ctx, bg) {
  if (bg.character === 'custom' && bg.skinData) {
    const mouth = Math.max(4, Math.abs(Math.sin(bg.timer / 80)) * 38);
    drawCustomSkin(ctx, bg.px, bg.py, 10, mouth, bg.skinData);
  } else {
    drawCharPreview(ctx, bg.character || 'pacman', bg.px, bg.py, 10);
  }
}

function _drawGoomba(ctx, x, y, t) {
  // Körper (braun, pilzförmig)
  ctx.fillStyle = '#8b4513';
  ctx.beginPath();
  ctx.arc(x, y - 3, 7, Math.PI, 0);
  ctx.lineTo(x + 5, y + 5);
  ctx.lineTo(x - 5, y + 5);
  ctx.closePath();
  ctx.fill();
  // Unterseite heller
  ctx.fillStyle = '#d2a060';
  ctx.fillRect(x - 5, y + 1, 10, 4);
  // Füße (laufen)
  const step = Math.sin(t / 120) * 1.5;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 5 + step, y + 4, 4, 3);
  ctx.fillRect(x + 1 - step, y + 4, 4, 3);
  // Augen (böse, zusammengekniffen)
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 4, y - 4, 2.5, 2);
  ctx.fillRect(x + 1.5, y - 4, 2.5, 2);
  // Augenbrauen (böse)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 6);
  ctx.lineTo(x - 1, y - 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 5, y - 6);
  ctx.lineTo(x + 1, y - 5);
  ctx.stroke();
}

function _drawItem(ctx, x, y, type, t) {
  const bob = Math.sin(t / 300 + x) * 2;
  const iy = y + bob;

  if (type === 'cherry') {
    ctx.fillStyle = '#ff2244';
    ctx.beginPath(); ctx.arc(x - 2, iy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 2, iy + 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#228800';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 1, iy - 3); ctx.lineTo(x + 1, iy - 7); ctx.stroke();
  } else if (type === 'fish') {
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.ellipse(x, iy, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 4, iy); ctx.lineTo(x + 7, iy - 3); ctx.lineTo(x + 7, iy + 3);
    ctx.closePath(); ctx.fill();
  } else if (type === 'bone') {
    ctx.fillStyle = '#eeddcc';
    ctx.fillRect(x - 4, iy - 1, 8, 2);
    ctx.beginPath(); ctx.arc(x - 4, iy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4, iy, 2, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'ring') {
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, iy, 4, 0, Math.PI * 2); ctx.stroke();
  } else if (type === 'pokeball') {
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(x, iy, 4, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, iy, 4, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 4, iy - 0.5, 8, 1);
    ctx.beginPath(); ctx.arc(x, iy, 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

function _drawPiranhaPlant(ctx, d, t) {
  // Stiel (grün)
  ctx.fillStyle = '#00a800';
  ctx.fillRect(d.x - 2, d.y, 4, 18);
  // Kopf (rot, auf/zu animiert)
  const open = Math.sin(t / 400) * 0.3;
  ctx.fillStyle = '#cc2200';
  ctx.beginPath();
  ctx.arc(d.x, d.y - 2, 6, Math.PI + open, -open);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff4422';
  ctx.beginPath();
  ctx.arc(d.x, d.y - 2, 6, Math.PI - open, open, true);
  ctx.closePath();
  ctx.fill();
  // Punkte auf dem Kopf
  ctx.fillStyle = '#ffcc88';
  ctx.beginPath(); ctx.arc(d.x - 2, d.y - 5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(d.x + 2, d.y - 5, 1.2, 0, Math.PI * 2); ctx.fill();
}

function _drawFlag(ctx, x, y) {
  // Stange
  ctx.fillStyle = '#888888';
  ctx.fillRect(x - 1, y - 50, 2, 50);
  // Kugel oben
  ctx.fillStyle = '#44aa44';
  ctx.beginPath(); ctx.arc(x, y - 50, 3, 0, Math.PI * 2); ctx.fill();
  // Flagge (grün, dreieckig wie Mario)
  ctx.fillStyle = '#00a800';
  ctx.beginPath();
  ctx.moveTo(x, y - 48);
  ctx.lineTo(x - 14, y - 42);
  ctx.lineTo(x, y - 36);
  ctx.closePath();
  ctx.fill();
  // Stern auf Flagge
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 5px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2605', x - 5, y - 40);
  ctx.textAlign = 'left';
}

function _drawIntro(ctx, bg) {
  const F = 'Orbitron, sans-serif';
  const elapsed = 2500 - bg.introTimer; // ms seit Intro-Start

  // Himmel-Hintergrund (wie Bonus-Game)
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#5c94fc');
  sky.addColorStop(1, '#88b4fc');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // Fade-from-Black: erste 500ms voll schwarz → dann auf 0.55 aufblenden (500ms)
  const FADE_BLACK = 500;  // ms volles Schwarz
  const FADE_TRANS = 500;  // ms Überblendung
  let overlayAlpha;
  if (elapsed < FADE_BLACK) {
    overlayAlpha = 1;
  } else if (elapsed < FADE_BLACK + FADE_TRANS) {
    overlayAlpha = 1 - (elapsed - FADE_BLACK) / FADE_TRANS * 0.45; // 1.0 → 0.55
  } else {
    overlayAlpha = 0.55;
  }
  ctx.fillStyle = `rgba(0,0,0,${overlayAlpha.toFixed(2)})`;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // Text-Fade-in (erst nach Fade-from-Black sichtbar)
  const a = Math.min(1, Math.max(0, (elapsed - FADE_BLACK) / 400));

  // "BONUS STAGE!"
  ctx.font = `bold 16px ${F}`;
  ctx.fillStyle = `rgba(255,215,0,${a.toFixed(2)})`;
  ctx.shadowColor = `rgba(255,180,0,${a.toFixed(2)})`;
  ctx.shadowBlur = 8;
  ctx.fillText('BONUS STAGE!', W / 2, 100);
  ctx.shadowBlur = 0;

  // Ziel
  ctx.font = `6px ${F}`;
  ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
  ctx.fillText('ERREICHE DIE FAHNE!', W / 2, 130);

  // Steuerung
  ctx.font = `5px ${F}`;
  ctx.fillStyle = `rgba(150,200,255,${(a * 0.9).toFixed(2)})`;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) {
    ctx.fillText('D-PAD = LAUFEN', W / 2, 160);
    ctx.fillText('SWIPE HOCH = SPRINGEN', W / 2, 172);
  } else {
    ctx.fillText('PFEILTASTEN = LAUFEN', W / 2, 160);
    ctx.fillText('LEERTASTE / HOCH = SPRINGEN', W / 2, 172);
  }

  // Items + Bonus Hinweis
  ctx.fillStyle = `rgba(255,220,100,${(a * 0.7).toFixed(2)})`;
  ctx.font = `4px ${F}`;
  ctx.fillText('ITEMS SAMMELN = BONUS', W / 2, 195);

  // Countdown-Punkte (visuell)
  const dots = Math.ceil(bg.introTimer / 800);
  ctx.font = `bold 8px ${F}`;
  ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
  ctx.fillText('.'.repeat(Math.min(dots, 3)), W / 2, 230);

  ctx.textAlign = 'left';
}
