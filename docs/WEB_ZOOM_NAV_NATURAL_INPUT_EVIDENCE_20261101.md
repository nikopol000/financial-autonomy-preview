# WEB #85 — natural Chromium keyboard and touch navigation probe (2026-11-01)

**Status: DISCOVERY / NOT SHIPPED.** Active product remains WEB 18.72. This is a reversible CSS-only experiment on a disposable, populated memory-only DEMO page. No user data, encrypted vault, backup, financial formulas, iOS or released stylesheet were changed.

## Reproduction and evidence

- [PR #420](https://github.com/nikopol000/financial-autonomy-preview/pull/420) merged as `ff3a321f7a2d1662d65a27534f3c249b3794135c`, adding `naturalZoomNavInput` to the existing `tests/browser-populated-budget-audit.cjs`.
- [PR-head Chromium #41319649852](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41319649852) **SUCCESS** (the whole test suite, including four populated-budget cases). [PR-head Release #41319649763](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41319649763) **SUCCESS**.
- Test inserts the previous experimental one-row horizontal-scroll CSS under root `zoom:200%`, focuses **Acasă** as a known starting point, then sends four **natural keyboard Tab presses** without `scrollIntoViewIfNeeded`. It records each focused destination, `:focus-visible`, actual center hit-testing and scroll position. It then resets the experimental strip's scroll offset and sends a Chromium DevTools `Input.dispatchTouchEvent` swipe. Finally it asserts all three encrypted-vault localStorage keys remain absent. Injected CSS is removed. Logs: `NATURAL ZOOM NAV INPUT #85`; screenshots: `zoom-nav-natural-*.png` in the populated-budget artifact.
- **Important:** a green CI means the experiment completed and did not mutate the vault; it does **not** mean the navigation candidate passed accessibility acceptance.

## Actual observed outcomes

| Viewport and theme | Natural Tab order | Focused tab centers hit-test exposed | Strip scroll positions after each Tab | Chromium synthetic swipe |
| --- | --- | --- | --- | --- |
| 320 light | All 5 correct, focus-visible | Acasă yes; **Finanțe no**; Adaugă yes; **Istoric no**; Mai mult yes | 0, 0, 236, 236, 472 | `scrollLeft` 0 → **177** |
| 320 dark | Same | Same | 0, 0, 236, 236, 472 | 0 → **177** |
| 390 light | All 5 correct, focus-visible | Acasă yes; Finanțe yes; Adaugă yes; **Istoric no**; Mai mult yes | 0, 0, 218.5, 218.5, 437 | 0 → **247.5** |
| 390 dark | Same | Same | 0, 0, 218.5, 218.5, 437 | 0 → **247.5** |

Measured strip `scrollWidth=632` with `clientWidth=160` at 320 and `clientWidth=195` at 390, under root CSS zoom. Parent touch-action computed as `auto`. The DevTools-generated touch gesture scrolls the candidate in Chromium, but that does **not** establish that the scroll affordance is discoverable, the exact destination is reachable with a physical finger, or VoiceOver announces off-screen destinations correctly.

**Finding:** the horizontal-scroll candidate has a real keyboard exposure defect under this stress: focused Finanțe/Istoric centers can remain outside the hit-test-visible strip even while `:focus-visible` is true. The earlier explicit `scrollIntoViewIfNeeded` probe concealed this gap. **Do not ship candidate C as tested.**

## Alternatives and next experiment

1. **Keep the current WEB 18.72 product unchanged.** The disposable B candidate already created three rows and extended below the viewport; C now has a natural-keyboard exposure defect. Neither has passed the native mobile acceptance gate.
2. Research a *reversible* C2 experiment with a focus-following scroll rule, visible overflow cue and a smaller, safe-area-aware strip. Do not introduce new persisted preferences or obscure any of the five destinations. Test natural Tab and Shift+Tab, selection with Enter, tap and swipe, DEMO warning/exit, last budget control, 100% layout and 200% proxy. A programmatic `scrollIntoViewIfNeeded` in the **test** must not count as proof.
3. Independently validate in physical iPhone Safari/VoiceOver and real browser text enlargement. Chromium CSS zoom and CDP touch events are proxies, not WCAG certification or native Safari results.

## Cross-priority gates

P1 encrypted ledger integrity #4/#29/#35 remains open; no migration, reset, merge, rekey, destructive recovery or claim of newest authoritative origin. [#14 source-grounded decision matrix](WEB_BUDGET_14_CURRENT_MODEL_CONTRACT_20261101.md) is analysis-only, pending explicit numeric financial approval. No product version bump for either research PR.
