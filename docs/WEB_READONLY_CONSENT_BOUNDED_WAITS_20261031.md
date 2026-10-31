# Bounded read-only recovery inspection — 2026-10-31

**Status: research-only candidate, NOT a production reset/restore feature.** Scope: #4, #29, #35. WEB 18.66 HTML, immutable JS, diagnostic, financial formulas, real ledger and backup format are unchanged.

## New failure boundary

The existing research gate waited for `inspect()`, `authenticate()` and `withLock()` to settle. A blocked IndexedDB open, indefinitely queued Web Lock, or nonresponsive asynchronous proof could leave the inspection pending forever. A user cancellation changed an in-memory epoch, but the caller still waited until the unresolved promise eventually settled. This is a **liveness/UX problem in the research model**, not a verified production browser hang.

The updated isolated Node gate now uses a **single per-request deadline** (15 seconds by default in the research model, configurable for tests), plus a supersession promise that resolves promptly on cancellation or a new inspection. All stages share the deadline: first evidence read, mock proof, lock acquisition and second evidence read. Expiry invalidates `current()` so a late lock callback cannot run a fresh inspection. A rejected/late promise cannot authorize a destructive action because **no destructive callback exists**. Timers are cleared in `finally`.

## Added deterministic tests

1. **Never-settling first inspection** (models blocked IDB open): returns `INSPECTION_TIMEOUT`; late resolution cannot change the result; a new read-only retry can complete.
2. **Cancellation while a lock is held forever:** returns `STALE_REQUEST` without waiting for the lock to be released; no second inspection after release.
3. **Lock timeout:** returns `LOCK_TIMEOUT`; a later release cannot trigger another inspection.

All cases require `audit.writes === 0` and no `gate.commit`. Existing negative tests still prove that an archived v1 writer can mutate localStorage after the final read-only recheck, and that full-origin rollback freshness is not locally provable.

## What this does NOT prove

- The Node `inspect` and `withLock` are mocks, not actual IndexedDB or Web Locks. No Safari, iPhone, VoiceOver, page suspension, crash, reload, quota denial, or real-world timeout is reproduced here.
- A timeout does **not** cancel an underlying browser API operation. Late callbacks must be separately fenced, and the production UI must avoid retaining stale password material or showing false success.
- A bounded read-only check is not a crash-safe transactional commit, does not fence cached v1 writers and must not authorize deletion, restore, migration, replay, rekey, automatic reset, or selection of a winning ledger.
- The 15-second research deadline is not an approved product timeout or accessibility specification. An actual implementation would need measured Safari behavior, accessible progress/cancel/retry states and explicit UX review.

## Alternatives and recommendation

- **Wait indefinitely:** rejected for a user-facing inspection; cannot offer reliable cancel/retry.
- **Race a timer without invalidating late callbacks:** rejected; a timed-out request might continue work after its caller has moved on.
- **Bounded, supersedable read-only inspection:** recommended for further research, with fail-closed states and zero writes. It is **necessary but insufficient** for any future destructive recovery contract.

**Next:** validate with an actual blocked IndexedDB open and real Web Locks in disposable Chromium/Safari, inspect cross-tab cancel and pagehide, and design a separately approved legacy-writer fence. Until then #4/#29/#35 remain OPEN; keep destructive recovery disabled. #14 remains DISCOVERY ONLY.
