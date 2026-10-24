# WEB Premium — documented benchmark, 2026-10-25

Scope: independent **product-principle research**, not a competitor UI reproduction, user-preference survey, browser acceptance, or authorization to change budget formulas. Current product remains WEB **18.44**. These sources describe other products and selected individual user comments; they do **not** establish preferences of Financial Autonomy users.

## Verified source observations

1. **YNAB — Plan Reset (2026-09-16)**: an optional planning reset previews reallocation of unspent funds, saves only after confirmation and offers undo. Relevant principle: preserve an intentional plan and make reallocation reversible; do not conflate editing a plan with observed account balances. Source: https://www.ynab.com/whats-new/give-your-priorities-a-reset
2. **YNAB — Plan Header (updated 2026-09-28)**: "Ready to Assign" is explicitly framed as unallocated money in cash-based accounts. Relevant principle: a spendable-cash indicator needs a named source and must not silently include credit limit. Source: https://support.ynab.com/en_us/the-plan-header-BkmiuJ_C9
3. **YNAB — Underfunded logic (updated 2026-07-02)**: automated funding considers targets, scheduled transactions, credit-card payment categories and overspending. Relevant principle: future commitments matter when describing liquidity; a category limit is not automatically spendable cash. Source: https://support.ynab.com/en_us/underfunded-a-guide-BJwPhQO09
4. **Monarch Money — rollover help (updated 2025-02-13)**: leftover amounts can carry forward for variable/seasonal spending. Relevant principle: planned window semantics need explicit carryover explanation; do not silently infer rollover or retroactively modify a user's original plan. Source: https://help.monarchmoney.com/hc/en-us/articles/4411119762196-Rollover-budget-feature

## Selected user feedback — anecdotal, not representative

- Monarch Flex Budget discussion (2025-01-24): a user struggled to reconcile a global flexible allowance, category remaining figures and rollover spending. Takeaway: avoid presenting a global available-money ceiling as separate independent category allowances. https://www.reddit.com/r/MonarchMoney/comments/1i99s2g
- Monarch Flex total discussion (2024-12-26): some commenters expected category edits to update the global budget total automatically. Takeaway: explain whether a displayed number is user-configured, calculated or merely advisory. https://www.reddit.com/r/MonarchMoney/comments/1hmnz1a
- YNAB credit-card discussion (2025-01-14): commenters were confused when cash overspending affected credit-card payment allocations. Takeaway: explain credit obligations separately from owned funds and never treat available credit as income. https://www.reddit.com/r/ynab/comments/1i1hpiy

## Applied research guidance (NO implementation authorization)

For [issue #14](https://github.com/nikopol000/financial-autonomy-preview/issues/14), keep the original **Planificat** budget and tracked category spending intact. Evaluate a separate **global** owned-money context with explicit eligible accounts, excluded credit, upcoming obligations, period end and uncertainty. A read-only daily reference may be meaningful, but do not show the same global ceiling as an allowance for every category; do not subtract an unexplained negative difference twice when observed balances already anchor owned money. Unexplained positive differences are not income.

For [issue #17](https://github.com/nikopol000/financial-autonomy-preview/issues/17), prefer direct labels, a short source explanation, and advanced calculation details behind disclosure. Avoid moralizing messages, motivational prompts or a coach persona. All mobile light/dark/accessibility recommendations remain hypotheses until an actual populated iPhone/browser session is checked.

## Outstanding financial-contract questions

- Which accounts and earmarked savings count as available for discretionary use?
- How are unpaid obligations and debt payments reserved without double counting?
- Which time horizon applies when next income is unknown or a period ends tomorrow?
- Should a single global affordability reference be shown first, without category allocation?
- What should the UI display when an observed balance is stale, negative or unexplained?

No new modes, financial formulas, category allocations, saved preferences or app code were changed by this research.
