import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Type } from '@earendil-works/pi-ai';
import { validateBinding } from './git-evidence.mjs';

const namespace = 'isswf.git-evidence/1';
const cli = join(dirname(fileURLToPath(import.meta.url)), 'git-evidence.mjs');
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

export default function (pi) {
  let binding;
  let bindingError;
  try {
    const parsed = JSON.parse(process.env.PI_SUBAGENT_EXTENSION_BINDINGS ?? 'null');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Object.hasOwn(parsed, namespace)) throw Error('trusted Pi launch binding is missing');
    binding = freeze(validateBinding(parsed[namespace]));
  } catch (error) {
    binding = null;
    bindingError = typeof error?.message === 'string' ? error.message.slice(0, 160) : 'invalid trusted launch binding';
  }

  pi.registerTool({
    name: 'isswf_git_identity',
    label: 'Bound Git identity',
    description: 'Return only the coordinator-bound repository, base commit, candidate commit, observed HEAD, and bounded identity errors. No arguments are accepted.',
    parameters: Type.Object({}, { additionalProperties: false }),
    async execute(_toolCallId, params) {
      if (Object.keys(params ?? {}).length !== 0) throw Error('This identity tool accepts no arguments.');
      if (!binding) throw Error(`Identity evidence unavailable: ${bindingError}`);
      const result = spawnSync(process.execPath, [cli, 'identity'], {
        input: JSON.stringify(binding), encoding: 'utf8', shell: false, windowsHide: true,
        timeout: binding.timeoutMs + 2000, maxBuffer: binding.outputBytes + 1024,
        env: { PATH: dirname(process.execPath), HOME: process.platform === 'win32' ? 'C:\\' : '/nonexistent', LC_ALL: 'C' },
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      if (result.error) throw Error(result.error.code === 'ETIMEDOUT' ? 'Identity CLI timed out.' : 'Identity CLI could not be started.');
      let evidence;
      try { evidence = JSON.parse(result.stdout); }
      catch { throw Error('Identity CLI returned invalid bounded output.'); }
      if (!evidence || !['ok', 'error'].includes(evidence.status) || evidence.version !== 1) throw Error('Identity CLI returned an invalid result.');
      return {
        content: [{ type: 'text', text: JSON.stringify(evidence) }],
        details: evidence,
        ...(result.status === 0 && evidence.status === 'ok' ? {} : { isError: true }),
      };
    },
  });
}
