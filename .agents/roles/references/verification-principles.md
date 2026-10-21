# Verification principles

Load this reference according to the change and its risk; do not run every review or test by default.

## Cause before patch
**Trigger:** a defect, regression, or recovery failure. **Action:** establish expected and observed symptoms and a safe reproduction when possible; read what is needed to construct it before concluding a cause. Form testable hypotheses and confirm a cause only with evidence connecting mechanism and symptom. **Limit:** if reproduction fails or the surface is inaccessible, report attempts, evidence, and the concrete pending probe; do not invent a cause or attribute correlation. Two fixes sharing a premise that fail the same gate require challenging that premise before repeating the fix.

## Selective behavioral tests
**Trigger:** the operator or brief explicitly requests TDD, a bug has a cheap local regression test, or significant logic has a practical focused test. **Action:** exercise behavior as its consumer does and assert the specific observable result; use TDD when that path is useful. **Limit:** the worker does not invent a TDD requirement. If a test is expensive, ambiguous, or unrelated to the change, choose the closest functional check and explain the limit. Do not confuse an implementation test with behavioral evidence.

## Verify the exact candidate
**Trigger:** before declaring a result ready or relying on an artifact for a conclusion. **Action:** verify the effective checkout, base, and candidate; exercise the surface or read the relevant value or evidence. Report the command and observed result; failures, inaccessible resources, and missing reviews remain pending. **Limit:** a build or agent response does not prove behavior it did not exercise. Evidence from an earlier candidate does not cover a changed candidate.

## Coherent units
**Trigger:** a multi-phase change, migration, sweep, or accumulation that makes review or recovery difficult. **Action:** define units with outcomes, dependencies, and checks; verify each checkpoint before building on it. Use vertical slices when they deliver behavior. **Limit:** there is no universal commit or line quota, or one PR per unit; mechanical refactors may need another sequence. A partial checkpoint is not closure.

## Product, accessibility, and risk
**Trigger:** a product decision, visible interface or API, data, permissions, shared contract, or quantitative claim. **Action:** evaluate relevant experience and accessibility; select security, data-loss, or integration review according to the affected surface. For performance or evaluation figures, record conditions and evidence explaining the measurement's limiting factor. **Limit:** do not impose visuals, benchmarks, or full panels on changes without relevant impact; without measurement, do not claim quota, speedup, or quantitative causality.

## Prototypes
**Trigger:** a novel interaction or consequential architectural decision without precedent, with plausible alternatives. **Action:** compare 2–3 prototypes against observable criteria before committing production code. **Limit:** choose directly if the contract has a clear solution or the alternatives do not affect experience, risk, or architecture. Avoid new exploration in a bounded assignment.
