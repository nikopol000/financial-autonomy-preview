# WEB legacy cached-tab compatibility — P1 #4 (2026-10-28)

## Evidence, not a safety claim

The immutable WEB **18.33** bundle `index-v01833-demo-preload-guard-20261023.js` has a real-mode `save()` that directly calls `saveWebVault(localStorage, state, random)`. Its `resetData()` calls `clearWebVault(localStorage)`. Neither call requests the Web Lock nor compares a previously loaded ledger revision. Module 310 authenticates the **currently stored** ciphertext before replacing it, but does not establish that the caller's in-memory state is current.

The active WEB **18.62** module 309 uses an exclusive `financial-autonomy.preview.vault.v1` Web Lock, checks KEY/PAYLOAD/RESET revisions, and retains an `idle-v2:<epoch>` marker after reset. These protections apply to **cooperating current tabs only**; an already-open 18.33 tab cannot be retroactively made to honor them.

`tests/vault-cached-legacy-cross-version.cjs` exercises actual immutable modules and AES-GCM with synthetic accounts/transactions and a shared simulated localStorage:

| Scenario | Expected characterization | Consequence |
| --- | --- | --- |
| 18.33 loads old state, 18.62 commits a new transaction, 18.33 saves its stale snapshot | New transaction disappears; legacy one remains | **KNOWN UNSAFE: lost update** |
| 18.62 commits a reset with durable `idle-v2` marker, then cached 18.33 saves its pre-reset state | KEY/PAYLOAD reappear and 18.62 can load resurrected data | **KNOWN UNSAFE: post-reset resurrection** |
| 18.49 guarded cached tab loads an `idle-v2` marker | Its legacy reset implementation rejects the unknown marker without writes | Fail closed in this tested version; **not** a guarantee for earlier clients |

**Important:** a green CI result on these tests means the unsafe behavior was **reproduced**, not fixed. This is a deterministic Node VM integration test, not an observed incident, physical crash, Safari test, or proof about all historical bundles.

## Risk and alternatives

1. **Keep v1 with a durable epoch + Web Locks:** protects modern cooperating tabs but **cannot** stop a pre-fence tab from writing the old keys. This is the current partial protection; do not call it complete.
2. **Warn users to close/reload other tabs before reset/edit:** prudent interim communication, but cannot guarantee every cached tab is closed and is not an integrity protocol.
3. **Versioned v2 storage namespace / authenticated single-record envelope (candidate for further review):** after an explicit, verified migration, legacy v1 writers cannot overwrite the new v2 keys. However they may continue writing **divergent v1 data**, creating a conflict on later reload/migration; a safe one-way authority rule, explicit recovery, backup compatibility, and no automatic merge are required. This is **not approved or implemented**.
4. **Same-origin broadcast or storage events:** helpful to coordinate updated tabs; older code may ignore them. No enforceable global write lock for old code.
5. **Server-side coordination or bank sync:** incompatible with the local-only product contract; not proposed.

A newly introduced reset marker in a key old clients never check is **not** a backward-compatible fence. New code cannot guarantee that already-running old JavaScript will stop writing shared localStorage.

## Recommended next gate (research / acceptance, not authorized migration)

- Identify the oldest realistically cached immutable clients and inventory their save/reset paths; test at least 18.27, 18.33, 18.34, 18.49 and current 18.62 with **real AES-GCM**, synthetic ledgers and explicit per-version expected behavior.
- Design a migration state machine with distinct v1/v2 authorities, immutable authenticated v2 envelope, crash-safe staging, idempotent reload, no plaintext, no silent deletion of v1 data, and no unapproved automatic merge of divergent ledgers.
- Include a durable **post-reset** invariant: a stale v1 write must never become current v2 data. Preserve the ability to inspect/restore backups; do not silently reclassify a reappearing v1 ciphertext as legitimate post-reset activity.
- Fault-inject every persistent write, read, deletion, quota/security denial, tab close, reload, and cross-version interleaving. Require zero-write conflict rejection, no resurrection, and a recoverable explicit state if provenance is ambiguous.
- Perform browser checks in two real tabs on HTTPS (Chromium and Safari iPhone where possible), including stale cached JS and reload; separate these from Node VM results.
- Only after a reviewed protocol and successful tests: immutable product bundle, version/diagnostic synchronization, CI, Vercel READY **and served-browser verification**. No user financial data, backup, iOS, formula, cloud, account, analytics or bank integration touched by this research.

## Adjacent financial-contract issues

#14 budget perspectives, #25 card overpayment and #2 historical reconciliation are separate financial-semantics questions. **Do not implement budget modes or change any financial formula without the user's explicit approved numeric contract.**

## Source pointers

- Immutable WEB 18.33 and WEB 18.62 modules 309/310, both retained in this repository.
- `tests/vault-cached-legacy-cross-version.cjs` (three characterization scenarios).
- `tests/vault-real-crypto-regression.cjs` (modern cooperating-tab regression).
- `tests/vault-reset-v2-integration.cjs` and `tests/vault-reset-fencing-prototype.cjs` (earlier research; not production migration authorization).
- GitHub issue #4, #29 and #35.
