// Placeholder until the guard is wired in: it registers its handler and lets every call through.
export default function (pi) {
  pi.on('tool_call', async () => undefined);
}
