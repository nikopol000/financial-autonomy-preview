# WEB #85 — More-menu vertical layout candidates and natural activation (2026-11-01)

**DISCOVERY / TEST ONLY.** The active immutable WEB **18.72** HTML, JS, diagnostic, financial model and encrypted vault are unchanged. All measurements use the actual populated **synthetic DEMO** in Chromium at 320/390 CSS px, light/dark, with `document.documentElement.style.zoom='200%'`. This is a stress proxy, **not** Safari, iOS Dynamic Type, browser zoom or VoiceOver certification.

## Exact evidence

- [PR #430](https://github.com/nikopol000/financial-autonomy-preview/pull/430), squash merge `a2b62a74bce64d7d875b658092dac79a66d5dca3`.
- Initial diagnostic [Release #41340210866](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41340210866) and [Chromium #41340210799](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41340210799): **SUCCESS**.
- Natural activation follow-up [Release #41340589880](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41340589880) and [Chromium #41340589866](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41340589866): **SUCCESS**. The Chromium job logs contain four `MORE MENU FLOW NATURAL ACTIVATION #85` records with `passed:true`, plus `PASS 4/4 populated budget demo UI audit`.
- Previous baseline geometry: [WEB_ZOOM_MORE_MENU_POINTER_GEOMETRY_20261101.md](WEB_ZOOM_MORE_MENU_POINTER_GEOMETRY_20261101.md).

## Measured comparison

| 200% CSS zoom | Baseline menu clientHeight / pointer | Reversible flow-min-height | Reversible fixed-panel |
| --- | --- | --- | --- |
| 320 light | 0 px / BLOCKED | 120 px / pointer trial + real click PASS | 120 px / pointer trial PASS; DEMO exit **occluded** |
| 320 dark | 0 px / BLOCKED | 120 px / pointer trial + real click PASS | 120 px / pointer trial PASS; DEMO exit **occluded** |
| 390 light | 65 px / ACTIONABLE | 120 px / pointer trial + real click PASS | 166 px / pointer trial PASS; DEMO exit **occluded** |
| 390 dark | 65 px / ACTIONABLE | 120 px / pointer trial + real click PASS | 166 px / pointer trial PASS; DEMO exit **occluded** |

The `flow-min-height` candidate sets **only on the disposable scrollable menu ancestor**: `overflow-y:auto`, `min-height:120px`, `flex-shrink:0`, each with `!important`. It restores the original inline style after the probe. With this candidate, the actual Playwright pointer click on the visible **Bugete** row navigates to the populated budget screen in **all four** cases; it is **not** a DOM `element.click()` shortcut. The DEMO warning and **Ieși din demo** remain present and center-hit-test exposed in all four. No KEY/PAYLOAD/RESET vault entries are created.

The `fixed-panel` alternative moves the menu to a high-z-index fixed panel. Although the Bugete pointer trial becomes actionable, the DEMO exit center is covered in **all four** cases. **Reject this alternative**; making one control clickable while hiding a safety/exit control is not acceptable.

## Decision, limits and next work

1. **Do not ship yet.** The flow candidate is the first geometry alternative with both natural pointer activation and exposed DEMO exit under this Chromium stress proxy, but its keyboard menu-item activation, long-list scroll behavior, focus ring, selected-state feedback, and 100% layout have not been acceptance-tested in this experiment.
2. Next run: extend the same disposable test with natural keyboard activation of Bugete, 100% and real browser zoom, and regression checks for DEMO warning/exit and budget controls. Assess the C2 horizontal navigation separately; a positive menu result does not make C2 production-ready.
3. Obtain physical Safari iPhone, Dynamic Type and VoiceOver evidence before any accessibility completion claim. If a product CSS change is warranted, use a **new immutable WEB bundle**, synchronized metadata/diagnostic, exact-diff guard, CI, Vercel exact-SHA and independent served-browser checks.
4. P1 encrypted-data issues **#4, #29 and #35** remain open. This research does not change vault reset, key provenance, migration, backup or stale-tab behavior. **#14** remains DISCOVERY pending an explicitly approved numeric financial contract. No iOS edits.

**Status:** researched and test-proven in disposable Chromium; **not a shipped fix**, not a Safari acceptance and not a financial-semantic change.
