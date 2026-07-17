#!/usr/bin/env node
/**
 * Monte Carlo balance harness for Space Tribes: Parasite (v4.8 / schema 9).
 * Runs full 10-round games with aggressive shop bots to measure host-vs-crew power.
 *
 * Usage: node tools/balance-sim.mjs [games=400] [players=4]
 *        node tools/balance-sim.mjs 200 all
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) throw new Error('no script');
let code = m[1].replace(/\/\* ================= BOOT ================= \*\/[\s\S]*$/, '');
code += `
;globalThis.__STP = {
  ALL_PIDS, CFG, TOTAL_ROUNDS, SCHEMA, COLORS, SCAR_DIE_FACES, MOD_LEVELS,
  newGameData, normalizeGame, resolveRound, buildBotAction,
  hostIdForRound, roundKind, rosterOf, tableSize, deep, findDie, applyForge,
  rollFace, rollIndex, rollExplodingAttack, starterDice, starterModDie,
  scarCount, addScarDie, healOneScar, modFaceValue, applyScarToBundle,
  applyParasiteMove, parasiteMoveOptions, computeHumanTotal, canAddColor,
  uid, stdFaces, hotFaces, bossHP, parasiteTuning, randInt, get G(){ return G; }, set G(v){ G = v; },
};
`;

const sandbox = {
  console,
  Math,
  JSON,
  Date,
  parseInt,
  String,
  Number,
  Array,
  Object,
  Set,
  Map,
  Promise,
  Error,
  Uint32Array,
  crypto: {
    getRandomValues(arr) {
      for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() * 0x100000000) >>> 0;
      return arr;
    },
  },
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] ?? null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
  },
  document: {
    querySelector() { return { appendChild() {}, textContent: '', style: {} }; },
    createElement() { return { style: {}, className: '', textContent: '', setAttribute() {}, appendChild() {}, remove() {} }; },
    body: { appendChild() {} },
    addEventListener() {},
  },
  window: {},
  alert() {},
  confirm() { return true; },
  setTimeout,
  clearTimeout,
  requestAnimationFrame(fn) { return setTimeout(fn, 0); },
  firebase: { apps: [{}], initializeApp() {}, database() { return { ref() { return { on() {}, once() { return Promise.resolve({ val: () => null }); }, set() { return Promise.resolve(); }, update() { return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: true }); }, child() { return this; } }; } }; } },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'index.html#script' });

const S = sandbox.__STP;
if (!S) throw new Error('engine bridge missing');
const {
  ALL_PIDS, CFG, TOTAL_ROUNDS, COLORS, SCAR_DIE_FACES,
  newGameData, normalizeGame, resolveRound,
  hostIdForRound, roundKind, rosterOf, deep, findDie, applyForge,
  rollFace, rollIndex, rollExplodingAttack,
  scarCount, modFaceValue, applyScarToBundle, applyParasiteMove, parasiteMoveOptions,
  canAddColor, uid, stdFaces, hotFaces, bossHP, parasiteTuning, randInt,
} = S;
function setG(g) { S.G = g; }

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}
function pct(n, d) { return d ? (100 * n / d) : 0; }
function round1(x) { return Math.round(x * 10) / 10; }
function round2(x) { return Math.round(x * 100) / 100; }

/** Stronger shop than in-game bots — spend to grow so late rounds reflect real power. */
function simShopAndRoll(pid, g) {
  const pl = g.players[pid];
  const r = g.round;
  const kind = roundKind(r, g);
  const isHost = kind === 'infection' && hostIdForRound(g, r) === pid;

  let energy = pl.energy || 0;
  const forges = [];
  const modUps = [];
  let addDie = null;
  let healScars = 0;

  // Heal scars first if any (keeps human power readable)
  while ((pl.scars || 0) - healScars > 0 && energy >= (CFG.healScarCost || 2) && healScars < 2) {
    healScars++;
    energy -= CFG.healScarCost || 2;
  }

  // Extra die mid-game if behind on dice count
  if (r >= 4 && (pl.dice || []).length < 4 && energy >= CFG.addDieCost) {
    const counts = { red: 0, blue: 0, green: 0 };
    (pl.dice || []).forEach(d => { counts[d.color] = (counts[d.color] || 0) + 1; });
    const color = COLORS.slice().sort((a, b) => counts[a] - counts[b])[0];
    if (canAddColor(pl, color, null)) {
      addDie = color;
      energy -= CFG.addDieCost;
    }
  }

  // Mod upgrades (skip scar faces)
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
    modUps.push(best);
    energy -= CFG.modUpgradeCost;
  }

  // Forges — bump lowest faces on best colors
  while (energy >= CFG.forgeCost && forges.length < 3) {
    let pick = null, score = 1e9;
    (pl.dice || []).forEach(d => {
      d.faces.forEach((v, fi) => {
        const already = forges.filter(f => f.dieId === d.id && f.faceIndex === fi).length;
        const eff = v + already * CFG.forgeBump;
        if (eff < score) { score = eff; pick = { dieId: d.id, faceIndex: fi }; }
      });
    });
    if (!pick || score >= 8) break;
    forges.push(pick);
    energy -= CFG.forgeCost;
  }

  let growth = null;
  if (isHost) {
    // Weighted move pick: early Feed/Harden, mid mix, late Outbreak more
    const moves = parasiteMoveOptions(g.parasite, g);
    const weights = moves.map(o => {
      if (o.key === 'feed') return r <= 5 ? 3 : 2;
      if (o.key === 'harden') return 3;
      if (o.key === 'outbreak') return r >= 6 ? 3 : 1.5;
      if (o.key === 'poison') return 2;
      return 1;
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    let t = Math.random() * sum;
    let o = moves[0];
    for (let i = 0; i < moves.length; i++) {
      t -= weights[i];
      if (t <= 0) { o = moves[i]; break; }
    }
    growth = { key: o.key, lane: o.lane, target: null };
    if (o.key === 'poison') {
      const victims = rosterOf(g).filter(p => p !== pid);
      growth.target = victims.length ? victims[randInt(victims.length)] : null;
      if (!growth.target) growth = { key: 'feed', lane: 'soft', target: null };
    }
  }

  const dice = deep(pl.dice);
  forges.forEach(f => {
    const d = findDie(dice, f.dieId);
    applyForge(d, f.faceIndex, CFG.forgeBump);
  });
  if (addDie) dice.push({ id: 'preview', color: addDie, faces: stdFaces(), bonus: true });

  const modDie = deep(pl.modDie);
  modUps.forEach(idx => { if (modDie[idx] && modDie[idx].kind !== 'scar' && modDie[idx].level < 2) modDie[idx].level++; });

  let rolls = dice.map(d => {
    const rf = rollFace(d.faces);
    const bonus = !!(d.bonus || d.id === 'preview');
    return {
      dieId: d.id === 'preview' ? uid(addDie[0]) : d.id,
      color: d.color, faces: d.faces, index: rf.index, v: rf.value,
      first: rf.value, rerolled: false, tempNew: d.id === 'preview', bonus,
    };
  });

  let mi = rollIndex(modDie.length);
  let modRoll = { index: mi, kind: modDie[mi].kind, level: modDie[mi].level, value: modFaceValue(modDie[mi]) };
  let rerollBuys = 0;
  // Free + one paid reroll to escape Mod Scar
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
    rolls = packed.rolls;
    modRoll = packed.modRoll;
    ptsDelta += packed.ptsDelta || 0;
    scarEnergyLoss += packed.scarEnergyLoss || 0;
  });

  const action = {
    phase: 'locked',
    role: isHost ? 'host' : 'human',
    at: Date.now(),
    forges, modUps, addDie, buyFreeReroll: false, rerollBuys,
    healScars, gainScar, rolls, modRoll, scarRolls, ptsDelta, scarEnergyLoss,
    bot: true, sim: true,
  };

  if (isHost && growth) {
    action.growth = growth;
    const fake = deep(g.parasite);
    const hostFake = { scars: scarCount(pl) };
    applyParasiteMove(fake, growth.key, hostFake, { poisonTarget: growth.target });
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
    if (action.instinctRoll === 'explode') {
      action.instinctExtra = rollExplodingAttack(hotFaces()).value;
    }
  }
  return action;
}

