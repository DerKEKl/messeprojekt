import {Routes} from '@angular/router';
import {LoginComponent} from './components/login/login.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {AuthGuard} from './guards/auth-guard';
import {MessdatenListeComponent} from './components/messdaten-liste/messdaten-liste.component';
import {EnergiekostenComponent} from './components/energiekosten/energiekosten.component';
import {StatisticsComponent} from './components/statistics/statistics.component';
import {PartsManagementComponent} from './components/parts-management/parts-management.component';

export let routes: Routes;
routes = [
  {path: 'login', component: LoginComponent},
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'messdaten',
    component: MessdatenListeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'energiekosten',
    component: EnergiekostenComponent,
    canActivate: [AuthGuard]
  },
  {
    canActivate: [AuthGuard],
    component: StatisticsComponent,
    path: 'statistics'
  },
  {
    path: 'parts',
    component: PartsManagementComponent,
    canActivate: [AuthGuard]
  },
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: '**', redirectTo: '/dashboard'}
];
