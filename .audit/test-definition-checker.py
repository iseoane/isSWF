#!/usr/bin/env python3
"""Mutation checks in temporary copies, never in the real definition."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent


def run(root):
    return subprocess.run([sys.executable, str(root / '.audit/verify-definition.py')],
                          capture_output=True, text=True)


cases = [
    ('missing assignment', 'docs/plan-v1.md', 'TRI-01, ', '', 'Plan criteria differ from spec'),
    ('duplicate criterion', 'docs/spec-v1.md', '- `AGT-01`:', '- `AGT-02`:', 'Criteria missing or duplicated'),
    ('dependency cycle', 'docs/plan-v1.md', '| S01 | ninguna |', '| S01 | S02 |', 'Dependency cycle: S01'),
    ('broken local link', 'README.md', '(docs/vision.md)', '(docs/absent.md)', 'Broken local link:'),
    ('trailing whitespace', 'README.md', '# isSWF\n', '# isSWF \n', 'Trailing whitespace:'),
]
with tempfile.TemporaryDirectory(prefix='isswf-definition-negative-') as directory:
    root = Path(directory)
    assert not root.resolve().is_relative_to(ROOT), 'Temporary fixture must be outside project'
    shutil.copytree(ROOT, root, dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns('.git', '__pycache__'))
    baseline = run(root)
    assert baseline.returncode == 0, baseline.stderr
    print('PASS: unchanged temporary copy passes')
    for name, path, old, new, expected in cases:
        file = root / path
        original = file.read_text()
        assert original.count(old) == 1, (name, 'mutation target not unique')
        file.write_text(original.replace(old, new))
        result = run(root)
        file.write_text(original)
        assert result.returncode != 0 and expected in result.stderr, (name, result.stdout, result.stderr)
        print(f'PASS: rejects {name} with {expected}')
    restored = run(root)
    assert restored.returncode == 0, restored.stderr
    print('PASS: restored copy passes; original documents untouched')
print('Scope: checker behavior on five document errors, not factory behavior')
