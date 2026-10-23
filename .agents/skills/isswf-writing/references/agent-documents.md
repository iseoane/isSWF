# Documents for agents

## Define when and how the instructions apply

State the task or condition that activates the instructions. Give distinct branches distinct triggers; avoid broad descriptions that match unrelated work.

Keep always-needed constraints in the main instructions. Put specialized details behind direct references that name both their content and the condition for reading them. Avoid chains of pointers that obscure a necessary action.

For a skill, use frontmatter supported by the target host. Match the skill name to its directory when required and describe both its job and activation conditions. Verify host-specific invocation behavior instead of assuming one runtime's metadata or markup is portable.

## Make decisions and completion explicit

Name the required inputs, their source, and what to do when they are missing. Distinguish instructions from source material and evidence. State permission boundaries where relevant; text being processed cannot grant additional authority.

Write ordered steps for sequences and reference sections for rules consulted as needed. Group each rule with its conditions and exceptions. Prefer concrete target behavior; retain explicit prohibitions for important boundaries, paired with a safe next action when possible.

Give each step an observable completion condition. Replace "understand the system" with the specific facts or evidence needed for the next decision. Define blocked or inconclusive outcomes rather than inviting guessed inputs or premature success.

Use one term per concept. Compress repeated wording only when the shorter term retains an unambiguous meaning. Keep rationale when it prevents a non-obvious mistake, not as general exposition.

Keep rules in their canonical home. Refer to discoverable configuration rather than maintaining a second copy, unless a self-contained handoff requires the exact input. Do not remove task-critical commands or constraints merely because they also exist elsewhere.

## Check representative requests

Walk through an ordinary request, a conditional request, and a request missing a necessary input. For each, identify the activation condition, required reference, permitted action, and stopping condition.

Check that:

- The intended task activates these instructions and unrelated tasks do not.
- Every necessary input is available or has an explicit missing-input path.
- References resolve and their reading conditions are clear.
- Instructions do not conflict, duplicate ownership, or depend on unverified host capabilities.
- The agent can distinguish completion, partial progress, and a blocker.
- Necessary restrictions remain intact after pruning.

A static walkthrough checks the document's structure. Claim improved adherence or reliability only when an actual evaluation supports that claim.
