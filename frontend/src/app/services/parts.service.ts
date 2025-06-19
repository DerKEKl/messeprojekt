import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {CreatePartRequest, Part} from '../models/part';
import {NotificationService} from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class PartsService {
  private baseUrl = `${environment.apiUrl}/parts`;
  private partsSubject = new BehaviorSubject<Part[]>([]);
  public parts$ = this.partsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${operation} error:`, error);

    let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';

    if (error.status === 401) {
      errorMessage = 'Nicht autorisiert. Bitte melden Sie sich erneut an.';
    } else if (error.status === 403) {
      errorMessage = 'Keine Berechtigung für diese Aktion.';
    } else if (error.status === 404) {
      errorMessage = 'Die angeforderte Ressource wurde nicht gefunden.';
    } else if (error.status === 0 || error.status >= 500) {
      errorMessage = 'Server nicht erreichbar. Bitte versuchen Sie es später erneut.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.notificationService.error(`${operation} fehlgeschlagen`, errorMessage);
    return throwError(() => error);
  }

  getAllParts(): Observable<Part[]> {
    return this.http.get<Part[]>(this.baseUrl, {headers: this.getAuthHeaders()})
      .pipe(
        tap(parts => {
          this.partsSubject.next(parts);
          this.notificationService.success(
            'Bauteile geladen',
            `${parts.length} Bauteile erfolgreich geladen.`
          );
        }),
        catchError(error => this.handleError('Bauteile laden', error))
      );
  }

  createPart(part: CreatePartRequest): Observable<Part> {
    return this.http.post<Part>(this.baseUrl, part, {headers: this.getAuthHeaders()})
      .pipe(
        tap((createdPart) => {
          this.notificationService.success(
            'Bauteil erstellt',
            `Bauteil "${createdPart.partNumber}" wurde erfolgreich erstellt.`
          );
          this.getAllParts().subscribe();
        }),
        catchError(error => this.handleError('Bauteil erstellen', error))
      );
  }

  getPartByNumber(partNumber: string): Observable<Part> {
    return this.http.get<Part>(`${this.baseUrl}/${partNumber}`, {headers: this.getAuthHeaders()})
      .pipe(
        catchError(error => this.handleError('Bauteil abrufen', error))
      );
  }

  getPartsByDay(date: string): Observable<Part[]> {
    return this.http.get<Part[]>(`${this.baseUrl}/day/${date}`, {headers: this.getAuthHeaders()})
      .pipe(
        tap(parts => {
          this.notificationService.info(
            'Tagesbericht',
            `${parts.length} Bauteile für ${date} gefunden.`
          );
        }),
        catchError(error => this.handleError('Tagesbericht laden', error))
      );
  }

  updatePart(partNumber: string, updates: Partial<Part>): Observable<Part> {
    return this.http.put<Part>(`${this.baseUrl}/${partNumber}`, updates, {headers: this.getAuthHeaders()})
      .pipe(
        tap((updatedPart) => {
          this.notificationService.success(
            'Bauteil aktualisiert',
            `Bauteil "${updatedPart.partNumber}" wurde erfolgreich aktualisiert.`
          );
          this.getAllParts().subscribe();
        }),
        catchError(error => this.handleError('Bauteil aktualisieren', error))
      );
  }

  deletePart(partNumber: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${partNumber}`, {headers: this.getAuthHeaders()})
      .pipe(
        tap(() => {
          this.notificationService.success(
            'Bauteil gelöscht',
            `Bauteil wurde erfolgreich gelöscht.`
          );
          this.getAllParts().subscribe();
        }),
        catchError(error => this.handleError('Bauteil löschen', error))
      );
  }
}
