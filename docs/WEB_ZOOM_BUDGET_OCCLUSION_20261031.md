# WEB 18.66 — populated budget under 200% CSS zoom: actual occlusion (31 October 2026)

**Status: reproduced UX defect in a Chromium CSS-zoom stress proxy, NOT fixed in the product.** Issue [#85](https://github.com/nikopol000/financial-autonomy-preview/issues/85). No Safari, native browser zoom, iOS Dynamic Type, VoiceOver or WCAG conformance verdict is claimed.

## Exact evidence

- Baseline WEB 18.66, unchanged immutable bundle; synthetic memory-only demo budget of 2,000 RON created through the actual Bugete/Finanțe UI on a disposable localhost origin. Four combinations: 320 and 390 CSS-px viewport widths, light and dark. No real vault or portable backup accessed.
- Initial strict candidate [PR #373](https://github.com/nikopol000/financial-autonomy-preview/pull/373) / [Chromium #41242137483](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41242137483) **FAILED** at 320/light: after `scrollIntoViewIfNeeded()`, the last budget period detail had bounds top 692/bottom 804, center y=748, and `elementFromPoint` hit a different DIV. The first nav tab started at y=768, suggesting a larger fixed footer/background hit area than tab-button rectangles alone reveal. Scroll ancestor was at 1161/2114: do not call this permanently unreachable without manual-scroll verification.
- Revised test commit `351ce5caeda20da99fefcc17ff0017d5198d66e5` explicitly records zoomed detail and focused-control hit-test occlusion as **KNOWN UX LIMIT**, instead of calling it a success or relaxing normal-size assertions. [Chromium #41242388815](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41242388815) SUCCESS, with named logs: **4 occluded targets at 320/light, 4 at 320/dark, 3 at 390/light, 3 at 390/dark**. The existing four populated-budget audits still pass for their *enforced* checks, including navigation labels/targets and strict normal/half-width reachability. [Release #41242388732](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41242388732) SUCCESS. Merged as [PR #373](https://github.com/nikopol000/financial-autonomy-preview/pull/373), squash `bb270c9f0803025fec7023544904263809f9bc9f`.
- **Merged-main independent checks** for squash `bb270c9f`: [Chromium #41242635311](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41242635311), [Release #41242635352](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41242635352), [Pages #41242635381](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41242635381) and Pages build #41242634742 all **SUCCESS**. Vercel production [deployment `dpl_HoeJJzj4RyBxMBr5zMN1VHvZyi3R`](https://vercel.com/test11-966a/financial-autonomy-preview/HoeJJzj4RyBxMBr5zMN1VHvZyi3R) is **READY** for the exact squash SHA and includes primary alias `financial-autonomy-preview.vercel.app`. No served interactive Safari verification.
- Artifact: [browser-populated-budget-audit](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41242388815) (screenshots and `audit.json`, retention limited). Geometry is diagnostic; it is not a claim that the footer itself is the exact hit-test blocker until its bounding rectangle is measured.

## Interpretation

A horizontal-overflow check and non-overlapping tab labels **cannot prove content is unobscured**. A browser can scroll a budget row into the viewport while a fixed navigation surface covers its center. The same risk may affect focused budget controls, especially with enlarged content. The new test keeps the failure visible as data; its green CI does **not** certify 200% zoom accessibility or close #85.

## Alternatives for a WEB-only incremental fix (not yet implemented)

1. **Preferred first experiment:** measure the *actual footer container* and content scroll viewport, then provide sufficient responsive scroll clearance / scroll-padding and focused-control scroll-margin so keyboard focus and `scrollIntoViewIfNeeded()` expose the complete target above the footer. Validate actual computed geometry, not an arbitrary 320px hardcoded offset. Verify the last content row, last interactive control and the demo warning remain reachable. Risk: React Native Web nested scroll views and CSS zoom may not honor all scroll-padding properties; test rather than assume.
2. **Responsive footer height / wrapping refinement:** reduce excessive fixed footer footprint without shrinking hit targets, removing any of the five destinations, hiding labels or compromising keyboard focus. Risk: can degrade touch targets and 320px layouts; prefer only if measured footer geometry requires it.
3. **Fallback scroll-to-focus logic:** explicitly scroll the active inner scroll container above the measured footer after focus. Risk: additional imperative behavior and focus-jump regressions; reserve for cases CSS alone cannot solve.

Do **not** hide navigation, suppress zoom, shrink fonts, or mark this as a Safari fix. Any product change requires a **new immutable WEB bundle**, synchronized HTML/version/build/diagnostic, exact-diff regression, CI, Vercel and served-browser verification per RELEASE_PROCESS.md. No accounting, vault, backup or iOS change.

## Acceptance before closing #85

- Repeat 320/390 light/dark with populated synthetic budget, normal layout, 200% CSS-zoom proxy and half-width; zero occluded budget detail and interactive targets after auto-scroll and keyboard focus, not just zero nav-label overlap. Confirm five tabs remain distinct, operable, accessibly named, with visible focus and non-overlapping hit targets.
- Verify a real browser's native zoom and text-only enlargement; where available test Safari iPhone Dynamic Type/VoiceOver, safe areas and keyboard. A Chromium root `style.zoom` proxy alone cannot establish conformance.
- Preserve demo-only warning and exit; verify no encrypted vault writes; run full release and relevant browser regressions.

## Accessibility sources and evidence limits

- [W3C WCAG 2.2 Understanding Resize Text (1.4.4)](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): content and controls should not become obscured when text is enlarged.
- [W3C WCAG 2.2 Understanding Reflow (1.4.10)](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): maintain access to content/functionality at narrow effective viewport widths.
- These standards inform acceptance; no compliance claim follows from this Chromium test.

## Critical P1 remains separate

#4/#29/#35 are still OPEN: a cached, noncooperating v1 writer can mutate legacy localStorage after the final modern read-only check. Neither this UI test nor green CI authorizes reset, restore, auto-delete, replay, rekey, migration or legacy overwrite. The first unfinished P1 remains a separately reviewed operation-specific crash-safe authority and a credible old-writer isolation/cutover policy; see existing research. #14 budget perspectives remain analysis-only until explicit numeric financial contract approval.
