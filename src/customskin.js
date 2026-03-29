// customskin.js – Rendert einen Custom Skin aus Daten

export function drawCustomSkin(ctx, x, y, r, mouthAngle, skin) {
  const shape    = skin.shape    ?? 'rund';
  const whiskers = skin.whiskers ?? true;
  if (skin.type === 'tier') _drawTier(ctx, x, y, r, mouthAngle, skin.colors, shape, whiskers);
  else                      _drawMensch(ctx, x, y, r, mouthAngle, skin.colors);
}

// ── TIER ─────────────────────────────────────────────────────
function _drawTier(ctx, x, y, r, mouthAngle, c, shape, whiskers) {
  const s = r / 12;

  // ── Ohren (form-abhängig) ─────────────────────────────────
  if (shape === 'spitz') {
    // Spitze Dreiecksohren (Katze)
    ctx.fillStyle = c.ears;
    ctx.beginPath(); ctx.moveTo(x - 8*s, y - r + 1*s); ctx.lineTo(x - 13*s, y - r - 10*s); ctx.lineTo(x - 2*s, y - r + 1*s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 8*s, y - r + 1*s); ctx.lineTo(x + 13*s, y - r - 10*s); ctx.lineTo(x + 2*s, y - r + 1*s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.inner;
    ctx.beginPath(); ctx.moveTo(x - 7.5*s, y - r + 0.5*s); ctx.lineTo(x - 11.5*s, y - r - 7*s); ctx.lineTo(x - 3*s, y - r + 0.5*s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 7.5*s, y - r + 0.5*s); ctx.lineTo(x + 11.5*s, y - r - 7*s); ctx.lineTo(x + 3*s, y - r + 0.5*s); ctx.closePath(); ctx.fill();

  } else if (shape === 'haengend') {
    // Hängende Ohren (Hund)
    ctx.fillStyle = c.ears;
    ctx.beginPath(); ctx.ellipse(x - r - 2*s, y + 2*s, 5*s, 10*s, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r + 2*s, y + 2*s, 5*s, 10*s,  0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = _lighten(c.ears, 25);
    ctx.beginPath(); ctx.ellipse(x - r - 3.5*s, y - 1*s, 2*s, 4*s, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r + 0.5*s, y - 1*s, 2*s, 4*s,  0.3, 0, Math.PI * 2); ctx.fill();

  } else if (shape === 'lang') {
    // Lange Ohren (Hase / Pferd)
    ctx.fillStyle = c.ears;
    ctx.beginPath(); ctx.ellipse(x - 6*s, y - r - 8*s, 4*s, 10*s, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 6*s, y - r - 8*s, 4*s, 10*s,  0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.inner;
    ctx.beginPath(); ctx.ellipse(x - 6*s, y - r - 8*s, 2*s, 7.5*s, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 6*s, y - r - 8*s, 2*s, 7.5*s,  0.1, 0, Math.PI * 2); ctx.fill();

  } else {
    // Rund (Standard – Bär / Maus)
    ctx.fillStyle = c.ears;
    ctx.beginPath(); ctx.arc(x - 7*s, y - 9*s, 5*s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 7*s, y - 9*s, 5*s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.inner;
    ctx.beginPath(); ctx.arc(x - 7*s, y - 9*s, 3*s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 7*s, y - 9*s, 3*s, 0, Math.PI * 2); ctx.fill();
  }

  // ── Kopf ─────────────────────────────────────────────────
  const g = ctx.createRadialGradient(x - 2*s, y - 3*s, 1, x, y, r);
  g.addColorStop(0, _lighten(c.body, 40)); g.addColorStop(1, c.body);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

  // ── Schnauze ─────────────────────────────────────────────
  ctx.fillStyle = c.extra;
  ctx.beginPath(); ctx.ellipse(x, y + 3*s, 6*s, 5*s, 0, 0, Math.PI * 2); ctx.fill();

  // ── Augen ─────────────────────────────────────────────────
  for (const ex of [-4*s, 4*s]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 3.5*s, 3*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.eyes;
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 2*s, 2.5*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 1*s, 2*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + ex + 1*s, y - 3*s, 0.7*s, 0, Math.PI * 2); ctx.fill();
  }

  // ── Nase ─────────────────────────────────────────────────
  ctx.fillStyle = c.nose || _darken(c.extra, 40);
  ctx.beginPath(); ctx.ellipse(x, y + 1*s, 2*s, 1.5*s, 0, 0, Math.PI * 2); ctx.fill();

  // ── Schnurrhaare (optional) ───────────────────────────────
  if (whiskers) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.5*s;
    for (const [x1,y1,x2,y2] of [[-12*s,1*s,-5*s,2*s],[-12*s,4*s,-5*s,3*s],[5*s,2*s,12*s,1*s],[5*s,3*s,12*s,4*s]]) {
      ctx.beginPath(); ctx.moveTo(x+x1, y+y1); ctx.lineTo(x+x2, y+y2); ctx.stroke();
    }
  }

  // ── Mund ─────────────────────────────────────────────────
  if (mouthAngle > 2) {
    const m = (mouthAngle * Math.PI) / 180;
    ctx.fillStyle = _darken(c.body, 50);
    ctx.beginPath(); ctx.arc(x, y + 4*s, 3*s, m * 0.4, Math.PI - m * 0.4); ctx.fill();
  }
}

// ── MENSCH ───────────────────────────────────────────────────
function _drawMensch(ctx, x, y, r, mouthAngle, c) {
  const s = r / 12;

  // Haare – Hinterkopf (breiter Bogen, reicht seitlich herunter)
  ctx.fillStyle = c.ears;
  ctx.beginPath();
  ctx.arc(x, y - 1*s, r + 1.5*s, Math.PI + 0.3, -0.3);
  ctx.closePath();
  ctx.fill();
  // Seitliche Strähnen (umrahmen den Kopf)
  ctx.beginPath(); ctx.ellipse(x - r - 0.5*s, y - 2*s, 3*s, 7*s, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r + 0.5*s, y - 2*s, 3*s, 7*s, -0.15, 0, Math.PI * 2); ctx.fill();
  // Pony (Stirnpartie, leicht asymmetrisch)
  ctx.beginPath(); ctx.ellipse(x - 3*s, y - r + 1*s, 5*s, 3.5*s, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 2*s, y - r + 1.5*s, 4*s, 3*s, 0.15, 0, Math.PI * 2); ctx.fill();
  // Haar-Highlight (Glanzsträhne)
  ctx.fillStyle = _lighten(c.ears, 30);
  ctx.beginPath(); ctx.ellipse(x - 2*s, y - r + 1*s, 2.5*s, 1.5*s, -0.3, 0, Math.PI * 2); ctx.fill();

  // Kopf
  const g = ctx.createRadialGradient(x - 2*s, y - 1*s, 1, x, y, r);
  g.addColorStop(0, _lighten(c.body, 30)); g.addColorStop(1, c.body);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

  // Wangen-Rouge (näher an den Augen, dezenter)
  ctx.fillStyle = c.extra;
  ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.ellipse(x - 5.5*s, y + 1.5*s, 2.5*s, 1.8*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 5.5*s, y + 1.5*s, 2.5*s, 1.8*s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Augen
  for (const ex of [-4*s, 4*s]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 3.5*s, 3*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.eyes;
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 2*s, 2.5*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x + ex, y - 2*s, 1*s, 2*s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + ex + 1*s, y - 3*s, 0.7*s, 0, Math.PI * 2); ctx.fill();
    // Wimpern
    ctx.strokeStyle = _darken(c.ears, 20); ctx.lineWidth = 0.6*s;
    ctx.beginPath(); ctx.moveTo(x + ex - 3*s, y - 4.5*s); ctx.lineTo(x + ex - 2*s, y - 5.5*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + ex,       y - 5*s);   ctx.lineTo(x + ex,       y - 6*s);   ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + ex + 3*s, y - 4.5*s); ctx.lineTo(x + ex + 2*s, y - 5.5*s); ctx.stroke();
  }

  // Nase
  ctx.fillStyle = c.nose || _darken(c.body, 30);
  ctx.beginPath(); ctx.ellipse(x, y + 1*s, 1.5*s, 1*s, 0, 0, Math.PI * 2); ctx.fill();

  // Mund
  ctx.strokeStyle = _darken(c.body, 60); ctx.lineWidth = 0.8*s;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (mouthAngle > 2) {
    const m = (mouthAngle * Math.PI) / 180;
    ctx.fillStyle = '#cc3344';
    ctx.beginPath(); ctx.arc(x, y + 4*s, 3*s, m * 0.4, Math.PI - m * 0.4); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(x, y + 4*s, 2.5*s, 0.2, Math.PI - 0.2); ctx.stroke();
  }
}

// ── Farb-Hilfsfunktionen ──────────────────────────────────────
function _lighten(hex, amt) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amt);
  const g = Math.min(255, ((n >>  8) & 0xff) + amt);
  const b = Math.min(255, ((n)       & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function _darken(hex, amt) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amt);
  const g = Math.max(0, ((n >>  8) & 0xff) - amt);
  const b = Math.max(0, ((n)       & 0xff) - amt);
  return `rgb(${r},${g},${b})`;
}
