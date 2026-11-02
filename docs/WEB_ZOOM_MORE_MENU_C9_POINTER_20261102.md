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

**VERIFIED on exact PR head `ecc39afadb1dacbc3b2547aedfd4676b333ddcd0`:** [Chromium #41433383310](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41433383310) SUCCESS and [Release #41433383314](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41433383314) SUCCESS. Inspected the Chromium job log: **8/8 C9 strict reversible candidate acceptances** (four light/dark/width combinations × 100%/200% root CSS zoom), each with `pointerActivated=true`, `enteredBudget=true`, natural forward/reverse focus, original DEMO warning and exit center hit-testable, five tabs. At 320px/200%, warning y=8..96, exit y=104..200, focused Bugete y=436..548. [PR #463](https://github.com/nikopol000/financial-autonomy-preview/pull/463) squash merged as `4fcb0634eb9665efdb68cdcb70920951ec4ca9d4`. Exact merged-main [Release #41433926427](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41433926427), [Pages #41433926396](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41433926396), [Pages build #41433923964](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41433923964) SUCCESS; merged-main Chromium #41433926356 pending when this checkpoint was written. Vercel production `dpl_5PXtRfAoK1jpLWs2oKJWGhDR5FgL` READY for exact squash SHA and primary alias. Served-browser/Safari/VoiceOver interaction remains unverified. A green workflow is **not** an iPhone accessibility certification.

## Remaining product work

C9 is not a production component, Safari/Dynamic Type, VoiceOver, WCAG conformance, or a reduced-height acceptance test. Next: test a dedicated adaptive More sheet at **422px height** and browser-level zoom/text enlargement, focus restoration after closing, actual touch and iPhone Safari/VoiceOver; then consider a versioned WEB change only if evidence is sufficient. The #4/#29/#35 P1 integrity defects and five legacy-writer unsafe scenarios remain open. #14/#25/#2 financial semantics require explicit approval. No iOS, formulas, ledger, vault, backup, backend, analytics or release metadata changed.
