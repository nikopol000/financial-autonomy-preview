# WEB #85 C19 — independent DEMO exit reachability under pinch (2026-11-02)

**RESEARCH ONLY, no product change.** Base main `29536090dff6167a5399c836cd7268d5f79bad26`, immutable WEB 18.72. This test does not modify real vault, backup, iOS, formulas, login, backend or telemetry.

## Why this is different from C18

C18 [evidence](WEB_ZOOM_MORE_MENU_C18_TOUCH_ONLY_20261102.md) found the original More menu warning and exit separately positioned at y≈77–99 and y≈186–234 CSS px after scroll-to-top at CDP scale 2. Requiring **both controls fully visible at once** was impossible in the ~211px-tall, ~160/195px-wide visual viewport. This did **not** prove that the exit could not be reached by panning. C19 tests **independent exit reachability**, rather than demanding simultaneous visibility of both controls.

## Method and bounded acceptance

`tests/browser-web85-c19-independent-touch-pan-research.cjs` runs the actual active WEB bundle in a disposable localhost **DEMO** context, 320/390 × 422 CSS px, light/dark, CDP page scale 2 (four configurations). It dismisses recap through real pointer interaction, opens original More, then uses CDP touch drags (down/up/left/right), without keyboard, `scrollIntoView`, DOM changes, or a synthetic click. For each step it records visual viewport offset, original exit rectangle, the viewport intersection hit test, scrollable ancestors and screenshot. If the original exit is independently hit-testable, it attempts a real Playwright touchscreen tap and checks whether the DEMO disclosure actually disappears.

The test must fail on unexpected real encrypted KEY/PAYLOAD/RESET values or a broken harness. A green workflow run **does not imply four successful exits**: inspect the `C19 WEB85` per-case lines, `independentExitHit`, `exitTouch.verifiedExit` and artifacts. A touch API success alone is not proof of exit. If the candidate tap coordinate is inconsistent with CDP visual-viewport mapping, report the ambiguity instead of calling the product inaccessible.

## P1 rotation / release gate

Critical #4/#29/#35 remain **OPEN**: five cached archived writer cases are KNOWN UNSAFE; a modern no-Web-Locks rejection cannot fence a noncooperating old tab. The previous checkpoint's first unfinished verification is now resolved: merged-main `de342918` [Chromium #41516581282](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41516581282), [Release #41516581256](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41516581256), [Pages #41516581341](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41516581341) are SUCCESS; final checkpoint main `29536090` [Release #41517024978](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41517024978), [Pages #41517024981](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41517024981), [Pages build #41517023351](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41517023351) are SUCCESS. These are CI/Pages evidence, **not** a P1 fix or a confirmed exact Vercel production deployment. Vercel combined status for `29536090` reports build-rate-limit failure; exact production SHA/served Safari remain unverified.

Do not approve an origin migration, destructive reset, KEY-only auto-recovery, automatic ledger merge or import by implication. The [origin/handoff contract](WEB_VAULT_ORIGIN_HANDOFF_CONTRACT_20261102.md) still needs explicit user decisions. #14 financial budget perspectives remain DISCOVERY only, with no new formulas or modes.

## First unfinished

Inspect exact C19 PR-head Chromium named results and Release CI; if the harness fails, repair without changing product or weakening the no-vault assertion. Merge research only when verified, then checkpoint the **observed** results and update #85; return to P1 authority/consent contract. Physical iPhone Safari/VoiceOver, actual browser zoom, accessibility acceptance and exact Vercel production publication are separate and unverified.
