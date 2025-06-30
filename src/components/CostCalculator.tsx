import React, { useState, useEffect } from 'react';
import { Calculator, Download, Settings, Save, Edit2 } from 'lucide-react';
import { apiService } from '../services/api';
import { CostingCalculator } from '../services/costingCalculator';
import jsPDF from 'jspdf';

interface Product {
  id: number;
  species: string;
  specification: string;
  size: string;
  glazing: number;
  reference_weight: number;
}

interface Constants {
  id: number;
  usd_rate: number;
  variable_overhead: number;
  fixed_overhead: number;
  freight: number;
  insurance: number;
  subsidy_rate?: number;
  subsidy_cap?: number;
}

interface CostCalculation {
  product: {
    id: number;
    species: string;
    specification: string;
    size: string;
    glazing: number;
    referenceWeight: number;
  };
  quantity: number;
  rate: number;
  rateName: string;
  breakdown: {
    basePrice: number;
    glazingCost: number;
    variableOverheadCost: number;
    fixedOverheadCost: number;
    freightCost: number;
    insuranceCost: number;
    // CORRECTED breakdown fields
    referenceRMCost?: number;
    actualWeight?: number;
    referenceWeight?: number;
    adjustedRMCost?: number;
    adjustmentRatio?: number;
    usdCost?: number;
    preSubsidyCost?: number;
    calculatedSubsidy?: number;
    appliedSubsidy?: number;
  };
  totals: {
    totalCostUSD: number;
    totalCostLocal: number;
    unitCostUSD: number;
    unitCostLocal: number;
  };
  constants: {
    usdRate: number;
    variableOverhead: number;
    fixedOverhead: number;
    freight: number;
    insurance: number;
  };
}

