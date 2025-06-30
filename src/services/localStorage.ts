import { Rate, Product, Constants, initialRates, initialProducts, initialConstants } from './mockData';
import { CostingCalculator } from './costingCalculator';

class LocalStorageService {
  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private sanitizeNumericValue(value: any, defaultValue: number): number {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed) ? parsed : defaultValue;
  }

  // Rates
  getRates(): Rate[] {
    return this.getFromStorage('costing_rates', initialRates);
  }

  getRateByQuantity(quantity: number): Rate | null {
    const rates = this.getRates();
    return rates.find(rate => quantity >= rate.low && quantity <= rate.high) || null;
  }

  addRate(rate: Omit<Rate, 'id' | 'created_at'>): Rate {
    const rates = this.getRates();
    const newRate: Rate = {
      ...rate,
      id: Math.max(...rates.map(r => r.id), 0) + 1,
      created_at: new Date().toISOString()
    };
    rates.push(newRate);
    this.saveToStorage('costing_rates', rates);
    return newRate;
  }

  updateRate(id: number, updatedRate: Partial<Rate>): void {
    const rates = this.getRates();
    const index = rates.findIndex(r => r.id === id);
    if (index !== -1) {
      rates[index] = { ...rates[index], ...updatedRate };
      this.saveToStorage('costing_rates', rates);
    }
  }

  deleteRate(id: number): void {
    const rates = this.getRates().filter(r => r.id !== id);
    this.saveToStorage('costing_rates', rates);
  }

  // Products
  getProducts(): Product[] {
    return this.getFromStorage('costing_products', initialProducts);
  }

  addProduct(product: Omit<Product, 'id' | 'created_at'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: Math.max(...products.map(p => p.id), 0) + 1,
      created_at: new Date().toISOString()
    };
    products.push(newProduct);
    this.saveToStorage('costing_products', products);
    return newProduct;
  }

  updateProduct(id: number, updatedProduct: Partial<Product>): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedProduct };
      this.saveToStorage('costing_products', products);
    }
  }

  deleteProduct(id: number): void {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveToStorage('costing_products', products);
  }

  // Constants
  getConstants(): Constants {
    // First get stored constants, then ensure all properties from initialConstants are present
    const storedConstants = this.getFromStorage('costing_constants', {});
    
    // Sanitize all numeric values to prevent undefined/NaN propagation
    const constants: Constants = {
      id: initialConstants.id,
      usd_rate: this.sanitizeNumericValue(storedConstants.usd_rate, initialConstants.usd_rate),
      variable_overhead: this.sanitizeNumericValue(storedConstants.variable_overhead, initialConstants.variable_overhead),
      fixed_overhead: this.sanitizeNumericValue(storedConstants.fixed_overhead, initialConstants.fixed_overhead),
      freight: this.sanitizeNumericValue(storedConstants.freight, 0.20), // Flat $0.20 USD
      insurance: this.sanitizeNumericValue(storedConstants.insurance, 0.15), // Flat $0.15 USD
      subsidy_rate: this.sanitizeNumericValue(storedConstants.subsidy_rate, initialConstants.subsidy_rate || 0),
      subsidy_cap: this.sanitizeNumericValue(storedConstants.subsidy_cap, initialConstants.subsidy_cap || 0),
      created_at: storedConstants.created_at || initialConstants.created_at,
      updated_at: storedConstants.updated_at || initialConstants.updated_at
    };
    
    return constants;
  }

  updateConstants(updatedConstants: Partial<Constants>): void {
    const constants = this.getConstants();
    
    // Sanitize all numeric values before saving
    const sanitizedUpdates: Partial<Constants> = {};
    
    Object.keys(updatedConstants).forEach(key => {
      const value = updatedConstants[key as keyof Constants];
      
      if (key === 'usd_rate' && typeof value === 'number') {
        sanitizedUpdates.usd_rate = this.sanitizeNumericValue(value, constants.usd_rate);
      } else if (key === 'variable_overhead' && typeof value === 'number') {
        sanitizedUpdates.variable_overhead = this.sanitizeNumericValue(value, constants.variable_overhead);
      } else if (key === 'fixed_overhead' && typeof value === 'number') {
        sanitizedUpdates.fixed_overhead = this.sanitizeNumericValue(value, constants.fixed_overhead);
      } else if (key === 'freight' && typeof value === 'number') {
        sanitizedUpdates.freight = this.sanitizeNumericValue(value, constants.freight);
      } else if (key === 'insurance' && typeof value === 'number') {
        sanitizedUpdates.insurance = this.sanitizeNumericValue(value, constants.insurance);
      } else if (key === 'subsidy_rate' && typeof value === 'number') {
        sanitizedUpdates.subsidy_rate = this.sanitizeNumericValue(value, constants.subsidy_rate || 0);
      } else if (key === 'subsidy_cap' && typeof value === 'number') {
        sanitizedUpdates.subsidy_cap = this.sanitizeNumericValue(value, constants.subsidy_cap || 0);
      } else {
        // Non-numeric fields
        (sanitizedUpdates as any)[key] = value;
      }
    });
    
    const newConstants = { ...constants, ...sanitizedUpdates, updated_at: new Date().toISOString() };
    this.saveToStorage('costing_constants', newConstants);
  }

  // Cost calculation - Updated with GLAZING PERCENTAGE-BASED formula
  calculateCost(productId: number, quantity: number, glazingPercentage?: number) {
    const product = this.getProducts().find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const rates = this.getRates();
    const constants = this.getConstants();

    try {
      const result = CostingCalculator.calculateProductCost(product, rates, constants, quantity, glazingPercentage);
      
      // Sanitize all numeric values in the result to prevent undefined/NaN
      const sanitizeValue = (value: any): number => {
        const parsed = typeof value === 'number' ? value : parseFloat(value);
        return !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
      };
      
      // Convert to the expected format for backward compatibility
      return {
        product: result.product,
        quantity: result.quantity,
        rate: sanitizeValue(result.rate),
        rateName: result.rateName,
        breakdown: {
          basePrice: sanitizeValue(result.breakdown.adjustedRMCost || result.breakdown.baseCostBDT),
          glazingCost: 0, // Not used in new calculation
          variableOverheadCost: sanitizeValue(result.breakdown.variableOverhead),
          fixedOverheadCost: sanitizeValue(result.breakdown.fixedOverhead),
          freightCost: sanitizeValue(result.breakdown.freightCostUSD || 0),
          insuranceCost: sanitizeValue(result.breakdown.insuranceCostUSD || 0),
          // Additional breakdown details for GLAZING PERCENTAGE-BASED formula
          referenceRMCost: sanitizeValue(result.breakdown.referenceRMCost),
          glazingPercentage: sanitizeValue(result.breakdown.glazingPercentage),
          netWeight: sanitizeValue(result.breakdown.netWeight),
          referenceWeight: sanitizeValue(result.breakdown.referenceWeight),
          rmCostPerGram: sanitizeValue(result.breakdown.rmCostPerGram),
          adjustedRMCost: sanitizeValue(result.breakdown.adjustedRMCost)
        },
        totals: {
          totalCostUSD: sanitizeValue(result.breakdown.finalCFRCostUSD),
          totalCostLocal: sanitizeValue(result.breakdown.totalBDT),
          unitCostUSD: sanitizeValue(result.breakdown.finalCFRCostUSD / quantity),
          unitCostLocal: sanitizeValue(result.breakdown.totalBDT / quantity)
        },
        constants: {
          usdRate: sanitizeValue(constants.usd_rate),
          variableOverhead: sanitizeValue(constants.variable_overhead),
          fixedOverhead: sanitizeValue(constants.fixed_overhead),
          freight: sanitizeValue(constants.freight),
          insurance: sanitizeValue(constants.insurance)
        }
      };
    } catch (error) {
      throw new Error(`Calculation failed: ${error}`);
    }
  }
}

export const localStorageService = new LocalStorageService();