export interface EnergyCost {
  date: string;
  parts: number,
  costs: number,
  averagePrice: number,
}

export interface CostPreview {
  startTimestamp?: number;
  endTimestamp?: number;
  totalPrice?: number | null;
  partsCount: number;
  hoursNeeded?: number;
  estimatedCosts?: number;
  estimatedEnergyUsage?: number;
  optimalProductionTime?: string;
  recommendations?: string[];
  plannedDate?: string;
}
