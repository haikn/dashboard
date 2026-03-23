# Advanced Angular Testing

> A practical guide to writing robust, maintainable tests for modern Angular applications using **Vitest** — covering services, components, directives, pipes, signals, HTTP, injection tokens, and integration patterns. All examples are grounded in the real structure of this project.

> **Test runner:** Angular 21 ships `@angular/build:unit-test`, a first-party builder that runs your specs through **Vitest** with JSDOM. There is no Karma or Jasmine involved.

---

## Table of Contents

1. [The Angular Testing Pyramid](#1-the-angular-testing-pyramid)
2. [Setup: Vitest with Angular 21](#2-setup-vitest-with-angular-21)
3. [TestBed: The Foundation](#3-testbed-the-foundation)
4. [Testing Services with Dependencies](#4-testing-services-with-dependencies)
5. [Testing HTTP Services](#5-testing-http-services)
6. [Testing Signals](#6-testing-signals)
7. [Testing Components with OnPush](#7-testing-components-with-onpush)
8. [Testing Standalone Components](#8-testing-standalone-components)
9. [Testing Attribute Directives](#9-testing-attribute-directives)
10. [Testing Pipes](#10-testing-pipes)
11. [Testing Injection Tokens and Factories](#11-testing-injection-tokens-and-factories)
12. [Testing with TanStack Query](#12-testing-with-tanstack-query)
13. [Integration Testing](#13-integration-testing)
14. [Avoiding Common Pitfalls](#14-avoiding-common-pitfalls)
15. [Code Coverage and Quality Gates](#15-code-coverage-and-quality-gates)

---

## 1. The Angular Testing Pyramid

Angular's testing ecosystem is built on three layers:

```
        ┌──────────────┐
        │  E2E Tests   │  ← Playwright / Cypress  (few, slow, high confidence)
        ├──────────────┤
        │ Integration  │  ← TestBed with real DOM  (moderate)
        ├──────────────┤
        │  Unit Tests  │  ← Isolated, fast, many   (bulk of your suite)
        └──────────────┘
```

**Key principle:** push as much logic as possible into pure functions and services — they are trivially unit-testable. Reserve `TestBed` for testing Angular-specific concerns (template bindings, DI, change detection).

---

## 2. Setup: Vitest with Angular 21

Angular 21 includes `@angular/build:unit-test`, a first-party builder that drives Vitest internally. No separate Karma, Jasmine, or `@analogjs/vitest-angular` package is required.

### `angular.json`

```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "runner": "vitest",
    "tsConfig": "tsconfig.spec.json"
  }
}
```

### `tsconfig.spec.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.d.ts", "src/**/*.spec.ts"]
}
```

The `"types": ["vitest/globals"]` entry injects `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` etc. as TypeScript globals — no explicit import needed in every file.

### `package.json` scripts

```json
"scripts": {
  "test": "ng test",
  "test:watch": "ng test --watch",
  "test:coverage": "ng test --coverage"
}
```

### Vitest vs Jasmine API cheat-sheet

| Jasmine | Vitest equivalent |
|---|---|
| `jasmine.createSpyObj('Name', ['m1'])` | `{ m1: vi.fn() }` |
| `spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')` |
| `spy.and.returnValue(val)` | `spy.mockReturnValue(val)` |
| `spy.and.returnValues(a, b)` | `spy.mockReturnValueOnce(a).mockReturnValueOnce(b)` |
| `spy.and.callFake(fn)` | `spy.mockImplementation(fn)` |
| `spy.and.rejectWith(err)` | `spy.mockRejectedValue(err)` |
| `jasmine.createSpy('name')` | `vi.fn()` |
| `jasmine.any(Type)` | `expect.any(Type)` |
| `jasmine.objectContaining({...})` | `expect.objectContaining({...})` |
| `fakeAsync / tick(ms)` | `vi.useFakeTimers() / vi.advanceTimersByTime(ms)` |
| `spyOn(...).calls.reset()` | `spy.mockReset()` |
| `spy.calls.count()` | `spy.mock.calls.length` |

---

## 3. TestBed: The Foundation

`TestBed` is Angular's primary testing utility. It creates a mini Angular module in which you can configure providers, import components, and interact with the injector.

### Basic structure

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService],
    });
    service = TestBed.inject(MyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

### Using `compileComponents` for template-backed components

When a component has an external template or stylesheet, call `compileComponents()` (always async):

```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [MyComponent],
  }).compileComponents();
});
```

> **Tip:** Standalone components with inline templates don't need `compileComponents()`, but it is harmless to call it consistently.

---

## 4. Testing Services with Dependencies

Real services rarely live in isolation. The `Animals` service in this project, for example, depends on `HttpClient`, `LoggerService`, and `AnalyticLogger`. Testing such services cleanly requires **spies** or **fakes** for each dependency.

### Strategy A — `vi.spyOn` (preferred with real instances)

`vi.spyOn` wraps a real method on a live instance, so the class is still created by Angular's DI. Use `vi.restoreAllMocks()` in `afterEach` to keep tests independent.

```typescript
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Animals } from './animals';
import { LoggerService } from './logger.service';
import { AnalyticLogger } from './analytic.logger';

describe('Animals (vi.spyOn)', () => {
  let service: Animals;
  let httpMock: HttpTestingController;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let trackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Animals,
        LoggerService,
        AnalyticLogger,
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    });

    service  = TestBed.inject(Animals);
    httpMock = TestBed.inject(HttpTestingController);

    logSpy   = vi.spyOn(TestBed.inject(LoggerService),  'log');
    trackSpy = vi.spyOn(TestBed.inject(AnalyticLogger), 'trackEvent');
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should log and track analytics when fetching animals', async () => {
    const fakeAnimals = [{ id: 1, name: 'Lion', weight: 190, type: 'mammal' }];

    const promise = service.getAnimalsQueryFn()();
    httpMock.expectOne('/api/animals').flush(fakeAnimals);

    const result = await promise;

    expect(result).toEqual(fakeAnimals);
    expect(logSpy).toHaveBeenCalledWith('info', 'Fetching animals');
    expect(trackSpy).toHaveBeenCalledWith('fetch_animals');
  });
});
```

### Strategy B — `vi.fn()` objects (manual fakes)

When you want full control over return values without spinning up the real class:

```typescript
import { vi } from 'vitest';
import { of } from 'rxjs';

const httpFake = {
  get:    vi.fn(),
  post:   vi.fn(),
  delete: vi.fn(),
};

const loggerFake = { log: vi.fn() };
const analyticsFake = { trackEvent: vi.fn() };

TestBed.configureTestingModule({
  providers: [
    Animals,
    { provide: HttpClient,     useValue: httpFake },
    { provide: LoggerService,  useValue: loggerFake },
    { provide: AnalyticLogger, useValue: analyticsFake },
  ],
});

// Control the return value per test:
httpFake.get.mockReturnValue(of([{ id: 1, name: 'Lion', weight: 190, type: 'mammal' }]));
```

### Strategy C — Partial fakes

For services with many methods where the test only exercises a few:

```typescript
const fakeLogger: Partial<LoggerService> = {
  log: vi.fn(),
};
```

### When to prefer each strategy

| Scenario | Recommendation |
|---|---|
| Testing through the real DI graph | `vi.spyOn` on injected instances |
| Need precise control over return values | `vi.fn()` fake object |
| Service has many methods, test uses few | Partial fake with `vi.fn()` |
| No side-effects in the real class | Use the real class |

---

## 5. Testing HTTP Services

The `GitHubApiService` makes real HTTP calls. In tests, replace the transport layer with Angular's `HttpTestingController`.

### Setup

```typescript
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GitHubApiService, GitHubUserSearchResponse } from './github-api.service';

describe('GitHubApiService', () => {
  let service: GitHubApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GitHubApiService,
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(GitHubApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify that no unexpected requests were made
    httpMock.verify();
  });

  it('should search GitHub users and return items', () => {
    const mockResponse: GitHubUserSearchResponse = {
      total_count: 1,
      items: [
        { id: 1, login: 'octocat', avatar_url: '', html_url: '' },
      ],
    };

    let actual!: GitHubUserSearchResponse;
    service.searchUsers('octocat').subscribe((res) => (actual = res));

    const req = httpMock.expectOne((r) =>
      r.url.includes('github.com/search/users') && r.params.get('q') === 'octocat'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(actual.total_count).toBe(1);
    expect(actual.items[0].login).toBe('octocat');
  });

  it('should clear the users signal when given an empty query', () => {
    service.searchAndStoreUsers('');
    expect(service.users()).toEqual([]);
    // No HTTP request should have been made
    httpMock.expectNone(() => true);
  });

  it('should set users signal to [] on HTTP error', () => {
    service.searchAndStoreUsers('broken');

    const req = httpMock.expectOne(() => true);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(service.users()).toEqual([]);
  });
});
```

### Key `HttpTestingController` methods

| Method | Purpose |
|---|---|
| `expectOne(urlOrFn)` | Assert exactly one matching request was made |
| `expectNone(urlOrFn)` | Assert no matching requests were made |
| `match(urlOrFn)` | Return all matching requests (useful for batch calls) |
| `verify()` | Fail the test if any unexpected requests remain |

---

## 6. Testing Signals

Angular's signals are synchronous reactive primitives. Testing them does **not** require async helpers — just read and assert.

### Testing a signal-based service

```typescript
import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

describe('LoggerService (signals)', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);
  });

  it('should start with an empty log', () => {
    expect(service.entries()).toEqual([]);
  });

  it('should append a formatted entry on log()', () => {
    service.log('info', 'Hello world');

    const entries = service.entries();
    expect(entries.length).toBe(1);
    expect(entries[0]).toContain('[INFO]');
    expect(entries[0]).toContain('Hello world');
  });

  it('should accumulate multiple entries in order', () => {
    service.log('debug', 'first');
    service.log('warn', 'second');

    expect(service.entries().length).toBe(2);
    expect(service.entries()[1]).toContain('[WARN]');
  });
});
```

### Testing computed signals in components

`computed()` values are lazily evaluated but always consistent. Trigger them by reading the signal inside a reactive context — or simply call `fixture.detectChanges()` to let the component compute:

```typescript
it('should update computed value when signal changes', () => {
  const fixture = TestBed.createComponent(DashboardComponent);
  fixture.detectChanges();

  // Directly manipulate internal signal via component instance (white-box)
  const comp = fixture.componentInstance as any;
  comp.project.set({ id: 'p-2', name: 'New', status: 'completed' });
  fixture.detectChanges();

  const el = fixture.nativeElement as HTMLElement;
  expect(el.textContent).toContain('completed');
});
```

### Using `TestBed.flushEffects()` (Angular 19+)

When a component uses `effect()`, flush pending effects manually:

```typescript
it('should react to signal change via effect', () => {
  const fixture = TestBed.createComponent(MyComponent);
  fixture.detectChanges();

  fixture.componentInstance.someSignal.set('new value');
  TestBed.flushEffects();  // runs all pending effects synchronously

  expect(fixture.nativeElement.textContent).toContain('new value');
});
```

---

## 7. Testing Components with OnPush

`ChangeDetectionStrategy.OnPush` components only update when inputs change by reference or when `markForCheck()` is called. This requires extra care in tests.

### The `DashboardComponent` example

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { APP_CONFIG } from '../../core/app-config.token';
import { LoggerService } from '../../core/logger.service';

const TEST_CONFIG = {
  apiBaseUrl: 'http://localhost',
  environment: 'development' as const,
  featureFlags: { enableTasks: true, enableAdvancedStats: false },
};

describe('DashboardComponent (OnPush)', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // initial render
  });

  it('should render the dashboard title', () => {
    const h1 = fixture.nativeElement.querySelector('h1, h2, [data-testid="title"]');
    expect(h1?.textContent).toBeTruthy();
  });

  it('should update the project status after markInProgress()', () => {
    (component as any).markInProgress();
    // With OnPush, we MUST call detectChanges() to flush the CD cycle
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('in-progress');
  });
});
```

### Common OnPush mistakes

```typescript
// ❌ BAD — forgetting detectChanges after mutating state
component.someSignal.set('updated');
expect(fixture.nativeElement.textContent).toContain('updated'); // may fail!

// ✅ GOOD
component.someSignal.set('updated');
fixture.detectChanges();
expect(fixture.nativeElement.textContent).toContain('updated');
```

---

## 8. Testing Standalone Components

Modern Angular uses standalone components. `TestBed` accepts them directly in `imports`:

```typescript
import { TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  it('should display the title input', async () => {
    const fixture = TestBed.createComponent(StatCardComponent);
    fixture.componentRef.setInput('title', 'Users Online');
    fixture.componentRef.setInput('value', 42);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.card__title')?.textContent?.trim()).toBe('Users Online');
    expect(el.querySelector('.card__value')?.textContent?.trim()).toBe('42');
  });

  it('should not apply card--emphasis class by default', () => {
    const fixture = TestBed.createComponent(StatCardComponent);
    fixture.componentRef.setInput('title', 'Test');
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector('article');
    expect(article?.classList).not.toContain('card--emphasis');
  });

  it('should apply card--emphasis when emphasis input is true', () => {
    const fixture = TestBed.createComponent(StatCardComponent);
    fixture.componentRef.setInput('title', 'Highlighted');
    fixture.componentRef.setInput('emphasis', true);
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector('article');
    expect(article?.classList).toContain('card--emphasis');
  });
});
```

> **Note:** Use `fixture.componentRef.setInput()` (Angular 16+) instead of directly assigning to signal-based inputs — this is the proper public API.

---

## 9. Testing Attribute Directives

Attribute directives require a **host component** to be mounted. Create a minimal `@Component` inside the test file:

```typescript
import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HighlightDirective } from './highlight.directive';

@Component({
  standalone: true,
  imports: [HighlightDirective],
  template: `<p [appHighlight]="color">Hover me</p>`,
})
class TestHostComponent {
  color: string | null = null;
}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let pEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    pEl = fixture.debugElement.query(By.directive(HighlightDirective)).nativeElement;
  });

  it('should not apply a background on initial render', () => {
    expect(pEl.style.backgroundColor).toBeFalsy();
  });

  it('should highlight with the default colour on mouseenter', () => {
    pEl.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(pEl.style.backgroundColor).toBe('rgb(255, 214, 0)'); // #ffd600
  });

  it('should use the custom colour when provided', () => {
    host.color = '#ff0000';
    fixture.detectChanges();

    pEl.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(pEl.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('should remove the highlight on mouseleave', () => {
    pEl.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    pEl.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();

    expect(pEl.style.backgroundColor).toBeFalsy();
  });
});
```

---

## 10. Testing Pipes

Pipes are plain TypeScript classes — test them **without** `TestBed` for speed, or with it if they depend on injected services.

### Pure pipe (no `TestBed` needed)

```typescript
import { StatusLabelPipe } from './status-label.pipe';

describe('StatusLabelPipe', () => {
  let pipe: StatusLabelPipe;

  beforeEach(() => {
    pipe = new StatusLabelPipe();
  });

  it('should transform "in-progress" to "In progress"', () => {
    expect(pipe.transform('in-progress')).toBe('In progress');
  });

  it('should transform "planned" to "Planned"', () => {
    expect(pipe.transform('planned')).toBe('Planned');
  });

  it('should return the raw value for unrecognised strings', () => {
    expect(pipe.transform('unknown-status')).toBe('unknown-status');
  });

  it('should return an empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return an empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});
```

### Pipe inside a template

```typescript
@Component({
  standalone: true,
  imports: [StatusLabelPipe],
  template: `<span>{{ status | statusLabel }}</span>`,
})
class TestHostComponent {
  status: string = 'active';
}

it('should render the correct label in a template', async () => {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();

  expect(fixture.nativeElement.querySelector('span').textContent).toBe('Active');
});
```

---

## 11. Testing Injection Tokens and Factories

### Providing a custom token in tests

The `APP_CONFIG` token (`InjectionToken<AppConfig>`) must always be provided explicitly in test beds — it has no default value.

```typescript
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, AppConfig } from './app-config.token';

const TEST_CONFIG: AppConfig = {
  apiBaseUrl: 'http://localhost:4000',
  environment: 'development',
  featureFlags: {
    enableTasks: false,
    enableAdvancedStats: false,
  },
};

describe('APP_CONFIG token', () => {
  it('should inject the provided config value', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_CONFIG, useValue: TEST_CONFIG }],
    });

    const config = TestBed.inject(APP_CONFIG);
    expect(config.apiBaseUrl).toBe('http://localhost:4000');
    expect(config.featureFlags.enableTasks).toBe(false);
  });
});
```

### Testing a `useFactory` provider

The `currentDateFactory` in this project uses `inject(APP_CONFIG)` internally:

```typescript
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from './app-config.token';
import { currentDateFactory } from './date.factory';

describe('currentDateFactory', () => {
  it('should produce a Date instance', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
        { provide: Date, useFactory: currentDateFactory },
      ],
    });

    const date = TestBed.inject(Date);
    expect(date).toBeInstanceOf(Date);
  });

  it('should produce a date close to now', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
        { provide: Date, useFactory: currentDateFactory },
      ],
    });

    const before = Date.now();
    const injected = TestBed.inject(Date);
    const after = Date.now();

    expect(injected.getTime()).toBeGreaterThanOrEqual(before);
    expect(injected.getTime()).toBeLessThanOrEqual(after);
  });
});
```

### Overriding a factory for time-sensitive tests

Deterministic time is critical for tests that render dates:

```typescript
const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z');

