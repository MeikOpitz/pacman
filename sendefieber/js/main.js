// Sendefieber – Oberfläche & Spielschleife
import * as S from './sim.js';
import { SLOTS, GENRES, TRANSMITTERS, RIVALS, TIPS } from './data.js';
import { Scene, NPCS, W } from './gfx.js';

const $ = s => document.querySelector(s);
const SAVE = 'sendefieber-save-v1';
const MS_PER_MIN = 200;
const fmt = n => Math.round(n).toLocaleString('de-DE');
const dm = n => fmt(n) + ' DM';
const pct = x => Math.round(x * 100) + ' %';
const stars = q => '★'.repeat(Math.max(1, Math.round(q / 20))) + '☆'.repeat(5 - Math.max(1, Math.round(q / 20)));
const slotTime = i => `${String(SLOTS[i].start).padStart(2, '0')}–${SLOTS[i].end} Uhr`;

let st = null, speed = 0, userSpeed = 1, acc = 0, room = null, tab = 'today', modalOpen = false, ffwd = false, sound = true;
const scene = new Scene($('#scene'));
const roomEl = $('#room'), modalEl = $('#modal');

// ---------- Ton ----------
let ac = null;
function beep(freq = 440, dur = 0.08, type = 'square', vol = 0.04) {
  if (!sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* kein Ton verfügbar */ }
}
const sfx = {
  click: () => beep(660, 0.04), cash: () => { beep(880, 0.07); setTimeout(() => beep(1320, 0.1), 70); },
  bad: () => beep(140, 0.25, 'sawtooth'), ding: () => beep(1040, 0.15, 'triangle', 0.06),
};

// ---------- Speichern ----------
function save() { try { localStorage.setItem(SAVE, JSON.stringify(st)); } catch (e) { /* voll/gesperrt */ } }
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && s.v === 1 ? s : null; } catch (e) { return null; } }

// ---------- HUD ----------
function setSpeed(v) { speed = v; if (v > 0) userSpeed = v; hud(); }
function say(msg) { $('#t-msg').innerHTML = msg; }
function hud() {
  if (!st) return;
  $('#h-day').textContent = 'Tag ' + st.day;
  $('#h-time').textContent = S.fmtTime(Math.min(st.minute, 1439));
  const m = $('#h-money'); m.textContent = dm(st.money); m.classList.toggle('neg', st.money < 0);
  $('#h-sub').textContent = `Ruf ${Math.round(st.image)} · Chef ${Math.round(st.boss)}`;
  document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === (ffwd ? 3 : speed)));
  const ni = SLOTS.findIndex(s => st.minute < s.start * 60), n = $('#t-next');
  if (ni < 0) { n.className = ''; n.textContent = 'Sendeschluss um Mitternacht – plane schon den morgigen Tag!'; }
  else {
    const sl = st.today[ni];
    n.className = sl.show ? '' : 'warn';
    n.textContent = `Ab ${SLOTS[ni].start} Uhr: ${sl.show ? S.showDef(sl.show).title : 'SENDELOCH! Ab ins Büro!'}`;
  }
}

// ---------- Modale Fenster ----------
function modal(title, body, buttons) {
  modalOpen = true;
  modalEl.innerHTML = `<div class="win"><h2>${title}</h2><div class="body">${body}</div><div class="foot">${
    buttons.map((b, i) => `<button data-m="${i}" class="${b.cls || ''}">${b.label}</button>`).join('')}</div></div>`;
  modalEl.hidden = false;
  modalEl.onclick = e => {
    const pk = e.target.closest('[data-pick]');
    if (pk && modal.onPick) { const f = modal.onPick; closeModal(); f(pk.dataset.pick); return; }
    const b = e.target.closest('[data-m]'); if (!b) return;
    const btn = buttons[+b.dataset.m]; closeModal(); sfx.click(); if (btn.fn) btn.fn();
  };
}
function closeModal() { modalOpen = false; modalEl.hidden = true; modal.onPick = null; }

