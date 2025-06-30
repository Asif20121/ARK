import { User, LoginCredentials, CreateUserData, UpdateUserData, ChangePasswordData, ResetPasswordData, ROLE_PERMISSIONS } from '../types/auth';

// Simple password hashing using Web Crypto API
class PasswordService {
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_key_2025'); // Add salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hashedPassword;
  }

  async createHash(password: string): Promise<string> {
    return this.hashPassword(password);
  }
}

class AuthService {
  private passwordService = new PasswordService();
  private readonly STORAGE_KEYS = {
    USERS: 'auth_users',
    CURRENT_USER: 'auth_current_user',
    TOKEN: 'auth_token'
  };

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

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getUsers(): User[] {
    return this.getFromStorage(this.STORAGE_KEYS.USERS, []);
  }

  private saveUsers(users: User[]): void {
    this.saveToStorage(this.STORAGE_KEYS.USERS, users);
  }

  async initializeDefaultUsers(): Promise<void> {
    const users = this.getUsers();
    const adminExists = users.find(u => u.email === 'admin@company.com');
    
    if (!adminExists) {
      // Create the default admin user with the specified credentials
      const defaultPasswordHash = await this.passwordService.createHash('admin123#');
      const adminUser: User = {
        id: 1,
        name: 'System Administrator',
        email: 'admin@company.com',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      };
      
      // Store password hash
      localStorage.setItem('user_1_password', defaultPasswordHash);
      
      // Save user to users array
      const updatedUsers = users.filter(u => u.id !== 1); // Remove any existing user with ID 1
      updatedUsers.push(adminUser);
      this.saveUsers(updatedUsers);
      
      console.log('Default admin user created with email: admin@company.com and password: admin123#');
    } else {
      // Ensure the admin user has the correct password
      const storedPassword = localStorage.getItem(`user_${adminExists.id}_password`);
      if (!storedPassword) {
        const defaultPasswordHash = await this.passwordService.createHash('admin123#');
        localStorage.setItem(`user_${adminExists.id}_password`, defaultPasswordHash);
        console.log('Admin password restored');
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const users = this.getUsers();
    const user = users.find(u => u.email === credentials.email && u.status === 'active');
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const storedPassword = localStorage.getItem(`user_${user.id}_password`);
    if (!storedPassword) {
      throw new Error('User password not found. Please contact administrator.');
    }

    const isValidPassword = await this.passwordService.verifyPassword(credentials.password, storedPassword);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.last_login = new Date().toISOString();
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    this.saveUsers(updatedUsers);

    const token = this.generateToken();
    this.saveToStorage(this.STORAGE_KEYS.CURRENT_USER, user);
    this.saveToStorage(this.STORAGE_KEYS.TOKEN, token);

    return { user, token };
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
  }

  getCurrentUser(): User | null {
    return this.getFromStorage(this.STORAGE_KEYS.CURRENT_USER, null);
  }

  getToken(): string | null {
    return this.getFromStorage(this.STORAGE_KEYS.TOKEN, null);
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.getToken() !== null;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const users = this.getUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await this.passwordService.createHash(userData.password);
    const newUser: User = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };

    users.push(newUser);
    this.saveUsers(users);
    
    // Store password separately
    localStorage.setItem(`user_${newUser.id}_password`, hashedPassword);

    return newUser;
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Check if email already exists (excluding current user)
    if (userData.email && users.find(u => u.email === userData.email && u.id !== id)) {
      throw new Error('Email already exists');
    }

    const updatedUser = {
      ...users[userIndex],
      ...userData,
      updated_at: new Date().toISOString()
    };

    users[userIndex] = updatedUser;
    this.saveUsers(users);

    // Update current user if it's the same user
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      this.saveToStorage(this.STORAGE_KEYS.CURRENT_USER, updatedUser);
    }

    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    const users = this.getUsers();
    const currentUser = this.getCurrentUser();
    
    // Prevent deleting own account
    if (currentUser && currentUser.id === id) {
      throw new Error('Cannot delete your own account');
    }

    const filteredUsers = users.filter(u => u.id !== id);
    this.saveUsers(filteredUsers);
    
    // Remove password
    localStorage.removeItem(`user_${id}_password`);
  }

  getAllUsers(): User[] {
    return this.getUsers();
  }

  async changePassword(userId: number, passwordData: ChangePasswordData): Promise<void> {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new Error('New passwords do not match');
    }

    const storedPassword = localStorage.getItem(`user_${userId}_password`);
    if (!storedPassword) {
      throw new Error('User not found');
    }

    const isValidCurrentPassword = await this.passwordService.verifyPassword(
      passwordData.currentPassword, 
      storedPassword
    );
    
    if (!isValidCurrentPassword) {
      throw new Error('Current password is incorrect');
    }

    const newHashedPassword = await this.passwordService.createHash(passwordData.newPassword);
    localStorage.setItem(`user_${userId}_password`, newHashedPassword);
  }

  async resetPassword(resetData: ResetPasswordData): Promise<void> {
    if (resetData.newPassword !== resetData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const users = this.getUsers();
    const user = users.find(u => u.email === resetData.email);
    
    if (!user) {
      throw new Error('User not found');
    }

    const newHashedPassword = await this.passwordService.createHash(resetData.newPassword);
    localStorage.setItem(`user_${user.id}_password`, newHashedPassword);
  }

  hasPermission(userRole: string, module: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    const modulePermission = permissions.find(p => p.module === module);
    return modulePermission ? modulePermission.actions.includes(action) : false;
  }
}

export const authService = new AuthService();