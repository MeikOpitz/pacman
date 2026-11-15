// FUNKELFUCHS – Grafik: Palette, Pixel-Font, Sprites, Kacheln, Hintergründe (alles im Code gezeichnet)
'use strict';
const VW = 240, VH = 160, TS = 16;
const PAL = {
  k: '#2a1830', o: '#f08838', O: '#c85c20', w: '#fff2dc', W: '#ffffff', s: '#38c0b0', S: '#1c8c84', p: '#f8a8b0', P: '#d86888',
  r: '#e85048', R: '#a82840', y: '#ffd850', Y: '#e0a020', g: '#60c858', G: '#2c8848', b: '#60a8f0', B: '#3468c0',
  v: '#a878e0', V: '#6c44a8', n: '#b07848', N: '#784830', a: '#e8b070', l: '#d0d0e0', L: '#9098b8', d: '#606888', x: '#8890a8', c: '#a8e8f8'
};
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function spr(rows, pal) {
  const h = rows.length, w = rows[0].length, c = mkc(w, h), x = c.getContext('2d');
  rows.forEach((r, j) => { if (r.length !== w) console.warn('sprite row width', j, r); for (let i = 0; i < w; i++) { const ch = r[i]; if (ch === '.') continue; x.fillStyle = (pal && pal[ch]) || PAL[ch] || '#f0f'; x.fillRect(i, j, 1, 1); } });
  const f = mkc(w, h), fx = f.getContext('2d'); fx.translate(w, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
  const u = mkc(w, h), ux = u.getContext('2d'); ux.translate(0, h); ux.scale(1, -1); ux.drawImage(c, 0, 0);
  return { r: c, l: f, u, w, h };
}

// ---------- Pixel-Font 3x5 ----------
const FONT = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227',
  J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25573', R: '65655',
  S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71122', 8: '75757', 9: '75716',
  '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', ':': '02020', "'": '22000', '/': '11244',
  '+': '02720', '(': '12221', ')': '42224', 'Ä': '52755', 'Ö': '52552', 'Ü': '50557', '"': '55000', '>': '42124', '<': '12421', '*': '05250', '%': '51245'
};
const WIDE = { M: [5, 17, 27, 21, 17, 17], W: [5, 17, 17, 21, 27, 17], N: [4, 9, 13, 11, 9, 9] };
const glyph = ch => WIDE[ch] || (FONT[ch] ? [3, +FONT[ch][0], +FONT[ch][1], +FONT[ch][2], +FONT[ch][3], +FONT[ch][4]] : null);
function text(g, s, x, y, c, sc) { sc = sc || 1; s = String(s).toUpperCase(); x = Math.round(x); y = Math.round(y); g.fillStyle = c;
  for (let i = 0; i < s.length; i++) { const f = glyph(s[i]); if (!f) { x += 4 * sc; continue; } const w = f[0];
    for (let r = 0; r < 5; r++) for (let q = 0; q < w; q++) if (f[r + 1] & (1 << (w - 1 - q))) g.fillRect(x + q * sc, y + r * sc, sc, sc); x += (w + 1) * sc; } }
function textW(s, sc) { sc = sc || 1; s = String(s).toUpperCase(); let n = 0; for (let i = 0; i < s.length; i++) n += (WIDE[s[i]] ? WIDE[s[i]][0] : 3) + 1; return n * sc - sc; }
function textO(g, s, x, y, c, sc, oc) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) text(g, s, x + i, y + j, oc || PAL.k, sc); text(g, s, x, y, c, sc); }
function textCO(g, s, cx, y, c, sc, oc) { textO(g, s, Math.round(cx - textW(s, sc) / 2), y, c, sc, oc); }

// ---------- Sprites ----------
const FOXTOP = [
  '......k.....k...',
  '.....kok...kok..',
  '.....kpok.kpok..',
  '.....kookkkook..',
  '....kooooooooook',
  '....kooooooooook',
  '....kooookookook',
  '....kwwookwokwwk',
  '.....kwwwwwwkkwk',
  '......kkwwwwwwk.',
  '.kk...ksssssk...',
  'kWWk.kSsooook...',
  'kWook.koowwok...',
  '.kOookkoowwok...',
  '..kOooooowwok...'];
