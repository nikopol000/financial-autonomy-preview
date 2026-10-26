# Financial Autonomy WEB — premium UX evidence note (2026-10-26)

**Scope:** research only, not a new financial contract or implementation instruction. This is a small periodic benchmark alongside P1 vault work. It does not claim that Financial Autonomy was compared in a live side-by-side browser session. The third-party products have different architectures and are **not** templates for our financial model.

## Published product documentation

1. **Monarch Money — Understanding Your Budget** (help, last updated 2025-07-14): offers category vs flex budgeting; describes its budget as projected monthly income/cash-flow-based rather than account-balance-based. Source: https://help.monarchmoney.com/hc/en-us/articles/360048883631-Budget
2. **Monarch Money — Using Flex Budgeting** (help, last updated 2026-04-15): distinguishes fixed, non-monthly and flexible expenses; says users may switch budgeting styles, preserving most configured settings. Source: https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting
3. **YNAB — Give Your Priorities a Reset** (product update, 2026-09-16): previewing a change before saving, with an undo option, is a product-specific pattern for reversible *budget allocation*. It must **not** be confused with a reversible deletion of an encrypted local vault. Source: https://www.ynab.com/whats-new/give-your-priorities-a-reset

## Public user feedback (illustrative, NOT representative survey data)

- In a 2026-07-13 r/ynab discussion, some users describe extra taps and changed labels in frequent transaction entry as friction; comments also include different experiences. Source: https://www.reddit.com/r/ynab/comments/1uvq4ec/when_will_ynab_stop_needlessly_changing_the_ui/
- In a 2026-05-28 r/ynab discussion, several users object to basic fields being hidden behind expanders, while another commenter finds explicit payment-type choices useful. Source: https://www.reddit.com/r/ynab/comments/1tqkvbc/please_stop_changing_the_mobile_transaction/
- In a 2024-03-16 r/MonarchMoney discussion, users request budget progress bars because remaining amounts without original limits lack scale; other commenters value seeing remaining money more than percentage. Source: https://www.reddit.com/r/MonarchMoney/comments/1bgee4b

**Evidence quality:** product help pages describe intended behavior, not independent usability results. Reddit threads are self-selected anecdotes, not evidence of universal user preferences. No invented user personas, conversion metrics or accessibility claims.

## Principles applicable to Financial Autonomy

- **Preserve task muscle memory:** one-tap Cheltuială/Venit and stable navigation/terminology; do not add a mandatory coach-like home step. Measure tap count before and after any proposed UX change.
- **Progress needs scale and money:** a bar should retain an explicit limit, spent amount and remaining amount; color alone is insufficient. No new budget formulas or perspective modes under issue #14 without a signed-off financial contract.
- **Make optional complexity reversible:** expose advanced tracking without silently changing the primary budget. Distinguish forecast/plan from *owned money now* and borrowed available credit; do not import Monarch's income-projection semantics.
- **Financial data deletion is not a budget allocation reset:** issue #35 and reset issue #29 must fail closed and preserve ambiguous ciphertext; never promise an undo that cannot be guaranteed.
- **Accessibility evidence gate:** issue #85 Chromium CSS zoom is a proxy, not Safari Dynamic Type; validate real iPhone Safari, screen-reader labels, keyboard focus and hit targets separately before closure.

## Follow-up and boundaries

- **P1 first:** #35 encrypted first-write safety; PR #98 adds four actual-bundle post-reset fault tests, not recovery.
- **P2 research choice:** #85; compare populated mobile budget and frequent transaction entry, including tap counts, with real browser evidence when available.
- **#14 DISCOVERY only:** user approval required before financial semantic/formula changes.
- No app, iOS, backend, telemetry, banking, backup or real ledger change in this research note.
