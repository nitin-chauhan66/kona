/**
 * Kona Web Application Coordinator
 *
 * Composition root wiring the observable DesignStore with:
 * - SchematicCanvas (FR-1.1)
 * - DrcPanel (FR-1.2)
 * - CatalogPanel & InspectorPanel (FR-1.3)
 * - RtlPreviewPanel (FR-1.4)
 * - WaveformViewer (FR-1.5)
 * - URL Persistence & Export Actions (FR-1.6)
 */

import { parseKonaDesign, serializeKonaDesign } from '../../../packages/core/dist/ir.js';
import { STARTER_TEMPLATES } from '../../../packages/core/dist/catalog.js';
import { generateSystemVerilog } from '../../../packages/core/dist/codegen.js';
import { runSimulation } from '../../../packages/core/dist/sim.js';
import { SchematicCanvas } from './canvas/index.js';
import { DesignSnapshotState, DesignStore } from './state/DesignStore.js';
import {
  downloadFile,
  encodeDesignHash,
  loadCompressedDesignFromHash,
  loadDesignFromHash
} from './state/Persistence.js';
import { CatalogPanel } from './components/CatalogPanel.js';
import { DrcPanel } from './components/DrcPanel.js';
import { InspectorPanel } from './components/InspectorPanel.js';
import { RtlPreviewPanel } from './components/RtlPreviewPanel.js';
import { WaveformViewer } from './components/WaveformViewer.js';
import { TapeoutPanel } from './components/TapeoutPanel.js';
import { LayoutResizer } from './components/LayoutResizer.js';
import { showToast } from './components/ToastService.js';

export class KonaApp {
  private readonly store: DesignStore;
  private readonly canvas: SchematicCanvas;
  private readonly waveformViewer: WaveformViewer;
  private readonly drcPanel: DrcPanel;
  private readonly inspectorPanel: InspectorPanel;
  private readonly rtlPreviewPanel: RtlPreviewPanel;
  private readonly tapeoutPanel: TapeoutPanel;
  private readonly layoutResizer: LayoutResizer;
  private drawerState: 'normal' | 'minimized' | 'expanded' = 'normal';

