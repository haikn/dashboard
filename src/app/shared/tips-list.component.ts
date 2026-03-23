import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-tips-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-2">
      <p class="text-sm text-muted">Tips list (signal + &#64;for/&#64;if)</p>
      <ul class="mt-1">
        @for (tip of tips(); track tip) {
          <li>{{ tip }}</li>
        }
      </ul>

      @if (showAdvanced()) {
        <p class="badge badge--success mt-2">Showing advanced tips</p>
      }

      <button type="button" class="btn mt-2" (click)="toggleAdvanced()">
        @if (showAdvanced()) { Hide advanced tips } @else { Show advanced tips }
      </button>
    </div>
  `,
})
export class TipsListComponent {
  protected readonly tips = signal<string[]>([
    'Components encapsulate template, logic, and styles.',
    'Signals are ideal for local component state.',
    'Use @for/@if instead of *ngFor/*ngIf.',
    'Pipes format data for display.',
  ]);

  protected readonly showAdvanced = signal(false);

  protected toggleAdvanced(): void {
    this.showAdvanced.update((current) => !current);
  }
}
