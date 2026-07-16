# Changelog — Space Tribes: Parasite

Current build: **v4.4.1** · Schema **v6**

Everything from **v4.0 through v4.3** is in this build.

---

## v4.4.1 — Host roll clarity
- Parasite package shows live **Atk + Mod + Share + Spec + Aura = Par** total
- Lock in shows **human + parasite = host total**
- Sticky header shows **Par ⚡** on host roll turns
- Human dice also list their face numbers

## v4.4.0 — Parasite energy + separate rerolls + heavy die growth
- Parasite gets **⚡7** each host turn for its own rerolls
- Separate **Reroll parasite die** section (human rerolls stay separate)
- Every **heavy** growth adds **+1 Attack die** when under max (4)
- Attack dice show their face numbers underneath

## v4.3.18 — Parasite “+ bonus re-roll”
- Parasite Attack dice that hit max show **+ bonus re-roll** (not “exploded”)

## v4.3.17 — Readable Reroll button
- **Reroll selected** uses white text on a blue gradient (was low-contrast grey on gold)

## v4.3.16 — Parasite “what these dice do” box
- Bigger explanation box under the parasite package (Attack / Mod / Specialty)
- Titled **What these dice do**, with this roll’s Mod + Specialty called out

## v4.3.15 — Clearer parasite package
- Parasite Attack / Mod / Specialty dice use solid, readable colors
- Explanation box under the package: what each die does + this roll’s Specialty

## v4.3.14 — Base chip back (starts +0)
- Sticky header shows **Base** again (You · Energy · Base · Points)
- Base starts at **+0**; rises to **+3 / +5** as you upgrade mod Base faces
- Still only adds to combat total when the mod die rolls Base

## v4.3.13 — Cleaner shop + roll layout
- **Reset choices** no longer floats over Extra die (scrolls with shop)
- Roll board shows crew dice **+** mod die, then **Dice + Mod = Total**
- More bottom room so Lock in / Roll dice don’t cover content

## v4.3.12 — Big mod die on the roll board
- Shop mod faces look like mini dice (⚡ / % / Base colors)
- After **Roll dice**, the mod die appears as a **full-size die** next to your crew dice
- Clean **Dice + Mod = Total** before Lock in; mod die is rerollable

## v4.3.11 — Base is mod-roll only
- Mod-die **Base** faces are **+3 / +4 / +5** again
- Sticky header no longer shows a standing Base chip (You · Energy · Points only)
- Humans get Base **only when the mod die rolls it**

## v4.3.10 — Base starts at +0
- Superseded by 4.3.11 (Base faces restored; header clarified)

## v4.3.9 — Bonus dice look different
- Bought extra dice keep the solid color but get a **light diagonal hatch** and a small **+**
- Label shows “bonus” so you can tell starter red from a later-bought red

## v4.3.8 — Solid color dice
- Red / blue / green dice are solid color with **white pips + white number**
- Bought extra dice use the same look

## v4.3.7 — Clearer roll total / reroll
- Combat total sits **inline** with dice math (not stacked over Reroll)
- Bottom bar is just **Lock in · total** so Reroll stays readable

## v4.3.6 — Slim sticky header
- Sticky top bar is **only**: you · energy left · Base attack · points
- Standings and full mod-die face list **scroll** with the page

## v4.3.5 — Solo start with all seats blank
- **Who’s playing?** no longer blocks when every name field is empty
- All blank → **P1 = You** (human), other seats = computers
- Clearer placeholders / confirm copy for phone solo tests

## v4.3.4 — Computer opponents (solo test)
- Leave a seat **blank** at New game → it becomes a **Comp** that auto-shops, rolls, and locks
- Type only your name to solo-play against computers

## v4.3.3 — Color + shape seat icons
- Each seat is a distinct **color + shape** (circle, triangle, square, diamond, star, hex)
- Typed **name always sits next to the symbol** (standings, top bar, review, awards, wait list)

## v4.3.1 — Typed names
- Type each player’s name at **New game**
- Join your seat; names show in standings, host labels, review, awards
- No fixed Dave / Brian / Joel / Chris character list

## v4.3 — 3–6 players
- Table size **3–6**
- Parasite + boss HP **scale with player count**
- Host seats random, **max 2 each**, never 3
- **3-player tables:** 2 skirmish rounds (no host) so the seat math fits

| Players | Share | Aura | Atk dice | Boss HP base |
|---|---|---|---|---|
| 3 | 55% | +2 | 2 | 75 |
| 4 | 60% | +3 | 2 | 100 |
| 5 | 65% | +4 | 2 (hotter faces) | 125 |
| 6 | 70% | +5 | 3 | 150 |

## v4.2 — Clearer UI
- Plain die labels (`+8`, `+25% atk`, `−2⚡`, etc.)
- Tap-to-explain tip links on jargon
- Round **Log**
- Parasite options in plain English (human share, specialty, Scar)
- Review screen without fusion/instinct code words
- Mod shop labels match real faces (`2⚡ / 20% / Base+3`)

## v4.1 — Playability
- Live **Energy countdown** at the top
- **Reset choices** (clear shop / bail out of a roll)
- **1 free reroll every round**
- Between-round **dice review** (mod + scar + parasite math)
- Combat total with mod/scar before Lock in
- Crypto-backed fair rolls
- Scar reroll / shatter fixes
- Connecting stuck fix (empty Firebase `rounds`)
- Sticky standings bar

## v4.0 — Core game
- 10 rounds: Training → Infection → Boss
- Host = you + the parasite vs the rest of the crew
- Soft / heavy growth + Scar die
- Exploding parasite attack dice
- Specialty die
- Human share + aura on host turns
- Fog of war on future hosts
- Boss HP from Boss Meter

---

After updating: hard-refresh the site and start a **New game**.
