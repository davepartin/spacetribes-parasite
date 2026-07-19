# Space Tribes: Parasite — v5 Design Proposal

**"The Long Infection"** — 6-player-first, 13 rounds, dice that grow, an engine you claim one lucky roll at a time.

This is a design proposal only. Nothing here is implemented yet. Numbers marked ⚠ need a sim pass in `tools/balance-sim.mjs` before shipping.

---

## 1. Game structure

| | v4.12 | **v5 proposal** |
|---|---|---|
| Rounds | 10 (training + 8 infection + boss) | **13 (12 infection + boss)** |
| Training round | Round 1 | **Removed** — round 1 is a live infection round |
| Hosts | Up to 2 each, random, max 8 slots | **Everyone hosts exactly 2× at 6p** (12 slots) |
| Host schedule | This round's parasite host is shown | Future hosts remain hidden |
| Finale | Round 10 boss | **Round 13 boss** — the bill for 12 rounds of feeding comes due |

Why 13 and not 12: every host move (Feed / Harden / Outbreak / Poison) pumps the Boss Meter, and the meter only matters because the escape fight exists. Cut the boss and the last few host turns are consequence-free point grabs. The boss is where the table pays *together* for what each player did *alone*.

⚠ Schedule builder currently hardcodes 8 infection slots (`INFECTION_SLOTS`); needs to become 12. Host arrangement rule (no back-to-back repeats) stays.

---

## 2. Energy economy

| | v4.12 | **v5 proposal** |
|---|---|---|
| Round stipend | 5⚡ | **6⚡** |
| Win bonus | +2⚡ | +2⚡ (unchanged) |
| Category win | +1⚡ | +1⚡ (unchanged) |
| Loss | 0 | 0 |
| **Underdog** | — | **Last place in points gets +2⚡ each round** |

Budget math: 6⚡ × 12 ≈ 72 base, ~85–95 lifetime with bonuses. The full shop tree costs ~110. A player who reserves 2⚡ every round for rerolls still affords roughly two-thirds of everything — enough to build an identity, never enough to build it all. That gap is where strategies diverge.

Underdog pays **energy, not points** — it helps last place fight back through the shop without gifting them score.

---

## 3. The shop (all prices)

| Buy | Cost | Effect |
|---|---|---|
| **Forge** | 1⚡ | +2 to one face on one Attack die (any size) |
| **Size-up** | 3⚡ | d6 → d8, or d8 → d10. **Cap d10.** Per die, per step |
| **Extra die** | **4⚡** | Extra Attack die, flat price every time. Enters as d6. Max 2 per color |
| **Mod upgrade** | 2⚡ | Raise one Mod face one tier (max 3). Pre-claim only |
| **Heal Wound** | 3⚡ | Remove one Wound die |
| **Section reroll** | 1🎲 or 1⚡ | Reroll Attack, Mod, or Wound section. **Spends reroll tokens first, then energy** |
| **Reroll all** | 2⚡ | Everything. **Always 2⚡ — tokens never apply** |

Every price is 1–5. Nothing costs more than one round of saving.

### Reroll tokens 🎲

Rerolls are now a visible, counted resource next to Energy in the top bar:

- Everyone starts each round with **1 reroll token** (🎲1). Tokens don't bank — fresh each round.
- Rerolling a section **always spends a token first; only when you're at 🎲0 does it cost 1⚡.** No choosing, no ambiguity — the counter just goes down, then the energy does.
- The **Base Reroll** ChemDice track raises your per-round base: claim T1 → 🎲2, T2 → 🎲3, T3 → 🎲4. Reroll All is always 2⚡ regardless.
- UI: top bar shows `⚡6 · 🎲1` and both tick down as you spend. The reroll button label always shows what it's about to charge: "Re-roll section (🎲)" or "Re-roll section (1⚡)".

This makes the reroll economy legible at a glance — you always know if your next reroll is free, and the Base Reroll track has a number on screen that visibly grows when you invest in it.

**Why these three dice options coexist** (the core of this version):

