import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { LoggerService } from '../core/logger.service';
import { AnalyticLogger } from '../core/analytic.logger';

@Component({
  selector: 'app-title-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="field">
      <span class="field__label">Dashboard title (two-way bound)</span>
      <input
        class="field__input"
        type="text"
        [value]="value()"
        (input)="onInput($any($event.target).value)"
      />
    </label>
  `,
})
export class TitleControlComponent {
  private readonly logger = inject(LoggerService);
  private readonly analytics = inject(AnalyticLogger);
  readonly value = input<string>('');
  readonly valueChange = output<string>();

  onInput(next: string): void {
    this.valueChange.emit(next);
    this.logger.log('info', `TitleControlComponent emitted new value: "${next}"`);
    this.analytics.trackEvent('title_control_input', next);
  }
}
