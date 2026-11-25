export type ResizableSectionId = 'left' | 'right' | 'bottom' | 'drc';

export interface LayoutResizerCallbacks {
  onLayoutChange: () => void;
  onBottomDrawerRestore?: () => void;
}

interface ResizableSectionConfig {
  id: ResizableSectionId;
  panel: HTMLElement;
  handle: HTMLElement;
  cssVar: string;
  axis: 'horizontal' | 'vertical';
  direction: 1 | -1;
  defaultSize: number;
  minSize: number;
  getMaxSize: () => number;
  isCollapsed?: () => boolean;
  onBeforeResize?: () => void;
}

type PersistedSizes = Partial<Record<ResizableSectionId, number>>;

const STORAGE_KEY = 'kona.layout.sizes.v1';
const MIN_CANVAS_WIDTH = 240;
const MIN_CANVAS_HEIGHT = 120;
const HEADER_FALLBACK_HEIGHT = 54;

/**
 * Manages drag-to-resize and keyboard-accessible splitters for the sidebars,
 * bottom section, and DRC diagnostics sub-panel, with viewport clamping and
 * localStorage persistence.
 */
export class LayoutResizer {
  private readonly callbacks: LayoutResizerCallbacks;
  private readonly sections: ResizableSectionConfig[] = [];
  private readonly customSizes: PersistedSizes = {};

  constructor(callbacks: LayoutResizerCallbacks) {
    this.callbacks = callbacks;
    this.loadPersistedSizes();
    this.registerSections();
    this.applySavedSizes();
    this.bindAll();
    this.syncHandleVisibility();
  }

  private registerSections(): void {
    const leftPanel = document.querySelector('.sidebar-left') as HTMLElement | null;
    const leftHandle = document.getElementById('resizer-left-sidebar');
    if (leftPanel && leftHandle) {
      this.sections.push({
        id: 'left',
        panel: leftPanel,
        handle: leftHandle,
        cssVar: '--sidebar-left-width',
        axis: 'horizontal',
        direction: 1,
        defaultSize: 278,
        minSize: 200,
        getMaxSize: () => this.getMaxSidebarWidth('left'),
        isCollapsed: () => leftPanel.classList.contains('collapsed')
      });
    }

    const rightPanel = document.querySelector('.sidebar-right') as HTMLElement | null;
    const rightHandle = document.getElementById('resizer-right-sidebar');
    if (rightPanel && rightHandle) {
      this.sections.push({
        id: 'right',
        panel: rightPanel,
        handle: rightHandle,
        cssVar: '--sidebar-right-width',
        axis: 'horizontal',
        direction: -1,
        defaultSize: 308,
        minSize: 220,
        getMaxSize: () => this.getMaxSidebarWidth('right'),
        isCollapsed: () => rightPanel.classList.contains('collapsed')
      });
    }

    const bottomPanel = document.getElementById('app-bottom-drawer');
    const bottomHandle = document.getElementById('resizer-bottom-drawer');
    if (bottomPanel && bottomHandle) {
      this.sections.push({
        id: 'bottom',
        panel: bottomPanel,
        handle: bottomHandle,
        cssVar: '--bottom-drawer-height',
        axis: 'vertical',
        direction: -1,
        defaultSize: 244,
        minSize: 88,
        getMaxSize: () => this.getMaxBottomHeight(),
        onBeforeResize: () => {
          if (bottomPanel.classList.contains('minimized') || bottomPanel.classList.contains('expanded')) {
            const currentHeight = this.measureSize(bottomPanel, '--bottom-drawer-height', 244);
            bottomPanel.classList.remove('minimized', 'expanded');
            bottomPanel.style.setProperty('--bottom-drawer-height', `${currentHeight}px`);
            this.callbacks.onBottomDrawerRestore?.();
          }
        }
      });
    }

    const drcPanel = document.querySelector('.drc-panel-container') as HTMLElement | null;
    const drcHandle = document.getElementById('resizer-drc-panel');
    if (drcPanel && drcHandle) {
      this.sections.push({
        id: 'drc',
        panel: drcPanel,
        handle: drcHandle,
        cssVar: '--drc-panel-height',
        axis: 'vertical',
        direction: -1,
        defaultSize: 152,
        minSize: 80,
        getMaxSize: () => this.getMaxDrcHeight(),
        isCollapsed: () => drcPanel.classList.contains('collapsed')
      });
    }
  }

