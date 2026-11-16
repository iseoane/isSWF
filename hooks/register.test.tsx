import { expect, mock, test } from 'claude-code/testing'
import { buildEnvelope, diffCommandArguments, sha256Hex } from '../tools/isswf-handoff-core.mjs'

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
  'I0046/jobs/J004/A005.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Outcome: partial\n',
  'I0046/jobs/J004/A004.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/roles/planner.md\n- Outcome: complete\n',
  'I0047/plan.md': plan('I0047', 'Sidebar', [['J001', 'pending', 'x']]),
  'I0048/plan.md': plan('I0048', 'Docs', [['J001', 'blocked', 'a'], ['J002', 'pending', 'b']]),
}
const usage = { input_tokens: 1_000_000, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
const TRANSCRIPT = [
  { type: 'user', timestamp: '2026-01-01T00:00:00.000Z', message: { role: 'user', content: 'Apply .agents/roles/worker.md.' } },
  { type: 'assistant', requestId: 'r1', timestamp: '2026-01-01T00:01:30.000Z', message: { model: 'claude-opus-5-5', usage, stop_reason: 'end_turn', content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/p/.agents/roles/worker.md' } }] } },
].map(e => JSON.stringify(e)).join('\n') + '\n'

const PANE = {
  plugin: 'isswf',
  component: 'Pane',
  requestId: 'isswf-initiatives',
  props: { title: 'isSWF', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 80 }, view: {} },
} as const

// A fake host keyed by native paths: `C:\p` exercises the Windows separator end to end.
const OWN_MESSAGES = [
  { role: 'assistant', text: '', toolUses: [{ tool_use_id: 't1', tool: 'Skill', input: { skill: 'isswf:isswf-coordinator' } }, { tool_use_id: 't2', tool: 'Read', input: { file_path: '/p/.agents/roles/references/review.md' } }, { tool_use_id: 't3', tool: 'Read', input: { file_path: '/p/.agents/roles/references/review.md' } }] },
  { role: 'user', text: 'x', toolUses: [{ tool_use_id: 't4', tool: 'Skill', input: { skill: 'not-counted' } }] },
]

function engine(on: any, cwd: string, records = RECORDS, messages: any[] = OWN_MESSAGES) {
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
    return { value: [...names].map(name => ({ name, kind: `${e.path}${sep}${name}` in files ? 'file' : 'dir', size: files[`${e.path}${sep}${name}`]?.length ?? 0, mtimeMs: 0, isLink: false })) }
  })
  on('command.register', () => ({ value: { command: 'isswf-initiatives' } }))
  const opened: string[] = []
  on('ui.open', (_: unknown, e: { id: string }) => (opened.push(e.id), { value: { isPlaced: true } }))
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('tool.call', () => ({ result: {} }))
  on('session.messages', () => ({ value: messages }))
  const tools: string[] = []
  on('tool.list', () => ({ value: tools.map(name => ({ name })) }))
  const index = () => { files[[cwd, '.codegraph', 'codegraph.db'].join(sep)] = '' }
  return { clock: mock.clock(on), seen, settings, opened, tools, index }
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
  expect(await text(ui, /^modelo: claude-opus-5-5/)).toBe('modelo: claude-opus-5-5 (transcript) · esfuerzo: high')
  expect(await text(ui, /^tokens/)).toBe('tokens: 1.000.000 · coste: $4.00')
  expect(await text(ui, /^duración/)).toBe('duración: 90 s')
  // Skill and reference use lives in the Agents tab, not in a record's detail.
  expect(await text(ui, /^skills/)).toBe(undefined)
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
  expect((await box('A005'))?.props?.borderColor).toBe('warning')
  expect((await box('A002'))?.props?.borderStyle).toBe('dashed')
  expect((await box('A001'))?.props?.borderColor).toBe(undefined)
  expect(await text(ui, /^researcher$/)).toBe('researcher')
  expect(await text(ui, /^planner$/)).toBe('planner')
  await ui.press({ key: 'I0046-J004-A003' })
  expect(await text(ui, /^veredicto/)).toBe('veredicto: blocked')
  await ui.unmount()
})

