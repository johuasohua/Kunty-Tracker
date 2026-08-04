# Pending July Import — verified figures (NOT YET IMPORTED)

Status: **blocked pending decisions.** Nothing below has been written to the
database. Kept here so the reconciliation work isn't lost.

Source: `JULY_DATA.xlsx` (2nd upload), plus figures supplied directly in
conversation. All bank figures below were provided by Josh and treated as
authoritative over anything previously in the database.

## Verified seed values

| | Josh | Kiki |
|---|---:|---:|
| Account opening (Jul 1) | 111,148.63 | 139,829.00 |
| CC opening (Jul 1), derived | 14,068.07 | 7,422.73 |
| CC payment | 14,496 on Jul 3 | 9,411 on Jul 6 |

CC openings are *derived*, not supplied:
`CC opening = payment − charges dated before the payment date`.
Both land the post-payment balance on exactly 0.00, which independently
validates the payment amount, the opening, and the pre-payment charges.

Note: Josh's CC payment of 14,496 supersedes the 14,916 currently in
`cc_payments`, and his CC opening supersedes the June `cc_statements`
override. Both old figures are wrong.

## Reconciliation against real bank figures

| | Computed | Bank | Diff |
|---|---:|---:|---:|
| Josh account | 147,545.36 | 147,580.00 | **34.64** (0.023%) |
| Josh CC | 13,525.23 | 13,394.20 | **131.03** (0.98%) |
| Kiki CC | 5,572.49 | 5,598.00 | **−25.51** (0.46%) |
| Kiki account | 157,247.00 | *not supplied* | — |

The 131.03 on Josh's card is unattributed. Exhaustively searched: no subset
of the 12 August rows sums to it, no single charge or pair across all 167
credit charges from Jul 3 onward matches, no duplicates. Josh confirmed the
card shows no pending amount, so it isn't posting lag. Left as a known open
item rather than plugged.

## Corrections applied to the sheet data

- Aug 4 `Lifestyle 190.00` → **debit**, not credit (per Josh). This closed
  190 of an original 321.03 CC gap.
- Two income rows missing from the sheet entirely, supplied separately:
  - Josh incentive **11,463.85 on 2026-07-09**
  - Josh salary **20,000 on 2026-08-03**
- Kiki salary **45,000 on 2026-07-24** — absent from the sheet, which left
  her with zero July income. Confirmed by Josh.

## Salary timing — resolved, no action needed

Kiki is paid before month-end, Josh after month-start:

```
Jun 26  Kiki 45,000  |  Jul 1  Josh 20,000
Jul 24  Kiki 45,000  |  Aug 3  Josh 20,000
```

Every calendar month still contains exactly one salary each, so monthly
totals stay comparable and the trend is unaffected. Account balances are
date-driven so they're exact regardless. **Keep the real dates** — do not
re-date salaries the way the old spreadsheet import did.

## OPEN DECISION: June savings contradicts the real balances

| | |
|---|---:|
| June locked savings closing | 167,486.17 |
| Josh + Kiki actual Jul 1 opening | 250,977.63 |
| Gap | **83,491.46** |

The locked June figure was derived from the old, demonstrably unreliable
transaction data. The bank figures are almost certainly correct.

If imported as-is, the Savings tab chains July from 167,486.17 while the
person ledgers start from 250,977.63 — the two disagree permanently by 83k,
which `reconcileAgainstSavings` will surface as a visible discrepancy.

- **(A)** Update June's locked closing to 250,977.63 — restores continuity.
  *Recommended.*
- **(B)** Leave June — accept a permanent 83k mismatch.
- **(C)** Log an 83,491.46 adjustment entry — keeps June untouched, makes
  the correction explicit and auditable, but adds a synthetic transaction.

## Prerequisites before import can run

1. Migration `0015_account_opening_balances.sql` applied by hand in the
   Supabase SQL editor (per this project's convention — migrations are
   never auto-run).
2. A decision on A / B / C above.
3. Optional: Kiki's real bank cash balance, so her account side gets the
   same independent verification Josh's got.

## Planned import steps (not executed)

1. Delete Josh + Kiki transactions from 2026-06-01 onward, **excluding** the
   6 Offset-category rows (Jun 1 & 3, 80,000 total) that feed the Mortgage
   tab.
2. Import fresh July + August rows for both people (Josh 182 rows incl. the
   2 supplied income rows; Kiki 59 rows incl. the Jul 24 salary).
3. Update `opening_cc_balances` → Josh `2026-07-01 / 14,068.07`,
   Kiki `2026-07-01 / 7,422.73`.
4. Insert `account_opening_balances` → Josh `2026-07-01 / 111,148.63`,
   Kiki `2026-07-01 / 139,829.00`.
5. Replace Josh's Jul 3 `cc_payments` row with 14,496; add Kiki's Jul 6
   row of 9,411.
6. Delete the June `cc_statements` overrides (14,916 / 9,411) — with the CC
   seed moving to Jul 1, June falls outside the calculation entirely and
   those frozen figures now contradict the verified numbers.

Untouched by all of the above: `savings_periods` (June locked),
`offset_account_periods` (June locked at 138,043.56), all
`mortgage_payments`, and the 6 Offset transactions.

**Caveat:** step 1 deletes the June transactions that June's locked savings
row was computed from. The locked row keeps its value, but June's
line-item detail is gone permanently — monthly total only.
