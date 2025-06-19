import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';
import {NotificationService} from './notification.service';

export interface LoginResponse {
  token: string;
  user?: {
    username: string;
    role: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<any>(null);

  public token$ = this.tokenSubject.asObservable();
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.initializeAuth();
  }

  private initializeAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token) {
      this.tokenSubject.next(token);
    }

    if (user) {
      try {
        this.userSubject.next(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.notificationService.error(
          'Authentifizierungsfehler',
          'Gespeicherte Benutzerdaten sind beschädigt. Bitte melden Sie sich erneut an.'
        );
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.tokenSubject.next(response.token);

          if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            this.userSubject.next(response.user);
          }

          setTimeout(() => {
            this.notificationService.success(
              'Anmeldung erfolgreich',
              `Willkommen zurück, ${response.user?.username || 'Benutzer'}!`, 1000
            );
          }, 1000);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Login error:', error);

          let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';

          if (error.status === 401) {
            errorMessage = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Benutzername und Passwort.';
          } else if (error.status === 403) {
            errorMessage = 'Zugriff verweigert. Sie haben keine Berechtigung.';
          } else if (error.status === 0 || error.status === 500) {
            errorMessage = 'Server nicht erreichbar. Bitte versuchen Sie es später erneut.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          this.notificationService.error('Anmeldung fehlgeschlagen', errorMessage);
          return throwError(() => error);
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.userSubject.next(null);

    this.notificationService.info(
      'Abgemeldet',
      'Sie wurden erfolgreich abgemeldet.'
    );

    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getUser(): any {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      this.notificationService.warning(
        'Token ungültig',
        'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.'
      );
      return false;
    }
  }
}
