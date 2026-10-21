export default [
  { ignores: ['**/node_modules/**', '.audit/**', '.claude/**', '.codegraph/**', 'tooling/.local/**'] },
  {
    files: ['tools/**/*.mjs', 'tests/**/*.mjs', 'tooling/quality/*.mjs', 'tooling/maintenance/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none', ignoreRestSiblings: true }],
      'no-unreachable': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-import-assign': 'error',
      'no-unsafe-finally': 'error',
      'valid-typeof': 'error',
      'use-isnan': 'error',
    },
  },
];
