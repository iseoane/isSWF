import { expect, mock, test } from 'claude-code/testing'

const ON = { options: { initiativesPane: true } }
const AGENT = 'abc123'
const plan = (id: string, title: string, jobs: [string, string, string][]) =>
  `# ${id}: ${title}\n\nType: enhancement\n` +
  jobs.map(([job, status, objective]) => `\n## ${job}\n\n- Status: ${status}\n- Objective: ${objective}\n- Depends on: None\n- Brief: [brief-r1.md](jobs/${job}/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Works.\n\n### Evidence\n\n- ${status === 'completed' ? 'Merged.' : 'None.'}\n`).join('')
const RECORDS: Record<string, string> = {
  'I0046/plan.md': plan('I0046', 'Pane mod', [['J001', 'completed', 'triage'], ['J002', 'completed', 'reader'], ['J003', 'completed', 'cores'], ['J004', 'in-progress', 'pane'], ['J005', 'pending', 'docs']]),
  'I0046/jobs/J002/brief-r1.md': 'brief',
  'I0046/jobs/J003/brief-r1.md': 'brief',
  'I0046/jobs/J003/V001.md': '- Brief: I0046/jobs/J003/brief-r1.md\n- Verdict: pass\n',
  'I0046/jobs/J004/brief-r1.md': 'brief',
  'I0046/jobs/J004/A001.md': `- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: isswf-worker\n- Model: actual \`claude-opus-5-5\` high\n- Run: claude agent=${AGENT}\n`,
  'I0046/jobs/J004/V001.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Verdict: fail\n',
  'I0046/jobs/J004/V002.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Verdict: pass\n',
  'I0046/jobs/J004/A002.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Status: running\n',
  'I0046/jobs/J004/A003.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/roles/researcher.md\n- Outcome: blocked\n',
  'I0046/jobs/J004/A004.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/roles/planner.md\n- Outcome: complete\n',
  'I0047/plan.md': plan('I0047', 'Sidebar', [['J001', 'pending', 'x']]),
  'I0048/plan.md': plan('I0048', 'Docs', [['J001', 'blocked', 'a'], ['J002', 'pending', 'b']]),
}
const usage = { input_tokens: 1_000_000, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
const TRANSCRIPT = [
  { type: 'user', timestamp: '2026-01-01T00:00:00.000Z', message: { role: 'user', content: 'go' } },
  { type: 'assistant', requestId: 'r1', timestamp: '2026-01-01T00:01:30.000Z', message: { model: 'claude-opus-5-5', usage, stop_reason: 'end_turn', content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/p/.agents/roles/worker.md' } }] } },
].map(e => JSON.stringify(e)).join('\n') + '\n'

const PANE = {
  plugin: 'isswf',
  component: 'Pane',
  requestId: 'isswf-initiatives',
  props: { title: 'isSWF', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 80 }, view: {} },
} as const

// A fake host keyed by native paths: `C:\p` exercises the Windows separator end to end.
function engine(on: any, cwd: string, records = RECORDS) {
  const sep = cwd.includes('\\') ? '\\' : '/'
  const home = sep === '\\' ? 'C:\\h' : '/h'
  const files: Record<string, string> = {}
  for (const [path, text] of Object.entries(records)) files[[cwd, '.factory', 'initiatives', ...path.split('/')].join(sep)] = text
  files[[home, '.claude', 'projects', 'x', 's1', 'subagents', `agent-${AGENT}.jsonl`].join(sep)] = TRANSCRIPT
  const plugin = (path: string) => path.endsWith(`.claude-plugin${sep}plugin.json`) || path.endsWith('.claude-plugin/plugin.json')
  const isDir = (path: string) => Object.keys(files).some(f => f.startsWith(`${path}${sep}`))
  on('session.cwd', () => ({ value: cwd }))
  const settings: { language?: string } = { language: 'Español' }
  on('settings.read', () => ({ value: { ...settings } }))
  on('env.get', (_: unknown, e: { name: string }) => ({ value: { [sep === '\\' ? 'USERPROFILE' : 'HOME']: home }[e.name] }))
  const seen: string[] = []
  // A Linux test host resolves `C:\p` against its own directory; the mock keeps the path from the drive on.
  const norm = (path: string) => {
    const native = sep === '\\' ? path.slice(Math.max(0, path.search(/[A-Za-z]:\\/))) : path
    seen.push(native)
    return native
  }
  on('fs.exists', (_: unknown, e: { path: string }) => ({ value: norm(e.path) in files || isDir(norm(e.path)) }))
  on('fs.stat', (_: unknown, e: { path: string }) => {
    if (!(norm(e.path) in files)) throw new Error('ENOENT')
    return { value: { kind: 'file', size: files[norm(e.path)].length, mtimeMs: 0, isLink: false } }
  })
  on('fs.read', (_: unknown, e: { path: string }) => {
    if (plugin(e.path)) return { value: '{"version":"9.8.7"}' }
    if (!(norm(e.path) in files)) throw new Error('ENOENT')
    return { value: files[norm(e.path)] }
  })
  on('fs.list', (_: unknown, { path }: { path: string }) => {
    const e = { path: norm(path) }
    const names = new Set(Object.keys(files).filter(f => f.startsWith(`${e.path}${sep}`)).map(f => f.slice(e.path.length + 1).split(sep)[0]))
    return { value: [...names].map(name => ({ name, kind: `${e.path}${sep}${name}` in files ? 'file' : 'dir', size: 0, mtimeMs: 0, isLink: false })) }
  })
  on('command.register', () => ({ value: { command: 'isswf-initiatives' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('tool.call', () => ({ result: {} }))
  return { clock: mock.clock(on), seen, settings }
}

const activate = ($: any) => $.skill.prompt({ skill: 'isswf:isswf-coordinator', text: '' })
const text = async (ui: any, re: RegExp) => (await ui.find({ type: 'Text', text: re }))?.text

test('with the option off nothing registers, reads, schedules or opens', async ($, on) => {
  let calls = 0
  for (const event of ['command.register', 'ui.open', 'session.cwd', 'fs.exists', 'fs.read', 'fs.list', 'env.get', 'clock.after', 'clock.every']) on(event, () => { calls++; throw new Error(event) })
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('tool.call', () => ({ result: {} }))
  await activate($)
  await $.tool.call({ tool: 'Read', file_path: '/p/.factory/initiatives/I0046/plan.md' })
  expect(calls).toBe(0)
})

test('nothing opens or reads before the coordinator skill loads', ON, async ($, on) => {
  let opened = 0
  let reads = 0
  on('command.register', () => ({ value: { command: 'isswf-initiatives' } }))
  on('ui.open', () => (opened++, { value: { isPlaced: true } }))
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('tool.call', () => ({ result: {} }))
  on('session.cwd', () => (reads++, { value: '/p' }))
  on('settings.read', () => ({ value: {} }))
  on('fs.exists', () => (reads++, { value: false }))
  on('fs.read', () => (reads++, { value: '{}' }))
  await $.skill.prompt({ skill: 'other-skill', text: '' })
  await $.tool.call({ tool: 'Read', file_path: '/p/.factory/initiatives/I0046/plan.md' })
  expect(await $.command.run({ command: 'isswf-initiatives', args: '' })).toEqual({ text: 'The isSWF coordinator is not active in this session.' })
  expect([opened, reads]).toEqual([0, 0])
  await activate($)
  expect(await $.command.run({ command: 'isswf-initiatives', args: 'pin' })).toEqual({ text: 'Usage: /isswf-initiatives [pin <ID> | unpin <ID>]' })
  expect(await $.command.run({ command: 'isswf-initiatives', args: '' })).toEqual({ text: 'Initiatives pane opened.' })
  expect(opened).toBe(2)
})

for (const cwd of ['/p', 'C:\\p']) {
  test(`a touched started initiative gets a card; touched unopened ones stay grouped (${cwd})`, ON, async ($, on) => {
    const { clock, seen } = engine(on, cwd)
    await activate($)
    await $.tool.call({ tool: 'Bash', command: 'cat .factory\\initiatives\\I0046\\plan.md .factory/initiatives/I0047/plan.md' })
    await clock.advance(1000)
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ ...PANE, surface })
      expect(await text(ui, /^isSWF v/)).toBe('isSWF v9.8.7 · p')
      if (cwd !== '/p') expect(seen.filter(p => p.includes('/'))).toEqual([])
      expect(await text(ui, /^═+$/)).toBe('═'.repeat(60))
      expect(await text(ui, /I0046 · Pane mod/)).toBe('● I0046 · Pane mod')
      expect(await text(ui, /^jobs/)).toBe('jobs 3/5 ✓ · 2 sin cerrar')
      expect(await text(ui, /completados/)).toBe('✓ 3 completados')
      expect(await text(ui, /J005/)).toBe('○ J005 docs')
      expect(await text(ui, /^R1$/)).toBe('R1')
      expect(await text(ui, /cambios pedidos/)).toBe(undefined)
      for (const [id, style, color] of [['V001', 'round', 'warning'], ['V002', 'round', 'success'], ['A002', 'dashed', 'inactive']]) {
        const box: any = await ui.find({ type: 'Box', key: `I0046-J004-${id}` })
        expect([box?.props?.borderStyle, box?.props?.borderColor]).toEqual([style, color])
      }
      expect(await text(ui, /No activas/)).toBe('No activas 2')
      expect(await text(ui, /I0048/)).toBe('◐ I0048 · Docs · 1 bloqueados · 1 sin cerrar')
      expect(await text(ui, /I0047/)).toBe('○ I0047 · Sidebar')
      await ui.unmount()
    }
  })
}

for (const flag of ['--initiative I0046', '--initiative=I0046', '--initiative "I0046"', "--initiative\t'I0046'"]) {
  test(`a Bash command naming ${flag} touches that initiative`, ON, async ($, on) => {
    const { clock } = engine(on, '/p')
    await activate($)
    await $.tool.call({ tool: 'Bash', command: `node tools/isswf-status.mjs --project /p ${flag}` })
    await clock.advance(1000)
    const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
    expect(await text(ui, /I0046 · Pane mod/)).toBe('● I0046 · Pane mod')
    await ui.unmount()
  })
}

test('pin makes an unopened initiative a card and unpin returns it', ON, async ($, on) => {
  engine(on, '/p')
  await activate($)
  expect(await $.command.run({ command: 'isswf-initiatives', args: 'pin I0047' })).toEqual({ text: 'I0047 fijada.' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /I0047/)).toBe('● I0047 · Sidebar')
  expect(await text(ui, /I0046/)).toBe('◐ I0046 · Pane mod · 2 sin cerrar')
  await ui.unmount()
  await $.command.run({ command: 'isswf-initiatives', args: 'unpin I0047' })
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /I0047/)).toBe('○ I0047 · Sidebar')
  await ui.unmount()
})

test('the two last completed jobs in plan order expand and collapse on press', ON, async ($, on) => {
  engine(on, '/p')
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^✓ J001/)).toBe(undefined)
  expect(await text(ui, /^✓ J002/)).toBe('✓ J002 reader')
  expect(await text(ui, /^✓ J003/)).toBe('✓ J003 cores')
  expect(await ui.find({ type: 'Box', key: 'I0046-J003-V001' })).toBe(undefined)
  await ui.press({ key: 'I0046-J003' })
  expect((await ui.find({ type: 'Box', key: 'I0046-J003-V001' }))?.props?.borderColor).toBe('success')
  await ui.press({ key: 'I0046-J003' })
  expect(await ui.find({ type: 'Box', key: 'I0046-J003-V001' })).toBe(undefined)
  await ui.unmount()
})

