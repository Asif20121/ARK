import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, module, action, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return null; // This will be handled by the main App component
  }

  if (module && action && !hasPermission(module, action)) {
    return (
      fallback || (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">You don't have permission to access this feature.</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}