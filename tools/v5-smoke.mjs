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
  uid, stdFaces, hotFaces, bossHP, bossHPParts, parasiteTuning, parasiteBaseAttackNow,
  accOf, tokensBase, parShopCost, applyParShop, channelAddFor, dieSizeOf, randInt,
  nextHumanDieCost, nextParasiteDieCost, forgeLevelOf,
  rerollHumanAttackDie, rerollParAttackDie, computeParasitePortion,
  buildBasicBotAction, fillMissingBotActions,
  get G(){ return G; }, set G(v){ G = v; },
  get session(){ return session; }, set session(v){ session = v; },
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
  bossHP, bossHPParts, parasiteTuning, accOf, parShopCost, applyParShop, dieSizeOf,
  nextHumanDieCost, nextParasiteDieCost, forgeLevelOf, computeParasitePortion } = S;

const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
const r1 = x => Math.round(x*10)/10;

// Core v5.1 shop invariant: L3 is +4 max, and size-up erases every forge.
{
  const d = S.starterDice()[0];
  if (!applyForge(d,5,CFG.forgeBump) || !applyForge(d,5,CFG.forgeBump) || applyForge(d,5,CFG.forgeBump) || d.faces[5]!==10){
    throw new Error('forge level cap invariant failed');
  }
  if (!applySizeUp(d,CFG.maxDieSize) || d.faces.join(',')!=='1,2,3,4,5,6,7,8' || forgeLevelOf(d,5)!==0){
    throw new Error('size-up forge reset invariant failed');
  }
}

// Solo 3-player playtest: human on P1, Computers on P2 and P3.
{
  const ids=ALL_PIDS.slice(0,3);
  const g=S.normalizeGame(S.newGameData(ids,['Dave','CPU 2','CPU 3'],['p2','p3']));
  if(g.players.p1.isBot || !g.players.p2.isBot || !g.players.p3.isBot) throw new Error('two-computer seat invariant failed');
  if(!S.fillMissingBotActions(g)) throw new Error('two computers did not fill missing turns');
  const a2=g.rounds[1].actions.p2, a3=g.rounds[1].actions.p3;
  if(!a2 || a2.phase!=='locked' || !a3 || a3.phase!=='locked') throw new Error('both computers must lock a normal turn');
  for (const pid of ['p2','p3']){
    const hostRound=g.schedule.indexOf(pid)+1;
    g.round=hostRound; g.rounds[hostRound]={actions:{}};
    S.fillMissingBotActions(g);
    const a=g.rounds[hostRound].actions[pid];
    const buys=(a.parBuys.dice|0)+(a.parBuys.sizes|0)+(a.parBuys.forges|0);
    if(a.role!=='host' || !a.channel || buys<1 || !a.aRolls.length || a.woundTargets.length<1 || a.woundTargets.length>2){
      throw new Error('computer host turn incomplete for '+pid);
    }
  }
}

// Two-human playtest mode keeps Player 3 as a computer and creates legal automatic turns.
{
  const ids=ALL_PIDS.slice(0,3);
  const g=S.normalizeGame(S.newGameData(ids,['Player 1','Player 2','CPU 3'],['p3']));
  if(!g.players.p3.isBot || g.players.p1.isBot || g.players.p2.isBot) throw new Error('Player 3 computer-seat invariant failed');
  if(!S.fillMissingBotActions(g) || !g.rounds[1] || !g.rounds[1].actions.p3 || g.rounds[1].actions.p3.phase!=='locked'){
    throw new Error('basic computer did not lock a normal turn');
  }
  const hostRound=g.schedule.indexOf('p3')+1;
  g.round=hostRound; g.rounds[hostRound]={actions:{}};
  S.fillMissingBotActions(g);
  const a=g.rounds[hostRound].actions.p3;
  const buys=(a.parBuys.dice|0)+(a.parBuys.sizes|0)+(a.parBuys.forges|0);
  if(a.role!=='host' || !a.channel || buys<1 || !a.aRolls.length || a.woundTargets.length<1 || a.woundTargets.length>2){
    throw new Error('basic computer host turn is incomplete');
  }
}

// A selected parasite Attack reroll changes exactly one die and preserves its neighbors.
{
  const first = { dieId:'par-one', faces:[4], index:0, v:4, shown:4, critBonus:0, exploded:false, first:4, rerolled:false };
  const second = { dieId:'par-two', faces:[7], index:0, v:7, shown:7, critBonus:0, exploded:false, first:7, rerolled:false };
  S.session = { aRolls:[first,second] };
  if (!S.rerollParAttackDie(0) || first.v!==8 || !first.exploded || !first.rerolled || second.v!==7 || second.rerolled){
    throw new Error('selected parasite Attack reroll changed the wrong dice');
  }
}