const FOXHURT = FOXTOP.slice(); FOXHURT[6] = '....koookkokkook'; FOXHURT[7] = '....kwwokookokwk';
const LEGS = {
  idle: ['...kkkkoooook...', '......kok.kok...', '......kkk.kkk...'],
  runA: ['...kkkkoooook...', '.....kok...kok..', '....kkk....kkk..'],
  runB: ['...kkkkoooook...', '.......kokok....', '.......kkkkk....'],
  jump: ['...kkkkoooookk..', '....kkok...kok..', '....kkk.....kk..'],
  fall: ['..kkkkkoooook...', '......kok.kok...', '.....kkk...kkk..']
};
const SP = {};
for (const k in LEGS) SP['fox_' + k] = spr(FOXTOP.concat(LEGS[k]));
SP.fox_hurt = spr(FOXHURT.concat(LEGS.jump));
SP.umb = spr([
  '......kkkk......',
  '...kkkrwwrkkk...',
  '..krrrwwwwrrrk..',
  '.krrrwwwwwwrrrk.',
  'krrrrwwwwwwrrrrk',
  'kRRkkwwkkwwkkRRk',
  '.kk..kk.nk.kk.kk',
  '........nk......',
  '........nk......']);
SP.knurps = spr([
  '....kkkkkkkk....',
  '..kkvvvvvvvvkk..',
  '.kvvvvvvvvvvvvk.',
  '.kvvvvvvvvvvvvk.',
  'kvvkkvvvvvvkkvvk',
  'kvvWkkvvvvkkWvvk',
  'kvvWkWvvvvWkWvvk',
  'kvvWWWvvvvWWWvvk',
  'kVvvvvvvvvvvvvVk',
  'kVVvvvkkkkvvvVVk',
  '.kVVVvvvvvvVVVk.',
  '..kkkkkkkkkkkk..',
  '.kyyyk....kyyyk.',
  '.kkkkk....kkkkk.']);
SP.knurps2 = spr(SP_shift([
  '....kkkkkkkk....',
  '..kkvvvvvvvvkk..',
  '.kvvvvvvvvvvvvk.',
  '.kvvvvvvvvvvvvk.',
  'kvvkkvvvvvvkkvvk',
  'kvvWkkvvvvkkWvvk',
  'kvvWkWvvvvWkWvvk',
  'kvvWWWvvvvWWWvvk',
  'kVvvvvvvvvvvvvVk',
  'kVVvvvkkkkvvvVVk',
  '.kVVVvvvvvvVVVk.',
  '..kkkkkkkkkkkk..',
  '..kyyyk..kyyyk..',
  '..kkkkk..kkkkk..']));
function SP_shift(r) { return r; }
SP.piek = spr([
  '..l...l..l...l..',
  '.klk.klkklk.klk.',
  '.kLkkkLkkLkkkLk.',
  'kkrrrrrrrrrrrrkk',
  'krrrrrrrrrrrrrrk',
  'krrWkrrrrrrkWrrk',
  'krrWkrrrrrrkWrrk',
  'krrrrrrrrrrrrrrk',
  'kRrrrrkkkkrrrrRk',
  'kRRrrrrrrrrrrRRk',
  '.kRRRRRRRRRRRRk.',
  '..kkkkkkkkkkkk..',
  '.kyyk......kyyk.',
  '.kkkk......kkkk.']);
SP.flatA = spr([
  'kk............kk',
  'kbk..........kbk',
  'kbbk..kkkk..kbbk',
  'kbbbkkbbbbkkbbbk',
  'kBbbbkbbbbkbbbBk',
  '.kBbbkWkkWkbbBk.',
  '..kkBkWkkWkBkk..',
  '....kbbbbbbk....',
  '....kbbrrbbk....',
  '.....kBBBBk.....',
  '......kkkk......']);
SP.flatB = spr([
  '................',
  '................',
  '......kkkk......',
  '.kkkkkbbbbkkkkk.',
  'kbbbbkbbbbkbbbbk',
  'kbbbbkWkkWkbbbbk',
  'kBbbkkWkkWkkbbBk',
  'kBbk.kbbbbk.kbBk',
  'kBk..kbrrbk..kBk',
  'kk....kBBk....kk',
  '......kkkk......']);
const HOP = [
  '..kkk......kkk..',
  '.kWWWk....kWWWk.',
  '.kWkWkkkkkkWkWk.',
  '.kggggggggggggk.',
  'kggggggggggggggk',
  'kgggkggggggkgggk',
  'kggggkkkkkkggggk',
  'kGggggggggggggGk',
  '.kGGwwwwwwwwGGk.'];