function titleScreen() {
  const has = !!load();
  modal('Sendefieber', `<div class="title"><h1>SENDE<br>FIEBER</h1>
    <p><b>Die Radio-Wirtschaftssimulation</b></p>
    <p>1993. Ein Hochhaus, drei Radiosender, ein cholerischer Chef. Du bist der neue Programmdirektor von <b>Radio Rabatz</b>.</p>
    <p class="muted">Kaufe Sendungen, plane das Programm, erfülle Werbeverträge – und hole dir mit 50 % Marktanteil die Goldene Antenne.</p></div>`,
  [...(has ? [{ label: 'Weiterspielen', cls: 'go', fn: () => start(load()) }] : []),
    { label: 'Neues Spiel', cls: has ? '' : 'go', fn: () => { start(S.newGame()); intro(); } }]);
}
function intro() {
  setSpeed(0);
  modal('Erster Arbeitstag', `<p>Es ist <b>05:30 Uhr</b>. Um <b>6 Uhr</b> beginnt die Frühschicht – und der Sendeplan ist leer!</p>
    <p><b>1.</b> Tippe auf <b>DEIN BUERO</b> und plane das Programm.<br>
    <b>2.</b> Hol dir bei <b>WERBUNG</b> Verträge und lege die Spots in den Plan.<br>
    <b>3.</b> Kaufe bei <b>PROGRAMME</b> bessere Sendungen.</p>
    <p class="muted"><b>Wischen</b> scrollt durchs Hochhaus, <b>Tippen</b> auf einen Raum schickt dich hin. Die Uhr läuft, auch während du durchs Haus läufst. Oben rechts: Pause / Normal / Schnell.</p>`,
  [{ label: 'An die Arbeit!', cls: 'go', fn: () => setSpeed(1) }]);
}
function start(state) {
  st = state; room = null; roomEl.hidden = true; ffwd = false; tab = 'today';
  say(st.event ? '⚡ ' + st.event.text : 'Willkommen bei Radio Rabatz.');
  setSpeed(st.over ? 0 : 1); hud();
  if (st.over) gameOver();
}
function gameOver() {
  setSpeed(0);
  modal('Aus der Traum', `<p>${st.over}</p><p>Du hast <b>${st.day - 1} Tage</b> durchgehalten.</p>`,
    [{ label: 'Neues Spiel', cls: 'go', fn: () => { start(S.newGame()); intro(); } }]);
}

// ---------- Ereignisse aus der Simulation ----------
function onEvent(e) {
  if (e.type === 'slot') {
    let msg = e.title ? `📻 ${SLOTS[e.slot].name}: <b>${fmt(e.listeners)}</b> Hörer (${pct(e.share)})`
      : `<span class="no">📻 ${SLOTS[e.slot].name}: SENDELOCH! Nur ${fmt(e.listeners)} Hörer.</span>`;
    if (e.ad) {
      msg += e.ad.completed ? ` · <span class="ok">Vertrag erfüllt: +${dm(e.ad.pay)}</span>`
        : e.ad.ok ? ' · <span class="ok">Spot zählt ✓</span>' : ` · <span class="no">Spot verpufft (min. ${fmt(e.ad.min)})</span>`;
    }
    say(msg);
    if (!e.title || (e.ad && !e.ad.ok)) sfx.bad(); else if (e.ad && e.ad.completed) sfx.cash(); else sfx.ding();
    save();
  } else if (e.type === 'dayEnd') {
    ffwd = false; setSpeed(0); save();
    const fails = e.failed.map(f => `<p class="no">Vertrag geplatzt: ${f.client} (−${dm(f.penalty)})</p>`).join('');
    const body = `<table>
      <tr><td>Marktanteil</td><td><b>${pct(e.share)}</b> (Ziel ${Math.round(e.target)} %)</td></tr>
      <tr><td>Hörer im Schnitt</td><td>${fmt(e.avg)}</td></tr>
      <tr><td>Einnahmen</td><td class="ok">${dm(e.income)}</td></tr>
      <tr><td>Ausgaben</td><td class="no">${dm(e.costs)}</td></tr>
      <tr><td>davon Betrieb${e.interest ? ' + Zinsen' : ''}</td><td>${dm(e.fix + e.interest)}</td></tr>
      <tr><td><b>Tagesergebnis</b></td><td class="${e.profit >= 0 ? 'ok' : 'no'}"><b>${dm(e.profit)}</b></td></tr>
      <tr><td>Chef-Laune</td><td>${e.boss} (${e.bossDelta >= 0 ? '+' : ''}${e.bossDelta})</td></tr></table>
      ${fails}<p><b>Direktor Wummer:</b> „${e.bossLine}“</p>
      ${e.event ? `<p>⚡ <b>Morgen:</b> ${e.event}</p>` : ''}`;
    const next = () => {
      if (e.over) return gameOver();
      if (e.won) return modal('🏆 Die Goldene Antenne!', `<p>Über <b>50 % Marktanteil</b>! Radio Rabatz ist die Nummer eins der Stadt, Direktor Wummer weint vor Glück in seine Zigarre.</p>
        <p>Du hast es in <b>${e.day} Tagen</b> geschafft. Du kannst weiterspielen, solange du willst.</p>`, [{ label: 'Weitersenden', cls: 'go', fn: () => setSpeed(1) }]);
      say(st.event ? '⚡ ' + st.event.text : 'Ein neuer Tag bei Radio Rabatz.'); setSpeed(1);
      if (room) renderRoom();
    };
    modal(`Tag ${e.day} – Abrechnung`, body, [{ label: e.over ? 'Oh nein …' : 'Nächster Tag', cls: 'go', fn: next }]);
  }
}

