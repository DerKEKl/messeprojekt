export interface Part {
  partNumber: string;
  color: 'red' | 'green' | 'blue' | 'yellow';
  energyUsage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePartRequest {
  partNumber: string;
  color: 'red' | 'green' | 'blue' | 'yellow';
  energyUsage: number;
}
