import {
  KonaDesign,
  KonaModuleInstance,
  KonaNet
} from '../../../../packages/core/dist/ir.js';
import { getModuleDef } from '../../../../packages/core/dist/catalog.js';
import { DrcDiagnostic } from '../../../../packages/core/dist/drc.js';
import {
  buildPortMap,
  computeAllPortPositions,
  findHitWire,
  getInstanceDimensions
} from './geometry.js';
import { CanvasRenderer } from './renderer.js';
import {
  CANVAS_METRICS,
  CanvasToolMode,
  Point,
  PortPosition,
  RenderedWire,
  ViewportTransform
} from './types.js';

/**
 * Interactive 2D Schematic Viewport Controller (FR-1.1).
 * Owns viewport transforms, pointer/keyboard interaction, and delegates
 * geometric calculations and 2D painting to geometry.ts and CanvasRenderer.
 */
export class SchematicCanvas {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly renderer = new CanvasRenderer();

  private design: KonaDesign;
  private diagnostics: DrcDiagnostic[] = [];
  private transform: ViewportTransform = { x: 40, y: 40, scale: 1.0 };

  private selectedInstanceId: string | null = null;
  private selectedNetId: string | null = null;
  private hoveredInstanceId: string | null = null;
  private hoveredNetId: string | null = null;
  private hoveredPort: PortPosition | null = null;

  private draggingInstanceId: string | null = null;
  private dragOffset: Point = { x: 0, y: 0 };
  private isPanning = false;
  private panStart: Point = { x: 0, y: 0 };
  private spacePressed = false;
  private toolMode: CanvasToolMode = 'select';
  private gridSnap = true;

  private wiringSource: PortPosition | null = null;
  private wiringCurrent: Point = { x: 0, y: 0 };
  private mouseScreen: Point = { x: 0, y: 0 };

  private renderedWires: RenderedWire[] = [];
  private resizeObserver: ResizeObserver | null = null;

  private onSelectCallback?: (instance: KonaModuleInstance | null) => void;
  private onNetSelectCallback?: (net: KonaNet | null) => void;
  private onChangeCallback?: (design: KonaDesign) => void;
  private onViewChangeCallback?: (transform: ViewportTransform) => void;

  constructor(canvas: HTMLCanvasElement, initialDesign: KonaDesign) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.design = initialDesign;

