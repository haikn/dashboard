import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePipe } from '@angular/common';

/**
 * WelcomeWidgetComponent — a simple greeting panel.
 *
 * This component is loaded dynamically via import() + NgComponentOutlet.
 * It is NOT imported statically anywhere; the class reference is only
 * resolved at runtime when the user clicks "Add widget".
 */
@Component({
  selector: 'app-welcome-widget',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="widget-body">
      <p class="widget-body__line">Welcome to your dashboard!</p>
      <p class="widget-body__note">
        Today is <strong>{{ now | date: 'fullDate' }}</strong>.
      </p>
      <p class="widget-body__note">
        This panel was loaded dynamically at runtime using
        <code>NgComponentOutlet</code> and a lazy <code>import()</code> —
        its JS chunk was not part of the initial bundle.
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeWidgetComponent {
  protected readonly now = new Date();
}
