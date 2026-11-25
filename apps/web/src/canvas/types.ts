import { KonaNet } from '../../../../packages/core/dist/ir.js';

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
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

export interface RenderedWire {
  net: KonaNet;
  points: Point[];
  src: PortPosition;
  tgt: PortPosition;
}

export interface DrcVisualLookups {
  errorInst: Set<string>;
  warnInst: Set<string>;
  errorNet: Set<string>;
  warnNet: Set<string>;
  errorPorts: Set<string>;
  warnPorts: Set<string>;
}

export type CanvasToolMode = 'select' | 'pan';

export const CANVAS_METRICS = {
  GRID_SIZE: 20,
  HEADER_HEIGHT: 34,
  SUBTITLE_HEIGHT: 22,
  TOP_RESERVED: 56, // HEADER_HEIGHT + SUBTITLE_HEIGHT
  PORT_PITCH: 26,
  BOTTOM_PAD: 18
} as const;
