import { apiClient } from '@/lib/api/client';

export interface WorkflowAction {
  actionType: string;
  params: Record<string, any>;
  executionOrder?: number;
  delayInMinutes?: number;
}

export interface ScheduleConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  customCron?: string;
}

export interface AdditionalCriteria {
  timeRange?: {
    from: string;
    to: string;
  };
  userCriteria?: {
    roles?: string[];
    departments?: string[];
  };
  fieldCriteria?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

export interface Workflow {
  _id: string;
  id: string;
  name: string;
  module: 'opportunities' | 'quotes' | 'invoices' | 'payments' | 'leads' | 'accounts' | 'contacts';
  triggerEvent: 'onCreate' | 'onUpdate' | 'onDelete' | 'scheduled' | 'fieldUpdate' | 'stageChange';
  conditions?: Record<string, any>;
  actions: WorkflowAction[];
  createdBy?: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  active: boolean;
  isScheduled: boolean;
  scheduleConfig?: ScheduleConfig;
  nextExecution?: Date | string;
  lastExecution?: Date | string;
  executionFrequency: 'immediate' | 'once' | 'every_time' | 'once_in_24_hours';
  additionalCriteria?: AdditionalCriteria;
  executionCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateWorkflowDto {
  name: string;
  module: 'opportunities' | 'quotes' | 'invoices' | 'payments' | 'leads' | 'accounts' | 'contacts';
  triggerEvent: 'onCreate' | 'onUpdate' | 'onDelete' | 'scheduled' | 'fieldUpdate' | 'stageChange';
  conditions?: Record<string, any>;
  actions: WorkflowAction[];
  isScheduled?: boolean;
  scheduleConfig?: ScheduleConfig;
  executionFrequency?: 'immediate' | 'once' | 'every_time' | 'once_in_24_hours';
  additionalCriteria?: AdditionalCriteria;
  active?: boolean;
}

export interface UpdateWorkflowDto {
  name?: string;
  module?: 'opportunities' | 'quotes' | 'invoices' | 'payments' | 'leads' | 'accounts' | 'contacts';
  triggerEvent?: 'onCreate' | 'onUpdate' | 'onDelete' | 'scheduled' | 'fieldUpdate' | 'stageChange';
  conditions?: Record<string, any>;
  actions?: WorkflowAction[];
  isScheduled?: boolean;
  scheduleConfig?: ScheduleConfig;
  executionFrequency?: 'immediate' | 'once' | 'every_time' | 'once_in_24_hours';
  additionalCriteria?: AdditionalCriteria;
  active?: boolean;
}

export interface WorkflowExecutionHistory {
  workflowId: string;
  recordId: string;
  timestamp: Date;
  triggerEvent?: string;
  module?: string;
  executionResult?: 'success' | 'failure';
  errorMessage?: string;
  actionsExecuted?: number;
}

export interface TestWorkflowResult {
  workflowId: string;
  workflowName: string;
  conditionsMatch: boolean;
  actions: Array<{
    actionType: string;
    params: Record<string, any>;
    wouldExecute: boolean;
    delayInMinutes: number;
  }>;
  testPayload: any;
  evaluatedAt: Date;
}

export interface WorkflowExecutionResult {
  success: boolean;
  message: string;
  workflowName?: string;
  executedActions?: number;
  timestamp?: Date;
}

export interface FilterWorkflowsParams {
  module?: string;
  active?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  triggerEvent?: string;
  isScheduled?: boolean;
}

export interface PaginatedWorkflows {
  data: Workflow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Extended ApiClient for workflow service
class ExtendedApiClient {
  private getApiBaseUrl(): string {
    // Try to access API_BASE_URL from apiClient
    if ((apiClient as any).API_BASE_URL) {
      return (apiClient as any).API_BASE_URL;
    }
    // Fallback to config import if available
    try {
      const config = require('@/lib/api/config');
      return config.API_BASE_URL || '';
    } catch {
      return '';
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = sessionStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async requestWithHeaders<T>(
    endpoint: string, 
    options: RequestInit = {},
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
      ...customHeaders,
    };

    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      if (response.status === 401) {
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
      
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    return this.requestWithHeaders<T>(url, { method: 'GET' }, headers);
  }

  async post<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, headers);
  }

  async put<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, headers);
  }

  async patch<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'DELETE',
    }, headers);
  }
}

