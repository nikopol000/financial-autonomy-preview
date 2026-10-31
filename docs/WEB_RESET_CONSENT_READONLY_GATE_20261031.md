# WEB reset/restore consent: read-only evidence binding (2026-10-31)

**Status: RESEARCH ONLY — NOT A PRODUCT FIX OR APPROVED DESTRUCTIVE CONTRACT.**
Scope: issues [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35). This is an isolated Node 22 model, not imported by the WEB 18.66 bundle, and not a password-checking, reset, migration, backup or restore implementation. It uses synthetic evidence only; no real financial data, iOS, encrypted backup format or accounting formulas are touched.

## Why this gate is needed

The active v1 reset flow writes a localStorage marker and then removes encrypted payload/key separately. A crash, quota/security fault, cached old writer or a second tab can leave ambiguous evidence. A **typed confirmation alone is not proof** that the data still match the screen the user saw. A delayed password verification, storage inspection or another tab can make that confirmation stale before the destructive action begins. Existing research confirms that a complete same-origin rollback can preserve internally consistent, authentic but old data; a local digest cannot establish global freshness.

The new [nine-case executable model](../tests/vault-v2-reset-consent-boundary-research.cjs) checks a **non-destructive preview gate**, not deletion authorization. The only positive result is `READY_FOR_DESIGN_REVIEW`, deliberately **not** `ALLOW_RESET`; there is no `commit` function and an injected `onWrite` callback is rejected. `audit.writes` stays zero. The typed phrase `ȘTERGE DATELE LOCALE` is illustrative test data, **not approved UI wording**.

## Read-only consent proposal (not approved)

1. Enter a dedicated blocked state with a factual status. Do not claim that absent/evicted/denied IndexedDB means an empty ledger; preserve all surviving ciphertext, keys, markers and evidence.
2. Show the consequence of a *proposed* reset or restore and distinguish it from non-destructive retry/export. Require an independently verified, user-selected recoverable source where appropriate. Merely checking a `backupVerified` checkbox is **not** actual cryptographic verification; the test mocks this precondition.
3. Collect an explicit operation-specific phrase and separate proof of control (future authenticated source/password validation). The Node test's `authenticate()` returns synthetic booleans and does **not** validate PBKDF2/AES-GCM backups or hold real passwords.
4. Take a read-only evidence snapshot. After asynchronous proof, acquire a cooperating origin-wide exclusive lock and **reinspect**. Cancel/supersede requests by monotonic epoch. If evidence, status, storage access or operation context changes, return `BLOCKED` and require a fresh user decision. A hash of evidence is an equality check, not an authentication or anti-rollback primitive.
5. Even if these checks pass, **do not delete, merge, replay, rekey, resurrect, select a ledger, unlock editing or auto-restore**. A separate reviewed transaction protocol and explicit user approval are prerequisites. No implementation of a destructive callback is provided by this model.

## Nine executable cases

| Scenario | Required research result |
| --- | --- |
| Stable synthetic conflict, explicit phrase, mocked verified source and proof | Read-only design review only, zero writes |
| No Web Locks, missing exact phrase, unverified backup or wrong source | Block before inspecting |
| Authentication failure or storage SecurityError | Block, preserve evidence |
| Archived writer changes ciphertext between preflight and locked reinspection | `EVIDENCE_CHANGED`, zero writes |
| User cancels while asynchronous proof is pending | `STALE_REQUEST`, late proof ignored |
| Second inspection supersedes first | Only latest result eligible for review |
| Missing/evicted/unknown evidence | `UNVERIFIABLE`, no initialization |
| Attempt to supply destructive callback | Rejected by constructor |
| Fully rolled-back but internally consistent origin | **Negative boundary:** local review can pass; still no mutation or freshness claim |

## Alternatives and decision

- **A. Typed phrase then delete:** reject. The displayed snapshot can become stale; confirmation is not concurrency control.
- **B. Snapshot + proof + locked reinspection + explicit operation-specific consent:** recommended **necessary precondition for further design**, not sufficient to ship. A noncooperating cached v1 tab ignores the new lock, and independent localStorage/IndexedDB writes are not atomic.
- **C. Automatically complete/reset on ambiguous marker:** reject for future v2 recovery. Do not interpret a marker as fresh user consent for a new operation; investigate the existing v1 committed-reset behavior separately before changing it.
- **D. Ask the user to choose a verified encrypted backup:** potentially useful recovery path; selection must never silently overwrite origin data. Backup authentication and a safe transactional commit/acknowledgment protocol require separate tests.

## Before any WEB release

Prove actual v1/v2 cross-tab and cached-writer behavior, real AES-GCM source validation, password failure, backup import, tab close/reload, IDB denied/evicted/corrupt, no-Web-Locks, aborted and postcommit writes, stale asynchronous completions, browser crash, and accessible iPhone Safari/VoiceOver states. Resolve authority/provenance and full-origin rollback limits honestly. Define expected outcomes and user-visible consequences for reset vs restore; obtain explicit approval of any new destructive semantics. Only then implement an immutable versioned bundle and follow RELEASE_PROCESS.md (syntax, release, CI, Vercel exact SHA, served browser). The currently blocked Vercel build quota is **not** bypassed.

## Evidence and references

- [Existing conflict UX research](WEB_V2_CONFLICT_RECOVERY_UX_CONTRACT_20261029.md).
- [Full-origin rollback limitation](WEB_FULL_ORIGIN_ROLLBACK_LIMIT_20261031.md).
- [Unsupported IDB and late inspection results](WEB_READONLY_UNSUPPORTED_IDB_LATE_RESULT_GATE_20261031.md).
- [MDN Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) — coordinating participating tabs does not fence archived noncooperating code.
- [MDN IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction) — atomicity applies to a transaction, not arbitrary localStorage/IDB combinations.

**Next step:** replace mocked preconditions with a *read-only* real-browser inspection and authenticated backup-verification fixture; reproduce a cached-v1 late writer between proof and commit boundary. Keep all destructive actions disabled until the operation contract and regression suite are approved.
