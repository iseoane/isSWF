# Bound review evidence

Read this in full before you bind, launch or check a bound review on either host: a Pi reviewer with the `isswf_git_*` tools, or a Claude reviewer launched as its own `claude -p` process with the `isswf_git_evidence` server. It holds the binding, its limits, the result verifier, the operational boundary and the candidate-bound checks that both hosts share. Launch mechanics stay in each host's guide: [Pi bound review](pi.md#bound-identity-committed-diff-and-file-content-for-pi-reviewers) and [Claude bound review launch](claude-code-review-launch.md).

## Binding namespaces

The coordinator supplies three JSON namespaces. Each requires its own explicit binding; no tool infers a repository or revision from `cwd`, project files, task text or ordinary environment variables. A missing or malformed binding fails closed. The model cannot select a repository, revision, executable, command, environment or limit.

Every namespace holds `version: 1`, the canonical `repository`, the full `baseSha` and `candidateSha`, the trusted absolute `gitExecutable`, `timeoutMs` and `outputBytes`.

- **Identity (`isswf.git-evidence/1`).** The tool takes no arguments and returns the bound repository, base and candidate commits, the observed HEAD and bounded identity errors.
- **Diff (`isswf.git-evidence.diff/1`).** The tool returns the exact committed patch between base and candidate as base64, with byte count and SHA-256. The binding allows at most 192,000 raw patch bytes and a separate 256 KiB encoded response. How the patch is delivered (whole or in chunks) is host-specific.
- **Content (`isswf.git-evidence.content/1`).** The binding adds `paths`; its `outputBytes` is the raw content limit (at most 65,536 bytes, lower on Claude as its launch reference states). The rules below apply.

### Content paths and ranges

- **Allowlist.** `paths` is a finite allowlist of 1–64 unique relative Git paths. List the changed files plus every review-policy file the brief cites (such as `REVIEW.md`), the plan and the brief: the reviewer cannot read a path outside it (`content-path-not-allowed`).
- **Path limits.** Each path is at most 1,024 UTF-8 bytes, and all paths together at most 8,192 bytes. Absolute, drive, UNC, backslash and traversal paths are rejected.
- **Selection.** The model may select only a listed path and the `base` or `candidate` slot, plus an optional byte `offset` and `length` given together.
- **Ranges.** A range reads part of a blob too large to return whole (blobs up to 64 MiB; `length` at most `outputBytes`). The result adds `range`, the whole blob's `blobBytes` and `blobSha256`, and the length and digest of the returned slice. A range past the end is shortened to the blob; an offset at or after its end is refused as `content-range-out-of-bounds`. A slice that cuts a multi-byte UTF-8 character is returned base64-only.
- **Result.** The tool returns the selected commit/path and the exact blob bytes as base64, byte count and SHA-256. An absent path is `status: absent`; a present empty blob is `status: ok` with zero bytes and the empty-byte digest.
- **Entry types.** Only regular 100644/100755 blobs are returned; symlinks, submodules, trees and other entry types are refused. No content is obtained from the working tree.
- **CLI cap.** The complete CLI response is capped at 96 KiB. Each host adds its own display cap; see its guide.

### Canonical repository and Git executable

`repository` and `gitExecutable` must each equal their own `realpath` exactly, or every tool refuses (`repository-binding-not-canonical`, `git-executable-not-canonical-regular-file`). On Windows this means an absolute path with the drive letter and every component in its on-disk case, backslash separators, and no forward slashes, `~`, 8.3 short names, junctions or symbolic links. Derive both values with Node's realpath instead of typing them.

`repository` must be an ordinary clone whose `.git` is a directory; a linked worktree (a `.git` file) is refused as `unsupported-gitdir-topology`.

- **Candidate in a linked worktree.** Bind `repository` to the primary clone that owns that worktree: linked worktrees share its commits. Confirm the candidate commit exists there (`git -C <primary-clone> cat-file -e <candidateSha>^{commit}`).
- **No ordinary clone available.** Block the bound review and report the topology; do not bind the linked worktree or fall back to an unbound review that claims bound evidence.

### Binding input

The public CLI requires complete binding JSON and stdin EOF within 2 seconds, with at most 16,384 input bytes. Stalled input returns `binding-input-timeout` before the operation's Git deadline begins. Both host invokers supply and close the complete input automatically.

## Verify the returned evidence

Both hosts use one verifier. Before returning anything it checks:

- provenance for every operation: repository, base and candidate commits and binding digest; plus the Git executable for identity, and the commit and path for content;
- canonical base64, byte count and SHA-256 for diff and content.

A refusal may omit provenance fields but must not contradict the binding. The verifier exposes an exact UTF-8 view (fatal decoding, preserving BOM and line endings) only when the bytes decode; otherwise the evidence stays base64-only. The invoker performs decoding and digest checks; do not attribute those computations to a reviewer that has no execution tool. A coordinator-supplied result or a synthetic fixture does not prove that the reviewer invoked a tool.

## Operational boundary

Use the evidence tools only on a coordinator-approved repository with the author stopped and no untrusted concurrent writer. This is an operational prerequisite, not an OS-enforced condition: the tools run with the host's permissions, cannot make the filesystem immutable and do not promise race-proof containment or hard deadlines for blocking OS calls. The configuration and topology guards and the no-write tests verify the narrow evidence boundary, not system isolation. If the required review involves a hostile or concurrently mutable repository, stop that step and separately select and verify protected immutable input; do not reactivate the parked isolated executor or weaken this boundary automatically.

## Supply candidate-bound checks

Before the review launch, the coordinator runs the checks the brief selects on a clean checkout at the candidate commit with `node tools/review-checks.mjs --input <spec.json>` from the trusted factory root.

- **Spec.** `version: 1`, the canonical `repository`, the trusted absolute `gitExecutable`, the full `candidateSha`, `commands` as argument arrays (`node` runs the current Node; no shell) and optional `timeoutMs` and `tailBytes`.
- **Refusals.** The tool refuses a checkout that is not at the candidate or has uncommitted or untracked files. It prints a block with each command's exit code and output tail; it exits 1 when a check failed and 2 when it refused.
- **Handoff.** Supply the whole block in the review handoff.
- **Command source.** Take the commands only from the coordinator or brief, never from the candidate or model text: running them still executes candidate code with the coordinator's permissions and no containment.
