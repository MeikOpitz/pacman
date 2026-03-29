// Pac-Man – main.js

import { drawMaze, invalidateMazeCache } from './renderer.js';
import { createPacman, updatePacman, drawPacman } from './pacman.js';
import { setupInput, setTouchBlocked } from './input.js';
import { createBlinky, updateBlinky, drawBlinky } from './ghosts/blinky.js';
import { createPinky, updatePinky, drawPinky } from './ghosts/pinky.js';
import { createInky, createInkyUpdater, drawInky } from './ghosts/inky.js';
import { createClyde, createClydeUpdater, drawClyde } from './ghosts/clyde.js';
import { MODE, frightenGhost } from './ghost.js';
import { getSchedule, SCORE, TIMER, PAC as PAC_CFG, setDifficulty, getDifficulty, getStartLives } from './config.js';
import { createScore, addScore, loseLife, nextLevel, drawHUD } from './score.js';
import { resetGrid, pelletsRemaining, TILE } from './maze.js';
import { playWaka, startSiren, stopSiren, startFrightened, stopFrightened, playEatGhost, playDeath, playIntro, setVolume, toggleMute, stopBonusMelody, suspendAudio, resumeAudio, playFruitSpawn, getVolume, isMuted } from './audio.js';
import { createAttract, updateAttract, drawAttract } from './attract.js';
import { createCharSelect, updateCharSelect, drawCharSelect, refreshCustomSkins, getSelectedChar, isCreateSlot, getSelectedCustomId } from './charselect.js';
import { createFruit, resetFruit, trySpawnFruit, updateFruit, checkFruitCollision, drawFruit } from './fruit.js';
import { createSkinEdit, updateSkinEdit, drawSkinEdit, resetSkinEdit, loadIntoSkinEdit, touchSkinEdit } from './skinedit.js';
import { deleteCustomSkin } from './skinstorage.js';
import { createIntermission, startIntermission, updateIntermission, drawIntermission } from './intermission.js';
import { isNewHiScore, saveHiScore, loadHiScores, getTopScore } from './hiscore.js';
import { createBonusGame, startBonusGame, updateBonusGame, drawBonusGame, bonusGameInput } from './bonusgame.js';

const canvas = document.getElementById('screen');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;

const SCALE = 4;

const pac   = createPacman();
setupInput(pac);
const blinky = createBlinky();
const pinky  = createPinky();
const inky   = createInky();
const clyde  = createClyde();
const updateInky  = createInkyUpdater(blinky);
const updateClyde = createClydeUpdater(clyde);

const GHOSTS = [
  { ghost: blinky, update: updateBlinky, draw: drawBlinky },
  { ghost: pinky,  update: updatePinky,  draw: drawPinky  },
  { ghost: inky,   update: updateInky,   draw: drawInky   },
  { ghost: clyde,  update: updateClyde,  draw: drawClyde  },
];

const gameScore     = createScore();
const attract       = createAttract();
const charSelect    = createCharSelect();
const skinEdit      = createSkinEdit();
const fruit         = createFruit();
const intermission  = createIntermission();
const bonusGame     = createBonusGame();

let deathTimer   = 0;
let ghostEatCombo = 0;
const scorePopups = []; // { x, y, points, timer }
let levelTimer   = 0;
let flashOn      = false;
let gameOver      = false;
let gameOverTimer = 0;
let goBlinkTimer  = 0;
let goBlinkOn     = true;
let hiEntry       = { active: false, name: '' };
let paused        = false;
let readyTimer    = 0;
let tipIndex      = 0;

const TIPS = [
  'FRISS ALLE PUNKTE!',
  'GROSSE PUNKTE → GEISTER ESSBAR!',
  'GEISTER IN FOLGE = MEGA BONUS!',
  'FRÜCHTE BRINGEN EXTRAPUNKTE!',
  'TUNNEL VERLANGSAMT GEISTER!',
];

let shakeTimer  = 0;
let nearMissCooldown = 0;

let scSchedule = getSchedule(1);
let scPhase = 0;
let scTimer = scSchedule[0];

