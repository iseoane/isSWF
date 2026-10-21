# Bug diagnosis

Shared methodology for investigating defects with proportionate precision. A worker may use it directly for a simple bug; separate diagnosis only when uncertainty, intermittence, or scope warrants it. Triage organizes intake and may identify missing information, but does not establish a cause.

## Establish the symptom

- Record expected and observed results, the affected surface, known conditions, and examined revision. Choose a signal that distinguishes this defect from nearby failures.
- Attempt reproduction on the real surface with commands or actions another person can repeat. Retain enough output for comparison, redacting secrets and sensitive data.
- For intermittent failures, repeat or narrow conditions only when safe and authorized. Report attempt counts and outcomes; failure to reproduce does not prove absence.
- If reproduction fails, list attempts, unavailable observations, and the next concrete probe. Read the code and context needed to design a safe, discriminating reproduction before concluding a cause. If the symptom remains unobserved, mark the diagnosis inconclusive and do not attribute a cause.

## Investigate causality

- Trace the path from input to observed effect. Read relevant contracts, invariants, consumers, and tests at the actual baseline.
- Form hypotheses that predict distinct observations. Prioritize by information gained and cost; a simple case may need only one hypothesis. Reject each with evidence or retain its uncertainty.
- Distinguish correlation, indications, and confirmed mechanisms. No hypothesis becomes a confirmed cause without evidence connecting the mechanism to the symptom on the same relevant path.
- Look for the same pattern elsewhere when the risk warrants it. Do not turn a general suspicion into an open-ended sweep.
- Use targeted instrumentation to distinguish hypotheses. Bound its location, duration, and data; sensitive surfaces require authorization. Record additions and remove temporary instrumentation when finished.

## Recommend a verifiable fix

- Identify the smallest candidate fix that addresses the confirmed mechanism. Do not prescribe changes for hypotheses that remain open.
- Propose a regression test only when a seam reproduces the real pattern. Name that seam and the observable behavior it would test. If none exists, state the limitation; do not force a superficial test or make TDD mandatory.
- Bound the consumers, paths, and contracts that could be affected. Distinguish observed impacts from inferred risks and explain the basis of each.
- Recommend whether the worker can proceed under the current brief, needs more grounding, or requires a coordinator decision or authorization. Do not expand the approved objective.

## Diagnosis package

Return in the job result:

- Expected and actual symptoms, surface, baseline, and reproduction conditions.
- Executed commands or actions, relevant outcomes, and paths to redacted artifacts.
- The causal chain with paths, symbols, and lines; distinguish observed evidence from interpretation.
- Rejected and open hypotheses, with evidence or the required probe.
- A regression candidate and seam, or the concrete reason no suitable seam exists.
- Blast radius, consumers, risks, authorization boundaries, and blockers.
- The recommended next step and the evidence that would enable it.

Do not report outcomes for unexecuted commands or present fixture examples as executed tests. The package recommends and supports a decision; the worker verifies current code before editing.