for (const command of [
  "git commit -m \"plan: see .factory/initiatives/I0048/plan.md\"",
  "cat > /tmp/x.md <<'EOF'\nCompare .factory/initiatives/I0048/plan.md\nEOF\nwc -l /tmp/x.md",
  'python3 - <<EOF\nopen(".factory/initiatives/I0048/plan.md")\nEOF',
  "echo 'a' \"see .factory/initiatives/I0048/plan.md now\" 'b'",
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

for (const command of [
  "cat <<'EOF' > .factory/initiatives/I0048/jobs/J001/A001.md\nOutcome: complete\nEOF",
  "sed -n '1,40p' .factory/initiatives/I0048/plan.md | grep 'x'",
  "rg 'Outcome' .factory/initiatives/I0048 -g '*.md'",
]) {
  test(`a record operand between quoted arguments or after a heredoc opener touches it (${command.split(' ')[0]})`, ON, async ($, on) => {
    const { clock } = engine(on, '/p')
    await activate($)
    await $.tool.call({ tool: 'Bash', command })
    await clock.advance(1000)
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    expect(await text(ui, /I0048 · Docs/)).toBe('● I0048 · Docs')
    await ui.unmount()
  })
}

test('review rounds within one brief are drawn separately; the brief revision shows only when a job has several', ON, async ($, on) => {
  engine(on, '/p', {
    ...RECORDS,
    'I0046/jobs/J004/A006.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/skills/isswf-coordinator/SKILL.md (coordinator acting as writer)\n- Outcome: complete\n',
    'I0048/jobs/J001/brief-r1.md': 'brief',
    'I0048/jobs/J001/brief-r2.md': 'brief',
    'I0048/jobs/J001/V001.md': '- Brief: I0048/jobs/J001/brief-r1.md\n- Verdict: fail\n',
    'I0048/jobs/J001/V002.md': '- Brief: I0048/jobs/J001/brief-r2.md\n- Verdict: pass\n',
  })
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0048' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^R1$/)).toBe('R1')
  expect(await text(ui, /^R2$/)).toBe('R2')
  expect(await text(ui, /^R3$/)).toBe(undefined)
  expect(await text(ui, /^coordinator$/)).toBe('coordinator')
  expect(await text(ui, /^r1·R1$/)).toBe('r1·R1')
  expect(await text(ui, /^r2·R1$/)).toBe('r2·R1')
  await ui.unmount()
})

test('the agents tab lists the coordinator and each delegated run with skill and reference counts', ON, async ($, on) => {
  // A completed job's run whose transcript is gone stays unknown rather than zero.
  // J004 is in progress with an attempt the coordinator wrote, and this session never read roles/worker.md.
  const { clock } = engine(on, '/p', { ...RECORDS, 'I0046/jobs/J003/V001.md': '- Brief: I0046/jobs/J003/brief-r1.md\n- Verdict: pass\n- Run: claude agent=gone1\n', 'I0046/jobs/J004/A002.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/skills/isswf-coordinator/SKILL.md (coordinator acting as writer)\n- Outcome: partial\n' })
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /Iniciativas/)).toBe('[Iniciativas]')
  await ui.press({ key: 'tab-agents' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /Agentes/)).toBe('[Agentes]')
  expect(await text(ui, /^coordinador/)).toBe('coordinador (esta sesión) · writer sin roles/worker.md')
  await clock.advance(1000)
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /isswf-coordinator/)).toMatch(/^  isswf-coordinator +×1$/)
  expect(await text(ui, /^  review /)).toMatch(/^  review +×2$/)
  expect(await text(ui, /^worker · /)).toBe('worker · 1 ejecución · perfil 1/1')
  await clock.advance(1000)
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^  worker /)).toMatch(/^  worker +×1$/)
  expect(await text(ui, /^desconocido · /)).toBe('desconocido · 1 ejecución')
  expect(await text(ui, /^skills: desconocido$/)).toBe('skills: desconocido')
  await ui.press({ key: 'tab-initiatives' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /I0046 · Pane mod/)).toBe('● I0046 · Pane mod')
  await ui.unmount()
})

