# WEB budget perspectives — financial-contract discovery (issue #14)

**2026-10-25 · research only · WEB v18.47 main `0432ef342a91b8a2212d26de5e8e24d982bd2781` · NOT IMPLEMENTED**

This document is a candidate contract for discussion, **not** approval to change calculations, budget modes, financial state, storage or the UI. It uses the actual immutable v18.47 web bundle plus third-party documentation and community anecdotes. No user financial data was accessed; numerical cases below are synthetic.

## Existing code — observations, not assumptions

- In module 219, `coverage(state, date)` starts with `availableMoney`, locates the **next configured income date**, and considers obligations through the **day before that income**. It explicitly excludes future income from current cash. On the available branch it calculates `safeDaily = max(0, floor(availableAfterObligations / horizonDays))`. Unknown due dates or uncovered obligations return an unavailable/uncovered status.
- The dashboard passes `safeDaily: Math.min(I.allowance, T.safeDaily ?? 0)` to `BudgetDashboard`, where `I` is the current `dailyBudget` result and `T` is coverage. This is an **existing cap on the daily display**, not a general per-category “real-money-adjusted budget”. In particular, the `?? 0` fallback deserves explicit UI verification: a missing coverage result must not be explained as a verified zero balance.
- The budget-window engine (`budgetWindowSnapshots`) supports paycheck, weekly, biweekly, monthly, quarterly, annual and custom periods, with distinct primary and additional windows. Reusing a next-income coverage horizon as if it were always the remaining budget-window horizon would be a semantic error.
- Reconciliation checks retain observed balance and an `unexplained` difference. A difference is **not** an automatically categorized expense. Available credit is tracked separately from owned money. A transfer between owned accounts must not create purchasing power.
- UI code still contains `Primary` in at least three user-facing budget labels, despite existing Romanian “Perioada principală” and “Alte perioade urmărite”. The old issue #17 inventory of `Primary window`, `Additional tracking windows`, `Budget ID explicit` is stale for v18.47; inspect actual rendering before copy-only edits.

## Distinct quantities — never collapse them into one number

| Concept | Candidate meaning | Must not be interpreted as |
| --- | --- | --- |
| **Buget planificat** | Original user-defined category limit and original period | Actual cash in accounts |
| **Rămas din buget** | Planned limit minus eligible category spending under existing window rules | Bank balance or cash available for card payment |
| **Bani proprii verificați** | Owned funds in selected eligible cash/current/savings accounts at a clearly disclosed as-of date | Credit limit, future salary or an unexplained difference treated as a purchase |
| **Spațiu după obligații** | Owned money minus obligations **not already reflected in account balances**, over an explicitly stated horizon | A new income source or a second subtraction of a paid bill |
| **Reper pentru zilele rămase** | Optional, non-mutating projection with a specified inclusive date window and denominator | A replacement of the original budget or an inferred past transaction |

An adjusted budget should not be silently described as “your budget”; it is a **view / reference**, never an update to planned category limits. The same transaction must be counted once, whether paid from cash or a card.

## Alternative designs

**A — Three separate read-only perspectives (preferred direction, conditional).**
Keep planned limit and category remaining unchanged. Add a clearly labeled cash-constrained reference and a remaining-days reference, each with “Cum se calculează” and a date/horizon. Advantages: reversible, auditable, preserves intent. Risks: too many similar numbers and ambiguous treatment of shared cash across categories. Never imply that each category independently owns all available cash.

**B — One conservative daily cap beside planned pace.**
Keep existing daily pace and show the lower of the planned pace and a verified cash-after-obligations pace, with distinct horizon labels. Advantages: less clutter and close to current dashboard logic. Risks: next-income horizon and budget-window horizon can differ; missing coverage must show “Indisponibil”, not zero. This is a UX candidate, not authorization to modify `Math.min` or any formula.

**C — Automatic reallocation of category limits after each balance check.**
Rejected without an entirely new financial contract. It would silently rewrite intent, treat reconciliation differences as spending, and may double-count already paid obligations or credit-card transfers.

## Synthetic decision examples — candidate arithmetic, not current application output

