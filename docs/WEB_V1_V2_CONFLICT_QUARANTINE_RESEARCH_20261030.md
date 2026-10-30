# WEB 18.64 — read-only v1/v2 conflict quarantine research (2026-10-30)

**RESEARCH / TEST ONLY — NOT SHIPPED.** P1 #4/#29/#35 remain OPEN. No migration, recovery UX, backup format, financial formula, product bundle, or iOS change is authorized by this experiment.

## Threat and acceptance boundary

The test-only IndexedDB migration retains the original AES-GCM v1 localStorage KEY/PAYLOAD. A previously loaded/cached v1 tab may still write to that legacy pair after the new IDB authority is committed. The new authority and its operation witness can remain internally valid while legacy data diverges. An IDB transaction cannot fence a client that never opens that database.

The added disposable Chromium scenario evaluates a **read-only** classifier. It requires a verified v2 operation witness, decrypts and authenticates the current v1 envelope, and compares its exact bytes to the pre-migration snapshot. It returns:

- `legacy_matches_snapshot`: authenticated legacy ciphertext bytes equal the snapshot. **Not a proof of newest history, nor that no intermediate write occurred.**
- `authenticated_legacy_divergence`: legacy ciphertext authenticates, but differs from the pre-migration snapshot. **Quarantine both copies; do not auto-select, overwrite, merge or delete.**
- `unknown`: missing/corrupt/unreadable v1, missing/unverifiable IDB operation witness or denied access. **Fail closed and preserve evidence.**

The baseline is supplied by the test. A real implementation must bind the baseline fingerprint to authenticated v2 authority, define origin-reset/backup semantics, and handle legacy cached writers; this helper is not production code.

## Synthetic test matrix

1. Successful v1→v2 migration with original legacy bytes intact: classifier reports `legacy_matches_snapshot`.
2. Late v1 write of an additional synthetic transaction: v2 witness remains valid, classifier reports `authenticated_legacy_divergence`; inspection makes **zero legacy writes**.
3. Tampered v1 AES-GCM ciphertext: `unknown`, not automatic preference for v2.
4. Restore exact pre-migration v1 bytes after the late write: `legacy_matches_snapshot` again. **Known anti-rollback blind spot:** local-only snapshot comparison cannot prove that a newer legacy transaction ever existed.
5. Remove v2 operation witness: `unknown`, no reconstruction or repair.

These checks characterize the test-only adapter, not actual archived WEB 18.27/18.33/18.34 code paths or a production browser migration. CI results must be attached after they run.

## Candidate UX contract (not implemented)

If two authenticated but divergent footprints exist, show a neutral, explicit conflict state: “Există două versiuni diferite ale datelor pe acest dispozitiv.” Keep both encrypted copies and provide read-only inspection of provenance and a user-controlled encrypted export path **only after** its safety is tested. Do not label either copy “mai nouă” solely from timestamp, revision or witness. Do not silently choose, merge, delete or retry a restore. If one copy cannot be authenticated, explain that recovery is unconfirmed rather than assuming it is disposable.

## Alternatives and next steps

- **Force the legacy tab to stop through a new IDB lock:** impossible for a cached bundle that does not cooperate.
- **Delete v1 after migration:** destructive if IDB is denied, evicted or rolled back; reject.
- **Dual write to v1 and v2:** two independent storage systems have no shared atomic transaction; reject as an automatic safety claim.
- **Explicit quarantined cutover with preservation and optional user-directed export:** candidate, pending archived bundle tests, reset journal compatibility, Safari/VoiceOver and IDB denied/evicted/full-origin rollback checks.

**First unfinished step:** exercise actual archived WEB 18.27/18.33/18.34 writers in isolated Chromium against this conflict detector, including cross-tab propagation. Then test IDB denial/eviction, origin rollback and accessibility before proposing production integration.

References: [MDN IndexedDB transaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction), [MDN Storage eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [Actual Budget restore](https://actualbudget.org/docs/backup-restore/restore/). These support architectural caution, not a claim that Financial Autonomy is protected.
