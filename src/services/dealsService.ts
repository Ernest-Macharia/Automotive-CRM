import { apiClient } from '@/lib/api/client';

export interface Deal {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  value?: number;
  stage?: string;
  status?: string;
  opportunityId?: string;
  customerId?: string;
  assignedTo?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateDealData {
  [key: string]: unknown;
}

export interface UpdateDealData {
  [key: string]: unknown;
}

class DealsService {
  private basePath = '/deals';

  async create(data: CreateDealData): Promise<Deal> {
    try {
      return await apiClient.post<CreateDealData, Deal>(this.basePath, data);
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }

  async getAll(): Promise<Deal[]> {
    try {
      return await apiClient.get<Deal[]>(this.basePath);
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Deal> {
    try {
      return await apiClient.get<Deal>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error fetching deal ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, data: UpdateDealData): Promise<Deal> {
    try {
      return await apiClient.put<UpdateDealData, Deal>(`${this.basePath}/${id}`, data);
    } catch (error) {
      console.error(`Error updating deal ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error deleting deal ${id}:`, error);
      throw error;
    }
  }
}

export const dealsService = new DealsService();
