## #55 v2 delta gate — readonly, independent

**Identity verified (read-only recomputation).** Using the same derivation as `verify-reviewer-snapshot.mjs` (sorted paths; NUL-joined `base`, `diffSha256`, `path`, `mode`, `sha256`), v2 recomputes to `f92c54e1a2f7…6994`, matching `durable-55-snapshot-v2/manifest.json` and `.audit/durable-55-identity-v2.json` (base `9cd0eeb…`); all six payload hashes and `candidate.diff` (`483d2cbf…`) match. v1 recomputes to `92b26b4f…`, same base, same six `100644` paths. No self-referential digest is embedded in the v2 payload.

**Delta v1→v2.** All six files differ; changes are confined to: grant-reference wording (guide `:30`, job-brief `:7`, attempt `:14`, review `:10`), the coordinator pointer translated to English (`SKILL.md:31`), the job-brief `## Independent review` section (`:24-28`), the attempt `Technical result`/`Product acceptance` split (`:26,35-40`), and the appended build-brief correction round (`:56-60`).

### Standards — fail

**F1 (blocking). Owner separation.** `docs/durable-work.md:22`: “A worker owns its attempt artifact… the coordinator integrates references into the plan without rewriting their conclusions.” `docs/templates/attempt.md:40` repeats that integration target. Yet `attempt.md:38` places a value, “Acceptance decision and evidence, recorded by the coordinator”, inside the worker-owned artifact, with no other record location named; Markdown has no side store, so filling it is a coordinator edit of the worker’s report — the same file contradicts itself (`:38` vs `:40`). Workers and reviewers write in exclusive checkouts (`durable-work.md:22`), so that coordinator write has no clean home. A coordinator-owned acceptance record belongs in the plan; the attempt should carry “pending at return” plus a link/record reference.

**F2 (blocking residual). Grant correction incomplete in the record.** `.audit/durable-55-build-brief.md:30` still states “External trusted grant path and full SHA carry authorization”, while the appended `:58` states operator conversation/record ID or external path, with full SHA only when Git-tracked. The prior review cited `build-brief:30` by name; v2 fixed the four actor-facing locations but left `:30` stale and self-contradicting.

**F4 (minor).** `job-brief.md:28` omits reviewer destination/model/effort, which `.agents/roles/reviewer.md` lists as a required input and the coordinator skill says the brief fixes separately.

**F5 (observation).** The English paragraph in the Spanish skill (`SKILL.md:31`) is intentional per the correction round; harmless. That rewrite compresses v1’s explicit “missing full SHA → block” into “must be a full Git SHA”, but `durable-work.md:26-28` still blocks. I did not re-run link/whitespace checks; `build-brief:60` says the v2 fixture and review-contract tests “have not been run here”.

### Spec — fail

**F1 deviates from the accepted decision.** `.audit/durable-55-decision.md` (“Forma elegida”): “Coordinador asigna IDs por proyecto y actualiza plan/brief; worker y reviewer producen sus artefactos en checkouts exclusivos. El coordinador integra las referencias sin editar sus conclusiones.” Design A, whose ownership half the decision selected, is explicit: “Worker owns attempt result artifacts… Coordinator reconciles result, updates plan and decides transition.” Both put the transition/acceptance record in the coordinator-owned plan and do not authorize a coordinator write in the attempt. `attempt.md:35-38` does the opposite; `build-brief:58` sharpens it to “coordinator-owned product acceptance”, which also collides with `GLOSSARY.md` (“Aceptación: la decisión del operador”) and `docs/spec-v1.md:84,283` (human acceptance). `spec-v1.md:269` requires the contract to differentiate process success, technical result, and product acceptance; v2 differentiates it, but in the wrong owner’s artifact and without naming the operator as decider.

**Concrete harm.** Acceptance is the post-review transition. Written into the attempt, it either edits an artifact already reviewed or forces a new review (`durable-work.md:40`). This unit demonstrates the churn: the correction round appended to its own attempt artifact (`build-brief:56-60`) after the v1 review, which is why this delta gate exists. Routine acceptance should not do that.

**Fixed items.** B1 is fixed in all four contract locations and matches the decision: the document-input checkpoint stays a full Git SHA; a grant may be an operator conversation/record, with a SHA only when Git-tracked; repository text still does not authorize. B2 is fixed: `job-brief.md:24-28` carries review required/criteria/constraints, matching reviewer.md’s required input and the decision’s exact-base/candidate review requirement.

**Minimal fix.** Plan is canonical for acceptance: replace `attempt.md:38` with a pointer, e.g. “Acceptance: pending at return; current decision and evidence in the plan acceptance record (`<path or record ID>`)” — no coordinator value in the worker artifact. Add one guide sentence that the coordinator records the operator’s acceptance decision/evidence in the plan and links it from the job. Reword `build-brief:58` to “operator acceptance recorded by the coordinator in the plan”, and fix `build-brief:30`. Optionally add reviewer model/effort to `job-brief:28`.

**Aggregate: fail** pending F1 and F2.

### Limits

- Read-only: no writes, no verifier execution (`verify-durable-55.mjs` writes `.audit/durable-55-fixture.json`), no subagents, network, or commits.
- Identity scope is stored bytes/digest only — not provenance, authenticity, behavior, or sandbox.
- `durable-55-behavior-160d4eec…` is a v1 fresh-reader status read at fixture checkpoint `0a8a8e62…`; `durable-55-fixture.json` records Git exit 128 for missing path/revision; `durable-55-markdown-proof.json` has no hash binding it to any candidate bytes, and all six files changed in v2. The guide’s pinning text (`:26-32`, except `:30`) is byte-identical to v1, so the v1 pinning result transfers only by byte comparison, not by re-execution.
- No runtime or blinded-study claim is made. Sources read: the six v2 payload files, v1 payload for delta, decision, design A, GLOSSARY, `roles/worker.md`, `roles/reviewer.md`, targeted `spec-v1.md` lines, both v1 reviews, behavior/fixture/markdown-proof, identity v1/v2. No other worktrees or logs.