// --- Debug: ?test=bonus → Bonusspiel direkt starten ---
const _dbgParams = new URLSearchParams(window.location.search);
if (_dbgParams.get('test') === 'bonus') {
  console.log('DEBUG: Bonus-Test-Modus aktiv!');
  attract.active = false;
  charSelect.active = false;
  startBonusGame(bonusGame, 'pacman', null, 0);
}

// --- Pause ---
function canPause() {
  return !attract.active && !charSelect.active && !skinEdit.active
      && !gameOver && !intermission.active && !bonusGame.active
      && deathTimer <= 0 && levelTimer <= 0 && readyTimer <= 0;
}

function togglePause() {
  if (paused) {
    paused = false;
    accumulator = 0;
    resumeAudio();
  } else if (canPause()) {
    paused = true;
    suspendAudio();
  }
}

// --- Input ---
window.addEventListener('keyup', (e) => {
  bonusGameInput(bonusGame, e, false);
});

window.addEventListener('keydown', (e) => {
  if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && (canPause() || paused)) {
    togglePause();
    return;
  }
  if (paused) return;
  if (bonusGame.active) { bonusGameInput(bonusGame, e, true); return; }
  if (attract.active) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      setDifficulty(getDifficulty() === 'normal' ? 'easy' : 'normal');
      return;
    }
    if (e.key === 'Enter') {
      attract.active = false;
      charSelect.active = true;
      refreshCustomSkins();
      return;
    }
    return;
  }
  if (skinEdit.active) {
    if (e.key === 'Escape') {
      skinEdit.active   = false;
      charSelect.active = true;
    } else {
      updateSkinEdit(skinEdit, e);
    }
    return;
  }
  if (charSelect.active) {
    if (e.key === 'Escape') {
      charSelect.active = false;
      attract.active    = true;
      return;
    }
    const customId = getSelectedCustomId(charSelect);
    if ((e.key === 'Delete' || e.key === 'Backspace') && customId) {
      deleteCustomSkin(customId);
      refreshCustomSkins();
      charSelect.index = Math.max(0, charSelect.index - 1);
      return;
    }
    if ((e.key === 'e' || e.key === 'E') && customId) {
      const skin = getSelectedChar(charSelect);
      charSelect.active = false;
      loadIntoSkinEdit(skinEdit, skin);
      skinEdit.active = true;
      skinEdit.onSave = () => {
        skinEdit.active   = false;
        charSelect.active = true;
        refreshCustomSkins();
      };
      return;
    }
    updateCharSelect(charSelect, e);
    if (e.key === 'Enter') {
      if (isCreateSlot(charSelect)) {
        charSelect.active = false;
        resetSkinEdit(skinEdit);
        skinEdit.active = true;
        skinEdit.onSave = () => {
          skinEdit.active   = false;
          charSelect.active = true;
          refreshCustomSkins();
        };
      } else {
        charSelect.active = false;
        const chosen = getSelectedChar(charSelect);
        if (typeof chosen === 'object') {
          pac.character = 'custom';
          pac.skinData  = chosen;
        } else {
          pac.character = chosen;
          pac.skinData  = null;
        }
        readyTimer = 2500;
        tipIndex = Math.floor(Math.random() * TIPS.length);
        playIntro();
        setTimeout(() => startSiren(1), TIMER.INTRO_MUSIC);
      }
    }
    return;
  }
  if (hiEntry.active && gameOver) {
    if (gameOverTimer < TIMER.HI_ENTRY_ACCEPT) return;
    if (e.key === 'Backspace') { hiEntry.name = hiEntry.name.slice(0, -1); return; }
    if (e.key === 'Enter' && hiEntry.name.trim()) {
      saveHiScore(hiEntry.name, gameScore.score, gameScore.level);
      gameScore.hiScore = Math.max(gameScore.hiScore, gameScore.score);
      hiEntry.active = false;
      return;
    }
    const k = e.key.toUpperCase();
    if (/^[A-Z0-9]$/.test(k) && hiEntry.name.length < 10) hiEntry.name += k;
    return;
  }

  if (gameOver && gameOverTimer > TIMER.GAME_OVER_ACCEPT && !hiEntry.active) {
    if (e.key === 'Escape') {
      // Back to menu
      gameOver = false; gameOverTimer = 0;
      hiEntry = { active: false, name: '' };
      gameScore.score = 0; gameScore.lives = getStartLives();
      gameScore.level = 1; gameScore.extraLife = false;
      scSchedule = getSchedule(1); scPhase = 0; scTimer = scSchedule[0];
      resetGrid(1); invalidateMazeCache(); resetPositions(); resetFruit(fruit);
      attract.active = true;
      return;
    }
    if (e.key === 'Enter') {
      // Quick restart with same character
      gameOver = false; gameOverTimer = 0;
      hiEntry = { active: false, name: '' };
      gameScore.score = 0; gameScore.lives = getStartLives();
      gameScore.level = 1; gameScore.extraLife = false;
      scSchedule = getSchedule(1); scPhase = 0; scTimer = scSchedule[0];
      resetGrid(1); invalidateMazeCache(); resetPositions(); resetFruit(fruit);
      readyTimer = 2500;
      tipIndex = Math.floor(Math.random() * TIPS.length);
      playIntro();
      setTimeout(() => startSiren(1), TIMER.INTRO_MUSIC);
      return;
    }
  }
});

