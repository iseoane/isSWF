import { spawnSync } from 'node:child_process';
import { isAbsolute, join } from 'node:path';

// Worker evidence is stricter than initialization recovery: another boot or a
// reused PID is unknown, never proof that a tool tree or capacity can be freed.
export function windowsWorkerProcess(pid, nonce) {
  if (process.platform !== 'win32' || !Number.isSafeInteger(pid) || pid <= 0 || nonce !== undefined && !/^[a-f0-9]{48}$/u.test(nonce)) throw Error('Invalid Windows worker identity request');
  const script = `$ErrorActionPreference='Stop';[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false);
Add-Type -TypeDefinition @'
using System;using System.Runtime.InteropServices;
public class IsSwfWorkerArgv {
 [DllImport("shell32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CommandLineToArgvW(string command,out int count);
 [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr memory);
 public static string[] Parse(string command){int count;IntPtr data=CommandLineToArgvW(command,out count);if(data==IntPtr.Zero)throw new Exception("Command line unavailable");try{var args=new string[count];for(int n=0;n<count;n++)args[n]=Marshal.PtrToStringUni(Marshal.ReadIntPtr(data,n*IntPtr.Size));return args;}finally{LocalFree(data);}}
}
'@
$boot=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToUniversalTime().ToString('o');
$p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}';
if($null -eq $p){@{bootId=$boot;process=$null}|ConvertTo-Json -Depth 4 -Compress;exit}
$held=[Diagnostics.Process]::GetProcessById(${pid});try{$null=$held.Handle;$created=$held.StartTime.ToUniversalTime().ToFileTimeUtc().ToString();
$p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}';if($null -eq $p -or $held.HasExited){throw 'Process changed during query'};
if([string]::IsNullOrEmpty($p.ExecutablePath) -or [string]::IsNullOrEmpty($p.CommandLine)){throw 'Process metadata unavailable'};
@{bootId=$boot;process=@{platform='win32';pid=${pid};creationFileTime=$created;exe=[string]$p.ExecutablePath;argv=@([IsSwfWorkerArgv]::Parse($p.CommandLine))}}|ConvertTo-Json -Depth 4 -Compress
}finally{$held.Dispose()}`;
  const executable = join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const result = spawnSync(executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { encoding: 'utf8', timeout: 15000, maxBuffer: 32768, windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Windows worker process observation unavailable');
  const value = JSON.parse(result.stdout.replace(/^\uFEFF/u, '').trim());
  if (typeof value.bootId !== 'string' || !Number.isFinite(Date.parse(value.bootId))) throw Error('Invalid Windows worker boot evidence');
  if (value.process === null) return value;
  const p = { ...value.process, bootId: value.bootId, ...(nonce === undefined ? {} : { nonce }) };
  if (!validWindowsWorkerIdentity(p) || p.pid !== pid || nonce !== undefined && !p.argv.includes(nonce)) throw Error('Windows worker identity mismatch');
  return { bootId: value.bootId, process: p };
}

export function validWindowsWorkerIdentity(value) {
  return value?.platform === 'win32' && Number.isSafeInteger(value.pid) && value.pid > 0 && typeof value.creationFileTime === 'string' && /^\d{15,20}$/u.test(value.creationFileTime) && typeof value.bootId === 'string' && Number.isFinite(Date.parse(value.bootId)) && typeof value.exe === 'string' && isAbsolute(value.exe) && Array.isArray(value.argv) && value.argv.length > 0 && value.argv.every(arg => typeof arg === 'string' && !arg.includes('\0')) && (value.nonce === undefined || /^[a-f0-9]{48}$/u.test(value.nonce) && value.argv.includes(value.nonce));
}

export function windowsWorkerState(expected) {
  if (process.platform !== 'win32' || !validWindowsWorkerIdentity(expected)) return 'unknown';
  try {
    const actual = windowsWorkerProcess(expected.pid, expected.nonce);
    if (actual.bootId !== expected.bootId) return 'unknown';
    if (actual.process === null) return 'not-live';
    const p = actual.process;
    return p.creationFileTime === expected.creationFileTime && p.exe === expected.exe && JSON.stringify(p.argv) === JSON.stringify(expected.argv) ? 'live' : 'unknown';
  } catch { return 'unknown'; }
}
