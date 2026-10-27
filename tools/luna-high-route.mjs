// Supported explicit destinations, not aliases or a fallback order. Caller grants
// and pinned configuration must select the complete same one-entry route.
export function lunaHighRoute(route) {
  if (!Array.isArray(route) || route.length !== 1) return null;
  const tuple = route[0];
  if (!tuple || typeof tuple !== 'object' || Array.isArray(tuple) || Object.keys(tuple).sort().join(',') !== 'effort,model' || tuple.effort !== 'high') return null;
  if (!['openai-codex/gpt-6-luna', 'openai/gpt-6-luna'].includes(tuple.model)) return null;
  return { provider: tuple.model.split('/')[0], model: 'gpt-6-luna', effort: 'high' };
}
