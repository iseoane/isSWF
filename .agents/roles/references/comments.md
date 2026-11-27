# Comments

Use this reference for every code change. Keep comments that explain a non-obvious reason, constraint, or invariant that the code cannot show. Remove comments that only narrate what the code does or repeat names and control flow.

Keep API documentation, license notices, lint directives, and comments that record a real constraint. Check whether an enforced type, test, lint rule, or runtime check can express a constraint more reliably. Do not widen the assignment to encode it; report useful out-of-scope options instead.

Comments describe; they never specify. The code and its tests are the behavior. When a comment and the code disagree, correct or remove the comment; a needed behavior change is a separate decision. Write constraints in the present tense as what the code does ("fails with `state-not-found`"), not as orders to the reader ("must not").

Remove a comment that excuses a workaround ("temporary", "hack because..."). Report the workaround as an issue or an out-of-scope option instead of keeping the excuse or writing it into new code. When the same comment names the constraint that forces the workaround, keep that reason in the present tense and drop only the excuse.

Do not remove comments mechanically. If a comment appears unnecessary, check whether it records a real external constraint or user-facing contract before deleting it.

## Audit existing comments

When asked to audit the comments in a scope, classify each comment:

- **Tautology:** it repeats what the code says. Delete it.
- **Stale:** it disagrees with the code. Correct or delete it.
- **Excuse:** it justifies a workaround. Delete the excuse and report the workaround; keep any constraint it names.
- **Reason or constraint:** it records why the code is the way it is. Keep it next to the code; do not move it to a separate decision document.

Check each deletion candidate as "Do not remove comments mechanically" requires. API documentation, license notices and lint directives are outside these classes; keep them. Report the count for each class. Report constraints a check could enforce as out-of-scope options; do not add them during the audit.
