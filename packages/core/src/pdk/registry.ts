import { KonaDiePreset, KonaSiliconConfig, PdkId } from '../ir.js';

export interface KonaPdkDieSlot {
  label: string;
  dieArea: string;  // "x0 y0 x1 y1" in microns
  coreArea: string; // "x0 y0 x1 y1" in microns
  approxGates: string;
}

export interface KonaPdkDef {
  id: PdkId;
  name: string;
  shortName: string;
  foundry: string;
  nodeNm: number;
  processType: string;
  coreVoltage: string;
  ioVoltage: string;
  metalLayers: number;
  stdCellLibrary: string;
  ioPadLibrary: string;
  volareFamily: string;
  volarePdk: string;
  maxClockMhz: number;
  defaultClockMhz: number;
  defaultUtilization: number;
  targetDensityPct: number;
  drivingCell: string;
  drivingCellPin: string;
  outputLoadPf: number;
  maxSoftRamAddrBits: number;
  openRamMacroName: string;
  openRamMacroWords: number;
  dieSlots: Record<Exclude<KonaDiePreset, 'auto'>, KonaPdkDieSlot>;
  ioPadCells: {
    input: string;
    output: string;
    inout: string;
    vdd: string;
    vss: string;
    vddio: string;
    vssio: string;
    corner: string;
  };
  shuttleNotes: string;
  indiaEcosystemNotes: string;
}

