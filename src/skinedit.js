// skinedit.js – Skin-Editor

import { addCustomSkin, updateCustomSkin }  from './skinstorage.js';
import { drawCustomSkin } from './customskin.js';

export const PALETTE = [
  '#ff2244', // 0  rot
  '#ff8800', // 1  orange
  '#ffdd00', // 2  gelb
  '#88cc00', // 3  grün
  '#00ccff', // 4  cyan
  '#4455ff', // 5  blau
  '#cc44ff', // 6  lila
  '#ff44aa', // 7  pink
  '#aa6633', // 8  braun
  '#f5dea0', // 9  creme
  '#aaaaaa', // 10 grau
  '#222222', // 11 schwarz
  '#44ddbb', // 12 türkis
  '#ff9966', // 13 lachs
  '#aaff55', // 14 limette
  '#ffffff', // 15 weiß
];

const CFIELDS = ['body', 'ears', 'inner', 'eyes', 'nose', 'extra'];
const CLABELS = ['KÖRPER', 'OHREN', 'INNEN', 'AUGEN', 'NASE', 'EXTRA'];

const SHAPES  = ['rund', 'spitz', 'haengend', 'lang'];
const SLABELS = ['RUND', 'SPITZ', 'HÄNGEND', 'LANG'];

const DEFAULTS_TIER   = { body: 1, ears: 8, inner: 9,  eyes: 5, nose: 8, extra: 13 };
const DEFAULTS_MENSCH = { body: 9, ears: 8, inner: 15, eyes: 5, nose: 8, extra:  7 };

// Palette grid dimensions
const PS   = 12; // cell size (mobile-friendly, fits left panel)
const PGAP =  1; // gap
const PCOLS =  8; // 8×13=104px + PLX=4 = 108 < 111 panel divider
const PLX  =  4; // palette left x
const PLY  = 119; // palette top y

// Sections: 0=type, 1=shape, 2=whiskers, 3-8=colors, 9=name, 10=save
const N_SECTIONS = 11;

export function createSkinEdit() {
  return {
    active:   false,
    section:  0,
    type:     'tier',
    shape:    'rund',
    whiskers: true,
    colorIdx: { ...DEFAULTS_TIER },
    name:     '',
    editId:   null,
    onSave:   null,
  };
}

export function resetSkinEdit(se) {
  se.section  = 0;
  se.type     = 'tier';
  se.shape    = 'rund';
  se.whiskers = true;
  se.colorIdx = { ...DEFAULTS_TIER };
  se.name     = '';
  se.editId   = null;
}

export function loadIntoSkinEdit(se, skin) {
  se.section  = 0;
  se.type     = skin.type || 'tier';
  se.shape    = skin.shape || 'rund';
  se.whiskers = skin.whiskers ?? true;
  se.name     = skin.name || '';
  se.editId   = skin.id || null;
  for (const f of CFIELDS) {
    const idx = PALETTE.indexOf(skin.colors?.[f]);
    se.colorIdx[f] = idx >= 0 ? idx : (DEFAULTS_TIER[f] ?? 0);
  }
}

function _colors(se) {
  const c = {};
  for (const f of CFIELDS) c[f] = PALETTE[se.colorIdx[f]];
  return c;
}

