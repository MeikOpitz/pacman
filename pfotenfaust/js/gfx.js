// PFOTENFAUST – Grafik: Palette, Pixel-Font, Figuren-Rig, Sprites
'use strict';
const W = 160, H = 144, GY = 122;           // Bildschirm, Bodenlinie
const FW = 72, FH = 64, OX = 36, OY = 58;   // Sprite-Frame + Ursprung (Füße)
const K = '#1a1423', WH = '#f6f0dc';

function newCv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- Pixel-Font 3x5 ----------
const FONT = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227',
  J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25573', R: '65655',
  S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71122', 8: '75757', 9: '75716',
  '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', ':': '02020', "'": '22000', '/': '11244',
  '+': '02720', '(': '12221', ')': '42224', 'Ä': '52755', 'Ö': '52552', 'Ü': '50557', '"': '55000', '>': '42124', '<': '12421',
  '*': '05250', '%': '51245'
};
function text(g, s, x, y, c, sc) {
  sc = sc || 1; g.fillStyle = c || WH; s = String(s).toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const f = FONT[s[i]];
    if (f) for (let r = 0; r < 5; r++) { const b = +f[r]; for (let q = 0; q < 3; q++) if (b & (4 >> q)) g.fillRect(x + q * sc, y + r * sc, sc, sc); }
    x += 4 * sc;
  }
}
function textW(s, sc) { return String(s).length * 4 * (sc || 1) - (sc || 1); }
function textC(g, s, cx, y, c, sc) { text(g, s, Math.round(cx - textW(s, sc) / 2), y, c, sc); }
function textO(g, s, x, y, c, sc, oc) { // mit Kontur
  for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) text(g, s, x + a * (sc > 1 ? 1 : 1), y + b, oc || K, sc);
  text(g, s, x, y, c, sc);
}
function textCO(g, s, cx, y, c, sc, oc) { textO(g, s, Math.round(cx - textW(s, sc) / 2), y, c, sc, oc); }

// ---------- Pixel-Maps ----------
function drawMap(g, rows, x, y, col) {
  for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r].length; q++) {
    const c = col[rows[r][q]]; if (c) { g.fillStyle = c; g.fillRect(x + q, y + r, 1, 1); }
  }
}
function outline(cv, oc) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height, d = g.getImageData(0, 0, w, h), a = d.data, m = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (a[i + 3]) continue;
    if ((x > 0 && a[i - 1] > 0) || (x < w - 1 && a[i + 7] > 0) || (y > 0 && a[i - w * 4 + 3] > 0) || (y < h - 1 && a[i + w * 4 + 3] > 0)) m.push(x, y);
  }
  g.fillStyle = oc || K; for (let i = 0; i < m.length; i += 2) g.fillRect(m[i], m[i + 1], 1, 1);
  return cv;
}
function flipCv(cv) { const c = newCv(cv.width, cv.height), g = c.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); return c; }
function flashCv(cv) { const c = newCv(cv.width, cv.height), g = c.getContext('2d'); g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return c; }
function mapCv(rows, col, noOutline) {
  const c = newCv(rows[0].length + 2, rows.length + 2); drawMap(c.getContext('2d'), rows, 1, 1, col);
  return noOutline ? c : outline(c);
}

