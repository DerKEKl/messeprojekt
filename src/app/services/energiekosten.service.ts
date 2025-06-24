import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {CostPreview, EnergyCost} from '../models/energy-cost';

@Injectable({
  providedIn: 'root'
})
export class EnergiekostenService {
  private baseUrl = `${environment.apiUrl}/costs`;

  constructor(private http: HttpClient) {
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCostPreview(count: number): Observable<CostPreview> {
    return this.http.get<any>(`${this.baseUrl}/preview/${count}`, {headers: this.getAuthHeaders()})
      .pipe(
        map(response => this.processPreviewResponse(response)),
        catchError(error => {
          console.error('Error fetching cost preview:', error);
          return of({
            partsCount: count,
            estimatedCosts: 0,
            startTimestamp: 0,
            endTimestamp: 0,
            estimatedEnergyUsage: 0,
            optimalProductionTime: 'N/A',
            recommendations: ['Daten nicht verfügbar - Service vorübergehend nicht erreichbar']
          } as CostPreview);
        })
      );
  }

  private processPreviewResponse(response: any): CostPreview {
    const now = new Date();
    // Setze Start auf nächste volle Stunde
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() + 1);
    startTime.setMinutes(0);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);

    // Berechne Endzeit basierend auf den benötigten Stunden
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + (response.hoursNeeded || 0));

    return {
      startTimestamp: startTime.getTime(),
      endTimestamp: endTime.getTime(),
      totalPrice: response.totalPrice,
      partsCount: response.partsCount || 0,
      hoursNeeded: response.hoursNeeded || 0,
      estimatedCosts: response.totalPrice || 0,
      estimatedEnergyUsage: this.calculateEnergyUsage(response.hoursNeeded),
      optimalProductionTime: this.formatProductionTime(startTime.getTime(), endTime.getTime()),
      recommendations: this.generateRecommendations(response)
    };
  }


  private formatProductionTime(startTimestamp?: number, endTimestamp?: number): string {
    if (!startTimestamp || !endTimestamp) {
      return 'Zeitschätzung nicht verfügbar';
    }

    const startDate = new Date(startTimestamp);
    const endDate = new Date(endTimestamp);

    const formatter = new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const duration = Math.round((endTimestamp - startTimestamp) / (1000 * 60 * 60)); // Stunden
    return `Start: ${formatter.format(startDate)} - Ende: ${formatter.format(endDate)} (ca. ${duration}h)`;
  }

  getDailyCosts(date: string): Observable<EnergyCost> {
    return this.http.get<any>(`${this.baseUrl}/${date}`, {headers: this.getAuthHeaders()})
      .pipe(
        map(response => this.mapToEnergyCost(response, date)),
        catchError(error => {
          console.error('Error fetching daily costs:', error);
          return of({
            date: date,
            parts: 0,
            costs: 0,
            averagePrice: 0,
          } as EnergyCost);
        })
      );
  }

  private mapToEnergyCost(response: any, date: string): EnergyCost {
    // Map API response to EnergyCost model
    return {
      date: date,
      averagePrice: response.costs / response.parts | 0,
      parts: response.parts | 0,
      costs: response.costs | 0,
    };
  }

  private calculateEnergyUsage(hours: number): number {
    if (!hours) return 0;
    const energyPerHour = 2.5;
    return hours * energyPerHour;
  }

  private generateRecommendations(response: any): string[] {
    const recommendations: string[] = [];

    if (response.hoursNeeded > 100) {
      recommendations.push('Lange Produktionszeit - Planung in Schichten empfohlen');
    }

    if (response.partsCount > 1000) {
      recommendations.push('Große Stückzahl - Qualitätskontrolle in Intervallen durchführen');
    }

    if (!response.totalPrice) {
      recommendations.push('Preisberechnung steht noch aus - wird nachträglich aktualisiert');
    }

    if (response.hoursNeeded > 48) {
      recommendations.push('Mehrtägige Produktion - Wartungsintervalle einplanen');
    }

    return recommendations.length > 0 ? recommendations : ['Optimale Produktionsbedingungen'];
  }
}
