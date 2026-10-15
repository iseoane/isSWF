## Delta gate — v2

**Standards: fail. Spec: fail.** The three v1 blockers appear fixed: grants can cite conversation or record IDs without inventing a Git SHA; the brief captures independent-review requirements; and the coordinator paragraph is now English.

**New blocker — acceptance ownership conflicts.** The guide says the worker owns the attempt artifact, but `docs/templates/attempt.md` asks the coordinator to record product acceptance in that same artifact. That creates competing writers across the handoff the design is meant to keep separate. This is a concrete ownership conflict, not just a wording concern.

**Minimal alternative:** keep final acceptance in the coordinator-owned canonical plan. The worker’s attempt can report technical results and leave acceptance pending, with a reference to the plan for the coordinator’s decision. Don’t have the coordinator write the worker-owned artifact.

**Behavior limits:** the reported Git checks support pinned reads, preservation of the old r1 input, and missing-reference failures (exit 128). The v1/v2 guide comparison shows those pinning rules are unchanged. The fixture and Markdown proof are bounded checks; they do **not** establish runtime authorization, ownership enforcement, process recovery, or agent behavior.

The retained v2 identity is `f92c54e1…45766994`; treat that as snapshot-package identity metadata, not behavioral evidence. I made no writes, delegated, accessed the network, or committed.
