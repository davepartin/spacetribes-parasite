#!/usr/bin/env node
/**
 * v5 PROPOSAL Monte Carlo — standalone model of PROPOSAL-v5.md.
 * Now models the CHANNEL host turn (Ravage/Crush/Sever + scar ladder),
 * the parasite shop, and compares parasite dice builds:
 *   SWARM    — many plain d6s
 *   PREDATOR — 2–4 hot exploding dice (3–10 → sized up)
 *   TITAN    — two huge chaining dice
 *
 * Usage: node tools/v5-sim.mjs [games=400]
 */

const GAMES = parseInt(process.argv[2] || '400', 10);
const N = 6, ROUNDS = 13, INFECT = 12, LATE_FROM = 7;
const COLORS = ['red', 'blue', 'green'];

const CFG = {
  stipend: 6, underdogEn: 2, winEn: 2, catEn: 1,
  forge: 1, forgeBump: 2, sizeUp: 3, extraDie: 4, modUp: 2, heal: 3,
  rerollSec: 1,
  maxPerColor: 2, maxSize: 10, maxScars: 6, maxDice: 6,
  flatEarly: 6, flatLate: 8,
  ladderEarly: [5, 3, 1], ladderLate: [6, 4, 2],
  catEarly: 2, catLate: 3,
  hostWinEarly: 8, hostWinLate: 10,
  heroPts: [12, 8, 5, 3, 2, 1], failPts: [4, 3, 2, 2, 1, 1], killBlow: 5,
  stackClaims: true,
  // parasite
  mirrorBeta: 0.50, mirrorSeed: 55, holdBump: 2,
  parStipend: 7,
  // channels
  ravageMult: 2.0, crushMult: 1.75, severN: 2,
  // boss: HP mirrors round-12 crew + meter (meter = scars created + host wins)
  bossHpMult: 0.92, hpPerMeter: 1.5,
  parVariant: 'PREDATOR',
};

const LAD = { atk: [3, 4, 5], energy: [1, 2, 3], reroll: [2, 3, 4], pct: [10, 15, 20], points: [3, 4, 5] };
const MOD_KINDS = ['atk', 'energy', 'reroll', 'pct', 'points', 'scar'];
const SCAR_FACES = ['inert', 'drain', 'shatter', 'red', 'blue', 'green'];
const CLAIM_KINDS = ['atk', 'energy', 'reroll', 'pct'];

const ri = n => Math.floor(Math.random() * n);
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) * (x - m)))); };
const r1 = x => Math.round(x * 10) / 10;
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- human dice ---------- */
function mkDie(color) { return { color, size: 6, faces: [1, 2, 3, 4, 5, 6] }; }
function sizeUp(d) { for (let s = d.size + 1; s <= d.size + 2; s++) d.faces.push(s); d.size += 2; }
function ev(d) { return mean(d.faces); }
function rollDie(d) { return d.faces[ri(d.faces.length)]; }

/* ---------- strategies ---------- */
const STRATS = {
  RUSHER:  { buys: ['die', 'forge'],            claimPri: ['atk', 'energy'], reserve: 1, healAt: 3, greedy: false, sizeSmallFirst: true },
  GAMBLER: { buys: ['size', 'die', 'forge'],    claimPri: ['reroll', 'pct'], reserve: 2, healAt: 2, greedy: false, sizeSmallFirst: false },
  SNIPER:  { buys: ['forgeTop', 'die', 'size'], claimPri: ['atk', 'pct'],    reserve: 2, healAt: 2, greedy: false, sizeSmallFirst: false },
  ENGINE:  { buys: ['modup', 'die', 'forge'],   claimPri: ['energy', 'pct'], reserve: 2, healAt: 2, greedy: false, sizeSmallFirst: true, modupOnly: ['energy', 'pct'] },
  MEDIC:   { buys: ['die', 'size', 'forge'],    claimPri: ['energy', 'atk'], reserve: 2, healAt: 1, greedy: false, sizeSmallFirst: true },
  HOARDER: { buys: ['size', 'die', 'forge'],    claimPri: ['pct', 'atk'],    reserve: 4, healAt: 2, greedy: true, sizeSmallFirst: true },
};
const STRAT_NAMES = Object.keys(STRATS);