SP.hopsi = spr(HOP.concat(['kgGkkkkkkkkkkGgk', 'kggk........kggk', 'kkkk........kkkk']));
SP.hopsiJ = spr(HOP.concat(['.kGkkkkkkkkkkGk.', '.kgk........kgk.', '.kgk........kgk.', '.kkk........kkk.']));
SP.spuck = spr([
  '....kkkkkk......',
  '..kkppppppkk....',
  '.kppppppppppkkk.',
  '.kppWkpppppprrk.',
  '.kppWkppppprkkk.',
  '.kpppppppppprrk.',
  '.kPppppppppkkk..',
  '..kPPppppPk.....',
  '...kkkkkkk......',
  '.....kgGk.......',
  '..kk.kgGk.kk....',
  '.kggkkgGkkggk...',
  '.kGggkgGkggGk...',
  '..kGggggggGk....',
  '...kkGggGkk.....',
  '.....kkkk.......']);
SP.nuss = spr([
  '....kkkkkkkk....',
  '..kknnnnnnnnkk..',
  '.knnannnnnnNnnk.',
  '.knannnnnnnnNnk.',
  'knnnnnnnnnnnnnnk',
  'kNNNNNNNNNNNNNNk',
  'kkwwwwwwwwwwwwkk',
  '.kwwkwwwwwwkwwk.',
  '.kwwkwwwwwwkwwk.',
  '.kwwwwwkkwwwwwk.',
  '..kwwwwwwwwwwk..',
  '...kkkkkkkkkk...',
  '..kyyk....kyyk..',
  '..kkkk....kkkk..']);
SP.nut = spr([
  '....kkkkkkkk....',
  '..kknnnnnnnnkk..',
  '.knnannnnnnNnnk.',
  '.knannnnnnnnNnk.',
  'knnnnnnnnnnnnnnk',
  'knnnnnnnnnnnnnnk',
  'kNNNNNNNNNNNNNNk',
  'kNnnnnnnnnnnnnNk',
  '.kNnnnnnnnnnnNk.',
  '.kNNnnnnnnnnNNk.',
  '..kkNNNNNNNNkk..',
  '....kkkkkkkk....']);
SP.coin = spr([
  '....kk....',
  '...kyyk...',
  '...kyyk...',
  '.kkyWyykk.',
  'kyyWWyyyyk',
  'kyyyyyyYYk',
  '.kkyyyYkk.',
  '...kyYk...',
  '...kYYk...',
  '....kk....']);
SP.shard = spr([
  '....kkkkk.....',
  '..kkWWWWWkk...',
  '.kWWWWkkkkWk..',
  '.kWWWk....kk..',
  'kWWWk.........',
  'kWWck.........',
  'kWWck.........',
  'kWWck.........',
  'kWWck.........',
  'kWWWck........',
  '.kWWck....kk..',
  '.kWWcckkkkck..',
  '..kkWccccck...',
  '....kkkkkk....']);
SP.shardS = spr(['.kkk..', 'kWWkk.', 'kWk...', 'kWk...', 'kWckk.', '.kkk..']);
SP.shardE = spr(['.kkk..', 'kddkk.', 'kdk...', 'kdk...', 'kddkk.', '.kkk..']);
SP.heart = spr(['.kk.kk.', 'krrkrrk', 'krWrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...']);
SP.heartE = spr(['.kk.kk.', 'kddkddk', 'kdddddk', 'kdddddk', '.kdddk.', '..kdk..', '...k...']);
SP.berry = spr([
  '.....kk.....',
  '..kkkgGkkk..',
  '.kggkGkggGk.',
  '..kkrrrrkk..',
  '.krrWrrrrrk.',
  'krrWrrrrrrRk',
  'krrrrrrrrrRk',
  'krrrrrrrrRRk',
  '.krrrrrrRRk.',
  '..kkRRRRkk..',
  '....kkkk....']);
SP.crate = spr([
  'kkkkkkkkkkkkkkkk', 'kaaaaaaaaaaaaaak', 'kaNnnnnnnnnnnNak', 'kanNnnnnnnnnNnak', 'kannNnnnnnnNnnak', 'kannnNnnnnNnnnak', 'kannnnNnnNnnnnak', 'kannnnnNNnnnnnak',
  'kannnnnNNnnnnnak', 'kannnnNnnNnnnnak', 'kannnNnnnnNnnnak', 'kannNnnnnnnNnnak', 'kanNnnnnnnnnNnak', 'kaNnnnnnnnnnnNak', 'kaaaaaaaaaaaaaak', 'kkkkkkkkkkkkkkkk']);
