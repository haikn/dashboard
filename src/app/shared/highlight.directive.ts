import { Directive, Input } from '@angular/core';

// Attribute directive example.
// Usage: <p appHighlight>...</p> or <p [appHighlight]="'yellow'">...</p>
@Directive({
  selector: '[appHighlight]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '[style.backgroundColor]': 'currentBackground',
    '[style.color]': 'currentColor',
    'style.transition': 'background-color 150ms ease, color 150ms ease',
  },
})
export class HighlightDirective {
  @Input('appHighlight') color: string | null = null;

  currentBackground: string | null = null;
  currentColor: string | null = null;

  onMouseEnter(): void {
    this.currentBackground = this.color ?? '#ffd600';
    this.currentColor = '#000000';
  }

  onMouseLeave(): void {
    this.currentBackground = null;
    this.currentColor = null;
  }
}
