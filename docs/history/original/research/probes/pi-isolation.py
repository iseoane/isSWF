#!/usr/bin/env python3
import contextlib
import ctypes
import errno
import hashlib
import json
import os
from pathlib import Path
import queue
import resource
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
NODE = '/home/iseoane/.local/share/mise/installs/node/26.8.1/bin/node'
MODULES = '/home/iseoane/.pi/agent/install/releases/1.2.0/node_modules'
CLI = '/runtime/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js'
BOOT = Path('/proc/sys/kernel/random/boot_id').read_text().strip()
PY = '/usr/bin/python'
DENIED = {errno.ENOENT}


def emit(event, **data):
    print(json.dumps(dict(event=event, **data), sort_keys=True), flush=True)


def check(ok, **evidence):
    emit('check', passed=bool(ok), **evidence)
    if not ok:
        raise AssertionError(evidence)


def identity(pid):
    text = Path(f'/proc/{pid}/stat').read_text()
    fields = text[text.rfind(')') + 2:].split()
    return dict(boot_id=BOOT, pid=pid, starttime=int(fields[19])), fields[0], int(fields[1])


def condition(expected):
    try:
        actual, state, _ = identity(expected['pid'])
    except FileNotFoundError:
        return 'absent'
    if actual != expected:
        return 'mismatch'
    return 'zombie' if state == 'Z' else 'live'


def send(expected, sig):
    try:
        fd = os.pidfd_open(expected['pid'])
    except ProcessLookupError:
        return
    try:
        state = condition(expected)
        if state in ('absent', 'zombie'):
            return
        if state != 'live':
            raise RuntimeError(('identity mismatch', expected))
        signal.pidfd_send_signal(fd, sig)
        emit('signal', identity=expected, signal=signal.Signals(sig).name)
    finally:
        os.close(fd)


def descendants(root_pid=None):
    found, pending = {}, [os.getpid() if root_pid is None else root_pid]
    while pending:
        pid = pending.pop()
        for path in Path(f'/proc/{pid}/task').glob('*/children'):
            try:
                children = list(map(int, path.read_text().split()))
            except FileNotFoundError:
                continue
            for child in children:
                try:
                    ident, state, parent = identity(child)
                except FileNotFoundError:
                    continue
                if parent == pid and child not in found:
                    found[child] = ident
                    pending.append(child)
    return found


def reap():
    while True:
        try:
            pid, _ = os.waitpid(-1, os.WNOHANG)
        except ChildProcessError:
            return
        if not pid:
            return


def wait_for(predicate, timeout=5):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        value = predicate()
        if value:
            return value
        time.sleep(.05)
    raise TimeoutError('bounded wait expired')


def limits():
    for kind, value in ((resource.RLIMIT_FSIZE, 4 * 1024 * 1024),
                        (resource.RLIMIT_NOFILE, 128), (resource.RLIMIT_CORE, 0),
                        (resource.RLIMIT_CPU, 20), (resource.RLIMIT_AS, 128 * 1024**3)):
        resource.setrlimit(kind, (value, value))


def clean_env(home):
    return dict(HOME=str(home), PATH='/usr/bin:/bin', PWD='/work', LANG='C.UTF-8',
                PYTHONDONTWRITEBYTECODE='1')


def sandbox(work, scratch, profile, command, pi=False):
    argv = ['/usr/bin/bwrap', '--unshare-user', '--unshare-pid', '--unshare-net',
            '--unshare-ipc', '--unshare-uts', '--new-session', '--die-with-parent',
            '--cap-drop', 'ALL', '--clearenv', '--ro-bind', '/usr', '/usr',
            '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64',
            '--symlink', 'usr/bin', '/bin', '--proc', '/proc', '--dev', '/dev',
            '--size', str(16 * 1024**2), '--tmpfs', '/tmp', '--dir', '/tmp/home',
            '--ro-bind', SCRIPT, '/isolation.py',
            '--ro-bind' if profile == 'reviewer' else '--bind', str(work), '/work',
            '--bind', str(scratch), '/scratch', '--chdir', '/work']
    for key, value in clean_env('/tmp/home').items():
        argv += ['--setenv', key, value]
    if pi:
        argv += ['--ro-bind', NODE, '/runtime/node', '--ro-bind', MODULES, '/runtime/node_modules']
    return argv + ['--remount-ro', '/', '--'] + command


