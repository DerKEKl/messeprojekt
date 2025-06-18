import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {environment} from '../../environments/environment';

export interface RobotStatus {
  isActive: boolean;
  currentTask?: string;
  lastActivity?: string;
  totalPartsToday: number;
  errorCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RobotService {
  private baseUrl = `${environment.apiUrl}/robot`;
  private statusSubject = new BehaviorSubject<RobotStatus>({
    isActive: false,
    totalPartsToday: 0,
    errorCount: 0
  });

  public status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {
    this.getStatus().subscribe();
  }

  startRobot(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/start`)
      .pipe(
        tap(() => {
          this.updateStatus({isActive: true});
        }),
        catchError(error => {
          console.error('Error starting robot:', error);
          throw error;
        })
      );
  }

  stopRobot(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/stop`, {})
      .pipe(
        tap(() => {
          this.updateStatus({isActive: false});
        }),
        catchError(error => {
          console.error('Error stopping robot:', error);
          throw error;
        })
      );
  }

  getStatus(): Observable<RobotStatus> {
    return this.http.get<RobotStatus>(`${this.baseUrl}/status`)
      .pipe(
        tap(status => this.statusSubject.next(status)),
        catchError(error => {
          console.error('Error fetching robot status:', error);
          throw error;
        })
      );
  }

  private updateStatus(updates: Partial<RobotStatus>) {
    const currentStatus = this.statusSubject.value;
    this.statusSubject.next({...currentStatus, ...updates});
  }
}
