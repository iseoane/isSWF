# U2 fix result

Base `363dd7158532dd0ff1d2c288c5c4e5c937d0d7bf`; branch `work/u2-fix`. Local commit `dfc3bb72d4d91f4b167658fd9906ed8e772ad2af` (`Fix U2 decision reconciliation invariants`). No merge or remote operation.

The three regression tests were red before the production fix. Omitting a registered answer produced `AssertionError: ContractError not raised`; changing grants with answers produced the same failure; answering one of two questions returned `needs-triage` instead of `needs-info`. The fixes retain all answer references, reject a changed grant before publication, validate snapshots at publication, and keep the human-wait state while questions remain. The answer transition preserves the original `observed_at`.

Baseline: `python -m unittest discover -s tests -v`, 24 passed on `363dd71`. After the fix: the same command, 28 passed. `git diff --check` passed. The CLI test prepares the new unsupported-duplicate grounding example as `ready-for-agent`, with observable research acceptance and no resolution.

The skill and usage docs now distinguish observed source fields from summaries, explain that ready means the next bounded step such as grounding is ready (not completed or authorized), and prohibit unsupported duplicate claims or promises of implementation, integration, or delivery. The grounding example stays within the fixture grant.

No independent review or parent runtime check was performed. This report is intentionally uncommitted for the parent review.