// ---------- Köpfe ----------
const HEADS = {
  rex: { ax: 5, ov: 2, m: [
    '..d.....d.....',
    '.dfd...dfd....',
    '.dpd...dpd....',
    '.dfffffffd....',
    'dffffffffff...',
    'dfwkfffwkfll..',
    'dfwkfddwkllln.',
    'dfffddddlllll.',
    '.ffdddllllkl..',
    '.fffddlllll...',
    '..fffflppl....',
    '...ffffff.....'] },
  bruno: { ax: 6, ov: 2, m: [
    '.dd.......dd..',
    'dddfffffffddd.',
    'ddffffffffddd.',
    '.ffdfffffdff..',
    '.fwkfffffwkf..',
    '.fwkfdddfwkf..',
    '.ffflnnnnlff..',
    '.flllllkllllf.',
    '.flwllkkkllwf.',
    '.fllllllllllf.',
    '..ffllllllff..',
    '...ffffffff...'] },
  lotte: { ax: 5, ov: 2, m: [
    '.ff......ff...',
    '.fpf....fpfaa.',
    '.fpff..ffpaaa.',
    '.ffffffffffa..',
    'fffffflfffff..',
    'ffwkfllfwkff..',
    'ffwkflllwkfl..',
    'fflllllllllln.',
    '.fllllllllll..',
    '.ffllllkklll..',
    '..fflllppll...',
    '...ffllll.....'] },
  cat: { ax: 5, ov: 2, m: [
    '.f.......f...',
    '.ff.....ff...',
    '.fpf...fpf...',
    '.fffffffff...',
    'fffdfffdffff.',
    'ffeekffeekff.',
    'ffeekffeekff.',
    'ffffflnlffff.',
    'fffllllkllff.',
    '.fflllllllf..',
    '..fffffffff..'] },
  big: { ax: 8, ov: 3, m: [
    '.ff..........ff...',
    '.fff........fff...',
    '.fpff......ffpf...',
    '.fpfffffffffffpf..',
    '.fffffffffffffff..',
    'ffffdfffffffdffff.',
    'fffeeekffffeeekff.',
    'fffeeekffffeeekff.',
    'fffffffflnlffffff.',
    'ffffflllllllllfff.',
    '.ffflllkkkklllff..',
    '.fffflllllllfff...',
    '..ffffffffffff....',
    '...ffffffffff.....'] }
};

