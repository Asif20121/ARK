import React, { useState, useEffect } from 'react';
import { BarChart3, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

interface Rate {
  id: number;
  name: string;
  low: number;
  high: number;
  rate: number;
}

export function RateChart() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRate, setEditingRate] = useState<Partial<Rate>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRate, setNewRate] = useState<Partial<Rate>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const data = await apiService.get('/rates');
      setRates(data);
    } catch (err: any) {
      setError('Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  };

  const addRate = async () => {
    if (!newRate.name || !newRate.low || !newRate.high || !newRate.rate) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await apiService.post('/rates', newRate);
      await fetchRates();
      setNewRate({});
      setShowAddForm(false);
      setSuccess('Rate added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to add rate');
    }
  };

  const startEditing = (rate: Rate) => {
    setEditingId(rate.id);
    setEditingRate({ ...rate });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingRate({});
  };

  const saveRate = async () => {
    if (!editingId || !editingRate.name || !editingRate.low || !editingRate.high || !editingRate.rate) {
      return;
    }

    try {
      await apiService.put(`/rates/${editingId}`, editingRate);
      await fetchRates();
      setEditingId(null);
      setEditingRate({});
      setSuccess('Rate updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to update rate');
    }
  };

  const deleteRate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rate?')) {
      return;
    }

    try {
      await apiService.delete(`/rates/${id}`);
      await fetchRates();
      setSuccess('Rate deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to delete rate');
    }
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Rate Chart</h2>
          </div>
          <ProtectedRoute module="rates" action="create">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </button>
          </ProtectedRoute>
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

        {/* Add Rate Form */}
        {showAddForm && hasPermission('rates', 'create') && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border-2 border-dashed border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Rate</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., F"
                  value={newRate.name || ''}
                  onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Range</label>
                <input
                  type="number"
                  placeholder="e.g., 26"
                  value={newRate.low || ''}
                  onChange={(e) => setNewRate({ ...newRate, low: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">High Range</label>
                <input
                  type="number"
                  placeholder="e.g., 30"
                  value={newRate.high || ''}
                  onChange={(e) => setNewRate({ ...newRate, high: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate (BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1250.00"
                  value={newRate.rate || ''}
                  onChange={(e) => setNewRate({ ...newRate, rate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={addRate}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Add Rate
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewRate({});
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate (BDT)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === rate.id ? (
                      <input
                        type="text"
                        value={editingRate.name || ''}
                        onChange={(e) => setEditingRate({ ...editingRate, name: e.target.value })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rate.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === rate.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editingRate.low || ''}
                          onChange={(e) => setEditingRate({ ...editingRate, low: parseInt(e.target.value) })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          value={editingRate.high || ''}
                          onChange={(e) => setEditingRate({ ...editingRate, high: parseInt(e.target.value) })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-900 font-medium">{rate.low} - {rate.high}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === rate.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingRate.rate || ''}
                        onChange={(e) => setEditingRate({ ...editingRate, rate: parseFloat(e.target.value) })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-sm font-bold text-green-600">৳{rate.rate.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === rate.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={saveRate}
                          className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-50"
                          title="Cancel editing"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ProtectedRoute module="rates" action="update">
                          <button
                            onClick={() => startEditing(rate)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                            title="Edit rate"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </ProtectedRoute>
                        <ProtectedRoute module="rates" action="delete">
                          <button
                            onClick={() => deleteRate(rate.id)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete rate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ProtectedRoute>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rates.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rates found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new rate.</p>
            <ProtectedRoute module="rates" action="create">
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate
                </button>
              </div>
            </ProtectedRoute>
          </div>
        )}
      </div>
    </div>
  );
}