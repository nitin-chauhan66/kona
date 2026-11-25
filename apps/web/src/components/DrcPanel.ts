import { DrcDiagnostic } from '../../../../packages/core/dist/drc.js';
import { escapeHtml } from '../utils/html.js';

export interface DrcPanelCallbacks {
  onFocusInstance: (instanceId: string) => void;
  onFocusNet: (netId: string) => void;
  onEnsureVisible: () => void;
  onAutoWire?: () => void;
}

/**
 * Renders DRC status in the header chip, sidebar badge, and interactive diagnostics list.
 */
export class DrcPanel {
  private readonly callbacks: DrcPanelCallbacks;

  constructor(callbacks: DrcPanelCallbacks) {
    this.callbacks = callbacks;
    this.bindToggle();
  }

  private bindToggle(): void {
    const drcChip = document.getElementById('drc-status-chip');
    const drcToggle = document.getElementById('drc-panel-toggle');
    const drcContainer = document.querySelector('.drc-panel-container');
    const drcBody = document.getElementById('drc-panel-body');

    const onActivateKey = (e: Event, fn: () => void) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        fn();
      }
    };

    const toggleDrc = () => {
      if (!drcBody || !drcContainer) return;
      const collapsed = drcContainer.classList.toggle('collapsed');
      drcBody.style.display = collapsed ? 'none' : 'flex';
    };
    drcToggle?.addEventListener('click', toggleDrc);
    drcToggle?.addEventListener('keydown', (e) => onActivateKey(e, toggleDrc));

    const openDrc = () => {
      this.callbacks.onEnsureVisible();
      if (drcBody && drcContainer) {
        drcContainer.classList.remove('collapsed');
        drcBody.style.display = 'flex';
      }
    };
    drcChip?.addEventListener('click', openDrc);
    drcChip?.addEventListener('keydown', (e) => onActivateKey(e, openDrc));
  }

  public update(diagnostics: DrcDiagnostic[]): void {
    const chipEl = document.getElementById('drc-status-chip');
    const badgeEl = document.getElementById('drc-badge-count');
    const panelEl = document.getElementById('drc-panel-body');

    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');

    if (chipEl) {
      if (errors.length > 0) {
        chipEl.className = 'status-chip error md-chip';
        chipEl.textContent = `${errors.length} DRC Error${errors.length > 1 ? 's' : ''}`;
      } else if (warnings.length > 0) {
        chipEl.className = 'status-chip warning md-chip';
        chipEl.textContent = `${warnings.length} DRC Warning${warnings.length > 1 ? 's' : ''}`;
      } else {
        chipEl.className = 'status-chip success md-chip';
        chipEl.textContent = 'DRC Passed';
      }
    }

    if (badgeEl) {
      if (errors.length > 0) {
        badgeEl.className = 'drc-header-badge md-badge-pill error';
        badgeEl.textContent = `${errors.length} Error${errors.length > 1 ? 's' : ''}`;
      } else if (warnings.length > 0) {
        badgeEl.className = 'drc-header-badge md-badge-pill warning';
        badgeEl.textContent = `${warnings.length} Warning${warnings.length > 1 ? 's' : ''}`;
      } else {
        badgeEl.className = 'drc-header-badge md-badge-pill';
        badgeEl.textContent = '0 Errors';
      }
    }

    if (!panelEl) return;

    if (diagnostics.length === 0) {
      panelEl.innerHTML = '<div class="drc-empty">All design rules satisfied. Clean netlist!</div>';
      return;
    }

    const hasFixableWiring = diagnostics.some(
      d => d.rule === 'UNCONNECTED_CLOCK' || d.rule === 'UNCONNECTED_RESET' || d.rule === 'DANGLING_NET'
    );

    const fixBannerHtml = hasFixableWiring && this.callbacks.onAutoWire
      ? `<button type="button" id="btn-auto-wire" class="btn-auto-wire" title="Automatically connect clock and reset pins">Auto-Wire Clocks &amp; Fix</button>`
      : '';

    panelEl.innerHTML = fixBannerHtml + diagnostics.map(d => {
      const targetAttr = d.instanceId
        ? `data-focus-inst="${escapeHtml(d.instanceId)}"`
        : d.netId
          ? `data-focus-net="${escapeHtml(d.netId)}"`
          : '';
      return `
        <div class="drc-item ${d.severity} ${targetAttr ? 'clickable' : ''}" ${targetAttr} title="${targetAttr ? 'Click to focus on canvas' : ''}">
          <div class="drc-item-rule">${d.rule}</div>
          <div class="drc-item-msg">${escapeHtml(d.message)}</div>
        </div>
      `;
    }).join('');

    document.getElementById('btn-auto-wire')?.addEventListener('click', () => {
      this.callbacks.onAutoWire?.();
    });

    panelEl.querySelectorAll('.drc-item.clickable').forEach(item => {
      item.addEventListener('click', () => {
        const instId = item.getAttribute('data-focus-inst');
        const netId = item.getAttribute('data-focus-net');
        if (instId) this.callbacks.onFocusInstance(instId);
        else if (netId) this.callbacks.onFocusNet(netId);
      });
    });
  }
}
