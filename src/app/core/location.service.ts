import { Injectable, inject, signal } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from './supabase.token';

export interface LocationResult {
  id: number;
  country_code: string;
  region_name: string;
  city_name: string;
  geonameid: number | null;
}

const STORAGE_KEY = 'user_location';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly client = inject(SUPABASE_CLIENT, { optional: true }) as SupabaseClient | null;

  private readonly _savedLocation = signal<LocationResult | null>(this.loadFromStorage());
  readonly savedLocation = this._savedLocation.asReadonly();

  private loadFromStorage(): LocationResult | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LocationResult) : null;
    } catch {
      return null;
    }
  }

  saveLocation(loc: LocationResult): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    this._savedLocation.set(loc);
  }

  clearLocation(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._savedLocation.set(null);
  }

  // ─── Full-text search via Supabase RPC ──────────────────────────────────
  //
  // Required SQL (run once in the Supabase SQL editor):
  //
  //   -- 1. GIN index on the tsvector for instant full-text lookups
  //   create index if not exists idx_ip2location_city_fts
  //     on ip2location using gin(to_tsvector('simple', city_name));
  //
  //   -- 2. RPC function — supports multi-word prefix matching (e.g. "new y")
  //   create or replace function search_cities(search_term text)
  //   returns table(id bigint, country_code text, region_name text, city_name text, geonameid bigint)
  //   language sql stable security invoker as $$
  //     select id, country_code, region_name, city_name, geonameid
  //     from ip2location
  //     where to_tsvector('simple', city_name) @@
  //           to_tsquery('simple',
  //             array_to_string(
  //               array(
  //                 select part || ':*'
  //                 from unnest(
  //                   string_to_array(
  //                     regexp_replace(trim(search_term), '[^[:alnum:]\s]', ' ', 'g'),
  //                     ' '
  //                   )
  //                 ) as part
  //                 where part <> ''
  //               ),
  //               ' & '
  //             )
  //           )
  //     limit 30;
  //   $$;
  // ─────────────────────────────────────────────────────────────────────────
  search(term: string): Observable<LocationResult[]> {
    const trimmed = term.trim();
    if (!this.client || trimmed.length < 2) {
      return of([]);
    }

    return from(
      this.client.rpc('search_cities', { search_term: trimmed }),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];

        // Deduplicate rows that share the same city + region + country
        const seen = new Set<string>();
        return (data as LocationResult[]).filter(row => {
          const key = `${row.city_name}|${row.region_name}|${row.country_code}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }),
      catchError(() => of([])),
    );
  }
}
