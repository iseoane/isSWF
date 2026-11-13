import type { EngineInterface } from 'claude-code'

// Matched by tool name, so a server registered directly or through a plugin is found under any server name.
const TOOLS = [
  {
    tool: /__mem_search$/,
    line: (server: string) => `- Engram is connected (\`${server}\`): before planning, recover this project's context with \`mem_current_project\`, then \`mem_context\` or \`mem_search\` under its explicit project identity; save decisions, discoveries and fixes as they happen.`,
  },
  {
    tool: /__codegraph_explore$/,
    line: (server: string) => `- Codegraph is connected (\`${server}\`): use it first for structural code questions (where something is, callers, impact) before Grep or file reads.`,
  },
]

// The session's MCP tools from the local context estimate: no model call, network or write.
async function connectedTools($: EngineInterface) {
  const usage = await $.session.usage({ breakdown: 'summary' })
  return usage.context.breakdown?.mcpTools ?? []
}

// Appends a short reminder for the memory and code-index tools this session has; a failed lookup changes nothing.
export async function withCoordinatorTools($: EngineInterface, text: string) {
  try {
    const tools = await connectedTools($)
    const lines = TOOLS.flatMap(({ tool, line }) => {
      const found = tools.find(t => tool.test(t.name))
      return found ? [line(found.serverName)] : []
    })
    return lines.length ? `${text}\n\n## Session tools detected by the isSWF plugin\n\n${lines.join('\n')}\n` : text
  } catch {
    return text
  }
}
