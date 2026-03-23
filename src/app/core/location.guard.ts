import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocationService } from './location.service';

export const locationGuard: CanActivateFn = () => {
  const locationService = inject(LocationService);
  const router = inject(Router);

  if (locationService.savedLocation()) {
    return true;
  }

  return router.createUrlTree(['/location']);
};