for (const [percentUsed, expected] of [[92, 1], [50, 0]] as const) {
  test(`resume after quota: ${percentUsed}% of the five-hour window ${expected ? 'schedules one' : 'schedules no'} resume prompt`, ON, async ($, on) => {
    const { clock } = engine(on, '/p')
    const prompts: string[] = []
    let resetsAt = 10 * 60_000
    let used: number = percentUsed
    const hhmm = (ms: number) => new Date(ms).toTimeString().slice(0, 5)
    on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [{ kind: 'five_hour', percentUsed: used, resetsAt: new Date(resetsAt).toISOString() }] } }))
    on('prompt.submit', (_: unknown, e: { text: string }) => (prompts.push(e.text), { text: e.text }))
    await activate($)
    await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
    let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    expect(await text(ui, /^⏰/)).toBe('⏰ AutoWakeUp: no')
    await clock.advance(1000)
    await ui.unmount()
    ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    // Off, the switch already shows when a resume would come: the reset plus five minutes.
    expect(await text(ui, /^⏰/)).toBe(`⏰ AutoWakeUp: no (${hhmm(15 * 60_000)})`)
    await ui.press({ key: 'resume-toggle' })
    await ui.unmount()
    ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    await clock.advance(1000)
    await ui.unmount()
    ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    expect(await text(ui, /^⏰/)).toBe(`⏰ AutoWakeUp: sí (${hhmm(15 * 60_000)})`)
    await ui.unmount()
    // Repeated draws in the same window schedule nothing more.
    ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    await ui.unmount()
    // The window resets at 10 min; the prompt is due five minutes later, not before.
    await clock.advance(13 * 60_000)
    expect(prompts.length).toBe(0)
    await clock.advance(3 * 60_000)
    expect(prompts.length).toBe(expected)
    if (expected) {
      expect(prompts[0]).toContain('I0046/J004')
      expect(prompts[0]).toContain('reconcile state first')
      // After it fires the window renews below the threshold: the switch shows the next window's time, not the past one.
      resetsAt = 5 * 60 * 60_000
      used = 5
      ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
      await clock.advance(1000)
      await ui.unmount()
      ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
      expect(await text(ui, /^⏰/)).toBe(`⏰ AutoWakeUp: sí (${hhmm(5 * 60 * 60_000 + 5 * 60_000)})`)
      await ui.unmount()
    }
  })
}

test('switching resume off cancels a scheduled prompt', ON, async ($, on) => {
  const { clock } = engine(on, '/p')
  const prompts: string[] = []
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [{ kind: 'five_hour', percentUsed: 95, resetsAt: new Date(10 * 60_000).toISOString() }] } }))
  on('prompt.submit', (_: unknown, e: { text: string }) => (prompts.push(e.text), { text: e.text }))
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'resume-toggle' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await clock.advance(1000)
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^⏰/)).toMatch(/^⏰ AutoWakeUp: sí \(\d\d:\d\d\)$/)
  await ui.press({ key: 'resume-toggle' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^⏰/)).toMatch(/^⏰ AutoWakeUp: no \(\d\d:\d\d\)$/)
  await ui.unmount()
  await clock.advance(20 * 60_000)
  expect(prompts.length).toBe(0)
})

test('without a reset time the switch says nothing is scheduled', ON, async ($, on) => {
  const { clock } = engine(on, '/p')
  const prompts: string[] = []
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [{ kind: 'five_hour', percentUsed: 95 }] } }))
  on('prompt.submit', (_: unknown, e: { text: string }) => (prompts.push(e.text), { text: e.text }))
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'resume-toggle' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await clock.advance(1000)
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^⏰/)).toBe('⏰ AutoWakeUp: sí (sin hora de renovación)')
  await ui.unmount()
  await clock.advance(60 * 60_000)
  expect(prompts.length).toBe(0)
})

test('the coordinator row says the worker profile was read, and an unresolved run gives no profile mark', ON, async ($, on) => {
  // J004 has a coordinator-written attempt, and this session read roles/worker.md; the reviewer's transcript is gone.
  const { clock } = engine(on, '/p', { ...RECORDS, 'I0046/jobs/J004/A002.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/skills/isswf-coordinator/SKILL.md (coordinator acting as writer)\n- Outcome: partial\n', 'I0046/jobs/J004/V001.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/roles/reviewer.md\n- Verdict: fail\n- Run: claude agent=gone2\n' }, [{ role: 'assistant', text: '', toolUses: [{ tool_use_id: 't1', tool: 'Read', input: { file_path: '/p/.agents/roles/worker.md' } }] }])
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-agents' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await clock.advance(1000)
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^coordinador/)).toBe('coordinador (esta sesión) · writer con roles/worker.md')
  expect(await text(ui, /^reviewer · /)).toBe('reviewer · 1 ejecución')
  await ui.unmount()
})