function mkPlayer(id, strat) {
  return {
    id, strat, pts: 0, energy: 0,
    dice: [mkDie('red'), mkDie('blue'), mkDie('green')],
    modLv: { atk: 0, energy: 0, reroll: 0, pct: 0, points: 0 },
    claims: { atk: 0, energy: 0, reroll: 0, pct: 0 },
    acc: { atk: 0, energy: 0, reroll: 0, pct: 0 }, locks: 0,
    claimRound: {}, scars: 0, maxScars: 0, scarsTaken: 0, lastAtHalf: false, hostWins: 0,
  };
}
function claimVal(pl, k) {
  if (CFG.stackClaims) return pl.acc[k];
  return pl.claims[k] ? LAD[k][pl.claims[k] - 1] : 0;
}
function tokensFor(pl) {
  if (CFG.stackClaims) return 1 + pl.acc.reroll;
  return pl.claims.reroll ? LAD.reroll[pl.claims.reroll - 1] : 1;
}

/* ---------- human shop ---------- */
function shop(pl) {
  const S = STRATS[pl.strat];
  const spend = cost => { if (pl.energy - cost >= S.reserve) { pl.energy -= cost; return true; } return false; };
  while (pl.scars >= S.healAt && pl.energy - CFG.heal >= Math.min(S.reserve, 1)) {
    pl.energy -= CFG.heal; pl.scars--;
  }
  let bought = true;
  while (bought) {
    bought = false;
    for (const b of S.buys) {
      if (b === 'die' && pl.dice.length < CFG.maxDice) {
        const counts = {}; COLORS.forEach(c => counts[c] = pl.dice.filter(d => d.color === c).length);
        const c = COLORS.filter(c => counts[c] < CFG.maxPerColor).sort((a, b) => counts[a] - counts[b])[0];
        if (c && spend(CFG.extraDie)) { pl.dice.push(mkDie(c)); bought = true; break; }
      }
      if (b === 'size') {
        const cands = pl.dice.filter(d => d.size < CFG.maxSize)
          .sort((a, b) => S.sizeSmallFirst ? a.size - b.size : b.size - a.size);
        if (cands[0] && spend(CFG.sizeUp)) { sizeUp(cands[0]); bought = true; break; }
      }
      if (b === 'modup') {
        const only = S.modupOnly || CLAIM_KINDS;
        const k = only.find(k => pl.modLv[k] < 2);
        if (k && spend(CFG.modUp)) { pl.modLv[k]++; bought = true; break; }
      }
      if (b === 'forge' || b === 'forgeTop') {
        let best = null, bi = -1, bv = b === 'forgeTop' ? -1 : 1e9;
        pl.dice.forEach(d => d.faces.forEach((v, i) => {
          if (b === 'forgeTop' ? v > bv : v < bv) { bv = v; best = d; bi = i; }
        }));
        if (b === 'forge' && bv >= 6) continue;
        if (b === 'forgeTop' && bv >= 12) continue;
        if (best && spend(CFG.forge)) { best.faces[bi] += CFG.forgeBump; bought = true; break; }
      }
    }
  }
}

