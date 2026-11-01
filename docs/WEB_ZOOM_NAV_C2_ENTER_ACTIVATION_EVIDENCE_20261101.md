# WEB #85 — C2 Enter activation and More-menu reachability (2026-11-01)

**TEST / DISCOVERY ONLY. NOT SHIPPED.** WEB product remains **18.72**. No iOS, financial formulas, vault, encrypted backup, real ledger, released CSS or JavaScript were changed.

## Reproducible evidence

- [PR #425](https://github.com/nikopol000/financial-autonomy-preview/pull/425), squash merge `23403a78d0fe6817ff1806591c600a80cc5cec33`, extends the actual populated-DEMO Chromium test-only C2 focus-following candidate with keyboard Enter on **Istoric** and **Mai mult**. Test uses synthetic 2,000 RON budget, 320/390 CSS px, light/dark, document CSS zoom 200%.
- The first PR-head Chromium run [#41329599891](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41329599891) **FAILED** at 320-light: Playwright's natural pointer click on the **Bugete** row in the **Mai mult** menu timed out because a fixed UI region and the **Ieși din demo** banner intercepted pointer events after scroll-into-view. This is concrete evidence of a **separate 200% CSS-zoom menu reachability problem**, not a proven physical iPhone failure and not a C2 tab-selection failure.
- To isolate keyboard activation without misrepresenting a programmatic click as user access, the second test revision explicitly uses **harness-only DOM click** to return from Mai mult to the already configured Bugete page. This bypass is **not** counted as acceptance for the menu row.
- Revised PR-head [Release #41329879261](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41329879261) **SUCCESS** and [Chromium #41329879209](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41329879209) **SUCCESS**, including 4/4 populated-DEMO cases. These results verify the test candidate only; merged-main CI and Vercel/Safari are separate gates.

## Actual C2 Enter results

| Chromium proxy | Istoric: selected / exposed / focus retained | Mai mult: selected / exposed / focus retained | Focus-follow listener after activation |
| --- | --- | --- | --- |
| 320 light | true / true / true | true / true / true | retained |
| 320 dark | true / true / true | true / true / true | retained |
| 390 light | true / true / true | true / true / true | retained |
| 390 dark | true / true / true | true / true / true | retained |

The `aria-selected` attribute was `true` for each activated destination. The focused tab center remained hit-test exposed, and the candidate's DOM `focusin` listener was retained in these two navigation transitions. Measured C2 scrollLeft: 320 **360** (Istoric), **472** (Mai mult); 390 **342.5**, **437**. The configured budget was restored by test-only DOM click before subsequent regression assertions.

## Decision and next exact tests

1. **Do not ship C2 yet.** Keyboard Enter alone does not demonstrate touch gestures, visual overflow cue discoverability, screen-reader interaction or actual Safari Dynamic Type behavior.
2. **Investigate More-menu occlusion** at 200% CSS zoom independently of tab-strip C2. A user-facing menu item must be reachable with real pointer/keyboard interaction; test DOM click is not a mitigation. Measure header/demo overlay, scroll container and last-row exposure in 320/390 light/dark, preserving DEMO warning and exit.
3. Test candidate C2 with visible overflow affordance, natural swipe/tap, selected-tab reveal after navigation, and 100% zoom; then verify on physical iPhone Safari/VoiceOver when available. Do not confuse CSS zoom with system text enlargement.
4. Keep P1 #4/#29/#35 higher priority: no destructive reset, legacy-v1 migration, silent rekey/merge/replay or recovery claim without safe contract. Keep #14 budget perspectives analysis-only pending explicit numerical approval.

**Evidence classification:** four synthetic Chromium cases and one real Chromium proxy failure. No user incident, production browser acceptance, or Safari certification is claimed.
