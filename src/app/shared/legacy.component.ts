import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipsListComponent } from './tips-list.component';
import { LegacyBannerComponent } from './legacy-banner.component';
import { UserComponent } from './user.component';

// Legacy-style NgModule that wraps standalone components.
// Demonstrates how older module-based code can still be used
// from a modern standalone app.
@NgModule({
    imports: [CommonModule, TipsListComponent, LegacyBannerComponent, UserComponent],
    exports: [TipsListComponent, LegacyBannerComponent, UserComponent],
})
export class SharedModule {}