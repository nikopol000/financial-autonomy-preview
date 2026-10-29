# WEB #4 — sealed v2 authority research, 2026-10-29

**Research-only / not production.** The active WEB 18.62 bundle, HTML, financial formulas, real ledger, portable encrypted backups and iOS are unchanged. Existing v1 cached-tab overwrite and post-reset resurrection remain **KNOWN UNSAFE**.

## Why this experiment

The earlier `tests/browser-v2-restore-research.cjs` prototype stores an **unauthenticated JSON authority**. Chromium research confirmed that changing its `status` to `reset` can hide a valid encrypted ledger, and that changing `epoch` is accepted. A stage digest alone does not authenticate authority metadata.

This candidate tests **AES-GCM-sealed authority metadata** with `schema/status/revision/epoch/stage/digest` inside the ciphertext, and separately AES-GCM-encrypted immutable stages. The research key is generated locally and stored in the simulated origin. A single authority-key write selects the active state; older stages are retained for possible *explicit* recovery. Reset commits an encrypted tombstone rather than deleting the legacy vault.

Source: `tests/vault-v2-sealed-authority-research.cjs` (Node WebCrypto, disposable Map-backed fault-injection storage, synthetic transactions only).

## Six deterministic assertions

1. Replacing the encrypted authority with a plain forged `reset` JSON **fails closed**; restoring the original authority reveals the untouched stage.
2. Bit-flipping the authority ciphertext fails authentication, with **zero writes by the reader** and no fallback to v1.
3. Altering a staged envelope fails digest verification; the v1 bytes are retained.
4. An injected **persist-then-throw** during reset leaves a readable durable reset tombstone; a subsequent synthetic legacy write cannot reactivate v2, and a stale commit is rejected.
5. A failure **before** authority persistence leaves the previous committed ledger visible; an orphan stage is not authoritative.
6. **KNOWN LIMITATION:** replaying an older *valid* encrypted authority makes its earlier retained stage visible. Restoring the latest authority restores the latest ledger. Sealing authenticates metadata but does **not** establish freshness.

Local syntax check and `node --test` completed with **6/6 PASS** before opening the PR. GitHub CI and merged-main verification are separate gates.

## Interpretation and boundaries

- This prototype is **not** a production storage protocol, browser acceptance test, backup migration, or protection against a hostile same-origin script. The key lives in the same origin; code with access to that key can forge a new sealed record. There is no trusted external monotonic counter, so full-origin rollback remains indistinguishable from an earlier valid state.
- Map-backed fault injection models only selected setItem failures, not real browser cross-process localStorage visibility, quota behavior, transaction isolation, Safari, power loss, or crash durability.
- No Web Locks or compare-and-swap across competing browser processes is implemented in this prototype. The `expectedAuthority` comparison is **not** an atomic cross-tab guarantee.
- The example does **not** establish how an existing v1 encryption key and encrypted portable backup are safely migrated, how orphan-key/payload-only remnants are recovered, or how v1 divergence is shown without silent merging. It intentionally retains the legacy bytes and prior stages.
- A full stage history needs a bounded retention/backup policy; automatic cleanup would be unsafe until explicit recovery is designed.

## Alternative approaches / decision for next research

**A. Sealed authority + immutable encrypted stages** (this experiment): detects accidental/unauthenticated pointer alteration and supports retained-stage recovery, but cannot prevent valid-record replay, old-tab writes or same-origin key misuse.

**B. Single sealed ledger+status envelope:** reduces pointer/stage split and multi-key failure windows, but replacing a single envelope can destroy the prior revision unless a separate durable history is retained.

**C. IndexedDB transactional commit:** improves atomicity for cooperating new-version tabs, but archived v1 localStorage writers ignore its transactions; complete-origin rollback still remains possible.

**Research recommendation:** compare A and C under real Chromium two-tab, actual archived 18.27/18.33/18.34 interleavings and interrupted migration, while retaining a non-destructive recovery route. Do not ship a migration until key provenance, portable v1 backup compatibility, crash/reload, orphan-key recovery, divergence UX, Safari and screen-reader checks are demonstrated. Unknown or unverifiable authority must block mutations; never auto-recreate an empty ledger or silently reimport v1.

Related: [issue #4](https://github.com/nikopol000/financial-autonomy-preview/issues/4), [issue #29](https://github.com/nikopol000/financial-autonomy-preview/issues/29), [issue #35](https://github.com/nikopol000/financial-autonomy-preview/issues/35), `docs/WEB_V2_FORGED_RESET_RESEARCH_20261029.md`.

**Issue #14 remains DISCOVERY ONLY**: no budget modes, financial formulas or semantics changed or approved.

## Two-tab Chromium follow-up — PR #244 (verification pending)

The next experiment is `tests/browser-v2-sealed-authority-research.cjs`, run in Chromium on a disposable localhost origin with **two real tabs** sharing localStorage, Web Locks and browser WebCrypto AES-GCM. Its inputs are **synthetic only**. The browser script is wired to the existing Chromium workflow; its result must be confirmed from the exact candidate workflow and named PASS lines before describing any observation as verified.

The six named checks are: (1) sealed stage/authority cross-tab round-trip; (2) forged plaintext reset rejected with zero reader writes; (3) synthetic legacy payload mutation during a held staged commit rejects promotion and a divergent reset; (4) reset authority persisted before an injected throw remains authoritative after reload and later legacy writes; (5) **KNOWN UNSAFE** replay of a valid pre-reset sealed authority resurrects a retained earlier stage; and (6) key disappearance fails closed and restoring the original key restores readability.

**Scope and threat model:** The synthetic legacy mutation is a direct localStorage write, **not** an execution of archived WEB 18.27/18.33/18.34 JavaScript. Those actual cached modules were exercised separately in `tests/browser-archived-v2-interleavings-research.cjs` against the *unauthenticated* v2 prototype. This follow-up does not yet combine actual archived modules with sealed authority. The lock protects only cooperating v2 writers; archived clients do not participate. A v2 legacy-fingerprint check is a divergence detector, not a durable anti-rollback counter. Full-origin rollback, same-origin key access, Safari crash durability, portable backup recovery, key provenance and user-visible conflict resolution remain unresolved. **Never use a successful research test as approval to deploy v2.**
