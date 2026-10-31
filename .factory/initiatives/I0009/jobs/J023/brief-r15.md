# J023: Committed content — correction 2 after V006

Operator (2026-10-31) authorizes the correction and the subsequent review, and states the isSWF workflow already covers these steps without asking again. Scope/acceptance of brief-r13 and routing of brief-r14 unchanged except:

- Correction 2: one Claude `isswf-worker`, `sonnet`/`medium`, this checkout, branch `feat/j023-git-content` at `716aabf`, explicit-file commits only, no push.
- Fix V006 B1 (disable EOL conversion for fixture commits so CRLF survives `core.autocrlf=true`), B2 (add `node tests/git-content.mjs .` to the native platforms matrix in `.github/workflows/quality.yml`), S1 (native result size vs documented 64 KiB text limit: remove duplicated base64 or document/raise consistently, plus near-limit SDK test), S2 (nested path ok + directory `content-entry-type-refused` tests), S3 (doc duplication/wording), I1–I4 where trivial.
- TDD: for B1 and S2/S1 regressions, observe RED before production/fixture fix and report command, assertion, reason.
- B3: the content unit's original prospective RED is not retained; recorded as a deviation. Consequence: no evidence the initial content tests discriminated before production code; mitigated only by the new RED observations above. Disclosure is not a waiver; reviewer assesses it.
- Review round 2 of 2: `isswf-reviewer` `opus`/`medium` on the correction delta plus affected scope.
- Pi actual-use gate stays pending and blocks integration.