// ---------- Rig ----------
function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(OX + Math.round(x), OY + Math.round(y), w, h); }
function limb(g, x0, y0, x1, y1, t, c) {
  g.fillStyle = c; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1), o = t >> 1;
  for (let i = 0; i <= n; i++) g.fillRect(OX + Math.round(x0 + (x1 - x0) * i / n) - o, OY + Math.round(y0 + (y1 - y0) * i / n) - o, t, t);
}
function weapon(g, S, hx, hy, ang) {
  const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), L = S.wl || 9, ex = hx + dx * L, ey = hy + dy * L;
  switch (S.weapon) {
    case 'bone': limb(g, hx, hy, ex, ey, 2, WH); R(g, ex - 1 - dy * 1.5, ey - 1 + dx * 1.5, 2, 2, WH); R(g, ex - 1 + dy * 1.5, ey - 1 - dx * 1.5, 2, 2, WH); break;
    case 'fish': limb(g, hx, hy, ex, ey, 1, WH);
      for (let i = 3; i < L; i += 2) { const px = hx + dx * i, py = hy + dy * i; limb(g, px - dy * 2, py + dx * 2, px + dy * 2, py - dx * 2, 1, '#cfd6e0'); }
      R(g, ex - 1, ey - 1, 3, 3, WH); break;
    case 'blade': limb(g, hx, hy, ex, ey, 1, '#dfe8f0'); limb(g, hx - dy * 2, hy + dx * 2, hx + dy * 2, hy - dx * 2, 1, '#e0b030'); break;
    case 'cane': limb(g, hx - dx * 3, hy - dy * 3, ex, ey, 1, '#30243a'); R(g, ex - 1, ey - 1, 2, 2, '#f0c838'); break;
    case 'claw': R(g, hx + 2, hy - 2, 2, 1, WH); R(g, hx + 3, hy, 2, 1, WH); R(g, hx + 2, hy + 2, 2, 1, WH); break;
  }
}
function drawChar(g, S, P) {
  const ps = S.ps || 1, LH = S.lh, TH = S.th, TW = S.tw, at = S.at || 3, lt = S.lt || 3;
  const bob = (P.bob || 0) * ps, hx = (P.hx || 0), lean = (P.lean || 0) * ps;
  const hipY = -LH + bob, shY = hipY - TH, shX = hx + lean, bx = hx - (TW >> 1);
  const sc = v => [v[0] * ps, v[1] * ps];
  const fb = sc(P.fb || [-3, 0]), ff = sc(P.ff || [3, 0]), hb = sc(P.hb || [-2, 5]), hf = sc(P.hf || [4, 4]);
  const tp = P.tail || 0;
  // Schwanz
  if (S.tail === 'cat') { limb(g, bx, hipY - 2, bx - 4 * ps, hipY, 2, S.fur); limb(g, bx - 4 * ps, hipY, bx - 6 * ps, hipY - 4 - tp, 2, S.fur); limb(g, bx - 6 * ps, hipY - 4 - tp, bx - 5 * ps + tp, hipY - 8 * ps - tp, 2, S.furD); }
  else if (S.tail === 'dog') { limb(g, bx, hipY - 2, bx - 3, hipY - 4 - tp, 2, S.fur); limb(g, bx - 3, hipY - 4 - tp, bx - 3 + tp, hipY - 7 - tp, 2, S.tip || S.furD); }
  else if (S.tail === 'stub') R(g, bx - 2, hipY - 4 - tp, 3, 2, S.fur);
  if (S.cape) for (let r = 0; r < TH + 4; r++) R(g, bx - 2 - (r >> 1) - (r > 4 ? tp : 0), shY + 1 + r, 4 + (r >> 1), 1, r % 4 === 3 ? S.capeD : S.cape);
  // hinterer Arm
  const bsx = shX - (TW >> 1) + 2, bsy = shY + 3;
  limb(g, bsx, bsy, bsx + hb[0], bsy + hb[1], at, S.sleeveD); R(g, bsx + hb[0] - 1, bsy + hb[1] - 1, at, at, S.glove ? S.gloveD : S.furD);
  // hinteres Bein
  limb(g, hx - 2, hipY, hx + fb[0], fb[1] - 2, lt, S.pantsD); R(g, hx + fb[0] - 1, fb[1] - 2, lt + 2, 2, S.furD);
  // Rumpf
  for (let r = 0; r < TH; r++) {
    const xo = Math.round(lean * (1 - r / (TH - 1))), y = shY + r, x = bx + xo;
    R(g, x, y, TW, 1, S.cloth); R(g, x, y, 2, 1, S.clothD);
    if (S.belly && r > 1) R(g, x + TW - 4, y, 3, 1, S.light);
    if (S.stripe && r % 3 === 1) R(g, x + 2, y, TW - 2, 1, S.stripe);
    if (r === TH - 1 && S.belt) R(g, x, y, TW, 1, S.belt);
    if (r < 2 && S.collar) R(g, x + 1, y, TW - 1, 1, S.collar);
  }
  // vorderes Bein
  limb(g, hx + 2, hipY, hx + ff[0], ff[1] - 2, lt, S.pants); R(g, hx + ff[0] - 1, ff[1] - 2, lt + 2, 2, S.paw);
  // Kopf
  const Hd = HEADS[S.head], hX = OX + Math.round(shX + (P.hdx || 0) * ps) - Hd.ax, hY = OY + Math.round(shY + (P.hdy || 0) * ps) - Hd.m.length + Hd.ov;
  drawMap(g, Hd.m, hX, hY, S.hc);
  if (S.acc) S.acc(g, hX, hY);
  // vorderer Arm + Waffe
  const fsx = shX + (TW >> 1) - 2, fsy = shY + 3, ax = fsx + hf[0], ay = fsy + hf[1];
  if (P.wa != null && S.weapon && S.weapon !== 'claw') weapon(g, S, ax, ay, P.wa);
  limb(g, fsx, fsy, ax, ay, at, S.sleeve);
  if (S.glove) R(g, ax - 2, ay - 2, at + 2, at + 1, S.glove); else R(g, ax - 1, ay - 1, at, at, S.paw);
  if (P.wa != null && S.weapon === 'claw') weapon(g, S, ax, ay, 0);
}

