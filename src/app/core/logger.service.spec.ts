import { effect } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';

import { LoggerService } from './logger.service';
import { GitHubApiService } from './github-api.service';

const SEARCH_URL = 'https://api.github.com/search/users';

// ─── LoggerService — writable signal ─────────────────────────────────────────
// Signal reads are synchronous: no need for async helpers or detectChanges().

describe('LoggerService (signals)', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);
  });

  it('should start with an empty entries signal', () => {
    expect(service.entries()).toEqual([]);
  });

  it('should append one entry after a single log() call', () => {
    service.log('info', 'Hello world');

    expect(service.entries().length).toBe(1);
  });

  it('should format the entry with level and message', () => {
    service.log('info', 'Hello world');

    const entry = service.entries()[0];
    expect(entry).toContain('[INFO]');
    expect(entry).toContain('Hello world');
  });

  it('should include an ISO timestamp in the entry', () => {
    service.log('debug', 'timestamp test');

    const entry = service.entries()[0];
    // ISO 8601: e.g. 2026-03-19T09:00:00.000Z
    expect(entry).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should accumulate entries in order across multiple calls', () => {
    service.log('debug', 'first');
    service.log('warn', 'second');
    service.log('error', 'third');

    const entries = service.entries();
    expect(entries.length).toBe(3);
    expect(entries[0]).toContain('[DEBUG]');
    expect(entries[1]).toContain('[WARN]');
    expect(entries[2]).toContain('[ERROR]');
  });

  it('should uppercase all log levels in the formatted entry', () => {
    const levels = ['debug', 'info', 'warn', 'error'] as const;

    for (const level of levels) {
      service.log(level, level);
    }

    const entries = service.entries();
    expect(entries[0]).toContain('[DEBUG]');
    expect(entries[1]).toContain('[INFO]');
    expect(entries[2]).toContain('[WARN]');
    expect(entries[3]).toContain('[ERROR]');
  });

  it('should call console.error only for error level', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy   = vi.spyOn(console, 'log').mockImplementation(() => {});

    service.log('info',  'not an error');
    service.log('error', 'this is an error');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]?.[0]).toContain('[ERROR]');
    expect(logSpy).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });

  // ─── effect() integration ──────────────────────────────────────────────────
  // effect() runs asynchronously after signal changes. TestBed.flushEffects()
  // forces all pending effects to run synchronously inside a test.

  it('should trigger a registered effect when entries signal changes', () => {
    const captured: string[][] = [];

    TestBed.runInInjectionContext(() => {
      effect(() => {
        captured.push([...service.entries()]);
      });
    });

    // effect runs once eagerly on creation
    TestBed.flushEffects();
    expect(captured.length).toBe(1);
    expect(captured[0]).toEqual([]);

    service.log('info', 'triggered');
    TestBed.flushEffects();

    expect(captured.length).toBe(2);
    expect(captured[1]?.[0]).toContain('triggered');
  });
});

// ─── GitHubApiService — computed signals ──────────────────────────────────────
// computed() is derived from private writeable signals updated by HTTP responses.

describe('GitHubApiService (signals)', () => {
  let service: GitHubApiService;
  let httpMock: HttpTestingController;

  const mockUser = {
    id: 1,
    login: 'octocat',
    avatar_url: 'https://avatars.githubusercontent.com/u/1',
    html_url: 'https://github.com/octocat',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GitHubApiService,
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    });

    service  = TestBed.inject(GitHubApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('users computed signal starts as []', () => {
    expect(service.users()).toEqual([]);
  });

  it('lastSearchTerm computed signal starts as empty string', () => {
    expect(service.lastSearchTerm()).toBe('');
  });

  it('lastSearchTerm updates synchronously when searchUsers() is called', () => {
    service.searchUsers('angular').subscribe();
    // searchTerm.set() is called synchronously inside searchUsers() before HTTP
    expect(service.lastSearchTerm()).toBe('angular');
    httpMock.expectOne((r) => r.url === SEARCH_URL).flush({ total_count: 0, items: [] });
  });

  it('users signal updates after a successful searchAndStoreUsers()', () => {
    service.searchAndStoreUsers('octocat');

    // users signal is [] until HTTP resolves
    expect(service.users()).toEqual([]);

    httpMock
      .expectOne((r) => r.url === SEARCH_URL)
      .flush({ total_count: 1, items: [mockUser] });

    // after flush() the observable completes synchronously → signal is updated
    expect(service.users()).toEqual([mockUser]);
  });

  it('users signal resets to [] when query is cleared', () => {
    // populate first
    service.searchAndStoreUsers('octocat');
    httpMock.expectOne((r) => r.url === SEARCH_URL).flush({ total_count: 1, items: [mockUser] });
    expect(service.users().length).toBe(1);

    // clear
    service.searchAndStoreUsers('');
    expect(service.users()).toEqual([]);
  });

  it('users signal resets to [] on HTTP error', () => {
    service.searchAndStoreUsers('broken');
    httpMock
      .expectOne((r) => r.url === SEARCH_URL)
      .flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.users()).toEqual([]);
  });

  it('users computed signal reflects the latest search result independently of lastSearchTerm', () => {
    service.searchAndStoreUsers('first');
    httpMock.expectOne((r) => r.url === SEARCH_URL).flush({ total_count: 1, items: [mockUser] });

    expect(service.lastSearchTerm()).toBe('first');
    expect(service.users()).toEqual([mockUser]);

    service.searchAndStoreUsers('second');
    httpMock.expectOne((r) => r.url === SEARCH_URL).flush({ total_count: 0, items: [] });

    expect(service.lastSearchTerm()).toBe('second');
    expect(service.users()).toEqual([]);
  });
});