  constructor() {
    const initialHash = typeof window !== 'undefined' ? window.location.hash : '';
    const hasCompressedHash = initialHash.startsWith('#z=');
    const loaded = hasCompressedHash ? null : loadDesignFromHash();
    const defaultTemplate = STARTER_TEMPLATES[0];
    const initialDesign = loaded?.design || defaultTemplate.createDesign();
    const initialTemplateId = loaded ? loaded.templateId : (hasCompressedHash ? undefined : defaultTemplate.id);
    const initialDirty = loaded ? !loaded.templateId : hasCompressedHash;

    this.store = new DesignStore(initialDesign, {
      templateId: initialTemplateId,
      isDirty: initialDirty,
      skipInitialHashSync: hasCompressedHash
    });

    const canvasEl = document.getElementById('schematic-canvas') as HTMLCanvasElement;
    this.canvas = new SchematicCanvas(canvasEl, this.store.getDesign());

    const wfContainer = document.getElementById('waveform-container') as HTMLElement;
    this.waveformViewer = new WaveformViewer(wfContainer);

    this.rtlPreviewPanel = new RtlPreviewPanel();

    this.tapeoutPanel = new TapeoutPanel({
      onUpdateSilicon: (silicon) => {
        const design = this.store.getDesign();
        design.silicon = silicon;
        this.store.commitMutation(design);
      }
    });

    this.drcPanel = new DrcPanel({
      onFocusInstance: (id) => this.canvas.focusInstance(id),
      onFocusNet: (id) => this.canvas.focusNet(id),
      onEnsureVisible: () => {
        if (this.isMobileLayout()) {
          document.querySelector('.sidebar-left')?.classList.add('collapsed');
          document.getElementById('btn-toggle-left-sidebar')?.classList.remove('active');
        }
        document.querySelector('.sidebar-right')?.classList.remove('collapsed');
        document.getElementById('btn-toggle-right-sidebar')?.classList.add('active');
        this.syncMobileBackdrop();
        this.layoutResizer.syncHandleVisibility();
        this.canvas.resize();
      }
    });

    this.inspectorPanel = new InspectorPanel({
      onMutate: () => {
        this.canvas.render();
        this.store.commitMutation();
      },
      onFocusInstance: (id) => {
        if (this.isMobileLayout()) this.closeMobileSidebars();
        this.canvas.focusInstance(id);
      },
      onFocusNet: (id) => {
        if (this.isMobileLayout()) this.closeMobileSidebars();
        this.canvas.focusNet(id);
      },
      onDuplicateSelected: () => {
        const dup = this.canvas.duplicateSelected();
        if (dup) showToast(`Duplicated ${dup.name}`, 'info');
      },
      onDeleteSelected: () => {
        this.canvas.deleteSelected();
        if (this.isMobileLayout()) this.closeMobileSidebars();
      },
      onUpdateDesignSpec: (patch) => {
        const design = this.store.getDesign();
        if (patch.name) design.name = patch.name;
        if (patch.topModule) design.topModule = patch.topModule;
        if (patch.spec) design.spec = patch.spec;
        this.store.commitMutation(design);
      }
    });

    new CatalogPanel({
      onAddModule: (moduleId) => {
        this.canvas.addModule(moduleId);
        if (this.isMobileLayout()) this.closeMobileSidebars();
        showToast(`Added ${moduleId} to canvas`, 'success');
      }
    });

    this.bindCanvasEvents();
    this.store.subscribe((state) => this.onStoreStateChange(state));

    this.setupCanvasDragDrop();
    this.setupTemplatesPicker();
    this.setupHeaderActions();
    this.setupCanvasToolbar();
    this.setupSidebarToggles();
    this.setupBottomDrawerTabs();
    this.setupSimulationControls();

    this.layoutResizer = new LayoutResizer({
      onLayoutChange: () => {
        this.canvas.resize();
        this.waveformViewer.resize();
      },
      onBottomDrawerRestore: () => {
        this.drawerState = 'normal';
        this.syncBottomDrawerToggleIcon();
      },
      onBottomDrawerMinimize: () => {
        this.drawerState = 'minimized';
        this.syncBottomDrawerToggleIcon();
      }
    });
    this.layoutResizer.syncHandleVisibility();

    this.canvas.fitToScreen();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => this.canvas.fitToScreen());
    }

    // Hydrate deflate-raw compressed share URLs (`#z=...`) if present on load
    if (hasCompressedHash) {
      void loadCompressedDesignFromHash(initialHash).then((res) => {
        if (!res) return;
        this.canvas.setDesign(res.design);
        this.store.loadTemplateDesign(res.design);
        this.canvas.fitToScreen();
      });
    }
  }

  private bindCanvasEvents(): void {
    let selectedInst = this.store.getState().selectedInstance;
    let selectedNet = this.store.getState().selectedNet;

    this.canvas.onSelectionChange((inst) => {
      selectedInst = inst;
      if (inst) selectedNet = null;
      this.store.setSelection(selectedInst, selectedNet);
    });

    this.canvas.onNetSelectionChange((net) => {
      selectedNet = net;
      if (net) selectedInst = null;
      this.store.setSelection(selectedInst, selectedNet);
    });

    this.canvas.onDesignChange((updatedDesign) => {
      this.store.commitMutation(updatedDesign);
    });
  }

  private onStoreStateChange(state: DesignSnapshotState): void {
    this.canvas.setDiagnostics(state.diagnostics);
    this.drcPanel.update(state.diagnostics);
    this.rtlPreviewPanel.render(state.systemVerilog, state.design);
    this.tapeoutPanel.render(state.design);
    this.inspectorPanel.render(
      state.design,
      state.diagnostics,
      state.selectedInstance,
      state.selectedNet
    );

    const statsEl = document.getElementById('canvas-stats-text');
    if (statsEl) {
      const bCount = state.design.instances.length;
      const nCount = state.design.nets.length;
      statsEl.textContent = `${bCount} block${bCount === 1 ? '' : 's'} \u2022 ${nCount} net${nCount === 1 ? '' : 's'}`;
    }

    const undoBtn = document.getElementById('btn-undo') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('btn-redo') as HTMLButtonElement | null;
    if (undoBtn) undoBtn.disabled = !state.canUndo;
    if (redoBtn) redoBtn.disabled = !state.canRedo;

    const rightBtn = document.getElementById('btn-toggle-right-sidebar');
    const hasSelection = Boolean(state.selectedInstance || state.selectedNet);
    if (rightBtn) {
      rightBtn.classList.toggle('has-selection', hasSelection);
    }

    const inspectBtn = document.getElementById('btn-canvas-inspect') as HTMLButtonElement | null;
    const deleteBtn = document.getElementById('btn-canvas-delete') as HTMLButtonElement | null;
    if (inspectBtn) inspectBtn.disabled = !hasSelection;
    if (deleteBtn) deleteBtn.disabled = !hasSelection;
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

    canvasEl.addEventListener('dragleave', () => viewport.classList.remove('drag-over'));

    canvasEl.addEventListener('drop', (e) => {
      e.preventDefault();
      viewport.classList.remove('drag-over');
      const modId = e.dataTransfer?.getData('text/kona-module');
      if (modId) {
        const rect = canvasEl.getBoundingClientRect();
        const world = this.canvas.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        this.canvas.addModuleAt(modId, world.x - 100, world.y - 60);
        showToast(`Dropped ${modId} onto canvas`, 'success');
        return;
      }

      const file = e.dataTransfer?.files?.[0];
      if (file && file.name.endsWith('.json')) {
        void file.text().then((txt) => this.importKonaJsonString(txt, file.name));
      }
    });
  }

  private importKonaJsonString(jsonText: string, sourceName = 'design.kona.json'): void {
    const { design, errors } = parseKonaDesign(jsonText);
    if (!design || errors.length > 0) {
      showToast(`Invalid netlist (${sourceName}): ${errors[0] || 'parse error'}`, 'error');
      return;
    }
    this.canvas.setDesign(design);
    this.store.loadTemplateDesign(design);
    this.canvas.fitToScreen();
    showToast(`Imported ${design.name}`, 'success');
  }

  private setupTemplatesPicker(): void {
    const container = document.getElementById('templates-picker');
    if (!container) return;

    container.innerHTML = `
      <label class="picker-label" for="template-select">Template:</label>
      <select id="template-select" class="kona-select">
        ${STARTER_TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        <option value="__blank__">+ Blank Custom Chip</option>
      </select>
    `;

    const selectEl = container.querySelector('#template-select') as HTMLSelectElement;
    const activeTmplId = this.store.getState().templateId;
    if (selectEl && activeTmplId) {
      selectEl.value = activeTmplId;
    }
    let lastValue = selectEl.value;

    selectEl?.addEventListener('change', () => {
      if (selectEl.value === '__blank__') {
        if (
          this.store.isDesignDirty() &&
          !confirm('Start a blank custom chip? Unsaved canvas edits will be replaced.')
        ) {
          selectEl.value = lastValue;
          return;
        }
        lastValue = '__blank__';
        const now = new Date().toISOString();
        const blankDesign = {
          version: '1.0' as const,
          name: 'Custom SoC',
          topModule: 'top',
          instances: [],
          nets: [],
          metadata: { version: '1.0', created: now, modified: now, description: 'Blank custom chip architecture' }
        };
        this.canvas.setDesign(blankDesign);
        this.store.loadTemplateDesign(blankDesign);
        this.canvas.fitToScreen();
        showToast('Started blank custom chip', 'info');
        return;
      }

      const tmpl = STARTER_TEMPLATES.find(t => t.id === selectEl.value);
      if (!tmpl) return;

      if (
        this.store.isDesignDirty() &&
        !confirm(`Load template "${tmpl.name}"? Unsaved canvas edits will be replaced.`)
      ) {
        selectEl.value = lastValue;
        return;
      }

      lastValue = selectEl.value;
      const newDesign = tmpl.createDesign();
      this.canvas.setDesign(newDesign);
      this.store.loadTemplateDesign(newDesign, tmpl.id);
      this.canvas.fitToScreen();
      showToast(`Loaded ${tmpl.name}`, 'info');
    });
  }

  private setupCanvasToolbar(): void {
    document.getElementById('btn-fit-view')?.addEventListener('click', () => this.canvas.fitToScreen());
    document.getElementById('btn-canvas-fit')?.addEventListener('click', () => this.canvas.fitToScreen());

    document.getElementById('btn-undo')?.addEventListener('click', () => {
      const restored = this.store.undo();
      if (restored) this.canvas.setDesign(restored);
    });

    document.getElementById('btn-redo')?.addEventListener('click', () => {
      const restored = this.store.redo();
      if (restored) this.canvas.setDesign(restored);
    });

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

    document.getElementById('btn-canvas-inspect')?.addEventListener('click', () => {
      if (this.isMobileLayout()) {
        document.querySelector('.sidebar-left')?.classList.add('collapsed');
        document.getElementById('btn-toggle-left-sidebar')?.classList.remove('active');
      }
      document.querySelector('.sidebar-right')?.classList.remove('collapsed');
      document.getElementById('btn-toggle-right-sidebar')?.classList.add('active');
      this.syncMobileBackdrop();
      this.layoutResizer?.syncHandleVisibility();
      this.canvas.resize();
    });

    document.getElementById('btn-canvas-delete')?.addEventListener('click', () => {
      this.canvas.deleteSelected();
      showToast('Removed selected item', 'info');
    });

    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        const restored = this.store.undo();
        if (restored) this.canvas.setDesign(restored);
      } else if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        const restored = this.store.redo();
        if (restored) this.canvas.setDesign(restored);
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const dup = this.canvas.duplicateSelected();
        if (dup) showToast(`Duplicated ${dup.name}`, 'info');
      }
    });
  }

  private isMobileLayout(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 900;
  }

  private syncMobileBackdrop(): void {
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (!backdrop) return;
    const leftOpen = !document.querySelector('.sidebar-left')?.classList.contains('collapsed');
    const rightOpen = !document.querySelector('.sidebar-right')?.classList.contains('collapsed');
    backdrop.classList.toggle('visible', this.isMobileLayout() && (leftOpen || rightOpen));
  }

  private closeMobileSidebars(): void {
    document.querySelector('.sidebar-left')?.classList.add('collapsed');
    document.querySelector('.sidebar-right')?.classList.add('collapsed');
    document.getElementById('btn-toggle-left-sidebar')?.classList.remove('active');
    document.getElementById('btn-toggle-right-sidebar')?.classList.remove('active');
    this.syncMobileBackdrop();
    this.layoutResizer?.syncHandleVisibility();
  }

  private setupSidebarToggles(): void {
    const leftSidebar = document.querySelector('.sidebar-left');
    const rightSidebar = document.querySelector('.sidebar-right');
    const leftBtn = document.getElementById('btn-toggle-left-sidebar');
    const rightBtn = document.getElementById('btn-toggle-right-sidebar');
    const backdrop = document.getElementById('mobile-drawer-backdrop');

    // Start with sidebars collapsed on mobile/tablet so the canvas takes full screen
    if (this.isMobileLayout()) {
      this.closeMobileSidebars();
    }

    leftBtn?.addEventListener('click', () => {
      const opening = leftSidebar?.classList.contains('collapsed');
      if (this.isMobileLayout() && opening) {
        rightSidebar?.classList.add('collapsed');
        rightBtn?.classList.remove('active');
      }
      leftSidebar?.classList.toggle('collapsed');
      leftBtn.classList.toggle('active', !leftSidebar?.classList.contains('collapsed'));
      this.syncMobileBackdrop();
      this.layoutResizer?.syncHandleVisibility();
      setTimeout(() => this.canvas.resize(), 220);
    });

    rightBtn?.addEventListener('click', () => {
      const opening = rightSidebar?.classList.contains('collapsed');
      if (this.isMobileLayout() && opening) {
        leftSidebar?.classList.add('collapsed');
        leftBtn?.classList.remove('active');
      }
      rightSidebar?.classList.toggle('collapsed');
      rightBtn.classList.toggle('active', !rightSidebar?.classList.contains('collapsed'));
      this.syncMobileBackdrop();
      this.layoutResizer?.syncHandleVisibility();
      setTimeout(() => this.canvas.resize(), 220);
    });

    backdrop?.addEventListener('click', () => this.closeMobileSidebars());
    document.getElementById('btn-close-left-sidebar')?.addEventListener('click', () => this.closeMobileSidebars());
    document.getElementById('btn-close-right-sidebar')?.addEventListener('click', () => this.closeMobileSidebars());

    leftSidebar?.addEventListener('transitionend', () => this.canvas.resize());
    rightSidebar?.addEventListener('transitionend', () => this.canvas.resize());

    window.addEventListener('resize', () => {
      this.syncMobileBackdrop();
      this.layoutResizer?.clampAll();
      this.canvas.resize();
      this.waveformViewer.resize();
    });
  }

  private syncBottomDrawerToggleIcon(): void {
    const toggleDrawerBtn = document.getElementById('btn-toggle-drawer');
    if (!toggleDrawerBtn) return;
    if (this.drawerState === 'minimized') {
      toggleDrawerBtn.title = 'Expand Bottom Drawer';
      toggleDrawerBtn.setAttribute('aria-label', 'Expand Bottom Drawer');
      toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>`;
    } else if (this.drawerState === 'expanded') {
      toggleDrawerBtn.title = 'Restore Default Drawer Size';
      toggleDrawerBtn.setAttribute('aria-label', 'Restore Default Drawer Size');
      toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
    } else {
      toggleDrawerBtn.title = 'Minimize Bottom Drawer';
      toggleDrawerBtn.setAttribute('aria-label', 'Minimize Bottom Drawer');
      toggleDrawerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    }
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
    modalEl?.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });
    window.addEventListener('keydown', (e) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        openModal();
      } else if (e.key === 'Escape' && modalEl?.style.display === 'flex') {
        closeModal();
      }
    });

    const drawerEl = document.getElementById('app-bottom-drawer');
    const toggleDrawerBtn = document.getElementById('btn-toggle-drawer');

    if (typeof window !== 'undefined' && window.innerWidth <= 680) {
      drawerEl?.classList.add('minimized');
      this.drawerState = 'minimized';
      this.syncBottomDrawerToggleIcon();
    }

    toggleDrawerBtn?.addEventListener('click', () => {
      if (!drawerEl?.classList.contains('minimized') && !drawerEl?.classList.contains('expanded')) {
        this.drawerState = 'normal';
      }
      if (this.drawerState === 'normal') {
        drawerEl?.classList.add('minimized');
        this.drawerState = 'minimized';
      } else if (this.drawerState === 'minimized') {
        drawerEl?.classList.remove('minimized');
        drawerEl?.classList.add('expanded');
        this.drawerState = 'expanded';
      } else {
        drawerEl?.classList.remove('expanded');
        this.drawerState = 'normal';
      }
      this.syncBottomDrawerToggleIcon();
      setTimeout(() => {
        this.canvas.resize();
        this.waveformViewer.resize();
      }, 260);
    });

    const importBtn = document.getElementById('btn-import-json');
    const importInput = document.getElementById('import-json-input') as HTMLInputElement | null;
    importBtn?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', () => {
      const file = importInput.files?.[0];
      if (!file) return;
      void file.text().then((txt) => this.importKonaJsonString(txt, file.name));
      importInput.value = '';
    });

    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      const design = this.store.getDesign();
      downloadFile(serializeKonaDesign(design), `${design.topModule || 'chip'}.kona.json`, 'application/json');
      showToast('Exported .kona.json netlist', 'success');
    });

    document.getElementById('btn-export-sv')?.addEventListener('click', () => {
      const design = this.store.getDesign();
      downloadFile(generateSystemVerilog(design), `${design.topModule || 'top'}.sv`, 'text/plain');
      showToast('Exported synthesizable top.sv', 'success');
    });

    document.getElementById('btn-copy-sv')?.addEventListener('click', () => {
      const code = this.rtlPreviewPanel.getActiveCode() || generateSystemVerilog(this.store.getDesign());
      const name = this.rtlPreviewPanel.getActiveFilename();
      navigator.clipboard?.writeText(code)
        .then(() => showToast(`${name} copied to clipboard!`, 'success'))
        .catch(() => showToast('Clipboard access blocked by browser', 'error'));
    });

    document.getElementById('btn-share-link')?.addEventListener('click', async () => {
      const state = this.store.getState();
      const hash = await encodeDesignHash(state.design, {
        templateId: state.templateId,
        isDirty: state.isDirty
      });
      const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;
      navigator.clipboard?.writeText(shareUrl)
        .then(() => showToast('Shareable architecture link copied!', 'info'))
        .catch(() => showToast('Clipboard access blocked by browser', 'error'));
    });
  }

  private setupBottomDrawerTabs(): void {
    const tabs = document.querySelectorAll('.drawer-tab');
    const drawerEl = document.getElementById('app-bottom-drawer');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (drawerEl?.classList.contains('minimized')) {
          drawerEl.classList.remove('minimized');
          this.drawerState = 'normal';
          this.syncBottomDrawerToggleIcon();
        }

        const target = tab.getAttribute('data-target');
        if (target && drawerEl) {
          drawerEl.setAttribute('data-active-drawer-tab', target);
        }
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
    const cyclesInput = document.getElementById('sim-cycles') as HTMLInputElement | null;

    runBtn?.addEventListener('click', () => {
      const cycles = parseInt(cyclesInput?.value || '64', 10);
      const simStatus = document.getElementById('sim-status-msg');
      if (simStatus) simStatus.textContent = 'Simulating in WebAssembly...';

      setTimeout(() => {
        const result = runSimulation(this.store.getDesign(), cycles);
        const wfTab = document.querySelector('[data-target="waveform"]') as HTMLElement | null;
        wfTab?.click();

        this.waveformViewer.setTrace(result.trace);
        this.waveformViewer.resize();

        if (simStatus) {
          simStatus.textContent = `Completed ${result.totalCycles} cycles in ${result.durationMs}ms`;
        }
      }, 40);
    });
  }
}