TestBed.configureTestingModule({
  providers: [
    { provide: APP_CONFIG, useValue: TEST_CONFIG },
    { provide: Date, useValue: FIXED_DATE },
  ],
});
```

---

## 12. Testing with TanStack Query

The `Animals` service uses `@tanstack/angular-query-experimental`. Integration tests need `provideTanStackQuery` with a fresh `QueryClient` per test to avoid cache bleed-through.

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Animals } from './animals';
import { LoggerService } from './logger.service';
import { AnalyticLogger } from './analytic.logger';
import { of } from 'rxjs';

describe('Animals service (TanStack Query)', () => {
  let service: Animals;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Animals,
        LoggerService,
        AnalyticLogger,
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        // Always use a fresh QueryClient per test suite to avoid cache pollution
        provideTanStackQuery(new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })),
      ],
    });

    service = TestBed.inject(Animals);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch animals from the API', async () => {
    const fakeData = [{ id: 1, name: 'Wolf', weight: 40, type: 'mammal' }];

    const queryFn = service.getAnimalsQueryFn();
    const promise = queryFn();

    httpMock.expectOne('/api/animals').flush(fakeData);

    const result = await promise;
    expect(result).toEqual(fakeData);
  });
});
```

> **Key setting:** `retry: false` in test `QueryClient` prevents silent retries from masking failures or leaving dangling HTTP requests.

