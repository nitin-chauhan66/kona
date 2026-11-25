import { KonaDesign } from '../../ir.js';
import { KonaTemplateDef } from '../registry.js';

export const SENSOR_HUB_TEMPLATE: KonaTemplateDef = {
  id: 'sensor_hub',
  name: 'TinyFPGA BX Industrial Sensor Hub & Telemetry Engine',
  description: 'Real-world FPGA sensor fusion pipeline with hardware clock divider, I2C telemetry master, FIFO queue buffer, GPIO indicator pads, and UART downlink',
  createDesign: (): KonaDesign => ({
    version: '1.0',
    name: 'Industrial Sensor Hub',
    topModule: 'top',
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      description: 'FPGA sensor hub pipeline with I2C master, synchronous FIFO telemetry queue, GPIO pads, and UART downlink'
    },
    instances: [
      {
        id: 'master_clk',
        moduleId: 'clock_gen',
        name: 'u_clk_gen',
        position: { x: 60, y: 140 },
        parameters: { FREQ_MHZ: 50 }
      },
      {
        id: 'clk_div',
        moduleId: 'clock_divider',
        name: 'u_clk_div',
        position: { x: 320, y: 140 },
        parameters: { DIVISOR: 4 }
      },
      {
        id: 'i2c_sensor',
        moduleId: 'i2c_controller',
        name: 'u_i2c_sensor',
        position: { x: 320, y: 380 },
        parameters: { PRESCALE: 125 }
      },
      {
        id: 'telem_fifo',
        moduleId: 'sync_fifo',
        name: 'u_telem_fifo',
        position: { x: 660, y: 360 },
        parameters: { WIDTH: 8, DEPTH: 32 }
      },
      {
        id: 'uart_downlink',
        moduleId: 'uart_core',
        name: 'u_uart_downlink',
        position: { x: 1000, y: 340 },
        parameters: { BAUD_DIVISOR: 434 }
      },
      {
        id: 'status_gpio',
        moduleId: 'gpio_controller',
        name: 'u_status_gpio',
        position: { x: 1000, y: 100 },
        parameters: { WIDTH: 8 }
      }
    ],
    nets: [
      {
        id: 'net_mclk',
        name: 'clk',
        width: 1,
        source: { instanceId: 'master_clk', portId: 'clk_out' },
        targets: [
          { instanceId: 'clk_div', portId: 'clk_in' },
          { instanceId: 'telem_fifo', portId: 'clk' },
          { instanceId: 'uart_downlink', portId: 'clk' },
          { instanceId: 'status_gpio', portId: 'clk' }
        ]
      },
      {
        id: 'net_mrst',
        name: 'rst_n',
        width: 1,
        source: { instanceId: 'master_clk', portId: 'rst_n_out' },
        targets: [
          { instanceId: 'clk_div', portId: 'rst_n' },
          { instanceId: 'i2c_sensor', portId: 'rst_n' },
          { instanceId: 'telem_fifo', portId: 'rst_n' },
          { instanceId: 'uart_downlink', portId: 'rst_n' },
          { instanceId: 'status_gpio', portId: 'rst_n' }
        ]
      },
      {
        id: 'net_div_clk',
        name: 'divided_clk',
        width: 1,
        source: { instanceId: 'clk_div', portId: 'clk_out' },
        targets: [{ instanceId: 'i2c_sensor', portId: 'clk' }]
      },
      {
        id: 'net_sensor_data',
        name: 'sensor_dout_to_fifo',
        width: 8,
        source: { instanceId: 'i2c_sensor', portId: 'dout' },
        targets: [{ instanceId: 'telem_fifo', portId: 'din' }]
      },
      {
        id: 'net_sensor_busy_wr',
        name: 'sensor_busy_to_wr',
        width: 1,
        source: { instanceId: 'i2c_sensor', portId: 'busy' },
        targets: [{ instanceId: 'telem_fifo', portId: 'wr_en' }]
      },
      {
        id: 'net_fifo_dout',
        name: 'fifo_data_bus',
        width: 8,
        source: { instanceId: 'telem_fifo', portId: 'dout' },
        targets: [
          { instanceId: 'uart_downlink', portId: 'tx_data' },
          { instanceId: 'status_gpio', portId: 'out_val' }
        ]
      },
      {
        id: 'net_fifo_empty_to_tx_valid',
        name: 'fifo_not_empty_strobe',
        width: 1,
        source: { instanceId: 'telem_fifo', portId: 'empty' },
        targets: [{ instanceId: 'uart_downlink', portId: 'tx_valid' }]
      }
    ]
  })
};
