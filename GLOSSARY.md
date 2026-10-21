# isSWF language

[Español de España](GLOSSARY.es.md)

Terms for discussing the product, its work, and its deliveries. Use the same language in issues, briefs, and reviews. This is vocabulary, not an execution contract or a feature list.

## Language

**Operator**:
The person who sets priorities, authorises assignments, and accepts deliveries.
_Avoid_: customer when referring to the person directing the factory.

**Coordinator**:
The role responsible for project context, procedure selection, and supervision of delegated jobs.
_Avoid_: boss, manager, orchestrator as alternative names for this role.

**Assignment**:
An authorised objective with scope and success criteria that may require one or more jobs.

**Job**:
A bounded execution unit with its own brief, dependencies, result, and checks.
_Avoid_: session when referring to a job.

**Slice**:
A bounded functional unit that delivers complete, independently verifiable behaviour. A job may cover several slices; an assignment may require several jobs.
_Avoid_: layer as the unit of feature delivery.

**Brief**:
A job's contract: objective, scope, context, constraints, and success criteria.

**Grounding**:
Checking an assignment against the code and relevant sources before acting on it.
_Avoid_: research when implying that an extra researcher is always required.

**Worker**:
An agent responsible for executing a job within its brief using relevant skills.
_Avoid_: implementer when the job is research or another task without code changes.

**Reviewer**:
An agent with independent context who assesses a candidate against explicit criteria and returns findings or a verdict.

**Candidate**:
The exact version of a delivery being checked, reviewed, or accepted.

**Evidence**:
An observed result attributable to a specific candidate or context that supports a claim.
_Avoid_: PASS without stating what was checked.

**Technical closure**:
The condition of a delivery that meets its assignment and required checks without open blocking findings.
_Avoid_: done when acceptance or integration is still missing.

**Acceptance**:
The operator's decision to accept a specific delivery as fulfilling the assignment.
_Avoid_: merge as a synonym for acceptance.

**Blocker**:
An identified condition that prevents a job from progressing until resolved.

**Work session**:
A set of activities that the operator explicitly bounds and closes to review results and outstanding work.
_Avoid_: conversation or process as synonyms for a work session.

**Retrospective**:
Analysis of a job's or session's evidence to propose improvements to the project or factory.
