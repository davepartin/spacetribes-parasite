# Changelog — Space Tribes: Parasite

Current build: **v4.9.2** · Schema **v10**

---

## v4.9.2 — Path UI fully gone
- Removed leftover path/commit CSS and legacy Gunner/Engineer seat titles
- Live `main` ships the no-path build (v4.8+)

## v4.9.1 — Copy game link
- Bottom dock **Copy link** button — copies the game URL so you can text it anytime

## v4.9.0 — Parasite Base Attack
- **Schema v10** — start a new game
- **Base Attack** — flat parasite power tuned for **4 players** (starts lean at −4)
- **Seat bonus this round** — +14 per player above 4 (−14 on 3p). Extra seats juice Base Attack without rewriting the whole package
- **Loss catch-up** — when the crew holds, Base Attack **+6 forever** (early losses make the bug climb back)
- Package flattened: same fusion/aura/atk-dice start at every table; Feed +2 aura; Outbreak +6 tonight
- Boss HP per meter softened (clearable more often when infection stays even)

## v4.8.0 — Three die types (Attack / Mod / Scar)
- **Schema v9** — start a new game
- **No crew paths** — Gunner / Engineer / Warden removed
- **No die commit** — Mint / Score / Strike / Charge / Brace removed
- **Attack dice** — Weapons / Strength / Agility (forge, buy extras)
- **Mod die** — 4 helpful faces (Energy / % / Base) + **2 Scar faces**. Lock a Scar face → grab a Scar die into your pool
- **Scar dice** — one shared design: **3 blanks + 3 hurts** (−2⚡, −10%, −highest). From Mod, Outbreak, or Poison
- **Heal scar** — **2⚡** in the shop removes one Scar die
- Reroll any die (Attack / Mod / Scar) with energy (1 free per round)

## v4.7.1 — Tooltips on hard words
- Dotted gold tips for Feed / Harden / Outbreak / Poison, paths, Strike / Charge / Brace, Mint / Score / Commit, Forge, Scar, Lock in, and more
- Tips work inside cards (no nested-button bugs)
- Tap any gold dotted word for a short explainer

## v4.7.0 — Four parasite moves (Feed / Harden / Outbreak / Poison)
- **Schema v8** — start a new game
- Host picks **exactly one** move each infection turn:
  - **Feed** — permanent aura · boss +1
  - **Harden** — +1 on every Attack face · boss +1
  - **Outbreak** — +1 Attack die (if room) · **+10 tonight** · **Scar on you** · boss +3
  - **Poison** — pick a crewmate; they gain a **Poison die** (Scar-like) · boss +2
- Soft/heavy growth menus removed (legacy keys still resolve)
- Poison rolls with the victim; can be rerolled; stacks to L2

## v4.6.0 — Crew paths + commit a die
- Path once: Gunner / Engineer / Warden
- Each roll: Commit Path action, Mint +1, or Score
- Schema v7

## v4.5.1 — Scar −highest rerollable
- −highest subtracts from total; die stays; reroll can move the hit

## v4.5.0 — Independent host locks + scaled Par ⚡
- Roll/lock human and parasite separately; Submit both
- Par ⚡ by table size

---

Earlier notes live in git history.
