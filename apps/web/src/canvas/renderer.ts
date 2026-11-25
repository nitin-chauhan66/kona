import { KonaDesign, KonaPortDef } from '../../../../packages/core/dist/ir.js';
import { getModuleDef } from '../../../../packages/core/dist/catalog.js';
import { DrcDiagnostic, getEffectivePortWidth } from '../../../../packages/core/dist/drc.js';
import {
  buildDrcLookups,
  buildPortMap,
  boxesOverlap,
  computeWirePoints,
  getInstanceBoxes,
  getInstanceDimensions
} from './geometry.js';
import {
  Box,
  CANVAS_METRICS,
  DrcVisualLookups,
  Point,
  PortPosition,
  RenderedWire,
  ViewportTransform
} from './types.js';

export interface RenderSceneState {
  design: KonaDesign;
  diagnostics: DrcDiagnostic[];
  transform: ViewportTransform;
  selectedInstanceId: string | null;
  selectedNetId: string | null;
  hoveredInstanceId: string | null;
  hoveredNetId: string | null;
  hoveredPort: PortPosition | null;
  wiringSource: PortPosition | null;
  wiringCurrent: Point;
  mouseScreen: Point;
  draggingInstanceId: string | null;
  isPanning: boolean;
}

/**
 * Stateless 2D Canvas Renderer for the Kona schematic scene.
 * Separates visual painting from interaction state and DOM event wiring.
 */
