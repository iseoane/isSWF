**Revised contract — triage non-export, bounded closure.** The 97-file naive closure (`.audit/activation-44-link-closure.json`) is the recorded anti-target, not the export list.

**Base unchanged: A + B grafts.** A's `git archive <full-sha> -- <allowlist>` remains the actual shared fixed-revision install; B supplies exact-path/settings discipline.

**Bounded export policy:** export only files the two advertised skills name as required reads; stop there. No triage, no second-hop research/audit/S01/Python, no `spec-v1`/`plan-v1` (initiative-specific — `durable-work.md` itself says another initiative may use different paths), no `examples/`.

Bounded payload:
- `.agents/skills/isswf-coordinator/SKILL.md`, `.agents/skills/isswf-setup/SKILL.md`
- `.agents/roles/{worker,diagnostician,reviewer}.md`
- `.agents/roles/references/{design,execution,verification,bug-diagnosis,tdd,code-quality,comments,review}.md`
- `docs/durable-work.md`, `docs/model-routing.md`
- `docs/templates/{job-brief,attempt,review}.md`
- `.factory/models.json`
- `package.json` (manifest)

**Triage handling:** `.agents/skills/isswf-triage/SKILL.md` is not exported. Instead the coordinator gets one minimal paragraph correction: `[isswf-triage](../isswf-triage/SKILL.md)` becomes a plain historical mention/root code span stating U1/U2 triage is historical and unavailable in the installed package. No dangling link, no Python, no usable-triage claim. This is a deliberate bounded exception, not blind link-chasing; the audit brief cites the 97-file evidence as the reason.

**≤5 source files:** `package.json`; `tools/factory-package.mjs`; `docs/activacion-por-proyecto.md`; `.audit/verify-activation-44.mjs`; `.agents/skills/isswf-coordinator/SKILL.md` (the correction).

**Unchanged from prior contract:** `<store>/<full-sha>` provenance; one `{source}` package entry; preserve all other settings keys; malformed/conflicting SHA → refuse unchanged; repeat → byte-identical no-op; never touch attempt pins, `AGENTS.md`, `.factory/models.json`; atomic staging+rename; SHA name is provenance, host-trusted read-only is not a hostile boundary; no custom store, SQLite, or runtime jobs. Proof gates remain: fixture-v2 hashes before/after, deterministic materialize + conflict refusal + no audit/Python payload, dirty/malformed/conflicting settings unchanged, Pi 1.2.0 RPC `get_commands --offline --no-session --no-mcp` → exactly two skills with `--approve`, none with `--no-approve`.

**Uncertainties:** coordinator correction wording must preserve the conditional U1/U2 instruction intent; explicit-directory manifest discovery unproven; template inclusion vs. spec/plan exclusion is a policy line reviewers should confirm; install revision will be the implementation commit, not `fc598ae`.
