import { highlightSystemVerilog } from '../utils/sv-highlighter.js';

/**
 * Renders syntax-highlighted SystemVerilog RTL preview and synchronized line numbers.
 */
export class RtlPreviewPanel {
  private readonly codeEl: HTMLElement | null;
  private readonly lineNumbersEl: HTMLElement | null;

  constructor() {
    this.codeEl = document.getElementById('sv-code-output');
    this.lineNumbersEl = document.getElementById('code-line-numbers');
  }

  public render(svCode: string): void {
    if (this.codeEl) {
      this.codeEl.innerHTML = highlightSystemVerilog(svCode);
    }

    if (this.lineNumbersEl) {
      const lineCount = svCode.split('\n').length;
      this.lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join('');
    }
  }
}
