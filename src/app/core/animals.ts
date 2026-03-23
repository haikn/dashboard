import { inject, Injectable } from '@angular/core';
import { AnalyticLogger } from './analytic.logger';
import { LoggerService } from './logger.service';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { injectMutation } from '@tanstack/angular-query-experimental';


export interface Animal {
  id: number;
  name: string;
  weight: number;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class Animals {
  #http = inject(HttpClient);
  
  constructor(
    private readonly http: HttpClient,
    private readonly logger: LoggerService,
    private readonly analytics: AnalyticLogger
  ) {}

  getAnimalsQueryFn() {
    return () => {
      this.logger.log('info', 'Fetching animals');
      this.analytics.trackEvent('fetch_animals', 'fetching animals from API');
      return lastValueFrom(this.#http.get<Animal[]>('/api/animals'));
    };
  }

  /** Create a new animal */
  
  createAnimal = () => {
    return injectMutation<Object, Error & { error: string[] }, Animal> (() => ({
      mutationFn: async (animal) => {
        this.logger.log('info', `Creating animal, ${JSON.stringify(animal)}`);
        this.analytics.trackEvent('create_animal', `creating animal: ${JSON.stringify(animal)}`);
        return lastValueFrom(this.#http.post<Animal>('/api/animals', animal));
      },
    }));
  };

  /** Delete an animal by ID */
  deleteAnimal = () => {
    return injectMutation<void, Error & { error: string[] }, number> (() => ({
      mutationFn: async (id) => {
        this.logger.log('info', `Deleting animal with ID ${id}`);
        this.analytics.trackEvent('delete_animal', `deleting animal with ID ${id}`);
        return lastValueFrom(this.#http.delete<void>(`/api/animals/${id}`));
      },
    }));
  }
}