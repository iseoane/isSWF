# Specialised skills and stronger design guidance

## Identity and authority

- Initiative/job: I0008/J001, brief revision 1.
- Target base and original source checkpoint: `b301d977ce336deca59861227f4dbc834f8739ee`.
- Trusted request: the operator requested implementation and verification of `isswf-security`, `isswf-performance`, stronger design references and an observability skill, then explicitly instructed "Arranca ya no esperes". The pending delayed wakeup was cancelled.
- Authorized scope: local implementation, integration, documentation and verification. One independent native source review may assess the retained candidate using the canonical reviewer route and verified subscription coverage, with one attempt, no retries and no additional API costs. No implementation worker or alternate dispatcher is assigned.
- Exclusions: source-checkout commits, push, release, global installation, production access, active security scans, real load tests, remote telemetry export, project pin changes, destructive cleanup and automatic migrations. Test fixtures may contain private commits and local package installations for pinned checks; these do not update this checkout or installed projects.

## Objective

Provide three reusable, proportionate task skills and improve the existing design reference. Users can invoke the utilities independently; relevant agents can use the same pinned methodology without inheriting global integrations or gaining tools and permissions.

## Functional unit and acceptance

One integrated unit includes each workflow, its role/coordinator selection, Pi/Claude distribution, restricted-caller transport, relevant tests and matching guides.

1. `isswf-security` distinguishes threat modeling, assessment and authorized hardening; maps assets/boundaries and plausible abuse; selects relevant controls; preserves safe verification, privacy, supply-chain and authority boundaries; reports confirmed findings separately from uncertainty. It neither certifies security nor automatically scans or modifies systems.
2. `isswf-performance` starts from a measured symptom or explicit budget, verifies correct work and comparable baseline, investigates the bottleneck, changes only when assigned and remeasures representative behavior. It records conditions, failures, variation and limits without invented speedups or universal numeric thresholds.
3. `isswf-observability` starts with operational questions, chooses bounded useful signals, distinguishes correlation from authority and event identity from metric dimensions, constrains privacy/cardinality/export/retention, and verifies actual outputs and sink failure where applicable. It does not create production access, a monitoring stack or proof of current process liveness.
4. `design-principles.md` reinforces active domain modeling, useful interface contracts, resulting rather than relocated complexity, and selective significant decision records. It preserves the target glossary, persisted keys and existing decision mechanism; no standalone design skill or mandatory ADR process is added.
5. Current coordinator, worker, diagnostician and reviewer guidance select the applicable skills conditionally. Planner and reviewer can read the improved design reference. Role keys, model routes, grants, actor budgets and supported execution paths stay unchanged.
6. Pi/plugin manifests expose fourteen distributed skills, with thin Claude entry files and complete resource/provenance allowlists. Core/package/plugin version remains unchanged until a separately authorized release.
7. Installed workers receive supplied skills read-only. Native diagnostic/review/planner callers select only known resources linked by their pinned profile and read them at that same methodology SHA. Historical pins retain their prior resource sets; missing selected resources or excess evidence fail closed.
8. Relevant portable, source/installed caller, packaging, compiled Linux sandbox, static and bilingual checks pass. A separate native host-discovery fixture verifies fourteen skills and source-checkout selection without global settings changes or model sessions.

## Grounding and reading map

- `.agents/skills/isswf-coordinator/SKILL.md`: conditional procedure selection, native dispatch, preparation and authority.
- `.agents/roles/{worker,reviewer,diagnostician,planner}.md`: profile contracts and actual selected resource pointers.
- `.agents/roles/references/design-principles.md`: canonical design guidance; consult `GLOSSARY.md` without turning it into a specification.
- `tools/{isswf-job,reviewer-task,diagnostic-task,planner-task}.mjs`: pinned profile/resource transport and capability limits.
- `tools/{factory-package,build-release}.mjs`, `package.json`, `.claude-plugin/plugin.json`: legacy/current payload contracts, inventory and source provenance.
- `tests/{release-package,bun-release,host-portability,host-discovery,source-host-isolation,reviewer-task,diagnostic-task,planner-task}.mjs`: actual artifact, host and caller evidence.
- `docs/{en,es}/{reference,development}.md`: current paired guides and discovery claims.
- Advisory upstream reading: Addy Osmani `agent-skills` revision `aeac41d4d005999432bb7312f7ff06383a91d59d` for security, performance and observability; Matt Pocock `skills` revision `5beb35b040e3de97e54fa9e386d7e42d15c295c2` for domain/interface design; pstack benchmark principles. No upstream package, hooks, dispatcher or blanket policy is installed.

## Verification and risk

Use combined verification. Inspect the procedure's ordinary, conditional and unavailable-capability branches semantically; check manifests, links, provenance and pinned payload bytes mechanically. Existing caller fixtures cover selected content and historical source behavior. The compiled offline worker verifies resource readability and actual read-only mount controls using a synthetic SDK, not a provider-backed worker task.

Shared instruction transport and security/privacy advice create medium integration risk. Wrong or missing resources could block preparation, while overbroad instructions could imply unsupported actions. Same-pin source reads, finite evidence bounds, explicit text-only limits and conditional authority rules address these risks. No new runtime enforcement, compliance guarantee, measured performance improvement or model-adherence result is claimed merely from Markdown or inventory checks.

The five existing quality areas are applicable in proportion: portable behavioral tests and artifact checks; locked ESLint/static checks; Knip configured unused/unresolved analysis; no separate source compilation/typecheck (Bun artifact compilation is tested); and focused inspection of repeated resource lists without adding a duplicate-rule registry or installing a clone detector.

Select an independent native Standards/Spec source review of the exact retained candidate before describing it as independently reviewed. Use `openai-codex/gpt-6-luna` at `high`, the unchanged canonical reviewer route, with current availability/effort/subscription preflight. A failed or unavailable required review remains pending; do not substitute another dispatcher or a self-review.

## Ownership and stopping point

The current coordinator is the only source writer. Temporary source fixtures and their exact resource identities are retained privately for packaging and review; the code candidate is frozen before the independent call. Keep raw transport and host records under ignored `tooling/.local/`, and retain only a concise evaluation receipt with this job.

Stop after implementation and local verification, with independent review status and all limitations reported. Do not commit, push, publish, change installations or reinterpret prior release/provider grants. A later operator decision controls those boundaries.