// --- Helpers ---
function setGhostMode(mode) {
  for (const { ghost } of GHOSTS) {
    if (ghost.mode === MODE.FRIGHTENED || ghost.mode === MODE.EATEN || ghost.mode === MODE.HOUSE) continue;
    ghost.mode = mode;
  }
}

function updateScatterChase(dt) {
  if (scPhase >= scSchedule.length) return;
  scTimer -= dt;
  if (scTimer <= 0) {
    scPhase++;
    scTimer = scSchedule[scPhase] ?? Infinity;
    setGhostMode(scPhase % 2 === 0 ? MODE.SCATTER : MODE.CHASE);
  }
}

function checkGhostCollision() {
  const pcol = Math.floor(pac.x / TILE);
  const prow = Math.floor(pac.y / TILE);
  for (const { ghost } of GHOSTS) {
    if (ghost.mode === MODE.HOUSE) continue;
    if (Math.floor(ghost.x / TILE) === pcol && Math.floor(ghost.y / TILE) === prow) return ghost;
  }
  return null;
}

function resetPositions() {
  pac.x = 13.5 * 8; pac.y = 23.5 * 8; pac.dir = 0; pac.nextDir = 0;
  // Timer werden mit Level kürzer (mind. 50 % der Basiszeit)
  const t = Math.max(0.5, 1 - (gameScore.level - 1) * 0.08);
  Object.assign(blinky, { x: 13*8+4, y: 12*8+4, targetX: 13*8+4, targetY: 12*8+4, mode: 4 });
  Object.assign(pinky,  { x: 13*8+4, y: 14*8+4, targetX: 13*8+4, targetY: 14*8+4, mode: 4, releaseTimer:  3000 * t });
  Object.assign(inky,   { x: 11*8+4, y: 14*8+4, targetX: 11*8+4, targetY: 14*8+4, mode: 4, releaseTimer:  6000 * t });
  Object.assign(clyde,  { x: 15*8+4, y: 14*8+4, targetX: 15*8+4, targetY: 14*8+4, mode: 4, releaseTimer: 10000 * t });
}

// --- Game Loop ---
const FRAME_MS = 1000 / 60;
let lastTime   = 0;
let accumulator = 0;

