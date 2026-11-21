import { update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import { assignmentOf, checkBranch, observeBranch, refreshBranches } from '../tools/isswf-branch-guard-core.mjs'
import { guardCommand, HEREDOC, QUOTED } from '../tools/isswf-command-core.mjs'
import { compactionInstructions, isCoordinatorSkill, noteFileName, NOTE_DIR, rememberDispatch, serializeNote } from '../tools/isswf-compaction-core.mjs'
import { callsOf, guardDispatch, isRoleAgent, workerCalls } from '../tools/isswf-dispatch-guard-core.mjs'
import { closeWorker, closeWorkerRun, markWorkerRun, openWorkers } from '../tools/isswf-parallel-workers-core.mjs'
import { checkPlanCommit } from '../tools/isswf-plan-commit-guard-core.mjs'
import { checkVerificationCommit } from '../tools/isswf-verification-guard-core.mjs'
import { checkRecordsPush } from '../tools/isswf-records-push-guard-core.mjs'
import { checkIntegrationGate } from '../tools/isswf-integration-gate-core.mjs'
import { findUndispatched, freshUndispatched, undispatchedWarning } from '../tools/isswf-undispatched-core.mjs'
import { guardRecord } from '../tools/isswf-record-guard-core.mjs'
import { initiativeIdsIn, initiativesDir, joiner, readSnapshot } from '../tools/isswf-snapshot-core.mjs'
import { compareBrief, countToolUses, fallbackRole, resolveRunUsage, summarizeRuns } from '../tools/isswf-run-usage-core.mjs'

const PANE = 'isswf-initiatives'
const TOUCHED = { plugin: 'isswf', key: 'touched' } as const
const PINNED = { plugin: 'isswf', key: 'pinned' } as const
const EXPANDED = { plugin: 'isswf', key: 'expanded' } as const
const IS_ACTIVATED = { plugin: 'isswf', key: 'isActivated' } as const
const TAB = { plugin: 'isswf', key: 'tab' } as const
const RESUME = { plugin: 'isswf', key: 'resumeOnQuota' } as const
const TREE = { plugin: 'isswf', key: 'tree' } as const
const BRANCHES = { plugin: 'isswf', key: 'branches' } as const
// The last accepted dispatches of a session that activated the coordinator; the post-compaction reminder lists them.
const ASSIGNMENTS = { plugin: 'isswf', key: 'assignments' } as const
const ASSIGNED = { plugin: 'isswf', key: 'assigned' } as const
// The job and brief revisions already warned about in this session (isswf-undispatched-core).
const WARNED = { plugin: 'isswf', key: 'warned' } as const
// The agent name the host gave each role run, by run id; a record that names no role falls back to it.
const AGENT_NAMES = { plugin: 'isswf', key: 'agent-names' } as const
// A file is shown up to this many characters; one drawing holds 100000 in all.
const FILE_CHARS = 60_000
const READ_LIMIT = 4 * 1024 * 1024
const RESUME_THRESHOLD = 90
const RESUME_DELAY_MS = 5 * 60_000
// Delegated roles with a shared profile under `.agents/roles/`.
const PROFILES = new Set(['worker', 'reviewer', 'researcher', 'planner', 'diagnostician'])
// A command that names an initiative, such as isswf-status --initiative I0046, also touches it.
const INITIATIVE_FLAG = /--initiative(?:=|\s+)["']?(I\d+)\b/g
const RECENT_COMPLETED = 2
const LABELS = {
  es: {
    notActive: 'El coordinador isSWF no está activo en esta sesión.',
    unknown: 'desconocido',
    references: 'referencias',
    hostGuides: 'guías de host',
    noReads: 'sin lecturas',
    unresolved: 'sin resolver',
    verdicts: { passed: 'aprobado', 'changes-requested': 'cambios pedidos', failed: 'fallido', partial: 'parcial', running: 'en curso' } as Record<string, string>,
    blocked: 'bloqueados',
    open: 'sin cerrar',
    usage: 'consumo',
    briefUnread: 'el brief nombra y la ejecución no leyó',
    briefRead: 'el brief nombra: todo leído',
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
    thousands: '.',
    line: 'línea',
    completed: 'completados',
    inactive: 'No activas',
    tabs: { initiatives: 'Iniciativas', agents: 'Agentes', files: 'Archivos' } as Record<string, string>,
    on: 'sí',
    off: 'no',
    noReset: 'sin hora de renovación',
    files: 'archivos',
    truncated: 'archivo recortado',
    noFiles: 'sin archivos',
    chooseInitiative: 'elige una iniciativa:',
    unreadable: 'no se puede leer',
    tooLarge: 'archivo de más de 4 MiB: no se muestra',
    noIndex: 'sin índice: codegraph init',
    coordinator: 'coordinador (esta sesión)',
    run: 'ejecución',
    runs: 'ejecuciones',
    profile: 'perfil',
    writer: 'writer sin roles/worker.md',
    writerOk: 'writer con roles/worker.md',
  },
  en: {
    notActive: 'The isSWF coordinator is not active in this session.',
    unknown: 'unknown',
    references: 'references',
    hostGuides: 'host guides',
    noReads: 'no reads',
    unresolved: 'unresolved',
    verdicts: { passed: 'passed', 'changes-requested': 'changes requested', failed: 'failed', partial: 'partial', running: 'running' } as Record<string, string>,
    blocked: 'blocked',
    open: 'open',
    usage: 'usage',
    briefUnread: 'brief names, run did not read',
    briefRead: 'brief names: all read',
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
    thousands: ',',
    line: 'line',
    completed: 'completed',
    inactive: 'Inactive',
    tabs: { initiatives: 'Initiatives', agents: 'Agents', files: 'Files' } as Record<string, string>,
    on: 'yes',
    off: 'no',
    noReset: 'no reset time',
    files: 'files',
    truncated: 'file truncated',
    noFiles: 'no files',
    chooseInitiative: 'choose an initiative:',
    unreadable: 'cannot be read',
    tooLarge: 'file over 4 MiB: not shown',
    noIndex: 'no index: codegraph init',
    coordinator: 'coordinator (this session)',
    run: 'run',
    runs: 'runs',
    profile: 'profile',
    writer: 'writer without roles/worker.md',
    writerOk: 'writer with roles/worker.md',
  },
}
type Labels = typeof LABELS.en

// Claude Code's `language` setting is free text, so any Spanish spelling selects Spanish; English is the default.
async function labelsFor($: EngineInterface): Promise<Labels> {
  // If the read fails or returns nothing usable (the built-in guard skips hooks on `settings.read`, not this read), English is the fallback.
  let language: unknown
  try {
    language = await $.settings.read({ key: 'language' })
  } catch {}
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
let ownCounts: { usedSkills: any; usedReferences: any } | undefined
let countingOwn = false
// Brief texts by path, read once after a draw; the job view compares each with its attempt's runs.
const briefs = new Map<string, string>()
const briefsLoading = new Set<string>()
// One resume per usage window: the timer lives only in this session, and `resumeFor` is the window's reset time.
let resumeTimer: Timer | undefined
let resumeFor: string | undefined
let resumeAtMs: number | undefined
// True while the threshold is met but the window gives no reset time, so nothing can be scheduled.
let resumeNoReset = false
// The window's reset plus the delay, known even before the threshold, so the switch can say when a resume would come.
let resumeWouldAtMs: number | undefined

const clockTime = (ms: number) => new Date(ms).toTimeString().slice(0, 5)

function cancelResume() {
  resumeTimer?.cancel()
  resumeTimer = resumeFor = resumeAtMs = undefined
}

// Runs after the draw. It keeps the would-be resume time current and, when the switch is on, at 90% or more
// of the five-hour window with a job in progress, schedules one resume prompt for the window's reset plus
// five minutes. The prompt asks the coordinator to reconcile, not to act.
function checkResume($: EngineInterface, cards: any[], isOn: boolean) {
  void (async () => {
    const window = (await $.session.usage()).rateLimits.find((w: any) => w.kind === 'five_hour')
    const parsed = window?.resetsAt ? Date.parse(window.resetsAt) + RESUME_DELAY_MS : NaN
    const at = Number.isFinite(parsed) ? parsed : undefined
    const work = cards.flatMap((i: any) => i.jobs.filter((j: any) => j.status === 'in-progress').map((j: any) => `${i.id}/${j.id}`))
    const due = isOn && window !== undefined && window.percentUsed >= RESUME_THRESHOLD && work.length > 0
    const noReset = due && at === undefined
    if (at !== resumeWouldAtMs || noReset !== resumeNoReset) {
      resumeWouldAtMs = at
      resumeNoReset = noReset
      scheduleRefresh($)
    }
    if (!due || at === undefined || resumeFor === window.resetsAt) return
    cancelResume()
    resumeFor = window.resetsAt
    resumeAtMs = at
    resumeTimer = $.clock.after(Math.max(0, at - (await $.clock.now())), () => {
      // `resumeFor` stays, so the same window is not scheduled again; the switch shows the next window's time.
      resumeTimer = resumeAtMs = undefined
      void $.prompt.submit({
        text: `isSWF: the five-hour usage window has reset. Work was in progress on ${work.join(', ')}. Load the isswf-coordinator skill, reconcile state first (isswf-status, open PRs, running reviews), then continue only the work already authorised; do not start new jobs without the operator's go.`,
      })
    })
    scheduleRefresh($)
  })().catch(() => {})
}

function loadBriefs($: EngineInterface, paths: string[]) {
  const pending = paths.filter(path => !briefs.has(path) && !briefsLoading.has(path))
  for (const path of pending) briefsLoading.add(path)
  void (async () => {
    for (const path of pending) briefs.set(path, await $.fs.read(path).catch(() => ''))
    for (const path of pending) briefsLoading.delete(path)
    if (pending.length) scheduleRefresh($)
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

// The plugin's SessionStart settings hook (tools/isswf-compaction-claude-hook.mjs) prints the post-compaction reminder from this
// note. A settings hook runs where the built-in guard skips the mod's own `classic.SessionStart`, but it cannot read `$.state`,
// so the mod keeps the note in the Claude config directory, one file per session ID, the ID the hook receives as `session_id`
// (the transcript's file name, as `$.session.id()` documents; not observed live). Its presence means the coordinator was activated.
async function writeNote($: EngineInterface) {
  const name = noteFileName(await $.session.id())
  const { claudeDir } = await findHomes($)
  if (!name || !claudeDir) return
  const { value: assignments } = await $.state.get(ASSIGNMENTS)
  await $.fs.write(joiner(claudeDir)(claudeDir, ...NOTE_DIR, name), serializeNote(assignments))
}

async function activateCoordinator($: EngineInterface) {
  try {
    await $.state.set(IS_ACTIVATED, true)
    await writeNote($)
  } catch {}
}

const openPane = async ($: EngineInterface) => {
  ensureFallback($)
  await $.ui.open(await paneSpec($))
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
  const raw = e.tool === 'Bash' ? e.command : ['Read', 'Edit', 'Write'].includes(e.tool) ? e.file_path : undefined
  if (typeof raw !== 'string') return []
  const text = e.tool === 'Bash' ? raw.replace(HEREDOC, '$3\n').replace(QUOTED, q => (/\s/.test(q) ? '""' : q)) : raw
  const ids = initiativeIdsIn(text.replace(/\\/g, '/'))
  if (e.tool === 'Bash') ids.push(...[...text.matchAll(INITIATIVE_FLAG)].map(m => m[1]))
  return ids
}

function countLabel(jobs: any[], t: Labels) {
  const blocked = jobs.filter(j => j.status === 'blocked').length
  const open = jobs.filter(j => j.status !== 'completed' && j.status !== 'blocked').length
  return [blocked && `${blocked} ${t.blocked}`, open && `${open} ${t.open}`].filter(Boolean).join(' · ')
}

// 4511679 -> 4.511.679 (es) or 4,511,679 (en).
const grouped = (n: number, t: Labels) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, t.thousands)
const sum = (values: any[]) => (values.some(v => typeof v !== 'number') ? undefined : values.reduce((a, b) => a + b, 0))

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
      `tokens: ${tokens === undefined ? t.unknown : grouped(tokens, t)}${partial ? ` (${t.partial})` : ''} · ${t.cost}: ${cost === undefined ? t.unknown : `$${cost.toFixed(2)}${partial ? ` (${t.partial})` : ''}`}`,
      `${t.duration}: ${duration === undefined ? t.unknown : `${Math.round(duration / 1000)} s`}`,
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
  return pairs
}

// One item per line with its count in a dim column, so long lists stay scannable.
function tallyBlock(ui: any, title: string, map: any, t: Labels) {
  const { Box, Text } = ui
  const pairs = tally(map, t)
  if (typeof pairs === 'string') return <Text><Text dimColor>{title}: </Text>{pairs}</Text>
  if (pairs.length === 0) return null
  const width = Math.max(...pairs.map(([name]) => name.length))
  return (
    <Box flexDirection="column">
      <Text dimColor>{title}</Text>
      {pairs.map(([name, n]) => <Text key={name}>  {name.padEnd(width)}  <Text dimColor>×{n}</Text></Text>)}
    </Box>
  )
}

// `plan unreadable: J003 · Brief, line 54 (unsafe-brief-reference)`; only the parts the parser knew.
function unparsedLabel(error: any, t: Labels) {
  if (!error?.code) return t.unparsed
  const where = [error.job, error.field].filter(Boolean).join(' · ')
  const at = [where, error.line && `${t.line} ${error.line}`].filter(Boolean).join(', ')
  return `${t.unparsed}: ${at ? `${at} ` : ''}(${error.code})`
}

// Review rounds are numbered within a brief revision; the revision is shown only when the job has several.
function roundLabel(job: any, round: any) {
  const briefs = new Set(job.rounds.map((r: any) => r.round))
  const review = `R${round.reviewRound}`
  if (round.round === 'unknown') return `r?·${review}`
  return briefs.size > 1 ? `r${round.round}·${review}` : review
}

// Only what the record or its transcript says is listed; a record with nothing beyond its name has no detail.
function pillView(initiativeId: string, jobId: string, entry: any, t: Labels, brief?: string) {
  const resolved = entry.runs.length ? usageLines(entry, t) : { model: undefined, lines: [] as string[] }
  const model = resolved.model
    ? `${t.model}: ${resolved.model} (transcript)`
    : entry.model !== 'unknown' && entry.model ? `${t.model}: ${entry.model}${entry.modelSource === 'unknown' ? '' : ` (${entry.modelSource})`}` : undefined
  const effort = entry.effort !== 'unknown' && entry.effort ? `${t.effort}: ${entry.effort}` : undefined
  const compared = brief && entry.kind === 'attempt' ? compareBrief(brief, entry.runs.map((run: any) => usage.get(runKey(run)))) : undefined
  const briefLine = compared?.named.length
    ? compared.unread.length ? `${t.briefUnread}: ${compared.unread.join(', ')}${compared.partial ? ` (${t.partial})` : ''}` : t.briefRead
    : undefined
  // The record's own word, such as blocked or cancelled, is more precise than the colour's group.
  const verdict = entry.outcome !== 'unknown' && entry.verdict !== 'running' ? entry.outcome : t.verdicts[entry.verdict]
  const facts = [
    [model, effort].filter(Boolean).join(' · '),
    verdict && `${t.verdict}: ${verdict}`,
    ...resolved.lines,
    briefLine,
  ].filter(Boolean) as string[]
  return {
    key: `${initiativeId}-${jobId}-${entry.id}`,
    label: entry.role === 'unknown' ? entry.id : entry.role,
    color: PILL_COLORS[entry.verdict],
    isRunning: entry.verdict === 'running',
    hasDetail: facts.length > 0,
    details: [`${entry.id} · ${entry.kind}`, ...facts],
  }
}

async function openTree($: EngineInterface, id: string) {
  await $.state.set(TREE, { id, open: [] })
  await $.state.set(TAB, 'files')
  $.ui.invalidate('ui.render')
}

// Only names a listing returned are joined, so a path cannot leave the initiative's folder; links are `other` and skipped.
const SAFE_NAME = /^(?!\.\.?$)[^\\/]+$/
const isInside = (rel: string) => rel.split('/').every(part => SAFE_NAME.test(part))

async function treeRows($: EngineInterface, dir: string, rel: string, open: string[], depth: number): Promise<{ rel: string; name: string; isDir: boolean; size: number; depth: number }[]> {
  const join = joiner(dir)
  let entries
  try {
    entries = await $.fs.list(rel ? join(dir, ...rel.split('/')) : dir)
  } catch {
    return []
  }
  const kept = entries.filter(e => (e.kind === 'file' || e.kind === 'dir') && SAFE_NAME.test(e.name))
    .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'file' ? -1 : 1))
  const rows = []
  for (const e of kept) {
    const path = rel ? `${rel}/${e.name}` : e.name
    rows.push({ rel: path, name: e.name, isDir: e.kind === 'dir', size: e.size, depth })
    if (e.kind === 'dir' && open.includes(path)) rows.push(...await treeRows($, dir, path, open, depth + 1))
  }
  return rows
}

// Engram and CodeGraph availability, read only: tool names in the session and the index folder; nothing is connected, called or run.
const hasServer = (names: string[], server: string) => names.some(n => new RegExp(`^mcp__(?:plugin_.+_)?${server}__`).test(n))
async function connections($: EngineInterface) {
  let names: string[] = []
  try {
    names = (await $.tool.list()).map(tool => tool.name)
  } catch {}
  const cwd = await $.session.cwd()
  const isIndexed = await $.fs.exists(joiner(cwd)(cwd, '.codegraph')).catch(() => false)
  const hasCodegraph = hasServer(names, 'codegraph')
  return {
    engram: hasServer(names, 'engram') ? 'success' : 'error',
    codegraph: !isIndexed ? 'error' : hasCodegraph ? 'success' : 'warning',
    isIndexed,
  } as const
}

// The Files tab: the selected initiative's folder as a tree, and the open file below it.
async function filesView($: EngineInterface, ui: any, t: Labels) {
  const { Box, Button, Markdown, Text } = ui
  const { value: tree } = await $.state.get(TREE)
  if (!tree || !/^I\d+$/.test(tree.id)) return null
  let stateDir
  try {
    stateDir = (await initiativesDir(await $.session.cwd(), { exists: (p: string) => $.fs.exists(p) })).stateDir
  } catch (error) {
    return <Text color="error">{String((error as Error).message)}</Text>
  }
  const dir = joiner(stateDir)(stateDir, tree.id)
  const rows = await treeRows($, dir, '', tree.open, 0)
  const set = (next: typeof tree) => $.state.set(TREE, next).then(() => $.ui.invalidate('ui.render'))
  const press = (row: (typeof rows)[number]) => () => row.isDir
    ? set(tree.open.includes(row.rel)
      // Folding a folder also closes a file inside it, which would otherwise stay open with no row to close it.
      ? { ...tree, open: tree.open.filter(p => p !== row.rel && !p.startsWith(`${row.rel}/`)), file: tree.file?.startsWith(`${row.rel}/`) ? undefined : tree.file }
      : { ...tree, open: [...tree.open, row.rel] })
    : set({ ...tree, file: tree.file === row.rel ? undefined : row.rel })
  let shown: string | undefined
  let isTruncated = false
  let isTooLarge = false
  const listed = tree.file && isInside(tree.file) ? rows.find(r => !r.isDir && r.rel === tree.file) : undefined
  // `$.fs.read` refuses files over 4 MiB.
  if (listed && listed.size > READ_LIMIT) isTooLarge = true
  else if (listed) {
    try {
      const text = (await $.fs.read(joiner(dir)(dir, ...listed.rel.split('/')))).replace(/\r\n?/g, '\n')
      isTruncated = text.length > FILE_CHARS
      shown = isTruncated ? text.slice(0, FILE_CHARS) : text
    } catch {
      shown = undefined
    }
  }
  return (
    <Box flexDirection="column">
      <Text bold color="claude">{tree.id} · {t.files}</Text>
      {rows.length === 0 && <Text dimColor>{t.noFiles}</Text>}
      {rows.map(row => (
        <Button key={`file-${row.rel}`} plain onPress={press(row)}>
          <Text color={row.rel === tree.file ? 'claude' : undefined} bold={row.rel === tree.file}>
            {'  '.repeat(row.depth)}{row.isDir ? `${tree.open.includes(row.rel) ? '▾' : '▸'} ${row.name}/` : `  ${row.name}`}
          </Text>
        </Button>
      ))}
      {tree.file && (
        <Box borderStyle="round" borderColor="claude" flexDirection="column">
          <Text bold>{tree.file}</Text>
          {isTooLarge ? <Text dimColor>{t.tooLarge}</Text> : shown === undefined ? <Text color="error">{t.unreadable}</Text> : <Markdown key="tree-file" text={shown} />}
          {isTruncated && <Text dimColor>… {t.truncated}</Text>}
        </Box>
      )}
    </Box>
  )
}

// Git without the opportunistic index refresh, so a read never takes `index.lock` while the operator or an agent commits. `$.process.run` takes no
// environment here, so the global option stands in for GIT_OPTIONAL_LOCKS=0.
const gitRun = ($: EngineInterface, argv: string[], cwd: string) => $.process.run(['git', '--no-optional-locks', ...argv], { cwd })

const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])

