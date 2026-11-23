/**
 * Infinite 2D Schematic Canvas & Orthogonal Wire Auto-Router (FR-1.1)
 *
 * Provides 60 FPS pan/zoom, grid snapping, multi-select, port pins,
 * and Manhattan orthogonal wire auto-routing.
 */

import {
  KonaDesign,
  KonaModuleInstance,
  KonaNet,
  KonaPortDef,
  KonaPortRef
} from '../../../packages/core/dist/ir.js';
import { getModuleDef } from '../../../packages/core/dist/catalog.js';
import { getEffectivePortWidth } from '../../../packages/core/dist/drc.js';

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
}

export class SchematicCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private design: KonaDesign;
  private transform: ViewportTransform = { x: 40, y: 40, scale: 1.0 };
  private selectedInstanceId: string | null = null;
  private selectedNetId: string | null = null;
  private draggingInstanceId: string | null = null;
  private dragOffset = { x: 0, y: 0 };
  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  private wiringSource: PortPosition | null = null;
  private wiringCurrent = { x: 0, y: 0 };
  private hoveredPort: PortPosition | null = null;

  private onSelectCallback?: (instance: KonaModuleInstance | null) => void;
  private onChangeCallback?: (design: KonaDesign) => void;

  constructor(canvas: HTMLCanvasElement, initialDesign: KonaDesign) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.design = initialDesign;

    this.setupEvents();
    this.resize();
    this.render();
  }

  public setDesign(newDesign: KonaDesign): void {
    this.design = newDesign;
    this.selectedInstanceId = null;
    this.selectedNetId = null;
    this.render();
    if (this.onSelectCallback) this.onSelectCallback(null);
  }

  public getDesign(): KonaDesign {
    return this.design;
  }

  public onSelectionChange(cb: (instance: KonaModuleInstance | null) => void): void {
    this.onSelectCallback = cb;
  }

  public onDesignChange(cb: (design: KonaDesign) => void): void {
    this.onChangeCallback = cb;
  }

  public resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.resetTransform?.();
    this.render();
  }

  private updateZoomLabel(): void {
    const label = document.getElementById('btn-zoom-reset');
    if (label) {
      label.textContent = `${Math.round(this.transform.scale * 100)}%`;
    }
  }

  public zoomIn(): void {
    this.transform.scale = Math.min(3.0, this.transform.scale * 1.2);
    this.updateZoomLabel();
    this.render();
  }

  public zoomOut(): void {
    this.transform.scale = Math.max(0.3, this.transform.scale / 1.2);
    this.updateZoomLabel();
    this.render();
  }

  public resetZoom(): void {
    this.transform = { x: 60, y: 60, scale: 1.0 };
    this.updateZoomLabel();
    this.render();
  }

  public deleteSelected(): void {
    if (this.selectedInstanceId) {
      const id = this.selectedInstanceId;
      this.design.instances = this.design.instances.filter(i => i.id !== id);
      // Clean up connected nets
      this.design.nets = this.design.nets.filter(n => {
        if (n.source?.instanceId === id) return false;
        n.targets = n.targets.filter(t => t.instanceId !== id);
        return true;
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
    }
  }

  public addModule(moduleId: string, name?: string): KonaModuleInstance {
    const modDef = getModuleDef(moduleId);
    const count = this.design.instances.filter(i => i.moduleId === moduleId).length + 1;
    const instName = name || `u_${moduleId}_${count}`;
    const id = `${moduleId}_${Date.now()}`;

    // Place in center of current viewport
    const viewCenterX = (-this.transform.x + this.canvas.clientWidth / 2) / this.transform.scale;
    const viewCenterY = (-this.transform.y + this.canvas.clientHeight / 2) / this.transform.scale;

    const defaultParams: Record<string, number | string | boolean> = {};
    if (modDef) {
      for (const p of modDef.parameters) {
        defaultParams[p.name] = p.default;
      }
    }

    const newInst: KonaModuleInstance = {
      id,
      moduleId,
      name: instName,
      position: {
        x: Math.round(viewCenterX / 20) * 20 - 100,
        y: Math.round(viewCenterY / 20) * 20 - 80
      },
      parameters: defaultParams
    };

    this.design.instances.push(newInst);
    this.selectedInstanceId = newInst.id;
    this.render();
    this.notifyChange();
    this.notifySelection();
    return newInst;
  }

  private notifyChange(): void {
    this.design.metadata.modified = new Date().toISOString();
    if (this.onChangeCallback) {
      this.onChangeCallback(this.design);
    }
  }

  private notifySelection(): void {
    if (this.onSelectCallback) {
      const inst = this.design.instances.find(i => i.id === this.selectedInstanceId) || null;
      this.onSelectCallback(inst);
    }
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.transform.x) / this.transform.scale,
      y: (sy - this.transform.y) / this.transform.scale
    };
  }

  private getAllPortPositions(): PortPosition[] {
    const ports: PortPosition[] = [];
    for (const inst of this.design.instances) {
      const modDef = getModuleDef(inst.moduleId);
      if (!modDef) continue;

      const width = modDef.defaultWidth || 200;
      const height = modDef.defaultHeight || 200;

      const inputPorts = modDef.ports.filter(p => p.direction === 'input');
      const outputPorts = modDef.ports.filter(p => p.direction === 'output');
      const inoutPorts = modDef.ports.filter(p => p.direction === 'inout');

      // Distribute inputs along left edge
      const inSpacing = height / (inputPorts.length + 1);
      inputPorts.forEach((p, idx) => {
        const effectiveWidth = getEffectivePortWidth(modDef, p, inst);
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x,
          y: inst.position.y + inSpacing * (idx + 1),
          direction: 'input',
          width: effectiveWidth,
          name: p.name,
          type: p.type
        });
      });

      // Distribute outputs along right edge
      const outSpacing = height / (outputPorts.length + 1);
      outputPorts.forEach((p, idx) => {
        const effectiveWidth = getEffectivePortWidth(modDef, p, inst);
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x + width,
          y: inst.position.y + outSpacing * (idx + 1),
          direction: 'output',
          width: effectiveWidth,
          name: p.name,
          type: p.type
        });
      });

      // Distribute inouts along bottom edge
      const inoutSpacing = width / (inoutPorts.length + 1);
      inoutPorts.forEach((p, idx) => {
        const effectiveWidth = getEffectivePortWidth(modDef, p, inst);
        ports.push({
          instanceId: inst.id,
          portId: p.id,
          x: inst.position.x + inoutSpacing * (idx + 1),
          y: inst.position.y + height,
          direction: 'inout',
          width: effectiveWidth,
          name: p.name,
          type: p.type
        });
      });
    }
    return ports;
  }

  private setupEvents(): void {
    let hasMoved = false;

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const mouse = { x: e.offsetX, y: e.offsetY };

      const newScale = Math.max(0.2, Math.min(3.0, this.transform.scale * zoomFactor));
      this.transform.x = mouse.x - (mouse.x - this.transform.x) * (newScale / this.transform.scale);
      this.transform.y = mouse.y - (mouse.y - this.transform.y) * (newScale / this.transform.scale);
      this.transform.scale = newScale;
      this.updateZoomLabel();
      this.render();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const world = this.screenToWorld(e.offsetX, e.offsetY);
      hasMoved = false;

      // 1. Check if clicking on a Port Pin
      const allPorts = this.getAllPortPositions();
      const clickedPort = allPorts.find(p => {
        const dist = Math.hypot(p.x - world.x, p.y - world.y);
        return dist <= 10;
      });

      if (clickedPort) {
        // Start wiring from this port
        this.wiringSource = clickedPort;
        this.wiringCurrent = { x: world.x, y: world.y };
        this.render();
        return;
      }

      // 2. Middle-click or Alt-click or Space-click for pan
      if (e.button === 1 || e.altKey || e.shiftKey) {
        this.isPanning = true;
        this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
        return;
      }

      // 3. Check if clicking on an Instance block
      const clickedInst = [...this.design.instances].reverse().find(inst => {
        const modDef = getModuleDef(inst.moduleId);
        const w = modDef?.defaultWidth || 200;
        const h = modDef?.defaultHeight || 200;
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

      // 4. Clicking empty canvas: Deselect & start pan
      this.selectedInstanceId = null;
      this.selectedNetId = null;
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
      this.notifySelection();
      this.render();
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const world = this.screenToWorld(mouseX, mouseY);

      // Handle Panning
      if (this.isPanning) {
        this.transform.x = e.clientX - this.panStart.x;
        this.transform.y = e.clientY - this.panStart.y;
        this.render();
        return;
      }

      // Handle Wire Dragging
      if (this.wiringSource) {
        this.wiringCurrent = { x: world.x, y: world.y };

        // Check hover over possible destination port
        const allPorts = this.getAllPortPositions();
        this.hoveredPort = allPorts.find(p => {
          if (p.instanceId === this.wiringSource!.instanceId) return false;
          const dist = Math.hypot(p.x - world.x, p.y - world.y);
          return dist <= 12;
        }) || null;

        this.render();
        return;
      }

      // Handle Block Dragging
      if (this.draggingInstanceId) {
        hasMoved = true;
        const inst = this.design.instances.find(i => i.id === this.draggingInstanceId);
        if (inst) {
          // Snap to 20px grid
          const rawX = world.x - this.dragOffset.x;
          const rawY = world.y - this.dragOffset.y;
          inst.position.x = Math.round(rawX / 20) * 20;
          inst.position.y = Math.round(rawY / 20) * 20;
          this.render();
        }
        return;
      }

      // Port hover detection for cursor styling
      const allPorts = this.getAllPortPositions();
      const port = allPorts.find(p => Math.hypot(p.x - world.x, p.y - world.y) <= 10);
      if (port !== this.hoveredPort) {
        this.hoveredPort = port || null;
        this.canvas.style.cursor = port ? 'crosshair' : 'default';
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
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
        this.render();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
        this.deleteSelected();
      }
    });
  }

  private completeConnection(src: PortPosition, dst: PortPosition): void {
    let outputPort = src.direction === 'output' ? src : (dst.direction === 'output' ? dst : src);
    let inputPort = src.direction === 'input' ? src : (dst.direction === 'input' ? dst : dst);

    // Look for existing net driven by outputPort
    let existingNet = this.design.nets.find(n =>
      n.source?.instanceId === outputPort.instanceId && n.source?.portId === outputPort.portId
    );

    if (existingNet) {
      // Connect inputPort if not already attached
      const alreadyConnected = existingNet.targets.some(
        t => t.instanceId === inputPort.instanceId && t.portId === inputPort.portId
      );
      if (!alreadyConnected) {
        existingNet.targets.push({ instanceId: inputPort.instanceId, portId: inputPort.portId });
      }
    } else {
      // Create new net
      const netName = `net_${outputPort.name}_to_${inputPort.name}_${this.design.nets.length + 1}`;
      const newNet: KonaNet = {
        id: `net_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: netName,
        width: outputPort.width || inputPort.width || 1,
        source: { instanceId: outputPort.instanceId, portId: outputPort.portId },
        targets: [{ instanceId: inputPort.instanceId, portId: inputPort.portId }]
      };
      this.design.nets.push(newNet);
    }

    this.notifyChange();
    this.render();
  }

  public render(): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background Canvas (Material 3 Surface)
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, w, h);

    // Apply Viewport Transform
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);

    // Draw Subtle Infinite Dot Grid
    this.drawGrid(ctx, w, h);

    // Draw Wires
    this.drawNets(ctx);

    // Draw Wire In-Progress
    if (this.wiringSource) {
      this.drawRubberBandWire(ctx, this.wiringSource, this.wiringCurrent, this.hoveredPort);
    }

    // Draw Module Blocks
    this.drawInstances(ctx);

    ctx.restore();
  }

  private drawGrid(ctx: CanvasRenderingContext2D, screenW: number, screenH: number): void {
    const gridSize = 20;
    const start = this.screenToWorld(0, 0);
    const end = this.screenToWorld(screenW, screenH);

    const minX = Math.floor(start.x / gridSize) * gridSize;
    const maxX = Math.ceil(end.x / gridSize) * gridSize;
    const minY = Math.floor(start.y / gridSize) * gridSize;
    const maxY = Math.ceil(end.y / gridSize) * gridSize;

    ctx.fillStyle = '#272c38'; // M3 Surface Container Highest
    for (let x = minX; x <= maxX; x += gridSize) {
      for (let y = minY; y <= maxY; y += gridSize) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }

  private drawNets(ctx: CanvasRenderingContext2D): void {
    const portMap = new Map<string, PortPosition>();
    for (const p of this.getAllPortPositions()) {
      portMap.set(`${p.instanceId}:${p.portId}`, p);
    }

    for (const net of this.design.nets) {
      const srcPos = net.source ? portMap.get(`${net.source.instanceId}:${net.source.portId}`) : null;
      if (!srcPos) continue;

      const isSelected = this.selectedNetId === net.id;
      const isBus = net.width > 1;

      for (const tgt of net.targets) {
        const tgtPos = portMap.get(`${tgt.instanceId}:${tgt.portId}`);
        if (!tgtPos) continue;

        this.drawOrthogonalWire(ctx, srcPos, tgtPos, isBus, isSelected, net.width);
      }
    }
  }

  private drawOrthogonalWire(
    ctx: CanvasRenderingContext2D,
    src: { x: number; y: number },
    tgt: { x: number; y: number },
    isBus: boolean,
    isSelected: boolean,
    width: number
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);

    // Manhattan orthogonal auto-routing with rounded corners
    const midX = (src.x + tgt.x) / 2;
    ctx.lineTo(midX, src.y);
    ctx.lineTo(midX, tgt.y);
    ctx.lineTo(tgt.x, tgt.y);

    if (isSelected) {
      ctx.shadowColor = '#a8c7fa';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#a8c7fa';
      ctx.lineWidth = isBus ? 4.5 : 3;
    } else {
      ctx.strokeStyle = isBus ? '#7fcfff' : '#8e919a';
      ctx.lineWidth = isBus ? 3 : 1.75;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Bus slash & bit-width pill decoration
    if (isBus) {
      const slashX = midX;
      const slashY = (src.y + tgt.y) / 2;

      // Draw wire slash
      ctx.beginPath();
      ctx.moveTo(slashX - 4, slashY + 5);
      ctx.lineTo(slashX + 4, slashY - 5);
      ctx.strokeStyle = '#7fcfff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw bit-width badge pill (Material 3 Primary Container)
      const widthLabel = `[${width - 1}:0]`;
      ctx.font = '9px "Roboto Mono", monospace';
      const textWidth = ctx.measureText(widthLabel).width;
      const pillW = textWidth + 8;
      const pillH = 14;

      ctx.fillStyle = '#0842a0';
      ctx.strokeStyle = '#7fcfff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(slashX + 7, slashY - 8, pillW, pillH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#d3e3fd';
      ctx.fillText(widthLabel, slashX + 11, slashY + 3);
    }

    ctx.restore();
  }

  private drawRubberBandWire(
    ctx: CanvasRenderingContext2D,
    src: PortPosition,
    current: { x: number; y: number },
    targetPort: PortPosition | null
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);

    const midX = (src.x + current.x) / 2;
    ctx.lineTo(midX, src.y);
    ctx.lineTo(midX, current.y);
    ctx.lineTo(current.x, current.y);

    // Color: Green if compatible target, Red if width mismatch, Light Blue default
    let color = '#a8c7fa';
    if (targetPort) {
      color = targetPort.width === src.width ? '#6dd58c' : '#f2b8b5';
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }

  private drawInstances(ctx: CanvasRenderingContext2D): void {
    for (const inst of this.design.instances) {
      const modDef = getModuleDef(inst.moduleId);
      const isSelected = this.selectedInstanceId === inst.id;
      const w = modDef?.defaultWidth || 200;
      const h = modDef?.defaultHeight || 200;

      ctx.save();

      // Card shadow
      ctx.shadowColor = isSelected ? 'rgba(168, 199, 250, 0.4)' : 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = isSelected ? 18 : 8;
      ctx.shadowOffsetY = 4;

      // Card Body (Material 3 Surface Container)
      ctx.fillStyle = '#1a1d26';
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, h, 12);
      ctx.fill();

      // Card Border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isSelected ? '#a8c7fa' : '#272c38';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Header Bar with Category Color
      ctx.fillStyle = this.getCategoryColor(modDef?.category || 'infrastructure');
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, 32, [12, 12, 0, 0]);
      ctx.fill();

      // Header Title & Instance Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Google Sans", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(inst.name, inst.position.x + 12, inst.position.y + 20);

      // Category Pill in header
      if (modDef?.category) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        const catText = modDef.category.toUpperCase();
        ctx.font = 'bold 8px "Google Sans", "Roboto", sans-serif';
        const catW = ctx.measureText(catText).width;
        ctx.beginPath();
        ctx.roundRect(inst.position.x + w - catW - 16, inst.position.y + 8, catW + 10, 16, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(catText, inst.position.x + w - catW - 11, inst.position.y + 19);
      }

      ctx.fillStyle = '#8e919a';
      ctx.font = '10px "Roboto Mono", monospace';
      ctx.fillText(modDef?.name || inst.moduleId, inst.position.x + 12, inst.position.y + 48);

      // Draw Port Pins & Labels
      if (modDef) {
        const inputPorts = modDef.ports.filter(p => p.direction === 'input');
        const outputPorts = modDef.ports.filter(p => p.direction === 'output');
        const inoutPorts = modDef.ports.filter(p => p.direction === 'inout');

        // Draw Inputs (Left)
        const inSpacing = h / (inputPorts.length + 1);
        inputPorts.forEach((p, idx) => {
          const effectiveWidth = getEffectivePortWidth(modDef, p, inst);
          const px = inst.position.x;
          const py = inst.position.y + inSpacing * (idx + 1);
          this.drawPortPin(ctx, px, py, p, effectiveWidth, 'left');
        });

        // Draw Outputs (Right)
        const outSpacing = h / (outputPorts.length + 1);
        outputPorts.forEach((p, idx) => {
          const effectiveWidth = getEffectivePortWidth(modDef, p, inst);
          const px = inst.position.x + w;
          const py = inst.position.y + outSpacing * (idx + 1);
          this.drawPortPin(ctx, px, py, p, effectiveWidth, 'right');
        });

        // Draw Inouts (Bottom)
        const inoutSpacing = w / (inoutPorts.length + 1);
        inoutPorts.forEach((p, idx) => {
          const effectiveWidth = getEffectivePortWidth(modDef, p, inst);
          const px = inst.position.x + inoutSpacing * (idx + 1);
          const py = inst.position.y + h;
          this.drawPortPin(ctx, px, py, p, effectiveWidth, 'bottom');
        });
      }

      ctx.restore();
    }
  }

  private drawPortPin(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    port: KonaPortDef,
    width: number,
    align: 'left' | 'right' | 'bottom'
  ): void {
    const isBus = width > 1;
    const isHovered = this.hoveredPort?.portId === port.id && this.hoveredPort?.x === x && this.hoveredPort?.y === y;

    // Pin Halo on hover (Material State Layer)
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 199, 250, 0.25)';
      ctx.fill();
    }

    // Pin Circle
    ctx.beginPath();
    ctx.arc(x, y, isBus ? 5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = this.getPortTypeColor(port.type);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isBus ? 1.5 : 1;
    ctx.stroke();

    // Port Label
    ctx.fillStyle = '#c4c6d0';
    ctx.font = '11px "Roboto Mono", monospace';

    const label = isBus ? `${port.name}[${width - 1}:0]` : port.name;
    if (align === 'left') {
      ctx.textAlign = 'left';
      ctx.fillText(label, x + 8, y + 4);
    } else if (align === 'right') {
      ctx.textAlign = 'right';
      ctx.fillText(label, x - 8, y + 4);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y - 8);
    }
  }

  private getCategoryColor(category: string): string {
    switch (category) {
      case 'processor': return '#0842a0'; // Primary Container
      case 'interconnect': return '#4f378b'; // Tertiary Container
      case 'memory': return '#601410'; // Dark Crimson Container
      case 'peripheral': return '#004d67'; // Secondary Container
      case 'infrastructure': return '#0a5223'; // Success Container
      default: return '#272c38';
    }
  }

  private getPortTypeColor(type: string): string {
    switch (type) {
      case 'clock': return '#d0bcff'; // Tertiary
      case 'reset': return '#fbc02d'; // Warning
      case 'bus': return '#7fcfff'; // Secondary
      case 'data': return '#6dd58c'; // Success
      default: return '#8e919a';
    }
  }
}