  private getWorkspaceWidth(): number {
    const workspace = document.querySelector('.app-workspace') as HTMLElement | null;
    const rectWidth = workspace?.getBoundingClientRect().width || 0;
    return rectWidth > 0 ? rectWidth : (window.innerWidth || 1280);
  }

  private getMaxSidebarWidth(side: 'left' | 'right'): number {
    const workspaceWidth = this.getWorkspaceWidth();
    const otherSelector = side === 'left' ? '.sidebar-right' : '.sidebar-left';
    const otherSidebar = document.querySelector(otherSelector) as HTMLElement | null;
    let otherWidth = 0;
    if (otherSidebar && !otherSidebar.classList.contains('collapsed')) {
      const fallback = side === 'left' ? 308 : 278;
      const otherVar = side === 'left' ? '--sidebar-right-width' : '--sidebar-left-width';
      otherWidth = this.measureSize(otherSidebar, otherVar, fallback);
    }
    const hardCap = side === 'left' ? 520 : 560;
    const minWidth = side === 'left' ? 200 : 220;
    return Math.max(minWidth, Math.min(hardCap, Math.floor(workspaceWidth - otherWidth - MIN_CANVAS_WIDTH)));
  }

  private getMaxBottomHeight(): number {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    const header = document.querySelector('.app-header') as HTMLElement | null;
    const headerHeight = header?.getBoundingClientRect().height || HEADER_FALLBACK_HEIGHT;
    const ratioCap = Math.floor(viewportHeight * 0.75);
    const spaceCap = Math.floor(viewportHeight - headerHeight - MIN_CANVAS_HEIGHT);
    return Math.max(88, Math.min(ratioCap, spaceCap));
  }

  private getMaxDrcHeight(): number {
    const rightSidebar = document.querySelector('.sidebar-right') as HTMLElement | null;
    const sidebarHeight = rightSidebar?.getBoundingClientRect().height || 0;
    const available = sidebarHeight > 0 ? sidebarHeight - 160 : 380;
    return Math.max(100, Math.min(440, Math.floor(available)));
  }

  private measureSize(panel: HTMLElement, cssVar: string, fallback: number): number {
    const isHorizontal = cssVar.includes('width');
    const rect = panel.getBoundingClientRect();
    const measured = isHorizontal ? rect.width : rect.height;
    if (measured > 0) return Math.round(measured);

    if (panel.id === 'app-bottom-drawer') {
      if (panel.classList.contains('minimized')) return 44;
      if (panel.classList.contains('expanded')) return 440;
    }

    const varVal = parseFloat(panel.style.getPropertyValue(cssVar));
    if (Number.isFinite(varVal) && varVal > 0) return Math.round(varVal);

    return fallback;
  }

  private clampSize(size: number, min: number, max: number): number {
    return Math.max(min, Math.min(Math.max(min, max), Math.round(size)));
  }

  private applySize(config: ResizableSectionConfig, size: number, persist: boolean): number {
    const max = config.getMaxSize();
    const clamped = this.clampSize(size, config.minSize, max);
    config.panel.style.setProperty(config.cssVar, `${clamped}px`);
    config.handle.setAttribute('aria-valuenow', String(clamped));
    config.handle.setAttribute('aria-valuemax', String(max));
    this.customSizes[config.id] = clamped;
    if (persist) {
      this.savePersistedSizes();
    }
    return clamped;
  }

  private resetSize(config: ResizableSectionConfig): void {
    config.onBeforeResize?.();
    config.panel.style.removeProperty(config.cssVar);
    delete this.customSizes[config.id];
    config.handle.setAttribute('aria-valuenow', String(config.defaultSize));
    this.savePersistedSizes();
    this.callbacks.onLayoutChange();
  }

  private bindAll(): void {
    for (const config of this.sections) {
      this.bindSection(config);
    }
  }

