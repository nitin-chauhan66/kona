import { KonaChipSpec, KonaDesign, KonaModuleInstance, KonaNet } from '../../../../packages/core/dist/ir.js';
import { getModuleDef } from '../../../../packages/core/dist/catalog.js';
import { DrcDiagnostic, getEffectivePortWidth } from '../../../../packages/core/dist/drc.js';
import {
  analyzeArchitecture,
  generateArchitectureSpecMarkdown
} from '../../../../packages/core/dist/architecture.js';
import { getPlainModuleInfo } from '../../../../packages/core/dist/plain-english.js';
import { downloadFile } from '../state/Persistence.js';
import { escapeHtml } from '../utils/html.js';

export interface InspectorCallbacks {
  onMutate: () => void;
  onFocusInstance: (instanceId: string) => void;
  onFocusNet: (netId: string) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onUpdateDesignSpec?: (patch: { name?: string; topModule?: string; spec?: KonaChipSpec }) => void;
}

/**
 * Right-hand Inspector panel rendering Design Summary, Module Parameters/Ports,
 * or Wire Net properties.
 */
export class InspectorPanel {
  private readonly container: HTMLElement | null;
  private readonly callbacks: InspectorCallbacks;

  constructor(callbacks: InspectorCallbacks) {
    this.callbacks = callbacks;
    this.container = document.getElementById('inspector-content');
  }

  public render(
    design: KonaDesign,
    diagnostics: DrcDiagnostic[],
    selectedInstance: KonaModuleInstance | null,
    selectedNet: KonaNet | null
  ): void {
    if (!this.container) return;

    if (selectedNet) {
      this.renderNetInspector(design, diagnostics, selectedNet);
    } else if (selectedInstance) {
      this.renderModuleInspector(diagnostics, selectedInstance);
    } else {
      this.renderEmptySummary(design);
    }
  }

