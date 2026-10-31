import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Type } from '@earendil-works/pi-ai';
import { validateDiffBinding, validateBinding } from './git-evidence.mjs';

const namespace = 'isswf.git-evidence/1';
const diffNamespace = 'isswf.git-evidence.diff/1';
const cli = join(dirname(fileURLToPath(import.meta.url)), 'git-evidence.mjs');
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

export default function (pi) {
  const capture = (key, validate) => {
    try {
      const parsed = JSON.parse(process.env.PI_SUBAGENT_EXTENSION_BINDINGS ?? 'null');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Object.hasOwn(parsed, key)) throw Error('trusted Pi launch binding is missing');
      return { binding: freeze(validate(parsed[key])) };
    } catch (error) {
      return { binding: null, error: typeof error?.message === 'string' ? error.message.slice(0, 160) : 'invalid trusted launch binding' };
    }
  };
  const identityBinding = capture(namespace, validateBinding);
  const diffBinding = capture(diffNamespace, validateDiffBinding);

  pi.registerTool({
    name: 'isswf_git_identity',
    label: 'Bound Git identity',
    description: 'Return only the coordinator-bound repository, base commit, candidate commit, observed HEAD, and bounded identity errors. No arguments are accepted.',
    parameters: Type.Object({}, { additionalProperties: false }),
    async execute(_toolCallId, params) {
      if (Object.keys(params ?? {}).length !== 0) throw Error('This identity tool accepts no arguments.');
      if (!identityBinding.binding) throw Error(`Identity evidence unavailable: ${identityBinding.error}`);
      const binding = identityBinding.binding;
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

  pi.registerTool({
    name: 'isswf_git_diff',
    label: 'Bound committed Git diff',
    description: 'Return the exact bounded committed patch between the coordinator-bound commits. The patch is base64-encoded bytes with length and SHA-256; no arguments are accepted.',
    parameters: Type.Object({}, { additionalProperties: false }),
    async execute(_toolCallId, params) {
      if (Object.keys(params ?? {}).length !== 0) throw Error('This diff tool accepts no arguments.');
      if (!diffBinding.binding) throw Error(`Diff evidence unavailable: ${diffBinding.error}`);
      const binding = diffBinding.binding;
      const result = spawnSync(process.execPath, [cli, 'diff'], {
        input: JSON.stringify(binding), encoding: 'utf8', shell: false, windowsHide: true,
        timeout: binding.timeoutMs + 2000, maxBuffer: 263168,
        env: { PATH: dirname(process.execPath), HOME: process.platform === 'win32' ? 'C:\\' : '/nonexistent', LC_ALL: 'C' },
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      if (result.error) throw Error(result.error.code === 'ETIMEDOUT' ? 'Diff CLI timed out.' : 'Diff CLI could not be started.');
      let evidence;
      try { evidence = JSON.parse(result.stdout); }
      catch { throw Error('Diff CLI returned invalid bounded output.'); }
      if (!evidence || !['ok', 'error'].includes(evidence.status) || evidence.version !== 1 || evidence.operation !== 'diff') throw Error('Diff CLI returned an invalid result.');
      const serialized = JSON.stringify(evidence);
      if (Buffer.byteLength(serialized + '\n') > 262144) throw Error('Diff CLI returned output beyond its response bound.');
      const content = [{ type: 'text', text: serialized }];
      const details = { ...evidence };
      if (evidence.status === 'ok') {
        if (evidence.patchEncoding !== 'base64' || typeof evidence.patch !== 'string') throw Error('Diff CLI returned invalid patch encoding.');
        const patch = Buffer.from(evidence.patch, 'base64');
        if (patch.toString('base64') !== evidence.patch || patch.length !== evidence.patchBytes || patch.length > binding.outputBytes || createHash('sha256').update(patch).digest('hex') !== evidence.patchSha256) throw Error('Diff CLI patch integrity check failed.');
        details.patchIntegrity = 'verified';
        try {
          const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(patch);
          details.patchTextEncoding = 'utf8';
          content.push({ type: 'text', text });
        } catch {
          details.patchTextEncoding = 'unavailable-non-utf8';
        }
        content[0].text = JSON.stringify(details);
      }
      const output = { content, details, ...(result.status === 0 && evidence.status === 'ok' ? {} : { isError: true }) };
      if (Buffer.byteLength(JSON.stringify(output) + '\n') > 524288) throw Error('Diff tool result exceeds its bounded display envelope.');
      return output;
    },
  });
}
