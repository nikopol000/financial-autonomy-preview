# WEB budget perspectives — horizon and provenance decision matrix (#14)

**27 October 2026. DISCOVERY ONLY; NOT APPROVED.** Read-only audit of immutable WEB 18.55, current issue #14 and earlier `docs/BUDGET_PERSPECTIVES_DISCOVERY.md` / `docs/WEB_BUDGET_PERSPECTIVES_DISCOVERY_20261025.md`. No production mode, formula, state, vault, backup or iOS change. All RON examples are synthetic.

## Newly verified active-code distinction

The immutable 18.55 bundle still passes `plannedDaily:I.allowance` and `safeDaily:Math.min(I.allowance,T.safeDaily??0)` to `BudgetDashboard`. `I` is the existing planned daily-budget result; `T` is coverage of currently available owned funds against obligations before next income. Thus **missing/unavailable coverage is coerced to numeric zero in this dashboard prop**. This is a *code-level display ambiguity*, not evidence of a real user's balance being zero and not authorization to change the formula. The next-income coverage horizon is not interchangeable with a weekly, biweekly, monthly or paycheck budget's own remaining-days horizon.

The active `budgetWindowSnapshots` renderer separately checks `calculationAvailable` and renders `incomplet` for unavailable category-window values. A future perspective must preserve this distinction rather than forcing a false numeric zero. The original budget limit/spend remains independent of the payment account; an unexplained observed-balance difference is not a confirmed category transaction.

## A decision matrix for overlapping time horizons (illustrative, not the current app's formula)

| Case | Planned budget window | Observed owned cash | Separate next-income horizon | Truthful optional reference (requires contract) |
| --- | --- | --- | --- | --- |
| A — monthly vs next paycheck | Monthly budget 1,200, spent 400, 10 calendar days inclusive left: **800 planned remaining** | 900 checked cash; 500 unpaid obligations, *not already reflected* | Next income in 4 days; coverage may span only 3 days | Do not label 400/10=40 RON/day as `Ritm sigur` over 10 days when obligations/coverage end in 3. Show two distinct horizons or unavailable. Future income is not yet owned. |
| B — overlapping categories | Weekly groceries 350 and monthly transport 500 | 600 checked cash; 200 unpaid obligations | 5 days until next income | Candidate global unallocated cash reference 400, **not 400 for groceries plus 400 for transport**. No per-category automatic allocation. |
| C — missing check | Monthly 500, spent 100, 2 days left | One cash account checked; another included account has no trustworthy observation | Next income configured | Do not show 0 as proof of no funds; show `Indisponibil` with missing account/as-of provenance until scope is defined. |
| D — observed discrepancy | Checking expected 1,100, checked 900 (difference -200) | Checked 900 already reflects the -200 | 6 days until next income | Do **not** subtract the -200 again. If explanation is later recorded, no synthetic budget expense may be inferred from the observation itself. |
| E — negative and card credit | Checking -100, cash 250, card overpaid by 25, unused credit limit 1,000 | Net checking+cash 150 before reserves; card credit 25 is not checking | 3 days until next income | Card credit is not available for cash-only bills. Do not add the 1,000 credit line. Whether positive card credit qualifies for constrained purchases requires #25 contract. |
| F — boundary | Paycheck period ends today, next begins tomorrow | 80 checked cash | No confirmed next income date | Today-inclusive remaining days is 1; after period end no divide-by-zero. Unknown income horizon is unavailable, not a fabricated date. |

**Do not sum independently derived safe references** across weekly/monthly/P2P windows; the same owned funds cannot be allocated multiple times. A transfer between two eligible owned accounts does not create funds. A transfer into excluded/locked savings changes the scope of available cash, not spending. Reserve obligations only once and only when not already reflected in the observed balance.

## External benchmark (principles, not copied UI)

- [Actual Budget: credit cards](https://actualbudget.org/docs/budgeting/credit-cards/) treats card balances as liabilities and distinguishes transfers from purchases. [Actual: tracking budget](https://actualbudget.org/docs/getting-started/tracking-budget/) explicitly separates forecast income/expenses from cash-backed envelope budgeting. **Principle:** label planned forecasts and money held as different quantities.
- [YNAB: assigning money](https://support.ynab.com/en_us/getting-started-assigning-your-money-in-ynab-SyHCkywTZl) ties allocations to money already held; [credit-card handling](https://support.ynab.com/en_us/handling-credit-cards-overview-ry7cNub1s) distinguishes category funding and card payment reserve. **Principle:** payment instrument and affordability are different dimensions.
- [Monarch: Flex budgeting](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting) distinguishes shared flexible spend, fixed and nonmonthly buckets and documents different rollover semantics. **Principle:** make a global shared pool visibly non-additive.
- Individual [Monarch discussion (13 Sep 2026)](https://www.reddit.com/r/MonarchMoney/comments/1wfkxwa/just_switched_to_flex_budgetinga_couple_ui/) questions whether `Remaining` means actual spend capacity; [discussion (24 Jan 2025)](https://www.reddit.com/r/MonarchMoney/comments/1i99s2g/) reports confusion when category totals differ from a shared Flex total. **These are anecdotes, not representative user preferences**. Design response: explain scope, provenance and the denominator, not three unexplained headline numbers.

## Recommended minimal contract for explicit approval (NOT implemented)

**Phase 1 proposal:** keep `Planificat` as the only editable category budget. Offer *one read-only, global* `Bani proprii verificați` reference with included accounts, excluded credit, last-check date and missing-data reason; a separate `Până la următorul venit` reference may be shown **only** when income and unpaid-obligation coverage is complete. Never copy this reference into every budget category. Do not implement any new mode yet.

**Decisions still required:** (1) which account types/negative balances/locked savings are eligible; (2) whether card overpayments are excluded or separately spendable by payment method (#25); (3) exact unpaid-obligation detection and anti-double-subtraction rule; (4) freshness threshold and behavior with incomplete balance checks; (5) next-income horizon vs each budget's own horizon and today-inclusive day count; (6) treatment of positive unexplained differences and historical void/recheck (#2); (7) whether global reference is purely informational or can ever constrain actions; (8) whether to show `Indisponibil` instead of the current 0 fallback and how to explain it.

## Verification and safe next step

Evidence: actual 18.55 immutable bundle string `safeDaily:Math.min(I.allowance,T.safeDaily??0)`, `budgetWindowSnapshots` `calculationAvailable` branch, previous real-model discovery documents, official references and explicitly labeled community anecdotes. No new tests executed for these illustrative candidate calculations; **none are approved or claimed as product output**.

Once a numeric contract is explicitly approved: add synthetic real-engine tests for status/provenance, 1/0 days, cross-window double allocation, negative balances, credit, transfers, repeated checks, future income, unpaid-obligation anti-double-count, late reconciliation and read-only/no-vault-write invariants. Then immutable release/CI/Vercel/browser verification. Until then issue #14 remains DISCOVERY and product code unchanged.
