# ELF alignment lab

A small dependency-free TypeScript example using synthetic ELF headers to contrast two different checks. For ELF64 little-endian PT_LOAD entries, it checks that `p_align` is zero, one, or a power of two and that file offset and virtual address are congruent modulo that alignment. Separately, it checks whether a supplied ZIP entry **data offset** is divisible by a chosen boundary. An ELF segment offset is relative to the ELF file; a ZIP data offset is relative to the archive. Neither check implies the other.

## Run

The recorded test used Node.js v22.23.4 and TypeScript 6.0.3. The fixed test harness expects Node type declarations at `/usr/local/lib/node_modules/@types` as specified in `tsconfig.json`; a different environment may need equivalent tooling at that path.

```sh
tsc -p tsconfig.json
node --test dist/test/alignment.test.js
```

The recorded build passed and all four tests passed. They cover contrasting positive and negative alignment examples, zero and one alignment, malformed and truncated headers, and ignoring a non-load header.

## Limits

This is an educational example, not a comprehensive ELF or APK validator. It reads only ELF64 little-endian program headers, rejects extended program-header numbering, and does not validate all ELF fields, segment contents, or platform loading requirements. An empty result means no PT_LOAD entries were checked, not that an ELF is suitable for loading. The ZIP helper accepts a caller-supplied offset; it does not parse a ZIP archive or locate an entry. No Android or device compatibility has been tested or established.
