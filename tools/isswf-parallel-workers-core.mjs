// RED stub: the per-clone parallel-worker limit is not implemented yet.
export const readPolicy = async () => ({ limit: 2, mode: 'observe' });
export const checkWorkerLimit = async () => ({});
export const openWorkers = async () => [];
export const markWorkerRun = async () => {};
export const closeWorker = async () => {};
export const closeWorkerRun = async () => {};
export const listWorkers = async () => [];