// ---------- Räume ----------
const GREET = {
  foyer: 'Morgen, Chef! Na ja – fast Chef. Was darf’s sein?',
  exit: 'Draußen wartet der Feierabend …',
  dealer: 'Frische Ware, heiße Scheiben! Bei mir kriegst du die Sendungen, die Quote machen.',
  agency: 'Schätzchen, Werbung ist Vertrauenssache. Liefer die Hörer, dann fließt das Geld.',
  office: 'Dein Reich. Hier entsteht der Sendeplan.',
  news: 'Ticker läuft heiß! Eine gute Schlagzeile pusht heute alle deine Sendungen.',
  rival0: 'Ach, der Neue von Rabatz. Wir senden Gefühle, mein Lieber. Ge-füh-le!',
  rival1: 'Yo. Mach leiser, Opa-Sender. Hier regiert der Bass.',
  boss: '', tech: 'Mehr Watt, mehr Hörer. Kostet aber – auch im laufenden Betrieb.',
};
function openRoom(r) { room = r.id; tab = 'today'; sfx.click(); renderRoom(); }
function leaveRoom() { room = null; roomEl.hidden = true; }

function renderRoom() {
  if (!room) return;
  const npc = NPCS[room], scroll = roomEl.querySelector('.r-body')?.scrollTop || 0;
  const sayTxt = room === 'boss' ? S.bossLine(st) : GREET[room];
  roomEl.innerHTML = `<div class="r-head"><canvas width="72" height="64"></canvas><div><div class="who">${npc.name}</div><div class="say">${sayTxt}</div></div></div>
    <div class="r-body">${VIEW[room]()}</div><div class="r-foot"><button data-a="leave">◀ Raum verlassen</button></div>`;
  scene.drawBanner(roomEl.querySelector('canvas'), room, st);
  roomEl.hidden = false;
  roomEl.querySelector('.r-body').scrollTop = scroll;
}

const showLine = (id, s) => { const d = S.showDef(id); return `<span class="tag">${GENRES[d.g].name}</span> <span class="stars">${stars(d.q)}</span>${s ? ` <small>frisch ${Math.round(s.fresh * 100)} %</small>` : ''}`; };
const bestSlots = g => GENRES[g].fit.map((f, i) => [f, i]).filter(x => x[0] >= 1.15).map(x => SLOTS[x[1]].name).join(', ') || 'überall solide';
const contractLine = c => `≥ <b>${fmt(c.min)}</b> Hörer · ${c.done}/${c.spots} Spots · noch ${c.days} Tag${c.days > 1 ? 'e' : ''}`;