const BONUS = [
  'kkkkkkkkkkkkkkkk', 'kWyyyyyyyyyyyyYk', 'kyyyyyyyyyyyyyYk', 'kyykyyyWWyyykyYk', 'kyyyyyyWWyyyyyYk', 'kyyyyyWWWWyyyyYk', 'kyyyWWWWWWWWyyYk', 'kyyWWWWWWWWWWyYk',
  'kyyyWWWWWWWWyyYk', 'kyyyyyWWWWyyyyYk', 'kyyyyyyWWyyyyyYk', 'kyyyyyyWWyyyyyYk', 'kyykyyyyyyyykyYk', 'kyyyyyyyyyyyyyYk', 'kYYYYYYYYYYYYYYk', 'kkkkkkkkkkkkkkkk'];
SP.bonus = spr(BONUS);
SP.bonus2 = spr(BONUS, { W: '#fff8c0', y: '#ffe478' });
SP.used = spr(BONUS, { y: '#b89878', W: '#a08060', Y: '#806048' });
SP.spring = spr([
  '................', '................',
  '..kkkk....kkkk..',
  '.kbbbbkkkkbbbbk.',
  'kbbWbbbbbbbbWbbk',
  'kbbbbbbyybbbbbbk',
  'kBbbbbyyyybbbbBk',
  '.kBBbbbyybbbBBk.',
  '..kkBBBBBBBBkk..',
  '....kkkggkkk....',
  '......kggk......',
  '..kk..kggk..kk..',
  '.kggk.kGgk.kggk.',
  '.kGggkkGgkkggGk.',
  '..kGggGGGGggGk..',
  '...kkkkkkkkkk...']);
const LAMP = ['...kkkk...', '..kNNNNk..', '.kkkkkkkk.', '.kxxxxxxk.', '.kxWxxxxk.', '.kxxxxxxk.', '.kxxxxxxk.', '.kxxxxxxk.', '.kkkkkkkk.', '..kNNNNk..', '...kkkk...']
  .concat(Array(10).fill('...knnk...'), ['..kknnkk..', '.knnnnnnk.', '.kkkkkkkk.']);
SP.lamp0 = spr(LAMP); SP.lamp1 = spr(LAMP, { x: '#ffe870', W: '#ffffff' });
SP.seed = spr(['.kkkk.', 'kgggGk', 'kgWgGk', 'kgggGk', 'kGGGGk', '.kkkk.']);
SP.bolt = spr(['...kkk', '..kyyk', '.kyyk.', 'kyykkk', 'kyyyyk', '.kkyyk', '..kyk.', '.kyk..', '.kk...']);
SP.fhead = spr(['.k....k.', 'kok..kok', 'kookkook', 'koooooook'.slice(0, 8), 'kokookok', 'kwwkkwwk', '.kwwwwk.', '..kkkk..']);

// Pixelpuffer-Helfer für prozedurale Sprites
function PB(w, h) { const d = Array.from({ length: h }, () => Array(w).fill('.'));
  return { w, h, d,
    set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) d[y][x] = c; },
    disc(cx, cy, r, c, f) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && (!f || f(x, y))) this.set(x, y, c); },
    rect(x, y, ww, hh, c) { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) this.set(i, j, c); },
    outline(c) { const m = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => d[y + b] && d[y + b][x + a] && d[y + b][x + a] !== '.')) m.push([x, y]); m.forEach(([x, y]) => d[y][x] = c); return this; },
    rows() { return d.map(r => r.join('')); } }; }
function mkPlat(w, kind) { const b = PB(w, 10);
  if (kind === 'cloud') { for (let x = 4; x < w - 3; x += 7) b.disc(x, 5, 4, 'W'); b.rect(3, 5, w - 6, 3, 'W'); for (let x = 3; x < w - 3; x++) if (b.d[7][x] === 'W') b.d[7][x] = 'l'; }
  else { b.rect(1, 1, w - 2, 7, 'n'); b.rect(1, 1, w - 2, 2, 'a'); b.rect(1, 6, w - 2, 2, 'N'); for (let x = 9; x < w - 4; x += 12) { b.rect(x, 3, 1, 3, 'N'); } b.set(3, 4, 'N'); b.set(w - 4, 4, 'N'); }
  return spr(b.outline('k').rows()); }
