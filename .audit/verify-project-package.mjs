import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidate = "1bf9ddcd762493a009f26bf58cf7a4b78a31cb99";
const pi = process.env.PI_BIN || "pi";
const python = process.env.PYTHON || "python3";
const timeoutMs = 30_000;
const root = await mkdtemp(join(tmpdir(), "isswf-project-package-proof-"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.equal(result.error, undefined, `${command} failed: ${result.error}`);
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed\n${result.stderr}`);
  return result.stdout;
}

function cleanEnv(home, agentDir) {
  return {
    PATH: process.env.PATH,
    LANG: process.env.LANG || "C.UTF-8",
    LC_ALL: process.env.LC_ALL || "C.UTF-8",
    HOME: home,
    PI_CODING_AGENT_DIR: agentDir,
    PI_OFFLINE: "1",
    PI_SKIP_VERSION_CHECK: "1",
    PI_TELEMETRY: "0",
  };
}

async function rpcCommands(project, env, approved) {
  const args = ["--mode", "rpc", "--no-session", "--offline", "--no-mcp"];
  args.push(approved ? "--approve" : "--no-approve");
  const child = spawn(pi, args, { cwd: project, env, stdio: ["pipe", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, timeoutMs);
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdin.end('{"id":"catalog","type":"get_commands"}\n');
  const exit = await new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolveExit({ code, signal }));
  }).finally(() => clearTimeout(timer));
  assert.equal(timedOut, false, `Pi RPC timed out in ${project}`);
  assert.equal(exit.code, 0, `Pi RPC exited ${exit.code ?? exit.signal}\n${stderr}\n${stdout}`);
  const records = stdout.split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line));
  const response = records.find((record) => record.type === "response" && record.id === "catalog");
  assert.equal(response?.success, true, `Pi RPC get_commands failed\n${stdout}\n${stderr}`);
  return { commands: response.data.commands, stderr };
}

async function main() {
  const archive = join(root, "candidate.tar");
  run("git", ["archive", "--format=tar", `--output=${archive}`, candidate], { cwd: repo });
  const extract = "import pathlib,sys,tarfile; root=pathlib.Path(sys.argv[2]).resolve(); tf=tarfile.open(sys.argv[1]); members=tf.getmembers(); [(_ for _ in ()).throw(SystemExit('unsafe archive path')) for m in members if (root / m.name).resolve() != root and root not in (root / m.name).resolve().parents]; tf.extractall(root, filter='data')";
  const factory = join(root, "factory");
  await mkdir(factory);
  run(python, ["-c", extract, archive, factory]);
  const skillFile = join(factory, ".agents", "skills", "isswf-triage", "SKILL.md");
  const skillBody = await readFile(skillFile, "utf8");
  assert.match(skillBody, /Prepara o reconcilia una propuesta/u);
  await writeFile(join(factory, "package.json"), JSON.stringify({
    name: "isswf-shared-factory-proof",
    version: "1.0.0",
    pi: { skills: ["./.agents/skills"] },
  }, null, 2) + "\n");

  const results = [];
  const projects = [];
  for (const name of ["project-one", "project-two"]) {
    const project = join(root, name);
    const home = join(root, `${name}-home`);
    const agentDir = join(root, `${name}-agent`);
    await Promise.all([mkdir(project), mkdir(home), mkdir(agentDir)]);
    await writeFile(join(agentDir, "settings.json"), "{}\n");
    const projectPi = join(project, ".pi");
    await mkdir(projectPi);
    await writeFile(join(projectPi, "settings.json"), JSON.stringify({
      packages: [{ source: factory }],
    }, null, 2) + "\n");
    const env = cleanEnv(home, agentDir);
    const approvedResult = await rpcCommands(project, env, true);
    const approved = approvedResult.commands;
    const loaded = approved.filter((item) => item.source === "skill" && item.name === "skill:isswf-triage");
    assert.equal(loaded.length, 1, `${name}: approved project package did not expose exactly one triage skill\n${JSON.stringify(approved, null, 2)}\n${approvedResult.stderr}`);
    assert.equal(loaded[0].sourceInfo.path, skillFile, `${name}: skill did not resolve to the shared factory path`);
    assert.equal(await readFile(loaded[0].sourceInfo.path, "utf8"), skillBody);

    const unapproved = (await rpcCommands(project, env, false)).commands;
    assert.equal(unapproved.some((item) => item.source === "skill" && item.name === "skill:isswf-triage"), false,
      `${name}: --no-approve loaded the project package skill`);

    const authorization = {
      repo: `proof/${name}`,
      issue: 1,
      objective: "Probar aislamiento temporal",
      scope: "Solo el directorio temporal",
      actor: "project-package-proof",
      decision: "approve",
    };
    const authFile = join(project, "authorization.json");
    const stateDir = join(project, ".private-state");
    await writeFile(authFile, JSON.stringify(authorization) + "\n");
    const pythonEnv = { ...env, PYTHONPATH: factory };
    const imported = run(python, ["-c", "import isswf; print(isswf.__file__)"], { cwd: project, env: pythonEnv }).trim();
    assert.equal(imported, join(factory, "isswf", "__init__.py"), `${name}: Python module did not resolve from the immutable candidate`);
    const created = JSON.parse(run(python, ["-m", "isswf", "--state", stateDir, "authorize", authFile], { cwd: project, env: pythonEnv }));
    assert.equal(created.repo, authorization.repo);
    const listed = JSON.parse(run(python, ["-m", "isswf", "--state", stateDir, "show"], { cwd: project, env: pythonEnv }));
    assert.deepEqual(listed, []);
    const storedRepo = run(python, ["-c", "import sqlite3,sys; print(sqlite3.connect(sys.argv[1]).execute('select repo from grants').fetchone()[0])", join(stateDir, "isswf.sqlite3")], { cwd: project, env: pythonEnv }).trim();
    assert.equal(storedRepo, authorization.repo, `${name}: CLI did not persist its grant in the selected state directory`);
    projects.push({ name, state: join(stateDir, "isswf.sqlite3"), storedRepo, skillPath: loaded[0].sourceInfo.path });
    results.push(`${name}: --approve skill loaded from shared factory; --no-approve omitted it; Python CLI imported via exact PYTHONPATH and wrote isolated state`);
  }

  assert.notEqual(projects[0].state, projects[1].state, "projects unexpectedly share a state path");
  assert.notEqual(projects[0].storedRepo, projects[1].storedRepo, "project grants unexpectedly share data");
  for (const item of projects) {
    assert.equal(item.skillPath, projects[0].skillPath, "projects do not reference the same stable factory skill path");
    assert.equal(await readFile(item.skillPath, "utf8"), skillBody);
  }
  const version = run(pi, ["--version"], { cwd: repo, env: cleanEnv(join(root, "version-home"), join(root, "version-agent")) }).trim();
  assert.equal(version, "1.2.0", `unexpected Pi version ${version}`);
  return { candidate, pi: version, projects: results, rpc: "real Pi CLI get_commands, no prompt/model call, no-session, isolated HOME and agentDir", cleanup: "temporary root removed in finally" };
}

try {
  const proof = await main();
  console.log(JSON.stringify(proof, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