1. **Planned versus available.** A monthly category has 2,000 RON planned and 600 RON eligible spending. With **10 calendar days inclusive** remaining, planned remainder is 1,400 RON and its simple remaining-day reference is **140 RON/day**. Separately, 1,100 RON of verified owned cash minus 400 RON of **unpaid** obligations leaves 700 RON, or **70 RON/day** over that same 10-day window. The 70 is a *shared cash constraint*, not 70 RON/day granted to every category. If the 400 was already paid and reflected in 1,100, subtracting it again is wrong.
2. **Available credit is not money.** Checking 700 + cash 100 + savings 200 = **1,000 RON owned**; credit-card available limit 5,000 RON does not make the base 6,000. A 200 RON card purchase already counted against a category must not also be counted as a cash expense when the card bill is paid. Existing debt service remains a distinct obligation.
3. **Unexplained reconciliation.** If a checked balance falls from 1,100 to 900 RON without identified transactions, the candidate cash reference may reflect **900** as the latest verified amount, but the 200 RON gap is labeled **unexplained**, not booked as a 200 RON category expense. Later reconciliation must not double-adjust the plan.
4. **Transfer invariance.** Moving 300 RON from checking to savings keeps total eligible owned money unchanged, subject to the explicit inclusion/exclusion policy for savings. Moving to an excluded savings account must be explained as a *scope change*, not an expense.
5. **Future income.** A salary expected in 5 days cannot be added to today's verified cash. A next-income coverage horizon of 4 days is **not interchangeable** with 10 days left in a monthly budget.
6. **Boundaries.** On the final day, the denominator is one if today is included; after the window ends, the perspective is unavailable or historical, not divided by zero. For biweekly/week/paycheck windows, show the actual start/end; for a negative cash position, show a shortfall/indeterminate state rather than falsely positive spending power.

## Premium-product benchmark — principles only

- [YNAB — credit-card payments](https://support.ynab.com/en_us/credit-card-payments-a-guide-r1_506Q1j) distinguishes funds reserved for card payments from the card balance itself. Transferable principle: **name the purpose and source of each balance**. Its envelope model is not adopted.
- [Monarch — Flex Budgeting](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting) separates fixed/non-monthly/flexible groups and distinguishes actual from remaining, including a compact mobile column toggle. Transferable principle: **keep a single primary number and offer explicit alternate views**, not a dense row of three unexplained numbers. No UI is copied.
- [Community discussion, YNAB credit-card confusion, 2026-02-21](https://www.reddit.com/r/ynab/comments/1rayf5h/assigning_funds_to_credit_card_payments/) describes fear of double-funding the same card purchase; [another discussion, 2023-01-30](https://www.reddit.com/r/ynab/comments/10op39g) shows confusion between account balance and budget payment availability. These are **individual anecdotes**, not representative user research. Transferable principle: **prevent double-counting and label “available for what?”**.
- No assumption is made about Financial Autonomy users' preferences. Benchmark does not override the product's local-only, non-coaching positioning.

## Contract questions requiring explicit user decision before implementation

1. Which accounts count as spendable owned funds: checking and cash only, or savings too? Can users choose the scope? How are negative balances and overdrafts treated?
2. Does “adjusted to real money” mean **cash only**, **cash minus unpaid obligations**, or both separately? Define how paid/unpaid obligations are detected without bank sync, and how to prevent double subtraction.
3. Does the daily reference use **budget-window days remaining**, **days until next income**, or two separately labeled horizons? Is today included and is a zero-day state unavailable?
4. How is the shared cash reference apportioned across multiple categories without implying that the full cash balance is independently available in each?
5. Should reconciliation gaps affect only the current owned-cash reference, or also any historical view? They must never become inferred expenses.
6. What is the display for missing/stale balance checks, unconfigured income/due dates, negative cash, and credit-card overpayment? “Indisponibil” may be safer than 0.
7. Which perspectives are visible by default and how does a user return to the unchanged original plan?

## Acceptance tests to specify after approval

- Repeated same-day balance checks; missing/recovered check; explanatory transaction entered later; transfer across included/excluded accounts; card spend and later payment; negative and overpaid credit; already-paid obligation; future salary; multiple categories competing for same cash; window boundaries including 1/0 days, Monday–Sunday, two weeks, monthly and paycheck.
- For every view: input trace, output cents, provenance/as-of date, no writes to original plan, unchanged encrypted vault/export schema, identical financial calculations in light/dark, accessibility names and narrow mobile layout.
- Require an **approved numeric contract** before code, plus real-model tests, immutable version, CI, Vercel exact-SHA and browser evidence. Issue #14 remains DISCOVERY.

## Deployment state at research time

GitHub main contains WEB 18.47, but Vercel production last independently reported READY for v18.45 `a885afdd94ccb33a819f6291cf22fbdfc2b99ff2`. The v18.47 product commit `e830d0f33f459d1280310c567610e6d1d0caae24` has Vercel combined status **failure / build-rate-limit**. No new product version or bundle was created by this document.
