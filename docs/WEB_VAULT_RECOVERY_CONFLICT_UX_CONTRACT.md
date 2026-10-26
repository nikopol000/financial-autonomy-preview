# WEB encrypted-vault recovery/conflict UX contract — research only

**25 October 2026 · issue #35 · WEB v18.45 · NOT IMPLEMENTED / NOT APPROVED FOR PRODUCT ACTIVATION**

This is a proposal for a **non-destructive, user-controlled recovery experience**, not a repair, a migration, or a change to the current vault. It is based on actual v18.45 module 309/310 and the synthetic Chromium F08/F09 tests in [PR #64](https://github.com/nikopol000/financial-autonomy-preview/pull/64). The read-only oracle in `tests/vault-recovery-conflict-contract.cjs` is deliberately **not imported into the product**.

## WEB 18.50 reset-generation reconciliation — 26 October 2026

The earlier read-only oracle was written against WEB 18.45 and classified **every** non-`committed-v1` RESET value as `UNKNOWN_RESET`. That is now stale: the shipped WEB 18.50 reset protocol intentionally retains `idle-v2:<32 lowercase hex>` after a completed reset, and uses `pending-v2:<32 lowercase hex>` while finishing an authorized reset. This **research-only** classifier now distinguishes those two validated forms without authorizing any writes, recovery, automatic initialization, deletion or migration.

| Observed footprint | Research-only classification | Safety decision |
| --- | --- | --- |
| `idle-v2` and no v1/v2/stage | `RESET_COMPLETED_EMPTY` | Not an untouched browser; no automatic recovery |
| `idle-v2` + KEY only | `POST_RESET_KEY_ONLY_AMBIGUOUS` | Preserve KEY; failed new first write and missing old payload cannot be distinguished |
| `idle-v2` + PAYLOAD only | `POST_RESET_PAYLOAD_ONLY_AMBIGUOUS` | Preserve ciphertext; do not fabricate key |
| `idle-v2` + complete v1 pair | `POST_RESET_V1_PAIR_UNVERIFIED` | Presence is not proof of authenticity; product must authenticate |
| `idle-v2` + research stage or v2 | `POST_RESET_CONFLICT` | Preserve all bytes; no migration/replay |
| `pending-v2` with or without v1 bytes | `RESET_IN_PROGRESS` | No recovery; only actual product's previously authorized reset completion logic may act |
| Invalid generation/unknown marker or denied read | `UNKNOWN_RESET` / `STORAGE_UNREADABLE` | Fail closed without writes |

The oracle does **not** participate in production reset finalization; it is intentionally more conservative than the active vault implementation. The new Node tests cover recognized/malformed markers, post-reset orphan states, read denial and exact byte preservation. Their passing status must be checked in CI, not inferred from a commit. This does **not** fix issue #35 or prove Safari/power-loss durability. It also does not authorize the proposed v2 single-record format.

**Next design gate:** specify a separate, explicit user recovery path for a KEY-only vault and a safe first-write commit protocol that cannot create dual authority with cached old tabs. Until proven, preserve fail-closed behavior and do not auto-delete an orphan key. Budget issue #14 remains discovery-only.

## WEB 18.50 actual-bundle bounded-retry evidence — 26 October 2026 (research only)

[PR #104](https://github.com/nikopol000/financial-autonomy-preview/pull/104) tests a *hypothetical* retry using the **actual** active WEB 18.50 Metro platform/vault/AES-GCM modules 309/310/311. It intercepts the exact encrypted PAYLOAD bytes during an injected first-write failure after an already verified `idle-v2` reset epoch; a test-only closure retains those bytes and the original KEY/RESET snapshot. It then uses the same simulated exclusive Web Lock, authenticates the captured ciphertext through the real vault reader **before** writing, and permits only the exact missing PAYLOAD to be committed. The original application does **not** retain such a recovery handle and does **not** implement retry.

The five added integration cases prove, in Node VM with synthetic ledger and simulated Web Locks: (1) successful bounded retry/reload with exact AES-GCM bytes and rejection of cached WEB 18.49; (2) changed epoch, pending reset, or changed key refuse without writes; (3) competing ciphertext or tampered captured ciphertext refuse without writes; (4) denied retry write preserves the orphan and permits later retry only while the same handle survives; (5) denied read and missing handle after reload refuse without writes. [Candidate release CI 40298523845](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40298523845) SUCCESS with **20/20** actual-vault/reset integration tests (15 previous + 5 new); [merged-main release CI 40298620786](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40298620786) and [Pages 40298620856](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40298620856) SUCCESS.

**Security boundary:** A KEY-only footprint after reload has no authenticated proof of origin; it might be a failed virgin first save or a missing previous ciphertext. This bounded experiment **cannot** recover it. Captured bytes are available only because the test intercepted a still-live save, not because the deployed product stores them. Web Locks in Node are simulated; no Safari/power-loss guarantee. A browser restart, old pre-epoch client, storage eviction, or missing handle remains fail-closed. Do not auto-delete KEY, replay staged ciphertext, infer reset authority, silently migrate, or change encrypted backup format. The viable product choices remain (A) retain fail-closed plus clear manual backup guidance, (B) design a new authenticated single-record first-write format with a carefully proven legacy migration/old-tab fence, or (C) investigate a truly bounded same-session retry with explicit in-memory provenance and user-visible uncertain-commit state. **None is approved or implemented.** Issue #35 stays open.

**Next acceptance gate:** prove candidate behavior in a disposable real Chromium browser with actual Web Locks and storage faults; review old cached clients, same-tab retry after errors, real browser lifecycle and the absence of duplicate authority. Only then consider an immutable product release. Keep issue #14 budget perspectives separately in financial-contract DISCOVERY.

### Real Chromium validation of bounded research path — 26 October 2026

[PR #106](https://github.com/nikopol000/financial-autonomy-preview/pull/106) adds a **disposable localhost Chromium** scenario to `tests/browser-vault-recovery-smoke.cjs`. It runs the **actual WEB 18.50 application bundle** in the browser, resets a fresh synthetic vault to a durable `idle-v2` epoch, injects a first PAYLOAD quota failure through `Storage.prototype.setItem`, and captures the exact encrypted bytes **only in the test's still-open page**. A sibling browser tab confirms KEY-only is blocked. The test-only retry acquires the browser's real `navigator.locks.request(..., {mode:'exclusive'})`, checks original KEY/RESET, authenticates the captured ciphertext through bundled module 310, writes the exact PAYLOAD once, and verifies decryption and unchanged bytes after page reload.

[Candidate Chromium CI 40299195657](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40299195657) **SUCCESS**, with named log PASS for the bounded retry and the existing blocked-two-tabs test. [Candidate release CI 40299195664](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40299195664) **SUCCESS**. This upgrades the narrow proof from simulated Node locks to **real Chromium Web Locks/localStorage**, but does **not** prove Safari, power-loss durability, or that any product recovery function exists. The real application still blocks an orphan after reload; the test's handle is an injected test fixture and disappears on reload. No financial formulas, backup format or user data changed. Issue #35 remains open until a separate, safe, immutable product implementation passes the full release gate.

## Observed evidence and limits

- v1 first save writes KEY before PAYLOAD. A failed PAYLOAD write can leave KEY-only. KEY-only cannot prove whether initialization failed or existing ciphertext disappeared. The current product fails closed; #35 remains open.
- The v18.45 old-tab **real reset** after hypothetical v2 STAGE (F08) leaves stage-only bytes indistinguishable from a stage interrupted by a crash. Automatically replaying STAGE could resurrect intentionally deleted data.
- A real v18.45 old-tab **save** beside a hypothetical v2 record (F09) leaves two competing encrypted ledgers. Neither a timestamp nor a higher schema number is proof of authority. No automatic merge, choice, or deletion is safe.
- A committed v1 reset journal represents a destructive intent and must never be treated as a recovery candidate. The current product's journal-finalization behavior is separate from this read-only design oracle.
- Web Locks coordinate cooperating tabs, not an already-open legacy bundle. A storage snapshot is not an atomic multi-key read. The oracle is conservative and **never authorizes an automatic write**.
- Tests are synthetic and local Chromium; they do not establish physical power-loss durability, browser eviction handling, Safari/iPhone behavior, or a shipped v2 reader.

## Proposed visible state and actions (not shipped)

| State observed by a future reader | Message goal | Allowed user-facing next step | Forbidden automatic action |
| --- | --- | --- | --- |
| KEY-only or PAYLOAD-only | Say that encrypted local data cannot be opened; cause is unknown | Retry after permissions/storage recover; explain independent encrypted-backup route | Delete/recreate key, silently initialize |
| STAGE-only | Explain that an incomplete/old-tab state is ambiguous, without claiming the data is recoverable | Preserve original browser profile; present manual recovery information | Promote staged ciphertext; assume reset did not happen |
| v1 + v2 or v1 + STAGE | Explain conflicting local records without choosing a winner | Preserve both; stop edits; request a reviewed resolution path | Merge, prefer latest timestamp, overwrite either record |
| Known committed reset marker | Explain that a reset was in progress; keep existing v1 reset semantics | Only the previously authorized reset completion path may act | Recover staged or previously deleted ledger |
| Unknown reset marker / unreadable storage | Explain that access or format cannot be verified | Retry access, preserve bytes | Ignore marker, clear storage |
| Intact v1 pair | Continue existing v1 verification/decryption | Normal read if authentication succeeds | Assume successful authentication without checking ciphertext |
| No footprint | Treat as potentially empty only after successful reads and normal initialization rules | Existing onboarding | Treat absence as proof that a former ledger never existed |
| v2-only | Unsupported research format, not a production source of truth | Preserve and block automatic migration | Activate unapproved v2 |

**Suggested Romanian microcopy for blocked/conflict state** (copy-only proposal; requires visual and accessibility review):

> Datele locale nu pot fi deschise în siguranță. Nu știm încă dacă salvarea a fost întreruptă sau dacă lipsesc informații. Nu vom șterge și nu vom înlocui automat datele criptate.
>
> **Reîncearcă deschiderea** · **Opțiuni de recuperare**
>
> Dacă ai un backup criptat, verifică-l într-un profil de browser separat, fără a modifica profilul original. Nu folosi „Resetează” pentru a încerca recuperarea.

For **conflicting records**, replace the first sentence with: *„Au fost găsite versiuni locale care nu pot fi reconciliate automat. Pentru a evita pierderea datelor, editarea rămâne blocată.”* Never show key material, raw ciphertext, financial amounts or transaction names in an error/diagnostic message. Avoid blame, urgency marketing, or coaching language; the application is a tool.

## Manual backup recovery — proposed decision gate

1. Preserve original profile/storage **as-is**. Do not instruct the user to clear site data, reinstall, or reset the vault.
2. The existing separate-clean-profile backup flow may be offered **only when the user already possesses a backup file**. A KEY-only state does not imply a backup exists or that the lost ledger can be reconstructed.
3. Validate the backup's authenticated contents with the correct password **without writes**; invalid password, tampered backup or denied reads must leave both profiles unchanged.
4. Confirm the target is a separate, clean profile and obtain explicit confirmation before using the **existing** restore UI. The read-only contract oracle does not restore anything.
5. After restore, verify populated synthetic account/transaction values and persistence on reload; do not merge with the blocked original. The user must not be promised a recovered ledger if no valid backup exists.

## Decision matrix and test evidence

The new research-only Node oracle has **18 named tests** (14 footprints, unknown reset, read denial, 8 combinations of three manual conditions, and non-disclosure), designed to enforce no `setItem`/`removeItem` and no secret bytes in decisions. **Its PASS is not evidence of shipped behavior.** Browser F08/F09 already reproduce the underlying old-tab hazards in real Chromium; these tests are intentionally complementary, not a duplicate claim.

| Decision | Status | Evidence still required |
| --- | --- | --- |
| Keep v18.45 fail-closed, no automatic KEY cleanup | RETAIN | Existing browser regression #35; review blocked-vault UI |
| Never auto-replay STAGE or resolve dual authority | RETAIN | F08/F09 real Chromium; Safari and power-loss still unverified |
| Read-only explanation + retry + separate-profile backup guidance | DESIGN PROPOSAL | Accessible iPhone light/dark UX, copy review, no-writes tests in actual UI |
| Fresh v2 single-record activation or v1 migration | NOT APPROVED | Legacy-tab lifecycle, reset authority, migration/rollback, authenticated envelope, explicit safety acceptance |
| New financial/budget behavior (#14) | NOT APPROVED | Separate financial contract and user approval |

## Next executable checkpoint

1. Verify the test-only contract in CI, keep #35 open, and do **not** bump WEB 18.45.
2. Review actual blocked-vault screen on narrow iPhone-sized Chromium light/dark, with no real data. Compare proposed copy and tap targets against `docs/WEB_VISUAL_REVIEW.md`.
3. Explore a browser-only read-only presentation prototype, **without activation**, then test real old-tab reset/save and permission-denial paths. Do not show destructive recovery controls.
4. Independently verify public served version, merged-main CI/Pages, Vercel exact-SHA when quota permits, and Safari iPhone. None are inferred from a GitHub write.
5. Issue #14 stays research-only; no formulas, budget modes, iOS, telemetry, backend or backup format changes.

## Primary references

- [First-write protocol discovery](WEB_VAULT_FIRST_WRITE_PROTOCOL_DISCOVERY.md)
- [WHATWG HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html)
- [MDN Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
- [Apple Human Interface Guidelines — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
