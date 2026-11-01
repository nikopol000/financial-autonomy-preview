# WEB #85 — focus-following C2 candidate: natural keyboard evidence (2026-11-01)

**DISCOVERY ONLY — NOT SHIPPED.** The product remains **WEB 18.72**. This experiment runs in disposable Chromium DEMO memory with CSS root zoom 200%; it does not modify released navigation CSS, financial data, formulas, encrypted storage, backup, iOS or server architecture.

## Reproducible implementation and verification

- [PR #423](https://github.com/nikopol000/financial-autonomy-preview/pull/423), squash merge `c5b7cd00cf9b3dc648d87c85ba0d849216230aff`, adds a **test-only** `focusFollowingZoomNavInput` to `tests/browser-populated-budget-audit.cjs`.
- [Release CI #41324084461](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41324084461) **SUCCESS**; [Chromium #41324084434](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41324084434) **SUCCESS**, including the four 320/390 light/dark populated DEMO cases.
- The previous candidate C used an ordinary horizontally scrollable strip with snap; natural Tab order was correct but focused tab centers were sometimes outside the hit-test-visible strip. Candidate **C2** adds a reversible `focusin` listener to the real tab parent. It centers each focused tab by updating the strip's own `scrollLeft`, compensating for CSS zoom, and disables scroll snapping during the probe. **The test does not call Playwright `scrollIntoViewIfNeeded` to rescue focus.**
- After the test, the listener and injected style are removed. The test verifies all three encrypted-vault localStorage keys are absent and that the DEMO warning and exit remain present. No real financial state is accessed.

## Measured natural Tab and Shift+Tab

| Chromium viewport / theme | Previous C: natural Tab center exposed | C2: forward Tab centers exposed | C2: reverse Shift+Tab centers exposed | C2 forward strip scrollLeft (CSS px) |
| --- | --- | --- | --- | --- |
| 320 light | 3/5 | **5/5** | **4/4** | 0 → 112 → 236 → 360 → 472 |
| 320 dark | 3/5 | **5/5** | **4/4** | 0 → 112 → 236 → 360 → 472 |
| 390 light | 4/5 | **5/5** | **4/4** | 0 → 94.5 → 218.5 → 342.5 → 437 |
| 390 dark | 4/5 | **5/5** | **4/4** | 0 → 94.5 → 218.5 → 342.5 → 437 |

All C2 focused destinations matched `:focus-visible`, preserved the expected order, and passed center `elementFromPoint` exposure checks. Reverse navigation returned the strip to scrollLeft=0. The synthetic DEMO warning and exit were present in every case; vault KEY/PAYLOAD/RESET remained absent. Evidence is logged under `FOCUS FOLLOW ZOOM NAV C2 #85` and retained in the Chromium `browser-populated-budget` artifact as `zoom-nav-focus-follow-c2-*.png`.

## What this proves — and does not prove

**Proved only in Chromium CSS zoom proxy:** a candidate-owned focus-following rule can eliminate the specific natural-keyboard exposure defect seen in candidate C for these four scenarios. A green workflow means the probe ran successfully, **not** that the product passed mobile accessibility.

**Still unverified:** physical iPhone Safari, VoiceOver, Dynamic Type and browser text-only enlargement; horizontal-scroll affordance discoverability and actual swipe/tap activation; selected-tab reveal after navigation; safe-area behavior; visual overflow cue and contrast; focus after live React re-render; reduced-motion behavior. A CSS `scrollbar-width:thin` is not a reliable visible cue on iOS. C2 is **not approved for product release**.

## Decision and next step

Retain WEB 18.72 unchanged. For #85, the next reversible candidate should test a genuinely visible overflow affordance, natural touch and Enter activation, selected-tab auto-reveal, 100%/200% zoom and DEMO/budget reachability. Do not ship until the browser/Safari acceptance gate and immutable-release checks are met. The P1 data-integrity issues [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35) remain higher priority and unresolved. [#14](https://github.com/nikopol000/financial-autonomy-preview/issues/14) remains financial DISCOVERY; no modes or formulas without explicit approved numeric contract.
