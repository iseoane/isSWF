# Comments

Use this reference for every code change. Keep comments that explain a non-obvious reason, constraint, or invariant that the code cannot show. Remove comments that only narrate what the code does or repeat names and control flow.

Keep API documentation, license notices, lint directives, and comments that record a real constraint. Check whether an enforced type, test, lint rule, or runtime check can express a constraint more reliably. Do not widen the assignment to encode it; report useful out-of-scope options instead.

Do not remove comments mechanically. If a comment appears unnecessary, check whether it records a real external constraint or user-facing contract before deleting it.
