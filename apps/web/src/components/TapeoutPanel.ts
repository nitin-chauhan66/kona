import {
  AsicTapeoutBundle,
  buildAsicTapeoutTar,
  generateAsicBundle
} from '../../../../packages/core/dist/asic-bundle.js';
import {
  KonaDesign,
  KonaDiePreset,
  KonaPackageType,
  KonaPinEdge,
  KonaShuttleTarget,
  KonaSiliconConfig,
  KonaSramMode,
  PdkId
} from '../../../../packages/core/dist/ir.js';
import { createDefaultSiliconConfig, listPdks } from '../../../../packages/core/dist/pdk.js';
import { downloadFile } from '../state/Persistence.js';
import { escapeHtml } from '../utils/html.js';
import { showToast } from './ToastService.js';

export interface TapeoutPanelCallbacks {
  onUpdateSilicon: (silicon: KonaSiliconConfig) => void;
}

/**
 * Interactive Open-Source PDK & Factory Tape-Out Workbench inside the bottom drawer.
 * Lets designers target SKY130 (130nm), GF180MCU (180nm), or IHP SG13G2 (130nm),
 * inspect LibreLane/OpenLane 2 configs, SDC constraints, pad wrappers, and download
 * a complete RTL-to-GDSII Tape-Out Kit (.tar).
 */
export class TapeoutPanel {
  private readonly container: HTMLElement | null;
  private readonly callbacks: TapeoutPanelCallbacks;
  private activeFileRelPath = 'config.json';
  private lastDesign: KonaDesign | null = null;
  private lastBundle: AsicTapeoutBundle | null = null;

  constructor(callbacks: TapeoutPanelCallbacks) {
    this.callbacks = callbacks;
    this.container = document.getElementById('tapeout-container');
  }

