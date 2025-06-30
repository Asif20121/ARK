import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Save, X, Search, Download, ToggleLeft, ToggleRight, Calculator, Settings, BarChart3 } from 'lucide-react';
import { apiService } from '../services/api';
import { CostingCalculator } from '../services/costingCalculator';
import jsPDF from 'jspdf';

interface Product {
  id: number;
  species: string;
  specification: string;
  glazing: number;
  size: string;
  low: number;
  high: number;
  reference_weight: number;
  status?: 'active' | 'inactive';
  created_at?: string;
}

interface Rate {
  id: number;
  name: string;
  low: number;
  high: number;
  rate: number;
}

interface Constants {
  id: number;
  usd_rate: number;
  variable_overhead: number;
  fixed_overhead: number;
  freight: number;
  insurance: number;
  subsidy_rate: number;
  subsidy_cap: number;
}

interface CostingResult {
  species: string;
  specification: string;
  glazing: number;
  size: string;
  referenceRMCost: number;
  glazingPercentage: number;
  netWeight: number;
  referenceWeight: number;
  rmCostPerGram: number;
  adjustedRMCost: number;
  subtotalBDT: number;
  usdCost: number;
  preSubsidyCost: number;
  calculatedSubsidy: number;
  appliedSubsidy: number;
  cfrCost: number;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [constants, setConstants] = useState<Constants | null>(null);
  const [costingResults, setCostingResults] = useState<CostingResult[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    status: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.size.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchAllData = async () => {
    try {
      const [productsData, ratesData, constantsData] = await Promise.all([
        apiService.get('/products'),
        apiService.get('/rates'),
        apiService.get('/costs/constants')
      ]);
      
      const productsWithStatus = productsData.map((product: Product) => ({
        ...product,
        status: product.status || 'active'
      }));
      
      setProducts(productsWithStatus);
      setRates(ratesData);
      setConstants(constantsData);
      
      // Calculate costing for all products using CORRECTED CFR logic
      calculateAllCosts(productsWithStatus, ratesData, constantsData);
    } catch (err: any) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAllCosts = (products: Product[], rates: Rate[], constants: Constants) => {
    const results: CostingResult[] = [];

    products.forEach(product => {
      try {
        // Use the CORRECTED CFR calculation logic
        const result = CostingCalculator.calculateProductCost(
          product,
          rates,
          constants,
          1 // quantity = 1 for unit calculations
        );

        results.push({
          species: product.species,
          specification: product.specification,
          glazing: product.glazing,
          size: product.size,
          referenceRMCost: result.breakdown.referenceRMCost || 0,
          glazingPercentage: result.breakdown.glazingPercentage || (product.glazing / 100),
          netWeight: result.breakdown.netWeight || ((product.glazing / 100) * 1000),
          referenceWeight: result.breakdown.referenceWeight || product.reference_weight,
          rmCostPerGram: result.breakdown.rmCostPerGram || 0,
          adjustedRMCost: result.breakdown.adjustedRMCost || 0,
          subtotalBDT: result.breakdown.subtotalBDT,
          usdCost: result.breakdown.usdCost,
          preSubsidyCost: result.breakdown.preSubsidyCost,
          calculatedSubsidy: result.breakdown.calculatedSubsidy,
          appliedSubsidy: result.breakdown.appliedSubsidy,
          cfrCost: result.breakdown.finalCFRCostUSD
        });
      } catch (error) {
        console.error(`Failed to calculate cost for product ${product.id}:`, error);
        // Add a placeholder result to maintain table structure
        const glazingPercentage = product.glazing / 100;
        const netWeight = glazingPercentage * 1000;
        results.push({
          species: product.species,
          specification: product.specification,
          glazing: product.glazing,
          size: product.size,
          referenceRMCost: 0,
          glazingPercentage: glazingPercentage,
          netWeight: netWeight,
          referenceWeight: product.reference_weight,
          rmCostPerGram: 0,
          adjustedRMCost: 0,
          subtotalBDT: 0,
          usdCost: 0,
          preSubsidyCost: 0,
          calculatedSubsidy: 0,
          appliedSubsidy: 0,
          cfrCost: 0
        });
      }
    });

    setCostingResults(results);
  };

  const addProduct = async () => {
    if (!newProduct.species || !newProduct.specification || !newProduct.size) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await apiService.post('/products', newProduct);
      await fetchAllData();
      setNewProduct({ status: 'active' });
      setShowAddForm(false);
      setError('');
    } catch (err: any) {
      setError('Failed to add product');
    }
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditingProduct({ ...product });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingProduct({});
  };

  const saveProduct = async () => {
    if (!editingId || !editingProduct.species || !editingProduct.specification) {
      return;
    }

    try {
      await apiService.put(`/products/${editingId}`, editingProduct);
      await fetchAllData();
      setEditingId(null);
      setEditingProduct({});
    } catch (err: any) {
      setError('Failed to update product');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await apiService.delete(`/products/${id}`);
      await fetchAllData();
    } catch (err: any) {
      setError('Failed to delete product');
    }
  };

  const toggleProductStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await apiService.put(`/products/${product.id}`, {
        ...product,
        status: newStatus
      });
      await fetchAllData();
    } catch (err: any) {
      setError('Failed to update product status');
    }
  };

  const toggleSelectProduct = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(productId => productId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('Production Report - CORRECTED CFR Cost Calculation', 20, 20);
    
    if (constants) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('System Constants (CORRECTED CFR LOGIC)', 20, 35);
      
      doc.setFontSize(10);
      doc.text(`USD Rate: ${constants.usd_rate}`, 20, 45);
      doc.text(`Variable Overhead: ৳${constants.variable_overhead}`, 20, 52);
      doc.text(`Fixed Overhead: ৳${constants.fixed_overhead}`, 20, 59);
      doc.text(`Freight: $${constants.freight} (flat USD)`, 20, 66);
      doc.text(`Insurance: $${constants.insurance} (flat USD)`, 20, 73);
      doc.text(`Subsidy Rate: ${(constants.subsidy_rate * 100).toFixed(1)}%`, 20, 80);
      doc.text(`Subsidy Cap: $${constants.subsidy_cap}`, 20, 87);
    }
    
    // Add costing results
    doc.setFontSize(12);
    doc.text('Product CFR Costing Results (CORRECTED LOGIC)', 20, 105);
    
    let yPos = 115;
    costingResults.forEach((result, index) => {
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.text(`${result.species} ${result.specification} ${result.size}`, 20, yPos);
      doc.text(`CFR Cost: $${result.cfrCost.toFixed(2)}`, 120, yPos);
      doc.text(`Pre-Subsidy: $${result.preSubsidyCost.toFixed(2)}`, 180, yPos);
      doc.text(`Subsidy: $${result.appliedSubsidy.toFixed(2)}`, 220, yPos);
      yPos += 7;
    });
    
    doc.save('production-report-corrected-cfr-calculation.pdf');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
            />
          </div>
          <button 
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* System Constants Section - CORRECTED CFR LOGIC */}
      {constants && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">System Constants (CORRECTED CFR LOGIC)</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">USD Rate</div>
                <div className="text-lg font-bold text-blue-600">{constants.usd_rate}</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Variable Overhead</div>
                <div className="text-lg font-bold text-emerald-600">৳{constants.variable_overhead}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Fixed Overhead</div>
                <div className="text-lg font-bold text-orange-600">৳{constants.fixed_overhead}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Freight</div>
                <div className="text-lg font-bold text-purple-600">${constants.freight}</div>
                <div className="text-xs text-red-600">flat USD</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Insurance</div>
                <div className="text-lg font-bold text-yellow-600">${constants.insurance}</div>
                <div className="text-xs text-red-600">flat USD</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Subsidy Rate</div>
                <div className="text-lg font-bold text-indigo-600">{(constants.subsidy_rate * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Subsidy Cap</div>
                <div className="text-lg font-bold text-pink-600">${constants.subsidy_cap}</div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
              <input
                type="text"
                placeholder="e.g., Black Tiger"
                value={newProduct.species || ''}
                onChange={(e) => setNewProduct({ ...newProduct, species: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specification</label>
              <input
                type="text"
                placeholder="e.g., Head On"
                value={newProduct.specification || ''}
                onChange={(e) => setNewProduct({ ...newProduct, specification: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                placeholder="e.g., 13/15"
                value={newProduct.size || ''}
                onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Glazing (%)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g., 80"
                value={newProduct.glazing || ''}
                onChange={(e) => setNewProduct({ ...newProduct, glazing: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Weight (g)</label>
              <input
                type="number"
                placeholder="e.g., 855"
                value={newProduct.reference_weight || ''}
                onChange={(e) => setNewProduct({ ...newProduct, reference_weight: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low</label>
              <input
                type="number"
                placeholder="e.g., 14"
                value={newProduct.low || ''}
                onChange={(e) => setNewProduct({ ...newProduct, low: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">High</label>
              <input
                type="number"
                placeholder="e.g., 20"
                value={newProduct.high || ''}
                onChange={(e) => setNewProduct({ ...newProduct, high: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-6 flex space-x-3">
            <button
              onClick={addProduct}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Product
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewProduct({ status: 'active' });
                setError('');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Product Specifications and CORRECTED CFR Costing Results */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Product Specifications & CORRECTED CFR Costing</h3>
              <p className="text-sm text-gray-600 mt-1">CFR Cost = preSubsidyCost - min(calculatedSubsidy, subsidyCap)</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Glazing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref. Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference RM Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adjusted RM Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USD Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pre-Subsidy Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Subsidy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CFR Cost (USD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => {
                const costingResult = costingResults.find(r => 
                  r.species === product.species && 
                  r.specification === product.specification && 
                  r.size === product.size
                );
                
                // Check if this matches the expected CFR result ($12.81)
                const isCorrectCFRResult = costingResult && Math.abs(costingResult.cfrCost - 12.81) < 0.01;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="text"
                          value={editingProduct.species || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, species: e.target.value })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{product.species}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="text"
                          value={editingProduct.specification || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, specification: e.target.value })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{product.specification}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.glazing || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, glazing: parseFloat(e.target.value) })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{product.glazing}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="text"
                          value={editingProduct.size || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{product.size}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editingProduct.low || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, low: parseInt(e.target.value) })}
                          className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{product.low}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editingProduct.high || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, high: parseInt(e.target.value) })}
                          className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{product.high}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editingProduct.reference_weight || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, reference_weight: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{product.reference_weight}g</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">
                        {costingResult ? `৳${costingResult.referenceRMCost.toFixed(2)}` : '-'}
                      </span>
                      {costingResult && (
                        <div className="text-xs text-gray-500">
                          Range: {product.low}-{product.high}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-blue-600 font-medium">
                        {costingResult ? `${costingResult.netWeight.toFixed(0)}g` : `${(product.glazing * 10).toFixed(0)}g`}
                      </span>
                      <div className="text-xs text-gray-500">
                        {product.glazing}% × 1000
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-purple-600">
                        {costingResult ? `৳${costingResult.adjustedRMCost.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-orange-600">
                        {costingResult ? `$${costingResult.usdCost.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-indigo-600">
                        {costingResult ? `$${costingResult.preSubsidyCost.toFixed(2)}` : '-'}
                      </span>
                      {costingResult && (
                        <div className="text-xs text-gray-500">
                          USD + F&I
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-red-600">
                        {costingResult ? `$${costingResult.appliedSubsidy.toFixed(2)}` : '-'}
                      </span>
                      {costingResult && costingResult.calculatedSubsidy !== costingResult.appliedSubsidy && (
                        <div className="text-xs text-red-500">
                          Capped
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${isCorrectCFRResult ? 'text-green-600' : 'text-green-600'}`}>
                        {costingResult ? `$${costingResult.cfrCost.toFixed(2)}` : '-'}
                      </span>
                    
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === product.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={saveProduct}
                            className="text-green-600 hover:text-green-900 transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleProductStatus(product)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            {product.status === 'active' ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditing(product)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CORRECTED CFR Calculation Summary */}
      {costingResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          
          
         
        </div>
      )}
    </div>
  );
}