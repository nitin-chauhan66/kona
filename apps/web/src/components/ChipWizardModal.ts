import { autoWireDesign } from '../../../../packages/core/dist/auto-wire.js';
import { STARTER_TEMPLATES } from '../../../../packages/core/dist/catalog.js';
import { KonaDesign, PdkId } from '../../../../packages/core/dist/ir.js';
import { createDefaultSiliconConfig } from '../../../../packages/core/dist/pdk.js';
import { WIZARD_GOALS, WizardGoalId } from '../../../../packages/core/dist/plain-english.js';
import { escapeHtml } from '../utils/html.js';

export interface ChipWizardCallbacks {
  onCreateDesign: (design: KonaDesign, summaryMessage: string) => void;
}

/**
 * 3-Step Guided Chip Creation Wizard for Non-Technical Creators & Students.
 * Translates everyday goals ("Smart Sensor", "Mini Computer", "Security Lock")
 * into a fully wired, DRC-clean chip architecture ready to simulate or export.
 */
export class ChipWizardModal {
  private readonly modalEl: HTMLElement | null;
  private readonly bodyEl: HTMLElement | null;
  private readonly callbacks: ChipWizardCallbacks;
  private selectedGoal: WizardGoalId = 'iot_sensor';
  private chipName = 'My Smart Chip';
  private speedProfile: 'battery' | 'balanced' | 'fast' = 'balanced';
  private targetPdk: PdkId = 'gf180mcuD';
  private addons = {
    gpio: true,
    i2c: false,
    spi: false,
    timer: false
  };

  constructor(callbacks: ChipWizardCallbacks) {
    this.callbacks = callbacks;
    this.modalEl = document.getElementById('chip-wizard-modal');
    this.bodyEl = document.getElementById('chip-wizard-body');
    this.bindStaticEvents();
  }