SP.plat = mkPlat(48, 'log'); SP.platC = mkPlat(48, 'cloud'); SP.platS = mkPlat(32, 'log'); SP.platCS = mkPlat(32, 'cloud');
(function () { // Grummel, die Gewitterwolke
  const b = PB(52, 34);
  [[13, 20, 10], [26, 14, 12], [39, 20, 10], [20, 22, 9], [32, 22, 9]].forEach(([x, y, r]) => b.disc(x, y, r, 'L'));
  for (let y = 0; y < 34; y++) for (let x = 0; x < 52; x++) if (b.d[y][x] === 'L') { if (y > 24 || (y > 21 && (x + y) % 2)) b.d[y][x] = 'd'; }
  [[18, 8, 3], [28, 6, 3]].forEach(([x, y, r]) => b.disc(x, y, r, 'l', (i, j) => b.d[j] && b.d[j][i] === 'L'));
  SP.boss = spr(b.outline('k').rows());
  SP.bossH = spr(b.rows(), { L: '#ffffff', d: '#f0d0d8', l: '#ffffff' });
})();

// ---------- Themen ----------
const THEMES = {
  meadow: { sky: ['#78b8f8', '#98ccf8', '#b8e0f8', '#d8f0f8'], g1: '#70d850', g2: '#38a840', g3: '#a8f070', d1: '#e0a060', d2: '#b87840', d3: '#f0c080', st: ['#c8c8d8', '#9098b0', '#e8e8f0'], cloudPlat: 0 },
  forest: { sky: ['#48a058', '#58b060', '#70c068', '#88d078'], g1: '#48c868', g2: '#208850', g3: '#88e888', d1: '#c89060', d2: '#986840', d3: '#e0b080', st: ['#b0b8a0', '#788868', '#d8e0c0'], cloudPlat: 0 },
  cave: { sky: ['#2c2048', '#382858', '#443068', '#503878'], g1: '#b888e8', g2: '#7850b8', g3: '#e0b8f8', d1: '#8068a8', d2: '#584880', d3: '#a088c8', st: ['#9890b8', '#686090', '#c0b8e0'], cloudPlat: 0 },
  sky: { sky: ['#f8a8a0', '#f8c0a0', '#f8d8b0', '#f8ecc8'], g1: '#f8f8ff', g2: '#b8c0e8', g3: '#ffffff', d1: '#d8e0f8', d2: '#a8b0e0', d3: '#f0f4ff', st: ['#e8c8d8', '#b890b0', '#f8e8f0'], cloudPlat: 1 },
  night: { sky: ['#182048', '#202858', '#283468', '#344078'], g1: '#58b8a8', g2: '#287878', g3: '#90e0c8', d1: '#7078a8', d2: '#484c80', d3: '#9098c8', st: ['#8088b0', '#505880', '#a8b0d8'], cloudPlat: 0 }
};
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

