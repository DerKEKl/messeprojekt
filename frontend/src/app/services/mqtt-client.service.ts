import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subscription, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TemperatureData {
  temperature: number;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MqttClientService implements OnDestroy {
  private baseUrl = `${environment.apiUrl}/opcua`;

  // Temperatur-Observable
  private temperatureSubject = new BehaviorSubject<number>(22.0);
  public temperature$ = this.temperatureSubject.asObservable();

  // Verbindungsstatus
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Interne Variablen
  private pollingSubscription: Subscription | null = null;
  private isSimulating = false;
  private connected = false;

  private readonly pollingInterval = 2000; // 2 Sekunden

  constructor(private http: HttpClient) {
    console.log('🌡️ MQTT Client Service initialisiert');
    this.initializeTemperatureConnection();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  // Auth Headers wie in anderen Services
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Initialisierung der Temperatur-Verbindung
  private initializeTemperatureConnection(): void {
    console.log('🔌 Starte OPC UA Temperatur-Verbindung...');
    this.startTemperaturePolling();
  }

  // Temperatur-Polling
  private startTemperaturePolling(): void {
    console.log('🔄 Starte Temperatur-Polling:', `${this.baseUrl}/temperature`);

    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    this.pollingSubscription = interval(this.pollingInterval).subscribe(() => {
      this.fetchTemperatureData().subscribe({
        next: (data) => {
          if (data && data.temperature !== undefined) {
            this.updateTemperature(data.temperature);
            this.setConnectionStatus(true);
            this.clearError();

            if (this.isSimulating) {
              this.isSimulating = false;
              console.log('✅ Wechsel von Simulation zu echten OPC UA Daten');
            }
          }
        },
        error: (error) => {
          console.error('❌ OPC UA API Fehler:', error);

          if (!this.isSimulating) {
            this.setConnectionStatus(false);
            this.setError('OPC UA API nicht erreichbar - Verwende Simulation');
            this.startTemperatureSimulation();
          }
        }
      });
    });
  }

  // HTTP-Anfrage für Temperatur (wie andere Services)
  private fetchTemperatureData(): Observable<TemperatureData | null> {
    return this.http.get<TemperatureData>(`${this.baseUrl}/temperature`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('📊 OPC UA API Antwort:', response);
      }),
      catchError(error => {
        console.error('🚫 Temperatur API Fehler:', error);

        // Detaillierte Fehleranalyse wie in anderen Services
        let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';

        if (error.status === 500) {
          errorMessage = 'Serverfehler beim Abrufen der Temperaturdaten.';
        } else if (error.status === 401) {
          errorMessage = 'Nicht autorisiert. Token möglicherweise abgelaufen.';
        } else if (error.status === 404) {
          errorMessage = 'OPC UA Endpoint nicht gefunden.';
        } else if (error.status === 0) {
          errorMessage = 'Verbindung zum Server fehlgeschlagen.';
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        }

        console.error('OPC UA Fehlerdetails:', errorMessage);
        return of(null);
      })
    );
  }

  // Temperatur-Update
  private updateTemperature(temperature: number): void {
    try {
      const roundedTemp = Number(temperature.toFixed(1));
      this.temperatureSubject.next(roundedTemp);

      console.log('🌡️ Temperatur von OPC UA API aktualisiert:', roundedTemp + '°C');
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Temperatur:', error);
    }
  }

  // Temperatur-Simulation (Fallback)
  private startTemperatureSimulation(): void {
    if (this.isSimulating) return;

    this.isSimulating = true;
    console.log('🎭 Starte Temperatur-Simulation (API nicht verfügbar)...');
    this.setConnectionStatus(true); // Zeige als verbunden für Demo

    this.generateSimulatedTemperature();
  }

  // Simulierte Temperatur generieren
  private generateSimulatedTemperature(): void {
    if (!this.isSimulating) return;

    const now = Date.now();

    // Realistische Temperatur-Simulation basierend auf OPC UA Server
    const baseTemp = 22;
    const timeVariation = Math.sin(now / 30000) * 3;
    const randomVariation = (Math.random() - 0.5) * 2;
    const microFluctuations = Math.sin(now / 5000) * 0.5;

    const simulatedTemp = Number((baseTemp + timeVariation + randomVariation + microFluctuations).toFixed(1));
    const clampedTemp = Math.max(15, Math.min(35, simulatedTemp));

    this.temperatureSubject.next(clampedTemp);
    console.log('🎭 Simulierte Temperatur:', clampedTemp + '°C');
  }

  // Hilfsmethoden für Statusverwaltung
  private setConnectionStatus(connected: boolean): void {
    this.connected = connected;
    this.connectionStatusSubject.next(connected);
  }

  private setError(message: string | null): void {
    this.errorSubject.next(message);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  // === ÖFFENTLICHE API (Dashboard-kompatibel) ===

  // Temperatur-Zugriff (Dashboard-kompatibel)
  get temperature(): number {
    return this.temperatureSubject.value;
  }

  public getTemperature(): Observable<number> {
    return this.temperature$;
  }

  // Verbindungsstatus (Dashboard-kompatibel)
  public isConnected(): boolean {
    return this.connected;
  }

  public getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$;
  }

  public getError(): Observable<string | null> {
    return this.error$;
  }

  // Manuelle Neuverbindung
  public reconnect(): void {
    console.log('🔄 Manuelle Neuverbindung zu OPC UA API...');
    this.isSimulating = false;
    this.clearError();

    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    setTimeout(() => {
      this.initializeTemperatureConnection();
    }, 1000);
  }

  // Verbindung trennen
  public disconnect(): void {
    console.log('🔌 Trenne OPC UA Verbindung...');

    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }

    this.setConnectionStatus(false);
    this.isSimulating = false;
  }

  // === ZUSÄTZLICHE METHODEN ===

  // Aktuelle Temperatur
  public getCurrentTemperature(): number {
    return this.temperatureSubject.value;
  }

  // Manuelle Temperatur-Setzung (für Tests)
  public setTemperature(temp: number): void {
    this.temperatureSubject.next(Number(temp.toFixed(1)));
    console.log('🌡️ Temperatur manuell gesetzt:', temp + '°C');
  }

  // Debug-Informationen
  public getDebugInfo(): any {
    return {
      connected: this.connected,
      isSimulating: this.isSimulating,
      apiEndpoint: `${this.baseUrl}/temperature`,
      currentTemperature: this.temperatureSubject.value,
      error: this.errorSubject.value,
      hasToken: !!localStorage.getItem('token')
    };
  }

  // Erzwinge Simulation (für Development)
  public forceSimulation(): void {
    console.log('🎭 Erzwinge Temperatur-Simulation...');
    this.disconnect();
    this.isSimulating = true;
    this.setConnectionStatus(true);
    this.generateSimulatedTemperature();
  }
}