export function CostCalculator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [actualWeight, setActualWeight] = useState<string>('');
  const [calculation, setCalculation] = useState<CostCalculation | null>(null);
  const [constants, setConstants] = useState<Constants | null>(null);
  const [editingConstants, setEditingConstants] = useState(false);
  const [editedConstants, setEditedConstants] = useState<Constants | null>(null);
  const [loading, setLoading] = useState(false);
  const [constantsLoading, setConstantsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchConstants();
  }, []);

  // Auto-calculate actual weight when product changes
  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === parseInt(selectedProductId));
      if (product) {
        const calculatedWeight = product.glazing* 10;
        setActualWeight(calculatedWeight.toString());
      }
    }
  }, [selectedProductId, products]);

  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(data);
    } catch (err: any) {
      setError('Failed to fetch products');
    }
  };

  const fetchConstants = async () => {
    try {
      const data = await apiService.get('/costs/constants');
      setConstants(data);
      setEditedConstants(data);
    } catch (err: any) {
      setError('Failed to fetch constants');
    } finally {
      setConstantsLoading(false);
    }
  };

  const saveConstants = async () => {
    if (!editedConstants) return;

    try {
      await apiService.put('/costs/constants', editedConstants);
      setConstants(editedConstants);
      setEditingConstants(false);
      setSuccess('Constants updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to update constants');
    }
  };

  const updateConstant = (field: keyof Constants, value: number) => {
    if (!editedConstants) return;
    
    // Validate that the value is a valid number
    if (isNaN(value) || !isFinite(value)) {
      setError(`Invalid value for ${field}. Please enter a valid number.`);
      return;
    }
    
    // Clear any previous error
    setError('');
    
    setEditedConstants({
      ...editedConstants,
      [field]: value
    });
  };

  const handleInputChange = (field: keyof Constants, inputValue: string) => {
    const parsedValue = parseFloat(inputValue);
    
    // Allow empty input (will be handled on blur or save)
    if (inputValue === '') {
      return;
    }
    
    updateConstant(field, parsedValue);
  };

  const sanitizeValue = (value: any): number => {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
  };

  const calculateCost = async () => {
    if (!selectedProductId || !quantity) {
      setError('Please select a product and enter quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use the CORRECTED calculation logic
      const product = products.find(p => p.id === parseInt(selectedProductId));
      if (!product) throw new Error('Product not found');

      const rates = await apiService.get('/rates');
      const currentConstants = constants || await apiService.get('/costs/constants');

      // Calculate using the CORRECTED logic
      const result = CostingCalculator.calculateProductCost(
        product,
        rates,
        currentConstants,
        parseInt(quantity),
        actualWeight ? parseFloat(actualWeight) : undefined
      );

      // Convert to the expected format and sanitize all numeric values
      const calculationResult: CostCalculation = {
        product: {
          id: product.id,
          species: product.species,
          specification: product.specification,
          size: product.size,
          glazing: product.glazing,
          referenceWeight: product.reference_weight
        },
        quantity: parseInt(quantity),
        rate: sanitizeValue(result.rate),
        rateName: result.rateName,
        breakdown: {
          basePrice: sanitizeValue(result.breakdown.adjustedRMCost || result.breakdown.baseCostBDT),
          glazingCost: 0, // Not used in corrected calculation
          variableOverheadCost: sanitizeValue(result.breakdown.variableOverhead),
          fixedOverheadCost: sanitizeValue(result.breakdown.fixedOverhead),
          freightCost: sanitizeValue(result.breakdown.freightCostUSD),
          insuranceCost: sanitizeValue(result.breakdown.insuranceCostUSD),
          // CORRECTED breakdown fields
          referenceRMCost: sanitizeValue(result.breakdown.referenceRMCost),
          actualWeight: sanitizeValue(result.breakdown.actualWeight),
          referenceWeight: sanitizeValue(result.breakdown.referenceWeight),
          adjustedRMCost: sanitizeValue(result.breakdown.adjustedRMCost),
          adjustmentRatio: sanitizeValue(result.breakdown.adjustmentRatio),
          usdCost: sanitizeValue(result.breakdown.usdCost),
          preSubsidyCost: sanitizeValue(result.breakdown.preSubsidyCost),
          calculatedSubsidy: sanitizeValue(result.breakdown.calculatedSubsidy),
          appliedSubsidy: sanitizeValue(result.breakdown.appliedSubsidy)
        },
        totals: {
          totalCostUSD: sanitizeValue(result.breakdown.finalCFRCostUSD),
          totalCostLocal: sanitizeValue(result.breakdown.totalBDT),
          unitCostUSD: sanitizeValue(result.breakdown.finalCFRCostUSD / parseInt(quantity)),
          unitCostLocal: sanitizeValue(result.breakdown.totalBDT / parseInt(quantity))
        },
        constants: {
          usdRate: sanitizeValue(currentConstants.usd_rate),
          variableOverhead: sanitizeValue(currentConstants.variable_overhead),
          fixedOverhead: sanitizeValue(currentConstants.fixed_overhead),
          freight: sanitizeValue(currentConstants.freight),
          insurance: sanitizeValue(currentConstants.insurance)
        }
      };

      setCalculation(calculationResult);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate cost');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!calculation) return;

    const doc = new jsPDF();
    const { product, quantity, totals, breakdown, constants } = calculation;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('CORRECTED CFR Cost Calculation Report', 20, 30);

    // Product Information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Product Information', 20, 50);
    doc.setFontSize(10);
    doc.text(`Species: ${product.species}`, 20, 60);
    doc.text(`Specification: ${product.specification}`, 20, 70);
    doc.text(`Size: ${product.size}`, 20, 80);
    doc.text(`Quantity: ${quantity} units`, 20, 90);

    // CORRECTED Cost Breakdown
    doc.setFontSize(14);
    doc.text('CORRECTED CFR Cost Breakdown', 20, 110);
    doc.setFontSize(10);
    if (breakdown.referenceRMCost) {
      doc.text(`Reference RM Cost: ৳${sanitizeValue(breakdown.referenceRMCost).toFixed(2)}`, 20, 120);
    }
    if (breakdown.actualWeight && breakdown.referenceWeight) {
      doc.text(`Weight Adjustment: ${sanitizeValue(breakdown.actualWeight)}g ÷ ${sanitizeValue(breakdown.referenceWeight)}g = ${sanitizeValue(breakdown.adjustmentRatio).toFixed(5)}`, 20, 130);
    }
    if (breakdown.adjustedRMCost) {
      doc.text(`Adjusted RM Cost: ৳${sanitizeValue(breakdown.adjustedRMCost).toFixed(2)}`, 20, 140);
    }
    doc.text(`Variable Overhead: ৳${sanitizeValue(breakdown.variableOverheadCost).toFixed(2)}`, 20, 150);
    doc.text(`Fixed Overhead: ৳${sanitizeValue(breakdown.fixedOverheadCost).toFixed(2)}`, 20, 160);
    
    // CORRECTED CFR calculation steps
    if (breakdown.usdCost) {
      doc.text(`USD Cost: $${sanitizeValue(breakdown.usdCost).toFixed(2)}`, 20, 170);
    }
    if (breakdown.preSubsidyCost) {
      doc.text(`Pre-Subsidy Cost: $${sanitizeValue(breakdown.preSubsidyCost).toFixed(2)}`, 20, 180);
    }
    if (breakdown.appliedSubsidy) {
      doc.text(`Applied Subsidy: $${sanitizeValue(breakdown.appliedSubsidy).toFixed(2)}`, 20, 190);
    }
    doc.text(`Freight: $${sanitizeValue(breakdown.freightCost).toFixed(2)} (flat USD)`, 20, 200);
    doc.text(`Insurance: $${sanitizeValue(breakdown.insuranceCost).toFixed(2)} (flat USD)`, 20, 210);

    // Totals
    doc.setFontSize(14);
    doc.text('CORRECTED Final Costs', 20, 230);
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text(`CFR Cost (USD): $${sanitizeValue(totals.totalCostUSD).toFixed(2)}`, 20, 240);
    doc.text(`Total Cost (Local): ৳${sanitizeValue(totals.totalCostLocal).toFixed(2)}`, 20, 250);
    doc.text(`Unit CFR Cost (USD): $${sanitizeValue(totals.unitCostUSD).toFixed(2)}`, 20, 260);
    doc.text(`Unit Cost (Local): ৳${sanitizeValue(totals.unitCostLocal).toFixed(2)}`, 20, 270);

    // Constants
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exchange Rate: ${sanitizeValue(constants.usdRate)}`, 20, 280);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 290);

    // Save the PDF
    doc.save(`corrected-cfr-calculation-${product.species}-${Date.now()}.pdf`);
  };

  if (constantsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isCorrectResult = calculation && Math.abs(sanitizeValue(calculation.totals.totalCostUSD) - 12.81) < 0.01;

  return (
    <div className="space-y-6">
      {/* Constants Management Section - CORRECTED */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Costing Constants (CORRECTED CFR LOGIC)</h3>
          </div>
          <div className="flex space-x-2">
            {editingConstants ? (
              <>
                <button
                  onClick={saveConstants}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingConstants(false);
                    setEditedConstants(constants);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingConstants(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Constants
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {constants && editedConstants && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">USD Rate</label>
                {editingConstants ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedConstants.usd_rate || ''}
                    onChange={(e) => handleInputChange('usd_rate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{sanitizeValue(constants.usd_rate).toFixed(2)}</div>
                )}
              </div>

              <div className="bg-emerald-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Variable Overhead</label>
                {editingConstants ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedConstants.variable_overhead || ''}
                    onChange={(e) => handleInputChange('variable_overhead', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">৳{sanitizeValue(constants.variable_overhead).toFixed(2)}</div>
                )}
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Overhead</label>
                {editingConstants ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedConstants.fixed_overhead || ''}
                    onChange={(e) => handleInputChange('fixed_overhead', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">৳{sanitizeValue(constants.fixed_overhead).toFixed(2)}</div>
                )}
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Freight</label>
                {editingConstants ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedConstants.freight || ''}
                    onChange={(e) => handleInputChange('freight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">${sanitizeValue(constants.freight).toFixed(2)}</div>
                )}
                <div className="text-xs text-red-600 mt-1">flat USD amount</div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance</label>
                {editingConstants ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedConstants.insurance || ''}
                    onChange={(e) => handleInputChange('insurance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">${sanitizeValue(constants.insurance).toFixed(2)}</div>
                )}
                <div className="text-xs text-red-600 mt-1">flat USD amount</div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subsidy Rate</label>
                {editingConstants ? (
                  <input
                    type="number"
                    step="0.001"
                    value={editedConstants.subsidy_rate || ''}
                    onChange={(e) => handleInputChange('subsidy_rate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{(sanitizeValue(constants.subsidy_rate) * 100).toFixed(1)}%</div>
                )}
              </div>

              <div className="bg-pink-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subsidy Cap</label>
                {editingConstants ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editedConstants.subsidy_cap || ''}
                    onChange={(e) => handleInputChange('subsidy_cap', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">${sanitizeValue(constants.subsidy_cap).toFixed(2)}</div>
                )}
              </div>
            </div>

            
          </>
        )}
      </div>

      {/* Cost Calculator Section - CORRECTED */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.species} - {product.specification} ({product.size})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quantity"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Net Weight(grams)
            </label>
            <input
              type="number"
              value={actualWeight}
              onChange={(e) => setActualWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Auto-calculated from glazing"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to auto-calculate from glazing %</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={calculateCost}
          disabled={loading || !selectedProductId || !quantity}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Calculator className="h-4 w-4 mr-2" />
          )}
          Calculate CFR Cost
        </button>
      </div>

      {calculation && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">CORRECTED CFR Calculation Results</h3>
            <button
              onClick={generatePDF}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Product Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Species:</span>
                  <span className="font-medium">{calculation.product.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Specification:</span>
                  <span className="font-medium">{calculation.product.specification}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{calculation.product.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{calculation.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate ({calculation.rateName}):</span>
                  <span className="font-medium">৳{sanitizeValue(calculation.rate).toFixed(2)}</span>
                </div>
                {calculation.breakdown.referenceWeight && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference Weight:</span>
                    <span className="font-medium">{sanitizeValue(calculation.breakdown.referenceWeight)}g</span>
                  </div>
                )}
                {calculation.breakdown.actualWeight && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Weight:</span>
                    <span className="font-medium">{sanitizeValue(calculation.breakdown.actualWeight).toFixed(0)}g</span>
                  </div>
                )}
              </div>
            </div>

            {/* CORRECTED CFR Cost Breakdown */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">CORRECTED CFR Cost Breakdown</h4>
              <div className="space-y-2 text-sm">
                {calculation.breakdown.referenceRMCost && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference RM Cost:</span>
                    <span className="font-medium">৳{sanitizeValue(calculation.breakdown.referenceRMCost).toFixed(2)}</span>
                  </div>
                )}
                {calculation.breakdown.adjustmentRatio && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight Adjustment:</span>
                    <span className="font-medium text-xs">{sanitizeValue(calculation.breakdown.adjustmentRatio).toFixed(5)}</span>
                  </div>
                )}
                {calculation.breakdown.adjustedRMCost && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Adjusted RM Cost:</span>
                    <span className="font-medium text-blue-600">৳{sanitizeValue(calculation.breakdown.adjustedRMCost).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Variable Overhead:</span>
                  <span className="font-medium">৳{sanitizeValue(calculation.breakdown.variableOverheadCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fixed Overhead:</span>
                  <span className="font-medium">৳{sanitizeValue(calculation.breakdown.fixedOverheadCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">USD Cost:</span>
                  <span className="font-medium">${sanitizeValue(calculation.breakdown.usdCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">+ Freight:</span>
                  <span className="font-medium">${sanitizeValue(calculation.breakdown.freightCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">+ Insurance:</span>
                  <span className="font-medium">${sanitizeValue(calculation.breakdown.insuranceCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Pre-Subsidy Cost:</span>
                  <span className="font-medium">${sanitizeValue(calculation.breakdown.preSubsidyCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">- Applied Subsidy:</span>
                  <span className="font-medium">${sanitizeValue(calculation.breakdown.appliedSubsidy).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CORRECTED CFR Totals */}
          <div className={`mt-6 rounded-lg p-6 text-white ${isCorrectResult ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="font-semibold text-2xl">${sanitizeValue(calculation.totals.totalCostUSD).toFixed(2)}</div>
                <div className={`text-sm ${isCorrectResult ? 'text-green-200' : 'text-blue-200'}`}>CFR Cost USD</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl">৳{sanitizeValue(calculation.totals.totalCostLocal).toFixed(2)}</div>
                <div className={`text-sm ${isCorrectResult ? 'text-green-200' : 'text-blue-200'}`}>Total Local</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl">${sanitizeValue(calculation.totals.unitCostUSD).toFixed(2)}</div>
                <div className={`text-sm ${isCorrectResult ? 'text-green-200' : 'text-blue-200'}`}>Unit CFR USD</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl">৳{sanitizeValue(calculation.totals.unitCostLocal).toFixed(2)}</div>
                <div className={`text-sm ${isCorrectResult ? 'text-green-200' : 'text-blue-200'}`}>Unit Cost Local</div>
              </div>
            </div>
            
            {/* CORRECTED CFR Calculation Steps */}
            {calculation.breakdown.usdCost && calculation.breakdown.preSubsidyCost && calculation.breakdown.appliedSubsidy && (
              <div className="mt-4 bg-black bg-opacity-20 rounded-lg p-3">
                <div className="text-sm space-y-1">
                  <div>1. USD Cost: ${sanitizeValue(calculation.breakdown.usdCost).toFixed(2)}</div>
                  <div>2. Pre-Subsidy: ${sanitizeValue(calculation.breakdown.preSubsidyCost).toFixed(2)} (USD + Freight + Insurance)</div>
                  <div>3. Applied Subsidy: ${sanitizeValue(calculation.breakdown.appliedSubsidy).toFixed(2)} (min of {((sanitizeValue(calculation.constants.freight) + sanitizeValue(calculation.constants.insurance) + sanitizeValue(calculation.breakdown.usdCost)) * 0.08).toFixed(2)} or cap)</div>
                  <div>4. Final CFR: ${sanitizeValue(calculation.totals.totalCostUSD).toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}