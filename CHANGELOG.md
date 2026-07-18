# Changelog — Space Tribes: Parasite

Current build: **v5.0.0** · Schema **v13**

---

## v5.0.0 — "The Long Infection" (full redesign)

Designed in PROPOSAL-v5.md, sim-tuned in tools/v5-sim.mjs, engine-verified in tools/v5-smoke.mjs (0 errors across 900+ bot games, all table sizes).

- **Rounds:** everyone hosts exactly **twice** + boss finale (2N+1 rounds; 13 at 6p). No training round. Fog of war unchanged.
- **Economy:** stipend **6⚡** · **underdog +2⚡** for last place · win +2 · category +1.
- **Reroll tokens 🎲:** base 1/round, spent before energy on section rerolls. Reroll all always 2⚡.
- **Die sizes:** size-up 3⚡ (d6→d8→d10, parasite d12). Extra die now 4⚡. Forge unchanged (1⚡, +2).
- **ChemDice (stacking):** faces = Base Attack / Base Energy / Base Reroll / Base % / Points / **one** scar. Every lock ADDS its tier value permanently — no lock-out, no caps, no dead faces. Upgrades (2⚡) raise the per-lock gain.
- **Scars:** 1 blank + 5 hurts — −2⚡ · −highest die · **−50% of red / blue / green dice** (sabotage scales with your build). Heal 3⚡.
- **Host turn — Channels** (replaces Feed/Harden/Outbreak/Poison): pick after seeing your roll. 🔴 RAVAGE 2×red, scars everyone · 🔵 CRUSH 1.75×blue, scar one chosen (2+-scar guardrail) · 🟢 SEVER cancels crew's top 2 dice (and their category claims), scar only you. **Hosting always costs a scar.**
- **Parasite shop:** own ⚡ (stipend 7 + bank), same prices as crew, **must buy ≥1**. PREDATOR dice (3–10) that **CRIT** on max face. Max 4 dice, cap d12.
- **The Mirror:** parasite Base Attack ≈ 45–47% of previous round's crew total (per-table beta/offset map) + permanent bump per crew hold. Boss HP mirrors crew strength + Boss Meter (= scars created + host wins).
- **Scoring:** crew hold pays flat 6/8 + damage ladder 5/3/1 → 6/4/2 (replaces MVP) + categories 2/3. Host win 8/10. Boss hero ladder 12…1 + kill blow 5.
- Smoke-tuned: host wins 46–54% at every table size, boss clear ~50%.
- Note: tools/balance-sim.mjs targets the v4 engine and is retired; use v5-sim.mjs (model) and v5-smoke.mjs (real engine).

---

## v4.12.11 — 6-player-first balance
- Tuned primarily for **6p** tables (~45% host infection wins, flatter early→late curve)
- Seat Base map: **3p −18 · 4p 0 · 5p +18 · 6p +30** (was linear ±22 which made 6p open at +44 / ~90% early host)
- Crew-hold bump scales: **4p +2 · 5p +4 · 6p +6**
- Human share starts higher on bigger tables (6p ~62%)
- Feed aura **+2 at 6p** (+1 elsewhere)

## v4.12.10 — Parasite ~45% host wins
- Retuned host infection power after Monte Carlo sims (aggressive shop bots)
- Crew hold Base Attack bump **+6 → +2**
- Feed aura **+2 → +1**
- Outbreak tonight **+6 → +4**
- Seat Base Attack dial: **+22 / seat above 4**, **−18 on 3p** (was ±14)
- Target: ~45% host win rate across infection rounds at 3–6p (4p was ~67% and late-heavy)

## v4.12.9 — Forge faces match die color
- The six forge face chips turn red / blue / green with the selected Attack die
- Larger white numbers so faces are easier to read

## v4.12.8 — Heal scar 3⚡
- Healing one Scar die now costs **3⚡** (was 2⚡)

## v4.12.7 — Section shake only
- Dice shake animation only on the section you reroll (Attack / Mod / Scar, or parasite Attack / Mod / Specialty)

## v4.12.6 — Humans only
- Removed computer / Comp players
- New game requires a name on **every** seat (3–6 humans)
- Copy link → each phone Joins their seat

## v4.12.5 — Phase coaching
- Turn coach now tells you the **next step** (shop vs roll, host locks, waiting)
- RULES updated with **what to do each round** + dictionary

## v4.12.4 — Clearer Help + dictionary
- Help rewritten as step-by-step what to do
- In-game Dictionary of terms

## v4.12.3 — Playtest bugfixes
## v4.12.2 — Scar bleed −20%
## v4.12.1 — Scar slash + − highest dice
## v4.12.0 — Section rerolls
## v4.11.0 — Mod Points = greed score (Schema v12)

---

Earlier notes live in git history.
