import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TestCheck } from './test-check';

describe('TestCheck', () => {
  let service: TestCheck;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TestCheck);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
