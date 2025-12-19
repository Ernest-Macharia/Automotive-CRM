import { apiClient } from '@/lib/api/client';

export interface User {
  id: string;
  name: string | null;
  email: string;
  roleName: string;
  permissions: string[];
  active: boolean;
  canViewSummary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name?: string;
  email: string;
  password?: string;
  roleName: string;
  permissions?: string[];
  active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roleName?: string;
  permissions?: string[];
  active?: boolean;
  canViewSummary?: boolean;
}

class UserService {
    async getUsers(): Promise<User[]> {
        try {
            const users = await apiClient.get<User[]>('/users');
            
            // Ensure each user has a unique ID
            return users.map((user, index) => ({
            ...user,
            id: user.id || `temp-id-${Date.now()}-${index}`,
            name: user.name || null,
            canViewSummary: user.canViewSummary || false,
            permissions: user.permissions || []
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

  async getUser(id: string): Promise<User> {
    try {
      // Since you might not have a single user endpoint, we'll fetch all and filter
      const users = await this.getUsers();
      const user = users.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async createUser(data: CreateUserData): Promise<User> {
    try {
      return await apiClient.post<CreateUserData, User>('/users', data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      return await apiClient.patch<UpdateUserData, User>(`/users/${id}`, data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async updateUserSummaryAccess(id: string, canViewSummary: boolean): Promise<User> {
    try {
      return await apiClient.patch<{ canViewSummary: boolean }, User>(
        `/users/${id}/summary-access`,
        { canViewSummary }
      );
    } catch (error) {
      console.error('Error updating user summary access:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      return await apiClient.get<User>('/users/me');
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
}

export const userService = new UserService();