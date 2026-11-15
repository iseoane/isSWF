// Stub for the RED commit: every export returns nothing, so the tests fail on their assertions.
export const resolveDir = () => undefined;
export const observeFromFiles = async () => undefined;
export const observeBranch = async () => undefined;
export const checkBranch = async () => ({ reobserve: [] });
export const refreshBranches = async () => {};
