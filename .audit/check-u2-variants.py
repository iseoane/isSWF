#!/usr/bin/env python3
"""Census of overlapping snapshot variants, not semantic product validation."""
from copy import deepcopy
import importlib
import itertools
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(sys.argv[1]).resolve()))
contracts = importlib.import_module('isswf.contracts')
base = json.loads((root / '.audit/u2-live-context.json').read_text())['answered']
resolution = json.loads((root / '.audit/u2-triage-existing.json').read_text())['resolution']
results = []
violations = []
for answered, pending, preparation, resolved, refs in itertools.product([False, True], ['none', 'new', 'answered-id'], ['ready-for-agent', 'needs-info', 'ready-for-human', 'needs-triage'], [False, True], [False, True]):
    value = deepcopy(base)
    value['brief']['acceptance'] = ['Criterio observable del siguiente paso, no entrega acreditada.']
    value['answers'] = base['answers'] if answered else []
    value['decision_refs'] = base['decision_refs'] if answered and refs else []
    value['preparation'] = preparation
    question = deepcopy(base['answers'][0]['question'])
    if pending == 'new':
        question['id'] = 'followup-new-id'
        question['question'] = '¿Cuál es la decisión de producto adicional?'
    value['questions'] = [] if pending == 'none' else [question]
    value['resolution'] = resolution if resolved else None
    must_reject = (
        (answered and pending == 'answered-id') or
        (resolved and pending != 'none') or
        (answered and not refs) or
        (preparation == 'ready-for-agent' and (pending != 'none' or resolved)) or
        (preparation in {'needs-info', 'ready-for-human'} and pending == 'none') or
        (preparation == 'needs-triage' and not (resolved or (answered and refs))) or
        (resolved and preparation != 'needs-triage')
    )
    try:
        contracts.parse_snapshot(value)
        accepted = True
    except contracts.ContractError:
        accepted = False
    record = {'answered': answered, 'pending': pending, 'preparation': preparation, 'resolution': resolved, 'refs': refs, 'accepted': accepted, 'must_reject': must_reject}
    results.append(record)
    if must_reject and accepted:
        violations.append(record)
report = {'scope': 'Snapshot variant structure only; no universal semantics or lifecycle certification.', 'tree': sys.argv[1], 'cases': len(results), 'illegal_accepted': violations, 'results': results}
print(json.dumps(report, ensure_ascii=False, indent=2))
assert not violations, f'{len(violations)} incompatible snapshot variants accepted'
