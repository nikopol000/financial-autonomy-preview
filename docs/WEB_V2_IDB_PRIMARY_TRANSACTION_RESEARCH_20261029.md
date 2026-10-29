# WEB #4 — transactional IndexedDB primary authority research (2026-10-29)

**RESEARCH ONLY.** This is a disposable synthetic Chromium model, not the production WEB 18.62 vault, not a migration, and not a data-security guarantee. No real financial ledger, encrypted backup, iOS repository, financial formula, or product bundle is accessed.

## Question

The prior [independent-witness experiment](WEB_V2_IDB_WITNESS_RESEARCH_20261029.md) used a two-store commit: sealed immutable stages and an authority pointer in localStorage, with an IndexedDB witness written first. It detects a localStorage-only replay but can quarantine after an interruption between stores. Would storing the current encrypted authority and state **together in a single IndexedDB readwrite transaction** reduce torn writes and stale-tab lost updates?

## Research model and test contract

`tests/browser-v2-idb-atomic-primary-research.cjs` opens two Chromium tabs on a disposable localhost origin. Both tabs use the same IndexedDB object store `vault/current`. Each proposed state is encrypted with AES-GCM *before* starting the IDB transaction. The transaction reads the latest revision and either writes the new sealed record at revision +1 or aborts without writes. An intentional reset is a committed **encrypted tombstone**, not a deletion of the last recoverable record in the middle of an operation.

The AES-GCM key is a **fixed test-only value**, so the experiment does **not** establish key provenance, key loss behavior, cryptographic security, or portable backup compatibility. The revision field is not independently authenticated in this test. This is deliberately a concurrency and atomicity characterization, not a proposed final production schema.

Acceptance cases (CI evidence must be verified separately):
1. Initial encrypted state is readable from a second Chromium tab.
2. Two concurrent writers with the same expected revision produce **exactly one** successful commit and one stale rejection, with no silent merge.
3. Abort before put and abort after put/before commit leave the previous ledger readable, including during an attempted reset.
4. A committed reset tombstone survives a reload.
5. A stale pre-reset writer cannot overwrite that tombstone.
6. Deliberately restoring a **valid older complete IndexedDB record** exposes the old ledger — **KNOWN UNSAFE**. A same-origin database has no trusted monotonic freshness oracle.

## Comparison and decision

| Approach | What it simplifies | New costs / still unsafe |
| --- | --- | --- |
| A. IndexedDB primary encrypted record in one transaction | Atomic read/check/write within one store; no cross-store witness/pointer torn commit; serializes cooperating readwrite transactions without Web Locks | Old cached WEB v1 still writes localStorage; key provenance, eviction, IDB denial, Safari support, migration, backups and full-origin rollback unresolved; IDB commit is not guaranteed disk flush |
| B. localStorage sealed pointer + independent IDB witness | Detects localStorage-only authority replay; encrypted witness can support explicit reviewed recovery | Two-store interruption causes quarantine; extra encrypted copies and cleanup; coordinated rollback succeeds |
| C. localStorage single-key envelope with retained history | Simplifies individual write/delete and legacy integration | No true multi-tab compare-and-swap; cached clients can still overwrite; rollback and quota limits |

**Provisional recommendation for further investigation:** A is structurally simpler for a *future* v2 primary store than B, provided a compatible, nondestructive migration and explicit blocked/recovery UX can be proven. **Do not ship** this model or declare the production #4 issue fixed. A single IDB transaction does not make old v1 clients cooperate, prove durable flush, or stop a valid full-origin rollback.

## Next acceptance gates

- Use **actual archived** WEB 18.27/18.33/18.34 writers against the candidate migration and prove their localStorage edits cannot silently replace the new IDB ledger or reimport after reset.
- Define authenticated key provenance and encrypted backup restore, especially orphan-key #35 and partial reset #29. Keep a recoverable encrypted original until explicit user-confirmed migration completion; no automatic deletion.
- Test denial/quota, missing database, corrupt ciphertext, transaction abort at each boundary, tab crashes, reload, private browsing, browser eviction and actual Safari iPhone; distinguish Chromium synthetic exceptions from real power-loss evidence.
- Specify nonjudgmental blocked/conflict UX with explicit export/restore choices and **no automatic merge**. Validate screen-reader labels, enlarged text and touch targets (#85).
- Only after a reviewed storage contract, verified tests and interactive browser acceptance consider an immutable versioned product release. No formula or issue #14 mode change is authorized.

References: [MDN IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction), [MDN IDBDatabase.transaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction), [MDN Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).

## Verification

Candidate Chromium/Release CI: **pending at document creation**. A PASS for the final known-unsafe rollback case confirms the limitation, **not** a security mitigation.
