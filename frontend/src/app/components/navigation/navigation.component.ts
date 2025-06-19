import {Component, OnInit} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {CommonModule} from '@angular/common';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {ThemeToggleComponent} from '../theme-toggle/theme-toggle.component';
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, ThemeToggleComponent],
  templateUrl: './navigation.component.html'
})

export class NavigationComponent implements OnInit {
  user$: Observable<any>;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {

    this
      .user$ = this.authService.user$;
  }

  ngOnInit() {
  }

  logout() {
    this.authService.logout();
  }
}