- **Forge (1⚡)** — precision. Fix your 1s, stack a face, snipe a category. ~+0.33 avg per ⚡.
- **Size-up (3⚡)** — the gamble. +1.0 avg but delivered as *ceiling* (floor stays 1). Same rate per ⚡ as forge; pays extra in category ceiling; wants rerolls. Visibly reads at the table: everyone sees your d10.
- **Extra die (4⚡)** — raw total. Best average in the shop (that's why it costs the most), enters as a plain d6 in a world of d8s, and every attack point you add feeds the parasite ~50–60% on your host nights.

At these rates none of the three is strictly correct. Steady players forge, gamblers size up, engine players stack dice — and at 4⚡ a new die can't be bought off a single round's leftovers, which kills the scripted "buy a die every round" opening.

---

## 4. ChemDice — the Mod die becomes an engine

New face set (was Energy / % / Base / Points / Wound / Wound):

**STACKING rule (simmed ✅): locking a Base face ADDS its value to your permanent stat — every time, forever. No lock-out, no caps, no dead faces.**

| Face | Per-lock gain (upgrade 2⚡ each) | Stacks into |
|---|---|---|
| **Base Attack** | +3 / +4 / +5 | Your permanent Base, every combat |
| **Base Energy** | +1⚡ / +2⚡ / +3⚡ | Your round stipend, forever |
| **Base Reroll** | +1🎲 / +1🎲 / +2🎲 | Your reroll-token base each round |
| **Base %** | +10% / +15% / +20% | Permanent % of your attack (uncapped) |
| **Points** | +3 / +4 / +5 | One-shot personal score (greed, no combat) |
| **Wound** ×1 | — | Lock it → grab a Wound die |

Rules of the engine:

1. **Lock to bank.** You must roll the face and lock it — a 1-in-6 lottery each round, and locking means giving up every other Mod benefit that round. Engine vs. tempo, every time.
2. **Every lock adds.** Lock Base Attack twice at tier 1 → permanent +6. The face never goes dead; every roll of the Mod die matters all game.
3. **Upgrades raise the per-lock amount.** 2⚡ turns future +3 locks into +4s. Pre-paid, compounding, still gated by the lottery.
4. **No caps.** Sim-tested: capping the % track killed engine builds; uncapped stacking stays fair because the Mirror parasite (§6) inflates with the crew.

The four permanent tracks converge to ~2–4 effective points per round at mid-tier, but **peak at different times** — that's the strategy diversity:

- **Energy** → claim early, compounds through the shop for 10+ rounds
- **Reroll** → the big-dice player's track; makes a d10 build safe
- **Attack** → flat, steady, good any time
- **%** → late bloomer; +20% of a fat six-die pool in round 11 is the biggest number on the table

Dropping to **one Wound face** is intentional: the host can still inflict Wounds, and the lone Wound face sitting next to Points makes greed-locking riskier.

⚠ Permanent income is the classic sim-before-ship mechanic. Run 200 games; watch for round-3 Energy claims deciding round-13.

### Wound dice — new faces

Redesigned from 3 blanks + 3 hurts to **one blank, five hurts** — and the color faces scale with your own build, so Wounds stay painful all game without retuning:

| Face | Effect |
|---|---|
| **Inert** ×1 | — (one sigh of relief, not three) |
| **Drain** | −2⚡ |
| **Shatter** | − your highest Attack die (die stays showing) |
| **−50% Weapons** 🔴 | Half your red dice total, rounded down, off your combat total — *weapons malfunction* |
| **−50% Strength** 🔵 | Same, blue — *weakness* |
| **−50% Agility** 🟢 | Same, green — *slowed* |

The fiction: the parasite doesn't subtract points, it **sabotages you** — jams your weapons, saps your muscles, dulls your reflexes. The die faces just show the color and −50%; the theme lives in the art and the replay text ("Dave's weapons malfunction — −6").

Why this works: the color faces hit harder the more you've invested in that color—a forged double-red build dreads the red face at −6+ while a balanced build shrugs at −3. Wounds punish specialization, giving hosts a targeting logic: hurt the player with the concentrated build, the leader, or the friend who hurt you earlier. Counterplay is unchanged: reroll the Wound section (🎲/1⚡) or heal for 3⚡.

⚠ Expected pain per Wound roll roughly doubles vs v4 (~3+ per round mid-game vs ~1.5). Sim the Wound-count death spiral (3+ Wounds on last place) to confirm underdog ⚡ keeps them in the fight.

---

## 5. Scoring (infection rounds)

Crew holds the ship:

| Award | Rounds 1–6 | Rounds 7–12 |
|---|---|---|
| Every crew human (flat) | 6 | 8 |
| **Attack MVP:** top three crew totals | **+4 / +3 / +2** | **+5 / +4 / +3** |
| Category win (best single die per color, crew only) | +2 (+1⚡) | +3 (+1⚡) |
| Host | 0 | 0 |

Parasite wins: the host receives **4 points early / 5 points late**, plus **+4⚡**. The lower score limits the swing created when every crew player receives zero, while the larger Energy reward still makes a host victory feel valuable.

Design intent: the flat share keeps it a *team* hold; the ladder makes carrying the fight pay; max same-round gap between 1st and 6th crew stays ≤ ~9 so nobody is ejected from the race by one cold night. Ties on the ladder share the higher rung.

## 6. The host turn — Color paths, parasite shop, and Feeding Time

Replaces Feed / Harden / Outbreak / Poison entirely. The parasite shops like a human, while the host chooses how many friends to Wound for immediate power.

### The parasite shop

- The parasite has its own Energy: **stipend 7⚡ per host turn** (6p) + whatever past hosts banked. Separate from your human ⚡.
- Same shop, same prices as the crew: **extra die 4⚡ · size-up 3⚡ (cap d12) · forge 1⚡ (+2 a face)** — nothing new to learn.
- Every host **must choose at least one upgrade**. Every purchase is permanent and shared with every future host.
- Leftover ⚡ banks on the creature (or pays parasite rerolls).

### Pre-roll color paths

After the mandatory upgrade, choose one path **before rolling any dice**:

| Path | Tonight |
|---|---|
| 🔴 **Red** | Add **2.5× Weapons** |
| 🔵 **Blue** | Add **1.5× Strength** and gain **3 free parasite section rerolls** for Attack or Specialty |
| 🟢 **Green** | Add **1.5× Agility** and cancel the crew's highest die |

Approximate path value from the pre-implementation model: early Red 8.7 / Blue 10+ / Green 11.2; midgame Red 20 / Blue 19–21 / Green 19.9; late Red 27.5 / Blue 25–28 / Green 26.2. Blue's control and Green's denial justify Red's higher variance.

### Feeding Time

- The host may choose **zero, one, or every other player**.
- Every chosen player takes one **Wound die** and gives the parasite **+2 attack tonight**.
- The round log names every person the host chose to hurt.
- Every Wound also feeds the final target, so selfish power now creates both personal retaliation and a shared round-13 cost.
- Parasite total = **Parasite Growth Attack + Attack Dice + Specialty + color path + Feeding Time**.
- This revision needs fresh simulation; the earlier path percentages no longer describe the current rules.

### The parasite's dice — PREDATOR build (simmed ✅)

Three creature builds were simmed 400 games each (full results: `artifacts/balance-v5-channels.md`):

| Build | Dice | Host win | Drama (margin σ / close rounds) |
|---|---|---|---|
| SWARM | 4→8 plain d6s | 49.1% | σ18 · 54% close — flattest, but visually dull |
| **PREDATOR** ✅ | **2→4 hot dice (3–10), CRIT on max face, size-ups** | 47.8% | σ21 · 47% close — best mix of balance + spectacle |
| TITAN | 2 huge chain-critting dice (4–15) | 42.3% | σ23 — wildest swings, least stable |

**Recommendation: PREDATOR.** The parasite starts with **2 hot dice (faces 3–10)**. Rolling a die's **max face is a CRIT: add one bonus roll of that die** to the total. The parasite shop grows them with the same verbs as the crew: extra die (max 4), size-up (cap d12), forge. Few, big, hot dice with crits — it rolls like a predator, not a pile of pebbles, and every host turn has a "come on, crit" moment. Chain-crits (a crit's bonus roll can crit again — TITAN style) stay on the table as a house rule for chaos nights.

