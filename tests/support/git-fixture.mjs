export const gitFixtureArgs = args => [
  '-c', 'core.autocrlf=false',
  '-c', 'core.eol=lf',
  '-c', 'core.safecrlf=false',
  ...args,
];