const VIEW = {
  office() {
    const day = st[tab];
    let h = `<div class="tabs"><button data-a="tab" data-v="today" class="${tab === 'today' ? 'on' : ''}">Heute</button><button data-a="tab" data-v="tomorrow" class="${tab === 'tomorrow' ? 'on' : ''}">Morgen</button></div>`;
    day.forEach((s, i) => {
      const locked = S.slotLocked(st, tab, i), live = locked && st.minute < SLOTS[i].end * 60;
      const c = s.ad && st.contracts.find(x => x.id === s.ad);
      const fc = s.show && !locked ? S.forecast(st, tab, i, s.show) : 0;
      h += `<div class="card ${locked ? 'locked' : ''} ${live ? 'live' : ''}"><div class="row"><b>${slotTime(i)} · ${SLOTS[i].name}</b>${
        s.result ? `<small>${fmt(s.result.listeners)} Hörer · ${pct(s.result.share)}${s.result.adOk === null ? '' : s.result.adOk ? ' · <span class="ok">Spot ✓</span>' : ' · <span class="no">Spot ✗</span>'}</small>`
        : fc ? `<small>Prognose ~${fmt(fc)}</small>` : ''}</div>
        <div class="slot-btns">
        <button data-a="pickShow" data-v="${i}" ${locked ? 'disabled' : ''} class="${s.show ? '' : 'empty'}">♪ ${s.show ? S.showDef(s.show).title : '— Sendeloch —'}</button>
        <button data-a="pickAd" data-v="${i}" ${locked ? 'disabled' : ''}>$ ${c ? `${c.client} (≥ ${fmt(c.min)})${fc && fc < c.min ? ' ⚠' : ''}` : '— kein Werbespot —'}</button>
        </div></div>`;
    });
    h += `<h3>Archiv (${st.shows.length} Sendungen)</h3>`;
    for (const s of st.shows) {
      h += `<div class="card"><div class="row"><b>${S.showDef(s.id).title}</b><button data-a="sell" data-v="${s.id}" ${st.shows.length <= 1 ? 'disabled' : ''}>Verkaufen</button></div>
        <div>${showLine(s.id, s)}</div><small>Stark: ${bestSlots(S.showDef(s.id).g)} · Wert ${dm(S.sellPrice(st, s.id))}</small></div>`;
    }
    return h;
  },
  dealer() {
    let h = '<h3>Im Angebot</h3>';
    for (const id of st.dealer) {
      const d = S.showDef(id), p = S.showPrice(id);
      h += `<div class="card"><div class="row"><b>${d.title}</b><button data-a="buy" data-v="${id}" class="go" ${st.money < p ? 'disabled' : ''}>${dm(p)}</button></div>
        <div>${showLine(id)}</div><small>Stark: ${bestSlots(d.g)}</small></div>`;
    }
    return h + '<p class="muted">Jeden Tag kommt neue Ware. Wiederholungen nutzen eine Sendung ab – ein Tag Pause frischt sie wieder auf.</p>';
  },
  agency() {
    let h = `<h3>Deine Verträge (${st.contracts.length}/${S.MAX_CONTRACTS})</h3>`;
    if (!st.contracts.length) h += '<p class="muted">Noch kein Vertrag unterschrieben.</p>';
    for (const c of st.contracts) h += `<div class="card"><b>${c.client}</b><br><small>${contractLine(c)}<br>Honorar ${dm(c.pay)} · Strafe ${dm(c.penalty)}</small></div>`;
    h += '<h3>Neue Angebote</h3>';
    for (const c of st.offers) {
      h += `<div class="card"><div class="row"><b>${c.client}</b><button data-a="sign" data-v="${c.id}" class="go" ${st.contracts.length >= S.MAX_CONTRACTS ? 'disabled' : ''}>Unterschreiben</button></div>
        <small>${c.spots} Spot${c.spots > 1 ? 's' : ''} mit je ≥ <b>${fmt(c.min)}</b> Hörern in ${c.days} Tag${c.days > 1 ? 'en' : ''}<br>Honorar <b>${dm(c.pay)}</b> · Strafe ${dm(c.penalty)}</small></div>`;
    }
    return h + `<p class="muted">Gestern hattest du im Schnitt ${fmt(st.lastAvg)} Hörer. Ein Spot zählt nur, wenn die Sendung die Mindestzahl erreicht.</p>`;
  },
  news() {
    let h = `<h3>Schlagzeilen des Tages</h3><p class="muted">Aktueller Nachrichten-Bonus: <b>+${Math.round(st.newsBonus * 100)} %</b> Attraktivität (max. 30 %, gilt für alle Sendungen, die heute noch starten).</p>`;
    st.stories.forEach((s, i) => {
      h += `<div class="card"><b>${s.title}</b><div class="row"><small>Bonus +${Math.round(s.bonus * 100)} %</small>${
        s.bought ? '<span class="ok">gekauft ✓</span>' : `<button data-a="story" data-v="${i}" class="go" ${st.money < s.price ? 'disabled' : ''}>${dm(s.price)}</button>`}</div></div>`;
    });
    return h;
  },
  boss() {
    const last = st.history[st.history.length - 1];
    return `<h3>Laune des Direktors</h3><div class="bar"><i style="width:${st.boss}%;background:${st.boss < 25 ? 'var(--red)' : st.boss < 50 ? 'var(--gold)' : 'var(--green)'}"></i></div>
      <p class="muted">Fällt die Laune auf null, bist du gefeuert. Heutiges Ziel: <b>${Math.round(S.bossTarget(st))} % Marktanteil</b>${last ? ` (gestern: ${pct(last.share)})` : ''}. Das große Ziel: <b>50 %</b> an einem Tag – die Goldene Antenne.</p>
      <h3>Vorschuss</h3><p class="muted">Schulden: <b>${dm(st.loan)}</b> von max. ${dm(S.MAX_LOAN)} · 1,5 % Zinsen pro Tag.</p>
      <div class="row" style="display:flex;gap:6px"><button data-a="loan" data-v="50000" ${st.loan + 50000 > S.MAX_LOAN ? 'disabled' : ''}>+50.000 leihen</button>
      <button data-a="repay" data-v="50000" ${st.loan <= 0 || st.money < Math.min(50000, st.loan) ? 'disabled' : ''}>50.000 tilgen</button></div>`;
  },
  tech() {
    const cur = TRANSMITTERS[st.tx], nx = TRANSMITTERS[st.tx + 1];
    return `<h3>Sendeanlage</h3><div class="card"><b>${cur.name}</b><div class="bar"><i style="width:${cur.cov * 100}%"></i></div>
      <small>Erreicht ${pct(cur.cov)} der Stadt · Betrieb ${dm(S.dailyCost(st))} pro Tag</small></div>
      ${nx ? `<h3>Ausbau</h3><div class="card"><div class="row"><b>${nx.name}</b><button data-a="tx" class="go" ${st.money < nx.cost ? 'disabled' : ''}>${dm(nx.cost)}</button></div>
      <small>Reichweite ${pct(nx.cov)} · Betrieb dann ${dm(S.BASE_COST + nx.daily)} pro Tag</small></div>` : '<p class="ok">Maximaler Ausbau erreicht. Man hört dich bis zum Mond.</p>'}
      <p class="muted">Die Konkurrenz erreicht derzeit ${st.rivals.map((r, i) => `${RIVALS[i].name} ${pct(r.cov)}`).join(', ')}.</p>`;
  },
  rival(i) {
    const r = st.rivals[i];
    return `<h3>Programm von ${RIVALS[i].name} heute</h3><table><tr><th>Zeit</th><th>Sendung</th><th>Hörer</th></tr>${
      r.plan.map((p, k) => `<tr><td>${SLOTS[k].start} Uhr</td><td style="text-align:left">${p.title}</td><td>${p.listeners === null ? '–' : fmt(p.listeners)}</td></tr>`).join('')}</table>
      <p class="muted">Reichweite: ${pct(r.cov)} der Stadt. Die Konkurrenz wird jeden Tag ein bisschen besser.</p>`;
  },
  rival0: () => VIEW.rival(0), rival1: () => VIEW.rival(1),
  foyer() {
    const tip = TIPS[(st.day + Math.floor(st.minute / 180)) % TIPS.length];
    let h = `<h3>Pachulkes Tipp</h3><div class="card">„${tip}“</div><h3>Die letzten Tage</h3>`;
    if (!st.history.length) h += '<p class="muted">Noch keine Abrechnung.</p>';
    else h += `<table><tr><th>Tag</th><th>Anteil</th><th>ø Hörer</th><th>Ergebnis</th></tr>${st.history.slice(-8).reverse().map(x =>
      `<tr><td>${x.day}</td><td>${pct(x.share)}</td><td>${fmt(x.avg)}</td><td class="${x.profit >= 0 ? 'ok' : 'no'}">${fmt(x.profit)}</td></tr>`).join('')}</table>`;
    return h + `<h3>Einstellungen</h3><div style="display:flex;gap:6px"><button data-a="sound">Ton: ${sound ? 'an' : 'aus'}</button><button data-a="restart" class="bad">Neues Spiel</button></div>`;
  },
  exit() {
    const open = SLOTS.map((_, i) => i).filter(i => !S.slotLocked(st, 'today', i));
    const holes = open.filter(i => !st.today[i].show).length, holesTm = st.tomorrow.filter(s => !s.show).length;
    return `<h3>Feierabend</h3><p>Der Rest des Tages läuft im Schnelldurchlauf bis zur Abrechnung um Mitternacht.</p>
      ${holes ? `<p class="no">Achtung: Heute sind noch ${holes} Sendeplätze leer!</p>` : '<p class="ok">Der heutige Plan steht.</p>'}
      ${holesTm ? `<p class="muted">Für morgen sind noch ${holesTm} Sendeplätze leer – du hast morgens ab 5 Uhr eine Stunde Zeit.</p>` : ''}
      <button data-a="ffwd" class="go">Feierabend machen ▶▶</button>`;
  },
};