  private bindStaticEvents(): void {
    document.getElementById('btn-chip-wizard')?.addEventListener('click', () => this.open());
    document.getElementById('wizard-close-btn')?.addEventListener('click', () => this.close());
    this.modalEl?.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });
  }

  public open(): void {
    if (!this.modalEl) return;
    this.render();
    this.modalEl.style.display = 'flex';
  }

  public close(): void {
    if (this.modalEl) this.modalEl.style.display = 'none';
  }

  private render(): void {
    if (!this.bodyEl) return;

    this.bodyEl.innerHTML = `
      <div class="wizard-step-section">
        <div class="wizard-step-label">Step 1 · What should your chip do?</div>
        <div class="wizard-goal-grid">
          ${WIZARD_GOALS.map(g => `
            <button type="button" class="wizard-goal-card ${g.id === this.selectedGoal ? 'active' : ''}" data-goal="${g.id}">
              <strong>${escapeHtml(g.title)}</strong>
              <span>${escapeHtml(g.tagline)}</span>
              <small>Best for: ${escapeHtml(g.bestFor)}</small>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="wizard-step-section">
        <div class="wizard-step-label">Step 2 · Name, Speed &amp; Add-ons</div>
        <div class="wizard-fields-grid">
          <label class="spec-field">
            <span>Give your chip a name</span>
            <input type="text" id="wizard-chip-name" class="kona-input" value="${escapeHtml(this.chipName)}" />
          </label>

          <label class="spec-field">
            <span>Power &amp; Speed Profile</span>
            <select id="wizard-speed-select" class="kona-input">
              <option value="battery" ${this.speedProfile === 'battery' ? 'selected' : ''}>Battery Saver (12 MHz · Ultra Low Power)</option>
              <option value="balanced" ${this.speedProfile === 'balanced' ? 'selected' : ''}>Balanced Everyday (25–50 MHz)</option>
              <option value="fast" ${this.speedProfile === 'fast' ? 'selected' : ''}>High Performance (80 MHz)</option>
            </select>
          </label>

          <label class="spec-field">
            <span>Manufacturing Node (Optional)</span>
            <select id="wizard-pdk-select" class="kona-input">
              <option value="gf180mcuD" ${this.targetPdk === 'gf180mcuD' ? 'selected' : ''}>180nm Rugged Industrial / 5V (GF180MCU)</option>
              <option value="sky130A" ${this.targetPdk === 'sky130A' ? 'selected' : ''}>130nm Standard Open Silicon (SKY130)</option>
              <option value="sg13g2" ${this.targetPdk === 'sg13g2' ? 'selected' : ''}>130nm High-Speed BiCMOS (IHP SG13G2)</option>
            </select>
          </label>
        </div>

        <div class="wizard-addons-row">
          <label class="wizard-addon-chip">
            <input type="checkbox" id="wizard-addon-gpio" ${this.addons.gpio ? 'checked' : ''} />
            <span>LEDs &amp; Buttons (GPIO)</span>
          </label>
          <label class="wizard-addon-chip">
            <input type="checkbox" id="wizard-addon-i2c" ${this.addons.i2c ? 'checked' : ''} />
            <span>Sensor Port (I2C)</span>
          </label>
          <label class="wizard-addon-chip">
            <input type="checkbox" id="wizard-addon-spi" ${this.addons.spi ? 'checked' : ''} />
            <span>Flash / Display Port (SPI)</span>
          </label>
          <label class="wizard-addon-chip">
            <input type="checkbox" id="wizard-addon-timer" ${this.addons.timer ? 'checked' : ''} />
            <span>Alarm &amp; Safety Timer</span>
          </label>
        </div>
      </div>

      <div class="wizard-footer">
        <span class="wizard-hint">Kona automatically places blocks, wires clocks/resets, and validates design rules.</span>
        <button type="button" id="btn-wizard-build" class="btn btn-primary md-btn md-btn-filled">
          Build My Chip
        </button>
      </div>
    `;

    this.bodyEl.querySelectorAll('.wizard-goal-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = btn.getAttribute('data-goal') as WizardGoalId | null;
        if (!g) return;
        this.selectedGoal = g;
        this.render();
      });
    });

    (document.getElementById('wizard-chip-name') as HTMLInputElement | null)?.addEventListener('input', (e) => {
      this.chipName = (e.target as HTMLInputElement).value;
    });
    (document.getElementById('wizard-speed-select') as HTMLSelectElement | null)?.addEventListener('change', (e) => {
      this.speedProfile = (e.target as HTMLSelectElement).value as 'battery' | 'balanced' | 'fast';
    });
    (document.getElementById('wizard-pdk-select') as HTMLSelectElement | null)?.addEventListener('change', (e) => {
      this.targetPdk = (e.target as HTMLSelectElement).value as PdkId;
    });
    (document.getElementById('wizard-addon-gpio') as HTMLInputElement | null)?.addEventListener('change', (e) => {
      this.addons.gpio = (e.target as HTMLInputElement).checked;
    });
    (document.getElementById('wizard-addon-i2c') as HTMLInputElement | null)?.addEventListener('change', (e) => {
      this.addons.i2c = (e.target as HTMLInputElement).checked;
    });
    (document.getElementById('wizard-addon-spi') as HTMLInputElement | null)?.addEventListener('change', (e) => {
      this.addons.spi = (e.target as HTMLInputElement).checked;
    });
    (document.getElementById('wizard-addon-timer') as HTMLInputElement | null)?.addEventListener('change', (e) => {
      this.addons.timer = (e.target as HTMLInputElement).checked;
    });

    document.getElementById('btn-wizard-build')?.addEventListener('click', () => this.buildChip());
  }

  private buildChip(): void {
    const goal = WIZARD_GOALS.find(g => g.id === this.selectedGoal) || WIZARD_GOALS[0];
    const tmpl = STARTER_TEMPLATES.find(t => t.id === goal.templateId) || STARTER_TEMPLATES[0];
    const design = tmpl.createDesign();

    const cleanName = this.chipName.trim() || goal.title;
    design.name = cleanName;
    design.topModule = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/^[0-9]/, 'chip_$&') || 'my_chip';

    const silicon = createDefaultSiliconConfig(this.targetPdk);
    if (this.speedProfile === 'battery') {
      silicon.clockFreqMhz = 12;
    } else if (this.speedProfile === 'fast') {
      silicon.clockFreqMhz = this.targetPdk === 'gf180mcuD' ? 50 : 80;
    }
    design.silicon = silicon;
    design.spec = {
      targetApplication: goal.title,
      author: 'Created with Kona Chip Wizard',
      powerBudgetMw: this.speedProfile === 'battery' ? 25 : 100
    };

    const addAddonIfMissing = (moduleId: string, instName: string, params: Record<string, number | string | boolean>) => {
      if (design.instances.some(i => i.moduleId === moduleId)) return;
      const maxX = Math.max(...design.instances.map(i => i.position.x), 400);
      const maxY = Math.max(...design.instances.map(i => i.position.y), 120);
      design.instances.push({
        id: `${moduleId}_wiz_${Date.now()}_${Math.floor(Math.random() * 100)}`,
        moduleId,
        name: instName,
        position: { x: maxX, y: maxY + 260 },
        parameters: params
      });
    };

    if (this.addons.gpio) addAddonIfMissing('gpio_controller', 'u_gpio_pins', { WIDTH: 8 });
    if (this.addons.i2c) addAddonIfMissing('i2c_controller', 'u_i2c_sensors', { PRESCALE: 125 });
    if (this.addons.spi) addAddonIfMissing('spi_controller', 'u_spi_port', { CLK_DIV: 8, DATA_WIDTH: 8 });
    if (this.addons.timer) addAddonIfMissing('timer_core', 'u_sys_timer', { PRESCALER: 50 });

    const { design: wired } = autoWireDesign(design);
    this.close();
    this.callbacks.onCreateDesign(wired, `Built "${cleanName}" (${wired.instances.length} blocks, auto-wired)!`);
  }
}
