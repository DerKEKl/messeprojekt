export interface Messwert {
  id: string;
  partNumber: string;
  temperature: number;
  humidity: number;
  pressure: number;
  timestamp: Date;
  sensorId: string;
}

export interface SensorData {
  topic: string;
  data: any;
  timestamp: Date;
}
