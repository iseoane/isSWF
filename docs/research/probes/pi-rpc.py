#!/usr/bin/env python3
"""Probe local Pi RPC without prompts, credentials, or remote operations."""
import json
import os
from pathlib import Path
import selectors
import subprocess
import tempfile
import time


class Client:
    def __init__(self, root, session_id):
        self.stderr = tempfile.TemporaryFile()
        env = {k: v for k, v in os.environ.items()
               if not (k.startswith('PI_') or 'KEY' in k or 'TOKEN' in k or 'SECRET' in k)}
        env.update(PI_CODING_AGENT_DIR=str(root / 'agent'), PI_OFFLINE='1', PI_TELEMETRY='0')
        self.process = subprocess.Popen([
            'pi', '--mode', 'rpc', '--offline', '--no-extensions', '--no-mcp',
            '--no-skills', '--no-prompt-templates', '--no-themes', '--no-context-files',
            '--no-approve', '--tools', 'read,grep,find,ls',
            '--session-dir', str(root / 'sessions'), '--session-id', session_id,
        ], cwd=root, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=self.stderr)
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.process.stdout, selectors.EVENT_READ)
        self.buffer = b''
        self.counter = 0

    def request(self, kind, **args):
        self.counter += 1
        request_id = str(self.counter)
        self.process.stdin.write(json.dumps(dict(id=request_id, type=kind, **args)).encode() + b'\n')
        self.process.stdin.flush()
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            while b'\n' in self.buffer:
                line, self.buffer = self.buffer.split(b'\n', 1)
                record = json.loads(line)
                if record.get('type') == 'response' and record.get('id') == request_id:
                    return record
            if self.selector.select(max(0, deadline - time.monotonic())):
                chunk = os.read(self.process.stdout.fileno(), 65536)
                if not chunk:
                    raise RuntimeError('RPC exited before correlated response')
                self.buffer += chunk
        raise TimeoutError(f'No response for {kind}')

    def close(self):
        try:
            self.process.stdin.close()
            self.process.wait(timeout=10)
            assert self.process.returncode == 0, 'Orderly EOF shutdown failed'
        finally:
            if self.process.poll() is None:
                self.process.kill()
                self.process.wait()
            self.selector.close()
            self.process.stdout.close()
            self.stderr.close()


def main():
    with tempfile.TemporaryDirectory(prefix='isswf-rpc-probe-') as directory:
        root = Path(directory)
        client = Client(root, 'probe-work')
        try:
            assert client.request('get_state')['success'], 'RPC state unavailable'
            invalid = client.request('isswf_unknown_command')
            assert not invalid['success'], 'Unknown command accepted'
            assert client.request('set_session_name', name='isSWF offline probe')['success']
            assert client.request('bash', command="printf probe > rpc-marker.txt")['success']
            assert (root / 'rpc-marker.txt').read_text() == 'probe', 'RPC bash did not write marker'
            messages = client.request('get_messages')
            assert messages['success'] and any(m.get('role') == 'bashExecution' for m in messages['data']['messages']), 'Bash evidence absent from live context'
            print('PASS: correlated state/error responses without a model prompt')
            print('OBSERVED: RPC bash writes even with model tool allowlist read,grep,find,ls')
        finally:
            client.close()
        print('PASS: stdin EOF shuts down the Pi process')
        assert not list((root / 'sessions').rglob('*.jsonl')), 'Persistence behavior changed: revisit no-assistant case'
        print('OBSERVED: a named session with bashExecution but no assistant response has no persisted JSONL')
        reopened = Client(root, 'probe-work')
        try:
            state = reopened.request('get_state')
            assert state['success'] and state['data'].get('sessionName') != 'isSWF offline probe', 'Unexpected recovery of unpersisted name'
            messages = reopened.request('get_messages')
            assert messages['success'] and not any(m.get('role') == 'bashExecution' for m in messages['data']['messages']), 'Unexpected recovery of unpersisted bash evidence'
            print('PASS: reopening exact ID does not recover the unpersisted name or bash evidence')
        finally:
            reopened.close()
    print('Scope: protocol/lifecycle/session checks only; no LLM, chat independence, sandbox or crash recovery proof')


if __name__ == '__main__':
    main()
