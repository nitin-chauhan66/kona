`timescale 1ns/1ps

module counter #(
  parameter int WIDTH = 8
) (
  input  logic             clk,
  input  logic             rst_n,
  output logic [WIDTH-1:0] count
);
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      count <= '0;
    end else begin
      count <= count + 1'b1;
    end
  end
endmodule
