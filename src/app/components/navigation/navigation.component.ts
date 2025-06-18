import {Component, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterModule} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {AsyncPipe, CommonModule} from '@angular/common';
import {FaIconComponent, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {ThemeToggleComponent} from '../theme-toggle/theme-toggle.component';

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
    private authService: AuthService
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
  }

  logout() {
    this.authService.logout();
  }
}
