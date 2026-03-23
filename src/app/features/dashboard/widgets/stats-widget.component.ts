import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Project, User } from '../../../advanced-types';
import { StatusLabelPipe } from '../../../shared/status-label.pipe';

/**
 * StatsWidgetComponent — shows a live summary of the current project and user.
 *
 * Inputs are passed by the host (DashboardComponent) via ngComponentOutletInputs.
 * Because the host re-evaluates the inputs object on every change-detection,
 * signal mutations in the host flow into this widget automatically.
 */
@Component({
  selector: 'app-stats-widget',
  standalone: true,
  imports: [StatusLabelPipe],
  template: `
    <div class="widget-body">
      @if (project()) {
        <dl class="widget-body__dl">
          <div class="widget-body__row">
            <dt>Project</dt>
            <dd>{{ project()!.name }}</dd>
          </div>
          <div class="widget-body__row">
            <dt>Status</dt>
            <dd>{{ project()!.status | statusLabel }}</dd>
          </div>
          <div class="widget-body__row">
            <dt>ID</dt>
            <dd>{{ project()!.id }}</dd>
          </div>
        </dl>
      }

      @if (user()) {
        <dl class="widget-body__dl">
          <div class="widget-body__row">
            <dt>User</dt>
            <dd>{{ user()!.name }}</dd>
          </div>
          <div class="widget-body__row">
            <dt>Role</dt>
            <dd>{{ user()!.role }}</dd>
          </div>
          <div class="widget-body__row">
            <dt>Status</dt>
            <dd>{{ user()!.status }}</dd>
          </div>
        </dl>
      }

      @if (!project() && !user()) {
        <p class="widget-body__empty">No data available.</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsWidgetComponent {
  readonly project = input<Project | null>(null);
  readonly user    = input<User | null>(null);
}