  public render(design: KonaDesign): void {
    if (!this.container) return;
    this.lastDesign = design;

    const silicon: KonaSiliconConfig = design.silicon
      ? { ...design.silicon }
      : createDefaultSiliconConfig('sky130A');

    const bundle = generateAsicBundle({ ...design, silicon });
    this.lastBundle = bundle;

    const pdks = listPdks();
    const previewFile =
      bundle.files.find(f => f.path.endsWith('/' + this.activeFileRelPath)) ||
      bundle.files.find(f => f.path.endsWith('/config.json')) ||
      bundle.files[0];

    const topClean = (design.topModule || 'top').replace(/[^a-zA-Z0-9_]/g, '_');
    const kitName = `${topClean}_${bundle.pdk.id}_tapeout_kit`;
    const runCmd = `tar -xf ${kitName}.tar && cd ${kitName} && ./scripts/run_tapeout.sh`;

    this.container.innerHTML = `
      <div class="tapeout-shell">
        <div class="tapeout-config-col">
          <div class="tapeout-pdk-banner">
            <div class="tapeout-pdk-head">
              <span class="tapeout-node-badge">${bundle.pdk.nodeNm}nm</span>
              <strong>${escapeHtml(bundle.pdk.name)}</strong>
            </div>
            <div class="tapeout-pdk-meta">
              <span>${escapeHtml(bundle.pdk.foundry)}</span> &bull;
              <span>Core ${bundle.pdk.coreVoltage} / IO ${bundle.pdk.ioVoltage}</span> &bull;
              <span>${bundle.pdk.metalLayers}-Metal</span>
            </div>
            <p class="tapeout-india-note">${escapeHtml(bundle.pdk.indiaEcosystemNotes)}</p>
          </div>

          <div class="tapeout-form-grid">
            <label class="tapeout-field">
              <span>Open-Source PDK</span>
              <select id="tapeout-pdk-select" class="kona-input">
                ${pdks.map(p => `<option value="${p.id}" ${p.id === silicon.pdkId ? 'selected' : ''}>${escapeHtml(p.shortName)} (${p.coreVoltage})</option>`).join('')}
              </select>
            </label>

            <label class="tapeout-field">
              <span>Clock Target (MHz)</span>
              <input id="tapeout-clock-input" type="number" class="kona-input" min="1" max="300" value="${silicon.clockFreqMhz}" />
            </label>

            <label class="tapeout-field">
              <span>Core Utilization (%)</span>
              <input id="tapeout-util-input" type="number" class="kona-input" min="20" max="75" value="${Math.round(silicon.coreUtilization * 100)}" />
            </label>

            <label class="tapeout-field">
              <span>Die / MPW Slot</span>
              <select id="tapeout-slot-select" class="kona-input">
                <option value="auto" ${silicon.diePreset === 'auto' ? 'selected' : ''}>Auto-Sized Core</option>
                <option value="mpw_small" ${silicon.diePreset === 'mpw_small' ? 'selected' : ''}>${escapeHtml(bundle.pdk.dieSlots.mpw_small.label)}</option>
                <option value="mpw_medium" ${silicon.diePreset === 'mpw_medium' ? 'selected' : ''}>${escapeHtml(bundle.pdk.dieSlots.mpw_medium.label)}</option>
                <option value="mpw_large" ${silicon.diePreset === 'mpw_large' ? 'selected' : ''}>${escapeHtml(bundle.pdk.dieSlots.mpw_large.label)}</option>
              </select>
            </label>

            <label class="tapeout-field">
              <span>Target Package</span>
              <select id="tapeout-pkg-select" class="kona-input">
                ${(['QFN32', 'QFN48', 'QFN64', 'DIP40'] as KonaPackageType[]).map(pkg => `<option value="${pkg}" ${pkg === silicon.packageType ? 'selected' : ''}>${pkg}</option>`).join('')}
              </select>
            </label>

            <label class="tapeout-field">
              <span>Shuttle / Fab Channel</span>
              <select id="tapeout-shuttle-select" class="kona-input">
                <option value="librelane_mpw" ${silicon.shuttleTarget === 'librelane_mpw' ? 'selected' : ''}>LibreLane / Open MPW</option>
                <option value="cdac_chipin" ${silicon.shuttleTarget === 'cdac_chipin' ? 'selected' : ''}>C-DAC ChipIN / 180nm Prototype</option>
                <option value="tiny_tapeout" ${silicon.shuttleTarget === 'tiny_tapeout' ? 'selected' : ''}>Tiny Tapeout Tile Flow</option>
              </select>
            </label>

            <label class="tapeout-field">
              <span>SRAM Implementation</span>
              <select id="tapeout-sram-select" class="kona-input">
                <option value="openram_macro" ${silicon.sramMode === 'openram_macro' ? 'selected' : ''}>OpenRAM Macro Ready</option>
                <option value="dff_array" ${silicon.sramMode === 'dff_array' ? 'selected' : ''}>Soft DFF Register Array</option>
              </select>
            </label>
          </div>

          <div class="tapeout-checks">
            ${bundle.readinessChecks.map(c => `
              <div class="tapeout-check-row ${c.status}">
                <span class="check-pill">${c.status.toUpperCase()}</span>
                <div class="check-text">
                  <strong>${escapeHtml(c.label)}</strong>
                  <span>${escapeHtml(c.detail)}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="tapeout-actions">
            <button id="btn-download-tapeout-tar" class="btn-sm btn-accent md-btn-primary-sm">
              Download Factory Tape-Out Kit (.tar)
            </button>
            <button id="btn-copy-tapeout-cmd" class="btn-sm md-btn-tonal-sm" title="${escapeHtml(runCmd)}">
              Copy Build Command
            </button>
          </div>
          <code class="tapeout-cli-hint">${escapeHtml(runCmd)}</code>
        </div>

        <div class="tapeout-preview-col">
          <div class="tapeout-file-bar">
            <div class="tapeout-file-tabs">
              ${[
                ['config.json', 'config.json'],
                ['constraints/top.sdc', 'top.sdc'],
                ['src/chip_top.v', 'chip_top.v'],
                ['src/top.v', 'top.v'],
                ['pin_order.cfg', 'pin_order.cfg'],
                ['scripts/run_tapeout.sh', 'run_tapeout.sh'],
                ['docs/ARCHITECTURE_SPEC.md', 'ARCHITECTURE_SPEC.md'],
                ['docs/FACTORY_DATASHEET.md', 'FACTORY_DATASHEET.md']
              ].map(([rel, label]) => `
                <button class="tapeout-file-tab ${previewFile.path.endsWith('/' + rel) ? 'active' : ''}" data-file="${rel}">${label}</button>
              `).join('')}
            </div>
            <button id="btn-copy-tapeout-file" class="btn-sm md-btn-tonal-sm">Copy</button>
          </div>
          <pre class="tapeout-code-view"><code id="tapeout-file-preview">${escapeHtml(previewFile.content)}</code></pre>
          <div class="tapeout-pins-strip">
            <span class="pins-label">Pins (${bundle.architecture.pinBudget.signalPins}/${bundle.architecture.pinBudget.maxSignalPins} · Click edge to cycle N/E/S/W):</span>
            ${bundle.externalPorts.map(p => `<button type="button" class="pin-chip ${p.direction}" data-pin-name="${escapeHtml(p.name)}" data-pin-edge="${p.edge}" title="Click to move ${escapeHtml(p.name)} to next die edge">${escapeHtml(p.name)}${p.width > 1 ? `[${p.width - 1}:0]` : ''} · ${p.edge}</button>`).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(silicon, runCmd, previewFile.content);
  }

  private bindEvents(current: KonaSiliconConfig, runCmd: string, previewContent: string): void {
    const emitUpdate = (patch: Partial<KonaSiliconConfig>) => {
      this.callbacks.onUpdateSilicon({ ...current, ...patch });
    };

    const pdkSelect = document.getElementById('tapeout-pdk-select') as HTMLSelectElement | null;
    pdkSelect?.addEventListener('change', () => {
      const nextPdk = pdkSelect.value as PdkId;
      const defaults = createDefaultSiliconConfig(nextPdk);
      emitUpdate({
        pdkId: nextPdk,
        clockFreqMhz: defaults.clockFreqMhz,
        shuttleTarget: defaults.shuttleTarget
      });
    });

    const clockInput = document.getElementById('tapeout-clock-input') as HTMLInputElement | null;
    clockInput?.addEventListener('change', () => {
      const val = Math.max(1, Math.min(300, Number(clockInput.value) || current.clockFreqMhz));
      emitUpdate({ clockFreqMhz: val });
    });

    const utilInput = document.getElementById('tapeout-util-input') as HTMLInputElement | null;
    utilInput?.addEventListener('change', () => {
      const pct = Math.max(20, Math.min(75, Number(utilInput.value) || 45));
      emitUpdate({ coreUtilization: +(pct / 100).toFixed(2) });
    });

    const slotSelect = document.getElementById('tapeout-slot-select') as HTMLSelectElement | null;
    slotSelect?.addEventListener('change', () => {
      emitUpdate({ diePreset: slotSelect.value as KonaDiePreset });
    });

    const pkgSelect = document.getElementById('tapeout-pkg-select') as HTMLSelectElement | null;
    pkgSelect?.addEventListener('change', () => {
      emitUpdate({ packageType: pkgSelect.value as KonaPackageType });
    });

    const shuttleSelect = document.getElementById('tapeout-shuttle-select') as HTMLSelectElement | null;
    shuttleSelect?.addEventListener('change', () => {
      emitUpdate({ shuttleTarget: shuttleSelect.value as KonaShuttleTarget });
    });

    const sramSelect = document.getElementById('tapeout-sram-select') as HTMLSelectElement | null;
    sramSelect?.addEventListener('change', () => {
      emitUpdate({ sramMode: sramSelect.value as KonaSramMode });
    });

    document.getElementById('btn-download-tapeout-tar')?.addEventListener('click', () => {
      if (!this.lastDesign) return;
      const designWithSilicon: KonaDesign = { ...this.lastDesign, silicon: current };
      const { filename, archive } = buildAsicTapeoutTar(designWithSilicon);
      downloadFile(archive, filename, 'application/x-tar');
      showToast(`Exported ${filename} (${this.lastBundle?.files.length || 12} files)`, 'success');
    });

    document.getElementById('btn-copy-tapeout-cmd')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(runCmd)
        .then(() => showToast('Copied LibreLane RTL-to-GDSII build command!', 'info'))
        .catch(() => showToast('Clipboard access blocked by browser', 'error'));
    });

    document.getElementById('btn-copy-tapeout-file')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(previewContent)
        .then(() => showToast(`Copied ${this.activeFileRelPath}`, 'info'))
        .catch(() => showToast('Clipboard access blocked by browser', 'error'));
    });

    this.container?.querySelectorAll('.tapeout-file-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const rel = btn.getAttribute('data-file');
        if (!rel || !this.lastDesign) return;
        this.activeFileRelPath = rel;
        this.render(this.lastDesign);
      });
    });

    const edgeCycle: Record<KonaPinEdge, KonaPinEdge> = { N: 'E', E: 'S', S: 'W', W: 'N' };
    this.container?.querySelectorAll('.pin-chip[data-pin-name]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pName = btn.getAttribute('data-pin-name');
        const curEdge = (btn.getAttribute('data-pin-edge') || 'W') as KonaPinEdge;
        if (!pName) return;
        const nextEdge = edgeCycle[curEdge] || 'N';
        emitUpdate({
          pinEdges: {
            ...(current.pinEdges || {}),
            [pName]: nextEdge
          }
        });
      });
    });
  }
}
