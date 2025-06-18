import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {environment} from '../../environments/environment';

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
    private router: Router
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
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
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
      // Einfache Token-Validierung
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
}
