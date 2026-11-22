// No Node imports and no `process` access, like the other guard cores: the Claude hooks module and the Pi extensions share it.

// Heredoc bodies and quoted text with spaces, such as commit messages or scripts, only mention paths;
// a quoted single path is still an operand.
// The rest of a heredoc's opening line, such as its output redirection, is kept.
export const HEREDOC = /<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?(?:\n\s*\2\s*(?:\n|$)|$)/g;
export const QUOTED = /(["'])(?:(?!\1)[\s\S])*\1/g;

// Stands for quoted text that is not a plain word; it keeps its place as an argument and never matches a command or a flag.
const OPAQUE = '\u0001';
const SAFE_QUOTED = /^(["'])[\w@./:=+,-]*\1$/u;
const ASSIGNMENT = /^[A-Za-z_]\w*=/u;
const LOOP_KEYWORDS = new Set(['while', 'until', 'for', 'foreach']);
// A `for` or `foreach` header lists values, not a command.
const VALUE_LOOPS = new Set(['for', 'foreach']);
const PASSTHROUGH_KEYWORDS = new Set(['if', 'then', 'else', 'elif', '!', 'time']);
const BRACE_LOOP_COMMANDS = new Set(['foreach-object', '%']);

// A quoted script path with spaces stays one word that ends in the tool name, so the CI-wait rule still sees it.
const CI_STATE_QUOTED = /^(["'])[^"']*[\\/]isswf-ci-state\.mjs\1$/u;
const maskQuoted = quoted => (CI_STATE_QUOTED.test(quoted) ? 'isswf-ci-state.mjs' : SAFE_QUOTED.test(quoted) ? quoted.slice(1, -1) : OPAQUE);

const wordsOnly = command => command
  .replace(/\\\r?\n/gu, ' ')
  .replace(HEREDOC, '$3\n')
  .replace(QUOTED, maskQuoted);

// Splits masked text into words and the operators that end a segment.
function lex(text) {
  const tokens = [];
  let word = '';
  let blocks = 0;
  let inline = 0;
  const flush = () => {
    if (word) tokens.push({ word });
    word = '';
  };
  const operator = op => {
    flush();
    tokens.push({ op });
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '#' && word === '') {
      while (i + 1 < text.length && text[i + 1] !== '\n') i++;
    } else if (/\s/u.test(c) && c !== '\n') flush();
    else if (c === '\n' || c === ';') operator(';');
    else if (c === '&' && next === '&') {
      operator('&&');
      i++;
    } else if (c === '&' && !word.endsWith('>') && !word.endsWith('<') && next !== '>') operator('&');
    else if (c === '|') {
      operator(next === '|' ? '||' : '|');
      if (next === '|' || next === '&') i++;
    } else if (c === '(') {
      if (word === '$' || word === '@') word = '';
      operator('(');
    } else if (c === ')') operator(')');
    else if (c === '{' && word === '') {
      operator('{');
      blocks++;
    } else if (c === '{') {
      word += c;
      inline++;
    } else if (c === '}' && inline > 0) {
      word += c;
      inline--;
    } else if (c === '}' && blocks > 0) {
      operator('}');
      blocks--;
    } else word += c;
  }
  flush();
  return tokens;
}

const basename = word => word.split(/[\\/]/u).pop().toLowerCase().replace(/\.(?:cmd|exe|bat|ps1)$/u, '');

// Drops the leading assignments and the wrapper prefixes (`sudo`, `env`, `command`, `exec`, `timeout <n>`, `nohup`, `nice`,
// `xargs`, `cmd /c`); `command -v` only looks a name up and `timeout /t` is a sleep, not a prefix.
function stripPrefixes(words) {
  let rest = words;
  const dropFlags = valueFlags => {
    while (rest[0]?.startsWith('-')) rest = rest.slice(valueFlags.includes(rest[0]) ? 2 : 1);
  };
  for (;;) {
    const name = basename(rest[0] ?? '');
    if (ASSIGNMENT.test(rest[0] ?? '')) rest = rest.slice(1);
    else if (name === 'timeout' && DURATION.test(timeoutOperands(rest)[0] ?? '')) rest = timeoutOperands(rest).slice(1);
    else if (name === 'nohup') rest = rest.slice(1);
    else if (name === 'nice' || name === 'xargs') {
      rest = rest.slice(1);
      dropFlags(name === 'nice' ? ['-n'] : ['-n', '-I', '-L', '-P', '-d', '-E', '-s', '-a']);
    } else if (name === 'cmd' && /^\/[ck]$/iu.test(rest[1] ?? '')) rest = rest.slice(2);
    else if (name === 'sudo') {
      rest = rest.slice(1);
      dropFlags(['-u', '-g', '-h', '-p', '-C', '-D', '-R', '-T', '-U']);
    } else if (name === 'env') {
      rest = rest.slice(1);
      dropFlags(['-u', '-C', '-S']);
    } else if (name === 'command') {
      rest = rest.slice(1);
      if (/^-[vV]$/u.test(rest[0] ?? '')) return [];
      dropFlags([]);
    } else if (name === 'exec') {
      rest = rest.slice(1);
      dropFlags(['-a']);
    } else return rest;
  }
}

// The words of a GNU `timeout` call after its flags, which are `-k <t>`, `-s <signal>` and flags without a value.
function timeoutOperands(words) {
  let i = 1;
  while (words[i]?.startsWith('-')) i += words[i] === '-k' || words[i] === '-s' ? 2 : 1;
  return words.slice(i);
}

const CD_COMMANDS = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl']);
// A directory the command spells out, or null when it is a variable, a substitution, `~`, quoted text with spaces or `-`.
const literalDir = word => (word === undefined || word === '-' || /[$`~\u0001]/u.test(word) ? null : word);

// The directory a `cd`, `pushd` or `Set-Location` call moves to, as typed; `-P`-style flags, `/d` and `-Path` are skipped.
function cdTarget(args) {
  let rest = args;
  while (rest.length) {
    if (rest[0] === '--') return literalDir(rest[1]);
    if (/^-(?:path|literalpath)$/iu.test(rest[0])) return literalDir(rest[1]);
    if (!/^(?:-.|\/d$)/iu.test(rest[0])) break;
    rest = rest.slice(1);
  }
  return literalDir(rest[0]);
}

const GIT_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--super-prefix', '--config-env', '--attr-source']);

// The global options of a `git` call, which come before its subcommand, and the subcommand with its arguments.
function parseGit(args) {
  const git = { dirs: [], config: [], gitDir: undefined, workTree: undefined, subcommand: undefined, args: [] };
  for (let i = 0; i < args.length; i++) {
    const word = args[i];
    if (!word.startsWith('-')) return { ...git, subcommand: word, args: args.slice(i + 1) };
    const equals = word.startsWith('--') ? word.indexOf('=') : -1;
    const flag = equals < 0 ? word : word.slice(0, equals);
    if (!GIT_VALUE_OPTIONS.has(flag)) continue;
    const value = equals < 0 ? args[++i] : word.slice(equals + 1);
    if (flag === '-C') git.dirs.push(literalDir(value));
    else if (flag === '-c') git.config.push(value);
    else if (flag === '--git-dir') git.gitDir = literalDir(value);
    else if (flag === '--work-tree') git.workTree = literalDir(value);
  }
  return git;
}

/**
 * Splits a command into segments on `&&`, `||`, `;`, `|`, `&` and newlines, after setting aside heredocs, comments and quoted text.
 * Each segment has its `words`, its normalized `command` (a lower-case basename without `.cmd` or `.exe`) with its `args`, the
 * parenthesis and brace `depth`, and the ids of the loops it is inside (`loops`).
 * Every segment also has `cd`, the directories that earlier `cd` and `pushd` segments at the same depth moved to, as typed
 * (`null` when not literal), and a `git` segment has `git`: `dirs` (`-C`), `config` (`-c`), `gitDir`, `workTree`, `subcommand` and `args`.
 */
export function tokenize(command) {
  const segments = [];
  const loops = [];
  let nextId = 0;
  let depth = 0;
  let braces = 0;
  let current = [];
  // A loop opens before its body arrives: a header, then `do` (Bash) or `{` (PowerShell). One that is still waiting for its body
  // when something else follows is no loop (`% Name`, the trailing `while (...)` of `do { } while (...)`) and is dropped.
  let header;
  // A subshell starts in its parent's directory, and a `cd` inside it does not outlive it.
  const cds = [[]];
  const openLoop = () => {
    const loop = { id: nextId++, style: undefined, base: braces, paren: undefined, awaiting: false };
    loops.push(loop);
    return loop;
  };
  const dropAwaiting = () => {
    for (let i = loops.length - 1; i >= 0; i--) if (loops[i].awaiting) loops.splice(i, 1);
  };

  const endSegment = () => {
    let rest = current;
    current = [];
    if (!rest.length) return;
    let valueHeader = false;
    for (;;) {
      const leading = (rest[0] ?? '').toLowerCase();
      if (leading === 'done') {
        const open = loops.findLastIndex(loop => loop.style === 'do');
        if (open >= 0) loops.length = open;
      } else if (LOOP_KEYWORDS.has(leading)) {
        header = openLoop();
        valueHeader = valueHeader || VALUE_LOOPS.has(leading);
      } else if (leading === 'do') {
        const pending = loops.at(-1)?.style === undefined ? loops.at(-1) : undefined;
        if (pending) {
          pending.style = 'do';
          pending.awaiting = false;
        } else openLoop();
      } else if (!PASSTHROUGH_KEYWORDS.has(leading)) break;
      rest = rest.slice(1);
    }
    rest = dropRedirections(rest);
    const words = valueHeader ? [] : stripPrefixes(rest);
    const name = words.length && words[0] !== OPAQUE ? basename(words[0]) : undefined;
    if (BRACE_LOOP_COMMANDS.has(name)) openLoop().awaiting = true;
    const segment = { words: rest, command: name, args: words.slice(1), depth, loops: loops.map(loop => loop.id), cd: [...cds[depth]] };
    if (name === 'git') segment.git = parseGit(segment.args);
    if (CD_COMMANDS.has(name)) cds[depth].push(cdTarget(segment.args));
    segments.push(segment);
  };

  for (const token of lex(wordsOnly(command))) {
    if (token.word !== undefined) {
      if ((current[0] ?? token.word) !== 'do') dropAwaiting();
      current.push(token.word);
      continue;
    }
    header = undefined;
    endSegment();
    if (token.op === '(') {
      if (header) header.paren = depth;
      else dropAwaiting();
      cds[depth + 1] = [...cds[depth]];
      depth++;
    } else if (token.op === ')') {
      depth = Math.max(0, depth - 1);
      cds.length = depth + 1;
      for (const loop of loops) if (loop.paren === depth) loop.awaiting = true;
    } else if (token.op === '{') {
      const pending = loops.findLast(loop => loop.style === undefined);
      if (pending) {
        pending.style = 'brace';
        pending.base = braces;
        pending.awaiting = false;
      }
      cds[depth + 1] = [...cds[depth]];
      depth++;
      braces++;
    } else if (token.op !== '}' && token.op !== ';') dropAwaiting();
    if (token.op === '}') {
      depth = Math.max(0, depth - 1);
      cds.length = depth + 1;
      braces = Math.max(0, braces - 1);
      const open = loops.findLastIndex(loop => loop.style === 'brace' && loop.base === braces);
      if (open >= 0) loops.length = open;
    }
  }
  endSegment();
  return segments;
}

const MAX_SLEEP_SECONDS = 900;
const SUFFIX_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 };
const DURATION = /^(\d+(?:\.\d+)?|\.\d+)([smhd]?)$/u;

// The seconds one `sleep`, `Start-Sleep` or `timeout /t` waits, 0 when it cannot be read, and undefined for any other segment.
function sleepSeconds({ command, args }) {
  if (command === 'timeout') {
    const at = args.findIndex(arg => arg.toLowerCase() === '/t');
    if (at < 0) return undefined;
    const value = Number(args[at + 1]);
    return value < 0 ? Infinity : Number.isFinite(value) ? value : 0;
  }
  if (command !== 'sleep' && command !== 'start-sleep') return undefined;
  let seconds = 0;
  for (let i = 0; i < args.length; i++) {
    const flag = /^-(m|s)/iu.exec(args[i])?.[1].toLowerCase();
    const value = DURATION.exec(flag ? (args[++i] ?? '') : args[i]);
    if (value) seconds += Number(value[1]) * (flag === 'm' ? 0.001 : (SUFFIX_SECONDS[value[2]] ?? 1));
    else if (!flag && args[i]?.toLowerCase() === 'infinity') seconds = Infinity;
  }
  return seconds;
}

const SHARED_NOTE = 'This is a process rule, not a retry signal: do not rephrase the command to get past it. Use the alternative, or report the blocker.';
const CI_REASON = `Continuous CI waiting is refused. Use a native completion event (\`gh pr checks --watch\` or \`gh run watch\`, in the background where the host supports it), one bounded deferred check (one sleep of at most ${MAX_SLEEP_SECONDS} seconds, then one \`gh pr checks\` or \`node tools/isswf-ci-state.mjs --pr <n>\`), or report CI as pending; see .agents/roles/references/feature-delivery.md. ${SHARED_NOTE}`;
const PACKAGE_REASON = `Package acquisition is refused. Use the installed local tools: \`node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools tests tooling/quality/*.mjs\` and \`node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress\` (docs/en/development.md, Quality checks). The only installs allowed are \`npm ci --prefix tooling/quality --ignore-scripts\` and \`npm ci --prefix tooling/host-tests --ignore-scripts\`, with no package arguments. ${SHARED_NOTE}`;

// `node <path>/isswf-ci-state.mjs` reads a PR's CI state once, so it is a bounded check like `gh`.
const CI_STATE_TOOL = /(?:^|[\\/])isswf-ci-state\.mjs$/u;
const isCiCall = ({ command, args }) => command === 'gh' || (command === 'node' && args.some(arg => CI_STATE_TOOL.test(arg)));

function ciWaiting(segments) {
  const refusal = { rule: 'ci-waiting', reason: CI_REASON };
  let slept = 0;
  const sleepLoops = new Set();
  const ghLoops = new Set();
  for (const segment of segments) {
    const { command, args, loops } = segment;
    if (isCiCall(segment)) {
      // `gh pr checks --watch` and `gh run watch` end when the checks finish, so they count as a native completion event.
      if (slept > MAX_SLEEP_SECONDS) return refusal;
      for (const id of loops) ghLoops.add(id);
    }
    if (command === 'watch' && args.some(arg => basename(arg) === 'gh' || CI_STATE_TOOL.test(arg))) return refusal;
    const seconds = sleepSeconds({ command, args });
    if (seconds !== undefined) {
      slept += seconds;
      for (const id of loops) sleepLoops.add(id);
    }
  }
  return [...ghLoops].some(id => sleepLoops.has(id)) ? refusal : undefined;
}

const LOCKED_PREFIXES = ['tooling/quality', 'tooling/host-tests'];
const normalizedPath = path => (path ?? '').replaceAll('\\', '/').replace(/^(?:\.\/)+/u, '').replace(/\/+$/u, '');
// A relative locked path, or an absolute one with no `.` or `..` segment that ends in a locked path. The core has no
// project root, so an absolute path is not checked to be inside the project.
const isLockedPrefix = path => {
  const n = normalizedPath(path);
  return LOCKED_PREFIXES.includes(n) || (/^(?:\/|[A-Za-z]:\/)/u.test(n) && !n.split('/').some(part => part === '.' || part === '..') && LOCKED_PREFIXES.some(l => n.endsWith(`/${l}`)));
};
// Redirection words are not arguments of the command they follow; a lone operator also consumes its target.
const REDIRECTION = /^(?:\d*|\*|&)?(?:>>?|<|>&|&>|>\|)/u;
const REDIRECTION_ALONE = /^(?:\d*|\*|&)?(?:>>?|<|>&|&>|>\|)$/u;
function dropRedirections(words) {
  const kept = [];
  for (let i = 0; i < words.length; i++) {
    if (!REDIRECTION.test(words[i])) kept.push(words[i]);
    else if (REDIRECTION_ALONE.test(words[i])) i++;
  }
  return kept;
}
// `npm ci --prefix <locked directory> --ignore-scripts`, with no package arguments and no other flag, in any order.
function lockedInstall(args) {
  let prefix;
  let ignoreScripts = false;
  let ci = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === 'ci') ci++;
    else if (args[i] === '--ignore-scripts') ignoreScripts = true;
    else if (args[i] === '--prefix') prefix = args[++i];
    else if (args[i].startsWith('--prefix=')) prefix = args[i].slice('--prefix='.length);
    else if (args[i] !== '--no-audit' && args[i] !== '--no-fund') return false;
  }
  return ci === 1 && ignoreScripts && isLockedPrefix(prefix);
}

const VALUE_FLAGS = new Set(['--prefix', '-c', '--workspace', '-w', '--registry', '--cache', '--userconfig', '--loglevel', '--cwd', '--dir', '-C', '--filter']);
// The first word that is neither a flag nor the value of a flag that takes one.
function subcommand(args, from = 0) {
  for (let i = from; i < args.length; i++) {
    if (!args[i].startsWith('-')) return { name: args[i], next: i + 1 };
    if (VALUE_FLAGS.has(args[i])) i++;
  }
  return { name: undefined, next: args.length };
}

const INSTALLERS = {
  npm: ['install', 'i', 'add', 'exec', 'x'],
  pnpm: ['dlx', 'add', 'install', 'i', 'exec'],
  yarn: ['dlx', 'add', 'install'],
  bun: ['add', 'install', 'i', 'x'],
};
const ALWAYS = new Set(['npx', 'bunx', 'uvx', 'corepack']);

function acquires({ command, args }) {
  if (ALWAYS.has(command)) return true;
  const { name, next } = subcommand(args);
  if (command === 'npm' && name === 'ci') return !lockedInstall(args);
  if (command === 'yarn' && name === undefined) return !args.some(arg => /^(?:-v|--version|-h|--help)$/u.test(arg));
  if (command === 'pip' || command === 'pip3') return name === 'install';
  if (command === 'uv') return (name === 'pip' || name === 'tool') && subcommand(args, next).name === 'install';
  if (/^(?:python[\d.]*|py)$/u.test(command)) {
    const at = args.indexOf('-m');
    return at >= 0 && /^pip[\d.]*$/u.test(args[at + 1] ?? '') && subcommand(args, at + 2).name === 'install';
  }
  return INSTALLERS[command]?.includes(name) ?? false;
}

const packageAcquisition = segments => (segments.some(acquires) ? { rule: 'package-acquisition', reason: PACKAGE_REASON } : undefined);

const RULES = [ciWaiting, packageAcquisition];

/** The first rule that refuses `command`, as `{ rule, reason }`, or undefined. `rules` is replaceable for tests. */
export function checkCommand(command, rules = RULES) {
  if (typeof command !== 'string') return undefined;
  const segments = tokenize(command);
  for (const rule of rules) {
    const refusal = rule(segments);
    if (refusal) return refusal;
  }
  return undefined;
}

/**
 * The verdict a host applies before a shell command runs: `{ deny }` with the refusal text, or `{}`.
 * It fails open: this guard enforces a process rule, not an authority, so an error in it must not block every shell call.
 */
export function guardCommand(command, rules) {
  try {
    const refusal = checkCommand(command, rules);
    return refusal ? { deny: `isSWF command guard (${refusal.rule}): ${refusal.reason}` } : {};
  } catch {
    return {};
  }
}