function playGame(nPlayers) {
  const ids = ALL_PIDS.slice(0, nPlayers);
  const names = ids.map((_, i) => 'Bot' + (i + 1));
  const bots = ids.map(() => true);
  let g = normalizeGame(newGameData(ids, names, bots));
  setG(g);

  const rounds = [];
  while (g.status === 'active' && g.round <= TOTAL_ROUNDS) {
    const r = g.round;
    if (!g.rounds[r]) g.rounds[r] = { actions: {} };
    rosterOf(g).forEach(pid => {
      g.rounds[r].actions[pid] = simShopAndRoll(pid, g);
    });
    g = resolveRound(g);
    setG(g);
    const res = g.rounds[r] && g.rounds[r].result;
    if (!res) break;

    const row = {
      r,
      kind: res.kind,
      hostId: res.hostId || null,
      crewTotal: res.crewTotal ?? null,
      hostTotal: res.hostTotal ?? null,
      hostHuman: res.hostHuman ?? null,
      hostWins: res.hostWins ?? null,
      move: res.growth && res.growth.key || null,
      aura: g.parasite.auraFlat || 0,
      atkDice: (g.parasite.attack || []).length,
      bossMeter: g.parasite.bossMeter || 0,
      fusion: g.parasite.fusionPct || 0,
      scarsAvg: mean(rosterOf(g).map(p => scarCount(g.players[p]))),
      energyAvg: mean(rosterOf(g).map(p => g.players[p].energy || 0)),
      diceAvg: mean(rosterOf(g).map(p => (g.players[p].dice || []).length)),
    };
    if (res.parPart) {
      row.parAtk = res.parPart.atk || 0;
      row.parFlat = (res.parPart.flat || 0) + (res.parPart.pctAdd || 0);
      row.parFusion = res.parPart.fusion || 0;
      row.parInstinct = res.parPart.instinctAdd || 0;
      row.parAura = res.parPart.aura || 0;
      row.parTonight = res.parPart.tonightFlat || 0;
      row.parTotal = res.parPart.total || 0;
    }
    if (res.kind === 'boss') {
      row.crewTotal = res.crewTotal;
      row.hp = res.hp;
      row.cleared = res.cleared;
      row.margin = res.crewTotal - res.hp;
    }
    if (res.kind === 'training' || res.kind === 'skirmish') {
      const totals = Object.values(res.totals || {});
      row.crewTotal = totals.reduce((a, b) => a + b, 0);
      row.avgHuman = mean(totals);
    }
    rounds.push(row);
  }
  return { rounds, escaped: !!g.escaped, finalPts: rosterOf(g).map(p => g.players[p].pts || 0) };
}