    this.setupEvents();
    this.setupResizeObserver();
    this.resize();
    this.render();
  }

  private setupResizeObserver(): void {
    const parent = this.canvas.parentElement;
    if (parent && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(parent);
    }
    window.addEventListener('resize', () => this.resize());
  }

  public setDesign(newDesign: KonaDesign): void {
    this.design = newDesign;
    this.selectedInstanceId = null;
    this.selectedNetId = null;
    this.hoveredNetId = null;
    this.hoveredPort = null;
    this.render();
    this.notifySelection();
  }

  public getDesign(): KonaDesign {
    return this.design;
  }

  public setDiagnostics(diagnostics: DrcDiagnostic[]): void {
    this.diagnostics = diagnostics;
    this.render();
  }

  public setToolMode(mode: CanvasToolMode): void {
    this.toolMode = mode;
    this.updateCursor();
  }

  public getToolMode(): CanvasToolMode {
    return this.toolMode;
  }

  public setGridSnap(enabled: boolean): void {
    this.gridSnap = enabled;
  }

  public isGridSnapEnabled(): boolean {
    return this.gridSnap;
  }

  public onSelectionChange(cb: (instance: KonaModuleInstance | null) => void): void {
    this.onSelectCallback = cb;
  }

  public onNetSelectionChange(cb: (net: KonaNet | null) => void): void {
    this.onNetSelectCallback = cb;
  }

  public onDesignChange(cb: (design: KonaDesign) => void): void {
    this.onChangeCallback = cb;
  }

  public onViewChange(cb: (transform: ViewportTransform) => void): void {
    this.onViewChangeCallback = cb;
  }

  public resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.resetTransform?.();
    this.render();
  }

  private getViewportSize(): { w: number; h: number } {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr || this.canvas.clientWidth || 800;
    const h = this.canvas.height / dpr || this.canvas.clientHeight || 500;
    return { w, h };
  }

  private updateZoomLabel(): void {
    const label = document.getElementById('btn-zoom-reset');
    if (label) {
      label.textContent = `${Math.round(this.transform.scale * 100)}%`;
    }
    this.onViewChangeCallback?.({ ...this.transform });
  }

  public zoomIn(): void {
    const { w, h } = this.getViewportSize();
    this.zoomAt(w / 2, h / 2, 1.2);
  }

  public zoomOut(): void {
    const { w, h } = this.getViewportSize();
    this.zoomAt(w / 2, h / 2, 1 / 1.2);
  }

  public resetZoom(): void {
    this.transform = { x: 60, y: 60, scale: 1.0 };
    this.updateZoomLabel();
    this.render();
  }

  private zoomAt(screenX: number, screenY: number, factor: number): void {
    const newScale = Math.max(0.2, Math.min(2.8, this.transform.scale * factor));
    const ratio = newScale / this.transform.scale;
    this.transform.x = screenX - (screenX - this.transform.x) * ratio;
    this.transform.y = screenY - (screenY - this.transform.y) * ratio;
    this.transform.scale = newScale;
    this.updateZoomLabel();
    this.render();
  }

  public fitToScreen(padding = 56): void {
    if (this.design.instances.length === 0) {
      this.resetZoom();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const inst of this.design.instances) {
      const modDef = getModuleDef(inst.moduleId);
      const { w, h } = getInstanceDimensions(modDef, inst);
      minX = Math.min(minX, inst.position.x);
      minY = Math.min(minY, inst.position.y);
      maxX = Math.max(maxX, inst.position.x + w);
      maxY = Math.max(maxY, inst.position.y + h);
    }

    const { w: viewW, h: viewH } = this.getViewportSize();
    const contentW = Math.max(100, maxX - minX);
    const contentH = Math.max(100, maxY - minY);
    const usableW = Math.max(120, viewW - padding * 2);
    const usableH = Math.max(120, viewH - padding * 2 - 20);

    const scale = Math.min(1.05, Math.max(0.22, Math.min(usableW / contentW, usableH / contentH)));
    this.transform = {
      scale,
      x: viewW / 2 - ((minX + maxX) / 2) * scale,
      y: viewH / 2 - ((minY + maxY) / 2) * scale
    };
    this.updateZoomLabel();
    this.render();
  }

  public focusInstance(instanceId: string): void {
    const inst = this.design.instances.find(i => i.id === instanceId);
    if (!inst) return;
    const modDef = getModuleDef(inst.moduleId);
    const { w, h } = getInstanceDimensions(modDef, inst);
    const { w: viewW, h: viewH } = this.getViewportSize();

    this.selectedInstanceId = inst.id;
    this.selectedNetId = null;

    const targetScale = Math.max(this.transform.scale, 0.85);
    this.transform = {
      scale: targetScale,
      x: viewW / 2 - (inst.position.x + w / 2) * targetScale,
      y: viewH / 2 - (inst.position.y + h / 2) * targetScale
    };
    this.updateZoomLabel();
    this.notifySelection();
    this.render();
  }

  public focusNet(netId: string): void {
    const net = this.design.nets.find(n => n.id === netId);
    if (!net) return;
    this.selectedNetId = net.id;
    this.selectedInstanceId = null;

    const portMap = buildPortMap(this.design);
    const pts: Point[] = [];
    if (net.source) {
      const p = portMap.get(`${net.source.instanceId}:${net.source.portId}`);
      if (p) pts.push(p);
    }
    for (const t of net.targets) {
      const p = portMap.get(`${t.instanceId}:${t.portId}`);
      if (p) pts.push(p);
    }
    if (pts.length > 0) {
      const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const { w: viewW, h: viewH } = this.getViewportSize();
      const targetScale = Math.max(this.transform.scale, 0.85);
      this.transform = {
        scale: targetScale,
        x: viewW / 2 - avgX * targetScale,
        y: viewH / 2 - avgY * targetScale
      };
      this.updateZoomLabel();
    }

    this.notifySelection();
    this.render();
  }

  public deleteSelected(): void {
    if (this.selectedInstanceId) {
      const id = this.selectedInstanceId;
      this.design.instances = this.design.instances.filter(i => i.id !== id);
      this.design.nets = this.design.nets.filter(n => {
        if (n.source?.instanceId === id) return false;
        n.targets = n.targets.filter(t => t.instanceId !== id);
        return n.targets.length > 0 || !!n.source;
      });
      this.selectedInstanceId = null;
      this.render();
      this.notifyChange();
      this.notifySelection();
    } else if (this.selectedNetId) {
      this.design.nets = this.design.nets.filter(n => n.id !== this.selectedNetId);
      this.selectedNetId = null;
      this.render();
      this.notifyChange();
      this.notifySelection();
    }
  }

  public duplicateSelected(): KonaModuleInstance | null {
    if (!this.selectedInstanceId) return null;
    const orig = this.design.instances.find(i => i.id === this.selectedInstanceId);
    if (!orig) return null;

    const count = this.design.instances.filter(i => i.moduleId === orig.moduleId).length + 1;
    const copy: KonaModuleInstance = {
      id: `${orig.moduleId}_${Date.now()}`,
      moduleId: orig.moduleId,
      name: `u_${orig.moduleId}_${count}`,
      position: { x: orig.position.x + 40, y: orig.position.y + 40 },
      parameters: { ...orig.parameters }
    };

    this.design.instances.push(copy);
    this.selectedInstanceId = copy.id;
    this.selectedNetId = null;
    this.render();
    this.notifyChange();
    this.notifySelection();
    return copy;
  }

  public addModule(moduleId: string, name?: string): KonaModuleInstance {
    const { w, h } = this.getViewportSize();
    const viewCenterX = (-this.transform.x + w / 2) / this.transform.scale;
    const viewCenterY = (-this.transform.y + h / 2) / this.transform.scale;
    const offset = (this.design.instances.length % 4) * 20;
    return this.addModuleAt(moduleId, viewCenterX - 100 + offset, viewCenterY - 80 + offset, name);
  }

  public addModuleAt(moduleId: string, worldX: number, worldY: number, name?: string): KonaModuleInstance {
    const modDef = getModuleDef(moduleId);
    const count = this.design.instances.filter(i => i.moduleId === moduleId).length + 1;
    const instName = name || `u_${moduleId}_${count}`;
    const id = `${moduleId}_${Date.now()}_${Math.floor(Math.random() * 100)}`;

    const defaultParams: Record<string, number | string | boolean> = {};
    if (modDef) {
      for (const p of modDef.parameters) {
        defaultParams[p.name] = p.default;
      }
    }

    const posX = this.gridSnap
      ? Math.round(worldX / CANVAS_METRICS.GRID_SIZE) * CANVAS_METRICS.GRID_SIZE
      : Math.round(worldX);
    const posY = this.gridSnap
      ? Math.round(worldY / CANVAS_METRICS.GRID_SIZE) * CANVAS_METRICS.GRID_SIZE
      : Math.round(worldY);

    const newInst: KonaModuleInstance = {
      id,
      moduleId,
      name: instName,
      position: { x: posX, y: posY },
      parameters: defaultParams
    };

    this.design.instances.push(newInst);
    this.selectedInstanceId = newInst.id;
    this.selectedNetId = null;
    this.render();
    this.notifyChange();
    this.notifySelection();
    return newInst;
  }

  public screenToWorld(sx: number, sy: number): Point {
    return {
      x: (sx - this.transform.x) / this.transform.scale,
      y: (sy - this.transform.y) / this.transform.scale
    };
  }

  public render(): void {
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = this.getViewportSize();
    this.renderedWires = this.renderer.render(this.ctx, w, h, dpr, {
      design: this.design,
      diagnostics: this.diagnostics,
      transform: this.transform,
      selectedInstanceId: this.selectedInstanceId,
      selectedNetId: this.selectedNetId,
      hoveredInstanceId: this.hoveredInstanceId,
      hoveredNetId: this.hoveredNetId,
      hoveredPort: this.hoveredPort,
      wiringSource: this.wiringSource,
      wiringCurrent: this.wiringCurrent,
      mouseScreen: this.mouseScreen,
      draggingInstanceId: this.draggingInstanceId,
      isPanning: this.isPanning
    });
  }

  private notifyChange(): void {
    this.design.metadata.modified = new Date().toISOString();
    this.onChangeCallback?.(this.design);
  }

  private notifySelection(): void {
    const inst = this.selectedInstanceId
      ? this.design.instances.find(i => i.id === this.selectedInstanceId) || null
      : null;
    const net = this.selectedNetId
      ? this.design.nets.find(n => n.id === this.selectedNetId) || null
      : null;

    this.onSelectCallback?.(inst);
    this.onNetSelectCallback?.(net);
  }

  private updateCursor(): void {
    if (this.isPanning) {
      this.canvas.style.cursor = 'grabbing';
    } else if (this.spacePressed || this.toolMode === 'pan') {
      this.canvas.style.cursor = 'grab';
    } else if (this.wiringSource || this.hoveredPort) {
      this.canvas.style.cursor = 'crosshair';
    } else if (this.hoveredNetId) {
      this.canvas.style.cursor = 'pointer';
    } else if (this.hoveredInstanceId) {
      this.canvas.style.cursor = 'move';
    } else {
      this.canvas.style.cursor = 'default';
    }
  }

  private setupEvents(): void {
    let hasMoved = false;

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      hasMoved = false;

      if (!this.spacePressed && this.toolMode !== 'pan' && e.button === 0) {
        const allPorts = computeAllPortPositions(this.design);
        const hitRadius = Math.max(10, 11 / this.transform.scale);
        const clickedPort = allPorts.find(p => Math.hypot(p.x - world.x, p.y - world.y) <= hitRadius);

        if (clickedPort) {
          this.wiringSource = clickedPort;
          this.wiringCurrent = { x: world.x, y: world.y };
          this.updateCursor();
          this.render();
          return;
        }
      }

      if (e.button === 1 || e.altKey || this.spacePressed || this.toolMode === 'pan') {
        this.isPanning = true;
        this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
        this.updateCursor();
        return;
      }

      const clickedInst = [...this.design.instances].reverse().find(inst => {
        const modDef = getModuleDef(inst.moduleId);
        const { w, h } = getInstanceDimensions(modDef, inst);
        return (
          world.x >= inst.position.x &&
          world.x <= inst.position.x + w &&
          world.y >= inst.position.y &&
          world.y <= inst.position.y + h
        );
      });

      if (clickedInst) {
        this.selectedInstanceId = clickedInst.id;
        this.selectedNetId = null;
        this.draggingInstanceId = clickedInst.id;
        this.dragOffset = { x: world.x - clickedInst.position.x, y: world.y - clickedInst.position.y };
        this.notifySelection();
        this.render();
        return;
      }

      const hitWire = findHitWire(this.renderedWires, world, this.transform.scale);
      if (hitWire) {
        this.selectedNetId = hitWire.net.id;
        this.selectedInstanceId = null;
        this.notifySelection();
        this.render();
        return;
      }

      this.selectedInstanceId = null;
      this.selectedNetId = null;
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
      this.updateCursor();
      this.notifySelection();
      this.render();
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.mouseScreen = { x: mouseX, y: mouseY };
      const world = this.screenToWorld(mouseX, mouseY);

      if (this.isPanning) {
        this.transform.x = e.clientX - this.panStart.x;
        this.transform.y = e.clientY - this.panStart.y;
        this.render();
        return;
      }

      if (this.wiringSource) {
        this.wiringCurrent = { x: world.x, y: world.y };
        const allPorts = computeAllPortPositions(this.design);
        const snapRadius = Math.max(13, 14 / this.transform.scale);
        this.hoveredPort = allPorts.find(p => {
          if (p.instanceId === this.wiringSource!.instanceId) return false;
          return Math.hypot(p.x - world.x, p.y - world.y) <= snapRadius;
        }) || null;
        this.render();
        return;
      }

      if (this.draggingInstanceId) {
        hasMoved = true;
        const inst = this.design.instances.find(i => i.id === this.draggingInstanceId);
        if (inst) {
          const rawX = world.x - this.dragOffset.x;
          const rawY = world.y - this.dragOffset.y;
          inst.position.x = this.gridSnap
            ? Math.round(rawX / CANVAS_METRICS.GRID_SIZE) * CANVAS_METRICS.GRID_SIZE
            : Math.round(rawX);
          inst.position.y = this.gridSnap
            ? Math.round(rawY / CANVAS_METRICS.GRID_SIZE) * CANVAS_METRICS.GRID_SIZE
            : Math.round(rawY);
          this.render();
        }
        return;
      }

      const insideCanvas = mouseX >= 0 && mouseY >= 0 && mouseX <= rect.width && mouseY <= rect.height;
      if (!insideCanvas) {
        if (this.hoveredPort || this.hoveredNetId || this.hoveredInstanceId) {
          this.hoveredPort = null;
          this.hoveredNetId = null;
          this.hoveredInstanceId = null;
          this.updateCursor();
          this.render();
        }
        return;
      }

      const allPorts = computeAllPortPositions(this.design);
      const portRadius = Math.max(10, 11 / this.transform.scale);
      const port = allPorts.find(p => Math.hypot(p.x - world.x, p.y - world.y) <= portRadius) || null;

      let instHover: string | null = null;
      let netHover: string | null = null;

      if (!port) {
        const hitInst = [...this.design.instances].reverse().find(inst => {
          const modDef = getModuleDef(inst.moduleId);
          const { w, h } = getInstanceDimensions(modDef, inst);
          return (
            world.x >= inst.position.x &&
            world.x <= inst.position.x + w &&
            world.y >= inst.position.y &&
            world.y <= inst.position.y + h
          );
        });
        if (hitInst) {
          instHover = hitInst.id;
        } else {
          const hitWire = findHitWire(this.renderedWires, world, this.transform.scale);
          if (hitWire) netHover = hitWire.net.id;
        }
      }

      const changed =
        port?.instanceId !== this.hoveredPort?.instanceId ||
        port?.portId !== this.hoveredPort?.portId ||
        instHover !== this.hoveredInstanceId ||
        netHover !== this.hoveredNetId;

      if (changed) {
        this.hoveredPort = port;
        this.hoveredInstanceId = instHover;
        this.hoveredNetId = netHover;
        this.updateCursor();
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.updateCursor();
      }

      if (this.draggingInstanceId) {
        this.draggingInstanceId = null;
        if (hasMoved) this.notifyChange();
      }

      if (this.wiringSource) {
        if (this.hoveredPort) {
          this.completeConnection(this.wiringSource, this.hoveredPort);
        }
        this.wiringSource = null;
        this.hoveredPort = null;
        this.updateCursor();
        this.render();
      }
    });

    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      if (e.code === 'Space') {
        if (!this.spacePressed) {
          this.spacePressed = true;
          this.updateCursor();
        }
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelected();
      } else if (e.key === 'Escape') {
        if (this.wiringSource) {
          this.wiringSource = null;
          this.hoveredPort = null;
          this.render();
        } else if (this.selectedInstanceId || this.selectedNetId) {
          this.selectedInstanceId = null;
          this.selectedNetId = null;
          this.notifySelection();
          this.render();
        }
      } else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
        this.fitToScreen();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.spacePressed = false;
        this.updateCursor();
      }
    });
  }

  private completeConnection(src: PortPosition, dst: PortPosition): void {
    const outputPort = src.direction === 'output' ? src : (dst.direction === 'output' ? dst : src);
    const inputPort = src.direction === 'input' ? src : (dst.direction === 'input' ? dst : dst);

    const existingNet = this.design.nets.find(n =>
      n.source?.instanceId === outputPort.instanceId && n.source?.portId === outputPort.portId
    );

    if (existingNet) {
      const alreadyConnected = existingNet.targets.some(
        t => t.instanceId === inputPort.instanceId && t.portId === inputPort.portId
      );
      if (!alreadyConnected) {
        existingNet.targets.push({ instanceId: inputPort.instanceId, portId: inputPort.portId });
      }
      this.selectedNetId = existingNet.id;
      this.selectedInstanceId = null;
    } else {
      const netName = `net_${outputPort.name}_to_${inputPort.name}_${this.design.nets.length + 1}`;
      const newNet: KonaNet = {
        id: `net_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: netName,
        width: outputPort.width || inputPort.width || 1,
        source: { instanceId: outputPort.instanceId, portId: outputPort.portId },
        targets: [{ instanceId: inputPort.instanceId, portId: inputPort.portId }]
      };
      this.design.nets.push(newNet);
      this.selectedNetId = newNet.id;
      this.selectedInstanceId = null;
    }

    this.notifyChange();
    this.notifySelection();
    this.render();
  }
}