const extendedApiClient = new ExtendedApiClient();

class WorkflowService {
  // 1. Test automation engine
  async testAutomationEngine(): Promise<any> {
    try {
      return await extendedApiClient.post<any, any>('/workflows/test/automation', {});
    } catch (error) {
      console.error('Error testing automation engine:', error);
      throw error;
    }
  }

  // 2. Create a new workflow
  async createWorkflow(data: CreateWorkflowDto, userId?: string): Promise<Workflow> {
    try {
      const headers: Record<string, string> = {};
      
      if (userId) {
        headers['X-User-Id'] = userId;
      }
      
      const response = await extendedApiClient.post<CreateWorkflowDto, any>('/workflows', data, headers);

      let workflowData;
        if (response.data) {
            workflowData = response.data; // Pattern A
        } else if (response.workflow) {
            workflowData = response.workflow; // Pattern B
        } else {
            workflowData = response; // Pattern C
        }
        
        // 3. ENSURE THE ID FIELD IS POPULATED
        // Some backends use _id, others use id
        if (!workflowData.id && workflowData._id) {
            workflowData.id = workflowData._id;
        }
        return workflowData;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  // 3. Get all workflows
  async getAllWorkflows(params?: FilterWorkflowsParams): Promise<PaginatedWorkflows> {
    try {
      const queryParams: Record<string, string> = {};
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams[key] = value.toString();
          }
        });
      }
      const result = await extendedApiClient.get<any>('/workflows', queryParams);
      
