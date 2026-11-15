// No Node imports and no `process` access, like tools/isswf-record-guard-core.mjs: the Claude hooks module has
// only an injected fs. The Pi extension and hooks/register.tsx pass their own `io`.

/**
 * Placeholder until the guard is implemented: it allows every call.
 * @returns {Promise<{ allow: true } | { deny: string, condition: string }>}
 */
export async function guardDispatch() {
  return { allow: true };
}
