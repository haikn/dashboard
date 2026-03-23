import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { GitHubApiService, GitHubUserSearchResponse } from './github-api.service';

const SEARCH_URL = 'https://api.github.com/search/users';

const mockUser = {
  id: 1,
  login: 'octocat',
  avatar_url: 'https://avatars.githubusercontent.com/u/1',
  html_url: 'https://github.com/octocat',
};

const mockResponse: GitHubUserSearchResponse = {
  total_count: 1,
  items: [mockUser],
};

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
    // Fails if any request was made but not asserted, or asserted but not flushed
    httpMock.verify();
  });

  // ─── searchUsers() ─────────────────────────────────────────────────────────

  describe('searchUsers()', () => {
    it('should send GET to the GitHub search endpoint', () => {
      service.searchUsers('octocat').subscribe();

      const req = httpMock.expectOne((r) => r.url === SEARCH_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should send q and per_page query params', () => {
      service.searchUsers('octocat').subscribe();

      const req = httpMock.expectOne((r) => r.url === SEARCH_URL);
      expect(req.request.params.get('q')).toBe('octocat');
      expect(req.request.params.get('per_page')).toBe('10');
      req.flush(mockResponse);
    });

    it('should update the lastSearchTerm signal', () => {
      service.searchUsers('angular').subscribe();
      httpMock.expectOne((r) => r.url === SEARCH_URL).flush(mockResponse);

      expect(service.lastSearchTerm()).toBe('angular');
    });

    it('should return the server response as an observable', () => {
      let actual!: GitHubUserSearchResponse;
      service.searchUsers('octocat').subscribe((res) => (actual = res));

      httpMock.expectOne((r) => r.url === SEARCH_URL).flush(mockResponse);

      expect(actual.total_count).toBe(1);
      expect(actual.items[0]?.login).toBe('octocat');
    });
  });

  // ─── searchAndStoreUsers() ─────────────────────────────────────────────────

  describe('searchAndStoreUsers()', () => {
    it('should start with an empty users signal', () => {
      expect(service.users()).toEqual([]);
    });

    it('should populate the users signal on success', () => {
      service.searchAndStoreUsers('octocat');

      httpMock.expectOne((r) => r.url === SEARCH_URL).flush(mockResponse);

      expect(service.users()).toEqual([mockUser]);
    });

    it('should clear users and make no HTTP request when query is empty', () => {
      // First populate users
      service.searchAndStoreUsers('octocat');
      httpMock.expectOne((r) => r.url === SEARCH_URL).flush(mockResponse);
      expect(service.users().length).toBe(1);

      // Now clear
      service.searchAndStoreUsers('');
      httpMock.expectNone((r) => r.url === SEARCH_URL);

      expect(service.users()).toEqual([]);
    });

    it('should clear users and make no HTTP request when query is only whitespace', () => {
      service.searchAndStoreUsers('   ');
      httpMock.expectNone((r) => r.url === SEARCH_URL);

      expect(service.users()).toEqual([]);
    });

    it('should set users to [] on a 500 server error', () => {
      service.searchAndStoreUsers('broken');

      httpMock
        .expectOne((r) => r.url === SEARCH_URL)
        .flush('Internal Server Error', { status: 500, statusText: 'Server Error' });

      expect(service.users()).toEqual([]);
    });

    it('should set users to [] on a 404 not found error', () => {
      service.searchAndStoreUsers('nobody');

      httpMock
        .expectOne((r) => r.url === SEARCH_URL)
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(service.users()).toEqual([]);
    });

    it('should handle a response with an empty items array', () => {
      service.searchAndStoreUsers('ghost');

      httpMock
        .expectOne((r) => r.url === SEARCH_URL)
        .flush({ total_count: 0, items: [] });

      expect(service.users()).toEqual([]);
    });
  });
});
