# WEB #14 — budget perspectives: model audit and decision proposal (2026-10-28)

**Status: DISCOVERY / ANALIZĂ ONLY. No implementation approval.** This document characterizes the currently deployed WEB 18.61 financial engine and proposes **unapproved illustrative** alternatives. It is not a calculation contract, release, UI design acceptance or user-preference survey. All amounts below are fictional RON; no real financial data, backup or iOS project was accessed.

## Source audit — immutable WEB 18.61

Source: `_expo/static/js/web/index-v01861-keyboard-tab-focus-20261028.js` (Git blob `988f8b7142267a65bd21061d9cfa8b46e5ccfecc`), modules 207, 210, 219, 220, 221 and 206. This is **static code inspection**, not a new end-to-end numerical test.

| Existing concept | Observed implementation | Consequence for #14 |
| --- | --- | --- |
| Budget windows (219) | `budgetWindowSnapshots` supports paycheck, weekly, biweekly, monthly, quarterly, annual and custom; period start is clipped to `state.started`; recorded category spending is filtered by `roleOf(tx)==='budgeted'`, `categoryId`, date and `!voided`. `remaining = limit - spent`; daily rate for paycheck/weekly/biweekly/monthly is `max(0, floor(remaining / remainingDays))`. | This is a **plan/recorded-expense pace**, not cash available or a proof of complete history. Historical clipping affects partial onboarding. Do not silently reclassify unexplained balance differences as budget spending. |
| Today's budget (221) | `dailyBudget` aggregates eligible primary-window paces and today’s recorded categorized expenses; it also identifies spending outside the pace. | Today's pace is a separate construct from cash runway. Never substitute one for the other without explicit labeling. |
| Owned funds (210) | `availableMoney` sums `accountBalance` for accounts with `available !== false`; it does not add a card's **unused credit limit**. | Inclusion of savings/accounts is already a meaningful setting. Need to verify whether balances are current and whether any positive credit-card overpayment should count (#25). |
| Coverage (220) | `coverage` uses `availableMoney`, future obligations until the **day before next known income**, and `safeDaily=max(0,floor((cash-obligations)/horizonDays))` only when available; future income sets the horizon but is **not** added to funds. Missing income dates / uncertain due dates produce unavailable states; uncovered obligation returns a deficit. | A cash-based reference already exists, but its **horizon and purpose differ** from the category's budget window. Do not relabel it as an adjusted category budget. |
| Observed balances (207) | `checkRows` exposes `observed`, `expected`, signed `difference` and absolute `unexplained`; historical correction/audit offsets may affect later checks (see #2). | A discrepancy is an **observation**, not an expense, transfer or income. Need a clear authoritative current balance/observation timestamp contract before recalculating a new perspective. |
| Roles/transfers (206) | `roleOf` distinguishes `budgeted`, `unbudgeted`, `fixed`, `transfer`, `savings`, `debtPayment`, `income`. | A transfer between included owned accounts must not manufacture new spendable cash; card borrowing must not become owned income. |

**Current gaps:** No audited existing function allocates an aggregate available-cash pool to individual categories for a new #14 perspective. `availableMoney` does not by itself subtract every category reservation. The current model does not establish how to handle negative account balances, credit-card overpayment (#25), historical check corrections (#2), partial/missing transaction history, or competing budget windows for such an allocation. Therefore a new per-category “safe amount” would be an **unapproved financial formula**.

## Competing design alternatives (not implemented)

**A. Three clearly labeled, read-only references (recommended for approval discussion):**
1. **Planificat**: the existing category/window limit, recorded spending and remaining days, unchanged.
2. **Banii proprii acum**: an *aggregate context panel* for selected owned accounts, with current observed/as-of date, obligations, reserved funds, exclusions and an explicit unavailable state. Do not divide a shared pool across categories automatically.
3. **De azi până la [date]**: a read-only time-horizon context, showing the chosen endpoint and data freshness. If there is an unexplained difference, show its signed amount separately and a warning that recorded category spending may be incomplete. Do not convert that difference to an expense.

Pros: minimal semantic interference, reversible comparison, transparent provenance. Cons: users may want a single “how much can I spend on groceries?” number; the panel cannot responsibly provide that without a **separate allocation contract**.

**B. Automatic proportional scaling of each planned category to cash left:** looks simple, but double-counts shared cash unless the allocation/reserve order is specified; unfairly changes priorities and implies accuracy despite missing transactions. **Not recommended** without a user-approved allocation policy.

**C. Explicit user allocation of remaining cash to categories:** potentially defensible because the user chooses allocations, but adds complexity, needs a reservation ledger, migration, transfer handling, double-allocation safeguards and many tests. Future project, not authorized now.

**D. Mutate the original category budget when balance is updated:** destroys the distinction between intention and reality, risks rewriting historical plans and conceals unexplained differences. **Reject**.

## Worked hypothetical scenarios — illustrate decisions, NOT proposed executable formulas

1. **One category, two horizons:** Monthly food plan **1,500**, recorded food **600**, ten calendar days remain. The existing plan's nominal remaining **900**, and if the active primary-window snapshot has ten remaining days its current daily pace is **90/day** (minor units and rounding per module 219). Checking **900**, savings **400** excluded, future bills **700**, unused credit **3,000**. A simple aggregate cash-after-bills arithmetic illustration is **200**; this is **not** a 200 food allowance because other categories may need it. If savings is explicitly included, the arithmetic aggregate would be **600**, still unallocated. Never show **3,200/3,600** by adding credit.
2. **Unexplained balance drop:** Same plan, but a new check observes checking **700** instead of 900, difference **−200** against the expected ledger. Arithmetic after bills becomes **0** (assuming no other changes), while recorded food spending remains **600**, not **800**. The UI must not invent a 200 expense, infer its category, or silently change the original 1,500 limit. If the balance check later gets explained by multiple transactions, avoid counting the correction twice.
3. **Transfers:** Move **250** from included checking to included savings: aggregate owned funds should remain unchanged; move it to excluded savings: the selected pool changes but net worth does not. Neither action is new income. Must test both account-inclusion settings and same-day ordering.
4. **Future income:** Expected salary **2,000** in four days is **not current money**. The existing coverage horizon ends the day before it arrives; a weekly category window ending in seven days is a different horizon. Present both endpoints rather than blend them. Unknown income date means coverage unavailable, not 0.
5. **Negative balance / credit:** Checking **−100**, savings **400** excluded, card unused credit **5,000**, obligations **300**. A clipped nonnegative daily figure could hide a real deficit. Show negative position/shortfall explicitly and distinguish a signed card overpayment (#25) from a loan facility; do not auto-count either as checking cash.
6. **Repeated observations:** Check on day 10: difference **−200**; check on day 13: difference **−50**. These are **not** two expenses of 200 and 50. They are two reconciliation snapshots whose expected balances depend on intervening transactions and audit offsets (#2). The latest valid observation, provenance and corrections need an explicit rule.
7. **Onboarding late / missing history:** A monthly category is entered on day 25 with no earlier recorded expenses. Module 219 clips the tracked start to `state.started`. It must not imply the full month's spending was 0 or treat the remaining 6 days as an independently approved monthly budget.
8. **Window boundaries:** Paycheck, weekly, biweekly and monthly can have different end dates on the same day. On the last day, a positive amount divided by one day is not permission to spend if a bill is due. If next income is tomorrow, existing coverage can return `unavailable` for zero days before that income; show “Nu se poate calcula”, never a fabricated 0.
9. **Shared pool:** Two category plans each have **500** remaining, but aggregate owned funds after obligations are **300**. Displaying 300 as each category’s adjusted allowance would promise **600** from **300**. Only an explicit allocation (e.g., 200 + 100) could avoid double counting, and that policy is not agreed.

## UX contract candidate (for explicit approval, not implementation)

- Keep original `Planificat` as the default and **immutable under perspective switching**. A new perspective is an optional view, never an accounting transaction.
- Display the source and timestamp beside each number: `Conturi incluse: Curent`, `Verificat: [date]`, `Obligații până la [date]`, `Cheltuieli înregistrate până la [date]`. “Bani proprii” must never include undrawn credit.
- If data is insufficient, stale, conflicting, negative, or historically incomplete, show an explicit **unavailable / estimate with caveat** state; do not present zero as a verified amount.
- Distinguish “Planul pentru [window]” from “Banii disponibili până la [next income]”; do not use the same progress bar/color to imply equal meaning.
- A changed balance check may alter cash context only; it must not modify the original budget, silently create transactions, or reclassify an unexplained difference.
- On iPhone, prefer a compact labeled segmented control with short explanatory disclosure; check 320/390 px light/dark, 200% text, VoiceOver and non-overlapping labels. This is a **design hypothesis**, not a user preference or tested result.

## Decisions that require the user's explicit numeric contract

1. Is the new cash perspective **aggregate context only** (recommended initially), or a category-specific spendable limit? If category-specific, who allocates shared cash and in what order?
2. Which owned accounts count by default? Are savings opt-in? How are negative balances, overdraft and positive card-credit balances treated? (#25)
3. Which future obligations are reserved: fixed, debt, recurring, already-paid, all categories, scheduled savings, overdue items? How is double-reserving avoided?
4. What is the source of truth when the latest balance check differs from transactions, when checks are backdated, and when later edits/voids change historical anchors? (#2)
5. Is the remaining-days horizon the budget window, the next paycheck, the next bill, or user-selected? How are partial onboarding and different weekly/biweekly/paycheck periods handled?
6. Should future income appear **only as a date marker** (current coverage contract) or as a clearly separate projection? Do not mix projected and owned money.
7. When there are missing transactions, should the new view show an estimate with a warning, or be unavailable until a new verified balance? What does “verified” mean?
8. What are the expected values for the nine scenarios above, including the two-category 300/600 collision? Approval must cover exact examples, rounding and unavailable states before code.

## Test matrix after approval (not executed)

Pure engine tests: owned/borrowed funds separation; account inclusion and transfer conservation; negative balances; category allocation sum never exceeding eligible aggregate; 0/1/last-day horizon; cross-month and custom cycles; same-day and backdated checks; repeated reconciliation; future-income exclusion; bill priority; 1-ban rounding; partial onboarding; edit/void; data reload; invalid/stale observations; multiple categories and multiple accounts.

Integration tests: switching perspective leaves stored budget and encrypted ledger byte-identical; diagnostics/backup remain unchanged unless explicitly versioned; synthetic 320/390 light/dark, keyboard, 200% text, VoiceOver/Safari separately; release version and immutable bundle/CI/Vercel gates.

## External evidence and limits (reviewed 2026-10-28)

- [Actual Budget — Tracking Budget](https://actualbudget.org/docs/getting-started/tracking-budget/): explicitly separates forecast-style tracking from envelope budgeting. **Principle:** label distinct models; do not merge planned and funded numbers.
- [Actual Budget — How Budgeting Works](https://actualbudget.org/docs/budgeting/): describes held income and category carryover. **Principle:** show where available funds are committed; do not equate cash with unallocated cash.
- [Actual Budget — Restarting Your Budget](https://actualbudget.org/docs/advanced/restart/): documents a reconcile-and-resume path without deleting all history. **Principle:** support returning users without demanding manual reconstruction; Financial Autonomy's current semantics still require separate approval.
- [Reddit r/ynab, 2023 — Credit Card Confusion](https://www.reddit.com/r/ynab/comments/10op39g): one person confused category “available” with card account balance. **Anecdote only**; reinforces the need for precise provenance and labels.
- [Reddit r/ynab, 2025 — Am I missing something on YNAB?](https://www.reddit.com/r/ynab/comments/1jezh6z): one self-reported setup/target confusion. **Anecdote only**, not representative usability evidence.

**Recommendation:** approve (or revise) the **semantic contract** before implementing any new perspective. Prioritize aggregate, clearly sourced cash context first; defer automatic per-category cash allocation. No formulas, UI modes, real data, backup, vault, iOS, backend, accounts, telemetry or bank connections changed by this research.
