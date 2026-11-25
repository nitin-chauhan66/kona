/**
 * Zero-dependency POSIX USTAR .tar Archive Builder
 *
 * Generates standard USTAR .tar archives in pure TypeScript (works in both
 * Browser and Node.js) with proper 512-byte headers, octal fields, checksums,
 * and POSIX file permissions (0755 for scripts, 0644 for source/docs).
 */

export interface TarEntryInput {
  path: string;
  content: string | Uint8Array;
  executable?: boolean;
}

const textEncoder = new TextEncoder();

function writeAscii(buf: Uint8Array, offset: number, length: number, value: string): void {
  const bytes = textEncoder.encode(value);
  const count = Math.min(bytes.length, length);
  for (let i = 0; i < count; i++) {
    buf[offset + i] = bytes[i];
  }
}

function writeOctal(buf: Uint8Array, offset: number, length: number, value: number): void {
  const oct = Math.max(0, Math.floor(value)).toString(8).padStart(length - 1, '0');
  writeAscii(buf, offset, length - 1, oct);
  buf[offset + length - 1] = 0;
}

function splitUstarPath(rawPath: string): { name: string; prefix: string } {
  const clean = rawPath.replace(/^\/+/, '').replace(/\\/g, '/');
  if (clean.length <= 100) {
    return { name: clean, prefix: '' };
  }
  const idx = clean.lastIndexOf('/', 154);
  if (idx > 0 && clean.length - idx - 1 <= 100) {
    return {
      prefix: clean.slice(0, idx),
      name: clean.slice(idx + 1)
    };
  }
  return { name: clean.slice(-100), prefix: '' };
}

export function buildTarArchive(entries: TarEntryInput[], mtimeSeconds = 1732530000): Uint8Array {
  const chunks: Uint8Array[] = [];

  for (const entry of entries) {
    const data = typeof entry.content === 'string' ? textEncoder.encode(entry.content) : entry.content;
    const header = new Uint8Array(512);
    const { name, prefix } = splitUstarPath(entry.path);

    writeAscii(header, 0, 100, name);
    writeOctal(header, 100, 8, entry.executable ? 0o755 : 0o644);
    writeOctal(header, 108, 8, 1000);
    writeOctal(header, 116, 8, 1000);
    writeOctal(header, 124, 12, data.length);
    writeOctal(header, 136, 12, mtimeSeconds);

    // Checksum placeholder (8 spaces)
    for (let i = 148; i < 156; i++) header[i] = 0x20;

    header[156] = 0x30; // '0' regular file
    writeAscii(header, 257, 6, 'ustar\0');
    writeAscii(header, 263, 2, '00');
    writeAscii(header, 265, 32, 'kona');
    writeAscii(header, 297, 32, 'silicon');
    if (prefix) {
      writeAscii(header, 345, 155, prefix);
    }

    let sum = 0;
    for (let i = 0; i < 512; i++) sum += header[i];
    const sumOct = sum.toString(8).padStart(6, '0');
    writeAscii(header, 148, 6, sumOct);
    header[154] = 0;
    header[155] = 0x20;

    chunks.push(header);
    if (data.length > 0) {
      chunks.push(data);
      const rem = data.length % 512;
      if (rem !== 0) {
        chunks.push(new Uint8Array(512 - rem));
      }
    }
  }

  // Two 512-byte zero blocks mark end of archive
  chunks.push(new Uint8Array(1024));

  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const archive = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    archive.set(chunk, offset);
    offset += chunk.length;
  }
  return archive;
}
