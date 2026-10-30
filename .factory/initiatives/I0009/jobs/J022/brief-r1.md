# J022: Portable confirmed host setup defaults

## Objective and authorization

The operator requests shipped factory defaults for Linux and Windows, explicit acceptance or customization during setup, and application to this repository. Approved selections: Claude coordinator/planner Opus low, worker Sonnet medium, researcher Haiku high, reviewer Opus medium; Pi coordinator/planner openai-codex/gpt-6.1-sol low, worker/researcher openai-codex/gpt-6-luna high, reviewer openai-codex/gpt-6.1-sol medium. Default worktree root is the primary repository's sibling `<repo>-worktrees`, with feature children. Default review allowance is up to two rounds, not two mandatory reviews. For this repository the operator additionally permits coordinator-justified further reviews; do not ship that exception as the factory default.

Apply project-local Pi selections and repository-local Git worktree preference; retain unrelated configuration and existing checkouts. Record Claude choices without claiming an actual Claude runtime was configured or verified from Pi. The operator subsequently authorizes normal PR integration into main for this preset and the four issue units only when risk is LOW and required review/checks and exact-head CI pass. No direct-main push, force, protection bypass, release, installation, cleanup, legacy runtime resumption or change to historical budgets. The four Windows issues remain separate ordered work.

## Base, scope and approach

Base: 82a1338b35df578cbd749011b35278c17f995f61. Branch: feature/portable-setup-defaults. No native delegation tools are currently exposed; coordinator performs independently authorized local instruction/configuration work, not an alternate dispatcher. Independent review remains pending if required before publication. Do not invent an unavailable actor or timeout grant.

Canonical preset belongs in the already distributed shared setup skill, not legacy models.json or a new runtime installer. Update host guides, worktree procedure, paired installation guides and focused instruction-contract tests. Installation ships the proposal; explicit setup acceptance authorizes local configuration. Existing approved choices survive unless the operator explicitly requests applying/replacing them, as here. No automatic provider calls, user-global settings changes, model fallback or unsupported effort clamping.

## Acceptance and verification

- The shipped setup skill defines all five requested roles for both hosts and the two-round allowance, with confirmation/customization before persistence and availability checks before dispatch.
- Native Pi settings use project-local startup settings and isswf-role agentOverrides; Claude uses its native supported settings/delegation and explicit pending capability reporting, never Pi routes.
- Worktree root derives from the canonical primary repository using native path operations on Windows/Linux, is stored locally as an absolute path, and does not move or create a checkout as a setup side effect.
- Existing custom choices, unrelated settings, historical evidence and budgets remain intact. Current repository's explicit replacement and extra-review exception are recorded.
- Focused host-portability, documentation, lint and whitespace checks pass on retained source. Static walkthrough covers first acceptance, customization/existing choices and unavailable capability; no live setup-adherence claim.

## Verification mode and current evidence

Combined verification is selected because setup instructions govern host settings and review limits: deterministic contract, path and packaging checks plus independent semantic assessment before integration. Provisional risk is LOW: no runtime writer or provider adapter changes; explicit acceptance, project-local persistence, availability refusal and unchanged worktree safety guards bound the plausible failures. A wrong instruction could select an unintended model/effort or checkout root, affecting cost or compatibility; no calls or checkout moves occur automatically. Detect through the displayed setup diff, effective host mapping and focused tests. Revert instructions for future setups; previously accepted host settings are not undone by a Git revert and must be reconciled locally. Runtime host/effort support remains deliberately unverified, not certified by static tests.

Coordinator observed PASS for focused host-portability, bilingual docs, full Linux portable quality (including actual Bun artifact and synthetic Bubblewrap task), locked ESLint, Knip and diff checks on the working tree. Packaging in that full run used committed base 82a1338, not the uncommitted preset; committed-candidate artifact verification and exact-head CI remain pending. Static walkthrough: initial setup asks for acceptance before writes; existing custom choices survive unless replacement is explicit; unsupported model/effort leaves the affected role pending without substitution. No live Claude/Windows setup journey or independent reviewer call was performed. Native tools remain unavailable, so independent semantic assessment is a delivery blocker, not an author-supplied pass.

## Quality inventory

Locked ESLint/Knip and documentation checks are present. Focused static instruction regression is tests/host-portability.mjs. No separate compilation/typecheck is applicable to instruction edits. Distribution uses existing skill allowlists; inspect that preset is included through the shared skill. No new duplicated configuration registry, runtime installer or dependency is warranted. Native Windows execution and independent review are not established by local static checks.
