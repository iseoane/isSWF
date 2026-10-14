#!/usr/bin/env python3
import ctypes
import json
import os
from pathlib import Path
import shlex
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
import uuid

SCRIPT = str(Path(__file__).resolve())
BOOT = Path('/proc/sys/kernel/random/boot_id').read_text().strip()
PI = shutil.which('pi')
ROLES = ('pi', 'shell', 'writer', 'escaped', 'sacrificial')
EXITED = ('absent', 'zombie')


def emit(event, **data):
    print(json.dumps(dict(event=event, **data), sort_keys=True), flush=True)


def save(path, value):
    temporary = path.with_suffix('.new')
    temporary.write_text(json.dumps(value))
    temporary.replace(path)


def load(path):
    return json.loads(path.read_text())


def proc(pid):
    text = Path(f'/proc/{pid}/stat').read_text()
    fields = text[text.rfind(')') + 2:].split()
    return dict(boot_id=BOOT, pid=pid, starttime=int(fields[19])), fields[0], int(fields[1])


def identity(pid):
    return dict(proc(pid)[0], nonce=uuid.uuid4().hex)


def inspect(expected):
    try:
        actual, state, parent = proc(expected['pid'])
    except FileNotFoundError:
        return dict(condition='absent' if expected.get('boot_id') == BOOT else 'mismatch')
    except (OSError, KeyError, TypeError, ValueError) as error:
        return dict(condition='unknown', reason=repr(error))
    matched = all(expected.get(k) == actual[k] for k in ('boot_id', 'pid', 'starttime'))
    return dict(condition=('zombie' if state == 'Z' else 'live') if matched else 'mismatch',
                actual=actual, linux_state=state, ppid=parent)


def send_signal(expected, sig):
    try:
        fd = os.pidfd_open(expected['pid'])
    except ProcessLookupError:
        return dict(signal=None, **inspect(expected))
    except (OSError, KeyError, TypeError, ValueError) as error:
        return dict(signal=None, condition='unknown', reason=repr(error))
    try:
        observed = inspect(expected)
        if observed['condition'] != 'live':
            return dict(signal=None, **observed)
        try:
            signal.pidfd_send_signal(fd, sig)
        except ProcessLookupError:
            return dict(signal=None, **inspect(expected))
        return dict(signal=signal.Signals(sig).name, **observed)
    finally:
        os.close(fd)


def count(root, role):
    path = root / f'{role}.heartbeat'
    return len(path.read_bytes().splitlines()) if path.exists() else 0


def snapshot(root, journal):
    return dict(state=journal['state'], reserved=journal['state'] != 'stopped',
                deadline=journal.get('deadline'), remaining=round(journal.get('deadline', 0) - time.monotonic(), 3),
                identities=journal['identities'], processes={k: inspect(v) for k, v in journal['identities'].items()},
                heartbeats={k: count(root, k) for k in ('writer', 'escaped', 'sacrificial')})


def wait_for(predicate, seconds=5):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        result = predicate()
        if result:
            return result
        time.sleep(.05)
    raise TimeoutError('physical observation deadline exceeded')


def timely(journal):
    assert time.monotonic() < journal['deadline'] - 5, 'expiry too near; requested stop NOT confirmed'


def clean_identities(identities):
    actions = {k: send_signal(v, signal.SIGTERM) for k, v in identities.items()}
    time.sleep(.3)
    for k, value in identities.items():
        if inspect(value)['condition'] == 'live':
            actions[k] = send_signal(value, signal.SIGKILL)
    wait_for(lambda: all(inspect(v)['condition'] != 'live' for v in identities.values()), 3)
    return actions


