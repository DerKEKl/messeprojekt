import {NgModule} from '@angular/core';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
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
  faPause,
  faPlay,
  faPlayCircle,
  faPlus,
  faRefresh,
  faRightFromBracket,
  faRobot,
  faSearch,
  faSignOutAlt,
  faSort,
  faStop,
  faStopCircle,
  faSun,
  faSyncAlt,
  faTimes,
  faTrash,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

@NgModule({
  imports: [FontAwesomeModule],
  providers: []
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faHome, faUser, faCog, faChartBar, faDatabase, faBolt, faRobot, faLightbulb, faSyncAlt, faStopCircle, faDownload,
      faSun, faMoon, faSearch, faFilter, faPlay, faStop, faRefresh, faSort, faPalette, faEuroSign, faPlayCircle,
      faCalendar, faCheck, faTimes, faExclamation, faInfo, faPause, faMicrochip, faCheckCircle, faInfoCircle, faExclamationTriangle,
      faSignOutAlt, faEye, faEyeSlash, faPlus, faEdit, faTrash, faRightFromBracket, faTimes, faCalculator, faClock,
      faCalendarDay, faCalendarWeek, faCalendarAlt, faCalendarCheck, faCalendarMinus, faCalendarPlus,
    );
  }
}
