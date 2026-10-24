import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  lstat,
  mkdir,
  rmdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { releaseReceiptName, verifyRelease } from "./release-source.mjs";
import { stateDirectory } from "./project-state.mjs";

const revisionPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;
const receiptName = ".isswf-package-receipt.json";
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
  ".factory/templates/job-brief.md",
  ".factory/templates/attempt.md",
  ".factory/templates/review.md",
  ".factory/models.json",
  "package.json",
];
const writingPayloadPaths = [
  ".agents/skills/isswf-writing/SKILL.md",
  ".agents/skills/isswf-writing/references/human-documents.md",
  ".agents/skills/isswf-writing/references/agent-documents.md",
];
const understandingPayloadPaths = [
  ".agents/skills/isswf-understanding/SKILL.md",
  ".agents/skills/isswf-understanding/references/explanation.md",
  ".agents/skills/isswf-understanding/references/learning.md",
];
const prPayloadPaths = [
  ".agents/skills/isswf-pr/SKILL.md",
  ".agents/skills/isswf-pr/references/risk-assessment.md",
  ".agents/skills/isswf-pr/references/pr-description.md",
];
const issuePayloadPaths = [
  ".agents/skills/isswf-issue/SKILL.md",
  ".agents/skills/isswf-issue/references/routing-and-publication.md",
  ".agents/skills/isswf-issue/references/report-content.md",
];
const e2ePayloadPaths = [
  ".agents/skills/isswf-e2e/SKILL.md",
  ".agents/skills/isswf-e2e/references/browser.md",
  ".agents/skills/isswf-e2e/references/cli-and-api.md",
  ".agents/skills/isswf-e2e/references/test-quality.md",
];
const taskSkills = ["debug", "review", "retrospective", "tdd", "security", "performance", "observability"];
const taskPayloadPaths = {
  debug: [".agents/skills/isswf-debug/SKILL.md"],
  review: [".agents/skills/isswf-review/SKILL.md"],
  retrospective: [".agents/skills/isswf-retrospective/SKILL.md", ".agents/roles/references/retrospective.md", ".factory/templates/retrospective.md"],
  tdd: [".agents/skills/isswf-tdd/SKILL.md"],
  security: [".agents/skills/isswf-security/SKILL.md"],
  performance: [".agents/skills/isswf-performance/SKILL.md"],
  observability: [".agents/skills/isswf-observability/SKILL.md"],
};
const installedToolNames = ["isswf-plan.mjs", "isswf-status.mjs", "isswf-panel.mjs", "isswf-response.mjs", "isswf-intake.mjs", "project-quality.mjs", "project-state.mjs"];
const toolsReceiptName = ".isswf-tools-receipt.json";
const expectedSkills = [
  "./.agents/skills/isswf-coordinator",
  "./.agents/skills/isswf-setup",
];

const releaseFiles = [".agents/roles", ".agents/hosts", ".agents/skills/isswf-coordinator", ".agents/skills/isswf-setup", ".claude-plugin", ".factory/models.json", ".factory/templates", ".isswf-release.json", ".isswf-sources", "agents", "skills", "tools/*.mjs", "docs/installation.md", "docs/durable-work.md", "docs/model-routing.md", "docs/host-portability.md", "docs/source-activation.md", "docs/local-worker-lifecycle.md", "docs/issue-intake.md"];

function fail(message) {
  throw new Error(message);
}

function runGit(source, args, encoding = "utf8") {
  const result = spawnSync("git", ["-C", source, ...args], {
    encoding,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30_000,
  });
  if (result.error || result.status !== 0) {
    fail(`git ${args.join(" ")} failed: ${result.error?.message ?? result.stderr}`);
  }
  return result.stdout;
}

