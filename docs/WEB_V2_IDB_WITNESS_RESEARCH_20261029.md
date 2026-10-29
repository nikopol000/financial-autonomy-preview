# WEB #4 — independent IndexedDB witness research (2026-10-29)

**RESEARCH ONLY; not a product release, not a data migration, not a security guarantee.** The current WEB 18.62 real vault and reset behavior are unchanged and remain **KNOWN UNSAFE** for cached legacy tabs. No real financial data, backup, iOS or production origin is accessed.

## Question

A sealed AES-GCM authority record authenticates its contents but does not prove that it is the **latest** valid record. Existing Chromium experiments show that replaying a valid pre-reset localStorage authority can reveal a retained pre-reset stage. Can an independent same-origin IndexedDB witness detect this *localStorage-only* rollback while preserving an explicit recovery route after an interrupted cross-store commit?

## Experimental design

- Two Chromium tabs, isolated disposable localhost origin, synthetic ledger only.
- AES-GCM encrypted immutable stage and authority in localStorage; Web Locks serialize **cooperating** experimental writers.
- IndexedDB object store `witness/latest` contains a SHA-256 digest, revision and the **encrypted authority**. The witness is written **before** updating the localStorage authority pointer. This is a two-store protocol, **not** an atomic transaction.
- Readers require a matching witness and authority, valid sealed authority, matching revision and valid stage digest before displaying a ledger. Missing/mismatched witness **fails closed**, never silently imports v1 or recreates an empty ledger.
- After a witness-first write followed by an injected throw, the old pointer and new witness intentionally disagree. The test requires zero reader writes after reload. A separate, **explicit test-only** repair restores the sealed authority from the witness, preserving the synthetic newer ledger.
- Tests deliberately roll back **both** stores together. That coordinated rollback must remain **KNOWN UNSAFE**: same-origin storage does not provide a trusted monotonic counter.

## Acceptance cases

1. Two-tab sealed round-trip reads the synthetic ledger.
2. Valid **old localStorage authority only** replay after reset is rejected without reader writes; restoring the reset pointer restores the reset view.
3. Stale tab cannot commit a reset against an older authority.
4. Coordinated IndexedDB **and** localStorage rollback exposes the old ledger (**KNOWN UNSAFE**).
5. Injected throw after IndexedDB witness commit and before localStorage pointer update survives reload as **blocked/mismatch**, not an automatic rollback.
6. Explicit test-only pointer recovery from the retained encrypted witness recovers the synthetic newer ledger.
7. Missing IndexedDB witness quarantines the ledger, with zero reader writes.

Source: `tests/browser-v2-idb-witness-research.cjs`, wired to `.github/workflows/browser-vault-smoke.yml`. **Results must be checked in candidate Chromium CI and on merged main before marking any case verified.** Local `node --check` is possible; the local Chromium environment blocked loopback navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so it is **not** a local browser PASS.

## Interpretation and trade-offs

**Advantage:** for an accidental/unauthorized *localStorage-only* valid-pointer replay, an independently retained IndexedDB witness can detect a mismatch that AES-GCM alone cannot. The retained sealed candidate provides material for an explicit, reviewed, nondestructive repair.

**Costs:** an interrupted two-store write can make the ledger temporarily inaccessible; IndexedDB denial, quota, eviction, private browsing, profile migration, and lost witness need a safe UX and backup recovery. Storing the sealed candidate in IndexedDB is a second encrypted copy requiring retention/cleanup and key-provenance review. No automatic fallback to a previous pointer or v1 state is safe by default. A malicious same-origin script can manipulate both stores, and a full-origin rollback remains undetectable.

**Durability:** `IDBTransaction.oncomplete` is not an unconditional guarantee of disk flush. IndexedDB has `strict`/ `relaxed` durability hints; browser support and actual crash/power-loss behavior need separate testing. The prototype uses default durability and injected exceptions, **not** actual power-loss durability testing.

**Legacy clients:** WEB 18.27/18.33/18.34 do not use this IndexedDB witness or new lock. Their writes still need v1 key+ciphertext divergence detection and nondestructive quarantine. This experiment does **not** integrate those archived modules or validate portable encrypted backup compatibility.

**Decision:** do **not** migrate production. Evaluate (A) transactional IndexedDB as the primary sealed store, (B) sealed localStorage with independent witness and reviewed repair, and (C) single-key sealed envelope plus retained history. Require Safari iPhone/VoiceOver, crash/reload and failure-at-every-step tests, v1 portable backup import, key provenance, conflict/recovery UX and actual production browser validation before considering a versioned release.

## Technical references

- MDN, IndexedDB transactions: https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
- MDN, IDBDatabase.transaction() durability options: https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction
- MDN, Web Locks API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API

Related: #4, #29, #35, `docs/WEB_V2_SEALED_AUTHORITY_RESEARCH_20261029.md`. Issue #14 remains DISCOVERY ONLY; no financial semantics/formulas or budget modes were changed.
