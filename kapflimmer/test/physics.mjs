// Physik-Test: Abschuss-Kalibrierung + Bot-Dauerlauf (keine Ausreißer, keine Hänger)
import { createRequire } from 'module';
const TB = createRequire(import.meta.url)('../js/table.js');
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
const serve = v => ({ x: 151.5, y: 270 - TB.BR, vx: 0, vy: -v, held: 0, pass: 0 });

// 1) Abschuss: wo landet die Kugel je nach Kraft?
for (const v of [4.6, 5.4, 6.2, 7.0, 7.6]) {
  TB.reset(); const b = serve(v), ev = []; let minY = 999, left = 0, f = 0, lane = -1;
  for (; f < 900 && !(left && b.y > 190); f++) { TB.step([b], ev); minY = Math.min(minY, b.y); if (b.x < 143) left = 1; if (lane < 0 && b.y > 33 && b.y < 41 && b.x > 59 && b.x < 102) lane = Math.floor((b.x - 59.5) / 14); }
  console.log(`     Abschuss ${v}: Scheitel y=${minY.toFixed(0)}, im Feld=${left}, obere Bahn=${lane}, nach ${f}f bei x=${b.x.toFixed(0)} y=${b.y.toFixed(0)}`);
  if (v >= 5.4) ok(left && b.x < 144, `Abschuss ${v} erreicht das Spielfeld`);
}

// 2) Bot-Dauerlauf
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const stat = { bump: 0, sling: 0, target: 0, shot: 0, drains: 0, lanes: 0, hole: 0, orbitL: 0, stuck: 0, maxV: 0, top: 0 };
let bad = 0;
for (let game = 0; game < 300; game++) {
  TB.reset(); const b = serve(5.2 + rnd() * 2.4), ev = []; let still = 0, lx = b.x, ly = b.y, reac = 2 + Math.floor(rnd() * 5);
  for (let f = 0; f < 60 * 240; f++) {
    const py = b.y;
    for (let i = 0; i < 2; i++) { const fl = TB.flippers[i], dx = (b.x - fl.px) * fl.sgn;
      fl.on = b.y > 232 && b.y < 262 && dx > 2 + reac && dx < 26 && b.vy > -1 ? 1 : 0; }
    ev.length = 0; TB.step([b], ev);
    for (const e of ev) { if (stat[e.t] !== undefined) stat[e.t]++; if (e.t === 'target') TB.targets[e.i].up = false; }
    if (TB.targets.every(t => !t.up)) TB.targets.forEach(t => t.up = true);
    if (py > 122 && b.y <= 122 && b.x < 17) stat.orbitL++;
    if (py < 37 && b.y >= 37 && b.x > 59 && b.x < 102) stat.lanes++;
    if (b.y < 30) stat.top++;
    if (Math.hypot(b.x - TB.HOLE.x, b.y - TB.HOLE.y) < 4.5) { stat.hole++; b.x = TB.HOLE.x - 8; b.y = TB.HOLE.y + 9; b.vx = -1.6; b.vy = 1.2; }
    const v = Math.hypot(b.vx, b.vy); stat.maxV = Math.max(stat.maxV, v);
    if (!isFinite(b.x + b.y) || b.x < 0 || b.x > 160 || b.y < 0) { bad++; console.log('     Ausreißer', game, f, b); break; }
    if (f % 60 === 0) { if (Math.hypot(b.x - lx, b.y - ly) < 1.5 && !(b.x > 147)) { still++; if (still > 4) { stat.stuck++; console.log('     Hänger bei', b.x.toFixed(1), b.y.toFixed(1)); break; } } else still = 0; lx = b.x; ly = b.y; }
    if (b.y > TB.TH + 4) { stat.drains++; break; }
    if (b.x > 147 && b.y > 250 && v < 0.05) { b.vy = -(5.2 + rnd() * 2.4); }
  }
}
console.log('     Statistik:', JSON.stringify(stat));
ok(bad === 0, 'keine Kugel verlässt den Tisch');
ok(stat.stuck === 0, 'keine Hänger');
ok(stat.bump > 300 && stat.sling > 100 && stat.target > 50, 'Bumper, Schleudern und Ziele werden getroffen');
ok(stat.lanes > 30 && stat.hole > 10 && stat.orbitL > 10, 'Bahnen, Strudel und Umlaufbahn sind erreichbar');
process.exit(fail ? 1 : 0);
