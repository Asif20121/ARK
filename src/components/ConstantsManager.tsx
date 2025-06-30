import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { apiService } from '../services/api';

interface Constants {
  usd_rate: number;
  variable_overhead: number;
  fixed_overhead: number;
  freight: number;
  insurance: number;
}

export function ConstantsManager() {
  const [constants, setConstants] = useState<Constants | null>(null);
  const [editedConstants, setEditedConstants] = useState<Constants | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConstants();
  }, []);

  const fetchConstants = async () => {
    try {
      const data = await apiService.get('/costs/constants');
      setConstants(data);
      setEditedConstants(data);
    } catch (err: any) {
      setError('Failed to fetch constants');
    } finally {
      setLoading(false);
    }
  };

  const saveConstants = async () => {
    if (!editedConstants) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiService.put('/costs/constants', editedConstants);
      setConstants(editedConstants);
      setSuccess('Constants updated successfully');
    } catch (err: any) {
      setError('Failed to update constants');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!constants || !editedConstants) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">Failed to load constants</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <Settings className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Costing Constants</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              USD Exchange Rate
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={editedConstants.usd_rate || ''}
                onChange={(e) => handleInputChange('usd_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">₹</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Local currency per 1 USD</p>
          </div>

          <div className="bg-emerald-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variable Overhead
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={editedConstants.variable_overhead || ''}
                onChange={(e) => handleInputChange('variable_overhead', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">$</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Per unit variable cost</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fixed Overhead
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={editedConstants.fixed_overhead || ''}
                onChange={(e) => handleInputChange('fixed_overhead', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">$</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Per unit fixed cost</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Freight Rate
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={editedConstants.freight || ''}
                onChange={(e) => handleInputChange('freight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Percentage of base price</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Rate
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={editedConstants.insurance || ''}
                onChange={(e) => handleInputChange('insurance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Percentage of base price</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveConstants}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Constants'}
          </button>
        </div>

        {/* Constants Summary */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Current Settings Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-600">USD Rate:</span>
              <span className="ml-2 font-medium">₹{(constants.usd_rate || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Var. Overhead:</span>
              <span className="ml-2 font-medium">${(constants.variable_overhead || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Fixed Overhead:</span>
              <span className="ml-2 font-medium">${(constants.fixed_overhead || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Freight:</span>
              <span className="ml-2 font-medium">{((constants.freight || 0) * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-600">Insurance:</span>
              <span className="ml-2 font-medium">{((constants.insurance || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}