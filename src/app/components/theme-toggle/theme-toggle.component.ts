import {Component, inject} from '@angular/core';
import {ThemeService} from '../../services/theme.service';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-theme-toggle',
  imports: [
    FaIconComponent
  ],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css'
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  constructor() {
  }
}
