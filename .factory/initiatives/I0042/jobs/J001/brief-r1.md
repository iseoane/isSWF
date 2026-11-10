# I0042/J001: Diagnose native checkout binding and work retention

## Identity and authorization

Source: current operator asks to analyse #254 and register worktree work following a report of workers writing on main and partial loss after session closure. Request mode prepare-only for this initiative; no worker, implementation, model call, target-project access, public new issue, installation, global change, cleanup or merge. Current factory/target source base `25282b36be2098e7472c89572aa609f3f131df81`; intended future implementation base must be reverified. Coordinator owns these new records; no active writer.

## Outcome and scope

Prepare a causal diagnosis and a minimal supported correction for native Pi/Claude checkout/branch selection and preservation across interruption. Separate four questions: was a worktree required, was the selected native child actually bound to it, what checkpoint/ref retained its work, and what happened during interruption/recovery? A main-branch write may be a policy defect, unsupported binding, an explicit assignment or non-compliance; do not infer which from the symptom alone. Do not treat inability to find work as proof that its bytes were destroyed.

Read current plan acceptance. Compare possible coordinator context loss with policy ambiguity: `.agents/roles/references/worktrees.md` and both host guides currently allow sequential work in the assigned checkout without creating a new worktree. They require actual supported binding for parallel/external assignments. If the desired new policy is worktrees for every ordinary writer, state that as a proposed contract change rather than claiming the current rules already require it.

## Inputs and bounded evidence

- `.agents/roles/references/worktrees.md`: configured root, fresh branch/HEAD, owned checkout, verified native binding, preserve unique work before retirement.
- `.agents/hosts/pi.md` and `.agents/hosts/claude-code.md`: supported cwd/binding, explicit capability limits and no silent fallback around an unavailable required workspace.
- `docs/durable-work.md`: canonical plan/brief/attempt, checkpoints, unique evidence and separation of session state from process authority.
- `.factory/initiatives/I0010/plan.md` J007 and closed #89: earlier Claude prepared-worktree binding issue, not universal worker worktree enforcement.
- `.factory/initiatives/I0028/plan.md`: linked-worktree object-store compatibility, not a dispatcher solution.
- `.factory/initiatives/I0041/jobs/J001/A001.md`: #254 continuity hypotheses and native structural gate proposal; not a shared-cause verdict.

Needed incident facts are a sanitized summary: host/OS/factory version and native delegation route, intended versus actual branch/checkout, whether edits were committed and to which retained ref, last known file/report location, closure/resume/cleanup actions, and the approximate first deviation relative to compaction. Do not request a full private transcript, source tree, credentials or customer identifiers. If these are unavailable, name the limitation and use a disposable synthetic incident only after an explicit diagnostic execution start.

## Methodology and verification

Methodology considered: debug selected for causal chain/discriminating evidence; writing selected for the diagnosis/proposed contract; execution/verification principles selected if later interruption/recovery experiments are authorized; security not selected for OS isolation implementation (excluded), but preserve existing permission and data-loss boundaries. TDD not selected for preparation; choose a useful regression seam after cause is grounded. E2E considered: a future real native dispatch/interruption journey may be necessary, but no live model/OS experiment is authorized now. Any selected future method must be supplied from its then-pinned canonical resources before dispatch.

Compare ordinary/invalid/unavailable-binding and interrupted/resumed paths. Required outcomes include correct branch/cwd before edit, no write on the protected integration branch when excluded, retained committed/uncommitted evidence as promised, refusal on unknown actor ownership and no destructive recovery. Worktree existence alone is not acceptance. An injected fixture is not live host or power-loss proof. Use shared deterministic evidence where appropriate; native platform/host claims require their own supported mechanisms.

## Next boundary

Return findings with observed versus reported versus inferred facts, a minimal risk/benefit proposal, affected native paths and a sensitivity check. Do not broaden into retiring I0014, OS containment or implementing a new runtime. No commits of this brief, remote publication or implementation follow from its preparation. No actor/correction/cost allowance allocated. A later explicit start must bind model/effort, finite budget and exact inputs; no present record self-authorizes work.
