# Financial Autonomy WEB — premium finance UX benchmark (2026-11-01)

**Research only; not a feature specification or permission to change accounting.** Public documentation and selected, self-reported community discussions were reviewed on 2026-11-01. No competitor app was installed or interactively tested; neither Reddit votes nor vendor copy are representative preference research. This review is about **principles**, not reproducing screens, branding, product architecture, or formulas.

## Primary product references

| Product | Documented approach | Transferable question for Financial Autonomy |
| --- | --- | --- |
| [YNAB — goal tracking](https://www.ynab.com/features/goal-tracking) | User-defined targets with dates, progress and optional snooze | Can a financial target remain understandable without mixing a planned amount with cash actually available? **Do not change #14 formulas without approved numeric outputs.** |
| [YNAB — Underfunded logic (2026-07-02)](https://support.ynab.com/en_us/underfunded-a-guide-BJwPhQO09) | Scheduled transactions, target dates, overspending and card-payment obligations have distinct prioritization rules; documentation warns about negative assignable amounts | Explain any future projected obligations separately from owned cash, with visible provenance and no silent transfer between concepts. |
| [Monarch — customizable dashboard](https://www.monarchmoney.com/customizable-dashboard-manual-transactions) | Reorder/hide dashboard sections, including mobile | Personalization must remain reversible, keyboard-accessible and persistent. This supports #400's test strategy, not copying its UI. |
| [Monarch — mobile navigation](https://www.monarchmoney.com/new-mobile-navigation) | Five primary mobile destinations and additional destinations in a separate menu | Five labels alone do not guarantee usability at enlarged text; measure visible focus, reachability and tap discoverability (#85). |

## Selected real-user feedback — qualitative signals, not a poll

1. [Monarch recurring complaints, 2026-08-11](https://www.reddit.com/r/MonarchMoney/comments/1vlnepu/will_recurring_ever_work/): participants describe same-merchant multiple subscriptions, variable amounts, inaccurate recurrence detection, and the inability to act on a calendar. Other commenters say recurring works adequately for them. **Principle:** detection is a proposal, not a verified obligation; allow correction/ignore and show exact transaction evidence.
2. [Monarch recurring opt-out discussion, 2026-07-24](https://www.reddit.com/r/MonarchMoney/comments/1v5eibr/can_recurring_just_be_turned_off/): some participants report unwanted prompts even when they do not use the feature. **Principle:** a subscription detector should be dismissible, with a genuine “Decide later” path and no nagging; no behavioral analytics needed.
3. [YNAB mobile transaction UI feedback, 2026-05-28](https://www.reddit.com/r/ynab/comments/1tqkvbc/please_stop_changing_the_mobile_transaction/): multiple commenters report added taps to enter/edit routine transactions, while some like clearer payment-type distinctions. **Principle:** measure common-entry action count and preserve direct paths while keeping debt/transfer semantics explicit.
4. [YNAB mobile change feedback, 2026-07-13](https://www.reddit.com/r/ynab/comments/1uvq4ec/when_will_ynab_stop_needlessly_changing_the_ui/): commenters report loss of muscle memory and inconsistent wording across interfaces. **Principle:** incremental copy/navigation changes need before/after regressions, not cosmetic churn.

## Original product recommendations and boundaries

- **Immediate / safe:** prioritize existing P1 #4/#29/#35 loss-prevention and blocked-state clarity before cosmetic expansion; preserve local-only encryption, fail-closed writes and byte-identical evidence in ambiguous states.
- **Next UX experiment / #85:** test candidate-owned selected-tab reveal after actual navigation and visible overflow affordance; a 200% Chromium CSS zoom proxy is not iOS Safari, VoiceOver or Dynamic Type. Keep all five destinations operable, warning/exit visible and last budget control reachable.
- **Recurring detection:** distinguish **observed recurring candidate**, **confirmed recurring obligation**, **dismissed/decide later**; never infer a due date or amount as fact from sparse history. Future implementation needs explicit data contract, no invented preferences, and local-only processing.
- **Transaction entry:** preserve direct Expense/Income entry and clear Transfer/Card-payment distinctions; count taps on populated 320/390 light/dark screens. Do not change accounting classifications from feedback alone.
- **#14 budget perspectives:** show planned limits, owned liquid money, reserved obligations and credit as distinct concepts; **research only** until the user explicitly approves numerical examples, source-account selection, debt treatment and rounding.
- **Originality:** no coach voice, nudges, user scoring, bank linking, cloud sync, telemetry or copied competitor layout. The app remains a neutral financial **tool**.

## Follow-up and evidence threshold

Review the above principles against the actual WEB 18.72 UI and current issue backlog. For any candidate, write a measurable acceptance case (data fixture, visible text, action count, focus/touch target, light/dark) before implementation. Community anecdotes do not authorize changing defaults or adding recurring obligations. Do not ship an untested accessibility experiment or a new financial mode.
