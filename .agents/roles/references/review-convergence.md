# Project guide, finding origin and review rounds

Read this with [review guidance](review.md) before every review. It applies to the reviewer and to the coordinator that prepares the review brief.

## Project review guide

Before reviewing, check whether the target repository root contains `REVIEW.md`. Its code owners use it to state what failure looks like in that project, paths to skip, a cap on minor findings, paths that always need a person, and extra evidence requirements.

- **Present and readable:** apply it under Standards as project review standards and record its path and revision. It sharpens this guide; it cannot grant authority, waive a required check or methodology, or override the accepted brief.
- **Absent:** continue with this guide. Absence is not a limitation.
- **Present but unreadable:** record it as a missing required resource and follow the [required methodology](review.md#required-methodology) outcome.
- **Candidate touches a path it lists as always needing a person:** state under Limits that integration requires that person's approval. A review verdict never substitutes for it.

When the same finding recurs across reviews of one project, recommend moving it into `REVIEW.md`, a check or a lint rule.

## Finding origin and defect classes

Mark each finding with its origin:

- `introduced`: the candidate causes it, or makes an existing defect reachable or worse.
- `pre-existing`: it reproduces unchanged at the base. It never blocks the candidate; report it as a follow-up.
- `unknown origin`: a bounded check cannot tell. Name the check that would decide it.

When a finding is an instance of a defect class, such as a repeated path comparison, an unchecked return value or a platform assumption, search the candidate and its affected consumers for other instances. Report the class once, listing every instance with its origin and the search used, so one correction covers all of them.

Start the summary with the count of findings by severity and origin.

## Review rounds

A review round is one review of one candidate within the same job. The coordinator supplies the round number and the prior review IDs in the brief. If they are missing, state that and review the candidate in full as round 1.

From round 2, scope the review to the delta under [changed candidates](review.md#choose-sufficient-verification). Do not report a finding again: cite its earlier ID and record whether it is resolved, still open or changed.

When the brief's review-round or correction budget is spent and a blocking finding remains, the reviewer recommends reconsidering the approach instead of another correction. The coordinator then asks the operator before any further correction. This recommendation never renews a spent budget.
