// Skeleton for the RED commit; the behavior follows in the GREEN commit.
export const STATES = ['brief', 'attempt', 'review', 'covered', 'ci-green', 'merged', 'closed'];
export const deriveState = () => 'none';
export const refusalFor = () => undefined;
