import {Component, OnInit} from '@angular/core';
import {MqttClientService} from '../../services/mqtt.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  temperature: number | null = null;

  constructor(private mqttService: MqttClientService) {}

  ngOnInit() {
    this.mqttService.observeTopic('sensor/temperature').subscribe(msg => {
      this.temperature = +msg.payload.toString();
    });
  }
}
