import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { APP_CONFIG } from './core/app-config.token';
import { App } from './app';

const TEST_CONFIG = {
  apiBaseUrl: 'http://localhost',
  environment: 'development' as const,
  featureFlags: { enableTasks: true, enableAdvancedStats: false },
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
        { provide: Date, useValue: new Date('2026-01-01T00:00:00Z') },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navigation links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll('nav a');
    expect(links.length).toBeGreaterThan(0);
  });
});
