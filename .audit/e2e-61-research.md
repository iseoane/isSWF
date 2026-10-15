**Route:** findings-only final channel (authorized). No file written; no implementation/plan.

**Identity/inputs**
- Role profile: `.agents/roles/researcher.md` + `references/research.md` (methodology). Pinned checkpoint `d5986363…` — **Unknown**: could not verify those two files at that checkpoint; the grant restricts all Git to `-C /tmp/isswf-e2e61-u76tcs`, so `cat-file` there fails (`: object not found`) and main-repo Git/history is out of scope. Files were read from the current main-repo working tree only. This is a methodology/checkpoint-vs-grant gap for the coordinator to confirm, not a conflation of the input SHA.
- Brief: resolved inside the fixture repo at `/tmp/isswf-e2e61-u76tcs` — `git -C fixture` HEAD = `501a726dcd0925be8be7f669418c7430474cb900` ("Factory local demo inputs"), single parentless commit, `git ls-tree -r` confirms `.factory/jobs/J301/brief-r1.md` (blob `f76614d…`) + spec/plan/models/check/cli/sum. Brief read via `git show 501a726:…`. Worktree == HEAD for all 7 files (`git status` empty, `git diff HEAD` empty).
- Target base SHA = same `501a726d…` checkout (dispatch states independently same SHA; observed identical by reading fixture HEAD).
- Route identity: `.factory/models.json` @ `501a726` pins researcher first tuple `opencode-go/glm-5.3-flash`, effort `high` — **declared, not runtime-verified**; availability not behaviorally proven (per profile, runtime/effort verification is the coordinator's).

**Map (all at target base `501a726…`, real paths, reopened in worktree which equals HEAD)**
1. `spec.md:1–4` — contract/intent: optional `--multiply a b`; preserve default two-operand sum; acceptance: default `7 3` → 10, `--multiply 7 3` → 21, `--multiply -2 3` → −6. Excludes invalid-input policy, packages, network, remote PRs, runtime installs. Primary intent.
2. `sum.mjs:1` — `sum(a,b)` returns `a + b`. Helper to reuse/mirror.
3. `cli.mjs:1–2` — consumer: imports `sum`, prints `sum(Number(argv[2]),Number(argv[3]))`. **Observed: no `--multiply` handling exists.**
4. `check.mjs:1–5` — test: `assert.equal(sum(7,3),10)`, `assert.equal(sum(-2,3),1)`, prints "2 sum assertions pass". Extendable verification surface.
5. `plan.md:1–2` — sequencing only (J301 research → J302 proposal → adoption → J303 → J304). No code decisions.

**Checks (permitted, run in fixture)**
- `node check.mjs` → `2 sum assertions pass`, exit 0. Observed.
- `node cli.mjs 7 3` → `10`, exit 0. Observed.
- All Git commands were `git -C /tmp/isswf-e2e61-u76tcs` only: `log`, `rev-parse`, `ls-tree`, `show`, `status`, `diff`, `cat-file -t`. None touched the main repo's Git.

**Conclusion**
- **Observed fact:** multiply interface is defined in pinned `spec.md` but entirely absent from `sum.mjs`/`cli.mjs`/`check.mjs`; default sum behavior matches spec acceptance (10 for `7 3`).
- **Observed fact:** `check.mjs` currently asserts only `sum` (+ `sum(-2,3)==1`); no multiply test exists.
- **Unknown:** multiplexing of `--multiply` flag parsing (`process.argv` shift vs operand flag) — reserved to J302 proposal per plan; not decided here, nothing inferred/invented.
- **Unknown:** verification of the two factory methodology files at checkpoint `d5986363…` (see above).

**Changed paths:** none. **Risks:** line numbers are navigation hints; equipotent re-open required before any edit. **Next action (coordinator):** persist these findings, confirm the methodology checkpoint identity, then hand to J302.
