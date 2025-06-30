import React from 'react';
import { FileText, Clock, Settings } from 'lucide-react';

export function ProductionReport() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Production Report</h2>
              <p className="text-gray-600 mt-1">Comprehensive costing analysis and reporting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
            <Clock className="h-10 w-10 text-blue-600" />
          </div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h3>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We're working hard to bring you a comprehensive production report with detailed costing analysis, 
            product specifications, and advanced reporting features.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Detailed Reports</h4>
              <p className="text-gray-600 text-sm">
                Comprehensive production reports with cost breakdowns and analysis
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 mx-auto mb-4">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Advanced Calculations</h4>
              <p className="text-gray-600 text-sm">
                Automated costing calculations with weight adjustments and overhead costs
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 mx-auto mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Export Options</h4>
              <p className="text-gray-600 text-sm">
                Export reports to PDF and other formats for easy sharing and archiving
              </p>
            </div>
          </div>
          
          <div className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-not-allowed opacity-75">
            <Clock className="h-5 w-5 mr-2" />
            Feature Under Development
          </div>
        </div>
      </div>
      
      {/* Status Update */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Status:</span> In Development
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Expected completion: Q3 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}