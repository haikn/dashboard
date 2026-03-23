import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';
import { APP_CONFIG } from './core/app-config.token';
import { currentDateFactory } from './core/date.factory';
import {
  SUPABASE_CLIENT,
  SUPABASE_CONFIG,
  supabaseClientFactory,
} from './core/supabase.token';

// ─── Supabase config ──────────────────────────────────────────────────────────
// Replace the placeholder strings with your real project URL and anon key from:
// https://app.supabase.com → Project Settings → API
//
// Required table (run once in the Supabase SQL editor):
//   See the comment block at the top of realtime-activity.service.ts
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_PROJECT_URL  = 'https://xxyogxcrbcuictsajigq.supabase.co';       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eW9neGNyYmN1aWN0c2FqaWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzAyMTIsImV4cCI6MjA4OTUwNjIxMn0.NlgLY1kG2elx15MLDbZRHJs0XK3DQfHg1Kz6eYxtfpQ';  // starts with eyJ…

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideTanStackQuery(new QueryClient()),
    {
      provide: APP_CONFIG,
      useValue: {
        apiBaseUrl: 'https://api.example.com',
        environment: 'development',
        featureFlags: {
          enableTasks: true,
          enableAdvancedStats: false,
        },
      },
    },
    {
      provide: Date,
      useFactory: currentDateFactory,
    },
    // Supabase providers
    {
      provide: SUPABASE_CONFIG,
      useValue: { url: SUPABASE_PROJECT_URL, anonKey: SUPABASE_ANON_KEY },
    },
    {
      provide: SUPABASE_CLIENT,
      useFactory: supabaseClientFactory,
      deps: [SUPABASE_CONFIG],
    },
  ],
};
