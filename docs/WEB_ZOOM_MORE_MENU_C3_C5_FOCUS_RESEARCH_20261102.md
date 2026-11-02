# WEB #85 — C3/C4/C5 keyboard focus exposure research (2 November 2026)

**DISCOVERY ONLY. NO SHIPPED FIX.** Product remains WEB **18.72**. Test source: `tests/browser-populated-budget-audit.cjs`; disposable populated DEMO in real Chromium, viewport **320/390 CSS px**, light/dark, root CSS zoom **200%**. This is **not** Safari, native iOS Dynamic Type, or a real browser-zoom conformance test. No real vault keys, financial data, backup, formulas, iOS or application JS/HTML were changed.

## Evidence and outcomes

[PR #445](https://github.com/nikopol000/financial-autonomy-preview/pull/445) tried three successive **reversible, test-only** variants on the same flow-menu `min-height:120px; overflow-y:auto; flex-shrink:0` candidate. The final merged test is C5; earlier C3/C4 results are preserved in their exact-head CI logs. Every run completed Release and Chromium workflows successfully; this means the **diagnostic ran**, not that the accessibility problem was solved.

| Candidate | Disposable intervention | 320 light | 320 dark | 390 light | 390 dark | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Prior 120px flow baseline | No focus correction | **OCCLUDED** | **OCCLUDED** | exposed | exposed | [PR #432](https://github.com/nikopol000/financial-autonomy-preview/pull/432), [Chromium #41345251570](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41345251570) |
| C3 | `focusin` scroll correction | **OCCLUDED** | **OCCLUDED** | **OCCLUDED** | **OCCLUDED** | [Chromium #41370692367](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41370692367) |
| C4 | `padding-bottom:64px; scroll-padding-bottom:48px` | exposed | **OCCLUDED** | exposed | exposed | [Chromium #41371015289](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41371015289) |
| C5 (merged test) | `padding-bottom:96px; scroll-padding-bottom:64px` | **OCCLUDED** | exposed | exposed | exposed | [Chromium #41371381187](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41371381187) |

For C3, C4 and C5, natural **Tab reached Bugete and Enter activated it 4/4**, and `:focus-visible` was true in each focused target. The **center hit-test** nevertheless failed as shown. C3 even regressed the previously exposed 390px targets. C4 and C5 traded which 320px theme failed; simply increasing scroll runway is not a reliable fix. Logs report C5 `scrollTop` 207.5 at 320 light (occluded), 179.5 at 320 dark (exposed), and 161.5 at 390 light/dark (exposed). These values are diagnostic, not a CSS sizing contract.

**Important accessibility interpretation:** our `document.elementFromPoint` center-exposure assertion is a **stronger test proxy**, not an automatic WCAG compliance verdict. WCAG 2.2 [SC 2.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) prohibits **entire** obscuring of a focused control by author content, while [SC 2.4.12 AAA](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html) is stricter. Partial obscuring may satisfy AA but still be poor UX. A screenshot and full bounding-box/occlusion measurement are needed before any standards claim.

## Decision

**Reject C3 and do not ship C4/C5 as accessibility fixes.** Focus-following and padding-only variants have no reliable 4/4 exposure. Keep the proven 120px flow-menu **pointer** benefit from prior experiments separate from keyboard acceptance. The fixed overlay variant remains rejected because it hides the DEMO exit. This research does not solve other zoom-occluded budget controls reported by the audit.

## Exact next experiment

1. Inspect saved synthetic screenshots/DOM geometry from the latest Chromium artifact; measure focused row rectangle, actual footer boundary, available scroll range and hit-test obstruction for both 320px themes **at focus time**, not only scrollTop.
2. Test a **structural** menu/shell layout that reserves a real, bounded vertical region above the fixed navigation and leaves DEMO warning and exit hit-test accessible. Prefer stable layout over imperative focus scrolling.
3. Require natural pointer click **and** natural Tab/Shift+Tab/Enter, target exposure, no obscured DEMO exit, and no vault keys across 320/390 light/dark at normal and 200% stress zoom; add a strict regression assertion only after a reproducible positive result.
4. Separately validate true browser zoom, physical iPhone Safari/VoiceOver and keyboard/scroll behavior before calling a product release accessible.

**P1 remains first:** #4/#29/#35 cached legacy writes, partial reset and KEY-only provenance remain unresolved. #14 financial perspectives are DISCOVERY/approval-gated. No origin migration, recovery, automatic merge, formulas or encrypted backup change is authorized here.
