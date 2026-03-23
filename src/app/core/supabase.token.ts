import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Config token ─────────────────────────────────────────────────────────────
// Provide your project URL and anon key from the Supabase dashboard:
// https://app.supabase.com → Project Settings → API

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>('SUPABASE_CONFIG');

// ─── Client token ─────────────────────────────────────────────────────────────
// Inject `SUPABASE_CLIENT` anywhere you need a SupabaseClient.
// Returns null when SUPABASE_CONFIG is not provided or contains placeholder values,
// so the app runs normally without a real Supabase project.

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient | null>('SUPABASE_CLIENT');

export function supabaseClientFactory(config: SupabaseConfig | null): SupabaseClient | null {
  if (!config || config.url.includes('YOUR_') || config.anonKey.includes('YOUR_')) {
    return null;
  }
  return createClient(config.url, config.anonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
}
