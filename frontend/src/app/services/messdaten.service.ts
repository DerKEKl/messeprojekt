import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {Messwert} from '../models/messwert';

@Injectable({
  providedIn: 'root'
})
export class MessdatenService {
  private baseUrl = `${environment.apiUrl}/sensor`;
  private messdatenSubject = new BehaviorSubject<Messwert[]>([]);

  public messdaten$ = this.messdatenSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getMessdaten(): Observable<Messwert[]> {
    return this.http.get<Messwert[]>(`${this.baseUrl}/data`)
      .pipe(
        tap(data => this.messdatenSubject.next(data)),
        catchError(error => {
          console.error('Error fetching messdaten:', error);
          throw error;
        })
      );
  }

  sendSensorData(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, data)
      .pipe(
        catchError(error => {
          console.error('Error sending sensor data:', error);
          throw error;
        })
      );
  }

  getMessdatenByDate(date: string): Observable<Messwert[]> {
    return this.http.get<Messwert[]>(`${this.baseUrl}/data/${date}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching messdaten by date:', error);
          throw error;
        })
      );
  }
}
