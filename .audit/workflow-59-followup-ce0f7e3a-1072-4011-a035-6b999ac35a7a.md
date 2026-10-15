Updated only `.agents/roles/delivery.md` and `.audit/delivery-59-build-brief.md` in the authorized worktree.

The profile now uses repo-relative code paths for the five root-document references, requires complete `git show` reads at the pinned checkpoint, and blocks missing inputs without falling back to the latest version. The valid local `references/delivery.md` link is unchanged. The audit appendix clarifies that the build brief is not a checkpoint input, records the current scope and checks, and leaves independent review and operator acceptance pending.

Whitespace checks passed for both files. The link scan found only the unchanged local link. No tracked files changed; the reference and template files were already untracked at handoff.
