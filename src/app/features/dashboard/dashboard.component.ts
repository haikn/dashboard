import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe, NgComponentOutlet, TitleCasePipe } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  WIDGET_CATALOG,
  WidgetInstance,
  WidgetType,
  loadWidgetComponent,
} from './widget-registry';
import {
  DEFAULT_PANELS,
  DashboardStateService,
  PanelDef,
} from './dashboard-state.service';
import { MarketDataService } from '../../core/market-data.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    NgComponentOutlet,
    DragDropModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly stateService = inject(DashboardStateService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly market = inject(MarketDataService);

  // Template refs used by the FLIP animation
  @ViewChildren('panelItem') private panelItemRefs!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('widgetItem') private widgetItemRefs!: QueryList<ElementRef<HTMLElement>>;

  protected dashboardTitle = 'Market';
  protected readonly now = new Date();

  /** Only troy_oz rows for the Precious Metals panel — filters the metals signal. */
  protected readonly metalsTroyOz = computed(() =>
    this.market.metals().filter(m => m.unit === 'troy_oz'),
  );

  // ─── Static panel order ───────────────────────────────────────────────────

  /** Ordered list of panels — initialised from localStorage or defaults. */
  protected readonly panels = signal<PanelDef[]>(this.loadInitialPanels());

  protected dropPanel(event: CdkDragDrop<PanelDef[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const els = this.panelItemRefs.toArray().map(r => r.nativeElement);
    const before = els.map(el => el.getBoundingClientRect());
    this.panels.update((list) => {
      const reordered = [...list];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      return reordered;
    });
    this.flipItems(els, before, event.item.getRootElement());
    this.saveState();
  }

  /** Resets both panel order and widgets to defaults and clears localStorage. */
  protected resetLayout(): void {
    this.panels.set([...DEFAULT_PANELS]);
    this.widgets.set([]);
    this.stateService.clear();
  }

  private loadInitialPanels(): PanelDef[] {
    const saved = this.stateService.load();
    return saved?.panelOrder
      ? this.stateService.mergePanelOrder(saved.panelOrder)
      : [...DEFAULT_PANELS];
  }

  private saveState(): void {
    this.stateService.save({
      panelOrder: this.panels().map((p) => p.id),
      widgets: this.widgets().map((w) => ({ id: w.id, type: w.type })),
    });
  }

  // ─── Dynamic widget state ─────────────────────────────────────────────────

  /** Only 'welcome' and 'activity' are surfaced — 'stats' widget needed project/user. */
  protected readonly widgetTypes: WidgetType[] = ['welcome', 'activity'];
  protected readonly WIDGET_CATALOG = WIDGET_CATALOG;
  protected readonly widgets = signal<WidgetInstance[]>([]);

  /** On init, restore widgets saved to localStorage (skip removed widget types). */
  async ngOnInit(): Promise<void> {
    const saved = this.stateService.load();
    if (saved?.widgets?.length) {
      const allowed = saved.widgets.filter(w =>
        (this.widgetTypes as string[]).includes(w.type),
      );
      const instances = await Promise.all(
        allowed.map(async (w) => {
          const component = await loadWidgetComponent(w.type);
          return { id: w.id, type: w.type, label: WIDGET_CATALOG[w.type].label, component };
        }),
      );
      this.widgets.set(instances);
    }
  }

  protected async addWidget(type: WidgetType): Promise<void> {
    const component = await loadWidgetComponent(type);
    this.widgets.update((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        type,
        label: WIDGET_CATALOG[type].label,
        component,
      },
    ]);
    this.saveState();
  }

  protected removeWidget(id: string): void {
    this.widgets.update((list) => list.filter((w) => w.id !== id));
    this.saveState();
  }

  protected dropWidget(event: CdkDragDrop<WidgetInstance[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const els = this.widgetItemRefs.toArray().map(r => r.nativeElement);
    const before = els.map(el => el.getBoundingClientRect());
    this.widgets.update((list) => {
      const reordered = [...list];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      return reordered;
    });
    this.flipItems(els, before, event.item.getRootElement());
    this.saveState();
  }

  /**
   * FLIP animation (First, Last, Invert, Play).
   *
   * CDK's built-in `transform` displacement works for linear (flex/block) lists
   * but not for CSS Grid — grid cells are fixed, so translating a sibling just
   * overlaps cells instead of pushing them. FLIP solves this:
   *
   *  1. First  — caller records every element's rect BEFORE the signal update.
   *  2. Last   — detectChanges() commits the new DOM order (elements teleport
   *              to their new grid cells).
   *  3. Invert — we apply the delta as an instant transform so each element
   *              visually appears to still be at its old position.
   *  4. Play   — we set a transition and clear the transform; the browser
   *              animates each element from old → new position.
   *
   * skipEl is the element CDK is already animating via .cdk-drag-animating.
   */
  private flipItems(
    els: HTMLElement[],
    before: DOMRect[],
    skipEl?: HTMLElement,
  ): void {
    // Step 2: commit new DOM order synchronously
    this.cdr.detectChanges();

    els.forEach((el, i) => {
      if (el === skipEl) return; // CDK's own settle animation handles the dropped item

      const after = el.getBoundingClientRect();
      const dx = (before[i]?.left ?? 0) - after.left;
      const dy = (before[i]?.top  ?? 0) - after.top;
      if (!dx && !dy) return;

      // Step 3 — Invert: snap to old position with no transition
      el.style.transition = 'none';
      el.style.transform  = `translate(${dx}px,${dy}px)`;

      // Force the browser to commit the start state before we set the transition
      el.getBoundingClientRect();

      // Step 4 — Play: animate to natural (new) position
      el.style.transition = 'transform 320ms cubic-bezier(0.2,0,0,1)';
      el.style.transform  = '';

      // Clean up inline styles once animation completes
      el.addEventListener('transitionend', () => {
        el.style.transition = '';
      }, { once: true });
    });
  }

  protected getWidgetInputs(_widget: WidgetInstance): Record<string, unknown> {
    return {};
  }

  // ─── Market data helpers ───────────────────────────────────────────────────

  /** Format a large number as an abbreviated market-cap string: $1.32T, $82.00B, $5.20M. */
  protected fmtCap(n: number | null): string {
    if (n == null) return '—';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toFixed(0)}`;
  }

  /** Format a volume number: 28.50B, 380.00M, raw otherwise. */
  protected fmtVol(n: number | null): string {
    if (n == null) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    return n.toLocaleString();
  }
}
