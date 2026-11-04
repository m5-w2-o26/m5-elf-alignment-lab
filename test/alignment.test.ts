import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { checkElfLoadAlignment, isZipDataAligned } from '../src/alignment.js';

function elf(offset: bigint, address: bigint, alignment: bigint): Uint8Array {
  const b = new Uint8Array(120);
  const d = new DataView(b.buffer);
  b.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1]);
  d.setUint32(20, 1, true);
  d.setBigUint64(32, 64n, true);
  d.setUint16(52, 64, true);
  d.setUint16(54, 56, true);
  d.setUint16(56, 1, true);
  d.setUint32(64, 1, true);
  d.setBigUint64(72, offset, true);
  d.setBigUint64(80, address, true);
  d.setBigUint64(112, alignment, true);
  return b;
}

test('ELF congruence is distinct from ZIP data offset alignment', () => {
  assert.equal(checkElfLoadAlignment(elf(3n, 4099n, 4096n))[0].valid, true);
  assert.equal(isZipDataAligned(3n, 4096n), false);
  assert.equal(checkElfLoadAlignment(elf(0n, 1n, 4096n))[0].valid, false);
  assert.equal(isZipDataAligned(4096n, 4096n), true);
});

test('alignment must be a power of two unless zero or one', () => {
  assert.equal(checkElfLoadAlignment(elf(0n, 0n, 3n))[0].valid, false);
  assert.equal(checkElfLoadAlignment(elf(7n, 8n, 0n))[0].valid, true);
  assert.equal(checkElfLoadAlignment(elf(7n, 8n, 1n))[0].valid, true);
});

test('reject malformed headers and truncated program tables', () => {
  assert.throws(() => checkElfLoadAlignment(new Uint8Array(10)), /Malformed/);
  const b = elf(0n, 0n, 4096n);
  b[5] = 2;
  assert.throws(() => checkElfLoadAlignment(b), /unsupported/);
  b[5] = 1;
  assert.throws(() => checkElfLoadAlignment(b.subarray(0, 119)), /Malformed/);
  assert.throws(() => isZipDataAligned(1n, 0n), RangeError);
});

test('ignores non-load program headers', () => {
  const b = elf(0n, 1n, 4096n);
  new DataView(b.buffer).setUint32(64, 2, true);
  assert.deepEqual(checkElfLoadAlignment(b), []);
});
