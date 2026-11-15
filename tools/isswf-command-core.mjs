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
const LOOP_KEYWORDS = new Set(['while', 'until', 'for', 'foreach', 'select']);
// A `for` or `foreach` header lists values, not a command.
const VALUE_LOOPS = new Set(['for', 'foreach', 'select']);
const PASSTHROUGH_KEYWORDS = new Set(['if', 'then', 'else', 'elif', '!', 'time']);
const BRACE_LOOP_COMMANDS = new Set(['foreach-object', '%']);

const wordsOnly = command => command
  .replace(/\\\r?\n/gu, ' ')
  .replace(HEREDOC, '$3\n')
  .replace(QUOTED, quoted => (SAFE_QUOTED.test(quoted) ? quoted.slice(1, -1) : OPAQUE));

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

// Drops the leading assignments and the `sudo`, `env`, `command` and `exec` prefixes; `command -v` only looks a name up.
function stripPrefixes(words) {
  let rest = words;
  const dropFlags = valueFlags => {
    while (rest[0]?.startsWith('-')) rest = rest.slice(valueFlags.includes(rest[0]) ? 2 : 1);
  };
  for (;;) {
    const name = basename(rest[0] ?? '');
    if (ASSIGNMENT.test(rest[0] ?? '')) rest = rest.slice(1);
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

/**
 * Splits a command into segments on `&&`, `||`, `;`, `|`, `&` and newlines, after setting aside heredocs, comments and quoted text.
 * Each segment has its `words`, its normalized `command` (a lower-case basename without `.cmd` or `.exe`) with its `args`, the
 * parenthesis and brace `depth`, and the ids of the loops it is inside (`loops`).
 */
export function tokenize(command) {
  const segments = [];
  const loops = [];
  let nextId = 0;
  let depth = 0;
  let braces = 0;
  let current = [];

  const openLoop = () => loops.push({ id: nextId++, style: undefined, base: braces });

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
        openLoop();
        valueHeader = valueHeader || VALUE_LOOPS.has(leading);
      } else if (leading === 'do') {
        const pending = loops.at(-1)?.style === undefined ? loops.at(-1) : undefined;
        if (pending) pending.style = 'do';
        else openLoop();
      } else if (!PASSTHROUGH_KEYWORDS.has(leading)) break;
      rest = rest.slice(1);
    }
    const words = valueHeader ? [] : stripPrefixes(rest);
    const name = words.length && words[0] !== OPAQUE ? basename(words[0]) : undefined;
    if (BRACE_LOOP_COMMANDS.has(name)) openLoop();
    segments.push({ words: rest, command: name, args: words.slice(1), depth, loops: loops.map(loop => loop.id) });
  };

  for (const token of lex(wordsOnly(command))) {
    if (token.word !== undefined) {
      current.push(token.word);
      continue;
    }
    endSegment();
    if (token.op === '(') depth++;
    else if (token.op === ')') depth = Math.max(0, depth - 1);
    else if (token.op === '{') {
      const pending = loops.findLast(loop => loop.style === undefined);
      if (pending) {
        pending.style = 'brace';
        pending.base = braces;
      }
      depth++;
      braces++;
    } else if (token.op === '}') {
      depth = Math.max(0, depth - 1);
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
const CI_REASON = `Continuous CI waiting is refused. Use a native completion event, one bounded deferred check (one sleep of at most ${MAX_SLEEP_SECONDS} seconds, then one \`gh pr checks\`), or report CI as pending; see .agents/roles/references/feature-delivery.md. ${SHARED_NOTE}`;

function ciWaiting(segments) {
  const refusal = { rule: 'ci-waiting', reason: CI_REASON };
  let slept = 0;
  const sleepLoops = new Set();
  const ghLoops = new Set();
  for (const { command, args, loops } of segments) {
    const text = ` ${args.join(' ').toLowerCase()} `;
    if (command === 'gh') {
      if (/ run watch /u.test(text) || (/ pr checks /u.test(text) && / --watch(?:=\S+)? /u.test(text)) || slept > MAX_SLEEP_SECONDS) return refusal;
      for (const id of loops) ghLoops.add(id);
    }
    if (command === 'watch' && args.some(arg => basename(arg) === 'gh')) return refusal;
    const seconds = sleepSeconds({ command, args });
    if (seconds !== undefined) {
      slept += seconds;
      for (const id of loops) sleepLoops.add(id);
    }
  }
  return [...ghLoops].some(id => sleepLoops.has(id)) ? refusal : undefined;
}

const RULES = [ciWaiting];

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
