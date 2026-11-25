import { KonaDesign } from '../../ir.js';
import { KonaTemplateDef } from '../registry.js';

export const UART_LOOPBACK_TEMPLATE: KonaTemplateDef = {
  id: 'uart_loopback',
  name: 'UART + FIFO Loopback Processor',
  description: 'UART receiver feeding a FIFO queue connected to GPIO indicators and UART transmitter',
  createDesign: (): KonaDesign => ({
    version: '1.0',
    name: 'UART FIFO Loopback',
    topModule: 'top',
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      description: 'UART Loopback with Synchronous FIFO buffer'
    },
    instances: [
      {
        id: 'clk_gen_0',
        moduleId: 'clock_gen',
        name: 'u_clk',
        position: { x: 80, y: 150 },
        parameters: { FREQ_MHZ: 50 }
      },
      {
        id: 'uart_inst',
        moduleId: 'uart_core',
        name: 'u_uart',
        position: { x: 360, y: 120 },
        parameters: { BAUD_DIVISOR: 434 }
      },
      {
        id: 'fifo_inst',
        moduleId: 'sync_fifo',
        name: 'u_fifo',
        position: { x: 680, y: 120 },
        parameters: { WIDTH: 8, DEPTH: 16 }
      },
      {
        id: 'gpio_inst',
        moduleId: 'gpio_controller',
        name: 'u_gpio',
        position: { x: 980, y: 140 },
        parameters: { WIDTH: 8 }
      }
    ],
    nets: [
      {
        id: 'clk_net',
        name: 'clk',
        width: 1,
        source: { instanceId: 'clk_gen_0', portId: 'clk_out' },
        targets: [
          { instanceId: 'uart_inst', portId: 'clk' },
          { instanceId: 'fifo_inst', portId: 'clk' },
          { instanceId: 'gpio_inst', portId: 'clk' }
        ]
      },
      {
        id: 'rst_net',
        name: 'rst_n',
        width: 1,
        source: { instanceId: 'clk_gen_0', portId: 'rst_n_out' },
        targets: [
          { instanceId: 'uart_inst', portId: 'rst_n' },
          { instanceId: 'fifo_inst', portId: 'rst_n' },
          { instanceId: 'gpio_inst', portId: 'rst_n' }
        ]
      },
      {
        id: 'net_rx_valid_wr_en',
        name: 'rx_to_fifo_wr',
        width: 1,
        source: { instanceId: 'uart_inst', portId: 'rx_valid' },
        targets: [{ instanceId: 'fifo_inst', portId: 'wr_en' }]
      },
      {
        id: 'net_rx_data_din',
        name: 'rx_to_fifo_data',
        width: 8,
        source: { instanceId: 'uart_inst', portId: 'rx_data' },
        targets: [{ instanceId: 'fifo_inst', portId: 'din' }]
      },
      {
        id: 'net_fifo_dout_gpio',
        name: 'fifo_data_to_gpio',
        width: 8,
        source: { instanceId: 'fifo_inst', portId: 'dout' },
        targets: [{ instanceId: 'gpio_inst', portId: 'out_val' }]
      }
    ]
  })
};
