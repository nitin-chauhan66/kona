import { STARTER_IP_CATALOG } from '../../../../packages/core/dist/catalog.js';
import { getPlainModuleInfo } from '../../../../packages/core/dist/plain-english.js';
import { escapeHtml } from '../utils/html.js';

export interface CatalogPanelCallbacks {
  onAddModule: (moduleId: string) => void;
}

/**
 * Manages the left-hand Starter IP Library: search, category filter chips,
 * click-to-add, Simple Mode plain-English cards, and HTML5 drag-to-canvas payload setup.
 */
export class CatalogPanel {
  private activeFilter = 'all';
  private searchQuery = '';
  private simpleMode = false;
  private readonly listEl: HTMLElement | null;
  private readonly callbacks: CatalogPanelCallbacks;

  constructor(callbacks: CatalogPanelCallbacks) {
    this.callbacks = callbacks;
    this.listEl = document.getElementById('catalog-items-list');
    if (!this.listEl) return;

    this.bindControls();
    this.render();
  }

  public setSimpleMode(enabled: boolean): void {
    this.simpleMode = enabled;
    this.render();
  }

  private getFilteredItems() {
    return STARTER_IP_CATALOG.filter(m => {
      const matchesCategory = this.activeFilter === 'all' || m.category === this.activeFilter;
      const q = this.searchQuery;
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }

  private bindControls(): void {
    const filterChips = document.querySelectorAll('.md-filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeFilter = chip.getAttribute('data-filter') || 'all';
        this.render();
      });
    });

    const searchInput = document.getElementById('catalog-search-input') as HTMLInputElement | null;
    const clearBtn = document.getElementById('catalog-search-clear');

    searchInput?.addEventListener('input', () => {
      this.searchQuery = (searchInput.value || '').toLowerCase().trim();
      if (clearBtn) clearBtn.style.display = this.searchQuery ? 'inline-block' : 'none';
      this.render();
    });

    clearBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      this.searchQuery = '';
      clearBtn.style.display = 'none';
      this.render();
    });
  }

  public render(): void {
    if (!this.listEl) return;
    const items = this.getFilteredItems();

    if (items.length === 0) {
      this.listEl.innerHTML = `<div class="catalog-empty"><p>No matching IP modules found.</p></div>`;
    } else {
      this.listEl.innerHTML = items.map(mod => {
        const plain = getPlainModuleInfo(mod.id);
        const title = this.simpleMode ? plain.friendlyName : mod.name;
        const desc = this.simpleMode ? plain.whatItDoes : mod.description;
        return `
        <div class="catalog-card" role="button" tabindex="0" draggable="true" data-module-id="${mod.id}" title="${escapeHtml(mod.description)}">
          <div class="catalog-card-header">
            <span class="catalog-category-tag ${mod.category}">${this.simpleMode ? plain.analogy : mod.category}</span>
            <span class="catalog-meta-right">
              <span class="catalog-port-count">${mod.ports.length}p</span>
              <span class="catalog-add-btn">+ Add</span>
            </span>
          </div>
          <div class="catalog-card-title">${escapeHtml(title)}</div>
          <div class="catalog-card-desc">${escapeHtml(desc)}</div>
        </div>
      `;
      }).join('');

      this.listEl.querySelectorAll('.catalog-card').forEach(card => {
        const triggerAdd = () => {
          const modId = card.getAttribute('data-module-id');
          if (modId) this.callbacks.onAddModule(modId);
        };
        card.addEventListener('click', triggerAdd);
        card.addEventListener('keydown', (e) => {
          const ke = e as KeyboardEvent;
          if (ke.key === 'Enter' || ke.key === ' ') {
            ke.preventDefault();
            triggerAdd();
          }
        });

        card.addEventListener('dragstart', (e) => {
          const modId = card.getAttribute('data-module-id');
          const dragEvent = e as DragEvent;
          if (modId && dragEvent.dataTransfer) {
            dragEvent.dataTransfer.setData('text/kona-module', modId);
            dragEvent.dataTransfer.effectAllowed = 'copy';
          }
        });
      });
    }

    const countBadge = document.getElementById('catalog-count-badge');
    if (countBadge) countBadge.textContent = `${items.length} IPs`;
  }
}
