# #14 — remaining-period budget perspectives: numerical contract questions (2026-11-01)

**DISCOVERY / ANALIZĂ ONLY.** This is a decision aid, **not** a product implementation, approved formula, spending advice, or permission to change stored data. WEB 18.67 remains unchanged. This analysis is separate from the critical encrypted-ledger issues #4/#29/#35.

## Keep three different concepts distinct

1. **Original category plan:** the user's configured category limit and recorded eligible spending for the original window, independent of the payment account. Changing a viewing perspective must not rewrite this plan, transaction history, or past category totals.
2. **Observed owned liquidity:** a separately labeled, *optional* reference to selected cash/checking/savings accounts, after **explicitly defined** unpaid obligations/reservations. Borrowed credit limits, unreceived salary and card issuer credit are not automatically spendable checking cash.
3. **Remaining-window reference:** a *hypothetical* rate based on a specified account scope, known obligations, a chosen as-of date and an explicit number of remaining days. This must not be described as a new budget, a safe promise, or an instruction to spend.

These quantities need distinct names and provenance. A category limit is **not** an account balance. A checked balance is an observation, not a newly classified transaction. An unexplained difference is **not** automatically a purchase.

## Proposed fixtures for user approval — all values illustrative

| Fixture | Observations and hypothetical inputs | Contract to decide (no approved output yet) |
| --- | --- | --- |
| Plan vs cash | Monthly food plan 1,200 RON; 500 RON eligible purchases already recorded; checking 650 RON, selected unrestricted savings 300 RON; known unpaid bills 400 RON. | Original plan remaining is 700 RON, regardless of account. Optional observed owned liquidity starts at 950 RON, but whether 400 RON is deducted and whether any part is already reserved **must be explicitly specified**. Never subtract recorded card purchases twice. |
| Card payment / transfer | Checking 1,000 RON; 200 RON groceries on credit card; 200 RON earmarked for repayment; pay card 200 RON. | Food category spending remains 200 RON; checking becomes 800 RON, card liability 0. Do not record a second 200 RON expense for the settlement transfer. Whether the earmark was already part of unpaid obligations must be decided before a liquidity figure is calculated. |
| Old debt mixed with new spending | Checking 1,000 RON; old card debt 300 RON; new funded card purchase 200 RON; card liability 500 RON. | Do not assume all 500 RON is reserved. Define separately the 200 RON new-purchase earmark and any user-entered old-debt repayment obligation. |
| Repeated unexplained check | Ledger predicts checking 800 RON; observed checking 750 RON on Monday and again 750 RON on Tuesday; no new ledger events. | One unresolved 50 RON discrepancy, **not** two 50 RON expenses. Later classification as a 50 RON expense changes category totals but must not silently deduct the same 50 RON from observed liquidity again. Historical check correction semantics depend on #2. |
| Cash shortage and excluded accounts | Checking −100 RON; savings 200 RON, of which 150 RON is restricted; available card credit 2,000 RON. | Define whether account aggregation nets negative checking, whether restricted savings are excluded, and whether the optional reference can be negative. Card credit is never counted as owned money. |
| Future income | Checking 100 RON; 1,000 RON salary expected tomorrow but not received. | Owned liquidity today is not 1,100 RON. A separate forward plan may display expected income with an explicit uncertain status, but not as observed cash. |
| Period boundary | Weekly window ends Sunday; observation on Sunday, or a paycheck-to-paycheck window with payday tomorrow. | Decide whether **today** is included. A window with zero remaining days must display a neutral end-of-period state, not divide by zero. Dates should be local calendar dates, not naive 24-hour UTC intervals; handle DST and partial days. |
| Multiple windows | Monthly plan and quarterly/annual tracking; ledger began mid-quarter. | Do not present an incomplete history as a full quarter. Preserve the existing clipping-to-ledger-start behavior until the onboarding/history contract is approved. |

### Alternative display models

**A — two read-only references (lowest risk):** original category plan plus separately labeled observed owned liquidity, with an expandable source-of-number breakdown. No category rewrite, no automatic reserve, no new transaction.

**B — optional third reference:** A plus remaining-window per-day amount, **only after** deciding account inclusion, obligation deduplication, dates, unknown checks and negative balances. A low or negative value should be presented factually without moral language.

**C — automatic debt envelopes or inferred reconciliation:** higher automation but introduces new reserve accounting and uncertain inferred transactions. **Not recommended without a separate explicit contract**; a visually attractive number is not evidence of financial correctness.

**Provisional recommendation:** A first for review, B only with approved numerical expectations, C out of scope. None is approved for implementation.

## External principles and evidence quality

- [Actual Budget — transfers](https://actualbudget.org/docs/transactions/transfers/) and [credit cards](https://actualbudget.org/docs/budgeting/credit-cards/): separate category spending from transfers between tracked accounts.
- [YNAB — credit-card handling](https://support.ynab.com/en_us/handling-credit-cards-overview-ry7cNub1s) and [overspending](https://support.ynab.com/en_us/credit-card-overspending-an-overview-HkMGpSbJs): distinguish funded purchases from debt that has not been funded. Their accounting model is **not** automatically Financial Autonomy's model.
- [YNAB user discussion about double counting](https://www.reddit.com/r/ynab/comments/oqi411/): anecdotal evidence that card payments can be misunderstood as duplicate spending; not a representative user preference survey.
- Existing [credit transfer benchmark](WEB_BUDGET_CREDIT_TRANSFER_BENCHMARK_20261030.md) covers positive card credit (#25) and repeated balance checks (#2).

**Design principle, not a competitor feature copy:** label the observation date, included accounts, excluded credit, reserves and unresolved differences near any derived number. The application is a tool, not a coach.

## Explicit approval gate before coding

Approve exact expected outputs for: (1) account scope and restricted savings; (2) old vs new card debt/reserved payments; (3) repeated/retroactively explained checks; (4) negative liquidity; (5) date inclusion and payday windows; (6) end-of-period/zero denominator; (7) future income and card overpayment. Coordinate #2 and #25. Until then **no three-mode UI, financial formula, reserve engine, ledger mutation, backup/schema change, or version bump**.