// Statische Kachel-Ebene eines Levels vorzeichnen
function renderTiles(L) {
  const T = THEMES[L.theme], c = mkc(L.W * TS, L.H * TS), g = c.getContext('2d'), K = PAL.k;
  const at = (x, y) => x < 0 || x >= L.W ? '#' : y < 0 ? ' ' : y >= L.H ? '#' : L.t[y][x];
  const gr = (x, y) => at(x, y) === '#';
  for (let ty = 0; ty < L.H; ty++) for (let tx = 0; tx < L.W; tx++) {
    const ch = L.t[ty][tx], x = tx * TS, y = ty * TS;
    if (ch === '#') {
      const up = !gr(tx, ty - 1), lf = !gr(tx - 1, ty), rt = !gr(tx + 1, ty), dn = !gr(tx, ty + 1);
      R(g, x, y, TS, TS, T.d1);
      for (let i = 0; i < 5; i++) { const px = Math.floor(hash(tx * 7 + i, ty * 13) * 14) + 1, py = Math.floor(hash(tx * 3 + i, ty * 5 + 9) * 14) + 1; R(g, x + px, y + py, i < 3 ? 2 : 1, 1, i % 2 ? T.d2 : T.d3); }
      if (lf) { R(g, x, y, 1, TS, K); R(g, x + 1, y, 1, TS, T.d3); }
      if (rt) { R(g, x + 15, y, 1, TS, K); R(g, x + 14, y, 1, TS, T.d2); }
      if (dn) { R(g, x, y + 15, TS, 1, K); R(g, x + (lf ? 1 : 0), y + 14, TS - (lf ? 1 : 0) - (rt ? 1 : 0), 1, T.d2); }
      if (up) {
        R(g, x, y, TS, 1, K); R(g, x, y + 1, TS, 2, T.g3); R(g, x, y + 3, TS, 3, T.g1);
        for (let i = 0; i < TS; i++) { const s = [0, 1, 2, 2, 1, 0, 0, 1][(i + tx * 16) % 8]; R(g, x + i, y + 6, 1, s, T.g1); R(g, x + i, y + 6 + s, 1, 1, T.g2); }
        if (lf) { R(g, x, y, 1, 9, K); g.clearRect(x, y, 1, 1); R(g, x + 1, y + 1, 1, 1, K); R(g, x + 1, y, 1, 1, K); g.clearRect(x, y, 1, 1); }
        if (rt) { R(g, x + 15, y, 1, 9, K); g.clearRect(x + 15, y, 1, 1); R(g, x + 14, y + 1, 1, 1, K); R(g, x + 14, y, 1, 1, K); }
      }
    } else if (ch === 'S') {
      R(g, x, y, TS, TS, K); R(g, x + 1, y + 1, 14, 14, T.st[0]); R(g, x + 1, y + 1, 14, 2, T.st[2]); R(g, x + 1, y + 1, 2, 14, T.st[2]); R(g, x + 1, y + 13, 14, 2, T.st[1]); R(g, x + 13, y + 1, 2, 14, T.st[1]);
      R(g, x + 4, y + 4, 2, 2, T.st[1]); R(g, x + 10, y + 10, 2, 2, T.st[1]); R(g, x + 10, y + 4, 2, 1, T.st[2]);
    } else if (ch === '=') {
      const lf = at(tx - 1, ty) !== '=', rt = at(tx + 1, ty) !== '=';
      if (T.cloudPlat) { R(g, x, y, TS, 7, '#ffffff'); R(g, x, y, TS, 1, K); R(g, x, y + 5, TS, 2, '#c8d0f0'); R(g, x, y + 7, TS, 1, K); for (let i = 2; i < 16; i += 8) R(g, x + i, y + 7, 4, 2, '#c8d0f0'), R(g, x + i, y + 9, 4, 1, K), R(g, x + i - 1, y + 7, 1, 2, K), R(g, x + i + 4, y + 7, 1, 2, K); }
      else { R(g, x, y, TS, 7, PAL.n); R(g, x, y, TS, 1, K); R(g, x, y + 1, TS, 2, PAL.a); R(g, x, y + 5, TS, 1, PAL.N); R(g, x, y + 6, TS, 1, K); R(g, x + 7, y + 3, 1, 2, PAL.N); if (!lf && !rt && (tx % 3 === 0)) R(g, x + 3, y + 7, 2, 9, PAL.N); }
      if (lf) { R(g, x, y, 1, 7, K); g.clearRect(x, y, 1, 1); g.clearRect(x, y + 6, 1, 1); if (!T.cloudPlat) { R(g, x + 3, y + 7, 3, 6, PAL.N); R(g, x + 2, y + 7, 1, 6, K); R(g, x + 6, y + 7, 1, 6, K); R(g, x + 3, y + 13, 3, 1, K); } }
      if (rt) { R(g, x + 15, y, 1, 7, K); g.clearRect(x + 15, y, 1, 1); g.clearRect(x + 15, y + 6, 1, 1); if (!T.cloudPlat) { R(g, x + 10, y + 7, 3, 6, PAL.N); R(g, x + 9, y + 7, 1, 6, K); R(g, x + 13, y + 7, 1, 6, K); R(g, x + 10, y + 13, 3, 1, K); } }
    } else if (ch === '^') {
      for (let i = 0; i < 4; i++) { const bx = x + i * 4; for (let j = 0; j < 7; j++) { const w = j < 2 ? 0 : j < 5 ? 1 : 2; if (j === 0) { R(g, bx + 1, y + 9, 2, 1, K); continue; } R(g, bx + 1 - Math.min(1, w), y + 9 + j, 2 + Math.min(1, w) * 2, 1, j < 3 ? '#f0f0f8' : j < 5 ? '#c0b0d0' : '#806890'); R(g, bx + 1 - Math.min(1, w) - 0, y + 9 + j, 1, 1, K); R(g, bx + 2 + Math.min(1, w), y + 9 + j, 1, 1, K); } }
    }
    // Deko auf Grasnarbe
    if (ch === ' ' && gr(tx, ty + 1) && L.theme !== 'sky') { const h = hash(tx, ty + 77);
      if (h < 0.16) { const cl = [['#f8f8ff', '#ffd850'], ['#f8a8b0', '#ffffff'], ['#ffd850', '#f08838']][Math.floor(h * 100) % 3]; const fx = x + 3 + Math.floor(h * 60) % 8; R(g, fx, y + 11, 1, 5, T.g2); R(g, fx - 1, y + 9, 3, 3, cl[0]); R(g, fx, y + 10, 1, 1, cl[1]); }
      else if (h < 0.4) { const fx = x + Math.floor(h * 40) % 9; R(g, fx, y + 13, 1, 3, T.g2); R(g, fx + 2, y + 12, 1, 4, T.g1); R(g, fx + 4, y + 14, 1, 2, T.g2); }
    }
  }
  return c;
}