const TREE_PANE = PANE

for (const cwd of ['/p', 'C:\\p']) {
  test(`a card's title opens its initiative's file tree in the Files tab, and a file opens below it (${cwd})`, ON, async ($, on) => {
    // A Windows checkout may hold CRLF line endings; the file is drawn with plain newlines.
    const { seen } = engine(on, cwd, { ...RECORDS, 'I0046/jobs/J002/brief-r1.md': 'brief\r\nsecond' })
    await activate($)
    await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
    let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    await ui.press({ key: 'tree-I0046' })
    await ui.unmount()
    let tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
    // The title switches the same pane to its Files tab; no other pane opens.
    expect(await text(tree, /Archivos/)).toBe('[Archivos]')
    expect(await text(tree, /^I0046 · archivos/)).toBe('I0046 · archivos')
    // Files first, then folders, folded until pressed.
    expect(await text(tree, /plan\.md$/)).toBe('  plan.md')
    expect(await text(tree, /jobs\/$/)).toBe('▸ jobs/')
    expect(await text(tree, /J002\/$/)).toBe(undefined)
    await tree.press({ key: 'file-jobs' })
    await tree.unmount()
    tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
    expect(await text(tree, /J002\/$/)).toBe('  ▸ J002/')
    await tree.press({ key: 'file-jobs/J002' })
    await tree.unmount()
    tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
    await tree.press({ key: 'file-jobs/J002/brief-r1.md' })
    await tree.unmount()
    tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
    expect((await tree.find({ type: 'Markdown', key: 'tree-file' }) as any)?.props?.text ?? (await tree.find({ type: 'Markdown', key: 'tree-file' }) as any)?.text).toBe('brief\nsecond')
    expect(seen.some(p => p.endsWith(['I0046', 'jobs', 'J002', 'brief-r1.md'].join(cwd.includes('\\') ? '\\' : '/')))).toBe(true)
    // Pressing the open file again hides it.
    await tree.press({ key: 'file-jobs/J002/brief-r1.md' })
    await tree.unmount()
    tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
    expect(await tree.find({ type: 'Markdown', key: 'tree-file' })).toBe(undefined)
    // Folding the folder of an open file closes the file instead of calling it unreadable.
    await tree.press({ key: 'file-jobs/J002/brief-r1.md' })
    await tree.unmount()
    tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
    await tree.press({ key: 'file-jobs' })
    await tree.unmount()
    tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
    expect(await tree.find({ type: 'Markdown', key: 'tree-file' })).toBe(undefined)
    expect(await text(tree, /no se puede leer/)).toBe(undefined)
    expect(await text(tree, /J002\/$/)).toBe(undefined)
    await tree.unmount()
  })
}

test('the file tree reads nothing outside the selected initiative', ON, async ($, on) => {
  const { seen } = engine(on, '/p')
  // A stored selection is data: a path that leaves the initiative, or one no listing returned, is never read.
  let file = ''
  on('state.get', ($: any, e: { key: string }, next: any) => (e.key === 'tree' ? { value: { value: { id: 'I0046', open: ['jobs'], file }, version: 1 } } : e.key === 'tab' ? { value: { value: 'files', version: 1 } } : next(e)))
  await activate($)
  for (file of ['../I0048/plan.md', 'jobs/../../I0048/plan.md', '/p/.factory/initiatives/I0048/plan.md', 'jobs/J002/missing.md', '../../secret.md']) {
    const tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
    expect(await tree.find({ type: 'Markdown', key: 'tree-file' })).toBe(undefined)
    expect(await text(tree, /no se puede leer/)).toBe('no se puede leer')
    await tree.unmount()
  }
  // The Initiatives data still reads every plan; the file view adds no read outside its listing.
  expect(seen.some(p => p.includes('..') || p.endsWith('missing.md') || p.endsWith('secret.md'))).toBe(false)
})

test('a file over the 4 MiB read limit is named, not read', ON, async ($, on) => {
  const { seen } = engine(on, '/p', { ...RECORDS, 'I0046/big.md': 'x'.repeat(4 * 1024 * 1024 + 1) })
  on('state.get', ($: any, e: { key: string }, next: any) => (e.key === 'tree' ? { value: { value: { id: 'I0046', open: [], file: 'big.md' }, version: 1 } } : e.key === 'tab' ? { value: { value: 'files', version: 1 } } : next(e)))
  await activate($)
  const tree = await $.ui.mount({ ...TREE_PANE, surface: 'desktop' })
  expect(await text(tree, /4 MiB/)).toBe('archivo de más de 4 MiB: no se muestra')
  expect(seen.some(p => p.endsWith('big.md'))).toBe(false)
  await tree.unmount()
})

