/**
 * Plain-English Translator & Guided Chip Builder Metadata
 *
 * Maps technical hardware IP blocks and DRC diagnostics into approachable,
 * everyday explanations so students, founders, and non-technical creators
 * can understand and design chips confidently.
 */

export interface PlainModuleInfo {
  friendlyName: string;
  analogy: string;
  whatItDoes: string;
}

export const PLAIN_MODULE_INFO: Record<string, PlainModuleInfo> = {
  picorv32: {
    friendlyName: 'Chip Brain (RISC-V CPU)',
    analogy: 'The brain of your chip',
    whatItDoes: 'Reads software instructions and tells all other parts what to do.'
  },
  ibex: {
    friendlyName: 'Secure Chip Brain (Ibex CPU)',
    analogy: 'Security-focused processor',
    whatItDoes: 'Runs software with extra hardware memory protection and fast interrupt handling.'
  },
  axi_crossbar: {
    friendlyName: 'Data Highway (AXI Bus)',
    analogy: 'Internal traffic router',
    whatItDoes: 'Connects the Chip Brain to Memory and Peripherals so data goes to the right place.'
  },
  wishbone_crossbar: {
    friendlyName: 'Open Data Highway (Wishbone)',
    analogy: 'Lightweight traffic router',
    whatItDoes: 'Routes read/write requests between the processor, memory, and I/O blocks.'
  },
  ram_dual_port: {
    friendlyName: 'Working Memory (SRAM)',
    analogy: 'Short-term scratchpad',
    whatItDoes: 'Holds running program code and live sensor/application data.'
  },
  uart_core: {
    friendlyName: 'Serial / USB Messenger (UART)',
    analogy: 'Text & telemetry port',
    whatItDoes: 'Sends and receives data over two wires to a PC, USB adapter, or radio module.'
  },
  gpio_controller: {
    friendlyName: 'Physical Pin Bank (GPIO)',
    analogy: 'Lights, switches & relays',
    whatItDoes: 'Turns external pins ON/OFF (LEDs, motors) or reads buttons and switches.'
  },
  spi_controller: {
    friendlyName: 'Fast Storage / Display Port (SPI)',
    analogy: 'High-speed accessory port',
    whatItDoes: 'Connects external Flash memory chips, SD cards, or small OLED/TFT screens.'
  },
  i2c_controller: {
    friendlyName: 'Sensor Bus Port (I2C)',
    analogy: 'Two-wire sensor hub',
    whatItDoes: 'Reads temperature, humidity, motion, or power chips using just 2 wires.'
  },
  timer_core: {
    friendlyName: 'Alarm & Safety Timer',
    analogy: 'Stopwatch & watchdog',
    whatItDoes: 'Measures exact time intervals and resets the chip if software ever gets stuck.'
  },
  sync_fifo: {
    friendlyName: 'Data Waiting Buffer (FIFO)',
    analogy: 'First-in, first-out queue',
    whatItDoes: 'Temporarily holds bursts of data so fast producers never overwhelm slower ports.'
  },
  clock_divider: {
    friendlyName: 'Speed Reducer (Clock Divider)',
    analogy: 'Gearbox for chip speed',
    whatItDoes: 'Creates a slower, power-saving clock pulse for sensors or slow peripherals.'
  },
  clock_gen: {
    friendlyName: 'Chip Heartbeat (Clock & Reset)',
    analogy: 'Metronome & clean start',
    whatItDoes: 'Generates the steady heartbeat pulse and startup reset that keeps every part in sync.'
  }
};

export function getPlainModuleInfo(moduleId: string): PlainModuleInfo {
  return PLAIN_MODULE_INFO[moduleId] || {
    friendlyName: moduleId,
    analogy: 'Hardware building block',
    whatItDoes: 'Custom digital logic block in your chip architecture.'
  };
}

export type WizardGoalId =
  | 'iot_sensor'
  | 'mini_computer'
  | 'secure_chip'
  | 'edge_storage'
  | 'led_serial';

export interface WizardGoalOption {
  id: WizardGoalId;
  templateId: string;
  title: string;
  tagline: string;
  bestFor: string;
}

export const WIZARD_GOALS: WizardGoalOption[] = [
  {
    id: 'iot_sensor',
    templateId: 'sensor_hub',
    title: 'Smart Sensor & Telemetry Chip',
    tagline: 'Reads environmental/motion sensors and streams data over serial.',
    bestFor: 'Weather stations, factory monitors, wearable trackers'
  },
  {
    id: 'mini_computer',
    templateId: 'riscv_mcu',
    title: 'Programmable Mini Computer (MCU)',
    tagline: 'Includes a RISC-V CPU brain, working memory, and serial port.',
    bestFor: 'Smart appliances, custom controllers, learning chip design'
  },
  {
    id: 'secure_chip',
    templateId: 'opentitan_rot',
    title: 'Security & Smart-Lock Controller',
    tagline: 'Uses a security-hardened processor, timer, and protected memory.',
    bestFor: 'Smart locks, authentication tokens, tamper-safe devices'
  },
  {
    id: 'edge_storage',
    templateId: 'pulpissimo_edge',
    title: 'Edge Controller with Flash & Sensors',
    tagline: 'Combines a CPU brain with high-speed SPI memory and I2C sensors.',
    bestFor: 'Robotics, data loggers, smart meters'
  },
  {
    id: 'led_serial',
    templateId: 'uart_loopback',
    title: 'Starter Serial & LED Blinker',
    tagline: 'Simple beginner circuit that buffers serial messages to physical pins.',
    bestFor: 'First-time learners and classroom demos'
  }
];