export const PDK_CATALOG: Record<PdkId, KonaPdkDef> = {
  sky130A: {
    id: 'sky130A',
    name: 'SkyWater SKY130 (130nm CMOS)',
    shortName: 'SKY130 · 130nm',
    foundry: 'SkyWater Technology Foundry',
    nodeNm: 130,
    processType: '130nm Bulk CMOS (5-Metal)',
    coreVoltage: '1.8V',
    ioVoltage: '3.3V',
    metalLayers: 5,
    stdCellLibrary: 'sky130_fd_sc_hd',
    ioPadLibrary: 'sky130_fd_io',
    volareFamily: 'sky130',
    volarePdk: 'sky130A',
    maxClockMhz: 100,
    defaultClockMhz: 50,
    defaultUtilization: 0.45,
    targetDensityPct: 55,
    drivingCell: 'sky130_fd_sc_hd__inv_2',
    drivingCellPin: 'Y',
    outputLoadPf: 0.033442,
    maxSoftRamAddrBits: 9,
    openRamMacroName: 'sky130_sram_2kbyte_1rw1r_32x512_8',
    openRamMacroWords: 512,
    dieSlots: {
      mpw_small: {
        label: 'Tiny Slot (1.0 × 1.0 mm)',
        dieArea: '0 0 1000 1000',
        coreArea: '180 180 820 820',
        approxGates: '~25k gates'
      },
      mpw_medium: {
        label: 'MPW Standard (2.0 × 2.0 mm)',
        dieArea: '0 0 2000 2000',
        coreArea: '200 200 1800 1800',
        approxGates: '~120k gates'
      },
      mpw_large: {
        label: 'Caravel / Full SoC (3.5 × 3.5 mm)',
        dieArea: '0 0 3500 3500',
        coreArea: '220 220 3280 3280',
        approxGates: '~400k+ gates'
      }
    },
    ioPadCells: {
      input: 'sky130_fd_io__top_gpiov2',
      output: 'sky130_fd_io__top_gpiov2',
      inout: 'sky130_fd_io__top_gpiov2',
      vdd: 'sky130_fd_io__top_power_lvc_wpad',
      vss: 'sky130_fd_io__top_ground_lvc_wpad',
      vddio: 'sky130_fd_io__top_power_hvc_wpad',
      vssio: 'sky130_fd_io__top_ground_hvc_wpad',
      corner: 'sky130_fd_io__corner_bus_overlay'
    },
    shuttleNotes: 'Supported by LibreLane/OpenLane 2, Tiny Tapeout, and ChipFoundry/MPW aggregators.',
    indiaEcosystemNotes: 'Ideal for IIT/NIT academic chips, RISC-V MCU prototypes, and DLI pre-silicon proof-of-concept before moving to commercial 28nm/65nm.'
  },
  gf180mcuD: {
    id: 'gf180mcuD',
    name: 'GlobalFoundries GF180MCU (180nm 3.3V/5V)',
    shortName: 'GF180MCU · 180nm',
    foundry: 'GlobalFoundries',
    nodeNm: 180,
    processType: '180nm MCU CMOS (5-Metal, 3.3V/5V)',
    coreVoltage: '3.3V / 5.0V',
    ioVoltage: '3.3V / 5.0V',
    metalLayers: 5,
    stdCellLibrary: 'gf180mcu_fd_sc_mcu7t5v0',
    ioPadLibrary: 'gf180mcu_fd_io',
    volareFamily: 'gf180mcu',
    volarePdk: 'gf180mcuD',
    maxClockMhz: 60,
    defaultClockMhz: 25,
    defaultUtilization: 0.45,
    targetDensityPct: 55,
    drivingCell: 'gf180mcu_fd_sc_mcu7t5v0__inv_2',
    drivingCellPin: 'ZN',
    outputLoadPf: 0.05,
    maxSoftRamAddrBits: 8,
    openRamMacroName: 'gf180mcu_fd_ip_sram__sram512x8m8wm1',
    openRamMacroWords: 512,
    dieSlots: {
      mpw_small: {
        label: 'Compact MCU (1.5 × 1.5 mm)',
        dieArea: '0 0 1500 1500',
        coreArea: '220 220 1280 1280',
        approxGates: '~18k gates'
      },
      mpw_medium: {
        label: 'MPW Standard (2.5 × 2.5 mm)',
        dieArea: '0 0 2500 2500',
        coreArea: '240 240 2260 2260',
        approxGates: '~65k gates'
      },
      mpw_large: {
        label: 'Full Pad-Ring Die (4.0 × 4.0 mm)',
        dieArea: '0 0 4000 4000',
        coreArea: '260 260 3740 3740',
        approxGates: '~180k gates'
      }
    },
    ioPadCells: {
      input: 'gf180mcu_fd_io__in_c',
      output: 'gf180mcu_fd_io__out_8mA',
      inout: 'gf180mcu_fd_io__bi_t',
      vdd: 'gf180mcu_fd_io__dvdd',
      vss: 'gf180mcu_fd_io__dvss',
      vddio: 'gf180mcu_fd_io__dvdd',
      vssio: 'gf180mcu_fd_io__dvss',
      corner: 'gf180mcu_fd_io__cor'
    },
    shuttleNotes: 'Native 5V/3.3V tolerant industrial node; supported by OpenLane 2/LibreLane and WaferSpace/GF180 open shuttles.',
    indiaEcosystemNotes: 'Best match for 180nm industrial/automotive sensor hubs, SCL-180nm-class microcontroller flows, and 5V industrial interfacing.'
  },
  sg13g2: {
    id: 'sg13g2',
    name: 'IHP SG13G2 (130nm BiCMOS)',
    shortName: 'IHP SG13G2 · 130nm',
    foundry: 'IHP Microelectronics (Germany)',
    nodeNm: 130,
    processType: '130nm SiGe BiCMOS (7-Metal)',
    coreVoltage: '1.2V',
    ioVoltage: '3.3V',
    metalLayers: 7,
    stdCellLibrary: 'sg13g2_stdcell',
    ioPadLibrary: 'sg13g2_io',
    volareFamily: 'ihp_sg13g2',
    volarePdk: 'sg13g2',
    maxClockMhz: 180,
    defaultClockMhz: 80,
    defaultUtilization: 0.45,
    targetDensityPct: 55,
    drivingCell: 'sg13g2_inv_2',
    drivingCellPin: 'Y',
    outputLoadPf: 0.025,
    maxSoftRamAddrBits: 9,
    openRamMacroName: 'RM_IHPSG13_1P_512x32_c2_bm_bist',
    openRamMacroWords: 512,
    dieSlots: {
      mpw_small: {
        label: 'Mini ASIC (1.0 × 1.0 mm)',
        dieArea: '0 0 1000 1000',
        coreArea: '160 160 840 840',
        approxGates: '~35k gates'
      },
      mpw_medium: {
        label: 'MPW Standard (2.0 × 2.0 mm)',
        dieArea: '0 0 2000 2000',
        coreArea: '180 180 1820 1820',
        approxGates: '~160k gates'
      },
      mpw_large: {
        label: 'Full SoC (3.5 × 3.5 mm)',
        dieArea: '0 0 3500 3500',
        coreArea: '200 200 3300 3300',
        approxGates: '~500k gates'
      }
    },
    ioPadCells: {
      input: 'sg13g2_IOPadIn',
      output: 'sg13g2_IOPadOut16mA',
      inout: 'sg13g2_IOPadInOut30mA',
      vdd: 'sg13g2_IOPadVdd',
      vss: 'sg13g2_IOPadVss',
      vddio: 'sg13g2_IOPadIOVdd',
      vssio: 'sg13g2_IOPadIOVss',
      corner: 'sg13g2_Corner'
    },
    shuttleNotes: 'Active European open-source MPW shuttles via IHP + LibreLane/OpenROAD.',
    indiaEcosystemNotes: 'Strong option for Indian startups and labs needing higher clock speeds (up to ~180 MHz) and 7-metal routing density on an open PDK.'
  }
};

export function listPdks(): KonaPdkDef[] {
  return Object.values(PDK_CATALOG);
}

export function getPdkDef(pdkId: PdkId | string): KonaPdkDef | undefined {
  return PDK_CATALOG[pdkId as PdkId];
}

export function createDefaultSiliconConfig(pdkId: PdkId = 'sky130A'): KonaSiliconConfig {
  const pdk = PDK_CATALOG[pdkId] || PDK_CATALOG.sky130A;
  return {
    pdkId: pdk.id,
    clockFreqMhz: pdk.defaultClockMhz,
    coreUtilization: pdk.defaultUtilization,
    diePreset: 'mpw_medium',
    packageType: 'QFN48',
    shuttleTarget: pdk.id === 'gf180mcuD' ? 'cdac_chipin' : 'librelane_mpw',
    sramMode: 'openram_macro',
    includeIoPads: true
  };
}
