import { apiClient } from '@/lib/api/client';
import { handleUnauthorizedRedirect } from '@/lib/auth/unauthorized';

export type PackageType = 'work_order' | 'sales_order';
export type WorkOrderStage = 'quote' | 'waiver' | 'jobcard' | 'prechecklist' | 'postchecklist' | 'invoice';
export type SalesOrderStage = 'quote' | 'invoice';

export interface StageDocument {
  _id: string;
  quoteNumber?: string;
  workOrderNumber?: string;
  salesOrderNumber?: string;
  invoiceNumber?: string;
  status?: string;
  [key: string]: any;
}

export interface LifecycleStage {
  stage: string;
  completed: boolean;
  document: StageDocument | null;
  required: boolean;
  canTransition?: boolean;
  label?: string;
  description?: string;
}

export interface StageHistoryItem {
  stage: string;
  date: string | Date;
  triggeredBy: string;
  metadata?: Record<string, any>;
}

export interface WorkOrderInfo {
  _id: string;
  workOrderNumber: string;
  status: string;
  [key: string]: any;
}

export interface SalesOrderInfo {
  _id: string;
  salesOrderNumber: string;
  status: string;
  [key: string]: any;
}

export interface InitializeLifecycleDto {
  packageType: PackageType;
}

export interface TransitionMetadata {
  type?: string;
  reason?: string;
  jobTitle?: string;
  jobDescription?: string;
  inspectionItems?: string[];
  [key: string]: any;
}

export interface TransitionDto {
  metadata?: TransitionMetadata;
}

export interface StageTransitionDto {
  metadata?: TransitionMetadata;
}

export interface WorkflowStage {
  stage: string;
  label: string;
  description: string;
}

export interface WorkflowDefinition {
  packageType: PackageType;
  stages: WorkflowStage[];
}

export interface LifecycleStatus {
  opportunityId: string;
  packageType: PackageType;
  currentStage: string;
  stages: LifecycleStage[];
  stageHistory: StageHistoryItem[];
  workOrder: WorkOrderInfo | null;
  salesOrder: SalesOrderInfo | null;
}

export interface TransitionResult {
  _id: string;
  packageType: PackageType;
  currentStage: string;
  previousStage?: string;
  stageHistory: Array<{
    stage: string;
    date: string | Date;
  }>;
}

export interface InitializeResult {
  _id: string;
  packageType: PackageType;
  currentStage: string;
  stages: Array<{
    stage: string;
    completed: boolean;
    document: StageDocument | null;
  }>;
}

