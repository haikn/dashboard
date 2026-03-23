import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface GitHubUserSearchResponse {
  total_count: number;
  items: GitHubUser[];
}

@Injectable({ providedIn: 'root' })
export class GitHubApiService {
  private readonly searchTerm = signal<string>('');
  private readonly _users = signal<GitHubUser[]>([]);

  readonly users = computed(() => this._users());
  readonly lastSearchTerm = computed(() => this.searchTerm());

  constructor(private readonly http: HttpClient) {}

  searchUsers(query: string): Observable<GitHubUserSearchResponse> {
    this.searchTerm.set(query);
    const params = { q: query, per_page: 10 }; // simple default page size
    return this.http.get<GitHubUserSearchResponse>('https://api.github.com/search/users', {
      params,
    });
  }

  /**
   * Convenience method to execute a search and store results in an internal signal
   * so components can consume `users` as a signal instead of handling the observable.
   */
  searchAndStoreUsers(query: string): void {
    if (!query.trim()) {
      this._users.set([]);
      return;
    }

    this.searchUsers(query).subscribe({
      next: (response) => this._users.set(response.items ?? []),
      error: () => this._users.set([]),
    });
  }
}
