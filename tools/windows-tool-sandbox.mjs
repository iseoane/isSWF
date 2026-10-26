// Native OS enforcement; callers supply trusted, exclusively owned scope and runtime pins.
const WINDOWS_SANDBOX_PS = String.raw`$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$r = [Console]::In.ReadToEnd() | ConvertFrom-Json
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.IO;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Security.AccessControl;
public class IsSwfWindowsTool {
 [StructLayout(LayoutKind.Sequential)] public struct STARTUPINFO { public int cb; public IntPtr reserved,desktop,title; public int x,y,xs,ys,xc,yc,fill,flags; public short show,reserved2; public IntPtr reservedPtr,input,output,error; }
 [StructLayout(LayoutKind.Sequential)] public struct STARTUPINFOEX { public STARTUPINFO StartupInfo; public IntPtr attributes; }
 [StructLayout(LayoutKind.Sequential)] public struct PROCESS_INFORMATION { public IntPtr process,thread; public uint pid,tid; }
 [StructLayout(LayoutKind.Sequential)] public struct SECURITY_CAPABILITIES { public IntPtr sid,capabilities; public int count,reserved; }
 [DllImport("userenv.dll",CharSet=CharSet.Unicode)] public static extern int CreateAppContainerProfile(string n,string d,string desc,IntPtr caps,int count,out IntPtr sid);
 [DllImport("userenv.dll",CharSet=CharSet.Unicode)] public static extern int DeleteAppContainerProfile(string n);
 [DllImport("advapi32.dll")] public static extern IntPtr FreeSid(IntPtr sid);
 [DllImport("kernelbase.dll",CharSet=CharSet.Unicode,SetLastError=true)] public static extern bool DeriveCapabilitySidsFromName(string name,out IntPtr groups,out uint groupCount,out IntPtr capabilities,out uint capabilityCount);
 [DllImport("kernel32.dll")] public static extern IntPtr LocalFree(IntPtr p);
 [StructLayout(LayoutKind.Sequential)] public struct SID_AND_ATTRIBUTES {public IntPtr sid;public uint attributes;}
 [StructLayout(LayoutKind.Sequential)] public struct SECURITY_ATTRIBUTES { public int length; public IntPtr descriptor; [MarshalAs(UnmanagedType.Bool)] public bool inherit; }
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] public static extern IntPtr CreateFile(string path,uint access,uint share,ref SECURITY_ATTRIBUTES security,uint creation,uint flags,IntPtr template);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool InitializeProcThreadAttributeList(IntPtr list,int count,int flags,ref IntPtr size);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool UpdateProcThreadAttribute(IntPtr list,uint flags,IntPtr attribute,IntPtr value,IntPtr size,IntPtr previous,IntPtr returned);
 [DllImport("kernel32.dll")] public static extern void DeleteProcThreadAttributeList(IntPtr list);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] public static extern bool CreateProcess(string app,StringBuilder cmd,IntPtr p,IntPtr t,bool inherit,uint flags,IntPtr env,string cwd,ref STARTUPINFOEX si,out PROCESS_INFORMATION pi);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern uint WaitForSingleObject(IntPtr h,uint ms);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] public static extern IntPtr CreateJobObject(IntPtr attributes,string name);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool SetInformationJobObject(IntPtr job,int info,IntPtr data,uint length);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool TerminateJobObject(IntPtr job,uint code);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool QueryInformationJobObject(IntPtr job,int info,out JOB_ACCOUNTING data,uint length,IntPtr returned);
 [StructLayout(LayoutKind.Sequential)] public struct JOB_ACCOUNTING {public long user,kernel,periodUser,periodKernel;public uint faults,total,active,terminated;}
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool TerminateProcess(IntPtr p,uint code);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool GetExitCodeProcess(IntPtr p,out uint code);
 [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
 [DllImport("kernel32.dll")] public static extern uint ResumeThread(IntPtr h);
 [DllImport("advapi32.dll",SetLastError=true)] public static extern bool OpenProcessToken(IntPtr p,uint access,out IntPtr token);
 [DllImport("advapi32.dll",SetLastError=true)] public static extern bool GetTokenInformation(IntPtr token,int info,out int value,int size,out int length);

 [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr OpenProcess(uint access,bool inherit,uint pid);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool DuplicateHandle(IntPtr sourceProcess,IntPtr sourceHandle,IntPtr targetProcess,out IntPtr targetHandle,uint access,bool inherit,uint flags);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetProcessTimes(IntPtr process,out long created,out long exited,out long kernel,out long user);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool GetFileInformationByHandle(IntPtr file,IntPtr info);
 public class Result {public int code=125;public string output="";public bool truncated;public bool stopped;public bool profileDeleted;}
 static void Check(bool value,string operation){if(!value)throw new Win32Exception(Marshal.GetLastWin32Error(),operation);}
 static void Record(string file,string json){using(var f=new FileStream(file,FileMode.CreateNew,FileAccess.Write,FileShare.Read)){var b=Encoding.UTF8.GetBytes(json+"\n");f.Write(b,0,b.Length);f.Flush(true);}}
 static void Tree(string path){
  var attr=File.GetAttributes(path);if((attr&FileAttributes.ReparsePoint)!=0)throw new Exception("Reparse points are not permitted in sandbox scopes");
  if((attr&FileAttributes.Directory)!=0){foreach(var child in Directory.GetFileSystemEntries(path))Tree(child);return;}
  var sa=new SECURITY_ATTRIBUTES{length=Marshal.SizeOf(typeof(SECURITY_ATTRIBUTES))};
  IntPtr file=CreateFile(path,0,7,ref sa,3,0x00200000,IntPtr.Zero),info=Marshal.AllocHGlobal(52);
  try{Check(file!=new IntPtr(-1),"open scope file");Check(GetFileInformationByHandle(file,info),"scope link count");if(Marshal.ReadInt32(info,40)!=1)throw new Exception("Hardlinks are not permitted in sandbox scopes");}
  finally{if(file!=new IntPtr(-1))CloseHandle(file);Marshal.FreeHGlobal(info);}
 }
 class Capture {
  readonly object gate=new object();readonly MemoryStream stdout=new MemoryStream(),stderr=new MemoryStream();int used;public bool truncated;public Exception failure;
  public void Drain(Stream stream,bool output){try{byte[] bytes=new byte[4096];int count;while((count=stream.Read(bytes,0,bytes.Length))>0){lock(gate){int keep=Math.Min(count,8000-used);if(keep>0){(output?stdout:stderr).Write(bytes,0,keep);used+=keep;}if(keep<count)truncated=true;}}}catch(Exception error){lock(gate){failure=error;}}}
  public bool Oversized {get{lock(gate){return truncated;}}}
  public string Text {get{lock(gate){if(failure!=null)throw new Exception("Output capture failed",failure);string text=Encoding.UTF8.GetString(stdout.ToArray())+Encoding.UTF8.GetString(stderr.ToArray());byte[] encoded=Encoding.UTF8.GetBytes(text);if(encoded.Length<=8000)return text;truncated=true;char[] chars=new char[8000];int bytesUsed,charsUsed;bool complete;Encoding.UTF8.GetDecoder().Convert(encoded,0,8000,chars,0,8000,false,out bytesUsed,out charsUsed,out complete);return new string(chars,0,charsUsed);}}}
 }
 public static Result Run(string work,string factory,string runtime,string scratch,string records,string prefix,string binding,string command,int timeout,uint parentPid,string parentFileTime){
  if(IntPtr.Size!=8)throw new Exception("Native sandbox requires a 64-bit host");
  if(command==null||command.Length==0||command.Length>8000||command.IndexOf('\0')>=0||timeout<1||timeout>10000)throw new Exception("Invalid bounded command");
  if(!System.Text.RegularExpressions.Regex.IsMatch(prefix,@"^\d{6}$")||!System.Text.RegularExpressions.Regex.IsMatch(binding,@"^[0-9a-f]{64}$"))throw new Exception("Invalid host binding");
  foreach(var dir in new[]{work,factory,runtime,scratch})Tree(dir);
  string moniker="isswf.tool."+Guid.NewGuid().ToString("N");
  var capture=new Capture();System.IO.Pipes.AnonymousPipeServerStream outPipe=null,errPipe=null;System.Threading.Thread outReader=null,errReader=null;bool clientsClosed=false;
  IntPtr sid=IntPtr.Zero,list=IntPtr.Zero,cap=IntPtr.Zero,policy=IntPtr.Zero,env=IntPtr.Zero,token=IntPtr.Zero,handles=IntPtr.Zero,input=IntPtr.Zero,output=IntPtr.Zero,error=IntPtr.Zero,groups=IntPtr.Zero,sids=IntPtr.Zero,capList=IntPtr.Zero,job=IntPtr.Zero,limits=IntPtr.Zero,parent=IntPtr.Zero,outerJob=IntPtr.Zero,remoteOuter=IntPtr.Zero;
  uint groupCount=0,capCount=0;bool initialized=false,profile=false,stopped=false,assigned=false;
  var original=new System.Collections.Generic.Dictionary<string,DirectorySecurity>();var result=new Result();PROCESS_INFORMATION pi=new PROCESS_INFORMATION();
  try{
   parent=OpenProcess(0x101040,false,parentPid);Check(parent!=IntPtr.Zero,"open exact SDK owner");long ownerCreated,ownerExited,ownerKernel,ownerUser;Check(GetProcessTimes(parent,out ownerCreated,out ownerExited,out ownerKernel,out ownerUser),"SDK owner identity");if(ownerCreated.ToString()!=parentFileTime||WaitForSingleObject(parent,0)!=258)throw new Exception("SDK owner identity changed or ceased");
   job=CreateJobObject(IntPtr.Zero,null);Check(job!=IntPtr.Zero,"create private job");
   outerJob=CreateJobObject(IntPtr.Zero,null);Check(outerJob!=IntPtr.Zero,"create SDK lifetime job");
   limits=Marshal.AllocHGlobal(144);for(int i=0;i<144;i++)Marshal.WriteByte(limits,i,0);Marshal.WriteInt32(limits,16,0x2000);
   Check(SetInformationJobObject(job,9,limits,144),"set kill-on-close job without breakaway");
   Check(SetInformationJobObject(outerJob,9,limits,144),"set SDK lifetime job without breakaway");
   Record(Path.Combine(records,prefix+".profile-intent.json"),"{\"version\":1,\"binding\":\""+binding+"\",\"moniker\":\""+moniker+"\"}");
   int hr=CreateAppContainerProfile(moniker,moniker,"isSWF bounded tool",IntPtr.Zero,0,out sid);if(hr!=0)Marshal.ThrowExceptionForHR(hr);profile=true;
   var identity=new SecurityIdentifier(sid);
   Record(Path.Combine(records,prefix+".profile-created.json"),"{\"version\":1,\"binding\":\""+binding+"\",\"moniker\":\""+moniker+"\",\"sid\":\""+identity.Value+"\"}");
   foreach(var dir in new[]{runtime,factory,work,scratch}){
    var acl=Directory.GetAccessControl(dir);original.Add(dir,acl);
    var updated=Directory.GetAccessControl(dir);
    updated.AddAccessRule(new FileSystemAccessRule(identity,(dir==work||dir==scratch)?FileSystemRights.Modify:FileSystemRights.ReadAndExecute,InheritanceFlags.ContainerInherit|InheritanceFlags.ObjectInherit,PropagationFlags.None,AccessControlType.Allow));
    Directory.SetAccessControl(dir,updated);
   }
   foreach(var dir in new[]{work,scratch}){
    var start=new System.Diagnostics.ProcessStartInfo(Path.Combine(Environment.GetEnvironmentVariable("SystemRoot"),"System32","icacls.exe"),"\""+dir+"\" /setintegritylevel (OI)(CI)L"){UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true};
    using(var label=System.Diagnostics.Process.Start(start)){var text=label.StandardOutput.ReadToEnd()+label.StandardError.ReadToEnd();label.WaitForExit();if(label.ExitCode!=0)throw new Exception("Private scope integrity label failed: "+text);}
   }
   IntPtr size=IntPtr.Zero;InitializeProcThreadAttributeList(IntPtr.Zero,3,0,ref size);list=Marshal.AllocHGlobal(size);Check(InitializeProcThreadAttributeList(list,3,0,ref size),"initialize process attributes");initialized=true;
   Check(DeriveCapabilitySidsFromName("registryRead",out groups,out groupCount,out sids,out capCount),"derive registry initialization capability");if(capCount!=1)throw new Exception("Unexpected registry capability count");
   capList=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(SID_AND_ATTRIBUTES)));Marshal.StructureToPtr(new SID_AND_ATTRIBUTES{sid=Marshal.ReadIntPtr(sids),attributes=4},capList,false);
   cap=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(SECURITY_CAPABILITIES)));Marshal.StructureToPtr(new SECURITY_CAPABILITIES{sid=sid,capabilities=capList,count=1},cap,false);
   Check(UpdateProcThreadAttribute(list,0,new IntPtr(0x20009),cap,new IntPtr(Marshal.SizeOf(typeof(SECURITY_CAPABILITIES))),IntPtr.Zero,IntPtr.Zero),"set AppContainer token without network capabilities");
   policy=Marshal.AllocHGlobal(4);Marshal.WriteInt32(policy,1);Check(UpdateProcThreadAttribute(list,0,new IntPtr(0x2000f),policy,new IntPtr(4),IntPtr.Zero,IntPtr.Zero),"require LPAC policy");
   string system=Environment.GetEnvironmentVariable("SystemRoot");
   env=Marshal.StringToHGlobalUni("HOME="+scratch+"\0LOCALAPPDATA="+Environment.GetEnvironmentVariable("LOCALAPPDATA")+"\0PATH="+runtime+";"+Path.Combine(system,"System32")+"\0SystemRoot="+system+"\0TEMP="+scratch+"\0TMP="+scratch+"\0\0");
   var sa=new SECURITY_ATTRIBUTES{length=Marshal.SizeOf(typeof(SECURITY_ATTRIBUTES)),inherit=true};
   outPipe=new System.IO.Pipes.AnonymousPipeServerStream(System.IO.Pipes.PipeDirection.In,HandleInheritability.Inheritable);
   errPipe=new System.IO.Pipes.AnonymousPipeServerStream(System.IO.Pipes.PipeDirection.In,HandleInheritability.Inheritable);
   output=outPipe.ClientSafePipeHandle.DangerousGetHandle();error=errPipe.ClientSafePipeHandle.DangerousGetHandle();
   input=CreateFile("NUL",0x80000000,3,ref sa,3,0,IntPtr.Zero);Check(input!=new IntPtr(-1),"create empty stdin");
   handles=Marshal.AllocHGlobal(IntPtr.Size*3);Marshal.WriteIntPtr(handles,0,input);Marshal.WriteIntPtr(handles,IntPtr.Size,output);Marshal.WriteIntPtr(handles,IntPtr.Size*2,error);
   Check(UpdateProcThreadAttribute(list,0,new IntPtr(0x20002),handles,new IntPtr(IntPtr.Size*3),IntPtr.Zero,IntPtr.Zero),"allow only three standard handles");
   var startup=new STARTUPINFOEX();startup.StartupInfo.cb=Marshal.SizeOf(typeof(STARTUPINFOEX));startup.StartupInfo.flags=0x100;startup.StartupInfo.input=input;startup.StartupInfo.output=output;startup.StartupInfo.error=error;startup.attributes=list;
   string cmd=Path.Combine(system,"System32","cmd.exe");
   Check(CreateProcess(cmd,new StringBuilder("\""+cmd+"\" /d /s /c \""+command+"\""),IntPtr.Zero,IntPtr.Zero,true,0x80000|0x400|0x4|0x08000000,env,work,ref startup,out pi),"create suspended LPAC command");
   outPipe.DisposeLocalCopyOfClientHandle();errPipe.DisposeLocalCopyOfClientHandle();clientsClosed=true;
   outReader=new System.Threading.Thread(()=>capture.Drain(outPipe,true)){IsBackground=true};errReader=new System.Threading.Thread(()=>capture.Drain(errPipe,false)){IsBackground=true};outReader.Start();errReader.Start();
   Check(AssignProcessToJobObject(outerJob,pi.process),"contain SDK lifetime before resume");
   Check(AssignProcessToJobObject(job,pi.process),"contain command before resume");assigned=true;
   Check(OpenProcessToken(pi.process,8,out token),"open command token");int app,length;Check(GetTokenInformation(token,29,out app,4,out length),"query AppContainer token");if(app!=1)throw new Exception("Command is not an AppContainer");
   long created,exited,kernel,user;Check(GetProcessTimes(pi.process,out created,out exited,out kernel,out user),"read exact startup identity");
   Check(DuplicateHandle(new IntPtr(-1),outerJob,parent,out remoteOuter,0,false,2),"bind lifetime job to exact SDK owner");Check(CloseHandle(outerJob),"close local lifetime-job reference");outerJob=IntPtr.Zero;
   Record(Path.Combine(records,prefix+".started.json"),"{\"version\":1,\"binding\":\""+binding+"\",\"pid\":"+pi.pid+",\"creationFileTime\":\""+created+"\",\"lpacRequested\":true,\"jobAssignedBeforeResume\":true,\"dualJobLifetime\":true,\"sdkOwnerPid\":"+parentPid+",\"sdkOwnerCreationFileTime\":\""+parentFileTime+"\"}");
   if(WaitForSingleObject(parent,0)!=258)throw new Exception("SDK owner ceased before resume");
   if(ResumeThread(pi.thread)==0xffffffff)Check(false,"resume contained command");
   var clock=System.Diagnostics.Stopwatch.StartNew();
   for(;;){
    uint wait=WaitForSingleObject(pi.process,10);
    if(wait==0){uint code;Check(GetExitCodeProcess(pi.process,out code),"read command exit");result.code=unchecked((int)code);break;}
    if(wait!=258)throw new Exception("Unexpected command wait result");
    if(capture.Oversized){result.truncated=true;result.code=125;break;}
    if(clock.ElapsedMilliseconds>=timeout){result.code=124;break;}
   }
   result.truncated|=capture.Oversized;
  }finally{
   if(pi.process!=IntPtr.Zero&&!assigned){Check(TerminateProcess(pi.process,125),"stop unassigned suspended child");if(WaitForSingleObject(pi.process,5000)!=0)throw new Exception("Unassigned child cessation UNKNOWN");}
   if(job!=IntPtr.Zero){
    Check(TerminateJobObject(job,125),"terminate contained descendants");
    for(int n=0;n<500;n++){JOB_ACCOUNTING accounting;Check(QueryInformationJobObject(job,1,out accounting,(uint)Marshal.SizeOf(typeof(JOB_ACCOUNTING)),IntPtr.Zero),"inspect contained cessation");if(accounting.active==0){stopped=true;break;}System.Threading.Thread.Sleep(10);}
    if(!stopped)throw new Exception("UNKNOWN descendant cessation; preserve private profile "+moniker);
    result.stopped=true;CloseHandle(job);
   }
   if(remoteOuter!=IntPtr.Zero){IntPtr recovered;if(DuplicateHandle(parent,remoteOuter,new IntPtr(-1),out recovered,0,false,3))CloseHandle(recovered);else if(WaitForSingleObject(parent,0)!=0)throw new Exception("SDK lifetime handle reconciliation UNKNOWN");}
   if(outerJob!=IntPtr.Zero)CloseHandle(outerJob);if(parent!=IntPtr.Zero)CloseHandle(parent);
   if(pi.process!=IntPtr.Zero)CloseHandle(pi.process);if(pi.thread!=IntPtr.Zero)CloseHandle(pi.thread);if(token!=IntPtr.Zero)CloseHandle(token);
   if(input!=IntPtr.Zero&&input!=new IntPtr(-1))CloseHandle(input);
   if(!clientsClosed){if(outPipe!=null)outPipe.DisposeLocalCopyOfClientHandle();if(errPipe!=null)errPipe.DisposeLocalCopyOfClientHandle();}
   if(outReader!=null&&!outReader.Join(5000))throw new Exception("Stdout completion unknown");if(errReader!=null&&!errReader.Join(5000))throw new Exception("Stderr completion unknown");
   if(outPipe!=null)outPipe.Dispose();if(errPipe!=null)errPipe.Dispose();
   if(initialized)DeleteProcThreadAttributeList(list);
   foreach(var p in new[]{list,cap,policy,env,handles,capList,limits})if(p!=IntPtr.Zero)Marshal.FreeHGlobal(p);
   for(int i=0;i<groupCount;i++)LocalFree(Marshal.ReadIntPtr(groups,i*IntPtr.Size));if(groups!=IntPtr.Zero)LocalFree(groups);
   for(int i=0;i<capCount;i++)LocalFree(Marshal.ReadIntPtr(sids,i*IntPtr.Size));if(sids!=IntPtr.Zero)LocalFree(sids);
   // Never propagate ACL changes through a tool-created reparse point or hardlink.
   foreach(var item in original)Tree(item.Key);
   foreach(var item in original)Directory.SetAccessControl(item.Key,item.Value);
   if(sid!=IntPtr.Zero)FreeSid(sid);
   if(profile){int hr=DeleteAppContainerProfile(moniker);if(hr!=0)Marshal.ThrowExceptionForHR(hr);result.profileDeleted=true;}
  }
  result.output=capture.Text;result.truncated|=capture.Oversized;if(result.truncated&&result.code==0)result.code=125;
  Record(Path.Combine(records,prefix+".finished.json"),"{\"version\":1,\"binding\":\""+binding+"\",\"stopped\":true,\"profileDeleted\":"+result.profileDeleted.ToString().ToLowerInvariant()+",\"code\":"+result.code+"}");
  return result;
 }
}

'@
$answer = [IsSwfWindowsTool]::Run([string]$r.work,[string]$r.factory,[string]$r.runtime,[string]$r.scratch,[string]$r.records,[string]$r.prefix,[string]$r.binding,[string]$r.command,[int]$r.timeout,[uint32]$r.parentPid,[string]$r.parentFileTime)
$answer | ConvertTo-Json -Compress
`;

