# P1 #4/#29/#35 — read-only origin cutover preview contract (1 November 2026)

**DISCOVERY / RESEARCH ONLY — NOT APPROVED OR IMPLEMENTED.** WEB 18.67 remains unchanged. This is a proposed *decision interface*, not a migration, restore, encrypted-file import, source freshness guarantee, or user-data operation. Do not silently choose a source, synchronize histories, merge records, reset or delete either origin.

## Why a read-only preview is needed

The actual archived WEB 18.33 AES-GCM writer can keep editing the old origin after the current application has rechecked storage. [Independent-origin browser experiment](WEB_DISTINCT_ORIGIN_LEGACY_ISOLATION_PROBE_20261101.md) shows direct Web Storage and IndexedDB isolation, **not** a way to discover whether the old origin received newer edits. A user-selected backup is a snapshot, not proof that it is the newest snapshot.

The new disposable Chromium assertion in `tests/browser-distinct-origin-legacy-isolation-research.cjs` starts with **identical synthetic ledger states** at two origins, then saves a different state in the old origin. The new-origin KEY/PAYLOAD bytes remain identical to their pre-edit values; old and new transaction IDs diverge. This **does not** transfer encrypted files or prove any real cutover; it makes the *two-history* hazard reproducible.

## Proposed read-only status contract (no writes)

| State | Evidence needed | Neutral user-facing wording (candidate only) | Permitted next action |
| --- | --- | --- | --- |
| No file selected | Nothing selected; old-origin data cannot be read cross-origin | „Alege un fișier de backup criptat pentru verificare. Datele din fila veche nu sunt sincronizate.” | Select file or cancel; no storage mutation |
| Unreadable / wrong password / unsupported schema | Authentication or schema validation fails | „Nu putem verifica acest fișier. Datele existente nu au fost modificate.” | Retry with another file; no empty-vault fallback |
| Verified snapshot, freshness **unknown** | User-selected encrypted file authenticated and validated; provenance/last-edit not independently proven | „Fișierul poate fi citit. Nu putem confirma că include ultimele modificări din celelalte file.” | Show **read-only** counts, account list, date coverage, explicit origin labels; cancel |
| Possible divergence | User reports old tab still open/edited, or independent histories already exist | „Există posibilitatea a două istorice diferite. Nu sunt combinate automat.” | Export both independently for future manual comparison; do not select winner automatically |
| Commit blocked / interrupted | Storage denied, IDB transaction aborted, browser terminated, stale destination, unknown result | „Operațiunea nu este confirmată. Verifică starea înainte de a reîncerca.” | Read-only inspect and preserve both locations; no destructive retry |
| Committed (future, NOT currently available) | A separately approved atomic protocol verifies durable target commit and exact expected revision | „Datele au fost confirmate în această locație.” | Continue only after separate release/acceptance; **not** a claim that old-origin edits stopped |

Never display “latest”, “synchronized”, “all data transferred”, “safe to delete old data”, or “committed” solely because decryption succeeded, a filename/date looks recent, or the target origin has different storage keys.

## Proposed user journey (for explicit approval later)

1. Show **old and new HTTPS origin addresses** and explain they keep independent local histories; no server upload, banking integration or cross-origin background synchronization.
2. Let the user choose an encrypted file **locally**; authenticate it with the existing supported format, validate schema, and show a read-only summary of transaction count, accounts, date range, and any known backup timestamp. Label timestamps as *file metadata*, not source-of-truth freshness.
3. Warn explicitly that a cached old tab may have accepted edits **after** the file was created. Ask the user to check/close old editing tabs; this is guidance, **not** a technical fence. Never silently read old-origin storage or claim old tabs were closed.
4. If the new origin already contains a ledger, present **two distinct histories**; do not import, overwrite, append, merge or replay without a separate contract. Allow cancel without mutation.
5. Only after user approval of a distinct origin, retention policy, backup compatibility and atomic commit design could an implementation be proposed. Keep the old origin intact by default. Rollback must not silently replace a newer history.

## Adversarial acceptance matrix (future tests; not claimed complete)

- Cached old tab writes **before, during and after** snapshot creation; show that a target-origin view cannot infer the later old edit and must not claim freshness.
- Two independently edited origins with overlapping IDs and different transactions: no automatic merge, duplicate elimination, overwriting or “winner”.
- Wrong password, corrupt/tampered file, unsupported version, user cancellation, empty or KEY-only footprint: no destination writes and no interpretation as an empty valid vault.
- IDB quota/permission failure, blocked versionchange, tab reload, browser crash before/during/after commit: no false “committed” message; explicit unknown state and safe inspection.
- Browser-profile switch, offline PWA, storage eviction and separate Safari iPhone profiles: do not claim cross-profile portability or persistence from Chromium alone.
- Keyboard, screen-reader, 200% text/native zoom, 320/390px light/dark: source and destination labels, cancel and errors must be accessible; Safari/VoiceOver evidence required separately.

## Nonurgent linked discovery: #25 and #14

A card issuer's **positive credit** (e.g., 5 RON from a 25 RON payment against 20 RON debt) is not the same as 5 RON of checking cash. A future read-only budget perspective must not count it as both a card asset and liquid cash. This is an **unapproved contract example**, not a formula change; see [#14 numeric matrix](WEB_BUDGET_REMAINING_PERIOD_CONTRACT_20261101.md) and [#25](https://github.com/nikopol000/financial-autonomy-preview/issues/25). No card-balance semantics or budget modes are implemented here.

## Decision needed before any product change

Approval must explicitly cover the independent production HTTPS origin, the exact encrypted-file handoff and compatibility, source freshness policy, old-origin retention, conflict/divergence behavior, rollback, destination-existing-ledger handling, and crash-safe commit/acknowledgement. Until then, this work remains **test/documentation only**; #4/#29/#35 OPEN.

Browser references: [MDN same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), [MDN Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API), [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).