export class CanvasRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    dpr: number,
    state: RenderSceneState
  ): RenderedWire[] {
    if (viewW <= 0 || viewH <= 0) return [];

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0e1117';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.translate(state.transform.x, state.transform.y);
    ctx.scale(state.transform.scale, state.transform.scale);

    this.drawGrid(ctx, viewW, viewH, state.transform);

    const drc = buildDrcLookups(state.diagnostics);
    const renderedWires = this.drawNets(ctx, state, drc);

    if (state.wiringSource) {
      this.drawRubberBandWire(ctx, state.wiringSource, state.wiringCurrent, state.hoveredPort);
    }

    this.drawInstances(ctx, state, drc);
    ctx.restore();

    this.drawOverlayTooltip(ctx, viewW, viewH, dpr, state);
    return renderedWires;
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    screenW: number,
    screenH: number,
    transform: ViewportTransform
  ): void {
    const startX = -transform.x / transform.scale;
    const startY = -transform.y / transform.scale;
    const endX = (screenW - transform.x) / transform.scale;
    const endY = (screenH - transform.y) / transform.scale;

    const showMinor = transform.scale >= 0.45;
    const step = showMinor ? CANVAS_METRICS.GRID_SIZE : CANVAS_METRICS.GRID_SIZE * 5;
    const minX = Math.floor(startX / step) * step;
    const maxX = Math.ceil(endX / step) * step;
    const minY = Math.floor(startY / step) * step;
    const maxY = Math.ceil(endY / step) * step;

    for (let x = minX; x <= maxX; x += step) {
      for (let y = minY; y <= maxY; y += step) {
        const isMajor = x % 100 === 0 && y % 100 === 0;
        ctx.fillStyle = isMajor ? '#303746' : '#1d222d';
        const size = isMajor ? 2.5 : 1.5;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
  }

  private drawNets(
    ctx: CanvasRenderingContext2D,
    state: RenderSceneState,
    drc: DrcVisualLookups
  ): RenderedWire[] {
    const portMap = buildPortMap(state.design);
    const boxMap = getInstanceBoxes(state.design);
    const renderedWires: RenderedWire[] = [];
    const placedPills: Box[] = [];

    const pairCounters = new Map<string, number>();
    const pairTotals = new Map<string, number>();

    for (const net of state.design.nets) {
      if (!net.source) continue;
      for (const tgt of net.targets) {
        const key = `${net.source.instanceId}->${tgt.instanceId}`;
        pairTotals.set(key, (pairTotals.get(key) || 0) + 1);
      }
    }

    const orderedNets = [...state.design.nets].sort((a, b) => {
      const aActive = a.id === state.selectedNetId || a.id === state.hoveredNetId ? 1 : 0;
      const bActive = b.id === state.selectedNetId || b.id === state.hoveredNetId ? 1 : 0;
      return aActive - bActive;
    });

    for (const net of orderedNets) {
      const srcPos = net.source ? portMap.get(`${net.source.instanceId}:${net.source.portId}`) : null;
      if (!srcPos) continue;

      const isSelected = state.selectedNetId === net.id;
      const isHovered = state.hoveredNetId === net.id;
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

        const points = computeWirePoints(
          srcPos,
          tgtPos,
          laneIdx,
          totalLanes,
          boxMap.get(srcPos.instanceId),
          boxMap.get(tgtPos.instanceId)
        );
        renderedWires.push({ net, points, src: srcPos, tgt: tgtPos });

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

    return renderedWires;
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

    let strokeColor = isBus ? '#7fcfff' : '#8e919a';
    if (src.type === 'clock') strokeColor = '#b49df2';
    else if (src.type === 'reset') strokeColor = '#e3b341';

    if (hasError) strokeColor = '#f2b8b5';
    else if (hasWarn) strokeColor = '#fbc02d';
    if (isHovered) strokeColor = '#d3e3fd';
    if (isSelected) strokeColor = '#a8c7fa';

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

    if (isBus && points.length >= 4) {
      const segIdx = points.length === 4 ? 1 : 2;
      const pA = points[segIdx];
      const pB = points[segIdx + 1];
      const anchorX = (pA.x + pB.x) / 2;
      const anchorY = (pA.y + pB.y) / 2;

      const widthLabel = `[${width - 1}:0]`;
      ctx.font = '600 9px "Roboto Mono", monospace';
      const pillW = ctx.measureText(widthLabel).width + 10;
      const pillH = 15;

      const pillX = anchorX - pillW / 2;
      let pillY = anchorY - pillH / 2;
      for (let attempt = 0; attempt < 6; attempt++) {
        const candidate: Box = { x: pillX, y: pillY, w: pillW, h: pillH };
        if (!placedPills.some(b => boxesOverlap(b, candidate, 3))) break;
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

  private drawInstances(
    ctx: CanvasRenderingContext2D,
    state: RenderSceneState,
    drc: DrcVisualLookups
  ): void {
    for (const inst of state.design.instances) {
      const modDef = getModuleDef(inst.moduleId);
      const isSelected = state.selectedInstanceId === inst.id;
      const isHovered = state.hoveredInstanceId === inst.id;
      const hasErr = drc.errorInst.has(inst.id);
      const hasWarn = drc.warnInst.has(inst.id);
      const { w, h } = getInstanceDimensions(modDef, inst);

      ctx.save();

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

      ctx.fillStyle = isSelected ? '#1d222e' : isHovered ? '#1c202a' : '#171a23';
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, h, 12);
      ctx.fill();

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

      // Header Bar
      ctx.fillStyle = getCategoryColor(modDef?.category || 'infrastructure');
      ctx.beginPath();
      ctx.roundRect(inst.position.x, inst.position.y, w, CANVAS_METRICS.HEADER_HEIGHT, [12, 12, 0, 0]);
      ctx.fill();

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

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = '700 13px "Google Sans", "Roboto", sans-serif';
      ctx.fillText(truncateText(ctx, inst.name, w - catW - 30), inst.position.x + 12, inst.position.y + 22);

      // Subtitle Band
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.fillRect(
        inst.position.x + 1,
        inst.position.y + CANVAS_METRICS.HEADER_HEIGHT,
        w - 2,
        CANVAS_METRICS.SUBTITLE_HEIGHT
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(inst.position.x + 1, inst.position.y + CANVAS_METRICS.TOP_RESERVED);
      ctx.lineTo(inst.position.x + w - 1, inst.position.y + CANVAS_METRICS.TOP_RESERVED);
      ctx.stroke();

      ctx.fillStyle = '#9aa0ae';
      ctx.font = '500 10px "Roboto Mono", monospace';
      ctx.fillText(
        truncateText(ctx, modDef?.name || inst.moduleId, w - 24),
        inst.position.x + 12,
        inst.position.y + CANVAS_METRICS.HEADER_HEIGHT + 14
      );

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

      if (modDef) {
        const inputPorts = modDef.ports.filter(p => p.direction === 'input');
        const outputPorts = modDef.ports.filter(p => p.direction === 'output');
        const inoutPorts = modDef.ports.filter(p => p.direction === 'inout');

        const portAreaTop = inst.position.y + CANVAS_METRICS.TOP_RESERVED + 6;
        const portAreaBottom = inst.position.y + h - (inoutPorts.length > 0 ? 24 : 10);
        const portAreaH = Math.max(24, portAreaBottom - portAreaTop);

        const inSpacing = portAreaH / (inputPorts.length + 1);
        inputPorts.forEach((p, idx) => {
          const ew = getEffectivePortWidth(modDef, p, inst);
          const py = portAreaTop + inSpacing * (idx + 1);
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(
            ctx, state, inst.id, inst.position.x, py, p, ew, 'left',
            drc.errorPorts.has(portKey), drc.warnPorts.has(portKey)
          );
        });

        const outSpacing = portAreaH / (outputPorts.length + 1);
        outputPorts.forEach((p, idx) => {
          const ew = getEffectivePortWidth(modDef, p, inst);
          const py = portAreaTop + outSpacing * (idx + 1);
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(
            ctx, state, inst.id, inst.position.x + w, py, p, ew, 'right',
            drc.errorPorts.has(portKey), drc.warnPorts.has(portKey)
          );
        });

        const inoutSpacing = w / (inoutPorts.length + 1);
        inoutPorts.forEach((p, idx) => {
          const ew = getEffectivePortWidth(modDef, p, inst);
          const px = inst.position.x + inoutSpacing * (idx + 1);
          const portKey = `${inst.id}:${p.id}`;
          this.drawPortPin(
            ctx, state, inst.id, px, inst.position.y + h, p, ew, 'bottom',
            drc.errorPorts.has(portKey), drc.warnPorts.has(portKey)
          );
        });
      }

      ctx.restore();
    }
  }

  private drawPortPin(
    ctx: CanvasRenderingContext2D,
    state: RenderSceneState,
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
    const isHovered = state.hoveredPort?.instanceId === instanceId && state.hoveredPort?.portId === port.id;
    const isWireTargetCompatible =
      state.wiringSource &&
      state.wiringSource.instanceId !== instanceId &&
      isHovered &&
      state.wiringSource.width === width;

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

    ctx.beginPath();
    ctx.arc(x, y, isHovered ? 5.5 : isBus ? 4.8 : 4, 0, Math.PI * 2);
    ctx.fillStyle = getPortTypeColor(port.type);
    ctx.fill();
    ctx.strokeStyle = hasError ? '#f2b8b5' : hasWarn ? '#fbc02d' : '#ffffff';
    ctx.lineWidth = isBus || isHovered ? 1.6 : 1.1;
    ctx.stroke();

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

  private drawOverlayTooltip(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    dpr: number,
    state: RenderSceneState
  ): void {
    let title = '';
    let sub = '';
    let accent = '#a8c7fa';

    if (state.wiringSource && state.hoveredPort) {
      const compat = state.wiringSource.width === state.hoveredPort.width;
      title = compat
        ? `Connect ${state.wiringSource.name} → ${state.hoveredPort.name}`
        : `Width Mismatch: [${state.wiringSource.width - 1}:0] ≠ [${state.hoveredPort.width - 1}:0]`;
      sub = compat ? `${state.hoveredPort.width}-bit ${state.hoveredPort.type}` : 'DRC will flag width mismatch';
      accent = compat ? '#6dd58c' : '#f2b8b5';
    } else if (state.hoveredPort) {
      const p = state.hoveredPort;
      title = `${p.name}${p.width > 1 ? ` [${p.width - 1}:0]` : ' (1-bit)'}`;
      sub = `${p.direction.toUpperCase()} • ${p.type}${p.description ? ` — ${p.description}` : ''}`;
      accent = getPortTypeColor(p.type);
    } else if (state.hoveredNetId && !state.draggingInstanceId && !state.isPanning) {
      const net = state.design.nets.find(n => n.id === state.hoveredNetId);
      if (net) {
        title = `${net.name} ${net.width > 1 ? `[${net.width - 1}:0]` : '(1-bit)'}`;
        sub = 'Click to inspect or Delete to remove';
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

    let tx = state.mouseScreen.x + 14;
    let ty = state.mouseScreen.y + 16;
    if (tx + boxW > viewW - 12) tx = Math.max(12, state.mouseScreen.x - boxW - 12);
    if (ty + boxH > viewH - 12) ty = Math.max(12, state.mouseScreen.y - boxH - 12);

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
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'processor': return '#0842a0';
    case 'interconnect': return '#4f378b';
    case 'memory': return '#6e1914';
    case 'peripheral': return '#004d67';
    case 'infrastructure': return '#0a5223';
    default: return '#272c38';
  }
}

function getPortTypeColor(type: string): string {
  switch (type) {
    case 'clock': return '#d0bcff';
    case 'reset': return '#fbc02d';
    case 'bus': return '#7fcfff';
    case 'data': return '#6dd58c';
    default: return '#8e919a';
  }
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
