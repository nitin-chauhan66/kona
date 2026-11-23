/**
 * Kona Web Application Orchestrator
 *
 * Coordinates:
 * - Schematic Canvas (FR-1.1)
 * - Real-Time DRC Diagnostics (FR-1.2)
 * - Starter IP & Parameter Inspector (FR-1.3)
 * - Deterministic SystemVerilog Generator (FR-1.4)
 * - Local Wasm Simulation & Waveform Viewer (FR-1.5)
 * - Shareable Links & Netlist Persistence (FR-1.6)
 */

import {
  KonaDesign,
  KonaModuleInstance,
  serializeKonaDesign,
  parseKonaDesign
} from '../../../packages/core/dist/ir.js';
import {
  STARTER_IP_CATALOG,
  STARTER_TEMPLATES,
  getModuleDef
} from '../../../packages/core/dist/catalog.js';
import { runDesignRuleCheck, DrcDiagnostic } from '../../../packages/core/dist/drc.js';
import { generateSystemVerilog } from '../../../packages/core/dist/codegen.js';
import { runSimulation } from '../../../packages/core/dist/sim.js';
import { SchematicCanvas } from './canvas.js';
import { WaveformViewer } from './waveform.js';

export class KonaApp {
  private canvas: SchematicCanvas;
  private waveformViewer: WaveformViewer;
  private design: KonaDesign;
  private selectedInstance: KonaModuleInstance | null = null;
  private diagnostics: DrcDiagnostic[] = [];

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
      this.renderInspector();
    });

    this.canvas.onDesignChange((newDesign) => {
      this.design = newDesign;
      this.onDesignUpdated();
    });

    // 5. Setup UI Panels & Actions
    this.setupCatalogSidebar();
    this.setupTemplatesPicker();
    this.setupHeaderActions();
    this.setupBottomDrawerTabs();
    this.setupSimulationControls();

    // 6. Initial render
    this.onDesignUpdated();
    this.renderInspector();
  }

  private onDesignUpdated(): void {
    // Run DRC
    this.diagnostics = runDesignRuleCheck(this.design);
    this.renderDrcStatus();

    // Generate SystemVerilog
    const svCode = generateSystemVerilog(this.design);
    const codeEl = document.getElementById('sv-code-output');
    if (codeEl) codeEl.textContent = svCode;

    // Update Line Numbers
    const lineNumbersEl = document.getElementById('code-line-numbers');
    if (lineNumbersEl) {
      const lineCount = svCode.split('\n').length;
      lineNumbersEl.innerHTML = Array.from({ length: lineCount }, (_, i) => `<div>${i + 1}</div>`).join('');
    }

    // Save to URL hash for shareable links
    this.saveDesignToHash();
  }

  private renderDrcStatus(): void {
    const chipEl = document.getElementById('drc-status-chip');
    const panelEl = document.getElementById('drc-panel-body');
    const errors = this.diagnostics.filter(d => d.severity === 'error');
    const warnings = this.diagnostics.filter(d => d.severity === 'warning');

    if (chipEl) {
      if (errors.length > 0) {
        chipEl.className = 'status-chip error';
        chipEl.textContent = `${errors.length} DRC Error${errors.length > 1 ? 's' : ''}`;
      } else if (warnings.length > 0) {
        chipEl.className = 'status-chip warning';
        chipEl.textContent = `${warnings.length} DRC Warning${warnings.length > 1 ? 's' : ''}`;
      } else {
        chipEl.className = 'status-chip success';
        chipEl.textContent = 'DRC Passed';
      }
    }

    if (panelEl) {
      if (this.diagnostics.length === 0) {
        panelEl.innerHTML = '<div class="drc-empty">All design rules satisfied. Clean netlist!</div>';
      } else {
        panelEl.innerHTML = this.diagnostics.map(d => `
          <div class="drc-item ${d.severity}">
            <div class="drc-item-rule">${d.rule}</div>
            <div class="drc-item-msg">${escapeHtml(d.message)}</div>
          </div>
        `).join('');
      }
    }
  }

  private renderInspector(): void {
    const container = document.getElementById('inspector-content');
    if (!container) return;

    if (!this.selectedInstance) {
      container.innerHTML = `
        <div class="inspector-empty">
          <div class="empty-graphic">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div class="empty-icon">Select a Block</div>
          <p>Click on any module on the schematic canvas to inspect its ports and tune parameters.</p>
        </div>
      `;
      return;
    }

    const inst = this.selectedInstance;
    const modDef = getModuleDef(inst.moduleId);

    let html = `
      <div class="inspector-header">
        <span class="inspector-badge">${modDef?.category || 'module'}</span>
        <h3>${escapeHtml(inst.name)}</h3>
        <p class="inspector-desc">${modDef?.description || ''}</p>
      </div>

      <div class="inspector-section">
        <label class="section-title">Instance Name</label>
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
        <label class="section-title">Ports</label>
        <div class="ports-list">
    `;

    if (modDef) {
      for (const port of modDef.ports) {
        const isBus = port.width > 1;
        html += `
          <div class="port-row">
            <span class="port-dir ${port.direction}">${port.direction.toUpperCase()}</span>
            <span class="port-name">${port.name}${isBus ? `[${port.width - 1}:0]` : ''}</span>
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

    // Attach event listeners for inputs
    const nameInput = document.getElementById('inspector-inst-name') as HTMLInputElement;
    nameInput?.addEventListener('input', () => {
      inst.name = nameInput.value;
      this.canvas.render();
      this.onDesignUpdated();
    });

    container.querySelectorAll('.param-bool').forEach(el => {
      el.addEventListener('change', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = (e.target as HTMLInputElement).checked;
        this.onDesignUpdated();
      });
    });

    container.querySelectorAll('.param-num').forEach(el => {
      el.addEventListener('input', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = parseInt((e.target as HTMLInputElement).value, 10) || 0;
        this.onDesignUpdated();
      });
    });

    container.querySelectorAll('.param-str').forEach(el => {
      el.addEventListener('input', (e) => {
        const pName = (e.target as HTMLInputElement).dataset.param!;
        inst.parameters[pName] = (e.target as HTMLInputElement).value;
        this.onDesignUpdated();
      });
    });

    document.getElementById('btn-delete-module')?.addEventListener('click', () => {
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
          m.category.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
      });
    };

    const renderItems = () => {
      const items = getFilteredItems();
      if (items.length === 0) {
        listEl.innerHTML = `
          <div class="catalog-empty" style="text-align:center; padding:32px 16px; color:var(--md-sys-color-outline);">
            <p style="font-size:12px;">No matching IP modules found.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = items.map(mod => `
          <div class="catalog-card" data-module-id="${mod.id}" title="${mod.description}">
            <div class="catalog-card-header">
              <span class="catalog-category-tag ${mod.category}">${mod.category}</span>
              <span class="catalog-add-btn">+ Add</span>
            </div>
            <div class="catalog-card-title">${mod.name}</div>
            <div class="catalog-card-desc">${mod.description}</div>
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
        });
      }

      const countBadge = document.getElementById('catalog-count-badge');
      if (countBadge) countBadge.textContent = `${items.length} IPs`;
    };

    renderItems();

    // M3 Filter Chips
    const filterChips = document.querySelectorAll('.md-filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.getAttribute('data-filter') || 'all';
        renderItems();
      });
    });

    // Live Search Filter & Clear button
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

  private setupTemplatesPicker(): void {
    const container = document.getElementById('templates-picker');
    if (!container) return;

    container.innerHTML = `
      <label class="picker-label">Architecture Template:</label>
      <select id="template-select" class="kona-select">
        ${STARTER_TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
      </select>
    `;

    const selectEl = container.querySelector('#template-select') as HTMLSelectElement;
    selectEl?.addEventListener('change', () => {
      const tmpl = STARTER_TEMPLATES.find(t => t.id === selectEl.value);
      if (tmpl && confirm(`Load template "${tmpl.name}"? Current canvas edits will be replaced.`)) {
        this.design = tmpl.createDesign();
        this.canvas.setDesign(this.design);
        this.onDesignUpdated();
        showToast(`Loaded ${tmpl.name}`, 'info');
      }
    });
  }

  private setupHeaderActions(): void {
    // Zoom buttons
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.canvas.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.canvas.zoomOut());
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.canvas.resetZoom());

    // Shortcuts modal
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
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        openModal();
      } else if (e.key === 'Escape' && modalEl?.style.display === 'flex') {
        closeModal();
      }
    });

    // Drawer height toggle (minimize / expand)
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
      this.waveformViewer.resize();
    });

    // DRC Diagnostics Panel toggle
    const drcChip = document.getElementById('drc-status-chip');
    const drcToggle = document.getElementById('drc-panel-toggle');
    const drcBody = document.getElementById('drc-panel-body');
    const toggleDrc = () => {
      if (drcBody) {
        drcBody.style.display = drcBody.style.display === 'none' ? 'flex' : 'none';
      }
    };
    drcChip?.addEventListener('click', toggleDrc);
    drcToggle?.addEventListener('click', toggleDrc);

    // Export .kona.json
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      const json = serializeKonaDesign(this.design);
      downloadFile(json, `${this.design.topModule || 'chip'}.kona.json`, 'application/json');
      showToast('Exported .kona.json netlist', 'success');
    });

    // Export top.sv
    document.getElementById('btn-export-sv')?.addEventListener('click', () => {
      const sv = generateSystemVerilog(this.design);
      downloadFile(sv, `${this.design.topModule || 'top'}.sv`, 'text/plain');
      showToast('Exported synthesizable top.sv', 'success');
    });

    // Copy top.sv
    document.getElementById('btn-copy-sv')?.addEventListener('click', () => {
      const sv = generateSystemVerilog(this.design);
      navigator.clipboard.writeText(sv).then(() => {
        showToast('SystemVerilog top.sv copied to clipboard!', 'success');
      });
    });

    // Share link button
    document.getElementById('btn-share-link')?.addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        showToast('Shareable architecture link copied!', 'info');
      });
    });
  }

  private setupBottomDrawerTabs(): void {
    const tabs = document.querySelectorAll('.drawer-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.getAttribute('data-target');
        document.querySelectorAll('.drawer-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`pane-${target}`)?.classList.add('active');

        if (target === 'waveform') {
          this.waveformViewer.resize();
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
        this.waveformViewer.setTrace(result.trace);

        if (simStatus) {
          simStatus.textContent = `Completed ${result.totalCycles} cycles in ${result.durationMs}ms`;
        }

        // Switch to waveform tab
        const wfTab = document.querySelector('[data-target="waveform"]') as HTMLElement;
        wfTab?.click();
      }, 50);
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
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}
