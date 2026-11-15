// KAP FLIMMER – Tisch-Geometrie und Kugelphysik (läuft auch ohne Browser, für Tests)
'use strict';
const TB = (() => {
  const TW = 160, TH = 280, BR = 3.25, SUB = 8, GRAV = 0.05, VMAX = 7.6;
  const FL = 24, REST = 0.52, UP = -0.56;      // Flipper: Länge, Ruhe- und Schlagwinkel
  const S = [];                                 // feste Segmente
  const solids = [], rails = [];                // Formen für die Grafik
  let NX = 0, NY = 0;                           // Normale des letzten Treffers

  function seg(x0, y0, x1, y1, r, o) { const s = Object.assign({ x0, y0, x1, y1, r: r || 0, e: 0.42 }, o || {}); S.push(s); return s; }
  function chain(p, r, o, closed) { const n = p.length, out = []; for (let i = 0; i < (closed ? n : n - 1); i++) { const a = p[i], b = p[(i + 1) % n]; out.push(seg(a[0], a[1], b[0], b[1], r, o)); } return out; }
  function solid(p, o) { solids.push(p); return chain(p, 0, o, true); }
  function rail(p, r, o) { rails.push({ p, r: r || 1.5 }); return chain(p, r || 1.5, o); }

  // ----- Außenkontur: linke Wand, Kuppel, rechte Wand -----
  const outer = [[5, TH + 12], [5, 192], [9, 180], [5, 164], [5, 58]];   // mit Abweiser unter der Umlaufbahn
  for (let i = 1; i < 32; i++) { const a = Math.PI + Math.PI * i / 32; outer.push([80.5 + 75.5 * Math.cos(a), 58 + 50 * Math.sin(a)]); }
  outer.push([156, 58], [156, TH + 12]);
  chain(outer, 0, { e: 0.3 });
  // Abschussbahn: Trennwand, Boden, Einweg-Klappe
  solid([[144, TH + 12], [144, 192], [140, 180], [144, 164], [144, 68], [145.5, 66], [147, 68], [147, TH + 12]], { e: 0.3 });
  const floor = seg(147, 270, 156, 270, 0, { e: 0.1 });
  const gate = seg(145.5, 66, 156, 53, 0.5, { one: 1, e: 0.2 });
  // Linker Keil (Hafenmauer) mit Kutter-Zielen an der Schrägseite
  const WEDGE = [[17, 150], [17, 88], [20, 72], [24, 86], [36, 120], [22, 149], [19, 153]];
  solid(WEDGE);
  // Rechte Umlaufbahn-Führung
  rail([[131, 120], [131, 86], [128, 72]]);
  // Strudel-Mulde (offen nach links unten)
  const HOLE = { x: 117, y: 150, r: 8 };
  { const p = []; for (let a = -150; a <= 40; a += 19) p.push([HOLE.x + HOLE.r * Math.cos(a * Math.PI / 180), HOLE.y + HOLE.r * Math.sin(a * Math.PI / 180)]); rail(p, 1.2); }
  // Obere Bahnen: vier Pfosten -> drei Bahnen
  const POSTS = [59.5, 73.5, 87.5, 101.5];
  POSTS.forEach(x => rail([[x, 30], [x, 43]], 1.5));
  const LANES = [66.5, 80.5, 94.5];
  // Schleudern
  const slings = [
    { p: [[28, 200], [28, 225], [42, 232]], t: 0 },
    { p: [[121, 200], [121, 225], [107, 232]], t: 0 }];
  slings.forEach((s, i) => { solid(s.p); S[S.length - 1].sling = i; S[S.length - 1].e = 0.5; }); // letzte Kante (C->A) ist die Gummiseite
  // Führungen zu den Flippern
  rail([[17, 198], [17, 232], [44, 244.5]], 1.5, { e: 0.2 });
  rail([[132, 198], [132, 232], [105, 244.5]], 1.5, { e: 0.2 });

  // ----- Kutter-Ziele (Fallziele) -----
  const targets = [];
  { const ax = 36, ay = 120, bx = 22, by = 149, dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy), nx = dy / l, ny = -dx / l;
    for (let i = 0; i < 3; i++) { const t0 = 0.07 + i * 0.31, t1 = t0 + 0.24;
      targets.push({ x0: ax + dx * t0 + nx * 3, y0: ay + dy * t0 + ny * 3, x1: ax + dx * t1 + nx * 3, y1: ay + dy * t1 + ny * 3, up: true, nx, ny }); } }

  // ----- Kreise: Bojen-Bumper + dynamische (Krake) -----
  const bumpers = [{ x: 60, y: 74, r: 7, t: 0 }, { x: 101, y: 74, r: 7, t: 0 }, { x: 80.5, y: 97, r: 7, t: 0 }];
  const dyn = [];   // {x,y,r,kick,kind,ref} – wird vom Spiel gesetzt

  // ----- Flipper -----
  const flippers = [{ px: 47, py: 248, sgn: 1, a: REST, w: 0, on: 0 }, { px: 102, py: 248, sgn: -1, a: REST, w: 0, on: 0 }];
  const tip = f => [f.px + f.sgn * Math.cos(f.a) * FL, f.py + Math.sin(f.a) * FL];

  function hit(b, x0, y0, x1, y1, r0, r1, e, om, px, py) {
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
    let t = l2 ? ((b.x - x0) * dx + (b.y - y0) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = x0 + dx * t, cy = y0 + dy * t, rr = BR + r0 + (r1 - r0) * t;
    let nx = b.x - cx, ny = b.y - cy; const d2 = nx * nx + ny * ny; if (d2 >= rr * rr) return -1;
    const d = Math.sqrt(d2) || 1e-4; nx /= d; ny /= d; b.x = cx + nx * rr; b.y = cy + ny * rr; NX = nx; NY = ny;
    const svx = om ? -om * (cy - py) : 0, svy = om ? om * (cx - px) : 0;
    const vn = (b.vx - svx) * nx + (b.vy - svy) * ny;
    if (vn < 0) { const ee = vn > -0.35 ? 0 : e; b.vx -= (1 + ee) * vn * nx; b.vy -= (1 + ee) * vn * ny; return -vn; }
    return 0;
  }
  function hitC(b, c, e) {
    let nx = b.x - c.x, ny = b.y - c.y; const rr = BR + c.r, d2 = nx * nx + ny * ny; if (d2 >= rr * rr) return -1;
    const d = Math.sqrt(d2) || 1e-4; nx /= d; ny /= d; b.x = c.x + nx * rr; b.y = c.y + ny * rr; NX = nx; NY = ny;
    const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; return -vn; } return 0;
  }

  // Ein Frame Physik. balls: [{x,y,vx,vy,held,pass}], ev: Ereignisliste
  function step(balls, ev) {
    for (let s = 0; s < SUB; s++) {
      for (const f of flippers) { const tg = f.on ? UP : REST, sp = (f.on ? 0.36 : 0.2) / SUB, a0 = f.a;
        f.a = Math.abs(tg - f.a) <= sp ? tg : f.a + Math.sign(tg - f.a) * sp; f.w = (f.a - a0) * SUB; }
      for (let bi = 0; bi < balls.length; bi++) { const b = balls[bi]; if (b.held) continue;
        b.vy += GRAV / SUB; b.vx *= 0.99985; b.vy *= 0.99985;
        const v = Math.hypot(b.vx, b.vy); if (v > VMAX) { b.vx *= VMAX / v; b.vy *= VMAX / v; }
        b.x += b.vx / SUB; b.y += b.vy / SUB;
        for (let i = 0; i < S.length; i++) { const g = S[i];
          if (g.one) { const side = (g.x1 - g.x0) * (b.y - g.y0) - (g.y1 - g.y0) * (b.x - g.x0); if (side > 0) { b.pass = 0; continue; }
            if (!b.pass) { const dx = g.x1 - g.x0, dy = g.y1 - g.y0, d = -side / Math.hypot(dx, dy); if (d >= BR + g.r + 0.1) b.pass = 1; continue; } }
          const h = hit(b, g.x0, g.y0, g.x1, g.y1, g.r, g.r, g.e);
          if (h > 0) { if (g.sling !== undefined && h > 0.45) { b.vx += NX * 3.1; b.vy += NY * 3.1 - 0.4; ev.push({ t: 'sling', i: g.sling }); } else if (h > 1) ev.push({ t: 'wall', v: h }); }
        }
        for (let i = 0; i < targets.length; i++) { const g = targets[i]; if (!g.up) continue;
          if (hit(b, g.x0, g.y0, g.x1, g.y1, 1, 1, 0.3) > 0.25) ev.push({ t: 'target', i }); }
        for (let i = 0; i < bumpers.length; i++) { const c = bumpers[i], h = hitC(b, c, 0.3);
          if (h >= 0) { if (h > 0.15) { const sp = Math.max(3.4, Math.hypot(b.vx, b.vy)); b.vx = NX * sp + b.vx * 0.15; b.vy = NY * sp + b.vy * 0.15; ev.push({ t: 'bump', i }); } } }
        for (let i = 0; i < dyn.length; i++) { const c = dyn[i], h = hitC(b, c, 0.4);
          if (h >= 0) { b.vx += NX * c.kick; b.vy += NY * c.kick; if (h > 0.2 || c.kick) ev.push({ t: c.kind, i: c.ref, v: h }); } }
        for (let i = 0; i < 2; i++) { const f = flippers[i], tp = tip(f);
          const h = hit(b, f.px, f.py, tp[0], tp[1], 3, 2, f.w ? 0.25 : 0.3, f.sgn * f.w, f.px, f.py);
          if (h > 1.2 && f.w < 0) ev.push({ t: 'shot', i }); }
        for (let j = bi + 1; j < balls.length; j++) { const o = balls[j]; if (o.held) continue;
          let nx = o.x - b.x, ny = o.y - b.y; const d2 = nx * nx + ny * ny; if (d2 >= 4 * BR * BR || !d2) continue;
          const d = Math.sqrt(d2); nx /= d; ny /= d; const pen = (2 * BR - d) / 2; b.x -= nx * pen; b.y -= ny * pen; o.x += nx * pen; o.y += ny * pen;
          const rv = (o.vx - b.vx) * nx + (o.vy - b.vy) * ny; if (rv < 0) { b.vx += rv * nx; b.vy += rv * ny; o.vx -= rv * nx; o.vy -= rv * ny; ev.push({ t: 'clack' }); } }
      }
    }
  }
  function reset() { targets.forEach(t => t.up = true); flippers.forEach(f => { f.a = REST; f.w = 0; f.on = 0; }); dyn.length = 0; }
  return { TW, TH, BR, FL, REST, UP, S, outer, solids, rails, WEDGE, HOLE, POSTS, LANES, slings, targets, bumpers, dyn, flippers, gate, floor, tip, step, reset };
})();
if (typeof module !== 'undefined') module.exports = TB;
