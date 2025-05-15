import { Injectable } from '@angular/core';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MqttClientService {

  constructor(private _mqttService: MqttService) {}

  public observeTopic(topic: string): Observable<IMqttMessage> {
    return this._mqttService.observe(topic);
  }

}
