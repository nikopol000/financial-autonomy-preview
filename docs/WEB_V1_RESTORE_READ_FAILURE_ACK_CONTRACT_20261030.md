# WEB v1 confirmed restore: read-denial gate and acknowledgment contract (2026-10-30)

**Status: design/research, not shipped product behavior.** WEB 18.64 remains the active immutable application. No formula, backup format, iOS, server, telemetry, banking connection, or real user data changes. This note narrows issues #4, #29 and #35; none is closed.

## New browser evidence

[Test PR #288](https://github.com/nikopol000/financial-autonomy-preview/pull/288), merged as `ed818e00918d825ada8c5f2c219e83a2cfb1b180`, adds one actual-UI Chromium scenario to `tests/browser-confirmed-backup-restore-faults.cjs`. Exact test head `7b50f5bc229dfb85d6f0c8d54b4b56b24b4eb40a` passed [Release #40989726223](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40989726223) and [Chromium #40989726205](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40989726205); the specific `Characterize actual WEB confirmed-backup restore storage faults` job step completed SUCCESS.

A synthetic **two-transaction authenticated live v1 vault** is opened in a disposable Chromium context; the actual UI validates a password-encrypted **older one-transaction** portable backup. After validation and before the user confirms, the test injects a `SecurityError` for `Storage.prototype.getItem(PAYLOAD)`. The real confirmation path attempts to read the existing vault; the error is encountered, the UI does not report `Backup restaurat.`, KEY/PAYLOAD/RESET are byte-identical to their pre-confirmation values, and the newer transaction survives reload. The injected read denial is **not** a naturally observed browser incident. This is one specific safe failure boundary, not atomic restore or crash-durability proof.

## Read-only recovery and acknowledgment requirements

1. **Before committing:** under the existing exclusive Web Lock, re-read all relevant local authority footprints (KEY, PAYLOAD, RESET; later IDB if actually authoritative). A denied or inconsistent read must abort without attempting to initialize a fresh ledger, without writing a key or payload, and without treating an unreadable store as empty. The UI must distinguish `Nu se poate verifica starea datelor locale` from a wrong backup password.
2. **Key-only, payload-only, corrupt pair, pending reset:** keep every byte of encrypted evidence. A KEY-only state after reload cannot be proven to be a never-finished first save: it may be an older ledger with lost ciphertext. No automatic `removeItem`, key regeneration, restore replay, migration, or merge. Existing bounded same-tab first-save retry is allowed only with its exact live prepared envelope and its conflict/expiry checks.
3. **After an attempted commit:** classify the result as **verified committed**, **verified unchanged**, or **unknown**. A thrown write or readback exception alone does not identify the result. To claim verified committed, re-read the persisted envelope under the same cooperating-tab lock, authenticate it, validate the exact expected financial state (not only counts, dates, or a mutable filename), and check the reset/authority marker. To claim verified unchanged, re-read and compare the original complete footprint. If verification fails, say the outcome is **unconfirmed**, never automatically repeat the restore.
4. **User-visible wording:** distinguish `Backup verificat, dar nerestaurat`, `Restaurare confirmată și verificată`, and `Rezultatul restaurării nu poate fi confirmat; nu repeta operația până când datele locale pot fi verificate`. These are **proposed**, not currently shipped strings. Do not promise a missing ciphertext can be recreated from its raw AES key.
5. **Provenance and freshness:** authenticated v1, a portable PBKDF2 backup, and experimental IDB are distinct sources. Successful decryption proves integrity under the key, **not** that the selected history is newest. A complete origin-wide rollback can replay valid older witnesses together; no origin-local timestamp, revision, or digest is an anti-rollback oracle. Never silently select a winner or merge transactions.
6. **Migration boundary:** a new single-record envelope or IndexedDB transaction can address multi-key atomicity for **participating new clients** but cannot prevent an already-open cached v1 tab from writing localStorage. Any cutover needs a separate enforceable legacy-writer fence, rollback analysis and approval; a Web Lock name or new sentinel alone does not force archived code to cooperate.

## Alternatives evaluated

| Option | Benefit | Failure / cost | Recommendation |
| --- | --- | --- | --- |
| Retry all failed restores automatically | Superficially simple | Can replace a newer live ledger when an earlier restore actually committed; no proof of recency | Reject |
| Delete orphan KEY and start fresh | Removes blocked UI | Can destroy the only remaining key of a previously populated vault | Reject |
| Add a local `pending` marker to the two-key protocol | Can improve intent reporting | Still multiple nontransactional writes; crash and legacy-tab races remain | Research only |
| Single-record authenticated envelope / IDB transaction | Potential atomic authority per committed record | Format migration, old tabs, eviction, origin-wide rollback, compatibility | Future isolated prototype only |
| Preserve evidence + explicit read-only inspection and verified acknowledgment | Avoids unconsented overwrite, tells truth about uncertainty | Does not itself recover missing ciphertext | **Next safe incremental direction** |

## Required fault matrix before any user-facing fix

- Existing authenticated vault: KEY read denied, PAYLOAD read denied, RESET read denied, wrong key, corrupt ciphertext, Web Lock unavailable, stale tab; assert **zero writes** and no success message.
- Empty target: first KEY write denied, PAYLOAD write denied after KEY succeeds, reload between writes, post-write readback denied, confirmation interrupted; preserve all ambiguous bytes and never auto-delete.
- Existing vault: PAYLOAD write denied, adversarial write-then-throw, readback denied after a successful write, reset-marker change during lock, same-tab repeated restore; classify commit state accurately.
- Browser lifecycle: reload, pagehide, hidden tab, Web Locks serialization, cached archived v1 tab late writes, IndexedDB denial/abort/eviction, full-origin rollback. Safari iPhone/VoiceOver and 320/390 light/dark accessibility must be verified separately.

**Next implementation candidate (not yet authorized as a format change):** add read-only recovery status and a no-write `Reîncearcă verificarea` action in the blocked UI; first prove every failure class is nondestructive and that the control does not offer an impossible same-origin restore path. Then specify the exact persistent acknowledgment protocol and test its write/readback matrix before a versioned bundle. The product remains a neutral financial tool, not a coach.

## Follow-up: real Chromium authority-read and post-write verification matrix (2026-10-30)

[PR #290](https://github.com/nikopol000/financial-autonomy-preview/pull/290) (test-only squash `5c510029a107ce3420aea1f42d1d94530ce431bd`) extends the existing actual WEB 18.64 confirmed-backup UI suite with three synthetic disposable Chromium cases. Exact candidate `5472d23a727a162b59dfa8665f092f2c46b6db71`: [Release #40994860519](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40994860519) and [Chromium #40994860518](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40994860518) **SUCCESS**; Chromium job `123865520223` shows three individually named PASS lines.

- Existing authenticated two-transaction vault, older one-transaction backup, **KEY getItem denied** during confirmed restore: no KEY/PAYLOAD/RESET writes, no success acknowledgment, newer transaction survives reload.
- Identical setup, **RESET marker getItem denied**: same fail-closed, zero-write result.
- Identical setup, **PAYLOAD setItem commits**, then **KEY revision getItem denied**: actual UI reports restore failure, yet after fault removal and reload the older selected backup decrypts/authenticates. This is a deliberately injected post-commit readback denial, **not** a naturally observed browser incident. It confirms that a thrown exception alone cannot distinguish a committed restore from an unchanged one.

**Decision boundary:** no release or recovery protocol is authorized by these tests. An explicit verified-committed/verified-unchanged/unknown result requires a durable authenticated readback of the exact intended state under the cooperating-tab lock, and no auto-retry when that verification cannot complete. A complete origin rollback and cached v1 writer remain outside any local proof of recency. KEY-only blocked-state recovery must preserve all remaining ciphertext/key evidence and cannot infer that the key was created by a failed first save. Next: design a no-write recovery inspection UX and acceptance matrix before touching immutable product JS.


## Follow-up: KEY-only blocked retry no-write browser baseline (2026-10-30)

[PR #292](https://github.com/nikopol000/financial-autonomy-preview/pull/292), test-only squash `c45b4aef2e3b2f69b0fcb7c1168e22e8ba41934a`, adds a real WEB 18.64 disposable Chromium test of the **existing** blocked KEY-only retry UI. Exact candidate `51e79196e381a2897cf819a8f0befe4a7b618add`: [Release #41000776646](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41000776646) and [Chromium #41000776616](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41000776616) SUCCESS; job `123884405210` contains the new named PASS. After a synthetic PAYLOAD write denial leaves KEY-only storage, retry opening performs **zero** KEY/PAYLOAD/RESET writes or removals and preserves the blocked state and original key across another reload. This is an evidence-preservation baseline, not recovery of missing ciphertext or proof of safe restore.

See [blocked-state recovery inspection UX acceptance](WEB_KEY_ONLY_BLOCKED_RECOVERY_UX_20261030.md) for proposed read-only state classification, neutral microcopy, negative cases and Safari/VoiceOver acceptance. **Not implemented.** The KEY-only state remains provenance-ambiguous, and post-commit restore acknowledgment still needs a durable authenticated verification contract. #4/#29/#35 remain open.
