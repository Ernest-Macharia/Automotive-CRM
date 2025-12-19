import { apiClient } from '@/lib/api/client';

export interface BlueprintStage {
  id?: string;
  _id?: string;
  name: string;
  order: number;
  allowedRoles: string[];
  entryActions: BlueprintAction[];
  exitActions: BlueprintAction[];
}

export interface BlueprintAction {
  actionType: string;
  params: Record<string, any>;
  id?: string;
}

export interface Blueprint {
  id: string;
  name: string;
  module: string;
  stages: BlueprintStage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface CreateBlueprintData {
  name: string;
  module: string;
  stages: Omit<BlueprintStage, 'id'>[];
  description?: string;
  isActive?: boolean;
}

function normalizeBlueprint(data: any): Blueprint {
  return {
    id: data._id || data.id,
    name: data.name,
    module: data.module,
    stages: data.stages || [],
    isActive: data.active !== undefined ? data.active : data.isActive,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    description: data.description,
  };
}

export interface UpdateBlueprintData extends Partial<CreateBlueprintData> {}

export interface TestAutomationData {
  name: string;
  module: string;
  stages: Omit<BlueprintStage, 'id'>[];
}

class BlueprintsService {
  async getBlueprints(): Promise<Blueprint[]> {
    try {
      const response = await apiClient.get<any[]>('/blueprints');
      return response.map(normalizeBlueprint);
    } catch (error) {
      console.error('Error fetching blueprints:', error);
      throw error;
    }
  }

  async getBlueprint(id: string): Promise<Blueprint> {
    try {
      const response = await apiClient.get<any>(`/blueprints/${id}`);
      return normalizeBlueprint(response);
    } catch (error) {
      console.error('Error fetching blueprint:', error);
      throw error;
    }
  }

  async createBlueprint(data: CreateBlueprintData): Promise<Blueprint> {
    try {
      return await apiClient.post<CreateBlueprintData, Blueprint>('/blueprints', data);
    } catch (error) {
      console.error('Error creating blueprint:', error);
      throw error;
    }
  }

  async updateBlueprint(id: string, data: UpdateBlueprintData): Promise<Blueprint> {
    try {
      return await apiClient.patch<UpdateBlueprintData, Blueprint>(
        `/blueprints/${id}`,
        data
      );
    } catch (error) {
      console.error('Error updating blueprint:', error);
      throw error;
    }
  }

  async deleteBlueprint(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/blueprints/${id}`);
    } catch (error) {
      console.error('Error deleting blueprint:', error);
      throw error;
    }
  }

  async testBlueprintAutomation(data: TestAutomationData): Promise<any> {
    try {
      return await apiClient.post<TestAutomationData, any>('/blueprints/test/automation', data);
    } catch (error) {
      console.error('Error testing blueprint automation:', error);
      throw error;
    }
  }

  async getAvailableModules(): Promise<string[]> {
    return ['opportunities', 'quotes', 'customers', 'jobs', 'inventory', 'projects', 'tasks'];
  }

  async getAvailableRoles(): Promise<string[]> {
    return [
      'admin',
      'manager',
      'sales_representative',
      'technician',
      'customer_success',
      'finance',
      'operations',
      'viewer',
      'supervisor',
      'coordinator'
    ];
  }
}

export const blueprintsService = new BlueprintsService();