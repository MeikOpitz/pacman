// hiscore.js – Hi-Score Tabelle (Top 5)

const LS_KEY     = 'pacman-hiscores';
const MAX        = 5;

const DEFAULT_SCORES = [
  { name: 'KATZI',     score: 28000, level: 5 },
  { name: 'PINKY',     score: 21500, level: 4 },
  { name: 'SUPERSTAR', score: 15000, level: 3 },
  { name: 'CLYDE',     score: 9200,  level: 2 },
  { name: 'PAC MAN',   score: 4800,  level: 1 },
];

function _ensureDefaults() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null || raw === '[]') {
      localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_SCORES));
    }
  } catch { /* Storage nicht verfügbar */ }
}

export function loadHiScores() {
  _ensureDefaults();
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

export function getTopScore() {
  const list = loadHiScores();
  return list.length > 0 ? list[0].score : 0;
}

export function isNewHiScore(score) {
  if (score <= 0) return false;
  const list = loadHiScores();
  if (list.length < MAX) return true;
  return score > list[list.length - 1].score;
}

export function saveHiScore(name, score, level) {
  const list = loadHiScores();
  list.push({
    name:  (name.trim() || 'AAA').toUpperCase().slice(0, 10),
    score,
    level,
  });
  list.sort((a, b) => b.score - a.score);
  list.splice(MAX);
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}
