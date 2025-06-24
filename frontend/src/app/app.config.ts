import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    if (error?.message &&
      (error.message.includes('OPC UA') ||
        error.message.includes('WebSocket') ||
        error.message.includes('Connection'))) {
      console.info('OPC UA Verbindungsfehler:', error.message);
      return;
    }
    console.error('Unbehandelter Fehler:', error);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
