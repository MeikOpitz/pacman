// FUNKELFUCHS – Level (per Baukasten beschrieben, nicht als Pixelkarte)
// g(len, höhe) legt Boden; alle folgenden Platzierungen sind relativ zu diesem Abschnitt:
// dx = Spalten ab Abschnittsanfang, a = Kacheln über der Bodenoberfläche (0 = steht auf dem Boden)

function buildLevel(i) {
  const def = LEVELS[i], H = 14, cols = [], ents = [], post = [];
  let o = 0, gh = 3, W = 0;
  const row = a => H - gh - 1 - a;
  const api = {
    g(len, h) { o = W; if (h) gh = h; for (let k = 0; k < len; k++) cols.push(h); W += len; },
    P(dx, a, w) { const x = o, r = row(a); post.push(t => { for (let k = 0; k < w; k++) t[r][x + dx + k] = '='; }); },
    S(dx, a, w, h) { const x = o, r = row(a); post.push(t => { for (let j = 0; j < (h || 1); j++) for (let k = 0; k < w; k++) if (t[r - j]) t[r - j][x + dx + k] = 'S'; }); },
    K(dx, a, s) { const x = o, r = row(a); post.push(t => { for (let k = 0; k < s.length; k++) if (s[k] !== ' ') t[r][x + dx + k] = s[k]; }); },
    T(dx, n, a) { const x = o, r = row(a || 0); post.push(t => { for (let k = 0; k < n; k++) t[r][x + dx + k] = '^'; }); },
    C(dx, a, n) { for (let k = 0; k < (n || 1); k++) ents.push({ k: 'coin', x: (o + dx + k) * TS + 3, y: row(a) * TS + 3 }); },
    A(dx, a, n) { for (let k = 0; k < n; k++) ents.push({ k: 'coin', x: (o + dx + k) * TS + 3, y: row(a) * TS + 3 - Math.round(Math.sin(k / (n - 1) * Math.PI) * 18) }); },
    E(k, dx, a, opt) { ents.push(Object.assign({ k, x: (o + dx) * TS, y: row(a || 0) * TS }, opt || {})); },
    M(dx, a, mode, range, opt) { ents.push(Object.assign({ k: 'plat', x: (o + dx) * TS, y: (row(a) + 1) * TS, mode, range: range * TS }, opt || {})); },
    F(dx, a) { ents.push({ k: 'spring', x: (o + dx) * TS, y: row(a || 0) * TS }); },
    Z(dx, a) { ents.push({ k: 'shard', x: (o + dx) * TS + 1, y: row(a) * TS + 1 }); },
    Q(dx, a) { ents.push({ k: 'check', x: (o + dx) * TS + 3, y: row(a || 0) * TS - 8 }); },
    G(dx) { ents.push({ k: 'goal', x: (o + dx) * TS, y: row(0) * TS - 32 }); },
    X(dx, opt) { ents.push(Object.assign({ k: 'boss', x: (o + dx) * TS, y: row(5) * TS, ax: o * TS, aw: 17 * TS, gy: (H - gh) * TS }, opt || {})); }
  };
  def.build(api);
  const t = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => y >= H - cols[x] ? '#' : ' '));
  post.forEach(f => f(t));
  let n = 0; ents.forEach(e => { if (e.k === 'shard') e.id = n++; });
  return { i, name: def.name, theme: def.theme, music: def.music, W, H, t, ents, start: { x: 2 * TS, y: (H - cols[2]) * TS - 14 }, arena: def.arena };
}
const LEVELS = [
  { name: 'MORGENWIESE', theme: 'meadow', music: 'l1', build(b) { with (b) {
    g(12, 3); C(7, 1, 3);
    g(12, 3); K(3, 3, 'B?B'); E('knurps', 9);
    g(3, 0); A(0, 2, 3);
    g(10, 3); E('knurps', 6); P(2, 2, 3); C(2, 3, 3);
    g(8, 4); K(3, 3, '?H?'); E('knurps', 6);
    g(4, 0); A(0, 2, 4); Z(1, 4);
    g(14, 4); E('nuss', 5); K(8, 0, 'BB'); K(8, 1, 'BB'); E('knurps', 12); C(10, 1, 3);
    g(6, 6); C(1, 1, 4); Z(4, 4); F(1);
    g(10, 3); Q(2); E('piek', 7); K(4, 3, 'B?B');
    g(3, 0); M(0, 0, 'h', 0, { w: 48 });
    g(9, 3); E('hopsi', 5); P(1, 2, 3); P(5, 4, 3); C(5, 5, 3);
    g(6, 5); E('knurps', 3);
    g(5, 0); M(1, 0, 'v', 2); A(0, 3, 5);
    g(12, 5); E('nuss', 4); E('knurps', 8); E('knurps', 10); K(5, 3, '?');
    g(8, 3); T(2, 3); P(1, 2, 5); C(2, 3, 3); S(7, 0, 1, 2);
    g(4, 0); A(0, 2, 4);
    g(12, 3); F(2); P(5, 5, 4); Z(6, 6); E('flatter', 8, 3); K(9, 3, 'BHB');
    g(3, 5); g(3, 7); C(0, 1, 3);
    g(14, 3); A(0, 4, 5); E('knurps', 8); G(10); } } },
  { name: 'KISTENHÜGEL', theme: 'meadow', music: 'l1', build(b) { with (b) {
    g(10, 3); C(5, 1, 3);
    g(8, 3); K(2, 0, 'BBB'); K(3, 1, 'BB'); K(4, 2, 'B'); E('knurps', 7);
    g(6, 5); E('nuss', 2); K(1, 3, '?B?');
    g(9, 5); K(0, 0, 'B'); K(0, 1, 'B'); E('knurps', 3); E('knurps', 5); E('knurps', 7);
    g(4, 0); A(0, 2, 4);
    g(10, 4); P(1, 2, 3); P(5, 4, 3); P(1, 6, 3); C(5, 5, 3); C(1, 7, 3); Z(2, 8); E('piek', 7);
    g(3, 0); A(0, 2, 3);
    g(12, 3); Q(1); E('hopsi', 5); K(7, 3, 'BHB'); E('knurps', 10);
    g(6, 0); M(0, 0, 'v', 2, { w: 32 }); M(3, 2, 'v', -2, { w: 32 }); A(0, 4, 6);
    g(8, 5); E('nuss', 2); E('knurps', 5); S(7, 0, 1, 2);
    g(10, 3); K(1, 0, 'BBB'); K(1, 1, 'B B'); K(1, 2, 'BBB'); Z(2, 1); T(5, 3); P(5, 2, 4); E('flatter', 7, 5); F(9);
    g(5, 6); C(1, 1, 3);
    g(4, 0); P(0, 2, 3); Z(1, 4);
    g(12, 3); E('knurps', 3); E('piek', 6); K(8, 3, '?B?');
    g(4, 5); E('hopsi', 2);
    g(13, 3); A(0, 4, 5); E('nuss', 5); G(9); } } },
  { name: 'FLÜSTERWALD', theme: 'forest', music: 'l2', build(b) { with (b) {
    g(12, 3); C(6, 1, 4); E('hopsi', 10);
    g(8, 5); K(3, 3, '?B?'); E('piek', 5);
    g(4, 0); M(0, 1, 'h', 1);
    g(10, 5); E('spucker', 8); C(2, 1, 3); P(3, 2, 3);
    g(3, 0); A(0, 2, 3);
    g(12, 3); E('nuss', 3); E('knurps', 7); E('knurps', 9); S(11, 0, 1, 3); K(5, 3, 'B?HB');
    g(8, 3); F(0); P(3, 5, 5); C(3, 6, 5); Z(7, 8); E('flatter', 5, 3);
    g(5, 0); M(0, 0, 'v', 3); M(3, 2, 'h', 0, { w: 32 });
    g(10, 6); Q(2); E('hopsi', 6); C(4, 1, 4);
    g(6, 0); M(0, 0, 'f', 0, { w: 32 }); M(3, 1, 'f', 0, { w: 32 }); A(0, 3, 6);
    g(12, 4); E('piek', 4); E('piek', 9); P(2, 2, 3); P(7, 2, 3); C(2, 3, 3); C(7, 3, 3);
    g(10, 4); T(3, 4); P(2, 2, 2); P(6, 2, 2); K(4, 5, '?'); E('flatter', 5, 4);
    g(4, 6); E('spucker', 2);
    g(5, 0); M(1, 0, 'v', -2, { w: 32 }); Z(2, -1);
    g(12, 3); E('nuss', 3); E('hopsi', 7); E('knurps', 10); K(4, 3, 'BB?BB');
    g(4, 5); g(4, 7); C(0, 1, 3); F(3);
    g(6, 0); A(0, 4, 6);
    g(8, 3); P(-4, 9, 4); Z(-3, 10);
    g(14, 3); E('piek', 4); A(2, 3, 4); G(10); } } },
  { name: 'WIPFELWEG', theme: 'forest', music: 'l2', build(b) { with (b) {
    g(8, 4); C(4, 1, 3);
    g(14, 2); T(1, 12); P(0, 3, 3); P(5, 4, 3); P(10, 3, 3); P(3, 1, 2); P(8, 1, 2); C(5, 5, 3); E('hopsi', 11, 4);
    g(6, 5); E('piek', 3); K(2, 3, '?');
    g(10, 0); M(0, 0, 'h', 2); M(6, 1, 'h', -2, { w: 32 }); A(2, 3, 6);
    g(8, 6); Q(2); E('spucker', 5);
    g(16, 2); T(0, 16); P(1, 5, 2); P(5, 6, 3); P(10, 5, 2); P(13, 7, 3); P(3, 2, 2); P(8, 2, 2); C(5, 7, 3); Z(14, 9); E('flatter', 8, 8);
    g(8, 7); E('nuss', 3); E('knurps', 6); K(4, 3, 'BHB');
    g(6, 0); M(0, 0, 'f', 0, { w: 32 }); M(3, 0, 'f', 0, { w: 32 }); A(0, 2, 6);
    g(10, 7); E('hopsi', 3); E('hopsi', 7); F(9);
    g(6, 11); C(1, 1, 4); Z(4, 2);
    g(8, 0); A(0, 0, 8); P(3, -4, 2);
    g(12, 3); E('piek', 4); E('knurps', 8); K(5, 3, '?B?');
    g(10, 3); T(3, 4); P(1, 2, 2); P(7, 2, 2); Z(5, 5);
    g(14, 3); E('spucker', 3); A(5, 3, 4); G(10); } } },
  { name: 'GLITZERGROTTE', theme: 'cave', music: 'l3', build(b) { with (b) {
    g(10, 4); C(5, 1, 3);
    g(8, 3); E('flatter', 4, 2); K(3, 3, '?H?');
    g(3, 0); A(0, 2, 3);
    g(10, 3); T(4, 2); E('piek', 8); P(2, 2, 5); C(3, 3, 3);
    g(6, 5); E('spucker', 4);
    g(6, 0); M(0, 0, 'f', 0, { w: 32 }); M(3, 0, 'f', 0, { w: 32 }); A(0, 2, 6);
    g(10, 5); E('nuss', 3); E('knurps', 6); E('knurps', 8); S(9, 0, 1, 2);
    g(10, 2); T(1, 8); P(0, 2, 2); P(4, 3, 2); P(8, 2, 2); C(4, 4, 2); Z(4, 6); E('flatter', 6, 5);
    g(8, 4); Q(2); E('hopsi', 6); K(4, 3, 'B?B');
    g(7, 0); M(0, 0, 'h', 4);
    g(6, 4); E('piek', 3); F(5);
    g(8, 8); C(1, 1, 5); E('spucker', 6); P(2, 2, 2); Z(2, 5);
    g(4, 0); A(0, 2, 4);
    g(12, 5); T(5, 2); E('nuss', 2); E('hopsi', 9); K(7, 3, '?B?');
    g(6, 0); M(0, 0, 'v', 3, { w: 32 }); M(3, 3, 'v', -3, { w: 32 }); Z(4, 6);
    g(10, 8); E('piek', 3); E('flatter', 6, 2); C(4, 1, 4);
    g(5, 0); A(0, 1, 5);
    g(8, 3); E('knurps', 3); E('knurps', 5); K(2, 3, 'BHB');
    g(12, 3); A(1, 3, 4); G(8); } } },
  { name: 'WOLKENPFAD', theme: 'sky', music: 'l4', build(b) { with (b) {
    g(10, 4); C(5, 1, 3);
    g(5, 0); A(0, 2, 5);
    g(6, 4); E('knurps', 3); K(2, 3, '?');
    g(8, 0); P(1, 0, 2); P(5, 1, 2); C(1, 1, 2); C(5, 2, 2); E('flatter', 3, 3);
    g(7, 5); E('hopsi', 4); F(6);
    g(9, 0); A(1, 6, 7); P(4, 1, 2);
    g(8, 5); E('piek', 3); E('piek', 6); K(3, 3, 'BHB');
    g(8, 0); M(0, 0, 'h', 4);
    g(6, 5); Q(2); E('nuss', 4);
    g(10, 0); M(0, 0, 'f', 0, { w: 32 }); M(3, 1, 'f', 0, { w: 32 }); M(6, 2, 'f', 0, { w: 32 }); A(0, 3, 4); A(5, 4, 4);
    g(6, 7); E('spucker', 4); C(1, 1, 3);
    g(12, 0); P(1, -3, 3); P(7, -5, 3); C(1, -2, 3); C(7, -4, 3); E('flatter', 4, 0); Z(5, -1);
    g(8, 3); E('knurps', 3); E('knurps', 5); F(7);
    g(10, 0); M(2, 4, 'v', 3); A(4, 8, 5); P(7, 6, 3); Z(8, 9);
    g(6, 6); E('hopsi', 3);
    g(11, 0); M(0, 0, 'h', 2, { w: 32 }); M(6, 1, 'h', -2, { w: 32 }); E('flatter', 5, 4); A(2, 3, 7);
    g(8, 5); E('piek', 4); K(2, 3, '?B?');
    g(6, 0); A(0, 3, 6);
    g(13, 4); E('knurps', 5); Z(3, 5); F(1); G(9); } } },
  { name: 'STERNENSTEG', theme: 'night', music: 'l4', build(b) { with (b) {
    g(10, 4); C(5, 1, 3);
    g(5, 0); M(0, 0, 'f', 0, { w: 32 }); M(3, 1, 'f', 0, { w: 32 });
    g(8, 6); E('piek', 2); E('piek', 5); K(3, 3, '?H?');
    g(10, 0); M(0, 0, 'h', 5); E('flatter', 5, 3); A(2, 3, 6);
    g(6, 6); E('spucker', 4);
    g(12, 3); T(2, 8); P(1, 2, 2); P(5, 3, 2); P(9, 2, 2); E('flatter', 7, 6); Z(5, 6);
    g(6, 5); Q(2); E('hopsi', 4);
    g(8, 0); M(0, 0, 'v', 3, { w: 32 }); M(4, 3, 'v', -3, { w: 32 }); A(1, 5, 6);
    g(8, 6); E('nuss', 2); E('knurps', 5); E('knurps', 6); F(7);
    g(9, 0); A(1, 6, 7); P(4, 2, 2); Z(4, 6);
    g(8, 6); E('piek', 3); K(4, 3, 'B?B');
    g(6, 0); M(0, 0, 'f', 0, { w: 32 }); M(3, -1, 'f', 0, { w: 32 });
    g(10, 4); E('nuss', 3); E('hopsi', 6); E('knurps', 8); S(9, 0, 1, 2);
    g(8, 4); K(2, 2, 'BBB'); K(2, 3, 'B B'); K(2, 4, 'BBB'); Z(3, 3); E('knurps', 6);
    g(14, 4); A(1, 3, 4); E('piek', 6); G(10); } } },
  { name: 'MONDTURM', theme: 'night', music: 'l5', arena: 1, build(b) { with (b) {
    g(10, 3); C(5, 1, 3);
    g(6, 4); E('piek', 3); K(2, 3, '?H?');
    g(4, 0); M(0, 0, 'h', 1, { w: 32 }); Z(2, 3);
    g(8, 5); E('nuss', 3); E('knurps', 6); S(7, 0, 1, 2);
    g(8, 3); T(1, 6); P(0, 2, 3); P(5, 2, 3); C(1, 3, 2); C(5, 3, 2); E('flatter', 4, 5); Z(3, 6);
    g(6, 5); E('spucker', 4);
    g(6, 0); M(0, 0, 'f', 0, { w: 32 }); M(3, 1, 'f', 0, { w: 32 }); A(0, 3, 6);
    g(8, 6); E('hopsi', 3); E('piek', 6); F(7);
    g(6, 10); C(1, 1, 4); Z(4, 3);
    g(5, 0); A(0, 0, 5);
    g(8, 4); Q(3); K(5, 3, 'H');
    g(2, 2); S(0, 4, 2, 8);
    g(17, 2); P(1, 2, 3); P(13, 2, 3); F(8); X(6);
    g(2, 2); S(0, 0, 2, 12); } } }
];
