import { guardCommand } from './isswf-command-core.mjs';

const SHELL_TOOLS = new Set(['bash', 'powershell']);

// Refuses a CI-waiting or package-acquisition shell command before it runs. The guard core fails open, so a fault never blocks a call.
// It is registered through the package for the main session and declared by the worker profile for its child.
export default function (pi) {
  pi.on('tool_call', async event => {
    if (!SHELL_TOOLS.has(event?.toolName)) return undefined;
    const { deny } = guardCommand(event.input?.command);
    return deny === undefined ? undefined : { block: true, reason: deny };
  });
}
