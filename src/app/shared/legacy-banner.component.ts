import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-legacy-banner',
  template: `
    <section class="legacy-banner">
      <h3 class="legacy-banner__title">Legacy NgModule demo</h3>
      <p class="legacy-banner__text">
        This banner is declared and exported from <code>SharedModule</code>,
        showing the classic NgModule component pattern.
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyBannerComponent {}
