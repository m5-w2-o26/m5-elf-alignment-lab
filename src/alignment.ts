// A deliberately limited ELF64 little-endian program-header reader.
export type SegmentCheck = { offset: bigint; virtualAddress: bigint; alignment: bigint; valid: boolean };

export function checkElfLoadAlignment(bytes: Uint8Array): SegmentCheck[] {
  const bad = (): never => { throw new Error('Malformed or unsupported ELF64'); };
  if (bytes.length < 64) return bad();
  const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (d.getUint8(0) !== 0x7f || d.getUint8(1) !== 0x45 || d.getUint8(2) !== 0x4c || d.getUint8(3) !== 0x46 || d.getUint8(4) !== 2 || d.getUint8(5) !== 1 || d.getUint8(6) !== 1 || d.getUint32(20, true) !== 1 || d.getUint16(52, true) !== 64) return bad();
  const phoff = d.getBigUint64(32, true);
  const size = d.getUint16(54, true);
  const count = d.getUint16(56, true);
  // Extended numbering is outside this example's scope.
  if (count === 0xffff || (count > 0 && (size < 56 || phoff < 64n)) || phoff + BigInt(size) * BigInt(count) > BigInt(bytes.length)) return bad();
  const checks: SegmentCheck[] = [];
  for (let i = 0; i < count; i++) {
    const p = Number(phoff) + i * size;
    if (d.getUint32(p, true) !== 1) continue; // PT_LOAD only
    const offset = d.getBigUint64(p + 8, true);
    const virtualAddress = d.getBigUint64(p + 16, true);
    const alignment = d.getBigUint64(p + 48, true);
    const valid = alignment <= 1n || ((alignment & (alignment - 1n)) === 0n && offset % alignment === virtualAddress % alignment);
    checks.push({ offset, virtualAddress, alignment, valid });
  }
  return checks;
}

// This checks a supplied ZIP entry data offset, not ZIP metadata or ELF segments.
export function isZipDataAligned(dataOffset: bigint, boundary: bigint): boolean {
  if (dataOffset < 0n || boundary <= 0n) throw new RangeError('Expected a nonnegative offset and positive boundary');
  return dataOffset % boundary === 0n;
}
