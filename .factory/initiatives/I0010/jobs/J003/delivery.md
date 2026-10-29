# J003 delivery · Selected methodology transport

## What changed and why

Resolve #94 by explicitly transporting selected skills and required references through trusted absolute paths or full canonical contents, preserving checkpoint/version provenance. Require actual-consumption and missing-resource acknowledgement across coordinator, native hosts and worker; no assumed Skill tool, global resources or inherited parent capabilities.

## Checks and results

Functional candidate6a0f686545a2fffd19f5038fa952fc269aa91d4a against2f7bb3b6b465938065ee47b0733f8f3bb0a79606. Coordinator docs/diff PASS. Native Windows focused test FAIL at unchanged CRLF frontmatter (#84); new assertions precede failure. No full local suite or live adherence evaluation. Exact-head CI pending. Later coordinator receipts leave functional blobs unchanged.

## Independent review

V001: Standards/Spec/aggregate PASS, no findings, review1/2. Configured reviewer openai/gpt-6.1-sol MEDIUM; actual runtime identity unexposed. Full pinned procedure/diff/exact candidate files consumed; reviewer executed no commands. Static TDD/E2E/no-method/full-content/missing-pin walkthrough.

## Scope

Five functional files and curated I0010 records. Preserve #92 records/#95 delta rules; #97 evidence chain and #90 activation remain separate. No runtime authority, dependency, dispatcher, installation or release change.

## Integration risk and recovery

LOW. Native coordinators/children consume the handoff contract. Omitted or wrong-version methodology could cause drift; explicit trusted-root transport, pin provenance, refusal of missing required resources and consumption acknowledgement mitigate it without expanding permissions. Static assertions and semantic review support consistency, not future live adherence. Detect missing handoff/report resources; revert five functional changes while retaining historical evidence if needed. Rollback not live-tested and cannot undo actions already taken by an agent. Known #84 CRLF and live capabilities remain unverified limits. Required CI is not waived.

## Closure and acceptance

Implementation and scoped semantic review complete; publication/CI pending. LOW-risk expected-head integration and retention-safe post-integration branch/worktree cleanup authorized under current operator/project grants.

## Blockers and next action

Publish PR, inspect required CI on exact candidate, integrate only after all gates pass, then proceed to #97.
