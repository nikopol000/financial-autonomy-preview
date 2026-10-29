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

The seven named checks are: (1) sealed stage/authority cross-tab round-trip; (2) forged plaintext reset rejected with zero reader writes; (3) synthetic legacy payload mutation during a held staged commit rejects promotion and a divergent reset; (4) key-only partial legacy writes also block destructive reset; (5) reset authority persisted before an injected throw remains authoritative after reload and later legacy writes; (6) **KNOWN UNSAFE** replay of a valid pre-reset sealed authority resurrects a retained earlier stage; and (7) key disappearance fails closed and restoring the original key restores readability.

**Scope and threat model:** The synthetic legacy mutation is a direct localStorage write; the research fingerprint includes **both** the legacy encryption key and ciphertext, so a partial key-only write also counts as divergence, **not** an execution of archived WEB 18.27/18.33/18.34 JavaScript. Those actual cached modules were exercised separately in `tests/browser-archived-v2-interleavings-research.cjs` against the *unauthenticated* v2 prototype. This follow-up does not yet combine actual archived modules with sealed authority. The lock protects only cooperating v2 writers; archived clients do not participate. A v2 legacy-fingerprint check is a divergence detector, not a durable anti-rollback counter. Full-origin rollback, same-origin key access, Safari crash durability, portable backup recovery, key provenance and user-visible conflict resolution remain unresolved. **Never use a successful research test as approval to deploy v2.**

### Verified outcome — 2026-10-29, PR #244 merged

The candidate with the **seven** named Chromium checks passed in [Chromium #40810592618](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40810592618), job `123239702436`; each of the seven PASS messages was inspected. [Release #40810592597](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40810592597) also succeeded on candidate `a3d60a519d38499aa2e0f0090a5da1fcc441ae14`. [PR #244](https://github.com/nikopol000/financial-autonomy-preview/pull/244) was merged as `c64620578ee1d46cb959a9805243ce938de2abe5`. Exact merged-main workflow verification is separate.

The earlier candidate Chromium run [#40810447295](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40810447295) **FAILED** because the Node-side expected legacy fingerprint was accidentally referenced inside a Playwright browser-evaluate closure without being passed as an argument. The script now passes the fingerprint explicitly, and the final candidate passed. This was a **test-harness bug**, not a product defect or a suppressed failing assertion.

**Safety finding:** In real Chromium, sealed authority blocks unauthenticated plaintext reset and quarantines a missing key; checking both v1 key and ciphertext detects partial legacy writes during staging. But replay of an older **valid sealed active authority after a committed reset** still exposes the old retained stage (**KNOWN UNSAFE**). Encryption authenticates a record, not its freshness. Never claim that this experiment prevents rollback or makes the production WEB 18.62 v1 vault safe. It does not execute archived JS in this new sealed experiment, and it does not test Safari, power loss, backup restore, same-origin adversarial scripts or durable anti-rollback.


## Actual archived WEB 18.27/18.33/18.34 against sealed authority — PR #246, 2026-10-29

[PR #246](https://github.com/nikopol000/financial-autonomy-preview/pull/246) extends the **same isolated** two-tab Chromium test with real immutable Metro 309/310/311 and transitive crypto modules from three archived WEB bundles. Only the financial model 204/205 is stubbed for synthetic transactions. The old writer is in one real Chromium tab; the sealed-v2 experiment is in a second tab with shared browser localStorage and Web Locks. The old writers **do not participate in the new lock**. This is not the WEB 18.62 product.

Five newly named candidate Chromium assertions **PASS** on [Chromium #40815587171](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40815587171), job `123255746720`; candidate [Release #40815587160](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40815587160) also **SUCCESS**, exact PR head `2d726ca8b7bba02cee628dbc8000329585e3d1b6`. The test was squash-merged as `af282a62d6752987c11c9d5cae35907167796776`. Merged-main CI/Pages and the final documentation checkpoint require independent verification.

1. Real archived **18.27** AES-GCM ciphertext mutation while sealed v2 stage is paused rejects promotion, leaving the previously committed sealed ledger readable and showing legacy divergence.
2. Real archived **18.33** write after sealed cutover is detected; a destructive sealed reset returns `legacy-diverged` without writes, while the sealed ledger remains readable.
3. A **synthetic payload-only deletion** after a real 18.33 write leaves the legacy key orphaned; the sealed ledger remains readable and destructive reset is blocked. The partial deletion itself is fault injection, **not** an observed archived-client operation or browser crash.
4. Real archived **18.34**, reloaded after sealed reset, writes to the legacy v1 storage pair; the sealed reset remains authoritative even after modern-tab reload and does not silently reimport v1.
5. **KNOWN UNSAFE:** replaying a previously valid sealed *active* authority after that reset exposes the retained pre-reset stage, despite the later real archived v1 write. Reinstating the reset authority restores the reset view. AES-GCM authenticity is not freshness/anti-rollback.

**Failure disclosed:** initial candidate [Chromium #40815452719](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40815452719) **FAILED** because the new harness omitted `?fa_real=1`; archived 18.33+ then ran in demo mode and did not create a real v1 encrypted pair. The explicit nonempty key/payload assertion caught the invalid test setup. The URL flag was corrected, not the safety assertions, and the full Chromium suite reran green. The harness intentionally asserts both real v1 key and ciphertext exist before each scenario to prevent false-positive research.

**Unresolved:** no durable anti-rollback source, key-provenance/restore contract, full-origin rollback resistance, power-loss durability, portable encrypted backup interop, accessible divergence/recovery UI, or Safari/VoiceOver validation. The v1 production lost-update/reset-resurrection problem remains OPEN. Never auto-delete v1 bytes, auto-import a divergent old ledger, or deploy sealed v2 on this evidence alone. Related #4, #29, #35. Issue #14 stays analysis-only.
