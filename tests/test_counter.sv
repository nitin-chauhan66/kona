`timescale 1ns/1ps

module counter_tb;
  logic clk = 1'b0;
  logic rst_n = 1'b1;
  logic [7:0] count;

  counter dut (
    .clk(clk),
    .rst_n(rst_n),
    .count(count)
  );

  always #5 clk = ~clk;

  initial begin
    // Assert and then release reset so the RTL sees a real negedge.
    #1;
    rst_n = 1'b0;
    #2;
    if (count !== 8'h00) $fatal(1, "counter was not reset");
    #9;
    rst_n = 1'b1;
    @(posedge clk);
    #1;
    if (count !== 8'h01) $fatal(1, "expected 1, got %0d", count);
    @(posedge clk);
    #1;
    if (count !== 8'h02) $fatal(1, "expected 2, got %0d", count);
    @(posedge clk);
    #1;
    if (count !== 8'h03) $fatal(1, "expected 3, got %0d", count);
    $display("counter smoke test passed");
    $finish;
  end
endmodule