---

## 13. Integration Testing

Integration tests exercise the full Angular DI tree, template rendering, and event propagation — without spinning up a real browser.

### Testing a feature flow end-to-end

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { APP_CONFIG } from '../../core/app-config.token';
import { By } from '@angular/platform-browser';

describe('Dashboard — integration', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: APP_CONFIG,
          useValue: {
            apiBaseUrl: 'http://localhost',
            environment: 'development',
            featureFlags: { enableTasks: true, enableAdvancedStats: true },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('should mark the project in-progress when the button is clicked', () => {
    const btn = fixture.debugElement.query(By.css('[data-testid="mark-in-progress"]'));
    btn?.nativeElement.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('in-progress');
  });

  it('should toggle the user status between active and busy', () => {
    const btn = fixture.debugElement.query(By.css('[data-testid="toggle-status"]'));

    btn?.nativeElement.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('busy');

    btn?.nativeElement.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('active');
  });
});
```

### `By.css` vs `By.directive`

| Selector | Use when |
|---|---|
| `By.css('.my-class')` | Targeting DOM structure |
| `By.directive(MyDirective)` | Asserting that a directive is applied |
| `By.css('[data-testid]')` | Best practice — decoupled from implementation |

> **Recommendation:** Add `data-testid` attributes to interactive elements in your templates. They survive CSS changes and refactors.

---

## 14. Avoiding Common Pitfalls

### Pitfall 1 — Shared `TestBed` state

Every `describe` block should call `TestBed.configureTestingModule()` inside a `beforeEach`. Jasmine's `TestBed` auto-resets between tests, but placing configuration inside a `beforeAll` bypasses this and leaks state.

```typescript
// ❌ BAD — shared module leaks into other describe blocks
beforeAll(async () => {
  await TestBed.configureTestingModule({ ... }).compileComponents();
});