/* ---------- human roll (tokens) ---------- */
function rollBundle(pl, r) {
  let tokens = tokensFor(pl);
  const payReroll = () => {
    if (tokens > 0) { tokens--; return true; }
    if (pl.energy >= CFG.rerollSec) { pl.energy -= CFG.rerollSec; return true; }
    return false;
  };

  let atk = pl.dice.map(d => ({ color: d.color, v: rollDie(d) }));
  const evSum = pl.dice.reduce((s, d) => s + ev(d), 0);
  for (let t = 0; t < 2; t++) {
    const sum = atk.reduce((s, x) => s + x.v, 0);
    if (sum >= 0.85 * evSum) break;
    if (!payReroll()) break;
    atk = pl.dice.map(d => ({ color: d.color, v: rollDie(d) }));
  }

  const S = STRATS[pl.strat];
  let modKind = MOD_KINDS[ri(6)];
  for (let t = 0; t < 3; t++) {
    const isScar = modKind === 'scar';
    const isDead = !CFG.stackClaims && CLAIM_KINDS.includes(modKind) && pl.modLv[modKind] + 1 <= pl.claims[modKind];
    const wantChase = tokens > 0 && (isScar || isDead);
    if (!isScar && !wantChase) break;
    if (!payReroll()) break;
    modKind = MOD_KINDS[ri(6)];
  }

  let scarRolls = Array.from({ length: pl.scars }, () => SCAR_FACES[ri(6)]);
  const pain = rolls => rolls.reduce((s, f) => {
    if (f === 'shatter') return s + Math.max(0, ...atk.map(x => x.v));
    if (COLORS.includes(f)) return s + Math.floor(0.5 * atk.filter(x => x.color === f).reduce((a, x) => a + x.v, 0));
    if (f === 'drain') return s + 2;
    return s;
  }, 0);
  for (let t = 0; t < 2; t++) {
    if (pain(scarRolls) < 5) break;
    if (!payReroll()) break;
    scarRolls = Array.from({ length: pl.scars }, () => SCAR_FACES[ri(6)]);
  }

  let ptsGain = 0, gainScar = false;
  if (modKind === 'scar') gainScar = true;
  else if (modKind === 'points') {
    const claimsDone = S.claimPri.every(k => pl.claims[k] >= 1);
    if (S.greedy || claimsDone || r >= 10) ptsGain = LAD.points[pl.modLv.points];
  } else if (CFG.stackClaims) {
    const gain = modKind === 'reroll' ? 1 : LAD[modKind][pl.modLv[modKind]];
    pl.acc[modKind] += gain;
    pl.locks++;
    pl.claims[modKind] = Math.max(pl.claims[modKind], 1);
    if (!pl.claimRound[modKind]) pl.claimRound[modKind] = r;
  } else {
    const tier = pl.modLv[modKind] + 1;
    if (tier > pl.claims[modKind]) {
      pl.claims[modKind] = tier;
      if (!pl.claimRound[modKind]) pl.claimRound[modKind] = r;
    }
  }
  if (gainScar && pl.scars < CFG.maxScars) { pl.scars++; pl.scarsTaken++; pl.maxScars = Math.max(pl.maxScars, pl.scars); }

  const attackSum = atk.reduce((s, x) => s + x.v, 0);
  let sub = 0, drain = 0;
  scarRolls.forEach(f => {
    if (f === 'drain') drain += 2;
    else if (f === 'shatter') sub += Math.max(0, ...atk.map(x => x.v));
    else if (COLORS.includes(f)) sub += Math.floor(0.5 * atk.filter(x => x.color === f).reduce((a, x) => a + x.v, 0));
  });
  const pctAdd = Math.floor(attackSum * claimVal(pl, 'pct') / 100);
  const total = Math.max(0, attackSum + claimVal(pl, 'atk') + pctAdd - sub);
  pl.energy = Math.max(0, pl.energy - drain);
  const bestByColor = {}, colorTotal = {};
  COLORS.forEach(c => {
    const vals = atk.filter(x => x.color === c).map(x => x.v);
    bestByColor[c] = Math.max(0, ...vals);
    colorTotal[c] = vals.reduce((s, v) => s + v, 0);
  });
  return { total, attackSum, bestByColor, colorTotal, allVals: atk.map(x => x.v), ptsGain, highest: Math.max(0, ...atk.map(x => x.v)) };
}

