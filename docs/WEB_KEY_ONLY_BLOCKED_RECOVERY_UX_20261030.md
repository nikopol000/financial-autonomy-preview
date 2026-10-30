# WEB 18.64 — KEY-only blocked-state recovery inspection UX (2026-10-30)

**Status: DESIGN / ACCEPTANCE CONTRACT ONLY. Not a shipped recovery feature.** Applies to #4, #29 and #35. The actual WEB 18.64 encrypted vault, backup format, budget engine, iOS, and local-only architecture remain unchanged. All browser evidence uses disposable synthetic data.

## Exact new browser evidence

[PR #292](https://github.com/nikopol000/financial-autonomy-preview/pull/292) was merged as `c45b4aef2e3b2f69b0fcb7c1168e22e8ba41934a`; exact test head `51e79196e381a2897cf819a8f0befe4a7b618add`. [Release CI #41000776646](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41000776646) and [Chromium #41000776616](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41000776616) completed SUCCESS. Chromium job `123884405210` explicitly logged `PASS Chromium actual blocked KEY-only UI: retry opening makes zero vault writes and preserves orphan key across reload`.

In the actual WEB 18.64 browser UI, a synthetic portable-backup restore into an empty origin first writes the AES key, then a fault-injected PAYLOAD `setItem` denial leaves **KEY present, PAYLOAD absent, RESET absent**. Reload displays the blocked-vault screen. The existing **Reîncearcă deschiderea** control is clicked while both `Storage.prototype.setItem` and `removeItem` are instrumented for KEY/PAYLOAD/RESET. The click performs **zero protected writes/deletions** and leaves the original KEY-only bytes intact, including after another reload. This is a narrow no-write safety baseline, **not** proof of recoverability or a real user incident.

## Evidence classification before any recovery action

| Observed footprint | What can be concluded | Safe UI treatment |
| --- | --- | --- |
| No KEY/PAYLOAD and no reset ambiguity; all reads succeed | Origin may be empty | Existing first-use flow only after complete preflight |
| KEY present, PAYLOAD missing | **Ambiguous**: failed first write OR missing previously existing ciphertext | Block ordinary save, preserve KEY, read-only status; no automatic reset or new key |
| PAYLOAD present, KEY missing | Encrypted data may remain, but decryption key is absent | Preserve PAYLOAD; no automatic overwrite or claim of decryptability |
| KEY and PAYLOAD present, decryption fails | Authenticated state not established | Preserve both bytes, report unavailable; never treat as empty |
| Any KEY/PAYLOAD/RESET read denied | Storage authority is **unknown**, not empty | Fail closed; retry inspection only when reads are possible |
| Explicit reset marker/pending state | Intent and completion need separate verification | Do not resurrect intentionally reset data or silently finish an uncertain reset |
| Valid selected portable backup | Authenticated backup contents, **not proof of newest history** | Show provenance and request explicit action only after conflict-safe design |

A KEY-only origin cannot distinguish never-completed initialization from lost ciphertext with any existing local flag. An origin-wide rollback can restore mutually consistent older ciphertext and witnesses; do not claim anti-rollback guarantees.

## Proposed non-coaching interface (NOT implemented)

- Heading: **Datele locale nu pot fi deschise**. Body for KEY-only: **Cheia de criptare există, dar datele criptate nu pot fi găsite. Nu ștergem cheia și nu inițializăm date noi.**
- Primary safe action: **Reîncearcă verificarea** — **read-only** preflight of the existing footprint; disabled while running, result announced accessibly. It must never become an implicit restore, clear-data, new-vault or backup import action.
- Secondary disclosure: **Ce înseamnă asta?** Explain without blame that the app cannot determine whether data was never saved or was lost, that clearing browser/site data can destroy evidence, and that a separately retained encrypted backup may be relevant. Do not promise that a raw key recreates missing ciphertext.
- If later offering backup selection: decrypt and inspect **without writing the blocked origin**, show exact candidate identity/provenance and unknown recency, and require explicit, separately verified confirmation under a reviewed storage protocol. An isolated candidate preview is not a guarantee that the current origin can safely accept it.
- Avoid fake amounts, fake success, automatic replays, synthetic transactions or a reset CTA presented as recovery. Use neutral Romanian, visible text not color alone, 44px-or-larger mobile targets and an accessible alert/status.

## Required acceptance matrix before a versioned UI change

1. KEY-only, PAYLOAD-only, corrupt pair, reset-pending and denied-read: inspect/retry **zero KEY/PAYLOAD/RESET writes**, preserve byte-identical evidence after reload, no ordinary ledger access or success toast.
2. Repeated retries, pagehide, hidden tab, rapid double tap, denied read, storage quota denial: no new key, no deletion, no hidden write. Verify screen-reader announcements and focus return after errors.
3. Full valid pair: read-only retry may unlock only after AES-GCM authentication; no optimistic success based on presence or length alone.
4. Backup inspection: wrong password, unsupported envelope, valid older backup, valid newer backup, cancelled confirmation and ambiguous post-write error; no automatic selection, merge or repeat.
5. Existing-vault restore: verify committed/unchanged/unknown with authenticated readback under cooperating-tab lock; unknown means **no automatic retry**. A cached v1 tab and complete origin rollback remain explicit residual risks.
6. Visual/accessibility: synthetic 320/390px light/dark, keyboard focus, 200% CSS stress **and separately** Safari iPhone/Dynamic Type/VoiceOver. Chromium CSS zoom is not Safari evidence.
7. Any eventual product change requires immutable bundle + HTML/diagnostic version, exact-diff guard, Release CI, Chromium, authorized Vercel exact-SHA and served-preview checks. No change to financial formulas, data, backup format, iOS, server, account or telemetry.

## Decision / next step

**Recommend** first implementing a read-only, clearly labeled inspection status and retry path *only after* the above acceptance tests and safe error taxonomy are reviewed. Keep the current blocked-vault fail-closed behavior until then. A durable atomic restore protocol, legacy-tab fence and recovery of missing ciphertext are **separate, unresolved P1 work**. #4/#29/#35 remain open.
