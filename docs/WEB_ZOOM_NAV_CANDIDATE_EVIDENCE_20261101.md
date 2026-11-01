# WEB #85 — disposable zoom navigation candidate measurements (2026-11-01)

**Status:** DISCOVERY / ANALIZĂ. **Not shipped.** Product remains WEB 18.72. This document records measured synthetic Chromium evidence, not a recommended release, WCAG pass, Safari/iPhone result or a change to financial semantics.

## Reproducible evidence

- Test-only [PR #416](https://github.com/nikopol000/financial-autonomy-preview/pull/416), merged at `257fbcb3c7f2453c6f8480ae0c5e747e0a8efdb8`, extends `tests/browser-populated-budget-audit.cjs` with reversible CSS injected into a disposable populated DEMO UI.
- [Chromium workflow #41314607842](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41314607842) **SUCCESS**; populated-budget step explicitly reports **PASS 4/4** at 320/390 CSS px, light/dark. [Release validation #41314607848](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41314607848) **SUCCESS**. Geometry is printed in job logs under `ZOOM NAV CANDIDATE #85`, with screenshots and JSON in the existing `browser-populated-budget` artifact.
- The root CSS `zoom:200%` stress proxy is not browser zoom, Safari Dynamic Type, VoiceOver or WCAG certification. It changes effective layout geometry and can create a viewport more constrained than the WCAG 1.4.10 reference.
- Both candidates use CSS `:has(> [role="tab"])` to style the actual navigation container; injected styles are removed after each measurement. No product CSS, JS bundle, ledger, backup, localStorage vault, iOS or release metadata changes.

## Measured outcomes

| Chromium viewport | Variant B: flex-wrap / 33.333% tabs | Variant C: one-row horizontal strip |
| --- | --- | --- |
| 320px light and dark, CSS zoom 200% | **3 rows**, parent bounds y=748–1218 (below 844px viewport), parent scroll/client width 160/160 | **1 row**, bounds y=700–844, parent scroll/client width **632/160** |
| 390px light and dark, CSS zoom 200% | **3 rows**, parent bounds y=570–944 (below 844px viewport), parent scroll/client width 195/195 | **1 row**, bounds y=700–844, parent scroll/client width **632/195** |
| Text overlap and text outside tab target | 0 overlaps, no labels outside their own target in all four probes | 0 overlaps, no labels outside their own target in all four probes |
| Programmatic keyboard focus + scrollIntoViewIfNeeded for all five tabs | All five centers exposed after focus/scroll in all four probes | All five centers exposed after focus/scroll in all four probes |

**Interpretation:** the proposed **two-row** CSS is *not* a two-row solution under this stress: it creates three rows and a footer extending below the viewport. Its zero-overlap result is not sufficient to establish reachability. The scrollable strip stays one row and can expose each focused destination after **explicit programmatic** scrolling, but requires 437–472 CSS px of internal scrollable excess at the effective zoomed layout width; no visual discoverability or natural touch/keyboard auto-scroll behavior has been proven. The `allFiveFocusExposed` diagnostic deliberately scrolls each target before checking it, so it must **not** be interpreted as proof that users can find the fifth tab unaided.

## Alternatives / recommendation

- **Reject B as currently parameterized**: three rows, footer height and viewport overflow violate its intended design goal. A genuinely two-row version needs different item sizing and a dedicated safe-area/scroll-container test before further consideration.
- **Retain C as a disposable research candidate only**, not a production decision. Compare visible scroll cues, selected-tab auto-scroll, natural keyboard tab order, touch swipe affordance, VoiceOver labels, focus outline, and whether the last budget control and DEMO exit remain reachable without a scripted `scrollIntoViewIfNeeded` rescue.
- Do not hide destinations behind icons or collapse DEMO warning merely to make geometry green. Prefer the smallest supported responsive fix after native Safari and text enlargement tests. Existing [alternatives and acceptance matrix](WEB_MOBILE_ZOOM_NAV_ALTERNATIVES_20261101.md) remain authoritative.

## Next checkpoint

1. Inspect the retained screenshot/JSON artifact alongside job logs. Test **natural** Tab/Shift+Tab and touch scrolling, with no forced scroll helper, and verify visible scroll affordance and selected-tab reveal.
2. Verify a populated budget's last interactive control, its detail, DEMO warning/exit and safe-area behavior at enlarged text; keep baseline 100% checks.
3. Validate independently in real iPhone Safari / VoiceOver / text enlargement when available. Only then propose a small product CSS candidate with an immutable versioned bundle, release guards, CI, exact Vercel publication and served-browser inspection.
4. P1 #4/#29/#35 (encrypted ledger integrity and recovery) remain open and take precedence over a cosmetic release. #14/#25/#2 financial semantics remain analysis-only pending explicit numeric contract approval.

**No financial formula, backup protocol, user data, backend, account, telemetry, bank link or iOS modification.**
