import { Injectable } from "@angular/core";
@Injectable({ providedIn: 'root' })
export class AnalyticLogger {
    trackEvent(category: string, value?: string): void {
        console.log('Analytics event logged:', { category, value, timestamp: new Date().toISOString() });
    }
}