test('an unreadable plan says which job, field and line broke it', ON, async ($, on) => {
  const broken = plan('I0050', 'Broken', [['J001', 'in-progress', 'x']]).replace('(jobs/J001/brief-r1.md)', '(jobs/J001/brief-r1.md) (r1 superseded)')
  const line = broken.split('\n').findIndex(l => l.startsWith('- Brief:')) + 1
  engine(on, '/p', { ...RECORDS, 'I0050/plan.md': broken })
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0050' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /^plan no legible/)).toBe(`plan no legible: J001 · Brief, línea ${line} (unsafe-brief-reference)`)
  await ui.unmount()
})

test('the Files tab without a selection offers the visible initiatives', ON, async ($, on) => {
  engine(on, '/p')
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-files' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /elige una iniciativa/)).toBe('elige una iniciativa:')
  expect(await text(ui, /plan\.md$/)).toBe(undefined)
  await ui.press({ key: 'files-I0046' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await text(ui, /plan\.md$/)).toBe('  plan.md')
  await ui.unmount()
})

test('opening a record detail closes the other open one', ON, async ($, on) => {
  engine(on, '/p')
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'I0046-J004-A001' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Box', key: 'I0046-J004-A001-detail' })).toBeDefined()
  await ui.press({ key: 'I0046-J004-V001' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Box', key: 'I0046-J004-V001-detail' })).toBeDefined()
  expect(await ui.find({ type: 'Box', key: 'I0046-J004-A001-detail' })).toBe(undefined)
  await ui.unmount()
})

test('a coordinator record shows only what it states, and with nothing to show it is not a button', ON, async ($, on) => {
  engine(on, '/p', {
    ...RECORDS,
    'I0046/jobs/J004/A002.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/skills/isswf-coordinator/SKILL.md (coordinator acting as writer)\n',
    'I0046/jobs/J004/A003.md': '- Brief: I0046/jobs/J004/brief-r1.md\n- Profile: .agents/skills/isswf-coordinator/SKILL.md (coordinator acting as writer)\n- Outcome: complete\n',
  })
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Button', key: 'I0046-J004-A002' })).toBe(undefined)
  await ui.press({ key: 'I0046-J004-A003' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  // No model, effort or usage lines: the record states none and has no run.
  expect(await text(ui, /^modelo/)).toBe(undefined)
  expect(await text(ui, /^uso/)).toBe(undefined)
  expect(await text(ui, /^veredicto/)).toBe('veredicto: complete')
  await ui.unmount()
})

test('unfolding a completed job folds the other one', ON, async ($, on) => {
  engine(on, '/p')
  await activate($)
  await $.command.run({ command: 'isswf-initiatives', args: 'pin I0046' })
  let ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'I0046-J002' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'I0046-J003' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Box', key: 'I0046-J003-V001' })).toBeDefined()
  await ui.press({ key: 'I0046-J002' })
  await ui.unmount()
  ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Box', key: 'I0046-J003-V001' })).toBe(undefined)
  await ui.unmount()
})

const STATUS: [string, string[], boolean, string, string, boolean][] = [
  ['nothing available', [], false, 'error', 'error', true],
  ['an index without its tools', ['mcp__engram__mem_save'], true, 'success', 'warning', false],
  ['both servers and an index', ['mcp__engram__mem_save', 'mcp__plugin_cg_codegraph__codegraph_explore'], true, 'success', 'success', false],
]
for (const [label, tools, indexed, engram, codegraph, hint] of STATUS) {
  test(`the status row under the title: ${label}`, ON, async ($, on) => {
    const host = engine(on, '/p')
    host.tools.push(...tools)
    if (indexed) host.index()
    await activate($)
    await $.tool.call({ tool: 'Read', file_path: '/p/.factory/initiatives/I0046/plan.md' })
    await host.clock.advance(1000)
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    expect(await text(ui, /🧠 engram/)).toBeTruthy()
    // The dot is the coloured child of each name's row.
    const color = async (name: RegExp) => ((await ui.find({ type: 'Text', text: name })) as any)?.children?.find((c: any) => c?.children?.[0] === '●')?.props?.color
    expect([await color(/🧠 engram/), await color(/🗺 codegraph/)]).toEqual([engram, codegraph])
    expect(Boolean(await text(ui, /sin índice: codegraph init/))).toBe(hint)
    await ui.unmount()
  })
}

// Compaction: a session that activated the coordinator keeps its assignment through a summary and a reminder.
const CHECKPOINT = 'a1'.repeat(20)
const BASE = 'b2'.repeat(20)
const BRIEF = '.factory/initiatives/I0001/jobs/J001/brief-r1.md'
const DISPATCH = `Work on the brief ${BRIEF}.\nInput checkpoint ${CHECKPOINT}.\nTarget base: main ${BASE}.`
// The Windows separator is spelled by code, so the fixture reads the same on any host.
const SEP = String.fromCharCode(92)
const CWD = `C:${SEP}p`
const at = (...parts: string[]) => [CWD, ...parts].join(SEP)

// Just enough host for the dispatch guard to accept an isSWF worker call; `git` answers tracked, not ignored, committed.
function dispatchHost(on: any, extra: Record<string, string | Uint8Array> = {}) {
  const files: Record<string, string | Uint8Array> = {
    ...extra,
    [at('.factory', 'dispatch-selection.json')]: JSON.stringify({ schemaVersion: 1, agents: { claude: { 'isswf:isswf-worker': { model: 'sonnet', effort: 'medium' }, 'isswf:isswf-reviewer': { model: 'opus', effort: 'medium' } } } }),
    [at('.factory', 'initiatives', 'I0001', 'plan.md')]: plan('I0001', 'Synthetic', [['J001', 'in-progress', 'work']]),
    [at('.factory', 'initiatives', 'I0001', 'jobs', 'J001', 'brief-r1.md')]: 'brief',
  }
  // A Linux test host resolves `C:` against its own directory, so the mock keeps the path from the drive on.
  const native = (path: string) => path.slice(Math.max(0, path.search(/[A-Za-z]:/)))
  on('session.cwd', () => ({ value: CWD }))
  on('fs.list', (_: unknown, { path }: { path: string }) => ({ value: native(path) === CWD ? [{ name: '.factory', kind: 'dir', size: 0, mtimeMs: 0, isLink: false }] : [] }))
  on('fs.read', (_: unknown, { path, as }: { path: string; as?: string }) => {
    if (!(native(path) in files)) throw new Error('ENOENT')
    const content = files[native(path)]
    if (as !== 'bytes') return { value: content }
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
    return { value: { base64: btoa(String.fromCharCode(...bytes)) } }
  })
  on('fs.stat', (_: unknown, { path }: { path: string }) => {
    if (!(native(path) in files)) throw new Error('ENOENT')
    return { value: { kind: 'file', size: files[native(path)].length, mtimeMs: 0, isLink: false } }
  })
  on('process.run', (_: unknown, e: { argv: string[] }) => ({ value: { exitCode: e.argv[1] === 'check-ignore' ? 1 : 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('tool.call', () => ({ result: { agentId: 'agent-77' } }))
}
const worker = (prompt = DISPATCH) => ({ tool: 'Agent', subagent_type: 'isswf:isswf-worker', model: 'sonnet', effort: 'medium', prompt })
const SUMMARY = [{ role: 'assistant', text: 'summary', toolUses: [] }] as const
const COMPACTING = [{ role: 'user', text: 'work', toolUses: [] }] as const
const compact = ($: any, instructions?: string) => $.session.compact({ trigger: 'manual', messages: COMPACTING, ...(instructions === undefined ? {} : { instructions }) })
const startAfterCompaction = ($: any) => $.classic.SessionStart({ source: 'compact' })
const contextOf = (result: any) => (result?.additionalContext ?? []).join('\n')

// The session note the post-compaction hook script reads: the mod writes it, so the tests keep it off the real disk.
const NOTE = /isswf[\\/]compaction[\\/]sess-1\.json$/
function noteHost(on: any, sessionId = 'sess-1', { hasEnv = true } = {}) {
  const writes: { path: string; text: string }[] = []
  on('session.id', () => ({ value: sessionId }))
  if (hasEnv) on('env.get', (_: unknown, e: { name: string }) => ({ value: { CLAUDE_CONFIG_DIR: '/c' }[e.name] }))
  on('fs.write', (_: unknown, e: { path: string; text: string }) => (writes.push({ path: e.path, text: e.text }), { value: undefined }))
  const note = () => writes.filter(w => NOTE.test(w.path)).at(-1)
  return { writes, note, assignments: () => JSON.parse(note()?.text ?? '{}').assignments }
}

test('a session that activated the coordinator adds the retention instructions to its compaction, with or without the pane option', async ($, on) => {
  const seen: (string | undefined)[] = []
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('session.compact', (_: unknown, e: { instructions?: string }) => (seen.push(e.instructions), { messages: SUMMARY }))
  await compact($)
  await activate($)
  await compact($)
  await compact($, 'keep the plan')
  expect(seen[0]).toBeUndefined()
  for (const part of ['initiative and job', 'child agent IDs', 'candidate commit SHA', 'remaining review and correction budgets', 'open operator decisions', 'version advisory marker']) expect(seen[1]).toContain(part)
  expect(seen[2]?.startsWith('keep the plan\n')).toBe(true)
})

test('a session that never activated the coordinator compacts and starts unchanged', async ($, on) => {
  const seen: (string | undefined)[] = []
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('session.compact', (_: unknown, e: { instructions?: string }) => (seen.push(e.instructions), { messages: SUMMARY }))
  on('classic.SessionStart', () => ({}))
  await $.skill.prompt({ skill: 'other-skill', text: '' })
  await compact($, 'keep the plan')
  expect(seen).toEqual(['keep the plan'])
  expect(contextOf(await startAfterCompaction($))).toBe('')
})

test('the mod no longer adds the reminder on SessionStart: the plugin hook script prints it from the session note', async ($, on) => {
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('classic.SessionStart', () => ({}))
  const host = noteHost(on)
  await activate($)
  expect(contextOf(await startAfterCompaction($))).toBe('')
  expect(host.assignments()).toEqual([])
})

test('the reminder source lists the accepted dispatches, and a refused one is not remembered', async ($, on) => {
  dispatchHost(on)
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  const host = noteHost(on)
  await activate($)
  const ran = await $.tool.call(worker())
  expect(ran.result).toEqual({ agentId: 'agent-77' })
  const refused = await $.tool.call(worker('no references'))
  expect(refused.deny).toContain('isSWF dispatch refused')
  expect(host.assignments()).toEqual([{ agent: 'isswf:isswf-worker', initiative: 'I0001', job: 'J001', path: BRIEF, checkpoint: CHECKPOINT, base: BASE, run: 'agent-77' }])
})

test('a reviewer dispatch needs a handoff whose digests verify, and the worker needs none', async ($, on) => {
  const diff = new TextEncoder().encode('diff --git a/x b/x\n+changed\n')
  const CANDIDATE = 'c3'.repeat(20)
  const handoffPath = `C:${SEP}tmp${SEP}J001.handoff.json`
  const diffPath = `C:${SEP}tmp${SEP}J001.diff`
  const envelope = buildEnvelope({
    initiative: 'I0001', job: 'J001', base: BASE, candidate: CANDIDATE,
    diff: { path: diffPath, argv: diffCommandArguments(BASE, CANDIDATE, 'NUL'), bytes: diff.length, sha256: sha256Hex(diff) },
    brief: { path: BRIEF, revision: '1', checkpoint: CHECKPOINT, blob: null }, reviewGuide: null, round: 1, priorReviews: [],
    reviewer: { host: 'claude', agent: 'isswf:isswf-reviewer', model: 'opus', effort: 'medium' }, resources: [],
  })
  const handoff = new TextEncoder().encode(JSON.stringify(envelope, null, 2))
  dispatchHost(on, { [handoffPath]: handoff, [diffPath]: diff })
  const reviewer = (extra: string) => ({ tool: 'Agent', subagent_type: 'isswf:isswf-reviewer', model: 'opus', effort: 'medium', prompt: `${DISPATCH}\n${extra}` })
  const lines = (digest: string) => `handoff: ${handoffPath}\nhandoff-sha256: ${digest}\ncandidate ${CANDIDATE}`
  expect((await $.tool.call(reviewer(lines(sha256Hex(handoff))))).result).toEqual({ agentId: 'agent-77' })
  const missing = await $.tool.call(reviewer(''))
  expect(missing.deny).toContain('condition 6 (handoff)')
  const wrong = await $.tool.call(reviewer(lines('0'.repeat(64))))
  expect(wrong.deny).toContain('does not match')
  expect((await $.tool.call(worker())).result).toEqual({ agentId: 'agent-77' })
})

test('a session that never activated the coordinator remembers no dispatch', async ($, on) => {
  dispatchHost(on)
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  const host = noteHost(on)
  await $.tool.call(worker())
  expect(host.writes).toEqual([])
  await activate($)
  expect(host.assignments()).toEqual([])
})

test('a fault in the compaction hooks leaves the host behaviour unchanged', async ($, on) => {
  const seen: (string | undefined)[] = []
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('session.compact', (_: unknown, e: { instructions?: string }) => (seen.push(e.instructions), { messages: SUMMARY }))
  on('classic.SessionStart', () => ({ additionalContext: ['other hook'] }))
  const stored = new Map<string, unknown>()
  let broken = false
  on('state.get', (_: unknown, e: { key: string }) => {
    if (broken) throw new Error('state unavailable')
    return { value: { value: stored.get(e.key), version: 1 } }
  })
  on('state.set', (_: unknown, e: { key: string; value: unknown }) => (stored.set(e.key, e.value), { value: { isSet: true, version: 1 } }))
  await activate($)
  broken = true
  await compact($, 'keep the plan')
  expect(seen).toEqual(['keep the plan'])
  expect((await startAfterCompaction($)).additionalContext).toEqual(['other hook'])
})

// Where Claude Code seats its built-in guard, `skill.prompt` never runs for a user's mod; the Skill tool call still does.
const loadCoordinator = (skill: string) => ({ tool: 'Skill', skill })
for (const skill of ['isswf:isswf-coordinator', 'isswf-coordinator']) {
  test(`the Skill tool loading ${skill} activates the coordinator without a skill.prompt event`, ON, async ($, on) => {
    const host = engine(on, '/p')
    noteHost(on, 'sess-1', { hasEnv: false })
    expect(await $.command.run({ command: 'isswf-initiatives', args: '' })).toEqual({ text: 'El coordinador isSWF no está activo en esta sesión.' })
    await $.tool.call({ tool: 'Skill', skill: 'isswf:isswf-worker' })
    expect(host.opened).toEqual([])
    await $.tool.call(loadCoordinator(skill))
    expect(host.opened).toEqual(['isswf-initiatives'])
    expect(await $.command.run({ command: 'isswf-initiatives', args: '' })).toEqual({ text: 'Panel de iniciativas abierto.' })
  })
}

test('the Skill tool activation is recorded with the pane option off, and a later skill.prompt does no harm', async ($, on) => {
  const seen: (string | undefined)[] = []
  on('tool.call', () => ({ result: {} }))
  on('skill.prompt', (_: unknown, e: { text: string }) => ({ text: e.text }))
  on('session.compact', (_: unknown, e: { instructions?: string }) => (seen.push(e.instructions), { messages: SUMMARY }))
  const host = noteHost(on)
  await $.tool.call(loadCoordinator('isswf:isswf-coordinator'))
  await compact($)
  await activate($)
  await compact($)
  expect(seen[0]).toContain('child agent IDs')
  expect(seen[1]).toEqual(seen[0])
  expect(host.assignments()).toEqual([])
})

test('a failed Skill tool call and another skill record nothing', async ($, on) => {
  on('tool.call', (_: unknown, e: { skill?: string }) => (e.skill === 'isswf:isswf-coordinator' ? { isError: true, result: {} } : { result: {} }))
  const host = noteHost(on)
  await $.tool.call(loadCoordinator('isswf:isswf-coordinator'))
  await $.tool.call(loadCoordinator('other'))
  expect(host.writes).toEqual([])
})

test('an unsafe session id is never turned into a file name', async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  const host = noteHost(on, '../../escape')
  await $.tool.call(loadCoordinator('isswf-coordinator'))
  expect(host.writes).toEqual([])
})

test('an unreadable language setting falls back to English instead of failing the command', ON, async ($, on) => {
  on('settings.read', () => { throw new Error('bypassed') })
  expect(await $.command.run({ command: 'isswf-initiatives', args: '' })).toEqual({ text: 'The isSWF coordinator is not active in this session.' })
})
