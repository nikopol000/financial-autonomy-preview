# WEB #29 — active reset recovery acceptance matrix (research, 2026-11-06)

Status: TEST DESIGN ONLY. No production reset contract approved; no implementation or PASS claimed.
Baseline: main 6e34e886, active WEB 18.74. Existing archived/current module-310 Map tests characterize unsafe repeated v1 deletion; they do **not** exercise active IndexedDB, UI, or real-schema ledger. Existing 2026-10-30 Chromium boundary matrix (docs/WEB_RESET_FINALIZATION_BOUNDARY_GATE_20261030.md) covers nine older split-store cases; reuse its fixtures and avoid redundant archived-only tests.

## Target and invariant
Use a disposable browser origin and strictly synthetic valid-schema ledger with at least two distinguishable transactions and a check/reconciliation record. Capture authenticated encrypted envelope identifiers and revision, v2 IDB reset status, and v1 KEY/PAYLOAD/RESET markers before and after each action. Never log plaintext or key material in CI artifacts. Never touch real user origin, backups or browser profiles.

At **every** interrupted boundary, an ambiguous state must be **read-only / blocked**: no silent empty ledger, no automatic destructive retry, no stale-tab overwrite. A fully committed, explicitly requested reset must remain final: no resurrection of erased transactions.

## Ordered executable cases
1. Baseline: create synthetic ledger in active WEB 18.74; reload; verify same transactions, account balances and reconciliation IDs. Assert exact persisted revision and encrypted envelope unchanged by read-only reload.
2. Deny first v1 PAYLOAD deletion; expect both v1 records retained and reset reported as failed; reload and inspect v2 journal. No implicit reset completion.
3. Permit PAYLOAD removal, deny v1 KEY removal; expect KEY-only orphan, v2 pending/unknown, blocked load/save/new-vault creation, and no subsequent automatic deletion on reload.
4. Permit both v1 deletions, abort v2 completion transaction; expect v1 absent and v2 pending/unknown, blocked automatic new-vault creation; do not infer completed consent from missing v1.
5. Repeat user reset after case 3: until an explicit approved recovery protocol exists, preserve orphan evidence and reject destructive replay. This is the missing regression relative to archived Map-only tests.
6. Two tabs: tab A initiates reset while tab B holds pre-reset state. Fault-inject between v1 deletion and v2 completion. After tab B resumes, reject save/replay; reload both tabs and assert no ledger resurrection.
7. Completed reset: v2 completion durable, then reload both tabs; old transactions must never reappear. A newly initialized synthetic ledger requires a distinct explicit user action and must have a new identity.
8. Storage faults: QuotaExceededError / SecurityError on each relevant read, write, remove, IDB transaction commit; preserve the last recoverable encrypted copy and keep failures visible.
9. Repeat cases 3–7 with browser restart/new context against the *same disposable origin*; distinguish in-memory guards from durable recovery.

## Decision table to capture
For each case log: fixture identifier, browser/build SHA, injected operation, v1 pair presence (boolean only), v2 reset status, active UI state, reload state, second-tab save result, new-vault creation result, ciphertext integrity check, PASS/FAIL with trace artifact ID. Never mark a failure-safe PASS merely because an expected known-unsafe behavior was reproduced.

## Alternative designs to evaluate before production change
A. Authenticated durable reset journal with encrypted recoverable snapshot until a verified commit boundary. More fault points and privacy-retention obligations; must never resurrect after completion.
B. Single-record envelope with a safe legacy migration. Simpler future deletion but requires backward compatibility and rigorous migration/restart tests.
C. In-memory restoration on catch: insufficient for crash/failed write; not an integrity guarantee.

Recommendation: first implement *test harness only* for cases 1–6 using active v18.74 and real-schema synthetic fixtures; assess A/B against every fault boundary before selecting a production protocol. Preserve local-only, AES-GCM, Web Locks fail-closed, no formulas/iOS changes. User approval is still required for new financial semantics (#14), not for isolated test research.

## Verification debt and first next action
No Node/Chromium run was executed as part of this document. Next: use an available checkout/CI runner to execute the existing regression by exact SHA, then implement active-IDB disposable-origin fault tests and attach run IDs/screenshots to #29. Do not ship a reset fix without a written recovery contract, negative tests, and immutable release verification.