function update(dt) {
  if (paused) return;
  if (attract.active) { updateAttract(attract, dt); return; }
  if (charSelect.active) return;
  if (skinEdit.active) return;

  if (levelTimer > 0) {
    levelTimer -= dt;
    flashOn = Math.floor(levelTimer / 200) % 2 === 0;
    if (levelTimer <= 0) {
      flashOn = false;
      // Nach Level 2: Bonus-Spiel, sonst normale Intermission
      console.log('Level complete! gameScore.level =', gameScore.level);
      if (gameScore.level === 2) {
        console.log('Starting bonus game!');
        startBonusGame(bonusGame, pac.character, pac.skinData, gameScore.score);
      } else {
        startIntermission(intermission, gameScore.level, pac.character, pac.skinData);
      }
    }
    return;
  }

  if (bonusGame.active) {
    updateBonusGame(bonusGame, dt);
    if (!bonusGame.active) {
      stopBonusMelody();
      addScore(gameScore, bonusGame.bonusPoints);
      nextLevel(gameScore);
      resetGrid(gameScore.level);
      invalidateMazeCache();
      resetPositions();
      resetFruit(fruit);
      scSchedule = getSchedule(gameScore.level);
      scPhase = 0;
      scTimer = scSchedule[0];
      readyTimer = 1500;
      startSiren(gameScore.level);
    }
    return;
  }

  if (intermission.active) {
    updateIntermission(intermission, dt);
    if (!intermission.active) {
      nextLevel(gameScore);
      resetGrid(gameScore.level);
      invalidateMazeCache();
      resetPositions();
      resetFruit(fruit);
      scSchedule = getSchedule(gameScore.level);
      scPhase = 0;
      scTimer = scSchedule[0];
      readyTimer = 1500;
      startSiren(gameScore.level);
    }
    return;
  }

  if (gameOver) {
    gameOverTimer += dt;
    goBlinkTimer  += dt;
    if (goBlinkTimer >= TIMER.GO_BLINK) { goBlinkTimer = 0; goBlinkOn = !goBlinkOn; }
    return;
  }

  if (deathTimer > 0) {
    deathTimer -= dt;
    pac.deathAnim = Math.max(0, Math.min(1, 1 - deathTimer / TIMER.DEATH_ANIM));
    if (deathTimer <= 0) {
      pac.deathAnim = 0;
      if (gameScore.lives <= 0) {
        gameOver = true; gameOverTimer = 0; stopSiren();
        if (isNewHiScore(gameScore.score)) hiEntry = { active: true, name: '' };
      }
      else { resetPositions(); readyTimer = 1500; }
    }
    return;
  }

  if (readyTimer > 0) {
    readyTimer -= dt;
    return;
  }

  updatePacman(pac, dt, gameScore.level);
  if (pac.scored) { addScore(gameScore, pac.scored); playWaka(); }

  const wasFruitActive = fruit.active;
  trySpawnFruit(fruit, pelletsRemaining(), gameScore.level);
  if (!wasFruitActive && fruit.active) playFruitSpawn();
  updateFruit(fruit, dt);
  const fruitScore = checkFruitCollision(fruit, pac);
  if (fruitScore) addScore(gameScore, fruitScore);

  if (pac.atePower) {
    ghostEatCombo = 0;
    for (const { ghost } of GHOSTS) frightenGhost(ghost, gameScore.level);
    startFrightened();
  }

  if (!GHOSTS.some(({ ghost }) => ghost.mode === MODE.FRIGHTENED)) stopFrightened();

  updateScatterChase(dt);
  for (const { ghost, update } of GHOSTS) update(ghost, dt, pac, gameScore.level);

  if (pelletsRemaining() === 0) {
    stopSiren(); stopFrightened();
    levelTimer = TIMER.LEVEL_COMPLETE;
    return;
  }

  // Near-miss detection (1.5 tiles Abstand, nur Chase/Scatter)
  if (nearMissCooldown > 0) nearMissCooldown -= dt;
  else {
    for (const { ghost } of GHOSTS) {
      if (ghost.mode === MODE.HOUSE || ghost.mode === MODE.FRIGHTENED || ghost.mode === MODE.EATEN) continue;
      const dx = ghost.x - pac.x, dy = ghost.y - pac.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < (TILE * 2) * (TILE * 2) && d2 > TILE * TILE) {
        shakeTimer = 180;
        nearMissCooldown = 1500;
        break;
      }
    }
  }
  if (shakeTimer > 0) shakeTimer -= dt;

  // Score-Popups aktualisieren
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    scorePopups[i].timer -= dt;
    if (scorePopups[i].timer <= 0) scorePopups.splice(i, 1);
  }

  const hit = checkGhostCollision();
  if (hit) {
    if (hit.mode === MODE.FRIGHTENED) {
      ghostEatCombo++;
      const pts = SCORE.GHOST_BASE * (2 ** (ghostEatCombo - 1));
      addScore(gameScore, pts);
      scorePopups.push({ x: hit.x, y: hit.y, points: pts, timer: TIMER.SCORE_POPUP });
      playEatGhost();
      hit.mode = MODE.EATEN;
    } else if (hit.mode !== MODE.EATEN) {
      loseLife(gameScore);
      ghostEatCombo = 0;
      deathTimer = 1500;
      pac.deathAnim = 0;
      playDeath();
    }
  }
}

