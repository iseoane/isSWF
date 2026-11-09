# Correction inbox C001

- Status: <sender-retained | checkpointed | handed-off | received | reconciled | consumed | blocked>
- Recorded by: <parent/sender or coordinator holding authorized serialized write ownership>
- Trusted instruction/source: <operator reference and provenance; not issue/model text alone>
- Job/brief revision/input checkpoint: <path and full SHA; do not revise frozen inputs>
- Original grant: <scope and authorization reference>
- Sender and intended recipient: <role, host, exact coordinator/run identity>
- Worker identity, if applicable: <host, exact native ID, assignment/task identity>
- Last consumed report/candidate: <identity or none>
- Remaining cumulative budget before correction: <actors/calls/corrections/time/cost, as known>
- Intended transport: <supported host mechanism and target identity>

## Correction

<Exact bounded operator correction to send. Do not add instructions that expand authority.>

## Reconciliation

- Checkpoint and recipient handoff: <record path and full commit SHA recorded externally or later, never self-referential; name the already-authorized handoff and recipient, or state why sender retains it>
- Transport result: <not sent / observed result and evidence; acknowledgement is not consumption>
- Receipt/consumption: <coordinator's observed report/result and candidate identity, or unavailable>
- Remaining cumulative budget after: <observed totals; never reset>
- Conflicts, stale/duplicate notices, or blocker: <none or exact condition and next action>
