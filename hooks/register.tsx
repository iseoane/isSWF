import { update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import { joiner, readSnapshot } from '../tools/isswf-snapshot-core.mjs'
import { countToolUses, resolveRunUsage } from '../tools/isswf-run-usage-core.mjs'

const PANE = 'isswf-initiatives'
const TOUCHED = { plugin: 'isswf', key: 'touched' } as const
const PINNED = { plugin: 'isswf', key: 'pinned' } as const
const EXPANDED = { plugin: 'isswf', key: 'expanded' } as const
const IS_ACTIVATED = { plugin: 'isswf', key: 'isActivated' } as const
const TAB = { plugin: 'isswf', key: 'tab' } as const
const RESUME = { plugin: 'isswf', key: 'resumeOnQuota' } as const
const RESUME_THRESHOLD = 90
const RESUME_DELAY_MS = 5 * 60_000
const RECORD_PATH = /(?:\.isswf|\.factory)\/initiatives\/(I\d+)\b/g
// A command that names an initiative, such as isswf-status --initiative I0046, also touches it.
const INITIATIVE_FLAG = /--initiative(?:=|\s+)["']?(I\d+)\b/g
const RECENT_COMPLETED = 2
const LABELS = {
  es: {
    notActive: 'El coordinador isSWF no está activo en esta sesión.',
    unknown: 'desconocido',
    references: 'referencias',
    verdicts: { passed: 'aprobado', 'changes-requested': 'cambios pedidos', failed: 'fallido', partial: 'parcial', running: 'en curso' } as Record<string, string>,
    blocked: 'bloqueados',
    open: 'sin cerrar',
    usage: 'consumo',
    partial: 'parcial',
    duration: 'duración',
    cost: 'coste',
    model: 'modelo',
    effort: 'esfuerzo',
    verdict: 'veredicto',
    pinned: 'fijada',
    unpinned: 'desfijada',
    usageHelp: 'Uso: /isswf-initiatives [pin <ID> | unpin <ID>]',
    opened: 'Panel de iniciativas abierto.',
    noWork: 'sin trabajo iniciado',
    unparsed: 'plan no legible',
    completed: 'completados',
    inactive: 'No activas',
    tabs: { initiatives: 'Iniciativas', agents: 'Agentes' } as Record<string, string>,
    resume: 'retomar tras cuota',
    on: 'sí',
    off: 'no',
    resumeAt: 'a las',
    noReset: 'sin hora de renovación: no se programa',
    coordinator: 'coordinador (esta sesión)',
    noAgents: 'sin agentes delegados en las iniciativas visibles',
    run: 'ejecución',
    runs: 'ejecuciones',
  },
  en: {
    notActive: 'The isSWF coordinator is not active in this session.',
    unknown: 'unknown',
    references: 'references',
    verdicts: { passed: 'passed', 'changes-requested': 'changes requested', failed: 'failed', partial: 'partial', running: 'running' } as Record<string, string>,
    blocked: 'blocked',
    open: 'open',
    usage: 'usage',
    partial: 'partial',
    duration: 'duration',
    cost: 'cost',
    model: 'model',
    effort: 'effort',
    verdict: 'verdict',
    pinned: 'pinned',
    unpinned: 'unpinned',
    usageHelp: 'Usage: /isswf-initiatives [pin <ID> | unpin <ID>]',
    opened: 'Initiatives pane opened.',
    noWork: 'no work started',
    unparsed: 'plan unreadable',
    completed: 'completed',
    inactive: 'Inactive',
    tabs: { initiatives: 'Initiatives', agents: 'Agents' } as Record<string, string>,
    resume: 'resume after quota',
    on: 'on',
    off: 'off',
    resumeAt: 'at',
    noReset: 'no reset time: nothing scheduled',
    coordinator: 'coordinator (this session)',
    noAgents: 'no delegated agents in the visible initiatives',
    run: 'run',
    runs: 'runs',
  },
}
type Labels = typeof LABELS.en

// Claude Code's `language` setting is free text, so any Spanish spelling selects Spanish; English is the default.
async function labelsFor($: EngineInterface): Promise<Labels> {
  const language = await $.settings.read({ key: 'language' })
  return typeof language === 'string' && /^(es\b|españ|espan|spanish|castellano)/i.test(language.trim()) ? LABELS.es : LABELS.en
}
const PILL_COLORS: Record<string, string> = {
  passed: 'success',
  'changes-requested': 'warning',
  failed: 'error',
  partial: 'warning',
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
// The coordinator's own counts, refreshed after each Agents draw so drawing never waits on the transcript.
let ownCounts: { skills: any; agentsReads: any } | undefined
let countingOwn = false
// One resume per usage window: the timer lives only in this session, and `resumeFor` is the window's reset time.
let resumeTimer: Timer | undefined
let resumeFor: string | undefined
let resumeAtMs: number | undefined
// True while the threshold is met but the window gives no reset time, so nothing can be scheduled.
let resumeNoReset = false

function cancelResume() {
  resumeTimer?.cancel()
  resumeTimer = resumeFor = resumeAtMs = undefined
}

// Runs after the draw: at 90% or more of the five-hour window with a job in progress, schedule one resume
// prompt for the window's reset plus five minutes. The prompt asks the coordinator to reconcile, not to act.
function checkResume($: EngineInterface, cards: any[]) {
  void (async () => {
    const window = (await $.session.usage()).rateLimits.find((w: any) => w.kind === 'five_hour')
    const work = cards.flatMap((i: any) => i.jobs.filter((j: any) => j.status === 'in-progress').map((j: any) => `${i.id}/${j.id}`))
    const due = window !== undefined && window.percentUsed >= RESUME_THRESHOLD && work.length > 0
    if (due !== resumeNoReset && (!due || !window?.resetsAt)) {
      resumeNoReset = due && !window?.resetsAt
      scheduleRefresh($)
    }
    if (!due || !window?.resetsAt || resumeFor === window.resetsAt) return
    const at = Date.parse(window.resetsAt) + RESUME_DELAY_MS
    if (!Number.isFinite(at)) return
    cancelResume()
    resumeFor = window.resetsAt
    resumeAtMs = at
    resumeTimer = $.clock.after(Math.max(0, at - (await $.clock.now())), () => {
      resumeTimer = undefined
      void $.prompt.submit({
        text: `isSWF: the five-hour usage window has reset. Work was in progress on ${work.join(', ')}. Load the isswf-coordinator skill, reconcile state first (isswf-status, open PRs, running reviews), then continue only the work already authorised; do not start new jobs without the operator's go.`,
      })
    })
    scheduleRefresh($)
  })().catch(() => {})
}

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

// Heredoc bodies and quoted text with spaces, such as commit messages or scripts, only mention paths;
// a quoted single path is still an operand.
// The rest of a heredoc's opening line, such as its output redirection, is kept.
const HEREDOC = /<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?(?:\n\s*\2\s*(?:\n|$)|$)/g
const QUOTED = /(["'])(?:(?!\1)[\s\S])*\1/g

function touchedIds(e: { tool: string; file_path?: unknown; command?: unknown }) {
  const raw = e.tool === 'Bash' ? e.command : ['Read', 'Edit', 'Write'].includes(e.tool) ? e.file_path : undefined
  if (typeof raw !== 'string') return []
  const text = e.tool === 'Bash' ? raw.replace(HEREDOC, '$3\n').replace(QUOTED, q => (/\s/.test(q) ? '""' : q)) : raw
  const ids = [...text.replace(/\\/g, '/').matchAll(RECORD_PATH)].map(m => m[1])
  if (e.tool === 'Bash') ids.push(...[...text.matchAll(INITIATIVE_FLAG)].map(m => m[1]))
  return ids
}

function countLabel(jobs: any[], t: Labels) {
  const blocked = jobs.filter(j => j.status === 'blocked').length
  const open = jobs.filter(j => j.status !== 'completed' && j.status !== 'blocked').length
  return [blocked && `${blocked} ${t.blocked}`, open && `${open} ${t.open}`].filter(Boolean).join(' · ')
}

const known = (value: string, t: Labels) => (value === 'unknown' ? t.unknown : value)
const sum = (values: any[]) => (values.some(v => typeof v !== 'number') ? undefined : values.reduce((a, b) => a + b, 0))
const countKeys = (maps: any[]) => sum(maps.map(m => (m && typeof m === 'object' ? Object.values(m).reduce((a: number, b: any) => a + b, 0) : m)))

// One entry may cite several runs; any unresolved run makes the sum unknown.
function usageLines(entry: any, t: Labels) {
  const found = entry.runs.map((run: any) => usage.get(runKey(run)))
  if (!found.length || found.some((u: any) => !u?.found)) return { model: undefined, lines: [`${t.usage}: ${t.unknown}`] }
  const tokens = sum(found.map((u: any) => (typeof u.tokens === 'object' ? sum(Object.values(u.tokens)) : u.tokens)))
  const duration = sum(found.map((u: any) => u.durationMs))
  const cost = sum(found.map((u: any) => u.costUsd))
  const partial = found.some((u: any) => u.costPartial || u.tokensPartial)
  const models = [...new Set(found.map((u: any) => u.model))]
  return {
    model: models.length === 1 && models[0] !== 'unknown' ? models[0] : undefined,
    lines: [
      `tokens: ${tokens ?? t.unknown}${partial ? ` (${t.partial})` : ''}`,
      `${t.duration}: ${duration === undefined ? t.unknown : `${Math.round(duration / 1000)} s`}`,
      `${t.cost}: ${cost === undefined ? t.unknown : `$${cost.toFixed(2)}${partial ? ` (${t.partial})` : ''}`}`,
      `skills: ${countKeys(found.map((u: any) => u.skills)) ?? t.unknown} · ${t.references}: ${countKeys(found.map((u: any) => u.agentsReads)) ?? t.unknown}`,
    ],
  }
}

// `name ×n` pairs, most used first; unknown when the run's transcript could not be read.
function tally(map: any, t: Labels) {
  if (!map || typeof map !== 'object') return t.unknown
  // Show the skill or reference name alone (".agents/roles/references/review.md" -> "review"); same names add up.
  const short = (path: string) => { const parts = path.split(/[\\/]/).filter(Boolean); const file = parts.pop() ?? path; return (/^skill\.md$/i.test(file) && parts.length ? parts.pop()! : file).replace(/\.md$/i, '') }
  const named: Record<string, number> = {}
  for (const [k, n] of Object.entries(map)) named[short(k)] = (named[short(k)] ?? 0) + (n as number)
  const pairs = Object.entries(named).sort((a: any, b: any) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return pairs.length ? pairs.map(([name, n]) => `${name} ×${n}`).join(', ') : '0'
}

// Review rounds are numbered within a brief revision; the revision is shown only when the job has several.
function roundLabel(job: any, round: any) {
  const briefs = new Set(job.rounds.map((r: any) => r.round))
  const review = `R${round.reviewRound}`
  if (round.round === 'unknown') return `r?·${review}`
  return briefs.size > 1 ? `r${round.round}·${review}` : review
}

function pillView(initiativeId: string, jobId: string, entry: any, t: Labels) {
  const resolved = usageLines(entry, t)
  const model = resolved.model
    ? `${t.model}: ${resolved.model} (transcript)`
    : `${t.model}: ${known(entry.model, t)}${entry.modelSource === 'unknown' ? '' : ` (${entry.modelSource})`}`
  return {
    key: `${initiativeId}-${jobId}-${entry.id}`,
    label: entry.role === 'unknown' ? entry.id : entry.role,
    color: PILL_COLORS[entry.verdict],
    isRunning: entry.verdict === 'running',
    details: [
      `${entry.id} · ${entry.kind}`,
      model,
      `${t.effort}: ${known(entry.effort, t)}`,
      // The record's own word, such as blocked or cancelled, is more precise than the colour's group.
      `${t.verdict}: ${entry.outcome !== 'unknown' && entry.verdict !== 'running' ? entry.outcome : t.verdicts[entry.verdict] ?? t.unknown}`,
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
    const t = await labelsFor($)
    if (!(await $.state.get(IS_ACTIVATED)).value) return { text: t.notActive }
    ensureFallback($)
    const [verb, id] = e.args.trim().split(/\s+/)
    if ((verb === 'pin' || verb === 'unpin') && /^I\d+$/.test(id ?? '')) {
      if (verb === 'pin') await update($, PINNED, adding([id]))
      else await Promise.all([update($, PINNED, removing(id)), update($, TOUCHED, removing(id))])
      $.ui.invalidate('ui.render')
      return { text: `${id} ${verb === 'pin' ? t.pinned : t.unpinned}.` }
    }
    if (verb) return { text: t.usageHelp }
    await $.ui.open(await paneSpec($))
    $.ui.invalidate('ui.render')

    return { text: t.opened }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const t = await labelsFor($)
    if (!(await $.state.get(IS_ACTIVATED)).value) return <Text dimColor>{t.notActive}</Text>
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

    const toggle = (key: string) => () => update($, EXPANDED, expanded.includes(key) ? removing(key) : adding([key])).then(() => $.ui.invalidate('ui.render'))
    // A pressed pill opens its detail in normal flow below its round, so it pushes later lines down instead of covering them.
    const pill = (p: ReturnType<typeof pillView>) => (
      <Box key={p.key} borderStyle={p.isRunning ? 'dashed' : 'round'} borderColor={p.color} borderDimColor={!p.color}>
        <Button key={p.key} plain onPress={toggle(p.key)}>
          <Text color={p.color} dimColor={!p.color}>{p.label}</Text>
        </Button>
      </Box>
    )
    const rounds = (initiative: any, job: any) => job.rounds.map((round: any) => {
      const pills = round.entries.map((entry: any) => pillView(initiative.id, job.id, entry, t))
      return (
        <Box flexDirection="column">
          <Box flexDirection="row" gap={1} alignItems="center">
            <Text dimColor>{roundLabel(job, round)}</Text>
            {pills.map(pill)}
          </Box>
          {pills.filter((p: ReturnType<typeof pillView>) => expanded.includes(p.key)).map((p: ReturnType<typeof pillView>) => (
            <Box key={`${p.key}-detail`} borderStyle="round" borderColor="claude" flexDirection="column">
              {p.details.map(line => <Text>{line}</Text>)}
            </Box>
          ))}
        </Box>
      )
    })

    const { title } = await paneSpec($)
    const { value: tab = 'initiatives' } = await $.state.get(TAB)
    const { value: resumeOn = false } = await $.state.get(RESUME)
    if (resumeOn) checkResume($, cards)
    else if (resumeTimer || resumeFor) cancelResume()
    const toggleResume = () => $.state.set(RESUME, !resumeOn).then(() => $.ui.invalidate('ui.render'))
    const resumeDetail = !resumeOn ? '' : resumeAtMs !== undefined ? ` · ${t.resumeAt} ${new Date(resumeAtMs).toTimeString().slice(0, 5)}` : resumeNoReset ? ` · ${t.noReset}` : ''
    const resumeText = `⏰ ${t.resume}: ${resumeOn ? t.on : t.off}${resumeDetail}`
    const header = (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={2}>
          <Text bold color="merged">{title}</Text>
          <Button key="resume-toggle" plain onPress={toggleResume}>
            <Text color={resumeOn ? 'success' : undefined} dimColor={!resumeOn}>{resumeText}</Text>
          </Button>
        </Box>
        <Box flexDirection="row" gap={1}>
          {['initiatives', 'agents'].map(name => (
            <Button key={`tab-${name}`} plain onPress={() => $.state.set(TAB, name).then(() => $.ui.invalidate('ui.render'))}>
              <Text bold={tab === name} color={tab === name ? 'claude' : undefined} dimColor={tab !== name}>{tab === name ? `[${t.tabs[name]}]` : ` ${t.tabs[name]} `}</Text>
            </Button>
          ))}
        </Box>
        <Text color="merged">{'═'.repeat(Math.max(1, e.props.bodyColumns ?? 40))}</Text>
      </Box>
    )
    if (tab === 'agents') {
      // The coordinator is this session; delegated agents are the runs cited by the visible cards' records.
      if (!countingOwn) {
        countingOwn = true
        void $.session.messages()
          .then((messages: any[]) => {
            const next = countToolUses(messages.flatMap((m: any) => (m.role === 'assistant' ? m.toolUses : [])))
            if (JSON.stringify(next) !== JSON.stringify(ownCounts)) {
              ownCounts = next
              scheduleRefresh($)
            }
          })
          .catch(() => {})
          .finally(() => { countingOwn = false })
      }
      const own = ownCounts ?? { skills: undefined, agentsReads: undefined }
      // One accumulated row per agent role: every run of that role across the visible cards, each run counted once.
      const byRole = new Map<string, Map<string, any>>()
      for (const i of cards) for (const j of i.jobs) for (const r of j.rounds) for (const x of r.entries) for (const run of x.runs) {
        const role = x.role === 'unknown' ? 'unknown' : x.role
        if (!byRole.has(role)) byRole.set(role, new Map())
        byRole.get(role)!.set(runKey(run), run)
      }
      const agents = [...byRole].map(([role, runs]) => ({ key: `role-${role}`, label: `${role === 'unknown' ? t.unknown : role} · ${runs.size} ${runs.size === 1 ? t.run : t.runs}`, runs: [...runs.values()], found: [...runs.keys()].map(k => usage.get(k)) }))
      // Every listed run is resolved here, including completed jobs the initiatives tab leaves folded.
      resolveUsage($, agents.flatMap((a: any) => a.runs), snapshot.project)
      const merge = (maps: any[]) => (maps.some(m => !m || typeof m !== 'object') ? undefined : maps.reduce((all, m) => { for (const [k, n] of Object.entries(m)) all[k] = (all[k] ?? 0) + (n as number); return all }, {}))
      const row = (key: string, label: string, skills: any, reads: any) => (
        <Box key={key} borderStyle="round" borderColor="subtle" flexDirection="column">
          <Text bold color="claude">{label}</Text>
          <Text wrap="wrap">skills: {tally(skills, t)}</Text>
          <Text wrap="wrap">{t.references}: {tally(reads, t)}</Text>
        </Box>
      )
      return (
        <Box flexDirection="column">
          {header}
          {row('coordinator', t.coordinator, own.skills, own.agentsReads)}
          {agents.length === 0 && <Text dimColor>{t.noAgents}</Text>}
          {agents.map((a: any) => row(a.key, a.label, merge(a.found.map((u: any) => u?.found ? u.skills : undefined)), merge(a.found.map((u: any) => u?.found ? u.agentsReads : undefined))))}
        </Box>
      )
    }
    return (
      <Box flexDirection="column">
        {header}
        {unopenedCards.map((u: any) => (
          <Box borderStyle="round" borderColor="subtle" flexDirection="column">
            <Text bold color="claude">● {u.id} · {u.title}</Text>
            <Text dimColor>{t.noWork}</Text>
          </Box>
        ))}
        {cards.map((initiative: any) => {
          const closed = initiative.jobs.filter((j: any) => j.status === 'completed').length
          return (
            <Box borderStyle="round" borderColor="subtle" flexDirection="column">
              <Text bold color="claude">● {initiative.id} · {initiative.title}</Text>
              {initiative.status === 'unparsed' && <Text dimColor>{t.unparsed}</Text>}
              <Text dimColor>jobs {closed}/{initiative.jobs.length} ✓ · {initiative.jobs.length - closed} {t.open}</Text>
              {closed > 0 && <Text color="success">✓ {closed} {t.completed}</Text>}
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
          <Text bold>{t.inactive} {started.length + unopened.length}</Text>
          {started.map((i: any) => {
            const count = countLabel(i.jobs, t)
            return <Text>◐ {i.id} · {i.title}{count && ` · ${count}`}</Text>
          })}
          {unopened.map((u: any) => <Text dimColor>○ {u.id} · {u.title}</Text>)}
        </Box>
      </Box>
    )
  })
}
