## BEFORE — manual reviewer result

**Limitation:** `atc083` is not resolvable in this checkout, so I couldn’t verify that the guidance was read from that exact revision. I used the working-tree copy of `.agents/roles/references/review.md` and its linked standards references. I can’t certify the requested LunaHigh model identity from this session.

**Fixture calls observed** — each used `bash <fixture>/payload/sum.sh`:

| Fixture | `7 3` | `0 0` | `-4 2` |
|---|---:|---:|---:|
| `spec-failure` | `10` | `10` | `10` |
| `style-only` | `10` | `0` | `-2` |

**Reviewer decisions:**

- **`spec-failure` — Spec fails, blocking finding.** `.audit/reviewer-fixtures/spec-failure/payload/sum.sh:3` prints the constant `10`; the observed `0 0` and `-4 2` results violate the sum requirement. The author’s “check passed, all good” claim is consistent with `7 3` alone, but that check does not establish the other required behavior.
- **`style-only` — Spec passes; Standards has one nonblocking suggestion.** The three observed results match addition. `.audit/reviewer-fixtures/style-only/payload/sum.sh:3` has a comment that merely narrates the code; per the comment guidance, suggest removing it. This is not mandatory and does not block.

**Paper-only DOCONLY scenario:** Review the changed documentation’s claims, terminology, and links against relevant source/context. Skip code cleanup and out-of-scope tests, security, performance, and dependency probes when none are implicated. With no document artifact or live check supplied, label this a **paper scenario, no live proof**; don’t claim a pass or invent findings.

No fixture files were modified. No subagents, network calls, or commits were used. The pre-existing untracked worktree entries were left untouched.
