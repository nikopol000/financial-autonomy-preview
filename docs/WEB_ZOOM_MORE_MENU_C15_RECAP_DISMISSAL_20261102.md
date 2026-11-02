# WEB #85 — C15 modal-free original WEB pointer and focus research (2026-11-02)

**Not a product change.** Base main `17d343f47a785be4d30775dfffd09c7b4171afff`; WEB 18.72 immutable bundle unchanged.

## Reason

C14 proved the foreground `RECAPITULARE · octombrie 2026 · 1 DIN 4` overlay was the top hit-test owner at original More, DEMO exit and Bugete centers. C12/C13 used a programmatic click to open More behind the overlay, so their 0/16 blocked pointer results are **not evidence of a More-menu defect independent of the recap**.

## Test

`tests/browser-web85-c15-recap-dismissal-research.cjs` uses the **real, original WEB React DOM** on disposable localhost DEMO. At 320/390 × 422/844 × light/dark, root-font-size 200%:

1. Wait for DEMO and detect the visible `RECAPITULARE` heading.
2. Click the actual visible recap progression button via Playwright pointer (up to eight steps). Record each heading, button label and whether the pointer was accepted. Do not hide the overlay or set `pointer-events:none`.
3. Record whether the recap really disappears. If not, report blocked onboarding; do not pretend More is available.
4. Attempt actual pointer click on original `Mai mult`; only if blocked use a separately labeled DOM click **for topology setup, not acceptance**. Test original DEMO exit with a non-activating pointer trial and original Bugete with a genuine pointer click.
5. Capture `elementsFromPoint` ancestry and screenshots before and after, focus geometry, five original tabs, and assert no encrypted-vault keys.
6. **No C13 injected CSS**. This is the actual WEB baseline after legitimate recap dismissal, not a synthetic sheet.

Green CI only means all eight characterization cases ran and no vault was written. It does not mean the recap was dismissible, the More menu passed, or Safari/VoiceOver/WCAG passed. Do not claim a fix unless named log outcomes prove it.

## Next

Inspect exact PR-head Chromium logs: number of recap steps accepted, modal truly cleared, real More pointer, DEMO exit pointer trial and Bugete click. If recap remains, diagnose onboarding controls first. If recap clears and More works, revisit 422px/200% warning geometry and focus with no overlay; only then consider a safe immutable product change. Keep P1 #4/#29/#35 unsafe, #14/#25/#2 financial semantics approval-gated, and iOS untouched.