test('a pressed pill expands its usage detail resolved after the draw and collapses on a second press', ON, async ($, on) => {
  engine(on, '/p')
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^modelo: claude-opus-5-5/)).toBe(undefined)
  await ui.press({ key: 'I0046-J004-A001' })
  expect(await text(ui, /^A001 ·/)).toBe('A001 · attempt')
  expect(await text(ui, /^modelo: claude-opus-5-5/)).toBe('modelo: claude-opus-5-5 (transcript)')
  expect(await text(ui, /^tokens/)).toBe('tokens: 1000000')
  expect(await text(ui, /^duración/)).toBe('duración: 90 s')
  expect(await text(ui, /^coste/)).toBe('coste: $4.00')
  expect(await text(ui, /^skills/)).toBe('skills: 0 · referencias: 1')
  await ui.press({ key: 'I0046-J004-A001' })
  expect(await text(ui, /^modelo: claude-opus-5-5/)).toBe(undefined)
  await ui.unmount()
})

test('labels follow the session language: Spanish when set, English without a setting', ON, async ($, on) => {
  const { clock, settings } = engine(on, '/p')
  await activate($)
  await $.tool.call({ tool: 'Read', file_path: '/p/.factory/initiatives/I0046/plan.md' })
  await clock.advance(1000)
  for (const [language, inactive, verdict, reply] of [
    ['es', 'No activas 2', 'veredicto: cambios pedidos', 'Uso: /isswf-initiatives [pin <ID> | unpin <ID>]'],
    [undefined, 'Inactive 2', 'verdict: changes requested', 'Usage: /isswf-initiatives [pin <ID> | unpin <ID>]'],
  ] as const) {
    settings.language = language
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    expect(await text(ui, /No activas|Inactive/)).toBe(inactive)
    await ui.press({ key: 'I0046-J004-V001' })
    expect(await text(ui, /^ver/)).toBe(verdict)
    await ui.press({ key: 'I0046-J004-V001' })
    await ui.unmount()
    expect(await $.command.run({ command: 'isswf-initiatives', args: 'pin' })).toEqual({ text: reply })
  }
})

