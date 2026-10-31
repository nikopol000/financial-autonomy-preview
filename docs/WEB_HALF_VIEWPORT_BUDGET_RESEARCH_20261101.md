# WEB 18.66 — Bugete at half-width and half-height (1 November 2026)

**Status: verified Chromium diagnostic, NOT a product fix or Safari/VoiceOver acceptance.** Issue [#85](https://github.com/nikopol000/financial-autonomy-preview/issues/85); [PR #378](https://github.com/nikopol000/financial-autonomy-preview/pull/378). No product, financial formula, vault, encrypted backup, or iOS change.

## Why this experiment

The prior [200% root CSS zoom experiment](WEB_ZOOM_BUDGET_OCCLUSION_20261031.md) measured a near-zero nested Bugete scroll viewport, but CSS zoom does not reproduce the layout viewport of a browser zooming natively. This test keeps CSS zoom at **100%** and halves both dimensions of the Playwright mobile viewport: 320×844 → **160×422** and 390×844 → **195×422**. The 50% × 50% geometry is a **stress proxy**, not a claim that Safari or Dynamic Type behaves identically.

The test uses the real immutable WEB 18.66 UI on a disposable localhost Chromium origin, configures a synthetic 2,000 RON budget in memory, records scroll ancestors, navigation/tab geometry, the demo warning and its exit action, then restores the previously tested half-width 844px-tall viewport for strict tab operability checks. Screenshots and structured JSON are attached to the CI artifact.

## Actual observations (both light and dark)

| Effective viewport | Nested Bugete scroll `clientHeight` | Five tab positions (top–bottom, CSS px) | Last budget detail after manual scroll-to-end |
| --- | ---: | --- | --- |
| **160×422** | **0 px** | Acasă/Finanțe **384–438**; Adaugă/Istoric **442–496**; Mai mult **500–552** | y **−92…−36**; center **not exposed** |
| **195×422** | **7 px** | Acasă/Finanțe/Adaugă **302–356**; Istoric/Mai mult **360–414** | y **−74…−18**; center **not exposed** |

The synthetic-data warning remains in the DOM: warning label y **110–154** (160px) or **93–115** (195px), and the demo exit action y **316–364** or **227–275**. Five navigation tabs still exist, but at 160×422 three are partly/fully below the viewport and the scrollable budget area is zero-height. The problem is **not limited to CSS root zoom**: severe vertical-space pressure alone reproduces it in Chromium. This does not establish typical-device prevalence or native Safari zoom behavior.

## Verification

- [Chromium PR run #41250938820](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41250938820): **SUCCESS**, four named `HALF WIDTH HEIGHT GEOMETRY #85` lines, 4/4 synthetic populated-budget audits PASS. Existing 200% CSS-zoom known limits remain explicitly logged (4/4/3/3 occluded targets); a green workflow is **not** a pass of those stress conditions.
- [Release CI PR run #41250938840](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41250938840): **SUCCESS**.
- Product WEB 18.66 `index.html`, immutable bundle and diagnostic remain unchanged; no release version bump.

## Next design experiment (not implemented)

The combination of fixed-height root (`#root` fills the viewport), body `overflow:hidden`, the tall demo region, and wrapped five-tab navigation leaves the nested content ScrollView without usable height. Before changing the product, compare two **reversible, synthetic-browser-only** candidates:

1. A **short-height responsive outer scroll fallback** that preserves the demo warning and all five tabs, makes the main content reachable, and does not trap keyboard focus. Verify the actual scroll owner and `elementFromPoint` for the last budget detail; simply adding footer padding cannot solve a zero-height inner scroll.
2. A **short-height shell/header/nav space allocation** that reduces avoidable vertical footprint without reducing tab targets or removing labels; test 320/390 light/dark and normal-height regressions.

Reject any candidate that merely suppresses CSS zoom, hides the demo warning, removes tabs, clips controls, or masks failures in tests. When a fix is demonstrated, ship a **new immutable WEB release** with strict reachability and focus tests, synced diagnostic/HTML version, GitHub CI, Vercel and served-browser verification. Actual Safari iPhone, native browser zoom, text enlargement and VoiceOver remain outstanding.

## Critical P1 and financial gates

#4/#29/#35 remain open: cached noncooperating v1 writers can still modify legacy-origin storage after a modern recheck; no destructive recovery/restore/migration or origin cutover without explicit reviewed consent and a crash-safe authority protocol. Issue #14 remains DISCOVERY only; no budget modes or financial formulas are changed.
