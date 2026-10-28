# WEB P1 #4 — encrypted backup and v2 authority recovery contract (research, 2026-10-28)

**DISCOVERY / NOT IMPLEMENTED.** No product vault, backup format, user ledger, UI, iOS, or formula change. This is an acceptance proposal for a future v1→v2 storage migration; do not interpret a green characterization test as a fix.

## Browser-stage legacy divergence gate — PR #234 (candidate, verification pending)

Two new **synthetic Chromium** cases in `tests/browser-v2-restore-research.cjs` expand the browser protocol acceptance matrix:

- A cached-v1-style direct localStorage mutation occurs while a v2 restore holds its exclusive Web Lock. After the other renderer observes the changed v1 payload, the staged restore must reject authority promotion with `changed-during-stage`, leave the prior v2 revision readable and allow an orphan **non-authoritative** stage. This explicitly demonstrates that a Web Lock cannot stop an uncooperative legacy writer.
- Deleting the legacy v1 payload while leaving its key produces a KEY-only tuple. The current v2 authority must remain readable, report observable legacy divergence and reject destructive reset without writes. Neither the missing v1 ciphertext nor the legacy key is automatically repaired or deleted.

**Boundaries:** these writes are *simulated* in a real browser, not executed from archived 18.27/18.33/18.34 JavaScript. Cross-renderer visibility is synchronized before assertions, so the tests do not prove instantaneous visibility inside Web Locks. A cached writer may mutate v1 between the final check and v2 commit; the v2 authority must never follow v1 automatically, and the detection of transient ABA writes remains impossible with snapshot comparison alone. Production v1 is still vulnerable. Do not claim a shipped fix from a passing test.



## Evidence from immutable WEB 18.62

- Bundle module **310** stores the live local AES-GCM vault as `financial-autonomy.preview.key.v1`, `financial-autonomy.preview.payload.v1`, plus reset marker `financial-autonomy.preview.reset.v1`. These are **not** the portable encrypted backup format.
- Bundle module **311** exports a password-encrypted JSON file: `format: "FinancialAutonomy"`, `version: 1`, `kdf: "PBKDF2-SHA256"`, `iterations: 600000`, 16-byte hex salt, 12-byte hex nonce and hex AES-GCM ciphertext. Password normalization is **NFKC**, minimum export password length 12, and authenticated additional data is `FinancialAutonomy/backup/1`. Restore validates the decrypted financial state and rejects wrong password/corrupt backup. The backup **does not contain the live local vault key**.
- Bundle module **328** has a two-stage user flow: decrypt/validate and display account/transaction counts, then an explicit **"Confirm înlocuirea datelor"** action that saves the restored state. This flow must remain explicit under v2; reading a file is not consent to overwrite.
- `tests/vault-cached-legacy-cross-version.cjs` demonstrates that cached 18.33 can overwrite a current v1 ledger and resurrect data after modern reset. The new 18.27/18.34 scenarios in PR #228 expand the version matrix; they do not protect production.
- `tests/vault-v2-authority-crash-matrix-prototype.cjs` exercises a *synthetic* staged v2 authority pointer and reset tombstone. It neither imports a real v1 encrypted backup nor implements a production migration.

## Recovery and restore states (proposed; approval/testing required)

| Current state | Portable v1 backup | Safe proposed behavior |
| --- | --- | --- |
| Verified v1, no v2 authority | Valid password and valid ledger | Show preview and explicit replacement; preserve existing vault until new commit is verified. Never overwrite on file selection. |
| V2 staging incomplete, v1 still authoritative | Valid backup | Fail closed until staging state is inspected; preserve all v1/stage bytes. No silent rollback or deletion. |
| V2 committed, no conflict | Valid backup | Decrypt and validate in memory; explicit replacement must create a **new v2 revision** under lock. Do not write the v1 KEY/PAYLOAD tuple. |
| V2 committed, observable divergent v1 | Valid backup | Warn that an older tab may have separate changes; offer read-only inspection/export of both recoverable states before choosing a replacement. No automatic merge. |
| V2 reset tombstone committed | Valid pre-reset backup | Treat as a **new explicit restore**, never as automatic resurrection. Preserve the tombstone until an atomic v2 restore commit is verified. |
| V1 key-only / payload-only or v2 stage damaged | Valid backup | Preserve original bytes; allow a non-destructive, explicit recovery path. No automatic key generation or data clearing. |
| Unknown authority, storage read failure, or conflicting v2 revisions | Any | **No financial writes** until a validated, explicit recovery decision. Export a privacy-safe diagnostic; never include plaintext financial records or key material. |
| Wrong password, invalid tag, incompatible format | Any | Reject before any mutation. Keep existing vault, reset marker, and backup file unchanged. |

