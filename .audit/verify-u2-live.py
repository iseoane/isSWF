#!/usr/bin/env python3
"""Drive the candidate through real CLI/HTTP/browser with model proposals."""
import argparse
from contextlib import closing
import http.client
import json
from pathlib import Path
import re
import selectors
import sqlite3
import subprocess
import sys
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
AUDIT = ROOT / '.audit'
parser = argparse.ArgumentParser()
parser.add_argument('tree', type=Path)
parser.add_argument('phase', choices=['seed', 'finish'])
args = parser.parse_args()
tree = args.tree.resolve()
context_file = AUDIT / 'u2-live-context.json'

def cli(state, *parts):
    run = subprocess.run([sys.executable, '-u', '-m', 'isswf', '--state', str(state), *parts], cwd=tree, capture_output=True, text=True, timeout=15)
    assert run.returncode == 0, run.stderr
    return json.loads(run.stdout)

def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

if args.phase == 'seed':
    directory = Path(tempfile.mkdtemp(prefix='isswf-u2-live-'))
    state = directory / 'state'
    proposal = json.loads((AUDIT / 'u2-triage-ambiguous.json').read_text())
    expected_source = {'repo': 'factory/isswf-demo', 'number': 17, 'title': 'Mostrar la fecha de actualización', 'body': 'Mostrar cuándo cambió por última vez el estado de una issue. No hemos decidido si cuenta cualquier edición o solo cambiar el estado.', 'labels': ['enhancement'], 'observed_at': '2025-01-15T12:00:00Z'}
    assert proposal['source'] == expected_source, 'Skill must preserve source exactly'
    assert proposal['preparation'] in {'needs-info', 'ready-for-human'}
    assert proposal['questions'] and not proposal['brief']['acceptance']
    assert proposal['authorization_id'] == 'auth-fixture-u2'
    authorization = {'repo': expected_source['repo'], 'issue': 17, 'objective': proposal['brief']['objective'], 'scope': proposal['brief']['scope'], 'actor': 'fixture-operator', 'decision': 'Preparar fixture local, sin ejecución.'}
    assert authorization['objective'] == 'Mostrar cuándo cambió el estado de una issue.'
    assert authorization['scope'] == 'Preparar una ficha para observar la fecha de última actualización de la issue.'
    auth_file = directory / 'authorization.json'
    save(auth_file, authorization)
    grant = cli(state, 'authorize', str(auth_file))
    proposal['authorization_id'] = grant['id']
    prop_file = directory / 'proposal.json'
    save(prop_file, proposal)
    pending = cli(state, 'prepare', str(prop_file))
    assert pending == cli(state, 'show', pending['id'])
    assert pending['revision'] == 1
    assert len(pending['questions']) == 1, 'This live fixture expects one product decision'
    decision_file = directory / 'decision.json'
    save(decision_file, {'work_id': pending['id'], 'expected_revision': 1, 'question_id': pending['questions'][0]['id'], 'answer': 'Solo debe contar un cambio de estado; una edición del texto no cambia la fecha mostrada.', 'actor': 'fixture-operator'})
    answered = cli(state, 'decide', str(decision_file))
    assert answered['id'] == pending['id'] and answered['revision'] == 2
    assert answered['preparation'] == 'needs-triage' and not answered['questions']
    assert len(answered['answers']) == 1 and answered['brief']['acceptance'] == []
    assert answered == cli(state, 'show', pending['id'])
    save(context_file, {'fixture': True, 'tree': str(tree), 'directory': str(directory), 'source': expected_source, 'authorization': authorization, 'pending': pending, 'answered': answered})
    print('PASS: ambiguous model proposal stored; operator answer is revision2, not ready; context available for fresh retriage')
