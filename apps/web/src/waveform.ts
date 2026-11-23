/**
 * Interactive VCD Waveform Viewer (FR-1.5)
 *
 * Renders digital signals, scalar waveforms, vector bus transitions,
 * time cursors, and radix formatting (Hex, Dec, Bin).
 */

import { VcdTrace, formatSignalValue } from '../../../packages/core/dist/vcd.js';

export class WaveformViewer {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private trace: VcdTrace | null = null;
  private radix: 'hex' | 'dec' | 'bin' = 'hex';
  private zoom = 1.0;
  private panOffset = 0;
  private cursorTime: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.innerHTML = `
      <div class="waveform-shell">
        <div class="waveform-toolbar">
          <div class="wf-btn-group">
            <button class="wf-btn" id="wf-zoom-in" title="Zoom In">+</button>
            <button class="wf-btn" id="wf-zoom-out" title="Zoom Out">-</button>
            <button class="wf-btn" id="wf-zoom-reset" title="Fit Timeline">Fit</button>
          </div>
          <div class="wf-radix-picker">
            <label>Radix:</label>
            <select id="wf-radix-select" class="wf-select">
              <option value="hex" selected>Hex</option>
              <option value="dec">Dec</option>
              <option value="bin">Bin</option>
            </select>
          </div>
          <div class="wf-cursor-info" id="wf-cursor-val">Cursor: None</div>
        </div>
        <div class="waveform-body">
          <div class="waveform-sidebar" id="wf-sidebar"></div>
          <div class="waveform-canvas-wrap">
            <canvas id="wf-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    const canvasEl = this.container.querySelector('#wf-canvas') as HTMLCanvasElement;
    if (!canvasEl) throw new Error('Could not find waveform canvas');
    this.canvas = canvasEl;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) throw new Error('Could not get waveform canvas context');
    this.ctx = ctx;

    this.setupEvents();
    this.resize();
  }

  public setTrace(trace: VcdTrace): void {
    this.trace = trace;
    this.cursorTime = 0;
    this.fitTimeline();
    this.render();
  }

  public setRadix(radix: 'hex' | 'dec' | 'bin'): void {
    this.radix = radix;
    this.render();
  }

  public resize(): void {
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.render();
  }

  private fitTimeline(): void {
    if (!this.trace || this.trace.maxTime <= 0) return;
    const wrap = this.canvas.parentElement;
    const clientW = wrap?.clientWidth || 600;
    this.zoom = (clientW - 60) / this.trace.maxTime;
    this.panOffset = 20;
  }

  private setupEvents(): void {
    this.container.querySelector('#wf-zoom-in')?.addEventListener('click', () => {
      this.zoom *= 1.25;
      this.render();
    });

    this.container.querySelector('#wf-zoom-out')?.addEventListener('click', () => {
      this.zoom = Math.max(0.1, this.zoom / 1.25);
      this.render();
    });

    this.container.querySelector('#wf-zoom-reset')?.addEventListener('click', () => {
      this.fitTimeline();
      this.render();
    });

    const radixSelect = this.container.querySelector('#wf-radix-select') as HTMLSelectElement;
    radixSelect?.addEventListener('change', () => {
      this.setRadix(radixSelect.value as 'hex' | 'dec' | 'bin');
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.trace) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const time = Math.round((clickX - this.panOffset) / this.zoom);
      this.cursorTime = Math.max(0, Math.min(this.trace.maxTime, time));
      this.render();
    });

    window.addEventListener('resize', () => this.resize());
  }

  public render(): void {
    if (!this.trace) {
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '14px system-ui';
      this.ctx.fillText('No simulation trace loaded. Click "Run Local Wasm Sim" to simulate.', 24, 40);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    const rowHeight = 36;
    const headerHeight = 28;

    this.ctx.save();
    this.ctx.scale(dpr, dpr);

    // Canvas Background
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, w, h);

    // Update Sidebar Signal List & Values at cursor
    this.updateSidebar();

    // Draw Timeline Header Ticks
    this.drawTimelineHeader(w, headerHeight);

    // Draw Signal Waves
    let y = headerHeight;
    for (const sig of this.trace.signals) {
      const changes = this.trace.signalChanges.get(sig.name) || [];
      this.drawSignalRow(y, rowHeight, sig.width, changes, w);
      y += rowHeight;
    }

    // Draw Time Cursor
    if (this.cursorTime !== null) {
      const cursorX = this.panOffset + this.cursorTime * this.zoom;
      this.ctx.strokeStyle = '#f43f5e'; // Rose 500
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      this.ctx.moveTo(cursorX, 0);
      this.ctx.lineTo(cursorX, h);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      const infoEl = this.container.querySelector('#wf-cursor-val');
      if (infoEl) infoEl.textContent = `Cursor: ${this.cursorTime} ${this.trace.timescale}`;
    }

    this.ctx.restore();
  }

  private drawTimelineHeader(w: number, headerH: number): void {
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(0, 0, w, headerH);
    this.ctx.strokeStyle = '#334155';
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerH);
    this.ctx.lineTo(w, headerH);
    this.ctx.stroke();

    // Time Ticks
    if (!this.trace) return;
    const maxT = this.trace.maxTime || 100;
    const tickStep = Math.max(5, Math.pow(10, Math.floor(Math.log10(maxT / 5))));

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '10px monospace';

    for (let t = 0; t <= maxT; t += tickStep) {
      const x = this.panOffset + t * this.zoom;
      if (x < 0 || x > w) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(x, headerH - 6);
      this.ctx.lineTo(x, headerH);
      this.ctx.strokeStyle = '#475569';
      this.ctx.stroke();
      this.ctx.fillText(`${t}ns`, x + 3, headerH - 8);
    }
  }

  private drawSignalRow(
    y: number,
    rowH: number,
    width: number,
    changes: { time: number; value: string }[],
    canvasW: number
  ): void {
    // Row background separator
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y + rowH);
    this.ctx.lineTo(canvasW, y + rowH);
    this.ctx.stroke();

    const highY = y + 8;
    const lowY = y + rowH - 8;
    const midY = (highY + lowY) / 2;

    if (width === 1) {
      // 1-bit Digital Square Wave
      this.ctx.strokeStyle = '#38bdf8'; // Cyan
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      let currentVal = '0';
      let prevX = this.panOffset;
      let prevY = lowY;

      this.ctx.moveTo(prevX, prevY);

      for (const ch of changes) {
        const nextX = this.panOffset + ch.time * this.zoom;
        const nextY = ch.value === '1' ? highY : lowY;

        this.ctx.lineTo(nextX, prevY);
        this.ctx.lineTo(nextX, nextY);

        prevX = nextX;
        prevY = nextY;
        currentVal = ch.value;
      }

      // Draw out to max time
      if (this.trace) {
        const endX = this.panOffset + this.trace.maxTime * this.zoom;
        this.ctx.lineTo(endX, prevY);
      }
      this.ctx.stroke();
    } else {
      // Multi-bit Bus Transition Boxes
      this.ctx.strokeStyle = '#a855f7'; // Purple
      this.ctx.fillStyle = '#2e1065';
      this.ctx.lineWidth = 1.5;

      let prevX = this.panOffset;
      let prevVal = '0';

      for (let i = 0; i < changes.length; i++) {
        const ch = changes[i];
        const nextX = this.panOffset + ch.time * this.zoom;

        if (nextX > prevX + 2) {
          // Draw bus transition box
          this.ctx.beginPath();
          this.ctx.moveTo(prevX + 2, highY);
          this.ctx.lineTo(nextX - 2, highY);
          this.ctx.lineTo(nextX, midY);
          this.ctx.lineTo(nextX - 2, lowY);
          this.ctx.lineTo(prevX + 2, lowY);
          this.ctx.lineTo(prevX, midY);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();

          // Value Text
          const formatted = formatSignalValue(prevVal, width, this.radix);
          if (nextX - prevX > 28) {
            this.ctx.fillStyle = '#e9d5ff';
            this.ctx.font = '10px monospace';
            this.ctx.fillText(formatted, prevX + 6, midY + 3);
          }
        }

        prevX = nextX;
        prevVal = ch.value;
      }

      // Trailing bus segment
      if (this.trace) {
        const endX = this.panOffset + this.trace.maxTime * this.zoom;
        if (endX > prevX) {
          this.ctx.beginPath();
          this.ctx.moveTo(prevX + 2, highY);
          this.ctx.lineTo(endX, highY);
          this.ctx.lineTo(endX, lowY);
          this.ctx.lineTo(prevX + 2, lowY);
          this.ctx.lineTo(prevX, midY);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();

          const formatted = formatSignalValue(prevVal, width, this.radix);
          this.ctx.fillStyle = '#e9d5ff';
          this.ctx.font = '10px monospace';
          this.ctx.fillText(formatted, prevX + 6, midY + 3);
        }
      }
    }
  }

  private updateSidebar(): void {
    const sb = this.container.querySelector('#wf-sidebar');
    if (!sb || !this.trace) return;

    let html = '<div class="wf-sidebar-header">Signal</div>';
    for (const sig of this.trace.signals) {
      // Find value at current cursorTime
      let curVal = '0';
      const changes = this.trace.signalChanges.get(sig.name) || [];
      for (const ch of changes) {
        if (this.cursorTime !== null && ch.time <= this.cursorTime) {
          curVal = ch.value;
        } else if (this.cursorTime === null) {
          break;
        }
      }

      const formattedVal = formatSignalValue(curVal, sig.width, this.radix);
      const isBus = sig.width > 1;

      html += `
        <div class="wf-sig-row ${isBus ? 'is-bus' : ''}">
          <span class="wf-sig-name" title="${sig.name}">${sig.name}</span>
          <span class="wf-sig-val">${formattedVal}</span>
        </div>
      `;
    }
    sb.innerHTML = html;
  }
}
