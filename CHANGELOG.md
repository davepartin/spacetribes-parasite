# Changelog — Space Tribes: Parasite

Current build: **v5.1.1** · Schema **v14**

---

## v5.1.1 — Two-human playtest mode
- New game setup can make **Player 3** a basic Computer for a two-human, three-player playtest
- The Computer seat cannot be claimed from either phone and is clearly marked **CPU** throughout the game
- Player 3 automatically makes one simple affordable shop choice, rolls Attack/Mod/Wound dice, and locks its turn
- On its host rounds, Player 3 performs the required parasite upgrade, chooses a color path, selects one or two Feeding Time targets, rolls the parasite package, and locks automatically
- Computer actions are created inside the shared-game transaction so two phones cannot submit conflicting Player 3 rolls
- Added a full seven-round two-human-plus-computer engine test, including both Player 3 parasite-host turns and the final boss

---

## v5.1.0 — Distinct builds and the creature you made
- Host schedule is split into two shuffled halves: everyone hosts exactly once early and once late
- Human and parasite extra dice now escalate **4 / 5 / 6⚡**
- Every die face has three forge levels: printed **L1**, **L2 = +2**, **L3 = +4 max**
- Forge faces show permanent L2/L3 badges; a size-up rebuilds clean faces and erases that die's forge work
- d8 diamond, d10 pointed-pentagonal, and d12 hexagonal dice use lightweight CSS facet shading while preserving the color system and large result number
- Forge-face buttons inherit the selected die's d6/d8/d10/d12 silhouette and facet shading while retaining full-size phone tap targets
- Polyhedral lighting now uses a few broad upper-left-lit planes instead of radial stripes, with a tighter grounded shadow
- Parasite upgrades now use compact one-row controls instead of oversized stacked cards, with an extra-tight narrow-phone layout
- Parasite path choices now show a bright selected border, check badge, confirmation heading, and accessible pressed state
- The parasite box now starts with a spent/total Energy meter, Energy-left count, upgrade-requirement status, and an explicit reroll/banking reminder
- Human Attack rerolls now use tap-to-select: one die highlights, and “Reroll selected” changes only that die while preserving every other result
- Parasite Attack rerolls now use the same tap-to-select flow: choose one parasite die, highlight it, and reroll only that die; Reroll All remains a separate full-package choice
- The parasite attack is now an enforced four-step checklist: Choose Your Food → Roll Dice → Reroll or Keep → Lock Attack, with live status badges
- The Host setup page now has its own live four-step checklist: Grow Parasite → Choose Color Path → optional Human Upgrades → Continue to Rolls
- Mod and parasite Specialty dice now show all six possible sides beneath the roll; Mod values reflect live upgrades, rolled sides highlight, and every Specialty side opens an explanation
- The six Mod-side references beneath a roll now reuse the same colored square die faces as the Upgrade screen instead of unrelated wide menu tiles
- Parasite CRITs now show the natural max face, the separate bonus roll, and the resulting die total; normal CRIT bonuses do not chain
- The +extra die Specialty now visibly rolls its own hot d8, preserves any CRIT bonus, and carries that exact roll through lock-in and the round result
- A parasite attack receipt now explains Growth Attack, each Attack die, Specialty math, color path, Feeding Time, parasite total, and the combined host total before and after lock-in
- Feeding Time is mandatory when an eligible target exists: choose **1 or 2 friends** for **+3 attack each** with highlighted target buttons
- Final boss HP explicitly includes the expected CRIT power of the parasite Attack dice built by every host
- Six-player real-engine tuning: **53.7% host wins** over 18,000 infection rounds and **50.5% boss clears** over 1,500 games
- Fixed narrow-phone seat cards overflowing horizontally

---

## v5.0.28 — Pre-roll parasite color paths
- Parasite hosts now choose a color path after upgrading but **before rolling any dice**
- Red adds **2.5× Weapons**
- Blue adds **1.5× Strength** and grants **3 free parasite section rerolls** for Attack or Specialty
- Green adds **1.5× Agility** and cancels the crew's single highest die
- Renamed the mirrored base to **Parasite Growth Attack**
- Renamed choosing friends for +2 attack each to **Feeding Time**
- Updated live equations, round history, instructions, rules, and simulation models

