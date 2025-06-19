import {IMqttServiceOptions} from 'ngx-mqtt';

export const environment = {
  production: true,
  apiUrl: 'https://raspberry.local:5443/api',
  mqtt: {
    hostname: '95.216.93.77',
    port: 9002,
    path: '/mqtt',
    protocol: 'wss',
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 4000,
    clientId: 'angular-mqtt-client-' + Math.random().toString(16).substr(2, 8)
  } as IMqttServiceOptions
};