  private renderEmptySummary(design: KonaDesign): void {
    if (!this.container) return;
    const report = analyzeArchitecture(design);
    const spec = design.spec || {};

    this.container.innerHTML = `
      <div class="inspector-stage1">
        <div class="inspector-header">
          <div class="inspector-header-top">
            <span class="inspector-badge">STAGE 1 · ARCHITECTURE</span>
            <button id="btn-export-arch-spec" class="btn-chip-action" title="Download Stage 1 Architecture Spec (.md)">Export Spec</button>
          </div>
          <h3>${escapeHtml(design.name)}</h3>
          <p class="inspector-desc">Define chip PPA targets, inspect memory map, or click any block on canvas to inspect its ports.</p>
        </div>

        <div class="inspector-section">
          <label class="section-title">Chip Specification</label>
          <div class="spec-form">
            <label class="spec-field">
              <span>Chip Name</span>
              <input type="text" id="spec-chip-name" class="kona-input" value="${escapeHtml(design.name)}" />
            </label>
            <label class="spec-field">
              <span>Top Module</span>
              <input type="text" id="spec-top-module" class="kona-input" value="${escapeHtml(design.topModule)}" />
            </label>
            <label class="spec-field">
              <span>Target Application</span>
              <input type="text" id="spec-target-app" class="kona-input" placeholder="e.g. Smart Meter RISC-V MCU" value="${escapeHtml(spec.targetApplication || '')}" />
            </label>
            <label class="spec-field">
              <span>Author / Team</span>
              <input type="text" id="spec-author" class="kona-input" placeholder="e.g. Silicon Team India" value="${escapeHtml(spec.author || '')}" />
            </label>
            <div class="spec-budget-row">
              <label class="spec-field">
                <span>Power Budget (mW)</span>
                <input type="number" id="spec-power-budget" class="kona-input" min="1" step="1" placeholder="Auto" value="${spec.powerBudgetMw ?? ''}" />
              </label>
              <label class="spec-field">
                <span>Max Area (mm²)</span>
                <input type="number" id="spec-area-budget" class="kona-input" min="0.1" step="0.1" placeholder="Auto" value="${spec.maxAreaMm2 ?? ''}" />
              </label>
            </div>
          </div>
        </div>

        <div class="inspector-section">
          <label class="section-title">Estimated PPA &amp; Pin Budget (${escapeHtml(report.pdk.shortName)})</label>
          <div class="inspector-design-summary" style="margin-top:0;">
            <div class="summary-row"><span>Logic Size</span><strong>~${report.ppa.estimatedGates.toLocaleString()} GE</strong></div>
            <div class="summary-row"><span>On-Chip SRAM</span><strong>${report.ppa.sramKbytes} KB</strong></div>
            <div class="summary-row"><span>Est. Core Area</span><strong class="${report.ppa.withinAreaBudget ? '' : 'text-warn'}">~${report.ppa.estimatedAreaMm2} mm²</strong></div>
            <div class="summary-row"><span>Est. Power @ ${report.ppa.clockFreqMhz}MHz</span><strong class="${report.ppa.withinPowerBudget ? '' : 'text-warn'}">~${report.ppa.estimatedPowerMw} mW</strong></div>
            <div class="summary-row"><span>Package Pins (${report.pinBudget.packageType})</span><strong class="${report.pinBudget.fitsPackage ? '' : 'text-err'}">${report.pinBudget.signalPins}/${report.pinBudget.maxSignalPins} sig</strong></div>
          </div>
        </div>

        <div class="inspector-section">
          <label class="section-title">System Memory Map (${report.memoryMap.length})</label>
          <div class="memmap-list">
            ${report.memoryMap.length === 0
              ? '<div class="empty-text">No bus crossbar in design (streaming datapath).</div>'
              : report.memoryMap.map(r => `
                <div class="memmap-row ${r.overlapsWith ? 'overlap' : ''}">
                  <div class="memmap-top">
                    <strong>${escapeHtml(r.crossbarName)}.${r.slot}</strong>
                    <code>${r.baseHex}–${r.endHex}</code>
                  </div>
                  <div class="memmap-sub">${escapeHtml(r.targetInstances.join(', ') || 'Unconnected')}${r.overlapsWith ? ` · OVERLAP: ${escapeHtml(r.overlapsWith)}` : ''}</div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <div class="inspector-section">
          <label class="section-title">Stage 1 Readiness</label>
          <div class="stage1-checklist">
            ${report.checklist.map(item => `
              <div class="stage1-check ${item.status}" title="${escapeHtml(item.detail)}">
                <span class="stage1-dot"></span>
                <span>${escapeHtml(item.label)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const applySpecPatch = () => {
      const nameVal = (document.getElementById('spec-chip-name') as HTMLInputElement | null)?.value.trim();
      const topVal = (document.getElementById('spec-top-module') as HTMLInputElement | null)?.value.trim();
      const appVal = (document.getElementById('spec-target-app') as HTMLInputElement | null)?.value.trim();
      const authorVal = (document.getElementById('spec-author') as HTMLInputElement | null)?.value.trim();
      const pwrRaw = (document.getElementById('spec-power-budget') as HTMLInputElement | null)?.value;
      const areaRaw = (document.getElementById('spec-area-budget') as HTMLInputElement | null)?.value;

      const nextSpec: KonaChipSpec = {
        ...spec,
        targetApplication: appVal || undefined,
        author: authorVal || undefined,
        powerBudgetMw: pwrRaw && Number(pwrRaw) > 0 ? Number(pwrRaw) : undefined,
        maxAreaMm2: areaRaw && Number(areaRaw) > 0 ? Number(areaRaw) : undefined
      };

      if (this.callbacks.onUpdateDesignSpec) {
        this.callbacks.onUpdateDesignSpec({
          name: nameVal || design.name,
          topModule: topVal || design.topModule,
          spec: nextSpec
        });
      } else {
        if (nameVal) design.name = nameVal;
        if (topVal) design.topModule = topVal;
        design.spec = nextSpec;
        this.callbacks.onMutate();
      }
    };

    ['spec-chip-name', 'spec-top-module', 'spec-target-app', 'spec-author', 'spec-power-budget', 'spec-area-budget'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applySpecPatch);
    });

    document.getElementById('btn-export-arch-spec')?.addEventListener('click', () => {
      const md = generateArchitectureSpecMarkdown(design, report);
      downloadFile(md, `${design.topModule || 'chip'}_ARCHITECTURE_SPEC.md`, 'text/markdown');
    });
  }

  private renderModuleInspector(diagnostics: DrcDiagnostic[], inst: KonaModuleInstance): void {
    if (!this.container) return;
    const modDef = getModuleDef(inst.moduleId);
    const plain = getPlainModuleInfo(inst.moduleId);
    const instDiags = diagnostics.filter(d => d.instanceId === inst.id);

    let html = `
      <div class="inspector-header">
        <div class="inspector-header-top">
          <span class="inspector-badge">${modDef?.category || 'module'}</span>
          <div class="inspector-quick-actions">
            <button id="btn-focus-module" class="btn-chip-action" title="Center canvas on block">Focus</button>
            <button id="btn-dup-module" class="btn-chip-action" title="Duplicate block (Ctrl+D)">Duplicate</button>
          </div>
        </div>
        <h3>${escapeHtml(inst.name)}</h3>
        <div class="plain-guide-card">
          <strong>${escapeHtml(plain.friendlyName)}</strong>
          <span>${escapeHtml(plain.whatItDoes)}</span>
        </div>
        <p class="inspector-desc">${modDef?.description || ''}</p>
      </div>
    `;

    if (instDiags.length > 0) {
      html += `
        <div class="inspector-alerts">
          ${instDiags.map(d => `<div class="inspector-alert ${d.severity}"><strong>${d.rule}:</strong> ${escapeHtml(d.message)}</div>`).join('')}
        </div>
      `;
    }

    html += `
      <div class="inspector-section">
        <label class="section-title" for="inspector-inst-name">Instance Name</label>
        <input type="text" id="inspector-inst-name" class="kona-input" value="${escapeHtml(inst.name)}" />
      </div>

      <div class="inspector-section">
        <label class="section-title">Parameters</label>
        <div class="params-list">
    `;

    if (modDef && modDef.parameters.length > 0) {
      for (const p of modDef.parameters) {
        const val = inst.parameters[p.name] !== undefined ? inst.parameters[p.name] : p.default;
        html += `
          <div class="param-row">
            <div class="param-meta">
              <span class="param-name">${p.name}</span>
              <span class="param-desc">${p.description}</span>
            </div>
        `;
        if (p.type === 'boolean') {
          html += `<input type="checkbox" class="param-bool" data-param="${p.name}" ${val ? 'checked' : ''} />`;
        } else if (p.type === 'integer') {
          html += `<input type="number" class="kona-input param-num" data-param="${p.name}" value="${val}" />`;
        } else {
          html += `<input type="text" class="kona-input param-str" data-param="${p.name}" value="${escapeHtml(String(val))}" />`;
        }
        html += `</div>`;
      }
    } else {
      html += `<div class="empty-text">No configurable parameters.</div>`;
    }

    html += `
        </div>
      </div>
      <div class="inspector-section">
        <label class="section-title">Ports (${modDef?.ports.length || 0})</label>
        <div class="ports-list">
    `;

    if (modDef) {
      for (const port of modDef.ports) {
        const ew = getEffectivePortWidth(modDef, port, inst);
        const isBus = ew > 1;
        html += `
          <div class="port-row" title="${escapeHtml(port.description || port.name)}">
            <span class="port-dir ${port.direction}">${port.direction.toUpperCase()}</span>
            <span class="port-name">${port.name}${isBus ? `[${ew - 1}:0]` : ''}</span>
            <span class="port-type">${port.type}</span>
          </div>
        `;
      }
    }

    html += `
        </div>
      </div>
      <div class="inspector-footer">
        <button id="btn-delete-module" class="btn-danger">Delete Module</button>
      </div>
    `;

    this.container.innerHTML = html;

    const bindCommitOnChange = (el: HTMLInputElement | null, apply: (input: HTMLInputElement) => void) => {
      if (!el) return;
      el.addEventListener('change', () => apply(el));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') el.blur();
      });
    };

    bindCommitOnChange(
      document.getElementById('inspector-inst-name') as HTMLInputElement | null,
      (el) => {
        inst.name = el.value.trim() || inst.name;
        this.callbacks.onMutate();
      }
    );

    this.container.querySelectorAll('.param-bool').forEach(el => {
      el.addEventListener('change', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = (e.target as HTMLInputElement).checked;
        this.callbacks.onMutate();
      });
    });

    this.container.querySelectorAll('.param-num').forEach(el => {
      bindCommitOnChange(el as HTMLInputElement, (input) => {
        const pName = input.dataset.param!;
        inst.parameters[pName] = parseInt(input.value, 10) || 0;
        this.callbacks.onMutate();
      });
    });

    this.container.querySelectorAll('.param-str').forEach(el => {
      bindCommitOnChange(el as HTMLInputElement, (input) => {
        const pName = input.dataset.param!;
        inst.parameters[pName] = input.value;
        this.callbacks.onMutate();
      });
    });

    document.getElementById('btn-focus-module')?.addEventListener('click', () => this.callbacks.onFocusInstance(inst.id));
    document.getElementById('btn-dup-module')?.addEventListener('click', () => this.callbacks.onDuplicateSelected());
    document.getElementById('btn-delete-module')?.addEventListener('click', () => this.callbacks.onDeleteSelected());
  }

  private renderNetInspector(design: KonaDesign, diagnostics: DrcDiagnostic[], net: KonaNet): void {
    if (!this.container) return;
    const instName = (id: string) => design.instances.find(i => i.id === id)?.name || id;
    const netDiags = diagnostics.filter(d => d.netId === net.id);

    let html = `
      <div class="inspector-header">
        <div class="inspector-header-top">
          <span class="inspector-badge">${net.width > 1 ? `BUS [${net.width - 1}:0]` : '1-BIT WIRE'}</span>
          <button id="btn-focus-net" class="btn-chip-action" title="Center canvas on net">Focus</button>
        </div>
        <h3>${escapeHtml(net.name)}</h3>
        <p class="inspector-desc">Signal net connecting ${net.targets.length} receiver${net.targets.length === 1 ? '' : 's'}.</p>
      </div>
    `;

    if (netDiags.length > 0) {
      html += `
        <div class="inspector-alerts">
          ${netDiags.map(d => `<div class="inspector-alert ${d.severity}"><strong>${d.rule}:</strong> ${escapeHtml(d.message)}</div>`).join('')}
        </div>
      `;
    }

    html += `
      <div class="inspector-section">
        <label class="section-title" for="inspector-net-name">Net Name</label>
        <input type="text" id="inspector-net-name" class="kona-input" value="${escapeHtml(net.name)}" />
      </div>

      <div class="inspector-section">
        <label class="section-title">Driver Source</label>
        <div class="port-row">
          <span class="port-dir output">SRC</span>
          <span class="port-name">${net.source ? `${escapeHtml(instName(net.source.instanceId))}.${escapeHtml(net.source.portId)}` : 'Undriven'}</span>
        </div>
      </div>

      <div class="inspector-section">
        <label class="section-title">Target Receivers (${net.targets.length})</label>
        <div class="ports-list">
          ${net.targets.length === 0
            ? '<div class="empty-text">No target pins connected.</div>'
            : net.targets.map((t, idx) => `
              <div class="port-row">
                <span class="port-dir input">DST</span>
                <span class="port-name">${escapeHtml(instName(t.instanceId))}.${escapeHtml(t.portId)}</span>
                <button class="btn-disconnect-pin" data-tgt-idx="${idx}" title="Disconnect this pin">&times;</button>
              </div>
            `).join('')
          }
        </div>
      </div>

      <div class="inspector-footer">
        <button id="btn-delete-net" class="btn-danger">Delete Wire</button>
      </div>
    `;

    this.container.innerHTML = html;

    const netNameInput = document.getElementById('inspector-net-name') as HTMLInputElement | null;
    netNameInput?.addEventListener('change', () => {
      net.name = netNameInput.value.trim() || net.name;
      this.callbacks.onMutate();
    });
    netNameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') netNameInput.blur();
    });

    document.getElementById('btn-focus-net')?.addEventListener('click', () => this.callbacks.onFocusNet(net.id));

    this.container.querySelectorAll('.btn-disconnect-pin').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-tgt-idx') || '-1', 10);
        if (idx >= 0 && idx < net.targets.length) {
          net.targets.splice(idx, 1);
          if (net.targets.length === 0) {
            this.callbacks.onDeleteSelected();
          } else {
            this.callbacks.onMutate();
            this.render(design, diagnostics, null, net);
          }
        }
      });
    });

    document.getElementById('btn-delete-net')?.addEventListener('click', () => this.callbacks.onDeleteSelected());
  }
}