// ---------- Auswahl-Dialoge ----------
function pickShow(i) {
  const list = st.shows.map(s => ({ s, f: S.forecast(st, tab, i, s.id) })).sort((a, b) => b.f - a.f);
  const body = `<button class="pick bad" data-pick="">— Sendeloch —</button>` + list.map(({ s, f }) => {
    const d = S.showDef(s.id), fit = GENRES[d.g].fit[i];
    return `<button class="pick" data-pick="${s.id}"><b>${d.title}</b><small>${GENRES[d.g].name} · ${stars(d.q)} · frisch ${Math.round(s.fresh * 100)} % · ${
      fit >= 1.15 ? '<span class="ok">passt super</span>' : fit <= 0.85 ? '<span class="no">passt schlecht</span>' : 'passt ok'} · ~${fmt(f)} Hörer</small></button>`;
  }).join('');
  modal(`${SLOTS[i].name} · ${slotTime(i)}`, body, [{ label: 'Abbrechen' }]);
  modal.onPick = v => { S.setSlot(st, tab, i, { show: v || null }); after(); };
}
function pickAd(i) {
  const fc = st[tab][i].show ? S.forecast(st, tab, i, st[tab][i].show) : 0;
  const body = `<p class="muted">Prognose für diesen Platz: ~${fmt(fc)} Hörer</p><button class="pick bad" data-pick="">— kein Werbespot —</button>` + (st.contracts.length ? st.contracts.map(c =>
    `<button class="pick" data-pick="${c.id}"><b>${c.client}</b> ${fc >= c.min ? '<span class="ok">✓</span>' : '<span class="no">⚠ zu wenig Hörer</span>'}<small>${contractLine(c)} · ${dm(c.pay)}</small></button>`).join('')
    : '<p>Du hast keine Werbeverträge. Besuch Gloria Klimper im 1. Stock!</p>');
  modal(`Werbespot · ${SLOTS[i].name}`, body, [{ label: 'Abbrechen' }]);
  modal.onPick = v => { S.setSlot(st, tab, i, { ad: v ? +v : null }); after(); };
}
function after(ok = true, good = false) { if (!ok) sfx.bad(); else if (good) sfx.cash(); else sfx.click(); save(); hud(); renderRoom(); }

