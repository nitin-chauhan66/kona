import { KonaDesign, parseKonaDesign, serializeKonaDesign } from '../../../../packages/core/dist/ir.js';

export function saveDesignToHash(design: KonaDesign): void {
  try {
    const json = serializeKonaDesign(design);
    const encoded = btoa(encodeURIComponent(json));
    window.location.hash = `design=${encoded}`;
  } catch {
    // Ignore hash update failure on oversized designs
  }
}

export function loadDesignFromHash(): KonaDesign | null {
  try {
    const hash = window.location.hash;
    if (hash && hash.includes('design=')) {
      const encoded = hash.split('design=')[1];
      const json = decodeURIComponent(atob(encoded));
      const { design, errors } = parseKonaDesign(json);
      if (design && errors.length === 0) {
        return design;
      }
    }
  } catch {
    // Return null on malformed hash
  }
  return null;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const a = document.createElement('a');
  a.download = filename;

  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    a.href = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
