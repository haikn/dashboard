import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
  environment: 'development' | 'production';
  featureFlags: {
    enableTasks: boolean;
    enableAdvancedStats: boolean;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
