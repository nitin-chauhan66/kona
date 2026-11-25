import { KonaDesign, KonaModuleDef } from '../ir.js';

export interface KonaTemplateDef {
  id: string;
  name: string;
  description: string;
  createDesign: () => KonaDesign;
}

/**
 * Extensible IP & Architecture Template Registry (Open-Closed Principle).
 * New IP blocks and starter architectures can be registered without modifying
 * existing modules or UI code.
 */
export class CatalogRegistry {
  private readonly modules = new Map<string, KonaModuleDef>();
  private readonly templates = new Map<string, KonaTemplateDef>();

  constructor(initialModules: KonaModuleDef[] = [], initialTemplates: KonaTemplateDef[] = []) {
    for (const mod of initialModules) {
      this.registerModule(mod);
    }
    for (const tmpl of initialTemplates) {
      this.registerTemplate(tmpl);
    }
  }

  public registerModule(mod: KonaModuleDef): void {
    this.modules.set(mod.id, mod);
  }

  public registerTemplate(tmpl: KonaTemplateDef): void {
    this.templates.set(tmpl.id, tmpl);
  }

  public getModule(moduleId: string): KonaModuleDef | undefined {
    return this.modules.get(moduleId);
  }

  public getTemplate(templateId: string): KonaTemplateDef | undefined {
    return this.templates.get(templateId);
  }

  public listModules(): KonaModuleDef[] {
    return Array.from(this.modules.values());
  }

  public listTemplates(): KonaTemplateDef[] {
    return Array.from(this.templates.values());
  }
}
