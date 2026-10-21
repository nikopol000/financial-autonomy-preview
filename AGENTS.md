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

<!-- rollback redeploy trigger 2026-10-06 -->

## Stable source main promotion gate (user decision, 2026-10-14)

Two repositories have distinct roles:
- `nikopol000/financial-autonomy-preview`: iterative preview/test builds; its `main` is a deployment branch and may contain unapproved candidates.
- `nikopol000/financial-autonomy-app`: canonical application source. Its `main` is the **stable, user-approved baseline only**.

**Never merge or push a preview iteration to `financial-autonomy-app/main` without the user's explicit approval of that specific build.** Seeing a version, reporting that it loads, or asking for a fix is not approval. Keep work on feature/candidate branches or the preview repository until approved. On approval, reconcile all changes into source, test and promote the exact approved build. Record the approved version and source commit in PROJECT_STATE.md and IMPLEMENTATION_QUEUE.md. Do not conflate the two repositories' `main` branches.

## Mandatory automatic continuity and iOS parity (user instruction 2026-10-14)
At the beginning of **every** Financial Autonomy development session, read `AGENTS.md`, `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md`, `DEVELOPMENT_WORKFLOW.md`, and relevant recent commits **without asking the user to remind you**. At the end of every implementation batch, update `PROJECT_STATE.md` and `IMPLEMENTATION_QUEUE.md` with actual commits, verified/unverified status, outstanding work, and the exact next action. Update workflow/docs when rules change. Do not report a completed migration if only some modules have been ported. Native iPhone candidate must match the active preview's functions, financial calculations, and visual behavior; compare screen by screen and test using synthetic data before declaring parity. Keep preview `main` separate from source `main`; no source stable promotion without explicit approval.

## Web Premium / Work role separation (2026-10-22)

- ChatGPT Work is used **only for interactive visual and functional browser review** of the web preview. It may write findings in `WEB_REVIEW_REPORT.md`; it must not change application code, release metadata, or deployment settings.
- The Web Premium automation owns web implementation, tests, release versioning, commits and deployment. It reads Work's review as evidence, not as an automatically executed command.
- The iOS automation is independent and remains pinned to archived web v18.20; never modify the native repository from a web-only task.
- Never claim a Work review or browser interaction occurred without a real report. Do not confuse Vercel READY with end-to-end UI verification.
