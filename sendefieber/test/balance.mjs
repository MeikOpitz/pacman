// Balance-/Rauchtest: ein einfacher Bot spielt N Tage. Aufruf: node test/balance.mjs [tage] [seed]
import * as S from '../js/sim.js';
import { SLOTS, TRANSMITTERS } from '../js/data.js';

const days = +process.argv[2] || 40;
const seed = +process.argv[3] || 12345;
const st = S.newGame(seed);
const assert = (c, m) => { if (!c) { console.error('ASSERT: ' + m); process.exit(1); } };

function plan(dayKey) {
  SLOTS.forEach((_, i) => {
    if (S.slotLocked(st, dayKey, i)) return;
    let best = null, bf = -1;
    for (const s of st.shows) { const f = S.forecast(st, dayKey, i, s.id); if (f > bf) { bf = f; best = s.id; } }
    const c = st.contracts.filter(c => c.min <= bf * 0.95).sort((a, b) => b.min - a.min)[0];
    S.setSlot(st, dayKey, i, { show: best, ad: c ? c.id : null });
  });
}
function shop() {
  const maxF = Math.max(...SLOTS.map((_, i) => Math.max(...st.shows.map(s => S.forecast(st, 'today', i, s.id)))));
  for (const o of st.offers.slice()) if (o.min <= maxF * 0.85 && st.contracts.length < S.MAX_CONTRACTS) S.takeContract(st, o.id);
  const nt = TRANSMITTERS[st.tx + 1];
  if (nt && st.money > nt.cost + 40000) S.upgradeTx(st);
  const aff = st.dealer.filter(id => S.showPrice(id) + 25000 < st.money).sort((a, b) => S.showDef(b).q - S.showDef(a).q)[0];
  if (aff && st.shows.length < 14) S.buyShow(st, aff);
}

let won = null;
while (st.day <= days && !st.over) {
  shop(); plan('today');
  let end = null;
  while (!end && !st.over) {
    for (const e of S.tick(st)) {
      if (e.type === 'slot') { assert(e.listeners >= 0 && e.share >= 0 && e.share <= 1, 'slot values'); }
      if (e.type === 'dayEnd') end = e;
    }
    if (st.minute % 180 === 1) plan('today');
  }
  if (!end) break;
  assert(Number.isFinite(st.money), 'money finite');
  if (end.won && !won) won = end.day;
  console.log(`Tag ${String(end.day).padStart(2)}  Anteil ${(end.share * 100).toFixed(0).padStart(2)}%  ø ${String(end.avg).padStart(6)}  Gewinn ${String(end.profit).padStart(8)}  Konto ${String(st.money).padStart(8)}  Chef ${String(end.boss).padStart(3)}  Sender ${st.tx}  Shows ${st.shows.length}  Image ${st.image.toFixed(0)}`);
}
console.log(st.over ? 'ENDE: ' + st.over : 'läuft noch', '| Sieg an Tag:', won);
// JSON-Roundtrip (Speicherstand)
const copy = JSON.parse(JSON.stringify(st));
S.tick(copy);
console.log('OK');