function parseArgs(argv) {
  const [command, ...parts] = argv;
  if (!command || !["materialize", "activate", "install-tools"].includes(command)) {
    fail("Usage: node tools/factory-package.mjs materialize|activate|install-tools --name value ...");
  }
  const options = {};
  for (let index = 0; index < parts.length; index += 1) {
    const key = parts[index];
    const value = parts[index + 1];
    if (!key.startsWith("--") || !value || value.startsWith("--") || options[key]) {
      fail(`Invalid or duplicate option: ${key}`);
    }
    options[key] = value;
    index += 1;
  }
  const required = command === "materialize"
    ? ["--source", "--revision", "--store"]
    : command === "install-tools" ? ["--source", "--revision", "--project"] : ["--package", "--project"];
  const allowed = new Set(required);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) fail(`Unexpected option: ${key}`);
  }
  for (const key of required) {
    if (!options[key]) fail(`Missing required option: ${key}`);
  }
  return { command, options };
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isWithin(parent, child) {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

export async function canonicalPath(path) {
  let candidate = resolve(path);
  const missing = [];
  while (true) {
    try {
      const existing = await realpath(candidate);
      return resolve(existing, ...missing.reverse());
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
      const parent = dirname(candidate);
      if (parent === candidate) throw error;
      missing.push(relative(parent, candidate));
      candidate = parent;
    }
  }
}

function assertSeparateTrees(first, second, message) {
  if (isWithin(first, second) || isWithin(second, first)) fail(message);
}

function validateManifest(bytes) {
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString("utf8"));
  } catch {
    fail("The committed package.json is not valid JSON");
  }
  const hasWriting = manifest?.pi?.skills?.includes("./.agents/skills/isswf-writing");
  const hasUnderstanding = manifest?.pi?.skills?.includes("./.agents/skills/isswf-understanding");
  const hasPr = manifest?.pi?.skills?.includes("./.agents/skills/isswf-pr");
  const hasIssue = manifest?.pi?.skills?.includes("./.agents/skills/isswf-issue");
  const hasE2e = manifest?.pi?.skills?.includes("./.agents/skills/isswf-e2e");
  const selectedTaskSkills = taskSkills.filter(name => manifest?.pi?.skills?.includes(`./.agents/skills/isswf-${name}`));
  const skills = [...expectedSkills,
    ...(hasWriting ? ["./.agents/skills/isswf-writing"] : []),
    ...(hasUnderstanding ? ["./.agents/skills/isswf-understanding"] : []),
    ...(hasPr ? ["./.agents/skills/isswf-pr"] : []),
    ...(hasIssue ? ["./.agents/skills/isswf-issue"] : []),
    ...(hasE2e ? ["./.agents/skills/isswf-e2e"] : []),
    ...selectedTaskSkills.map(name => `./.agents/skills/isswf-${name}`),
  ];
  const files = releaseFiles.toSpliced(4, 0,
    ...(hasWriting ? [".agents/skills/isswf-writing"] : []),
    ...(hasUnderstanding ? [".agents/skills/isswf-understanding"] : []),
    ...(hasPr ? [".agents/skills/isswf-pr"] : []),
    ...(hasIssue ? [".agents/skills/isswf-issue"] : []),
    ...(hasE2e ? [".agents/skills/isswf-e2e"] : []),
    ...selectedTaskSkills.map(name => `.agents/skills/isswf-${name}`),
  );
  const legacy = Object.keys(manifest ?? {}).sort().join(",") === "description,name,pi,version";
  const released = Object.keys(manifest ?? {}).sort().join(",") === "bin,description,files,keywords,name,pi,version";
  if (
    !legacy && !released ||
    manifest.name !== "isswf-pi-resources" ||
    !/^\d+\.\d+\.\d+$/u.test(manifest.version ?? "") ||
    typeof manifest.description !== "string" ||
    !manifest.pi ||
    Object.keys(manifest.pi).sort().join(",") !== "skills" ||
    JSON.stringify(manifest.pi.skills) !== JSON.stringify(skills) ||
    (released && (
      JSON.stringify(manifest.bin) !== JSON.stringify({ isswf: "tools/isswf.mjs" }) ||
      JSON.stringify(manifest.keywords) !== JSON.stringify(["pi-package"]) ||
      JSON.stringify(manifest.files) !== JSON.stringify(files)
    )) ||
    Object.hasOwn(manifest, "dependencies") ||
    Object.hasOwn(manifest, "devDependencies") ||
    Object.hasOwn(manifest, "scripts")
  ) {
    fail("The committed package.json does not match the no-dependency package contract");
  }
}