@contextlib.contextmanager
def fixture():
    with tempfile.TemporaryDirectory(prefix='isswf-isolation-case-') as directory:
        root = Path(directory)
        work, scratch, private = (root / name for name in ('work', 'scratch', 'private'))
        for path in (work, scratch, private, private / 'fakehome', private / 'directory'):
            path.mkdir()
        token = 'FAKE-CREDENTIAL-' + uuid.uuid4().hex
        paths = [private / 'external', private / 'fakehome' / 'credentials',
                 private / 'journal', private / 'directory' / 'entry']
        for path in paths:
            path.write_text(token)
        (work / 'candidate.py').write_text('def total(values):\n    return sum(values)\n\nif __name__ == "__main__":\n    assert total([2, 3, 5]) == 10\n    print(total([2, 3, 5]))\n')
        (work / 'absolute').symlink_to(paths[0])
        (work / 'relative').symlink_to('../private/external')
        (work / 'aliasdir').symlink_to('.')
        for operation in ('write', 'delete', 'chmod'):
            for alias in ('direct', 'alias'):
                (work / f'{operation}-{alias}.py').write_text('original\n')
        fs, abstract, tcp = (socket.socket(socket.AF_UNIX), socket.socket(socket.AF_UNIX),
                             socket.socket(socket.AF_INET))
        sockets = (fs, abstract, tcp)
        fd = None
        try:
            fs.bind(str(private / 'authority.sock'))
            abstract_name = '\0isswf-' + uuid.uuid4().hex
            abstract.bind(abstract_name)
            tcp.bind(('127.0.0.1', 0))
            for server in sockets:
                server.listen(16)
            fd = os.open(paths[0], os.O_RDONLY)
            os.dup2(fd, 77, inheritable=True)
            spec = dict(paths=list(map(str, paths)), token=token, fd=77,
                        host_pid=os.getpid(), fs=str(private / 'authority.sock'),
                        abstract=abstract_name, port=tcp.getsockname()[1],
                        supervisor_root=f'/proc/{os.getpid()}/root{paths[0]}')
            yield root, work, scratch, spec
        finally:
            for server in sockets:
                server.close()
            if fd is not None:
                os.close(fd)
            with contextlib.suppress(OSError):
                os.close(77)


def hashes(work):
    return {str(p.relative_to(work)): [hashlib.sha256(p.read_bytes()).hexdigest(),
                                      p.stat().st_mode & 0o777]
            for p in work.rglob('*.py') if not p.is_symlink()}