// A normal CRIT adds exactly one clearly preserved bonus roll.
{
  const crit = rollExplodingAttack([10]);
  if (!crit.exploded || crit.shown!==10 || !crit.bonus || crit.bonus.value!==10 || crit.value!==20){
    throw new Error('CRIT bonus-roll invariant failed');
  }
}

// Every Specialty side contributes its documented amount to parasite math.
{
  const p = S.newGameData(ALL_PIDS.slice(0,6), ALL_PIDS.slice(0,6)).parasite;
  const aRolls = [{v:10},{v:6}];
  const opts = { n:6, hostRolls:[{v:9}], highestHumanDie:9, instinctExtra:14, woundCount:0 };
  const expected = { gnash:8, fever:4, twin:6, echo:9, blank:0, explode:14 };
  for (const [id,want] of Object.entries(expected)){
    const got = computeParasitePortion(p,aRolls,id,opts).instinctAdd;
    if (got!==want) throw new Error(`Specialty ${id} expected ${want}, got ${got}`);
  }
}

// A selected human Attack reroll changes exactly one die and preserves its neighbors.
{
  const first = { dieId:'one', faces:[2], forgeLevels:[0], index:0, v:2, first:2, rerolled:false };
  const second = { dieId:'two', faces:[6], forgeLevels:[0], index:0, v:6, first:6, rerolled:false };
  S.session = { baseRolls:[first,second] };
  if (!S.rerollHumanAttackDie(0) || first.v!==2 || !first.rerolled || second.v!==6 || second.rerolled){
    throw new Error('selected Attack reroll changed the wrong dice');
  }
}

function botAction(pid, g){
  const pl = g.players[pid];
  const r = g.round;
  const kind = roundKind(r, g);
  const isHost = kind==='infection' && hostIdForRound(g, r)===pid;
  const channel = isHost ? ['ravage','crush','sever'][rollIndex(3)] : null; // chosen before any roll
  let energy = pl.energy||0;
  const forges = [], modUps = [], sizeUps = [];
  let addDie = null, healScars = 0;

  while ((pl.scars||0) - healScars > 0 && energy >= CFG.healScarCost && healScars < 2){
    healScars++; energy -= CFG.healScarCost;
  }
  const humanDieCost = nextHumanDieCost(pl);
  if ((pl.dice||[]).length < 6 && energy >= humanDieCost + 1){
    const counts = { red:0, blue:0, green:0 };
    (pl.dice||[]).forEach(d=>counts[d.color]++);
    const c = COLORS.filter(c=>counts[c]<CFG.maxDicePerColor).sort((a,b)=>counts[a]-counts[b])[0];
    if (c){ addDie = c; energy -= humanDieCost; }
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
    (pl.dice||[]).forEach(d=>d.faces.forEach((v,i)=>{
      const queued = forges.filter(f=>f.dieId===d.id && f.faceIndex===i).length;
      if (forgeLevelOf(d,i)+queued >= CFG.maxForgeLevel) return;
      const effective = v + queued*CFG.forgeBump;
      if (effective<low){ low=effective; pick={dieId:d.id, faceIndex:i}; }
    }));
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
    // Every host must choose at least one permanent parasite upgrade.
    const bank = (g.parasite.bank||0) + parasiteTuning(rosterOf(g).length).parStipend;
    const pb = { dice:0, sizes:0, forges:0 };
    if ((g.parasite.attack||[]).length < CFG.parMaxDice && bank >= nextParasiteDieCost(g.parasite) && Math.random()<0.4) pb.dice = 1;
    else if (bank >= CFG.sizeUpCost && Math.random()<0.6) pb.sizes = 1;
    else pb.forges = Math.max(1, Math.min(2, bank|0));
    const fake = deep(g.parasite);
    applyParShop(fake, pb);
    const aRolls = (fake.attack||[]).map(d=>{
      const er = rollExplodingAttack(d.faces);
      return { dieId:d.id, faces:d.faces, size:dieSizeOf(d), index:er.index, v:er.value, shown:er.shown,
        critBonus:er.bonus ? er.bonus.value : 0, exploded:er.exploded, first:er.shown, rerolled:false };
    });
    const instIds = fake.instinct || ['gnash','fever','twin','echo','blank','explode'];
    let instinctRoll = instIds[rollIndex(instIds.length)];
    let instinctExtra = 0;
    let instinctExtraRoll = null;
    if (instinctRoll==='explode'){
      const er = rollExplodingAttack([3,4,5,6,7,8,9,10]);
      instinctExtra = er.value;
      instinctExtraRoll = { index:er.index, v:er.value, shown:er.shown,
        critBonus:er.bonus ? er.bonus.value : 0, exploded:er.exploded, first:er.shown,
        faces:[3,4,5,6,7,8,9,10], size:8 };
    }
    // Blue path: three free section rerolls, split between Attack and Specialty.
    if (channel==='crush'){
      for (let rr=0; rr<(CFG.bluePathRerolls||3); rr++){
        if (Math.random()<0.67){
          aRolls.forEach((d,i)=>{
            const er = rollExplodingAttack(d.faces);
            Object.assign(aRolls[i], { index:er.index, v:er.value, shown:er.shown,
              critBonus:er.bonus ? er.bonus.value : 0, exploded:er.exploded, first:er.shown, rerolled:true });
          });
        } else {
          instinctRoll = instIds[rollIndex(instIds.length)];
          instinctExtra = 0;
          instinctExtraRoll = null;
          if (instinctRoll==='explode'){
            const er = rollExplodingAttack([3,4,5,6,7,8,9,10]);
            instinctExtra = er.value;
            instinctExtraRoll = { index:er.index, v:er.value, shown:er.shown,
              critBonus:er.bonus ? er.bonus.value : 0, exploded:er.exploded, first:er.shown,
              faces:[3,4,5,6,7,8,9,10], size:8 };
          }
        }
      }
    }
    const eligibleTargets = rosterOf(g).filter(p=>p!==pid && scarCount(g.players[p]) < CFG.maxScars);
    const feedCount = Math.min(eligibleTargets.length, Math.random()<0.5 ? 1 : 2);
    const woundTargets = eligibleTargets.sort(()=>Math.random()-.5).slice(0,feedCount);
    Object.assign(action, {
      channel, channelTarget:null, woundTargets, parBuys: pb, parRerolls: 0,
      growth: { key: channel, target:null },
      aRolls, instinctRoll, instinctExtra, instinctExtraRoll,
    });
  }
  return action;
}

