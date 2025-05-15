import { TestBed } from '@angular/core/testing';

import { EnergiekostenService } from './energiekosten.service';

describe('EnergiekostenService', () => {
  let service: EnergiekostenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnergiekostenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