// What the branch guard needs from the host, for the loop that made the call: the main loop, or a child by its agent id.
function branchHost($: EngineInterface, e: { agentId?: string }) {
  return {
    loop: e.agentId ?? 'main',
    // The engine refuses `$.fs` and `$.process` passed as values, so each call is spelled out.
    observe: (dir: string) => observeBranch(dir, {
      git: async (argv: string[], cwd: string) => {
        const { exitCode, stdout } = await gitRun($, argv, cwd)
        return { exitCode, stdout }
      },
      read: (file: string) => $.fs.read(file),
    }),
    store: {
      read: async () => (await $.state.get(BRANCHES)).value ?? {},
      set: (key: string, state: { branch: string } | { detached: string }) => update($, BRANCHES, (all: Record<string, unknown> | undefined) => ({ ...all, [key]: state })),
    },
  }
}

// The parallel-worker ledger's io. The engine has no way to delete a file, so `remove` runs one `rmSync` in Node, with the path as an argument.
function ledgerIo($: EngineInterface) {
  return {
    gitOut: async (argv: string[], cwd: string) => {
      const { exitCode, stdout } = await gitRun($, argv, cwd)
      return { exitCode, stdout }
    },
    list: (dir: string) => $.fs.list(dir),
    read: (file: string) => $.fs.read(file),
    write: (file: string, text: string) => $.fs.write(file, text),
    remove: async (file: string) => {
      const { exitCode } = await $.process.run(['node', '-e', "require('node:fs').rmSync(process.argv[1], { force: true })", file], { cwd: await $.session.cwd() })
      // A failed removal (for example no `node` on the hook's PATH) leaves the entry for the operator's `clear`.
      if (exitCode !== 0) throw new Error(`could not remove ${file}`)
    },
  }
}