Host turn sequence: human shop → mandatory parasite upgrade → choose color path → roll human → Feeding Time → roll/reroll parasite → submit both.

Historical pre-v5.0.16 sim results were host ~48% and boss clear ~56%. They used automatic channel Wounds and do **not** validate the current choose-your-Wounds rule.

Open playtest questions:
- Does Green canceling one die feel as useful as Red's raw power and Blue's control?
- Are three Blue rerolls fast enough at the table, or do they slow host turns?
- Watch Wound volume. The first tuning lever is the **+2 attack per chosen friend** reward.

## 6b. Parasite Growth Attack

Sim result: no flat or linear Base Attack curve survives the v5 economy — crews grow fast early and plateau late, so any fixed ramp gives a U-shaped drama curve (crew stomps midgame, parasite runs away late, or both).

**Parasite Growth Attack mirrors the crew.**

> **Parasite Growth Attack = ~48% of the crew's previous-round combined total** (seed ~55 for round 1). Crew holds still bump it permanently.

- Self-balancing at any table size, any economy, any future rule change — the monster *is* the crew's reflection. Thematically perfect: you built it.
- Simmed curve at 400 games: ~50% round 1, crew-favored midgame (~35–43%) while builds come online, then the parasite gets terrifying — 51% → 80% across rounds 8–12 heading into the boss. Overall 51%. That late surge is a feature (dread rising toward the finale), but playtest it; if round 11–12 feels hopeless for crews, drop beta to 0.46 or cap Feed's aura at +8.
- Replaces the v4 seat map (3p −18 · 4p 0 · 5p +18 · 6p +30) entirely.

