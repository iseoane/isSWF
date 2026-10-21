# J001: Shared factory methodology for Pi and Claude Code

## Identity and authorization

- Initiative/job: I0004/J001, brief r1. Coordinator owns this record and the canonical plan.
- Request: "Pues haciendo uso de la factoría y del coordinador adelante con ello", following the accepted Pi/Claude Code portability recommendation.
- Authorized preparation: inspect this repository, consult official documentation, prepare local plan/brief and proposed implementation. Implementation is requested, but commits, concrete provider budgets/account coverage and project activation are not inferred from that request.
- Repository: `/home/iseoane/Work/isSWF`.
- Exclusions: OpenCode adapter, global installation/configuration, new dependencies, paid API calls, remote writes, push, merge, deployment, rewriting historical grants or active attempt inputs.
- Profiles: `.agents/roles/worker.md` and `.agents/roles/reviewer.md`. Native factory delegation only. Do not substitute a Pstack worker if native dispatch is blocked.

## Objective

Deliver one shared factory methodology with host-specific integration for Pi and Claude Code. Preserve the working Pi path. Prepare Claude Code installation and delegation artifacts plus a reproducible validation procedure, without claiming live model verification from static checks.

## Scope and acceptance

1. Common methodology describes role responsibilities and evidence without requiring Pi-only APIs. Keep one authoritative source rather than independently maintained copies of each role.
2. Host integration explicitly distinguishes instruction discovery, delegation, tools, permissions, persistence and recovery. Unsupported guarantees remain unsupported, not simulated as PASS.
3. Pi activation and native job checks retain revision/hash pinning, fixed routes, isolation, single-writer admission and conservative recovery. Do not rewrite the worker runtime merely to rename its host.
4. Claude Code artifacts follow official skill/subagent/plugin contracts. Do not enable bypassPermissions or silently map the current OpenAI worker route to an Anthropic model. A host-specific route needs an explicit decision if required.
5. Installation tests cover repeat/no-op, conflicting existing resources, preservation of unrelated settings, relative references and exclusion of development audit material. Do not install into the operator's actual global configuration.
6. Document exact static versus runtime verification and a small real Claude Code implementation/review scenario for J002. Executable version discovery alone is not authentication or model availability.
7. Independent semantic review covers Standards and Spec of the exact candidate. Mechanical checks additionally cover installation output. No global v1 re-audit.

## Grounding at the target base

- Target base: `fed46e4d0f9ebc1a5eef960531cf65b871bc5d90`.
- Document-input checkpoint: pending explicit local checkpoint permission. This uncommitted brief is not dispatch-ready.
- `package.json`: Pi-only manifest, two exported skills.
- `tools/factory-package.mjs:18-46,122-144,240-327`: explicit resource allowlist, Pi manifest validation and activation against tracked clean `.pi/settings.json`.
- `tools/isswf-job.mjs:16-17,93-112,185-250`: fixed methodology/runtime identity, package activation and native worker preparation. Preserve these existing guarantees.
- `tools/pi-worker-task.mjs:10-48,50-98`: native instruction projection and preparation. Reopen before editing.
- `.agents/skills/isswf-coordinator/SKILL.md`: shared coordination mixed with Pi-specific dispatch instructions. Separate host-specific instructions only where necessary.
- `.agents/roles/worker.md`: reusable execution policy with host-specific dispatch configuration.
- `docs/activacion-por-proyecto.md`: activation and planning-tool install are distinct from role runtime.
- `docs/local-worker-lifecycle.md`: native worker needs committed inputs, activated package, supported SDK route and exclusive admission.
- `docs/model-routing.md` and `.factory/models.json`: canonical routes and per-call authority requirements. A route is not a grant or proof of availability.
- `tests/factory-tools-install.mjs`, `tests/worker-methodology.mjs`, `tests/worker-route-admission.mjs`: regression targets.
- `tools/check-quality.mjs`: portable quality entry. Its package materialization checks committed HEAD, not uncommitted candidate documentation.

### External primary sources consulted

- https://code.claude.com/docs/en/skills, retrieved 2026-10-21. Claude Code discovers project `.claude/skills/<name>/SKILL.md`; invocation controls and plugin packaging need deliberate handling.
- https://code.claude.com/docs/en/sub-agents, retrieved 2026-10-21. Project `.claude/agents/` definitions differ from plugin agents; plugin `permissionMode`, hooks and MCP fields have documented restrictions. Model inheritance may be overridden by host policy. Do not claim model identity from configuration alone.
- https://code.claude.com/docs/en/plugins, retrieved 2026-10-21. Compare a local plugin against project resources before selecting the smallest safe installation path.
- Installed Pstack `poteto-mode/references/pi-tools.md` demonstrates platform mappings, not factory execution authority or a requirement to use its dispatcher.

