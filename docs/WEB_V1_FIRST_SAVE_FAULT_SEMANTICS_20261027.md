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
