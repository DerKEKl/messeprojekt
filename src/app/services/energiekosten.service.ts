import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {CostPreview, EnergyCost} from '../models/energy-cost';

@Injectable({
  providedIn: 'root'
})
export class EnergiekostenService {
  private baseUrl = `${environment.apiUrl}/costs`;

  constructor(private http: HttpClient) {
  }

  getDailyCosts(date: string): Observable<EnergyCost> {
    return this.http.get<EnergyCost>(`${this.baseUrl}/${date}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching daily costs:', error);
          throw error;
        })
      );
  }

  getCostPreview(count: number): Observable<CostPreview> {
    return this.http.get<CostPreview>(`${this.baseUrl}/preview/${count}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching cost preview:', error);
          throw error;
        })
      );
  }

  getWeeklyCosts(startDate: string): Observable<EnergyCost[]> {
    return this.http.get<EnergyCost[]>(`${this.baseUrl}/weekly/${startDate}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching weekly costs:', error);
          throw error;
        })
      );
  }

  getCurrentEnergyPrice(): Observable<{ price: number; currency: string }> {
    return this.http.get<{ price: number; currency: string }>(`${this.baseUrl}/current-price`)
      .pipe(
        catchError(error => {
          console.error('Error fetching current energy price:', error);
          throw error;
        })
      );
  }
}
