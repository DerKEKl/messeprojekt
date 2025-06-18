import {NgModule} from '@angular/core';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {library} from '@fortawesome/fontawesome-svg-core';
import {
  faBolt,
  faCalendar,
  faChartBar,
  faCheck,
  faCog,
  faDatabase,
  faEdit,
  faExclamation,
  faEye,
  faEyeSlash,
  faFilter,
  faHome,
  faInfo,
  faMoon,
  faPause,
  faPlay,
  faPlus,
  faRefresh,
  faRightFromBracket,
  faRobot,
  faSearch,
  faSignOutAlt,
  faStop,
  faSun,
  faTimes,
  faTrash,
  faUser
} from '@fortawesome/free-solid-svg-icons';

@NgModule({
  imports: [FontAwesomeModule],
  providers: []
})
export class AppModule {
  constructor() {
    library.add(
      faHome, faUser, faCog, faChartBar, faDatabase, faBolt, faRobot,
      faSun, faMoon, faSearch, faFilter, faPlay, faStop, faRefresh,
      faCalendar, faCheck, faTimes, faExclamation, faInfo, faPause,
      faSignOutAlt, faEye, faEyeSlash, faPlus, faEdit, faTrash, faRightFromBracket,
    );
  }
}