function runBatch(nPlayers, games) {
  const byRound = {};
  for (let i = 1; i <= 10; i++) {
    byRound[i] = {
      kind: null,
      n: 0,
      hostWins: 0,
      crew: [], host: [], hostHuman: [], par: [],
      aura: [], atkDice: [], boss: [], scars: [],
      moves: {},
      parBits: { atk: [], flat: [], fusion: [], instinct: [], aura: [], tonight: [] },
      bossClear: 0, bossN: 0, margins: [], hp: [],
      avgHuman: [],
    };
  }

  for (let g = 0; g < games; g++) {
    const { rounds } = playGame(nPlayers);
    rounds.forEach(row => {
      const b = byRound[row.r];
      b.kind = row.kind;
      b.n++;
      b.aura.push(row.aura);
      b.atkDice.push(row.atkDice);
      b.boss.push(row.bossMeter);
      b.scars.push(row.scarsAvg);
      if (row.kind === 'infection') {
        b.crew.push(row.crewTotal);
        b.host.push(row.hostTotal);
        b.hostHuman.push(row.hostHuman);
        b.par.push(row.parTotal);
        if (row.hostWins) b.hostWins++;
        if (row.move) b.moves[row.move] = (b.moves[row.move] || 0) + 1;
        if (row.parAtk != null) {
          b.parBits.atk.push(row.parAtk);
          b.parBits.flat.push(row.parFlat);
          b.parBits.fusion.push(row.parFusion);
          b.parBits.instinct.push(row.parInstinct);
          b.parBits.aura.push(row.parAura);
          b.parBits.tonight.push(row.parTonight || 0);
        }
      } else if (row.kind === 'boss') {
        b.bossN++;
        b.crew.push(row.crewTotal);
        b.hp.push(row.hp);
        b.margins.push(row.margin);
        if (row.cleared) b.bossClear++;
      } else {
        b.avgHuman.push(row.avgHuman);
        b.crew.push(row.crewTotal);
      }
    });
  }

  return { nPlayers, games, byRound, tuning: parasiteTuning(nPlayers) };
}

