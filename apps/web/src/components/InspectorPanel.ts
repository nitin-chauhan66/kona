import { KonaDesign, KonaModuleInstance, KonaNet } from '../../../../packages/core/dist/ir.js';
import { getModuleDef } from '../../../../packages/core/dist/catalog.js';
import { DrcDiagnostic, getEffectivePortWidth } from '../../../../packages/core/dist/drc.js';
import { escapeHtml } from '../utils/html.js';

export interface InspectorCallbacks {
  onMutate: () => void;
  onFocusInstance: (instanceId: string) => void;
  onFocusNet: (netId: string) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
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
    this.container.innerHTML = `
      <div class="inspector-empty">
        <div class="empty-graphic">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <div class="empty-icon">Select a Block or Net</div>
        <p>Click any module or wire on the schematic canvas to inspect its ports, tune parameters, or edit net connections.</p>
        <div class="inspector-design-summary">
          <div class="summary-row"><span>Design</span><strong>${escapeHtml(design.name)}</strong></div>
          <div class="summary-row"><span>Top Module</span><code>${escapeHtml(design.topModule)}</code></div>
          <div class="summary-row"><span>Modules / Nets</span><strong>${design.instances.length} / ${design.nets.length}</strong></div>
        </div>
      </div>
    `;
  }

  private renderModuleInspector(diagnostics: DrcDiagnostic[], inst: KonaModuleInstance): void {
    if (!this.container) return;
    const modDef = getModuleDef(inst.moduleId);
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

    const nameInput = document.getElementById('inspector-inst-name') as HTMLInputElement | null;
    nameInput?.addEventListener('input', () => {
      inst.name = nameInput.value;
      this.callbacks.onMutate();
    });

    this.container.querySelectorAll('.param-bool').forEach(el => {
      el.addEventListener('change', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = (e.target as HTMLInputElement).checked;
        this.callbacks.onMutate();
      });
    });

    this.container.querySelectorAll('.param-num').forEach(el => {
      el.addEventListener('input', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = parseInt((e.target as HTMLInputElement).value, 10) || 0;
        this.callbacks.onMutate();
      });
    });

    this.container.querySelectorAll('.param-str').forEach(el => {
      el.addEventListener('input', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = (e.target as HTMLInputElement).value;
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
    netNameInput?.addEventListener('input', () => {
      net.name = netNameInput.value || net.name;
      this.callbacks.onMutate();
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