/* ---------- parasite dice variants ---------- */
const PAR_VARIANTS = {
  // many small plain dice — buys more d6s
  SWARM: {
    start: () => [pd(6, 1), pd(6, 1), pd(6, 1), pd(6, 1)],
    maxDice: 8, explode: false,
    shopPlan: ['die', 'die', 'forge'],
  },
  // few hot dice, explode on max, sized up over time
  PREDATOR: {
    start: () => [pd(8, 3), pd(8, 3)],
    maxDice: 4, explode: true,
    shopPlan: ['size', 'die', 'forge'],
  },
  // two monsters, chain-exploding, forged hard
  TITAN: {
    start: () => [pd(12, 4), pd(12, 4)],
    maxDice: 2, explode: true, chain: true,
    shopPlan: ['forge', 'forge', 'size'],
  },
};
function pd(size, lo) { // parasite die: faces lo..lo+size-1
  const faces = []; for (let i = 0; i < size; i++) faces.push(lo + i);
  return { size, faces };
}
function mkParasite() {
  const V = PAR_VARIANTS[CFG.parVariant];
  return { dice: V.start(), bank: 0, meter: 0, prevCrew: CFG.mirrorSeed, base: 0 };
}
function parShop(par) {
  const V = PAR_VARIANTS[CFG.parVariant];
  par.bank += CFG.parStipend;
  let mustBuy = true, guard = 0;
  while (guard++ < 20) {
    let bought = false;
    for (const b of V.shopPlan) {
      if (b === 'die' && par.dice.length < V.maxDice && par.bank >= CFG.extraDie) {
        par.dice.push(CFG.parVariant === 'SWARM' ? pd(6, 1) : pd(8, 3));
        par.bank -= CFG.extraDie; bought = true; break;
      }
      if (b === 'size' && par.bank >= CFG.sizeUp) {
        const d = par.dice.filter(d => d.size < 12).sort((a, b) => a.size - b.size)[0];
        if (d) { for (let s = 0; s < 2; s++) d.faces.push(Math.max(...d.faces) + 1); d.size += 2; par.bank -= CFG.sizeUp; bought = true; break; }
      }
      if (b === 'forge' && par.bank >= CFG.forge) {
        const d = par.dice[ri(par.dice.length)];
        let lo = 0; d.faces.forEach((v, i) => { if (v < d.faces[lo]) lo = i; });
        d.faces[lo] += CFG.forgeBump; par.bank -= CFG.forge; bought = true; break;
      }
    }
    if (!bought) break;
    if (mustBuy) mustBuy = false;
    if (par.bank < 4 && !mustBuy) break; // keep a little for future hosts
  }
}
function rollParDice(par) {
  const V = PAR_VARIANTS[CFG.parVariant];
  let sum = 0;
  par.dice.forEach(d => {
    let v = d.faces[ri(d.faces.length)];
    let total = v, chainGuard = 0;
    while (V.explode && v === Math.max(...d.faces) && chainGuard++ < (V.chain ? 5 : 1)) {
      v = d.faces[ri(d.faces.length)];
      total += v;
    }
    sum += total;
  });
  return sum;
}

/* ---------- channels ---------- */
function chooseChannel(hostB, estTop3) {
  // host sees own roll only; estimates Sever from last round's crew
  const ravage = CFG.ravageMult * hostB.colorTotal.red;
  const crush = CFG.crushMult * hostB.colorTotal.blue;
  const sever = estTop3; // pure denial, no self add
  // aversion: ravage sprays scars (incl. you) → biggest penalty; crush 1 target → small; sever safe
  const adj = { ravage: ravage - 6, crush: crush - 2, sever: sever };
  return Object.keys(adj).sort((a, b) => adj[b] - adj[a])[0];
}

function schedule12(ids) {
  const bag = [...ids, ...ids];
  for (let tries = 0; tries < 200; tries++) {
    const s = shuffle(bag);
    if (s.every((p, i) => i === 0 || p !== s[i - 1])) return s;
  }
  return bag;
}