// One complete two-human + Player 3 computer game reaches the boss and resolves.
{
  const ids=ALL_PIDS.slice(0,3);
  let g=S.normalizeGame(S.newGameData(ids,['Player 1','Player 2','Computer'],['p3']));
  S.G=g;
  let guard=0;
  while(g.status==='active'&&guard++<12){
    const r=g.round;
    if(!g.rounds[r]) g.rounds[r]={actions:{}};
    ['p1','p2'].forEach(pid=>{g.rounds[r].actions[pid]=botAction(pid,g);});
    S.fillMissingBotActions(g);
    g=S.resolveRound(g); S.G=g;
  }
  if(g.status!=='over' || guard!==7) throw new Error('two-human + computer game did not resolve all 7 rounds');
}

const games = parseInt(process.argv[2]||'200',10);
const nPlayers = parseInt(process.argv[3]||'6',10);
let errs = 0, hostWins = 0, infections = 0, clears = 0, bossN = 0;
const byRound = {};
const finalSpreads = [], scarsTaken = [], negEnergy = [], bossMargins = [], bossPartRows = [];

for (let gi=0; gi<games; gi++){
  try{
    const ids = ALL_PIDS.slice(0, nPlayers);
    let g = normalizeGame(newGameData(ids, ids.map((_,i)=>'Bot'+(i+1))));
    if (new Set(g.schedule.slice(0,nPlayers)).size!==nPlayers || new Set(g.schedule.slice(nPlayers)).size!==nPlayers){
      throw new Error('host schedule is not one turn per player in each half');
    }
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
        bossMargins.push(res.crewTotal-res.hp);
        if (res.hpParts) bossPartRows.push(res.hpParts);
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
console.log(`boss avg margin: ${r1(mean(bossMargins))} · avg parts mirror ${r1(mean(bossPartRows.map(x=>x.crewMirror)))} + built dice ${r1(mean(bossPartRows.map(x=>x.builtParasite)))} + danger ${r1(mean(bossPartRows.map(x=>x.danger)))}`);
console.log(`avg final spread: ${r1(mean(finalSpreads))} · avg end Wounds held: ${r1(mean(scarsTaken))}`);
console.log(`negative-energy incidents: ${negEnergy.length}`);