// ── Touch-Handler ─────────────────────────────────────────────
// x, y in game-space (224×288)
// Returns: 'back' if back was tapped, 'save' if saved, true if handled, false if not
export function touchSkinEdit(se, x, y) {
  const np = PALETTE.length;
  const ns = SHAPES.length;

  // Save button (right panel: 135,240 to 201,254)
  if (x >= 135 && x <= 201 && y >= 240 && y <= 254) {
    const nm = se.name.trim() || 'CUSTOM';
    if (se.editId) {
      updateCustomSkin(se.editId, nm, se.type, _colors(se), se.shape, se.whiskers);
    } else {
      addCustomSkin(nm, se.type, _colors(se), se.shape, se.whiskers);
    }
    if (se.onSave) se.onSave();
    return 'save';
  }

  // Back button (right panel bottom: 135,260 to 201,274)
  if (x >= 135 && x <= 201 && y >= 260 && y <= 274) return 'back';

  // Palette grid direct tap (sections 3–8 active or any)
  if (x >= PLX && x < PLX + PCOLS * (PS + PGAP) && y >= PLY && y < PLY + 2 * (PS + PGAP)) {
    const col = Math.floor((x - PLX) / (PS + PGAP));
    const row = Math.floor((y - PLY) / (PS + PGAP));
    const idx = row * PCOLS + col;
    if (idx >= 0 && idx < np) {
      // If a color section is active, set that color
      if (se.section >= 3 && se.section <= 8) {
        const f = CFIELDS[se.section - 3];
        se.colorIdx[f] = idx;
      } else {
        // Jump to first color section and set
        se.section = 3;
        se.colorIdx[CFIELDS[0]] = idx;
      }
      return true;
    }
  }

  // Left panel (x < 111): section rows
  if (x < 111) {
    // Section 0 (Type): y 14–24
    if (y >= 14 && y <= 24) {
      se.section = 0;
      // Tap on left half → tier, right half → mensch
      if (x < 55) { se.type = 'tier'; se.colorIdx = { ...DEFAULTS_TIER }; }
      else        { se.type = 'mensch'; se.colorIdx = { ...DEFAULTS_MENSCH }; }
      return true;
    }
    // Section 1 (Shape): y 26–36
    if (y >= 26 && y <= 36) {
      se.section = 1;
      if (se.type === 'tier') {
        if (x < 55) se.shape = SHAPES[(SHAPES.indexOf(se.shape) - 1 + ns) % ns];
        else         se.shape = SHAPES[(SHAPES.indexOf(se.shape) + 1) % ns];
      }
      return true;
    }
    // Section 2 (Whiskers): y 37–47
    if (y >= 37 && y <= 47) {
      se.section = 2;
      if (se.type === 'tier') se.whiskers = !se.whiskers;
      return true;
    }
    // Sections 3–8 (Colors): y = 48 + (i*11) to 58 + (i*11)
    for (let i = 0; i < CFIELDS.length; i++) {
      const fy = 56 + i * 11;
      if (y >= fy - 8 && y <= fy + 2) {
        se.section = i + 3;
        const f = CFIELDS[i];
        // Tap left half = prev color, right half = next color
        if (x < 55) se.colorIdx[f] = (se.colorIdx[f] - 1 + np) % np;
        else         se.colorIdx[f] = (se.colorIdx[f] + 1) % np;
        return true;
      }
    }
    // Name (section 9)
    const ny = PLY + 2 * (PS + PGAP) + 13;
    if (y >= ny - 8 && y <= ny + 4) {
      se.section = 9;
      const input = prompt('Name eingeben (max. 10 Zeichen):', se.name);
      if (input !== null) {
        se.name = input.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 10);
      }
      return true;
    }
    // Save (section 10)
    const sy = ny + 14;
    if (y >= sy - 8 && y <= sy + 4) {
      se.section = 10;
      const nm = se.name.trim() || 'CUSTOM';
      if (se.editId) {
        updateCustomSkin(se.editId, nm, se.type, _colors(se), se.shape, se.whiskers);
      } else {
        addCustomSkin(nm, se.type, _colors(se), se.shape, se.whiskers);
      }
      if (se.onSave) se.onSave();
      return 'save';
    }
  }

  return false;
}

export function updateSkinEdit(se, e) {
  const np = PALETTE.length;
  const ns = SHAPES.length;

  if (e.key === 'ArrowUp') {
    se.section = (se.section - 1 + N_SECTIONS) % N_SECTIONS;
    return;
  }
  if (e.key === 'ArrowDown') {
    se.section = (se.section + 1) % N_SECTIONS;
    return;
  }

  switch (se.section) {
    case 0: { // type
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        se.type     = se.type === 'tier' ? 'mensch' : 'tier';
        se.colorIdx = { ...(se.type === 'tier' ? DEFAULTS_TIER : DEFAULTS_MENSCH) };
      }
      break;
    }
    case 1: { // shape (nur Tier)
      if (e.key === 'ArrowLeft')  se.shape = SHAPES[(SHAPES.indexOf(se.shape) - 1 + ns) % ns];
      if (e.key === 'ArrowRight') se.shape = SHAPES[(SHAPES.indexOf(se.shape) + 1) % ns];
      break;
    }
    case 2: { // whiskers (nur Tier)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') se.whiskers = !se.whiskers;
      break;
    }
    case 3: case 4: case 5: case 6: case 7: case 8: { // color fields
      const f = CFIELDS[se.section - 3];
      if (e.key === 'ArrowLeft')  se.colorIdx[f] = (se.colorIdx[f] - 1 + np) % np;
      if (e.key === 'ArrowRight') se.colorIdx[f] = (se.colorIdx[f] + 1) % np;
      break;
    }
    case 9: { // name
      if (e.key === 'Backspace') {
        se.name = se.name.slice(0, -1);
      } else if (se.name.length < 10) {
        const k = e.key.toUpperCase();
        if (/^[A-Z0-9 ]$/.test(k)) se.name += k;
      }
      break;
    }
    case 10: { // save
      if (e.key === 'Enter') {
        const nm = se.name.trim() || 'CUSTOM';
        if (se.editId) {
          updateCustomSkin(se.editId, nm, se.type, _colors(se), se.shape, se.whiskers);
        } else {
          addCustomSkin(nm, se.type, _colors(se), se.shape, se.whiskers);
        }
        if (se.onSave) se.onSave();
      }
      break;
    }
  }
}

