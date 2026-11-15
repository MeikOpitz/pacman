// PFOTENFAUST – Level-Hintergründe (prozedural gemalte Parallax-Ebenen)
'use strict';
function seedRnd(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const BGW = 320;
const THEMES = {
  alley: { pit: '#0c0a18', plat: ['#8a6a78', '#5a3a48'] },
  harbor: { pit: '#234a86', plat: ['#d09850', '#7a4a24'], water: 1 },
  roofs: { pit: '#0a0e28', plat: ['#d87058', '#7a2a2a'] },
  factory: { pit: '#101818', plat: ['#f0c838', '#4a5a68'] },
  villa: { pit: '#14081a', plat: ['#f0c838', '#7a1830'] }
};
function buildBG(theme) {
  const far = newCv(BGW, GY), mid = newCv(BGW, GY), fl = newCv(32, H - GY);
  const f = far.getContext('2d'), m = mid.getContext('2d'), g = fl.getContext('2d'), r = seedRnd(7 + theme.length * 131);
  const rc = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const bands = (cols, y0, y1) => { const hh = (y1 - y0) / cols.length; cols.forEach((c, i) => rc(f, 0, y0 + i * hh, BGW, Math.ceil(hh) + 1, c)); };
  const disc = (c, cx, cy, rad, col) => { for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(rad * rad - y * y)); rc(c, cx - w, cy + y, w * 2, 1, col); } };
  const stars = (n, yMax) => { for (let i = 0; i < n; i++) rc(f, r() * BGW, r() * yMax, 1, 1, r() < 0.3 ? '#fff' : '#9aa0d0'); };
  if (theme === 'alley') {
    bands(['#1a1638', '#241c48', '#32265c', '#463270', '#5e4084'], 0, GY); stars(40, 50); disc(f, 250, 24, 9, '#f6f0c0'); disc(f, 246, 21, 2, '#d8d0a0');
    for (let x = 0; x < BGW;) { const w = 14 + r() * 22 | 0, h = 26 + r() * 40 | 0; rc(f, x, GY - h - 8, w, h + 8, '#15122a');
      for (let wy = GY - h - 4; wy < GY - 12; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() < 0.25) rc(f, wx, wy, 2, 3, r() < 0.7 ? '#f0c838' : '#f08a50'); x += w + (r() * 3 | 0); }
    // Backsteinmauer mit Lücke
    const wall = (x0, x1, top) => { rc(m, x0, top, x1 - x0, GY - top, '#5c3244'); rc(m, x0, top, x1 - x0, 2, '#8a5468');
      for (let y = top + 5; y < GY; y += 5) { rc(m, x0, y, x1 - x0, 1, '#42222f'); for (let x = x0 + ((y / 5 | 0) % 2) * 5; x < x1; x += 10) rc(m, x, y - 4, 1, 4, '#42222f'); } };
    wall(0, 150, 46); wall(170, 320, 58);
    const win = (x, y, lit) => { rc(m, x - 1, y - 1, 14, 16, '#2c1622'); rc(m, x, y, 12, 14, lit ? '#f0c060' : '#232a50'); rc(m, x + 5, y, 2, 14, '#2c1622'); rc(m, x, y + 6, 12, 2, '#2c1622'); rc(m, x - 2, y + 15, 16, 2, '#8a5468'); if (lit) rc(m, x + 7, y + 8, 4, 6, '#3a2038'); };
    win(14, 56, 1); win(48, 56, 0); win(100, 56, 0); win(190, 68, 0); win(232, 68, 1); win(280, 68, 0);
    rc(m, 82, 46, 3, GY - 46, '#6a7a8a'); rc(m, 81, 60, 5, 2, '#44505e'); rc(m, 81, 90, 5, 2, '#44505e');
    // Steckbrief-Plakat
    rc(m, 122, 82, 16, 20, '#e8dcc0'); rc(m, 124, 84, 12, 2, '#b02848'); rc(m, 126, 89, 7, 7, '#f4f0e8'); rc(m, 127, 87, 5, 2, '#e0483a'); rc(m, 133, 91, 2, 2, '#f0b030'); rc(m, 130, 90, 1, 1, '#1a1423'); rc(m, 124, 98, 12, 1, '#30202a');
    for (let x = 150; x < 170; x += 5) { rc(m, x, 84, 4, GY - 84, '#7a5a3a'); rc(m, x, 84, 4, 1, '#a88050'); }
    rc(m, 150, 92, 20, 2, '#5a3a20');
    rc(g, 0, 0, 32, 22, '#35304c'); rc(g, 0, 0, 32, 2, '#7a7498'); rc(g, 0, 2, 32, 1, '#211d34');
    for (let i = 0; i < 22; i++) rc(g, r() * 32, 4 + r() * 17, 1 + (r() * 2 | 0), 1, r() < 0.5 ? '#48425f' : '#28243c');
  } else if (theme === 'harbor') {
    bands(['#3a2a6a', '#6a3478', '#b04a70', '#e8705a', '#f8a858', '#fcd67a'], 0, 74); disc(f, 110, 72, 16, '#fff4b8'); rc(f, 0, 72, BGW, GY - 72, '#274a8c');
    for (let y = 74; y < GY; y += 3) for (let i = 0; i < 9; i++) rc(f, (r() * BGW) | 0, y, 4 + r() * 14, 1, Math.abs(y - 74) < 20 && r() < 0.6 ? '#f8c070' : '#3a66b0');
    rc(f, 200, 62, 50, 10, '#241a3c'); rc(f, 214, 54, 16, 8, '#241a3c'); rc(f, 220, 40, 2, 14, '#241a3c'); rc(f, 232, 58, 12, 4, '#241a3c');
    rc(f, 30, 30, 3, 42, '#241a3c'); rc(f, 14, 30, 46, 2, '#241a3c'); rc(f, 56, 32, 1, 14, '#241a3c'); rc(f, 22, 66, 20, 6, '#241a3c');
    const shed = (x, w, top, col, cd) => { rc(m, x, top, w, GY - top, col); rc(m, x - 2, top - 4, w + 4, 5, cd); for (let i = x + 4; i < x + w; i += 6) rc(m, i, top + 2, 1, GY - top, cd);
      rc(m, x + w / 2 - 12, GY - 30, 24, 30, '#1c2a34'); rc(m, x + w / 2 - 11, GY - 29, 22, 1, '#3a5a68'); for (let y = GY - 26; y < GY; y += 4) rc(m, x + w / 2 - 11, y, 22, 1, '#2a3e4a'); };
    shed(8, 84, 56, '#2e6f74', '#1e4a54'); shed(190, 100, 48, '#a85a3a', '#743a28');
    rc(m, 30, 62, 20, 9, '#f6f0dc'); text(m, 'FISCH', 31, 64, '#1e4a54'); rc(m, 222, 55, 28, 9, '#f6f0dc'); text(m, 'HALLE 7', 223, 57, '#743a28');
    const cr = (x, y) => { rc(m, x, y, 14, 14, '#c08a4a'); rc(m, x, y, 14, 1, '#e8b870'); rc(m, x, y + 13, 14, 1, '#7a4a24'); rc(m, x + 13, y, 1, 14, '#7a4a24'); rc(m, x + 2, y + 6, 10, 1, '#7a4a24'); };
    cr(108, GY - 14); cr(122, GY - 14); cr(115, GY - 28); cr(300, GY - 14);
    rc(m, 150, 40, 2, GY - 40, '#2a2038'); rc(m, 146, 38, 10, 3, '#2a2038'); rc(m, 147, 41, 8, 3, '#fcd67a'); rc(m, 168, GY - 12, 6, 12, '#5a3a20'); rc(m, 167, GY - 13, 8, 3, '#8a5a30');
    rc(g, 0, 0, 32, 10, '#b07a40'); rc(g, 0, 0, 32, 2, '#dca860'); for (let x = 0; x < 32; x += 8) rc(g, x, 2, 1, 8, '#7a4a24'); rc(g, 3, 5, 1, 1, '#7a4a24'); rc(g, 21, 7, 1, 1, '#7a4a24');
    rc(g, 0, 10, 32, 12, '#1c3466'); rc(g, 0, 10, 32, 2, '#5a3a20'); rc(g, 12, 12, 5, 10, '#5a3a20'); rc(g, 13, 12, 1, 10, '#8a5a30'); rc(g, 0, 17, 8, 1, '#3a66b0'); rc(g, 20, 20, 9, 1, '#3a66b0');
  } else if (theme === 'roofs') {
    bands(['#0a0e2c', '#101640', '#182054', '#22306c', '#2e4084'], 0, GY); stars(70, 90); disc(f, 96, 36, 22, '#f8f4d0'); disc(f, 88, 30, 4, '#e0d8a8'); disc(f, 104, 44, 3, '#e0d8a8'); disc(f, 100, 26, 2, '#e0d8a8');
    for (let x = 0; x < BGW;) { const w = 12 + r() * 18 | 0, h = 14 + r() * 20 | 0; rc(f, x, GY - h, w, h, '#0e1230'); for (let i = 0; i < w / 2; i++) rc(f, x + i, GY - h - (i), w - i * 2, 1, '#0e1230');
      for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() < 0.4) rc(f, wx, GY - h + 5 + (r() * 8 | 0), 2, 3, '#f0c838'); x += w; }
    rc(f, 200, 50, 8, GY - 50, '#0e1230'); for (let i = 0; i < 8; i++) rc(f, 200 + i / 2, 50 - 14 + i * 2 - 2, 8 - i, 2, '#0e1230'); rc(f, 203, 30, 1, 8, '#0e1230'); rc(f, 202, 62, 4, 4, '#f0c838');
    const ch = (x, h) => { rc(m, x, GY - h, 12, h, '#6a3440'); rc(m, x - 1, GY - h - 3, 14, 3, '#8a4a54'); rc(m, x, GY - h, 3, h, '#4a222e'); for (let y = GY - h + 5; y < GY; y += 5) rc(m, x, y, 12, 1, '#4a222e');
      for (let i = 0; i < 4; i++) disc(m, x + 6 + i * 3, GY - h - 8 - i * 7, 3 + (i >> 1), 'rgba(200,205,235,0.' + (5 - i) + ')'); };
    ch(30, 30); ch(210, 22);
    rc(m, 100, GY - 40, 1, 40, '#1a1423'); rc(m, 92, GY - 38, 17, 1, '#1a1423'); rc(m, 95, GY - 33, 11, 1, '#1a1423'); rc(m, 98, GY - 28, 5, 1, '#1a1423');
    for (let i = 0; i < 14; i++) rc(m, 140 + 14 - i, GY - 28 + i * 2, 20 + i * 2, 2, '#7a2e30'); rc(m, 150, GY - 18, 12, 12, '#1a1630'); rc(m, 151, GY - 17, 10, 10, '#f0c060'); rc(m, 155, GY - 17, 2, 10, '#1a1630'); rc(m, 151, GY - 13, 10, 1, '#1a1630');
    rc(m, 270, GY - 34, 20, 18, '#3a4a6a'); rc(m, 268, GY - 37, 24, 3, '#56688c'); rc(m, 273, GY - 16, 2, 16, '#26304a'); rc(m, 285, GY - 16, 2, 16, '#26304a'); rc(m, 270, GY - 28, 20, 1, '#26304a');
    rc(g, 0, 0, 32, 22, '#a23e38'); rc(g, 0, 0, 32, 2, '#e07a5c');
    for (let y = 3; y < 22; y += 5) for (let x = ((y / 5 | 0) % 2) * 4 - 4; x < 32; x += 8) { rc(g, x, y + 3, 8, 1, '#6e2428'); rc(g, x, y, 1, 4, '#6e2428'); rc(g, x + 2, y, 4, 1, '#c85a48'); }
  } else if (theme === 'factory') {
    rc(f, 0, 0, BGW, GY, '#213638'); for (let x = 0; x < BGW; x += 40) { rc(f, x, 0, 2, GY, '#182a2c'); rc(f, x + 8, 14, 24, 30, '#0e1830'); rc(f, x + 8, 14, 24, 1, '#3a5a58'); rc(f, x + 19, 14, 2, 30, '#213638'); rc(f, x + 8, 28, 24, 2, '#213638'); if (r() < 0.6) rc(f, x + 11 + r() * 16, 18 + r() * 20, 1, 1, '#fff'); }
    rc(f, 0, 52, BGW, 5, '#3c5e5a'); rc(f, 0, 52, BGW, 1, '#5a8a82'); for (let x = 10; x < BGW; x += 46) rc(f, x, 50, 4, 9, '#2a4644');
    rc(f, 0, 70, BGW, 3, '#3c5e5a'); for (let x = 30; x < BGW; x += 80) { rc(f, x, 73, 3, GY - 73, '#3c5e5a'); rc(f, x - 1, 90, 5, 3, '#2a4644'); }
    const gear = (cx, cy, rad) => { disc(f, cx, cy, rad, '#2c4a4a'); for (let a = 0; a < 8; a++) rc(f, cx + Math.cos(a * 0.785) * (rad + 1) - 1, cy + Math.sin(a * 0.785) * (rad + 1) - 1, 3, 3, '#2c4a4a'); disc(f, cx, cy, rad >> 1, '#213638'); };
    gear(70, 96, 10); gear(90, 104, 6); gear(250, 92, 12);
    // Förderband + Wollknäuel
    rc(m, 0, GY - 26, 130, 5, '#4a5a68'); rc(m, 0, GY - 26, 130, 1, '#8ea0b0'); for (let x = 2; x < 130; x += 9) rc(m, x, GY - 23, 4, 1, '#2a3440'); rc(m, 14, GY - 21, 4, 21, '#3a4652'); rc(m, 110, GY - 21, 4, 21, '#3a4652');
    [['#e878a8', '#a84878', 22], ['#5ad0f0', '#2a88b0', 58], ['#f0c838', '#b88a20', 92]].forEach(([a, b, x]) => { disc(m, x, GY - 32, 6, a); rc(m, x - 4, GY - 34, 8, 1, b); rc(m, x - 5, GY - 31, 10, 1, b); rc(m, x - 3, GY - 28, 6, 1, b); });
    rc(m, 160, GY - 52, 40, 52, '#5a6a78'); rc(m, 160, GY - 52, 40, 2, '#8ea0b0'); rc(m, 196, GY - 50, 4, 50, '#3a4652'); rc(m, 166, GY - 46, 18, 12, '#0e1830'); rc(m, 168, GY - 42, 3, 6, '#5af07a'); rc(m, 173, GY - 40, 3, 4, '#5af07a'); rc(m, 178, GY - 44, 3, 8, '#f0c838');
    rc(m, 188, GY - 44, 4, 4, '#e0483a'); for (let x = 160; x < 200; x += 8) { rc(m, x, GY - 8, 4, 8, '#f0c838'); rc(m, x + 4, GY - 8, 4, 8, '#2a2038'); }
    rc(m, 228, GY - 76, 44, 12, '#f6f0dc'); rc(m, 228, GY - 76, 44, 1, '#8a4aa8'); rc(m, 228, GY - 65, 44, 1, '#8a4aa8'); text(m, 'EIER AG', 236, GY - 73, '#5c2e78');
    for (const x of [140, 290]) { rc(m, x, 0, 1, 26, '#1a1423'); rc(m, x - 4, 26, 9, 3, '#4a5a68'); for (let i = 0; i < 14; i++) rc(m, x - 3 - i, 29 + i * 3, 7 + i * 2, 3, 'rgba(255,240,170,0.07)'); }
    rc(g, 0, 0, 32, 22, '#56687a'); rc(g, 0, 0, 32, 2, '#a0b4c4'); rc(g, 0, 2, 32, 1, '#34424e'); rc(g, 0, 3, 1, 19, '#34424e'); rc(g, 16, 3, 1, 19, '#44525e');
    for (const [x, y] of [[3, 6], [12, 6], [19, 6], [28, 6], [3, 18], [28, 18]]) rc(g, x, y, 1, 1, '#a0b4c4'); for (let x = 0; x < 32; x += 8) { rc(g, x, 11, 4, 3, '#f0c838'); rc(g, x + 4, 11, 4, 3, '#2a2038'); }
  } else {
    rc(f, 0, 0, BGW, GY, '#5a1e3c'); for (let y = 0; y < 86; y += 10) for (let x = (y / 10 % 2) * 8; x < BGW; x += 16) { rc(f, x + 3, y + 2, 2, 6, '#6e2a4c'); rc(f, x + 1, y + 4, 6, 2, '#6e2a4c'); }
    rc(f, 0, 86, BGW, GY - 86, '#38142a'); rc(f, 0, 86, BGW, 2, '#b88a20'); for (let x = 4; x < BGW; x += 28) { rc(f, x, 92, 20, 24, '#4a1c38'); rc(f, x, 92, 20, 1, '#2a0e20'); }
    for (const x of [40, 200]) { rc(f, x, 16, 34, 58, '#b88a20'); rc(f, x + 2, 18, 30, 54, '#141a48'); disc(f, x + 22, 30, 5, '#f8f4d0'); rc(f, x + 16, 18, 2, 54, '#b88a20'); rc(f, x + 2, 44, 30, 2, '#b88a20');
      for (let i = 0; i < 12; i++) { rc(f, x - 6, 12 + i * 5, 10 - (i > 7 ? i - 7 : 0), 5, i % 2 ? '#b02848' : '#8a1e3a'); rc(f, x + 30 + (i > 7 ? i - 7 : 0), 12 + i * 5, 10 - (i > 7 ? i - 7 : 0), 5, i % 2 ? '#b02848' : '#8a1e3a'); } rc(f, x - 8, 10, 50, 3, '#f0c838'); }
    const port = (x, y, fur) => { rc(f, x, y, 22, 26, '#f0c838'); rc(f, x + 1, y + 1, 20, 24, '#b88a20'); rc(f, x + 3, y + 3, 16, 20, '#2c3e6a'); rc(f, x + 6, y + 9, 9, 8, fur); rc(f, x + 7, y + 6, 6, 3, '#e0483a'); rc(f, x + 12, y + 11, 1, 1, '#1a1423'); rc(f, x + 15, y + 12, 2, 2, '#f0b030'); rc(f, x + 14, y + 14, 1, 2, '#e0483a'); rc(f, x + 5, y + 17, 12, 6, '#5c2e78'); };
    port(110, 30, '#f4f0f4'); port(150, 34, '#b8482a'); port(270, 30, '#f8d848');
    const colm = x => { rc(m, x, 10, 14, GY - 10, '#e4dcd0'); rc(m, x, 10, 3, GY - 10, '#a89cb0'); rc(m, x + 11, 10, 2, GY - 10, '#fff'); rc(m, x + 6, 10, 1, GY - 10, '#c4bac8'); rc(m, x - 3, 4, 20, 6, '#e4dcd0'); rc(m, x - 3, 9, 20, 1, '#a89cb0'); rc(m, x - 3, GY - 6, 20, 6, '#e4dcd0'); rc(m, x - 3, GY - 6, 20, 1, '#fff'); };
    colm(10); colm(170);
    const cand = x => { rc(m, x, GY - 40, 2, 40, '#b88a20'); rc(m, x - 6, GY - 40, 14, 2, '#f0c838'); rc(m, x - 3, GY - 2, 8, 2, '#f0c838'); for (const dx of [-6, 0, 6]) { rc(m, x + dx, GY - 46, 2, 6, '#f6f0dc'); rc(m, x + dx, GY - 49, 2, 3, '#f8a858'); rc(m, x + dx, GY - 50, 1, 1, '#fff4b8'); } };
    cand(90); cand(250);
    rc(m, 120, 0, 1, 14, '#b88a20'); rc(m, 104, 14, 33, 2, '#f0c838'); for (let i = 0; i < 5; i++) { rc(m, 105 + i * 7, 16, 3, 4, '#bfeaff'); rc(m, 106 + i * 7, 20, 1, 2, '#fff'); rc(m, 105 + i * 7, 11, 2, 3, '#f8a858'); }
    rc(m, 296, GY - 18, 12, 18, '#8a5a30'); rc(m, 294, GY - 20, 16, 3, '#b88a20'); for (let i = 0; i < 6; i++) rc(m, 294 + i * 3, GY - 30 + (i % 2) * 3, 3, 12, i % 2 ? '#3fa86a' : '#267848');
    rc(g, 0, 0, 32, 22, '#e6dece'); for (let y = 0; y < 22; y += 8) for (let x = (y / 8 % 2) * 8; x < 32; x += 16) rc(g, x, y, 8, 8, '#8c7c9c'); rc(g, 0, 0, 32, 2, '#fff');
    rc(g, 0, 6, 32, 10, '#b02848'); rc(g, 0, 6, 32, 1, '#f0c838'); rc(g, 0, 15, 32, 1, '#f0c838'); for (let x = 2; x < 32; x += 8) rc(g, x, 10, 3, 2, '#8a1e3a');
  }
  return { far, mid, fl, th: THEMES[theme] };
}
