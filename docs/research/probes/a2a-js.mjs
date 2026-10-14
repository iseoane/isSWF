import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const sdk = resolve(process.argv[2] ?? '');
const pinned = '2c81b861614905b55b7e0d465d596ef69d85d721';
assert.equal(execFileSync('git', ['-C', sdk, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), pinned);
execFileSync('git', ['-C', sdk, 'diff', '--exit-code', 'HEAD', '--']);
const load = (path) => import(pathToFileURL(resolve(sdk, path)).href);
const { TaskState, Role } = await load('src/index.ts');
const { InMemoryTaskStore } = await load('src/server/store.ts');
const { DefaultRequestHandler } = await load('src/server/request_handler/default_request_handler.ts');
const { ServerCallContext } = await load('src/server/context.ts');
const { AgentEvent } = await load('src/server/events/execution_event_bus.ts');
const card = {
  name: 'offline-probe', description: 'Controlled local executor', version: '1',
  capabilities: { streaming: true, pushNotifications: false, extensions: [] },
  defaultInputModes: ['text/plain'], defaultOutputModes: ['text/plain'], skills: [],
  supportedInterfaces: [], securitySchemes: {}, securityRequirements: [], signatures: [],
};
const owner = new ServerCallContext({ tenant: 'project-a', requestedVersion: '1.0' });
const other = new ServerCallContext({ tenant: 'project-b', requestedVersion: '1.0' });
const request = (messageId) => ({
  message: {
    messageId, role: Role.ROLE_USER, taskId: '', contextId: '', metadata: {},
    extensions: [], referenceTaskIds: [],
    parts: [{ content: { $case: 'text', value: 'probe' }, mediaType: 'text/plain', filename: '', metadata: {} }],
  },
  tenant: '', metadata: {}, configuration: { returnImmediately: false },
});
const task = (context, state) => ({
  id: context.taskId, contextId: context.contextId, artifacts: [], history: [], metadata: {},
  status: { state, timestamp: new Date().toISOString() },
});

function controlledExecutor() {
  const gate = Promise.withResolvers();
  const finished = Promise.withResolvers();
  let executions = 0;
  let cancellations = 0;
  return {
    gate, finished,
    get executions() { return executions; },
    get cancellations() { return cancellations; },
    async execute(context, bus) {
      executions += 1;
      bus.publish(AgentEvent.task(task(context, TaskState.TASK_STATE_WORKING)));
      await gate.promise;
      bus.publish(AgentEvent.statusUpdate({
        taskId: context.taskId, contextId: context.contextId, metadata: {},
        status: { state: TaskState.TASK_STATE_COMPLETED, timestamp: new Date().toISOString() },
      }));
      finished.resolve();
    },
    async cancelTask() { cancellations += 1; },
  };
}

const store = new InMemoryTaskStore();
const connected = controlledExecutor();
const handler = new DefaultRequestHandler(card, store, connected);
const stream = handler.sendMessageStream(request('connected'), owner);
const first = await stream.next();
assert.equal(first.value.payload.$case, 'task');
const taskId = first.value.payload.value.id;
connected.gate.resolve();
for await (const event of stream) {
  assert.equal(event.payload.$case, 'statusUpdate');
}
assert.equal((await handler.getTask({ id: taskId }, owner)).status.state, TaskState.TASK_STATE_COMPLETED);
await assert.rejects(handler.getTask({ id: taskId }, other), { name: 'TaskNotFoundError' });
console.log('PASS: connected stream persists terminal state; another tenant cannot read it');

const polling = controlledExecutor();
const pollingHandler = new DefaultRequestHandler(card, store, polling);
const pollingRequest = request('nonblocking');
pollingRequest.configuration.returnImmediately = true;
const accepted = await pollingHandler.sendMessage(pollingRequest, owner);
assert.ok('id' in accepted, 'Expected a nonblocking task result');
polling.gate.resolve();
await polling.finished.promise;
await new Promise((done) => setImmediate(done));
assert.equal((await pollingHandler.getTask({ id: accepted.id }, owner)).status.state, TaskState.TASK_STATE_COMPLETED);
console.log('PASS: nonblocking SendMessage keeps draining and persists completion after returning');

const detached = controlledExecutor();
const detachedHandler = new DefaultRequestHandler(card, store, detached);
const detachedStream = detachedHandler.sendMessageStream(request('detached'), owner);
const detachedFirst = await detachedStream.next();
const detachedId = detachedFirst.value.payload.value.id;
await detachedStream.return();
detached.gate.resolve();
await detached.finished.promise;
await new Promise((done) => setImmediate(done));
assert.equal((await detachedHandler.getTask({ id: detachedId }, owner)).status.state, TaskState.TASK_STATE_WORKING);
console.log('OBSERVED: after the only stream consumer disconnects, executor finishes but GetTask retains WORKING');

const restoredExecutor = controlledExecutor();
const restoredHandler = new DefaultRequestHandler(card, store, restoredExecutor);
assert.equal((await restoredHandler.cancelTask({ id: detachedId }, owner)).status.state, TaskState.TASK_STATE_CANCELED);
assert.equal(restoredExecutor.cancellations, 0);
console.log('OBSERVED: canceling a saved task with no live bus marks CANCELED without invoking executor cancellation');
assert.equal(await new InMemoryTaskStore().load(taskId, owner), undefined);
console.log('PASS: creating a fresh in-memory store does not recover old tasks');

const duplicate = controlledExecutor();
duplicate.gate.resolve();
const duplicateHandler = new DefaultRequestHandler(card, new InMemoryTaskStore(), duplicate);
const one = await duplicateHandler.sendMessage(request('same-message'), owner);
const two = await duplicateHandler.sendMessage(request('same-message'), owner);
assert.ok('id' in one && 'id' in two, 'Expected task results');
assert.notEqual(one.id, two.id);
assert.equal(duplicate.executions, 2);
console.log('OBSERVED: sending the same new messageId twice creates two tasks and executions');
console.log('Scope: real pinned SDK handler/store with a controlled executor; no HTTP, Pi, model or process crash test');
