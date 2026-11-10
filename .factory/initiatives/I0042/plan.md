# I0042: Native writer worktrees and durable work retention

Type: bug

Current operator requests a worktree initiative after reporting workers operating on main and partial work loss after session closure. Original r1 recorded preparation only. Current explicit operator continuation, after administrative closure and verified v1.8.3 publication, authorizes bounded diagnostic execution under r2 before selecting implementation. No cleanup, client-project access or global policy change is granted. I0014 evaluation remains cancelled. Related #254 concerns missing methodology/continuity controls, but a common cause has not been proved.

## J001

- Status: awaiting-human
- Objective: Diagnose native writer checkout/branch assignment and interruption-related work loss, then propose a supported worktree/checkpoint contract without reviving the legacy isolated executor.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: Product decision: must every ordinary writer use a separate worktree, including sequential work, or may sequential work remain in primary checkout on a dedicated feature branch with checkpoint/retention checks? Original incident cause remains inconclusive; native Claude prepared-checkout binding requires technical investigation if selected, not operator discovery.
- Next step: Await the exact worktree-policy choice above, then investigate supported host mechanisms for the selected capability and prepare bounded implementation; do not silently impose universal worktrees or claim data-loss cause. A001 retains attributed partial diagnosis/options/test seams. Researcher d9dfbde9 terminal complete/partial; calls spent1/6, reviews0/3, corrections0/2. Release v1.8.3 verified published, PR260 receipt merged4fb82c6 with CI3/3. I0042 branch diverges normally from main merge; no forced update, reconcile before publication. I0009/J030 remains after I0042.

### Acceptance

- Distinguish main branch from primary checkout, sequential from parallel writing, assigned from actual cwd, and an ordinary feature branch from a separate worktree.
- Identify the intended policy/grant and actual native Pi/Claude binding on affected OS paths; a worktree location setting, isolation label or child instruction is not proof of actual cwd binding.
- Establish where missing bytes/commits/reports were last retained and what action lost or made them inaccessible, or return an inconclusive diagnosis with the exact missing nonsecret evidence and safe reproduction.
- Evaluate worktree creation/ownership, branch/HEAD checks, checkpoint/ref retention and resume reconciliation as separate controls. Closing a session alone is not assumed to erase files; a worktree is not a backup or OS sandbox.
- Propose bounded Linux/Windows and Pi/Claude positive/negative checks, retaining existing #89/I0010 J007 binding limits and I0028 object-store support. No fallback to the primary main branch when an explicitly required worktree cannot be bound.
- Preserve all unique uncommitted, untracked and ignored work; no reset, stash pop, deletion, cleanup, migration, new dispatcher or archived executor reactivation.

### Evidence

- Current operator reports that project workers operated on main rather than a worktree and part of the work was lost after session closure; these are supplied observations, not a local reproduction or confirmed cause.
- Current worktrees reference and host guides explicitly permit sequential writers in the assigned checkout; mandatory separate worktrees for every writer are not the current universal contract. This makes policy mismatch a competing explanation to forgotten instructions.
- I0010/J007 delivered the #89 capability-disclosure/binding boundary; I0028 concerns source object-store support from linked worktrees, not assigning every native worker to one.
- No dedicated active native OS-isolation initiative found in current initiative plans; legacy isolation is parked under I0009/PR87 and tag archive/pr87-windows-isolation at1c7e898ca1eb4e8e35c455aeadbb1f39832caed7. #219 disposition is separate from implementing this initiative.
