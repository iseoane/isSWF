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

declare module 'claude-code' {
  interface PluginState {
    isswf: { isActivated: boolean; touched: IsswfPaneTouched; pinned: IsswfPanePinned; expanded: IsswfPaneExpanded; tab: IsswfPaneTab; resumeOnQuota: boolean; tree: IsswfPaneTree }
  }
}
