# Project worktree locations

Use this procedure during explicit setup and before creating a Git worktree for an authorized assignment. This is a coordinator procedure using Git, not a host hook or a runtime sandbox. It does not change Pi task snapshots under `<runs-store>/<attempt-id>/workspace` or make worktrees valid for callers that require standalone repositories.

## Resolve the local choice

Resolve the canonical primary project root and common Git directory. Use the primary root even when invoked from a linked worktree. Inspect `git worktree list --porcelain` to distinguish them; ambiguous ownership blocks configuration.

The sole location setting is `git config --local --get-all isswf.worktreeRoot` in that repository. No value means unresolved, not permission to create a worktree at a host default. Require exactly one nonempty absolute value. Reject multiple values, relative paths, symlink aliases and a root inside the primary project, an existing linked worktree, or the installed factory package. Check canonical existing ancestors when the destination does not exist yet. A missing or invalid root blocks creation, not unrelated work. Do not repair invalid configuration silently.

During setup, preserve a valid existing choice. If it is missing, propose a root under `${XDG_DATA_HOME:-$HOME/.local/share}/isswf/worktrees/`, followed by the primary repository basename and the first 12 hexadecimal characters of the Git blob hash of its canonical common Git directory path. The suffix distinguishes separate clones with the same basename. An absolute XDG data directory is required; otherwise use `$HOME/.local/share`. Show the actual proposed absolute path and offer acceptance or another external directory. An existing settled choice needs no repeated question. An operator-approved external-root default covers the derived per-repository path.

After approval, set `PROJECT` to the primary root and `WORKTREE_ROOT` to the validated absolute choice. Run:

```sh
git -C "$PROJECT" config --local isswf.worktreeRoot "$WORKTREE_ROOT"
git -C "$PROJECT" config --local --get-all isswf.worktreeRoot
```

The value stays in the common repository's local Git configuration, outside tracked files, and is shared by its linked worktrees. Do not copy the absolute path into tracked setup records, host settings, briefs intended for publication, or global Git configuration. The shared setup record may state that the local choice is configured and name this key, without the value. Choosing a root does not create it, move worktrees, authorize actors, or grant execution. Explicitly approved relocation is separate from selecting the root.

## Create and delegate

Before each creation, re-read and validate the local choice. Require an authorized assignment, full base SHA, fresh branch and worktree identity, exclusive ownership, available capacity and disk space. The destination must be a previously absent direct child of the approved root. Never use job text as a path or shell fragment. Do not reuse an occupied destination or remove it to retry.

After validating `PROJECT`, `WORKTREE_ROOT`, `WORKTREE_ID`, `WORKTREE_BRANCH` and `BASE_SHA`, create the external root if absent with private directory permissions, then run:

```sh
git -C "$PROJECT" worktree add -b "$WORKTREE_BRANCH" -- "$WORKTREE_ROOT/$WORKTREE_ID" "$BASE_SHA"
```

Verify the returned root, branch and HEAD with Git. Supply that exact absolute checkout to the child through the host's supported working-directory interface and required assignment context. In Claude Code, do not use automatic worktree isolation when it would create a second checkout under `.claude/worktrees/` or cannot select the prepared root. If the native caller cannot bind the child to the prepared checkout, block that dispatch and report the capability gap; do not silently use the main checkout, a different dispatcher, or a host default. Instructions alone do not enforce the child's working directory.

## Relocate or retire existing work

Inspect registered worktrees, branch ancestry, dirty changes, staged content, untracked and ignored files. A branch merged into main does not prove that its working tree is disposable. Inspect actual process ownership and usage; an unknown or active writer blocks moving or removing its checkout. Retain candidate evidence and follow `docs/durable-work.md` before retiring records.

For an explicitly approved move, retain an external manifest of original path, branch, HEAD, Git status and every file's bytes, mode or symlink target, including untracked and ignored entries. Keep private payloads out of Git. Use `git worktree move` to a fresh child of the selected root rather than copying or deleting the checkout. Verify the manifest and Git registration again after the move. Preserve discrepancies and stop; do not clean or reset to manufacture equality. Do not remove unique changes or branches merely because the original commit is integrated.

Remove only an explicitly authorized, unused, clean checkout whose committed work is reachable from a retained ref and whose required records remain retrievable. Prefer Git's normal refusal checks; do not force removal. Ignore only `.claude/worktrees/` in the primary repository, not all `.claude/`, because other host configuration may be intentionally shared. An ignore rule prevents accidental staging, not access or execution.