  private bindSection(config: ResizableSectionConfig): void {
    let isDragging = false;
    let lastPointerDownAt = 0;

    const startDrag = (
      e: PointerEvent | MouseEvent,
      moveEvent: 'pointermove' | 'mousemove',
      upEvent: 'pointerup' | 'mouseup',
      hasCancel: boolean
    ) => {
      if (isDragging || e.button !== 0) return;
      isDragging = true;
      e.preventDefault();

      const startCoord = config.axis === 'horizontal' ? e.clientX : e.clientY;
      const startSize = this.measureSize(config.panel, config.cssVar, config.defaultSize);
      const bodyClass = config.axis === 'horizontal' ? 'is-resizing-col' : 'is-resizing-row';
      let hasDragged = false;

      config.handle.classList.add('active');
      config.panel.classList.add('is-resizing-panel');
      document.body.classList.add(bodyClass);

      if ('pointerId' in e && typeof config.handle.setPointerCapture === 'function') {
        try {
          config.handle.setPointerCapture(e.pointerId);
        } catch {
          // Ignore in synthetic test environments
        }
      }

      const onMove = (moveEv: Event) => {
        const me = moveEv as PointerEvent | MouseEvent;
        const currentCoord = config.axis === 'horizontal' ? me.clientX : me.clientY;
        const delta = (currentCoord - startCoord) * config.direction;
        if (!hasDragged) {
          if (Math.abs(delta) < 1) return;
          hasDragged = true;
          config.onBeforeResize?.();
        }
        this.applySize(config, startSize + delta, false);
        this.callbacks.onLayoutChange();
      };

      const onEnd = () => {
        isDragging = false;
        window.removeEventListener(moveEvent, onMove);
        window.removeEventListener(upEvent, onEnd);
        if (hasCancel) {
          window.removeEventListener('pointercancel', onEnd);
        }

        config.handle.classList.remove('active');
        config.panel.classList.remove('is-resizing-panel');
        document.body.classList.remove(bodyClass);

        if ('pointerId' in e && typeof config.handle.releasePointerCapture === 'function') {
          try {
            config.handle.releasePointerCapture(e.pointerId);
          } catch {
            // Ignore in synthetic test environments
          }
        }

        if (hasDragged) {
          this.savePersistedSizes();
          this.callbacks.onLayoutChange();
        }
      };

      window.addEventListener(moveEvent, onMove);
      window.addEventListener(upEvent, onEnd);
      if (hasCancel) {
        window.addEventListener('pointercancel', onEnd);
      }
    };

    config.handle.addEventListener('pointerdown', (ev) => {
      lastPointerDownAt = Date.now();
      startDrag(ev as PointerEvent, 'pointermove', 'pointerup', true);
    });

    config.handle.addEventListener('mousedown', (ev) => {
      if (Date.now() - lastPointerDownAt < 500) return;
      startDrag(ev as MouseEvent, 'mousemove', 'mouseup', false);
    });

    config.handle.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.resetSize(config);
    });

    config.handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 48 : 16;
      let delta = 0;

      if (config.axis === 'horizontal') {
        if (e.key === 'ArrowRight') delta = step * config.direction;
        else if (e.key === 'ArrowLeft') delta = -step * config.direction;
      } else {
        if (e.key === 'ArrowDown') delta = step * config.direction;
        else if (e.key === 'ArrowUp') delta = -step * config.direction;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        config.onBeforeResize?.();
        this.applySize(config, config.minSize, true);
        this.callbacks.onLayoutChange();
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        config.onBeforeResize?.();
        this.applySize(config, config.getMaxSize(), true);
        this.callbacks.onLayoutChange();
        return;
      }
      if (delta === 0) return;

      e.preventDefault();
      config.onBeforeResize?.();
      const current = this.measureSize(config.panel, config.cssVar, config.defaultSize);
      this.applySize(config, current + delta, true);
      this.callbacks.onLayoutChange();
    });
  }

  public syncHandleVisibility(): void {
    for (const config of this.sections) {
      const hidden = Boolean(config.isCollapsed?.());
      config.handle.classList.toggle('is-hidden', hidden);
    }
  }

  public clampAll(): void {
    for (const config of this.sections) {
      const saved = this.customSizes[config.id];
      if (typeof saved === 'number') {
        this.applySize(config, saved, false);
      }
    }
    this.syncHandleVisibility();
  }

  private applySavedSizes(): void {
    for (const config of this.sections) {
      const saved = this.customSizes[config.id];
      if (typeof saved === 'number' && Number.isFinite(saved)) {
        this.applySize(config, saved, false);
      }
    }
  }

  private loadPersistedSizes(): void {
    try {
      const raw = window.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const key of ['left', 'right', 'bottom', 'drc'] as ResizableSectionId[]) {
        const val = parsed[key];
        if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
          this.customSizes[key] = val;
        }
      }
    } catch {
      // Ignore storage access/parse errors
    }
  }

  private savePersistedSizes(): void {
    try {
      if (!window.localStorage) return;
      if (Object.keys(this.customSizes).length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customSizes));
      }
    } catch {
      // Ignore storage write errors
    }
  }
}
