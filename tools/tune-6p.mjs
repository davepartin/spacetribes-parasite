#!/usr/bin/env node
/** Quick 6p-first balance tuner. Usage: node tools/tune-6p.mjs */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
let code = m[1].replace(/\/\* ================= BOOT ================= \*\/[\s\S]*$/, '');
code += `;
globalThis.__STP = {
  ALL_PIDS, CFG, TOTAL_ROUNDS, COLORS, SCAR_DIE_FACES, MOD_LEVELS,
  newGameData, normalizeGame, resolveRound,
  hostIdForRound, roundKind, rosterOf, deep, findDie, applyForge,
  rollFace, rollIndex, rollExplodingAttack, scarCount, modFaceValue,
  applyParasiteMove, parasiteMoveOptions, canAddColor, uid, stdFaces, hotFaces,
  parasiteTuning, parasiteBaseAttackNow, randInt,
  get G(){ return G; }, set G(v){ G = v; },
};
`;
const sandbox = {
  console, Math, JSON, Date, parseInt, String, Number, Array, Object, Set, Map, Promise, Error, Uint32Array,
  crypto: { getRandomValues(a) { for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 0x100000000) >>> 0; return a; } },
  localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } },
  document: {
    querySelector() { return { appendChild() {}, textContent: '', style: {} }; },
    createElement() { return { style: {}, className: '', textContent: '', setAttribute() {}, appendChild() {}, remove() {} }; },
    body: { appendChild() {} }, addEventListener() {},
  },
  window: {}, alert() {}, confirm() { return true; }, setTimeout, clearTimeout,
  requestAnimationFrame(fn) { return setTimeout(fn, 0); },
  firebase: { apps: [{}], initializeApp() {}, database() { return { ref() { return { on() {}, once() { return Promise.resolve({ val: () => null }); }, set() { return Promise.resolve(); }, update() { return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: true }); }, child() { return this; } }; } }; } },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'index.html#script' });
const S = sandbox.__STP;

function applyScarToBundle(rollsIn, modRollIn, scarRoll) {
  const rolls = S.deep(rollsIn || []);
  let modRoll = modRollIn ? S.deep(modRollIn) : null;
  let ptsDelta = 0, scarEnergyLoss = 0;
  if (!scarRoll || scarRoll.id === 'blank') return { rolls, modRoll, ptsDelta, scarEnergyLoss };
  if (scarRoll.id === 'drain') scarEnergyLoss = 2;
  else if (scarRoll.id === 'bleed') rolls.forEach(d => { d.v = Math.max(0, Math.floor((d.v || 0) * 0.8)); });
  else if (scarRoll.id === 'shatter' && rolls.length) {
    let hi = 0; for (let i = 1; i < rolls.length; i++) if ((rolls[i].v || 0) > (rolls[hi].v || 0)) hi = i;
    rolls[hi].scarNote = '−' + (rolls[hi].v || 0) + ' scar';
  }
  return { rolls, modRoll, ptsDelta, scarEnergyLoss };
}
function mean(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }

