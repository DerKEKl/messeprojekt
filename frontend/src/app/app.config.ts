import {ApplicationConfig, ErrorHandler, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {routes} from './app.routes';
import {environment} from '../environments/environment';
import {MqttModule} from 'ngx-mqtt';

export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    if (error?.message &&
      (error.message.includes('Mixed Content') ||
        error.message.includes('WebSocket') ||
        error.message.includes('mqtt'))) {
      // Suppress MQTT/Mixed Content errors
      console.info('MQTT/Mixed Content error suppressed:', error.message);
      return;
    }
    // Handle other errors normally
    console.error('Unhandled error:', error);
  }
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(MqttModule.forRoot(environment.mqtt)),
    {provide: ErrorHandler, useClass: GlobalErrorHandler}
  ]
};
