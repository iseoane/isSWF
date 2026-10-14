#!/usr/bin/env python3
import http.client
from contextlib import closing
import json
import re
import selectors
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIT = ROOT / '.audit'
context = json.loads((AUDIT / 'u1-triage-context.json').read_text())
historical_proposal = json.loads((AUDIT / 'u1-triage-proposal.json').read_text())
proposal = json.loads((ROOT / 'examples/u1/proposal.json').read_text())
proposal.update(historical_proposal)
assert set(proposal) == set(json.loads((ROOT / 'examples/u1/proposal.json').read_text()))
assert context['fixture'] is True
assert proposal['authorization_id'] == context['authorization_id']
temporary_state = tempfile.mkdtemp(prefix='isswf-u1-repeat-')
state = str(Path(temporary_state) / 'state')
command = [sys.executable, '-u', '-m', 'isswf', '--state', state]


def cli(*arguments):
    result = subprocess.run(command + list(arguments), cwd=ROOT, text=True,
                            capture_output=True, timeout=10, check=True)
    return json.loads(result.stdout)


def request(url, headers=None):
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=5) as response:
        return response.read(), dict(response.headers)


fixture = json.loads((ROOT / 'examples/u1/authorization.json').read_text())
assert all(fixture[key] == context[key] for key in ('repo', 'issue', 'objective', 'scope'))
grant = cli('authorize', str(ROOT / 'examples/u1/authorization.json'))
proposal['authorization_id'] = grant['id']
proposal_file = Path(temporary_state) / 'proposal.json'
proposal_file.write_text(json.dumps(proposal, ensure_ascii=False))
snapshot = cli('prepare', str(proposal_file))
assert snapshot == cli('show', snapshot['id'])
assert snapshot['revision'] == 1
assert snapshot['brief']['acceptance']
assert snapshot['execution'] == 'no disponible en S01'
assert 'body' not in snapshot['source']
server = subprocess.Popen(command + ['serve', '--port', '0'], cwd=ROOT,
                          text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
records = []
try:
    with selectors.DefaultSelector() as selector:
        selector.register(server.stdout, selectors.EVENT_READ)
        assert selector.select(timeout=10), 'Panel did not announce its address'
        line = server.stdout.readline()
    found = re.search(r'http://127\.0\.0\.1:(\d+)/', line)
    assert found, line
    port = int(found.group(1))
    base = f'http://127.0.0.1:{port}'
    api, headers = request(base + '/api/work/' + snapshot['id'])
    assert json.loads(api) == snapshot
    page, _ = request(base + '/work/' + snapshot['id'])
    text = page.decode()
    assert snapshot['next_step'] in text
    assert snapshot['brief']['risks'][0] in text
    assert 'Content-Security-Policy' in headers
    records.append({'case': 'CLI-and-HTTP-same-snapshot', 'passed': True,
                    'id': snapshot['id'], 'revision': snapshot['revision']})
    for path, extra, expected in [('/isswf.sqlite3', {}, 404),
                                   ('/', {'Host': 'evil.example'}, 400),
                                   ('/', {'Origin': 'http://evil.example'}, 403),
                                   ('/', {'Origin': 'http://['}, 403),
                                   ('/', {'Sec-Fetch-Site': 'cross-site'}, 403)]:
        try:
            request(base + path, extra)
            raise AssertionError(f'Allowed rejected case: {path}, {extra}')
        except urllib.error.HTTPError as error:
            with error:
                assert error.code == expected, (extra, error.code)
        records.append({'case': 'HTTP-rejection', 'path': path,
                        'headers': extra, 'status': expected, 'passed': True})
    with closing(http.client.HTTPConnection('127.0.0.1', port, timeout=5)) as connection:
        connection.request('POST', '/')
        with connection.getresponse() as response:
            assert response.status == 405
            response.read()
    records.append({'case': 'no-HTTP-write-method', 'passed': True})
    with tempfile.TemporaryDirectory(prefix='isswf-browser-') as profile:
        browser = subprocess.run(['chromium', '--headless', '--disable-gpu',
            '--disable-background-networking', '--disable-sync', '--disable-extensions',
            '--no-first-run', '--no-default-browser-check', '--disable-component-update',
            '--user-data-dir=' + profile, '--window-size=1440,1200',
            '--screenshot=' + str(AUDIT / 'u1-panel.png'), base],
            text=True, capture_output=True, timeout=40)
        (AUDIT / 'u1-browser.stderr').write_text(browser.stderr)
        assert browser.returncode == 0, browser.stderr[-1500:]
        image = AUDIT / 'u1-panel.png'
        assert image.read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
        records.append({'case': 'real-browser-screenshot', 'passed': True,
                        'artifact': '.audit/u1-panel.png'})
finally:
    server.terminate()
    try:
        server.communicate(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()
        server.communicate(timeout=5)
    assert server.poll() is not None
    records.append({'case': 'panel-process-stopped', 'passed': True})
    shutil.rmtree(temporary_state)
(AUDIT / 'u1-live.json').write_text(json.dumps({'scope': 'Fictitious issue, real CLI/HTTP/browser; no GitHub, worker or client code. Original model proposal rebound by operator test to a fresh equivalent fictitious preparation grant for repeatability.',
    'snapshot': snapshot, 'checks': records}, ensure_ascii=False, indent=2) + '\n')
print(f'PASS: {len(records)} live checks; generated triage proposal persisted; CLI/HTTP same revision; screenshot captured; panel stopped')