function render() {
  ctx.fillStyle = '#0d0d1f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(SCALE, SCALE);

  // Screen shake
  if (shakeTimer > 0) {
    const intensity = Math.min(1, shakeTimer / 100) * 1.5;
    ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
  }

  if (attract.active)        { drawAttract(ctx, attract);             ctx.restore(); return; }
  if (charSelect.active)     { drawCharSelect(ctx, charSelect);       ctx.restore(); return; }
  if (skinEdit.active)       { drawSkinEdit(ctx, skinEdit);           ctx.restore(); return; }
  if (intermission.active)   { drawIntermission(ctx, intermission);   ctx.restore(); return; }
  if (bonusGame.active)      { drawBonusGame(ctx, bonusGame);         ctx.restore(); return; }

  drawMaze(ctx);
  drawFruit(ctx, fruit, pac.character);

  if (levelTimer > 0 && flashOn) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(0, 0, 224, 288);
  }

  if (deathTimer <= 0) {
    for (const { ghost, draw } of GHOSTS) draw(ctx, ghost);
  }

  drawPacman(ctx, pac);

  // Score-Popups
  ctx.textAlign = 'center';
  ctx.font = 'bold 7px Orbitron, sans-serif';
  ctx.lineJoin = 'round';
  for (const p of scorePopups) {
    const alpha = Math.min(1, p.timer / TIMER.SCORE_POPUP_FADE);
    const rise  = (1 - p.timer / TIMER.SCORE_POPUP) * 10;
    const py    = p.y - rise;
    // Schwarzer Outline für Lesbarkeit auf jedem Hintergrund
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.strokeText(p.points, p.x, py);
    // Cyan-Text mit Glow
    ctx.fillStyle   = `rgba(100,255,255,${alpha})`;
    ctx.shadowColor = 'rgba(0,200,255,0.8)';
    ctx.shadowBlur  = 4;
    ctx.fillText(p.points, p.x, py);
  }
  ctx.shadowBlur = 0;
  ctx.textAlign  = 'left';

  // READY! overlay
  if (readyTimer > 0 && !gameOver && deathTimer <= 0) {
    ctx.textAlign = 'center';

    // "READY!" text
    ctx.fillStyle   = '#FFD700';
    ctx.shadowColor = 'rgba(255,180,0,0.8)';
    ctx.shadowBlur  = 10;
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.fillText('READY!', 112, 142);
    ctx.shadowBlur = 0;

    // Tip (only level 1)
    if (gameScore.level === 1) {
      ctx.fillStyle = 'rgba(150,200,255,0.75)';
      ctx.font = '5px Orbitron, sans-serif';
      ctx.fillText(TIPS[tipIndex], 112, 158);
    }

    ctx.textAlign = 'left';
  }

  if (gameOver) {
    const t = gameOverTimer;

    // Phase 1 (0–600ms): dunkles Overlay blendet ein
    const oa = Math.min(0.82, t / 600 * 0.82);
    ctx.fillStyle = `rgba(0,0,0,${oa.toFixed(2)})`;
    ctx.fillRect(0, 0, 224, 288);

    ctx.textAlign = 'center';

    // Phase 2 (400–1100ms): "GAME OVER" mit Glüh-Effekt einblenden
    if (t > 400) {
      const ta = Math.min(1, (t - 400) / 700);
      ctx.fillStyle   = `rgba(255,30,60,${ta.toFixed(2)})`;
      ctx.shadowColor = `rgba(255,0,0,${(ta * 0.85).toFixed(2)})`;
      ctx.shadowBlur  = 12;
      ctx.font = 'bold 14px Orbitron, sans-serif';
      ctx.fillText('GAME OVER', 112, 128);
      ctx.shadowBlur = 0;
    }

    // Phase 3 (1200–1800ms): Score einblenden
    if (t > 1200) {
      const sa = Math.min(1, (t - 1200) / 600);
      ctx.fillStyle = `rgba(255,255,255,${sa.toFixed(2)})`;
      ctx.font = '6px Orbitron, sans-serif';
      ctx.fillText(`SCORE: ${gameScore.score}`, 112, 150);
      ctx.fillText(`HI: ${gameScore.hiScore}`,  112, 163);
    }

    // Phase 4 (2000ms+): Hi-Score Eingabe ODER PRESS ENTER
    if (t > 2000) {
      if (hiEntry.active) {
        // ── Name-Eingabe ──────────────────────────────────
        const ea = Math.min(1, (t - 2000) / 350);
        ctx.fillStyle   = `rgba(255,215,0,${ea.toFixed(2)})`;
        ctx.shadowColor = `rgba(255,180,0,${ea.toFixed(2)})`;
        ctx.shadowBlur  = 8;
        ctx.font = 'bold 8px Orbitron, sans-serif';
        ctx.fillText('NEW HI-SCORE!', 112, 155);
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(150,200,255,${ea.toFixed(2)})`;
        ctx.font = '5px Orbitron, sans-serif';
        ctx.fillText('DEIN NAME:', 112, 168);
        const blink = Math.floor(Date.now() / 500) % 2 === 0;
        ctx.fillStyle   = `rgba(255,255,255,${ea.toFixed(2)})`;
        ctx.shadowColor = `rgba(100,200,255,${ea.toFixed(2)})`;
        ctx.shadowBlur  = 5;
        ctx.font = 'bold 10px Orbitron, sans-serif';
        ctx.fillText(hiEntry.name + (blink ? '_' : ' '), 112, 182);
        ctx.shadowBlur  = 0;
        ctx.fillStyle = `rgba(60,90,160,${ea.toFixed(2)})`;
        ctx.font = '4.5px Orbitron, sans-serif';
        ctx.fillText('A–Z  ENTER = OK', 112, 193);
      } else {
        // ── Hi-Score Tabelle ──────────────────────────────
        const ha = Math.min(1, (t - 2000) / 400);
        const scores = loadHiScores();
        if (scores.length > 0) {
          ctx.fillStyle = `rgba(100,140,220,${(ha * 0.5).toFixed(2)})`;
          ctx.font = '4.5px Orbitron, sans-serif';
          ctx.fillText('── TOP SCORES ──', 112, 155);
          scores.forEach((entry, i) => {
            const isMe = entry.score === gameScore.score && i === 0;
            ctx.fillStyle = isMe
              ? `rgba(255,215,0,${ha.toFixed(2)})`
              : `rgba(150,180,255,${(ha * 0.85).toFixed(2)})`;
            ctx.font = isMe ? 'bold 5px Orbitron, sans-serif' : '4.5px Orbitron, sans-serif';
            const pad = String(entry.score).padStart(6, '0');
            ctx.fillText(`${i + 1}. ${entry.name.padEnd(8)}  ${pad}`, 112, 165 + i * 10);
          });
        }
        // Restart / Menu hints
        const btnY = scores.length > 0 ? 220 : 178;
        const pa = Math.min(1, (t - 2000) / 400);
        const isTouchDevice = matchMedia('(pointer: coarse)').matches;
        if (goBlinkOn) {
          ctx.fillStyle = `rgba(255,215,0,${pa.toFixed(2)})`;
          ctx.font = 'bold 5px Orbitron, sans-serif';
          ctx.fillText(isTouchDevice ? 'TAP = NOCHMAL' : 'ENTER = NOCHMAL', 112, btnY);
        }
        if (!isTouchDevice) {
          ctx.fillStyle = `rgba(100,130,180,${(pa * 0.6).toFixed(2)})`;
          ctx.font = '4px Orbitron, sans-serif';
          ctx.fillText('ESC = MENÜ', 112, btnY + 10);
        }
      }
    }

    ctx.textAlign = 'left';
  }

  drawHUD(ctx, gameScore);

  // Pause-Overlay
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, 224, 288);

    ctx.textAlign = 'center';

    // "PAUSED" Text
    ctx.fillStyle   = '#ffdd44';
    ctx.shadowColor = 'rgba(255,180,0,0.8)';
    ctx.shadowBlur  = 12;
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.fillText('PAUSED', 112, 135);
    ctx.shadowBlur = 0;

    // Hint
    ctx.fillStyle = 'rgba(150,180,255,0.8)';
    ctx.font = '5px Orbitron, sans-serif';
    const isTouchDevice = matchMedia('(pointer: coarse)').matches;
    ctx.fillText(isTouchDevice ? 'TAP ❚❚ TO RESUME' : 'ESC / P TO RESUME', 112, 155);

    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function loop(timestamp) {
  const elapsed = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += Math.min(elapsed, 200);
  while (accumulator >= FRAME_MS) { update(FRAME_MS); accumulator -= FRAME_MS; }
  setTouchBlocked(skinEdit.active);
  render();
  requestAnimationFrame(loop);
}

// Touch handler for skin editor (canvas coordinates → game space)
canvas.addEventListener('touchend', (e) => {
  if (!skinEdit.active) return;
  const rect = canvas.getBoundingClientRect();
  const touch = e.changedTouches[0];
  const gx = (touch.clientX - rect.left) / rect.width * 224;
  const gy = (touch.clientY - rect.top) / rect.height * 288;
  const result = touchSkinEdit(skinEdit, gx, gy);
  if (result === 'back') {
    skinEdit.active   = false;
    charSelect.active = true;
  }
}, { passive: false });

// Pause-Button (Touch)
const pauseBtn = document.getElementById('pause-btn');
if (pauseBtn) {
  pauseBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePause();
  }, { passive: false });
  pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause();
  });
}

// Audio-Controls
const muteBtn   = document.getElementById('mute-btn');
const volSlider = document.getElementById('vol-slider');

// Restore saved audio state
volSlider.value         = Math.round(getVolume() * 100);
muteBtn.textContent     = isMuted() ? '🔇' : '🔊';
volSlider.style.opacity = isMuted() ? '0.35' : '1';

muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const nowMuted = toggleMute();
  muteBtn.textContent        = nowMuted ? '🔇' : '🔊';
  volSlider.style.opacity    = nowMuted ? '0.35' : '1';
});

volSlider.addEventListener('input', (e) => {
  e.stopPropagation();
  setVolume(volSlider.value / 100);
});

// Fullscreen
const fsBtn = document.getElementById('fs-btn');
if (fsBtn) {
  fsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      }
    } catch (_) {}
  });
  const updateFsIcon = () => {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    fsBtn.textContent = isFull ? '[x]' : '[ ]';
    fsBtn.title = isFull ? 'Vollbild beenden' : 'Vollbild';
  };
  document.addEventListener('fullscreenchange', updateFsIcon);
  document.addEventListener('webkitfullscreenchange', updateFsIcon);
}

// Erster Klick auf Canvas startet Audio (nicht auf Audio-Controls)
document.getElementById('screen').addEventListener('click', () => {
  playIntro();
  setTimeout(() => startSiren(1), TIMER.INTRO_MUSIC);
}, { once: true });

requestAnimationFrame((t) => { lastTime = t; requestAnimationFrame(loop); });
