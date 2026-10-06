# AGENTS.md — Financial Autonomy continuity rules

This repository must be self-resuming across ChatGPT/Work/Codex sessions.

## Mandatory startup
Before proposing or making product changes, read:
1. PROJECT_STATE.md
2. IMPLEMENTATION_QUEUE.md
3. DEVELOPMENT_WORKFLOW.md
4. recent main commits relevant to the checkpoint

Repository continuity files are the source of truth for development state. Chat memory is supplementary only.

## Mandatory checkpointing
For every user-testable change:
1. implement in small coherent steps;
2. verify according to DEVELOPMENT_WORKFLOW.md;
3. publish/activate the exact verified preview artifact;
4. update PROJECT_STATE.md with the new latest checkpoint;
5. update IMPLEMENTATION_QUEUE.md with status and exact next step;
6. commit/push the continuity update before reporting the work as complete.

Never report a task as complete while continuity files still describe the previous task.

## Interrupted work
If work stops before completion, persist:
- current status = IN PROGRESS or BLOCKED;
- completed steps;
- exact first unfinished step;
- relevant branch/commit/build identifiers;
- any decision required from the user.

A new session must continue from that first unfinished step and must not repeat verified steps.

## User requests in chat
When the user gives a new product requirement, add it to IMPLEMENTATION_QUEUE.md as READY FOR IMPLEMENTATION before implementation when feasible. If implementation is immediate, the same cycle must still leave the queue and PROJECT_STATE.md accurate.

## Safety against stale state
If continuity files conflict with main commit history or the active preview, inspect the discrepancy before continuing and repair the continuity files. Do not silently guess.

## Product invariants
- Financial data remains local-only unless the user explicitly changes that architecture.
- Available credit is not owned money/income.
- Privacy presentation must not alter accounting truth.
- Do not change financial formulas without preserving/exposing the agreed calculation behavior and verification.