async function materialize({ source, revision, store }) {
  if (!isAbsolute(source) || !isAbsolute(store)) fail("--source and --store must be absolute paths");
  if (!revisionPattern.test(revision)) fail("--revision must be a full lowercase Git SHA");
  const sourceRoot = await realpath(resolve(source));
  const storeRoot = await canonicalPath(store);
  assertSeparateTrees(sourceRoot, storeRoot, "The shared store and source repository must be separate trees");
  const resolved = runGit(sourceRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim();
  if (resolved !== revision) fail("Git did not resolve the exact requested full revision");
  const tree = runGit(sourceRoot, ["ls-tree", "-rz", "--full-tree", revision]);
  const entries = new Map();
  for (const entry of tree.split("\0").filter(Boolean)) {
    const tab = entry.indexOf("\t");
    const [mode, type, object] = entry.slice(0, tab).split(" ");
    entries.set(entry.slice(tab + 1), { mode, type, object });
  }
  const manifestEntry = entries.get("package.json");
  if (!manifestEntry || manifestEntry.type !== "blob" || !["100644", "100755"].includes(manifestEntry.mode)) fail("Missing regular package.json");
  const manifestBytes = runGit(sourceRoot, ["cat-file", "blob", manifestEntry.object], null);
  validateManifest(manifestBytes);
  const hasWriting = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-writing");
  const hasUnderstanding = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-understanding");
  const hasPr = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-pr");
  const hasIssue = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-issue");
  const hasE2e = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-e2e");
  const selectedPaths = [...payloadPaths,
    ...(hasWriting ? writingPayloadPaths : []),
    ...(hasUnderstanding ? understandingPayloadPaths : []),
    ...(hasPr ? prPayloadPaths : []),
    ...(hasIssue ? issuePayloadPaths : []),
    ...(hasE2e ? e2ePayloadPaths : []),
    ...taskSkills.filter(name => JSON.parse(manifestBytes).pi.skills.includes(`./.agents/skills/isswf-${name}`)).flatMap(name => taskPayloadPaths[name]),
  ];
  const payload = new Map();
  for (const path of selectedPaths) {
    const entry = entries.get(path);
    if (!entry || entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
      fail(`Required path is missing or is not a regular committed file: ${path}`);
    }
    payload.set(path, runGit(sourceRoot, ["cat-file", "blob", entry.object], null));
  }
  validateManifest(payload.get("package.json"));
  const hashes = Object.fromEntries([...payload].map(([path, bytes]) => [path, digest(bytes)]));
  const receipt = `${JSON.stringify({ format: 1, revision, files: hashes }, null, 2)}\n`;
  const destination = join(storeRoot, revision);
  try {
    await lstat(destination);
    await verifyPackage(destination, revision);
    const existingReceipt = await readFile(join(destination, receiptName), "utf8");
    if (existingReceipt !== receipt) fail(`Conflicting package already exists: ${destination}`);
    console.log(`Already materialized: ${destination}`);
    return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  await mkdir(storeRoot, { recursive: true });
  const staging = join(storeRoot, `.${revision}.stage-${process.pid}-${Date.now()}`);
  await mkdir(staging);
  try {
    for (const [path, bytes] of payload) {
      const target = join(staging, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes, { flag: "wx", mode: 0o444 });
    }
    await writeFile(join(staging, receiptName), receipt, { flag: "wx", mode: 0o444 });
    await rename(staging, destination);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
  console.log(`Materialized ${revision}: ${destination}`);
}

export async function verifyPackage(packageRoot, expectedRevision) {
  const root = resolve(packageRoot);
  let releaseBytes;
  try {
    releaseBytes = await readFile(join(root, releaseReceiptName));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (releaseBytes !== undefined) {
    const release = verifyRelease(root);
    if (release.revision !== expectedRevision) fail(`Release revision does not match the expected runtime: ${root}`);
    return root;
  }
  const receiptPath = join(root, receiptName);
  let receipt;
  try {
    receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  } catch {
    fail(`Missing or malformed package receipt: ${receiptPath}`);
  }
  const manifestBytes = await readFile(join(root, "package.json"));
  validateManifest(manifestBytes);
  const hasWriting = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-writing");
  const hasUnderstanding = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-understanding");
  const hasPr = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-pr");
  const hasIssue = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-issue");
  const hasE2e = JSON.parse(manifestBytes).pi.skills.includes("./.agents/skills/isswf-e2e");
  const selectedPaths = [...payloadPaths,
    ...(hasWriting ? writingPayloadPaths : []),
    ...(hasUnderstanding ? understandingPayloadPaths : []),
    ...(hasPr ? prPayloadPaths : []),
    ...(hasIssue ? issuePayloadPaths : []),
    ...(hasE2e ? e2ePayloadPaths : []),
    ...taskSkills.filter(name => JSON.parse(manifestBytes).pi.skills.includes(`./.agents/skills/isswf-${name}`)).flatMap(name => taskPayloadPaths[name]),
  ];
  if (
    Object.keys(receipt).sort().join(",") !== "files,format,revision" ||
    receipt.format !== 1 ||
    receipt.revision !== expectedRevision ||
    Object.keys(receipt.files ?? {}).sort().join("\n") !== [...selectedPaths].sort().join("\n")
  ) {
    fail(`Package receipt does not match the expected payload: ${root}`);
  }
  const expectedFiles = new Set([...selectedPaths, receiptName]);
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) fail(`Package contains a symbolic link: ${path}`);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        const relativePath = relative(root, path).split(sep).join("/");
        if (!expectedFiles.has(relativePath)) fail(`Package contains an unexpected file: ${relativePath}`);
      } else fail(`Package contains a non-regular entry: ${path}`);
    }
  }
  await visit(root);
  for (const path of selectedPaths) {
    const bytes = await readFile(join(root, path));
    if (digest(bytes) !== receipt.files[path]) fail(`Package payload hash mismatch: ${path}`);
  }
  validateManifest(await readFile(join(root, "package.json")));
  return root;
}