def payload_probe(profile, work, scratch, spec):
    work, scratch = Path(work), Path(scratch)
    isolated = profile != 'baseline'
    cases = []
    def case(name, operation, expected, denied=None):
        try:
            actual = operation()
        except OSError as error:
            actual = dict(errno=error.errno)
            ok = denied is not None and error.errno in denied
        else:
            ok = denied is None and actual == expected
        cases.append(dict(operation=name, passed=ok, actual=actual,
                          expected_errno=sorted(denied) if denied is not None else [], expected=expected))
    def read(path):
        return Path(path).read_text()
    hidden = DENIED if isolated else None
    write_value = spec['token'] if not isolated else 'controlled-write'
    for index, path in enumerate(spec['paths']):
        case(f'private-path-{index}', lambda p=path: read(p), spec['token'], hidden)
        case(f'private-write-{index}', lambda p=path: Path(p).write_text(write_value),
             len(write_value), hidden)
    for name in ('absolute', 'relative'):
        case(f'outside-symlink-{name}', lambda n=name: read(work / n), spec['token'], hidden)
        case(f'outside-symlink-write-{name}', lambda n=name: (work / n).write_text(write_value),
             len(write_value), hidden)
    case('self-proc-root-private', lambda: read('/proc/self/root' + spec['paths'][0]),
         spec['token'], hidden)
    case('simulated-supervisor-root', lambda: read(spec['supervisor_root']),
         spec['token'], hidden)
    case('host-pid-stat', lambda: bool(read(f'/proc/{spec["host_pid"]}/stat')),
         True, hidden)
    case('own-proc', lambda: Path('/proc/self/stat').is_file(), True)
    case('fake-environment', lambda: os.environ.get('FAKE_CREDENTIAL'), None if isolated else spec['token'])
    case('deliberate-file-fd', lambda: os.pread(spec['fd'], 256, 0).decode(),
         spec['token'], {errno.EBADF} if isolated else None)
    def connect(family, address):
        with socket.socket(family) as client:
            client.settimeout(1)
            client.connect(address)
        return True
    case('filesystem-authority', lambda: connect(socket.AF_UNIX, spec['fs']), True, hidden)
    case('abstract-authority', lambda: connect(socket.AF_UNIX, spec['abstract']), True,
         {errno.ECONNREFUSED} if isolated else None)
    case('tcp-canary', lambda: connect(socket.AF_INET, ('127.0.0.1', spec['port'])), True,
         {errno.ENETUNREACH, errno.ECONNREFUSED} if isolated else None)
    case('candidate-read', lambda: 'return sum(values)' in read(work / 'candidate.py'), True)
    for operation in ('write', 'delete', 'chmod'):
        for alias in ('direct', 'alias'):
            path = work / ('' if alias == 'direct' else 'aliasdir') / f'{operation}-{alias}.py'
            def mutate(p=path, op=operation):
                if op == 'write':
                    p.write_text('changed\n')
                    return p.read_text() == 'changed\n'
                if op == 'delete':
                    p.unlink()
                    return not p.exists()
                p.chmod(0o600)
                return p.stat().st_mode & 0o777 == 0o600
            case(f'candidate-{operation}-{alias}', mutate, True,
                 {errno.EROFS} if profile == 'reviewer' else None)
    case('scratch-write', lambda: (scratch / 'output').write_text('bounded') == 7, True)
    if profile != 'baseline':
        case('root-write', lambda: Path('/usr/isswf-probe').write_text('x'), False, {errno.EROFS})
    copy = scratch / 'candidate.py'
    shutil.copyfile(work / 'candidate.py', copy)
    build = subprocess.run([PY, '-m', 'py_compile', str(copy)], capture_output=True, timeout=3,
                           env={**os.environ, 'PYTHONPYCACHEPREFIX': str(scratch / 'build')}, close_fds=True)
    run = subprocess.run([PY, str(copy)], capture_output=True, timeout=3, close_fds=True)
    cases.append(dict(operation='scratch-build-and-behavior', passed=build.returncode == 0 and
                      run.returncode == 0 and run.stdout == b'10\n', build=build.returncode,
                      run=run.returncode, output=run.stdout.decode(), errors=build.stderr.decode()))
    print(json.dumps(dict(profile=profile, cases=cases, pid=os.getpid(),
                          control_fds='stdio only; no status FD used')), flush=True)


def permission_case(profile):
    with fixture() as (root, work, scratch, spec):
        before = hashes(work)
        check(not list(scratch.iterdir()) and all(p.stat().st_nlink == 1 for p in work.glob('*.py')),
              profile=profile, scratch_empty=True, candidate_no_hardlinks=True,
              arbitrary_projects_mount_sources='outside this experiment')
        command = [PY, SCRIPT if profile == 'baseline' else '/isolation.py', '_probe',
                   profile, str(work) if profile == 'baseline' else '/work',
                   str(scratch) if profile == 'baseline' else '/scratch',
                   json.dumps(spec if profile == 'baseline' else dict(spec, token=None))]
        check(profile == 'baseline' or spec['token'] not in json.dumps(command),
              profile=profile, credential_value_not_passed_to_sandbox=profile != 'baseline')
        env = clean_env(root / 'private' / 'fakehome')
        env['FAKE_CREDENTIAL'] = spec['token']
        result = subprocess.run(command if profile == 'baseline' else sandbox(work, scratch, profile, command),
                                cwd=work, env=env, close_fds=True,
                                pass_fds=(77,) if profile == 'baseline' else (),
                                capture_output=True, timeout=12, preexec_fn=limits)
        check(result.returncode == 0, profile=profile, startup_returncode=result.returncode,
              stderr=result.stderr.decode(), stdout=result.stdout.decode())
        report = json.loads(result.stdout)
        for record in report['cases']:
            check(record.pop('passed'), profile=profile, **record)
        if profile == 'reviewer':
            check(hashes(work) == before, profile=profile, original_hashes_unchanged=True,
                  before=before, after=hashes(work))
        emit('permissions-complete', profile=profile, observation=report['control_fds'])


