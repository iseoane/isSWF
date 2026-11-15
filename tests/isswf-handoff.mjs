import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { sha256Hex } = await import(pathToFileURL(join(source, 'tools/isswf-handoff-core.mjs')));

// The pure-JavaScript SHA-256 the dispatch guard uses on both hosts: the published test vectors, then node:crypto on every length around the block edges.
{
  const text = value => new TextEncoder().encode(value);
  assert.equal(sha256Hex(text('')), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256Hex(text('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256Hex(text('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  assert.equal(sha256Hex(new Uint8Array(1_000_000).fill(0x61)), 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  for (let length = 0; length <= 200; length += 1) {
    const bytes = randomBytes(length);
    assert.equal(sha256Hex(bytes), createHash('sha256').update(bytes).digest('hex'), `length ${length}`);
  }
  const bigger = randomBytes(5 * 1024 * 1024 + 3);
  assert.equal(sha256Hex(bigger), createHash('sha256').update(bigger).digest('hex'), 'a diff the size of the hook read limit');
}

console.log('PASS handoff');
