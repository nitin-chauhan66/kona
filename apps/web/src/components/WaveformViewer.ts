/**
 * Interactive VCD Waveform Viewer (FR-1.5)
 *
 * Renders digital signals, scalar waveforms, vector bus transitions,
 * time cursors, drag-scrubbing, wheel zoom, and radix formatting (Hex, Dec, Bin).
 */

import { VcdTrace, formatSignalValue } from '../../../../packages/core/dist/vcd.js';

export class WaveformViewer {
  private readonly container: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private trace: VcdTrace | null = null;
  private radix: 'hex' | 'dec' | 'bin' = 'hex';
  private zoom = 1.0;
  private panOffset = 20;
  private cursorTime: number | null = null;
  private scrollY = 0;
  private needsFit = false;
  private isScrubbing = false;
  private resizeObserver: ResizeObserver | null = null;

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
            <label for="wf-radix-select">Radix:</label>
            <select id="wf-radix-select" class="wf-select">
              <option value="hex" selected>Hex</option>
              <option value="dec">Dec</option>
              <option value="bin">Bin</option>
            </select>
          </div>
          <span class="wf-hint">Click or drag timeline to scrub cursor &bull; Scroll to zoom</span>
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
    this.setupResizeObserver();
    this.resize();
  }

  private setupResizeObserver(): void {
    const wrap = this.canvas.parentElement;
    if (wrap && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(wrap);
    }
  }

  public setTrace(trace: VcdTrace): void {
    this.trace = trace;
    this.cursorTime = 0;
    this.scrollY = 0;
    this.needsFit = true;
    this.rebuildSidebar();
    this.fitTimeline();
    this.render();
  }

  public setRadix(radix: 'hex' | 'dec' | 'bin'): void {
    this.radix = radix;
    this.updateSidebarValues();
    this.render();
  }

  public resize(): void {
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.resetTransform?.();

    if (this.needsFit && this.trace) {
      this.fitTimeline();
    }
    this.render();
  }

  private fitTimeline(): void {
    if (!this.trace || this.trace.maxTime <= 0) return;
    const wrap = this.canvas.parentElement;
    const rectW = wrap?.getBoundingClientRect().width || wrap?.clientWidth || 0;
    if (rectW <= 40) {
      this.needsFit = true;
      this.zoom = Math.max(2, 540 / this.trace.maxTime);
      this.panOffset = 20;
      return;
    }
    this.zoom = Math.max(0.5, (rectW - 48) / this.trace.maxTime);
    this.panOffset = 20;
    this.needsFit = false;
  }

  private updateCursorFromClientX(clientX: number): void {
    if (!this.trace) return;
    const rect = this.canvas.getBoundingClientRect();
    const time = Math.round((clientX - rect.left - this.panOffset) / this.zoom);
    this.cursorTime = Math.max(0, Math.min(this.trace.maxTime, time));
    this.render();
  }

  private setupEvents(): void {
    this.container.querySelector('#wf-zoom-in')?.addEventListener('click', () => {
      this.zoom *= 1.25;
      this.render();
    });

    this.container.querySelector('#wf-zoom-out')?.addEventListener('click', () => {
      this.zoom = Math.max(0.2, this.zoom / 1.25);
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

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.trace) return;
      this.isScrubbing = true;
      this.updateCursorFromClientX(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isScrubbing || !this.trace) return;
      this.updateCursorFromClientX(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      this.isScrubbing = false;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.trace || e.touches.length !== 1) return;
      e.preventDefault();
      this.isScrubbing = true;
      this.updateCursorFromClientX(e.touches[0].clientX);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isScrubbing || !this.trace || e.touches.length !== 1) return;
      e.preventDefault();
      this.updateCursorFromClientX(e.touches[0].clientX);
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.isScrubbing = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      if (!this.trace) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.zoom = Math.max(0.2, Math.min(40, this.zoom * factor));
      this.render();
    }, { passive: false });

    const sb = this.container.querySelector('#wf-sidebar') as HTMLElement | null;
    sb?.addEventListener('scroll', () => {
      this.scrollY = sb.scrollTop;
      this.render();
    });

    window.addEventListener('resize', () => this.resize());
  }

  public render(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr || this.canvas.clientWidth || 600;
    const h = this.canvas.height / dpr || this.canvas.clientHeight || 200;

    if (!this.trace) {
      this.ctx.save();
      this.ctx.scale(dpr, dpr);
      this.ctx.fillStyle = '#0e1117';
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.fillStyle = '#8e919a';
      this.ctx.font = '13px "Google Sans", "Roboto", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        'No simulation trace loaded. Click "Run Simulation" above to inspect live waveforms.',
        w / 2,
        Math.max(48, h / 2)
      );
      this.ctx.restore();
      return;
    }

    const rowHeight = 36;
    const headerHeight = 28;

    this.ctx.save();
    this.ctx.scale(dpr, dpr);

    this.ctx.fillStyle = '#0e1117';
    this.ctx.fillRect(0, 0, w, h);

    this.updateSidebarValues();

    // Clip signal traces below the sticky timeline header and apply sidebar vertical scroll
    this.ctx.save();
    if (typeof this.ctx.rect === 'function' && typeof this.ctx.clip === 'function') {
      this.ctx.beginPath();
      this.ctx.rect(0, headerHeight, w, Math.max(0, h - headerHeight));
      this.ctx.clip();
    }

    let y = headerHeight - this.scrollY;
    for (const sig of this.trace.signals) {
      if (y + rowHeight >= headerHeight && y <= h) {
        const changes = this.trace.signalChanges.get(sig.name) || [];
        this.drawSignalRow(y, rowHeight, sig.width, changes, w);
      }
      y += rowHeight;
    }
    this.ctx.restore();

    this.drawTimelineHeader(w, headerHeight, h);

    if (this.cursorTime !== null) {
      const cursorX = this.panOffset + this.cursorTime * this.zoom;
      this.ctx.strokeStyle = '#f2b8b5';
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

  private drawTimelineHeader(w: number, headerH: number, totalH: number): void {
    this.ctx.fillStyle = '#1a1d26';
    this.ctx.fillRect(0, 0, w, headerH);
    this.ctx.strokeStyle = '#44474f';
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerH);
    this.ctx.lineTo(w, headerH);
    this.ctx.stroke();

    if (!this.trace) return;
    const maxT = this.trace.maxTime || 100;
    const rawStep = Math.max(5, Math.pow(10, Math.floor(Math.log10(maxT / 5))));
    const tickStep = rawStep * this.zoom < 40 ? rawStep * 2 : rawStep;

    this.ctx.fillStyle = '#8e919a';
    this.ctx.font = '10px "Roboto Mono", monospace';
    this.ctx.textAlign = 'left';

    for (let t = 0; t <= maxT; t += tickStep) {
      const x = this.panOffset + t * this.zoom;
      if (x < 0 || x > w) continue;

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.beginPath();
      this.ctx.moveTo(x, headerH);
      this.ctx.lineTo(x, totalH);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(x, headerH - 6);
      this.ctx.lineTo(x, headerH);
      this.ctx.strokeStyle = '#44474f';
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
    this.ctx.strokeStyle = '#1e232e';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y + rowH);
    this.ctx.lineTo(canvasW, y + rowH);
    this.ctx.stroke();

    const highY = y + 8;
    const lowY = y + rowH - 8;
    const midY = (highY + lowY) / 2;

    if (width === 1) {
      this.ctx.strokeStyle = '#6dd58c';
      this.ctx.lineWidth = 1.8;
      this.ctx.beginPath();

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
      }

      if (this.trace) {
        this.ctx.lineTo(this.panOffset + this.trace.maxTime * this.zoom, prevY);
      }
      this.ctx.stroke();
      return;
    }

    this.ctx.lineWidth = 1.4;
    let prevX = this.panOffset;
    let prevVal = '0';

    for (const ch of changes) {
      const nextX = this.panOffset + ch.time * this.zoom;
      if (nextX > prevX + 2) {
        this.drawBusSegment(prevX, nextX, highY, midY, lowY, prevVal, width);
      }
      prevX = nextX;
      prevVal = ch.value;
    }

    if (this.trace) {
      const endX = this.panOffset + this.trace.maxTime * this.zoom;
      if (endX > prevX) {
        this.drawBusSegment(prevX, endX, highY, midY, lowY, prevVal, width, true);
      }
    }
  }

  private drawBusSegment(
    startX: number,
    endX: number,
    highY: number,
    midY: number,
    lowY: number,
    rawValue: string,
    width: number,
    flatEnd = false
  ): void {
    this.ctx.strokeStyle = '#7fcfff';
    this.ctx.fillStyle = '#004d67';
    this.ctx.beginPath();
    this.ctx.moveTo(startX + 2, highY);
    if (flatEnd) {
      this.ctx.lineTo(endX, highY);
      this.ctx.lineTo(endX, lowY);
    } else {
      this.ctx.lineTo(endX - 2, highY);
      this.ctx.lineTo(endX, midY);
      this.ctx.lineTo(endX - 2, lowY);
    }
    this.ctx.lineTo(startX + 2, lowY);
    this.ctx.lineTo(startX, midY);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    if (endX - startX > 32) {
      const formatted = formatSignalValue(rawValue, width, this.radix);
      this.ctx.fillStyle = '#c2e7ff';
      this.ctx.font = '10px "Roboto Mono", monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(formatted, startX + 6, midY + 3.5);
    }
  }

  private getCursorSignalValue(sigName: string, width: number): string {
    if (!this.trace) return formatSignalValue('0', width, this.radix);
    let curVal = '0';
    const changes = this.trace.signalChanges.get(sigName) || [];
    for (const ch of changes) {
      if (this.cursorTime !== null && ch.time <= this.cursorTime) {
        curVal = ch.value;
      } else if (this.cursorTime === null) {
        break;
      }
    }
    return formatSignalValue(curVal, width, this.radix);
  }

  private rebuildSidebar(): void {
    const sb = this.container.querySelector('#wf-sidebar') as HTMLElement | null;
    if (!sb || !this.trace) return;

    let html = '<div class="wf-sidebar-header">Signal</div>';
    for (const sig of this.trace.signals) {
      const formattedVal = this.getCursorSignalValue(sig.name, sig.width);
      const isBus = sig.width > 1;

      html += `
        <div class="wf-sig-row ${isBus ? 'is-bus' : ''}">
          <span class="wf-sig-name" title="${sig.name}">${sig.name}</span>
          <span class="wf-sig-val" data-sig-name="${sig.name}">${formattedVal}</span>
        </div>
      `;
    }
    sb.innerHTML = html;
    sb.scrollTop = 0;
  }

  private updateSidebarValues(): void {
    const sb = this.container.querySelector('#wf-sidebar');
    if (!sb || !this.trace) return;
    if (!sb.querySelector('.wf-sig-row')) {
      this.rebuildSidebar();
      return;
    }
    for (const sig of this.trace.signals) {
      const valEl = sb.querySelector(`.wf-sig-val[data-sig-name="${sig.name}"]`);
      if (valEl) {
        valEl.textContent = this.getCursorSignalValue(sig.name, sig.width);
      }
    }
  }
}