def pi_case(profile):
    with fixture() as (root, work, scratch, spec):
        before = hashes(work)
        argv = ['/runtime/node', CLI, '--mode', 'rpc', '--offline', '--no-extensions', '--no-mcp',
                '--no-skills', '--no-prompt-templates', '--no-themes', '--no-context-files',
                '--no-approve', '--tools', 'read,grep,find,ls', '--no-session',
                '--model', 'openai-codex/gpt-6.1-sol', '--thinking', 'high']
        with (root / 'pi.stderr').open('wb') as errors:
            process = subprocess.Popen(sandbox(work, scratch, profile, argv, pi=True),
                                       stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=errors,
                                       env=clean_env('/tmp/home'), close_fds=True, preexec_fn=limits)
            expected = identity(process.pid)[0]
            responses = queue.Queue(maxsize=32)
            def drain():
                try:
                    for line in process.stdout:
                        if len(line) > 1024 * 1024:
                            raise ValueError('oversized RPC line')
                        responses.put(json.loads(line), timeout=1)
                except Exception as error:
                    responses.put(dict(drain_error=repr(error)), timeout=1)
                finally:
                    responses.put(None, timeout=1)
            thread = threading.Thread(target=drain, daemon=True)
            thread.start()
            def request(kind, **fields):
                key = uuid.uuid4().hex
                process.stdin.write((json.dumps(dict(type=kind, id=key, **fields)) + '\n').encode())
                process.stdin.flush()
                end = time.monotonic() + 12
                while time.monotonic() < end:
                    response = responses.get(timeout=max(.01, end - time.monotonic()))
                    if response is None or 'drain_error' in response:
                        raise RuntimeError(response)
                    if response.get('type') == 'response' and response.get('id') == key:
                        check(response.get('success'), profile=profile, rpc=kind, response=response)
                        return response
                raise TimeoutError(kind)
            try:
                request('get_state')
                command = shlex.join([PY, '/isolation.py', '_probe', profile, '/work', '/scratch', json.dumps(dict(spec, token=None))])
                check(spec['token'] not in command, profile=profile, credential_value_not_passed_to_bash=True)
                response = request('bash', command=command)
                data = response['data']
                check(data.get('exitCode') == 0, profile=profile, bash_result=data)
                report = json.loads(data['output'].strip())
                for record in report['cases']:
                    check(record.pop('passed'), profile=profile, via='actual Pi bash RPC', **record)
                if profile == 'reviewer':
                    check(hashes(work) == before, profile=profile, original_hashes_unchanged=True)
                emit('pi-complete', profile=profile, prompts=False, skills_tested=False,
                     control='host holds stdin/stdout RPC; no host authority path mounted')
            finally:
                process.stdin.close()
                try:
                    process.wait(timeout=4)
                except subprocess.TimeoutExpired:
                    send(expected, signal.SIGKILL)
                    process.wait(timeout=3)
                process.stdout.close()
                thread.join(timeout=1)
                emit('pi-stderr', profile=profile, text=(root / 'pi.stderr').read_text()[:8192])


def writer(path):
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    deadline = time.monotonic() + 30
    with Path(path).open('a', buffering=1) as heartbeat:
        while time.monotonic() < deadline:
            heartbeat.write('beat\n')
            time.sleep(.1)


def writers():
    child = subprocess.Popen([PY, '/isolation.py', '_writer', '/work/escaped.beats'],
                             start_new_session=True, close_fds=True)
    try:
        writer('/work/ordinary.beats')
    finally:
        child.wait(timeout=2)


