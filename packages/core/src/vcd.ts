/**
 * VCD (Value Change Dump) Data Structures & Parser (FR-1.5)
 *
 * Provides timeline analysis, signal hierarchy query, and radix conversions.
 */

export interface VcdSignal {
  id: string; // VCD short identifier (e.g. '!', '"')
  name: string; // Hierarchical or simple signal name (e.g. 'clk', 'cpu.mem_addr')
  width: number;
  type: 'wire' | 'reg' | 'logic';
}

export interface VcdSample {
  time: number;
  value: string; // '0', '1', 'x', 'z', or binary string for buses
}

export interface VcdTrace {
  timescale: string;
  signals: VcdSignal[];
  signalChanges: Map<string, VcdSample[]>; // signal.name -> samples
  maxTime: number;
}

export function formatSignalValue(val: string, width: number, radix: 'bin' | 'hex' | 'dec'): string {
  if (val === 'x' || val === 'z' || val === 'X' || val === 'Z') return val.toUpperCase();
  if (width === 1) return val;

  const cleanBin = val.replace(/^b/i, '');
  const num = parseInt(cleanBin, 2);

  if (isNaN(num)) return val;

  if (radix === 'hex') {
    const hexChars = Math.ceil(width / 4);
    return '0x' + num.toString(16).toUpperCase().padStart(hexChars, '0');
  } else if (radix === 'dec') {
    return num.toString(10);
  } else {
    return '0b' + cleanBin.padStart(width, '0');
  }
}

/**
 * Parses standard VCD string into a structured VcdTrace.
 */
export function parseVcd(vcdContent: string): VcdTrace {
  const lines = vcdContent.split(/\r?\n/);
  let timescale = '1ns';
  const signals: VcdSignal[] = [];
  const idToSignal = new Map<string, VcdSignal>();
  const signalChanges = new Map<string, VcdSample[]>();
  let currentTime = 0;
  let maxTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('$timescale')) {
      const match = line.match(/\$timescale\s+([^$]+)\s+\$end/);
      if (match) timescale = match[1].trim();
      continue;
    }

    if (line.startsWith('$var')) {
      // e.g. $var wire 1 ! clk $end or $var wire 32 " mem_addr [31:0] $end
      const parts = line.split(/\s+/);
      if (parts.length >= 5) {
        const type = (parts[1] || 'wire') as 'wire' | 'reg' | 'logic';
        const width = parseInt(parts[2], 10) || 1;
        const id = parts[3];
        const name = parts[4];

        const sig: VcdSignal = { id, name, width, type };
        signals.push(sig);
        idToSignal.set(id, sig);
        signalChanges.set(name, []);
      }
      continue;
    }

    if (line.startsWith('#')) {
      currentTime = parseInt(line.substring(1), 10) || 0;
      if (currentTime > maxTime) maxTime = currentTime;
      continue;
    }

    // Value changes
    if (line.startsWith('b') || line.startsWith('B')) {
      // Vector: b0101 !
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const val = parts[0].substring(1);
        const id = parts[1];
        const sig = idToSignal.get(id);
        if (sig) {
          signalChanges.get(sig.name)?.push({ time: currentTime, value: val });
        }
      }
    } else if (line.length >= 2 && !line.startsWith('$')) {
      // Scalar: 1! or 0"
      const val = line[0];
      const id = line.substring(1).trim();
      const sig = idToSignal.get(id);
      if (sig) {
        signalChanges.get(sig.name)?.push({ time: currentTime, value: val });
      }
    }
  }

  return {
    timescale,
    signals,
    signalChanges,
    maxTime
  };
}
