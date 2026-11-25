/**
 * Infinite 2D Schematic Canvas & Orthogonal Wire Auto-Router (FR-1.1)
 *
 * Provides 60 FPS pan/zoom, grid snapping, port pins, wire selection,
 * DRC overlays, lane-staggered Manhattan orthogonal wire auto-routing,
 * and automatic viewport fitting.
 */

import {
  KonaDesign,
  KonaModuleDef,
  KonaModuleInstance,
  KonaNet,
  KonaPortDef
} from '../../../packages/core/dist/ir.js';
import { getModuleDef } from '../../../packages/core/dist/catalog.js';
import { DrcDiagnostic, getEffectivePortWidth } from '../../../packages/core/dist/drc.js';

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface PortPosition {
  instanceId: string;
  portId: string;
  x: number;
  y: number;
  direction: 'input' | 'output' | 'inout';
  width: number;
  name: string;
  type: string;
  description?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RenderedWire {
  net: KonaNet;
  points: Point[];
  src: PortPosition;
  tgt: PortPosition;
}

const GRID_SIZE = 20;
const HEADER_HEIGHT = 34;
const SUBTITLE_HEIGHT = 22;
const TOP_RESERVED = HEADER_HEIGHT + SUBTITLE_HEIGHT; // 56px reserved above ports
const PORT_PITCH = 26;
const BOTTOM_PAD = 18;

export class SchematicCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
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
  private toolMode: 'select' | 'pan' = 'select';
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
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
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

  public setToolMode(mode: 'select' | 'pan'): void {
    this.toolMode = mode;
    this.updateCursor();
  }

  public getToolMode(): 'select' | 'pan' {
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
      const { w, h } = this.getInstanceDimensions(modDef, inst);
      minX = Math.min(minX, inst.position.x);
      minY = Math.min(minY, inst.position.y);
      maxX = Math.max(maxX, inst.position.x + w);
      maxY = Math.max(maxY, inst.position.y + h);
    }

    const { w: viewW, h: viewH } = this.getViewportSize();
    const contentW = Math.max(100, maxX - minX);
    const contentH = Math.max(100, maxY - minY);

    // Leave subtle breathing room for floating top/bottom pills
    const usableW = Math.max(120, viewW - padding * 2);
    const usableH = Math.max(120, viewH - padding * 2 - 20);

    const scale = Math.min(1.05, Math.max(0.22, Math.min(usableW / contentW, usableH / contentH)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.transform = {
      scale,
      x: viewW / 2 - centerX * scale,
      y: viewH / 2 - centerY * scale
    };
    this.updateZoomLabel();
    this.render();
  }

  public focusInstance(instanceId: string): void {
    const inst = this.design.instances.find(i => i.id === instanceId);
    if (!inst) return;
    const modDef = getModuleDef(inst.moduleId);
    const { w, h } = this.getInstanceDimensions(modDef, inst);
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

    const portMap = this.buildPortMap();
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

  public selectInstance(instanceId: string | null): void {
    this.selectedInstanceId = instanceId;
    this.selectedNetId = null;
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
      position: {
        x: orig.position.x + 40,
        y: orig.position.y + 40
      },
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

    const posX = this.gridSnap ? Math.round(worldX / GRID_SIZE) * GRID_SIZE : Math.round(worldX);
    const posY = this.gridSnap ? Math.round(worldY / GRID_SIZE) * GRID_SIZE : Math.round(worldY);

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

  /**
   * Compute consistent dynamic block dimensions so port pins and labels
   * never collide with the header, subtitle, or opposite-side labels.
   */
  public getInstanceDimensions(modDef: KonaModuleDef | undefined, inst: KonaModuleInstance): { w: number; h: number } {
    if (!modDef) return { w: 200, h: 180 };

    const inputPorts = modDef.ports.filter(p => p.direction === 'input');
    const outputPorts = modDef.ports.filter(p => p.direction === 'output');
    const inoutPorts = modDef.ports.filter(p => p.direction === 'inout');

    const maxSidePorts = Math.max(inputPorts.length, outputPorts.length, 1);
    const minPortH = TOP_RESERVED + maxSidePorts * PORT_PITCH + BOTTOM_PAD + (inoutPorts.length > 0 ? 22 : 0);
    const h = Math.max(modDef.defaultHeight || 160, minPortH);

    // Ensure enough horizontal width so left and right port labels never overlap in center
    const maxLeftChars = inputPorts.reduce((max, p) => {
      const ew = getEffectivePortWidth(modDef, p, inst);
      const len = p.name.length + (ew > 1 ? `[${ew - 1}:0]`.length : 0);
      return Math.max(max, len);
    }, 0);
    const maxRightChars = outputPorts.reduce((max, p) => {
      const ew = getEffectivePortWidth(modDef, p, inst);
      const len = p.name.length + (ew > 1 ? `[${ew - 1}:0]`.length : 0);
      return Math.max(max, len);
    }, 0);

    const estimatedLabelW = (maxLeftChars + maxRightChars) * 6.6 + 44;
    const w = Math.max(modDef.defaultWidth || 200, Math.ceil(estimatedLabelW / 10) * 10);

    return { w, h };
  }

  private getAllPortPositions(): PortPosition[] {
    const ports: PortPosition[] = [];
    for (const inst of this.design.instances) {
      const modDef = getModuleDef(inst.moduleId);
      if (!modDef) continue;

      const { w, h } = this.getInstanceDimensions(modDef, inst);
      const inputPorts = modDef.ports.filter(p => p.direction === 'input');
      const outputPorts = modDef.ports.filter(p => p.direction === 'output');
      const inoutPorts = modDef.ports.filter(p => p.direction === 'inout');

      const portAreaTop = inst.position.y + TOP_RESERVED + 6;
      const portAreaBottom = inst.position.y + h - (inoutPorts.length > 0 ? 24 : 10);
      const portAreaH = Math.max(24, portAreaBottom - portAreaTop);

      const inSpacing = portAreaH / (inputPorts.length + 1);
      inputPorts.forEach((p, idx) => {
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x,
          y: portAreaTop + inSpacing * (idx + 1),
          direction: 'input',
          width: getEffectivePortWidth(modDef, p, inst),
          name: p.name,
          type: p.type,
          description: p.description
        });
      });

      const outSpacing = portAreaH / (outputPorts.length + 1);
      outputPorts.forEach((p, idx) => {
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x + w,
          y: portAreaTop + outSpacing * (idx + 1),
          direction: 'output',
          width: getEffectivePortWidth(modDef, p, inst),
          name: p.name,
          type: p.type,
          description: p.description
        });
      });

      const inoutSpacing = w / (inoutPorts.length + 1);
      inoutPorts.forEach((p, idx) => {
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x + inoutSpacing * (idx + 1),
          y: inst.position.y + h,
          direction: 'inout',
          width: getEffectivePortWidth(modDef, p, inst),
          name: p.name,
          type: p.type,
          description: p.description
        });
      });
    }
    return ports;
  }

  private buildPortMap(): Map<string, PortPosition> {
    const map = new Map<string, PortPosition>();
    for (const p of this.getAllPortPositions()) {
      map.set(`${p.instanceId}:${p.portId}`, p);
    }
    return map;
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

  private findHitWire(world: Point): RenderedWire | null {
    const threshold = Math.max(7, 8 / this.transform.scale);
    for (let i = this.renderedWires.length - 1; i >= 0; i--) {
      const wire = this.renderedWires[i];
      for (let s = 0; s < wire.points.length - 1; s++) {
        const a = wire.points[s];
        const b = wire.points[s + 1];
        if (distPointToSegment(world.x, world.y, a.x, a.y, b.x, b.y) <= threshold) {
          return wire;
        }
      }
    }
    return null;
  }

  private setupEvents(): void {
    let hasMoved = false;

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      this.zoomAt(e.offsetX, e.offsetY, zoomFactor);
    }, { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      hasMoved = false;

      // 1. Port pin wiring (works in Select mode)
      if (!this.spacePressed && this.toolMode !== 'pan' && e.button === 0) {
        const allPorts = this.getAllPortPositions();
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

      // 2. Panning via middle-click, Alt, Space, or Pan tool mode
      if (e.button === 1 || e.altKey || this.spacePressed || this.toolMode === 'pan') {
        this.isPanning = true;
        this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
        this.updateCursor();
        return;
      }

      // 3. Instance block selection & drag
      const clickedInst = [...this.design.instances].reverse().find(inst => {
        const modDef = getModuleDef(inst.moduleId);
        const { w, h } = this.getInstanceDimensions(modDef, inst);
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
        this.dragOffset = {
          x: world.x - clickedInst.position.x,
          y: world.y - clickedInst.position.y
        };
        this.notifySelection();
        this.render();
        return;
      }

      // 4. Wire selection
      const hitWire = this.findHitWire(world);
      if (hitWire) {
        this.selectedNetId = hitWire.net.id;
        this.selectedInstanceId = null;
        this.notifySelection();
        this.render();
        return;
      }

      // 5. Empty canvas: Deselect & pan
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
        const allPorts = this.getAllPortPositions();
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
          inst.position.x = this.gridSnap ? Math.round(rawX / GRID_SIZE) * GRID_SIZE : Math.round(rawX);
          inst.position.y = this.gridSnap ? Math.round(rawY / GRID_SIZE) * GRID_SIZE : Math.round(rawY);
          this.render();
        }
        return;
      }

      // Hover detection only when mouse is inside canvas
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

      const allPorts = this.getAllPortPositions();
      const portRadius = Math.max(10, 11 / this.transform.scale);
      const port = allPorts.find(p => Math.hypot(p.x - world.x, p.y - world.y) <= portRadius) || null;

      let instHover: string | null = null;
      let netHover: string | null = null;

      if (!port) {
        const hitInst = [...this.design.instances].reverse().find(inst => {
          const modDef = getModuleDef(inst.moduleId);
          const { w, h } = this.getInstanceDimensions(modDef, inst);
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
          const hitWire = this.findHitWire(world);
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
        if (hasMoved) {
          this.notifyChange();
        }
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

  public render(): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    if (w <= 0 || h <= 0) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background Canvas (Material 3 Lowest Surface)
    ctx.fillStyle = '#0e1117';
    ctx.fillRect(0, 0, w, h);

    // Apply Viewport Transform
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);

    // Draw Subtle Infinite Dot Grid (minor + major ticks)
    this.drawGrid(ctx, w, h);

    // Draw Wires & Bus Badges
    this.drawNets(ctx);

    // Draw Wire In-Progress
    if (this.wiringSource) {
      this.drawRubberBandWire(ctx, this.wiringSource, this.wiringCurrent, this.hoveredPort);
    }

    // Draw Module Blocks
    this.drawInstances(ctx);

    ctx.restore();

    // Draw Screen-Space Hover Tooltip (crisp regardless of zoom)
    this.drawOverlayTooltip(ctx, w, h, dpr);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, screenW: number, screenH: number): void {
    const start = this.screenToWorld(0, 0);
    const end = this.screenToWorld(screenW, screenH);

    // Skip minor dots when zoomed far out so canvas stays crisp & fast
    const showMinor = this.transform.scale >= 0.45;
    const step = showMinor ? GRID_SIZE : GRID_SIZE * 5;
    const minX = Math.floor(start.x / step) * step;
    const maxX = Math.ceil(end.x / step) * step;
    const minY = Math.floor(start.y / step) * step;
    const maxY = Math.ceil(end.y / step) * step;

    for (let x = minX; x <= maxX; x += step) {
      for (let y = minY; y <= maxY; y += step) {
        const isMajor = x % 100 === 0 && y % 100 === 0;
        ctx.fillStyle = isMajor ? '#303746' : '#1d222d';
        const size = isMajor ? 2.5 : 1.5;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
  }

  private getDrcLookups() {
    const errorInst = new Set<string>();
    const warnInst = new Set<string>();
    const errorNet = new Set<string>();
    const warnNet = new Set<string>();
    const errorPorts = new Set<string>();
    const warnPorts = new Set<string>();

    for (const d of this.diagnostics) {
      if (d.severity === 'error') {
        if (d.instanceId) errorInst.add(d.instanceId);
        if (d.netId) errorNet.add(d.netId);
        if (d.instanceId && d.portId) errorPorts.add(`${d.instanceId}:${d.portId}`);
      } else if (d.severity === 'warning') {
        if (d.instanceId) warnInst.add(d.instanceId);
        if (d.netId) warnNet.add(d.netId);
        if (d.instanceId && d.portId) warnPorts.add(`${d.instanceId}:${d.portId}`);
      }
    }
    return { errorInst, warnInst, errorNet, warnNet, errorPorts, warnPorts };
  }

  private getInstanceBoxes(): Map<string, Box> {
    const map = new Map<string, Box>();
    for (const inst of this.design.instances) {
      const modDef = getModuleDef(inst.moduleId);
      const { w, h } = this.getInstanceDimensions(modDef, inst);
      map.set(inst.id, { x: inst.position.x, y: inst.position.y, w, h });
    }
    return map;
  }

  private drawNets(ctx: CanvasRenderingContext2D): void {
    const portMap = this.buildPortMap();
    const boxMap = this.getInstanceBoxes();
    const drc = this.getDrcLookups();

    this.renderedWires = [];
    const placedPills: Box[] = [];

    // Group wire segments by source-target instance pair to stagger vertical channels cleanly
    const pairCounters = new Map<string, number>();
    const pairTotals = new Map<string, number>();

    for (const net of this.design.nets) {
      if (!net.source) continue;
      for (const tgt of net.targets) {
        const key = `${net.source.instanceId}->${tgt.instanceId}`;
        pairTotals.set(key, (pairTotals.get(key) || 0) + 1);
      }
    }

    // Draw non-selected wires first, selected/hovered on top
    const orderedNets = [...this.design.nets].sort((a, b) => {
      const aActive = a.id === this.selectedNetId || a.id === this.hoveredNetId ? 1 : 0;
      const bActive = b.id === this.selectedNetId || b.id === this.hoveredNetId ? 1 : 0;
      return aActive - bActive;
    });

    for (const net of orderedNets) {
      const srcPos = net.source ? portMap.get(`${net.source.instanceId}:${net.source.portId}`) : null;
      if (!srcPos) continue;

      const isSelected = this.selectedNetId === net.id;
      const isHovered = this.hoveredNetId === net.id;
      const hasError = drc.errorNet.has(net.id);
      const hasWarn = drc.warnNet.has(net.id);
      const isBus = net.width > 1;
      const isClockOrReset = srcPos.type === 'clock' || srcPos.type === 'reset';

      for (const tgt of net.targets) {
        const tgtPos = portMap.get(`${tgt.instanceId}:${tgt.portId}`);
        if (!tgtPos) continue;

        const key = `${srcPos.instanceId}->${tgtPos.instanceId}`;
        const laneIdx = pairCounters.get(key) || 0;
        pairCounters.set(key, laneIdx + 1);
        const totalLanes = pairTotals.get(key) || 1;

        const srcBox = boxMap.get(srcPos.instanceId);
        const tgtBox = boxMap.get(tgtPos.instanceId);
        const points = this.computeWirePoints(srcPos, tgtPos, laneIdx, totalLanes, srcBox, tgtBox);

        this.renderedWires.push({ net, points, src: srcPos, tgt: tgtPos });

        this.drawOrthogonalWire(
          ctx,
          points,
          srcPos,
          isBus,
          isClockOrReset,
          isSelected,
          isHovered,
          hasError,
          hasWarn,
          net.width,
          placedPills
        );
      }
    }
  }

  private computeWirePoints(
    src: PortPosition,
    tgt: PortPosition,
    laneIdx: number,
    totalLanes: number,
    srcBox?: Box,
    tgtBox?: Box
  ): Point[] {
    const laneShift = (laneIdx - (totalLanes - 1) / 2) * 14;

    // Handle inout ports on bottom edge cleanly
    if (src.direction === 'inout' || tgt.direction === 'inout') {
      const dropY = Math.max(src.y, tgt.y) + 28 + laneIdx * 10;
      return [
        { x: src.x, y: src.y },
        { x: src.x, y: dropY },
        { x: tgt.x, y: dropY },
        { x: tgt.x, y: tgt.y }
      ];
    }

    // Forward routing: target is cleanly to the right of source
    if (tgt.x >= src.x + 32) {
      const rawMid = (src.x + tgt.x) / 2 + laneShift;
      const midX = Math.max(src.x + 16, Math.min(tgt.x - 16, rawMid));
      return [
        { x: src.x, y: src.y },
        { x: midX, y: src.y },
        { x: midX, y: tgt.y },
        { x: tgt.x, y: tgt.y }
      ];
    }

    // Backward / feedback routing: loop cleanly outside block bounds instead of crossing inside blocks
    const stubOut = 22 + (laneIdx % 4) * 10;
    const stubIn = 22 + (laneIdx % 4) * 10;
    const exitX = src.x + stubOut;
    const entryX = tgt.x - stubIn;

    const topBound = Math.min(srcBox ? srcBox.y : src.y, tgtBox ? tgtBox.y : tgt.y);
    const botBound = Math.max(srcBox ? srcBox.y + srcBox.h : src.y, tgtBox ? tgtBox.y + tgtBox.h : tgt.y);

    const avgY = (src.y + tgt.y) / 2;
    const goAbove = Math.abs(avgY - topBound) <= Math.abs(botBound - avgY);
    const detourY = goAbove
      ? topBound - 24 - laneIdx * 12
      : botBound + 24 + laneIdx * 12;

    return [
      { x: src.x, y: src.y },
      { x: exitX, y: src.y },
      { x: exitX, y: detourY },
      { x: entryX, y: detourY },
      { x: entryX, y: tgt.y },
      { x: tgt.x, y: tgt.y }
    ];
  }

  private drawOrthogonalWire(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    src: PortPosition,
    isBus: boolean,
    isClockOrReset: boolean,
    isSelected: boolean,
    isHovered: boolean,
    hasError: boolean,
    hasWarn: boolean,
    width: number,
    placedPills: Box[]
  ): void {
    ctx.save();

    // Base stroke color & hierarchy
    let strokeColor = isBus ? '#7fcfff' : '#8e919a';
    if (src.type === 'clock') strokeColor = '#b49df2';
    else if (src.type === 'reset') strokeColor = '#e3b341';

    if (hasError) strokeColor = '#f2b8b5';
    else if (hasWarn) strokeColor = '#fbc02d';
    if (isHovered) strokeColor = '#d3e3fd';
    if (isSelected) strokeColor = '#a8c7fa';

    // Subtle transparency on fan-out clock/reset lines unless highlighted so data buses stay prominent
    if (isClockOrReset && !isSelected && !isHovered && !hasError) {
      ctx.globalAlpha = 0.65;
      ctx.setLineDash([5, 4]);
    }

    if (isSelected || isHovered || hasError) {
      ctx.shadowColor = hasError ? '#f2b8b5' : '#a8c7fa';
      ctx.shadowBlur = isSelected ? 12 : 8;
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSelected || isHovered ? (isBus ? 4.2 : 2.8) : (isBus ? 3 : 1.75);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.traceRoundedPolyline(ctx, points, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Bus slash & collision-free bit-width pill
    if (isBus && points.length >= 4) {
      // Pick the middle segment for badge placement
      const segIdx = points.length === 4 ? 1 : 2;
      const pA = points[segIdx];
      const pB = points[segIdx + 1];
      let anchorX = (pA.x + pB.x) / 2;
      let anchorY = (pA.y + pB.y) / 2;

      const widthLabel = `[${width - 1}:0]`;
      ctx.font = '600 9px "Roboto Mono", monospace';
      const textWidth = ctx.measureText(widthLabel).width;
      const pillW = textWidth + 10;
      const pillH = 15;

      // Avoid overlapping previously placed bus pills
      let pillX = anchorX - pillW / 2;
      let pillY = anchorY - pillH / 2;
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate: Box = { x: pillX, y: pillY, w: pillW, h: pillH };
        const collides = placedPills.some(b => boxesOverlap(b, candidate, 3));
        if (!collides) break;
        const dir = attempt % 2 === 0 ? 1 : -1;
        const step = Math.ceil((attempt + 1) / 2) * 18;
        pillY = anchorY - pillH / 2 + dir * step;
      }
      placedPills.push({ x: pillX, y: pillY, w: pillW, h: pillH });

      ctx.fillStyle = hasError ? '#8c1d18' : isSelected ? '#0b57d0' : '#0b2c5e';
      ctx.strokeStyle = hasError ? '#f2b8b5' : isSelected ? '#d3e3fd' : '#7fcfff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = hasError ? '#f9dedc' : '#e3f2fd';
      ctx.textAlign = 'center';
      ctx.fillText(widthLabel, pillX + pillW / 2, pillY + 10.5);
    }

    ctx.restore();
  }

  private traceRoundedPolyline(ctx: CanvasRenderingContext2D, points: Point[], radius: number): void {
    if (points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (typeof ctx.quadraticCurveTo !== 'function' || points.length < 3) {
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      return;
    }

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
      const r = Math.min(radius, d1 / 2, d2 / 2);

      if (r < 1) {
        ctx.lineTo(curr.x, curr.y);
        continue;
      }

      const ux1 = (curr.x - prev.x) / d1;
      const uy1 = (curr.y - prev.y) / d1;
      const ux2 = (next.x - curr.x) / d2;
      const uy2 = (next.y - curr.y) / d2;

      ctx.lineTo(curr.x - ux1 * r, curr.y - uy1 * r);
      ctx.quadraticCurveTo(curr.x, curr.y, curr.x + ux2 * r, curr.y + uy2 * r);
    }

    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  private drawRubberBandWire(
    ctx: CanvasRenderingContext2D,
    src: PortPosition,
    current: Point,
    targetPort: PortPosition | null
  ): void {
    const end = targetPort ? { x: targetPort.x, y: targetPort.y } : current;
    const midX = (src.x + end.x) / 2;
    const pts = [
      { x: src.x, y: src.y },
      { x: midX, y: src.y },
      { x: midX, y: end.y },
      end
    ];

    ctx.save();
    let color = '#a8c7fa';
    if (targetPort) {
      color = targetPort.width === src.width ? '#6dd58c' : '#f2b8b5';
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    this.traceRoundedPolyline(ctx, pts, 6);
    ctx.stroke();

    // Target snap ring
    if (targetPort) {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(targetPort.x, targetPort.y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawInstances(ctx: CanvasRenderingContext2D): void {
    const drc = this.getDrcLookups();

    for (const inst of this.design.instances) {
      const modDef = getModuleDef(inst.moduleId);
      const isSelected = this.selectedInstanceId === inst.id;
      const isHovered = this.hoveredInstanceId === inst.id;
      const hasErr = drc.errorInst.has(inst.id);
      const hasWarn = drc.warnInst.has(inst.id);
      const { w, h } = this.getInstanceDimensions(modDef, inst);

      ctx.save();

      // Card shadow & selection halo
      if (isSelected) {
        ctx.shadowColor = 'rgba(168, 199, 250, 0.45)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 2;
      } else if (hasErr) {
        ctx.shadowColor = 'rgba(242, 184, 181, 0.35)';
        ctx.shadowBlur = 14;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
      }

      // Card Body
      ctx.fillStyle = isSelected ? '#1d222e' : isHovered ? '#1c202a' : '#171a23';
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, h, 12);
      ctx.fill();

      // Card Border
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = isSelected
        ? '#a8c7fa'
        : hasErr
          ? '#f2b8b5'
          : hasWarn
            ? '#fbc02d'
            : isHovered
              ? '#5a6070'
              : '#2b3140';
      ctx.lineWidth = isSelected || hasErr ? 2 : 1.25;
      ctx.stroke();

      // Header Bar with Category Color
      ctx.fillStyle = this.getCategoryColor(modDef?.category || 'infrastructure');
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, HEADER_HEIGHT, [12, 12, 0, 0]);
      ctx.fill();

      // Category Pill in header (measure first so title truncates cleanly)
      let catW = 0;
      if (modDef?.category) {
        const catText = modDef.category.toUpperCase();
        ctx.font = '700 8px "Google Sans", "Roboto", sans-serif';
        catW = ctx.measureText(catText).width + 12;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.beginPath();
        ctx.roundRect(inst.position.x + w - catW - 10, inst.position.y + 9, catW, 16, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(catText, inst.position.x + w - 10 - catW / 2, inst.position.y + 20);
      }

      // Header Instance Title (truncated safely if needed)
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = '700 13px "Google Sans", "Roboto", sans-serif';
      const maxTitleW = w - catW - 30;
      const titleText = truncateText(ctx, inst.name, maxTitleW);
      ctx.fillText(titleText, inst.position.x + 12, inst.position.y + 22);

      // Dedicated Subtitle Band below Header (never collides with ports!)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.fillRect(inst.position.x + 1, inst.position.y + HEADER_HEIGHT, w - 2, SUBTITLE_HEIGHT);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(inst.position.x + 1, inst.position.y + TOP_RESERVED);
      ctx.lineTo(inst.position.x + w - 1, inst.position.y + TOP_RESERVED);
      ctx.stroke();

      ctx.fillStyle = '#9aa0ae';
      ctx.font = '500 10px "Roboto Mono", monospace';
      const subText = truncateText(ctx, modDef?.name || inst.moduleId, w - 24);
      ctx.fillText(subText, inst.position.x + 12, inst.position.y + HEADER_HEIGHT + 14);

      // Draw DRC status badge on top-right corner if instance has error or warning
      if (hasErr || hasWarn) {
        const badgeX = inst.position.x + w - 4;
        const badgeY = inst.position.y - 2;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 8, 0, Math.PI * 2);
        ctx.fillStyle = hasErr ? '#f2b8b5' : '#fbc02d';
        ctx.fill();
        ctx.fillStyle = hasErr ? '#601410' : '#412d00';
        ctx.font = '700 10px "Google Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', badgeX, badgeY + 3.5);
      }

      // Draw Port Pins & Labels inside reserved port area
      if (modDef) {
        const inputPorts = modDef.ports.filter(p => p.direction === 'input');
        const outputPorts = modDef.ports.filter(p => p.direction === 'output');
        const inoutPorts = modDef.ports.filter(p => p.direction === 'inout');

        const portAreaTop = inst.position.y + TOP_RESERVED + 6;
        const portAreaBottom = inst.position.y + h - (inoutPorts.length > 0 ? 24 : 10);
        const portAreaH = Math.max(24, portAreaBottom - portAreaTop);

        const inSpacing = portAreaH / (inputPorts.length + 1);
        inputPorts.forEach((p, idx) => {
          const ew = getEffectivePortWidth(modDef, p, inst);
          const px = inst.position.x;
          const py = portAreaTop + inSpacing * (idx + 1);
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(ctx, inst.id, px, py, p, ew, 'left', drc.errorPorts.has(portKey), drc.warnPorts.has(portKey));
        });

        const outSpacing = portAreaH / (outputPorts.length + 1);
        outputPorts.forEach((p, idx) => {
          const ew = getEffectivePortWidth(modDef, p, inst);
          const px = inst.position.x + w;
          const py = portAreaTop + outSpacing * (idx + 1);
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(ctx, inst.id, px, py, p, ew, 'right', drc.errorPorts.has(portKey), drc.warnPorts.has(portKey));
        });

        const inoutSpacing = w / (inoutPorts.length + 1);
        inoutPorts.forEach((p, idx) => {
          const ew = getEffectivePortWidth(modDef, p, inst);
          const px = inst.position.x + inoutSpacing * (idx + 1);
          const py = inst.position.y + h;
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(ctx, inst.id, px, py, p, ew, 'bottom', drc.errorPorts.has(portKey), drc.warnPorts.has(portKey));
        });
      }

      ctx.restore();
    }
  }

  private drawPortPin(
    ctx: CanvasRenderingContext2D,
    instanceId: string,
    x: number,
    y: number,
    port: KonaPortDef,
    width: number,
    align: 'left' | 'right' | 'bottom',
    hasError: boolean,
    hasWarn: boolean
  ): void {
    const isBus = width > 1;
    const isHovered = this.hoveredPort?.instanceId === instanceId && this.hoveredPort?.portId === port.id;
    const isWireTargetCompatible =
      this.wiringSource &&
      this.wiringSource.instanceId !== instanceId &&
      isHovered &&
      this.wiringSource.width === width;

    // Pin Halo on hover / DRC warning
    if (isHovered || hasError || hasWarn) {
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = hasError
        ? 'rgba(242, 184, 181, 0.3)'
        : hasWarn
          ? 'rgba(251, 192, 45, 0.25)'
          : isWireTargetCompatible
            ? 'rgba(109, 213, 140, 0.35)'
            : 'rgba(168, 199, 250, 0.28)';
      ctx.fill();
    }

    // Pin Circle
    ctx.beginPath();
    ctx.arc(x, y, isHovered ? 5.5 : isBus ? 4.8 : 4, 0, Math.PI * 2);
    ctx.fillStyle = this.getPortTypeColor(port.type);
    ctx.fill();
    ctx.strokeStyle = hasError ? '#f2b8b5' : hasWarn ? '#fbc02d' : '#ffffff';
    ctx.lineWidth = isBus || isHovered ? 1.6 : 1.1;
    ctx.stroke();

    // Port Label (split name + width suffix for scannable hierarchy)
    const widthSuffix = isBus ? `[${width - 1}:0]` : '';
    ctx.font = '500 11px "Roboto Mono", monospace';

    if (align === 'left') {
      ctx.textAlign = 'left';
      ctx.fillStyle = isHovered ? '#ffffff' : '#d2d5df';
      ctx.fillText(port.name, x + 9, y + 3.5);
      if (widthSuffix) {
        const nameW = ctx.measureText(port.name).width;
        ctx.fillStyle = '#7fcfff';
        ctx.font = '500 10px "Roboto Mono", monospace';
        ctx.fillText(widthSuffix, x + 9 + nameW + 2, y + 3.5);
      }
    } else if (align === 'right') {
      ctx.textAlign = 'right';
      if (widthSuffix) {
        ctx.font = '500 10px "Roboto Mono", monospace';
        const suffixW = ctx.measureText(widthSuffix).width;
        ctx.fillStyle = '#7fcfff';
        ctx.fillText(widthSuffix, x - 9, y + 3.5);
        ctx.font = '500 11px "Roboto Mono", monospace';
        ctx.fillStyle = isHovered ? '#ffffff' : '#d2d5df';
        ctx.fillText(port.name, x - 9 - suffixW - 2, y + 3.5);
      } else {
        ctx.fillStyle = isHovered ? '#ffffff' : '#d2d5df';
        ctx.fillText(port.name, x - 9, y + 3.5);
      }
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = isHovered ? '#ffffff' : '#d2d5df';
      ctx.fillText(widthSuffix ? `${port.name}${widthSuffix}` : port.name, x, y - 9);
    }
  }

  private drawOverlayTooltip(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, dpr: number): void {
    let title = '';
    let sub = '';
    let accent = '#a8c7fa';

    if (this.wiringSource && this.hoveredPort) {
      const compat = this.wiringSource.width === this.hoveredPort.width;
      title = compat
        ? `Connect ${this.wiringSource.name} → ${this.hoveredPort.name}`
        : `Width Mismatch: [${this.wiringSource.width - 1}:0] ≠ [${this.hoveredPort.width - 1}:0]`;
      sub = compat ? `${this.hoveredPort.width}-bit ${this.hoveredPort.type}` : 'DRC will flag width mismatch';
      accent = compat ? '#6dd58c' : '#f2b8b5';
    } else if (this.hoveredPort) {
      const p = this.hoveredPort;
      title = `${p.name}${p.width > 1 ? ` [${p.width - 1}:0]` : ' (1-bit)'}`;
      sub = `${p.direction.toUpperCase()} • ${p.type}${p.description ? ` — ${p.description}` : ''}`;
      accent = this.getPortTypeColor(p.type);
    } else if (this.hoveredNetId && !this.draggingInstanceId && !this.isPanning) {
      const net = this.design.nets.find(n => n.id === this.hoveredNetId);
      if (net) {
        title = `${net.name} ${net.width > 1 ? `[${net.width - 1}:0]` : '(1-bit)'}`;
        sub = `Click to inspect or Delete to remove`;
        accent = '#7fcfff';
      }
    }

    if (!title) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.font = '600 11.5px "Google Sans", "Roboto", sans-serif';
    const titleW = ctx.measureText(title).width;
    ctx.font = '400 10.5px "Roboto", sans-serif';
    const subW = ctx.measureText(sub).width;

    const boxW = Math.min(340, Math.max(titleW, subW) + 28);
    const boxH = 44;

    let tx = this.mouseScreen.x + 14;
    let ty = this.mouseScreen.y + 16;
    if (tx + boxW > viewW - 12) tx = Math.max(12, this.mouseScreen.x - boxW - 12);
    if (ty + boxH > viewH - 12) ty = Math.max(12, this.mouseScreen.y - boxH - 12);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(26, 29, 38, 0.96)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tx, ty, boxW, boxH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Accent bar
    ctx.fillStyle = accent;
    ctx.fillRect(tx + 1, ty + 8, 3, boxH - 16);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e2e9';
    ctx.font = '600 11.5px "Google Sans", "Roboto", sans-serif';
    ctx.fillText(truncateText(ctx, title, boxW - 20), tx + 12, ty + 18);

    ctx.fillStyle = '#9aa0ae';
    ctx.font = '400 10.5px "Roboto", sans-serif';
    ctx.fillText(truncateText(ctx, sub, boxW - 20), tx + 12, ty + 34);

    ctx.restore();
  }

  private getCategoryColor(category: string): string {
    switch (category) {
      case 'processor': return '#0842a0';
      case 'interconnect': return '#4f378b';
      case 'memory': return '#6e1914';
      case 'peripheral': return '#004d67';
      case 'infrastructure': return '#0a5223';
      default: return '#272c38';
    }
  }

  private getPortTypeColor(type: string): string {
    switch (type) {
      case 'clock': return '#d0bcff';
      case 'reset': return '#fbc02d';
      case 'bus': return '#7fcfff';
      case 'data': return '#6dd58c';
      default: return '#8e919a';
    }
  }
}

function distPointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function boxesOverlap(a: Box, b: Box, pad = 0): boolean {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (maxWidth <= 20) return text;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '…';
}
