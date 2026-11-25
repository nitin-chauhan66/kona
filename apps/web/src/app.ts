/**
 * Kona Web Application Orchestrator
 *
 * Coordinates:
 * - Schematic Canvas (FR-1.1) with Fit-to-Screen, Drag-and-Drop, Undo/Redo
 * - Real-Time DRC Diagnostics (FR-1.2) with Canvas Overlays & Click-to-Focus
 * - Starter IP & Parameter / Net Inspector (FR-1.3)
 * - Deterministic SystemVerilog Generator (FR-1.4) with Syntax Highlighting
 * - Local Wasm Simulation & Waveform Viewer (FR-1.5)
 * - Shareable Links & Netlist Persistence (FR-1.6)
 */

import {
  KonaDesign,
  KonaModuleInstance,
  KonaNet,
  serializeKonaDesign,
  parseKonaDesign
} from '../../../packages/core/dist/ir.js';
import {
  STARTER_IP_CATALOG,
  STARTER_TEMPLATES,
  getModuleDef
} from '../../../packages/core/dist/catalog.js';
import { runDesignRuleCheck, DrcDiagnostic, getEffectivePortWidth } from '../../../packages/core/dist/drc.js';
import { generateSystemVerilog } from '../../../packages/core/dist/codegen.js';
import { runSimulation } from '../../../packages/core/dist/sim.js';
import { SchematicCanvas } from './canvas.js';
import { WaveformViewer } from './waveform.js';

const MAX_HISTORY = 40;

export class KonaApp {
  private canvas: SchematicCanvas;
  private waveformViewer: WaveformViewer;
  private design: KonaDesign;
  private selectedInstance: KonaModuleInstance | null = null;
  private selectedNet: KonaNet | null = null;
  private diagnostics: DrcDiagnostic[] = [];

  private history: string[] = [];
  private historyIndex = -1;
  private isDirty = false;

