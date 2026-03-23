import { inject } from '@angular/core';
import { APP_CONFIG } from './app-config.token';

/**
 * Example factory that could be used to build more complex services
 * using injected configuration.
 */
export function currentDateFactory(): Date {
  const config = inject(APP_CONFIG);
  // In a real app you might choose timezone based on config.
  return new Date();
}