## 7. Boss — Round 13 (simmed ✅)

- Cleared → hero ranks **12 / 8 / 5 / 3 / 2 / 1** (6p) + **kill blow +5** to the top total. Fail → consolation 4…1, parasite escapes (hollow win on points).
- **HP also mirrors:** fixed HP numbers break whenever the economy changes. Final target follows round-12 crew strength plus **1.5 × danger** (Wounds created + host wins). Previous calibration needs rerunning for selectable Wounds.

## 8. Historical sim findings (pre-v5.0.16)

**ChemDice snowball — cleared, and stacking made it better.** Under the stacking rule, early claimers hold *no* winning edge (15.1% vs 18.5% for late claimers), and winners average just 10.7 locks vs 10.1 for last place — lock-luck does not decide games, because the Mirror parasite inflates with the crew's engine. Bonus: stacking is itself a comeback mechanic — last-at-half-time escapes the bottom two 46.8% of the time (vs 33% under the old claim-once rule) and wins 6.8% of games.

**Wound death spiral — historical warning.** In the previous model, players who held 3+ Wounds performed badly. Keep the six-Wound cap, watch pile-on behavior at the table, and retest whether healing for 3⚡ is sufficient.

**Catch-up.** Last at half-time recovers to 4th-or-better ~38% of the time and wins ~3%. Underdog +4⚡ and a softer ladder barely moved that (~+1%), so keep underdog at +2⚡ — the simpler number does the same work. Final spread averages ~49 pts (winner ~104, last ~55); tight enough that the boss ranks (up to 17) keep round 13 mathematically live for most of the table.

**Shop pricing confirmed.** The size-up-at-2⚡ variant made gamblers/hoarders dominant and crushed forge-first play — keep size-up at 3⚡. Extra die at 4⚡ flat held up.

**Engine viability — solved by the stacking rule.** Under claim-once, the mod-upgrade-first build won only ~5–7% of games (dead faces, dead money). With stacking (every lock adds), it wins **21%**, and five of six strategy bots land in the healthy 15–27% band. Typical end-of-game accumulation: Base +8, stipend +3.5⚡, +30% attack, 🎲+2.6 — big numbers, safely absorbed by the Mirror. Do **not** cap the tracks; the capped-% variant collapsed engine builds back to 3%.

**Tuning note for stacking:** Mirror beta wants **0.50** under stacking (crew totals inflate ~25% vs claim-once). Boss HP as % of round-12 crew handles the same inflation automatically.

## 9. Superseded host concepts

- ~~Four host moves (Feed / Harden / Outbreak / Poison)~~ → pre-roll color paths + Feeding Time
- ~~Human-share fusion (~50–62% of host attack)~~ → path effects use your *actual rolled dice*
- ~~Automatic host/channel damage~~ → host chooses zero through every other player; each Wound gives +2 attack

## 10. Unchanged (deliberately)

- Wound cap 6 and heal price 3⚡ (faces redesigned — see §4)
- Host parasite stipend (7⚡ at 6p), separate from human energy
- Reroll prices (the free reroll becomes the visible 🎲 token base)
- Ties go to the crew

---

## Implementation order

1. Rounds/schedule: 13 rounds, 12 infection slots, drop training
2. Economy: stipend 6, underdog +2⚡, extra die 4⚡ flat, reroll tokens 🎲
3. Size-up purchase (d8/d10) + UI for die size
4. ChemDice face set + claim tracks
5. New Wound faces + selectable host Wound targets
6. Contribution ladder scoring
7. Parasite Growth Attack (~48% of previous crew total) + mirrored boss target
8. Re-run `tools/v5-sim.mjs` against the *real* engine once implemented (the current sim is a standalone model)
9. Playtest with the crew — wings on the loser
