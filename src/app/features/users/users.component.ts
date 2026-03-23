import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GitHubApiService, GitHubUserSearchResponse } from '../../core/github-api.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounce, debounceTime, distinctUntilChanged, filter, finalize, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-users-page',
  template: `
    <section class="page">
      <h1>Users</h1>
      <p>Search GitHub users.</p>

      <form (submit)="onSubmit($event)" class="mt-3">
        <label class="field">
          <span class="field__label">GitHub username</span>
          <input
            class="field__input"
            type="search"
            name="query"
            [value]="query()"
            (input)="onQueryChange($any($event.target).value)"
            placeholder="e.g. angular, torvalds"
          />
        </label>
        <button type="submit" class="btn mt-2">Search</button>
      </form>

      @if(loading()) {
        <p class="mt-3 text-muted">Loading...</p>
      } @else {
        @if (users().length) {
          <section class="mt-3">
            <h2 class="text-lg">Results for "{{ lastSearchTerm() }}"</h2>
            <ul class="mt-2">
              @for(user of users(); track user) {
                <li class="mt-1">
                  <a [href]="user.html_url" target="_blank" rel="noreferrer">
                    {{ user.login }} (id: {{ user.id }})
                  </a>
                </li>
              }
            </ul>
          </section>
        } @else if (lastSearchTerm()) {
          <p class="mt-3 text-muted">No users found.</p>
        }
      }
    </section>
  `,
  styleUrls: ['./users.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  private readonly api = inject(GitHubApiService);

  protected readonly query = signal<string>('');
  protected readonly loading = signal<boolean>(false);



  protected readonly error = signal<string | null>(null);

  protected readonly users = this.api.users;
  protected readonly lastSearchTerm = this.api.lastSearchTerm;

  protected onQueryChange(value: string): void {
    this.query.set(value);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.api.searchAndStoreUsers(this.query());
  }
}
