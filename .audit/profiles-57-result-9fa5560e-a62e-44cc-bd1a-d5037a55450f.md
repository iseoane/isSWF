**#57 researcher correction gate — frozen `.audit/profiles-57-researcher-snapshot`. Readonly; no writes/delegation/network/worktrees/history.**

**Identity PASS:** payload hashes equal manifest (research.md `e26faae2…f133`; researcher.md `bd55b162…8d8d`; brief `f99bb9d6…9bad1`); `candidate.diff` empty; digest recomputes to `e5f473d4…8f8f` using review.md's NUL-delimited base + diffSha + sorted path/mode/content record. Exactly three paths.

**Standards — PASS.** Findings-only vs artifact permission now consistent: researcher.md:12 offers path+write-permission or findings-only channel; :23 conditional write/return; :36 returns "return route", optional "changed paths", explicit write-state. research.md:7,47 mirror. Provenance corrected: isolated child `a7d0511d2535f7355`, not parent session; child made no subagents; LunaHigh declared for dispatch (`openai-codex/gpt-6-luna`, high), runtime unproven; §79's evidence-relative "no evidence GLM" is acceptable. Residual prior minors (grounding-map boundary ranges; unretained link-check output) non-blocking.

**Spec — PASS.** Live-brief remedy correctly rejected. Text forbids live/untracked job briefs and requires briefs present at committed full-SHA checkpoints (researcher.md:8; research.md:7–8; brief:9,34,70), classifying the build-audit brief as build source artifact, not job brief. Matches `docs/durable-work.md` pinning and #55 decision; pinning clarified, not weakened.

**Limits:** snapshot validates bytes/digest, not authenticity, runtime, or behavior (manifest scope). Role behavior untested; no full closure. Planner #57 review (`profiles-57-review-cb5d3…`, FAIL) is separate and uncured here. Runtime model/effort declared only.

**Verdict: artifact PASS on both axes, corrections confirmed; limits above. No minimal blockers.**
