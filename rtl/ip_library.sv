/**
 * Starter IP Synthesizable SystemVerilog Library
 * 
 * Provides IEEE 1800-2017 compliant synthesizable models for all
 * starter IP blocks in Kona:
 * - picorv32
 * - axi_crossbar
 * - ram_dual_port
 * - uart_core
 * - gpio_controller
 * - sync_fifo
 * - clock_divider
 * - clock_gen
 */

`timescale 1ns / 1ps
`default_nettype none

// 1. Clock & Reset Generator
module clock_gen #(
  parameter integer FREQ_MHZ = 50
) (
  output logic clk_out,
  output logic rst_n_out
);
  initial begin
    clk_out = 1'b0;
    rst_n_out = 1'b0;
  end
endmodule

// 2. PicoRV32 Core Stub
module picorv32 #(
  parameter bit ENABLE_COUNTERS = 1'b1,
  parameter bit ENABLE_MUL = 1'b1,
  parameter bit ENABLE_DIV = 1'b1,
  parameter bit BARREL_SHIFTER = 1'b1,
  parameter integer STACKADDR = 65536
) (
  input  logic        clk,
  input  logic        resetn,
  output logic        mem_valid,
  output logic        mem_instr,
  input  logic        mem_ready,
  output logic [31:0] mem_addr,
  output logic [31:0] mem_wdata,
  output logic [ 3:0] mem_wstrb,
  input  logic [31:0] mem_rdata,
  output logic        trap
);
  always_ff @(posedge clk or negedge resetn) begin
    if (!resetn) begin
      mem_valid <= 1'b0;
      mem_instr <= 1'b0;
      mem_addr  <= 32'h0;
      mem_wdata <= 32'h0;
      mem_wstrb <= 4'h0;
      trap      <= 1'b0;
    end else begin
      mem_valid <= 1'b1;
      mem_instr <= 1'b1;
      mem_addr  <= mem_ready ? mem_addr + 4 : mem_addr;
      trap      <= 1'b0;
    end
  end
endmodule

// 3. AXI-Lite Crossbar
module axi_crossbar #(
  parameter integer S0_BASE_ADDR = 0,
  parameter integer S0_ADDR_MASK = 65535,
  parameter integer S1_BASE_ADDR = 268435456,
  parameter integer S1_ADDR_MASK = 65535
) (
  input  logic        clk,
  input  logic        rst_n,
  // Master Port
  input  logic [31:0] m_addr,
  input  logic        m_valid,
  output logic        m_ready,
  output logic [31:0] m_rdata,
  // Slave 0 (RAM)
  output logic [31:0] s0_addr,
  output logic        s0_valid,
  input  logic        s0_ready,
  input  logic [31:0] s0_rdata,
  // Slave 1 (Peripherals)
  output logic [31:0] s1_addr,
  output logic        s1_valid,
  input  logic        s1_ready,
  input  logic [31:0] s1_rdata
);
  logic sel_s1;
  assign sel_s1 = (m_addr >= S1_BASE_ADDR);

  assign s0_addr  = m_addr;
  assign s0_valid = m_valid && !sel_s1;

  assign s1_addr  = m_addr;
  assign s1_valid = m_valid && sel_s1;

  assign m_ready  = sel_s1 ? s1_ready : s0_ready;
  assign m_rdata  = sel_s1 ? s1_rdata : s0_rdata;
endmodule

// 4. Synchronous Dual-Port RAM
module ram_dual_port #(
  parameter integer ADDR_WIDTH = 14,
  parameter integer DATA_WIDTH = 32
) (
  input  logic        clk,
  input  logic        en,
  input  logic        we,
  input  logic [31:0] addr,
  input  logic [31:0] din,
  output logic [31:0] dout
);
  localparam integer DEPTH = 1 << ADDR_WIDTH;
  logic [DATA_WIDTH-1:0] mem [0:DEPTH-1];

  always_ff @(posedge clk) begin
    if (en) begin
      if (we) begin
        mem[addr[ADDR_WIDTH-1:0]] <= din[DATA_WIDTH-1:0];
      end
      dout <= mem[addr[ADDR_WIDTH-1:0]];
    end
  end
endmodule

// 5. UART Transceiver
module uart_core #(
  parameter integer BAUD_DIVISOR = 434
) (
  input  logic       clk,
  input  logic       rst_n,
  input  logic       rx,
  output logic       tx,
  input  logic [7:0] tx_data,
  input  logic       tx_valid,
  output logic       tx_busy,
  output logic [7:0] rx_data,
  output logic       rx_valid
);
  logic [15:0] baud_cnt;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      tx       <= 1'b1;
      tx_busy  <= 1'b0;
      rx_data  <= 8'h00;
      rx_valid <= 1'b0;
      baud_cnt <= 16'h0;
    end else begin
      if (tx_valid && !tx_busy) begin
        tx_busy <= 1'b1;
      end else if (tx_busy) begin
        tx_busy <= 1'b0;
      end
    end
  end
