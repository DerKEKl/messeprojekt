import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {AuthService} from '../../services/auth.service';
import {CommonModule, NgIf} from '@angular/common';
import {ThemeToggleComponent} from '../theme-toggle/theme-toggle.component';
import {
  faCog,
  faEye,
  faEyeSlash, faInfo,
  faMoon,
  faRightFromBracket,
  faRobot,
  faSun,
  faUser
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, ThemeToggleComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  returnUrl = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    library: FaIconLibrary,
  ) {
    library.addIcons(faRightFromBracket, faEyeSlash, faEye, faUser, faRobot, faCog, faSun, faMoon, faInfo);
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.router.navigate([this.returnUrl]);
        },
        error: (error: { error: { message: string; }; }) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Anmeldung fehlgeschlagen.';
        }
      });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
