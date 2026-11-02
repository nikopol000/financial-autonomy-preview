# WEB #85 — C10 reduced-height More navigation research (2026-11-02)

**RESEARCH / TEST ONLY.** Base main `8b30820a8135a49c31376b825db3ce301b09e9d7`; WEB **18.72** unchanged. C9 showed 8/8 acceptance at 844px tall with 100%/200% CSS root zoom, but never tested the 422px height stress case. This memo defines the narrower acceptance boundary; do **not** infer a shipped fix from a green test runner.

## C10 design

Extend the existing disposable, populated-DEMO Chromium test `tests/browser-populated-budget-audit.cjs` to probe the **real** More navigation, the **real** DEMO warning/exit and all five original tabs at **320/390px × light/dark × 422px height × 100%/200% root CSS zoom**. The existing C8/C9 document-flow/fixed-safety-header CSS patch is applied temporarily, never committed to the product. Restore original viewport, zoom, DOM styles and return to the populated budget after each probe.

Measure natural Tab/Shift+Tab focus, `:focus-visible`, target center exposure, Playwright pointer trial **and real click**, full-rectangle viewport visibility of the DEMO warning and exit, and hit testing of the original warning, exit and target. Keep exact negative findings as `accepted:false` research results, never reinterpret test execution success as mobile accessibility. Assert the five original tabs and original DEMO safety controls remain present even when geometry fails; verify zero real encrypted-vault keys.

## Decision alternatives

- **A — keep C9/C8 document flow:** smallest conceptual change, but at 422px the fixed DEMO region can compete with the footer and menu; accept only if strict full-rectangle and pointer/focus checks pass.
- **B — dedicated adaptive full-screen More sheet:** separate safe fixed disclosure/exit and a genuinely scrollable destination region; requires focus trapping/return, viewport/keyboard-safe sizing and Safari verification before any production release.
- **C — compact/collapse the DEMO warning or exit:** **reject** if it hides the fictional-data disclosure or the escape action to make room.
- **D — scroll-only/bounded patch C3–C7:** already rejected by prior Chromium geometry; do not recycle as a production fix.

**First unfinished step:** run exact PR-head Chromium CI and inspect the named C10 result lines, including negative cases; document measured outcomes and compare A/B. Then test focus restoration on closing a *real* sheet, actual mobile browser zoom/touch, physical iPhone Safari/VoiceOver where available. No financial formulas, data, backup, origin migration, iOS, backend, accounts or telemetry changed.

**P1 risk remains:** #4/#29/#35 and five cached legacy-writer scenarios are known unsafe. #14/#25/#2 are financial-contract DISCOVERY only; no implementation without explicit approved expected values.
