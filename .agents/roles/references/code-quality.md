# Code quality

Use this reference at close for every code change. Match the review depth to the change and its risks. Follow project conventions and the assigned scope.

- Reuse helpers, contracts, and patterns after checking where they live and what callers depend on. Avoid duplicate helpers, pass-through wrappers, speculative layers, and internal fallback behavior without a real requirement.
- Trace the behavior from its entry point to its effect and check the affected consumers. Keep state and responsibilities local where practical.
- Remove duplicated logic and unnecessary defensive paths when the surrounding contracts make them redundant. Do not weaken meaningful behavior or checks to make the diff smaller.
- Make types and assertions truthful. Do not use casts, assertions, or test expectations that hide a mismatch from the compiler or reader.
- Keep changes within the assignment. Do not rewrite unrelated code or expand coverage without a reason tied to acceptance or risk.
- Run relevant project checks and report their exact outcomes. A passing check proves only the behavior it exercises.
