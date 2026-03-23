import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-tasks-page',
  template: `
    <section class="page">
      <h1>Tasks</h1>
      <p>Manage tasks here.</p>
    </section>
  `,
  styleUrls: ['./tasks.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksComponent {}
