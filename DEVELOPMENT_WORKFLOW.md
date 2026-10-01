# Financial Autonomy — development and immediate-preview workflow

## Goal
Keep the product-development loop short and observable from chat:

**change → automated verification → web build → publish preview → user tests immediately → correction**

A successful source build is not considered finished until the exact build is visible in the active preview.

## Stable workflow

1. Make product changes in the source repository on the active feature branch.
2. Push a small, coherent commit.
3. The source workflow runs typecheck and the relevant automated tests.
4. Export the web candidate and retain the exact generated artifact / candidate branch.
5. Promote that already-verified artifact to the preview repository. Do not rebuild a different source revision during promotion.
6. Wait for the preview repository's Pages deployment to complete successfully.
7. Verify that active `index.html` points to the new bundle hash.
8. Report **gata de test** only after steps 3–7 are complete.
9. User tests the change immediately in the same chat. Corrections start another short cycle from step 1.

## Version rule
Every user-testable preview change gets an explicit preview version/cache key (for example v17.32). The version reported in chat must correspond to the bundle actually referenced by the active preview, not merely to a successful candidate build.

## Problems found and solutions

### 1. Candidate build succeeded but active preview stayed old
**Cause:** source CI published only `candidate-web`; it did not replace the active preview.

**Rule:** distinguish clearly between *candidate built* and *preview published*. Never tell the user to test until the active preview deployment is complete.

### 2. Cross-repository checkout failed
The preview workflow tried to checkout the private source repository. The preview repository's default `GITHUB_TOKEN` cannot be assumed to read another private repository. An `APP_REPO_TOKEN` was referenced but was not configured, producing `Input required and not supplied: token`.

**Preferred solution:** promotion should consume the exact verified build artifact/candidate, not checkout and rebuild source cross-repository.

**Fallback:** if cross-repo checkout is ever required, configure a least-privilege repository token/installation explicitly and fail early with a clear preflight check.

### 3. Rebuilding during publish makes the test target ambiguous
Building once in the source repo and again in the preview repo can produce two separate build events and makes it harder to prove what the user is testing.

**Rule:** build once, test once, promote the same artifact.

### 4. Assistant stopped at infrastructure failure
A failed publish is an intermediate state, not a completed task.

**Rule:** after a failure, inspect the failing step, repair or use a safe fallback, rerun/publish, wait for deployment, and only then report the final state. Status requests should report the real active-preview state.

## Current manual-safe promotion
Until artifact promotion is fully automated, the safe fallback is:
- take `index.html`, `metadata.json`, and the referenced hashed web bundle from the successful `candidate-web` build;
- copy them to the active preview repository without changing their contents;
- let the preview Pages workflow deploy;
- confirm the deployed `index.html` references that candidate bundle hash.

This preserves the exact tested candidate and avoids cross-repository source checkout.

## Product-change discipline
- Do not combine formula corrections with visibility/debugging changes unless requested.
- For calculation work, first expose the formula and actual inputs used by the current code.
- User reviews the displayed calculation and gives corrections.
- Then change the financial primitive/formula and add/update tests that encode the agreed behavior.
- Keep commits small enough that a failed preview can be traced to one change.

## Definition of done for a chat iteration
A change is done only when:
- source checks pass;
- candidate web build succeeds;
- the exact candidate is promoted;
- active preview deployment succeeds;
- active preview references the new bundle;
- the user has a concrete version ready to test.

## Chat execution rule
For a change that is being prepared for immediate user testing, stay in the same execution while CI/publish/deploy is progressing. Poll the deployment to a terminal state and verify the active preview before sending the final response. Do **not** end with “I’ll come back when it is ready”: a normal chat response cannot resume itself after the conversation becomes idle.

Only stop before a terminal result when genuine user intervention is required (for example a missing credential or permission that cannot be repaired with the available tooling). In that case, state the exact required intervention.