function simShopAndRoll(pid, g) {
  const {
    CFG, COLORS, SCAR_DIE_FACES, MOD_LEVELS, roundKind, hostIdForRound, rosterOf, deep, findDie, applyForge,
    rollFace, rollIndex, rollExplodingAttack, scarCount, modFaceValue, applyParasiteMove, parasiteMoveOptions,
    canAddColor, uid, stdFaces, hotFaces, randInt,
  } = S;
  const pl = g.players[pid];
  const r = g.round;
  const kind = roundKind(r, g);
  const isHost = kind === 'infection' && hostIdForRound(g, r) === pid;
  let energy = pl.energy || 0;
  const forges = [], modUps = [];
  let addDie = null, healScars = 0;
  while ((pl.scars || 0) - healScars > 0 && energy >= (CFG.healScarCost || 3) && healScars < 2) {
    healScars++; energy -= CFG.healScarCost || 3;
  }
  if (r >= 4 && (pl.dice || []).length < 4 && energy >= CFG.addDieCost) {
    const counts = { red: 0, blue: 0, green: 0 };
    (pl.dice || []).forEach(d => { counts[d.color] = (counts[d.color] || 0) + 1; });
    const color = COLORS.slice().sort((a, b) => counts[a] - counts[b])[0];
    if (canAddColor(pl, color, null)) { addDie = color; energy -= CFG.addDieCost; }
  }
  for (let pass = 0; pass < 2 && energy >= CFG.modUpgradeCost; pass++) {
    let best = -1, bestKindPri = 99;
    const pri = { pct: 0, base: 1, energy: 2 };
    (pl.modDie || []).forEach((f, i) => {
      if (!f || f.kind === 'scar' || (f.level | 0) >= 2) return;
      const queued = modUps.filter(x => x === i).length;
      if ((f.level | 0) + queued >= 2) return;
      const p = pri[f.kind] ?? 5;
      if (p < bestKindPri) { bestKindPri = p; best = i; }
    });
    if (best < 0) break;
    modUps.push(best); energy -= CFG.modUpgradeCost;
  }
  while (energy >= CFG.forgeCost && forges.length < 3) {
    let pick = null, score = 1e9;
    (pl.dice || []).forEach(d => d.faces.forEach((v, fi) => {
      const already = forges.filter(f => f.dieId === d.id && f.faceIndex === fi).length;
      const eff = v + already * CFG.forgeBump;
      if (eff < score) { score = eff; pick = { dieId: d.id, faceIndex: fi }; }
    }));
    if (!pick || score >= 8) break;
    forges.push(pick); energy -= CFG.forgeCost;
  }
  let growth = null;
  if (isHost) {
    const moves = parasiteMoveOptions(g.parasite, g);
    const weights = moves.map(o => {
      if (o.key === 'feed') return r <= 5 ? 3 : 2;
      if (o.key === 'harden') return 3;
      if (o.key === 'outbreak') return r >= 6 ? 3 : 1.5;
      if (o.key === 'poison') return 2;
      return 1;
    });
    let t = Math.random() * weights.reduce((a, b) => a + b, 0), o = moves[0];
    for (let i = 0; i < moves.length; i++) { t -= weights[i]; if (t <= 0) { o = moves[i]; break; } }
    growth = { key: o.key, lane: o.lane, target: null };
    if (o.key === 'poison') {
      const victims = rosterOf(g).filter(p => p !== pid);
      growth.target = victims.length ? victims[randInt(victims.length)] : null;
      if (!growth.target) growth = { key: 'feed', lane: 'soft', target: null };
    }
  }
  const dice = deep(pl.dice);
  forges.forEach(f => applyForge(findDie(dice, f.dieId), f.faceIndex, CFG.forgeBump));
  if (addDie) dice.push({ id: 'preview', color: addDie, faces: stdFaces(), bonus: true });
  const modDie = deep(pl.modDie);
  modUps.forEach(idx => {
    if (!modDie[idx] || modDie[idx].kind === 'scar') return;
    const max = (MOD_LEVELS[modDie[idx].kind] || []).length - 1;
    if ((modDie[idx].level | 0) < max) modDie[idx].level++;
  });
  let rolls = dice.map(d => {
    const rf = rollFace(d.faces);
    return {
      dieId: d.id === 'preview' ? uid(addDie[0]) : d.id, color: d.color, faces: d.faces,
      index: rf.index, v: rf.value, first: rf.value, rerolled: false, tempNew: d.id === 'preview',
      bonus: !!(d.bonus || d.id === 'preview'),
    };
  });
  let mi = rollIndex(modDie.length);
  let modRoll = { index: mi, kind: modDie[mi].kind, level: modDie[mi].level, value: modFaceValue(modDie[mi]) };
  let rerollBuys = 0;
  for (let attempt = 0; attempt < 2 && modRoll.kind === 'scar'; attempt++) {
    mi = rollIndex(modDie.length);
    modRoll = { index: mi, kind: modDie[mi].kind, level: modDie[mi].level, value: modFaceValue(modDie[mi]) };
    if (attempt === 1) rerollBuys++;
  }
  const gainScar = !!(modRoll && modRoll.kind === 'scar');
  const scarsActive = Math.max(0, scarCount(pl) - healScars);
  const scarRolls = [];
  for (let s = 0; s < scarsActive; s++) {
    const si = rollIndex(SCAR_DIE_FACES.length);
    const f = SCAR_DIE_FACES[si];
    scarRolls.push({ index: si, id: f.id, label: f.label, level: 1 });
  }
  let ptsDelta = 0, scarEnergyLoss = 0;
  scarRolls.forEach(sr => {
    if (!sr || sr.id === 'blank') return;
    const packed = applyScarToBundle(rolls, modRoll, sr);
    rolls = packed.rolls; modRoll = packed.modRoll;
    ptsDelta += packed.ptsDelta || 0; scarEnergyLoss += packed.scarEnergyLoss || 0;
  });
  const action = {
    phase: 'locked', role: isHost ? 'host' : 'human', at: Date.now(),
    forges, modUps, addDie, buyFreeReroll: false, rerollBuys, healScars, gainScar,
    rolls, modRoll, scarRolls, ptsDelta, scarEnergyLoss, bot: true, sim: true,
  };
  if (isHost && growth) {
    action.growth = growth;
    const fake = deep(g.parasite);
    applyParasiteMove(fake, growth.key, { scars: scarCount(pl) }, { poisonTarget: growth.target });
    action.aRolls = (fake.attack || []).map(d => {
      const er = rollExplodingAttack(d.faces);
      return { dieId: d.id, faces: d.faces, index: er.index, v: er.value, shown: er.shown, exploded: er.exploded, first: er.value, rerolled: false };
    });
    const pMod = (fake.mod && fake.mod.faces) || [];
    const pi = rollIndex(Math.max(1, pMod.length));
    action.pModRoll = deep(pMod[pi] || { type: 'flat', n: 5 });
    action.pModRoll.index = pi;
    const inst = fake.instinct || [];
    const ii = rollIndex(Math.max(1, inst.length));
    action.instinctRoll = inst[ii];
    action.instinctExtra = 0;
    if (action.instinctRoll === 'explode') action.instinctExtra = rollExplodingAttack(hotFaces()).value;
  }
  return action;
}

