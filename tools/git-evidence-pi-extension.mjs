import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Type } from '@earendil-works/pi-ai';
import { captureBinding, checkArguments, invokeEvidence } from './git-evidence-invoke.mjs';

const cli = join(dirname(fileURLToPath(import.meta.url)), 'git-evidence.mjs');

export default function (pi) {
  const capture = operation => captureBinding(process.env.PI_SUBAGENT_EXTENSION_BINDINGS, operation, 'trusted Pi launch binding is missing');
  const bindings = { identity: capture('identity'), diff: capture('diff'), content: capture('content') };
  const run = (operation, unavailable, params = {}) => {
    checkArguments(operation, params);
    const captured = bindings[operation];
    if (!captured.binding) throw Error(`${unavailable}: ${captured.error}`);
    return invokeEvidence({ ...params, cli, operation, binding: captured.binding });
  };

  pi.registerTool({
    name: 'isswf_git_identity',
    label: 'Bound Git identity',
    description: 'Return only the coordinator-bound repository, base commit, candidate commit, observed HEAD, and bounded identity errors. No arguments are accepted.',
    parameters: Type.Object({}, { additionalProperties: false }),
    async execute(_toolCallId, params) { return run('identity', 'Identity evidence unavailable', params); },
  });

  pi.registerTool({
    name: 'isswf_git_content',
    label: 'Bound committed file content',
    description: 'Return exact bytes for one allowlisted regular file from the coordinator-bound base or candidate commit. Select only a bound path and slot; no repository or revision can be supplied.',
    parameters: Type.Object({ slot: Type.String(), path: Type.String() }, { additionalProperties: false }),
    async execute(_toolCallId, params) { return run('content', 'Committed content unavailable', params); },
  });

  pi.registerTool({
    name: 'isswf_git_diff',
    label: 'Bound committed Git diff',
    description: 'Return the exact bounded committed patch between the coordinator-bound commits. The patch is base64-encoded bytes with length and SHA-256; no arguments are accepted.',
    parameters: Type.Object({}, { additionalProperties: false }),
    async execute(_toolCallId, params) { return run('diff', 'Diff evidence unavailable', params); },
  });
}