      // Check if the response is an array (direct workflow list)
      let workflows: Workflow[] = [];
      let pagination = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      };
      
      if (Array.isArray(result)) {
        // Response is an array of workflows
        workflows = result;
        pagination.total = result.length;
      } else if (result && result.data && Array.isArray(result.data)) {
        // Response has the expected PaginatedWorkflows structure
        workflows = result.data;
        pagination = result.pagination || pagination;
      } else if (result && Array.isArray(result.items)) {
        // Alternative structure: { items: [], total: number }
        workflows = result.items;
        pagination.total = result.total || result.items.length;
      } else {
        console.warn('Unexpected API response format:', result);
        workflows = [];
      }
      
      const response = {
        data: workflows,
        pagination: pagination
      };
      return response;
      
    } catch (error) {
      console.error('Error getting all workflows:', error);
      
      // Return empty structure on error
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      };
    }
  }

  // 4. Get a workflow by ID
  async getWorkflowById(id: string): Promise<Workflow> {
    try {
        
        // Make the API call
        const response = await extendedApiClient.get<any>(`/workflows/${id}`);
        
        let workflowData;
        if (response.data) {
            workflowData = response.data; // Pattern A
        } else if (response.workflow) {
            workflowData = response.workflow; // Pattern B
        } else if (response._id || response.id) {
            workflowData = response; // Pattern C
        } else {
            // If no workflow data found in expected structures
            console.error('No workflow data found in response:', response);
            throw new Error('Workflow not found in response');
        }
        if (!workflowData.id && workflowData._id) {
            workflowData.id = workflowData._id;
        }
        
        // 4. VALIDATE THE WORKFLOW OBJECT
        if (!workflowData.id) {
            console.error('Workflow data missing ID:', workflowData);
            throw new Error('Invalid workflow data: missing ID');
        }
        return workflowData;
        
    } catch (error) {
        console.error(`Error getting workflow ${id}:`, error)        
        throw error;
    }
  }

  // 5. Update a workflow
  async updateWorkflow(id: string, data: UpdateWorkflowDto): Promise<Workflow> {
    try {
      return await extendedApiClient.patch<UpdateWorkflowDto, Workflow>(`/workflows/${id}`, data);
    } catch (error) {
      console.error(`Error updating workflow ${id}:`, error);
      throw error;
    }
  }

  // 6. Delete a workflow
  async deleteWorkflow(id: string): Promise<{ message: string }> {
    try {
      return await extendedApiClient.delete<{ message: string }>(`/workflows/${id}`);
    } catch (error) {
      console.error(`Error deleting workflow ${id}:`, error);
      throw error;
    }
  }

  // 7. Execute a workflow immediately
  async executeWorkflow(id: string, payload?: any): Promise<WorkflowExecutionResult> {
    try {
      const requestData = payload || {};
      return await extendedApiClient.post<any, WorkflowExecutionResult>(`/workflows/${id}/execute`, requestData);
    } catch (error) {
      console.error(`Error executing workflow ${id}:`, error);
      throw error;
    }
  }

  // 8. Test workflow conditions without executing
  async testWorkflow(id: string, testPayload: any): Promise<TestWorkflowResult> {
    try {
      return await extendedApiClient.post<any, TestWorkflowResult>(`/workflows/${id}/test`, testPayload);
    } catch (error) {
      console.error(`Error testing workflow ${id}:`, error);
      throw error;
    }
  }

  // 9. Get workflow execution history
  async getWorkflowHistory(id: string, limit: number = 50): Promise<WorkflowExecutionHistory[]> {
    try {
      const queryParams: Record<string, string> = {};
      if (limit) {
        queryParams.limit = limit.toString();
      }
      
      return await extendedApiClient.get<WorkflowExecutionHistory[]>(`/workflows/${id}/history`, queryParams);
    } catch (error) {
      console.error(`Error getting history for workflow ${id}:`, error);
      throw error;
    }
  }

  // 10. Toggle workflow active status
  async toggleWorkflowStatus(id: string): Promise<Workflow> {
    try {
      return await extendedApiClient.post<any, Workflow>(`/workflows/${id}/toggle`, {});
    } catch (error) {
      console.error(`Error toggling workflow ${id}:`, error);
      throw error;
    }
  }

  // 11. Get workflows by module
  async getWorkflowsByModule(module: string): Promise<Workflow[]> {
    try {
      return await extendedApiClient.get<Workflow[]>(`/workflows/module/${module}`);
    } catch (error) {
      console.error(`Error getting workflows for module ${module}:`, error);
      throw error;
    }
  }

  // 12. Get workflows by trigger event
  async getWorkflowsByTriggerEvent(triggerEvent: string): Promise<Workflow[]> {
    try {
      return await extendedApiClient.get<Workflow[]>(`/workflows/trigger/${triggerEvent}`);
    } catch (error) {
      console.error(`Error getting workflows for trigger event ${triggerEvent}:`, error);
      throw error;
    }
  }

  // Utility methods for specific workflow types
  async getActiveWorkflows(): Promise<Workflow[]> {
    const result = await this.getAllWorkflows({ active: true });
    return result.data;
  }

  async getScheduledWorkflows(): Promise<Workflow[]> {
    const result = await this.getAllWorkflows({ isScheduled: true });
    return result.data;
  }

  async getModuleWorkflows(module: string, activeOnly: boolean = true): Promise<Workflow[]> {
    const params: FilterWorkflowsParams = { module };
    if (activeOnly) {
      params.active = true;
    }
    const result = await this.getAllWorkflows(params);
    return result.data;
  }

  // Get opportunities module workflows
  async getOpportunitiesWorkflows(): Promise<Workflow[]> {
    return this.getModuleWorkflows('opportunities');
  }

  // Get quotes module workflows
  async getQuotesWorkflows(): Promise<Workflow[]> {
    return this.getModuleWorkflows('quotes');
  }

  // Get invoices module workflows
  async getInvoicesWorkflows(): Promise<Workflow[]> {
    return this.getModuleWorkflows('invoices');
  }

  // Get leads module workflows
  async getLeadsWorkflows(): Promise<Workflow[]> {
    return this.getModuleWorkflows('leads');
  }

  // Get onCreate trigger workflows
  async getOnCreateWorkflows(module?: string): Promise<Workflow[]> {
    if (module) {
      const workflows = await this.getModuleWorkflows(module);
      return workflows.filter(w => w.triggerEvent === 'onCreate');
    }
    return this.getWorkflowsByTriggerEvent('onCreate');
  }

  // Get onUpdate trigger workflows
  async getOnUpdateWorkflows(module?: string): Promise<Workflow[]> {
    if (module) {
      const workflows = await this.getModuleWorkflows(module);
      return workflows.filter(w => w.triggerEvent === 'onUpdate');
    }
    return this.getWorkflowsByTriggerEvent('onUpdate');
  }

  // Get onDelete trigger workflows
  async getOnDeleteWorkflows(module?: string): Promise<Workflow[]> {
    if (module) {
      const workflows = await this.getModuleWorkflows(module);
      return workflows.filter(w => w.triggerEvent === 'onDelete');
    }
    return this.getWorkflowsByTriggerEvent('onDelete');
  }

  // Get scheduled trigger workflows
  async getScheduledTriggerWorkflows(): Promise<Workflow[]> {
    return this.getWorkflowsByTriggerEvent('scheduled');
  }

  // Activate a workflow
  async activateWorkflow(id: string): Promise<Workflow> {
    try {
      // First check if it's already active
      const workflow = await this.getWorkflowById(id);
      if (!workflow.active) {
        return this.toggleWorkflowStatus(id);
      }
      return workflow;
    } catch (error) {
      console.error(`Error activating workflow ${id}:`, error);
      throw error;
    }
  }

  // Deactivate a workflow
  async deactivateWorkflow(id: string): Promise<Workflow> {
    try {
      // First check if it's already inactive
      const workflow = await this.getWorkflowById(id);
      if (workflow.active) {
        return this.toggleWorkflowStatus(id);
      }
      return workflow;
    } catch (error) {
      console.error(`Error deactivating workflow ${id}:`, error);
      throw error;
    }
  }

  // Execute workflow for specific record
  async executeWorkflowForRecord(workflowId: string, recordId: string, recordData: any, userId?: string): Promise<WorkflowExecutionResult> {
    try {
      const payload = {
        recordId,
        ...recordData,
        userId,
        executionType: 'manual',
        timestamp: new Date().toISOString()
      };
      
      return await this.executeWorkflow(workflowId, payload);
    } catch (error) {
      console.error(`Error executing workflow ${workflowId} for record ${recordId}:`, error);
      throw error;
    }
  }

  // Test workflow with sample data
  async testWorkflowWithSampleData(workflowId: string, module: string): Promise<TestWorkflowResult> {
    try {
      // Create sample payload based on module
      let samplePayload: any = {
        _id: 'test_' + Date.now(),
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      switch (module) {
        case 'opportunities':
          samplePayload = {
            ...samplePayload,
            type: 'individual',
            subject: 'Test Opportunity',
            customer: { name: 'Test Customer', email: 'test@example.com' },
            leadScore: { totalScore: 75, tier: 'hot' }
          };
          break;
        case 'quotes':
          samplePayload = {
            ...samplePayload,
            quoteNumber: 'QT-TEST-001',
            totalAmount: 10000,
            customerName: 'Test Customer'
          };
          break;
        case 'invoices':
          samplePayload = {
            ...samplePayload,
            invoiceNumber: 'INV-TEST-001',
            amount: 15000,
            status: 'pending'
          };
          break;
        case 'leads':
          samplePayload = {
            ...samplePayload,
            name: 'Test Lead',
            email: 'lead@example.com',
            phone: '+1234567890',
            status: 'new'
          };
          break;
      }

      return await this.testWorkflow(workflowId, samplePayload);
    } catch (error) {
      console.error(`Error testing workflow ${workflowId} with sample data:`, error);
      throw error;
    }
  }

  // Get upcoming scheduled executions
  async getUpcomingExecutions(): Promise<Array<{ workflow: Workflow; nextExecution: Date }>> {
    try {
      const workflows = await this.getScheduledWorkflows();
      return workflows
        .filter(w => w.nextExecution && w.active)
        .map(w => ({
          workflow: w,
          nextExecution: new Date(w.nextExecution as string)
        }))
        .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime());
    } catch (error) {
      console.error('Error getting upcoming executions:', error);
      throw error;
    }
  }

  // Get workflow statistics
  async getWorkflowStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    scheduled: number;
    byModule: Record<string, number>;
    byTriggerEvent: Record<string, number>;
    totalExecutions: number;
  }> {
    try {
      const allWorkflows = await this.getAllWorkflows();
      const workflows = allWorkflows.data || [];
      
      const stats = {
        total: workflows.length,
        active: workflows.filter(w => w.active).length,
        inactive: workflows.filter(w => !w.active).length,
        scheduled: workflows.filter(w => w.isScheduled).length,
        byModule: {} as Record<string, number>,
        byTriggerEvent: {} as Record<string, number>,
        totalExecutions: workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0)
      };

      // Count by module
      workflows.forEach(w => {
        stats.byModule[w.module] = (stats.byModule[w.module] || 0) + 1;
      });

      // Count by trigger event
      workflows.forEach(w => {
        stats.byTriggerEvent[w.triggerEvent] = (stats.byTriggerEvent[w.triggerEvent] || 0) + 1;
      });
      return stats;
      
    } catch (error) {
      console.error('Error getting workflow stats:', error);
      
      // Return default stats on error
      return {
        total: 0,
        active: 0,
        inactive: 0,
        scheduled: 0,
        byModule: {},
        byTriggerEvent: {},
        totalExecutions: 0
      };
    }
  }

  // Clone a workflow
  async cloneWorkflow(id: string, newName?: string, userId?: string): Promise<Workflow> {
    try {
      const original = await this.getWorkflowById(id);
      
      const cloneData: CreateWorkflowDto = {
        name: newName || `${original.name} (Copy)`,
        module: original.module,
        triggerEvent: original.triggerEvent,
        conditions: original.conditions ? { ...original.conditions } : undefined,
        actions: original.actions.map(action => ({ ...action })),
        isScheduled: original.isScheduled,
        scheduleConfig: original.scheduleConfig ? { ...original.scheduleConfig } : undefined,
        executionFrequency: original.executionFrequency,
        additionalCriteria: original.additionalCriteria ? { ...original.additionalCriteria } : undefined,
        active: false // Keep cloned workflow inactive by default
      };

      return await this.createWorkflow(cloneData, userId);
    } catch (error) {
      console.error(`Error cloning workflow ${id}:`, error);
      throw error;
    }
  }

  // Bulk update workflow status
  async bulkUpdateStatus(workflowIds: string[], active: boolean): Promise<{ updated: number; failed: number }> {
    try {
      const results = await Promise.allSettled(
        workflowIds.map(id => 
          active ? this.activateWorkflow(id) : this.deactivateWorkflow(id)
        )
      );

      const updated = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { updated, failed };
    } catch (error) {
      console.error('Error in bulk update status:', error);
      throw error;
    }
  }

  // Search workflows by name
  async searchWorkflows(searchTerm: string, module?: string): Promise<Workflow[]> {
    try {
      const allWorkflows = await this.getAllWorkflows({ module });
      const searchLower = searchTerm.toLowerCase();
      
      return allWorkflows.data.filter(workflow =>
        workflow.name.toLowerCase().includes(searchLower) ||
        workflow._id.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching workflows:', error);
      throw error;
    }
  }

  // Get recently executed workflows
  async getRecentlyExecutedWorkflows(limit: number = 10): Promise<Array<{
    workflow: Workflow;
    lastExecution: Date;
    executionCount: number;
  }>> {
    try {
      const workflows = await this.getActiveWorkflows();
      
      return workflows
        .filter(w => w.lastExecution && w.executionCount > 0)
        .map(w => ({
          workflow: w,
          lastExecution: new Date(w.lastExecution as string),
          executionCount: w.executionCount || 0
        }))
        .sort((a, b) => b.lastExecution.getTime() - a.lastExecution.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recently executed workflows:', error);
      throw error;
    }
  }

  // Validate workflow configuration
  async validateWorkflowConfiguration(config: Partial<CreateWorkflowDto>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!config.name?.trim()) {
      errors.push('Workflow name is required');
    }

    if (!config.module) {
      errors.push('Module is required');
    }

    if (!config.triggerEvent) {
      errors.push('Trigger event is required');
    }

    if (!config.actions || config.actions.length === 0) {
      errors.push('At least one action is required');
    }

    // Action validation
    if (config.actions) {
      config.actions.forEach((action, index) => {
        if (!action.actionType?.trim()) {
          errors.push(`Action ${index + 1}: Action type is required`);
        }
        if (action.delayInMinutes && action.delayInMinutes < 0) {
          errors.push(`Action ${index + 1}: Delay cannot be negative`);
        }
      });
    }

    // Schedule validation
    if (config.isScheduled && config.scheduleConfig) {
      if (!config.scheduleConfig.type) {
        errors.push('Schedule type is required for scheduled workflows');
      }
      if (!config.scheduleConfig.time) {
        errors.push('Schedule time is required for scheduled workflows');
      }
    }

    // Condition validation warnings
    if (config.conditions && Object.keys(config.conditions).length === 0) {
      warnings.push('No conditions specified - workflow will execute on all triggers');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const workflowService = new WorkflowService();