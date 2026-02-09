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
  createdBy?: {
    _id?: string;
    id?: string;
    email?: string;
  };
}

export interface CreateBlueprintData {
  name: string;
  module: string;
  stages: Omit<BlueprintStage, 'id'>[];
  description?: string;
  isActive?: boolean;
}

export interface UpdateBlueprintData extends Partial<CreateBlueprintData> {}

export interface TestAutomationData {
  name: string;
  module: string;
  stages: Omit<BlueprintStage, 'id'>[];
}

export interface ValidationResult {
  approved: boolean;
  recordId?: string;
  fromStage?: string;
  toStage?: string;
  errors?: string[];
  blueprint?: Blueprint;
  userRole?: string;
  userId?: string;
  requestId?: string;
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
    createdBy: data.createdBy,
  };
}

class BlueprintsService {
  /**
   * Get all blueprints
   * GET /api/v1/blueprints
   */
  async getBlueprints(): Promise<Blueprint[]> {
    try {
      const response = await apiClient.get<any[]>('/blueprints');
      return response.map(normalizeBlueprint);
    } catch (error) {
      console.error('Error fetching blueprints:', error);
      throw error;
    }
  }

  /**
   * Get a specific blueprint by ID
   * GET /api/v1/blueprints/{id}
   */
  async getBlueprint(id: string): Promise<Blueprint> {
    try {
      const response = await apiClient.get<any>(`/blueprints/${id}`);
      return normalizeBlueprint(response);
    } catch (error) {
      console.error('Error fetching blueprint:', error);
      throw error;
    }
  }

  /**
   * Create a new blueprint
   * POST /api/v1/blueprints
   */
  // Update your createBlueprint method with better debugging
  async createBlueprint(data: CreateBlueprintData): Promise<Blueprint> {
    try {
      // Transform to match EXACTLY what backend CreateBlueprintDto expects
      // Based on your DTO: only name, module, stages
      const backendData = {
        name: data.name,
        module: data.module,
        stages: data.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          // Only include entryActions and exitActions if they exist
          ...(stage.entryActions && stage.entryActions.length > 0 && {
            entryActions: stage.entryActions.map(action => ({
              actionType: action.actionType,
              params: action.params || {}
            }))
          }),
          ...(stage.exitActions && stage.exitActions.length > 0 && {
            exitActions: stage.exitActions.map(action => ({
              actionType: action.actionType,
              params: action.params || {}
            }))
          })
        }))
        // DO NOT include description, active, isActive if not in DTO
      };
      
      // Make sure the endpoint is correct
      const response = await apiClient.post<typeof backendData, any>(
        '/blueprints',
        backendData
      );
      return normalizeBlueprint(response);
    } catch (error: any) {
      console.error('CREATE BLUEPRINT ERROR:');
      
      // Log full error details
      if (error.isAxiosError) {
        console.error('Full Axios Error:', error);
        console.error('Request URL:', error.config?.url);
        console.error('Request Method:', error.config?.method);
        console.error('Request Data:', error.config?.data);
        console.error('Response Status:', error.response?.status);
        console.error('Response Headers:', error.response?.headers);
        console.error('Response Data:', error.response?.data);
        
        // Try to parse validation errors
        if (error.response?.data?.message) {
          console.error('Validation Errors:', error.response.data.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Update an existing blueprint
   * PATCH /api/v1/blueprints/{id}
   */
  async updateBlueprint(id: string, data: UpdateBlueprintData): Promise<Blueprint> {
    try {
      // Transform frontend data to match backend DTO
      const backendData: any = {};
      
      if (data.name !== undefined) backendData.name = data.name;
      if (data.module !== undefined) backendData.module = data.module;
      if (data.description !== undefined) backendData.description = data.description;
      if (data.isActive !== undefined) backendData.active = data.isActive;
      
      if (data.stages !== undefined) {
        backendData.stages = data.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          entryActions: stage.entryActions || [],
          exitActions: stage.exitActions || []
        }));
      }

      const response = await apiClient.patch<typeof backendData, any>(
        `/blueprints/${id}`,
        backendData
      );
      return normalizeBlueprint(response);
    } catch (error) {
      console.error('Error updating blueprint:', error);
      throw error;
    }
  }

  /**
   * Delete a blueprint
   * DELETE /api/v1/blueprints/{id}
   */
  async deleteBlueprint(id: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/blueprints/${id}`);
    } catch (error) {
      console.error('Error deleting blueprint:', error);
      throw error;
    }
  }

  /**
   * Test blueprint automation
   * POST /api/v1/blueprints/test/automation
   */
  async testBlueprintAutomation(data: TestAutomationData): Promise<any> {
    try {
      // Transform to match backend DTO
      const backendData = {
        name: data.name,
        module: data.module,
        stages: data.stages.map(stage => ({
          name: stage.name,
          order: stage.order,
          allowedRoles: stage.allowedRoles,
          entryActions: stage.entryActions || [],
          exitActions: stage.exitActions || []
        }))
      };

      return await apiClient.post<typeof backendData, any>(
        '/blueprints/test/automation',
        backendData
      );
    } catch (error) {
      console.error('Error testing blueprint automation:', error);
      throw error;
    }
  }

  /**
   * Get blueprint by module (matching backend service)
   */
  async getBlueprintByModule(module: string): Promise<Blueprint | null> {
    try {
      const blueprints = await this.getBlueprints();
      const blueprint = blueprints.find(bp => 
        bp.module === module && bp.isActive === true
      );
      return blueprint || null;
    } catch (error) {
      console.error('Error fetching blueprint by module:', error);
      throw error;
    }
  }

  /**
   * Validate transition directly (matching backend service method)
   */
  async validateTransitionDirect(
    module: string,
    record: any,
    currentStage: string,
    nextStage: string,
    userRole: string,
    userId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const blueprint = await this.getBlueprintByModule(module);
      if (!blueprint) {
        return { isValid: false, errors: ['No active blueprint for module'] };
      }

      const errors: string[] = [];
      const stage = blueprint.stages.find(s => s.name === currentStage);
      const target = blueprint.stages.find(s => s.name === nextStage);

      if (!stage || !target) {
        errors.push(`Invalid stage transition: ${currentStage} → ${nextStage}`);
        return { isValid: false, errors };
      }

      if (!target.allowedRoles.includes(userRole)) {
        errors.push(`Role '${userRole}' not authorized for stage '${nextStage}'`);
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating transition:', error);
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed']
      };
    }
  }

  /**
   * Get available modules (hardcoded as per your service)
   */
  async getAvailableModules(): Promise<string[]> {
    return ['opportunities', 'quotes', 'customers', 'jobs', 'inventory', 'projects', 'tasks'];
  }

  /**
   * Get available roles
   */
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

  /**
   * Get active blueprints only
   */
  async getActiveBlueprints(): Promise<Blueprint[]> {
    try {
      const blueprints = await this.getBlueprints();
      return blueprints.filter(bp => bp.isActive === true);
    } catch (error) {
      console.error('Error fetching active blueprints:', error);
      throw error;
    }
  }
}

export const blueprintsService = new BlueprintsService();