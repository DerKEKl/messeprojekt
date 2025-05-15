import { Component, OnInit } from '@angular/core';
import {MessdatenService} from '../../services/messdaten.service';

@Component({
  selector: 'app-messdaten-liste',
  templateUrl: './messdaten-liste.component.html'
})
export class MessdatenListeComponent implements OnInit {
  messdaten: any[] = [];

  constructor(private messdatenService: MessdatenService) {}

  ngOnInit() {
    this.messdatenService.getMessdaten().subscribe(data => this.messdaten = data);
  }
}
