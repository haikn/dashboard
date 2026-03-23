import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="card"
      [class.card--emphasis]="emphasis()"
      aria-label="Dashboard statistic"
    >
      <h3 class="card__title">{{ title() }}</h3>
      <p class="card__value">{{ value() }}</p>
      <p class="card__hint">{{ hint() }}</p>
    </article>
  `,
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input<string | number>('');
  readonly hint = input<string>('');
  readonly emphasis = input(false);
}
