import {Component, inject} from '@angular/core';
import {ThemeService} from '../../services/theme.service';
import {FaIconComponent, FaIconLibrary} from '@fortawesome/angular-fontawesome';
import {faMoon, faSun} from '@fortawesome/free-solid-svg-icons';

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

  constructor(library: FaIconLibrary) {
    library.addIcons(faMoon, faSun);
  }
}
