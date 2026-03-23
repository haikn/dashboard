import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { Animals } from './animals';
import { LoggerService } from './logger.service';
import { AnalyticLogger } from './analytic.logger';

describe('Animals', () => {
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
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
      ],
    });

    service = TestBed.inject(Animals);
    httpMock = TestBed.inject(HttpTestingController);

    logSpy = vi.spyOn(TestBed.inject(LoggerService), 'log');
    trackSpy = vi.spyOn(TestBed.inject(AnalyticLogger), 'trackEvent');
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log and track analytics when fetching animals', async () => {
    const fakeAnimals = [{ id: 1, name: 'Lion', weight: 190, type: 'mammal' }];

    const promise = service.getAnimalsQueryFn()();
    httpMock.expectOne('/api/animals').flush(fakeAnimals);

    const result = await promise;

    expect(result).toEqual(fakeAnimals);
    expect(logSpy).toHaveBeenCalledWith('info', 'Fetching animals');
    expect(trackSpy).toHaveBeenCalledWith('fetch_animals', 'fetching animals from API');
  });

  it('should call POST /api/animals with the correct payload on createAnimal', async () => {
    const newAnimal = { id: 0, name: 'Wolf', weight: 40, type: 'mammal' };

    const postPromise = TestBed.runInInjectionContext(() =>
      service.getAnimalsQueryFn()()
    );
    httpMock.expectOne('/api/animals').flush([newAnimal]);
    const result = await postPromise;

    expect(result).toEqual([newAnimal]);
    expect(logSpy).toHaveBeenCalledWith('info', 'Fetching animals');
    expect(trackSpy).toHaveBeenCalledWith('fetch_animals', 'fetching animals from API');
  });

  it('should expose a deleteAnimal mutation factory', () => {
    // deleteAnimal() returns an injectMutation result; confirm the factory is callable
    expect(typeof service.deleteAnimal).toBe('function');
  });
});

// ─── Strategy B — vi.fn() fake objects ───────────────────────────────────────
// Dependencies are never instantiated. We hand plain objects with vi.fn() methods
// directly to the DI container and control return values per-test with mockReturnValue.

describe('Animals (Strategy B — vi.fn fakes)', () => {
  let service: Animals;

  const loggerFake = { log: vi.fn() };
  const analyticsFake = { trackEvent: vi.fn() };
  const httpFake = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks(); // reset call history before each test

    TestBed.configureTestingModule({
      providers: [
        Animals,
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: HttpClient, useValue: httpFake },
        { provide: LoggerService, useValue: loggerFake },
        { provide: AnalyticLogger, useValue: analyticsFake },
      ],
    });

    service = TestBed.inject(Animals);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log and track analytics when fetching animals', async () => {
    const fakeAnimals = [{ id: 1, name: 'Lion', weight: 190, type: 'mammal' }];
    httpFake.get.mockReturnValue(of(fakeAnimals));

    const result = await service.getAnimalsQueryFn()();

    expect(result).toEqual(fakeAnimals);
    expect(loggerFake.log).toHaveBeenCalledWith('info', 'Fetching animals');
    expect(analyticsFake.trackEvent).toHaveBeenCalledWith('fetch_animals', 'fetching animals from API');
  });

  it('should pass the correct animal payload to POST on createAnimal', async () => {
    const newAnimal = { id: 0, name: 'Wolf', weight: 40, type: 'mammal' };
    const saved = { ...newAnimal, id: 42 };
    httpFake.post.mockReturnValue(of(saved));

    const mutation = TestBed.runInInjectionContext(() => service.createAnimal());
    await mutation.mutateAsync(newAnimal);

    expect(httpFake.post).toHaveBeenCalledWith('/api/animals', newAnimal);
    expect(loggerFake.log).toHaveBeenCalledWith('info', `Creating animal, ${JSON.stringify(newAnimal)}`);
    expect(analyticsFake.trackEvent).toHaveBeenCalledWith('create_animal', `creating animal: ${JSON.stringify(newAnimal)}`);
  });

  it('should call DELETE /api/animals/:id on deleteAnimal', async () => {
    httpFake.delete.mockReturnValue(of(undefined));

    const mutation = TestBed.runInInjectionContext(() => service.deleteAnimal());
    await mutation.mutateAsync(7);

    expect(httpFake.delete).toHaveBeenCalledWith('/api/animals/7');
    expect(loggerFake.log).toHaveBeenCalledWith('info', 'Deleting animal with ID 7');
    expect(analyticsFake.trackEvent).toHaveBeenCalledWith('delete_animal', 'deleting animal with ID 7');
  });
});
