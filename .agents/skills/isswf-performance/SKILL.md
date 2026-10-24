---
name: isswf-performance
description: Investigate measured slowness, verify a performance budget, or optimize a demonstrated bottleneck. Use for profiling, regressions, representative benchmarks and evidence-based performance comparisons.
---

# Explain and improve measured performance

Use this utility in any project, directly or through an assigned role. Follow the target's instructions and current grant. It does not require factory activation or provide a profiler, benchmark service or execution permission. Optimize an observed problem or an explicit requirement, not every code change.

## 1. Define the question and permitted work

Identify the affected user journey, candidate and baseline, the metric and unit, representative workload and correctness condition. State the intended outcome before measuring: diagnose only, evaluate a budget/comparison, or implement an authorized optimization. Use a documented budget when one exists; do not invent a universal latency, bundle-size or coverage threshold.

Read existing run commands, tests, instrumentation and relevant consumers. Separate application behavior from provider/network latency, startup, warmup and fixture overhead where these differ. Name required access, data, tools, load and spending limits. Missing essential baseline or access blocks only the affected claim.

This step ends with a reproducible workload, observable correct result and measurement boundary.

## 2. Establish a valid baseline

Use existing harnesses and representative input sizes. Record exact source/artifact identities, runtime/tool versions, machine, concurrency, configuration and cache state. Run each side under equivalent production-relevant settings; comparing a tuned build with a debug/default configuration does not establish an implementation advantage.

Check outputs and forbidden effects as well as time. Count failures, skipped work, retries and timeouts. Confirm the measured operation actually executed and completed inside the measured interval. A fast error, cached no-op, help-only invocation or unconsumed lazy result is not the intended workload.

Choose enough repetitions for the question and cost. Alternate comparable candidates when possible to reduce warmup and environmental drift. Retain individual samples and report sample count and spread; a single functional run is not a throughput benchmark. If differences overlap variation, report no demonstrated difference or an inconclusive comparison.

This step ends with a correctness-checked baseline and known conditions, not just a number.

## 3. Find the limiting work

Profile or inspect actual runtime observations in a separate diagnostic run when measurement overhead matters. Locate the limiting component and connect it to source: CPU, allocation/GC, query plan, lock contention, I/O, network, queue or load generator. A plausible pattern in the diff is a hypothesis until supported by relevant observations.

Use the symptom to narrow the probe. Frontend work may need interaction/paint and network traces; backend work may need database plans, pool/queue observations or CPU/heap profiles; CLI work may need startup, subprocess and receipt-check timing. Tool and platform support remain explicit limits, not reasons to assume equivalent observations.

Protect profiling data from secrets and personal information. Production profiling, service installation, telemetry export and load against shared systems require their own permission. A text-only caller can assess supplied results but cannot claim it profiled or benchmarked anything.

This step ends with a supported bottleneck and bounded remedy, or an inconclusive diagnosis and the next discriminating probe.

## 4. Change one relevant cause and remeasure

Implement only when assigned. Address the identified bottleneck at its owner, preserve semantics and resource limits, and rerun correctness checks. Do not introduce caching, concurrency or a new dependency solely because it is a common optimization. Inspect new invalidation, ordering, memory, privacy and failure behavior where introduced.

Repeat the same valid workload under comparable conditions. Check both the targeted measurement and the end-to-end user path; a local helper improvement does not establish the same end-to-end gain. Explain why the measured effect is compatible with how much work changed. Keep a change only when its measured benefit and maintenance cost meet the assignment; do not silently discard evidence or operator edits when an experiment fails.

## 5. Return reproducible evidence

Report the question, candidate/baseline and workload; actual commands, conditions, counts and samples; correctness/error outcomes; bottleneck evidence; changes if authorized; observed effect with units and spread; regression coverage, retained artifacts and residual uncertainty. Distinguish measured facts from explanations still under investigation.

Use a result such as measured improvement, regression, no demonstrated difference, or inconclusive. Never claim a speedup from an unrun command, mismatched workloads or a required check that failed. Name what remains unmeasured. This skill adds no mandatory performance stage, model route, deployment or publication authority.
