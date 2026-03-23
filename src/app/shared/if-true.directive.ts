import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

// Simple structural directive example.
// Usage: *appIfTrue="condition" to show/hide a block.
@Directive({
  selector: '[appIfTrue]',
})
export class IfTrueDirective {
  private hasView = false;

  constructor(
    private readonly viewContainer: ViewContainerRef,
    private readonly templateRef: TemplateRef<unknown>,
  ) {}

  @Input({ required: true })
  set appIfTrue(condition: boolean) {
    if (condition && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
