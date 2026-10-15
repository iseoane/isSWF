import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  chmod,
  cp,
  mkdir,
  readFile,
  readdir,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const installer = join(repo, "tools", "factory-package.mjs");
const pi = process.env.PI_BIN || "pi";
const timeoutMs = 30_000;
const outputLimit = 2 * 1024 * 1024;
const payloadPaths = [
  ".agents/skills/isswf-coordinator/SKILL.md",
  ".agents/skills/isswf-setup/SKILL.md",
  ".agents/roles/worker.md",
  ".agents/roles/diagnostician.md",
  ".agents/roles/reviewer.md",
  ".agents/roles/references/bug-diagnosis.md",
  ".agents/roles/references/design-principles.md",
  ".agents/roles/references/execution-principles.md",
  ".agents/roles/references/verification-principles.md",
  ".agents/roles/references/tdd.md",
  ".agents/roles/references/code-quality.md",
  ".agents/roles/references/comments.md",
  ".agents/roles/references/review.md",
  "docs/durable-work.md",
  "docs/model-routing.md",
  "docs/templates/job-brief.md",
  "docs/templates/attempt.md",
  "docs/templates/review.md",
  ".factory/models.json",
  "package.json",
];
const receiptName = ".isswf-package-receipt.json";
const names = ["isswf-coordinator", "isswf-setup"];
const root = join(tmpdir(), `isswf-activation44-${process.pid}-${Date.now()}`);
const fixtureSource = join(root, "source-repo");
const store = join(root, "shared-store");
const packageStore = join(store, "PACKAGE_SHA");
const project = join(root, "target-project");
const home = join(root, "pi-home");
const agentDir = join(root, "pi-agent");

function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: outputLimit,
  });
  assert.equal(result.error, undefined, `${executable} failed: ${result.error}`);
  if (options.expectFailure) {
    assert.notEqual(result.status, 0, `${executable} unexpectedly succeeded: ${args.join(" ")}`);
    if (typeof options.expectFailure === "string") {
      assert.ok(result.stderr.includes(options.expectFailure), `${executable} failed for an unexpected reason: ${result.stderr}`);
    }
  } else {
    assert.equal(result.status, 0, `${executable} ${args.join(" ")} failed\n${result.stderr}`);
  }
  return result.stdout;
}

function git(cwd, args, options = {}) {
  return command("git", ["-C", cwd, ...args], options);
}

function installerCommand(args, options = {}) {
  return command(process.execPath, [installer, ...args], options);
}

function cleanEnv(projectHome, projectAgentDir) {
  return {
    PATH: process.env.PATH,
    LANG: process.env.LANG || "C.UTF-8",
    LC_ALL: process.env.LC_ALL || "C.UTF-8",
    HOME: projectHome,
    PI_CODING_AGENT_DIR: projectAgentDir,
    PI_OFFLINE: "1",
    PI_SKIP_VERSION_CHECK: "1",
    PI_TELEMETRY: "0",
  };
}

async function treeFiles(directory, rootDirectory = directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await treeFiles(path, rootDirectory));
    else if (entry.isFile()) paths.push(path.slice(rootDirectory.length + 1).split("/").join("/"));
    else assert.fail(`Unexpected package entry type: ${path}`);
  }
  return paths.sort();
}

async function snapshot(paths) {
  const values = {};
  for (const path of paths) values[path] = (await readFile(path)).toString("base64");
  return values;
}

async function expectRefusal(action, unchangedPaths) {
  const before = await snapshot(unchangedPaths);
  action();
  assert.deepEqual(await snapshot(unchangedPaths), before, "refused operation changed protected bytes");
}

async function setupGitProject(path, settingsBytes) {
  await mkdir(join(path, ".pi"), { recursive: true });
  await writeFile(join(path, ".pi", "settings.json"), settingsBytes);
  await writeFile(join(path, "AGENTS.md"), "Project instructions must remain unchanged.\n");
  await mkdir(join(path, ".factory"), { recursive: true });
  await writeFile(join(path, ".factory", "models.json"), '{"projectModelChoice":"keep"}\n');
  await mkdir(join(path, ".factory", "jobs", "J001"), { recursive: true });
  await writeFile(join(path, ".factory", "jobs", "J001", "A001.md"), "Pinned attempt bytes.\n");
  git(path, ["init", "-q"]);
  git(path, ["config", "user.name", "Activation fixture"]);
  git(path, ["config", "user.email", "activation-fixture@example.invalid"]);
  git(path, ["add", ".pi/settings.json", "AGENTS.md", ".factory"]);
  git(path, ["commit", "-qm", "project input fixture"]);
}