---

## v5.0.27 — Shorter host instructions
- Removed the unnecessary automatic-Wound explanation from the Instructions modal

---

## v5.0.26 — Clear CRIT instructions
- Instructions now explain that rolling a parasite Attack die's highest face triggers one extra roll that is added to its attack

---

## v5.0.25 — Parasite-host wording
- Instructions now simply say **“One player is the parasite host”**
- Removed “fog of war” terminology from current player-facing text

---

## v5.0.24 — Smoother Attack MVP rewards
- First-half top-three bonuses are now **+4 / +3 / +2**
- Second-half bonuses increase each place by one to **+5 / +4 / +3**

---

## v5.0.23 — Rebalanced host victory
- Parasite wins now award the host **4 points** in the first half and **5 points** in the second half
- Increased the host's parasite-win reward to **+4⚡ Energy**
- Added a distinct **PARASITE WIN +4⚡** result badge

---

## v5.0.22 — Five-point parasite wins
- Reduced parasite victory scoring from **8/10 points** to a flat **5 points**
- Kept the **+2⚡ winner Energy** reward
- Renamed score-breakdown entries to **Parasite round win**

---

## v5.0.21 — Parasite scoring label
- Changed “Host + parasite wins” to the simpler **“Parasite wins”**

---

## v5.0.20 — Clearer losing score
- Instructions now state that the parasite receives **0 points** when losing

---

## v5.0.19 — Simpler size-up text
- Removed the unnecessary “Ceiling wins categories” wording

---

## v5.0.18 — Cleaner size-up button
- Removed the repeated Energy cost from the **Size up** button because the cost already appears in the corner

---

## v5.0.17 — Wound face color fix
- Restored the Mod die's **gain Wound** face to its dark red die color with the light diagonal stripe

---

## v5.0.16 — Wound friends for power
- Parasite upgrades are mandatory again: every host must forge, size up, or buy a die
- Removed the automatic host Wound and removed automatic Wounds from attack channels
- Hosts may select zero through every other player; each selected friend receives one Wound and gives **+2 parasite attack** that round
- Round results record who the host Wounded, while every created Wound still raises the final target
- Renamed player-facing **Scar** terminology to **Wound** while preserving compatible stored game fields
- Marked the revised host balance as needing fresh simulation and table testing

---

## v5.0.15 — Greed strengthens the final parasite
- Parasite purchases are now optional, giving each host a real restraint-versus-greed choice
- Parasite forge / size-up / extra die permanently raise the final target by **+1 / +2 / +4**
- Host shop previews the final target before and after queued upgrades
- Round results name the host and show how much they permanently raised the target
- Instructions and parasite panel explain that upgrades, scars, and host wins make the finale harder

---

## v5.0.14 — Simpler parasite growth
- Attack-dice card explicitly says its count and sizes update after purchases
- **Parasite Energy bank** explicitly says unspent Energy carries forward
- Combined the confusing final-fight buildup and target cards into **Current parasite target**
- Target explains what the number means and that crew growth, scars, and host wins increase it

---

## v5.0.13 — Human-readable parasite panel
- Added a clear **Current parasite** title
- Removed the internal `+−33`, crew-percent formula, separators, threat estimate, and table-size badge
- Replaced them with explained facts: attack dice, saved parasite Energy, final-fight buildup, and final crew target
- Internal Base is labeled **Table balance** where combat math must show it, with an explanation of negative small-table adjustments

---

## v5.0.12 — Clearer standings
- Removed Boss Meter / HP from the standings heading
- Standings entries are now one line: **symbol · player name · score**
- Six-player standings use 3 columns × 2 rows
- Removed the duplicate Mod summary above the shop

---

## v5.0.11 — Round picker in Log
- Log opens to a row of completed round-number buttons
- Picking a round restores its ranked score breakdown and historical game totals
- Dice review remains available inside the selected round
- Log and Instructions remain accessible after the final round

---