/* ---------- one game ---------- */
function playGame(collect) {
  const strats = shuffle(STRAT_NAMES);
  const players = strats.map((s, i) => mkPlayer('p' + (i + 1), s));
  const par = mkParasite();
  const sched = schedule12(players.map(p => p.id));
  let underdogs = new Set();
  let estTop3 = 18; // rolling estimate of crew top-3 dice for Sever choice
  let scarsCreated = 0;

  for (let r = 1; r <= ROUNDS; r++) {
    const late = r >= LATE_FROM;
    players.forEach(pl => {
      pl.energy += CFG.stipend + claimVal(pl, 'energy') + (underdogs.has(pl.id) ? CFG.underdogEn : 0);
    });
    players.forEach(pl => shop(pl));
    const bundles = {};
    players.forEach(pl => { bundles[pl.id] = rollBundle(pl, r); pl.pts += bundles[pl.id].ptsGain; });

    if (r === ROUNDS) {
      const crewTotal = players.reduce((s, pl) => s + bundles[pl.id].total, 0);
      const hp = Math.round(CFG.bossHpMult * par.prevCrew * 6 / 5) + Math.round(CFG.hpPerMeter * par.meter);
      const cleared = crewTotal >= hp;
      const order = players.slice().sort((a, b) => bundles[b.id].total - bundles[a.id].total);
      const ranks = cleared ? CFG.heroPts : CFG.failPts;
      order.forEach((pl, i) => pl.pts += ranks[i] || 1);
      if (cleared) order[0].pts += CFG.killBlow;
      collect.boss.push({ crewTotal, hp, meter: par.meter, cleared });
      break;
    }

    const host = players.find(p => p.id === sched[r - 1]);
    const crew = players.filter(p => p !== host);
    // parasite shop (mandatory growth)
    parShop(par);
    const hostB = bundles[host.id];
    const channel = chooseChannel(hostB, estTop3);

    // channel effects
    let chanAdd = 0, severSub = 0;
    const giveScar = pl => { if (pl.scars < CFG.maxScars) { pl.scars++; pl.scarsTaken++; pl.maxScars = Math.max(pl.maxScars, pl.scars); scarsCreated++; } };
    giveScar(host); // hosting always costs a scar
    if (channel === 'ravage') {
      chanAdd = Math.round(CFG.ravageMult * hostB.colorTotal.red);
      crew.forEach(giveScar);
    } else if (channel === 'crush') {
      chanAdd = Math.round(CFG.crushMult * hostB.colorTotal.blue);
      const target = crew.filter(p => p.scars < 2).sort((a, b) => b.pts - a.pts)[0] || crew.sort((a, b) => b.pts - a.pts)[0];
      if (target) giveScar(target);
    } else {
      // sever: cancel crew's 3 highest dice
      const allDice = [];
      crew.forEach(pl => bundles[pl.id].allVals.forEach(v => allDice.push(v)));
      allDice.sort((a, b) => b - a);
      severSub = allDice.slice(0, CFG.severN).reduce((s, v) => s + v, 0);
    }

    const parDiceSum = rollParDice(par);
    const mirrorBase = Math.round(CFG.mirrorBeta * par.prevCrew) + par.base;
    const parTotal = mirrorBase + parDiceSum + chanAdd;
    const hostTotal = hostB.total + parTotal;
    const crewTotal = Math.max(0, crew.reduce((s, pl) => s + bundles[pl.id].total, 0) - severSub);
    const hostWins = hostTotal > crewTotal;

    if (hostWins) {
      host.pts += late ? CFG.hostWinLate : CFG.hostWinEarly;
      host.energy += CFG.winEn;
      host.hostWins++;
      par.meter += 1;
    } else {
      const flat = late ? CFG.flatLate : CFG.flatEarly;
      const ladder = late ? CFG.ladderLate : CFG.ladderEarly;
      crew.forEach(pl => { pl.pts += flat; pl.energy += CFG.winEn; });
      crew.slice().sort((a, b) => bundles[b.id].total - bundles[a.id].total)
        .forEach((pl, i) => { if (ladder[i]) pl.pts += ladder[i]; });
      par.base += CFG.holdBump;
    }
    par.meter += (channel === 'ravage' ? 6 : channel === 'crush' ? 2 : 1); // meter = scars created
    COLORS.forEach(c => {
      const best = crew.slice().sort((a, b) => bundles[b.id].bestByColor[c] - bundles[a.id].bestByColor[c]);
      if (bundles[best[0].id].bestByColor[c] > bundles[best[1].id].bestByColor[c]) {
        best[0].pts += late ? CFG.catLate : CFG.catEarly;
        best[0].energy += CFG.catEn;
      }
    });
    const minPts = Math.min(...players.map(p => p.pts));
    underdogs = new Set(players.filter(p => p.pts === minPts).map(p => p.id));
    if (r === LATE_FROM - 1) players.slice().sort((a, b) => a.pts - b.pts)[0].lastAtHalf = true;

    // rolling estimate for next host's Sever call
    const allDice = [];
    crew.forEach(pl => bundles[pl.id].allVals.forEach(v => allDice.push(v)));
    allDice.sort((a, b) => b - a);
    estTop3 = Math.round(0.5 * estTop3 + 0.5 * allDice.slice(0, CFG.severN).reduce((s, v) => s + v, 0));

    collect.rounds[r] = collect.rounds[r] || { hostWin: 0, n: 0, crew: [], host: [], par: [], margins: [], chan: {} };
    const cr = collect.rounds[r];
    cr.n++; if (hostWins) cr.hostWin++;
    cr.crew.push(crewTotal); cr.host.push(hostTotal); cr.par.push(parTotal);
    cr.margins.push(hostTotal - crewTotal);
    cr.chan[channel] = (cr.chan[channel] || 0) + 1;
    par.prevCrew = crewTotal + severSub; // mirror sees true crew strength, not severed
  }

  collect.scarsCreated.push(scarsCreated);
  const ranked = players.slice().sort((a, b) => b.pts - a.pts);
  ranked.forEach((pl, i) => {
    collect.players.push({
      strat: pl.strat, pts: pl.pts, place: i + 1, won: i === 0,
      maxScars: pl.maxScars, scarsTaken: pl.scarsTaken, lastAtHalf: pl.lastAtHalf,
      energyClaimRound: pl.claimRound.energy || null, locks: pl.locks,
    });
  });
}

