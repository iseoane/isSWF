# U2 fix2 result

The contract now keeps answered question IDs out of the pending list and rejects a resolution alongside pending questions in proposals and snapshots. The retry regression verifies that rejection leaves the current snapshot and history unchanged, while a follow-up with a new ID can be answered. Existing multiple-question behavior keeps `needs-info` or `ready-for-human` until all questions are answered. I removed the unused `_strings` and `_timestamp` helpers from `isswf/intake.py`.

Before the fix, the two new regressions failed because the invalid proposal and snapshot were accepted. After the fix, `python -m unittest discover -s tests -v` passes all 30 tests. `git diff --check` passes. This does not certify security or model identity. No subagents, network, remotes, or merges were used.