Reopen current sources and verify ranges at the actual pinned input before dispatch. External current docs may describe a later behavior than the installed Claude version. Retain the exact relied-on passages in the pinned input if used by a tool-free researcher/planner/reviewer.

## Environment observations and quality inventory

- Node/Git and the Pi CLI are present. `pi --list-models` lists `openai-codex/gpt-6-luna` with reasoning support. Catalog membership does not prove current quota or account coverage.
- `.pi/settings.json` is absent in this checkout. Native job activation remains a prerequisite, not permission to create or install it implicitly.
- Operator clarification: Claude Code is installed but has no logged-in user. Live Claude model validation remains blocked on a separately authorized authenticated environment; do not initiate login or infer account coverage. Static artifact checks remain possible.
- `claude --version` returned `2.1.299 (Claude Code)`. The launcher `/home/iseoane/.local/bin/claude` calls `mise use -g` before execution. Do not invoke that wrapper again for validation without separate global-change authority. The version check did not initiate a model prompt; launcher side effects were not independently established.
- Disk observed before workspace allocation: approximately 129 GiB free on the project filesystem. Budget one implementation workspace and one review snapshot, at most 256 MiB each excluding existing reusable SDK. No full audit copies.
- Lint: ESLint configured under `tooling/quality`; not rerun for this preparation.
- Tests: portable tests under `tests/`; no portability implementation exists yet to validate.
- Build: not applicable to the current executable JavaScript resource package; validate any new artifact directly.
- Dead code: Knip configured under `tooling/quality`; not rerun for this preparation.
- Duplication: source/shared-role comparison and install-output assertions proposed. No clone detector installation.
- Existing uncommitted vision/plan edits belong to the preceding authorized documentation task. Existing untracked J005, J014 responses and `.factory/jobs/` are not this job's inputs and must not be staged, removed or overwritten.
- Engram not used as authority. Direct source grounding is sufficient; Codegraph is optional and was not required for this bounded map.

## Method and review

The coordinator performs this initial triage and code/document grounding. No product interview is needed for the agreed host scope. A researcher call is justified only if supplied sources need independent synthesis; the native text-only researcher cannot browse websites. A planner call is justified only if source exploration exposes competing consequential designs or genuine dependencies. Neither call is mandatory overhead.

The worker first compares the existing package path with a minimal Claude Code installation path. Return material route or safety decisions to the coordinator. Use focused behavioral TDD for installation/conflict logic, not tests that merely search prose. Run existing Pi regressions and test the actual generated artifacts. Keep implementation, tests and supporting docs in one functional delivery. J002 is separate because it needs a real host/account environment and observes the delivered integration.

Required review mode: combined. Independent semantic judgment is required for host capability claims, permissions, routing and discovery; mechanical checks cover exact generated resources and preserved configuration. Reviewer route is canonical `openai-codex/gpt-6-luna`, high, no alternate. Required package must include relevant unchanged contracts and observed candidate test results, not just a diff. Missing necessary evidence keeps the affected axis pending. Future CI/publication gates are separate.

## Dispatch and ownership

- Worker resolved ordered route: `[{"model":"openai-codex/gpt-6-luna","effort":"high"}]`. Selected destination is that sole tuple; actual availability/metadata remain unverified.
- Canonical model config path: `.factory/models.json` at target base above. Pin its exact digest in a committed native assignment before execution.
- Runtime base and methodology must follow the fixed native entry. Existing methodology pin is `37a56ebc902e94f21fc10666f33fceac44946af7`.
- Exclusive workspace: not allocated; normal runtime derives it from the private attempt store after admission. Do not implement in the coordinator checkout as a fallback.
- Actor/call authority: pending explicit finite scope and account coverage. Do not reuse consumed grants from I0001/I0003 or infer coverage from Pstack model mappings.
- Commit policy: no commit yet authorized. Commit only explicit task paths after permission; never stage pre-existing unrelated files.
- Next step: obtain missing local checkpoint/activation and native provider scope, then pin a self-contained job and dispatch via `tools/isswf-job.mjs`. If canonical route is unavailable, report the block rather than substitute models.
- Status: preparation complete, native dispatch blocked. No worker launched, implementation delivered, independent review passed, or live Claude Code model validation claimed.
