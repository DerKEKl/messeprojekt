import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {EnergiekostenComponent} from '../energiekosten/energiekosten.component';
import {ThemeService} from '../../services/theme.service';
import {RobotService, RobotStatus} from '../../services/robot.service';
import {MqttClientService} from '../../services/mqtt-client.service';
import {interval, Subscription} from 'rxjs';
import {MessdatenListeComponent} from '../messdaten-liste/messdaten-liste.component';
import {NavigationComponent} from '../navigation/navigation.component';
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    NavigationComponent,
    MessdatenListeComponent,
    EnergiekostenComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  themeService = inject(ThemeService);

  robotStatus: RobotStatus | null = null;
  currentTemperature: number = 0;
  mqttConnected = false;
  isRobotLoading = false;
  isDataLoading = false;

  private subscriptions = new Subscription();

  constructor(
    private robotService: RobotService,
    private mqttService: MqttClientService,
    private notificationService: NotificationService
  ) {
  }

  ngOnInit() {
    this.subscribeToServices();
    this.startDataRefreshInterval();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeToServices() {
    // Robot Status
    this.subscriptions.add(
      this.robotService.status$.subscribe(status => {
        this.robotStatus = status;
      })
    );

    // MQTT Connection Status
    this.mqttConnected = this.mqttService.isConnected();
    this.currentTemperature = this.mqttService.temperature;
    this.mqttService.getTemperature().subscribe(temp => {
      this.currentTemperature = temp;
    });

  }

  connected() {
    return !this.currentTemperature;
  }

  private startDataRefreshInterval() {
    this.subscriptions.add(
      interval(30000).subscribe(() => {
        this.refreshData();
      })
    );
  }

  startRobot() {
    this.isRobotLoading = true;
    this.robotService.startRobot().subscribe({
      next: () => {
        this.isRobotLoading = false;
      },
      error: (error) => {
        this.isRobotLoading = false;
      }
    });
  }

  stopRobot() {
    this.isRobotLoading = true;
    this.robotService.stopRobot().subscribe({
      next: () => {
        this.isRobotLoading = false;
      },
      error: (error) => {
        this.isRobotLoading = false;
      }
    });
  }

  refreshData() {
    this.isDataLoading = true;
    this.robotService.getStatus().subscribe({
      next: () => {
        this.isDataLoading = false;
      },
      error: () => {
        this.isDataLoading = false;
      }
    });
  }
}
