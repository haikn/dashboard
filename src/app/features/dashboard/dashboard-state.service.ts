import { Injectable } from '@angular/core';
import { WidgetType } from './widget-registry';

// ─── Panel types ──────────────────────────────────────────────────────────────

export type PanelId = 'stocks' | 'currencies' | 'metals' | 'crypto';

export interface PanelDef {
  id: PanelId;
  title: string;
}

export const DEFAULT_PANELS: PanelDef[] = [
  { id: 'stocks',     title: 'Stocks' },
  { id: 'currencies', title: 'Currencies (Forex)' },
  { id: 'metals',     title: 'Precious Metals' },
  { id: 'crypto',     title: 'Cryptocurrency' },
];

// ─── Persistence types ────────────────────────────────────────────────────────

export interface PersistedWidget {
  id: string;
  type: WidgetType;
}

export interface DashboardState {
  panelOrder: PanelId[];
  widgets: PersistedWidget[];
}

const STORAGE_KEY = 'ng_dashboard_state';

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  load(): DashboardState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as DashboardState) : null;
    } catch {
      // Corrupt storage or private browsing
      return null;
    }
  }

  save(state: DashboardState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota exceeded or unavailable — fail silently
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Merges a saved panel order with the current DEFAULT_PANELS.
   * - Panels present in savedOrder keep their saved position.
   * - Panels added to DEFAULT_PANELS after the last save are appended.
   * - Panels removed from DEFAULT_PANELS are silently dropped.
   */
  mergePanelOrder(savedOrder: PanelId[]): PanelDef[] {
    const ordered = savedOrder
      .map((id) => DEFAULT_PANELS.find((p) => p.id === id))
      .filter((p): p is PanelDef => p !== undefined);
    const added = DEFAULT_PANELS.filter((p) => !savedOrder.includes(p.id));
    return [...ordered, ...added];
  }
}
