import {TestBed} from '@angular/core/testing';

import {MqttClient} from './mqtt-client.service';

describe('MqttClient', () => {
  let service: MqttClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MqttClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