## Authority authentication and trust boundary

A SHA-256 digest of a staged envelope detects accidental byte changes but **does not authenticate who committed authority**. A MAC or AES-GCM authenticated envelope could bind schema, epoch, revision, source baseline and reset state **only when its verification key is reliably available and protected**. A secret stored alongside ciphertext in the same origin is accessible to malicious same-origin JavaScript; therefore a MAC alone **cannot guarantee protection from compromised same-origin code or old clients that already know the key**. Do not market it as tamper-proof.

The primary practical goal here is isolation from **noncooperating but nonmalicious cached v1 code**, crash-safe commits, and honest, non-destructive recovery. Never claim complete detection of transient/ABA legacy edits. A single atomic authoritative record (or an authenticated pointer with verified immutable stage) needs a separately reviewed key/epoch lifecycle and reset design; do not silently repurpose the v1 key.

## Acceptance matrix before production migration

1. **Real portable v1 backup** generated by immutable module 311 must decrypt/validate in a test harness; wrong password, modified salt/nonce/data, truncated file, unsupported version, oversized file and invalid financial state must cause zero storage writes.
2. V1→v2 migration and explicit restore must be fault-injected before/after **every** persistent read, write, remove and commit, including quota denial, write-then-throw, reload and concurrent tab actions. Original v1 bytes remain recoverable.
3. A committed v2 reset tombstone must block any automatic v1 import, including cached 18.27/18.33/18.34 saves; an intentional restore needs a fresh verified v2 commit.
4. V2 restore must use exclusive Web Locks and revision checks; if locks are absent or the authoritative revision changes, fail closed without writes. A stale current tab cannot silently replace the restored state.
5. Show the user **source**, **date/revision where trustworthy**, **counts**, and explicit consequences before replacement. For divergent v1/v2, keep both recoverable without guessing which ledger is correct. No forced cloud account or telemetry.
6. Verify actual HTTPS two-tab Chromium and iPhone Safari behavior, keyboard/VoiceOver access to recovery warnings, and the full encrypted export/restore round-trip. Vercel READY alone is not acceptance.

## Alternatives and decision

- **Preserve portable backup v1 as a supported import format** (recommended): keeps existing user files usable; new authoritative storage v2 is an internal implementation detail. Future export-version changes require an independent compatibility contract.
- **Auto-import legacy storage after v2 reset** (reject): violates the reset tombstone and permits cached-tab resurrection.
- **Silently choose latest timestamp / fingerprint** (reject): old code can write after cutover; timestamps and fingerprints cannot prove user intent or detect ABA.
- **Require manual export/import before migration** (fallback): simpler but risky for users who lack a backup and may lose unsaved divergent edits; not acceptable as the only recovery mechanism.

**Next engineering step:** validate immutable 18.27/18.34 behavior in CI, then build a research-only *real module-311 portable backup* compatibility test and a fail-closed explicit restore fault matrix. Production storage migration remains gated on browser tests and recovery UX. Issue #14 budget perspectives remains ANALYSIS ONLY pending explicit financial contract approval.


## Research implementation evidence — 2026-10-28, candidate PR #230

**No product behavior changed.** The test file tests/vault-v2-portable-backup-restore-research.cjs loads the *actual* immutable WEB 18.62 Metro module 311 and module 310 in a Node VM with synthetic v4 accounts/transactions. It uses the real 600,000-round PBKDF2-SHA256 and AES-GCM backup operations, rather than substituting a fake backup implementation.

- Round-trip preserves the synthetic ledger and does not expose its account identifier in the backup JSON. A full-width character in the password round-trips through NFKC normalization. Wrong password, unsupported version/KDF, truncated salt/nonce, altered authenticated ciphertext, malformed JSON, oversize file and a separately generated **authentic AES-GCM file containing an invalid financial state** are rejected before any local-storage write.
- A separate **research-only** v2 stage/authority model requires explicit confirmation, simulated Web Locks availability, exact expected authority and a v1 baseline check. It never modifies the original v1 key, ciphertext or reset marker. A staged envelope is authenticated by AES-GCM; its SHA-256 fingerprint detects accidental changes but does **not** authenticate the authority pointer or establish provenance.
- The v1→v2 fault matrix injects read/write failures **before each storage operation** and **after each write**, including write-then-throw on the final single-key authority commit. Reload selects v1 until the authority commit persists; after commit, it selects v2. An explicit restore after a v2 reset tombstone does not auto-import a stale v1 ledger.
- A second replacement matrix checks that an existing v2 stage/revision is never overwritten by an interrupted restore and that old v1 bytes remain unchanged. This is a **prototype** using isolated research keys, not a deployed migration or production restore controller.