endmodule

// 6. GPIO Controller
module gpio_controller #(
  parameter integer WIDTH = 8
) (
  input  logic             clk,
  input  logic             rst_n,
  input  logic [WIDTH-1:0] out_val,
  output logic [WIDTH-1:0] in_val,
  inout  wire  [WIDTH-1:0] gpio_pins
);
  logic [WIDTH-1:0] sync_reg;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      sync_reg <= '0;
      in_val   <= '0;
    end else begin
      sync_reg <= gpio_pins;
      in_val   <= sync_reg;
    end
  end

  assign gpio_pins = out_val;
endmodule

// 7. Synchronous FIFO
module sync_fifo #(
  parameter integer WIDTH = 32,
  parameter integer DEPTH = 16
) (
  input  logic             clk,
  input  logic             rst_n,
  input  logic             wr_en,
  input  logic [WIDTH-1:0] din,
  output logic             full,
  input  logic             rd_en,
  output logic [WIDTH-1:0] dout,
  output logic             empty
);
  localparam integer PTR_WIDTH = $clog2(DEPTH);
  logic [WIDTH-1:0] queue [0:DEPTH-1];
  logic [PTR_WIDTH:0] wr_ptr;
  logic [PTR_WIDTH:0] rd_ptr;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      wr_ptr <= '0;
      rd_ptr <= '0;
      dout   <= '0;
    end else begin
      if (wr_en && !full) begin
        queue[wr_ptr[PTR_WIDTH-1:0]] <= din;
        wr_ptr <= wr_ptr + 1'b1;
      end
      if (rd_en && !empty) begin
        dout <= queue[rd_ptr[PTR_WIDTH-1:0]];
        rd_ptr <= rd_ptr + 1'b1;
      end
    end
  end

  assign full  = (wr_ptr[PTR_WIDTH] != rd_ptr[PTR_WIDTH]) &&
                 (wr_ptr[PTR_WIDTH-1:0] == rd_ptr[PTR_WIDTH-1:0]);
  assign empty = (wr_ptr == rd_ptr);
endmodule

// 8. Clock Divider
module clock_divider #(
  parameter integer DIVISOR = 4
) (
  input  logic clk_in,
  input  logic rst_n,
  output logic clk_out
);
  logic [31:0] counter;

  always_ff @(posedge clk_in or negedge rst_n) begin
    if (!rst_n) begin
      counter <= 16'h0;
      clk_out <= 1'b0;
    end else begin
      if (counter >= (DIVISOR / 2 - 1)) begin
        counter <= 16'h0;
        clk_out <= ~clk_out;
      end else begin
        counter <= counter + 1'b1;
      end
    end
  end
endmodule

// 9. lowRISC Ibex RISC-V Core (OpenTitan)
module ibex #(
  parameter bit PMP_ENABLE = 1'b0,
  parameter bit RV32M      = 1'b1,
  parameter bit RV32B      = 1'b0
) (
  input  logic        clk,
  input  logic        rst_n,
  // Instruction Memory Interface
  output logic        instr_req,
  input  logic        instr_gnt,
  input  logic        instr_rvalid,
  output logic [31:0] instr_addr,
  input  logic [31:0] instr_rdata,
  // Data Memory Interface
  output logic        data_req,
  input  logic        data_gnt,
  input  logic        data_rvalid,
  output logic        data_we,
  output logic [31:0] data_addr,
  output logic [31:0] data_wdata,
  input  logic [31:0] data_rdata,
  // Interrupts
  input  logic        irq_software,
  input  logic        irq_timer,
  input  logic        irq_external
);
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      instr_req  <= 1'b0;
      instr_addr <= 32'h0000_0000;
      data_req   <= 1'b0;
      data_we    <= 1'b0;
      data_addr  <= 32'h0000_0000;
      data_wdata <= 32'h0000_0000;
    end else begin
      instr_req  <= 1'b1;
      instr_addr <= instr_gnt ? instr_addr + 4 : instr_addr;
      data_req   <= 1'b1;
      data_addr  <= data_gnt ? data_addr + 4 : data_addr;
    end
  end
endmodule