const POSES = {
  idle: [{ tail: 0, hf: [5, 2], hb: [3, 4] }, { bob: 1, tail: 1, hf: [5, 3], hb: [3, 5] }],
  walk: [
    { ff: [5, 0], fb: [-4, 0], hf: [-1, 5], hb: [4, 4] },
    { ff: [1, 0], fb: [0, -2], bob: -1, hf: [2, 6], hb: [1, 6], tail: 1 },
    { ff: [-4, 0], fb: [5, 0], hf: [5, 3], hb: [-3, 5] },
    { ff: [0, -2], fb: [1, 0], bob: -1, hf: [2, 6], hb: [1, 6], tail: 1 }],
  atk1: [{ lean: -1, hf: [-2, -4], wa: -125, hb: [3, 3] }, { lean: 2, ff: [5, 0], hf: [9, 0], wa: 5, hb: [-3, 4], hdx: 1 }],
  atk2: [{ hf: [1, -7], wa: -80, hb: [3, 3], bob: -1 }, { lean: 2, ff: [5, 0], hf: [8, 3], wa: 40, hb: [-4, 3], bob: 1, hdx: 1 }],
  atk3: [{ bob: 3, lean: -1, hf: [1, 5], wa: 70, hb: [-3, 4], ff: [4, 0], fb: [-4, 0] }, { bob: -1, lean: 2, hf: [7, -7], wa: -55, hb: [-4, 5], ff: [4, 0], hdx: 1, tail: 1 }],
  jump: [{ ff: [3, -3], fb: [-3, -1], hf: [4, -5], hb: [-3, -4], tail: 1 }],
  jatk: [{ ff: [10, -3], fb: [-3, -4], lean: -2, hf: [-1, -3], hb: [-5, -1], tail: 1, wa: -100 }],
  duck: [{ bob: 5, ff: [5, 0], fb: [-5, 0], hf: [5, 2], hb: [3, 3] }],
  datk: [{ bob: 5, ff: [5, 0], fb: [-5, 0], hf: [0, -2], hb: [3, 3], wa: -110 }, { bob: 5, lean: 1, ff: [6, 0], fb: [-5, 0], hf: [9, 2], hb: [-2, 3], wa: 10 }],
  hurt: [{ lean: -3, hdx: -1, hdy: 1, hf: [1, -6], hb: [-5, -3], ff: [4, 0], fb: [-3, 0], bob: 1 }],
  thr: [{ lean: -1, hf: [-4, -6], hb: [4, 3] }, { lean: 2, hf: [8, -2], hb: [-3, 4], ff: [5, 0], hdx: 1 }],
  win: [{ hf: [2, -9], hb: [-1, -9], tail: 1 }, { bob: 1, hf: [3, -8], hb: [-2, -8] }],
  bark: [{ lean: 2, hdx: 2, hdy: -1, hf: [-3, 4], hb: [-6, 3], ff: [5, 0], fb: [-4, 0], tail: 1 }],
  wind: [{ lean: -2, bob: 1, hf: [-3, -5], hb: [-4, 2], wa: -140, tail: 1 }],
  dash: [{ lean: 3, hdx: 2, hf: [8, 1], hb: [-5, 2], ff: [6, -1], fb: [-6, -1], wa: 0 }],
  pant: [{ bob: 3, lean: 2, hdy: 2, hf: [3, 7], hb: [0, 7] }, { bob: 4, lean: 2, hdy: 3, hf: [3, 7], hb: [0, 7] }]
};

function buildFrames(S) {
  const F = {};
  const mk = (P, rot) => {
    let c = newCv(FW, FH); drawChar(c.getContext('2d'), S, P);
    if (rot) { const d = newCv(FW, FH), g = d.getContext('2d'); g.translate(OX, OY - 5); g.rotate(-Math.PI / 2); g.drawImage(c, -OX + 12, -OY + 2); c = d; }
    outline(c); const l = flipCv(c); return [c, l, flashCv(c), flashCv(l)];
  };
  for (const n in POSES) F[n] = POSES[n].map(p => mk(p));
  F.ko = [mk(POSES.hurt[0], true)];
  if (S.extra) S.extra(F, mk);
  S.F = F; return S;
}