**Verification:** [candidate Release CI #40750695283](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40750695283) **SUCCESS** on commit `56616b2bb4a03bfdc988304938866d6a9787603a`; all **5/5** new research tests passed, including **14 initial migration** and **14 existing-v2 replacement** injected faults, plus explicit post-reset restore. Named PASS lines and `# fail 0` were inspected. A later documentation-only candidate commit still requires its own exact-SHA CI verification before merge.

**Remaining safety gates:** actual Web Locks and two-tab Chromium/Safari, stale cached 18.27/18.33/18.34 conflict behavior, reset and recovery UI, revision/epoch provenance, failed storage reads on reload, interrupted multi-revision retention, and a verified production v2 migration are **not** established. The prototype's key material lives with the staged envelope and is **not** secure against malicious same-origin code. A v1 digest cannot detect ABA/transient changes. The current WEB 18.62 v1 cached-tab overwrite/resurrection vulnerabilities remain **KNOWN UNSAFE**.

**Alternatives:** (a) keep v1 as sole live authority (current, known risk); (b) migrate to an isolated v2 namespace with atomic pointer and explicit divergence recovery (research direction); (c) silently merge by timestamp/fingerprint (reject: ambiguous intent and ABA). Do not implement (b) until the unresolved acceptance gates are met. This does not authorize changes to budget issue #14 or any financial formula.


## Browser follow-up — 2026-10-28, PR #232 (research-only)

A separate **actual two-tab Chromium** experiment is added in `tests/browser-v2-restore-research.cjs` and wired into `.github/workflows/browser-vault-smoke.yml`. It uses a disposable localhost origin, browser-native AES-GCM and Web Locks, and **synthetic** records. It does **not** execute the product's v1/v2 migration controller (none is deployed), nor the module-311 portable backup parser in the browser. The earlier Node-VM module-311 round-trip/fault tests remain separate evidence.

The test characterizes: serialized same-origin restore with a stale tab rejected before writes; explicit replacement under a current authority snapshot; stage-only interruption preserving the previous authoritative ledger; a committed authority write whose acknowledgment throws; zero-write stale retry; observable legacy-v1 drift blocking a destructive reset; a deliberately restored v1 byte tuple (ABA) that defeats snapshot comparison; a durable v2 reset tombstone refusing cached-v1 resurrection; and fail-closed behavior when Web Locks is absent. **Passing this experimental test is not evidence that WEB 18.62 is safe against cached tabs.**

**Important limitation:** this proof-of-concept uses a synthetic single-key authority pointer and stores its AES-GCM key alongside staged ciphertext. It does not authenticate authority provenance against malicious same-origin scripts, preserve all crash states, reconcile transient old-tab edits, or demonstrate Safari/VoiceOver behavior. A v1 writer can ignore Web Locks entirely. No production cutover, real vault, backup format, formulas or iOS code is modified.

**Next acceptance gate:** inspect candidate Chromium and Release CI results; then test the **actual immutable 18.27/18.33/18.34 legacy modules in browser tabs**, authenticated authority/epoch provenance, explicit nondestructive conflict recovery UI, reload after storage/quota faults, and native Safari iPhone before any production v2 migration.


## Cross-renderer visibility correction — 2026-10-28, PR #233

The experimental test's [merged-main Chromium run #40760812532](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40760812532) **FAILED** despite two earlier green candidate runs. A successful restore in tab B returned before tab A's immediate `localStorage` read reflected the new authority. Tab A observed the older `['A']` record instead of `['A','B']`. This is evidence of a **cross-renderer observation race** in the research test, not a confirmed real-user data-loss incident. The failure is preserved as evidence; it is not reclassified as success.

[PR #233](https://github.com/nikopol000/financial-autonomy-preview/pull/233) adds bounded Playwright `waitForFunction` checks for the expected authority **and staged ciphertext** to be visible in the other renderer before asserting cross-tab reads. It also waits for legacy-v1 bytes to become observable before checking divergence/ABA. The original Web Locks serialization and stale-writer zero-write assertions remain intact. Candidate [Chromium #40761149376](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40761149376) and [Release #40761149462](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40761149462) **SUCCESS**.

**Critical distinction:** waiting in a test is not a production synchronization mechanism. Do not infer that acquiring a Web Lock automatically flushes another renderer's localStorage view. A stale tab that reads obsolete authority *inside a lock* could still be unsafe; this requires a separate adversarial browser test and potentially a transactional authority design (e.g. IndexedDB transaction semantics), without assuming any change is authorized. Cached legacy v1 code does not honor the new lock regardless. No v2 product migration is shipped.
