# Whole Chromium browser SIGKILL / persistent profile — research gate (2026-10-31)

**Status: verified synthetic Chromium characterization, NOT a production fix.** WEB 18.64 unchanged. Issues #4, #29, #35. Starting main HEAD `5b0880a7e41b0e1dff2064316e24dc0c8ee2135d`.

## Test design

`tests/browser-v2-reset-whole-browser-crash-research.cjs` starts a local HTTP server and a fresh, uniquely named temporary Chromium persistent user-data directory **per scenario**. It creates synthetic v1 localStorage key/payload and an experimental IndexedDB AES-GCM witness (fixed test-only key), then closes Chromium normally to establish a flushed baseline. It relaunches the **same profile**, authenticates the witness and checks that the legacy and IDB bytes match the flushed baseline. On Linux, it inspects `/proc/*/cmdline` and permits SIGKILL only when **exactly one** browser process has the unique profile argument and no renderer `--type`. The test runner PID is explicitly excluded. It waits for the browser-context close event, relaunches the profile, inspects without writes, and repeats the inspection after another reload.

Scenarios: orphan legacy key plus pending v2; deleted legacy pair plus pending v2; legacy ciphertext divergence plus committed v2. Each must remain `unknown` and byte-identical to the flushed baseline, including the authenticated experimental authority and witness. A failure is evidence requiring investigation, **not** authorization to auto-repair.

## Limits and alternatives

This is a **whole-browser process kill**, unlike the previous renderer SIGKILL, but it deliberately uses a gracefully flushed baseline. It does **not** test an in-flight transaction at the exact moment of termination, OS power loss, filesystem flush guarantees, browser eviction, real archived v1 ciphertext, production v2, Safari or real user data. A successful run cannot establish that the last user write survived a crash, that a reset completed globally, or that a stored witness represents the newest ledger.

Preferred prospective UX remains read-only quarantine: “Nu putem confirma starea datelor.” Preserve both stores, disable mutation, permit explicit retry of inspection and provide neutral information without auto-resurrection, deletion, merge, replay or rekey. **No production UX or financial formulas are changed here.** Cross-version cached writers and whole-origin rollback remain unsolved. A same-origin witness cannot prove recency after full-origin rollback.

## Evidence gate / next work

1. **Verified:** [PR #333](https://github.com/nikopol000/financial-autonomy-preview/pull/333), exact PR head `8e12551035ae43478b469fb6cea06e62615decae`, [Release CI #41142510587](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41142510587) SUCCESS and [Chromium #41142510661](https://github.com/nikopol000/financial-autonomy-preview/actions/runs/41142510661) SUCCESS. Job `124359896703` has three individually inspected named PASS lines at 23:08:46, 23:08:47 and 23:08:47 UTC (orphan-key, deleted-legacy, committed-diverged). Merged via squash `d67641c06c9a6f5ba21bd8f78fb3ce219e33007c`.
2. Verify merged-main independent Release/Chromium/Pages; Vercel and served-browser evidence are separate and must not be inferred from PR CI.
3. Then extend to a **genuinely in-flight** IndexedDB/localStorage crash, and draft an authenticated reset-intent and accessible read-only recovery contract for review. Safari iPhone/VoiceOver and real browser eviction remain unverified.

No iOS, product bundle/index, real ledger, encrypted backup format, cloud, accounts, analytics or bank sync changes.