async function activate({ package: packagePath, project }) {
  if (!isAbsolute(packagePath) || !isAbsolute(project)) fail("--package and --project must be absolute paths");
  const packageRoot = await realpath(resolve(packagePath));
  const projectRoot = await realpath(resolve(project));
  assertSeparateTrees(projectRoot, packageRoot, "The shared package and target project must be separate trees");
  const receipt = JSON.parse(await readFile(join(packageRoot, receiptName), "utf8"));
  const revision = receipt.revision;
  if (!revisionPattern.test(revision) || basename(packageRoot) !== revision) {
    fail("Package path must be named by its full revision SHA");
  }
  await verifyPackage(packageRoot, revision);

  const settingsPath = join(projectRoot, ".pi", "settings.json");
  let original;
  try {
    original = await readFile(settingsPath);
  } catch (error) {
    if (error.code === "ENOENT") fail(`Project settings must already exist: ${settingsPath}`);
    throw error;
  }
  let settings;
  try {
    settings = JSON.parse(original.toString("utf8"));
  } catch {
    fail(`Project settings are not valid JSON: ${settingsPath}`);
  }
  if (!settings || Array.isArray(settings) || typeof settings !== "object") {
    fail(`Project settings must contain a JSON object: ${settingsPath}`);
  }
  const packages = settings.packages ?? [];
  if (!Array.isArray(packages)) fail("Project settings packages must be an array");
  const declaredEntries = packages.flatMap((entry) => {
    if (typeof entry === "string") return [{ entry, path: entry }];
    if (entry && typeof entry === "object" && typeof entry.source === "string") return [{ entry, path: entry.source }];
    return [];
  });
  const matchingPackageEntries = [];
  for (const declared of declaredEntries) {
    const declaredRoot = await canonicalPath(resolve(dirname(settingsPath), declared.path));
    if (declaredRoot === packageRoot) {
      matchingPackageEntries.push(declared.entry);
      continue;
    }
    let manifest;
    try {
      manifest = JSON.parse(await readFile(join(declaredRoot, "package.json"), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT" || error instanceof SyntaxError) continue;
      throw error;
    }
    if (manifest?.name === "isswf-pi-resources") {
      fail("Project settings already declare a different version of the isSWF resource package");
    }
  }
  if (matchingPackageEntries.length > 1) fail("Project settings contain duplicate entries for this package");
  if (matchingPackageEntries.length === 1) {
    if (typeof matchingPackageEntries[0] !== "string") {
      fail("Project settings contain a conflicting activation for this package");
    }
    console.log(`Already active: ${packageRoot}`);
    return;
  }

  const tracked = spawnSync("git", ["-C", projectRoot, "ls-files", "--error-unmatch", "--", ".pi/settings.json"], {
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  const status = spawnSync("git", ["-C", projectRoot, "status", "--porcelain=v1", "--untracked-files=all", "--", ".pi/settings.json"], {
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  if (tracked.error || tracked.status !== 0 || status.error || status.status !== 0 || status.stdout !== "") {
    fail("Project settings must be clean in Git before activation");
  }
  settings.packages = [...packages, packageRoot];
  const updated = `${JSON.stringify(settings, null, 2)}\n`;
  const tempPath = join(dirname(settingsPath), `.settings.json.activation-${process.pid}-${Date.now()}`);
  await writeFile(tempPath, updated, { flag: "wx", mode: 0o600 });
  try {
    await rename(tempPath, settingsPath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
  console.log(`Activated ${packageRoot} in ${settingsPath}`);
}

async function installTools({ source, revision, project }) {
  if (!isAbsolute(source) || !isAbsolute(project) || !revisionPattern.test(revision)) fail("Absolute source/project and full revision required");
  const sourceRoot = await realpath(source), projectRoot = await realpath(project);
  if (await realpath(runGit(sourceRoot, ["rev-parse", "--show-toplevel"]).trim()) !== sourceRoot) fail("Source must be a Git root");
  assertSeparateTrees(sourceRoot, projectRoot, "Source and installation target must be separate trees");
  if (runGit(sourceRoot, ["rev-parse", "--verify", `${revision}^{commit}`]).trim() !== revision) fail("Exact source revision required");
  if (await realpath(runGit(projectRoot, ["rev-parse", "--show-toplevel"]).trim()) !== projectRoot) fail("Target must be a Git root");
  const payload = new Map();
  for (const name of installedToolNames) {
    const entry = runGit(sourceRoot, ["ls-tree", "-z", revision, "--", `tools/${name}`]).split("\0").filter(Boolean);
    if (entry.length !== 1 || !/^100(?:644|755) blob [0-9a-f]+\t/u.test(entry[0])) fail(`Missing regular committed tool: ${name}`);
    payload.set(name, runGit(sourceRoot, ["cat-file", "blob", entry[0].slice(0, entry[0].indexOf("\t")).split(" ")[2]], null));
  }
  const receipt = `${JSON.stringify({ format: 1, revision, files: Object.fromEntries([...payload].map(([name, bytes]) => [name, digest(bytes)])) }, null, 2)}\n`;
  const factory = join(projectRoot, stateDirectory(projectRoot)), destination = join(factory, "tools");
  async function regularDirectory(path) {
    const stat = await lstat(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`Regular directory required: ${path}`);
  }
  async function verify(path) {
    await regularDirectory(path);
    const entries = await readdir(path, { withFileTypes: true });
    const names = [...installedToolNames, toolsReceiptName].sort();
    if (entries.map(entry => entry.name).sort().join("\n") !== names.join("\n") || entries.some(entry => !entry.isFile() || entry.isSymbolicLink())) fail("Installed tools contain missing or unexpected entries");
    if ((await readFile(join(path, toolsReceiptName), "utf8")) !== receipt) fail("Installed tools revision or receipt conflict");
    for (const [name, bytes] of payload) if (!(await readFile(join(path, name))).equals(bytes)) fail(`Installed tool hash mismatch: ${name}`);
  }
  try { await mkdir(factory, { mode: 0o700 }); } catch (error) { if (error.code !== "EEXIST") throw error; }
  await regularDirectory(factory);
  try { await lstat(destination); await verify(destination); console.log(`Already installed tools: ${destination}`); return; }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const claim = join(factory, ".tools-install");
  await mkdir(claim, { mode: 0o700 });
  const stage = join(claim, "payload");
  await mkdir(stage, { mode: 0o700 });
  for (const [name, bytes] of payload) await writeFile(join(stage, name), bytes, { flag: "wx", mode: 0o600 });
  await writeFile(join(stage, toolsReceiptName), receipt, { flag: "wx", mode: 0o600 });
  await verify(stage);
  try { await lstat(destination); fail("Installation destination appeared during publication"); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  await rename(stage, destination);
  await rmdir(claim);
  console.log(`Installed observation and planning tools: ${destination}`);
}

function basename(path) {
  return path.slice(path.lastIndexOf(sep) + 1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { command, options } = parseArgs(process.argv.slice(2));
    if (command === "materialize") await materialize({
      source: options["--source"],
      revision: options["--revision"],
      store: options["--store"],
    });
    else if (command === "install-tools") await installTools({ source: options["--source"], revision: options["--revision"], project: options["--project"] });
    else await activate({ package: options["--package"], project: options["--project"] });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
