/**
 * Intermediate Representation (IR) Schema for Kona (.kona.json)
 *
 * Deterministic, diff-friendly JSON netlist schema designed for clean Git version control
 * and two-way synchronization between visual canvas and SystemVerilog code.
 */

export type KonaPortDirection = 'input' | 'output' | 'inout';
export type KonaPortType = 'data' | 'clock' | 'reset' | 'bus';

export interface KonaPortDef {
  id: string;
  name: string;
  direction: KonaPortDirection;
  type: KonaPortType;
  width: number; // 1 for single-bit, >1 for multi-bit bus
  description?: string;
}

export interface KonaParameterDef {
  name: string;
  type: 'integer' | 'string' | 'boolean';
  default: number | string | boolean;
  description: string;
}

export interface KonaModuleDef {
  id: string;
  name: string;
  category: 'processor' | 'interconnect' | 'peripheral' | 'memory' | 'infrastructure';
  description: string;
  ports: KonaPortDef[];
  parameters: KonaParameterDef[];
  defaultWidth?: number;
  defaultHeight?: number;
}

export interface KonaPortRef {
  instanceId: string;
  portId: string;
}

export interface KonaNet {
  id: string;
  name: string;
  width: number;
  source?: KonaPortRef; // Output driving this net
  targets: KonaPortRef[]; // Inputs receiving this net
}

export interface KonaModuleInstance {
  id: string;
  moduleId: string;
  name: string;
  position: { x: number; y: number };
  parameters: Record<string, number | string | boolean>;
}

export interface KonaDesignMetadata {
  created: string;
  modified: string;
  author?: string;
  description?: string;
  version: string;
}

export interface KonaDesign {
  version: '1.0';
  name: string;
  topModule: string;
  instances: KonaModuleInstance[];
  nets: KonaNet[];
  metadata: KonaDesignMetadata;
}

/**
 * Validate a KonaDesign object structure.
 * Returns an array of schema validation errors (empty if valid).
 */
export function validateKonaDesignSchema(design: unknown): string[] {
  const errors: string[] = [];
  if (!design || typeof design !== 'object') {
    return ['Design root must be an object'];
  }

  const d = design as Partial<KonaDesign>;
  if (d.version !== '1.0') {
    errors.push(`Invalid version: expected '1.0', got '${d.version}'`);
  }
  if (!d.name || typeof d.name !== 'string') {
    errors.push('Design must have a valid string "name"');
  }
  if (!d.topModule || typeof d.topModule !== 'string') {
    errors.push('Design must have a valid string "topModule"');
  }
  if (!Array.isArray(d.instances)) {
    errors.push('Design "instances" must be an array');
  } else {
    const instIds = new Set<string>();
    for (let i = 0; i < d.instances.length; i++) {
      const inst = d.instances[i];
      if (!inst.id || typeof inst.id !== 'string') {
        errors.push(`Instance #${i} must have a valid string "id"`);
      } else if (instIds.has(inst.id)) {
        errors.push(`Duplicate instance id "${inst.id}" at index ${i}`);
      } else {
        instIds.add(inst.id);
      }
      if (!inst.moduleId || typeof inst.moduleId !== 'string') {
        errors.push(`Instance "${inst.id || i}" missing "moduleId"`);
      }
      if (!inst.position || typeof inst.position.x !== 'number' || typeof inst.position.y !== 'number') {
        errors.push(`Instance "${inst.id || i}" missing valid position {x, y}`);
      }
    }
  }

  if (!Array.isArray(d.nets)) {
    errors.push('Design "nets" must be an array');
  } else {
    const netIds = new Set<string>();
    for (let i = 0; i < d.nets.length; i++) {
      const net = d.nets[i];
      if (!net.id || typeof net.id !== 'string') {
        errors.push(`Net #${i} must have a valid string "id"`);
      } else if (netIds.has(net.id)) {
        errors.push(`Duplicate net id "${net.id}" at index ${i}`);
      } else {
        netIds.add(net.id);
      }
      if (typeof net.width !== 'number' || net.width < 1) {
        errors.push(`Net "${net.id || i}" must have a positive number "width"`);
      }
      if (!Array.isArray(net.targets)) {
        errors.push(`Net "${net.id || i}" "targets" must be an array`);
      }
    }
  }

  return errors;
}

/**
 * Serialize a design into a deterministic, formatted JSON string.
 * Keys and instances are sorted to guarantee byte-for-byte reproducibility in Git.
 */
export function serializeKonaDesign(design: KonaDesign): string {
  const sortedInstances = [...design.instances].sort((a, b) => a.id.localeCompare(b.id));
  const sortedNets = [...design.nets].sort((a, b) => a.id.localeCompare(b.id));

  const sortedDesign: KonaDesign = {
    version: design.version,
    name: design.name,
    topModule: design.topModule,
    instances: sortedInstances.map(inst => ({
      id: inst.id,
      moduleId: inst.moduleId,
      name: inst.name,
      position: { x: Math.round(inst.position.x), y: Math.round(inst.position.y) },
      parameters: Object.keys(inst.parameters).sort().reduce((acc, k) => {
        acc[k] = inst.parameters[k];
        return acc;
      }, {} as Record<string, number | string | boolean>)
    })),
    nets: sortedNets.map(net => ({
      id: net.id,
      name: net.name,
      width: net.width,
      ...(net.source ? { source: { instanceId: net.source.instanceId, portId: net.source.portId } } : {}),
      targets: [...net.targets].sort((a, b) => (a.instanceId + a.portId).localeCompare(b.instanceId + b.portId))
    })),
    metadata: {
      ...design.metadata,
      version: design.metadata.version || '1.0'
    }
  };

  return JSON.stringify(sortedDesign, null, 2);
}

/**
 * Parse and validate a .kona.json file string into a KonaDesign.
 */
export function parseKonaDesign(jsonString: string): { design?: KonaDesign; errors: string[] } {
  try {
    const raw = JSON.parse(jsonString);
    const errors = validateKonaDesignSchema(raw);
    if (errors.length > 0) {
      return { errors };
    }
    return { design: raw as KonaDesign, errors: [] };
  } catch (err) {
    return { errors: [`JSON Parse error: ${(err as Error).message}`] };
  }
}
