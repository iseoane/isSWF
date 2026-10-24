# Design principles

Load this reference when an assignment changes models, contracts, boundaries, or structure; it is not a mandatory checklist for every edit.

## Clarify domain language
**Trigger:** overloaded terms, conflicting business rules, or a change to domain relationships. **Action:** read the target's glossary and existing decisions, compare the terms with actual code and contracts, and test the proposed model against concrete normal and edge-case scenarios. Investigate technical facts; ask the operator only for unresolved product meaning. Capture agreed terminology in the existing glossary when authorized. **Limit:** a glossary is vocabulary, not a specification or a backlog. Preserve context-specific meanings and persisted names; clarifying a word does not authorize a schema/key migration or impose another project's terminology.

## Model first
**Trigger:** stateful logic, branching, concurrency, or repeated shape assumptions. **Action:** name data, ownership, transitions, and access patterns before writing logic; choose a shape that prevents contradictory states. Use types, a table, or a state machine only when they clarify the domain. **Limit:** superficial similarity does not justify an abstraction; do not design for hypothetical concurrency.

## Hide complexity behind useful interfaces
**Trigger:** designing or changing an interface, moving responsibilities, or making behavior testable. **Action:** state what callers must know: inputs, results, invariants, errors, side effects, ordering, configuration and relevant resource constraints. Put the behavior at the owner that can keep those facts local. Test through the supported interface and introduce an internal seam only when a real variation or verification need justifies it. **Limit:** interface depth is useful behavior behind a comprehensible contract, not a ratio of implementation lines to method count. A dependency-injection layer, adapter or wrapper must earn its maintenance cost; hypothetical alternatives do not justify one.

## Simplify navigation
**Trigger:** wrappers, duplicated rules, new layers, hidden state, or behavior that is hard to locate. **Action:** remove dead and redundant code first; keep one source per decision; reuse the canonical helper when it meets the contract. Add a layer only if it hides real complexity or reduces branches or state. **Limit:** fewer lines are not the goal. Follow conventions and do not reorganize a repository without an in-scope reason.

## Validate at real boundaries
**Trigger:** input from CLI, configuration, networks, storage, processes, trackers, memory, or agents. **Action:** parse and validate untrusted data at the boundary; convert it to domain concepts and propagate concrete errors. **Limit:** do not revalidate established invariants without a reason, but do not blindly trust persisted state, worker results, or partial recovery. Internal types do not prove external data is current or complete.

## Examine the resulting structure
**Trigger:** repeated conditionals, scattered invariants, broad parameter propagation, or a refactor claimed to simplify a change. **Action:** inspect the complete affected module and consumers, then compare the concepts, branches and coordination the reader must follow before and after. Prefer the smallest change that removes unnecessary moving parts at their owner. Consider alternatives or a bounded prototype when a consequential uncertain interface warrants it. **Limit:** moving the same complexity to another file is not evidence of improvement. File size is an inspection signal, not a quota; design exploration does not authorize a rewrite, prototype deployment or extra agents.

## Integrate requirements from the contract
**Trigger:** a new requirement affects consumers, data, documentation, compatibility, or acceptance. **Action:** reconcile the brief and grounding; treat the contract as foundational, propagate the change to affected consumers, and deliver verifiable steps. **Limit:** do not redesign the entire system for a local change or expand scope or authority. Distinguish an internal API from a public or persisted contract.

## Retain significant decisions once
**Trigger:** a hard-to-reverse choice involves a real trade-off that future maintainers would otherwise find surprising. **Action:** record the chosen option, alternatives, constraints, consequences and supporting evidence in the project's existing decision mechanism when authorized. Link it from the relevant work instead of duplicating the rationale. **Limit:** routine choices do not need an ADR. A proposal is not an accepted decision, and a decision record does not grant implementation, publication or changes to historical pinned inputs.

## Shared boundaries

Check permissions, privacy, secrets, retention, and data access at the appropriate boundary. Redact secrets and sensitive data from reports and evidence. Risks involving data loss, migrations, cancellation, or resources require explicit, proportionate treatment. Do not promise sandboxing, isolation, or containment the runtime has not demonstrated; if a required boundary cannot be verified, report the specific blocker.
