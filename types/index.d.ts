// Initiative ids touched by this session's tool calls; with a started job they get a full card.
export type IsswfPaneTouched = string[]
// Initiative ids pinned with /isswf-initiatives pin; always a full card.
export type IsswfPanePinned = string[]
// `<initiative>-<job>` keys of completed jobs and `<initiative>-<job>-<entry>` keys of agent pills expanded in their card.
export type IsswfPaneExpanded = string[]

// The pane's selected tab.
export type IsswfPaneTab = 'initiatives' | 'agents' | 'files'

// The initiative shown in the Files tab, its expanded folders and the open file, as paths relative to the initiative.
export type IsswfPaneTree = { id: string; open: string[]; file?: string }

// What a checkout is on: a branch, or a detached HEAD at a commit.
export type IsswfBranchState = { branch: string } | { detached: string }
// The branch each agent loop selected in each repository, keyed by loop and repository top-level directory.
export type IsswfBranches = Record<string, IsswfBranchState>

// The checkout and branch a role agent was assigned, keyed by the agent id the host returned for its dispatch.
export type IsswfAssigned = Record<string, { checkout: string; branch: string }>

// An accepted dispatch the coordinator session remembers for the compaction reminder, as rememberDispatch stores it.
export type IsswfAssignment = { agent: string; initiative: string; job: string; path: string; checkpoint: string; base: string; run?: string }

declare module 'claude-code' {
  interface PluginState {
    isswf: { isActivated: boolean; touched: IsswfPaneTouched; pinned: IsswfPanePinned; expanded: IsswfPaneExpanded; tab: IsswfPaneTab; resumeOnQuota: boolean; tree: IsswfPaneTree; branches: IsswfBranches; assignments: IsswfAssignment[]; assigned: IsswfAssigned }
  }
}
