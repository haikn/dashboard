import { Injectable, inject, signal } from '@angular/core';
import { RealtimeActivityService } from './realtime-activity.service';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  // Optional: not provided in unit tests, so inject with optional flag
  private readonly realtime = inject(RealtimeActivityService, { optional: true });

  readonly entries = signal<string[]>([]);

  log(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    this.entries.update((prev) => [...prev, line]);

    // Mirror every log entry to Supabase (fire-and-forget, no-op if not connected)
    this.realtime?.push(level, message);

    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}