// ---------- Hintergründe (256 breit, kachelbar) ----------
function makeBG(theme) {
  const T = THEMES[theme], BW = 256, far = mkc(BW, VH), near = mkc(BW, VH), f = far.getContext('2d'), n = near.getContext('2d');
  // Himmel mit gerasterten Bändern
  const bands = [0, 44, 80, 112, 160];
  for (let i = 0; i < 4; i++) { R(f, 0, bands[i], BW, bands[i + 1] - bands[i], T.sky[i]); if (i) for (let x = 0; x < BW; x++) { if (x % 2 === 0) R(f, x, bands[i] - 2, 1, 1, T.sky[i]); if (x % 4 === 1) R(f, x, bands[i] - 4, 1, 1, T.sky[i]); if (x % 2 === 1) R(f, x, bands[i] + 1, 1, 1, T.sky[i - 1]); } }
  const hills = (g, base, amp, col, line, ph, k1, k2) => { for (let x = 0; x < BW; x++) { const a = x / BW * Math.PI * 2, y = Math.round(base - amp * (0.6 * Math.sin(a * k1 + ph) + 0.4 * Math.sin(a * k2 + ph * 2.3))); R(g, x, y, 1, VH - y, col); R(g, x, y, 1, 1, line); } };
  const cloud = (g, cx, cy, s, col, sh) => { const b = [[0, 0, 9], [-11, 3, 6], [11, 2, 7], [-5, -4, 6], [6, -5, 6], [18, 5, 4], [-17, 5, 4]]; for (let wrap = -BW; wrap <= BW; wrap += BW) b.forEach(([dx, dy, r]) => { r *= s; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); if (dy * s + y > 5 * s) continue; R(g, Math.round(cx + wrap + dx * s - w), Math.round(cy + dy * s + y), w * 2, 1, dy * s + y > 2 * s ? sh : col); } }); };
  if (theme === 'meadow') {
    cloud(f, 50, 34, 1.2, '#ffffff', '#e0ecf8'); cloud(f, 170, 22, 0.9, '#ffffff', '#e0ecf8'); cloud(f, 230, 58, 0.7, '#f0f8ff', '#d8e8f8');
    hills(f, 112, 16, '#a8dcc0', '#88c8a8', 0.5, 1, 3); hills(f, 128, 12, '#88d0a0', '#68b888', 2.1, 2, 3);
    hills(n, 138, 14, '#68c870', '#3c9850', 1.0, 2, 5); for (let x = 0; x < BW; x += 4) for (let y = 130; y < VH; y += 4) if (hash(x, y) < 0.25) { const im = n.getImageData(x, y, 1, 1).data; if (im[3]) R(n, x, y, 2, 1, '#88dc80'); }
  } else if (theme === 'forest') {
    for (let i = 0; i < 9; i++) { const cx = i * 31 + 8, cy = 30 + hash(i, 1) * 50; for (let wrap = -BW; wrap <= BW; wrap += BW) for (let y = -22; y <= 22; y++) { const w = Math.floor(18 * Math.sqrt(1 - (y / 22) ** 2)); R(f, cx + wrap - w, Math.round(cy + y), w * 2, 1, i % 2 ? '#68b868' : '#60ac60'); } }
    for (let i = 0; i < 12; i++) { const x = Math.floor(hash(i, 5) * BW), y = Math.floor(hash(i, 6) * 110) + 10; R(f, x, y, 5, 2, '#c8e870'); R(f, x + 1, y - 1, 3, 4, '#c8e870'); R(f, x + 2, y, 1, 2, '#88c050'); }
    hills(f, 132, 8, '#389050', '#287840', 0.3, 2, 4);
    [[20, 22], [92, 16], [150, 26], [214, 18]].forEach(([x, w]) => { R(n, x, 0, w, VH, '#2c7048'); R(n, x, 0, 2, VH, '#1c5838'); R(n, x + w - 4, 0, 4, VH, '#246040'); for (let y = 10; y < VH; y += 22) R(n, x + 5, y + (x % 7), w - 12, 1, '#246040'); });
    hills(n, 148, 6, '#286840', '#1c5030', 1.2, 3, 5);
  } else if (theme === 'cave') {
    for (let x = 0; x < BW; x++) { const a = x / BW * Math.PI * 2, h = Math.round(26 + 14 * Math.sin(a * 3) + 8 * Math.sin(a * 7 + 1) + 5 * Math.abs(Math.sin(a * 13))); R(f, x, 0, 1, h, '#221838'); R(f, x, h, 1, 1, '#5c4488'); }
    hills(f, 124, 12, '#3c2c60', '#5c4488', 0.7, 2, 5);
    [[30, 100, '#78e0f0'], [84, 116, '#f098e0'], [140, 96, '#a8f0c0'], [200, 110, '#78e0f0'], [236, 122, '#f098e0']].forEach(([x, y, c]) => { for (let j = 0; j < 22; j++) { const w = j < 8 ? Math.ceil(j / 2) : 4; R(f, x - w, y + j, w * 2, 1, c); R(f, x - w, y + j, Math.max(1, w - 1), 1, '#ffffff'); } R(f, x + 6, y + 8, 3, 14, c); });
    for (let x = 0; x < BW; x++) { const a = x / BW * Math.PI * 2, h = Math.round(10 + 9 * Math.sin(a * 4 + 2) + 7 * Math.abs(Math.sin(a * 9))); R(n, x, 0, 1, h, '#181028'); R(n, x, h, 1, 1, '#443068'); }
    hills(n, 146, 8, '#281c44', '#443068', 2.2, 3, 4);
  } else if (theme === 'sky') {
    R(f, 196, 26, 22, 22, '#fff4d0'); for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) if ((x - 10.5) ** 2 + (y - 10.5) ** 2 > 110) R(f, 196 + x, 26 + y, 1, 1, T.sky[0]);
    cloud(f, 40, 70, 1.6, '#fce0d8', '#f4c8c8'); cloud(f, 140, 96, 2.0, '#fce8e0', '#f4d0d0'); cloud(f, 220, 60, 1.1, '#fce0d8', '#f4c8c8');
    cloud(n, 60, 142, 2.4, '#ffffff', '#f0dce8'); cloud(n, 180, 150, 2.8, '#ffffff', '#f0dce8'); cloud(n, 120, 158, 2.0, '#fff4f4', '#f0dce8');
  } else {
    for (let i = 0; i < 70; i++) { const x = Math.floor(hash(i, 3) * BW), y = Math.floor(hash(i, 4) * 120); R(f, x, y, 1, 1, i % 5 ? '#a8b8e8' : '#ffffff'); if (i % 9 === 0) { R(f, x - 1, y, 3, 1, '#ffffff'); R(f, x, y - 1, 1, 3, '#ffffff'); } }
    for (let y = 0; y < 26; y++) for (let x = 0; x < 26; x++) { const d = (x - 12.5) ** 2 + (y - 12.5) ** 2; if (d < 150 && (x - 18) ** 2 + (y - 9) ** 2 > 120) R(f, 40 + x, 20 + y, 1, 1, '#fff8d8'); }
    hills(f, 126, 10, '#1c2c58', '#34488c', 0.4, 1, 4);
    [[60, 70, 18], [176, 90, 14]].forEach(([x, y, w]) => { R(n, x, y, w, VH, '#141c40'); R(n, x - 3, y - 4, w + 6, 5, '#141c40'); for (let i = 0; i < w + 6; i += 6) R(n, x - 3 + i, y - 8, 3, 4, '#141c40'); for (let j = y + 10; j < VH; j += 18) R(n, x + (w >> 1) - 1, j, 3, 5, '#ffd850'); });
    hills(n, 146, 6, '#10183c', '#283468', 1.8, 2, 5);
  }
  return { far, near, BW };
}
