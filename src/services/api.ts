import { localStorageService } from './localStorage';
import type { Rate, Product, Constants } from './mockData';

class ApiService {
  // Rates
  async getRates(): Promise<Rate[]> {
    return Promise.resolve(localStorageService.getRates());
  }

  async getRateByQuantity(quantity: number): Promise<Rate | null> {
    return Promise.resolve(localStorageService.getRateByQuantity(quantity));
  }

  async addRate(rate: Omit<Rate, 'id' | 'created_at'>): Promise<Rate> {
    return Promise.resolve(localStorageService.addRate(rate));
  }

  async updateRate(id: number, rate: Partial<Rate>): Promise<void> {
    return Promise.resolve(localStorageService.updateRate(id, rate));
  }

  async deleteRate(id: number): Promise<void> {
    return Promise.resolve(localStorageService.deleteRate(id));
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Promise.resolve(localStorageService.getProducts());
  }

  async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    return Promise.resolve(localStorageService.addProduct(product));
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<void> {
    return Promise.resolve(localStorageService.updateProduct(id, product));
  }

  async deleteProduct(id: number): Promise<void> {
    return Promise.resolve(localStorageService.deleteProduct(id));
  }

  // Constants
  async getConstants(): Promise<Constants> {
    return Promise.resolve(localStorageService.getConstants());
  }

  async updateConstants(constants: Partial<Constants>): Promise<void> {
    return Promise.resolve(localStorageService.updateConstants(constants));
  }

  // Cost calculation
  async calculateCost(productId: number, quantity: number) {
    return Promise.resolve(localStorageService.calculateCost(productId, quantity));
  }

  // Legacy methods for backward compatibility
  async get(endpoint: string) {
    if (endpoint === '/rates') return this.getRates();
    if (endpoint === '/products') return this.getProducts();
    if (endpoint === '/costs/constants') return this.getConstants();
    throw new Error(`Unsupported endpoint: ${endpoint}`);
  }

  async post(endpoint: string, data: any) {
    if (endpoint === '/rates') return this.addRate(data);
    if (endpoint === '/products') return this.addProduct(data);
    if (endpoint === '/costs/calculate') return this.calculateCost(data.productId, data.quantity);
    throw new Error(`Unsupported endpoint: ${endpoint}`);
  }

  async put(endpoint: string, data: any) {
    if (endpoint.startsWith('/rates/')) {
      const id = parseInt(endpoint.split('/')[2]);
      return this.updateRate(id, data);
    }
    if (endpoint.startsWith('/products/')) {
      const id = parseInt(endpoint.split('/')[2]);
      return this.updateProduct(id, data);
    }
    if (endpoint === '/costs/constants') return this.updateConstants(data);
    throw new Error(`Unsupported endpoint: ${endpoint}`);
  }

  async delete(endpoint: string) {
    if (endpoint.startsWith('/rates/')) {
      const id = parseInt(endpoint.split('/')[2]);
      return this.deleteRate(id);
    }
    if (endpoint.startsWith('/products/')) {
      const id = parseInt(endpoint.split('/')[2]);
      return this.deleteProduct(id);
    }
    throw new Error(`Unsupported endpoint: ${endpoint}`);
  }
}

export const apiService = new ApiService();