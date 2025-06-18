import {TestBed} from '@angular/core/testing';

import {MessdatenService} from './messdaten.service';

describe('MessdatenService', () => {
  let service: MessdatenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessdatenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
