import { Injectable, OnDestroy, WritableSignal, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from './supabase.token';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

// ─── Row types — mirror the columns in supabase/market_data.sql ──────────────

export interface StockRow {
  id: string;
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string;
  price: number;
  change: number | null;
  change_percent: number | null;
  open: number | null;
  previous_close: number | null;
  high_24h: number | null;
  low_24h: number | null;
  volume: number | null;
  market_cap: number | null;
  updated_at: string;
}

export interface CurrencyRow {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  change: number | null;
  change_percent: number | null;
  bid: number | null;
  ask: number | null;
  high_24h: number | null;
  low_24h: number | null;
  updated_at: string;
}

export interface MetalRow {
  id: string;
  metal: string;
  unit: string;
  currency: string;
  price: number;
  change: number | null;
  change_percent: number | null;
  bid: number | null;
  ask: number | null;
  high_24h: number | null;
  low_24h: number | null;
  updated_at: string;
}

export interface CryptoRow {
  id: string;
  symbol: string;
  name: string;
  price_usd: number;
  change_24h: number | null;
  change_percent_24h: number | null;
  high_24h: number | null;
  low_24h: number | null;
  volume_24h: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  ath: number | null;
  ath_date: string | null;
  updated_at: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MarketDataService implements OnDestroy {
  private readonly client: SupabaseClient | null = inject(SUPABASE_CLIENT);

  readonly stocks = signal<StockRow[]>([]);
  readonly currencies = signal<CurrencyRow[]>([]);
  readonly metals = signal<MetalRow[]>([]);
  readonly crypto = signal<CryptoRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Maps a row id → flash direction.
   * Template reads this to apply the price-flash-up / price-flash-down CSS class,
   * which plays a short background-colour animation then removes itself.
   */
  readonly flashingIds = signal<Map<string, 'up' | 'down'>>(new Map());

  /** True when a valid Supabase client has been configured. */
  readonly connected: boolean;

  private readonly channels: RealtimeChannel[] = [];

  constructor() {
    this.connected = this.client !== null;
    if (this.client) {
      void this.fetchAll();
      this.subscribeAll();
    }
  }

  // ─── Initial fetch ────────────────────────────────────────────────────────

  private async fetchAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [s, c, m, cr] = await Promise.all([
        this.client!.from('stocks').select('*').order('symbol'),
        this.client!
          .from('currencies')
          .select('*')
          .order('base_currency')
          .order('quote_currency'),
        this.client!.from('precious_metals').select('*').order('metal').order('unit'),
        this.client!
          .from('crypto')
          .select('*')
          .order('market_cap_rank', { nullsFirst: false }),
      ]);

      if (s.error) throw s.error;
      if (c.error) throw c.error;
      if (m.error) throw m.error;
      if (cr.error) throw cr.error;

      this.stocks.set((s.data ?? []) as StockRow[]);
      this.currencies.set((c.data ?? []) as CurrencyRow[]);
      this.metals.set((m.data ?? []) as MetalRow[]);
      this.crypto.set((cr.data ?? []) as CryptoRow[]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.set(false);
    }
  }

  // ─── Real-time subscriptions ──────────────────────────────────────────────

  private subscribeAll(): void {
    this.channels.push(
      this.client!
        .channel('mkt-stocks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, payload => {
          if (payload.eventType === 'DELETE') {
            this.stocks.update(list =>
              list.filter(r => r.id !== (payload.old as StockRow).id),
            );
          } else {
            this.upsert(this.stocks, payload.new as StockRow, r => r.price);
          }
        })
        .subscribe(),

      this.client!
        .channel('mkt-currencies')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'currencies' },
          payload => {
            if (payload.eventType === 'DELETE') {
              this.currencies.update(list =>
                list.filter(r => r.id !== (payload.old as CurrencyRow).id),
              );
            } else {
              this.upsert(this.currencies, payload.new as CurrencyRow, r => r.rate);
            }
          },
        )
        .subscribe(),

      this.client!
        .channel('mkt-metals')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'precious_metals' },
          payload => {
            if (payload.eventType === 'DELETE') {
              this.metals.update(list =>
                list.filter(r => r.id !== (payload.old as MetalRow).id),
              );
            } else {
              this.upsert(this.metals, payload.new as MetalRow, r => r.price);
            }
          },
        )
        .subscribe(),

      this.client!
        .channel('mkt-crypto')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto' }, payload => {
          if (payload.eventType === 'DELETE') {
            this.crypto.update(list =>
              list.filter(r => r.id !== (payload.old as CryptoRow).id),
            );
          } else {
            this.upsert(this.crypto, payload.new as CryptoRow, r => r.price_usd);
          }
        })
        .subscribe(),
    );
  }

  private upsert<T extends { id: string }>(
    sig: WritableSignal<T[]>,
    row: T,
    getPrice: (r: T) => number,
  ): void {
    sig.update(list => {
      const idx = list.findIndex(r => r.id === row.id);
      if (idx === -1) return [row, ...list];

      // Detect price direction and schedule the flash highlight
      const existing = list[idx];
      if (existing) {
        const oldPrice = getPrice(existing);
        const newPrice = getPrice(row);
        if (oldPrice !== newPrice) {
          this.flash(row.id, newPrice > oldPrice ? 'up' : 'down');
        }
      }

      return list.map((r, i) => (i === idx ? row : r));
    });
  }

  /** Marks a row as flashing; clears the flag after 2 s. */
  private flash(id: string, direction: 'up' | 'down'): void {
    this.flashingIds.update(map => new Map(map).set(id, direction));
    setTimeout(() => {
      this.flashingIds.update(map => {
        const next = new Map(map);
        next.delete(id);
        return next;
      });
    }, 2000);
  }

  ngOnDestroy(): void {
    this.channels.forEach(ch => void ch.unsubscribe());
  }
}