test('attempt pills show their outcome: green complete, red blocked, dashed running, grey unknown', ON, async ($, on) => {
  engine(on, '/p')
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const box = (id: string) => ui.find({ type: 'Box', key: `I0046-J004-${id}` })
  expect((await box('A004'))?.props?.borderColor).toBe('success')
  expect((await box('A003'))?.props?.borderColor).toBe('error')
  expect((await box('A002'))?.props?.borderStyle).toBe('dashed')
  expect((await box('A001'))?.props?.borderColor).toBe(undefined)
  expect(await text(ui, /^researcher$/)).toBe('researcher')
  expect(await text(ui, /^planner$/)).toBe('planner')
  await ui.press({ key: 'I0046-J004-A003' })
  expect(await text(ui, /^veredicto/)).toBe('veredicto: fallido')
  await ui.unmount()
})

for (const command of [
  "git commit -m \"plan: see .factory/initiatives/I0048/plan.md\"",
  "cat > /tmp/x.md <<'EOF'\nCompare .factory/initiatives/I0048/plan.md\nEOF\nwc -l /tmp/x.md",
  'python3 - <<EOF\nopen(".factory/initiatives/I0048/plan.md")\nEOF',
]) {
  test(`a Bash command that only mentions a record path in prose touches nothing (${command.split(' ')[0]})`, ON, async ($, on) => {
    const { clock } = engine(on, '/p')
    await activate($)
    await $.tool.call({ tool: 'Bash', command })
    await clock.advance(1000)
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    expect(await text(ui, /I0048 · Docs/)).toBe('◐ I0048 · Docs · 1 bloqueados · 1 sin cerrar')
    await ui.unmount()
  })
}

test('a Bash command operating on a record path, quoted or not, touches it', ON, async ($, on) => {
  const { clock } = engine(on, '/p')
  await activate($)
  await $.tool.call({ tool: 'Bash', command: "cat \".factory/initiatives/I0046/plan.md\" && git add .factory/initiatives/I0046 <<< ''" })
  await clock.advance(1000)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /I0046 · Pane mod/)).toBe('● I0046 · Pane mod')
  await ui.unmount()
})
