import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {CreatePartRequest, Part} from '../models/part';

@Injectable({
  providedIn: 'root'
})
export class PartsService {
  private baseUrl = `${environment.apiUrl}/parts`;
  private partsSubject = new BehaviorSubject<Part[]>([]);

  public parts$ = this.partsSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getAllParts(): Observable<Part[]> {
    return this.http.get<Part[]>(this.baseUrl)
      .pipe(
        tap(parts => this.partsSubject.next(parts)),
        catchError(error => {
          console.error('Error fetching parts:', error);
          throw error;
        })
      );
  }

  createPart(part: CreatePartRequest): Observable<Part> {
    return this.http.post<Part>(this.baseUrl, part)
      .pipe(
        tap(() => {
          this.getAllParts().subscribe();
        }),
        catchError(error => {
          console.error('Error creating part:', error);
          throw error;
        })
      );
  }

  getPartByNumber(partNumber: string): Observable<Part> {
    return this.http.get<Part>(`${this.baseUrl}/${partNumber}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching part:', error);
          throw error;
        })
      );
  }

  getPartsByDay(date: string): Observable<Part[]> {
    return this.http.get<Part[]>(`${this.baseUrl}/day/${date}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching parts by day:', error);
          throw error;
        })
      );
  }

  updatePart(partNumber: string, updates: Partial<Part>): Observable<Part> {
    return this.http.put<Part>(`${this.baseUrl}/${partNumber}`, updates)
      .pipe(
        tap(() => {
          this.getAllParts().subscribe();
        }),
        catchError(error => {
          console.error('Error updating part:', error);
          throw error;
        })
      );
  }


  deletePart(partNumber: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${partNumber}`)
      .pipe(
        tap(() => {
          this.getAllParts().subscribe();
        }),
        catchError(error => {
          console.error('Error deleting part:', error);
          throw error;
        })
      );
  }
}
