# J001: Repair Windows init

## Objective and authority

The current operator requests repair of init EPERM using platform-appropriate methods while preserving Linux compatibility, and asks to exercise the native orchestrator. Local diagnosis, implementation and checks are authorized. No push, publication, installation, global configuration change or additional API costs are selected. The report supplied in chat is not a published GitHub issue.

## Grounding

Examined base: d97d69868177bdb568affb64c726025478bf483a.

- tools/isswf.mjs: writeExclusive, syncDirectory, identity, ceased, retain and initialize connect directory fsync and Linux /proc identity to initialization.
- docs/installation.md and docs/local-worker-lifecycle.md: initial contracts require Linux for complete mutation and isolated worker workflows.
- .factory/project-setup.md: partial historical activation at a different Linux path, not current process evidence or a grant.
- .factory/models.json: worker route openai-codex/gpt-6-luna at high; no substitution permitted.

## Scope and acceptance

One functional local unit: platform primitives, CLI integration, regressions and bilingual installation guidance. Verify initialization, idempotence, pin/model preservation, live/ceased/malformed identity and fatal file-sync failure on native Windows and Linux. Preserve Linux identity record compatibility and directory sync. Windows directory-entry persistence after power loss is not promised. Full Windows worker sandbox/process lifecycle and legacy-state migration are separate incomplete capabilities, not completed by this repair.

## Execution and verification

The native isswf-job help command responds. No worker was launched: the documented lifecycle/isolated adapter requires Linux and this Windows source checkout lacks a reconciled activated binding. No alternate dispatcher or provider call was substituted. Coordinator-owned local work continued under the operator request.

Mechanical checks cover the focused behavior; exact compiled Windows artifact, full Windows recovery, and independent semantic assessment remain pending. Tests use disposable standalone Git fixtures; commits occur only inside those test repositories. No source commit is created. Private failure fixtures are retained rather than erased. Free space before fixtures exceeded 1 TiB; fixtures are bounded to source snapshots without dependencies, not runtime-store backups.

## Quality areas

- Runtime tests: Windows native and Linux/WSL init regression PASS; Linux release-package regression PASS.
- Static checks: syntax checks run; ESLint dependencies absent in the source checkout, no installation performed.
- Unused code/references: Knip dependencies absent; pending.
- Documentation: bilingual structure/link/example checker PASS, translations inspected locally.
- Build and duplication: Node release fixture built and exercised; Bun absent on this host. No dedicated duplicate detector or platform-parity inference.

## Known failed observations

Early test preload used a Windows path instead of file URL, then failed to update named built-in imports; both test-harness defects were corrected. A Linux npm fixture with a CRLF shebang changed a receipt hash; the candidate launcher is retained with LF and the release regression subsequently passed. Whole-suite execution directly against the Windows checkout fails on pre-existing CRLF skill frontmatter. A standalone Linux fixture with normalized checkout bytes subsequently fails in tests/reviewer-task.mjs:265 (blocked instead of response-complete). Cause is not established, and full-suite success is not claimed. The retained normalized candidate fixture is /tmp/isswf-init-linux-quality-20261026 inside Debian WSL; its log is /tmp/isswf-init-linux-quality.log. Preserve it for investigation; do not infer that this is a new product defect or a passing reviewer execution.