def reconcile(root):
    journal = load(root / 'journal.json')
    journal['state'] = 'uncertain'
    save(root / 'journal.json', journal)
    before = snapshot(root, journal)
    timely(journal)
    actions = clean_identities(journal['identities'])
    first = snapshot(root, journal)
    time.sleep(.5)
    after = snapshot(root, journal)
    timely(journal)
    stopped = all(v['condition'] in EXITED for v in after['processes'].values())
    journal['state'] = 'stopped' if stopped and first['heartbeats'] == after['heartbeats'] else 'uncertain'
    save(root / 'journal.json', journal)
    return dict(before=before, signals=actions, after=snapshot(root, journal), relaunch=False,
                recovered_pipes=False, expiry_not_stop_confirmation=True)


def writer(root, role, escaped=False):
    journal = load(root / 'journal.json')
    mine = identity(os.getpid())
    save(root / f'{role}.identity.json', mine)
    child = None
    if role == 'writer':
        save(root / 'shell.identity.json', identity(os.getppid()))
    if escaped:
        child = subprocess.Popen([sys.executable, '-I', SCRIPT, '--writer', str(root), 'escaped'],
                                 start_new_session=True, stdin=subprocess.DEVNULL,
                                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_for(lambda: (root / 'escaped.identity.json').exists())
    try:
        with (root / f'{role}.heartbeat').open('a', buffering=1) as output:
            while time.monotonic() < journal['deadline']:
                output.write(f'{mine["nonce"]} {time.monotonic():.6f}\n')
                time.sleep(.1)
        save(root / f'{role}.expired.json', dict(reason='insurance expiry', deadline=journal['deadline']))
    finally:
        if child is not None:
            clean_identities({'escaped': load(root / 'escaped.identity.json')})
            child.wait(timeout=3)


def environment(root):
    env = dict(PATH=os.environ['PATH'], LANG='C.UTF-8', HOME=str(root / 'home'),
               TMPDIR=str(root), XDG_CONFIG_HOME=str(root / 'config'), XDG_CACHE_HOME=str(root / 'cache'),
               XDG_DATA_HOME=str(root / 'data'), PI_CODING_AGENT_DIR=str(root / 'agent'),
               PI_OFFLINE='1', PI_SKIP_VERSION_CHECK='1', PI_TELEMETRY='0')
    (root / 'home').mkdir(exist_ok=True)
    return env


class RPC:
    def __init__(self, root):
        self.errors = (root / 'pi.stderr').open('wb')
        self.process = subprocess.Popen([PI, '--mode', 'rpc', '--offline', '--no-extensions', '--no-mcp',
            '--no-skills', '--no-prompt-templates', '--no-themes', '--no-context-files', '--no-approve',
            '--tools', 'read,grep,find,ls', '--no-session', '--model', 'openai-codex/gpt-6.1-sol', '--thinking', 'high'],
            cwd=root, env=environment(root), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=self.errors, start_new_session=True)
        self.expected = identity(self.process.pid)
        self.responses = {}
        self.condition = threading.Condition()
        self.counter = 0
        self.eof = False
        self.thread = threading.Thread(target=self.drain, daemon=True)
        self.thread.start()

    def drain(self):
        try:
            for line in self.process.stdout:
                record = json.loads(line)
                if record.get('type') == 'response':
                    with self.condition:
                        self.responses[record.get('id')] = record
                        self.condition.notify_all()
        finally:
            with self.condition:
                self.eof = True
                self.condition.notify_all()

    def request(self, kind, wait=True, **args):
        self.counter += 1
        key = str(self.counter)
        self.process.stdin.write(json.dumps(dict(id=key, type=kind, **args)).encode() + b'\n')
        self.process.stdin.flush()
        if not wait:
            return key
        with self.condition:
            if not self.condition.wait_for(lambda: key in self.responses or self.eof, timeout=5):
                raise TimeoutError(kind)
            response = self.responses.pop(key, None)
        assert response and response['success'], response
        return response

    def close(self):
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        finally:
            if self.process.poll() is None:
                clean_identities({'pi': self.expected})
                self.process.wait(timeout=3)
            self.thread.join(timeout=2)
            self.process.stdout.close()
            self.errors.close()


def owner(root, recovery):
    if recovery:
        emit('recovery', **reconcile(root))
        return
    journal = load(root / 'journal.json')
    save(root / 'owner.identity.json', identity(os.getpid()))
    rpc = None
    finished = False
    try:
        rpc = RPC(root)
        journal['identities']['pi'] = rpc.expected
        save(root / 'journal.json', journal)
        rpc.request('get_state')
        with socket.socket(socket.AF_UNIX) as server:
            server.bind(str(root / 'control.sock'))
            server.listen(2)
            server.settimeout(1)
            end = time.monotonic() + 35
            while time.monotonic() < end:
                try:
                    connection, _ = server.accept()
                except TimeoutError:
                    continue
                with connection:
                    connection.settimeout(6)
                    message = connection.makefile('rb').readline(1024)
                    request = json.loads(message)
                    assert set(request) == {'op'} and request['op'] in ('start', 'status', 'stop'), 'no RPC passthrough'
                    if request['op'] == 'start':
                        assert journal['state'] == 'reserved', 'reservation blocks another writer'
                        journal.update(state='active', deadline=time.monotonic() + 28)
                        save(root / 'journal.json', journal)
                        escape = journal['variant'].startswith('escape')
                        argv = [sys.executable, '-I', SCRIPT, '--writer', str(root), 'writer'] + (['escape'] if escape else [])
                        rpc.request('bash', wait=False, command=shlex.join(argv) + '; :')
                        expected_roles = ('shell', 'writer', 'escaped') if escape else ('shell', 'writer')
                        wait_for(lambda: all((root / f'{k}.identity.json').exists() and count(root, 'writer') > 1 for k in expected_roles))
                        journal['identities'].update({k: load(root / f'{k}.identity.json') for k in expected_roles})
                        save(root / 'journal.json', journal)
                    result = snapshot(root, journal)
                    result['isStreaming_not_authority'] = rpc.request('get_state')['data']['isStreaming']
                    if request['op'] == 'stop':
                        timely(journal)
                        journal['state'] = 'stop_requested'
                        save(root / 'journal.json', journal)
                        ack = rpc.request('abort_bash')
                        time.sleep(.5)
                        abort = snapshot(root, journal)
                        if journal['variant'] == 'normal':
                            assert all(abort['processes'][k]['condition'] in EXITED for k in ('shell', 'writer')), 'abort did not stop ordinary writer before EOF'
                        rpc.close()
                        eof = snapshot(root, journal)
                        time.sleep(.5)
                        after = snapshot(root, journal)
                        timely(journal)
                        stopped = all(v['condition'] in EXITED for v in after['processes'].values())
                        journal['state'] = 'stopped' if stopped and eof['heartbeats'] == after['heartbeats'] else 'uncertain'
                        save(root / 'journal.json', journal)
                        result = dict(ack_not_proof=ack['success'], after_abort=abort, after_eof=eof,
                                      after_wait=snapshot(root, journal), pi_returncode=rpc.process.returncode)
                        finished = True
                    connection.sendall(json.dumps(result).encode() + b'\n')
                if finished:
                    return
            raise TimeoutError('owner insurance deadline')
    finally:
        if not finished:
            originals = dict(journal['identities'])
            for k in ('shell', 'writer', 'escaped'):
                if (root / f'{k}.identity.json').exists():
                    originals[k] = load(root / f'{k}.identity.json')
            clean_identities(originals)
            if rpc:
                rpc.close()


def client(root, operation):
    with socket.socket(socket.AF_UNIX) as connection:
        connection.settimeout(12)
        connection.connect(str(root / 'control.sock'))
        connection.sendall(json.dumps(dict(op=operation)).encode() + b'\n')
        print(connection.makefile('rb').readline(65536).decode().strip(), flush=True)


def child_process(root, *args):
    process = subprocess.Popen([sys.executable, '-I', SCRIPT, *args], cwd=root, env=environment(root),
                               stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return process, identity(process.pid)


def collect(process, expected, seconds=12):
    try:
        out, err = process.communicate(timeout=seconds)
    except subprocess.TimeoutExpired:
        send_signal(expected, signal.SIGKILL)
        out, err = process.communicate(timeout=3)
        raise TimeoutError(f'child timed out: {err.decode()}')
    assert process.returncode == 0, err.decode()
    return json.loads(out)


def owned_tree():
    found, pending = {}, [identity(os.getpid())]
    while pending:
        parent = pending.pop()
        if inspect(parent)['condition'] != 'live':
            continue
        for path in Path(f'/proc/{parent["pid"]}/task').glob('*/children'):
            try:
                pids = path.read_text().split()
            except FileNotFoundError:
                continue
            for pid in map(int, pids):
                try:
                    actual, _, ppid = proc(pid)
                except FileNotFoundError:
                    continue
                if ppid == parent['pid'] and pid not in found:
                    found[pid] = dict(actual, nonce=uuid.uuid4().hex)
                    pending.append(found[pid])
    return found


def run_case(variant):
    with tempfile.TemporaryDirectory(prefix=f'isswf-lifecycle-{variant}-') as directory:
        root = Path(directory)
        save(root / 'journal.json', dict(variant=variant, state='reserved', identities={}))
        owner_process, owner_id = child_process(root, '--owner', str(root))
        children = [(owner_process, owner_id)]
        originals = {}
        def call(operation):
            process, expected = child_process(root, '--client', str(root), operation)
            children.append((process, expected))
            result = collect(process, expected)
            emit('client_exited', case=variant, op=operation, identity=expected, returncode=process.returncode, observation=result)
            return result
        def recover():
            process, expected = child_process(root, '--owner', str(root), 'recover')
            children.append((process, expected))
            result = collect(process, expected)
            emit('restarted_owner', case=variant, identity=expected, observation=result)
            return result['after']
        try:
            wait_for(lambda: (root / 'control.sock').exists())
            first = call('start')
            originals = dict(first['identities'])
            time.sleep(.6)
            second = call('status')
            assert first['identities'] == second['identities'], 'identity changed across client exit'
            assert all(v['condition'] == 'live' for v in second['processes'].values()), 'work did not continue'
            for role in ('writer', 'escaped') if variant.startswith('escape') else ('writer',):
                assert second['heartbeats'][role] > first['heartbeats'][role], f'{role} heartbeat did not grow'
            timely(load(root / 'journal.json'))
            if variant in ('normal', 'escape-abort'):
                result = call('stop')
                owner_process.communicate(timeout=3)
                assert owner_process.returncode == 0
                if variant == 'normal':
                    assert result['after_wait']['state'] == 'stopped' and result['pi_returncode'] == 0, 'ordinary stop unconfirmed'
                else:
                    emit('escaped_abort_survival', after_abort=result['after_abort']['processes']['escaped'],
                         after_eof=result['after_eof']['processes']['escaped'])
                    assert recover()['state'] == 'stopped', 'escaped reconciliation unconfirmed'
            else:
                if variant == 'mismatch':
                    process, expected = child_process(root, '--writer', str(root), 'sacrificial')
                    children.append((process, expected))
                    wait_for(lambda: count(root, 'sacrificial') > 1)
                    originals['sacrificial'] = load(root / 'sacrificial.identity.json')
                    journal = load(root / 'journal.json')
                    journal['identities']['sacrificial'] = originals['sacrificial']
                    save(root / 'journal.json', journal)
                active = snapshot(root, load(root / 'journal.json'))
                timely(load(root / 'journal.json'))
                assert all(v['condition'] == 'live' for v in active['processes'].values()), 'owner crash was not during active work'
                emit('owner_sigkill', case=variant, identity=owner_id, observation=active)
                assert send_signal(owner_id, signal.SIGKILL)['signal'] == 'SIGKILL'
                owner_process.communicate(timeout=3)
                time.sleep(.6)
                journal = load(root / 'journal.json')
                journal['state'] = 'uncertain'
                save(root / 'journal.json', journal)
                before = snapshot(root, journal)
                time.sleep(.4)
                emit('after_crash_EOF', case=variant, before=before, after=snapshot(root, journal),
                     continuation_claim=False, pipes_recoverable=False)
                if variant == 'mismatch':
                    assert inspect(originals['sacrificial'])['condition'] == 'live', 'sacrificial writer died before mismatch trial'
                    journal['identities']['sacrificial']['starttime'] += 1
                    save(root / 'journal.json', journal)
                    blocked = recover()
                    assert blocked['state'] == 'uncertain' and blocked['reserved'], 'mismatch released reservation'
                    assert inspect(originals['sacrificial'])['condition'] == 'live', 'mismatch signalled writer'
                    old_count = count(root, 'sacrificial')
                    time.sleep(.3)
                    assert count(root, 'sacrificial') > old_count, 'mismatch writer not still writing'
                    emit('explicit_correct_identity_cleanup', identity=originals['sacrificial'],
                         signal=send_signal(originals['sacrificial'], signal.SIGTERM))
                    journal = load(root / 'journal.json')
                    journal['identities']['sacrificial'] = originals['sacrificial']
                    save(root / 'journal.json', journal)
                assert recover()['state'] == 'stopped', 'recovery did not reach stopped-safe'
            emit('case_confirmed', case=variant, outcome=load(root / 'journal.json')['state'],
                 stop_margin_seconds=round(load(root / 'journal.json')['deadline'] - time.monotonic(), 3))
        finally:
            extras = owned_tree()
            for process, expected in children:
                if process.poll() is None:
                    send_signal(expected, signal.SIGKILL)
                process.communicate(timeout=3)
            for k in ROLES:
                if (root / f'{k}.identity.json').exists():
                    originals[k] = load(root / f'{k}.identity.json')
            if (root / 'journal.json').exists():
                originals = {**load(root / 'journal.json')['identities'], **originals}
            known_pids = {v['pid'] for v in originals.values()}
            originals.update({f'owned-{pid}': value for pid, value in extras.items() if pid not in known_pids})
            actions = clean_identities(originals)
            while True:
                try:
                    pid, _ = os.waitpid(-1, os.WNOHANG)
                except ChildProcessError:
                    break
                if not pid:
                    break
            remaining = {k: inspect(v) for k, v in originals.items()}
            emit('cleanup', case=variant, signals=actions, remaining=remaining,
                 direct_children_reaped=True, zombies_are_exited_nonwriters=True)
            assert all(v['condition'] == 'absent' for v in remaining.values()), 'cleanup left a process entry'


def main():
    if sys.argv[1] == '--writer':
        writer(Path(sys.argv[2]), sys.argv[3], len(sys.argv) == 5)
    elif sys.argv[1] == '--owner':
        owner(Path(sys.argv[2]), len(sys.argv) == 4)
    elif sys.argv[1] == '--client':
        client(Path(sys.argv[2]), sys.argv[3])
    else:
        assert len(sys.argv) == 2 and sys.argv[1] in ('normal', 'crash', 'escape', 'mismatch', 'all'), 'normal|crash|escape|mismatch|all'
        libc = ctypes.CDLL(None, use_errno=True)
        assert libc.prctl(36, 1, 0, 0, 0) == 0, 'subreaper unavailable'
        assert PI and hasattr(os, 'pidfd_open') and hasattr(signal, 'pidfd_send_signal')
        emit('scope', sameUID=True, sandbox=False, authentication=False, model_prompts=False,
             network=False, scratch_journal_only=True, production_durability=False,
             zombie_definition='exited, cannot write; adopted children reaped', expiry_seconds=28, minimum_stop_margin_seconds=5)
        cases = ['normal', 'crash', 'escape-abort', 'escape-crash', 'mismatch'] if sys.argv[1] == 'all' else (['escape-abort', 'escape-crash'] if sys.argv[1] == 'escape' else [sys.argv[1]])
        for case in cases:
            run_case(case)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        emit('failure', error=repr(error))
        raise
