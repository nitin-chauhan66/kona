import { KonaModuleDef } from '../ir.js';
import { CatalogRegistry, KonaTemplateDef } from './registry.js';
import { BUILTIN_MODULES } from './modules/index.js';
import { BUILTIN_TEMPLATES } from './templates/index.js';

export { CatalogRegistry, KonaTemplateDef } from './registry.js';
export * from './modules/index.js';
export { BUILTIN_TEMPLATES } from './templates/index.js';

export const defaultCatalogRegistry = new CatalogRegistry(BUILTIN_MODULES, BUILTIN_TEMPLATES);

export const STARTER_IP_CATALOG: KonaModuleDef[] = defaultCatalogRegistry.listModules();
export const STARTER_TEMPLATES: KonaTemplateDef[] = defaultCatalogRegistry.listTemplates();

export function getModuleDef(moduleId: string): KonaModuleDef | undefined {
  return defaultCatalogRegistry.getModule(moduleId);
}