function run(games) {
  const collect = { rounds: {}, boss: [], players: [], scarsCreated: [] };
  for (let i = 0; i < games; i++) playGame(collect);
  return collect;
}

/* ---------- tuning ---------- */
function flatness(c) {
  return mean(Object.values(c.rounds).map(b => Math.abs(100 * b.hostWin / b.n - 50)));
}
function tune() {
  let best = null;
  for (const beta of [0.30, 0.34, 0.38, 0.42, 0.46, 0.50]) {
    CFG.mirrorBeta = beta;
    const c = run(150);
    const f = flatness(c);
    const avg = mean(Object.values(c.rounds).map(b => 100 * b.hostWin / b.n));
    process.stderr.write(`  beta ${beta} → host ${r1(avg)}% flatness ${r1(f)}\n`);
    if (avg < 40 || avg > 60) continue;
    if (!best || f < best.f) best = { beta, f, avg };
  }
  if (best) CFG.mirrorBeta = best.beta;
  process.stderr.write(`Tuned mirrorBeta=${CFG.mirrorBeta}\n`);
}
function tuneBoss() {
  let best = null;
  for (const m of [0.82, 0.86, 0.90, 0.94, 0.98]) {
    CFG.bossHpMult = m;
    const c = run(150);
    const clear = 100 * c.boss.filter(b => b.cleared).length / c.boss.length;
    if (!best || Math.abs(clear - 50) < Math.abs(best.clear - 50)) best = { m, clear };
  }
  CFG.bossHpMult = best.m;
  process.stderr.write(`Tuned bossHpMult=${best.m} (clear ${r1(best.clear)}%)\n`);
}

