import { update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import { joiner, readSnapshot } from '../tools/isswf-snapshot-core.mjs'
import { resolveRunUsage } from '../tools/isswf-run-usage-core.mjs'

const PANE = 'isswf-initiatives'
const TOUCHED = { plugin: 'isswf', key: 'touched' } as const
const PINNED = { plugin: 'isswf', key: 'pinned' } as const
const EXPANDED = { plugin: 'isswf', key: 'expanded' } as const
const IS_ACTIVATED = { plugin: 'isswf', key: 'isActivated' } as const
const NOT_ACTIVE = 'El coordinador isSWF no está activo en esta sesión.'
const RECORD_PATH = /(?:\.isswf|\.factory)\/initiatives\/(I\d+)\b/g
const UNKNOWN = 'desconocido'
const RECENT_COMPLETED = 2
const VERDICTS: Record<string, string> = {
  passed: 'aprobado',
  'changes-requested': 'cambios pedidos',
  running: 'en curso',
}
const PILL_COLORS: Record<string, string> = {
  passed: 'success',
  'changes-requested': 'warning',
  running: 'inactive',
}

// Timers do not survive a hot reload, so the fallback restarts lazily from the activated state.
let debounce: Timer | undefined
let fallback: Timer | undefined
// Usage lives in module memory: drawing reads only `usage`, while resolution runs after the draw.
const usage = new Map<string, any>()
const finishedRuns = new Map()
const resolving = new Set<string>()
let homes: Promise<{ claudeDir?: string; piDir?: string }> | undefined

function scheduleRefresh($: EngineInterface) {
  debounce?.cancel()
  debounce = $.clock.after(1000, () => $.ui.invalidate('ui.render'))
}

function ensureFallback($: EngineInterface) {
  fallback ??= $.clock.every(60_000, () => $.ui.invalidate('ui.render'))
}

const adding = (ids: string[]) => (list: string[] | undefined) => [...new Set([...(list ?? []), ...ids])].sort()
const removing = (id: string) => (list: string[] | undefined) => (list ?? []).filter(x => x !== id)

async function readVersion($: EngineInterface) {
  try {
    const { version } = JSON.parse(await $.fs.read(joiner($.plugin.root)($.plugin.root, '.claude-plugin', 'plugin.json')))
    return typeof version === 'string' ? version : 'unknown'
  } catch {
    return 'unknown'
  }
}

async function paneSpec($: EngineInterface) {
  const cwd = await $.session.cwd()
  const folder = cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || cwd
  return { id: PANE, title: `isSWF v${await readVersion($)} · ${folder}` }
}

// Each variable name is a literal, as the engine requires; USERPROFILE is the Windows home.
function findHomes($: EngineInterface) {
  homes ??= (async () => {
    const home = (await $.env.get('HOME')) || (await $.env.get('USERPROFILE'))
    const at = (dir: string | undefined, ...parts: string[]) => (dir ? joiner(dir)(dir, ...parts) : undefined)
    return {
      claudeDir: (await $.env.get('CLAUDE_CONFIG_DIR')) || at(home, '.claude'),
      piDir: (await $.env.get('PI_CODING_AGENT_DIR')) || at(home, '.pi', 'agent'),
    }
  })()
  return homes
}

const runKey = (run: { host: string; kind: string; id: string }) => `${run.host} ${run.kind} ${run.id}`

// Resolves after the draw; a changed result redraws through the debounce, so a growing transcript
// redraws at most once a second rather than looping.
function resolveUsage($: EngineInterface, runs: any[], project: string) {
  const pending = runs.filter(run => !resolving.has(runKey(run)))
  if (!pending.length) return
  for (const run of pending) resolving.add(runKey(run))
  void (async () => {
    let changed = false
    try {
      const { claudeDir, piDir } = await findHomes($)
      // The engine refuses `$.fs` passed as a value, so each call is spelled out.
      const fs = {
        exists: (path: string) => $.fs.exists(path),
        list: (path: string) => $.fs.list(path),
        stat: (path: string) => $.fs.stat(path),
        read: (path: string) => $.fs.read(path),
      }
      for (const run of pending) {
        const host = run.host === 'claude' ? claudeDir : piDir
        const found = host ? await resolveRunUsage(run, { fs, claudeDir, piDir, project, cache: finishedRuns }) : null
        if (found && JSON.stringify(found) !== JSON.stringify(usage.get(runKey(run)))) {
          usage.set(runKey(run), found)
          changed = true
        }
      }
    } finally {
      for (const run of pending) resolving.delete(runKey(run))
    }
    if (changed) scheduleRefresh($)
  })().catch(() => {})
}

function touchedIds(e: { tool: string; file_path?: unknown; command?: unknown }) {
  const text = e.tool === 'Bash' ? e.command : ['Read', 'Edit', 'Write'].includes(e.tool) ? e.file_path : undefined
  if (typeof text !== 'string') return []
  return [...text.replace(/\\/g, '/').matchAll(RECORD_PATH)].map(m => m[1])
}

function countLabel(jobs: any[]) {
  const blocked = jobs.filter(j => j.status === 'blocked').length
  const open = jobs.filter(j => j.status !== 'completed' && j.status !== 'blocked').length
  return [blocked && `${blocked} bloqueados`, open && `${open} sin cerrar`].filter(Boolean).join(' · ')
}

const known = (value: string) => (value === 'unknown' ? UNKNOWN : value)
const sum = (values: any[]) => (values.some(v => typeof v !== 'number') ? undefined : values.reduce((a, b) => a + b, 0))
const countKeys = (maps: any[]) => sum(maps.map(m => (m && typeof m === 'object' ? Object.values(m).reduce((a: number, b: any) => a + b, 0) : m)))

// One entry may cite several runs; any unresolved run makes the sum unknown.
function usageLines(entry: any) {
  const found = entry.runs.map((run: any) => usage.get(runKey(run)))
  if (!found.length || found.some((u: any) => !u?.found)) return { model: undefined, lines: [`consumo: ${UNKNOWN}`] }
  const tokens = sum(found.map((u: any) => (typeof u.tokens === 'object' ? sum(Object.values(u.tokens)) : u.tokens)))
  const duration = sum(found.map((u: any) => u.durationMs))
  const cost = sum(found.map((u: any) => u.costUsd))
  const partial = found.some((u: any) => u.costPartial || u.tokensPartial)
  const models = [...new Set(found.map((u: any) => u.model))]
  return {
    model: models.length === 1 && models[0] !== 'unknown' ? models[0] : undefined,
    lines: [
      `tokens: ${tokens ?? UNKNOWN}${partial ? ' (parcial)' : ''}`,
      `duración: ${duration === undefined ? UNKNOWN : `${Math.round(duration / 1000)} s`}`,
      `coste: ${cost === undefined ? UNKNOWN : `$${cost.toFixed(2)}${partial ? ' (parcial)' : ''}`}`,
      `skills: ${countKeys(found.map((u: any) => u.skills)) ?? UNKNOWN} · .agents: ${countKeys(found.map((u: any) => u.agentsReads)) ?? UNKNOWN}`,
    ],
  }
}

// Hover is style-only, so every card line is computed before drawing.
function pillView(initiativeId: string, jobId: string, entry: any) {
  const resolved = usageLines(entry)
  const model = resolved.model
    ? `modelo: ${resolved.model} (transcript)`
    : `modelo: ${known(entry.model)}${entry.modelSource === 'unknown' ? '' : ` (${entry.modelSource})`}`
  return {
    key: `${initiativeId}-${jobId}-${entry.id}`,
    label: entry.role === 'unknown' ? entry.id : entry.role,
    color: PILL_COLORS[entry.verdict],
    isRunning: entry.verdict === 'running',
    details: [
      `${entry.id} · ${entry.kind}`,
      model,
      `esfuerzo: ${known(entry.effort)}`,
      `veredicto: ${VERDICTS[entry.verdict] ?? UNKNOWN}`,
      ...resolved.lines,
    ],
  }
}

export const register: Register = (on, options) => {
  // Opt-in: with the option off no hook is added, so nothing reads, schedules, registers or draws.
  if (options?.initiativesPane !== true) return

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'isswf-initiatives',
      description: 'Open or refresh the isSWF initiatives pane; pin or unpin <ID>',
    })

    return next(e)
  })

  on('skill.prompt', async ($, e, next) => {
    if (e.skill.endsWith('isswf-coordinator')) {
      await $.state.set(IS_ACTIVATED, true)
      ensureFallback($)
      void paneSpec($).then(spec => $.ui.open(spec))
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    // Observation only: a failure here must never change or repeat the tool's result.
    try {
      if ((await $.state.get(IS_ACTIVATED)).value) {
        ensureFallback($)
        const ids = touchedIds(e)
        if (ids.length) {
          await update($, TOUCHED, adding(ids))
          scheduleRefresh($)
        }
      }
    } catch {}

    return ran
  })

  on('command.run', { command: 'isswf-initiatives' }, async ($, e) => {
    if (!(await $.state.get(IS_ACTIVATED)).value) return { text: NOT_ACTIVE }
    ensureFallback($)
    const [verb, id] = e.args.trim().split(/\s+/)
    if ((verb === 'pin' || verb === 'unpin') && /^I\d+$/.test(id ?? '')) {
      if (verb === 'pin') await update($, PINNED, adding([id]))
      else await Promise.all([update($, PINNED, removing(id)), update($, TOUCHED, removing(id))])
      $.ui.invalidate('ui.render')
      return { text: `${id} ${verb === 'pin' ? 'fijada' : 'desfijada'}.` }
    }
    if (verb) return { text: 'Uso: /isswf-initiatives [pin <ID> | unpin <ID>]' }
    await $.ui.open(await paneSpec($))
    $.ui.invalidate('ui.render')

    return { text: 'Panel de iniciativas abierto.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    if (!(await $.state.get(IS_ACTIVATED)).value) return <Text dimColor>{NOT_ACTIVE}</Text>
    const { value: touched = [] } = await $.state.get(TOUCHED)
    const { value: pinned = [] } = await $.state.get(PINNED)
    const { value: expanded = [] } = await $.state.get(EXPANDED)
    const fs = {
      exists: (path: string) => $.fs.exists(path),
      list: (path: string) => $.fs.list(path),
      stat: (path: string) => $.fs.stat(path),
      read: (path: string) => $.fs.read(path),
    }
    let snapshot
    try {
      snapshot = await readSnapshot(await $.session.cwd(), fs)
    } catch (error) {
      return <Text color="error">{String((error as Error).message)}</Text>
    }

    // An unopened initiative becomes a card only when pinned: touching its plan starts no work.
    const cards = snapshot.initiatives.filter((i: any) => pinned.includes(i.id) || touched.includes(i.id))
    const unopenedCards = snapshot.unopened.filter((u: any) => pinned.includes(u.id))
    const started = snapshot.initiatives.filter((i: any) => !cards.includes(i))
    const unopened = snapshot.unopened.filter((u: any) => !unopenedCards.includes(u))
    // Plan order is the only completion order the records give, so the last completed jobs in it are the recent ones.
    const recentOf = (initiative: any) => initiative.jobs.filter((j: any) => j.status === 'completed').slice(-RECENT_COMPLETED)
    const isExpanded = (initiative: any, job: any) => expanded.includes(`${initiative.id}-${job.id}`)
    resolveUsage($, cards.flatMap((i: any) => i.jobs.filter((j: any) => j.status !== 'completed' || isExpanded(i, j)))
      .flatMap((j: any) => j.rounds.flatMap((r: any) => r.entries.flatMap((x: any) => x.runs))), snapshot.project)

    const pill = (p: ReturnType<typeof pillView>) => (
      <Box key={p.key} borderStyle={p.isRunning ? 'dashed' : 'round'} borderColor={p.color} borderDimColor={!p.color}>
        <Text color={p.color} dimColor={!p.color}>{p.label}</Text>
        <Box position="absolute" top={-(p.details.length + 2)} left={0} height={p.details.length + 2} flexShrink={0} display="none" hover={{ display: 'flex' }} borderStyle="round" borderColor="claude" backgroundColor="inverseText" flexDirection="column">
          {p.details.map(line => <Text>{line}</Text>)}
        </Box>
      </Box>
    )
    const rounds = (initiative: any, job: any) => job.rounds.map((round: any) => (
      <Box flexDirection="row" gap={1} alignItems="center">
        <Text dimColor>{round.round === 'unknown' ? 'R?' : `R${round.round}`}</Text>
        {round.entries.map((entry: any) => pill(pillView(initiative.id, job.id, entry)))}
      </Box>
    ))
    const toggle = (key: string) => () => update($, EXPANDED, expanded.includes(key) ? removing(key) : adding([key])).then(() => $.ui.invalidate('ui.render'))

    const { title } = await paneSpec($)
    return (
      <Box flexDirection="column">
        <Text bold color="claude">{title}</Text>
        <Text color="claude">{'═'.repeat(Math.max(1, e.props.bodyColumns ?? 40))}</Text>
        {unopenedCards.map((u: any) => (
          <Box borderStyle="round" borderColor="subtle" flexDirection="column">
            <Text bold>● {u.id} · {u.title}</Text>
            <Text dimColor>sin trabajo iniciado</Text>
          </Box>
        ))}
        {cards.map((initiative: any) => {
          const closed = initiative.jobs.filter((j: any) => j.status === 'completed').length
          return (
            <Box borderStyle="round" borderColor="subtle" flexDirection="column">
              <Text bold>● {initiative.id} · {initiative.title}</Text>
              {initiative.status === 'unparsed' && <Text dimColor>plan no legible</Text>}
              <Text dimColor>jobs {closed}/{initiative.jobs.length} ✓ · {initiative.jobs.length - closed} sin cerrar</Text>
              {closed > 0 && <Text color="success">✓ {closed} completados</Text>}
              {recentOf(initiative).map((job: any) => (
                <Box flexDirection="column">
                  <Button key={`${initiative.id}-${job.id}`} plain onPress={toggle(`${initiative.id}-${job.id}`)}>
                    <Text color="success" wrap="truncate-end">✓ {job.id} {job.objective}</Text>
                  </Button>
                  {isExpanded(initiative, job) && rounds(initiative, job)}
                </Box>
              ))}
              {initiative.jobs.map((job: any) => {
                if (job.status === 'completed') return null
                if (job.status === 'pending' && job.recordCount === 0) return <Text dimColor wrap="truncate-end">○ {job.id} {job.objective}</Text>
                return (
                  <Box flexDirection="column">
                    <Text color="suggestion" wrap="truncate-end">▸ {job.id} ({job.status}) {job.objective}</Text>
                    {rounds(initiative, job)}
                  </Box>
                )
              })}
            </Box>
          )
        })}
        <Box borderStyle="round" borderColor="subtle" flexDirection="column">
          <Text bold>No activas {started.length + unopened.length}</Text>
          {started.map((i: any) => {
            const count = countLabel(i.jobs)
            return <Text>◐ {i.id} · {i.title}{count && ` · ${count}`}</Text>
          })}
          {unopened.map((u: any) => <Text dimColor>○ {u.id} · {u.title}</Text>)}
        </Box>
      </Box>
    )
  })
}
