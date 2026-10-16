# Local lifecycle acceptance matrix

This is a preimplementation contract, not a report of passing tests. The approved cut is recorded in `lifecycle-44-grant.md`.

| Case | Required observable evidence |
| --- | --- |
| Launch | One explicitly authorized attempt starts from pinned inputs in an exclusive disposable checkout. Metadata binds source implementation, input checkpoint, target base and actor identity. |
| Initiator exits | The launching chat/CLI can end while the worker continues. A separate fresh reader later observes actual output and terminal evidence. No dependence on a pstack child session surviving its parent. |
| Successful completion | Actual task output and independent checks pass. Terminal process evidence is separate from product acceptance. |
| Failed worker | Actual nonzero exit remains a failure with bounded diagnostic evidence; no success inferred from file existence. |
| Repeated launch | Same attempt cannot create a second writer, whether first is live, terminal or uncertain. |
| Missing/corrupt state | A fresh reader reports blocked/unknown, not safe-to-replace or complete. |
| Lost observer | Reattaching a reader does not rerun or mutate worker output. |
| Interrupted controller/supervisor | Demonstrate the chosen recovery boundary using actual termination of owned fixture processes. Preserve partial work, do not automatically retry uncertain effects. |
| Process identity | A stale or mismatched PID/identity must not authorize signaling an unrelated process or starting replacement. |
| Torn evidence | Incomplete metadata/result publication is refused or reconciled conservatively; never silently rewritten as success. |
| Bounded execution | Owned subprocesses and outputs have explicit bounds. Failure tests do not leave unmanaged fixture workers. |
| Checkpoint pinning | Changed current criteria/config do not rewrite an existing attempt's pinned inputs. |

Separate assertions for deterministic lifecycle execution, any actual model behavior, sandbox enforcement and artifact identity. A deterministic worker is sufficient to prove process lifecycle mechanics but not a native model-worker integration. If this cut stops at a deterministic adapter, label that limitation and do not call the model integration complete. No test result by itself completes broad #44 or proves exactly-once side effects, client readiness, lifecycle on other platforms or a backup service.