// Extended ApiClient for lifecycle service
class ExtendedApiClient {
  private getApiBaseUrl(): string {
    if ((apiClient as any).API_BASE_URL) {
      return (apiClient as any).API_BASE_URL;
    }
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
        handleUnauthorizedRedirect();
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

class LifecycleService {
  // 1. Initialize lifecycle for an opportunity
  async initializeOpportunity(
    opportunityId: string,
    data: InitializeLifecycleDto
  ): Promise<InitializeResult> {
    try {
      return await extendedApiClient.post<InitializeLifecycleDto, InitializeResult>(
        `/lifecycle/opportunity/${opportunityId}/initialize`,
        data
      );
    } catch (error) {
      console.error(`Error initializing lifecycle for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // 2. Transition opportunity to next stage
  async transitionToNextStage(
    opportunityId: string,
    data?: TransitionDto
  ): Promise<TransitionResult> {
    try {
      return await extendedApiClient.post<TransitionDto, TransitionResult>(
        `/lifecycle/opportunity/${opportunityId}/transition`,
        data || {}
      );
    } catch (error) {
      console.error(`Error transitioning opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // 3. Get opportunity lifecycle status
  async getOpportunityLifecycle(opportunityId: string): Promise<LifecycleStatus> {
    try {
      return await extendedApiClient.get<LifecycleStatus>(
        `/lifecycle/opportunity/${opportunityId}`
      );
    } catch (error) {
      console.error(`Error getting lifecycle for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  // 4. Get current opportunity stage and next available stages
  async getOpportunityStatus(opportunityId: string): Promise<LifecycleStatus> {
    try {
      return await extendedApiClient.get<LifecycleStatus>(
        `/lifecycle/opportunity/${opportunityId}/status`
      );
    } catch (error) {
      console.error(`Error getting status for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async transition(opportunityId: string, metadata?: any): Promise<any> {
    try {
      return await this.transitionToNextStage(opportunityId, {
        metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error transitioning:', error);
      throw error;
    }
  }

  // 5. Manually transition to a specific stage
  async transitionToStage(
    opportunityId: string,
    stage: string,
    data?: StageTransitionDto
  ): Promise<TransitionResult> {
    try {
      return await extendedApiClient.post<StageTransitionDto, TransitionResult>(
        `/lifecycle/opportunity/${opportunityId}/stage/${stage}`,
        data || {}
      );
    } catch (error) {
      console.error(`Error transitioning opportunity ${opportunityId} to stage ${stage}:`, error);
      throw error;
    }
  }

  // 6. Get workflow stages for a package type
  async getWorkflowStages(packageType: PackageType): Promise<WorkflowDefinition> {
    try {
      return await extendedApiClient.get<WorkflowDefinition>(
        `/lifecycle/workflow/${packageType}`
      );
    } catch (error) {
      console.error(`Error getting workflow stages for package type ${packageType}:`, error);
      throw error;
    }
  }

  // Utility methods
  async initializeWorkOrder(opportunityId: string): Promise<any> {
    try {
      return await this.initializeOpportunity(opportunityId, {
        packageType: 'work_order'
      });
    } catch (error) {
      console.error('Error initializing work order lifecycle:', error);
      throw error;
    }
  }

  async initializeSalesOrder(opportunityId: string): Promise<InitializeResult> {
    try {
      return await this.initializeOpportunity(opportunityId, {
        packageType: 'sales_order'
      });
    } catch (error) {
      console.error(`Error initializing sales order for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getWorkOrderStages(): Promise<WorkflowDefinition> {
    try {
      return await this.getWorkflowStages('work_order');
    } catch (error) {
      console.error('Error getting work order stages:', error);
      throw error;
    }
  }

  async getSalesOrderStages(): Promise<WorkflowDefinition> {
    try {
      return await this.getWorkflowStages('sales_order');
    } catch (error) {
      console.error('Error getting sales order stages:', error);
      throw error;
    }
  }

  async getNextAvailableStages(opportunityId: string): Promise<LifecycleStage[]> {
    try {
      const status = await this.getOpportunityStatus(opportunityId);
      return status.stages.filter(stage => stage.canTransition);
    } catch (error) {
      console.error(`Error getting next available stages for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getCompletedStages(opportunityId: string): Promise<LifecycleStage[]> {
    try {
      const lifecycle = await this.getOpportunityLifecycle(opportunityId);
      return lifecycle.stages.filter(stage => stage.completed);
    } catch (error) {
      console.error(`Error getting completed stages for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getPendingStages(opportunityId: string): Promise<LifecycleStage[]> {
    try {
      const lifecycle = await this.getOpportunityLifecycle(opportunityId);
      return lifecycle.stages.filter(stage => !stage.completed);
    } catch (error) {
      console.error(`Error getting pending stages for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getCurrentStageInfo(opportunityId: string): Promise<{
    currentStage: string;
    currentDocument: StageDocument | null;
    nextStage: string | null;
    progress: number;
  }> {
    try {
      const lifecycle = await this.getOpportunityLifecycle(opportunityId);
      const currentStage = lifecycle.currentStage;
      const currentStageInfo = lifecycle.stages.find(stage => stage.stage === currentStage);
      
      let nextStage: string | null = null;
      const stages = lifecycle.packageType === 'work_order' 
        ? ['quote', 'waiver', 'jobcard', 'prechecklist', 'postchecklist', 'invoice']
        : ['quote', 'invoice'];
      
      const currentIndex = stages.indexOf(currentStage);
      if (currentIndex < stages.length - 1) {
        nextStage = stages[currentIndex + 1];
      }
      
      const completedCount = lifecycle.stages.filter(stage => stage.completed).length;
      const progress = lifecycle.stages.length > 0 
        ? (completedCount / lifecycle.stages.length) * 100 
        : 0;
      
      return {
        currentStage,
        currentDocument: currentStageInfo?.document || null,
        nextStage,
        progress: parseFloat(progress.toFixed(2))
      };
    } catch (error) {
      console.error(`Error getting current stage info for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getCurrentStage(opportunityId: string): Promise<string> {
    try {
      const status = await this.getOpportunityLifecycle(opportunityId);
      return status.currentStage;
    } catch (error) {
      console.error('Error getting current stage:', error);
      throw error;
    }
  }

  async canTransition(opportunityId: string): Promise<boolean> {
    try {
      const status = await this.getOpportunityStatus(opportunityId);
      return status.stages.some(stage => stage.canTransition);
    } catch (error) {
      console.error('Error checking transition:', error);
      throw error;
    }
  }

  async canTransitionToNextStage(opportunityId: string): Promise<boolean> {
    try {
      const status = await this.getOpportunityStatus(opportunityId);
      return status.stages.some(stage => stage.canTransition === true);
    } catch (error) {
      console.error(`Error checking if can transition for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getStageProgress(opportunityId: string, stage: string): Promise<{
    isCurrent: boolean;
    isCompleted: boolean;
    canTransition: boolean;
    document: StageDocument | null;
  }> {
    try {
      const status = await this.getOpportunityStatus(opportunityId);
      const stageInfo = status.stages.find(s => s.stage === stage);
      
      if (!stageInfo) {
        throw new Error(`Stage ${stage} not found in lifecycle`);
      }
      
      return {
        isCurrent: status.currentStage === stage,
        isCompleted: stageInfo.completed,
        canTransition: stageInfo.canTransition || false,
        document: stageInfo.document
      };
    } catch (error) {
      console.error(`Error getting progress for stage ${stage} in opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async completeLifecycle(opportunityId: string, options?: any): Promise<any> {
    try {
      return await extendedApiClient.post<any, any>(
        `/lifecycle/opportunity/${opportunityId}/complete`,
        options || {}
      );
    } catch (error) {
      console.error(`Error completing lifecycle for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async transitionWithWaiver(
    opportunityId: string,
    waiverData: {
      type: string;
      reason: string;
      notes?: string;
    }
  ): Promise<TransitionResult> {
    try {
      return await this.transitionToNextStage(opportunityId, {
        metadata: {
          type: waiverData.type,
          reason: waiverData.reason,
          jobTitle: waiverData.reason,
          ...(waiverData.notes && { notes: waiverData.notes })
        }
      });
    } catch (error) {
      console.error(`Error transitioning with waiver for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async transitionWithJobCard(
    opportunityId: string,
    jobCardData: {
      jobTitle: string;
      jobDescription?: string;
      estimatedHours?: number;
      priority?: string;
    }
  ): Promise<TransitionResult> {
    try {
      return await this.transitionToNextStage(opportunityId, {
        metadata: {
          jobTitle: jobCardData.jobTitle,
          ...(jobCardData.jobDescription && { jobDescription: jobCardData.jobDescription }),
          ...(jobCardData.estimatedHours && { estimatedHours: jobCardData.estimatedHours }),
          ...(jobCardData.priority && { priority: jobCardData.priority })
        }
      });
    } catch (error) {
      console.error(`Error transitioning with job card for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async transitionWithChecklist(
    opportunityId: string,
    checklistData: {
      checklistType: 'prechecklist' | 'postchecklist';
      inspectionItems: string[];
      notes?: string;
      inspectedBy?: string;
    }
  ): Promise<TransitionResult> {
    try {
      return await this.transitionToNextStage(opportunityId, {
        metadata: {
          inspectionItems: checklistData.inspectionItems,
          ...(checklistData.notes && { notes: checklistData.notes }),
          ...(checklistData.inspectedBy && { inspectedBy: checklistData.inspectedBy })
        }
      });
    } catch (error) {
      console.error(`Error transitioning with ${checklistData.checklistType} for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async transitionToInvoice(
    opportunityId: string,
    invoiceData?: {
      paymentTerms?: string;
      dueDate?: string;
      notes?: string;
    }
  ): Promise<TransitionResult> {
    try {
      const currentInfo = await this.getCurrentStageInfo(opportunityId);
      
      if (currentInfo.nextStage !== 'invoice') {
        throw new Error('Cannot transition to invoice from current stage');
      }
      
      return await this.transitionToNextStage(opportunityId, {
        metadata: {
          ...(invoiceData?.paymentTerms && { paymentTerms: invoiceData.paymentTerms }),
          ...(invoiceData?.dueDate && { dueDate: invoiceData.dueDate }),
          ...(invoiceData?.notes && { notes: invoiceData.notes })
        }
      });
    } catch (error) {
      console.error(`Error transitioning to invoice for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async fastForwardToStage(
    opportunityId: string,
    targetStage: string,
    metadata?: TransitionMetadata
  ): Promise<TransitionResult> {
    try {
      const currentStatus = await this.getOpportunityStatus(opportunityId);
      const stages = currentStatus.packageType === 'work_order'
        ? ['quote', 'waiver', 'jobcard', 'prechecklist', 'postchecklist', 'invoice']
        : ['quote', 'invoice'];
      
      const currentIndex = stages.indexOf(currentStatus.currentStage);
      const targetIndex = stages.indexOf(targetStage);
      
      if (targetIndex < currentIndex) {
        throw new Error('Cannot fast forward to previous stage');
      }
      
      if (targetIndex === -1) {
        throw new Error(`Invalid target stage: ${targetStage}`);
      }
      
      // Transition through each stage
      let result: TransitionResult | null = null;
      for (let i = currentIndex; i < targetIndex; i++) {
        result = await this.transitionToNextStage(opportunityId, {
          metadata: i === targetIndex - 1 ? metadata : undefined
        });
      }
      
      if (!result) {
        throw new Error('Failed to fast forward to target stage');
      }
      
      return result;
    } catch (error) {
      console.error(`Error fast forwarding opportunity ${opportunityId} to stage ${targetStage}:`, error);
      throw error;
    }
  }

  async getLifecycleTimeline(opportunityId: string): Promise<Array<{
    stage: string;
    date: string | Date;
    user: string;
    metadata?: Record<string, any>;
    durationFromPrevious?: number; // in hours
  }>> {
    try {
      const lifecycle = await this.getOpportunityLifecycle(opportunityId);
      const timeline = [];
      
      for (let i = 0; i < lifecycle.stageHistory.length; i++) {
        const historyItem = lifecycle.stageHistory[i];
        const previousItem = i > 0 ? lifecycle.stageHistory[i - 1] : null;
        
        let durationFromPrevious: number | undefined;
        if (previousItem) {
          const currentDate = new Date(historyItem.date);
          const previousDate = new Date(previousItem.date);
          durationFromPrevious = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60); // hours
        }
        
        timeline.push({
          stage: historyItem.stage,
          date: historyItem.date,
          user: historyItem.triggeredBy,
          metadata: historyItem.metadata,
          durationFromPrevious: durationFromPrevious ? parseFloat(durationFromPrevious.toFixed(2)) : undefined
        });
      }
      
      return timeline;
    } catch (error) {
      console.error(`Error getting timeline for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async getLifecycleDuration(opportunityId: string): Promise<{
    totalDuration: number; // in hours
    averageStageDuration: number; // in hours
    currentStageDuration: number; // in hours
    stages: Array<{
      stage: string;
      duration: number; // in hours
      completed: boolean;
    }>;
  }> {
    try {
      const timeline = await this.getLifecycleTimeline(opportunityId);
      
      if (timeline.length < 2) {
        return {
          totalDuration: 0,
          averageStageDuration: 0,
          currentStageDuration: 0,
          stages: []
        };
      }
      
      const firstDate = new Date(timeline[0].date);
      const lastDate = new Date(timeline[timeline.length - 1].date);
      const totalDuration = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60); // hours
      
      const stages: Array<{
        stage: string;
        duration: number;
        completed: boolean;
      }> = [];
      
      for (let i = 1; i < timeline.length; i++) {
        const stage = timeline[i - 1].stage;
        const duration = timeline[i].durationFromPrevious || 0;
        stages.push({
          stage,
          duration: parseFloat(duration.toFixed(2)),
          completed: true
        });
      }
      
      // Add current stage duration
      const currentStatus = await this.getOpportunityLifecycle(opportunityId);
      const lastTransition = timeline[timeline.length - 1];
      const currentStageStart = new Date(lastTransition.date);
      const now = new Date();
      const currentStageDuration = (now.getTime() - currentStageStart.getTime()) / (1000 * 60 * 60);
      
      stages.push({
        stage: currentStatus.currentStage,
        duration: parseFloat(currentStageDuration.toFixed(2)),
        completed: false
      });
      
      const completedStages = stages.filter(stage => stage.completed);
      const averageStageDuration = completedStages.length > 0
        ? completedStages.reduce((sum, stage) => sum + stage.duration, 0) / completedStages.length
        : 0;
      
      return {
        totalDuration: parseFloat(totalDuration.toFixed(2)),
        averageStageDuration: parseFloat(averageStageDuration.toFixed(2)),
        currentStageDuration: parseFloat(currentStageDuration.toFixed(2)),
        stages
      };
    } catch (error) {
      console.error(`Error getting lifecycle duration for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async validateOpportunityForTransition(opportunityId: string): Promise<{
    isValid: boolean;
    missingRequirements: string[];
    warnings: string[];
  }> {
    try {
      const lifecycle = await this.getOpportunityLifecycle(opportunityId);
      const currentStageInfo = await this.getCurrentStageInfo(opportunityId);
      
      const missingRequirements: string[] = [];
      const warnings: string[] = [];
      
      // Check current stage requirements
      const currentStage = lifecycle.stages.find(stage => stage.stage === lifecycle.currentStage);
      if (currentStage && currentStage.required && !currentStage.completed) {
        missingRequirements.push(`Current stage "${lifecycle.currentStage}" is not completed`);
      }
      
      // Check if opportunity has required fields based on package type
      if (lifecycle.packageType === 'work_order' && !lifecycle.workOrder) {
        missingRequirements.push('Work order is not created');
      }
      
      if (lifecycle.packageType === 'sales_order' && !lifecycle.salesOrder) {
        missingRequirements.push('Sales order is not created');
      }
      
      // Check if next stage is available
      if (!currentStageInfo.nextStage) {
        warnings.push('Opportunity is at the final stage');
      }
      
      return {
        isValid: missingRequirements.length === 0,
        missingRequirements,
        warnings
      };
    } catch (error) {
      console.error(`Error validating opportunity ${opportunityId} for transition:`, error);
      throw error;
    }
  }

  async getLifecycleSummary(opportunityId: string): Promise<{
    opportunityId: string;
    packageType: PackageType;
    currentStage: string;
    progress: number;
    nextStage: string | null;
    isComplete: boolean;
    totalStages: number;
    completedStages: number;
    estimatedCompletion?: Date;
  }> {
    try {
      const [lifecycle, currentInfo, duration] = await Promise.all([
        this.getOpportunityLifecycle(opportunityId),
        this.getCurrentStageInfo(opportunityId),
        this.getLifecycleDuration(opportunityId)
      ]);
      
      const totalStages = lifecycle.stages.length;
      const completedStages = lifecycle.stages.filter(stage => stage.completed).length;
      const progress = (completedStages / totalStages) * 100;
      const isComplete = lifecycle.currentStage === lifecycle.stages[lifecycle.stages.length - 1].stage;
      
      let estimatedCompletion: Date | undefined;
      if (!isComplete && duration.averageStageDuration > 0) {
        const remainingStages = totalStages - completedStages;
        const estimatedHours = remainingStages * duration.averageStageDuration;
        const completionDate = new Date();
        completionDate.setHours(completionDate.getHours() + estimatedHours);
        estimatedCompletion = completionDate;
      }
      
      return {
        opportunityId,
        packageType: lifecycle.packageType,
        currentStage: lifecycle.currentStage,
        progress: parseFloat(progress.toFixed(2)),
        nextStage: currentInfo.nextStage,
        isComplete,
        totalStages,
        completedStages,
        estimatedCompletion
      };
    } catch (error) {
      console.error(`Error getting lifecycle summary for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async exportLifecycleReport(
    opportunityId: string,
    format: 'csv' | 'json' = 'json'
  ): Promise<string> {
    try {
      const [summary, timeline, duration] = await Promise.all([
        this.getLifecycleSummary(opportunityId),
        this.getLifecycleTimeline(opportunityId),
        this.getLifecycleDuration(opportunityId)
      ]);
      
      const report = {
        summary,
        timeline,
        duration,
        timestamp: new Date().toISOString()
      };
      
      if (format === 'csv') {
        // Simple CSV export for timeline
        const timelineHeaders = ['Stage', 'Date', 'User', 'Duration From Previous (hours)'];
        const timelineRows = timeline.map(item => [
          item.stage,
          new Date(item.date).toLocaleString(),
          item.user,
          item.durationFromPrevious || 'N/A'
        ]);
        
        const timelineCSV = [
          'Lifecycle Timeline',
          timelineHeaders.join(','),
          ...timelineRows.map(row => row.join(','))
        ].join('\n');
        
        const durationHeaders = ['Stage', 'Duration (hours)', 'Completed'];
        const durationRows = duration.stages.map(stage => [
          stage.stage,
          stage.duration,
          stage.completed ? 'Yes' : 'No'
        ]);
        
        const durationCSV = [
          '\nStage Durations',
          durationHeaders.join(','),
          ...durationRows.map(row => row.join(','))
        ].join('\n');
        
        return timelineCSV + durationCSV;
      } else {
        return JSON.stringify(report, null, 2);
      }
    } catch (error) {
      console.error(`Error exporting lifecycle report for opportunity ${opportunityId}:`, error);
      throw error;
    }
  }

  async bulkInitializeOpportunities(
    opportunityIds: string[],
    packageType: PackageType
  ): Promise<Array<{
    opportunityId: string;
    success: boolean;
    result?: InitializeResult;
    error?: string;
  }>> {
    try {
      const results = [];
      
      for (const opportunityId of opportunityIds) {
        try {
          const result = await this.initializeOpportunity(opportunityId, { packageType });
          results.push({
            opportunityId,
            success: true,
            result
          });
        } catch (error: any) {
          results.push({
            opportunityId,
            success: false,
            error: error.message || 'Unknown error'
          });
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    } catch (error) {
      console.error('Error bulk initializing opportunities:', error);
      throw error;
    }
  }
}

export const lifecycleService = new LifecycleService();
