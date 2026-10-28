## Chromium last-interactive-control evidence — 2026-10-28 (#85)

[PR #204](https://github.com/nikopol000/financial-autonomy-preview/pull/204) merged into WEB 18.61 test suite as `f53c52d2fea90e38dbc58a7a9618bf87e390c3fa`. Beyond the last monthly *detail* check from PR #202, Chromium now focuses and scrolls the two budget filter buttons and final visible non-navigation interactive control, checking full placement above fixed navigation and center hit-test exposure. The last candidate and geometry are recorded in `artifacts/browser-populated-budget/audit.json`. [Candidate Release #40648207497](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40648207497) and [Chromium #40648207583](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40648207583) passed, including 4/4 named populated DEMO budget scenarios at 320/390 CSS px light/dark with half-width stress. This tests visible controls in the current synthetic state, not all possible controls or keyboard navigation sequences. Safari iPhone, VoiceOver, native text enlargement, independent public-browser acceptance and full WCAG conformance remain **unverified**. No product, formula, vault/backup, real data or iOS change.

## Follow-up Chromium evidence — 2026-10-28 (#85)

[PR #202](https://github.com/nikopol000/financial-autonomy-preview/pull/202) adds a **real Chromium** synthetic populated-budget scroll test: after creating a 2,000 RON monthly DEMO budget, it scrolls the last `Lunar · principală` detail into view and asserts its center is inside the viewport and hit-test exposed (not hidden by the fixed navigation or overlay). It records scroll ancestors and target/nav geometry in the existing JSON artifact. Candidate [Release #40641392016](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40641392016) and [Chromium #40641392067](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40641392067) passed, including four named 320/390px light/dark cases and half-width stress. This is regression coverage for a **budget detail**, not a complete proof that every final interactive control is reachable. Browser zoom, iOS Safari native text enlargement, VoiceOver and independent production-browser acceptance remain unverified. No UI or financial formula changed.

# WEB mobile reflow and enlarged-text acceptance — 2026-10-28

Status: **DISCOVERY / TEST PLAN ONLY** for issue #85. No code, financial-model, encrypted-vault or iOS changes. This is a test contract, **not** a claim of WCAG compliance or Safari acceptance.

## Chromium implementation evidence — 2026-10-28 (not Safari acceptance)

[PR #200](https://github.com/nikopol000/financial-autonomy-preview/pull/200) extended the existing actual Chromium populated-DEMO audit: **five pressable target rectangles** are checked pairwise in addition to text-node rectangles, and keyboard-focused Acasă/Finanțe tab centers must be exposed to `elementFromPoint` (not obscured by an overlay). Checks run at 320/390 CSS px, light/dark, root CSS zoom 200% and half-width layout stress. Candidate [Chromium #40635449391](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40635449391) **SUCCESS** with four named 2,000 RON synthetic budget PASS cases; merged-main [Chromium #40635600865](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40635600865) **SUCCESS**. Main push CI path filter now includes this test file. This is new automated **regression coverage**, not a new product fix. It does **not** prove native 200% text enlargement, Safari iPhone, VoiceOver, fixed-bottom-nav scroll reachability or WCAG compliance. Next: scroll/occlusion evidence with populated DEMO, then separate native browser/device acceptance.

## Evidence and scope

- [Issue #85](https://github.com/nikopol000/financial-autonomy-preview/issues/85) records overlapping navigation labels in **synthetic Chromium CSS `zoom:200%`** at 320/390 CSS px on WEB 18.47. The absence of document-wide horizontal overflow did **not** detect the overlap.
- WEB 18.60 compacted the demo-only warning, and WEB 18.61 added a visible keyboard focus ring; neither is proof that the overlapping labels have been resolved in actual iPhone Safari.
- [W3C WCAG 2.2 SC 1.4.4 — Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) requires 200% text enlargement without loss of information/functionality. [SC 1.4.10 — Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) describes content at an equivalent 320 CSS px width without two-dimensional scrolling, with limited exceptions. These are distinct checks. A CSS `zoom` property on the document is a **stress proxy**, not a conformance test or iOS Dynamic Type simulation.

## Acceptance matrix for the next browser/UI change

1. **Real browser controls, not only CSS `zoom`:** test native browser zoom at 100%, 150%, 200%; text-only enlargement where available; viewport 320/390 CSS px in both light and dark. Record browser/OS and effective viewport. Separately test Safari iPhone with its actual text controls and VoiceOver when access is available.
2. **All five navigation destinations:** verify their labels remain distinguishable, do not overlap each other, remain activatable, and expose the correct accessible names. A non-overflowing `scrollWidth` alone is insufficient. Capture bounding boxes for every label and target and check geometric intersection, not just document width.
3. **Keyboard and focus:** Tab through each destination; assert the 18.61 focus indicator remains visible and not hidden behind a fixed header, banner or bottom bar. Verify focus does not jump into off-screen, clipped content.
4. **Scroll and content:** populate a **synthetic** RON 2,000 monthly budget in DEMO, visit Bugete and Finanțe, reach the final card and all relevant controls with vertical scrolling, and check that the fixed bottom bar does not obscure the last interactive item.
5. **Demo warning:** retain a visible, truthful indication of fictional data and an accessible exit action; do not hide safety information merely to reduce height.
6. **Evidence:** save before/after screenshots, element geometry, keyboard trace, contrast readings and exact immutable bundle/CI identifiers. Report failures separately for Chromium, Safari, and VoiceOver; no inference across platforms.

## Alternatives and recommendation

- **A. Keep five fixed bottom labels and shrink typography:** minimal layout change but risks illegibility at enlarged text; reject as the only strategy.
- **B. Responsive two-line labels / adaptive spacing with full accessible names:** lower-risk incremental first candidate; measure overlap and target sizes before acceptance.
- **C. Reorganize destinations into a menu:** potentially more room but adds navigation steps and changes information architecture; defer unless measured layouts cannot preserve five usable destinations.

**Recommended next action:** write a Chromium geometry/keyboard regression that checks pairwise label and target overlap at 320/390 CSS px and native zoom, using synthetic DEMO data; use that evidence to choose a minimal layout fix. Safari/VoiceOver remains a separate manual acceptance gate.

## Sources and limits

- W3C: [Understanding Resize Text 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), consulted 2026-10-28.
- W3C: [Understanding Reflow 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), consulted 2026-10-28.
- Internal: [Issue #85](https://github.com/nikopol000/financial-autonomy-preview/issues/85), [WEB visual review](WEB_VISUAL_REVIEW.md). Original visual review was v18.21 on desktop; do not present it as mobile evidence.
