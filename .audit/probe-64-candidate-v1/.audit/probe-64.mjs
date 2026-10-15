import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(new URL("..", `file://${fileURLToPath(import.meta.url)}`).pathname);
const sourceId = "5c9a516fa967a9f7b6fcbaf774a315b59a6cff94";
const nodeHost = "/home/iseoane/.local/share/mise/installs/node/26.8.1/bin/node";
const piModules = "/home/iseoane/.pi/agent/install/releases/1.2.0/node_modules";
const piCli = "/runtime/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js";
const root = await mkdtemp(join(tmpdir(), "isswf-probe64-"));
const output = join(root, "result.json");
const cases = [];
const timeout = 12_000;
const hash = (data) => createHash("sha256").update(data).digest("hex");
const shaFile = async (path) => hash(await readFile(path));
function record(name, status, expected, actual, note = "") {
  cases.push({ name, status, expected, actual, note });
  console.log(JSON.stringify({ case: name, status, expected, actual, note }));
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout, maxBuffer: 4 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  return result;
}
function assertRun(command, args, options = {}) {
  const result = run(command, args, options);
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed (${result.status}): ${result.stderr}`);
  return result.stdout;
}
async function walk(path) {
  const out = [];
  for (const item of await readdir(path, { withFileTypes: true })) {
    const full = join(path, item.name);
    if (item.isDirectory()) out.push(...await walk(full));
    else if (item.isFile()) out.push(full);
  }
  return out;
}
async function snapshot(paths) {
  return Object.fromEntries(await Promise.all(paths.map(async (path) => [path, await shaFile(path)])));
}
function bwrapArgs(project, factory, command) {
  return ["--unshare-user", "--unshare-pid", "--unshare-net", "--unshare-ipc", "--unshare-uts", "--new-session", "--die-with-parent", "--cap-drop", "ALL", "--clearenv",
    "--ro-bind", "/usr", "/usr", "--symlink", "usr/bin", "/bin", "--symlink", "usr/lib", "/lib", "--symlink", "usr/lib", "/lib64",
    "--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp", "--dir", "/tmp/home",
    "--ro-bind", nodeHost, "/runtime/node", "--ro-bind", piModules, "/runtime/node_modules",
    "--ro-bind", factory, "/factory", "--bind", project, "/work", "--chdir", "/work",
    "--setenv", "PATH", "/usr/bin:/bin:/runtime", "--setenv", "HOME", "/tmp/home", "--setenv", "PI_CODING_AGENT_DIR", "/tmp/home/agent",
    "--setenv", "PI_OFFLINE", "1", "--setenv", "PI_SKIP_VERSION_CHECK", "1", "--setenv", "PI_TELEMETRY", "0",
    "--setenv", "LANG", "C.UTF-8", "--dir", "/tmp/home/agent",
    "--remount-ro", "/", "--", ...command];
}
async function rpc(project, factory, approval, secret, requestList) {
  const args = bwrapArgs(project, factory, ["/runtime/node", piCli, "--mode", "rpc", "--offline", "--no-extensions", "--no-mcp", "--no-session", approval ? "--approve" : "--no-approve", "--tools", "read,grep,find,ls,bash"]);
  const child = spawn("/usr/bin/bwrap", args, { cwd: "/", env: { PATH: "/usr/bin:/bin", FAKE_CREDENTIAL: secret }, stdio: ["pipe", "pipe", "pipe"] });
  let out = "";
  let err = "";
  child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
  child.stdout.on("data", (x) => { out += x; }); child.stderr.on("data", (x) => { err += x; });
  const kill = setTimeout(() => child.kill("SIGKILL"), timeout);
  const replies = new Map();
  let pending = "";
  child.stdout.on("data", (chunk) => {
    pending += chunk;
    for (;;) {
      const ix = pending.indexOf("\n");
      if (ix < 0) break;
      const line = pending.slice(0, ix); pending = pending.slice(ix + 1);
      try { const msg = JSON.parse(line); if (msg.type === "response" && msg.id) replies.set(msg.id, msg); } catch {}
    }
  });
  async function request(type, fields = {}) {
    const id = `probe64-${requestList.length}`;
    requestList.push({ type, id });
    child.stdin.write(`${JSON.stringify({ type, id, ...fields })}\n`);
    const end = Date.now() + timeout;
    while (Date.now() < end && child.exitCode === null) {
      if (replies.has(id)) return replies.get(id);
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error(`Pi RPC ${type} timed out; stdout=${out}; stderr=${err}`);
  }
  try {
    const state = await request("get_state");
    if (!state.success) throw new Error(`get_state failed: ${JSON.stringify(state)}`);
    const catalog = await request("get_commands");
    if (!catalog.success) throw new Error(`get_commands failed: ${JSON.stringify(catalog)}`);
    return { child, request, commands: catalog.data.commands, stderr: () => err, stdout: () => out, close: async () => {
      clearTimeout(kill);
      child.stdin.end();
      await new Promise((resolveClose) => child.once("close", resolveClose));
    } };
  } catch (error) {
    child.kill("SIGKILL"); clearTimeout(kill); throw error;
  }
}

console.log(JSON.stringify({ event: "probe-root", root, repository: repo, sourceId, targetId: "disposable-project-fixture", cleanup: "not performed" }));
let listener;
let result = { probe: 64, status: "incomplete", root, repository: repo, sourceId, instrument: { path: fileURLToPath(import.meta.url), sha256: null }, targetId: null, cases, limits: ["disposable single-writer fixture only", "no lifecycle/recovery or multiwriter proof", "no real model/auth/provider integration", "MCP disabled; no authority broker claimed", "no deliberate inherited-file-descriptor test", "no general resource limits or production security claim"] };
try {
  result.instrument.sha256 = await shaFile(result.instrument.path);
  assert.equal(assertRun("git", ["rev-parse", "--show-toplevel"], { cwd: repo }).trim(), repo, "unexpected checkout root");
  assert.equal(assertRun("git", ["rev-parse", "HEAD"], { cwd: repo }).trim(), "5c9a516fa967a9f7b6fcbaf774a315b59a6cff94", "unexpected baseline");
  assert.equal((await stat(nodeHost)).isFile(), true);
  assert.equal((await stat(join(piModules, "@earendil-works/pi-coding-agent", "dist/bundle/cli.js"))).isFile(), true);
  const version = assertRun(nodeHost, [join(piModules, "@earendil-works/pi-coding-agent", "dist/bundle/cli.js"), "--version"]);
  assert.equal(version.trim(), "1.2.0");
  const bwrapVersion = assertRun("/usr/bin/bwrap", ["--version"]).trim();
  assert.match(bwrapVersion, /^bubblewrap 0\.12\./u);
  const namespace = run("/usr/bin/bwrap", ["--unshare-user", "--unshare-pid", "--unshare-net", "--ro-bind", "/usr", "/usr", "--symlink", "usr/bin", "/bin", "--symlink", "usr/lib", "/lib", "--symlink", "usr/lib", "/lib64", "--proc", "/proc", "--dev", "/dev", "--", "/usr/bin/true"], { env: { PATH: "/usr/bin:/bin" } });
  if (namespace.status !== 0) throw new Error(`Bubblewrap namespace preflight failed: ${namespace.stderr}`);
  record("preflight-bwrap-namespaces", "PROVEN", "required namespaces and minimal runtime start", { bwrapVersion, exitCode: namespace.status });
  const systemd = run("/usr/bin/systemd-run", ["--user", "--wait", "--pipe", "--collect", "--quiet", "/usr/bin/true"], { timeout: 3_000, env: { PATH: "/usr/bin:/bin", DBUS_SESSION_BUS_ADDRESS: process.env.DBUS_SESSION_BUS_ADDRESS || "" } });
  record("systemd-run-user-preflight", systemd.status === 0 ? "OBSERVED_AVAILABLE" : "UNAVAILABLE", "bounded ephemeral user unit only; not isolation evidence", { exitCode: systemd.status, stderr: (systemd.stderr || "").slice(0, 500) }, "not used as a sandbox");

  const archive = join(root, "factory.tar");
  assertRun("git", ["archive", "--format=tar", `--output=${archive}`, sourceId, "--", ".agents", ".factory", "docs"], { cwd: repo });
  const archiveHash = await shaFile(archive);
  const factory = join(root, "factory");
  await mkdir(factory);
  assertRun("tar", ["--extract", `--file=${archive}`, "--directory", factory, "--no-same-owner", "--no-same-permissions"]);
  const setupSkill = join(factory, ".agents/skills/isswf-setup/SKILL.md");
  const setupBody = await readFile(setupSkill, "utf8");
  assert.ok(setupBody.length > 100, "pinned isswf-setup skill missing from archive");
  await writeFile(join(factory, "package.json"), JSON.stringify({ name: "isswf-task64-pinned-factory", version: "5c9a516", pi: { skills: ["./.agents/skills"] } }, null, 2) + "\n");
  for (const path of await walk(factory)) await chmod(path, 0o444);
  for (const path of [factory, join(factory, ".agents"), join(factory, ".agents/skills")]) await chmod(path, 0o555);
  const factoryHashBefore = await snapshot(await walk(factory));

  const project = join(root, "project");
  const home = join(root, "home");
  const outside = join(root, "outside-canary.txt");
  await Promise.all([mkdir(project), mkdir(join(home, "agent"), { recursive: true })]);
  await writeFile(outside, "TASK64-FAKE-OUTSIDE-CANARY\n");
  const outsideHashBefore = await shaFile(outside);
  await (await import("node:fs/promises")).symlink(outside, join(project, "outside-link"));
  const markers = [join(project, "AGENTS.md"), join(project, ".pi/settings.json"), join(project, ".factory/models.json")];
  await mkdir(join(project, ".pi"), { recursive: true }); await mkdir(join(project, ".factory"), { recursive: true });
  await writeFile(markers[0], "pre-existing fixture instructions\n");
  await writeFile(markers[1], JSON.stringify({ packages: [{ source: "/factory" }] }, null, 2) + "\n");
  await writeFile(markers[2], '{"fixture":"preserve-byte-for-byte"}\n');
  const markerHashBefore = await snapshot(markers);
  result.targetId = { fixture: project, markerHashesBefore: markerHashBefore };
  record("fixture-ownership", "PRECONDITION", "unique mkdtemp root; one probe writer", { root, project, exclusiveOwnerAssumed: true }, "not proof against a second writer");

  listener = spawn(nodeHost, ["-e", "const n=require('net'); const s=n.createServer(c=>c.end('canary')); s.listen(0,'127.0.0.1',()=>console.log(s.address().port))"], { stdio: ["ignore", "pipe", "pipe"] });
  const port = await new Promise((resolvePort, reject) => { let buffer = ""; listener.stdout.setEncoding("utf8"); listener.stdout.on("data", (s) => { buffer += s; const p = Number(buffer.trim()); if (p) resolvePort(p); }); listener.once("error", reject); setTimeout(() => reject(new Error("listener startup timeout")), 2_000); });
  assert.ok(Number.isInteger(port) && port > 0);
  record("outside-controls-live", "PROVEN", "canary exists/readable and TCP listener accepts on host loopback", { fileHash: await shaFile(outside), fileBytes: (await readFile(outside, "utf8")).trim(), listenerPort: port });

  const requestLog = [];
  const token = `TASK64-FAKE-CREDENTIAL-${process.pid}`;
  for (const approval of [false, true]) {
    const session = await rpc(project, factory, approval, token, requestLog);
    const loaded = session.commands.filter((item) => item.source === "skill" && item.name === "skill:isswf-setup");
    const skillPass = approval ? loaded.length === 1 && loaded[0].sourceInfo.path === "/factory/.agents/skills/isswf-setup/SKILL.md" : loaded.length === 0;
    record(approval ? "pi-rpc-approved-setup-discovery" : "pi-rpc-noapprove-setup-absent", skillPass ? "PROVEN" : "FAIL", approval ? `one skill from ${setupSkill}` : "no skill loaded", loaded);
    if (!skillPass) throw new Error(`Pi package approval/catalog mismatch: ${JSON.stringify(loaded)}`);
    if (approval) {
      const outsidePath = outside;
      const sourceSkill = "/factory/.agents/skills/isswf-setup/SKILL.md";
      const shellProbe = `node -e ${JSON.stringify(`const fs=require('fs'),net=require('net'),cp=require('child_process');fs.writeFileSync('/work/worker-positive.txt','write-ok');console.log('write-ok');const tries={};for(const [k,fn] of Object.entries({outsideRead:()=>fs.readFileSync(${JSON.stringify(outsidePath)}),outsideWrite:()=>fs.writeFileSync(${JSON.stringify(outsidePath)},'changed'),symlinkRead:()=>fs.readFileSync('/work/outside-link'),symlinkWrite:()=>fs.writeFileSync('/work/outside-link','changed'),sourceWrite:()=>fs.writeFileSync(${JSON.stringify(sourceSkill)},'changed'),secret:()=>process.env.FAKE_CREDENTIAL,network:()=>{const s=net.connect(${port},'127.0.0.1');s.setTimeout(700);s.on('connect',()=>{tries.network='connected';s.destroy()});s.on('error',e=>tries.network=e.code);},subprocess:()=>{const r=cp.spawnSync('/bin/sh',['-c','cat ${outsidePath}'],{encoding:'utf8'});tries.subprocess={status:r.status,error:r.error?.code||null,stderr:r.stderr}}})){try{const v=fn();if(k!=='network'&&k!=='subprocess')tries[k]=v}catch(e){tries[k]=e.code||e.name}}setTimeout(()=>console.log(JSON.stringify(tries)),800);`)}`;
      const response = await session.request("bash", { command: shellProbe });
      const data = response.data || {};
      let report;
      try { report = JSON.parse(data.output.trim().split("\n").at(-1)); } catch { report = { parseError: true, output: data.output, exitCode: data.exitCode }; }
      const checks = [
        ["worker-positive-write", data.exitCode === 0 && data.output.includes("write-ok"), "worker writes only under /work"],
        ["outside-canary-read", report.outsideRead === "ENOENT", "ENOENT; pre-existing canary readable on host"],
        ["absolute-symlink-read-escape", report.symlinkRead === "ENOENT", "ENOENT through absolute symlink to host canary"],
        ["absolute-symlink-write-escape", report.symlinkWrite === "ENOENT", "ENOENT writing through absolute symlink to host canary"],
        ["outside-canary-write", report.outsideWrite === "ENOENT", "ENOENT; outside canary unchanged"],
        ["factory-source-write", report.sourceWrite === "EROFS", "EROFS on pinned readonly source"],
        ["environment-secret", report.secret === undefined, "fake credential absent from worker environment"],
        ["fake-authority-endpoint", ["ECONNREFUSED", "ENETUNREACH"].includes(report.network), "fake host-local authority listener is unreachable from worker namespace"],
        ["subprocess-outside-read", report.subprocess?.status !== 0 && report.subprocess?.stderr?.includes("No such file or directory"), "subprocess inherits namespace; expected ENOENT message"],
      ];
      for (const [name, ok, expected] of checks) {
        const actual = {
          "worker-positive-write": data,
          "outside-canary-read": report.outsideRead,
          "absolute-symlink-read-escape": report.symlinkRead,
          "absolute-symlink-write-escape": report.symlinkWrite,
          "outside-canary-write": report.outsideWrite,
          "factory-source-write": report.sourceWrite,
          "environment-secret": report.secret ?? null,
          "fake-authority-endpoint": report.network,
          "subprocess-outside-read": report.subprocess,
        }[name];
        record(name, ok ? "PROVEN" : "FAIL", expected, actual);
        if (!ok) throw new Error(`Pi RPC probe failed ${name}: ${JSON.stringify({ data, report })}`);
      }
      const afterOutside = await shaFile(outside);
      assert.equal(afterOutside, outsideHashBefore, "outside canary changed");
      record("outside-canary-unchanged", "PROVEN", "same hash after denied attempts", { hash: afterOutside });
      const sourceRead = await snapshot(await walk(factory));
      assert.deepEqual(sourceRead, factoryHashBefore, "factory archive copy changed during Pi execution");
      await session.close();
    } else await session.close();
  }
  const markerHashAfter = await snapshot(markers);
  assert.deepEqual(markerHashAfter, markerHashBefore, "pre-existing project markers changed");
  record("target-markers-preserved", "PROVEN", "AGENTS/settings/models byte hashes unchanged", markerHashAfter);
  assert.deepEqual(await snapshot(await walk(factory)), factoryHashBefore, "factory source changed");
  record("pinned-source-preserved", "PROVEN", "archive-derived shared source copy hashes unchanged", { archiveHash, files: Object.keys(factoryHashBefore).length });
  listener.kill("SIGTERM");
  await new Promise((r) => listener.once("close", r));
  listener = null;
  result.status = "PROBE_COMPLETE_WITH_UNPROVEN_REQUIREMENTS";
  result.source = { revision: sourceId, archiveSha256: archiveHash, stagedFactoryPath: factory, piVersion: "1.2.0", nodeVersion: process.version, bwrapVersion };
  result.targetId.markerHashesAfter = markerHashAfter;
  result.rpc = { requests: requestLog, mode: "same actual Pi RPC process, get_state/get_commands/bash, --offline, --no-mcp", modelCall: false, credentials: "fake only; no host auth/home mounted" };
  result.generated = { root, results: output, sourceTreeHashes: factoryHashBefore };
} catch (error) {
  record("probe-aborted", "BLOCKED_OR_FAILED", "failed preflight/case retained; no inferred PASS", { name: error.name, message: error.message, stack: error.stack?.split("\n").slice(0, 5) });
  result.status = "BLOCKED_OR_FAILED";
  result.error = { name: error.name, message: error.message };
} finally {
  if (listener && listener.exitCode === null) listener.kill("SIGKILL");
  await writeFile(output, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ event: "result", status: result.status, path: output, root, cases: cases.length }));
}
