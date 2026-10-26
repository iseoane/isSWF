import { spawn } from 'node:child_process';
import { open, readFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { windowsProcessApiSource } from './windows-tool-sandbox.mjs';
import { windowsWorkerProcess, validWindowsWorkerIdentity } from './windows-worker-identity.mjs';

// This is a trusted SDK task host, not a model tool sandbox. Model commands must
// still use the separate LPAC bridge. Both jobs have a single noninherited owner.
const HOST_BODY = String.raw`
public class IsSwfTrustedWorker : IsSwfWindowsTool {
 [DllImport("kernel32.dll",EntryPoint="OpenProcess",SetLastError=true)] static extern IntPtr OpenOwner(uint access,bool inherit,uint pid);
 [DllImport("kernel32.dll",EntryPoint="GetProcessTimes",SetLastError=true)] static extern bool Times(IntPtr process,out long created,out long exited,out long kernel,out long user);
 [DllImport("kernel32.dll",EntryPoint="DuplicateHandle",SetLastError=true)] static extern bool Copy(IntPtr sourceProcess,IntPtr sourceHandle,IntPtr targetProcess,out IntPtr targetHandle,uint access,bool inherit,uint flags);
 public class Result {public int exitCode=125;public bool timedOut,stopped,stdoutTruncated,stderrTruncated;public string stdout="",stderr="";}
 class Tape {
  readonly object gate=new object();readonly MemoryStream bytes=new MemoryStream();readonly int budget;public bool truncated;public Exception failure;
  public Tape(int maximum){budget=maximum;}
  public void Drain(Stream input){try{byte[] chunk=new byte[4096];int count;while((count=input.Read(chunk,0,chunk.Length))>0){lock(gate){byte[] previous=bytes.ToArray();int total=previous.Length+count;byte[] joined=new byte[Math.Min(total,budget)];int discard=Math.Max(0,total-budget);int old=Math.Max(0,previous.Length-discard);if(old>0)Buffer.BlockCopy(previous,previous.Length-old,joined,0,old);Buffer.BlockCopy(chunk,Math.Max(0,count-(joined.Length-old)),joined,old,joined.Length-old);bytes.SetLength(0);bytes.Write(joined,0,joined.Length);truncated|=total>budget;}}}catch(Exception error){failure=error;}}
  public string Base64(){lock(gate){if(failure!=null)throw new Exception("Capture incomplete",failure);return Convert.ToBase64String(bytes.ToArray());}}
 }
 static void Require(bool value,string message){if(!value)throw new Win32Exception(Marshal.GetLastWin32Error(),message);}
 static string Q(string value){var text=new StringBuilder("\"");foreach(char c in value){if(c=='\\'||c=='"')text.Append('\\').Append(c);else if(c<32)text.Append("\\u").Append(((int)c).ToString("x4"));else text.Append(c);}return text.Append('"').ToString();}
 static string Arg(string value){var text=new StringBuilder("\"");int slashes=0;foreach(char c in value){if(c=='\\'){slashes++;continue;}if(c=='"'){text.Append('\\',slashes*2+1).Append(c);slashes=0;continue;}text.Append('\\',slashes).Append(c);slashes=0;}return text.Append('\\',slashes*2).Append('"').ToString();}
 static void Record(string path,string text){using(var f=new FileStream(path,FileMode.CreateNew,FileAccess.Write,FileShare.Read)){byte[] bytes=Encoding.UTF8.GetBytes(text+"\n");f.Write(bytes,0,bytes.Length);f.Flush(true);}}
 public static Result Run(string binary,string task,string work,string records,string attempt,string taskHash,string boot,uint ownerPid,string ownerCreated,int timeout,int budget,string[] environment){
  if(IntPtr.Size!=8||timeout<100||timeout>120000||budget<256||budget>1048576)throw new Exception("Unsupported bounded trusted task");
  IntPtr parent=IntPtr.Zero,job=IntPtr.Zero,outer=IntPtr.Zero,remote=IntPtr.Zero,limits=IntPtr.Zero,list=IntPtr.Zero,handles=IntPtr.Zero,env=IntPtr.Zero,input=IntPtr.Zero;
  bool attributes=false,assigned=false,clientsClosed=false;var pi=new PROCESS_INFORMATION();var result=new Result();
  var stdout=new Tape(budget);var stderr=new Tape(budget);System.IO.Pipes.AnonymousPipeServerStream output=null,error=null;System.Threading.Thread outThread=null,errThread=null;
  try{
   parent=OpenOwner(0x101040,false,ownerPid);Require(parent!=IntPtr.Zero,"open SDK lifecycle owner");long created,exited,kernel,user;Require(Times(parent,out created,out exited,out kernel,out user),"owner creation time");if(created.ToString()!=ownerCreated||WaitForSingleObject(parent,0)!=258)throw new Exception("Lifecycle owner changed");
   job=CreateJobObject(IntPtr.Zero,null);outer=CreateJobObject(IntPtr.Zero,null);Require(job!=IntPtr.Zero&&outer!=IntPtr.Zero,"create dual lifetime jobs");
   limits=Marshal.AllocHGlobal(144);for(int n=0;n<144;n++)Marshal.WriteByte(limits,n,0);Marshal.WriteInt32(limits,16,0x2000);Require(SetInformationJobObject(job,9,limits,144)&&SetInformationJobObject(outer,9,limits,144),"require kill-on-close without breakaway");
   output=new System.IO.Pipes.AnonymousPipeServerStream(System.IO.Pipes.PipeDirection.In,HandleInheritability.Inheritable);error=new System.IO.Pipes.AnonymousPipeServerStream(System.IO.Pipes.PipeDirection.In,HandleInheritability.Inheritable);
   var security=new SECURITY_ATTRIBUTES{length=Marshal.SizeOf(typeof(SECURITY_ATTRIBUTES)),inherit=true};input=CreateFile("NUL",0x80000000,3,ref security,3,0,IntPtr.Zero);Require(input!=new IntPtr(-1),"empty stdin");
   handles=Marshal.AllocHGlobal(IntPtr.Size*3);Marshal.WriteIntPtr(handles,0,input);Marshal.WriteIntPtr(handles,IntPtr.Size,output.ClientSafePipeHandle.DangerousGetHandle());Marshal.WriteIntPtr(handles,IntPtr.Size*2,error.ClientSafePipeHandle.DangerousGetHandle());
   IntPtr size=IntPtr.Zero;InitializeProcThreadAttributeList(IntPtr.Zero,1,0,ref size);list=Marshal.AllocHGlobal(size);Require(InitializeProcThreadAttributeList(list,1,0,ref size),"initialize explicit handle list");attributes=true;Require(UpdateProcThreadAttribute(list,0,new IntPtr(0x20002),handles,new IntPtr(IntPtr.Size*3),IntPtr.Zero,IntPtr.Zero),"select only standard handles");
   env=Marshal.StringToHGlobalUni(String.Join("\0",environment)+"\0\0");var startup=new STARTUPINFOEX();startup.StartupInfo.cb=Marshal.SizeOf(typeof(STARTUPINFOEX));startup.StartupInfo.flags=0x100;startup.StartupInfo.input=input;startup.StartupInfo.output=output.ClientSafePipeHandle.DangerousGetHandle();startup.StartupInfo.error=error.ClientSafePipeHandle.DangerousGetHandle();startup.attributes=list;
   Require(CreateProcess(binary,new StringBuilder(Arg(binary)+" "+Arg(task)+" "+Arg(work)),IntPtr.Zero,IntPtr.Zero,true,0x80000|0x400|0x4|0x08000000,env,work,ref startup,out pi),"create suspended trusted task");
   output.DisposeLocalCopyOfClientHandle();error.DisposeLocalCopyOfClientHandle();clientsClosed=true;outThread=new System.Threading.Thread(()=>stdout.Drain(output)){IsBackground=true};errThread=new System.Threading.Thread(()=>stderr.Drain(error)){IsBackground=true};outThread.Start();errThread.Start();
   Require(AssignProcessToJobObject(outer,pi.process)&&AssignProcessToJobObject(job,pi.process),"contain trusted task before resume");assigned=true;
   Require(Times(pi.process,out created,out exited,out kernel,out user),"task creation time");Require(Copy(new IntPtr(-1),outer,parent,out remote,0,false,2),"SDK owner lifetime handle");Require(CloseHandle(outer),"close local outer reference");outer=IntPtr.Zero;
   string binding="\"version\":1,\"attemptId\":"+Q(attempt)+",\"taskSha256\":"+Q(taskHash);
   Record(Path.Combine(records,"execution-child.json"),"{"+binding+",\"child\":{\"platform\":\"win32\",\"pid\":"+pi.pid+",\"creationFileTime\":"+Q(created.ToString())+",\"bootId\":"+Q(boot)+",\"exe\":"+Q(binary)+",\"argv\":["+Q(binary)+","+Q(task)+","+Q(work)+"],\"spawnedAt\":"+Q(DateTime.UtcNow.ToString("o"))+"}}");
   Record(Path.Combine(records,"execution-job-started.json"),"{"+binding+",\"pid\":"+pi.pid+",\"creationFileTime\":"+Q(created.ToString())+",\"ownerPid\":"+ownerPid+",\"ownerCreationFileTime\":"+Q(ownerCreated)+",\"dualJobLifetime\":true,\"assignedBeforeResume\":true}");
   if(WaitForSingleObject(parent,0)!=258)throw new Exception("Owner ceased before task resume");Require(ResumeThread(pi.thread)!=0xffffffff,"resume contained task");
   uint wait=WaitForSingleObject(pi.process,(uint)timeout);if(wait==258){result.timedOut=true;result.exitCode=124;}else{Require(wait==0,"task wait");uint code;Require(GetExitCodeProcess(pi.process,out code),"task exit code");result.exitCode=unchecked((int)code);}
  }finally{
   if(pi.process!=IntPtr.Zero&&!assigned){Require(TerminateProcess(pi.process,125),"stop unassigned suspended task");Require(WaitForSingleObject(pi.process,5000)==0,"unassigned task cessation");}
   if(job!=IntPtr.Zero){Require(TerminateJobObject(job,125),"stop all trusted task descendants");for(int n=0;n<500;n++){JOB_ACCOUNTING account;Require(QueryInformationJobObject(job,1,out account,(uint)Marshal.SizeOf(typeof(JOB_ACCOUNTING)),IntPtr.Zero),"query task tree cessation");if(account.active==0){result.stopped=true;break;}System.Threading.Thread.Sleep(10);}if(!result.stopped)throw new Exception("Trusted task descendants UNKNOWN");CloseHandle(job);}
   if(remote!=IntPtr.Zero){IntPtr recovered;if(Copy(parent,remote,new IntPtr(-1),out recovered,0,false,3))CloseHandle(recovered);else if(WaitForSingleObject(parent,0)!=0)throw new Exception("Owner lifetime handle UNKNOWN");}if(outer!=IntPtr.Zero)CloseHandle(outer);if(parent!=IntPtr.Zero)CloseHandle(parent);
   if(pi.process!=IntPtr.Zero)CloseHandle(pi.process);if(pi.thread!=IntPtr.Zero)CloseHandle(pi.thread);if(input!=IntPtr.Zero&&input!=new IntPtr(-1))CloseHandle(input);
   if(!clientsClosed){if(output!=null)output.DisposeLocalCopyOfClientHandle();if(error!=null)error.DisposeLocalCopyOfClientHandle();}
   if(outThread!=null&&!outThread.Join(5000)||errThread!=null&&!errThread.Join(5000))throw new Exception("Trusted task capture UNKNOWN");if(output!=null)output.Dispose();if(error!=null)error.Dispose();
   if(attributes)DeleteProcThreadAttributeList(list);foreach(var memory in new[]{limits,list,handles,env})if(memory!=IntPtr.Zero)Marshal.FreeHGlobal(memory);
  }
  result.stdout=stdout.Base64();result.stderr=stderr.Base64();result.stdoutTruncated=stdout.truncated;result.stderrTruncated=stderr.truncated;
  Record(Path.Combine(records,"execution-job-finished.json"),"{\"version\":1,\"attemptId\":"+Q(attempt)+",\"taskSha256\":"+Q(taskHash)+",\"stopped\":true,\"exitCode\":"+result.exitCode+",\"timedOut\":"+result.timedOut.ToString().ToLowerInvariant()+"}");return result;
 }
}
`;

async function superviseWindowsWorker(options) {
  const { attemptDir, dispatch, environment } = options;
  const controllerOwner = windowsWorkerProcess(process.pid).process;
  if (!controllerOwner) throw Error('Lifecycle owner identity unavailable');
  const request = join(attemptDir, 'windows-supervisor-request.json'), result = join(attemptDir, 'windows-supervisor-result.json'), proxy = join(attemptDir, 'windows-supervisor.mjs');
  const requestBytes = JSON.stringify({ ...options, controllerOwner });
  if (Buffer.byteLength(requestBytes) > 64000) throw Error('Native supervisor request bound');
  const save = async (path, bytes) => { const f = await open(path, 'wx', 0o600); try { await f.writeFile(bytes); await f.sync(); } finally { await f.close(); } };
  await save(request, requestBytes);
  const source = 'import {runWindowsWorkerTask} from ' + JSON.stringify(import.meta.url) + ';import {readFile,open,link,unlink} from "node:fs/promises";const request=JSON.parse(await readFile(' + JSON.stringify(request) + ',"utf8"));let value;try{value={version:1,attemptId:request.dispatch.attemptId,taskSha256:request.dispatch.taskSha256,result:await runWindowsWorkerTask(request)}}catch(error){value={version:1,attemptId:request.dispatch.attemptId,taskSha256:request.dispatch.taskSha256,failure:true,errorName:error.name}}const bytes=JSON.stringify(value);if(Buffer.byteLength(bytes)>4194304)throw Error("Bounded supervisor result required");const final=' + JSON.stringify(result) + ',temp=final+".tmp";const f=await open(temp,"wx",0o600);try{await f.writeFile(bytes);await f.sync()}finally{await f.close()}await link(temp,final);await unlink(temp);';
  await save(proxy, source);
  const child = spawn(process.execPath, [proxy], { detached: true, windowsHide: true, stdio: 'ignore', env: environment });
  child.unref(); let failure; child.once('error', error => { failure = error; });
  const deadline = Date.now() + dispatch.timeoutMs + 30000;
  while (Date.now() < deadline) {
    if (failure) throw failure;
    try {
      const stat = await lstat(result); if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4194304) throw Error('Invalid bounded supervisor result');
      const value = JSON.parse(await readFile(result, 'utf8'));
      if (value.version !== 1 || value.attemptId !== dispatch.attemptId || value.taskSha256 !== dispatch.taskSha256 || value.failure || !value.result) throw Error('Native supervisor completion unavailable');
      return value.result;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await new Promise(done => setTimeout(done, 50));
  }
  child.kill(); throw Error('Native supervisor deadline; cessation unknown');
}

export async function runWindowsWorkerTask(options) {
  if (process.platform !== 'win32') throw Error('Native Windows trusted task host required');
  if (!options.controllerOwner) return superviseWindowsWorker(options);
  const { binary, dispatch, attemptDir, environment, controllerOwner: owner } = options;
  if (!validWindowsWorkerIdentity(owner)) throw Error('Invalid lifecycle owner identity');
  const script = "$ErrorActionPreference='Stop';[Console]::InputEncoding=[Text.UTF8Encoding]::new($false);[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false);$r=[Console]::In.ReadToEnd()|ConvertFrom-Json\nAdd-Type -TypeDefinition @'\n" + windowsProcessApiSource() + HOST_BODY + "\n'@\n[IsSwfTrustedWorker]::Run([string]$r.binary,[string]$r.task,[string]$r.work,[string]$r.records,[string]$r.attempt,[string]$r.taskHash,[string]$r.boot,[uint32]$r.ownerPid,[string]$r.ownerCreated,[int]$r.timeout,[int]$r.budget,[string[]]$r.environment)|ConvertTo-Json -Compress\n";
  const path = join(attemptDir, 'windows-worker-controller.ps1');
  const file = await open(path, 'wx', 0o600); try { await file.writeFile(script); await file.sync(); } finally { await file.close(); }
  const request = { binary, task: dispatch.taskCopy, work: dispatch.workspace, records: attemptDir, attempt: dispatch.attemptId, taskHash: dispatch.taskSha256, boot: owner.bootId, ownerPid: owner.pid, ownerCreated: owner.creationFileTime, timeout: dispatch.timeoutMs, budget: dispatch.outputBytes, environment: Object.entries(environment).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => key + '=' + value) };
  const result = await new Promise((done, reject) => {
    const child = spawn(join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let bytes = 0, output = '', errors = '', settled = false;
    const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); if (error) reject(error); else done(value); };
    const timer = setTimeout(() => { child.kill(); finish(Error('Native trusted task controller deadline; cessation unknown')); }, dispatch.timeoutMs + 30000);
    child.stdin.on('error', () => {}); child.once('error', error => finish(error));
    child.stdout.on('data', chunk => { bytes += chunk.length; if (bytes > 4 * 1024 * 1024) { child.kill(); finish(Error('Native trusted task controller output bound; cessation unknown')); } else output += chunk.toString('utf8'); });
    child.stderr.on('data', chunk => { errors = (errors + chunk.toString('utf8')).slice(-16000); });
    child.once('close', code => { if (code !== 0) return finish(Error('Native trusted task controller failed: ' + errors)); try { finish(null, JSON.parse(output.trim())); } catch (error) { finish(error); } });
    child.stdin.end(JSON.stringify(request));
  });
  const receipt = JSON.parse(await readFile(join(attemptDir, 'execution-job-finished.json'), 'utf8'));
  if (result.stopped !== true || receipt.version !== 1 || receipt.attemptId !== dispatch.attemptId || receipt.taskSha256 !== dispatch.taskSha256 || receipt.stopped !== true || receipt.exitCode !== result.exitCode || receipt.timedOut !== result.timedOut) throw Error('Native trusted task completion mismatch');
  return result;
}
