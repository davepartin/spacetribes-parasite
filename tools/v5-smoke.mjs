#!/usr/bin/env node
/** v5 smoke test — drives the REAL engine in index.html with bots for full games.
 *  Usage: node tools/v5-smoke.mjs [games=200] [players=6]
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
  ALL_PIDS, CFG, COLORS, SCAR_DIE_FACES, MOD_LEVELS, CLAIM_KINDS, CHANNELS,
  newGameData, normalizeGame, resolveRound, totalRounds, infectionSlots,
  hostIdForRound, roundKind, rosterOf, tableSize, deep, findDie, applyForge, applySizeUp,
  rollFace, rollIndex, rollExplodingAttack, starterDice, starterModDie,
  scarCount, addScarDie, healOneScar, modFaceValue, modMaxLevel, canAddColor,
  uid, stdFaces, hotFaces, bossHP, parasiteTuning, parasiteBaseAttackNow,
  accOf, tokensBase, parShopCost, applyParShop, channelAddFor, dieSizeOf, randInt,
  get G(){ return G; }, set G(v){ G = v; },
};
`;
const sandbox = {
  console, Math, JSON, Date, parseInt, String, Number, Array, Object, Set, Map, Promise, Error, Uint32Array,
  crypto: { getRandomValues(arr){ for (let i=0;i<arr.length;i++) arr[i]=(Math.random()*0x100000000)>>>0; return arr; } },
  localStorage: { _d:{}, getItem(k){ return this._d[k] ?? null; }, setItem(k,v){ this._d[k]=String(v); }, removeItem(k){ delete this._d[k]; } },
  document: { querySelector(){ return { appendChild(){}, textContent:'', style:{} }; },
    createElement(){ return { style:{}, className:'', textContent:'', setAttribute(){}, appendChild(){}, remove(){} }; },
    body:{ appendChild(){} }, addEventListener(){}, getElementById(){ return null; } },
  window: {}, alert(){}, confirm(){ return true; }, setTimeout, clearTimeout,
  requestAnimationFrame(fn){ return setTimeout(fn, 0); },
  firebase: { apps:[{}], initializeApp(){}, database(){ return { ref(){ return { on(){}, once(){ return Promise.resolve({ val:()=>null }); }, set(){ return Promise.resolve(); }, update(){ return Promise.resolve(); }, transaction(){ return Promise.resolve({ committed:true }); }, child(){ return this; } }; } }; } },
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'index.html#script' });
const S = sandbox.__STP;
if (!S) throw new Error('bridge missing');

const { ALL_PIDS, CFG, COLORS, SCAR_DIE_FACES, CLAIM_KINDS, newGameData, normalizeGame, resolveRound,
  totalRounds, hostIdForRound, roundKind, rosterOf, deep, findDie, applyForge, applySizeUp,
  rollFace, rollIndex, rollExplodingAttack, scarCount, modFaceValue, canAddColor, uid, stdFaces,
  bossHP, parasiteTuning, accOf, parShopCost, applyParShop, dieSizeOf } = S;

const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
const r1 = x => Math.round(x*10)/10;

function botAction(pid, g){
  const pl = g.players[pid];
  const r = g.round;
  const kind = roundKind(r, g);
  const isHost = kind==='infection' && hostIdForRound(g, r)===pid;
  let energy = pl.energy||0;
  const forges = [], modUps = [], sizeUps = [];
  let addDie = null, healScars = 0;

  while ((pl.scars||0) - healScars > 0 && energy >= CFG.healScarCost && healScars < 2){
    healScars++; energy -= CFG.healScarCost;
  }
  if ((pl.dice||[]).length < 6 && energy >= CFG.addDieCost + 1){
    const counts = { red:0, blue:0, green:0 };
    (pl.dice||[]).forEach(d=>counts[d.color]++);
    const c = COLORS.filter(c=>counts[c]<CFG.maxDicePerColor).sort((a,b)=>counts[a]-counts[b])[0];
    if (c){ addDie = c; energy -= CFG.addDieCost; }
  }
  // one size-up if flush
  const sizable = (pl.dice||[]).filter(d=>dieSizeOf(d) < CFG.maxDieSize);
  if (sizable.length && energy >= CFG.sizeUpCost + 2){
    sizeUps.push(sizable[0].id); energy -= CFG.sizeUpCost;
  }
  // a mod upgrade sometimes
  if (energy >= CFG.modUpgradeCost + 2 && Math.random() < 0.5){
    const idx = (pl.modDie||[]).findIndex(f=>f && f.kind!=='scar' && (f.level|0) < 2);
    if (idx >= 0){ modUps.push(idx); energy -= CFG.modUpgradeCost; }
  }
  // forges with leftovers (keep 2 reserve)
  let guard = 0;
  while (energy >= CFG.forgeCost + 2 && guard++ < 3){
    let pick = null, low = 1e9;
    (pl.dice||[]).forEach(d=>d.faces.forEach((v,i)=>{ if (v<low){ low=v; pick={dieId:d.id, faceIndex:i}; } }));
    if (!pick || low >= 6) break;
    forges.push(pick); energy -= CFG.forgeCost;
  }

  // preview dice (sizes → forges → new die), then roll
  const dice = deep(pl.dice);
  sizeUps.forEach(id=>{ const d=findDie(dice,id); if (d) applySizeUp(d, CFG.maxDieSize); });
  forges.forEach(f=>{ const d=findDie(dice,f.dieId); if (d) applyForge(d, f.faceIndex, CFG.forgeBump); });
  if (addDie) dice.push({ id: uid(addDie[0]), color:addDie, faces:stdFaces(), size:6, bonus:true, tempNew:true });
  const rolls = dice.map(d=>{
    const rf = rollFace(d.faces);
    return { dieId:d.id, color:d.color, faces:d.faces, size:dieSizeOf(d), index:rf.index, v:rf.value, first:rf.value, rerolled:false, tempNew:!!d.tempNew, bonus:!!d.bonus };
  });

  const modPrev = deep(pl.modDie);
  modUps.forEach(i=>{ if (modPrev[i] && modPrev[i].kind!=='scar' && modPrev[i].level<2) modPrev[i].level++; });
  let mi = rollIndex(modPrev.length);
  let modRoll = { index:mi, kind:modPrev[mi].kind, level:modPrev[mi].level|0, value:modFaceValue(modPrev[mi]) };
  const gainScar = modRoll.kind==='scar';

  const scarsActive = Math.max(0, scarCount(pl) - healScars);
  const scarRolls = [];
  for (let s=0;s<scarsActive;s++){
    const si = rollIndex(SCAR_DIE_FACES.length);
    const f = SCAR_DIE_FACES[si];
    scarRolls.push({ index:si, id:f.id, label:f.label, level:1 });
  }

  const action = {
    phase:'locked', role: isHost?'host':'human', at: Date.now(),
    forges, modUps, sizeUps, addDie, buyFreeReroll:false, rerollBuys:0,
    healScars, gainScar, rolls, modRoll, scarRolls,
    scarRoll: scarRolls[0]||null, ptsDelta:0, scarEnergyLoss:0,
  };

  if (isHost){
    // parasite shop: must buy ≥1
    const bank = (g.parasite.bank||0) + parasiteTuning(rosterOf(g).length).parStipend;
    const pb = { dice:0, sizes:0, forges:0 };
    if ((g.parasite.attack||[]).length < CFG.parMaxDice && bank >= CFG.addDieCost && Math.random()<0.4) pb.dice = 1;
    else if (bank >= CFG.sizeUpCost && Math.random()<0.6) pb.sizes = 1;
    else pb.forges = Math.max(1, Math.min(2, bank|0));
    const fake = deep(g.parasite);
    applyParShop(fake, pb);
    const aRolls = (fake.attack||[]).map(d=>{
      const er = rollExplodingAttack(d.faces);
      return { dieId:d.id, faces:d.faces, size:dieSizeOf(d), index:er.index, v:er.value, shown:er.shown, exploded:er.exploded, first:er.value, rerolled:false };
    });
    const instIds = fake.instinct || ['gnash','fever','twin','echo','blank','explode'];
    const instinctRoll = instIds[rollIndex(instIds.length)];
    let instinctExtra = 0;
    if (instinctRoll==='explode') instinctExtra = rollExplodingAttack([3,4,5,6,7,8,9,10]).value;
    // channel: pick best of ravage/crush vs sever estimate
    const red = rolls.filter(d=>d.color==='red').reduce((s,d)=>s+d.v,0);
    const blue = rolls.filter(d=>d.color==='blue').reduce((s,d)=>s+d.v,0);
    const est = 18 + g.round; // rough sever estimate
    const opts = [ ['ravage', CFG.ravageMult*red - 6], ['crush', CFG.crushMult*blue - 2], ['sever', est] ];
    opts.sort((a,b)=>b[1]-a[1]);
    const channel = opts[0][0];
    let channelTarget = null;
    if (channel==='crush'){
      const crew = rosterOf(g).filter(p=>p!==pid);
      const cands = crew.filter(p=>scarCount(g.players[p]) < CFG.poisonGuardScars);
      const pool = cands.length ? cands : crew;
      channelTarget = pool.sort((a,b)=>(g.players[b].pts||0)-(g.players[a].pts||0))[0];
    }
    Object.assign(action, {
      channel, channelTarget, parBuys: pb, parRerolls: 0,
      growth: { key: channel, target: channelTarget },
      aRolls, instinctRoll, instinctExtra,
    });
  }
  return action;
}

const games = parseInt(process.argv[2]||'200',10);
const nPlayers = parseInt(process.argv[3]||'6',10);
let errs = 0, hostWins = 0, infections = 0, clears = 0, bossN = 0;
const byRound = {};
const finalSpreads = [], scarsTaken = [], negEnergy = [];

for (let gi=0; gi<games; gi++){
  try{
    const ids = ALL_PIDS.slice(0, nPlayers);
    let g = normalizeGame(newGameData(ids, ids.map((_,i)=>'Bot'+(i+1))));
    S.G = g;
    let guard = 0;
    while (g.status==='active' && guard++ < 40){
      const r = g.round;
      if (!g.rounds[r]) g.rounds[r] = { actions: {} };
      rosterOf(g).forEach(pid=>{ g.rounds[r].actions[pid] = botAction(pid, g); });
      g = resolveRound(g);
      S.G = g;
      const res = g.rounds[r] && g.rounds[r].result;
      if (!res) throw new Error('round '+r+' failed to resolve');
      if (res.kind==='infection'){
        infections++;
        if (res.hostWins) hostWins++;
        byRound[r] = byRound[r] || { n:0, w:0, crew:[], host:[] };
        byRound[r].n++; if (res.hostWins) byRound[r].w++;
        byRound[r].crew.push(res.crewTotal); byRound[r].host.push(res.hostTotal);
      } else if (res.kind==='boss'){
        bossN++; if (res.cleared) clears++;
      }
      rosterOf(g).forEach(p=>{ if ((g.players[p].energy|0) < 0) negEnergy.push(p); });
    }
    if (g.status!=='over') throw new Error('game never ended (round '+g.round+')');
    const pts = rosterOf(g).map(p=>g.players[p].pts||0);
    finalSpreads.push(Math.max(...pts)-Math.min(...pts));
    rosterOf(g).forEach(p=>scarsTaken.push(scarCount(g.players[p])));
  }catch(e){
    errs++;
    if (errs <= 3) console.error('GAME ERROR:', e.message);
  }
}

console.log(`\n== v5 smoke — ${nPlayers}p × ${games} games ==`);
console.log(`errors: ${errs}`);
console.log(`host win: ${r1(100*hostWins/Math.max(1,infections))}% over ${infections} infection rounds`);
for (const r of Object.keys(byRound).map(Number).sort((a,b)=>a-b)){
  const b = byRound[r];
  console.log(`  R${String(r).padStart(2)}: host ${r1(100*b.w/b.n)}% · crew ${r1(mean(b.crew))} vs host ${r1(mean(b.host))}`);
}
console.log(`boss clear: ${r1(100*clears/Math.max(1,bossN))}% (${bossN} games reached boss)`);
console.log(`avg final spread: ${r1(mean(finalSpreads))} · avg end scars held: ${r1(mean(scarsTaken))}`);
console.log(`negative-energy incidents: ${negEnergy.length}`);
