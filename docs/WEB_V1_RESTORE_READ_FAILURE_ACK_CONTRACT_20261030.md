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
