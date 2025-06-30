import React, { useState } from 'react';
import { Calculator, BarChart3, Package, Settings, User, FileText, ShoppingCart, Archive, DollarSign, Users, TestTube, LogOut, Shield } from 'lucide-react';
import { RateChart } from './RateChart';
import { ProductList } from './ProductList';
import { CostCalculator } from './CostCalculator';
import { ConstantsManager } from './ConstantsManager';
import { ProductionReport } from './ProductionReport';
import { CostingDemo } from './CostingDemo';
import { UserManagement } from './auth/UserManagement';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'calculator' | 'rates' | 'products' | 'constants' | 'production-report' | 'costing-demo' | 'user-management';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('costing-demo');
  const { user, logout, hasPermission } = useAuth();

  const sidebarItems = [
    { id: 'user-profile', label: user?.name || 'User', icon: User, disabled: true, isProfile: true },
    { id: 'costing-demo', label: 'Costing Demo', icon: TestTube, module: 'demo', action: 'read' },
    { id: 'rates', label: 'Rate Chart', icon: BarChart3, module: 'rates', action: 'read' },
    { id: 'calculator', label: 'Costing Module', icon: Calculator, module: 'calculator', action: 'read' },
    { id: 'products', label: 'Product Management', icon: Package, module: 'products', action: 'read' },
    { id: 'production-report', label: 'Production Report', icon: FileText, module: 'reports', action: 'read' },
    { id: 'constants', label: 'System Constants', icon: Settings, module: 'constants', action: 'read' },
    { id: 'user-management', label: 'User Management', icon: Users, module: 'users', action: 'read' },
    { id: 'procurement', label: 'Procurement', icon: ShoppingCart, disabled: true },
    { id: 'inventory', label: 'Inventory', icon: Archive, disabled: true },
    { id: 'dry-store', label: 'Dry Store', icon: Package, disabled: true },
    { id: 'accounting', label: 'Accounting', icon: DollarSign, disabled: true },
    { id: 'hr', label: 'HR/Payroll', icon: Users, disabled: true },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'costing-demo':
        return (
          <ProtectedRoute module="demo" action="read">
            <CostingDemo />
          </ProtectedRoute>
        );
      case 'calculator':
        return (
          <ProtectedRoute module="calculator" action="read">
            <CostCalculator />
          </ProtectedRoute>
        );
      case 'rates':
        return (
          <ProtectedRoute module="rates" action="read">
            <RateChart />
          </ProtectedRoute>
        );
      case 'products':
        return (
          <ProtectedRoute module="products" action="read">
            <ProductList />
          </ProtectedRoute>
        );
      case 'constants':
        return (
          <ProtectedRoute module="constants" action="read">
            <ConstantsManager />
          </ProtectedRoute>
        );
      case 'production-report':
        return (
          <ProtectedRoute module="reports" action="read">
            <ProductionReport />
          </ProtectedRoute>
        );
      case 'user-management':
        return (
          <ProtectedRoute module="users" action="read">
            <UserManagement />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute module="demo" action="read">
            <CostingDemo />
          </ProtectedRoute>
        );
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'costing-demo': return 'Costing Calculator Demo';
      case 'products': return 'Product Management';
      case 'calculator': return 'Cost Calculator';
      case 'rates': return 'Rate Chart';
      case 'constants': return 'System Constants';
      case 'production-report': return 'Production Report';
      case 'user-management': return 'User Management';
      default: return 'Dashboard';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'costing-demo': return 'Test and validate costing calculations with real-time breakdown';
      case 'products': return 'Manage your shrimp product specifications';
      case 'calculator': return 'Calculate product costs and generate reports';
      case 'rates': return 'Manage pricing rates by quantity ranges';
      case 'constants': return 'Configure system-wide costing parameters';
      case 'production-report': return 'Comprehensive costing analysis and production overview';
      case 'user-management': return 'Manage users, roles, and permissions';
      default: return 'Welcome to the costing management system';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-48 bg-blue-500 text-white flex-shrink-0 flex flex-col">
        <div className="p-4 flex-1">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const hasAccess = !item.module || !item.action || hasPermission(item.module, item.action);
              const isClickable = !item.disabled && hasAccess && !item.isProfile;
              
              if (item.isProfile) {
                return (
                  <div key={item.id} className="px-4 py-3 rounded-lg bg-blue-600">
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-blue-200 flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          {user?.role}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <button
                  key={item.id}
                  onClick={() => isClickable && setActiveTab(item.id as TabType)}
                  disabled={!isClickable}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isClickable
                      ? 'hover:bg-blue-400 text-blue-100'
                      : 'text-blue-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-3" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {!hasAccess && (
                      <Shield className="h-3 w-3 ml-auto text-red-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-blue-400">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-400 text-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <LogOut className="h-4 w-4 mr-3" />
              <span className="text-sm font-medium">Logout</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getTabTitle()}
                </h1>
                <p className="text-gray-600 mt-1">
                  {getTabDescription()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    {user?.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}