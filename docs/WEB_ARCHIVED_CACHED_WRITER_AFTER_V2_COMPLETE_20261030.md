# Cached archived writer after v2 reset completion — 2026-10-30

**Issues:** #4, #29, #35. **Scope:** disposable synthetic Chromium characterization, not a production fix, not a reset contract, and not evidence of consent.

## Threat boundary

An already-open archived WEB 18.27/18.33/18.34 tab retains a decrypted state while another archived tab calls the actual v1 `resetData()`. An experimental v2 IndexedDB authority first commits a `pending` reset intent and, after v1 KEY/PAYLOAD deletion, commits an authenticated `committed` witness. The first archived tab then attempts `save()` from its cached state. Both archived tabs and the v2 tab close; a fresh tab inspects both stores without writing.

The test adds **three cases**, one per archived version, to `tests/browser-v2-restore-operation-witness-research.cjs`. Assertions check: v1 was actually removed before v2 completion; v2 completion witness authenticated; the archived cached save's actual outcome; the v1 encrypted pair after save; v2 witness survival after tab close/reopen; read-only conflict classification; exact byte preservation under inspection.

**Security conclusion to verify in CI:** a valid local v2 completion witness is not proof of global reset while old cached v1 code can still write. A reopened UI must not automatically restore, delete, merge, replay, rekey, promote or infer which ledger is newest. The classifier's caller-supplied reset baseline is **not** an authenticated production contract.

## Alternatives

1. **Recommended pending design review:** fail closed on cross-store ambiguity, preserve both ciphertext stores and offer a non-judgmental read-only status with explicit next steps. Require deliberate human recovery after evidence review.
2. Cooperative v2 epoch/revision fencing is valuable but cannot prevent a non-cooperating archived v1 tab.
3. BroadcastChannel / storage events help only cooperative tabs; they are not locks and cannot make localStorage + IndexedDB atomic.
4. Blindly deleting v1 after v2 completion can destroy a later legitimate edit; blindly resurrecting v1 can undo an intentional reset.
5. An external monotonic freshness service conflicts with the approved local-only architecture and is not proposed.

## UX/accessibility proposal, not implementation

Use **„Datele necesită verificare”** and **„Nu am schimbat nimic automat. Închide celelalte file înainte de a verifica din nou.”** Distinguish pending, authenticated operation, and unknown global result in text, not color alone. At 320/390 CSS px and enlarged text, never hide the warning behind a disclosure. No claims of actual Safari iPhone, VoiceOver or real browser-process crash testing.

## Verification gate and next step

This document is a proposed test specification until the exact candidate Chromium run shows **three named PASS lines** and Release CI passes. If it fails, inspect job logs and correct the test without weakening safety assertions. Only then merge and update PROJECT_STATE.md, IMPLEMENTATION_QUEUE.md and #4/#29/#35 with actual SHAs and links. Next: browser-process kill/storage eviction and a reviewable read-only recovery contract. **#14 stays DISCOVERY only; no formulas or budget modes.**