  constructor() {
    // 1. Load initial design from URL hash or default template
    this.design = this.loadDesignFromHash() || STARTER_TEMPLATES[0].createDesign();

    // 2. Initialize Canvas
    const canvasEl = document.getElementById('schematic-canvas') as HTMLCanvasElement;
    this.canvas = new SchematicCanvas(canvasEl, this.design);

    // 3. Initialize Waveform Viewer
    const wfContainer = document.getElementById('waveform-container') as HTMLElement;
    this.waveformViewer = new WaveformViewer(wfContainer);

    // 4. Bind Canvas Callbacks
    this.canvas.onSelectionChange((inst) => {
      this.selectedInstance = inst;
      if (inst) this.selectedNet = null;
      this.renderInspector();
    });

    this.canvas.onNetSelectionChange((net) => {
      this.selectedNet = net;
      if (net) this.selectedInstance = null;
      this.renderInspector();
    });

    this.canvas.onDesignChange((newDesign) => {
      this.design = newDesign;
      this.isDirty = true;
      this.onDesignUpdated(true);
    });

    // 5. Setup UI Panels & Actions
    this.setupCatalogSidebar();
    this.setupCanvasDragDrop();
    this.setupTemplatesPicker();
    this.setupHeaderActions();
    this.setupCanvasToolbar();
    this.setupSidebarToggles();
    this.setupBottomDrawerTabs();
    this.setupSimulationControls();

    // 6. Initial render & auto-fit to viewport
    this.pushHistorySnapshot(this.design);
    this.onDesignUpdated(false);
    this.renderInspector();

    this.canvas.fitToScreen();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => this.canvas.fitToScreen());
    }
  }

  private pushHistorySnapshot(design: KonaDesign): void {
    const snap = serializeKonaDesign(design);
    if (this.history[this.historyIndex] === snap) return;
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snap);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
    this.updateUndoRedoButtons();
  }

  private undo(): void {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.restoreFromHistory();
  }

  private redo(): void {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this.restoreFromHistory();
  }

  private restoreFromHistory(): void {
    const snap = this.history[this.historyIndex];
    if (!snap) return;
    const { design } = parseKonaDesign(snap);
    if (!design) return;
    this.design = design;
    this.canvas.setDesign(this.design);
    this.onDesignUpdated(false);
    this.updateUndoRedoButtons();
  }

  private updateUndoRedoButtons(): void {
    const undoBtn = document.getElementById('btn-undo') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('btn-redo') as HTMLButtonElement | null;
    if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
  }

  private onDesignUpdated(recordHistory = true): void {
    if (recordHistory) {
      this.pushHistorySnapshot(this.design);
    }

    // Run DRC & share with canvas overlays
    this.diagnostics = runDesignRuleCheck(this.design);
    this.canvas.setDiagnostics(this.diagnostics);
    this.renderDrcStatus();

    // Update Canvas Stats pill
    const statsEl = document.getElementById('canvas-stats-text');
    if (statsEl) {
      const bCount = this.design.instances.length;
      const nCount = this.design.nets.length;
      statsEl.textContent = `${bCount} block${bCount === 1 ? '' : 's'} \u2022 ${nCount} net${nCount === 1 ? '' : 's'}`;
    }

    // Generate SystemVerilog with syntax highlighting (preserves exact textContent)
    const svCode = generateSystemVerilog(this.design);
    const codeEl = document.getElementById('sv-code-output');
    if (codeEl) {
      codeEl.innerHTML = highlightSystemVerilog(svCode);
    }

    // Update Line Numbers
    const lineNumbersEl = document.getElementById('code-line-numbers');
    if (lineNumbersEl) {
      const lineCount = svCode.split('\n').length;
      lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join('');
    }

    // Refresh inspector if currently showing empty design summary
    if (!this.selectedInstance && !this.selectedNet) {
      this.renderInspector();
    }

    // Save to URL hash for shareable links
    this.saveDesignToHash();
  }

  private renderDrcStatus(): void {
    const chipEl = document.getElementById('drc-status-chip');
    const badgeEl = document.getElementById('drc-badge-count');
    const panelEl = document.getElementById('drc-panel-body');
    const errors = this.diagnostics.filter(d => d.severity === 'error');
    const warnings = this.diagnostics.filter(d => d.severity === 'warning');

    if (chipEl) {
      if (errors.length > 0) {
        chipEl.className = 'status-chip error md-chip';
        chipEl.textContent = `${errors.length} DRC Error${errors.length > 1 ? 's' : ''}`;
      } else if (warnings.length > 0) {
        chipEl.className = 'status-chip warning md-chip';
        chipEl.textContent = `${warnings.length} DRC Warning${warnings.length > 1 ? 's' : ''}`;
      } else {
        chipEl.className = 'status-chip success md-chip';
        chipEl.textContent = 'DRC Passed';
      }
    }

    if (badgeEl) {
      if (errors.length > 0) {
        badgeEl.className = 'drc-header-badge md-badge-pill error';
        badgeEl.textContent = `${errors.length} Error${errors.length > 1 ? 's' : ''}`;
      } else if (warnings.length > 0) {
        badgeEl.className = 'drc-header-badge md-badge-pill warning';
        badgeEl.textContent = `${warnings.length} Warning${warnings.length > 1 ? 's' : ''}`;
      } else {
        badgeEl.className = 'drc-header-badge md-badge-pill';
        badgeEl.textContent = '0 Errors';
      }
    }

    if (panelEl) {
      if (this.diagnostics.length === 0) {
        panelEl.innerHTML = '<div class="drc-empty">All design rules satisfied. Clean netlist!</div>';
      } else {
        panelEl.innerHTML = this.diagnostics.map(d => {
          const targetAttr = d.instanceId
            ? `data-focus-inst="${escapeHtml(d.instanceId)}"`
            : d.netId
              ? `data-focus-net="${escapeHtml(d.netId)}"`
              : '';
          const clickable = targetAttr ? 'clickable' : '';
          return `
            <div class="drc-item ${d.severity} ${clickable}" ${targetAttr} title="${targetAttr ? 'Click to focus on canvas' : ''}">
              <div class="drc-item-rule">${d.rule}</div>
              <div class="drc-item-msg">${escapeHtml(d.message)}</div>
            </div>
          `;
        }).join('');

        panelEl.querySelectorAll('.drc-item.clickable').forEach(item => {
          item.addEventListener('click', () => {
            const instId = item.getAttribute('data-focus-inst');
            const netId = item.getAttribute('data-focus-net');
            if (instId) this.canvas.focusInstance(instId);
            else if (netId) this.canvas.focusNet(netId);
          });
        });
      }
    }
  }

  private renderInspector(): void {
    const container = document.getElementById('inspector-content');
    if (!container) return;

    if (this.selectedNet) {
      this.renderNetInspector(container, this.selectedNet);
      return;
    }

    if (!this.selectedInstance) {
      const bCount = this.design.instances.length;
      const nCount = this.design.nets.length;
      container.innerHTML = `
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
            <div class="summary-row"><span>Design</span><strong>${escapeHtml(this.design.name)}</strong></div>
            <div class="summary-row"><span>Top Module</span><code>${escapeHtml(this.design.topModule)}</code></div>
            <div class="summary-row"><span>Modules / Nets</span><strong>${bCount} / ${nCount}</strong></div>
          </div>
        </div>
      `;
      return;
    }

    const inst = this.selectedInstance;
    const modDef = getModuleDef(inst.moduleId);
    const instDiags = this.diagnostics.filter(d => d.instanceId === inst.id);

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
          html += `
            <input type="checkbox" class="param-bool" data-param="${p.name}" ${val ? 'checked' : ''} />
          `;
        } else if (p.type === 'integer') {
          html += `
            <input type="number" class="kona-input param-num" data-param="${p.name}" value="${val}" />
          `;
        } else {
          html += `
            <input type="text" class="kona-input param-str" data-param="${p.name}" value="${escapeHtml(String(val))}" />
          `;
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

    container.innerHTML = html;

    const nameInput = document.getElementById('inspector-inst-name') as HTMLInputElement;
    nameInput?.addEventListener('input', () => {
      inst.name = nameInput.value;
      this.isDirty = true;
      this.canvas.render();
      this.onDesignUpdated(true);
    });

    container.querySelectorAll('.param-bool').forEach(el => {
      el.addEventListener('change', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = (e.target as HTMLInputElement).checked;
        this.isDirty = true;
        this.canvas.render();
        this.onDesignUpdated(true);
      });
    });

    container.querySelectorAll('.param-num').forEach(el => {
      el.addEventListener('input', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = parseInt((e.target as HTMLInputElement).value, 10) || 0;
        this.isDirty = true;
        this.canvas.render();
        this.onDesignUpdated(true);
      });
    });

    container.querySelectorAll('.param-str').forEach(el => {
      el.addEventListener('input', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = (e.target as HTMLInputElement).value;
        this.isDirty = true;
        this.canvas.render();
        this.onDesignUpdated(true);
      });
    });

    document.getElementById('btn-focus-module')?.addEventListener('click', () => {
      this.canvas.focusInstance(inst.id);
    });

    document.getElementById('btn-dup-module')?.addEventListener('click', () => {
      this.canvas.duplicateSelected();
      showToast(`Duplicated ${inst.name}`, 'info');
    });

    document.getElementById('btn-delete-module')?.addEventListener('click', () => {
      this.canvas.deleteSelected();
    });
  }

  private renderNetInspector(container: HTMLElement, net: KonaNet): void {
    const instName = (id: string) => this.design.instances.find(i => i.id === id)?.name || id;
    const netDiags = this.diagnostics.filter(d => d.netId === net.id);

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

    container.innerHTML = html;

    const netNameInput = document.getElementById('inspector-net-name') as HTMLInputElement;
    netNameInput?.addEventListener('input', () => {
      net.name = netNameInput.value || net.name;
      this.isDirty = true;
      this.canvas.render();
      this.onDesignUpdated(true);
    });

    document.getElementById('btn-focus-net')?.addEventListener('click', () => {
      this.canvas.focusNet(net.id);
    });

    container.querySelectorAll('.btn-disconnect-pin').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-tgt-idx') || '-1', 10);
        if (idx >= 0 && idx < net.targets.length) {
          net.targets.splice(idx, 1);
          if (net.targets.length === 0) {
            this.canvas.deleteSelected();
          } else {
            this.isDirty = true;
            this.canvas.render();
            this.onDesignUpdated(true);
            this.renderInspector();
          }
        }
      });
    });

    document.getElementById('btn-delete-net')?.addEventListener('click', () => {
      this.canvas.deleteSelected();
    });
  }

  private setupCatalogSidebar(): void {
    const listEl = document.getElementById('catalog-items-list');
    if (!listEl) return;

    let activeFilter = 'all';
    let searchQuery = '';

    const getFilteredItems = () => {
      return STARTER_IP_CATALOG.filter(m => {
        const matchesCategory = activeFilter === 'all' || m.category === activeFilter;
        const matchesSearch = !searchQuery ||
          m.name.toLowerCase().includes(searchQuery) ||
          m.description.toLowerCase().includes(searchQuery) ||
          m.category.toLowerCase().includes(searchQuery) ||
          m.id.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
      });
    };

    const renderItems = () => {
      const items = getFilteredItems();
      if (items.length === 0) {
        listEl.innerHTML = `
          <div class="catalog-empty">
            <p>No matching IP modules found.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = items.map(mod => `
          <div class="catalog-card" draggable="true" data-module-id="${mod.id}" title="${escapeHtml(mod.description)}">
            <div class="catalog-card-header">
              <span class="catalog-category-tag ${mod.category}">${mod.category}</span>
              <span class="catalog-meta-right">
                <span class="catalog-port-count">${mod.ports.length}p</span>
                <span class="catalog-add-btn">+ Add</span>
              </span>
            </div>
            <div class="catalog-card-title">${escapeHtml(mod.name)}</div>
            <div class="catalog-card-desc">${escapeHtml(mod.description)}</div>
          </div>
        `).join('');

        listEl.querySelectorAll('.catalog-card').forEach(card => {
          card.addEventListener('click', () => {
            const modId = card.getAttribute('data-module-id');
            if (modId) {
              this.canvas.addModule(modId);
              showToast(`Added ${modId} to canvas`, 'success');
            }
          });

          card.addEventListener('dragstart', (e) => {
            const modId = card.getAttribute('data-module-id');
            const dragEvent = e as DragEvent;
            if (modId && dragEvent.dataTransfer) {
              dragEvent.dataTransfer.setData('text/kona-module', modId);
              dragEvent.dataTransfer.effectAllowed = 'copy';
            }
          });
        });
      }

      const countBadge = document.getElementById('catalog-count-badge');
      if (countBadge) countBadge.textContent = `${items.length} IPs`;
    };

    renderItems();

    const filterChips = document.querySelectorAll('.md-filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.getAttribute('data-filter') || 'all';
        renderItems();
      });
    });

    const searchInput = document.getElementById('catalog-search-input') as HTMLInputElement;
    const clearBtn = document.getElementById('catalog-search-clear');

    searchInput?.addEventListener('input', () => {
      searchQuery = (searchInput.value || '').toLowerCase().trim();
      if (clearBtn) clearBtn.style.display = searchQuery ? 'inline-block' : 'none';
      renderItems();
    });

    clearBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearBtn.style.display = 'none';
      renderItems();
    });
  }

  private setupCanvasDragDrop(): void {
    const viewport = document.querySelector('.canvas-viewport');
    const canvasEl = document.getElementById('schematic-canvas');
    if (!viewport || !canvasEl) return;

    canvasEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      viewport.classList.add('drag-over');
    });

    canvasEl.addEventListener('dragleave', () => {
      viewport.classList.remove('drag-over');
    });

    canvasEl.addEventListener('drop', (e) => {
      e.preventDefault();
      viewport.classList.remove('drag-over');
      const modId = e.dataTransfer?.getData('text/kona-module');
      if (!modId) return;

      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = this.canvas.screenToWorld(sx, sy);

      this.canvas.addModuleAt(modId, world.x - 100, world.y - 60);
      showToast(`Dropped ${modId} onto canvas`, 'success');
    });
  }

  private setupTemplatesPicker(): void {
    const container = document.getElementById('templates-picker');
    if (!container) return;

    container.innerHTML = `
      <label class="picker-label" for="template-select">Template:</label>
      <select id="template-select" class="kona-select">
        ${STARTER_TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
      </select>
    `;

    const selectEl = container.querySelector('#template-select') as HTMLSelectElement;
    let lastValue = selectEl.value;

    selectEl?.addEventListener('change', () => {
      const tmpl = STARTER_TEMPLATES.find(t => t.id === selectEl.value);
      if (!tmpl) return;

      if (this.isDirty && !confirm(`Load template "${tmpl.name}"? Unsaved canvas edits will be replaced.`)) {
        selectEl.value = lastValue;
        return;
      }

      lastValue = selectEl.value;
      this.design = tmpl.createDesign();
      this.isDirty = false;
      this.history = [];
      this.historyIndex = -1;
      this.pushHistorySnapshot(this.design);
      this.canvas.setDesign(this.design);
      this.canvas.fitToScreen();
      this.onDesignUpdated(false);
      showToast(`Loaded ${tmpl.name}`, 'info');
    });
  }

  private setupCanvasToolbar(): void {
    document.getElementById('btn-fit-view')?.addEventListener('click', () => this.canvas.fitToScreen());
    document.getElementById('btn-canvas-fit')?.addEventListener('click', () => this.canvas.fitToScreen());

    document.getElementById('btn-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.redo());

    const selectBtn = document.getElementById('btn-tool-select');
    const panBtn = document.getElementById('btn-tool-pan');
    selectBtn?.addEventListener('click', () => {
      this.canvas.setToolMode('select');
      selectBtn.classList.add('active');
      panBtn?.classList.remove('active');
    });
    panBtn?.addEventListener('click', () => {
      this.canvas.setToolMode('pan');
      panBtn.classList.add('active');
      selectBtn?.classList.remove('active');
    });

    const snapBtn = document.getElementById('btn-toggle-snap');
    const snapLabel = document.getElementById('snap-status-label');
    snapBtn?.addEventListener('click', () => {
      const next = !this.canvas.isGridSnapEnabled();
      this.canvas.setGridSnap(next);
      snapBtn.classList.toggle('active', next);
      if (snapLabel) snapLabel.textContent = next ? 'Grid Snap: 20px' : 'Grid Snap: Off';
    });

    // Global keyboard shortcuts (Undo / Redo / Duplicate)
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        this.redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const dup = this.canvas.duplicateSelected();
        if (dup) showToast(`Duplicated ${dup.name}`, 'info');
      }
    });
  }

  private setupSidebarToggles(): void {
    const leftSidebar = document.querySelector('.sidebar-left');
    const rightSidebar = document.querySelector('.sidebar-right');
    const leftBtn = document.getElementById('btn-toggle-left-sidebar');
    const rightBtn = document.getElementById('btn-toggle-right-sidebar');

    leftBtn?.addEventListener('click', () => {
      leftSidebar?.classList.toggle('collapsed');
      leftBtn.classList.toggle('active', !leftSidebar?.classList.contains('collapsed'));
      setTimeout(() => this.canvas.resize(), 220);
    });

    rightBtn?.addEventListener('click', () => {
      rightSidebar?.classList.toggle('collapsed');
      rightBtn.classList.toggle('active', !rightSidebar?.classList.contains('collapsed'));
      setTimeout(() => this.canvas.resize(), 220);
    });
  }

  private setupHeaderActions(): void {
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.canvas.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.canvas.zoomOut());
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.canvas.resetZoom());

    const modalEl = document.getElementById('shortcuts-modal');
    const openModal = () => { if (modalEl) modalEl.style.display = 'flex'; };
    const closeModal = () => { if (modalEl) modalEl.style.display = 'none'; };
    document.getElementById('btn-shortcuts')?.addEventListener('click', openModal);
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-confirm-btn')?.addEventListener('click', closeModal);
    modalEl?.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        openModal();
      } else if (e.key === 'Escape' && modalEl?.style.display === 'flex') {
        closeModal();
      }
    });

    const drawerEl = document.getElementById('app-bottom-drawer');
    const toggleDrawerBtn = document.getElementById('btn-toggle-drawer');
    let drawerState: 'normal' | 'minimized' | 'expanded' = 'normal';

    toggleDrawerBtn?.addEventListener('click', () => {
      if (drawerState === 'normal') {
        drawerEl?.classList.add('minimized');
        drawerState = 'minimized';
        toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>`;
      } else if (drawerState === 'minimized') {
        drawerEl?.classList.remove('minimized');
        drawerEl?.classList.add('expanded');
        drawerState = 'expanded';
        toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
      } else {
        drawerEl?.classList.remove('expanded');
        drawerState = 'normal';
        toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
      }
      setTimeout(() => {
        this.canvas.resize();
        this.waveformViewer.resize();
      }, 260);
    });

    const drcChip = document.getElementById('drc-status-chip');
    const drcToggle = document.getElementById('drc-panel-toggle');
    const drcContainer = document.querySelector('.drc-panel-container');
    const drcBody = document.getElementById('drc-panel-body');

    drcToggle?.addEventListener('click', () => {
      if (!drcBody || !drcContainer) return;
      const collapsed = drcContainer.classList.toggle('collapsed');
      drcBody.style.display = collapsed ? 'none' : 'flex';
    });

    drcChip?.addEventListener('click', () => {
      const rightSidebar = document.querySelector('.sidebar-right');
      rightSidebar?.classList.remove('collapsed');
      if (drcBody && drcContainer) {
        drcContainer.classList.remove('collapsed');
        drcBody.style.display = 'flex';
      }
      this.canvas.resize();
    });

    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      const json = serializeKonaDesign(this.design);
      downloadFile(json, `${this.design.topModule || 'chip'}.kona.json`, 'application/json');
      showToast('Exported .kona.json netlist', 'success');
    });

    document.getElementById('btn-export-sv')?.addEventListener('click', () => {
      const sv = generateSystemVerilog(this.design);
      downloadFile(sv, `${this.design.topModule || 'top'}.sv`, 'text/plain');
      showToast('Exported synthesizable top.sv', 'success');
    });

    document.getElementById('btn-copy-sv')?.addEventListener('click', () => {
      const sv = generateSystemVerilog(this.design);
      navigator.clipboard.writeText(sv).then(() => {
        showToast('SystemVerilog top.sv copied to clipboard!', 'success');
      });
    });

    document.getElementById('btn-share-link')?.addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        showToast('Shareable architecture link copied!', 'info');
      });
    });
  }

  private setupBottomDrawerTabs(): void {
    const tabs = document.querySelectorAll('.drawer-tab');
    const drawerEl = document.getElementById('app-bottom-drawer');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Auto-unminimize drawer when user explicitly clicks a tab
        if (drawerEl?.classList.contains('minimized')) {
          drawerEl.classList.remove('minimized');
        }

        const target = tab.getAttribute('data-target');
        document.querySelectorAll('.drawer-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`pane-${target}`)?.classList.add('active');

        if (target === 'waveform') {
          this.waveformViewer.resize();
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => this.waveformViewer.resize());
          }
        }
      });
    });
  }

  private setupSimulationControls(): void {
    const runBtn = document.getElementById('btn-run-sim');
    const cyclesInput = document.getElementById('sim-cycles') as HTMLInputElement;

    runBtn?.addEventListener('click', () => {
      const cycles = parseInt(cyclesInput?.value || '64', 10);
      const simStatus = document.getElementById('sim-status-msg');
      if (simStatus) simStatus.textContent = 'Simulating in WebAssembly...';

      setTimeout(() => {
        const result = runSimulation(this.design, cycles);

        // Switch to waveform tab first so container has real layout dimensions
        const wfTab = document.querySelector('[data-target="waveform"]') as HTMLElement;
        wfTab?.click();

        this.waveformViewer.setTrace(result.trace);
        this.waveformViewer.resize();

        if (simStatus) {
          simStatus.textContent = `Completed ${result.totalCycles} cycles in ${result.durationMs}ms`;
        }
      }, 40);
    });
  }

  private saveDesignToHash(): void {
    try {
      const json = serializeKonaDesign(this.design);
      const encoded = btoa(encodeURIComponent(json));
      window.location.hash = `design=${encoded}`;
    } catch {
      // Ignore hash update failure on long designs
    }
  }

  private loadDesignFromHash(): KonaDesign | null {
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
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Lightweight SystemVerilog syntax highlighter that preserves exact textContent.
 */
function highlightSystemVerilog(code: string): string {
  const keywords = new Set([
    'module', 'endmodule', 'input', 'output', 'inout', 'logic', 'wire', 'reg',
    'localparam', 'parameter', 'assign', 'always_ff', 'always_comb', 'posedge',
    'negedge', 'begin', 'end', 'if', 'else'
  ]);

  return code
    .split('\n')
    .map(line => {
      const commentIdx = line.indexOf('//');
      const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
      const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

      let highlighted = '';
      const trimmed = codePart.trimStart();
      if (trimmed.startsWith('`')) {
        highlighted = `<span class="sv-directive">${escapeHtml(codePart)}</span>`;
      } else {
        // Tokenize identifiers, numbers, and symbols cleanly without corrupting text
        const tokenRegex = /([a-zA-Z_][a-zA-Z0-9_]*|\d+'[bhdoBHDO][0-9a-fA-F_xXzZ]+|\d+)/g;
        let lastIdx = 0;
        let match: RegExpExecArray | null;
        while ((match = tokenRegex.exec(codePart)) !== null) {
          if (match.index > lastIdx) {
            highlighted += escapeHtml(codePart.slice(lastIdx, match.index));
          }
          const tok = match[0];
          if (keywords.has(tok)) {
            highlighted += `<span class="sv-kw">${escapeHtml(tok)}</span>`;
          } else if (/^\d/.test(tok)) {
            highlighted += `<span class="sv-num">${escapeHtml(tok)}</span>`;
          } else {
            highlighted += escapeHtml(tok);
          }
          lastIdx = tokenRegex.lastIndex;
        }
        if (lastIdx < codePart.length) {
          highlighted += escapeHtml(codePart.slice(lastIdx));
        }
      }

      if (commentPart) {
        highlighted += `<span class="sv-comment">${escapeHtml(commentPart)}</span>`;
      }
      return highlighted;
    })
    .join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
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

function showToast(message: string, type: 'success' | 'info' | 'warning' = 'info'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}
