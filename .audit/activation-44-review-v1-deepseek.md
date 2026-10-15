**Verified sound** — snapshot integrity: manifest hashes match all 7 payloads, `diffSha256` matches candidate.diff, diff applies cleanly to fc598ae and reproduces both modified payload files (I cloned to a private temp; source untouched). Export reads only committed blobs (`ls-tree`/`cat-file <sha>`), never HEAD/branch/worktree; allowlist has no Python/audit; in-payload Markdown links resolve; 18/20 allowlist paths exist at base (`package.json`, `tools/factory-package.mjs` are candidate additions). No installer rerun, provider, network, or repo write.

**Blocker 1 — Spec: activation silently coexists with another version of the same factory.**
`activate` matches packages only by exact resolved path. With an older SHA already declared, a new SHA is appended and exit 0 (`.audit/activation-44-independent-v1.json`: two SHA entries). Pi docs: distinct local paths are distinct packages (packages.md:127); duplicate skill names keep the first discovered skill and warn (skills.md:85). So the tool reports success while the old version stays effective — violating the decision's "uses one package entry" and "does not upgrade, replace" and the brief's "refuse conflicting package state". Must refuse when another version of this factory is declared; add a negative test.

**Blocker 2 — Spec/safety: source/store separation is lexical only.**
`isWithin(resolve(source), resolve(store))` does not resolve symlinks, so a symlinked store aliasing the source passes and publishes the SHA tree inside the source, exit 0 (`.audit/activation-44-alias-v1.json`), contradicting the documented "store is an absolute path outside the source repository". The identical lexical guard protects `--package`/`--project`. Needs a minimal realpath/ancestry check before any write, plus negative case.

**Blocker 3 — Standards/verification: refusals proven only by exit status.**
`expectRefusal`/`expectFailure` never assert the failure reason; the tampered-package activation runs against an already-dirty project, so a regression skipping `verifyPackage` would still fail for the dirty reason and pass. The packaged verifier has no multi-version and no aliased-store case, so its PASS cannot cover Blockers 1–2. Assert stderr reasons and isolate each negative fixture.

Not counted: `.pi` symlink external-write remains an unreproduced hypothesis; no overclaim.
