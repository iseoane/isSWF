# J023: Corrected diff CLI input-deadline review

## Current unit and identities

Retain brief-r10/r9/r8 scope/authority: exact committed diff vertical slice, native Pi, explicit TDD/focused E2E/actual reviewer use, no content/status/Claude or extra actor. Target/factory `/home/iseoane/Work/isSWF`; base integrated main `b28e66257b8780ae7ed8a9275a419e1de79f2846`. First diff candidate `4bf5bbcc8cf56cf64a522b623d8c07caefec6d21`; corrected candidate **fd0b9993f6e339eaa2448258ac3b44171cd3e6ec**. Source working tree matches candidate; only coordinator-owned .factory records are dirty. No active author or source changes during review.

One fresh diff author consumed. V004 first diff review consumed1of2contexts and returned Standards/Spec/aggregate FAIL solely for unbounded public stdin collection. Actual reviewer identity/diff use and complete UTF-8 patch consumption passed on4bf5bbc. Preserve V004 FAIL; it is not relabelled after correction. Allocate the second and final current diff review context on approved native Sol6.1MEDIUM max900000ms, no retry/replacement/nested actors/model substitution. Older identity budgets remain spent and separate; remaining J023 unit ceilings are not automatically borrowed for diff retries.

## Required correction and observed TDD evidence

V004 source finding: CLI could await stdin EOF indefinitely before binding parsing/operation timer. Coordinator added actual public-process regression before production fix: spawn diff, write partial JSON, deliberately never close stdin. Observed meaningful RED: process did not cease and fixture's5s ownership kill guard had to terminate it. This is a behavioral liveness failure, not setup/syntax/auth failure.

Minimal shared CLI correction: fixed2000ms input timer destroys stalled stdin with binding-input-timeout; finally clears timer. Operation-specific bounded error/exit2 is preserved. The input deadline is separate from the parsed Git operation timeout and documented non-hard OS/filesystem-call limitations. Regression now checks partial diff and zero-byte identity streams, no parent EOF, self-cessation/exit2/no signal/bounded response before5s guard, and operation-specific reason. Focal complete CLI/Pi SDK GREEN. Only owned child is killed on test failure; no unowned processes or real repository mutation.

Updated canonical Pi guide and paired human guides describe complete JSON+EOF within2s and16384byte cap; E2E journey map documents the process control/limits. Test-value guidance/async examples consumed by coordinator: two cases cover public operation labelling and zero/partial streams; shared stdin path is not redundantly run through extra provider calls. Existing tests remain unchanged except new regression and cases reporting; no skipped assertions/retries/widened product deadline.

## Changed delta and exact-candidate checks

Correction from4bf5bbc changes six paths only: shared CLI, its existing public-process test, E2E map, canonical Pi guide and paired installation guides. Exact full corrected diff retained privately at tooling/.local/j023-diff-review/candidate-corrected.diff; source delta available from the exact commits, no moving branch substitution.

On committed fd0b999 coordinator full node tools/check-quality.mjs PASS, including actual committed package/materialization/offline installed release/Bun/Linux synthetic task; focal CLI/SDK, native Pi/subagent synthetic E2E, docs/static-host/ESLint/Knip/diff PASS. Existing installed0.83.0 extension path override explicitly used locally, no installation. These are supplied observations, not reviewer reruns. Native Windows remains future exact-head CI gate.

Direct CLI preflight succeeds for baseb28e662/candidatefd0b999: raw77061 bytes, SHA256 `cb845c79f7fdea13ecfbca29d0f7c59470eda69adb662bb1110b1c1494c0f065`, diff binding digest `aaf14169e40c7da0c594b5dff62d03a795c5138c9907464884134a4975b0c1e0`, timeout10000ms/raw131072. This is coordinator preflight only, not actual reviewer-use acceptance of the changed candidate.

## Independent review requirements

Fresh native reviewer receives explicit immutable identity and diff namespaces, same base/candidate/root/executable; identity output4096/diff raw131072. Personally invoke isswf_git_diff, match metadata and consume returned verified exact UTF-8 patch; optional identity confirms HEAD. Native-tool decoding/length/hash computations must be attributed to tool, not fictitious reviewer shell execution. Failure/unavailable/truncated tool output leaves actual-use acceptance incomplete.

Combined changed-candidate review: assess finite stdin collection/error/cessation and test discrimination/correction, retain unchanged applicable V004 conclusions with candidate provenance, inspect concrete newly exposed risks. Required role/review skill/guidance, security/design, selected TDD/E2E resources and applicable code-quality/comments/verification/Pi/writing guidance fully consumed, omissions explicit. No writes, shell/general Git, active mutation probes, network, install or other actor. Report Standards/Spec/aggregate separately, risk, path/line findings/minimal corrections, exact invocation and evidence limits.

## State

Corrected diff source is mechanically green and pending this final allocated independent assessment/new actual-use check. No diff PR/publication/integration or full J023 closure yet. Windows/Claude/content/status and subsequent integration authority remain visible future gates; no new isolation, binary, workflow, release or cleanup.