// 10. Wishbone B4 Crossbar (LiteX Interconnect)
module wishbone_crossbar #(
  parameter integer S0_BASE_ADDR = 0,
  parameter integer S1_BASE_ADDR = 268435456
) (
  input  logic        clk,
  input  logic        rst_n,
  // Master Port
  input  logic        wb_cyc_i,
  input  logic        wb_stb_i,
  input  logic        wb_we_i,
  input  logic [31:0] wb_adr_i,
  input  logic [31:0] wb_dat_i,
  output logic [31:0] wb_dat_o,
  output logic        wb_ack_o,
  // Slave 0 (Memory)
  output logic        s0_cyc_o,
  output logic        s0_stb_o,
  output logic [31:0] s0_adr_o,
  output logic [31:0] s0_dat_o,
  input  logic [31:0] s0_dat_i,
  input  logic        s0_ack_i,
  // Slave 1 (Peripherals)
  output logic        s1_cyc_o,
  output logic        s1_stb_o,
  output logic [31:0] s1_adr_o,
  output logic [31:0] s1_dat_o,
  input  logic [31:0] s1_dat_i,
  input  logic        s1_ack_i
);
  logic sel_s1;
  assign sel_s1 = (wb_adr_i >= S1_BASE_ADDR);

  assign s0_cyc_o = wb_cyc_i && !sel_s1;
  assign s0_stb_o = wb_stb_i && !sel_s1;
  assign s0_adr_o = wb_adr_i;
  assign s0_dat_o = wb_dat_i;

  assign s1_cyc_o = wb_cyc_i && sel_s1;
  assign s1_stb_o = wb_stb_i && sel_s1;
  assign s1_adr_o = wb_adr_i;
  assign s1_dat_o = wb_dat_i;

  assign wb_dat_o = sel_s1 ? s1_dat_i : s0_dat_i;
  assign wb_ack_o = sel_s1 ? s1_ack_i : s0_ack_i;
endmodule

// 11. SPI Master Controller
module spi_controller #(
  parameter integer CLK_DIV    = 8,
  parameter integer DATA_WIDTH = 8
) (
  input  logic                  clk,
  input  logic                  rst_n,
  input  logic [DATA_WIDTH-1:0] tx_data,
  input  logic                  tx_valid,
  output logic                  tx_ready,
  output logic [DATA_WIDTH-1:0] rx_data,
  output logic                  rx_valid,
  output logic                  spi_sclk,
  output logic                  spi_cs_n,
  output logic                  spi_mosi,
  input  logic                  spi_miso
);
  logic [3:0] bit_cnt;
  logic [7:0] shift_reg;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      tx_ready  <= 1'b1;
      rx_data   <= '0;
      rx_valid  <= 1'b0;
      spi_sclk  <= 1'b0;
      spi_cs_n  <= 1'b1;
      spi_mosi  <= 1'b0;
      bit_cnt   <= '0;
      shift_reg <= '0;
    end else begin
      if (tx_valid && tx_ready) begin
        shift_reg <= tx_data;
        spi_cs_n  <= 1'b0;
        tx_ready  <= 1'b0;
        bit_cnt   <= 4'd8;
      end else if (!spi_cs_n) begin
        spi_sclk <= ~spi_sclk;
        if (spi_sclk) begin
          spi_mosi <= shift_reg[7];
          shift_reg <= {shift_reg[6:0], spi_miso};
          bit_cnt <= bit_cnt - 1'b1;
          if (bit_cnt == 4'd1) begin
            spi_cs_n <= 1'b1;
            tx_ready <= 1'b1;
            rx_data  <= shift_reg;
            rx_valid <= 1'b1;
          end
        end
      end else begin
        rx_valid <= 1'b0;
      end
    end
  end
endmodule

// 12. I2C Master Controller
module i2c_controller #(
  parameter integer PRESCALE = 125
) (
  input  logic       clk,
  input  logic       rst_n,
  input  logic [7:0] addr,
  input  logic [7:0] din,
  input  logic       start,
  output logic       busy,
  output logic [7:0] dout,
  output logic       ack_err,
  output logic       scl,
  output logic       sda_out,
  input  logic       sda_in
);
  logic [15:0] clk_div;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      busy     <= 1'b0;
      dout     <= 8'h00;
      ack_err  <= 1'b0;
      scl      <= 1'b1;
      sda_out  <= 1'b1;
      clk_div  <= '0;
    end else begin
      if (start && !busy) begin
        busy    <= 1'b1;
        scl     <= 1'b0;
        sda_out <= 1'b0;
        dout    <= din;
      end else if (busy) begin
        clk_div <= clk_div + 1'b1;
        if (clk_div >= PRESCALE) begin
          clk_div <= '0;
          busy    <= 1'b0;
          scl     <= 1'b1;
          sda_out <= 1'b1;
        end
      end
    end
  end
endmodule

// 13. 32-bit System Timer & Watchdog
module timer_core #(
  parameter integer PRESCALER = 50
) (
  input  logic        clk,
  input  logic        rst_n,
  input  logic [31:0] addr,
  input  logic [31:0] wdata,
  input  logic        we,
  output logic [31:0] rdata,
  output logic        irq
);
  logic [31:0] timer_val;
  logic [31:0] compare_val;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      timer_val   <= 32'h0;
      compare_val <= 32'hFFFF_FFFF;
      rdata       <= 32'h0;
      irq         <= 1'b0;
    end else begin
      timer_val <= timer_val + 1'b1;
      if (we) begin
        if (addr[3:0] == 4'h0) timer_val <= wdata;
        else if (addr[3:0] == 4'h4) compare_val <= wdata;
      end
      rdata <= (addr[3:0] == 4'h4) ? compare_val : timer_val;
      irq   <= (timer_val >= compare_val);
    end
  end
endmodule

`default_nettype wire
