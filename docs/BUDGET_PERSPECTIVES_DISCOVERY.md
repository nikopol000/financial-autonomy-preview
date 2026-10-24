# Issue #14 — Budget perspectives: discovery / contract proposal (NOT APPROVED)

**Date:** 2026-10-24. **Read-only research** against WEB `main` `1c7be4dac05251d866efd2838c789012b508aacf`, immutable v18.41. No implementation, persisted preference, accounting change, or release is authorized by this document.

## Real code findings (v18.41)
- Module 219 `budgetWindowSnapshots`: primary budget window is independent of the payment account; supports paycheck/P2P, weekly, biweekly, monthly, quarterly, annual, custom. The active window is clipped to `state.started`; tracked spend is the sum of non-voided **budgeted** transactions for the category, not a bank-account balance. Snapshot exposes `limit`, `spent`, `remaining`, `remainingDays`, `daily`, `calculationAvailable`; `daily` is currently offered only for paycheck/weekly/biweekly/monthly. Annual/quarterly are *not* equivalent to daily pace.
- Module 220 `dailyBudget`: existing **Buget azi** is a planned daily allowance from selected budget windows minus today's budgeted spending; other spending is reported separately. It is not an account balance or a promise of affordability.
- Module 210 `availableMoney`: sum of `accountBalance` for accounts whose `available !== false`; credit card limits are not included. Negative balances may reduce this total; savings/cash inclusion depends on the account's availability flag. Module 219's window math and module 210's owned-money math are **different primitives**.
- Module 219/220 `coverage`: **Ritm sigur** uses currently available owned funds minus dated obligations up to the day *before* the next configured income; the future income sets a horizon, not an inflow. If due dates/income horizon are unknown, the result is unavailable, not zero.
- Module 207 `checkedBalance`/ `checkRows`: latest observed balance anchors later account balances; `difference` is signed and `unexplained` is its absolute value. A balance check is an observation, **not** automatically an expense or income. Retroactive edited/voided income can affect later check arithmetic (issue #2, financial contract unresolved).
- `src/reconciliation-batch.cjs` / `src/reconciliation-draft.cjs`: explanation rows are staged and persisted atomically only if the remaining difference reaches zero; incomplete draft previews do not mutate the ledger. Do not add synthetic transactions for a budget perspective.

## Three different questions, not three competing truths
1. **Planificat**: „Cât mi-am propus să cheltuiesc?” Existing configured window limit and tracked spend, always visible and immutable when switching views.
2. **În limita banilor mei**: „Ce pot susține din bani proprii acum?” Optional conservative *reference*, not a revised category budget. Needs a defined allocation of shared liquidity and treatment of savings, debt payments, upcoming obligations and already-reserved money. A global cash ceiling must **not** be copied as an allowance into every category.
3. **Pentru zilele rămase**: „Ce ritm ar permite soldul real verificat, chiar dacă nu știu toate tranzacțiile?” An optional derived reference based on current observed account balances; differences remain marked **neexplicate**, not booked as purchases. A verified negative discrepancy already lowers `accountBalance`; subtracting it again would double-count. A positive unexplained discrepancy must not silently become new income.

## Alternatives evaluated
| Option | Mechanism | Advantage | Risk / disposition |
| --- | --- | --- | --- |
| A. Replace original budget with adjusted one | Mutate configured limits after balance check | One number | **Reject**: destroys intent/history, confuses reconciliation with spending. |
| B. Three interchangeable budget values | Same card displays Planificat / Bani proprii / Zile rămase | Compact | **Defer**: one headline may falsely imply interchangeable amounts and hides cross-category cash competition. |
| C. Fixed original budget + optional read-only context | Keep existing budget; add separate „Disponibil din bani proprii” / „Ritm orientativ până la [date]” with source, horizon, uncertainty, and unavailable states | Preserves accounting truth; transparent | **Recommended for contract review only**, not approved for implementation. |
| D. Global owned-money ceiling only | Show one separate global cap and current `Ritm sigur`; no per-category allocation | Low risk and no double-count | Viable **first stage** if user declines allocation model. |

## Hypothetical examples (RON, illustrative only; NOT app formulas)
- **Plan 2,000; tracked 600; 10 days remain**: planned remainder 1,400; existing window's daily calculation must be used as-is. Checking 700 + cash 200 + savings marked unavailable 500 = 900 *eligible* owned cash; credit limit 3,000 is **excluded**. If 500 of the 900 is committed to unpaid obligations, a **global** illustrative flexible ceiling is 400, or 40/day for 10 days. This is not automatically 400 for groceries **and** 400 for transport.
- **Unexplained negative difference**: expected account 1,100, observed 900, difference -200. If the observed 900 is already the balance used in owned-money calculations, subtracting 200 again yields a false 700. When the user later records the missing expense of 200, the difference may clear while the owned-money reference stays at 900, avoiding a second budget hit. Validate this invariant with real-engine tests before coding.
- **Unexplained positive difference**: expected 900, observed 1,100, difference +200. Account may show 1,100, but conservative spending capacity could exclude the uncertain +200 until classified. This requires a policy decision; no automatic income entry.
- **Transfer**: move 300 from checking to cash; eligible owned-money total stays constant if both accounts are included, and budget spent stays unchanged. Transfer to a savings account excluded from availability changes eligible liquidity without creating a purchase.
- **Negative checking**: checking -100 + cash 250 gives eligible net 150, not 250; decide whether a negative account balance should block all optional guidance. A credit-card available limit of 4,000 is not cash.
- **Income in 3 days**: the configured future income defines an end date for existing Coverage, but its amount cannot be added to today's funds. A weekly budget can extend beyond that horizon; don't divide one horizon's liquidity by another window's days without disclosure.
- **Repeated checks / late reconciliation**: a later observed balance supersedes an earlier observation as an anchor; no additive deduction of historical discrepancies. An explanation of an old check should not silently alter current budget guidance unless real account balances actually change; issue #2 must be settled first.
- **Period boundaries**: Monday–Sunday and anchored biweekly windows may have 1 day remaining; P2P may end on the day before income; monthly ends at calendar month end. Quarterly/annual and custom daily values are currently undefined in module 219; never invent them. At 0 days remaining show „Perioadă încheiată”, not division by zero. Onboarding start clips the period, and that clipping must be explicit.

## Premium UX / accessibility direction (no screens implemented)
- Budget card: original **Planificat** remains prominent. Secondary collapsible row „Ce susțin banii mei acum” shows a clearly *global* ceiling and its time horizon; don't reuse the label „Buget azi” for a different formula. Separate „Diferențe neexplicate” badge links to existing reconciliation; never present discrepancy as a confirmed expense.
- Show an exact calculation breakdown (eligible accounts, excluded savings/credit, reserved obligations, dates, spent/remaining, rounding). For absent balances, missing obligation dates, unresolved multiple checks, or no allocation contract, display **„Nu se poate calcula încă”** with reason, not 0 RON.
- Plain Romanian microcopy, no praise, blame, coaching or artificial urgency; avoid stacked three giant competing totals on iPhone. Keep dark/light contrast, keyboard focus, 44px targets and screen-reader names; verify in real iPhone browser when authorized.
- Distinguish *current owned liquidity*, *budgeted category headroom* and *safe pace* with persistent labels, not color alone. Selection must be reversible and preferably view-only until a persistence contract exists.

## External benchmark — principles only, not copying
- Actual Budget official: envelope budget based on money already held; on-budget transfers don't create spend; credit-card limits are not spendable owned funds. [Budgeting](https://actualbudget.org/docs/budgeting/), [Credit cards](https://actualbudget.org/docs/budgeting/credit-cards/), [Transfers](https://actualbudget.org/docs/transactions/transfers/).
- Monarch official (15 Apr 2026): optional Flex vs Category budgets, Fixed/Non-monthly/Flex grouping and preserved mode-specific settings. Principle: offer optional perspectives without erasing intent. [Flex budgeting](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting).
- Actual official distinguishes tracking/forecast from cash-based envelope budgeting. Principle: forecast and spendable money need different labels. [Tracking budget](https://actualbudget.org/docs/getting-started/tracking-budget/).
- **Anecdotal, not representative user research**: [YNAB credit-card confusion (2024)](https://www.reddit.com/r/ynab/comments/1ankfyu/) and [Actual reconciliation confusion (2026)](https://www.reddit.com/r/actualbudgeting/comments/1syur3a/im_really_frustrated/) show the importance of explicit meanings and visible transaction vs observation distinctions. Do not infer a universal preference from Reddit comments.

## Contract decisions required from user BEFORE implementation
1. Are optional perspectives **global cash references** only, or should each budget receive an allocation? If per-budget, how is shared liquidity allocated without double-counting?
2. Are savings accounts included when marked `available`, or should there be a distinct protected reserve; how are negative balances and overdrafts treated?
3. Which obligations are deducted (due before next income vs budget-period end), and how to avoid subtracting obligations already reflected in checked balances or budgeted transactions?
4. How to handle positive unexplained balances: include, exclude conservatively, or show an uncertainty range? Negative discrepancies must never be deducted twice.
5. Does „zile rămase” refer to each budget's period or the next-income Coverage horizon? What happens for annual/quarterly/custom windows with no existing daily value?
6. Should the reference be per category, global, or both; and is it informational only, never an automatic edit to configured budgets?
7. Resolve issue #2's historical income correction/void effect on later balance checks before guaranteeing stable retrospective references.

## Test plan after approval (not run)
Pure read-only selector tests on synthetic ledgers: credit-limit exclusion; negative cash; savings availability; inter-account transfer invariance; future income exclusion; repeated check without double subtraction; late explanation before/after equality; multi-check retroactive edit/void; same-day P2P, weekly, biweekly, month-end and 0-day cases; rounding in integer bani; sum of per-category allocations never exceeding global eligible cash; immutable state/no vault writes; DEMO-only synthetic tests; accessible light/dark and iPhone browser validation.

**Decision gate: BLOCKED — explicit user approval required.** Do not implement three modes, change formulas, or interpret this proposal as accepted. Independent non-semantic WEB bug audits may continue meanwhile.
