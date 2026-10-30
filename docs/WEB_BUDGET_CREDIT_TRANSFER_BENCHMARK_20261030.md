# Budget perspectives #14 — credit-payment allocation benchmark (2026-10-30)

**DISCOVERY ONLY.** No new budget modes, financial formulas, transaction mutation, debt reserve or user preference is approved here. This is a documented comparison of accounting principles and examples, not an endorsement of competitor UI.

## Sources and evidence quality

- [Actual Budget — credit cards](https://actualbudget.org/docs/budgeting/credit-cards/) and [transfers](https://actualbudget.org/docs/transactions/transfers/): a transfer between tracked accounts is not a second spending-category expense.
- [YNAB — handling credit cards](https://support.ynab.com/en_us/handling-credit-cards-overview-ry7cNub1s) (2026 guidance) and [overspending](https://support.ynab.com/en_us/credit-card-overspending-an-overview-HkMGpSbJs): distinguish purchases already funded from old or unfunded debt, and handle positive card balances separately.
- [YNAB community discussion about duplicated card-payment imports](https://www.reddit.com/r/ynab/comments/1jl8wn0/) (March 2025): a single user's misclassified transfer produced two apparent payments; a concrete usability failure mode, **not** representative survey evidence.
- [Community discussion about double counting](https://www.reddit.com/r/ynab/comments/oqi411/) (July 2021): users explicitly ask whether card payments duplicate grocery spending; responses describe reallocating reserved cash rather than spending twice. Anecdotal, not an inferred global preference.

**Extracted design principle:** keep the transaction's *economic purpose* (food expense) separate from its *settlement mechanism* (card-to-checking transfer). Make the source of the displayed amount visible. Do not borrow competitor terminology or assume users want a particular budgeting philosophy.

## Numeric fixtures — examples, NOT approved formulas

| Scenario | Economic events | What must not happen |
| --- | --- | --- |
| Funded new card purchase | Checking 1,000 RON; 200 RON groceries on card; card liability 200 RON; hypothetical earmarked cash for card 200 RON. After paying card, checking 800 RON and liability 0; grocery category remains 200 RON spent. | Deduct 200 groceries **and** 200 payment again from the same 1,000 RON as two distinct expenses. |
| Existing card debt + new funded purchase | Old card debt 300 RON, new groceries 200 RON, card liability 500 RON; **only 200 RON** may be associated with the new funded purchase. | Infer that all 500 RON is already reserved; silently treat old debt as funded. |
| Positive card credit | Card debt 20 RON; checking 100 RON; payment 25 RON → checking 75 RON, signed card liability −5 RON. | Count +5 RON as cash in checking or available credit without a defined card-credit contract (#25). |
| Repeated balance checks | Same unexplained discrepancy −50 RON observed twice before any explanatory transactions. | Sum to −100 RON or invent an expense. A later reconciliation may explain the gap (#2). |
| Future income | Checking 100 RON, expected salary 1,000 RON tomorrow. | Show 1,100 RON as owned spendable cash **today**; future income belongs in a separate planning perspective. |

## Alternatives and recommendation pending approval

A. **Read-only comparison:** show original plan and a distinct observed-owned-cash reference, with labeled inputs and no ledger mutation. Smallest accounting surface but still requires a definition of reserved liabilities and account inclusion.

B. **Optional period-remaining reference:** calculate a hypothetical daily amount from the selected cash scope and obligations; requires explicit date-window, negative balance, reconciliation and unknown-difference rules. Do not auto-create spending or reset the original budget.

C. **Automatic payment envelopes:** convenient for some users, but introduces new reserve accounting and a double-counting risk across old debt, credit overpayment, transfer and reconciliation. Not recommended before a separately reviewed reserve contract.

**Provisional recommendation:** evaluate A before B, leave C out of scope. Present numbers as transparent references, not an imperative or coach. No automatic recommendation is safe without approval of numeric examples and exclusions.

## Contract questions still open

1. Which cash/savings accounts are included, and can users exclude restricted savings?
2. How is a reserved card payment represented when the card contains both old debt and new purchases? Can a transfer consume the reserve without double counting?
3. Does a positive card balance count only as issuer credit/receivable, never as checking cash? Coordinate with #25.
4. What is the baseline for an unexplained check, and how do repeated checks and later reconciliations affect it? Coordinate with #2.
5. For weekly, biweekly, monthly and paycheck-to-paycheck windows, are the current day and payment day inclusive, and what happens on the final day or when owned cash is negative?

**No implementation authorization.** Only a user-approved, testable financial contract with expected outputs for these fixtures can unlock #14.
