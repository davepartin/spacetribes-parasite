# v5.1.0 current-engine balance — six players

Real `index.html` engine driven by `tools/v5-smoke.mjs` for **1,500 complete games**.

Rules under test: fair-half host schedule, human/parasite extra-die costs 4/5/6, forge L3 cap, size-up forge reset, mandatory 1–2 target Feeding Time at +3 each, and built parasite dice included in boss HP.

## Results

- Resolution errors: **0**
- Infection rounds: **18,000**
- Host wins: **53.7%**
- Boss clears: **50.5%**
- Average boss margin: **−0.5** (crew total minus HP)
- Average boss parts: **255.6 crew mirror + 35.4 built parasite dice + 24.5 danger**
- Average final score spread: **43.9 points**
- Negative-Energy incidents: **0**

| Round | Host win |
|---|---:|
| 1 | 55.1% |
| 2 | 52.3% |
| 3 | 50.8% |
| 4 | 59.6% |
| 5 | 58.5% |
| 6 | 57.6% |
| 7 | 60.3% |
| 8 | 53.7% |
| 9 | 55.7% |
| 10 | 48.8% |
| 11 | 48.1% |
| 12 | 44.4% |

These bot results validate the engine and give a useful calibration target. They do not replace six-friend table testing, especially for Wound targeting, retaliation, and whether the longer host turn feels fast enough.
