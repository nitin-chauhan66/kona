import {
  KonaDesign,
  KonaModuleDef,
  KonaModuleInstance
} from '../../../../packages/core/dist/ir.js';
import { getModuleDef } from '../../../../packages/core/dist/catalog.js';
import { DrcDiagnostic, getEffectivePortWidth } from '../../../../packages/core/dist/drc.js';
import {
  Box,
  CANVAS_METRICS,
  DrcVisualLookups,
  Point,
  PortPosition,
  RenderedWire
} from './types.js';

/**
 * Computes consistent dynamic block dimensions so port pins and labels
 * never collide with the header, subtitle, or opposite-side labels.
 */
export function getInstanceDimensions(
  modDef: KonaModuleDef | undefined,
  inst: KonaModuleInstance
): { w: number; h: number } {
  if (!modDef) return { w: 200, h: 180 };

  const inputPorts = modDef.ports.filter(p => p.direction === 'input');
  const outputPorts = modDef.ports.filter(p => p.direction === 'output');
  const inoutPorts = modDef.ports.filter(p => p.direction === 'inout');

  const maxSidePorts = Math.max(inputPorts.length, outputPorts.length, 1);
  const minPortH =
    CANVAS_METRICS.TOP_RESERVED +
    maxSidePorts * CANVAS_METRICS.PORT_PITCH +
    CANVAS_METRICS.BOTTOM_PAD +
    (inoutPorts.length > 0 ? 22 : 0);
  const h = Math.max(modDef.defaultHeight || 160, minPortH);

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

export function computeAllPortPositions(design: KonaDesign): PortPosition[] {
  const ports: PortPosition[] = [];

  for (const inst of design.instances) {
    const modDef = getModuleDef(inst.moduleId);
    if (!modDef) continue;

    const { w, h } = getInstanceDimensions(modDef, inst);
    const inputPorts = modDef.ports.filter(p => p.direction === 'input');
    const outputPorts = modDef.ports.filter(p => p.direction === 'output');
    const inoutPorts = modDef.ports.filter(p => p.direction === 'inout');

    const portAreaTop = inst.position.y + CANVAS_METRICS.TOP_RESERVED + 6;
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

export function buildPortMap(design: KonaDesign): Map<string, PortPosition> {
  const map = new Map<string, PortPosition>();
  for (const p of computeAllPortPositions(design)) {
    map.set(`${p.instanceId}:${p.portId}`, p);
  }
  return map;
}

export function getInstanceBoxes(design: KonaDesign): Map<string, Box> {
  const map = new Map<string, Box>();
  for (const inst of design.instances) {
    const modDef = getModuleDef(inst.moduleId);
    const { w, h } = getInstanceDimensions(modDef, inst);
    map.set(inst.id, { x: inst.position.x, y: inst.position.y, w, h });
  }
  return map;
}

/**
 * Computes lane-staggered Manhattan orthogonal wire polylines, routing
 * feedback wires cleanly outside block bounding boxes.
 */
export function computeWirePoints(
  src: PortPosition,
  tgt: PortPosition,
  laneIdx: number,
  totalLanes: number,
  srcBox?: Box,
  tgtBox?: Box
): Point[] {
  const laneShift = (laneIdx - (totalLanes - 1) / 2) * 14;

  if (src.direction === 'inout' || tgt.direction === 'inout') {
    const dropY = Math.max(src.y, tgt.y) + 28 + laneIdx * 10;
    return [
      { x: src.x, y: src.y },
      { x: src.x, y: dropY },
      { x: tgt.x, y: dropY },
      { x: tgt.x, y: tgt.y }
    ];
  }

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

  // Feedback / backward route: loop outside block bounds
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

export function buildDrcLookups(diagnostics: DrcDiagnostic[]): DrcVisualLookups {
  const lookups: DrcVisualLookups = {
    errorInst: new Set<string>(),
    warnInst: new Set<string>(),
    errorNet: new Set<string>(),
    warnNet: new Set<string>(),
    errorPorts: new Set<string>(),
    warnPorts: new Set<string>()
  };

  for (const d of diagnostics) {
    if (d.severity === 'error') {
      if (d.instanceId) lookups.errorInst.add(d.instanceId);
      if (d.netId) lookups.errorNet.add(d.netId);
      if (d.instanceId && d.portId) lookups.errorPorts.add(`${d.instanceId}:${d.portId}`);
    } else if (d.severity === 'warning') {
      if (d.instanceId) lookups.warnInst.add(d.instanceId);
      if (d.netId) lookups.warnNet.add(d.netId);
      if (d.instanceId && d.portId) lookups.warnPorts.add(`${d.instanceId}:${d.portId}`);
    }
  }

  return lookups;
}

export function findHitWire(wires: RenderedWire[], world: Point, scale: number): RenderedWire | null {
  const threshold = Math.max(7, 8 / scale);
  for (let i = wires.length - 1; i >= 0; i--) {
    const wire = wires[i];
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

export function distPointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function boxesOverlap(a: Box, b: Box, pad = 0): boolean {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}