// A worker's ledger entries once its `Agent` call has returned: a background launch keeps them under its agent id until that child's
// `turn.complete`; a foreground result, a refusal or an error closes them. A fault never changes the tool's result.
async function settleWorkers($: EngineInterface, tokens: string[], ran: { deny?: unknown; isError?: boolean; result?: unknown } | undefined) {
  const result = ran?.result as { status?: unknown; agentId?: unknown } | undefined
  const run = ran?.deny === undefined && !ran?.isError && result?.status === 'async_launched' && typeof result.agentId === 'string' ? result.agentId : undefined
  for (const token of tokens) {
    try {
      const cwd = await $.session.cwd()
      if (run !== undefined) await markWorkerRun({ token, run, cwd, io: ledgerIo($) })
      else await closeWorker({ token, cwd, io: ledgerIo($) })
    } catch {}
  }
}

export const register: Register = (on, options) => {
  // The engine accepts one unmatched `tool.call` hook, so this one serves the shell and dispatch guards and the record check,
  // which run whatever the pane option is, and the pane's observation, which runs only with the option on.
  on('tool.call', async ($, e, next) => {
    // The directories the shell call must look at again once it has run.
    let reobserve: string[] = []
    // The integration gate's observe-mode note, shown as context once the command has run.
    let gateNote: string | undefined
    // The parallel-worker limit's observe-mode note, and the ledger entries opened for this call's workers.
    let workerNote: string | undefined
    let workerTokens: string[] = []
    const branches = branchHost($, e)
    // A delegated child's shell calls reach this hook too. Both cores fail open, so a fault in them never blocks a call.
    if (e.tool === 'Bash' || e.tool === 'PowerShell') {
      const command = (e as { command?: unknown }).command
      const verdict = guardCommand(command)
      if ('deny' in verdict) return { deny: verdict.deny }
      try {
        const assignment = e.agentId === undefined ? undefined : (await $.state.get(ASSIGNED)).value?.[e.agentId]
        const branch = await checkBranch({ command, cwd: await $.session.cwd(), assignment, ...branches })
        if (branch.deny !== undefined) return { deny: branch.deny }
        reobserve = branch.reobserve
        const plans = await checkPlanCommit({
          command,
          cwd: await $.session.cwd(),
          git: async (argv: string[], cwd: string) => {
            const { exitCode, stdout } = await gitRun($, argv, cwd)
            return { exitCode, stdout }
          },
          read: (file: string) => $.fs.read(file),
        })
        if (plans.deny !== undefined) return { deny: plans.deny }
        const verification = await checkVerificationCommit({
          command,
          cwd: await $.session.cwd(),
          git: async (argv: string[], cwd: string) => {
            const { exitCode, stdout } = await gitRun($, argv, cwd)
            return { exitCode, stdout }
          },
        })
        if (verification.deny !== undefined) return { deny: verification.deny }
        const pushes = await checkRecordsPush({
          command,
          cwd: await $.session.cwd(),
          git: async (argv: string[], cwd: string) => {
            const { exitCode, stdout } = await gitRun($, argv, cwd)
            return { exitCode, stdout }
          },
        })
        if (pushes.deny !== undefined) return { deny: pushes.deny }
        const gate = await checkIntegrationGate({
          command,
          cwd: await $.session.cwd(),
          git: async (argv: string[], cwd: string) => {
            const { exitCode, stdout } = await gitRun($, argv, cwd)
            return { exitCode, stdout }
          },
          read: (file: string) => $.fs.read(file),
        })
        if (gate.deny !== undefined) return { deny: gate.deny }
        gateNote = gate.note
      } catch {}
    }
    // The guard refuses before the child starts, so it runs ahead of `next(e)`; `$.fs` and `$.process` are spelled out per call.
    if (e.tool === 'Agent') {
      const verdict = await guardDispatch({
        host: 'claude',
        input: e,
        io: {
          project: () => $.session.cwd(),
          read: (file: string) => $.fs.read(file),
          readBytes: async (file: string) => Uint8Array.from(atob((await $.fs.read(file, { as: 'bytes' })).base64), char => char.charCodeAt(0)),
          list: (dir: string) => $.fs.list(dir),
          stat: (file: string) => $.fs.stat(file),
          git: async (argv: string[], cwd: string) => (await gitRun($, argv, cwd)).exitCode,
          gitOut: async (argv: string[], cwd: string) => {
            const { exitCode, stdout } = await gitRun($, argv, cwd)
            return { exitCode, stdout }
          },
        },
      })
      if ('deny' in verdict) return { deny: verdict.deny }
      workerNote = verdict.note
      try {
        const workers = workerCalls('claude', e)
        if (workers.length) workerTokens = await openWorkers({ workers, host: 'claude', cwd: await $.session.cwd(), io: ledgerIo($) })
      } catch {}
    }
    let ran
    try {
      ran = await next(e)
    } catch (error) {
      await settleWorkers($, workerTokens, undefined)
      throw error
    }
    await settleWorkers($, workerTokens, ran)
    // The coordinator's accepted dispatches outlive a compaction in `$.state`; a failure here never changes the tool's result.
    if (e.tool === 'Agent' && ran.deny === undefined && !ran.isError) {
      try {
        if ((await $.state.get(IS_ACTIVATED)).value) {
          const runId = (ran.result as { agentId?: unknown } | undefined)?.agentId
          await update($, ASSIGNMENTS, (list: unknown[] | undefined) => rememberDispatch(list, { host: 'claude', input: e, runId }))
          await writeNote($)
        }
      } catch {}
    }
    // A role agent's checkout and branch are known under the run id the host gave, which a foreground call gives only once the child has finished.
    if (e.tool === 'Agent' && ran.deny === undefined && !ran.isError) {
      try {
        const runId = (ran.result as { agentId?: unknown } | undefined)?.agentId
        const assignment = callsOf('claude', e).filter(call => isRoleAgent(call.agent)).map(call => assignmentOf(call.prompt)).find(Boolean)
        if (typeof runId === 'string' && assignment) await update($, ASSIGNED, (all: Record<string, unknown> | undefined) => ({ ...all, [runId]: assignment }))
        const agent = callsOf('claude', e).find(call => isRoleAgent(call.agent))?.agent
        if (typeof runId === 'string' && agent) await update($, AGENT_NAMES, (all: Record<string, unknown> | undefined) => ({ ...all, [runId]: agent }))
      } catch {}
    }
    // A session's own `git switch` or `git checkout` selects the branch the checkout is on now, whatever the call's outcome.
    if (reobserve.length) await refreshBranches({ dirs: reobserve, ...branches })
    // A failure in either part must never change or repeat the tool's result.
    if (options?.initiativesPane === true) {
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
    }
    // Where the built-in guard is seated `skill.prompt` never runs for this mod, but the Skill tool call does.
    if (e.tool === 'Skill' && isCoordinatorSkill((e as { skill?: unknown }).skill) && ran.deny === undefined && !ran.isError) {
      try {
        await activateCoordinator($)
        if (options?.initiativesPane === true) await openPane($)
      } catch {}
    }
    try {
      // A denied or failed write changed no record, and `deny` declares no `context`.
      if (ran.deny !== undefined || ran.isError) return ran
      const path = (e as { file_path?: unknown }).file_path
      // The record check and the integration gate only report, as model-visible context; the tool result stays as it was.
      // The engine refuses `$.fs` passed as a value, so each call is spelled out.
      const text = WRITE_TOOLS.has(e.tool) && typeof path === 'string'
        ? await guardRecord({ path, read: (file: string) => $.fs.read(file), list: (dir: string) => $.fs.list(dir) })
        : undefined
      const notes = [gateNote, workerNote, text].filter((note): note is string => Boolean(note))
      return notes.length ? { ...ran, context: [...(ran.context ?? []), ...notes] } : ran
    } catch {
      return ran
    }
  })

  // The coordinator's activation is recorded whatever the pane option is: compaction reads it. With the option off nothing else
  // happens here, so nothing schedules, registers or draws. Both entry points are idempotent: where the guard is absent both
  // fire, and the second only sets the same state, rewrites the same note and opens the same pane.
  on('skill.prompt', async ($, e, next) => {
    if (isCoordinatorSkill(e.skill)) {
      await activateCoordinator($)
      if (options?.initiativesPane === true) void openPane($).catch(() => {})
    }

    return next(e)
  })

  // A session that activated the coordinator asks its summary to keep the assignment. Only the main conversation is steered,
  // and any fault leaves the compaction as the host would have run it.
  on('session.compact', async ($, e, next) => {
    let steered = e
    try {
      if (e.agentId === undefined && (await $.state.get(IS_ACTIVATED)).value) steered = { ...e, instructions: compactionInstructions(e.instructions) }
    } catch {}
    return next(steered)
  })

  // A typed `/isswf:isswf-coordinator` raises `command.run` and no Skill tool call, and the guard skips `skill.prompt`. It runs the
  // command first, then marks the session exactly as the Skill tool call does; a fault never changes the command's output.
  on('command.run', { command: /^(isswf:)?isswf-coordinator$/ }, async ($, e, next) => {
    const result = await next(e)
    if (isCoordinatorSkill(e.command)) {
      try {
        await activateCoordinator($)
        if (options?.initiativesPane === true) await openPane($)
      } catch {}
    }

    return result
  })

  // After a turn of the main conversation that was not aborted or failed, a coordinator session is told once about an in-progress job whose
  // committed brief has no attempt record and no accepted dispatch. The warning is a status line only and a fault never changes the turn.
  on('turn.complete', async ($, e, next) => {
    // A background worker's turn is its run's end: its ledger entry closes whatever the turn's outcome.
    try {
      const agentId = (e as { agentId?: unknown }).agentId
      if (typeof agentId === 'string') await closeWorkerRun({ run: agentId, cwd: await $.session.cwd(), io: ledgerIo($) })
    } catch {}
    try {
      const turn = e as { agentId?: unknown; aborted?: unknown; error?: unknown; isError?: unknown }
      if (turn.agentId === undefined && turn.aborted !== true && turn.error == null && turn.isError !== true && (await $.state.get(IS_ACTIVATED)).value) {
        const cwd = await $.session.cwd()
        const found = await findUndispatched({
          assignments: (await $.state.get(ASSIGNMENTS)).value ?? [],
          warned: new Set<string>((await $.state.get(WARNED)).value ?? []),
          io: {
            project: () => cwd,
            list: (dir: string) => $.fs.list(dir),
            read: (file: string) => $.fs.read(file),
            git: async (argv: string[], at: string) => (await gitRun($, argv, at)).exitCode,
          },
        })
        const warned = new Set<string>((await $.state.get(WARNED)).value ?? [])
        const text = undispatchedWarning(freshUndispatched(found, warned))
        if (text) {
          await $.state.set(WARNED, [...warned])
          $.ui.status(text)
        } else if (!found.length && warned.size) $.ui.status(undefined)
      }
    } catch {}

    return next(e)
  })

  // Opt-in: with the option off no pane hook is added, so nothing reads, schedules, registers or draws.
  if (options?.initiativesPane !== true) return

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'isswf-initiatives',
      description: 'Open or refresh the isSWF initiatives pane; pin or unpin <ID>',
    })

    return next(e)
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
    const { Box, Button, Markdown, Text } = $.ui.resolve(e)
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
    const briefPath = (initiative: any, job: any, round: any) => joiner(snapshot.stateDir)(snapshot.stateDir, initiative.id, 'jobs', job.id, `brief-r${round.round}.md`)
    loadBriefs($, cards.flatMap((i: any) => i.jobs.filter((j: any) => j.status !== 'completed' || isExpanded(i, j)).flatMap((j: any) => j.rounds.filter((r: any) => r.round !== 'unknown').map((r: any) => briefPath(i, j, r)))))

    // One completed job is unfolded at a time: unfolding one folds the other and closes any open record detail.
    const toggle = (key: string) => () => update($, EXPANDED, (list: string[] | undefined) => (list ?? []).includes(key) ? (list ?? []).filter(k => k !== key) : [key])
      .then(() => $.ui.invalidate('ui.render'))
    // A pressed pill opens its detail in normal flow below its round, so it pushes later lines down instead of covering them.
    // One record detail is open at a time: opening one closes the others; the unfolded job stays unfolded.
    const isPillKey = (key: string) => key.split('-').length === 3
    const togglePill = (key: string) => () => update($, EXPANDED, (list: string[] | undefined) => (list ?? []).includes(key)
      ? (list ?? []).filter(k => k !== key)
      : [...(list ?? []).filter(k => !isPillKey(k)), key].sort()).then(() => $.ui.invalidate('ui.render'))
    const pill = (p: ReturnType<typeof pillView>) => (
      <Box key={p.key} borderStyle={p.isRunning ? 'dashed' : 'round'} borderColor={p.color} borderDimColor={!p.color}>
        {p.hasDetail
          ? (
            <Button key={p.key} plain onPress={togglePill(p.key)}>
              <Text color={p.color} dimColor={!p.color}>{p.label}</Text>
            </Button>
          )
          : <Text color={p.color} dimColor={!p.color}>{p.label}</Text>}
      </Box>
    )
    const rounds = (initiative: any, job: any) => job.rounds.map((round: any) => {
      const pills = round.entries.map((entry: any) => pillView(initiative.id, job.id, entry, t, round.round === 'unknown' ? undefined : briefs.get(briefPath(initiative, job, round))))
      return (
        <Box flexDirection="column">
          <Box flexDirection="row" gap={1} alignItems="center">
            <Text dimColor>{roundLabel(job, round)}</Text>
            {pills.map(pill)}
          </Box>
          {pills.filter((p: ReturnType<typeof pillView>) => p.hasDetail && expanded.includes(p.key)).map((p: ReturnType<typeof pillView>) => (
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
    if (!resumeOn && (resumeTimer || resumeFor)) cancelResume()
    checkResume($, cards, resumeOn)
    const toggleResume = () => $.state.set(RESUME, !resumeOn).then(() => $.ui.invalidate('ui.render'))
    const resumeAt = resumeAtMs ?? resumeWouldAtMs
    const resumeDetail = resumeOn && resumeNoReset ? ` (${t.noReset})` : resumeAt !== undefined ? ` (${clockTime(resumeAt)})` : ''
    const resumeText = `⏰ AutoWakeUp: ${resumeOn ? t.on : t.off}${resumeDetail}`
    const tools = await connections($)
    const header = (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={2}>
          <Text bold color="merged">{title}</Text>
          <Button key="resume-toggle" plain onPress={toggleResume}>
            <Text color={resumeOn ? 'success' : undefined} dimColor={!resumeOn}>{resumeText}</Text>
          </Button>
        </Box>
        <Box flexDirection="row" gap={2}>
          <Text>🧠 engram <Text color={tools.engram}>●</Text></Text>
          <Text>🗺 codegraph <Text color={tools.codegraph}>●</Text>{!tools.isIndexed && <Text dimColor> {t.noIndex}</Text>}</Text>
        </Box>
        <Box flexDirection="row" gap={1}>
          {['initiatives', 'agents', 'files'].map(name => (
            <Button key={`tab-${name}`} plain onPress={() => $.state.set(TAB, name).then(() => $.ui.invalidate('ui.render'))}>
              <Text bold={tab === name} color={tab === name ? 'claude' : undefined} dimColor={tab !== name}>{tab === name ? `[${t.tabs[name]}]` : ` ${t.tabs[name]} `}</Text>
            </Button>
          ))}
        </Box>
        <Text color="merged">{'═'.repeat(Math.max(1, e.props.bodyColumns ?? 40))}</Text>
      </Box>
    )
    if (tab === 'files') {
      const tree = await filesView($, { Box, Button, Markdown, Text }, t)
      const choices = [...cards, ...unopenedCards]
      return (
        <Box flexDirection="column">
          {header}
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            <Text dimColor>{t.chooseInitiative}</Text>
            {choices.map((i: any) => (
              <Button key={`files-${i.id}`} plain onPress={() => openTree($, i.id)}>
                <Text>{i.id}</Text>
              </Button>
            ))}
          </Box>
          {tree}
        </Box>
      )
    }
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
      const own: any = ownCounts ?? {}
      // One accumulated row per agent role: every run of that role across the visible cards, each run counted once.
      const agentNames = (await $.state.get(AGENT_NAMES)).value as Record<string, string> | undefined
      const byRole = new Map<string, Map<string, any>>()
      for (const i of cards) for (const j of i.jobs) for (const r of j.rounds) for (const x of r.entries) for (const run of x.runs) {
        const role = fallbackRole(x.role, run, usage.get(runKey(run)), agentNames)
        if (!byRole.has(role)) byRole.set(role, new Map())
        byRole.get(role)!.set(runKey(run), run)
      }
      // A role's profile counts as read in each run that used `.agents/roles/<role>.md`.
      const profileMark = (role: string, found: any[]) => {
        if (!PROFILES.has(role)) return undefined
        // Runs whose transcript is unresolved or missing say nothing about the profile, so they are left out.
        const resolved = found.filter((u: any) => u?.found && typeof u.usedReferences === 'object')
        if (!resolved.length) return undefined
        const followed = resolved.filter((u: any) => u.usedReferences[`.agents/roles/${role}.md`]).length
        return { text: `${t.profile} ${followed}/${resolved.length}`, isOk: followed === resolved.length }
      }
      const agents = [...byRole].map(([role, runs]) => {
        const found = [...runs.keys()].map(k => usage.get(k))
        return { key: `role-${role}`, label: `${role === 'unknown' ? t.unknown : role} · ${runs.size} ${runs.size === 1 ? t.run : t.runs}`, mark: profileMark(role, found), runs: [...runs.values()], found }
      })
      // The coordinator writing an in-progress job should follow the worker profile; say whether this session did.
      const writes = cards.some((i: any) => i.jobs.some((j: any) => j.status === 'in-progress' && j.rounds.some((r: any) => r.entries.some((x: any) => x.role === 'coordinator'))))
      const ownRefs = own.usedReferences
      const ownMark = writes && ownRefs && typeof ownRefs === 'object'
        ? (ownRefs['.agents/roles/worker.md'] ? { text: t.writerOk, isOk: true } : { text: t.writer, isOk: false })
        : undefined
      // Every listed run is resolved here, including completed jobs the initiatives tab leaves folded.
      resolveUsage($, agents.flatMap((a: any) => a.runs), snapshot.project)
      // A run that resolved to nothing says so; one that did not resolve stays unknown, and only the role with no resolved run is wholly unknown.
      const row = (key: string, label: string, sum: ReturnType<typeof summarizeRuns>, mark?: { text: string; isOk: boolean }) => (
        <Box key={key} borderStyle="round" borderColor="subtle" flexDirection="column">
          <Text bold color="claude">{label}{mark && <Text bold={false} color={mark.isOk ? 'success' : 'warning'}> · {mark.text}</Text>}{sum.unresolved > 0 && sum.resolved > 0 && <Text bold={false} dimColor> · {sum.unresolved} {t.unresolved}</Text>}</Text>
          {sum.noReads ? <Text dimColor>{t.noReads}</Text> : (
            <>
              {tallyBlock({ Box, Text }, 'skills', sum.skills, t)}
              {tallyBlock({ Box, Text }, t.references, sum.references, t)}
              {tallyBlock({ Box, Text }, t.hostGuides, sum.hostGuides, t)}
            </>
          )}
        </Box>
      )
      const rows = [
        row('coordinator', t.coordinator, summarizeRuns([own.usedSkills ? { found: true, usedSkills: own.usedSkills, usedReferences: own.usedReferences, usedHostGuides: own.usedHostGuides } : undefined]), ownMark),
        ...agents.map((a: any) => row(a.key, a.label, summarizeRuns(a.found), a.mark)),
      ]
      return (
        <Box flexDirection="column">
          {header}
          {rows}
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
              <Button key={`tree-${initiative.id}`} plain onPress={() => openTree($, initiative.id)}>
                <Text bold color="claude">● {initiative.id} · {initiative.title}</Text>
              </Button>
              {initiative.status === 'unparsed' && <Text color="warning">{unparsedLabel(initiative.planError, t)}</Text>}
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
