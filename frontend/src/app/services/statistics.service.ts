import {Injectable} from '@angular/core';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
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

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  dailyReports: DailyReport[];
  totalParts: number;
  totalEnergy: number;
  averagePartsPerDay: number;
  mostProductiveDay: string;
}

export interface MonthlySummary {
  year: number;
  month: number;
  dailyReports: DailyReport[];
  totalParts: number;
  totalEnergy: number;
  averagePartsPerDay: number;
  mostProductiveDay: string;
  workingDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) {
  }


  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }


  getDailyReport(date: string): Observable<DailyReport | null> {
    return this.http.get<DailyReport>(`${this.apiUrl}/report/${date}`, {headers: this.getAuthHeaders()}).pipe(
      catchError((error) => {
        console.error('Error fetching daily report:', error);
        return of(null);
      })
    );
  }

  getWeeklyReport(weekStart: string): Observable<WeeklySummary | null> {
    const dates: string[] = [];
    const startDate = new Date(weekStart);

    // Generiere alle 7 Tage der Woche
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Alle täglichen Berichte parallel abrufen
    const dailyRequests = dates.map(date =>
      this.getDailyReport(date).pipe(
        catchError(() => of(null))
      )
    );

    return forkJoin(dailyRequests).pipe(
      map(reports => {
        const validReports = reports.filter(report => report !== null) as DailyReport[];

        if (validReports.length === 0) {
          return null;
        }

        const totalParts = validReports.reduce((sum, report) => sum + report.partsCount, 0);
        const totalEnergy = validReports.reduce((sum, report) => sum + (report.totalEnergyUsage || 0), 0);

        // Finde den produktivsten Tag
        const mostProductiveReport = validReports.reduce((max, report) =>
          report.partsCount > max.partsCount ? report : max
        );

        return {
          weekStart: dates[0],
          weekEnd: dates[6],
          dailyReports: validReports,
          totalParts,
          totalEnergy,
          averagePartsPerDay: Math.round(totalParts / 7 * 100) / 100,
          mostProductiveDay: mostProductiveReport.date
        } as WeeklySummary;
      })
    );
  }

  getMonthlyReport(year: number, month: number): Observable<MonthlySummary | null> {
    const dates: string[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    // Generiere alle Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Alle täglichen Berichte parallel abrufen
    const dailyRequests = dates.map(date =>
      this.getDailyReport(date).pipe(
        catchError(() => of(null))
      )
    );

    return forkJoin(dailyRequests).pipe(
      map(reports => {
        const validReports = reports.filter(report => report !== null) as DailyReport[];

        if (validReports.length === 0) {
          return null;
        }

        const totalParts = validReports.reduce((sum, report) => sum + report.partsCount, 0);
        const totalEnergy = validReports.reduce((sum, report) => sum + (report.totalEnergyUsage || 0), 0);

        // Finde den produktivsten Tag
        const mostProductiveReport = validReports.reduce((max, report) =>
          report.partsCount > max.partsCount ? report : max
        );

        return {
          year,
          month,
          dailyReports: validReports,
          totalParts,
          totalEnergy,
          averagePartsPerDay: Math.round(totalParts / daysInMonth * 100) / 100,
          mostProductiveDay: mostProductiveReport.date,
          workingDays: validReports.length
        } as MonthlySummary;
      })
    );
  }

  getColorDistribution(): Observable<ColorDistribution[]> {
    return this.http.get<any[]>(`${this.apiUrl}/colors`, {headers: this.getAuthHeaders()}).pipe(
      map(data => {
        // Berechne die Gesamtanzahl aller Teile
        const totalParts = data.reduce((sum, item) => sum + item.count, 0);

        // Berechne die korrekten Prozentsätze
        return data.map(item => ({
          color: item.color,
          count: item.count,
          percentage: totalParts > 0 ? Math.round((item.count / totalParts) * 100 * 100) / 100 : 0
        }));
      }),
      catchError((error) => {
        console.error('Error fetching color distribution:', error);
        return of([]);
      })
    );
  }
}