async function createWindowsToolRunnerImpl({ work, factoryRoot, nodeBinary, binarySha256 }, launcherSource) {
  if (process.platform !== 'win32') throw Error('Windows LPAC backend requires native Windows');
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const { createHash, randomBytes } = await import('node:crypto');
  const { spawn, spawnSync } = await import('node:child_process');
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  for (const value of [work, factoryRoot, nodeBinary]) if (typeof value !== 'string' || !path.isAbsolute(value) || /[\0\r\n"]/.test(value)) throw Error('Invalid native sandbox scope');
  if (!/^[0-9a-f]{64}$/.test(binarySha256)) throw Error('Exact executable digest required');
  for (const value of [work, factoryRoot]) if ((await fs.lstat(value)).isSymbolicLink()) throw Error('Sandbox roots must not be aliases');
  work = await fs.realpath(work); factoryRoot = await fs.realpath(factoryRoot);
  const inside = (parent, child) => { const r = path.relative(parent, child); return !r || (!path.isAbsolute(r) && r !== '..' && !r.startsWith('..' + path.sep)); };
  if (inside(work, factoryRoot) || inside(factoryRoot, work)) throw Error('Writable and readonly scopes must be disjoint');
  const records = path.join(path.dirname(work), 'native-tools');
  if (inside(work, records) || inside(factoryRoot, records)) throw Error('Records must be outside all tool scopes');
  const atomic = async (file, value) => {
    const temp = file + '.' + randomBytes(8).toString('hex') + '.tmp';
    const handle = await fs.open(temp, 'wx', 0o600);
    try { await handle.writeFile(JSON.stringify(value) + '\n'); await handle.sync(); } finally { await handle.close(); }
    await fs.link(temp, file); await fs.unlink(temp);
  };
  await fs.mkdir(records);
  const runtime = path.join(records, 'runtime'), scratch = path.join(records, 'scratch'), helperTemp = path.join(records, 'helper-temp');
  for (const folder of [runtime, scratch, helperTemp]) await fs.mkdir(folder);
  const binary = await fs.readFile(nodeBinary);
  if (digest(binary) !== binarySha256) throw Error('Pinned executable changed before sandbox preparation');
  const executable = path.join(runtime, 'node.exe');
  await fs.writeFile(executable, binary, { flag: 'wx' });
  const launcher = path.join(runtime, 'launcher.ps1');
  const script = await fs.open(launcher, 'wx', 0o600);
  try { await script.writeFile(launcherSource); await script.sync(); } finally { await script.close(); }
  const systemRoot = process.env.SystemRoot || process.env.SYSTEMROOT;
  if (!systemRoot || !path.isAbsolute(systemRoot)) throw Error('SystemRoot unavailable');
  const powershell = path.join(systemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const identity = spawnSync(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '[Diagnostics.Process]::GetProcessById(' + process.pid + ').StartTime.ToUniversalTime().ToFileTimeUtc().ToString()'], { encoding: 'utf8', timeout: 10000, windowsHide: true });
  const parentFileTime = identity.stdout?.trim();
  if (identity.error || identity.status !== 0 || !/^\d+$/.test(parentFileTime || '')) throw Error('Exact SDK owner creation time unavailable');
  await atomic(path.join(records, 'policy.json'), { version: 1, policy: 'native-tools-lpac-job-v1', parentPid: process.pid, parentFileTime, binarySha256, launcherSha256: digest(launcherSource) });
  let sequence = 0, running = false, blocked = false;
  const runner = async (command, timeout = 10000, modelCall) => {
    if (running || blocked) throw Error('Native Windows runner has unresolved or concurrent execution');
    if (typeof command !== 'string' || !command || command.length > 8000 || command.includes('\0') || !Number.isInteger(timeout) || timeout < 1 || timeout > 10000) throw Error('Invalid bounded Windows command');
    if (++sequence > 64) throw Error('Native tool record budget exceeded');
    running = true; blocked = true;
    const prefix = String(sequence).padStart(6, '0');
    const intent = { version: 1, seq: sequence, nonce: randomBytes(16).toString('hex'), binarySha256, ...(modelCall ? { modelCall } : {}) };
    const binding = digest(JSON.stringify(intent));
    try {
      await atomic(path.join(records, prefix + '.intent.json'), { ...intent, binding });
      const root = process.env.SystemRoot || process.env.SYSTEMROOT;
      if (!root || !path.isAbsolute(root)) throw Error('SystemRoot unavailable');
      const environment = {};
      for (const key of ['SystemRoot', 'WINDIR', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA']) if (process.env[key]) environment[key] = process.env[key];
      environment.PATH = path.join(root, 'System32'); environment.TEMP = helperTemp; environment.TMP = helperTemp;
      const result = await new Promise((resolveRun, rejectRun) => {
        const child = spawn(path.join(root, 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', launcher], { cwd: records, env: environment, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
        let out = Buffer.alloc(0), err = Buffer.alloc(0), over = false;
        const timer = setTimeout(() => { over = true; child.kill(); }, timeout + 30000);
        const collect = (previous, chunk) => {
          if (previous.length + chunk.length > 65536) { over = true; child.kill(); }
          return Buffer.concat([previous, chunk.subarray(0, Math.max(0, 65536 - previous.length))]);
        };
        child.stdout.on('data', bytes => { out = collect(out, bytes); }); child.stderr.on('data', bytes => { err = collect(err, bytes); });
        child.stdin.on('error', () => {});
        child.once('error', error => { clearTimeout(timer); rejectRun(error); });
        child.once('close', code => {
          clearTimeout(timer);
          if (code !== 0 || over) { rejectRun(Error('Native Windows controller failed; preserve records: ' + err.toString().slice(0, 2000))); return; }
          try { resolveRun(JSON.parse(out.toString().trim())); } catch { rejectRun(Error('Native Windows controller returned invalid evidence')); }
        });
        child.stdin.end(JSON.stringify({ work, factory: factoryRoot, runtime, scratch, records, prefix, binding, command, timeout, parentPid: process.pid, parentFileTime }));
      });
      const started = JSON.parse(await fs.readFile(path.join(records, prefix + '.started.json'), 'utf8'));
      const finished = JSON.parse(await fs.readFile(path.join(records, prefix + '.finished.json'), 'utf8'));
      if (started.binding !== binding || started.lpacRequested !== true || started.jobAssignedBeforeResume !== true || started.dualJobLifetime !== true || started.sdkOwnerPid !== process.pid || started.sdkOwnerCreationFileTime !== parentFileTime || !Number.isInteger(started.pid) || !/^\d+$/.test(started.creationFileTime) || finished.binding !== binding || finished.stopped !== true || finished.profileDeleted !== true || result.stopped !== true || result.profileDeleted !== true || finished.code !== result.code) throw Error('Incomplete or mismatched native command evidence');
      blocked = false;
      return { code: result.code, output: result.output, truncated: result.truncated };
    } finally { running = false; }
  };
  runner.paths = Object.freeze({ executable, work, factoryRoot, records, scratch });
  return runner;
}

export async function createWindowsToolRunner(options) {
  return createWindowsToolRunnerImpl(options, WINDOWS_SANDBOX_PS);
}

export function windowsToolSource() {
  // Bundlers may rename function declarations. Bind the stable task API explicitly,
  // and pass the launcher as data instead of serializing a closure over its name.
  return 'const createWindowsToolRunner = options => (' + createWindowsToolRunnerImpl.toString() + ')(options,' + JSON.stringify(WINDOWS_SANDBOX_PS) + ');';
}
