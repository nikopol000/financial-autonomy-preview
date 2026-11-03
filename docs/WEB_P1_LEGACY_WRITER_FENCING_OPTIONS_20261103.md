# P1 research — cached legacy writers and reset boundary (2026-11-03)

Status: **DISCOVERY ONLY**. Active product WEB 18.74. No product, vault, backup, formula or iOS changes in this memo.

## Observed baseline

- Repository HEAD at start: `d25d107a93255bc9cdf855259a00db758389899d`.
- Issue #4 documents five KNOWN UNSAFE cached-legacy-client cases: authenticated v1 writers can overwrite a newer ledger even after a v2 commit witness. A green characterization test proves reproducibility, **not safety**.
- Issue #29 documents partial split-key/payload deletion; issue #35 documents an ambiguous KEY-only footprint. Neither authorizes deletion or rekeying.
- Public preview fetch attempted on 2026-11-03 but was inaccessible from the available web fetcher; served HTML/header and Safari/VoiceOver remain unverified. Previously verified Vercel READY on product SHA `4c196b36343cfa1585f6737a64e64060d09d80f5` is metadata evidence only.

## Alternatives and limits

| Option | Advantage | Critical limit |
| --- | --- | --- |
| BroadcastChannel/storage event warning | Informs cooperating open tabs quickly | Cached clients may ignore the message; cannot fence writes. |
| New version marker in localStorage | Modern clients can fail closed before mutation | Cached legacy code does not check it; check/write is not atomic. |
| Web Locks | Serializes cooperating modern tabs | Legacy clients may not request the lock; cannot protect against them. |
| Separate versioned encrypted record | Reduces accidental same-key overwrite across versions | Does not prevent old clients from writing old record or ambiguous rollback; needs migration, read-source and reset contracts. |
| IndexedDB transaction for new envelope | Atomic within its own transactional store | Old localStorage writers remain outside transaction; cross-store migration is not atomic. |
| Server-side lease/fencing | Could reject obsolete writers | Violates local-only/no-backend requirement; excluded. |

**Recommendation for investigation:** do not claim any client-side marker or Web Lock can reliably fence arbitrary already-cached v1 code. Prototype a *read-only* versioned-store isolation boundary using synthetic encrypted fixtures; explicitly characterize old-writer-after-new-commit, tab reload, partial reset, origin rollback, backup restore and offline startup. Keep the existing record recoverable until the approved transition can be proven. Never silently select newest, merge, delete, regenerate a key, or resurrect after confirmed reset.

## Deterministic acceptance matrix before implementation

1. Old v1 writer after v2 candidate commit: old ciphertext may change, but v2 authenticated record and selected source must remain unchanged; no silent replay.
2. Old v1 reset after v2 commit: no automatic resurrection or destructive cleanup; ambiguous state blocks writes.
3. Partial reset at every localStorage remove and IDB transaction boundary: distinguish authenticated committed/unchanged from unknown; never report success on unknown.
4. KEY-only, PAYLOAD-only, corrupt ciphertext and missing IDB: fail closed, preserve bytes, explain uncertainty.
5. Two modern tabs and one legacy tab, repeated writes, page reload, offline and storage-denial injections: no claim of atomicity without corresponding proof.
6. Backup/export/import compatibility and explicit user-facing recovery semantics require separate approval before production change.

## Decision gate and next step

No recovery or migration contract has been approved. Next: create a synthetic-only test harness for the archived v1 writer versus isolated v2 storage and document exact bytes, authenticated state, and fail-closed UI outcome after each injected fault. If evidence supports an approach, present explicit transition/reset/recovery contract for approval before modifying live vault behavior. Prioritize P1 over visual polish; issue #14 budget perspectives remain DISCOVERY without formula or mode changes.

Sources: [#4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [#29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [#35](https://github.com/nikopol000/financial-autonomy-preview/issues/35), [reset finalization matrix](https://github.com/nikopol000/financial-autonomy-preview/blob/main/docs/WEB_RESET_FINALIZATION_BOUNDARY_GATE_20261030.md).
