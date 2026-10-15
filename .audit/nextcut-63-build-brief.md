# Build brief — Task 63: activation and isolation design probe

**Status: proposal only; not an implementation authorization.** Scope: produce a bounded, evidence-led design/checkpoint for explicit fixed-version project activation plus minimum technical isolation. Do not execute the probe under this assignment.

## Objective and acceptance

Propose a bounded next cut for the agreed product direction: a shared installation of a fixed factory version, explicitly activated per project, without copying the whole factory into projects or overwriting project `AGENTS.md`. The design/probe remains separate from approving an installer or implementation. A separately granted future isolation probe may test one externally supplied exclusive actor in a disposable fixture; it must not claim this proves the system technically denies a second writer. Multiwriter exclusion is deferred to a separate future acceptance gate. This brief does not claim implementation, client readiness, or technical PASS.

A separately authorized future probe must use the same actual actor and profile for positive authorized-write and negative outside/tool/effect denials. Model obedience, prompt text, grants, and a model-tool allowlist alone are not a security boundary; a system-enforced policy may count if enforcement is demonstrated. Unverified or unsupported platform behavior blocks use with clients. This cut does not test lifecycle/coordination or multiwriter denial and cannot declare client readiness.

## Grounding and baseline

Read current sources before any future work; this map is not a substitute for reopening them.

- `docs/vision.md`, `docs/plan-v1.md`: client isolation is a prerequisite; activation/runtime, independence/recovery, and H1 are distinct. No universal implementation is selected.
- `docs/arranque-por-proyecto.md`: shared fixed-version installation + explicit per-project activation is the agreed product direction, not an approved installer mechanism; it does not mean copying the whole factory or overwriting `AGENTS.md`. Runtime dispatch and source protection remain unproven. `.factory/models.json` is canonical model-route config with manual interpretation/preflight; `isswf.config.json` and an operational state layout are not approved.
- `.audit/e2e-61-closure.md`: supervised demo candidate base `897ba1653a2a423fd7bc3ba0695efcd22c7eff81`, code candidate `aa88e9d29ee341fc4e48a0a7e7cfee0c90755a80`; explicitly no sandbox, client isolation, remote PR, recovery, installation, or H1 proof.
- `.audit/setup-62-closure.md`: baseline `9dc64bb34411f18f7ac01ee6fdb3443eced3b002`, source commit `e06f7b0`; setup skill is frozen and scoped, not a runtime or sandbox. Preserve pinned inputs and active attempts.
- `docs/research/pi-isolation.md`: Bubblewrap profiles in a Linux fixture demonstrated bounded filesystem/network/process denials and positive worker write; not production, portable, arbitrary hostile-code, or Pi+worker+model proof. Probe source/log are existing evidence only; do not rerun here.
- `docs/research/pi-runtime.md`: Pi client RPC `bash` remains outside the model-tool allowlist; this does not establish that every system-enforced allowlist/policy is ineffective. The control channel must not become worker authority.
- `docs/research/pi-lifecycle.md`: external owner + Pi RPC is provisional; recovery, arbitrary-child handling and client isolation are not proven. `systemd-run` was available but untested; cgroups do not replace filesystem boundaries.

Documented source revision in #61 is `d5986363551e96710c0aa015a3f3b7969a8cd55e`; it is not the disposable fixture base. Do not infer a current checkout HEAD from these historical IDs. Record actual source and target revisions in any future authorized run.

## Two grounded candidates; unresolved facts

1. Bubblewrap with explicit readonly factory/runtime and narrowly writable disposable project, under an external owner. Reuses the tested Linux mechanism. Unknown: actual intended production actor, mount origins, model/network/credential path, portability, and integration with worker processes.
2. Existing `systemd-run`/system sandbox with external owner. Availability is recorded, not execution or equivalent file isolation. Unknown whether the target platform can prove required path, symlink, subprocess, network, and authority denial. A cgroup/lifecycle result alone fails acceptance.

Compare only these minimal candidates in a future authorized design probe. Do not assert either is universal or sufficient from current evidence. Do not invent a third framework or silently fall back to text/readonly policy. Unsupported/unknown client platforms remain blocked.

## Scope and constraints

- These six local documents are the only writable paths in Task 63: `docs/vision.md`, `docs/plan-v1.md`, `docs/arranque-por-proyecto.md`, `docs/next-operational-cut.md`, `.audit/reconcile-63-build-brief.md`, and this brief. Spanish product proposal; this English brief.
- This Task 63 action is documentation-only. No implementation, probe execution, new research, agents, Python, network, push, other commits, runtime changes, installation, global configuration, credential access, or writes outside the six paths.
- No auto-implementation of #44, no auto-reactivation or resumption of its candidate. Before implementation, coordinator must explicitly reconcile #44 scope with this proposal and issue a separate grant.
- No requirement for SQLite, Python, installer, a new framework, universal full sandbox, runtime fallback, recovery, chat independence, real PR, multiproject or production support. Do not resume candidate Python/auto implementation 44.
- Preserve all existing `AGENTS.md`, settings/config and credentials. No global changes. Keep source revision distinct from target/version; do not mutate the old active version or active attempts.
- Trust/package discovery/skill loading is not a sandbox. Activation/discovery is not runtime worker dispatch.

## Checkpoint and later authorization

Checkpoint is this proposal plus the explicit unknowns and questions in the Spanish product document. No claim of technical PASS or client readiness is made. A subsequent task may request a separate bounded disposable-fixture probe, with its own actor/fixture grant, platform choice, fixed source and target identities, and cleanup authorization. The external owner must supply the exclusive fixture actor as a precondition; this does not prove technical denial of a second writer. A separate future acceptance must establish the multiwriter technical gate. The probe must stop if same-actor positive and negative proof or outside-client-secret denial cannot be established. Portable evidence does not authorize cleanup. The previously authorized push from `0d81c5f` to `5c85a38` does not grant a new push, PR, merge, deployment, or installation.

Before that task is granted, reconcile the paused #44 scope explicitly and decide target platform(s), source stable/candidate version identities, and how model/network authority is kept outside the worker. If unresolved, record a blocker rather than inventing a fact.