export function drawSkinEdit(ctx, se) {
  const W = 224;

  ctx.fillStyle = '#0d0d1f';
  ctx.fillRect(0, 0, W, 288);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#aaddff';
  ctx.font      = 'bold 9px Orbitron, sans-serif';
  ctx.fillText(se.editId ? 'SKIN BEARBEITEN' : 'SKIN EDITOR', W / 2, 11);

  // Selection highlight bar
  function _sel(y) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth   = 1;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 3;
    ctx.strokeRect(2, y - 8, 107, 10);
    ctx.shadowBlur  = 0;
  }

  // ── LEFT PANEL ────────────────────────────────────────────────

  // Type (section 0)
  if (se.section === 0) _sel(22);
  ctx.textAlign = 'left';
  ctx.fillStyle = se.section === 0 ? '#FFD700' : '#8899bb';
  ctx.font      = '5.5px Orbitron, sans-serif';
  ctx.fillText('TYP:', 5, 22);
  ctx.fillStyle = se.type === 'tier'   ? '#FFD700' : '#445566';
  ctx.fillText('TIER',   38, 22);
  ctx.fillStyle = '#2a3a50';
  ctx.fillText('/',      64, 22);
  ctx.fillStyle = se.type === 'mensch' ? '#FFD700' : '#445566';
  ctx.fillText('MENSCH', 70, 22);

  // Shape (section 1)
  if (se.section === 1) _sel(34);
  ctx.fillStyle = se.section === 1 ? '#FFD700' : '#8899bb';
  ctx.font      = '5px Orbitron, sans-serif';
  ctx.fillText('FORM:', 5, 34);
  ctx.fillStyle = se.type === 'mensch' ? '#2a3a50' : (se.section === 1 ? '#FFD700' : '#aaaacc');
  ctx.fillText(SLABELS[SHAPES.indexOf(se.shape)], 38, 34);
  if (se.section === 1) {
    ctx.fillStyle = '#FFD700';
    ctx.font      = '7px sans-serif';
    ctx.fillText('◄', 84, 34);
    ctx.fillText('►', 92, 34);
  }

  // Whiskers (section 2)
  if (se.section === 2) _sel(45);
  ctx.fillStyle = se.section === 2 ? '#FFD700' : '#8899bb';
  ctx.font      = '5px Orbitron, sans-serif';
  ctx.fillText('BART:', 5, 45);
  ctx.fillStyle = se.type === 'mensch' ? '#2a3a50' : (se.section === 2 ? '#FFD700' : '#aaaacc');
  ctx.fillText(se.whiskers ? 'JA' : 'NEIN', 38, 45);
  if (se.section === 2) {
    ctx.fillStyle = '#FFD700';
    ctx.font      = '7px sans-serif';
    ctx.fillText('◄', 84, 45);
    ctx.fillText('►', 92, 45);
  }

  // Color fields (sections 3–8)
  for (let i = 0; i < CFIELDS.length; i++) {
    const f  = CFIELDS[i];
    const fy = 56 + i * 11;
    if (se.section === i + 3) _sel(fy);
    ctx.textAlign = 'left';
    ctx.fillStyle = se.section === i + 3 ? '#FFD700' : '#8899bb';
    ctx.font      = '5px Orbitron, sans-serif';
    ctx.fillText(CLABELS[i], 5, fy);
    // Color swatch
    ctx.fillStyle   = PALETTE[se.colorIdx[f]];
    ctx.fillRect(72, fy - 7, 10, 8);
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth   = 0.5;
    ctx.strokeRect(72, fy - 7, 10, 8);
    if (se.section === i + 3) {
      ctx.fillStyle = '#FFD700';
      ctx.font      = '7px sans-serif';
      ctx.fillText('◄', 84, fy);
      ctx.fillText('►', 92, fy);
    }
  }

  // Palette grid
  ctx.textAlign = 'left';
  ctx.fillStyle = '#445566';
  ctx.font      = '4.5px Orbitron, sans-serif';
  ctx.fillText('PALETTE:', PLX, PLY - 3);

  for (let i = 0; i < PALETTE.length; i++) {
    const col = i % PCOLS;
    const row = Math.floor(i / PCOLS);
    const px  = PLX + col * (PS + PGAP);
    const py  = PLY + row * (PS + PGAP);
    ctx.fillStyle = PALETTE[i];
    ctx.fillRect(px, py, PS, PS);
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth   = 0.3;
    ctx.strokeRect(px, py, PS, PS);
    // Highlight selected color for active field
    if (se.section >= 3 && se.section <= 8) {
      const f = CFIELDS[se.section - 3];
      if (se.colorIdx[f] === i) {
        // Äußerer schwarzer Rand (Kontrast bei hellen Farben)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth   = 2.5;
        ctx.strokeRect(px - 1, py - 1, PS + 2, PS + 2);
        // Innerer goldener Rand
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(px - 0.5, py - 0.5, PS + 1, PS + 1);
      }
    }
  }

  // Name input (section 9)
  const ny = PLY + 2 * (PS + PGAP) + 13;
  if (se.section === 9) _sel(ny);
  ctx.textAlign = 'left';
  ctx.fillStyle = se.section === 9 ? '#FFD700' : '#8899bb';
  ctx.font      = '5px Orbitron, sans-serif';
  ctx.fillText('NAME:', 5, ny);
  const blink = se.section === 9 && Math.floor(Date.now() / 500) % 2 === 0;
  ctx.fillStyle = '#aaddff';
  ctx.fillText((se.name || '') + (blink ? '_' : ''), 42, ny);

  // Save button (section 10)
  const sy = ny + 14;
  if (se.section === 10) _sel(sy);
  ctx.textAlign = 'center';
  ctx.fillStyle = se.section === 10 ? '#FFD700' : '#445566';
  ctx.font      = 'bold 5.5px Orbitron, sans-serif';
  ctx.fillText('ENTER = SPEICHERN', 56, sy);

  // ESC hint
  ctx.fillStyle = '#2a3a50';
  ctx.font      = '4.5px Orbitron, sans-serif';
  ctx.fillText('ESC = ZURÜCK', 56, sy + 12);

  // ── RIGHT PANEL ───────────────────────────────────────────────
  ctx.strokeStyle = '#1a2a4a';
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.moveTo(111, 14); ctx.lineTo(111, 278); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#445566';
  ctx.font      = '4.5px Orbitron, sans-serif';
  ctx.fillText('VORSCHAU', 168, 21);

  // Live preview
  drawCustomSkin(ctx, 168, 78, 36, 20, {
    type: se.type, shape: se.shape, whiskers: se.whiskers, colors: _colors(se),
  });

  ctx.fillStyle = '#445566';
  ctx.font      = '5px Orbitron, sans-serif';
  ctx.fillText(se.type === 'tier' ? 'TIER' : 'MENSCH', 168, 122);

  // Navigation hints
  const isTouchDevice = matchMedia('(pointer: coarse)').matches;
  ctx.fillStyle = '#2a3a50';
  ctx.font      = '4.5px Orbitron, sans-serif';
  if (isTouchDevice) {
    ctx.fillText('TIPPE AUF FELDER', 168, 144);
    ctx.fillText('UND FARBEN',       168, 152);
  } else {
    ctx.fillText('▲▼ FELD WÄHLEN', 168, 144);
    ctx.fillText('◄► WERT ÄNDERN', 168, 152);
    ctx.fillText('A-Z FÜR NAME',   168, 160);
  }

  // Touch-friendly save button (right panel)
  ctx.fillStyle = '#1a4a2a';
  ctx.fillRect(135, 240, 66, 14);
  ctx.strokeStyle = '#44aa66';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(135, 240, 66, 14);
  ctx.fillStyle = '#88ddaa';
  ctx.font = 'bold 5px Orbitron, sans-serif';
  ctx.fillText('SPEICHERN', 168, 250);

  // Touch-friendly back button (right panel bottom)
  ctx.fillStyle = '#2a3a66';
  ctx.fillRect(135, 260, 66, 14);
  ctx.strokeStyle = '#4466aa';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(135, 260, 66, 14);
  ctx.fillStyle = '#8899cc';
  ctx.font = 'bold 5px Orbitron, sans-serif';
  ctx.fillText('← ZURÜCK', 168, 270);

  ctx.textAlign = 'left';
}