// ✅ GOOD — fresh module per test
beforeEach(async () => {
  await TestBed.configureTestingModule({ ... }).compileComponents();
});
```

### Pitfall 2 — Not flushing async operations

For timer-based code, use Vitest's fake timer API:

```typescript
import { vi } from 'vitest';

it('should debounce search input', async () => {
  vi.useFakeTimers();

  component.onSearchChange('ang');
  vi.advanceTimersByTime(300); // advance the virtual clock
  fixture.detectChanges();

  expect(searchSpy).toHaveBeenCalledWith('ang');
  vi.useRealTimers();
});
```

Always call `vi.useRealTimers()` at the end (or in an `afterEach`) so fake timers don't bleed into other tests.

For Promise-based async, plain `async/await` with `await fixture.whenStable()` is sufficient — no wrapper needed:

```typescript
it('should resolve async data', async () => {
  fixture.detectChanges();
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('Loaded');
});
```

### Pitfall 3 — Testing implementation, not behaviour

```typescript
// ❌ BAD — tests private method name
expect((service as any)._internalCache).toBeDefined();

// ✅ GOOD — tests observable behaviour
expect(service.users()).toHaveLength(3);
```

### Pitfall 4 — Overly broad `expect.any()`

```typescript
// ❌ BAD — too permissive
expect(logSpy).toHaveBeenCalledWith(expect.any(String), expect.any(String));