const ACT = {
  leave: leaveRoom,
  tab: v => { tab = v; renderRoom(); },
  pickShow: v => pickShow(+v), pickAd: v => pickAd(+v),
  buy: v => after(S.buyShow(st, v), true),
  sell: v => modal('Sendung verkaufen?', `<p><b>${S.showDef(v).title}</b> für ${dm(S.sellPrice(st, v))} verkaufen?</p>`,
    [{ label: 'Behalten' }, { label: 'Verkaufen', cls: 'bad', fn: () => after(S.sellShow(st, v), true) }]),
  sign: v => after(S.takeContract(st, +v)),
  story: v => after(S.buyStory(st, +v), true),
  tx: () => after(S.upgradeTx(st), true),
  loan: v => after(S.takeLoan(st, +v), true), repay: v => after(S.repayLoan(st, +v)),
  sound: () => { sound = !sound; renderRoom(); sfx.click(); },
  restart: () => modal('Neues Spiel?', '<p>Der aktuelle Spielstand geht verloren.</p>', [{ label: 'Abbrechen' }, { label: 'Neu starten', cls: 'bad', fn: () => { start(S.newGame()); save(); intro(); } }]),
  ffwd: () => { leaveRoom(); ffwd = true; if (!speed) setSpeed(1); hud(); },
};
roomEl.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  ACT[b.dataset.a](b.dataset.v);
});