## v5.0.10 — Between-round score breakdown
- Round score cards rank players from highest to lowest points earned that round
- Every point source is listed separately: round win, Attack MVP, color wins, Well-Rounded Bonus, Mod Points, and boss awards
- Each card shows the round point total, Energy received, and current game total
- Point-source details are saved with each new round result for balance review

---

## v5.0.9 — Well-Rounded Bonus
- Lock at least one **6+ Weapons**, **6+ Strength**, and **6+ Agility** die in one round for **+2 points**
- Personal bonus pays regardless of which side wins
- Roll screen shows live progress toward all three colors
- Awards display a **WELL-ROUNDED +2** badge

---

## v5.0.8 — Rewards first
- Renamed **Help** to **Instructions**
- Instructions now begin with round-win points, Attack MVP bonuses, color awards, and winner Energy
- Every winning crew player or winning host visibly receives **WIN +2⚡**
- Top-three contribution badges now read **ATTACK MVP #1 / #2 / #3**

---

## v5.0.7 — Stronger Energy / Reroll Mod faces
- Base Energy per lock: **+2 / +3 / +4⚡** (was +1/2/3)
- Base Reroll per lock: **+2 / +3 / +4🎲** (was +1/1/2)
- Still 3 levels: start at level 1, upgrade to level 3 max

---

## v5.0.3 — Clearer Scar die faces
- Blank face says **blank** (no dash)
- Shatter face: **subtract highest die**
- Color faces: mini Weapons / Strength / Agility die inside the scar border with **−50%** (no colored circles)
- Larger −2⚡ and −50% text

---

## v5.0.2 — Clearer buttons
- Removed green→gold gradients on primary actions (Roll dice, Size up, Forge, locks, etc.)
- Solid Energy gold for main CTAs; solid blue/green for reroll and lock; dark red for danger
- Higher contrast labels, no glow shadows

---

## v5.0.1 — Plain attack labels
- Host attack picks no longer use codenames (Ravage / Crush / Sever)
- Buttons and rules now say what they do: **2× Weapons** · **1.75× Strength** · **Cancel top 2**
- “ChemDice” → **Mod die**, “Mirror” → **Parasite base** / **Base** in the UI
- Internal save keys unchanged (schema still v13)

---

## v5.0.0 — "The Long Infection" (full redesign)

Designed in PROPOSAL-v5.md, sim-tuned in tools/v5-sim.mjs, engine-verified in tools/v5-smoke.mjs (0 errors across 900+ bot games, all table sizes).

- **Rounds:** everyone hosts exactly **twice** + boss finale (2N+1 rounds; 13 at 6p). No training round. Future hosts remain hidden.
- **Economy:** stipend **6⚡** · **underdog +2⚡** for last place · win +2 · category +1.
- **Reroll tokens 🎲:** base 1/round, spent before energy on section rerolls. Reroll all always 2⚡.
- **Die sizes:** size-up 3⚡ (d6→d8→d10, parasite d12). Extra die now 4⚡. Forge unchanged (1⚡, +2).
- **Mod die (stacking):** faces = Base Attack / Base Energy / Base Reroll / Base % / Points / **one** scar. Every lock ADDS its tier value permanently — no lock-out, no caps, no dead faces. Upgrades (2⚡) raise the per-lock gain.
- **Scars:** 1 blank + 5 hurts — −2⚡ · −highest die · **−50% of red / blue / green dice**. Heal 3⚡.
- **Host turn — attack picks:** pick after seeing your roll. 🔴 2× Weapons, scars everyone · 🔵 1.75× Strength, scar one chosen (2+-scar guardrail) · 🟢 Cancel top 2 crew dice (and their category claims), scar only you. **Hosting always costs a scar.**
- **Parasite shop:** own ⚡ (stipend 7 + bank), same prices as crew, **must buy ≥1**. Hot dice (3–10) that **CRIT** on max face. Max 4 dice, cap d12.
- **Parasite base:** ≈ 45–47% of previous round's crew total (per-table beta/offset map) + permanent bump per crew hold. Boss HP tracks crew strength + Boss Meter (= scars created + host wins).
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
