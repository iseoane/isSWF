import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Type } from '@earendil-works/pi-ai';
import { validateDiffBinding, validateBinding, validateContentBinding } from './git-evidence.mjs';

const namespace = 'isswf.git-evidence/1';
const diffNamespace = 'isswf.git-evidence.diff/1';
const contentNamespace = 'isswf.git-evidence.content/1';
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
  const contentBinding = capture(contentNamespace, validateContentBinding);

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
    name: 'isswf_git_content',
    label: 'Bound committed file content',
    description: 'Return exact bytes for one allowlisted regular file from the coordinator-bound base or candidate commit. Select only a bound path and slot; no repository or revision can be supplied.',
    parameters: Type.Object({ slot: Type.String(), path: Type.String() }, { additionalProperties: false }),
    async execute(_toolCallId, params) {
      if (!params || Object.keys(params).sort().join(',') !== 'path,slot' || !['base', 'candidate'].includes(params.slot) || typeof params.path !== 'string') throw Error('This content tool accepts only an allowlisted path and base/candidate slot.');
      if (!contentBinding.binding) throw Error(`Committed content unavailable: ${contentBinding.error}`);
      const binding = contentBinding.binding;
      const result = spawnSync(process.execPath, [cli, 'content', params.slot, params.path], {
        input: JSON.stringify(binding), encoding: 'utf8', shell: false, windowsHide: true,
        timeout: binding.timeoutMs + 2000, maxBuffer: 100000,
        env: { PATH: dirname(process.execPath), HOME: process.platform === 'win32' ? 'C:\\' : '/nonexistent', LC_ALL: 'C' },
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      if (result.error) throw Error(result.error.code === 'ETIMEDOUT' ? 'Content CLI timed out.' : 'Content CLI could not be started.');
      let evidence;
      try { evidence = JSON.parse(result.stdout); }
      catch { throw Error('Content CLI returned invalid bounded output.'); }
      if (!evidence || !['ok', 'absent', 'error'].includes(evidence.status) || evidence.version !== 1 || evidence.operation !== 'content') throw Error('Content CLI returned an invalid result.');
      if (evidence.status !== 'error') {
        const commitSha = params.slot === 'base' ? binding.baseSha : binding.candidateSha;
        const bindingSha256 = createHash('sha256').update(JSON.stringify(binding)).digest('hex');
        if (evidence.repository !== binding.repository || evidence.baseSha !== binding.baseSha || evidence.candidateSha !== binding.candidateSha || evidence.commitSha !== commitSha || evidence.path !== params.path || evidence.bindingSha256 !== bindingSha256) throw Error('Content CLI returned mismatched bound provenance.');
      }
      const serialized = JSON.stringify(evidence);
      if (Buffer.byteLength(serialized + '\n') > 98304) throw Error('Content CLI returned output beyond its response bound.');
      const content = [{ type: 'text', text: serialized }];
      const details = { ...evidence };
      if (evidence.status === 'ok') {
        if (evidence.contentEncoding !== 'base64' || typeof evidence.content !== 'string') throw Error('Content CLI returned invalid byte encoding.');
        const bytes = Buffer.from(evidence.content, 'base64');
        if (bytes.toString('base64') !== evidence.content || bytes.length !== evidence.contentBytes || bytes.length > binding.outputBytes || createHash('sha256').update(bytes).digest('hex') !== evidence.contentSha256) throw Error('Committed content integrity check failed.');
        details.contentIntegrity = 'verified';
        try {
          const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
          details.contentTextEncoding = 'utf8';
          content.push({ type: 'text', text });
        } catch {
          details.contentTextEncoding = 'unavailable-non-utf8';
        }
        content[0].text = JSON.stringify(details);
        // The model-visible text already carries the base64; repeating it in details would double the result size.
        delete details.content;
      }
      const output = { content, details, ...(result.status === 0 && evidence.status !== 'error' ? {} : { isError: true }) };
      if (Buffer.byteLength(JSON.stringify(output) + '\n') > 196608) throw Error('Content tool result exceeds its bounded display envelope.');
      return output;
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