// ---------- Charaktere ----------
function dogSpec(o) { return Object.assign({ lh: 7, th: 9, tw: 9, tail: 'dog' }, o); }
const SPECS = {};
function defSpecs() {
  const hc = (f, d, l, x) => Object.assign({ f, d, l, k: K, w: WH, p: '#f09aa8', n: '#30202a', e: '#f4e04a' }, x || {});
  SPECS.rex = dogSpec({ head: 'rex', fur: '#c98a3e', furD: '#7d4c26', light: '#f2dca4', paw: '#f2dca4', hc: hc('#c98a3e', '#5a3a26', '#f2dca4'),
    cloth: '#3f78b8', clothD: '#28508a', sleeve: '#c98a3e', sleeveD: '#7d4c26', pants: '#c98a3e', pantsD: '#7d4c26', belt: '#28508a', collar: '#e0403a',
    weapon: 'bone', wl: 9, tip: '#5a3a26' });
  SPECS.bruno = dogSpec({ head: 'bruno', tw: 11, lh: 6, tail: 'stub', at: 4, lt: 4, fur: '#e2c494', furD: '#9a7650', light: '#fff2d6', paw: '#fff2d6',
    hc: hc('#e2c494', '#6e5440', '#fff2d6', { n: '#30202a' }), cloth: '#c23a3a', clothD: '#8a2430', sleeve: '#e2c494', sleeveD: '#9a7650',
    pants: '#3a4a8a', pantsD: '#262f60', belt: '#f0c838', glove: '#e8483a', gloveD: '#a02a30' });
  SPECS.lotte = dogSpec({ head: 'lotte', tw: 8, th: 8, lh: 6, fur: '#f08c32', furD: '#b25c1c', light: '#fff4e0', paw: '#fff4e0',
    hc: hc('#f08c32', '#b25c1c', '#fff4e0', { a: '#f04a8a' }), cloth: '#3fa86a', clothD: '#267848', sleeve: '#3fa86a', sleeveD: '#267848',
    pants: '#f08c32', pantsD: '#b25c1c', belt: '#267848', tip: '#fff4e0' });
  const cat = o => Object.assign({ lh: 7, th: 9, tw: 9, tail: 'cat', head: 'cat', weapon: 'claw' }, o);
  const P1 = '#8a4aa8', P2 = '#5c2e78';
  SPECS.thug = cat({ fur: '#8e96b4', furD: '#5a6082', light: '#dde2f0', paw: '#dde2f0', hc: hc('#8e96b4', '#5a6082', '#dde2f0'),
    cloth: P1, clothD: P2, sleeve: P1, sleeveD: P2, pants: '#8e96b4', pantsD: '#5a6082', belt: '#2a2038' });
  SPECS.thrower = cat({ fur: '#c2a070', furD: '#86663e', light: '#f2e4c4', paw: '#f2e4c4', hc: hc('#c2a070', '#86663e', '#f2e4c4', { e: '#7ae05a' }),
    cloth: '#c2a070', clothD: '#86663e', belly: 1, sleeve: '#c2a070', sleeveD: '#86663e', pants: P1, pantsD: P2, belt: P2, collar: P1, stripe: 0,
    acc: (g, x, y) => { g.fillStyle = P1; g.fillRect(x, y + 3, 11, 1); g.fillRect(x + 1, y + 4, 4, 1); g.fillStyle = P2; g.fillRect(x + 2, y + 5, 3, 2); } });
  SPECS.jumper = cat({ fur: '#44405e', furD: '#2a2740', light: '#8a86a8', paw: '#8a86a8', hc: hc('#44405e', '#2a2740', '#8a86a8', { e: '#ff6a4a', p: '#6a5a80' }),
    cloth: '#2a2740', clothD: '#1e1b30', sleeve: '#2a2740', sleeveD: '#1e1b30', pants: '#2a2740', pantsD: '#1e1b30', belt: '#d83a4a', collar: '#d83a4a',
    acc: (g, x, y) => { g.fillStyle = '#d83a4a'; g.fillRect(x, y + 3, 11, 1); g.fillRect(x - 2, y + 3, 2, 1); g.fillRect(x - 3, y + 4, 2, 1); } });
  SPECS.fat = cat({ tw: 14, th: 11, lh: 6, at: 4, lt: 4, fur: '#ecdcbc', furD: '#7a5c48', light: '#fff8e8', paw: '#7a5c48',
    hc: hc('#ecdcbc', '#7a5c48', '#fff8e8', { e: '#6ac8f0', p: '#7a5c48' }), cloth: P1, clothD: P2, sleeve: P1, sleeveD: P2, pants: '#2a2038', pantsD: '#1a1423',
    belt: '#f0c838', stripe: P2, weapon: null });
  const boss = o => Object.assign({ lh: 9, th: 12, tw: 13, at: 4, lt: 4, ps: 1.35, tail: 'cat', head: 'big' }, o);
  SPECS.kalle = boss({ tw: 15, fur: '#e08a3a', furD: '#9a5220', light: '#f8e2b8', paw: '#f8e2b8', hc: hc('#e08a3a', '#9a5220', '#f8e2b8', { e: '#b8f04a' }),
    cloth: '#e08a3a', clothD: '#9a5220', belly: 1, stripe: '#9a5220', sleeve: '#e08a3a', sleeveD: '#9a5220', pants: P1, pantsD: P2, belt: '#2a2038',
    weapon: 'fish', wl: 15,
    acc: (g, x, y) => { g.clearRect(x + 13, y, 2, 2); g.fillStyle = '#f8e2b8'; g.fillRect(x + 10, y + 4, 1, 5); g.fillRect(x + 9, y + 5, 3, 1); g.fillRect(x + 9, y + 7, 3, 1); } });
  SPECS.graete = boss({ fur: '#6e7c8c', furD: '#44505e', light: '#d4dce4', paw: '#d4dce4', hc: hc('#6e7c8c', '#44505e', '#d4dce4', { e: '#f4e04a' }),
    cloth: '#2c3e6a', clothD: '#1c2848', sleeve: '#2c3e6a', sleeveD: '#1c2848', pants: '#e8e0d0', pantsD: '#a8a090', belt: '#d83a4a', collar: '#f0c838',
    weapon: 'blade', wl: 13,
    acc: (g, x, y) => { g.fillStyle = '#1c1828'; g.fillRect(x - 1, y - 2, 19, 4); g.fillRect(x + 2, y - 6, 13, 4); g.fillRect(x + 4, y - 8, 9, 2); g.fillStyle = '#f0c838'; g.fillRect(x - 1, y + 1, 19, 1);
      g.fillStyle = WH; g.fillRect(x + 7, y - 5, 3, 2); g.fillRect(x + 8, y - 3, 1, 1); g.fillStyle = '#1c1828'; g.fillRect(x + 10, y + 5, 5, 4); g.fillRect(x + 6, y + 4, 11, 1); } });
  SPECS.schatten = boss({ lh: 9, th: 11, tw: 11, fur: '#34304c', furD: '#201d34', light: '#34304c', paw: '#6a6690', hc: hc('#34304c', '#201d34', '#34304c', { e: '#ff4a6a', p: '#201d34', n: '#201d34', k: '#34304c' }),
    cloth: '#201d34', clothD: '#15132a', sleeve: '#201d34', sleeveD: '#15132a', pants: '#201d34', pantsD: '#15132a', belt: '#8a4aa8', collar: '#8a4aa8',
    weapon: 'blade', wl: 14,
    acc: (g, x, y) => { g.fillStyle = '#8a4aa8'; g.fillRect(x, y + 4, 17, 1); g.fillRect(x - 3, y + 4, 3, 1); g.fillRect(x - 4, y + 5, 2, 2); } });
  SPECS.baron = boss({ fur: '#f4f0f4', furD: '#b4aac4', light: '#ffffff', paw: '#ffffff', hc: hc('#f4f0f4', '#b4aac4', '#ffffff', { e: '#5ad0f0', p: '#f09aa8' }),
    cloth: '#5c2e78', clothD: '#3c1a54', sleeve: '#5c2e78', sleeveD: '#3c1a54', pants: '#2a2038', pantsD: '#1a1423', belt: '#f0c838', collar: '#f6f0dc',
    cape: '#b02848', capeD: '#7a1830', weapon: 'cane', wl: 13,
    acc: (g, x, y) => { g.fillStyle = '#1c1828'; g.fillRect(x + 1, y - 1, 15, 2); g.fillRect(x + 4, y - 8, 9, 7); g.fillStyle = '#b02848'; g.fillRect(x + 4, y - 3, 9, 2);
      g.fillStyle = '#f0c838'; g.fillRect(x + 10, y + 5, 6, 1); g.fillRect(x + 10, y + 9, 6, 1); g.fillRect(x + 10, y + 5, 1, 5); g.fillRect(x + 15, y + 5, 1, 5); g.fillRect(x + 16, y + 9, 1, 4); } });
  for (const k in SPECS) buildFrames(SPECS[k]);
}

