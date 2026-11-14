// Sendefieber – Spiellogik (rein, ohne DOM; läuft auch in Node für Balance-Tests)
import { SLOTS, GENRES, SHOWS, STARTER, CLIENTS, STORIES, TRANSMITTERS, RIVALS, EVENTS, BOSS_LINES } from './data.js';

export const MARKET = 1000000;
export const MAX_CONTRACTS = 4;
export const MAX_LOAN = 300000;
export const BASE_COST = 9000;
export const WIN_SHARE = 0.5;
const AD_RATE = 0.55;
const SHOW_BY_ID = Object.fromEntries(SHOWS.map(s => [s.id, s]));

export const showDef = id => SHOW_BY_ID[id];
export const showPrice = id => Math.round(Math.pow(showDef(id).q / 100, 2.4) * 220000 / 500) * 500;
export const sellPrice = (st, id) => {
  const s = st.shows.find(x => x.id === id);
  return s ? Math.round(showPrice(id) * 0.4 * (0.5 + 0.5 * s.fresh) / 500) * 500 : 0;
};

function rand(st) {
  st.seed = (st.seed + 0x6D2B79F5) | 0;
  let t = st.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rint = (st, n) => Math.floor(rand(st) * n);
const pick = (st, arr) => arr[rint(st, arr.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pw = a => Math.pow(a, 1.6);

const emptyDay = () => SLOTS.map(() => ({ show: null, ad: null, result: null }));

export function newGame(seed = (Date.now() | 0)) {
  const st = {
    v: 1, seed: seed | 0, day: 1, minute: 330, money: 80000, loan: 0, image: 30, tx: 0, boss: 50, nextId: 1,
    shows: STARTER.map(id => ({ id, fresh: 1, airings: 0 })),
    dealer: [], contracts: [], offers: [],
    today: emptyDay(), tomorrow: emptyDay(),
    stories: [], newsBonus: 0,
    rivals: RIVALS.map(r => ({ cov: r.cov0, plan: [] })),
    event: null,
    stats: { income: 0, costs: 0, own: 0, all: 0, n: 0 },
    history: [], lastAvg: 22000, over: null, won: false,
  };
  refreshDealer(st, 6);
  startDay(st);
  return st;
}

function refreshDealer(st, replace) {
  const owned = new Set(st.shows.map(s => s.id));
  st.dealer = st.dealer.filter(id => !owned.has(id));
  for (let i = 0; i < replace && st.dealer.length > 0 && st.dealer.length + replace > 6; i++) {
    st.dealer.splice(rint(st, st.dealer.length), 1);
  }
  const avail = () => SHOWS.filter(s => !owned.has(s.id) && !st.dealer.includes(s.id)).sort((a, b) => a.q - b.q);
  while (st.dealer.length < 6) {
    const a = avail();
    if (!a.length) break;
    // Hälfte des Angebots aus dem günstigeren Sortiment, damit immer etwas Bezahlbares da ist
    const pool = st.dealer.length < 3 ? a.slice(0, Math.max(1, Math.ceil(a.length / 2.5))) : a;
    st.dealer.push(pick(st, pool).id);
  }
}

function startDay(st) {
  st.stats = { income: 0, costs: 0, own: 0, all: 0, n: 0 };
  st.newsBonus = 0;
  // Konkurrenzprogramm
  st.rivals.forEach((r, ri) => {
    const def = RIVALS[ri];
    const base = Math.min(0.8, 0.34 + 0.009 * st.day);
    r.plan = SLOTS.map((_, i) => ({
      title: pick(st, def.titles),
      a: clamp(base * def.fit[i] + (rand(st) - 0.5) * 0.14, 0.15, 1.1),
      listeners: null,
    }));
  });
  // Werbeangebote
  const ref = Math.max(12000, st.lastAvg);
  st.offers = [];
  const mults = [0.45, 0.7, 0.9, 1.2, 1.6, 2.2];
  for (let i = 0; i < 5; i++) {
    const m = i === 0 ? 0.45 : pick(st, mults);
    const min = Math.max(5000, Math.round(ref * m / 1000) * 1000);
    const spots = 1 + rint(st, 4);
    const days = Math.max(1, Math.ceil(spots / 2)) + rint(st, 3);
    const pay = Math.round(spots * min * AD_RATE * (0.9 + m * 0.15) / 100) * 100;
    st.offers.push({ id: st.nextId++, client: pick(st, CLIENTS), min, spots, done: 0, days, pay, penalty: Math.round(pay * 0.5 / 100) * 100 });
  }
  // Nachrichten
  const pool = STORIES.slice();
  st.stories = [];
  for (let i = 0; i < 3; i++) {
    const title = pool.splice(rint(st, pool.length), 1)[0];
    const bonus = 0.04 + rint(st, 6) * 0.02;
    st.stories.push({ title, bonus, price: Math.round(bonus * (40000 + st.lastAvg * 1.2) / 500) * 500, bought: false });
  }
  // Tagesereignis
  st.event = st.day > 1 && rand(st) < 0.35 ? pick(st, EVENTS) : null;
}

export const coverage = st => TRANSMITTERS[st.tx].cov;
export const dailyCost = st => BASE_COST + TRANSMITTERS[st.tx].daily;
export const slotLocked = (st, dayKey, i) => dayKey === 'today' && st.minute >= SLOTS[i].start * 60;
export const fmtTime = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

function potential(st, i, dayKey = 'today') {
  let p = SLOTS[i].pot;
  if (dayKey === 'today' && st.event) p *= (st.event.mod && st.event.mod[i]) || st.event.all || 1;
  return p;
}

export function attract(st, showId, i, withNews = true) {
  const s = st.shows.find(x => x.id === showId);
  if (!s) return 0.03;
  const d = showDef(showId);
  return d.q / 100 * (0.4 + 0.6 * s.fresh) * GENRES[d.g].fit[i] * (0.75 + 0.5 * st.image / 100) * (1 + (withNews ? st.newsBonus : 0));
}

function audience(st, i, a, dayKey) {
  const pot = potential(st, i, dayKey) * MARKET;
  const own = coverage(st), ra = st.rivals.map(r => ({ c: r.cov, p: pw(r.plan[i].a) }));
  const sumR = ra.reduce((s, r) => s + r.c * r.p, 0);
  const mine = pot * own * pw(a) / (pw(a) + sumR + 0.5);
  const rivals = ra.map(r => pot * r.c * r.p / (r.p + (sumR - r.c * r.p) + own * pw(a) + 0.5));
  const all = mine + rivals.reduce((s, x) => s + x, 0);
  return { mine: Math.round(mine), rivals: rivals.map(Math.round), share: all > 0 ? mine / all : 0, all };
}

// Prognose für die Planung (auf Tausender gerundet)
export function forecast(st, dayKey, i, showId) {
  if (!showId) return 0;
  const a = attract(st, showId, i, dayKey === 'today');
  return Math.round(audience(st, i, a, dayKey).mine / 1000) * 1000;
}

function evalSlot(st, i) {
  const slot = st.today[i];
  const s = slot.show && st.shows.find(x => x.id === slot.show);
  const a = s ? attract(st, s.id, i) : 0.03;
  const aud = audience(st, i, a, 'today');
  st.rivals.forEach((r, ri) => { r.plan[i].listeners = aud.rivals[ri]; });
  const ev = { type: 'slot', slot: i, title: s ? showDef(s.id).title : null, listeners: aud.mine, share: aud.share, ad: null };
  if (s) {
    // Ruf wächst, wenn die Sendung (ohne Ruf-Bonus) besser ist als das Konkurrenzprogramm
    const base = showDef(s.id).q / 100 * (0.4 + 0.6 * s.fresh) * GENRES[showDef(s.id).g].fit[i];
    const rivalAvg = st.rivals.reduce((x, r) => x + r.plan[i].a, 0) / st.rivals.length;
    st.image = clamp(st.image + clamp((base - rivalAvg) * 3, -1, 1), 0, 100);
  } else {
    st.image = clamp(st.image - 3, 0, 100);
  }
  if (s) { s.fresh = Math.max(0.15, s.fresh - GENRES[showDef(s.id).g].wear); s.airings++; s.aired = true; }
  const c = slot.ad && st.contracts.find(x => x.id === slot.ad);
  if (c) {
    const ok = aud.mine >= c.min;
    ev.ad = { client: c.client, ok, min: c.min, completed: false, pay: 0 };
    if (ok) {
      c.done++;
      if (c.done >= c.spots) {
        st.money += c.pay; st.stats.income += c.pay;
        st.image = clamp(st.image + 1, 0, 100);
        st.contracts = st.contracts.filter(x => x !== c);
        ev.ad.completed = true; ev.ad.pay = c.pay;
      }
    }
  }
  slot.result = { listeners: aud.mine, share: aud.share, adOk: ev.ad ? ev.ad.ok : null };
  st.stats.own += aud.mine; st.stats.all += aud.all; st.stats.n++;
  return ev;
}

export function bossTarget(st) { return Math.min(44, 16 + st.day * 0.9); }
export function bossLine(st) { return BOSS_LINES.find(([m]) => st.boss >= m)[1]; }

function endDay(st) {
  const sum = { type: 'dayEnd', day: st.day, failed: [], income: 0, costs: 0 };
  // Verträge
  for (const c of st.contracts.slice()) {
    c.days--;
    if (c.days <= 0) {
      st.money -= c.penalty; st.stats.costs += c.penalty;
      st.image = clamp(st.image - 4, 0, 100);
      st.contracts = st.contracts.filter(x => x !== c);
      sum.failed.push({ client: c.client, penalty: c.penalty });
    }
  }
  const fix = dailyCost(st);
  st.money -= fix; st.stats.costs += fix;
  sum.fix = fix;
  sum.interest = Math.round(st.loan * 0.015);
  st.money -= sum.interest; st.stats.costs += sum.interest;
  sum.income = st.stats.income; sum.costs = st.stats.costs; sum.profit = sum.income - sum.costs;
  sum.share = st.stats.all > 0 ? st.stats.own / st.stats.all : 0;
  sum.avg = st.stats.n ? Math.round(st.stats.own / st.stats.n) : 0;
  st.lastAvg = Math.max(8000, sum.avg);
  // Chef
  const target = bossTarget(st);
  const delta = Math.round(clamp((sum.share * 100 - target) * 0.5, -8, 6) + (sum.profit >= 0 ? 2 : -4));
  st.boss = clamp(st.boss + delta, 0, 100);
  sum.bossDelta = delta; sum.boss = st.boss; sum.target = target;
  st.history.push({ day: st.day, share: sum.share, profit: sum.profit, avg: sum.avg, money: st.money });
  if (st.history.length > 60) st.history.shift();
  // Sieg / Niederlage
  if (st.boss <= 0) st.over = 'Der Chef hat genug gesehen. Sie sind gefeuert!';
  else if (st.money < -200000) st.over = 'Der Sender ist pleite. Der Gerichtsvollzieher trägt gerade das Mischpult raus.';
  if (!st.over && !st.won && sum.share >= WIN_SHARE) { st.won = true; sum.won = true; }
  sum.over = st.over;
  sum.bossLine = bossLine(st);
  // Erholung & nächster Tag
  for (const s of st.shows) { if (!s.aired) s.fresh = Math.min(1, s.fresh + 0.2); else s.fresh = Math.min(1, s.fresh + 0.05); s.aired = false; }
  for (const r of st.rivals) r.cov = Math.min(0.95, r.cov + 0.008);
  st.day++; st.minute = 300;
  st.today = st.tomorrow; st.tomorrow = emptyDay();
  refreshDealer(st, 2);
  startDay(st);
  sum.event = st.event ? st.event.text : null;
  return sum;
}

// Eine Spielminute weiterdrehen; liefert Ereignisse für die Oberfläche
export function tick(st) {
  if (st.over) return [];
  st.minute++;
  const ev = [];
  for (let i = 0; i < SLOTS.length; i++) if (st.minute === SLOTS[i].start * 60) ev.push(evalSlot(st, i));
  if (st.minute >= 1440) ev.push(endDay(st));
  return ev;
}

// ---------- Aktionen ----------
export function setSlot(st, dayKey, i, patch) {
  if (slotLocked(st, dayKey, i)) return false;
  Object.assign(st[dayKey][i], patch);
  return true;
}
export function buyShow(st, id) {
  const p = showPrice(id);
  if (!st.dealer.includes(id) || st.money < p) return false;
  st.money -= p; st.stats.costs += p;
  st.dealer = st.dealer.filter(x => x !== id);
  st.shows.push({ id, fresh: 1, airings: 0 });
  return true;
}
export function sellShow(st, id) {
  if (st.shows.length <= 1 || !st.shows.some(s => s.id === id)) return false;
  const p = sellPrice(st, id);
  st.money += p; st.stats.income += p;
  st.shows = st.shows.filter(s => s.id !== id);
  for (const k of ['today', 'tomorrow']) st[k].forEach((s, i) => { if (s.show === id && !slotLocked(st, k, i)) s.show = null; });
  return true;
}
export function takeContract(st, id) {
  const o = st.offers.find(x => x.id === id);
  if (!o || st.contracts.length >= MAX_CONTRACTS) return false;
  st.offers = st.offers.filter(x => x !== o);
  st.contracts.push(o);
  return true;
}
export function buyStory(st, idx) {
  const s = st.stories[idx];
  if (!s || s.bought || st.money < s.price) return false;
  st.money -= s.price; st.stats.costs += s.price;
  s.bought = true;
  st.newsBonus = Math.min(0.3, st.newsBonus + s.bonus);
  return true;
}
export function upgradeTx(st) {
  const n = TRANSMITTERS[st.tx + 1];
  if (!n || st.money < n.cost) return false;
  st.money -= n.cost; st.stats.costs += n.cost;
  st.tx++;
  return true;
}
export function takeLoan(st, amt) {
  if (st.loan + amt > MAX_LOAN) return false;
  st.loan += amt; st.money += amt;
  return true;
}
export function repayLoan(st, amt) {
  amt = Math.min(amt, st.loan);
  if (amt <= 0 || st.money < amt) return false;
  st.loan -= amt; st.money -= amt;
  return true;
}
