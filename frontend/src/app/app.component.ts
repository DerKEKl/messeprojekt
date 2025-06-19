import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {ThemeService} from './services/theme.service';
import {FaIconLibrary, IconDefinition} from '@fortawesome/angular-fontawesome';
import {
  faBolt,
  faCalculator,
  faCalendar,
  faCalendarAlt,
  faCalendarCheck,
  faCalendarDay,
  faCalendarMinus,
  faCalendarPlus,
  faCalendarWeek,
  faChartBar,
  faCheck,
  faCheckCircle,
  faClock,
  faCog,
  faDatabase,
  faDownload,
  faEdit,
  faEuroSign,
  faExclamation,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faFilter,
  faHome,
  faInfo,
  faInfoCircle,
  faLightbulb,
  faMicrochip,
  faMoon,
  faPalette,
  faPlay,
  faPlayCircle,
  faPlus,
  faRefresh,
  faRightFromBracket,
  faRobot,
  faSearch,
  faSort,
  faStop,
  faStopCircle,
  faSun,
  faSyncAlt,
  faTimes,
  faTrash,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import {NotificationComponent} from './components/notification/notification.component';
import {filter} from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NotificationComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <router-outlet></router-outlet>
      <app-notification></app-notification>
    </div>
  `
})
export class AppComponent implements OnInit {
  _isDashboard = false;
  title = 'messeprojekt';
  public readonly icons: IconDefinition[] = [faSun, faMoon, faRobot, faUser, faCog, faEye, faEyeSlash, faPlayCircle, faStopCircle,
    faExclamation, faRightFromBracket, faRefresh, faInfo, faBolt, faSort, faPalette, faLightbulb, faEuroSign, faInfoCircle, faExclamationTriangle,
    faDatabase, faPlay, faStop, faChartBar, faSearch, faFilter, faMicrochip, faCheckCircle, faCalculator, faClock, faSyncAlt, faDownload,
    faCalendar, faPlus, faEdit, faTrash, faCheck, faHome, faTimes, faCalendarDay, faCalendarWeek, faCalendarAlt, faCalendarCheck, faCalendarMinus, faCalendarPlus];

  constructor(private themeService: ThemeService, private library: FaIconLibrary, private router: Router) {
    library.addIcons(...this.icons);
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects.split('#')[0];

      this._isDashboard = url === '/dashboard';
    });
  }
}
