// Initiative ids touched by this session's tool calls; with a started job they get a full card.
export type IsswfPaneTouched = string[]
// Initiative ids pinned with /isswf-initiatives pin; always a full card.
export type IsswfPanePinned = string[]
// `<initiative>-<job>` keys of completed jobs and `<initiative>-<job>-<entry>` keys of agent pills expanded in their card.
export type IsswfPaneExpanded = string[]

declare module 'claude-code' {
  interface PluginState {
    isswf: { isActivated: boolean; touched: IsswfPaneTouched; pinned: IsswfPanePinned; expanded: IsswfPaneExpanded }
  }
}
