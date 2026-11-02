# WEB #85 — C9 actual pointer activation, 100%/200% CSS zoom (2026-11-02)

**RESEARCH / TEST ONLY — NOT A SHIPPED FIX.** Starting main `1364bfa5cc169dc69db10cf66012805cef1c7f28`; product WEB **18.72** unchanged. C7 document flow had a hidden DEMO warning at 320px (strict 2/4). C8 temporarily fixed the original warning and exit, yielding strict 4/4 Chromium keyboard/focus diagnostics, but only a **pointer trial**, not a real click.

## C9 hypothesis and test design

In `tests/browser-populated-budget-audit.cjs`, reuse C8's reversible document-flow patch and the **real** React warning, exit, Bugete row and five footer tabs. C9 differs from C8 by using `row.click()` to **actually activate** the destination; a trial click is still recorded separately and never counted as activation.

For each of four synthetic DEMO combinations (320/390px × light/dark), exercise C9 at **200% root CSS zoom** and **100% root CSS zoom**. Require all of the following in each C9 invocation:

- natural forward Tab to Bugete and reverse Shift+Tab out of the target;
- visible keyboard focus and an unobscured center hit test;
- pointer trial **and real pointer activation** reaching the populated budget;
- the original DEMO warning and original exit button both present and center-hit-testable **after** keyboard focus;
- exactly five existing navigation tabs; encrypted-vault localStorage keys remain absent.

The helper restores all injected CSS and inline styles. The test uses a disposable localhost Chromium context with memory-only DEMO budget; it never imports, exports, overwrites or reads real financial data.

## Evidence status

**PENDING exact-head Chromium and Release CI.** Do not report 8/8 C9 success before named logs and workflow conclusions are inspected. A green workflow alone is not an iPhone accessibility result. If a case fails, preserve its geometry/error and repair only the test or candidate with evidence; do not weaken the safety criteria.

## Remaining product work

C9 is not a production component, Safari/Dynamic Type, VoiceOver, WCAG conformance, or a reduced-height acceptance test. Next: test a dedicated adaptive More sheet at **422px height** and browser-level zoom/text enlargement, focus restoration after closing, actual touch and iPhone Safari/VoiceOver; then consider a versioned WEB change only if evidence is sufficient. The #4/#29/#35 P1 integrity defects and five legacy-writer unsafe scenarios remain open. #14/#25/#2 financial semantics require explicit approval. No iOS, formulas, ledger, vault, backup, backend, analytics or release metadata changed.