/* ---------- reporting ---------- */
function summarize(c, label) {
  const lines = [];
  const rates = Object.values(c.rounds).map(b => 100 * b.hostWin / b.n);
  const margins = Object.values(c.rounds).flatMap(b => b.margins);
  const close = margins.filter(m => Math.abs(m) <= 12).length / margins.length;
  const chanTotals = {};
  Object.values(c.rounds).forEach(b => Object.entries(b.chan).forEach(([k, v]) => chanTotals[k] = (chanTotals[k] || 0) + v));
  const chanN = Object.values(chanTotals).reduce((a, b) => a + b, 0);
  const bossClear = 100 * c.boss.filter(b => b.cleared).length / c.boss.length;
  lines.push(`### ${label}`);
  lines.push(`- Host win **${r1(mean(rates))}%** (flatness ${r1(flatness(c))}) · boss clear ${r1(bossClear)}% · drama: margin σ ${r1(sd(margins))}, close rounds (|Δ|≤12) ${r1(100 * close)}%`);
  lines.push(`- Channel mix: ${Object.entries(chanTotals).map(([k, v]) => `${k} ${r1(100 * v / chanN)}%`).join(' · ')}`);
  lines.push(`- Scars created/game: ${r1(mean(c.scarsCreated))} · avg scars taken per player: ${r1(mean(c.players.map(p => p.scarsTaken)))} · hit 3+ concurrent: ${r1(100 * c.players.filter(p => p.maxScars >= 3).length / c.players.length)}% of players`);
  const lastHalf = c.players.filter(p => p.lastAtHalf);
  lines.push(`- Catch-up: last-at-half escapes bottom-two ${r1(100 * lastHalf.filter(p => p.place <= 4).length / Math.max(1, lastHalf.length))}% · spread ${r1(spreadOf(c))}`);
  const st = ['| Strategy | Win% | Avg place |', '|---|---:|---:|'];
  for (const s of STRAT_NAMES) {
    const rows = c.players.filter(p => p.strat === s);
    st.push(`| ${s} | ${r1(100 * rows.filter(p => p.won).length / rows.length)}% | ${r1(mean(rows.map(p => p.place)))} |`);
  }
  lines.push(...st);
  return lines;
}
function spreadOf(c) {
  const spreads = [];
  for (let i = 0; i < c.players.length; i += N) {
    const g = c.players.slice(i, i + N);
    spreads.push(Math.max(...g.map(p => p.pts)) - Math.min(...g.map(p => p.pts)));
  }
  return mean(spreads);
}

const lines = [];
lines.push(`# v5 channel sim — 6p × ${GAMES} games/variant`);
lines.push(`Channels: Ravage ${CFG.ravageMult}×red (scars ALL) · Crush ${CFG.crushMult}×blue (scar 1 chosen) · Sever cancel top ${CFG.severN} crew dice (no self add) · host always takes a scar`);
lines.push(`Parasite shop: stipend ${CFG.parStipend}⚡/host turn, same prices as crew. Boss HP = ${CFG.bossHpMult}× crew strength + ${CFG.hpPerMeter}×meter (meter = scars+wins)`);
lines.push('');

for (const v of ['SWARM', 'PREDATOR', 'TITAN']) {
  CFG.parVariant = v;
  process.stderr.write(`\n=== ${v} — tuning…\n`);
  tune();
  tuneBoss();
  process.stderr.write(`${v} main run…\n`);
  const c = run(GAMES);
  const V = PAR_VARIANTS[v];
  const desc = v === 'SWARM' ? '4→8 plain d6s (no explode)' : v === 'PREDATOR' ? '2→4 hot dice (3–10), explode once on max, size-ups' : '2 huge dice (4–15), chain-exploding, forged hard';
  lines.push(...summarize(c, `${v} — ${desc} · mirrorBeta ${CFG.mirrorBeta}`));
  lines.push('');
}

const report = lines.join('\n');
console.log('\n' + report + '\n');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'balance-v5-channels.md'), report + '\n');
process.stderr.write('Wrote artifacts/balance-v5-channels.md\n');
