#!/usr/bin/env python3
"""Check documentation consistency; does not validate factory behavior."""
from collections import Counter
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CODE = r'(?:AGT|GND|DEL|RET|MOD|NAV|TRI|OPS|SEC|PRD|MEM)-\d{2}'
spec = (ROOT / 'docs/spec-v1.md').read_text()
plan = (ROOT / 'docs/plan-v1.md').read_text()
criteria = re.findall(r'^- `(' + CODE + r')`:', spec, re.M)
assigned = re.findall(CODE, plan)
assert len(criteria) == 61 and len(set(criteria)) == 61, 'Criteria missing or duplicated'
assert Counter(criteria) == Counter(assigned), 'Plan criteria differ from spec'

graph = {}
for line in plan.splitlines():
    if re.match(r'\| S\d{2} \|', line):
        cells = [cell.strip() for cell in line.split('|')]
        graph[cells[1]] = re.findall(r'S\d{2}', cells[2])
assert len(graph) == 8, 'Expected eight functional slices'
visiting, visited = set(), set()

def visit(node):
    assert node in graph, f'Unknown dependency: {node}'
    assert node not in visiting, f'Dependency cycle: {node}'
    if node in visited:
        return
    visiting.add(node)
    for dependency in graph[node]:
        visit(dependency)
    visiting.remove(node)
    visited.add(node)

for node in graph:
    visit(node)

links = 0
files = [ROOT / 'README.md', ROOT / 'GLOSSARY.md', *sorted((ROOT / 'docs').rglob('*.md'))]
for file in files:
    text = file.read_text()
    assert text.endswith('\n'), f'Missing final newline: {file}'
    assert not any(line.rstrip() != line for line in text.splitlines()), f'Trailing whitespace: {file}'
    assert not re.search(r'^(?:<<<<<<<|=======|>>>>>>>)', text, re.M), f'Conflict marker: {file}'
    for target in re.findall(r'\]\(([^)]+)\)', text):
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target):
            continue
        path = target.split('#', 1)[0]
        if path:
            assert (file.parent / path).exists(), f'Broken local link: {file}: {target}'
            links += 1

print(f'PASS: {len(criteria)} criteria assigned once; {len(graph)} acyclic slices; {links} local links; Markdown formatting')
print('Scope: document consistency only; no implementation, isolation or recovery proof')
