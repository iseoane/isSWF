// Inert stub for the RED commit: the behavior lands in the GREEN commit.
export default function (pi) {
  pi.on('tool_result', async () => undefined);
}
