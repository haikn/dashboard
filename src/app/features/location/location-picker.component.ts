import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { LocationResult, LocationService } from '../../core/location.service';

@Component({
  selector: 'app-location-picker',
  imports: [ReactiveFormsModule],
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationPickerComponent implements OnInit, OnDestroy {
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  protected readonly searchControl = new FormControl('');
  protected readonly results = signal<LocationResult[]>([]);
  protected readonly searching = signal(false);
  protected readonly activeIndex = signal(-1);

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap(term => {
          const t = term?.trim() ?? '';
          if (t.length < 2) {
            this.results.set([]);
            this.searching.set(false);
            return of([]);
          }
          this.searching.set(true);
          this.activeIndex.set(-1);
          return this.locationService.search(t);
        }),
      )
      .subscribe(results => {
        this.results.set(results);
        this.searching.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected select(loc: LocationResult): void {
    this.locationService.saveLocation(loc);
    this.router.navigate(['/dashboard']);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const list = this.results();
    if (!list.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update(i => Math.min(i + 1, list.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      const idx = this.activeIndex();
      if (idx >= 0 && idx < list.length && list[idx]) {
        this.select(list[idx]);
      }
    } else if (event.key === 'Escape') {
      this.results.set([]);
    }
  }
}
