# Issue #14 — current WEB 18.72 model and decision fixtures (2026-11-01)

**DISCOVERY / ANALIZĂ ONLY.** This is a source-grounded financial contract review, **not** a product change, approved formula, data migration, reserve ledger, or preference survey. The critical encrypted-data issues #4/#29/#35 take precedence. No implementation of new budget perspectives is authorized.

## What the active immutable bundle actually does

Source inspected: `_expo/static/js/web/index-v01872-forced-colors-focus-20261101.js`, referenced by active `index.html` WEB **18.72**. These are extracted implementation observations, not a claim that every financial edge case is correct:

1. Module **210** exports `availableMoney(state,date)` as the **sum of `accountBalance` over accounts whose `available !== false`**. This inclusion flag is important: a perspective must specify which accounts are in scope, whether negative balances net against positive balances, and how restricted savings are treated. It is not sufficient to label the aggregate “all cash”.
2. Module **220** `coverage` already computes a **global, read-only-looking safe daily reference** from `availableMoney`, a known next-income date, and obligations due through the **day before** that income. It returns unavailable if required schedule information is missing; it returns uncovered at the first obligation exceeding remaining funds; otherwise it reports `safeDaily = max(0, floor(availableAfterObligations / horizonDays))`. **Future income is not added to current cash.** This existing concept overlaps with a proposed “real-money” perspective; avoid inventing a second competing “safe” number without a clear distinction.
3. The Dashboard passes `plannedDaily: I.allowance` and `safeDaily: min(I.allowance, T.safeDaily ?? 0)` into its Budget card. That display cap is not a new budget contract and must not be silently repurposed as a new per-category limit.
4. The window engine exports `budgetWindowSnapshots` with primary and optional tracking windows; weekly, biweekly, monthly, quarterly, annual, custom and paycheck windows have distinct date logic. Existing onboarding clipping to `State.started` remains a known contract question for long windows. The original planned category limits must remain independent of payment account.
5. The reconciliation model exposes `checkRows` with `observed`, `expected`, signed `difference` and absolute `unexplained`. A balance check is an **observation**, not a confirmed expense. Later explanatory transactions can change what a previous check means (see #2).

The code inspection does **not** establish that the current formulas are correct for overdrafts, card overpayments, restricted savings or all historical reconciliations. These are unresolved financial semantics.

## Numeric fixtures for approval — not proposed outputs of the current code

| Fixture | Facts | Must remain true / decision still required |
| --- | --- | --- |
| Planned spending vs payment source | Monthly food limit 600 RON; food purchase 100 RON on a credit card; checking 1,000 RON | Food category records 100 RON regardless of card/checking; payment of card is a transfer, not another 100 RON food expense. Decide whether the 100 RON is earmarked in a *separate* liquidity view. |
| Mixed old and new card debt | Card owes 500 RON: 300 old, 200 new funded purchases; checking 1,000 RON | Do not assume all 500 RON is already reserved. Decide explicitly how a reserve is represented before subtracting it. |
| Card overpayment (#25) | Checking 100 RON; card liability 20 RON; pay 25 RON | Checking becomes 75 RON, signed liability may become −5 RON; the 5 RON is issuer credit, **not 5 RON in checking**. Display semantics need approval. |
| Repeated unexplained check (#2) | Ledger expects 1,000 RON; two checks observe 900 RON, with no intervening events | Do not treat two observations as two certain −100 RON expenses or deduct −200 RON. Define latest-authoritative-check and reconciliation behavior before any “remaining days” perspective. |
| Later reconciliation | The unexplained −100 RON is later explained by an actual 100 RON expense linked to the check | Preserve accounting identity; the perspective must not subtract the same 100 RON both as confirmed expense and unexplained difference. Define recomputation vs historical snapshot. |
| Negative and restricted accounts | Checking −100 RON, available savings 300 RON, restricted savings 500 RON | Decide if included balances net to 200 RON, whether restricted savings are excluded, and whether negative checking forces “unavailable” instead of a positive spendable recommendation. Do not count credit line as owned money. |
| Future income | Owned cash 100 RON, salary 1,000 RON tomorrow | Today's owned cash is 100 RON. Existing coverage ends the day before income; decide how a period-remaining view treats the salary day and post-income days without pretending the salary is received. |
| Last day and crossed windows | Monthly period ends today; another weekly window ends in 3 days; paycheck window ends tomorrow | Decide whether “days remaining” includes today (1), whether expired windows show unavailable (0), and whether the same cash may be shown as **alternative views** rather than allocated independently to multiple windows. |
| Cross-origin stale data (#4/#29/#35) | Two local origins/tabs show divergent authenticated ledgers | No perspective may claim one is the latest authoritative cash without a loss-safe origin/backup contract. Never merge or overwrite automatically. |

## Alternatives and recommendation

**A — preserve the plan, show a distinct read-only owned-money context.** The original category budget and its spent amount stay unchanged. Show a separate global liquidity reference with explicit account scope, obligations, source timestamp and unknown-difference warning. Prefer using or clarifying existing Coverage instead of presenting a competing number. Lowest conceptual risk, but even this needs rules for negative balances, reserves and stale checks.

**B — optional remaining-period scenario.** A separately labeled hypothetical reference for a chosen period, with an explicit inclusive day count and account scope. No reallocation to categories, no creation of transactions, no auto-clearing “Neexplicat”. Needs an approved numeric contract for all fixtures above before implementation.

**C — auto-reserve and reallocate debt/cash into categories.** This changes accounting semantics, risks double-counting card settlement and creates ambiguous history after later reconciliation. **Not recommended** as part of #14.

**Recommendation for review:** clarify the already-shipped global Coverage semantics first; then consider A as a read-only comparison, and B only as an explicitly named scenario. Keep C outside scope. A financial tool should explain what is known and unknown without coaching, judgment or claims of precision.

## External principles, not copied UI

- [Actual Budget — credit cards](https://actualbudget.org/docs/budgeting/credit-cards/) and [transfers](https://actualbudget.org/docs/transactions/transfers/): distinguish spending category from settlement transfer.
- [YNAB — credit-card payments](https://support.ynab.com/en_us/credit-card-payments-a-guide-r1_506Q1j): reserved money is distinct from liability; this does **not** authorize a new reserve ledger here.
- [Prior source-and-community benchmark](WEB_PREMIUM_FINANCE_BENCHMARK_20261101.md): qualitative anecdotes are not Financial Autonomy user preferences.

## Contract approval gate

Before changing formulas or adding any modes, obtain explicit expected outputs for the nine fixtures, including: included accounts; treatment of negative/restricted balances and card issuer credit; whether obligations are already earmarked; latest check authority and subsequent reconciliation; inclusive/exclusive dates for monthly/weekly/biweekly/paycheck periods; behavior with unknown next income and no days remaining; rounding; and how overlapping windows share the **same** money without summing it twice.

**No code, product bundle, metadata, financial formula, storage, backup, real data or iOS changes in this document.**
