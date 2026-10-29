# WEB #4 — forged v2 reset authority and malformed-pointer recovery (2026-10-29)

**Scope:** research-only disposable Chromium test; WEB product 18.62 is unchanged. This is **not** a shipped mitigation, a demonstrated remote exploit, or evidence of real-user data loss. Source test: `tests/browser-v2-restore-research.cjs`, added on branch `research/v2-authority-forgery-20261029`.

## Hypothesis / synthetic experiment

The existing research protocol stores a plain JSON authority pointer containing `schema`, `status`, `stage`, `digest`, `legacy` and `epoch`. The stage is encrypted with AES-GCM, and its SHA-256 digest is checked, but the authority pointer itself is not authenticated. Prior research already showed an older valid pointer can be replayed and `epoch` changed.

New scenario A: after a valid committed synthetic ledger `['A','B','C']`, a same-origin test script replaces only the authority JSON with `{"schema":2,"status":"reset","epoch":"forged-reset"}`. The research reader accepts `reset` before validating any stage. **Expected current weakness:** the valid ledger becomes invisible in normal reads despite unchanged encrypted stage. Restoring the original authority pointer makes the original ledger readable again. This is a **visibility/authority forgery**, not proof the ciphertext was deleted. The test asserts both effects explicitly.

New scenario B: replace the pointer with malformed JSON. **Expected behavior:** reading fails closed (parse error), a restore using the prior expected authority is rejected with zero protocol writes, and the previously committed encrypted stage remains readable after the original pointer is restored.

Both scenarios deliberately mutate same-origin localStorage in a synthetic research origin. They are **not** normal actions of archived WEB 18.33/18.34, nor full archived UI or Safari tests. A green characterization test confirms the behavior exists, **not** that it is fixed.

## Architectural alternatives and recommendation for review

1. **Authenticated single envelope** binding status, stage digest, revision and epoch to the encrypted payload: reduces independent mutable fields and detects casual/accidental pointer alteration; requires explicit reset tombstone verification and a recoverable old envelope. Does not stop full-envelope replay.
2. **MAC over authority with key retained on the same origin:** detects unkeyed corruption but is not a trustworthy defense against malicious same-origin JavaScript that can read or use the key; key provenance, rotation and recovery become additional failure points. Do not advertise anti-rollback.
3. **IndexedDB transactional authority + staged encrypted records:** improves cooperating-tab atomicity and durability, but cached legacy localStorage writers remain outside the transaction, and full-origin snapshot rollback remains possible.

**Recommended research direction:** authenticate/bind the *meaning* of `active` versus `reset` to an encrypted durable state, retain prior verified stage(s) for explicit non-destructive recovery, and require revision checks under Web Locks for cooperating v2 writers. Unknown/invalid records should block financial mutations and offer encrypted export/diagnostic, not silently load v1 or create a new empty ledger. Never automatically delete v1 on migration.

**Fundamental boundary:** with local-only storage and no trusted external monotonic state, an exact rollback of the complete local state cannot be distinguished from its earlier valid state solely from those bytes. Do not promise full anti-rollback or complete observation of old-tab edits. A cryptographic MAC by itself does not fix that.

## Release gates before product changes

- Confirm named Chromium PASS lines and GitHub Actions on exact PR SHA, then merged-main CI.
- Add research tests for authenticated reset, tampered status, old valid pointer replay, stage deletion, write-then-throw and crash/reload; test with real archived 18.27/18.33/18.34 writers and observable divergence.
- Define explicit user-facing conflict and restore contract, encrypted backup compatibility, key-only/payload-only recovery, Safari/VoiceOver acceptance, and rollback path.
- **No product migration, formula changes, v1 deletion, real data access, backup format change, iOS, backend, login, telemetry or bank connection** in this research batch.

Related: issues #4, #29, #35; `docs/WEB_V2_AUTHORITY_RESEARCH_20261028.md` and `docs/WEB_V2_BACKUP_RESTORE_CONTRACT_20261028.md`.
