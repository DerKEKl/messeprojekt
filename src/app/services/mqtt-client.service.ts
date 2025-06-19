import {Injectable, Optional} from '@angular/core';
import {IMqttMessage, MqttService} from 'ngx-mqtt';
import {BehaviorSubject, EMPTY, Observable, Subject, timer} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';
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
  private mqttEnabled = false;
  private destroy$ = new Subject<void>();
  private connectionAttempted = false;
  private isHttpsContext = false;

  public connectionStatus$ = this.connectionStatus.asObservable();
  public sensorData$ = this.sensorDataSubject.asObservable();
  public temperature$ = this.temperatureSubject.asObservable();
  public production$ = this.productionSubject.asObservable();

  constructor(@Optional() private mqttService: MqttService) {
    this.isHttpsContext = window.location.protocol === 'https:';

    if (this.isHttpsContext) {
      console.info('HTTPS context detected - MQTT will remain offline');
      this.connectionStatus.next(false);
      this.mqttEnabled = false;
    } else if (this.mqttService) {
      // Only initialize if MQTT service is available and not HTTPS
      this.delayedInitialization();
    } else {
      console.info('MQTT service not available - running in offline mode');
      this.connectionStatus.next(false);
      this.mqttEnabled = false;
    }
  }

  private delayedInitialization() {
    // Wait until component is fully loaded
    timer(1000).subscribe(() => {
      this.initializeMqttConnection();
    });
  }

  private initializeMqttConnection() {
    if (this.connectionAttempted || this.isHttpsContext || !this.mqttService) return;
    this.connectionAttempted = true;

    try {
      // Monitor MQTT State with Error Handling
      this.mqttService.state.pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.info('MQTT connection failed - Status: Offline');
          this.connectionStatus.next(false);
          this.mqttEnabled = false;
          return EMPTY;
        })
      ).subscribe({
        next: (state) => {
          const isConnected = state === 0;
          this.connectionStatus.next(isConnected);
          this.mqttEnabled = isConnected;

          if (isConnected) {
            this.subscribeToTopics();
          }
        },
        error: (error) => {
          console.info('MQTT State Error - Status: Offline');
          this.connectionStatus.next(false);
          this.mqttEnabled = false;
        }
      });

    } catch (error) {
      console.info('MQTT initialization failed - Status: Offline');
      this.connectionStatus.next(false);
      this.mqttEnabled = false;
    }
  }

  private subscribeToTopics() {
    if (!this.mqttEnabled || !this.mqttService) return;

    // Temperature data with Error Handling
    this.safeObserveTopic('sensor/temperature').subscribe({
      next: message => {
        try {
          const data = JSON.parse(message.payload.toString());
          this.temperatureSubject.next(data);
          this.sensorDataSubject.next({
            topic: message.topic,
            data: data,
            timestamp: new Date()
          });
        } catch (error) {
          console.warn('Error parsing temperature data:', error);
        }
      }
    });

    // Production data with Error Handling
    this.safeObserveTopic('production/status').subscribe({
      next: message => {
        try {
          const data = JSON.parse(message.payload.toString());
          this.productionSubject.next(data);
        } catch (error) {
          console.warn('Error parsing production data:', error);
        }
      }
    });
  }

  private safeObserveTopic(topic: string): Observable<IMqttMessage> {
    if (!this.mqttEnabled || !this.mqttService) {
      return EMPTY;
    }

    try {
      return this.mqttService.observe(topic).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.info(`Topic ${topic} not available - ignored`);
          this.connectionStatus.next(false);
          return EMPTY;
        })
      );
    } catch (error) {
      console.info(`Topic ${topic} subscription failed - ignored`);
      this.connectionStatus.next(false);
      return EMPTY;
    }
  }

  public observeTopic(topic: string): Observable<IMqttMessage> {
    return this.safeObserveTopic(topic);
  }

  public publishMessage(topic: string, message: any): void {
    if (!this.mqttEnabled || !this.mqttService) {
      console.info('MQTT not available - message not sent');
      return;
    }

    try {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.mqttService.unsafePublish(topic, payload, {qos: 1, retain: false});
    } catch (error) {
      console.info('MQTT Publish failed - ignored');
      this.connectionStatus.next(false);
    }
  }

  public reconnect(): void {
    if (!this.mqttEnabled || !this.mqttService) {
      console.info('MQTT Reconnect not possible');
      return;
    }

    try {
      this.mqttService.connect();
    } catch (error) {
      console.info('MQTT Reconnect failed - ignored');
      this.connectionStatus.next(false);
    }
  }

  public getMqttStatus(): string {
    if (this.isHttpsContext) {
      return 'Offline (HTTPS)';
    }
    if (!this.mqttService) {
      return 'Offline (Not Available)';
    }
    return this.mqttEnabled ? (this.connectionStatus.value ? 'Connected' : 'Disconnected') : 'Offline';
  }

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
