import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {DatePipe, NgIf} from '@angular/common';
import {MqttClientService, TemperatureData} from '../../services/mqtt-client.service';
import {FaIconComponent, FaIconLibrary} from '@fortawesome/angular-fontawesome';
import {faBolt, faCog, faDatabase, faStop, faRefresh, faPlay, faInfoCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-live-dashboard',
  imports: [
    NgIf,
    DatePipe,
    FaIconComponent
  ],
  templateUrl: './live-dashboard.component.html',
  styleUrl: './live-dashboard.component.css'
})
export class LiveDashboardComponent implements OnInit, OnDestroy {
  temperature: TemperatureData | null = null;
  partsToday: number = 0;
  isProducing: boolean = false;
  currentPart: string | null = null;
  mqttConnected: boolean = false;
  messageCount: number = 0;
  lastUpdate: Date | null = null;

  private subscriptions = new Subscription();

  constructor(private mqttService: MqttClientService, library: FaIconLibrary) {
    library.addIcons(faCog, faBolt, faDatabase, faRefresh, faStop, faPlay, faInfoCircle);
  }

  ngOnInit() {
    this.subscribeToMqttData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeToMqttData() {
    // MQTT Verbindungsstatus
    this.subscriptions.add(
      this.mqttService.connectionStatus$.subscribe((connected: boolean) => {
        this.mqttConnected = connected;
      })
    );

    // Temperatur Daten
    this.subscriptions.add(
      this.mqttService.temperature$.subscribe((temp: any) => {
        if (temp) {
          this.temperature = temp;
          this.lastUpdate = new Date();
        }
      })
    );

    // Produktions Daten
    this.subscriptions.add(
      this.mqttService.production$.subscribe((production: any) => {
        if (production) {
          this.partsToday = production.partsCount;
          this.isProducing = production.isProducing;
          this.currentPart = production.currentPart || null;
        }
      })
    );

    // Sensor Daten (für Message Count)
    this.subscriptions.add(
      this.mqttService.sensorData$.subscribe((data: any) => {
        this.messageCount++;
      })
    );
  }

  reconnect() {
    this.mqttService.reconnect();
  }
}
