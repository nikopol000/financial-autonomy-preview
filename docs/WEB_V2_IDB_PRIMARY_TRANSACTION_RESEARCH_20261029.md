## Follow-up: v1 SHA-256 fingerprint divergence gate — candidate 2026-10-29

**Test-only, not a production migration or a completed P1 fix.** The IndexedDB-primary research now captures a SHA-256 fingerprint of the *exact* legacy v1 localStorage key/payload pair at explicit cutover. The digest (not the raw v1 key) is stored alongside the encrypted IDB record. Subsequent reads and destructive writes compare the current pair against the stored fingerprint; a mismatch fails closed. The writer also synchronously rechecks the exact legacy pair inside the IDB readwrite transaction after asynchronous cryptographic preflight. It does **not** delete, repair, import or merge the v1 pair.

The Chromium suite now tests actual archived 18.27, 18.33 and 18.34 AES-GCM writers, their post-cutover ciphertext drift, mixed key/payload partial-fault pairs, a synthetic change injected between asynchronous preflight and IDB commit, and byte-for-byte preservation of the IDB record on rejection. A deliberately restored original v1 pair is accepted again in this isolated model; **that is not proof of freshness**, and it highlights the inability to distinguish valid full-pair rollback. CI verification: **pending** until workflow evidence is inspected.

**Known limits:** the old cached tab can still write immediately after the final synchronous check, and there is no cross-store atomic transaction. A v1 key/payload pair restored together to the cutover fingerprint defeats this witness; an origin-wide rollback also defeats local monotonicity. A digest does not authenticate the provenance of a v1 key, and localStorage can be denied or evicted. No Safari, real interruption, actual portable backup, or end-user conflict/recovery acceptance has been demonstrated. The old WEB 18.62 production vault remains unsafe. Future acceptance must include repeat checks on every read/write, explicit non-destructive quarantine/recovery, key provenance, backup roundtrip and no silent reimport after reset.

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

## Follow-up: preflight integrity and storage-denial research (2026-10-29)

The original concurrency model checked the numeric revision inside the transaction but **did not authenticate the previously stored encrypted record before replacing it**. A caller holding the current revision could therefore overwrite damaged ciphertext with a reset, obscuring a potentially recoverable original. The revised **test-only** writer now:

1. Reads the existing sealed record and decrypts/validates its status **before** any write transaction. Corrupt ciphertext returns `unreadable-authority`; invalid revision returns `invalid-authority`. Neither is treated as an empty ledger.
2. Performs encryption before opening the transaction (WebCrypto awaits can cause an IndexedDB transaction to become inactive).
3. In the readwrite transaction, compares both expected revision **and the exact previously observed record** before committing. A changed same-revision envelope is rejected as `authority-changed`; there is no silent merge.
4. Requires an explicit `allowInitialize:true` only for the first empty synthetic database. Missing authority after reset/eviction returns `missing-authority`, not an automatic fresh vault.
5. Characterizes IndexedDB API denial as an error that leaves the previously committed tombstone unchanged in another tab.

Three new Chromium assertions were added for (a) corrupted ciphertext/reset refusal and byte-for-byte preservation, (b) deleted authority/implicit initialization refusal, and (c) denied IndexedDB open/no tombstone modification. **CI evidence is pending for this follow-up until the candidate workflow completes.** These tests do not prove quota, eviction detection across origins, real power-loss durability or Safari behavior.

**Critical residual risk:** the explicit initialization flag is not itself proof of first-ever use; a user action, trustworthy recovery state and portable encrypted backup contract are still required. A fully rolled-back valid record remains readable. Cached WEB 18.27/18.33/18.34 writers still target localStorage and are not protected by this synthetic IndexedDB-only model. Do not ship the model as a production fix.

**Next:** test actual archived v1 modules against a staged IDB cutover and the backup/key migration contract; include transaction abort, same-revision envelope replacement, corrupt authority, missing IDB and nondestructive recovery screens. Keep WEB 18.62 and all financial semantics unchanged.

## Real archived WEB v1 writers versus IDB-primary (2026-10-29 candidate)

**Research characterization; not a protection.** The same disposable Chromium origin runs the actual immutable Metro platform/vault/crypto modules of WEB 18.27, 18.33 and 18.34, with only a synthetic financial model substituted. A legacy tab first writes a real AES-GCM v1 key/payload pair. The isolated IDB-primary prototype then explicitly initializes an encrypted synthetic state. The archived tab loads and writes another v1 transaction, changing the ciphertext. The IDB prototype can still read its own staged record and **currently permits an IDB reset without inspecting the changed v1 pair**.

The test deliberately asserts this **KNOWN UNSAFE migration gap** for all three archived versions. A passing test proves the gap exists, **not** that the reset is safe. Unlike the earlier sealed-localStorage authority prototype, the atomic-IDB research currently has no recorded v1 fingerprint, provenance/authority cutover state or divergence check. Neither database isolation nor AES-GCM prevents the cached client from changing the v1 ledger.

**Required contract before any production migration:**
1. Capture and authenticate the exact legacy key/payload pair at a reviewed cutover point; retain recoverable encrypted originals and never infer that a missing pair means a fresh vault.
2. On every destructive IDB operation, explicitly compare the observed legacy pair with the cutover fingerprint and **block with no writes** when it diverges. Define how legitimate older clients, imported backups, key-only or payload-only faults, and a completed intentional reset are distinguished.
3. Provide a non-destructive conflict screen with understandable choices (inspect/reload, encrypted export, explicit restore) and no automatic merge or reimport. Validate with actual browser behavior and accessible mobile UI.
4. Repeat with injected writes during migration, crash/reload, denied/evicted IDB, quota errors, backup restoration, Safari iPhone and VoiceOver. Document that full-origin rollback remains outside the guarantees of a local-only origin.

**Verification:** candidate source and JavaScript syntax were checked before the GitHub commit. Chromium/Release CI and named PASS lines must be checked independently; until then this is an unverified test candidate. No WEB product bundle, version, formula, real data, backup format or iOS source changed.

## Verification of archived v1 / IDB reset characterization

[PR #255](https://github.com/nikopol000/financial-autonomy-preview/pull/255) merged as `795f57e5968838d9e8d2f2cde1ef76b30c824dc4`. Candidate [Chromium #40839463565](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40839463565) **SUCCESS**; job `123332049539` contains three named `PASS KNOWN UNSAFE` assertions for archived WEB 18.27, 18.33 and 18.34. [Release #40839463830](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40839463830) **SUCCESS**. Each PASS means the experimental IDB reset **incorrectly succeeds despite changed v1 ciphertext**. The experiment is not a mitigation. Merged-main/checkpoint CI, actual iPhone Safari, portable encrypted backup and production migration are **not verified**.
