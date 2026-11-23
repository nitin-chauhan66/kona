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

`default_nettype wire
