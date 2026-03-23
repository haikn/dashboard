import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase.token';

// ─── Data shape ───────────────────────────────────────────────────────────────
// Matches the Supabase table schema below.
//
// Required SQL (run once in the Supabase SQL editor):
// ─────────────────────────────────────────────────────────────────────────────
//   create table if not exists activity_log (
//     id         uuid        primary key default gen_random_uuid(),
//     level      text        not null,
//     message    text        not null,
//     created_at timestamptz not null default now()
//   );
//
//   -- Enable row-level security (good practice even on public tables)
//   alter table activity_log enable row level security;
//
//   -- Allow anonymous reads so the widget can list entries
//   create policy "anon read" on activity_log
//     for select using (true);
//
//   -- Allow anonymous inserts so the logger can write
//   create policy "anon insert" on activity_log
//     for insert with check (true);
//
//   -- Enable real-time for this table
//   alter publication supabase_realtime add table activity_log;
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  level: string;
  message: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class RealtimeActivityService implements OnDestroy {
  private readonly client = inject(SUPABASE_CLIENT, { optional: true }) as SupabaseClient | null;
  private channel: RealtimeChannel | null = null;

  /** Signal of live activity entries, newest-first. */
  readonly entries = signal<ActivityEntry[]>([]);
  /** True while the initial fetch is in flight. */
  readonly loading = signal(false);
  /** Non-null when Supabase is unavailable (no config or network error). */
  readonly error = signal<string | null>(null);

  /** Whether a real Supabase connection is configured. */
  get connected(): boolean {
    return this.client !== null;
  }

  constructor() {
    if (!this.client) {
      this.error.set('Supabase not configured — add your URL and anon key to app.config.ts');
      return;
    }
    this.fetchInitial();
    this.subscribeRealtime();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Inserts a new log entry into Supabase.
   * The real-time subscription picks up the INSERT and updates entries().
   * Falls back silently when not connected.
   */
  async push(level: string, message: string): Promise<void> {
    if (!this.client) return;
    const { error } = await this.client
      .from('activity_log')
      .insert({ level, message });
    if (error) {
      console.error('[RealtimeActivityService] insert error', error.message);
    }
  }

  ngOnDestroy(): void {
    this.channel?.unsubscribe();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async fetchInitial(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.client!
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    this.loading.set(false);

    if (error) {
      this.error.set(error.message);
      return;
    }
    this.entries.set(data as ActivityEntry[]);
  }

  private subscribeRealtime(): void {
    this.channel = this.client!
      .channel('activity_log_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
          // Prepend so newest is always first
          this.entries.update((list) => [payload.new as ActivityEntry, ...list]);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.error.set(null);
        } else if (status === 'CHANNEL_ERROR') {
          this.error.set('Real-time subscription error — check Supabase config');
        }
      });
  }
}
