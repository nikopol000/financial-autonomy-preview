# Premium finance product benchmark — 2026-11-01

**Research / design principles only.** No product implementation, user preference inference, banking integration, cloud sync, analytics, AI coach or financial formula changes. Applies to Financial Autonomy WEB 18.67 and discovery issues #14/#25/#17/#85; P1 data integrity #4/#29/#35 takes precedence.

## Primary product documentation

| Product | Observed mechanism (source) | Principle for Financial Autonomy, not a copy |
| --- | --- | --- |
| [Actual Budget](https://actualbudget.org/docs/budgeting/credit-cards/) | Credit card balance is negative; spending is assigned to categories; card payments between on-budget accounts are transfers rather than new category spending. | Show **spending**, **debt** and **owned cash** as different quantities; don't count paying an already-recorded card purchase as new spending. Exact current Financial Autonomy behavior must be inspected before any formula change. |
| [Actual Budget transfers](https://actualbudget.org/docs/transactions/transfers/) | Linked transfer halves can have distinct clearing states/dates; both sides are visible. | Explanations should identify source and destination and distinguish a transfer from expense/income. Do not infer matching transactions automatically. |
| [YNAB credit card payments](https://support.ynab.com/en_us/credit-card-payments-a-guide-r1_506Q1j) | A payment moves value from checking to card account; a credit-card-payment category reserves money for repayment. | An optional explanation of funds committed to debt can improve clarity, but introducing reserve accounting is a **new financial contract** and is not authorized. |
| [YNAB positive credit balance](https://support.ynab.com/en_us/handling-credit-cards-overview-ry7cNub1s) | A card overpayment/credit balance receives special treatment distinct from ordinary debt. | #25 needs explicit positive issuer-credit semantics. It is not spendable checking cash or additional credit limit by default. |
| [Actual browser-only install warning](https://actualbudget.org/docs/actual-server-repo-move/) | Browser-only local storage without sync/automatic backups requires manual care and is not recommended by Actual for long-term use. | Local-only is a deliberate differentiator here, but reliable encrypted backup, safe recovery, understandable data location and non-destructive conflict behavior are **core product features**, not polish. Do not add a server to imitate Actual. |

## Real user feedback: directional, not a representative survey

- [YNAB mobile update discussion, 2026-06-04](https://www.reddit.com/r/ynab/comments/1tx1mpb/app_update_jun_3_2026/): commenters object to extra taps for amount direction/cleared status and ask about fortnightly targets. **Interpretation:** preserve low-friction quick entry, accessible controls and explicit weekly/biweekly/monthly options. This does not prove every user wants fewer controls or the same calendar semantics.
- [YNAB payment misclassification report, 2026-09-14](https://www.reddit.com/r/ynab/comments/1wg4yrq/purchases_being_labeled_as_credit_card_payments/): one report of purchases misclassified as card payments. **Interpretation:** avoid silent auto-classification or irreversibly committing inferred financial transactions. Anecdotal report, not a confirmed systemic defect.
- [Actual vs YNAB discussion, 2026-02-07](https://www.reddit.com/r/actualbudgeting/comments/1qyofje/anyone_go_back_to_ynab/): participants disagree on targets and UI; one wants goal indicators without automatic money moves. **Interpretation:** show planning and information without automatically reallocating funds; avoid claiming a universal preferred UX.
- [Actual community discussion, 2026-10-16](https://www.reddit.com/r/selfhosted/comments/1x7ucop/thoughts_on_actual_budget/): mixed feedback on ease of use, setup and privacy of financial integrations. **Interpretation:** clarity and privacy matter, but comments conflict and should not be presented as market-wide demand.

## Candidate UX principles and decision gates

1. **One action, one financial meaning:** distinguish expense, transfer, card payment, and observed balance check; show the affected accounts. Avoid coaching or moral judgment.
2. **No invisible arithmetic:** every optional budget perspective must name its inputs, exclusions, date window and unknown differences. The original plan stays untouched. **#14 remains DISCOVERY** until approved numeric examples and contract.
3. **Credit is not owned money:** do not blend available credit with cash or issuer overpayment credit. **#25 remains DISCOVERY**.
4. **Low-friction mobile:** prefer concise labels, predictable placement and keyboard/VoiceOver operability; #17/#85 require real populated Safari/iPhone verification, not only CSS zoom approximations.
5. **Data safety over visual novelty:** visible, reversible, non-destructive conflict and backup status; #4/#29/#35 need source freshness and recovery authority before any cutover.
6. **No preference fabrication:** the cited discussions are qualitative signals and not evidence of Financial Autonomy users' choices. Do not copy another app's UI, subscription model or bank sync.

## Next verifiable actions

- P1: synthetic legacy-writer post-inspection tests; no production cutover until explicit user approval.
- P2: validate existing manual transaction entry flow and screen-reader labels in actual populated mobile light/dark; collect first-party feedback when available.
- #14/#25: retain current formulas; write a contract with expected outputs for card overpayment, transfers, restricted savings and remaining-period budget before implementation.
