// The delivery lifecycle of one job as an explicit state machine. No Node imports: the state is derived from facts the caller reads from records and Git, never stored.

/** The steps in order; each holds only when every earlier one does. */
export const STATES = ['brief', 'attempt', 'review', 'covered', 'ci-green', 'merged', 'closed'];

// The fact each state needs, and the refusal named when the walk stops just before it.
const FACT = { brief: 'brief', attempt: 'attempt', review: 'review', covered: 'covered', 'ci-green': 'ciGreen', merged: 'merged', closed: 'closed' };
const MISSING = { brief: 'no-brief', attempt: 'no-attempt', review: 'no-review', covered: 'not-covered', 'ci-green': 'ci-not-green' };

/** The furthest state whose facts, and those of every earlier state, are true; `none` when even the brief is missing. */
export function deriveState(facts) {
  let state = 'none';
  for (const name of STATES) {
    if (!facts[FACT[name]]) break;
    state = name;
  }
  return state;
}

/**
 * The named reason a job in state `from` may not move to `to`, or undefined when the move is legal. A move is legal only to the next state;
 * from an earlier state the reason names the first missing step, from `to` or later it names what already happened.
 */
export function refusalFor(from, to) {
  const at = STATES.indexOf(from), target = STATES.indexOf(to);
  if (at >= target) return from === 'closed' ? 'already-closed' : `already-${from}`;
  if (at === target - 1) return undefined;
  return MISSING[STATES[at + 1]];
}
