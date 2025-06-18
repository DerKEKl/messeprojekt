import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '../../environments/environment';

export interface DailyReport {
    date: string;
    partsCount: number;
    mostCommonColor: string;
    productionStart: string;
    productionEnd: string;
    totalEnergyUsage?: number;
    averageEnergyPerPart?: number;
}

export interface ColorDistribution {
    color: string;
    count: number;
    percentage: number;
}

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private baseUrl = `${environment.apiUrl}/statistics`;

    constructor(private http: HttpClient) {
    }

    getDailyReport(date: string): Observable<DailyReport> {
        return this.http.get<DailyReport>(`${this.baseUrl}/report/${date}`)
            .pipe(
                catchError(error => {
                    console.error('Error fetching daily report:', error);
                    throw error;
                })
            );
    }

    getColorDistribution(): Observable<ColorDistribution[]> {
        return this.http.get<ColorDistribution[]>(`${this.baseUrl}/colors`)
            .pipe(
                catchError(error => {
                    console.error('Error fetching color distribution:', error);
                    throw error;
                })
            );
    }

    getWeeklyReport(startDate: string): Observable<DailyReport[]> {
        return this.http.get<DailyReport[]>(`${this.baseUrl}/weekly/${startDate}`)
            .pipe(
                catchError(error => {
                    console.error('Error fetching weekly report:', error);
                    throw error;
                })
            );
    }

    getMonthlyReport(year: number, month: number): Observable<DailyReport[]> {
        return this.http.get<DailyReport[]>(`${this.baseUrl}/monthly/${year}/${month}`)
            .pipe(
                catchError(error => {
                    console.error('Error fetching monthly report:', error);
                    throw error;
                })
            );
    }
}
