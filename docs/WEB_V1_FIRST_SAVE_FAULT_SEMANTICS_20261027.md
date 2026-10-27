# WEB v1 first-save fault semantics and safe recovery boundary — 2026-10-27

**Status: research / test-only.** Product WEB 18.57, encrypted vault format, backup, formulas, real data and iOS are unchanged. All examples are synthetic. Issue #35 is still open.

## Standards versus fault injection

The [Web Storage specification](https://www.w3.org/TR/2021/SPSD-webstorage-20210128/#the-storage-interface) requires each individual `setItem` and `removeItem` to be **atomic with respect to failure**: if a method fails, that operation must leave storage unchanged. It does **not** require synchronous physical disk durability and does **not** make a pair of distinct `setItem` calls transactional. The [current WHATWG HTML storage API](https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-interface) specifies `QuotaExceededError` when a value cannot be stored. [MDN's quota guidance](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) describes browser storage limits and best-effort eviction. These are distinct failure classes.

The new `tests/vault-real-crypto-regression.cjs` cases deliberately inject a **non-conforming storage adapter** that commits an individual write and then throws. They test defensive behavior under an adversarial wrapper/acknowledgement mismatch; **they are NOT evidence that compliant browsers throw after committing `localStorage.setItem`**. Do not prioritize a production redesign solely on those cases. The already established **spec-compatible** risk is an interruption *between* the successful first key write and the second ciphertext write, or an atomic failure of the second write: the first write remains committed, producing a key-only state. That failure is documented in issue #35.

## Read-only recovery classification (do not infer user intent)

| v1 footprint | What is known | Safe automatic action |
| --- | --- | --- |
| Neither key nor ciphertext; no ambiguous reset marker | No current v1 vault pair | Only the existing explicitly selected first-run flow; do not infer history from this alone. |
| Key only | Could be interrupted first creation **or** ciphertext deleted from a pre-existing vault | **Block load and save; preserve key.** Never silently clear it. |
| Ciphertext only | Key missing; ciphertext may be a recoverable encrypted artifact | **Block load and save; preserve ciphertext.** |
| Both; authentication passes | Valid currently readable v1 ledger | Existing load/save path, subject to Web Locks and stale-tab checks. |
| Both; authentication fails | Corruption, wrong key or external modification | **Block overwrite; preserve both.** |
| Pending/unknown reset marker | Reset may have partially completed or client may be stale | **Block mutation; preserve evidence.** No automatic replay/resurrection. |

## Active 18.57 recovery behavior (code-level, not Safari-verified)

The active immutable bundle's platform module 309 already retains the *prepared encrypted first-write key and ciphertext* in volatile tab memory for up to **120 seconds**, and exposes `canRetryFirstSave()` / `retryFirstSave()` to the UI. It clears the volatile token on pagehide, hidden visibility, relevant storage events and expiry. The UI has a conditional **„Reîncearcă prima salvare”** action; this is different from the blocked landing's **„Reîncearcă deschiderea”** (which only reloads). After reload/expiry, the pending encrypted envelope is no longer available to that retry mechanism. These observations limit #35: it is a **residual reload/expiry/ambiguous provenance risk**, not a claim that the app has no same-tab retry path. The new low-level vault tests do not exercise the platform retry controller; a separate synthetic real-tab regression is needed.

## Safe candidate direction and acceptance

Prefer a **non-destructive, read-only recovery explanation** before a format migration: identify the observed footprint without claiming why it happened; show that no data was erased; preserve the existing same-tab first-save retry when its volatile prepared envelope is valid, otherwise offer a retry of loading only, and describe the existing password-protected backup restore route *only when the restore flow can actually work*. Do not create a raw key+ciphertext download or promise that a missing ciphertext can be reconstructed from the key.

Before any change, inspect the current blocked-vault UI and validate copy for key-only, payload-only, corrupt ciphertext, denied reads, interrupted reset, and a stale second tab. Test accessible controls in synthetic Chromium 320/390 light/dark and keyboard focus. No automatic `removeItem`, retry-save, migration or reset. For a user-visible change, use an immutable version and exact diff/CI/Vercel/browser gates.

**Architecture decision:** automatic v1→v2 cutover remains blocked: an already-open archived v18.43 tab ignores new sentinels, so neither a new Web Lock nor an origin-local marker can force legacy participation. Browser storage persistence options do not establish a multi-key transaction or revoke old clients. Keep #29/#35/#4 open until an enforceable, tested contract exists.

## Evidence and limitations

The existing tests cover spec-compatible payload-write failure and key-only/payload-only states. The two new cases only extend *adversarial adapter* coverage; their exact CI status must be checked separately. No physical crash durability, iPhone Safari behavior, user incident or real data recovery was observed. Research-only: no change to release version or diagnostics.

## Follow-up: real bundled platform retry lifecycle — 2026-10-27

[PR #169](https://github.com/nikopol000/financial-autonomy-preview/pull/169) (test-only; merged `f040e9077fde79013c557230d7869a0801233150`) adds **four** synthetic Node VM integration cases using the active immutable WEB 18.57 modules 309/310/311, not a mocked encryption engine. The [candidate Release CI run #40537973615](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40537973615) passed **52/52**, with named PASS logs for all four. These tests use a spec-compatible *atomic* payload-write denial (the failed write does not mutate backing storage), unlike the deliberately non-conforming write-then-throw adapter in the earlier section.

| Scenario | Verified in synthetic VM | Safety boundary |
| --- | --- | --- |
| Initial payload write denied after key committed; same tab remains open | `canRetryFirstSave()` is true; retry writes only the prepared encrypted payload, keeps the original AES key, authenticates and returns the exact synthetic ledger; second retry is rejected | The volatile handle is scoped to this tab and the 120-second window. This is not proof of crash durability. |
| New module instance / reload while key-only footprint exists | New instance has **no** volatile token; load and retry fail closed with **zero writes**; the original tab's captured `pagehide` invalidates its token | No automatic inference that the key came from an interrupted first save. |
| 120-second expiry | Deterministic captured timer callback clears the token; retry is rejected with **zero writes** | The test invokes the expiry callback rather than waiting 120 seconds; it is not a wall-clock or Safari background-throttling test. |
| Document becomes hidden | Synthetic `visibilitychange` listener invalidates the token; retry is rejected without writing | Browser lifecycle dispatch and iPhone Safari background behavior remain unverified. |

**Conclusion:** active WEB 18.57 already supports a safe *bounded same-tab* retry for the tested synthetic failure. The unresolved P1 is the **ambiguous KEY-only footprint after pagehide/reload/expiry**, plus real browser acceptance and interruption between individual atomic storage writes. Never auto-clear or regenerate the key, never claim ciphertext can be reconstructed from a key, and do not activate v2 migration while cached pre-journal tabs can write or reset. This does not change the live app, backup format, accounting formulas or iOS.

**Next acceptance work:** synthetic Chromium with real browser storage quota/permission failure when feasible; compare UI messaging in first-save retry versus blocked reload at 320/390 CSS px, light/dark and keyboard/VoiceOver. Separate genuine browser behavior from Node VM evidence. Validate recovery affordances without automatic destructive actions. Vercel WEB 18.57 production publication is tracked independently from this test-only PR.


## Follow-up: retry conflict versus identical ciphertext — 2026-10-27

[PR #177](https://github.com/nikopol000/financial-autonomy-preview/pull/177) merged as `c83cbc7a1f4b375b0aab56fce28b249742b51111`, adding **two real-bundle synthetic integration tests** to `tests/vault-real-crypto-regression.cjs` (54/54). [Candidate Release CI #40565165119](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40565165119) **SUCCESS**; job logs include both named PASS assertions.

- **Different payload appears before retry:** after an atomic synthetic payload-write denial, a second actor inserts a *different* payload. The pending retry rejects as a conflict, invalidates its token and performs **zero further storage writes**, preserving the other payload byte-for-byte even when it is not valid ciphertext. This tests the non-overwrite boundary, **not** the correctness of another tab's data.
- **Identical ciphertext already present:** after a synthetic atomic denial, the exact attempted encrypted envelope is placed in storage. The pending retry authenticates and loads the original synthetic ledger **without writing the envelope again**. The token is consumed. This models an acknowledgement/commit ambiguity without claiming browsers normally commit a failing `setItem`.

These are Node VM tests of actual immutable WEB 18.59 modules, not Chromium/Safari interaction, a physical crash test or proof of storage durability. No live vault recovery, key removal, v2 migration, financial semantics or backup format was changed. The KEY-only state after reload/expiry remains ambiguous and blocked. **Next:** synthetic Chromium browser fault and blocked-state accessibility acceptance, then decide any recovery UX only after verifying it cannot destroy or falsely promise to restore data.


## Actual Chromium first-save UI acceptance — 2026-10-27 (PR #180)

[PR #180](https://github.com/nikopol000/financial-autonomy-preview/pull/180) adds `tests/browser-first-save-ui-retry.cjs`, exercised through the **real WEB 18.59 UI**, not only direct calls to the platform module. Candidate [Release #40574444889](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40574444889) and [Chromium #40574444733](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40574444733) completed successfully; the previous Chromium candidate #40574370125 produced named PASS logs for both scenarios. The test uses native Chromium localStorage/Web Locks in disposable localhost contexts, with an injected **atomic** `QuotaExceededError` on the first encrypted PAYLOAD write. This injection is spec-compatible (the failing individual write leaves the storage value unchanged), but it is **not** a naturally observed quota failure.

| Real UI scenario | Verified browser outcome | Not established |
| --- | --- | --- |
| 390px light: create a 2,000 RON synthetic budget via the existing editor; first encrypted PAYLOAD write denied; dismiss editor, use visible `Reîncearcă prima salvare` | 44px or larger button target; no ciphertext before retry; same original AES key; retry authenticates stored budget; reload reads it without rewriting ciphertext | Safari/iPhone screen reader, true quota exhaustion, disk durability, physical crash |
| 320px dark: same failed save, but reload **before** retry | KEY-only state is blocked; volatile retry action is absent; `Reîncearcă deschiderea` preserves every vault byte | Whether an orphan key originated from interrupted creation or lost pre-existing ciphertext |

**Decision:** retain bounded same-tab retry, fail closed on ambiguous KEY-only after reload; no auto-delete, reset, key regeneration, raw-key export, v2 migration or formula change. This regression covers actual UI wiring in two synthetic Chromium scenarios; it is not complete 320/390 light/dark Safari acceptance. Keep #35 OPEN. Next: check exact merged-main CI and public/browser access, then investigate physical crash and cached legacy-client constraints before any format migration.
