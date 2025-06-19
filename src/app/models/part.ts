export interface Part {
  partNumber: string;
  color: 'red' | 'green' | 'blue' | 'yellow';
  energyUsage: number;
  timestamp?: string;
}

export interface CreatePartRequest {
  partNumber: string;
  color: 'red' | 'green' | 'blue' | 'yellow';
  energyUsage: number;
}
