# WEB vault reset ABA / first-save recovery — design discovery

**2026-10-26 · WEB 18.49 · synthetic-only · issue #4 / #35 / #29 · NOT IMPLEMENTED**

## Verified mechanism and evidence

Active immutable bundle modules 309/310 store a tab-local revision as the exact `KEY`, `PAYLOAD`, and `RESET` strings. Web Locks serialize cooperating writes, but cannot distinguish two *identical* snapshots separated by intervening writes. On successful reset, the committed reset marker and encrypted pair are all removed.

The bundled regression in [PR #92](https://github.com/nikopol000/financial-autonomy-preview/pull/92) models:
1. Tab A loads a fresh real-mode empty vault; its remembered revision is `{key:null,payload:null,reset:null}`.
2. Tab B loads, writes a valid synthetic AES-GCM vault, and completes an explicitly requested reset under the same serial Web Lock.
3. The storage returns to `{key:null,payload:null,reset:null}`. Tab A's stale revision compares equal and its subsequent save **succeeds** under the current implementation, creating a new encrypted vault without reloading after B's reset.

The test is named **KNOWN UNSAFE** and asserts current behavior to prevent accidentally misreporting a PASS as a safety guarantee. This is an **ABA / generation-fencing gap**. It does not demonstrate that a real user has lost data. Existing tests for stale tabs after resetting a previously populated vault do not cover this empty→populated→empty cycle.

## Relationship to #35

A failed first PAYLOAD write can leave a KEY-only footprint. A KEY-only footprint after first initialization is observationally identical to a previously valid vault whose PAYLOAD was removed externally; therefore automatic key deletion or implicit reinitialization is unsafe. An explicit reset can also return storage to the same empty revision that a stale tab loaded earlier. Solving first-save recovery without a durable generation/authority contract risks creating this reset ABA path.

## Candidate approaches (no implementation approval implied)

**A. Durable non-sensitive generation token / reset epoch (investigate first).** A unique generation stored separately from financial content is included in the revision snapshot and changed at the start of each committed reset. Keep it after ciphertext deletion so that a tab loaded before the reset cannot pass the next save preflight. A failed epoch write must prevent destructive deletion. Read denial must fail closed. The reset UI/privacy contract must explicitly disclose whether this non-financial marker persists; clearing *all site data* still removes it.

**B. Single-record encrypted vault plus generation metadata.** Avoid KEY/PAYLOAD partial writes for new vaults by storing key material and authenticated ciphertext together in one atomic localStorage item. This still needs a persistent epoch to fence stale empty snapshots, an audited legacy migration and a reset contract. It must not silently promote missing/corrupt legacy data or duplicate authorities.

**C. Ephemeral in-memory tab revision only.** Rejected as a complete solution: it cannot distinguish empty→populated→empty after reload and cannot fence old tabs.

**Critical compatibility limit:** older deployed JS clients that only check KEY/PAYLOAD/RESET will **ignore a newly introduced generation key**. Web Locks serialize them but do not force them to observe the new epoch. Therefore a new generation token alone cannot guarantee protection against already-open legacy tabs. Evaluate a versioned namespace, an explicit reload barrier, and how to handle legacy writers without losing an existing encrypted ledger. Never claim universal cross-version atomicity without testing this limitation.

## Acceptance matrix before product code

| Case | Required behavior |
| --- | --- |
| A loads empty; B creates+resets; A saves stale | A rejects with a visible reload/conflict warning; **zero writes**; no reset resurrection |
| A loads populated; B saves; A saves stale | Reject with zero writes; B's ciphertext preserved |
| A loads empty; B creates vault; A saves | Reject with zero writes |
| Reset marker write denied | Original encrypted vault intact, no deletion |
| Generation/epoch write denied | Abort before destructive reset; never pretend reset succeeded |
| Reset interrupted after commit | Reload resumes according to a single explicit durable intent; no resurrection |
| KEY-only, no reset marker | Preserve bytes and block implicit save/recovery; provenance ambiguous |
| PAYLOAD-only or corrupt envelope | Preserve bytes; fail closed, never auto-initialize |
| Unknown marker or denied storage read | Fail closed with zero writes |
| Current tab + old deployed tab | Characterize whether old tab can still write; avoid claiming compatibility protection if it can |
| Fresh valid backup in separate clean profile | Verify password/AES-GCM and state independently; blocked original remains byte-identical |
| Normal repeated saves after explicit reload | Preserve valid same-tab functionality and local-only encryption |

## Decision / next step

Keep #4, #35 and #29 open. First land the characterization test, then design a durable reset-generation protocol and adversarial migration matrix in isolation. Do not alter financial formulas, budget perspectives (#14), real data, encrypted backups, iOS, or the active WEB bundle. A product fix requires an immutable versioned bundle, release checks, successful CI and exact Vercel verification; public browser/Safari acceptance is separate.

## 2026-10-26 — executable legacy-client fencing experiment (PR #94)

**Research only, NOT product code.** [PR #94](https://github.com/nikopol000/financial-autonomy-preview/pull/94) adds [tests/vault-reset-fencing-prototype.cjs](../tests/vault-reset-fencing-prototype.cjs). It extracts actual WEB 18.49 Metro modules 309/310 from the active immutable bundle and instantiates old clients with synthetic localStorage and serial Web Locks. Candidate [CI 40267511127](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/40267511127) SUCCESS, including all eight new Node tests. Merged at 28c6bd6e7c5d52bdf42f7b9f224d38b0a3230e6d. This proves hypothetical protocol behavior in Node, **not** a deployed fix or Safari durability.

**Compatibility insight:** Reusing the existing RESET slot (financial-autonomy.preview.reset.v1) as a permanent non-sensitive new-format tombstone may fence already-open WEB 18.49 tabs. Old module 309 refuses saves/resets whenever RESET is non-null; its load path calls module 310, which refuses to clear an unknown reset marker without deleting ciphertext. Thus an idle-v2:<128-bit generation> marker makes old clients fail closed. A generation under an entirely new key would be ignored by old clients.

**Proposed two-phase reset contract, NOT IMPLEMENTED:**
1. Under the existing origin-wide Web Lock, compare KEY/PAYLOAD/RESET revision with the loaded revision; unreadable or stale state blocks writes.
2. Write pending-v2:<fresh 128-bit generation> to the existing RESET slot **before** any deletion. Failure prevents deletion; write-then-throw must be handled as potentially committed.
3. Once pending, remove PAYLOAD and KEY; on interruption, retain pending and resume only the explicitly committed deletion under the lock. Never replay a stage.
4. Replace pending with idle-v2:<same generation> and **keep this tombstone**. Failed final write remains pending and resumable. Both markers are intentionally unknown to old WEB 18.49 clients.
5. New clients must treat IDLE as empty but non-virgin, include generation in revision and write preflight, and retain marker across subsequent saves. Existing vault helpers require adaptation before use with new markers.
6. The existing demo eligibility gate rejects extra localStorage keys. New-client behavior after reset must be explicit, preserving demo isolation and no silent real-vault initialization.

**Eight synthetic tests passed:** legacy empty tab after create-reset ABA; legacy populated tab; legacy fresh load on IDLE; denied first marker write; interrupted PAYLOAD deletion and resume; denied final IDLE write and resume; unknown marker and read denial; stale empty revision rejection. Rejected legacy operations made zero additional storage writes.

**Still open:** #35 first-write KEY-only ambiguity; #29 no-resurrection recovery; older pre-v18.34 clients may not share Web Locks; external site-data clearing removes tombstone; browser durability/Safari and cross-version concurrency remain unverified. Tombstone is not cryptographic authentication. New-client load/save/reset, backup restore, demo handling, privacy copy and all fault boundaries require separate implementation and tests. No financial formulas (#14), real data, backup format, iOS or active product bundle changed.