def owner(root):
    root = Path(root)
    process = None
    expected = None
    with socket.socket(socket.AF_UNIX) as server:
        server.bind(str(root / 'private' / 'control.sock'))
        server.listen(4)
        server.settimeout(35)
        try:
            while True:
                connection, _ = server.accept()
                with connection:
                    operation = connection.recv(64).decode()
                    if operation == 'start' and process is None:
                        process = subprocess.Popen(sandbox(root / 'work', root / 'scratch', 'worker',
                                                   [PY, '/isolation.py', '_writers']),
                                                   stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                                   stderr=subprocess.DEVNULL, close_fds=True,
                                                   env=clean_env('/tmp/home'), preexec_fn=limits)
                        expected = identity(process.pid)[0]
                    elif operation == 'stop' and expected:
                        send(expected, signal.SIGKILL)
                        process.wait(timeout=3)
                    elif operation == 'exit':
                        connection.sendall(b'{}\n')
                        return
                    elif operation != 'status':
                        raise ValueError(operation)
                    connection.sendall(json.dumps(dict(bwrap=expected,
                                       state=condition(expected) if expected else 'not-started')).encode() + b'\n')
        finally:
            if process is not None and process.poll() is None:
                send(expected, signal.SIGKILL)
                process.wait(timeout=3)


def client(root, operation):
    with socket.socket(socket.AF_UNIX) as connection:
        connection.settimeout(4)
        connection.connect(str(Path(root) / 'private' / 'control.sock'))
        connection.sendall(operation.encode())
        response = connection.recv(4096)
    print(response.decode().strip(), flush=True)


