# WEB 18.72 — Dashboard keyboard focus under Chromium forced colors (2026-11-01)

## Scope and original observation

Synthetic localhost Chromium only, real immutable WEB UI, no real financial data or encrypted-vault writes. Issue [#400](https://github.com/nikopol000/financial-autonomy-preview/issues/400), with accessibility-discovery overlap [#85](https://github.com/nikopol000/financial-autonomy-preview/issues/85). No Safari, Windows Narrator, actual Windows High Contrast, VoiceOver, or WCAG certification.

[Research PR #413](https://github.com/nikopol000/financial-autonomy-preview/pull/413) merged a **diagnostic-only** forced-colors measurement. [Chromium #41309630700](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41309630700) SUCCESS with four logs:
- 320/390 light: focused=true, focusVisible=true, outlineWidth=3, boxShadow=none.
- 320/390 dark: focused=true, focusVisible=true, **outlineWidth=0**, boxShadow=none.

This exposed a genuine Chromium high-contrast proxy focus visibility defect despite the normal-mode 18.71 keyboard focus fix. [MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/forced-colors) documents that browsers suppress box-shadow in forced-colors mode; the focus indicator must not depend solely on it.

## Alternatives evaluated and failed attempts

1. Keep the ordinary 3px inset box-shadow only: rejected, because the browser suppresses shadows under forced colors.
2. Add a shorthand `outline: 3px solid Highlight !important`: [Chromium #41310058173](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41310058173) FAILED, 320 light outlineWidth=0.
3. Higher-specificity `:focus-visible:focus` with explicit outline longhands: [Chromium #41310554666](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41310554666) FAILED, 320 light outlineWidth=0. A temporary DOM probe showed the actual element remained focused and :focus-visible; this was not accepted as a fix.
4. Explicit outline-width/style/color longhands on the original `#root [role="button"]:focus-visible` selector: [Chromium #41310943485](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41310943485) FAILED at 390 light when measured immediately after changing emulated media. 320 light/dark passed. This suggests a media-rerender timing sensitivity; it does not establish that the indicator is always visible at every instant.
5. **Selected incremental correction:** retain explicit `outline-width: 3px !important; outline-style: solid !important; outline-color: Highlight !important` inside `@media (forced-colors: active)`, and measure after a bounded 250ms media settling interval. This is a test timing adjustment, **not** a substitute for a user-facing focus ring. It avoids treating a synchronous media-transition intermediate style as a settled product failure.

## Verified candidate

[PR #414](https://github.com/nikopol000/financial-autonomy-preview/pull/414) merged as `72c9906b5301d7b31091615b3106d7c69314ccf0`, immutable WEB **18.72**. Its JS differs from WEB 18.71 **only** by diagnostic version and diagnostic-export filename; the HTML version, build key and bundle reference are synchronized. No financial formulas, state, AES-GCM vault/backup format, ledger, backend, bank integration, or iOS change.

[Release #41311199274](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41311199274) **SUCCESS**; [Chromium #41311199297](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41311199297) **SUCCESS**. Four named synthetic DEMO cases at 320/390px, light/dark, recorded `outlineWidth=3`, `focusVisible=true`, `boxShadow=none`, then keyboard Enter reorder/reset success. Test asserts actual computed outline width >=2px after media settles. The same release checks enforce immutable JS diff and HTML CSS.

## Residual acceptance and next steps

- **Do not claim production WEB 18.72** until Vercel READY for the exact product SHA and primary alias are confirmed. A Vercel READY build is not independent served HTML/bundle/header or interactive UI verification.
- The latest inspected production READY at this document's drafting was WEB 18.71 on `e39bbb3550a59f8fdc73a7fc1040c1bc43046405`, deployment `dpl_2qhkKuC1surXmkyqBUbord63Bn5Y`.
- Verify the served 18.72 HTML/bundle/header, populated Dashboard keyboard/touch reorder/reset on iPhone light/dark, Safari iPhone and VoiceOver. Also validate actual Windows High Contrast / browser forced-colors without synthetic media toggles; this is not certified by Chromium.
- P1 integrity #4/#29/#35 remains open, with no migration, destructive recovery, ledger merge or reset; DISCOVERY #14/#25/#2 remains analysis only pending explicit numeric contract. No iOS changes.