// ---------- Eingabe ----------
// Tippen = Raum ansteuern, Wischen = Haus hoch/runter scrollen
const cvEl = $('#scene');
let drag = null;
const viewScale = () => { const rc = cvEl.getBoundingClientRect(); return { rc, sc: Math.min(rc.width / W, rc.height / cvEl.height) }; };
// Bildhöhe an den Bildschirm anpassen, damit kein Rand bleibt
function fit() { const rc = $('#stage').getBoundingClientRect(); if (rc.width > 0) cvEl.height = Math.max(340, Math.min(560, Math.round(W * rc.height / rc.width))); }
window.addEventListener('resize', fit); fit();
cvEl.addEventListener('pointerdown', e => {
  if (!st || modalOpen || room) return;
  drag = { y: e.clientY, last: e.clientY, moved: false };
  try { cvEl.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
});
cvEl.addEventListener('pointermove', e => {
  if (!drag) return;
  if (!drag.moved && Math.abs(e.clientY - drag.y) > 8) drag.moved = true;
  if (drag.moved) { scene.pan(-(e.clientY - drag.last) / viewScale().sc); drag.last = e.clientY; }
});
cvEl.addEventListener('pointerup', e => {
  const d = drag; drag = null;
  if (!d || d.moved || !st || modalOpen || room) return;
  const { rc, sc } = viewScale(), ox = (rc.width - W * sc) / 2, oy = (rc.height - cvEl.height * sc) / 2;
  const r = scene.roomAt((e.clientX - rc.left - ox) / sc, (e.clientY - rc.top - oy) / sc);
  if (r) { ffwd = false; scene.goTo(r, openRoom); hud(); }
});
cvEl.addEventListener('pointercancel', () => { drag = null; });
$('#hud').addEventListener('click', e => {
  const b = e.target.closest('[data-speed]'); if (!b || !st || modalOpen || st.over) return;
  ffwd = false; setSpeed(+b.dataset.speed); sfx.click();
});

// ---------- Schleife ----------
let last = performance.now(), lastMin = -1;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (st && !modalOpen) {
    scene.update(dt);
    if (speed > 0 && !st.over) {
      acc += dt * 1000 * (ffwd ? 25 : speed);
      let guard = 0;
      while (acc >= MS_PER_MIN && guard++ < 40 && !modalOpen) {
        acc -= MS_PER_MIN;
        const evs = S.tick(st);
        for (const e of evs) onEvent(e);
        if (evs.length && room) renderRoom();
      }
      if (modalOpen) acc = 0;
    }
  }
  if (st) {
    if (st.minute !== lastMin) { lastMin = st.minute; hud(); }
    const i = SLOTS.findIndex(s => st.minute >= s.start * 60 && st.minute < s.end * 60);
    scene.draw(st, i >= 0 && !!st.today[i].show);
  } else scene.draw(null, false);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && st) save(); last = performance.now(); });

titleScreen();
requestAnimationFrame(frame);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__sf = { get st() { return st; }, scene, S }; // für Tests