// ---------- Kleine Sprites ----------
const SPR = {};
function defSprites() {
  const c = { w: WH, k: K, y: '#c8e03a', g: '#8aa820', r: '#e0483a', R: '#a02a30', o: '#f0a030', b: '#b4bcc8', B: '#6e7c8c', p: '#e878a8', P: '#a84878',
    n: '#8a5a30', N: '#5a3a20', d: '#44505e', s: '#f0c838', S: '#b88a20', h: '#f09aa8', l: '#5ad0f0', v: '#8a4aa8', V: '#5c2e78', t: '#d8b070', m: '#3fa86a' };
  SPR.ball = mapCv(['.yy.', 'ywyy', 'yywg', '.gg.'], c);
  SPR.fishbone = mapCv(['w..w.w.ww', '.wwwwwwww', 'w..w.w.ww'], c);
  SPR.shur = [mapCv(['..b..', '.bb..', 'bbkbb', '..bb.', '..b..'], c), mapCv(['b...b', '.b.b.', '..k..', '.b.b.', 'b...b'], c)];
  SPR.yarn = [mapCv(['.ppp.', 'pPppp', 'ppPpp', 'pppPp', '.ppp.'], c), mapCv(['.ppp.', 'pppPp', 'ppPpp', 'pPppp', '.ppp.'], c)];
  SPR.anchor = mapCv(['..bb..', '.b..b.', '..bb..', '..bb..', 'b.bb.b', 'b.bb.b', '.bbbb.'], c);
  SPR.wurst = mapCv(['.rrrrr..', 'rrorrrrn', 'rRRRRRRn', '.RRRRR..'], c);
  SPR.bone = mapCv(['ww....ww', 'wwwwwwww', 'wwwwwwww', 'ww....ww'], c);
  SPR.keks = mapCv(['.tttt.', 'ttntNt', 'tttttt', 'tNttnt', 'ttnttt', '.tttt.'], c);
  SPR.gold = mapCv(['ss......ss', 'sswwssssss', 'ssssssssSS', 'SS......SS'], c);
  SPR.can = mapCv(['..bbbbbbbb..', '.bBBBBBBBBb.', 'bbbbbbbbbbbb', '.BbBbBBbBbB.', '.BbBbBBbBbd.', '.BbBbBBbBbd.', '.BbBbBBbBbd.', '.BbBbBBbBbd.', '.BbBbBBbBbd.', '.BbBbBBbBbd.', '.BBBBBBBBdd.', '.dddddddddd.'], c);
  SPR.crate = mapCv(['nnnnnnnnnnnn', 'nttttttttttN', 'ntnttttttntN', 'nttnttttnttN', 'ntttnttntttN', 'nttttnntttN'.padEnd(12, 'N'), 'nttttnntttN'.padEnd(12, 'N'), 'ntttnttntttN', 'nttnttttnttN', 'ntnttttttntN', 'nttttttttttN', 'NNNNNNNNNNNN'], c);
  SPR.vase = mapCv(['..llll..', '...ll...', '..llll..', '.llwlll.', 'llwlllll', 'llllllll', 'lllllldl', '.lllldd.', '..llll..', '.dddddd.'], c);
  SPR.heart = mapCv(['rr.rr', 'rwrrr', 'rrrrr', '.rrr.', '..r..'], c, true);
  SPR.paw = mapCv(['.w.w.w.', '.w.w.w.', '.......', '.wwwww.', 'wwwwwww', 'wwwwwww', '.wwwww.'], { w: WH }, true);
  SPR.star = [mapCv(['.s.', 'sws', '.s.'], c, true), mapCv(['s.s', '.w.', 's.s'], c, true)];
  SPR.poof = [mapCv(['.ww.', 'wwww', 'wwww', '.ww.'], c, true), mapCv(['.w..w.', 'w....w', '......', 'w....w', '.w..w.'], c, true)];
  // Saugroboter (klein, 2 Frames) – eine Katze sitzt drauf
  const vac = f => { const cv = newCv(FW, FH), g = cv.getContext('2d');
    R(g, -11, -6, 22, 4, '#dfe6ee'); R(g, -9, -8, 18, 2, '#f6f8fa'); R(g, -11, -3, 22, 2, '#8e9aa8'); R(g, -12, -4, 1, 2, '#8e9aa8'); R(g, 11, -4, 1, 2, '#8e9aa8');
    R(g, 7, -6, 3, 1, f ? '#e0483a' : '#5ad0f0'); R(g, -9 + f * 2, -1, 3, 1, K); R(g, 5 - f * 2, -1, 3, 1, K); R(g, 10, -2, 3, 1, '#f0a030');
    const t = newCv(FW, FH); drawChar(t.getContext('2d'), SPECS.thug, { bob: 4, ff: [5, 0], fb: [-4, 0], hf: [6, 2], hb: [-3, 3], tail: f });
    g.globalCompositeOperation = 'destination-over'; g.drawImage(t, 0, -7); g.globalCompositeOperation = 'source-over';
    outline(cv); const l = flipCv(cv); return [cv, l, flashCv(cv), flashCv(l)]; };
  SPR.vac = [vac(0), vac(1)];
  // SAUGNATOR (Boss)
  const sg = (f, open) => { const cv = newCv(FW, FH), g = cv.getContext('2d');
    R(g, -24, -16, 48, 12, '#c8d2de'); R(g, -22, -19, 44, 3, '#e8eef4'); R(g, -24, -5, 48, 3, '#6e7c8c'); R(g, -26, -12, 2, 8, '#6e7c8c'); R(g, 24, -12, 2, 8, '#6e7c8c');
    R(g, -20, -14, 40, 1, '#f6f8fa'); R(g, -18, -9, 8, 3, '#5c2e78'); R(g, -8, -9, 3, 3, f ? '#e0483a' : '#f0c838'); R(g, -3, -9, 3, 3, f ? '#f0c838' : '#e0483a');
    R(g, 14, -13 - open * 1, 12, 7 + open * 2, '#2a2038'); if (open) { R(g, 16, -12, 2, 2, WH); R(g, 20, -12, 2, 2, WH); R(g, 16, -7, 2, 2, WH); R(g, 20, -7, 2, 2, WH); R(g, 24, -10, 2, 2, '#e0483a'); }
    R(g, -20 + f * 3, -2, 6, 2, K); R(g, -4 + f * 3, -2, 6, 2, K); R(g, 12 - f * 3, -2, 6, 2, K); R(g, 22, -3, 6, 2, '#f0a030'); R(g, 26, -2 - f, 3, 1, '#f0a030');
    // Glaskuppel + Pilotin
    const t = newCv(FW, FH); drawChar(t.getContext('2d'), SPECS.jumper, { bob: 5, hf: [6, 1], hb: [-2, 3], tail: f });
    g.globalCompositeOperation = 'destination-over'; g.drawImage(t, -4, -18); R(g, -16, -34, 24, 16, 'rgba(120,220,255,0.35)'); g.globalCompositeOperation = 'source-over';
    R(g, -16, -35, 24, 1, '#bfeaff'); R(g, -17, -34, 1, 15, '#bfeaff'); R(g, 8, -34, 1, 15, '#bfeaff'); R(g, -14, -32, 2, 5, '#ffffff');
    R(g, -22, -24, 2, 6, '#8e9aa8'); R(g, -23, -27, 4, 3, f ? '#e0483a' : '#ff9a8a');
    outline(cv); const l = flipCv(cv); return [cv, l, flashCv(cv), flashCv(l)]; };
  SPR.saug = { idle: [sg(0, 0), sg(1, 0)], open: [sg(0, 1), sg(1, 1)] };
}

function spr(g, fr, x, y, face, flash) { g.drawImage(fr[(face < 0 ? 1 : 0) + (flash ? 2 : 0)], Math.round(x) - OX, Math.round(y) - OY); }
function sprC(g, cv, x, y) { g.drawImage(cv, Math.round(x - cv.width / 2), Math.round(y - cv.height / 2)); }
function sprB(g, cv, x, y) { g.drawImage(cv, Math.round(x - cv.width / 2), Math.round(y - cv.height + 1)); }