function installVariant(v) {
  S.CFG.parBaseAttack = -4;
  S.CFG.parBaseLossBump = v.bumpBase;
  S.CFG.outbreakTonight = v.out;
  S.CFG.startFusion = 0.5;
  S.CFG.fusionCap = 0.85;
  S.CFG.fusionStep = 0.1;
  S.CFG.auraGain = 1;
  sandbox.parasiteTuning = function (n) {
    n = Math.max(3, Math.min(6, n | 0 || 4));
    const crew = n - 1;
    const seatsAbove = Math.max(0, n - 4);
    return {
      n, crew, k: crew / 3,
      startFusion: Math.min(S.CFG.fusionCap, 0.5 + seatsAbove * v.fusPer),
      fusionCap: S.CFG.fusionCap,
      fusionStep: S.CFG.fusionStep,
      startAura: 0,
      auraGain: 1 + (n >= 6 ? v.a6 : 0),
      startBaseAttack: -4,
      seatBonus: v.seat[n] | 0,
      basePerSeatUp: 0, basePerSeatDown: 0, basePerSeat: 0,
      baseLossBump: v.bumpBase + seatsAbove * v.bumpPer,
      atkDice: 2, faceBonus: 0,
      hpBase: Math.round(S.CFG.hpBase * n / 4),
      hpPerMeter: Math.max(1, Math.round(S.CFG.hpPerMeter * n / 4)),
      parStipend: ({ 3: 5, 4: 6, 5: 7, 6: 7 })[n] || 6,
    };
  };
  S.parasiteTuning = sandbox.parasiteTuning;
  sandbox.parasiteBaseAttackNow = function (parasite, n) {
    const t = sandbox.parasiteTuning(n || (parasite && parasite.balanceN) || 4);
    const stored = (parasite && parasite.baseAttack != null) ? (parasite.baseAttack | 0) : (t.startBaseAttack | 0);
    const seatBonus = t.seatBonus | 0;
    return { stored, seatBonus, total: stored + seatBonus };
  };
  S.parasiteBaseAttackNow = sandbox.parasiteBaseAttackNow;
}

