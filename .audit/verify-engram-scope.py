#!/usr/bin/env python3
"""Verify installed Engram in disposable data, never the user's memory store."""
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
BIN = '/home/linuxbrew/.linuxbrew/bin/engram'
records = []
retrievals = []
with tempfile.TemporaryDirectory(prefix='isswf-engram-scope-') as directory:
    root = Path(directory)
    (root / 'home').mkdir()
    (root / 'data').mkdir()
    env = {'PATH': '/home/linuxbrew/.linuxbrew/bin:/usr/bin:/bin', 'HOME': str(root / 'home'), 'ENGRAM_DATA_DIR': str(root / 'data'), 'ENGRAM_CLOUD_AUTOSYNC': '0', 'ENGRAM_NO_UPDATE_CHECK': '1'}
    def run(*args, expected=0):
        result = subprocess.run([BIN, *args], cwd=root, env=env, text=True, capture_output=True, timeout=20)
        assert result.returncode == expected, (args, result.returncode, result.stderr)
        return result
    before = json.loads(run('compatibility', '--data-dir', str(root / 'data'), '--json').stdout)
    assert before['status'] == 'fresh'
    assert before['offline_automatic_opening_authorized'] is False
    records.append('fresh-is-not-automatic-opening-permission')
    # Deliberate test-only opening of the newly created, owned directory.
    run('save', 'fixture A', 'qzalphamemoryone', '--project', 'isswf-fixture-a', '--scope', 'project')
    run('save', 'fixture B', 'vxbetamemorytwo', '--project', 'isswf-fixture-b', '--scope', 'project')
    assert (root / 'data' / 'engram.db').exists()
    records.append('test-only-store-explicitly-opened')
    for project, own, other in [('isswf-fixture-a', 'qzalphamemoryone', 'vxbetamemorytwo'), ('isswf-fixture-b', 'vxbetamemorytwo', 'qzalphamemoryone')]:
        found = run('search', own, '--project', project).stdout
        assert own in found and other not in found and not found.startswith('No memories found for:')
        absent = run('search', other, '--project', project).stdout
        assert absent.strip() == f'No memories found for: "{other}"', (project, absent)
        context = run('context', '--project', project, '--scope', 'project').stdout
        assert own in context and other not in context
        retrievals.append({'project': project, 'search': found, 'foreign_search': absent, 'context': context})
        records += [project + '-fresh-process-retrieval', project + '-foreign-marker-not-retrieved', project + '-context-scoped']
    sidecars = [name for name in ['engram.db-wal', 'engram.db-shm'] if (root / 'data' / name).exists()]
    result = subprocess.run([BIN, 'compatibility', '--data-dir', str(root / 'data'), '--json'], cwd=root, env=env, capture_output=True, text=True, timeout=20)
    observation = {'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr, 'sidecars_observed': sidecars}
    # Observation only: neither refusal nor acceptance establishes store integrity.
report = {'scope': 'Installed Engram CLI, disposable fixtures only; does not integrate the real user store or certify application memory policies.', 'binary': BIN, 'checks': records, 'retrievals': retrievals, 'compatibility_after_opening': observation}
(ROOT / '.audit/engram-scope.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f'PASS: {len(records)} isolated checks; fresh-process retrieval and two-project selectors; temporary store removed')
