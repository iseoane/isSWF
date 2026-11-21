import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

export const gitFixtureArgs = args => [
  '-c', 'core.autocrlf=false',
  '-c', 'core.eol=lf',
  '-c', 'core.safecrlf=false',
  '-c', 'core.fsmonitor=false',
  ...args,
];

// Starting a fixture repository with a bare `git init` or `git clone` inherits the operator's global `core.fsmonitor=true`, which leaves a
// `git fsmonitor--daemon` running after the test. `-c` turns it off while Git creates the repository and the local setting keeps it off for later commands.
// `git` and `env` select an absolute Git executable or an isolated environment; `flags` go between the subcommand and the paths.
// `localConfig: false` skips the local setting for a repository that a git-evidence tool binds, which refuses any local `core.fsmonitor`; such a test
// runs its fixture commands through `gitFixtureArgs`, which turns it off for each command instead.
function startRepository(subcommand, flags, paths, repository, { git = 'git', env = process.env, localConfig = true } = {}) {
  const run = args => {
    const result = spawnSync(git, args, { env, encoding: 'utf8', timeout: 60000, windowsHide: true });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `git ${args.join(' ')}\n${result.stderr}`);
  };
  run(['-c', 'core.fsmonitor=false', subcommand, '-q', ...flags, ...paths]);
  if (localConfig) run(['-C', repository, 'config', '--local', 'core.fsmonitor', 'false']);
}

/** Runs `git init -q <flags> <directory>`, creating the directory, with `core.fsmonitor=false` in the new repository's local config. */
export const initRepository = (directory, flags = [], options) => startRepository('init', flags, [directory], directory, options);

/** Runs `git clone -q <flags> <source> <destination>` with `core.fsmonitor=false` in the clone's local config. */
export const cloneRepository = (source, destination, flags = [], options) => startRepository('clone', flags, [source, destination], destination, options);
