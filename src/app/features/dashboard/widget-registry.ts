import { Type } from '@angular/core';

// ─── Widget types ─────────────────────────────────────────────────────────────

export type WidgetType = 'welcome' | 'stats' | 'activity';

export interface WidgetCatalogEntry {
  label: string;
  icon: string;
}

/** A runtime instance of a widget placed on the dashboard. */
export interface WidgetInstance {
  /** Unique ID used as the @for track key and for removal. */
  id: string;
  type: WidgetType;
  label: string;
  /** The component class — resolved lazily via import(). */
  component: Type<unknown>;
}

// ─── Widget catalog (metadata only — no component class imported eagerly) ─────

export const WIDGET_CATALOG: Record<WidgetType, WidgetCatalogEntry> = {
  welcome:  { label: 'Welcome',      icon: '👋' },
  stats:    { label: 'Stats',        icon: '📊' },
  activity: { label: 'Activity Log', icon: '📋' },
};

// ─── Lazy loader ──────────────────────────────────────────────────────────────
// Each widget's component class is only downloaded when the user adds that
// widget for the first time — true code-splitting via dynamic import().

export async function loadWidgetComponent(type: WidgetType): Promise<Type<unknown>> {
  switch (type) {
    case 'welcome':
      return import('./widgets/welcome-widget.component').then(
        (m) => m.WelcomeWidgetComponent,
      );
    case 'stats':
      return import('./widgets/stats-widget.component').then(
        (m) => m.StatsWidgetComponent,
      );
    case 'activity':
      return import('./widgets/activity-widget.component').then(
        (m) => m.ActivityWidgetComponent,
      );
  }
}
