// config.js – Zentrale Gameplay-Konstanten
// Nur Gameplay-relevante Werte, kein Rendering/Level-Design.

// ── Geschwindigkeiten (px/s) pro Level-Bereich ──────────────────
// Basiert auf Original-Arcade-Prozentsätzen (62.5 px/s = 100%)
export const SPEED_TABLE = [
  // Level 1:   Einsteiger-Tempo, lange Frightened-Phase
  { pac: 50, ghost: 47, ghostFright: 25, ghostTunnel: 25, frightDur: 6000 },
  // Level 2–4: Merkbar schneller, kürzeres Frightened
  { pac: 56, ghost: 53, ghostFright: 28, ghostTunnel: 28, frightDur: 4000 },
  // Level 5–16: Hohes Tempo, kurzes Frightened-Fenster
  { pac: 62, ghost: 59, ghostFright: 31, ghostTunnel: 31, frightDur: 2000 },
  // Level 17–20: Power Pellets wirkungslos
  { pac: 62, ghost: 59, ghostFright: 31, ghostTunnel: 31, frightDur: 0 },
  // Level 21+: Pac langsamer, Geister bleiben schnell
  { pac: 56, ghost: 59, ghostFright: 31, ghostTunnel: 31, frightDur: 0 },
];

export function getLevelSpeeds(level) {
  let s;
  if (level <= 1)  s = SPEED_TABLE[0];
  else if (level <= 4)  s = SPEED_TABLE[1];
  else if (level <= 16) s = SPEED_TABLE[2];
  else if (level <= 20) s = SPEED_TABLE[3];
  else s = SPEED_TABLE[4];

  if (_difficulty === 'easy') {
    return {
      pac:          s.pac,
      ghost:        Math.round(s.ghost * 0.75),
      ghostFright:  Math.round(s.ghostFright * 0.70),
      ghostTunnel:  Math.round(s.ghostTunnel * 0.70),
      frightDur:    s.frightDur > 0 ? Math.round(s.frightDur * 1.5) : 0,
    };
  }
  return s;
}

// ── Scatter/Chase Schedules (ms) ─────────────────────────────────
// Format: [scatter, chase, scatter, chase, ...] – letzter Wert Infinity = permanenter Modus
export const SC_SCHEDULES = {
  1: [7000, 20000, 7000, 20000, 5000, 20000, 5000, Infinity],
  2: [7000, 20000, 7000, 20000, 5000, Infinity],
  5: [5000, 20000, 5000, 20000, 5000, Infinity],
};

export function getSchedule(level) {
  if (level >= 5) return SC_SCHEDULES[5];
  if (level >= 2) return SC_SCHEDULES[2];
  return SC_SCHEDULES[1];
}

// ── Scoring ──────────────────────────────────────────────────────
export const SCORE = {
  PELLET:       10,
  POWER_PELLET: 50,
  GHOST_BASE:   200,   // × 2^(combo-1) → 200, 400, 800, 1600
  EXTRA_LIFE:   10000, // Score-Schwelle für Extra-Leben
};

// ── Timer / Durations (ms) ───────────────────────────────────────
export const TIMER = {
  DEATH_ANIM:       1500,
  LEVEL_COMPLETE:   2000,
  SCORE_POPUP:      900,
  SCORE_POPUP_FADE: 200,
  INTRO_MUSIC:      4000,  // Dauer bis Sirene startet
  GAME_OVER_ACCEPT: 1500,  // Mindestzeit bevor Enter akzeptiert wird
  HI_ENTRY_ACCEPT:  1800,  // Mindestzeit bevor Hi-Score-Eingabe aktiv
  GO_BLINK:         500,   // Blinkintervall "PRESS ENTER" bei Game Over
  BONUS_INTRO:      2500,  // Bonus-Game Intro-Dauer
};

// ── Ghost-Konstanten ─────────────────────────────────────────────
export const GHOST = {
  EATEN_SPEED:    120,    // px/s zurück zum Ghost-House
  HOUSE_COL:      13,     // Ghost-House Mitte
  HOUSE_ROW:      14,
  TUNNEL_ROW:     14,     // Tunnel-Zeile
  TUNNEL_LEFT:    6,      // Linke Tunnel-Grenze (col < 6)
  TUNNEL_RIGHT:   21,     // Rechte Tunnel-Grenze (col > 21)
  FRIGHT_BLINK_MIN: 500,  // Mindest-Blinkdauer (ms)
  FRIGHT_BLINK_PCT: 0.3,  // Blink-Schwelle = 30% der Fright-Dauer
  FLASH_INTERVAL: 200,    // Blink-Intervall im Frightened-Mode (ms)
};

// ── Frucht-Konfiguration ─────────────────────────────────────────
export const FRUIT = {
  DURATION:          9000, // Sichtbarkeit (ms)
  FLASH_START:       2000, // Blinken beginnt (ms vor Verschwinden)
  FLASH_INTERVAL:    200,  // Blink-Intervall (ms)
  SPAWN_THRESHOLD_1: 170,  // Pellets übrig → erste Frucht
  SPAWN_THRESHOLD_2: 70,   // Pellets übrig → zweite Frucht
};

// ── Schwierigkeitsstufe ──────────────────────────────────────────
let _difficulty = 'normal'; // 'easy' | 'normal'

export function setDifficulty(d) { _difficulty = d; }
export function getDifficulty()  { return _difficulty; }

// ── Pac-Man Bewegung ─────────────────────────────────────────────
export const PAC = {
  CORNER_TOLERANCE: 3,     // Cornering Pre-Turn Toleranz (px)
  MOUTH_SPEED:      4,     // Mund-Animations-Inkrement (°/Frame)
  MOUTH_MAX:        45,    // Maximaler Mundwinkel (°)
  START_LIVES:      3,     // Startleben (Normal)
};

export function getStartLives() {
  return _difficulty === 'easy' ? 5 : PAC.START_LIVES;
}

export function getExtraLifeScore() {
  return _difficulty === 'easy' ? 5000 : SCORE.EXTRA_LIFE;
}