async function rpcCommands(cwd, env, approved) {
  const args = ["--mode", "rpc", "--no-session", "--offline", "--no-mcp", approved ? "--approve" : "--no-approve"];
  const child = spawn(pi, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  let timedOut = false;
  let oversized = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, timeoutMs);
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    if (stdout.length > outputLimit) {
      oversized = true;
      child.kill("SIGKILL");
    }
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
    if (stderr.length > outputLimit) {
      oversized = true;
      child.kill("SIGKILL");
    }
  });
  child.stdin.end('{"id":"catalog","type":"get_commands"}\n');
  const exit = await new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolveExit({ code, signal }));
  }).finally(() => clearTimeout(timer));
  assert.equal(timedOut, false, "Pi RPC exceeded its time limit");
  assert.equal(oversized, false, "Pi RPC exceeded its output limit");
  assert.equal(exit.code, 0, `Pi RPC exited ${exit.code ?? exit.signal}\n${stderr}\n${stdout}`);
  const records = stdout.split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line));
  const response = records.find((record) => record.type === "response" && record.id === "catalog");
  assert.equal(response?.success, true, `Pi RPC get_commands failed\n${stdout}\n${stderr}`);
  return response.data.commands;
}

async function main() {
  await mkdir(root);
  await mkdir(fixtureSource, { recursive: true });
  for (const path of payloadPaths) {
    const target = join(fixtureSource, path);
    await mkdir(dirname(target), { recursive: true });
    await cp(join(repo, path), target);
  }
  await mkdir(join(fixtureSource, ".audit"), { recursive: true });
  await writeFile(join(fixtureSource, ".audit", "excluded-proof.txt"), "not package payload\n");
  await mkdir(join(fixtureSource, "isswf"), { recursive: true });
  await writeFile(join(fixtureSource, "isswf", "excluded-proof.py"), "raise SystemExit('not packaged')\n");
  git(fixtureSource, ["init", "-q"]);
  git(fixtureSource, ["config", "user.name", "Activation fixture"]);
  git(fixtureSource, ["config", "user.email", "activation-fixture@example.invalid"]);
  git(fixtureSource, ["add", "."]);
  git(fixtureSource, ["commit", "-qm", "synthetic exact-candidate package fixture"]);
  const revision = git(fixtureSource, ["rev-parse", "HEAD"]).trim();
  assert.match(revision, /^[0-9a-f]{40}$/u);
  await writeFile(join(fixtureSource, "newer-head-only.txt"), "must not enter the selected older revision\\n");
  git(fixtureSource, ["add", "newer-head-only.txt"]);
  git(fixtureSource, ["commit", "-qm", "advance HEAD after candidate revision"]);
  const secondRevision = git(fixtureSource, ["rev-parse", "HEAD"]).trim();
  assert.notEqual(secondRevision, revision, "fixture must distinguish selected revisions and HEAD");
  const packageRoot = join(store, revision);

  const storeAlias = join(root, "store-alias");
  const sourceAlias = join(root, "source-alias");
  await symlink(fixtureSource, storeAlias, "dir");
  await symlink(fixtureSource, sourceAlias, "dir");
  installerCommand(["materialize", "--source", fixtureSource, "--revision", revision, "--store", sourceAlias + "/missing-store"], {
    expectFailure: "The shared store and source repository must be separate trees",
  });
  installerCommand(["materialize", "--source", fixtureSource, "--revision", revision, "--store", storeAlias], {
    expectFailure: "The shared store and source repository must be separate trees",
  });
  assert.equal(await readdir(fixtureSource).then((entries) => entries.includes(revision)), false,
    "aliased store published a package inside the source repository");

  const materializeArgs = ["materialize", "--source", fixtureSource, "--revision", revision, "--store", store];
  installerCommand(materializeArgs);
  const filesBeforeRepeat = await treeFiles(packageRoot);
  assert.deepEqual(filesBeforeRepeat, [...payloadPaths, receiptName].sort());
  const mtimes = Object.fromEntries(await Promise.all(filesBeforeRepeat.map(async (path) => [path, (await stat(join(packageRoot, path))).mtimeMs])));
  installerCommand(materializeArgs);
  assert.deepEqual(await treeFiles(packageRoot), filesBeforeRepeat);
  for (const path of filesBeforeRepeat) assert.equal((await stat(join(packageRoot, path))).mtimeMs, mtimes[path], `repeat rewrote ${path}`);
  assert.equal(await readdir(packageRoot).then((entries) => entries.includes(".git")), false, "materialized resource package became a Git checkout");
  installerCommand(["materialize", "--source", fixtureSource, "--revision", secondRevision, "--store", store]);
  const secondPackageRoot = join(store, secondRevision);

  const conflictStore = join(root, "conflicting-store");
  const conflictRoot = join(conflictStore, revision);
  await mkdir(conflictRoot, { recursive: true });
  await writeFile(join(conflictRoot, "operator-data"), "preserve this conflict\n");
  const conflictBefore = await snapshot([join(conflictRoot, "operator-data")]);
  installerCommand(["materialize", "--source", fixtureSource, "--revision", revision, "--store", conflictStore], {
    expectFailure: "Missing or malformed package receipt",
  });
  assert.deepEqual(await snapshot([join(conflictRoot, "operator-data")]), conflictBefore);

  const baselineSettings = {
    defaultProvider: "preserve-provider",
    defaultModel: "preserve-model",
    enabledModels: ["keep-this"],
    packages: ["/operator/other-package"],
    skills: ["/operator/other-skill"],
    unknownOperatorSetting: { keep: true },
  };
  await mkdir(project, { recursive: true });
  await setupGitProject(project, `${JSON.stringify(baselineSettings, null, 2)}\n`);
  await mkdir(home, { recursive: true });
  await mkdir(agentDir, { recursive: true });
  await writeFile(join(agentDir, "settings.json"), "{}\n");
  const protectedPaths = [join(project, "AGENTS.md"), join(project, ".factory", "models.json"), join(project, ".factory", "jobs", "J001", "A001.md")];
  const protectedBefore = await snapshot(protectedPaths);
  const settingsPath = join(project, ".pi", "settings.json");
  installerCommand(["activate", "--package", packageRoot, "--project", project]);
  const activatedBytes = await readFile(settingsPath);
  const activated = JSON.parse(activatedBytes);
  assert.deepEqual(activated, { ...baselineSettings, packages: [...baselineSettings.packages, packageRoot] });
  assert.deepEqual(await snapshot(protectedPaths), protectedBefore);
  const activatedTimes = (await stat(settingsPath)).mtimeMs;
  installerCommand(["activate", "--package", packageRoot, "--project", project]);
  assert.deepEqual(await readFile(settingsPath), activatedBytes, "repeat activation changed settings bytes");
  assert.equal((await stat(settingsPath)).mtimeMs, activatedTimes, "repeat activation rewrote settings");
  const projectAlias = join(root, "project-alias");
  await symlink(project, projectAlias, "dir");
  installerCommand(["activate", "--package", packageRoot, "--project", projectAlias]);
  assert.deepEqual(await readFile(settingsPath), activatedBytes, "aliased project repeat changed settings bytes");

  const secondVersionProject = join(root, "second-version-project");
  await mkdir(secondVersionProject, { recursive: true });
  await setupGitProject(secondVersionProject, `${JSON.stringify({ packages: [packageRoot], preserve: "unrelated" }, null, 2)}\n`);
  const secondVersionSettings = join(secondVersionProject, ".pi", "settings.json");
  await expectRefusal(() => installerCommand(["activate", "--package", secondPackageRoot, "--project", secondVersionProject], {
    expectFailure: "Project settings already declare a different version of the isSWF resource package",
  }), [secondVersionSettings]);

  const overlappingProject = join(root, "overlapping-project");
  await mkdir(overlappingProject, { recursive: true });
  await setupGitProject(overlappingProject, '{"packages":[]}\n');
  const embeddedPackage = join(overlappingProject, revision);
  await cp(packageRoot, embeddedPackage, { recursive: true });
  const packageAlias = join(root, "embedded-package-alias");
  await symlink(embeddedPackage, packageAlias, "dir");
  const overlappingSettings = join(overlappingProject, ".pi", "settings.json");
  await expectRefusal(() => installerCommand(["activate", "--package", packageAlias, "--project", overlappingProject], {
    expectFailure: "The shared package and target project must be separate trees",
  }), [overlappingSettings]);

  const dirtyProject = join(root, "dirty-project");
  await mkdir(dirtyProject, { recursive: true });
  await setupGitProject(dirtyProject, '{"packages":[]}\n');
  const dirtySettings = join(dirtyProject, ".pi", "settings.json");
  await writeFile(dirtySettings, '{"packages":["operator-edit"]}\n');
  await expectRefusal(() => installerCommand(["activate", "--package", packageRoot, "--project", dirtyProject], {
    expectFailure: "Project settings must be clean in Git before activation",
  }), [dirtySettings]);

  const malformedProject = join(root, "malformed-project");
  await mkdir(malformedProject, { recursive: true });
  await setupGitProject(malformedProject, '{broken json\n');
  const malformedSettings = join(malformedProject, ".pi", "settings.json");
  await expectRefusal(() => installerCommand(["activate", "--package", packageRoot, "--project", malformedProject], {
    expectFailure: "Project settings are not valid JSON",
  }), [malformedSettings]);

  const conflictingProject = join(root, "conflicting-project");
  await mkdir(conflictingProject, { recursive: true });
  await setupGitProject(conflictingProject, `${JSON.stringify({ packages: [{ source: packageRoot, skills: [] }] })}\n`);
  const conflictingSettings = join(conflictingProject, ".pi", "settings.json");
  await expectRefusal(() => installerCommand(["activate", "--package", packageRoot, "--project", conflictingProject], {
    expectFailure: "Project settings contain a conflicting activation for this package",
  }), [conflictingSettings]);

  const tamperedStore = join(root, "tampered-store");
  const tamperedPackage = join(tamperedStore, revision);
  await mkdir(tamperedStore, { recursive: true });
  await cp(packageRoot, tamperedPackage, { recursive: true });
  await chmod(join(tamperedPackage, "docs", "model-routing.md"), 0o644);
  await writeFile(join(tamperedPackage, "docs", "model-routing.md"), "tampered\n");
  const tamperedBytes = await readFile(join(tamperedPackage, "docs", "model-routing.md"));
  installerCommand(["materialize", "--source", fixtureSource, "--revision", revision, "--store", tamperedStore], {
    expectFailure: "Package payload hash mismatch: docs/model-routing.md",
  });
  assert.deepEqual(await readFile(join(tamperedPackage, "docs", "model-routing.md")), tamperedBytes, "tampered package was overwritten");
  const tamperedProject = join(root, "tampered-project");
  await mkdir(tamperedProject, { recursive: true });
  await setupGitProject(tamperedProject, '{"packages":[],"preserve":true}\n');
  const tamperedSettings = join(tamperedProject, ".pi", "settings.json");
  await expectRefusal(() => installerCommand(["activate", "--package", tamperedPackage, "--project", tamperedProject], {
    expectFailure: "Package payload hash mismatch: docs/model-routing.md",
  }), [tamperedSettings]);

  const env = cleanEnv(home, agentDir);
  assert.equal(command(pi, ["--version"], { cwd: project, env }).trim(), "1.2.0", "verification requires the documented Pi 1.2.0 runtime");
  const approved = await rpcCommands(project, env, true);
  const discovered = approved.filter((item) => item.source === "skill").filter((item) => names.includes(item.name?.replace(/^skill:/u, "")));
  assert.deepEqual(discovered.map((item) => item.name).sort(), names.map((name) => `skill:${name}`).sort());
  for (const item of discovered) {
    const expected = join(packageRoot, ".agents", "skills", item.name.slice("skill:".length), "SKILL.md");
    assert.equal(item.sourceInfo.path, expected, `${item.name} did not resolve from the shared package`);
  }
  const unapproved = await rpcCommands(project, env, false);
  assert.equal(unapproved.some((item) => item.source === "skill" && names.includes(item.name?.replace(/^skill:/u, ""))), false,
    "--no-approve loaded a project package skill");
  assert.deepEqual(await snapshot(protectedPaths), protectedBefore, "Pi resource discovery changed protected project files");

  return {
    result: "PASS",
    base: git(repo, ["rev-parse", "HEAD"]).trim(),
    syntheticResourceCommit: revision,
    candidateIdentity: "Separate from this synthetic resource commit; the retained frozen seven-payload v1 snapshot is the pre-correction baseline and must not be presented as the identity of these corrections.",
    fixtureSource,
    sharedStore: store,
    materializedPackage: packageRoot,
    targetProject: project,
    exportedFiles: filesBeforeRepeat,
    checks: [
      "exact committed-blob export and excluded audit/Python paths",
      "repeat materialization verifies without rewriting",
      "conflicting destination refusal with expected diagnostic and no mutation",
      "activation preserves unrelated settings, AGENTS.md, models, and attempt bytes",
      "repeat activation is byte-identical and does not rewrite, including through a project alias",
      "a second SHA of the same factory refuses for the expected reason with unchanged settings",
      "aliased and missing stores beneath a source alias refuse before publication",
      "package/project alias overlap refuses before changing settings",
      "dirty, malformed, conflicting, and tampered inputs refuse for expected reasons with unchanged bytes; tampering uses a clean project",
      "Pi 1.2.0 RPC get_commands discovers exactly the two skills with --approve and neither with --no-approve",
    ],
    rpc: "offline, no-session, no-MCP, isolated HOME and PI_CODING_AGENT_DIR; no prompt or model call",
    limits: [
      "synthetic local Git commit identifies only the exported resource blobs; it is not the correction candidate or the frozen seven-payload candidate identity",
      "discovery is not role execution, sandboxing, lifecycle, recovery, or client readiness",
      "fixtures are retained at the reported paths for independent inspection",
    ],
  };
}

try {
  console.log(JSON.stringify(await main(), null, 2));
} catch (error) {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
