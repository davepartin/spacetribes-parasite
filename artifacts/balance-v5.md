# v5 proposal sim — 6p × 400 games (standalone model of PROPOSAL-v5.md)
Parasite MIRROR base: 0.5×(prev round crew Σ), seed 55 · holdBump +2 · fusion 0.62 · Feed +2

## Host vs crew by round
| R | Host win% | Crew Σ | Host Σ | Par part |
|---|---:|---:|---:|---:|
| 1 | 57.5% | 72.4 | 75.4 | 60.9 |
| 2 | 34.5% | 101.5 | 95.6 | 75.5 |
| 3 | 42.8% | 125.2 | 121.6 | 96.6 |
| 4 | 41% | 148 | 143.9 | 114.1 |
| 5 | 43.8% | 170.9 | 167.4 | 132.5 |
| 6 | 30.5% | 197 | 189.7 | 150.2 |
| 7 | 34.8% | 220.1 | 213 | 168.6 |
| 8 | 39.8% | 238.7 | 234 | 186 |
| 9 | 44.5% | 252.2 | 251.2 | 200.7 |
| 10 | 48.8% | 264 | 264.8 | 212 |
| 11 | 47.5% | 275.6 | 275.4 | 221.3 |
| 12 | 50.8% | 285.3 | 287.6 | 230.5 |

Avg host win: **43%** (target 45–55, flat-ish curve)

## Boss (round 13)
- Clear **100%** at HP 175+1.5×meter · avg crew 353.2 vs HP 213.5 · avg meter 25.7
- Calibrated hpBase for ~50% clear ≈ **314**

## Strategy balance (baseline 16.7% each)
| Strategy | Win% | Avg place | Avg pts |
|---|---:|---:|---:|
| RUSHER | 3% | 4.6 | 66.7 |
| GAMBLER | 15.8% | 3.4 | 82.5 |
| SNIPER | 15.5% | 3.3 | 83.3 |
| ENGINE | 21% | 3.4 | 80.4 |
| MEDIC | 27.5% | 2.8 | 89.7 |
| HOARDER | 17.3% | 3.4 | 81.1 |

## ChemDice snowball check
- Base Energy claimed by R4: n=1396 · win 15.1% · avg place 3.6
- Base Energy claimed R5+: n=892 · win 18.5% · avg place 3.4
- Never claimed Energy: n=112 · win 21.4% · avg place 3.1
- Avg distinct tracks claimed per player per game: 3.8 of 4
- STACKING stats: avg locks/game 10.4 · final Base +7.8 · stipend +3.5⚡ · +29.7% · tokens +2.6
- Locks: winners avg 10.7 vs last-place avg 10.1 — gap = how much lock-luck decides games

## Scar death-spiral check
- Hit 3+ scars at some point: n=34 · win 2.9% · avg place 5
- Never above 1 scar: n=1915 · win 17.8% · avg place 3.4
- Last place at half-time: n=400 · finished 4th+ 46.8% · avg final place 4.4 · won 6.8%

## Point spread
- Avg 1st→6th spread: **55.7 pts** · winner 109.5 · last 53.8

---
## Variant runs (300 games each)

### A — OLD claim-once lock-out rule (comparison)
Host 57.6% · spread 47 · last-at-half escapes 33.3%
| Strategy | Win% | Avg place | Avg pts |
|---|---:|---:|---:|
| RUSHER | 1% | 4.8 | 60.1 |
| GAMBLER | 16.3% | 3.2 | 77 |
| SNIPER | 17.7% | 3.2 | 76.3 |
| ENGINE | 4.7% | 4.3 | 66 |
| MEDIC | 37% | 2.5 | 84.6 |
| HOARDER | 23.3% | 3.1 | 78.5 |

### B — stacking but % face capped at +30% total
Host 45.2% · spread 56.5 · last-at-half escapes 34.7%
| Strategy | Win% | Avg place | Avg pts |
|---|---:|---:|---:|
| RUSHER | 4.3% | 4.5 | 66 |
| GAMBLER | 20.3% | 3.1 | 84 |
| SNIPER | 16% | 3.2 | 82.2 |
| ENGINE | 3% | 4.5 | 66.2 |
| MEDIC | 36.7% | 2.5 | 91.1 |
| HOARDER | 19.7% | 3.3 | 81.5 |
