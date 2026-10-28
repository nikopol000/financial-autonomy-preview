# WEB premium UX benchmark — budget clarity, cash truth and low-friction return (2026-10-28)

**Scope:** desk research only, not a product release, usability study, Safari test or endorsement of another app. Sources inspected on 2026-10-28; individual Reddit comments are anecdotes, not representative survey data. All examples are synthetic. WEB 18.61 and issue #14 financial semantics remain **unchanged / unapproved**. No real financial data, encrypted backup or iOS access.

## Observed product approaches (distinguish official design from community opinion)

| Product and evidence | Verifiable approach | Principle to evaluate, not copy |
| --- | --- | --- |
| [Actual Budget — Tracking Budget](https://actualbudget.org/docs/getting-started/tracking-budget/) and [Envelope Budgeting](https://actualbudget.org/docs/budgeting/) | Two explicitly different models: forecast income/expenses versus allocation of money already held. Tracking labels actual versus budgeted; envelope only allocates existing money. | A planned amount and a cash-funded amount are **different claims**. Label their source and period, never silently turn one into the other. |
| [Monarch — Flex Budgeting](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting) and [Budget overview](https://help.monarchmoney.com/hc/en-us/articles/360048883631-Budget) | Separates fixed, non-monthly and flexible expenses; supports category or flex budgeting, both within a monthly cash-flow planning framework. | Put the decision-relevant number first; make recurring versus irregular obligations comprehensible without exposing internal taxonomy. This does **not** imply that forecast income is owned cash. |
| [Actual — Balance Forecast](https://actualbudget.org/docs/experimental/balance-forecast-report/) | Experimental projected balances use posted and scheduled transactions; documentation explicitly warns that forecasts depend on schedules and assumptions. | Mark projections and uncertainty; do not present them as verified current balances or category spending permissions. |
| [YNAB — Plan Reset announcement, 2026-09-16](https://www.reddit.com/r/ynab/comments/1wi7ef1/introducing_the_plan_reset/) | A product announcement describes exploring reassignment without saving until confirmation, with an undo path. | Reversible exploration is valuable; **view switching** in Financial Autonomy should be non-mutating. The YNAB announcement is not an independent quality assessment. |

## Concrete user feedback, not inferred preferences

- [Monarch community, 2024-08-20](https://www.reddit.com/r/MonarchMoney/comments/1ex6mk8): one user reports confusing budget/actual/remaining ordering and excessive numbers. **Hypothesis to test:** emphasize *remaining and its provenance*, keep detailed arithmetic behind disclosure; do not assume every user prefers the same order.
- [Monarch community, 2026-03-02](https://www.reddit.com/r/MonarchMoney/comments/1rj00dy/can_anyone_make_sense_of_the_budget_feature/): a thread describes difficulty expressing annual expenses inside monthly budgeting and dissatisfaction with forecasts. **Hypothesis:** show the actual window and next occurrence rather than forcing annual obligations into an apparently monthly amount.
- [Monarch community, 2026-08-14](https://www.reddit.com/r/MonarchMoney/comments/1vohjqo/cash_flow_reports_monarch_is_officially_losing/): users criticize a report whose headline totals allegedly do not follow the selected date range and whose drill-down is cumbersome. **Testable principle:** every headline amount must clearly match the active window/filter; drill-down should reconcile to it. This is a user report, not independently verified software behavior.
- [Budgeting discussion, 2026-07-04](https://www.reddit.com/r/YNABAlternatives/comments/1umwdil/i_thought_i_was_just_bad_at_budgeting_but_maybe/): a user describes one missed manual transaction cascading into avoidance of the app. **Hypothesis:** support a low-friction return with an observed balance and an explicitly *unexplained* difference, without manufacturing past transactions. Anecdote, not population evidence.
- [YNAB discussion, 2026-04-23](https://www.reddit.com/r/ynab/comments/1sto6s3/anyone_use_multiple_plans/): one user reports feeling overwhelmed by many accounts/categories. **Hypothesis:** progressive disclosure and optional detail are preferable to a dense mandatory setup; not evidence that multiple plans are needed.

## Implications for Financial Autonomy, grounded in the current WEB 18.61 model

The existing [#14 financial audit](WEB_BUDGET_PERSPECTIVES_DISCOVERY_20261028.md) shows that a category's **plan** is based on its own window and recorded category spending, while cash coverage uses selected owned accounts and a **different** horizon (next income/obligations). An unexplained balance check is an observation, not a categorized expense. Mixing these into a single unlabeled number would be misleading.

**Safe, independently implementable UX candidates after an actual screen audit (no formula change):**

1. Shorten introductory copy in populated Bugete/Finanțe; emphasize `Planificat`, `Cheltuit înregistrat`, `Rămas din plan`, and the explicit budget window. Ensure 320/390 CSS px light/dark and keyboard focus remain usable. This is copy/layout only, not a cash-perspective implementation.
2. Add a visible, nonjudgmental `Ultima verificare: [date]` and `Diferență neexplicată` *only where those values already exist and can be displayed without new computation*. Avoid implying transactions are complete. Check accessibility and privacy masking before any implementation.
3. Make optional calculation details accessible with a descriptive control (e.g. `Vezi calculul`), preserving exact inputs, date window and account inclusion. The 2026-10-22 [visual review](WEB_VISUAL_REVIEW.md) reported a small/low-contrast disclosure in older v18.21; this requires remeasurement in active 18.61 before modifying code.

**Not authorized:** a three-mode budget selector, adjusted per-category allowance, proportional allocation of aggregate cash, any changed rounding/period/credit/obligation semantics, automatic retroactive transaction generation, new bank connection or telemetry. #14 remains DISCOVERY until explicit approval of a numeric contract.

## Non-mutating mock example (NOT a proposed formula)

Hypothetical food plan 1,500 RON; recorded food spending 600; nominal planned remainder 900. Separately, checking 900 and known bills 700; savings excluded; unused credit 3,000. A user must **not** be told that either 900 (plan remainder) or 200 (aggregate illustrative cash after bills) is a verified food spending allowance. Two other categories may compete for the same 200, and unrecorded expenses may exist. Display sources and windows, or mark the cash view unavailable until semantics are approved.

## Acceptance / next actions

- Inspect the **current** WEB 18.61 rendered screen with synthetic populated data, not just old screenshots; record first-glance hierarchy, empty states, focus/contrast and actual available disclosure targets. Compare light/dark, 320/390 px, 200% text; Safari/VoiceOver need separate verification.
- Before any copy-only candidate, capture exact current text and assert that numbers, labels and click targets remain consistent after the change. Use immutable bundle, version/diagnostic sync, Release CI, Chromium, Vercel exact artifact and served-browser verification.
- For #14, ask for an explicit approved contract for account inclusion, reserved obligations, reconciliation freshness, negative balances, horizons and multi-category allocation. The [nine numerical scenarios](WEB_BUDGET_PERSPECTIVES_DISCOVERY_20261028.md) remain the acceptance baseline; research does not authorize implementation.
- Review new user feedback periodically, record source/date and contradictory reports; never describe anecdotes as general user preferences.

**Decision:** retain the current planned budget engine. Prioritize clear, reversible, source-labeled displays and the ability to return after missing entries; keep budget perspectives at the analysis gate. No code, formulas, vault format, real data or iOS changed by this document.
