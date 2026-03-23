import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LoggerService } from '../../../core/logger.service';
import { RealtimeActivityService } from '../../../core/realtime-activity.service';

/**
 * ActivityWidgetComponent — shows live log entries.
 *
 * When Supabase is configured, it renders entries from RealtimeActivityService
 * (real-time across all browser tabs / users). Without a Supabase config it
 * falls back to the in-memory LoggerService signal.
 */
@Component({
  selector: 'app-activity-widget',
  standalone: true,
  template: `
    <div class="widget-body">
      @if (realtime.connected) {
        <!-- Supabase status banner -->
        @if (realtime.error()) {
          <p class="activity-status activity-status--error">
            ⚠️ {{ realtime.error() }}
          </p>
        } @else if (realtime.loading()) {
          <p class="activity-status activity-status--loading">⋯ Loading from Supabase…</p>
        } @else {
          <p class="activity-status activity-status--live">
            🟢 Live &mdash; Supabase real-time
          </p>
        }
      }

      @if (displayEntries().length === 0) {
        <p class="widget-body__empty">
          No activity yet
          @if (!realtime.connected) { &mdash; try clicking "Mark project" or "Toggle user" above. }
        </p>
      } @else {
        <ul class="widget-body__list">
          @for (entry of last5(); track entry) {
            <li class="widget-body__list-item">{{ entry }}</li>
          }
        </ul>
        @if (displayEntries().length > 5) {
          <p class="widget-body__note">
            Showing last 5 of {{ displayEntries().length }} entries.
          </p>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityWidgetComponent {
  private readonly logger = inject(LoggerService);
  protected readonly realtime = inject(RealtimeActivityService);

  /**
   * Computed signal — always a plain string[] regardless of source.
   * Supabase connected: rows from RealtimeActivityService (newest-first).
   * Fallback: in-memory LoggerService entries.
   */
  protected readonly displayEntries = computed<string[]>(() => {
    if (this.realtime.connected) {
      return this.realtime.entries().map(
        (e) => `[${e.created_at}] [${e.level.toUpperCase()}] ${e.message}`,
      );
    }
    return [...this.logger.entries()].reverse();
  });

  protected last5(): string[] {
    return this.displayEntries().slice(0, 5);
  }
}