// ✅ GOOD — asserts the exact contract
expect(logSpy).toHaveBeenCalledWith('info', 'Fetching animals');
```

### Pitfall 5 — Not cleaning up subscriptions

If a test manually subscribes to an observable, unsubscribe in `afterEach`:

```typescript
let sub: Subscription;
afterEach(() => sub?.unsubscribe());

it('should emit values', () => {
  sub = service.stream$.subscribe(val => { /* assert */ });
});
```

---

## 15. Code Coverage and Quality Gates

### Running coverage with Vitest

```bash
# single run with coverage report
npm run test:coverage
# equivalent to:
ng test --coverage
```

Coverage reports land in `coverage/` at the project root. The default reporter is `v8`. You can customise thresholds inside your `angular.json` test options:

```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "runner": "vitest",
    "tsConfig": "tsconfig.spec.json",
    "coverage": {
      "enabled": true,
      "provider": "v8",
      "thresholds": {
        "statements": 80,
        "branches": 75,
        "functions": 80,
        "lines": 80
      }
    }
  }
}
```

Alternatively, create a `vitest.config.ts` to configure coverage outside of `angular.json`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 80,
        branches:   75,
        functions:  80,
        lines:      80,
      },
      exclude: ['**/*.spec.ts', 'src/main.ts'],
    },
  },
});
```

