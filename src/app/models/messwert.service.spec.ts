import { TestBed } from '@angular/core/testing';

import { MesswertService } from './messwert.service';

describe('MesswertService', () => {
  let service: MesswertService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MesswertService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
