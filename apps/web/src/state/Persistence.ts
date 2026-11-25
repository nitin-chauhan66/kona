import { KonaDesign, parseKonaDesign } from '../../../../packages/core/dist/ir.js';
import { STARTER_TEMPLATES } from '../../../../packages/core/dist/catalog.js';

export interface LoadedUrlDesign {
  design: KonaDesign;
  templateId?: string;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deflateRaw(input: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw');
  const readPromise = new Response(cs.readable).arrayBuffer();
  const writer = cs.writable.getWriter();
  await writer.write(new Uint8Array(input));
  await writer.close();
  return new Uint8Array(await readPromise);
}

async function inflateRaw(input: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const readPromise = new Response(ds.readable).arrayBuffer();
  const writer = ds.writable.getWriter();
  await writer.write(new Uint8Array(input));
  await writer.close();
  return new Uint8Array(await readPromise);
}

/**
 * Strips pretty-printing whitespace for minimal URL payloads while preserving
 * full lossless KonaDesign structure.
 */
export function compactDesignJson(design: KonaDesign): string {
  return JSON.stringify(design);
}

/**
 * Encodes a design into the shortest lossless URL hash:
 * - Default unmodified template -> empty hash (clean root URL)
 * - Unmodified starter template -> `#t=<templateId>`
 * - Custom/edited design -> `#z=<deflate-raw + base64url>` (or `#d=<utf8 + base64url>` fallback)
 */
export async function encodeDesignHash(
  design: KonaDesign,
  options: { templateId?: string; isDirty: boolean }
): Promise<string> {
  if (!options.isDirty && options.templateId) {
    if (options.templateId === STARTER_TEMPLATES[0]?.id) {
      return '';
    }
    return `#t=${encodeURIComponent(options.templateId)}`;
  }

  const minified = compactDesignJson(design);
  const utf8 = new TextEncoder().encode(minified);

  if (typeof CompressionStream !== 'undefined' && typeof Response !== 'undefined') {
    try {
      const compressed = await deflateRaw(utf8);
      if (compressed.length < utf8.length) {
        return `#z=${toBase64Url(compressed)}`;
      }
    } catch {
      // Fall through to uncompressed base64url
    }
  }

  return `#d=${toBase64Url(utf8)}`;
}

let pendingHashToken = 0;

/**
 * Updates the browser URL cleanly via replaceState (avoiding history spam).
 */
export function saveDesignToHash(
  design: KonaDesign,
  options: { templateId?: string; isDirty: boolean } = { isDirty: true }
): void {
  const token = ++pendingHashToken;

  const applyHash = (hash: string) => {
    if (token !== pendingHashToken) return;
    try {
      const base = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, '', hash ? `${base}${hash}` : base);
    } catch {
      // Ignore history update failures in restricted frames
    }
  };

  if (!options.isDirty && options.templateId) {
    const hash = options.templateId === STARTER_TEMPLATES[0]?.id
      ? ''
      : `#t=${encodeURIComponent(options.templateId)}`;
    applyHash(hash);
    return;
  }

  void encodeDesignHash(design, options).then(applyHash);
}

/**
 * Synchronous initial loader for `#t=`, `#d=`, and legacy `#design=` hashes.
 */
export function loadDesignFromHash(): LoadedUrlDesign | null {
  try {
    const hash = window.location.hash;
    if (!hash) return null;

    if (hash.startsWith('#t=')) {
      const id = decodeURIComponent(hash.slice(3));
      const tmpl = STARTER_TEMPLATES.find(t => t.id === id);
      if (tmpl) return { design: tmpl.createDesign(), templateId: tmpl.id };
    }

    if (hash.startsWith('#d=')) {
      const bytes = fromBase64Url(hash.slice(3));
      const json = new TextDecoder().decode(bytes);
      const { design, errors } = parseKonaDesign(json);
      if (design && errors.length === 0) return { design };
    }

    if (hash.includes('design=')) {
      const encoded = hash.split('design=')[1];
      const json = decodeURIComponent(atob(encoded));
      const { design, errors } = parseKonaDesign(json);
      if (design && errors.length === 0) return { design };
    }
  } catch {
    // Return null on malformed hash
  }
  return null;
}

/**
 * Asynchronous loader for compressed `#z=` hashes (deflate-raw + base64url).
 */
export async function loadCompressedDesignFromHash(
  rawHash = typeof window !== 'undefined' ? window.location.hash : ''
): Promise<LoadedUrlDesign | null> {
  try {
    if (!rawHash.startsWith('#z=') || typeof DecompressionStream === 'undefined') {
      return null;
    }
    const compressed = fromBase64Url(rawHash.slice(3));
    const raw = await inflateRaw(compressed);
    const json = new TextDecoder().decode(raw);
    const { design, errors } = parseKonaDesign(json);
    if (design && errors.length === 0) {
      return { design };
    }
  } catch {
    // Return null on malformed compressed payload
  }
  return null;
}

export function downloadFile(content: string | Uint8Array, filename: string, mimeType: string): void {
  const a = document.createElement('a');
  a.download = filename;

  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const part = content instanceof Uint8Array ? new Uint8Array(content) : content;
    const blob = new Blob([part as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else if (typeof content === 'string') {
    a.href = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    let binary = '';
    for (let i = 0; i < content.length; i++) {
      binary += String.fromCharCode(content[i]);
    }
    a.href = `data:${mimeType};base64,` + btoa(binary);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