def lifecycle_case(stop_kind):
    with fixture() as (root, work, scratch, spec):
        owner_process = subprocess.Popen([PY, SCRIPT, '_owner', str(root)], close_fds=True,
                                          stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                          stderr=subprocess.DEVNULL, env=clean_env(root))
        expected_owner = identity(owner_process.pid)[0]
        tracked = {}
        def call(operation):
            result = subprocess.run([PY, SCRIPT, '_client', str(root), operation],
                                    capture_output=True, timeout=5, close_fds=True, env=clean_env(root))
            check(result.returncode == 0, client_exited=True, operation=operation,
                  stderr=result.stderr.decode())
            return json.loads(result.stdout)
        def counts():
            return {p.name: p.stat().st_size for p in work.glob('*.beats')}
        try:
            wait_for(lambda: (root / 'private' / 'control.sock').exists())
            start = time.monotonic()
            metadata = call('start')
            wait_for(lambda: len(counts()) == 2 and min(counts().values()) >= 10)
            first = counts()
            time.sleep(.6)
            second = counts()
            check(all(second[k] > first[k] for k in first), stop_kind=stop_kind,
                  client_absent_owner_live=condition(expected_owner), before=first, after=second)
            tracked = descendants()
            current_tree = descendants(metadata['bwrap']['pid'])
            own_ns = os.readlink('/proc/self/ns/pid')
            namespace = {}
            for pid, ident in current_tree.items():
                try:
                    ns = os.readlink(f'/proc/{pid}/ns/pid')
                    status = Path(f'/proc/{pid}/status').read_text()
                    nspid = next(line.split()[1:] for line in status.splitlines() if line.startswith('NSpid:'))
                    if ns != own_ns:
                        namespace[pid] = dict(identity=ident, nspid=nspid, namespace=ns)
                except FileNotFoundError:
                    pass
            check(len(namespace) >= 3 and any(v['nspid'][-1] == '1' for v in namespace.values()),
                  observation_only=True, namespace_processes=namespace, bwrap=metadata)
            escaped = []
            for pid in namespace:
                if os.getsid(pid) == pid:
                    cmdline = Path(f'/proc/{pid}/cmdline').read_bytes().split(b'\0')
                    if b'_writer' in cmdline:
                        escaped.append(pid)
                        ignored = next(line.split()[1] for line in Path(f'/proc/{pid}/status').read_text().splitlines()
                                       if line.startswith('SigIgn:'))
                        check(int(ignored, 16) & (1 << (signal.SIGTERM - 1)), escaped_pid=pid,
                              ignores_sigterm=True, identity_published_by_writer=False)
            check(len(escaped) == 1, escaped_setsid_writer=escaped)
            check(call('status')['state'] == 'live', persistent_owner=True)
            if stop_kind == 'namespace':
                init = next(v['identity'] for v in namespace.values() if v['nspid'][-1] == '1')
                emit('containment-stop', target='observed namespace PID1', identity=init,
                     escaped_writer_alive=condition(namespace[escaped[0]]['identity']))
                send(init, signal.SIGKILL)
                check(condition(expected_owner) == 'live', owner_survived_namespace_stop=True)
            else:
                send(expected_owner, signal.SIGKILL)
                owner_process.wait(timeout=3)
            observed = wait_for(lambda: {pid: condition(v['identity']) for pid, v in namespace.items()}
                                if all(condition(v['identity']) in ('absent', 'zombie')
                                       for v in namespace.values()) else None)
            stopped = counts()
            time.sleep(.7)
            check(counts() == stopped, stop_kind=stop_kind, no_post_stop_writes=True,
                  stopped=stopped, after=counts(), observed_states=observed)
            check(time.monotonic() - start < 25, insurance_seconds=30, minimum_margin_seconds=5,
                  elapsed=time.monotonic() - start, policy='namespace teardown, not child cooperation')
            if owner_process.poll() is None:
                emit('cleanup-after-physical-stop', observed_states=observed)
                call('stop')
                call('exit')
                owner_process.wait(timeout=3)
            def collected():
                reap()
                return all(condition(ident) == 'absent' for ident in tracked.values())
            wait_for(collected)
            emit('lifecycle-complete', stop_kind=stop_kind, reaped_absence=True,
                 integration='plain Python payload, not Pi lifecycle', status_fd_used=False)
        finally:
            if owner_process.poll() is None:
                send(expected_owner, signal.SIGKILL)
                owner_process.wait(timeout=3)
            tracked.update(descendants())
            for ident in tracked.values():
                if condition(ident) == 'live':
                    send(ident, signal.SIGKILL)
            def cleanup():
                reap()
                return all(condition(ident) == 'absent' for ident in tracked.values())
            wait_for(cleanup)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    if mode == '_probe':
        payload_probe(*sys.argv[2:5], json.loads(sys.argv[5]))
        return
    if mode == '_writer':
        limits()
        writer(sys.argv[2])
        return
    if mode == '_writers':
        writers()
        return
    if mode == '_owner':
        owner(sys.argv[2])
        return
    if mode == '_client':
        client(*sys.argv[2:4])
        return
    if mode not in ('baseline', 'permissions', 'pi', 'lifecycle', 'all'):
        raise SystemExit('usage: python isolation.py baseline|permissions|pi|lifecycle|all')
    check(ctypes.CDLL(None).prctl(36, 1, 0, 0, 0) == 0, subreaper=True,
          purpose='observation and fixture cleanup only, not containment')
    emit('scope', mode=mode, prototype=True, provider_network_auth='UNRESOLVED',
         arbitrary_mount_source_safety='UNPROVEN; cooperative fixture only',
         rpc_authority='host stdin/stdout only; never passed to bash payload',
         writable='candidate worker, scratch, disposable tmp/home/dev; own proc',
         limits='bounded file/process I/O; no cgroup process-count enforcement')
    original = descendants()
    try:
        if mode in ('baseline', 'all'):
            permission_case('baseline')
        if mode in ('permissions', 'all'):
            for profile in ('worker', 'reviewer'):
                permission_case(profile)
        if mode in ('pi', 'all'):
            for profile in ('worker', 'reviewer'):
                pi_case(profile)
        if mode in ('lifecycle', 'all'):
            for kind in ('namespace', 'owner-crash'):
                lifecycle_case(kind)
        emit('complete', mode=mode)
    finally:
        owned = {pid: ident for pid, ident in descendants().items() if pid not in original}
        for ident in owned.values():
            if condition(ident) == 'live':
                send(ident, signal.SIGKILL)
        def cleaned():
            reap()
            return all(condition(ident) == 'absent' for ident in owned.values())
        wait_for(cleaned)


if __name__ == '__main__':
    main()
