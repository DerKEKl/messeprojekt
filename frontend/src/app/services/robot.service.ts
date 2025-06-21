import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {NotificationService} from './notification.service';

export interface RobotStatus {
  isActive: boolean;
  currentTask?: string;
  lastActivity?: string;
  errorCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RobotService {
  private baseUrl = `${environment.apiUrl}/robot`;
  private statusSubject = new BehaviorSubject<RobotStatus>({
    isActive: false,
    errorCount: 0
  });

  public status$ = this.statusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.getStatus().subscribe();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  startRobot(): Observable<any> {
    return this.http.get(`${this.baseUrl}/start`, {headers: this.getAuthHeaders()})
      .pipe(
        tap(() => {
          this.updateStatus({isActive: true});
          this.notificationService.success(
            'Roboter gestartet',
            'Der Roboter wurde erfolgreich gestartet und beginnt mit der Produktion.'
          );
        }),
        catchError(error => {
          console.error(`Start error:`, error);

          // Detaillierte Error-Behandlung
          let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';

          if (error.status === 500) {
            errorMessage = 'Serverfehler beim Starten des Roboters. Bitte versuchen Sie es später erneut.';
          } else if (error.status === 401) {
            errorMessage = 'Nicht autorisiert. Bitte melden Sie sich erneut an.';
          } else if (error.status === 0) {
            errorMessage = 'Verbindung zum Server fehlgeschlagen. Überprüfen Sie Ihre Netzwerkverbindung.';
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          }

          this.notificationService.error(
            'Roboter starten fehlgeschlagen',
            errorMessage
          );

          // Wichtig: Einen leeren Observable zurückgeben oder das Error weiterwerfen
          return of(null); // oder: return throwError(() => error);
        })
      );
  }

  stopRobot(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stop`, {headers: this.getAuthHeaders()})
      .pipe(
        tap(() => {
          this.updateStatus({isActive: false});
          this.notificationService.success(
            'Roboter gestoppt',
            'Der Roboter wurde erfolgreich gestoppt.'
          );
        }),
        catchError(error => {
          console.error(`Stop error:`, error);

          let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';

          if (error.status === 500) {
            errorMessage = 'Serverfehler beim Stoppen des Roboters. Bitte versuchen Sie es später erneut.';
          } else if (error.status === 401) {
            errorMessage = 'Nicht autorisiert. Bitte melden Sie sich erneut an.';
          } else if (error.status === 0) {
            errorMessage = 'Verbindung zum Server fehlgeschlagen. Überprüfen Sie Ihre Netzwerkverbindung.';
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          }

          this.notificationService.error(
            'Roboter stoppen fehlgeschlagen',
            errorMessage
          );

          return of(null);
        })
      );
  }

  getStatus(): Observable<RobotStatus> {
    return this.statusSubject.asObservable();
  }

  private updateStatus(updates: Partial<RobotStatus>) {
    const currentStatus = this.statusSubject.value;
    this.statusSubject.next({...currentStatus, ...updates});
  }
}