function formatReport(batch) {
  const lines = [];
  const t = batch.tuning;
  lines.push(`# Balance sim — ${batch.nPlayers}p × ${batch.games} games`);
  lines.push(`Tuning: fusion ${t.startFusion}→cap ${t.fusionCap}, aura ${t.startAura}/+${t.auraGain}, atkDice ${t.atkDice}, Par⚡ ${t.parStipend}, HP ${t.hpBase}+${t.hpPerMeter}×meter`);
  lines.push('');
  lines.push('| R | Kind | Crew Σ | Host Σ | Δ (H−C) | Host win% | Par Σ | Aura | Atk# | Boss | Scars |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');

  for (let r = 1; r <= 10; r++) {
    const b = batch.byRound[r];
    if (!b.n) continue;
    if (b.kind === 'infection') {
      const c = mean(b.crew), h = mean(b.host), p = mean(b.par);
      lines.push(`| ${r} | infect | ${round1(c)} | ${round1(h)} | ${round1(h - c)} | ${round1(pct(b.hostWins, b.n))}% | ${round1(p)} | ${round1(mean(b.aura))} | ${round1(mean(b.atkDice))} | ${round1(mean(b.boss))} | ${round2(mean(b.scars))} |`);
    } else if (b.kind === 'boss') {
      lines.push(`| ${r} | boss | ${round1(mean(b.crew))} | HP ${round1(mean(b.hp))} | margin ${round1(mean(b.margins))} | clear ${round1(pct(b.bossClear, b.bossN))}% | — | ${round1(mean(b.aura))} | ${round1(mean(b.atkDice))} | ${round1(mean(b.boss))} | ${round2(mean(b.scars))} |`);
    } else {
      lines.push(`| ${r} | ${b.kind} | avgHum ${round1(mean(b.avgHuman))} | — | — | — | — | ${round1(mean(b.aura))} | ${round1(mean(b.atkDice))} | ${round1(mean(b.boss))} | ${round2(mean(b.scars))} |`);
    }
  }

  lines.push('');
  lines.push('## Infection parasite package (avg parts)');
  lines.push('| R | Atk | Flat/% | Fusion | Instinct | Aura | Tonight |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|');
  for (let r = 2; r <= 9; r++) {
    const b = batch.byRound[r];
    if (b.kind !== 'infection') continue;
    const pb = b.parBits;
    lines.push(`| ${r} | ${round1(mean(pb.atk))} | ${round1(mean(pb.flat))} | ${round1(mean(pb.fusion))} | ${round1(mean(pb.instinct))} | ${round1(mean(pb.aura))} | ${round1(mean(pb.tonight))} |`);
  }

  lines.push('');
  lines.push('## Move mix (infection rounds)');
  for (let r = 2; r <= 9; r++) {
    const b = batch.byRound[r];
    if (b.kind !== 'infection') continue;
    const parts = Object.entries(b.moves).map(([k, v]) => `${k} ${round1(pct(v, b.n))}%`).join(' · ');
    lines.push(`- R${r}: ${parts || '—'}`);
  }

  // Balance callouts
  lines.push('');
  lines.push('## Balance read');
  const infect = [];
  for (let r = 2; r <= 9; r++) {
    const b = batch.byRound[r];
    if (b.kind !== 'infection') continue;
    infect.push({
      r,
      win: pct(b.hostWins, b.n),
      delta: mean(b.host) - mean(b.crew),
    });
  }
  if (infect.length) {
    const avgWin = mean(infect.map(x => x.win));
    lines.push(`- Host win rate across infection rounds: **${round1(avgWin)}%** (target ~45–55% for drama).`);
    infect.forEach(x => {
      let tag = 'ok';
      if (x.win >= 65 || x.delta > 8) tag = 'HOST HEAVY';
      else if (x.win <= 35 || x.delta < -8) tag = 'CREW HEAVY';
      lines.push(`  - R${x.r}: host ${round1(x.win)}% · Δ ${round1(x.delta)} → ${tag}`);
    });
  }
  const boss = batch.byRound[10];
  if (boss.bossN) {
    lines.push(`- Boss clear rate: **${round1(pct(boss.bossClear, boss.bossN))}%** · avg margin ${round1(mean(boss.margins))} (crew−HP).`);
  }
  return lines.join('\n');
}

const games = parseInt(process.argv[2] || '300', 10);
const playersArg = process.argv[3] || '4';
const sizes = playersArg === 'all' ? [3, 4, 5, 6] : [parseInt(playersArg, 10)];

const outDir = path.join(root, 'artifacts');
fs.mkdirSync(outDir, { recursive: true });

const reports = [];
for (const n of sizes) {
  process.stderr.write(`Sim ${n}p × ${games}…\n`);
  const batch = runBatch(n, games);
  const report = formatReport(batch);
  reports.push(report);
  const out = path.join(outDir, `balance-${n}p.md`);
  fs.writeFileSync(out, report + '\n');
  // also JSON for tooling
  fs.writeFileSync(path.join(outDir, `balance-${n}p.json`), JSON.stringify(batch, null, 2));
  console.log('\n' + report + '\n');
}

fs.writeFileSync(path.join(outDir, 'balance-summary.md'), reports.join('\n\n---\n\n') + '\n');
process.stderr.write(`Wrote artifacts/balance-*.md\n`);
