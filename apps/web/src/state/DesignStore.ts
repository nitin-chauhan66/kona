import {
  KonaDesign,
  KonaModuleInstance,
  KonaNet,
  parseKonaDesign,
  serializeKonaDesign
} from '../../../../packages/core/dist/ir.js';
import { DrcDiagnostic, runDesignRuleCheck } from '../../../../packages/core/dist/drc.js';
import { generateSystemVerilog } from '../../../../packages/core/dist/codegen.js';
import { HistoryManager } from './HistoryManager.js';
import { saveDesignToHash } from './Persistence.js';

export interface DesignSnapshotState {
  design: KonaDesign;
  diagnostics: DrcDiagnostic[];
  systemVerilog: string;
  selectedInstance: KonaModuleInstance | null;
  selectedNet: KonaNet | null;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  templateId?: string;
}

export type DesignStoreListener = (state: DesignSnapshotState) => void;

/**
 * Observable single source of truth for the active chip design, DRC diagnostics,
 * generated RTL, selection state, and undo/redo history.
 */
export class DesignStore {
  private design: KonaDesign;
  private diagnostics: DrcDiagnostic[] = [];
  private systemVerilog = '';
  private selectedInstance: KonaModuleInstance | null = null;
  private selectedNet: KonaNet | null = null;
  private isDirty = false;
  private templateId?: string;
  private readonly history = new HistoryManager<string>(40);
  private readonly listeners = new Set<DesignStoreListener>();

  constructor(
    initialDesign: KonaDesign,
    options: { templateId?: string; isDirty?: boolean; skipInitialHashSync?: boolean } = {}
  ) {
    this.design = initialDesign;
    this.templateId = options.templateId;
    this.isDirty = options.isDirty ?? false;
    this.history.reset(serializeKonaDesign(initialDesign));
    this.recompute();
    if (!options.skipInitialHashSync) {
      saveDesignToHash(this.design, { templateId: this.templateId, isDirty: this.isDirty });
    }
  }

  public subscribe(listener: DesignStoreListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): DesignSnapshotState {
    return {
      design: this.design,
      diagnostics: this.diagnostics,
      systemVerilog: this.systemVerilog,
      selectedInstance: this.selectedInstance,
      selectedNet: this.selectedNet,
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      isDirty: this.isDirty,
      templateId: this.templateId
    };
  }

  public getDesign(): KonaDesign {
    return this.design;
  }

  public isDesignDirty(): boolean {
    return this.isDirty;
  }

  public setSelection(instance: KonaModuleInstance | null, net: KonaNet | null): void {
    this.selectedInstance = instance;
    this.selectedNet = net;
    this.emit();
  }

  public commitMutation(updatedDesign?: KonaDesign): void {
    if (updatedDesign) {
      this.design = updatedDesign;
    }
    this.isDirty = true;
    this.history.push(serializeKonaDesign(this.design));
    this.recompute();
    saveDesignToHash(this.design, { templateId: this.templateId, isDirty: true });
    this.emit();
  }

  public loadTemplateDesign(newDesign: KonaDesign, templateId?: string): void {
    this.design = newDesign;
    this.templateId = templateId;
    this.isDirty = !templateId;
    this.selectedInstance = null;
    this.selectedNet = null;
    this.history.reset(serializeKonaDesign(newDesign));
    this.recompute();
    saveDesignToHash(this.design, { templateId: this.templateId, isDirty: this.isDirty });
    this.emit();
  }

  public undo(): KonaDesign | null {
    const snap = this.history.undo();
    if (!snap) return null;
    return this.restoreSnapshot(snap);
  }

  public redo(): KonaDesign | null {
    const snap = this.history.redo();
    if (!snap) return null;
    return this.restoreSnapshot(snap);
  }

  private restoreSnapshot(snap: string): KonaDesign | null {
    const { design } = parseKonaDesign(snap);
    if (!design) return null;
    this.design = design;
    this.isDirty = this.history.canUndo() || !this.templateId;
    this.selectedInstance = null;
    this.selectedNet = null;
    this.recompute();
    saveDesignToHash(this.design, { templateId: this.templateId, isDirty: this.isDirty });
    this.emit();
    return this.design;
  }

  private recompute(): void {
    this.diagnostics = runDesignRuleCheck(this.design);
    this.systemVerilog = generateSystemVerilog(this.design);
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}
