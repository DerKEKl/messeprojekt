export interface EnergyCost {
  date: string;
  parts: number;
  costs: number;
  energyUsage: number;
  costPerKwh: number;
}

export interface CostPreview {
  partsCount: number;
  estimatedCosts: number;
  estimatedEnergyUsage: number;
  optimalProductionTime: string;
  recommendations: string[];
}
