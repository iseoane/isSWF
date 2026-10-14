#!/usr/bin/env python3
import json
from pathlib import Path
import subprocess
import sys
import tempfile

source = Path(sys.argv[1]).resolve()
text = source.read_text()
old = "(scratch / 'output').write_text('bounded')"
assert text.count(old) == 1, 'Positive-control mutation target not unique'
with tempfile.TemporaryDirectory(prefix='isswf-isolation-mutation-') as directory:
    mutant = Path(directory) / 'isolation.py'
    mutant.write_text(text.replace(old, "(scratch / 'missing-parent' / 'output').write_text('bounded')"))
    result = subprocess.run([sys.executable, str(mutant), 'permissions'], capture_output=True, text=True, timeout=25)
    records = [json.loads(line) for line in result.stdout.splitlines() if line.startswith('{')]
    checks = [r for r in records if r.get('event') == 'check' and r.get('operation') == 'scratch-write']
    if result.returncode == 0:
        print('FAIL: missing-parent scratch write incorrectly accepted:', checks)
        raise SystemExit(1)
    assert any(r.get('passed') is False and r.get('actual') == {'errno': 2} for r in checks), (result.returncode, result.stdout, result.stderr)
    print('PASS: allowed scratch write with missing parent is rejected with errno 2, not counted as protected access')
print('Scope: mutant temporary copy only; original probe and documents unchanged')