### Interpreting coverage

| Metric | Measures |
|---|---|
| **Statements** | Every executable statement |
| **Branches** | Each path through `if`/`switch`/`??` |
| **Functions** | Every function/method |
| **Lines** | Physical lines of source |

A high branch coverage number is the most meaningful quality gate because it proves all conditional logic paths have been exercised.

### Recommended thresholds

| Project type | Minimum target |
|---|---|
| Core services / libraries | 90%+ |
| Feature components | 70–80% |
| UI-only components | 60%+ |

### Excluding from coverage

Mark code that cannot reasonably be tested (e.g., error-boundary fallbacks) with Istanbul pragmas:

```typescript
/* istanbul ignore next */
if (process.env['NODE_ENV'] === 'test') { ... }
```

Use these sparingly — each exclusion is a gap in your safety net.

---

## Summary

| Topic | Key tool / pattern |
|---|---|
| Test runner | `@angular/build:unit-test` + Vitest (no Karma/Jasmine) |
| Service spies | `vi.spyOn(instance, 'method')` / `vi.fn()` fake objects |
| Controlling return values | `spy.mockReturnValue(val)` / `spy.mockResolvedValue(val)` |
| HTTP testing | `provideHttpClientTesting`, `HttpTestingController` |
| Signals | Synchronous reads + `detectChanges()` |
| Components | `ComponentFixture`, `setInput()`, `detectChanges()` |
| OnPush | Always call `detectChanges()` after state change |
| Directives | Minimal `TestHostComponent` wrapper |
| Pipes | Instantiate directly without `TestBed` |
| Tokens / factories | `{ provide: TOKEN, useValue: ... }` |
| TanStack Query | Fresh `QueryClient` per suite, `retry: false` |
| Integration | `By.css('[data-testid]')`, simulate real events |
| Fake timers | `vi.useFakeTimers()` + `vi.advanceTimersByTime(ms)` |
| Cleanup | `vi.restoreAllMocks()` in `afterEach` |

> **Golden rule:** A test should fail only when the _behaviour_ breaks, not when the _implementation_ changes. Keep tests black-box wherever possible.
