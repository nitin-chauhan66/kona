import { ASIC_IP_LIBRARY_VERILOG } from '../../../../packages/core/dist/asic-rtl.js';
import {
  generateSystemVerilogTestbench,
  validateRtlOutput
} from '../../../../packages/core/dist/codegen.js';
import { KonaDesign } from '../../../../packages/core/dist/ir.js';
import { downloadFile } from '../state/Persistence.js';
import { highlightSystemVerilog } from '../utils/sv-highlighter.js';
import { showToast } from './ToastService.js';

export type RtlViewFile = 'top.sv' | 'top_tb.sv' | 'asic_ip_library.v';

/**
 * Renders syntax-highlighted Stage 2 RTL views (top.sv, top_tb.sv, asic_ip_library.v),
 * synchronized line numbers, and live IEEE 1800 RTL quality checks.
 */
export class RtlPreviewPanel {
  private readonly codeEl: HTMLElement | null;
  private readonly lineNumbersEl: HTMLElement | null;
  private readonly qualityBadgeEl: HTMLElement | null;
  private activeFile: RtlViewFile = 'top.sv';
  private lastDesign: KonaDesign | null = null;
  private lastSvCode = '';

  constructor() {
    this.codeEl = document.getElementById('sv-code-output');
    this.lineNumbersEl = document.getElementById('code-line-numbers');
    this.qualityBadgeEl = document.getElementById('rtl-quality-badge');
    this.bindControls();
  }

  private bindControls(): void {
    document.querySelectorAll('.rtl-file-tab[data-rtl-file]').forEach(btn => {
      btn.addEventListener('click', () => {
        const file = btn.getAttribute('data-rtl-file') as RtlViewFile | null;
        if (!file) return;
        this.activeFile = file;
        document.querySelectorAll('.rtl-file-tab[data-rtl-file]').forEach(b =>
          b.classList.toggle('active', b === btn)
        );
        this.paint();
      });
    });

    document.getElementById('btn-export-tb')?.addEventListener('click', () => {
      if (!this.lastDesign) return;
      const tb = generateSystemVerilogTestbench(this.lastDesign);
      const topName = this.lastDesign.topModule || 'top';
      downloadFile(tb, `${topName}_tb.sv`, 'text/plain');
      showToast(`Exported ${topName}_tb.sv testbench`, 'success');
    });
  }

  public getActiveCode(): string {
    if (this.activeFile === 'top_tb.sv' && this.lastDesign) {
      return generateSystemVerilogTestbench(this.lastDesign);
    }
    if (this.activeFile === 'asic_ip_library.v') {
      return ASIC_IP_LIBRARY_VERILOG;
    }
    return this.lastSvCode;
  }

  public getActiveFilename(): RtlViewFile {
    return this.activeFile;
  }

  public render(svCode: string, design?: KonaDesign): void {
    this.lastSvCode = svCode;
    if (design) {
      this.lastDesign = design;
    }

    if (this.qualityBadgeEl && this.lastDesign) {
      const report = validateRtlOutput(this.lastDesign, svCode);
      if (report.isClean) {
        this.qualityBadgeEl.className = 'rtl-quality-badge clean';
        this.qualityBadgeEl.textContent = `IEEE 1800-2017 · ${report.lineCount} lines · ${report.externalPortCount} ext pins · Clean`;
      } else {
        this.qualityBadgeEl.className = 'rtl-quality-badge warn';
        this.qualityBadgeEl.textContent = `${report.issues.length} RTL issue(s): ${report.issues[0]}`;
      }
    }

    this.paint();
  }

  private paint(): void {
    const code = this.getActiveCode();
    if (this.codeEl) {
      this.codeEl.innerHTML = highlightSystemVerilog(code);
    }

    if (this.lineNumbersEl) {
      const lineCount = code.split('\n').length;
      this.lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join('');
    }
  }
}