function runN(nPlayers, games) {
  const byR = {};
  let bossClear = 0, bossN = 0;
  for (let g = 0; g < games; g++) {
    const ids = S.ALL_PIDS.slice(0, nPlayers);
    let game = S.normalizeGame(S.newGameData(ids, ids.map((_, i) => 'Bot' + (i + 1))));
    S.G = game;
    while (game.status === 'active' && game.round <= S.TOTAL_ROUNDS) {
      const r = game.round;
      if (!game.rounds[r]) game.rounds[r] = { actions: {} };
      S.rosterOf(game).forEach(pid => { game.rounds[r].actions[pid] = simShopAndRoll(pid, game); });
      game = S.resolveRound(game);
      S.G = game;
      const res = game.rounds[r] && game.rounds[r].result;
      if (!res) break;
      if (res.kind === 'infection') {
        if (!byR[r]) byR[r] = { n: 0, h: 0 };
        byR[r].n++;
        if (res.hostWins) byR[r].h++;
      }
      if (res.kind === 'boss') { bossN++; if (res.cleared) bossClear++; }
    }
  }
  const rows = Object.keys(byR).map(Number).sort((a, b) => a - b).map(r => ({ r, win: 100 * byR[r].h / byR[r].n }));
  return {
    avg: mean(rows.map(x => x.win)),
    early: mean(rows.filter(x => x.r <= 4).map(x => x.win)),
    mid: mean(rows.filter(x => x.r >= 5 && x.r <= 7).map(x => x.win)),
    late: mean(rows.filter(x => x.r >= 8).map(x => x.win)),
    flat: mean(rows.map(x => Math.abs(x.win - 45))),
    boss: bossN ? 100 * bossClear / bossN : 0,
    rows,
  };
}

const games6 = 400;
const gamesOther = 180;
const variants = [
  // refine around B/H — 6p-first, keep 4p near 45–50
  { label: 'B  seat30 b2+2 f.05 a1', seat: { 3: -18, 4: 0, 5: 18, 6: 30 }, bumpBase: 2, bumpPer: 2, fusPer: 0.05, a6: 1, out: 4 },
  { label: 'B2 seat31 b2+2 f.05 a1', seat: { 3: -18, 4: 0, 5: 18, 6: 31 }, bumpBase: 2, bumpPer: 2, fusPer: 0.05, a6: 1, out: 4 },
  { label: 'B3 seat30 b2+2 f.06 a1', seat: { 3: -18, 4: 0, 5: 18, 6: 30 }, bumpBase: 2, bumpPer: 2, fusPer: 0.06, a6: 1, out: 4 },
  { label: 'B4 seat30 b2+2 f.05 a1 o5', seat: { 3: -18, 4: 0, 5: 18, 6: 30 }, bumpBase: 2, bumpPer: 2, fusPer: 0.05, a6: 1, out: 5 },
  { label: 'H2 seat29 b3+2 f.05 a1', seat: { 3: -18, 4: 0, 5: 17, 6: 29 }, bumpBase: 3, bumpPer: 2, fusPer: 0.05, a6: 1, out: 4 },
  { label: 'K  seat30 b2+2 f.05 a1 5p16', seat: { 3: -18, 4: 0, 5: 16, 6: 30 }, bumpBase: 2, bumpPer: 2, fusPer: 0.05, a6: 1, out: 4 },
  { label: 'L  seat30 b2.5eff f.05', seat: { 3: -18, 4: 0, 5: 18, 6: 30 }, bumpBase: 2, bumpPer: 2, fusPer: 0.05, a6: 1, out: 4 },
];

for (const v of variants) {
  installVariant(v);
  const r6 = runN(6, games6);
  const r4 = runN(4, gamesOther);
  const r5 = runN(5, gamesOther);
  const curve = r6.rows.map(x => `R${x.r}:${x.win.toFixed(0)}`).join(' ');
  console.log(`${v.label}
  6p avg=${r6.avg.toFixed(1)} e/m/l=${r6.early.toFixed(0)}/${r6.mid.toFixed(0)}/${r6.late.toFixed(0)} flat=${r6.flat.toFixed(1)} boss=${r6.boss.toFixed(0)}% ${curve}
  4p=${r4.avg.toFixed(0)}% 5p=${r5.avg.toFixed(0)}%`);
}
