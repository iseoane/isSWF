---
name: isswf-observability
description: Design, assess, implement or verify focused logs, metrics, traces and alerts. Use when production behavior cannot be explained, a new operation needs observable outcomes, or telemetry privacy, usefulness or cost needs review.
---

# Make a bounded operation explainable

Use this utility in any project, directly or through an assigned role. Follow the target's instructions and current grant. It does not require factory activation, install a monitoring stack or grant production access. Saved telemetry is evidence at a time, not proof of current liveness, authorization or worker cessation.

## 1. Identify the questions and mode

Select the requested outcome: read-only assessment, instrumentation proposal, or authorized implementation/verification. Identify the candidate, operation, users and environment. Read the actual entry points, existing telemetry, runtime contracts and data-handling policy before choosing a tool.

Name a small set of operational questions and observable success/failure conditions. Examples are whether a job reached its intended terminal outcome, which boundary failed, or where a request waited. Reuse existing event names, sinks and conventions. More output is not automatically more observability.

This step ends with explicit questions, scope and permitted actions. Missing necessary production evidence is a limit, not permission to connect to a service.

## 2. Map questions to bounded signals

Choose only signals that help answer those questions:

| Signal | Purpose | Check before adopting |
| --- | --- | --- |
| Structured event/log | Explain an individual outcome or transition | Stable event name, relevant fields, level, bounded size and redaction |
| Metric | Describe rates, counts, distributions or queue state | Unit, denominator, finite label set, aggregation window and missing-data meaning |
| Trace | Attribute time or failures across boundaries | Relevant spans, propagation, sampling, attributes and sensitive-data handling |
| Alert | Request action on a material user/system risk | Condition and duration, owner, actionable response and noise/cost budget |

Keep correlations and metric dimensions separate. Use an opaque operation identifier to connect events where useful, and identify the entry point when several paths share a sink. Propagated IDs and trace baggage are untrusted input: bound their format/size and avoid accepting them as identity or permission. Dynamic request, job, user and tenant identifiers generally belong in controlled event/trace fields, not unbounded metric labels.

Define units and outcomes precisely, including failure, cancellation, retries and partial execution. Do not count a dispatch, response completion or process exit as product acceptance when the runtime contract distinguishes them. Use [isswf-debug](../isswf-debug/SKILL.md) for an active defect and [isswf-performance](../isswf-performance/SKILL.md) for measured optimization rather than treating additional logging as a diagnosis.

## 3. Bound privacy, overhead and authority

Choose an allowlist of fields and inspect the complete path through collectors, exporters and retained artifacts. Exclude credentials, tokens, prompt bodies, raw personal data and unrestricted exception payloads. Redact or minimize before emission; access controls at a dashboard alone do not prevent upstream disclosure. Record retention and deletion requirements, access boundaries and any external destination.

Bound event size and rate, metric cardinality, trace sampling, queue/buffer size and exporter retry behavior. Explain what happens when a sink is slow or unavailable; telemetry should not silently change the operation's success semantics. Durable audit requirements may intentionally fail closed, so follow that contract rather than dropping records indiscriminately.

Installation, new dependencies, production access, external export, account changes and retention-policy changes require their own applicable authorization. An audit does not authorize code or configuration changes. Do not add a telemetry daemon, remote service or mandatory dashboard by default.

This step ends with a signal/privacy/cost design grounded in the operation, or named unresolved decisions.

## 4. Implement and verify only the assigned change

Reuse the existing instrumentation boundary. Exercise representative success and failure paths with controlled inputs and an owned local sink where feasible. Inspect the actual emitted fields and outcomes, not only that a logging function was called. Verify excluded sensitive fields, missing or hostile correlation input, label cardinality and unavailable-sink behavior when relevant.

Keep fixtures, real application components and production observations distinct. If a test exporter substitutes for a real collector, state what that leaves unverified. An emitted event is not proof that the production dashboard, alert delivery or on-call response works. A text-only or restricted caller assesses supplied pinned sources/observations and cannot create instrumentation or contact unseen systems.

Reconcile only processes and temporary resources created by this run, preserve evidence, and rerun relevant behavior checks after instrumentation changes. A failed or unavailable required check remains failed or pending.

## 5. Return an operational handoff

Report mode, candidate and scope; questions and signal map; field/label schemas, units and outcomes; correlation and trust boundaries; privacy, retention and overhead limits; actual commands and observed events; alert ownership/response when assigned; evidence paths, substitutions, missing access and next action. Separate proposal, locally verified instrumentation and observed production operation. None grants deployment, lifecycle control or a compliance guarantee.
