import { TestBed } from '@angular/core/testing';

import { MealPrepService } from './meal-prep-service';

describe('MealPrepService', () => {
  let service: MealPrepService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MealPrepService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
