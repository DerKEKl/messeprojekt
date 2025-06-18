import {Injectable} from '@angular/core';
import {IMqttMessage, MqttService} from 'ngx-mqtt';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {SensorData} from '../models/messwert';

export interface TemperatureData {
  value: number;
  unit: string;
  sensorId: string;
}

export interface ProductionData {
  partsCount: number;
  isProducing: boolean;
  currentPart?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MqttClientService {
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private sensorDataSubject = new Subject<SensorData>();
  private temperatureSubject = new BehaviorSubject<TemperatureData | null>(null);
  private productionSubject = new BehaviorSubject<ProductionData | null>(null);

  public connectionStatus$ = this.connectionStatus.asObservable();
  public sensorData$ = this.sensorDataSubject.asObservable();
  public temperature$ = this.temperatureSubject.asObservable();
  public production$ = this.productionSubject.asObservable();

  constructor(private mqttService: MqttService) {
    this.initializeMqttConnection();
    this.subscribeToTopics();
  }

  private initializeMqttConnection() {
    this.mqttService.state.subscribe(state => {
      this.connectionStatus.next(state === 0);
    });
  }

  private subscribeToTopics() {
    // Temperatur-Daten
    this.observeTopic('sensor/temperature').subscribe(message => {
      try {
        const data = JSON.parse(message.payload.toString());
        this.temperatureSubject.next(data);
        this.sensorDataSubject.next({
          topic: message.topic,
          data: data,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error parsing temperature data:', error);
      }
    });

    // Produktions-Daten
    this.observeTopic('production/status').subscribe(message => {
      try {
        const data = JSON.parse(message.payload.toString());
        this.productionSubject.next(data);
      } catch (error) {
        console.error('Error parsing production data:', error);
      }
    });
  }

  public observeTopic(topic: string): Observable<IMqttMessage> {
    return this.mqttService.observe(topic);
  }

  public publishMessage(topic: string, message: any): void {
    try {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.mqttService.unsafePublish(topic, payload, {qos: 1, retain: false});
    } catch (error) {
      console.error('Error publishing MQTT message:', error);
    }
  }

  public reconnect(): void {
    try {
      this.mqttService.connect();
    } catch (error) {
      console.error('Error reconnecting to MQTT:', error);
    }
  }
}
