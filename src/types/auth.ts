export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  password?: string; // Only used during creation/update
  created_at: string;
  updated_at: string;
  last_login?: string;
  status: 'active' | 'inactive';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  status?: 'active' | 'inactive';
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Permission {
  module: string;
  actions: string[];
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'products', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'rates', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'constants', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'calculator', actions: ['read', 'calculate'] },
    { module: 'reports', actions: ['read', 'export'] },
    { module: 'demo', actions: ['read'] }
  ],
  editor: [
    { module: 'products', actions: ['create', 'read', 'update'] },
    { module: 'rates', actions: ['create', 'read', 'update'] },
    { module: 'constants', actions: ['read', 'update'] },
    { module: 'calculator', actions: ['read', 'calculate'] },
    { module: 'reports', actions: ['read', 'export'] },
    { module: 'demo', actions: ['read'] }
  ],
  viewer: [
    { module: 'products', actions: ['read'] },
    { module: 'rates', actions: ['read'] },
    { module: 'constants', actions: ['read'] },
    { module: 'calculator', actions: ['read', 'calculate'] },
    { module: 'reports', actions: ['read'] },
    { module: 'demo', actions: ['read'] }
  ]
};