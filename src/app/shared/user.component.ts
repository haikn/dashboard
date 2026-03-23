import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-user',
  template: `
    <section class="mt-2">
      <h3 class="text-lg text-yellow mb-2">User editor (two-way binding)</h3>

      <label class="field mb-2">
        <span class="field__label">First name</span>
        <input
          class="field__input"
          type="text"
          [value]="firstName()"
          (input)="onFirstNameInput($any($event.target).value)"
        />
      </label>

      <label class="field mb-2">
        <span class="field__label">Last name</span>
        <input
          class="field__input"
          type="text"
          [value]="lastName()"
          (input)="onLastNameInput($any($event.target).value)"
        />
      </label>

      <p class="text-sm text-muted mt-2">
        Current full name: <strong>{{ firstName() }} {{ lastName() }}</strong>
      </p>

      <button type="button" class="btn mt-2" (click)="resetNames()">
        Clear names (event binding)
      </button>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  readonly firstName = input<string>('');
  readonly firstNameChange = output<string>();

  readonly lastName = input<string>('');
  readonly lastNameChange = output<string>();

  onFirstNameInput(value: string): void {
    this.firstNameChange.emit(value);
  }

  onLastNameInput(value: string): void {
    this.lastNameChange.emit(value);
  }

  // Extra example of event binding using a button click
  resetNames(): void {
    this.firstNameChange.emit('');
    this.lastNameChange.emit('');
  }
}
