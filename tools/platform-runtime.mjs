import { spawnSync } from 'node:child_process';
import { open, readFile } from 'node:fs/promises';
import { join } from 'node:path';

function fail(message) { throw Error(message); }

export async function syncDirectory(path) {
  // Windows does not support fsync on directory handles. File syncs remain
  // mandatory; this does not promise directory-entry persistence on power loss.
  if (process.platform === 'win32') return;
  const file = await open(path, 'r'); try { await file.sync(); } finally { await file.close(); }
}

function windowsIdentity(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) fail('Invalid Windows process identity PID');
  const script = `$ErrorActionPreference = 'Stop'; $p = Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; $boot = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToUniversalTime().ToString('o'); if ($null -eq $p) { @{bootId=$boot; process=$null} | ConvertTo-Json -Compress } else { @{bootId=$boot; process=@{pid=[int]$p.ProcessId; startTime=$p.CreationDate.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Compress }`;
  const executable = join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const result = spawnSync(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { encoding: 'utf8', timeout: 15000, maxBuffer: 16384, windowsHide: true });
  if (result.error || result.status !== 0) fail('Windows process identity unavailable; recovery remains blocked');
  const value = JSON.parse(result.stdout.replace(/^\uFEFF/u, '').trim());
  const timestamp = input => typeof input === 'string' && /^\d{4}-\d\d-\d\dT/u.test(input) && Number.isFinite(Date.parse(input));
  if (!timestamp(value.bootId) || value.process !== null && (value.process?.pid !== pid || !timestamp(value.process.startTime))) fail('Invalid Windows process identity evidence');
  return value;
}
export async function identity() {
  if (process.platform === 'win32') {
    const value = windowsIdentity(process.pid);
    if (!value.process) fail('Current Windows process identity unavailable');
    return { platform: 'win32', ...value.process, bootId: value.bootId };
  }
  if (process.platform !== 'linux') fail('Mutation recovery requires Linux or Windows process identity support');
  const stat = await readFile(`/proc/${process.pid}/stat`, 'utf8');
  return { pid: process.pid, startTicks: stat.slice(stat.lastIndexOf(')') + 2).split(/\s+/u)[19], bootId: (await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim() };
}
export async function ceased(owner) {
  if (owner?.platform === 'win32') {
    if (process.platform !== 'win32' || !Number.isSafeInteger(owner.pid) || owner.pid <= 0 || typeof owner.startTime !== 'string' || !Number.isFinite(Date.parse(owner.startTime)) || typeof owner.bootId !== 'string' || !Number.isFinite(Date.parse(owner.bootId))) return false;
    try {
      const value = windowsIdentity(owner.pid);
      return value.bootId !== owner.bootId || value.process === null || value.process.startTime !== owner.startTime;
    } catch { return false; }
  }
  if (process.platform !== 'linux') return false;
  if (!Number.isSafeInteger(owner?.pid) || owner.pid <= 0 || !/^\d+$/u.test(owner.startTicks || '') || !/^[a-f0-9-]{36}$/u.test(owner.bootId || '')) return false;
  try {
    if ((await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim() !== owner.bootId) return true;
    const stat = await readFile(`/proc/${owner.pid}/stat`, 'utf8');
    return stat.slice(stat.lastIndexOf(')') + 2).split(/\s+/u)[19] !== owner.startTicks;
  } catch (error) { return error.code === 'ENOENT'; }
}
