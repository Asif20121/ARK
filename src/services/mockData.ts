// Mock data for local storage
export interface Rate {
  id: number;
  name: string;
  low: number;
  high: number;
  rate: number;
  created_at?: string;
}

export interface Product {
  id: number;
  species: string;
  specification: string;
  glazing: number;
  size: string;
  low: number;
  high: number;
  reference_weight: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface Constants {
  id: number;
  usd_rate: number;
  variable_overhead: number;
  fixed_overhead: number;
  freight: number;
  insurance: number;
  subsidy_rate: number;
  subsidy_cap: number;
  updated_at?: string;
}

// Initial data - Updated with correct values from Excel
export const initialRates: Rate[] = [
  { id: 1, name: 'A', low: 1, high: 4, rate: 2200 },
  { id: 2, name: 'B', low: 5, high: 9, rate: 2050 },
  { id: 3, name: 'C', low: 10, high: 13, rate: 1750 },
  { id: 4, name: 'D', low: 14, high: 19, rate: 1600 },
  { id: 5, name: 'E', low: 20, high: 25, rate: 1380 },
  { id: 6, name: 'F', low: 26, high: 32, rate: 1100 }
];

export const initialProducts: Product[] = [
  { 
    id: 1, 
    species: 'Black Tiger', 
    specification: 'Head On', 
    glazing: 80, 
    size: '13/15', 
    low: 14, 
    high: 20, 
    reference_weight: 855, 
    status: 'active' 
  },
  { 
    id: 2, 
    species: 'Black Tiger', 
    specification: 'Head Less', 
    glazing: 75, 
    size: '16/20', 
    low: 18, 
    high: 25, 
    reference_weight: 840, 
    status: 'active' 
  }
];

// Updated constants - FINAL CFR CALCULATION VERSION
export const initialConstants: Constants = {
  id: 1,
  usd_rate: 122,
  variable_overhead: 80,
  fixed_overhead: 70,
  freight: 0.20, // Flat USD amount $0.20
  insurance: 0.15, // Flat USD amount $0.15
  subsidy_rate: 0.08, // 8% as decimal
  subsidy_cap: 0.80 // $0.80
};