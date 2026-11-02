# WEB #85 — C11 adaptive More sheet feasibility (2026-11-02)

**Research-only, not a product release.** Base `main` `6539ae145e7b2bc65bb370e651afe90720b3fad9`; active product WEB 18.72. C10 proved the fixed-header document-flow candidate unsafe at 422px/200% CSS zoom (4/8 strict acceptance overall, **0/4** at 200%). C11 tests a structurally different **isolated semantic HTML prototype**, not the shipped React Native Web component. No production JS, CSS, financial model, ledger, encrypted vault, backup, origin, iOS, server or analytics changes.

## Hypothesis

When the More sheet opens, the persistent bottom tab bar should **not** compete with the complete DEMO disclosure and exit. The sheet instead uses one full viewport: a non-scrolling safety region containing a close button, the complete fictional-data notice and the real-world equivalent of the exit action; a separate flex child with `min-height:0` and `overflow-y:auto` holds five destinations. Only the destination region scrolls. Focus is moved to close, trapped in the sheet, wraps forward/backward, and returns to the invoking More control on Escape/close. The prototype is intentionally *not wired to actual app state*.

## Test and acceptance contract

`tests/browser-web85-adaptive-sheet-feasibility-research.cjs` runs Chromium in 16 combinations: 320/390 CSS px × 422/844 px height × light/dark × normal/200% root **font size**. This is a text-enlargement stress proxy, **not actual Safari browser zoom or iOS Dynamic Type**. Check: five destination buttons, dialog semantics, keyboard focus entry/wrap/return, actual pointer click on Bugete, complete warning and exit fully inside viewport and center hit-testable, nonzero destination scroll viewport, zero localStorage writes. A failed strict geometric case must be reported as a **negative research result**; CI may still succeed if its negative results are faithfully recorded. The normal-size 8 cases are an asserted baseline. Store exact per-case geometry and screenshots in the CI artifact.

## Design alternatives

- **A. Adaptive full-viewport sheet (tested):** keeps the warning and exit in a dedicated safety region; scrolling only for destinations. Requires proof that at least one 44px destination remains usable at 422px/200% font size.
- **B. Keep the bottom tab bar visible while More is open:** reject if it leaves less than a reachable destination row or occludes safety controls; C10 already demonstrates collisions in the previous layout.
- **C. Collapse/hide disclosure or exit:** reject; DEMO must not masquerade as real financial data.
- **D. Whole-document scrolling with a fixed safety header:** reject as previously measured at reduced height; focus/exit collision.

## Gates before a product change

1. Inspect exact PR-head Chromium **case logs and artifact**, including negative cases; do not claim acceptance from a green workflow.
2. Test the winning layout **against the real app's DOM and actions**, not this prototype: all five destinations, actual DEMO exit, real focus restoration, pointer and keyboard, 320/390 × 422/844, light/dark, text enlargement, zoom and onscreen keyboard.
3. Test Safari/VoiceOver and browser zoom on a real iPhone where available; record limitations otherwise.
4. If the real app passes, create a new immutable WEB bundle and synchronize metadata/diagnostic; follow RELEASE_PROCESS.md and verify the exact served artifact. Do not ship the isolated prototype.

## Open safety debt

P1 #4/#29/#35 remain open, including five cached legacy-writer cases known unsafe. #14 budget perspectives, #25 card overpayment and #2 retroactive reconciliation are approval-gated financial-contract DISCOVERY. No new financial semantics are authorized by this work.

**Status:** C11 test and CI integration proposed; exact-run results must be appended only after they are observed.
## Exact PR-head evidence (2026-11-02)

[PR #467](https://github.com/nikopol000/financial-autonomy-preview/pull/467) squash-merged as `fabd31d9d07a8a586886a8eeec2845b04a94a218`. Exact final PR head `d1593a88c6be09725485884c660cb0346bef2dd7`: [Chromium #41450973487](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41450973487) **SUCCESS**, [Release #41450973414](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41450973414) **SUCCESS**. Inspected all **16 named C11 logs**, not only the workflow status. **16/16 accepted in the isolated semantic prototype**: full warning/exit hit-testable, exit actually clicked, Bugete actually clicked, five destinations, keyboard focus wrap and Escape return, zero storage writes. At 320×422 and 200% root font size the destination scroll region remained **114.90625px** tall; at 390×422/200% it remained **147.546875px**. At normal text size/422px it was **256px**. All eight enlarged-text cases passed, in both themes. Screenshots and JSON were retained by the Chromium workflow.

**Harness correction:** earlier PR runs failed on a `SecurityError` reading localStorage on the opaque `about:blank` prototype document, *before* any geometry outcome. The final test explicitly treats denied localStorage reads as unavailable, not as an app vault failure; no storage write calls exist in the prototype. This is a test-only correction. **Do not interpret 16/16 as a fix to the actual WEB More menu**: C10's 422px/200% collision remains a real observed limitation. The C11 HTML is not the React Native Web DOM and does not prove real app integration, Safari/VoiceOver, actual browser zoom or WCAG compliance.

**First unfinished step:** verify merged-main Release/Chromium/Pages and exact artifact; then prototype the structural layout against actual WEB DOM with original DEMO safety controls and real navigation. Only a successful real-app acceptance matrix can justify a new immutable WEB version. P1 #4/#29/#35 remain open; #14/#25/#2 financial contracts unchanged.
