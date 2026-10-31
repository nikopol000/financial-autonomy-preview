# In-flight Chromium browser crash / reset boundary — research gate (2026-10-31)

**Status: TEST CANDIDATE, CI NOT YET VERIFIED at creation. NOT a production fix.** WEB 18.64 remains active. Scope: #4, #29, #35. Base main HEAD `7985747b83a3961501f7737a9030ae9db5d8e5af`.

## Existing independent baseline

The exact previous checkpoint HEAD has successful independent [Release CI #41142983129](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41142983129), [Pages #41142983099](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41142983099), and [Pages build #41142982694](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41142982694). These are **main** checks, not proof of Vercel or Safari browser acceptance. Previous [whole-browser SIGKILL research](WEB_RESET_WHOLE_BROWSER_CRASH_GATE_20261031.md) flushed a stable baseline *before* the kill; it did not interrupt a transaction.

## New candidate: actual in-flight IDB transaction

`tests/browser-v2-reset-inflight-browser-crash-research.cjs` uses a disposable localhost origin, synthetic v1 localStorage footprint, a test-only AES-GCM key, and a uniquely named Chromium persistent profile. It seeds and **gracefully flushes the baseline**, relaunches, opens an actual IDB `readwrite` transaction, queues replacement `authority` **and** matching `witness` values, and keeps the transaction active by chaining real IDB `get` requests. The runner verifies multiple callbacks and `oncomplete === false` immediately before SIGKILL of exactly one uniquely identified browser process. It then relaunches the same profile and inspects the records **read-only**.

**Acceptance contract:** the recovered authority/witness pair must equal either the entire old pair or the entire new pair, never a torn mixture. The witness digest must authenticate, the synthetic v1 bytes must remain unchanged, the ambiguity classifier must remain `unknown`, and a second read-only reload must preserve the same evidence. A PASS does **not** guarantee which transaction outcome occurred or that data is durable across power loss. If an environment yields an unrecognized state, the test must fail; do not auto-repair.

## Separate inter-operation localStorage gap

A second disposable profile starts from a flushed synthetic v1 key/payload plus experimental committed-but-divergent v2 witness. The test removes the v1 **payload** synchronously, confirms the removal, then SIGKILLs the whole browser **before any key deletion**. On relaunch, the payload may be the old value or absent (crash durability is not guaranteed); the key and authenticated v2 witness must be unchanged. The classifier remains `unknown` and reload must not write. This is a crash **between** two localStorage operations, **not** an in-flight synchronous `removeItem` call. Neither possible outcome proves reset completion.

## Candidate no-write recovery UX / accessibility contract

1. On any authenticated pending intent, divergent legacy bytes, orphan key, mismatched witness or unprovable completion, show a neutral blocking state: **„Nu putem confirma starea datelor.”** Avoid „date pierdute”, „resetare finalizată”, „ultima versiune” or claims that a particular snapshot is recoverable.
2. Keep ledger mutation disabled; do not automatically delete, rekey, merge, replay, resurrect, import, or choose the apparently newest copy. Offer **„Verifică din nou”** as a read-only reinspection, and a clearly labelled explanation of what can and cannot be confirmed. A future manual recovery flow requires its own explicit consent and tests.
3. Expose the state in a semantic heading and live status announcement, with a visible keyboard focus indicator and usable controls at 320 CSS px / 200% zoom. Do not rely only on red/green color or cryptographic terminology. Actual Safari iPhone/VoiceOver remains untested.
4. A v2 witness is not proof of user confirmation or protection against full-origin rollback. Cached archived v1 writers can still mutate old localStorage outside the cooperative protocol. This is an unresolved product safety boundary.

## Alternatives and trade-offs

- **Auto-resume or restore from a v2 witness:** lower friction but risks resurrecting intentionally erased financial data; **reject** pending authenticated user-intent semantics and robust old-tab fencing.
- **Always wipe both stores on uncertain reset:** simple UI but destructive on quota, permission and crash faults; **reject**.
- **Read-only quarantine and explicit inspection:** preserves forensic evidence and avoids silent loss, but temporarily blocks use; **preferred candidate** pending product design and browser acceptance.
- **Move to transactional IDB authority:** atomic within cooperating clients, but migration, archived-tab fencing, rollback and browser storage eviction remain open; **research only**.

## Verification and release boundary

The PR must pass Release CI and Chromium with **two individually named PASS lines**; investigate failures before merging. A green workflow is not proof of a shipped fix. No immutable bundle, `index.html`, financial formula, iOS code, real data, backup format, cloud, login, telemetry or bank integration changes. No new product version for test/docs-only work.

**Next:** inspect CI logs and exact PASS lines; merge only if green, independently verify main checks, update #4/#29/#35 and continuity files. Then evaluate real archived ciphertext / old-tab writes and a no-write user-visible quarantine without deploying an unsafe migration.