else:
    context = json.loads(context_file.read_text())
    assert context['fixture'] and context['tree'] == str(tree)
    state = Path(context['directory']) / 'state'
    proposal_file = AUDIT / 'u2-triage-reconciled.json'
    proposal = json.loads(proposal_file.read_text())
    assert proposal['source'] == context['source']
    assert proposal['authorization_id'] == context['answered']['authorization_id']
    assert proposal['decision_refs'] == context['answered']['decision_refs']
    assert proposal['expected_revision'] == 2
    ready = cli(state, 'prepare', str(proposal_file))
    assert ready['id'] == context['pending']['id'] and ready['revision'] == 3
    assert ready['preparation'] == 'ready-for-agent' and ready['brief']['acceptance']
    assert ready['answers'] == context['answered']['answers']
    assert ready == cli(state, 'show', ready['id'])
    assert cli(state, 'prepare', str(proposal_file)) == ready
    with closing(sqlite3.connect(state / 'isswf.sqlite3')) as database:
        history = [json.loads(row[0]) for row in database.execute('SELECT snapshot FROM history WHERE work_id=? ORDER BY revision', (ready['id'],))]
    assert history == [context['pending'], context['answered'], ready]
    existing = json.loads((AUDIT / 'u2-triage-existing.json').read_text())
    assert existing['source']['repo'] == 'factory/isswf-demo' and existing['source']['number'] == 18
    assert existing['preparation'] == 'needs-triage' and existing['resolution']['kind'] == 'already-present'
    assert existing['brief']['objective'] == 'Comprobar si el panel muestra la revisión local.'
    assert existing['brief']['scope'] == 'Contrastar la visualización de la revisión local sin implementar cambios.'
    assert existing['resolution']['evidence']
    authorization = {'repo': 'factory/isswf-demo', 'issue': 18, 'objective': existing['brief']['objective'], 'scope': existing['brief']['scope'], 'actor': 'fixture-operator', 'decision': 'Contrastar fixture local, sin implementación.'}
    auth_file = Path(context['directory']) / 'existing-auth.json'
    save(auth_file, authorization)
    existing['authorization_id'] = cli(state, 'authorize', str(auth_file))['id']
    existing_file = Path(context['directory']) / 'existing.json'
    save(existing_file, existing)
    resolved = cli(state, 'prepare', str(existing_file))
    assert resolved['resolution'] == existing['resolution'] and resolved['execution'] == 'no disponible en S01'
    technical_state = Path(context['directory']) / 'technical-state'
    technical = json.loads((tree / 'examples/u2/grounding-proposal.json').read_text())
    technical['authorization_id'] = cli(technical_state, 'authorize', str(tree / 'examples/u1/authorization.json'))['id']
    technical_file = Path(context['directory']) / 'technical.json'
    save(technical_file, technical)
    grounding = cli(technical_state, 'prepare', str(technical_file))
    assert grounding['preparation'] == 'ready-for-agent' and not grounding['questions'] and grounding['resolution'] is None
    records = ['model-ambiguous-proposal-persisted', 'trusted-answer-not-auto-ready', 'fresh-model-retriage', 'same-work-three-revisions-and-history', 'replay-no-new-revision', 'existing-behavior-grounded-by-source-not-fake-delivery', 'unverified-suspicion-to-grounding-not-human-interview']
    server = subprocess.Popen([sys.executable, '-u', '-m', 'isswf', '--state', str(state), 'serve', '--port', '0'], cwd=tree, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        with selectors.DefaultSelector() as selector:
            selector.register(server.stdout, selectors.EVENT_READ)
            assert selector.select(10)
            line = server.stdout.readline()
        port = int(re.search(r'http://127\.0\.0\.1:(\d+)/', line).group(1))
        base = f'http://127.0.0.1:{port}'
        with urllib.request.urlopen(base + '/api/work/' + ready['id'], timeout=5) as response:
            assert json.loads(response.read()) == ready
            assert response.headers['Content-Security-Policy']
        with urllib.request.urlopen(base + '/work/' + ready['id'], timeout=5) as response:
            page = response.read().decode()
            assert 'Respuestas registradas' in page and 'fixture-operator' in page
            assert context['answered']['answers'][0]['text'] in page
            assert 'no disponible en S01' in page
        with closing(http.client.HTTPConnection('127.0.0.1', port, timeout=5)) as connection:
            connection.request('POST', '/')
            with connection.getresponse() as response:
                assert response.status == 405
                response.read()
        records += ['HTTP-same-snapshot', 'human-answer-visible', 'HTTP-readonly']
        with tempfile.TemporaryDirectory(prefix='isswf-u2-browser-') as profile:
            run = subprocess.run(['chromium', '--headless', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--disable-extensions', '--no-first-run', '--no-default-browser-check', '--disable-component-update', '--user-data-dir=' + profile, '--window-size=1440,1800', '--screenshot=' + str(AUDIT / 'u2-panel.png'), base + '/work/' + ready['id']], capture_output=True, text=True, timeout=40)
            (AUDIT / 'u2-browser.stderr').write_text(run.stderr)
            assert run.returncode == 0, run.stderr[-1500:]
            assert (AUDIT / 'u2-panel.png').read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
        records.append('real-browser-screenshot')
    finally:
        server.terminate()
        try:
            server.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
            server.communicate(timeout=5)
        assert server.poll() is not None
    records.append('panel-process-stopped')
    save(AUDIT / 'u2-live.json', {'scope': 'Fictitious local issues; real CLI/SQLite/HTTP/browser and source-grounded existing panel behavior; no GitHub or worker. Technical suspicion uses canonical example, not a separate model generation.', 'checks': records, 'snapshot': ready, 'existing': resolved, 'grounding': grounding})
    print(f'PASS: {len(records)} live checks; actual model retriage and browser; server stopped')
