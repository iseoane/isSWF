import { expect, test } from 'claude-code/testing'

const tool = (name: string, serverName: string) => ({ name, serverName, tokens: 1, isLoaded: false })
const ENGRAM = tool('mcp__plugin_engram_engram__mem_search', 'plugin:engram:engram')
const CODEGRAPH = tool('mcp__codegraph__codegraph_explore', 'codegraph')
const OTHER = tool('mcp__linear__create_issue', 'linear')

function engine(on: any, mcpTools: unknown[] | Error) {
  let usageCalls = 0
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('session.usage', () => {
    usageCalls++
    if (mcpTools instanceof Error) throw mcpTools
    return { value: { startedAt: 0, context: { breakdown: { mcpTools } }, rateLimits: [] } }
  })
  return { calls: () => usageCalls }
}

const load = ($: any, skill = 'isswf:isswf-coordinator') => $.skill.prompt({ skill, text: 'COORDINATOR' })

test('the coordinator skill notes each connected tool and only those', async ($, on) => {
  engine(on, [ENGRAM, OTHER])
  const { text } = await load($)
  expect(text.startsWith('COORDINATOR\n\n## Session tools detected by the isSWF plugin')).toBe(true)
  expect(text.includes('Engram is connected (`plugin:engram:engram`)')).toBe(true)
  expect(text.includes('Codegraph')).toBe(false)
})

test('both tools are noted when both are connected, deferred or loaded', async ($, on) => {
  engine(on, [CODEGRAPH, { ...ENGRAM, isLoaded: true }])
  const { text } = await load($)
  expect(text.includes('Engram is connected')).toBe(true)
  expect(text.includes('Codegraph is connected (`codegraph`)')).toBe(true)
})

test('nothing is added when neither tool is connected', async ($, on) => {
  engine(on, [OTHER])
  expect((await load($)).text).toBe('COORDINATOR')
})

test('a failed lookup leaves the skill unchanged', async ($, on) => {
  engine(on, new Error('no usage'))
  expect((await load($)).text).toBe('COORDINATOR')
})

test('other skills are untouched and trigger no lookup', async ($, on) => {
  const { calls } = engine(on, [ENGRAM, CODEGRAPH])
  expect((await load($, 'isswf:isswf-review')).text).toBe('COORDINATOR')
  expect(calls()).toBe(0)
})
