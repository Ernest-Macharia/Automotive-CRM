// services/lifecycleIntegrationService.ts

import { lifecycleService, LifecycleStatus, LifecycleStage } from './lifecycleService';
import { workOrderService } from './workOrderService';
import { salesOrderService } from './salesOrderService';
import { quoteService } from './quoteService';
import { invoiceService } from './invoiceService';
import { jobCardService } from './jobCardService';
import { opportunityService } from './opportunityService';
import { preChecklistService, PreChecklist } from './preChecklistService';
import { postChecklistService } from './postChecklistService';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Define the correct workflow patterns
export const WORKFLOW_PATTERNS = {
  SALES_ORDER: ['quote', 'invoice'],
  WORK_ORDER: ['prechecklist', 'jobcard', 'postchecklist', 'invoice']
};

export interface WorkflowTransition {
  fromStage: string;
  toStage: string;
  opportunityId: string;
  documentId?: string;
  triggeredBy: string;
  metadata?: Record<string, any>;
}
export interface LifecycleStageUI {
  stage: string;
  label: string;
  description: string;
  completed: boolean;
  isCurrent: boolean;
  document: any;
  documentId: string;
  documentType: string;
  actions: Array<{
    label: string;
    action: string;
    color: string;
    description: string;
  }>;
  required?: boolean;
  skippable?: boolean;
  index: number;
  totalStages: number;
  canSkip?: boolean;
  mandatory?: boolean;
  completionDate?: string;
  completedAt?: string;
  requirements?: {
    requiresCustomerApproval?: boolean;
    requiresPayment?: boolean;
    requiresSignature?: boolean;
    requiresAttachment?: boolean;
  };
  dependencies?: string[];
  // New enhanced properties
  status?: string;
  statusColor?: string;
  progress?: number;
  nextAction?: string;
  validation?: {
    isValid: boolean;
    message?: string;
    requirements?: string[];
  };
}

export interface WorkflowTransition {
  fromStage: string;
  toStage: string;
  opportunityId: string;
  documentId?: string;
  triggeredBy: string;
  metadata?: Record<string, any>;
}

export class LifecycleIntegrationService {
  
  // Get lifecycle UI for any opportunity type
  async getLifecycleUI(opportunityId: string): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      // Use new patterns
      const pattern = lifecycle.packageType === 'work_order' 
        ? WORKFLOW_PATTERNS.WORK_ORDER 
        : WORKFLOW_PATTERNS.SALES_ORDER;
      
      const currentStage = lifecycle.currentStage;
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern);
      
      const stages = pattern.map((stageName: string, index: number) => {
        const lifecycleStage = lifecycle.stages?.find((s: any) => s.stage === stageName);
        const document = documents[stageName];
        
        return {
          stage: stageName,
          label: this.getStageLabel(stageName),
          description: this.getStageDescription(stageName, lifecycle.packageType),
          icon: this.getStageIcon(stageName),
          completed: lifecycleStage?.completed || false,
          isCurrent: currentStage === stageName,
          canTransition: this.canTransitionToStage(stageName, currentStage, pattern, document),
          document: document || null,
          documentId: document?._id || document?.id || '',
          documentType: this.getDocumentType(stageName),
          actions: this.getStageActions(
            stageName,
            lifecycleStage?.completed || false,
            currentStage === stageName,
            document,
            lifecycle.packageType
          ),
          canSkip: this.isStageSkippable(stageName, lifecycle.packageType),
          mandatory: !this.isStageSkippable(stageName, lifecycle.packageType),
          completionDate: this.extractCompletionDate(lifecycleStage),
          completedAt: this.extractCompletionDate(lifecycleStage),
          requirements: this.getStageRequirements(stageName, document),
          dependencies: this.getStageDependencies(stageName, pattern),
          index: index + 1,
          totalStages: pattern.length
        };
      });
      
      const completedStages = stages.filter(s => s.completed).length;
      const totalStages = stages.length;
      const percentage = Math.round((completedStages / totalStages) * 100);
      
      const currentIndex = pattern.indexOf(currentStage);
      const nextStage = currentIndex < pattern.length - 1 ? pattern[currentIndex + 1] : null;
      
      const canTransition = stages.some(s => s.isCurrent && s.canTransition);
      
      const validation = await this.validateCurrentStage(opportunityId, currentStage, documents);
      
      return {
        stages,
        progress: {
          percentage,
          completedStages,
          totalStages,
          currentStage,
          nextStage,
          isComplete: currentStage === pattern[pattern.length - 1]
        },
        canTransition,
        validation,
        pattern: pattern,
        packageType: lifecycle.packageType
      };
    } catch (error) {
      console.error('Error getting lifecycle UI:', error);
      throw error;
    }
  }
  
  // Get lifecycle UI specifically for work orders
  async getWorkOrderLifecycleUI(opportunityId: string): Promise<any> {
    try {
      // Use the enhanced version by default
      return await this.getEnhancedWorkflowUI(opportunityId);
    } catch (error) {
      console.error('Error getting work order lifecycle UI:', error);
      throw error;
    }
  }

  async getWorkOrderLifecycleUIBasic(opportunityId: string): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      if (lifecycle.packageType !== 'work_order') {
        throw new Error('This opportunity is not a work order');
      }
      
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const currentStage = lifecycle.currentStage;
      
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern);
      
      const stages = pattern.map((stageName: string, index: number) => {
        const lifecycleStage = lifecycle.stages?.find((s: any) => s.stage === stageName);
        const document = documents[stageName];
        
        const stageConfig = this.getWorkOrderStageConfig(stageName);
        
        const isCompleted = this.isStageTrulyCompleted(stageName, lifecycleStage, document);
        
        return {
          stage: stageName,
          label: stageConfig.label,
          description: stageConfig.description,
          icon: stageConfig.icon,
          completed: isCompleted,
          isCurrent: currentStage === stageName,
          canTransition: this.canWorkOrderTransition(stageName, currentStage, document),
          document: document || null,
          documentId: document?._id || document?.id || '',
          documentType: this.getDocumentType(stageName),
          actions: this.getWorkOrderStageActions(
            stageName,
            isCompleted,
            currentStage === stageName,
            document
          ),
          required: stageConfig.required,
          skippable: stageConfig.skippable,
          canSkip: stageConfig.skippable,
          mandatory: stageConfig.required,
          completionDate: this.extractCompletionDate(lifecycleStage),
          completedAt: this.extractCompletionDate(lifecycleStage),
          requirements: this.getStageRequirements(stageName, document),
          dependencies: this.getStageDependencies(stageName, pattern),
          index: index + 1,
          totalStages: pattern.length
        };
      });
      
      const completedStages = stages.filter(s => s.completed).length;
      const totalStages = stages.length;
      const percentage = Math.round((completedStages / totalStages) * 100);
      
      const currentIndex = pattern.indexOf(currentStage);
      const nextStage = currentIndex < pattern.length - 1 ? pattern[currentIndex + 1] : null;
      
      const validation = await this.validateWorkOrderStage(opportunityId, currentStage, documents);
      
      return {
        stages,
        progress: {
          percentage,
          completedStages,
          totalStages,
          currentStage,
          nextStage,
          isComplete: currentStage === 'invoice'
        },
        canTransition: stages.some(s => s.isCurrent && s.canTransition),
        validation,
        pattern: pattern,
        packageType: 'work_order'
      };
    } catch (error) {
      console.error('Error getting work order lifecycle UI:', error);
      throw error;
    }
  }

  private isStageTrulyCompleted(stageName: string, lifecycleStage: any, document: any): boolean {
    const lifecycleCompleted = lifecycleStage?.completed || false;
    
    if (!lifecycleCompleted) {
      return false;
    }
    
    // For prechecklist - check if approved or all items are OK/N/A
    if (stageName === 'prechecklist') {
      if (document?.approved) {
        return true;
      }
      return document?.inspectionItems?.every((item: any) => 
        item.status === 'ok' || item.status === 'n/a'
      ) || false;
    }
    
    // For jobcard - check if status is completed
    if (stageName === 'jobcard') {
      return document?.status === 'completed' || document?.status === 'closed';
    }
    
    // For postchecklist - check if approved or all required items completed
    if (stageName === 'postchecklist') {
      if (document?.approved) {
        return true;
      }
      return document?.inspectionItems?.every((item: any) => 
        !item.required || item.status === 'completed' || item.status === 'n/a'
      ) || false;
    }
    
    // For invoice - check if sent or paid
    if (stageName === 'invoice') {
      return document?.status === 'sent' || document?.status === 'paid';
    }
    
    return !!document;
  }
  public async initializeWorkOrderWorkflow(opportunityId: string): Promise<{
    success: boolean;
    workflowInitialized: boolean;
    currentStage: string;
    message: string;
  }> {
    try {
      // First, ensure lifecycle exists
      let lifecycle;
      try {
        lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      } catch (error) {
        // Lifecycle doesn't exist, create it
        lifecycle = await lifecycleService.initializeOpportunity(opportunityId, {
          packageType: 'work_order'
        });
      }
      
      // Set current stage to prechecklist if not set
      if (!lifecycle.currentStage || lifecycle.currentStage === 'initial') {
        await lifecycleService.transitionToStage(opportunityId, 'prechecklist', {
          metadata: {
            initialized: true,
            initializedAt: new Date().toISOString()
          }
        });
      }
      
      // Update work order current stage
      const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
      if (workOrders.length > 0) {
        const workOrder = workOrders[0];
        if (!workOrder.currentStage || workOrder.currentStage === 'pre_checklist') {
          await workOrderService.updateWorkOrder(workOrder._id, {
            currentStage: 'pre_checklist',
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      return {
        success: true,
        workflowInitialized: true,
        currentStage: 'prechecklist',
        message: 'Workflow initialized successfully'
      };
    } catch (error) {
      console.error('Error initializing workflow:', error);
      return {
        success: false,
        workflowInitialized: false,
        currentStage: 'unknown',
        message: 'Failed to initialize workflow'
      };
    }
  }

  // Update the getStageOverview method to handle uninitialized workflow
  public async getStageOverview(opportunityId: string): Promise<{
    currentStage: {
      id: string;
      label: string;
      description: string;
      status: string;
      progress: number;
      icon: string;
      color: string;
      hasDocument: boolean;
      documentStatus?: string;
      canProceed: boolean;
      requirements: string[];
    };
    nextStage?: {
      id: string;
      label: string;
      description: string;
      icon: string;
      isReady: boolean;
      requirements: string[];
    };
    progress: {
      percentage: number;
      completed: number;
      total: number;
      estimatedCompletion: string;
    };
    actions: Array<{
      id: string;
      label: string;
      type: 'primary' | 'secondary' | 'success' | 'warning';
      icon: string;
      description: string;
      action: string;
    }>;
  }> {
    try {
      let workflowUI;
      try {
        workflowUI = await this.getEnhancedWorkflowUI(opportunityId);
      } catch (error) {
        // Workflow not initialized, create default response
        return this.getDefaultStageOverview();
      }
      
      const currentStage = workflowUI.stages.find((stage: any) => stage.isCurrent);
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const currentIndex = pattern.indexOf(workflowUI.progress.currentStage);
      const nextStageInfo = currentIndex < pattern.length - 1 
        ? workflowUI.stages[currentIndex + 1] 
        : null;
      
      if (!currentStage) {
        return this.getDefaultStageOverview();
      }
      
      // Get current stage details
      const stageStatus = currentStage?.status || 'not_started';
      const hasDocument = !!currentStage?.documentId;
      const documentStatus = currentStage?.document?.approved 
        ? 'approved' 
        : currentStage?.document?.status || 'pending';
      
      const canProceed = currentStage?.canTransition || false;
      
      // Determine requirements
      const requirements = this.getStageRequirementsList(currentStage);
      
      // Get next stage info
      let nextStage = null;
      if (nextStageInfo) {
        nextStage = {
          id: nextStageInfo.stage,
          label: nextStageInfo.label,
          description: nextStageInfo.description,
          icon: nextStageInfo.icon,
          isReady: canProceed,
          requirements: this.getNextStageRequirements(nextStageInfo, currentStage)
        };
      }
      
      // Determine actions
      const actions = this.getStageActionsForOverview(currentStage);
      
      // Estimate completion
      const estimatedCompletion = this.estimateStageCompletion(currentStage);
      
      return {
        currentStage: {
          id: currentStage?.stage || 'prechecklist',
          label: currentStage?.label || 'Pre-Checklist',
          description: currentStage?.description || 'Complete pre-service inspection',
          status: stageStatus,
          progress: currentStage?.progress || 0,
          icon: currentStage?.icon || '✅',
          color: this.getStageColor(stageStatus),
          hasDocument,
          documentStatus,
          canProceed,
          requirements
        },
        nextStage,
        progress: {
          percentage: workflowUI.progress.percentage || 0,
          completed: workflowUI.progress.completedStages || 0,
          total: workflowUI.progress.totalStages || 4,
          estimatedCompletion
        },
        actions
      };
    } catch (error) {
      console.error('Error getting stage overview:', error);
      return this.getDefaultStageOverview();
    }
  }

  private getDefaultStageOverview(): any {
    return {
      currentStage: {
        id: 'prechecklist',
        label: 'Pre-Checklist',
        description: 'Complete pre-service inspection',
        status: 'not_started',
        progress: 0,
        icon: '✅',
        color: 'gray',
        hasDocument: false,
        documentStatus: 'pending',
        canProceed: false,
        requirements: ['Create Pre-Checklist document']
      },
      nextStage: {
        id: 'jobcard',
        label: 'Job Card',
        description: 'Create detailed work instructions',
        icon: '🔧',
        isReady: false,
        requirements: ['Complete Pre-Checklist']
      },
      progress: {
        percentage: 0,
        completed: 0,
        total: 4,
        estimatedCompletion: 'Not started'
      },
      actions: [{
        id: 'initialize-workflow',
        label: 'Initialize Workflow',
        type: 'primary',
        icon: 'play',
        description: 'Start the workflow process',
        action: 'initialize'
      }]
    };
  }

  // Update the transformWorkOrderToStages method to handle stage name mapping
  private mapStageName(stage: string): string {
    const mapping: Record<string, string> = {
      'pre_checklist': 'prechecklist',
      'job_card': 'jobcard',
      'post_checklist': 'postchecklist',
      'invoice': 'invoice',
      'prechecklist': 'prechecklist',
      'jobcard': 'jobcard',
      'postchecklist': 'postchecklist'
    };
    return mapping[stage] || stage;
  }

  // Update getStageLabel to handle all stage formats
  private getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
      'prechecklist': 'Pre-Checklist',
      'pre_checklist': 'Pre-Checklist',
      'jobcard': 'Job Card',
      'job_card': 'Job Card',
      'postchecklist': 'Post-Checklist',
      'post_checklist': 'Post-Checklist',
      'invoice': 'Invoice',
      'quote': 'Quote'
    };
    return labels[stage] || stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ');
}

// Method to get detailed current stage information
  public async getCurrentStageDetails(opportunityId: string): Promise<{
    stage: string;
    label: string;
    description: string;
    status: string;
    progress: number;
    canTransition: boolean;
    nextStage?: string;
    nextStageLabel?: string;
    actions: Array<{
      label: string;
      action: string;
      color: string;
      description: string;
      icon?: string;
    }>;
    document?: any;
    documentId?: string;
    validation: {
      isValid: boolean;
      message?: string;
      requirements?: string[];
    };
    autoTransitionEnabled: boolean;
    canAutoTransition: boolean;
  }> {
    try {
      const workflowUI = await this.getEnhancedWorkflowUI(opportunityId);
      const currentStage = workflowUI.stages.find((stage: any) => stage.isCurrent);
      
      if (!currentStage) {
        throw new Error('No current stage found');
      }
      
      // Determine next stage
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const currentIndex = pattern.indexOf(currentStage.stage);
      const nextStage = currentIndex < pattern.length - 1 ? pattern[currentIndex + 1] : null;
      const nextStageLabel = nextStage ? this.getStageLabel(nextStage) : undefined;
      
      // Check if auto-transition is possible
      const canAutoTransition = this.canStageAutoTransition(currentStage);
      const autoTransitionEnabled = ['prechecklist', 'jobcard', 'postchecklist', 'invoice']
        .includes(currentStage.stage);
      
      return {
        stage: currentStage.stage,
        label: currentStage.label,
        description: currentStage.description,
        status: currentStage.status,
        progress: currentStage.progress || 0,
        canTransition: currentStage.canTransition || false,
        nextStage,
        nextStageLabel,
        actions: currentStage.actions || [],
        document: currentStage.document,
        documentId: currentStage.documentId,
        validation: currentStage.validation || { isValid: false },
        autoTransitionEnabled,
        canAutoTransition
      };
    } catch (error) {
      console.error('Error getting current stage details:', error);
      throw error;
    }
  }

  // Method to update workflow progress and refresh all UI components
  public async updateWorkflowProgress(opportunityId: string): Promise<{
    workflowUI: any;
    currentStage: any;
    progress: {
      percentage: number;
      completedStages: number;
      totalStages: number;
      nextStage?: string;
    };
    documents: Record<string, any>;
  }> {
    try {
      // Get updated workflow UI
      const workflowUI = await this.getEnhancedWorkflowUI(opportunityId);
      
      // Get current stage details
      const currentStage = workflowUI.stages.find((stage: any) => stage.isCurrent);
      
      // Get all documents for the opportunity
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern);
      
      // Calculate progress
      const completedStages = workflowUI.stages.filter((stage: any) => 
        stage.status === 'completed' || stage.status === 'approved'
      ).length;
      const totalStages = workflowUI.stages.length;
      const percentage = Math.round((completedStages / totalStages) * 100);
      
      // Determine next stage
      const currentIndex = pattern.indexOf(workflowUI.progress.currentStage);
      const nextStage = currentIndex < pattern.length - 1 ? pattern[currentIndex + 1] : null;
      
      return {
        workflowUI,
        currentStage,
        progress: {
          percentage,
          completedStages,
          totalStages,
          nextStage
        },
        documents
      };
    } catch (error) {
      console.error('Error updating workflow progress:', error);
      throw error;
    }
  }

  // Method to handle document creation with auto-refresh
  public async createDocumentAndUpdateWorkflow(
    stage: string,
    opportunityId: string,
    data: any,
    userId?: string
  ): Promise<{
    document: any;
    workflowUpdated: boolean;
    shouldTransition: boolean;
    nextStage?: string;
  }> {
    try {
      let document: any;
      
      // Create the document
      switch (stage) {
        case 'prechecklist':
          document = await preChecklistService.createPreChecklist({
            ...data,
            opportunityId
          }, userId);
          break;
          
        case 'jobcard':
          document = await jobCardService.createJobCard({
            ...data,
            opportunityId
          });
          break;
          
        case 'postchecklist':
          document = await postChecklistService.createPostChecklist({
            ...data,
            opportunityId
          }, userId);
          break;
          
        case 'invoice':
          document = await invoiceService.createInvoice({
            ...data,
            opportunityId
          });
          break;
          
        default:
          throw new Error(`Invalid stage: ${stage}`);
      }
      
      // Check if we should auto-transition
      const shouldTransition = await this.checkAutoTransitionAfterCreation(
        stage,
        document,
        opportunityId
      );
      
      let nextStage: string | undefined;
      if (shouldTransition) {
        const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
        const currentIndex = pattern.indexOf(stage);
        nextStage = currentIndex < pattern.length - 1 ? pattern[currentIndex + 1] : undefined;
        
        await this.transitionToStage(opportunityId, nextStage!, {
          skipValidation: true,
          metadata: {
            autoTransition: true,
            triggeredBy: 'document-creation',
            documentId: document._id
          }
        });
        
        // Auto-create next document if needed
        if (nextStage) {
          await this.autoCreateNextDocument(opportunityId, nextStage, document);
        }
      }
      
      return {
        document,
        workflowUpdated: true,
        shouldTransition,
        nextStage
      };
    } catch (error) {
      console.error('Error creating document and updating workflow:', error);
      throw error;
    }
  }

  private async checkAutoTransitionAfterCreation(
    stage: string,
    document: any,
    opportunityId: string
  ): Promise<boolean> {
    // For now, we don't auto-transition immediately after creation
    // User needs to complete/approve the document first
    return false;
  }

  private getStageRequirementsList(stage: any): string[] {
    if (!stage) return [];
    
    const requirements: string[] = [];
    
    if (!stage.documentId) {
      requirements.push(`Create ${stage.label} document`);
    } else {
      switch (stage.stage) {
        case 'prechecklist':
          if (!stage.document?.approved) {
            requirements.push('Approve the checklist');
          }
          if (stage.document?.inspectionItems?.some((item: any) => item.status === 'fault')) {
            requirements.push('Resolve all fault items');
          }
          break;
        case 'jobcard':
          if (stage.document?.status !== 'completed') {
            requirements.push('Complete all job tasks');
          }
          break;
        case 'postchecklist':
          if (!stage.document?.approved) {
            requirements.push('Approve the quality check');
          }
          break;
        case 'invoice':
          if (stage.document?.status !== 'paid') {
            requirements.push('Mark invoice as paid');
          }
          break;
      }
    }
    
    return requirements;
  }

  private getNextStageRequirements(nextStage: any, currentStage: any): string[] {
    const requirements: string[] = [];
    
    if (!currentStage?.canTransition) {
      requirements.push(`Complete current ${currentStage?.label || 'stage'}`);
    }
    
    switch (nextStage.stage) {
      case 'jobcard':
        requirements.push('Pre-checklist must be approved');
        break;
      case 'postchecklist':
        requirements.push('Job card must be completed');
        break;
      case 'invoice':
        requirements.push('Post-checklist must be approved');
        break;
    }
    
    return requirements;
  }

  private getStageActionsForOverview(stage: any): Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'success' | 'warning';
    icon: string;
    description: string;
    action: string;
  }> {
    const actions: Array<{
      id: string;
      label: string;
      type: 'primary' | 'secondary' | 'success' | 'warning';
      icon: string;
      description: string;
      action: string;
    }> = [];
    
    if (!stage) return actions;
    
    if (!stage.documentId) {
      actions.push({
        id: 'create-document',
        label: `Create ${stage.label}`,
        type: 'primary',
        icon: 'plus',
        description: `Create ${stage.label.toLowerCase()} document`,
        action: 'create'
      });
    } else {
      actions.push({
        id: 'view-document',
        label: 'View Document',
        type: 'secondary',
        icon: 'eye',
        description: `View ${stage.label} details`,
        action: 'view'
      });
      
      if (stage.document && !stage.document.approved && stage.stage.includes('checklist')) {
        actions.push({
          id: 'approve-document',
          label: 'Approve',
          type: 'success',
          icon: 'check',
          description: `Approve ${stage.label}`,
          action: 'approve'
        });
      }
      
      if (stage.document && stage.document.status !== 'completed' && stage.stage === 'jobcard') {
        actions.push({
          id: 'complete-jobcard',
          label: 'Complete Job',
          type: 'success',
          icon: 'check-circle',
          description: 'Mark job card as completed',
          action: 'complete'
        });
      }
      
      if (stage.canTransition) {
        actions.push({
          id: 'next-stage',
          label: 'Next Stage',
          type: 'primary',
          icon: 'arrow-right',
          description: 'Move to next workflow stage',
          action: 'transition'
        });
      }
    }
    
    return actions;
  }

  private estimateStageCompletion(stage: any): string {
    if (!stage) return 'Unknown';
    
    if (stage.status === 'completed' || stage.status === 'approved') {
      return 'Ready for next stage';
    }
    
    if (!stage.documentId) {
      return 'Pending document creation';
    }
    
    switch (stage.stage) {
      case 'prechecklist':
        return stage.document?.approved ? 'Ready for approval' : 'Inspection in progress';
      case 'jobcard':
        return stage.document?.status === 'completed' ? 'Ready for next stage' : 'Work in progress';
      case 'postchecklist':
        return stage.document?.approved ? 'Ready for approval' : 'Quality check in progress';
      case 'invoice':
        return stage.document?.status === 'paid' ? 'Payment received' : 'Awaiting payment';
      default:
        return 'In progress';
    }
  }

  private getStageColor(status: string): string {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'needs_approval':
        return 'yellow';
      case 'not_started':
        return 'gray';
      default:
        return 'gray';
    }
  }

  async transitionWithValidation(
    opportunityId: string, 
    fromStage: string, 
    toStage: string
  ): Promise<{
    success: boolean;
    message: string;
    autoCreatedDocument?: any;
  }> {
    try {
      // Use enhanced validation
      const documents = await this.fetchDocumentsForStages(opportunityId, [fromStage]);
      const currentDocument = documents[fromStage];
      
      // Use enhanced validation
      const validation = await this.validateStageCompletion(opportunityId, fromStage, currentDocument);
      
      if (!validation.isValid) {
        throw new Error(`Cannot transition from ${fromStage}: ${validation.message}`);
      }
      
      // Continue with original logic
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const fromIndex = pattern.indexOf(fromStage);
      const toIndex = pattern.indexOf(toStage);
      
      if (toIndex <= fromIndex) {
        throw new Error(`Cannot transition backwards from ${fromStage} to ${toStage}`);
      }
      
      await this.transitionToStage(opportunityId, toStage, {
        skipValidation: false,
        metadata: {
          transitionedAt: new Date().toISOString(),
          fromStage,
          toStage
        }
      });
      
      let autoCreatedDocument = null;
      if (toStage === 'jobcard' && !documents.jobcard) {
        autoCreatedDocument = await this.autoCreateJobCard(opportunityId);
      }
      
      return {
        success: true,
        message: `Successfully transitioned from ${fromStage} to ${toStage}`,
        autoCreatedDocument
      };
      
    } catch (error) {
      console.error(`Error transitioning from ${fromStage} to ${toStage}:`, error);
      throw error;
    }
  }
  
  // Get lifecycle UI specifically for sales orders
  async getSalesOrderLifecycleUI(opportunityId: string): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      if (lifecycle.packageType !== 'sales_order') {
        throw new Error('This opportunity is not a sales order');
      }
      
      // Use sales order pattern
      const pattern = WORKFLOW_PATTERNS.SALES_ORDER;
      const currentStage = lifecycle.currentStage;
      
      // Get documents
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern);
      
      // Build stages with sales-order specific logic
      const stages = pattern.map((stageName: string, index: number) => {
        const lifecycleStage = lifecycle.stages?.find((s: any) => s.stage === stageName);
        const document = documents[stageName];
        
        const stageConfig = this.getSalesOrderStageConfig(stageName);
        
        return {
          stage: stageName,
          label: stageConfig.label,
          description: stageConfig.description,
          icon: stageConfig.icon,
          completed: lifecycleStage?.completed || false,
          isCurrent: currentStage === stageName,
          canTransition: this.canSalesOrderTransition(stageName, currentStage, document),
          document: document || null,
          documentId: document?._id || document?.id || '',
          documentType: this.getDocumentType(stageName),
          actions: this.getSalesOrderStageActions(
            stageName,
            lifecycleStage?.completed || false,
            currentStage === stageName,
            document
          ),
          required: true,
          skippable: false,
          canSkip: false,
          mandatory: true,
          completionDate: this.extractCompletionDate(lifecycleStage),
          completedAt: this.extractCompletionDate(lifecycleStage),
          requirements: this.getStageRequirements(stageName, document),
          dependencies: [],
          index: index + 1,
          totalStages: pattern.length
        };
      });
      
      // Calculate progress
      const completedStages = stages.filter(s => s.completed).length;
      const totalStages = stages.length;
      const percentage = Math.round((completedStages / totalStages) * 100);
      
      // Find next stage
      const currentIndex = pattern.indexOf(currentStage);
      const nextStage = currentIndex < pattern.length - 1 ? pattern[currentIndex + 1] : null;
      
      return {
        stages,
        progress: {
          percentage,
          completedStages,
          totalStages,
          currentStage,
          nextStage,
          isComplete: currentStage === 'invoice'
        },
        canTransition: stages.some(s => s.isCurrent && s.canTransition),
        validation: { isValid: true, requirements: [] },
        pattern: pattern,
        packageType: 'sales_order'
      };
    } catch (error) {
      console.error('Error getting sales order lifecycle UI:', error);
      throw error;
    }
  }

  // Helper method to extract completion date from lifecycle stage
  private extractCompletionDate(lifecycleStage: any): string | undefined {
    if (!lifecycleStage) return undefined;
    
    // Try to get date from stage metadata or history
    // This depends on your data structure
    if (lifecycleStage.completedAt) {
      return lifecycleStage.completedAt;
    }
    
    if (lifecycleStage.metadata?.completedAt) {
      return lifecycleStage.metadata.completedAt;
    }
    
    return undefined;
  }

  // Add this method to mark a stage as completed
  async markStageAsCompleted(
    opportunityId: string, 
    stage: string, 
    data?: { documentId?: string; completedBy?: string; notes?: string }
  ): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const packageType = lifecycle.packageType;
      
      // For sales orders, when quote is completed, auto-create invoice
      if (packageType === 'sales_order' && stage === 'quote') {
        // First complete the quote stage
        const result = await lifecycleService.transitionToStage(opportunityId, 'invoice', {
          metadata: {
            ...data,
            previousStageCompleted: stage,
            completedAt: new Date().toISOString()
          }
        });
        
        // Then auto-create invoice
        await this.autoCreateInvoiceForSalesOrder(opportunityId);
        
        return {
          success: true,
          message: `Quote completed and invoice auto-created`,
          stage: 'invoice',
          autoCreated: true
        };
      }
      
      // Original logic for other stages
      const pattern = packageType === 'work_order' 
        ? WORKFLOW_PATTERNS.WORK_ORDER 
        : WORKFLOW_PATTERNS.SALES_ORDER;
      
      const currentIndex = pattern.indexOf(stage);
      
      if (lifecycle.currentStage === stage && currentIndex < pattern.length - 1) {
        const nextStage = pattern[currentIndex + 1];
        return await lifecycleService.transitionToStage(opportunityId, nextStage, { 
          metadata: {
            ...data,
            previousStageCompleted: stage,
            completedAt: new Date().toISOString()
          }
        });
      }
      
      return {
        success: true,
        message: `Stage ${stage} marked as completed`,
        stage: {
          stage,
          completed: true,
          completedAt: new Date().toISOString(),
          documentId: data?.documentId,
          completedBy: data?.completedBy || 'system'
        }
      };
    } catch (error) {
      console.error('Error marking stage as completed:', error);
      throw error;
    }
  }

  // Add this method to move to a specific stage (backwards movement)
  async moveToStage(
    opportunityId: string,
    targetStage: string,
    data?: { reason?: string; skipValidation?: boolean }
  ): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const currentStage = lifecycle.currentStage;
      const packageType = lifecycle.packageType;
      
      // Determine pattern
      const pattern = packageType === 'work_order' 
        ? WORKFLOW_PATTERNS.WORK_ORDER 
        : WORKFLOW_PATTERNS.SALES_ORDER;
      
      // Validate target stage exists in pattern
      if (!pattern.includes(targetStage)) {
        throw new Error(`Invalid stage "${targetStage}" for ${packageType}`);
      }
      
      const currentIndex = pattern.indexOf(currentStage);
      const targetIndex = pattern.indexOf(targetStage);
      
      // Check if we're moving backwards
      if (targetIndex < currentIndex) {
        // Use the transitionToStage method but allow backwards movement
        return await lifecycleService.transitionToStage(opportunityId, targetStage, {
          metadata: {
            reason: data?.reason || 'Manual navigation back',
            movedFrom: currentStage,
            movedTo: targetStage,
            movedAt: new Date().toISOString()
          }
        });
      } else {
        // For forwards movement, use the existing transition method
        return await this.transitionToStage(opportunityId, targetStage, {
          skipValidation: data?.skipValidation
        });
      }
    } catch (error) {
      console.error('Error moving to stage:', error);
      throw error;
    }
  }
  
  // Transition to next stage
  async transitionToNextStage(opportunityId: string, metadata?: any): Promise<any> {
    try {
      return await lifecycleService.transitionToNextStage(opportunityId, {
        metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error transitioning to next stage:', error);
      throw error;
    }
  }

  async transitionToSpecificStage(opportunityId: string, stage: string, metadata?: any): Promise<any> {
    try {
      return await lifecycleService.transitionToStage(opportunityId, stage, {
        metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error transitioning to specific stage:', error);
      throw error;
    }
  }

  async getLifecycleStatus(opportunityId: string): Promise<LifecycleStatus> {
    try {
      return await lifecycleService.getOpportunityLifecycle(opportunityId);
    } catch (error) {
      console.error('Error getting lifecycle status:', error);
      throw error;
    }
  }
  
  // Transition to specific stage
  async transitionToStage(opportunityId: string, targetStage: string, options?: any): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const currentStage = lifecycle.currentStage;
      const packageType = lifecycle.packageType;
      
      // Determine pattern
      const pattern = packageType === 'work_order' 
        ? WORKFLOW_PATTERNS.WORK_ORDER 
        : WORKFLOW_PATTERNS.SALES_ORDER;
      
      // Validate target stage
      if (!pattern.includes(targetStage)) {
        throw new Error(`Invalid stage "${targetStage}" for ${packageType}`);
      }
      
      const currentIndex = pattern.indexOf(currentStage);
      const targetIndex = pattern.indexOf(targetStage);
      
      // Validate all intermediate stages
      if (!options?.skipValidation) {
        for (let i = currentIndex; i < targetIndex; i++) {
          const stage = pattern[i];
          const documents = await this.fetchDocumentsForStages(opportunityId, [stage]);
          const isValid = await this.validateStageCompletion(opportunityId, stage, documents[stage]);
          
          if (!isValid) {
            throw new Error(`Cannot skip stage "${stage}" - not completed`);
          }
        }
      }
      
      // Perform transition
      const result = await lifecycleService.transitionToStage(opportunityId, targetStage, options);
      
      // =========== AUTO-CREATE INVOICE LOGIC ===========
      if (targetStage === 'invoice' && packageType === 'sales_order') {
        await this.autoCreateInvoiceForSalesOrder(opportunityId);
      }
      // =================================================
      
      return {
        success: true,
        message: `Transitioned from ${currentStage} to ${targetStage}`,
        currentStage: targetStage,
        previousStage: currentStage
      };
    } catch (error) {
      console.error('Error transitioning to stage:', error);
      throw error;
    }
  }

  async autoCreateInvoiceForSalesOrder(opportunityId: string): Promise<any> {
    try {
      console.log('Auto-creating invoice for sales order...');
      
      // Get sales order for this opportunity
      const salesOrders = await salesOrderService.getSalesOrdersByOpportunity(opportunityId);
      if (salesOrders.length === 0) {
        console.error('No sales order found for opportunity');
        return null;
      }
      
      const salesOrder = salesOrders[0];
      
      // Check if invoice already exists and is properly linked
      if (salesOrder.invoiceId) {
        console.log('Invoice already exists:', salesOrder.invoiceId);
        
        // If it's just an ID string, fetch the full invoice object
        if (typeof salesOrder.invoiceId === 'string') {
          try {
            const invoice = await invoiceService.getInvoiceById(salesOrder.invoiceId);
            return invoice;
          } catch (error) {
            console.error('Error fetching existing invoice:', error);
          }
        }
        
        return salesOrder.invoiceId;
      }
      
      // Get quote for the sales order
      if (!salesOrder.quoteId) {
        console.error('No quote found for sales order');
        return null;
      }
      
      const quoteId = typeof salesOrder.quoteId === 'object' 
        ? salesOrder.quoteId._id 
        : salesOrder.quoteId;
      
      const quote = await quoteService.getQuoteById(quoteId);
      
      // Auto-create invoice from quote data
      const invoiceData = {
        opportunityId,
        salesOrderId: salesOrder._id || salesOrder.id,
        quoteId,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        items: quote.items?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })) || [],
        subtotal: quote.subtotal || salesOrder.subtotal,
        tax: quote.tax || salesOrder.tax,
        totalAmount: quote.totalAmount || salesOrder.totalAmount,
        status: 'draft',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Auto-generated from quote ${quote.quoteNumber}`,
        paymentTerms: 'Due within 30 days'
      };
      
      console.log('Creating invoice with data:', invoiceData);
      
      // Create the invoice
      const invoice = await invoiceService.createInvoice(invoiceData);
      
      console.log('Invoice created:', invoice);
      
      // IMPORTANT: Update sales order with invoice ID
      const updatedSalesOrder = await salesOrderService.updateSalesOrder(salesOrder._id || salesOrder.id, {
        invoiceId: invoice._id || invoice.id
      });
      
      console.log('Sales order updated with invoice ID:', updatedSalesOrder);
      
      // Return the full invoice object
      return invoice;
    } catch (error) {
      console.error('Error auto-creating invoice:', error);
      throw error;
    }
  }
  
  // Skip current stage
  async skipCurrentStage(opportunityId: string, options?: any): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const currentStage = lifecycle.currentStage;
      const packageType = lifecycle.packageType;
      
      // Check if stage is skippable
      if (!this.isStageSkippable(currentStage, packageType)) {
        throw new Error(`Stage "${currentStage}" cannot be skipped`);
      }
      
      // Skip to next stage
      return await this.transitionToNextStage(opportunityId, {
        ...options,
        skipValidation: true,
        metadata: { ...options?.metadata, skippedStage: currentStage }
      });
    } catch (error) {
      console.error('Error skipping stage:', error);
      throw error;
    }
  }
  
  // Complete lifecycle
  async completeLifecycle(opportunityId: string, options?: any): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const currentStage = lifecycle.currentStage;
      const packageType = lifecycle.packageType;
      
      // Determine pattern
      const pattern = packageType === 'work_order' 
        ? WORKFLOW_PATTERNS.WORK_ORDER 
        : WORKFLOW_PATTERNS.SALES_ORDER;
      
      const finalStage = pattern[pattern.length - 1];
      
      if (currentStage !== finalStage) {
        // Transition to final stage first
        await this.transitionToStage(opportunityId, finalStage, {
          ...options,
          skipValidation: options?.skipValidation
        });
      }
      
      // Mark as complete
      const result = await lifecycleService.completeLifecycle(opportunityId, options);
      
      // Update related order status
      if (packageType === 'work_order') {
        await workOrderService.updateWorkOrderByOpportunity(opportunityId, {
          status: 'completed',
          actualCompletionDate: new Date().toISOString()
        });
      } else if (packageType === 'sales_order') {
        await salesOrderService.updateSalesOrderByOpportunity(opportunityId, {
          status: 'delivered',
          actualDeliveryDate: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        message: `${packageType === 'work_order' ? 'Work order' : 'Sales order'} completed successfully`,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error completing lifecycle:', error);
      throw error;
    }
  }

  async completeSalesOrder(opportunityId: string): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      if (lifecycle.packageType !== 'sales_order') {
        throw new Error('This opportunity is not a sales order');
      }
      
      // First, ensure we're at the invoice stage
      const currentStage = lifecycle.currentStage;
      if (currentStage !== 'invoice') {
        // Transition to invoice stage first
        await this.transitionToStage(opportunityId, 'invoice');
      }
      
      // Complete the lifecycle
      const result = await lifecycleService.completeLifecycle(opportunityId);
      
      // Update sales order status
      try {
        const salesOrders = await salesOrderService.getSalesOrdersByOpportunity(opportunityId);
        if (salesOrders.length > 0) {
          const salesOrder = salesOrders[0];
          await salesOrderService.updateSalesOrder(salesOrder._id || salesOrder.id, {
            status: 'delivered',
            actualDeliveryDate: new Date().toISOString()
          });
        }
      } catch (updateError) {
        console.error('Error updating sales order:', updateError);
        // Don't throw - continue with the completion
      }
      
      return {
        success: true,
        message: 'Sales order completed successfully',
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error completing sales order:', error);
      throw error;
    }
  }

  async completeWorkOrder(opportunityId: string): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      if (lifecycle.packageType !== 'work_order') {
        throw new Error('This opportunity is not a work order');
      }
      
      // First, ensure we're at the invoice stage
      const currentStage = lifecycle.currentStage;
      if (currentStage !== 'invoice') {
        // Transition to invoice stage first
        await this.transitionToStage(opportunityId, 'invoice');
      }
      
      // Complete the lifecycle
      const result = await lifecycleService.completeLifecycle(opportunityId);
      
      // Update work order status
      try {
        const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
        if (workOrders.length > 0) {
          const workOrder = workOrders[0];
          await workOrderService.updateWorkOrder(workOrder._id, {
            status: 'completed',
            actualCompletionDate: new Date().toISOString()
          });
        }
      } catch (updateError) {
        console.error('Error updating work order:', updateError);
        // Don't throw - continue with the completion
      }
      
      return {
        success: true,
        message: 'Work order completed successfully',
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error completing work order:', error);
      throw error;
    }
  }
  
  // Private helper methods
  
  private getStageRequirements(stage: string, document?: any): any {
    const requirements: any = {};
    
    switch (stage) {
      case 'quote':
        requirements.requiresCustomerApproval = true;
        break;
      case 'waiver':
        requirements.requiresSignature = true;
        requirements.requiresCustomerApproval = true;
        break;
      case 'jobcard':
        requirements.requiresAttachment = true;
        break;
      case 'invoice':
        requirements.requiresPayment = true;
        break;
    }
    
    return requirements;
  }

  async handleChecklistApproval(
      checklistId: string,
      checklistType: 'prechecklist' | 'postchecklist',
      approvedBy?: string
    ): Promise<{
      checklistApproved: boolean;
      stageCompleted: boolean;
      nextStage?: string;
      workflowProgress: any;
      autoTransitioned: boolean;
    }> {
      try {
        // Use the enhanced auto-transition method
        const result = await this.autoTransitionOnApproval(checklistId, checklistType, approvedBy);
        
        if (!result.success) {
          throw new Error(result.message);
        }
        
        // Get updated workflow progress
        const workflowProgress = await this.getEnhancedWorkflowUI(
          result.transition?.opportunityId || ''
        );
        
        return {
          checklistApproved: true,
          stageCompleted: true,
          nextStage: result.transition?.toStage,
          workflowProgress,
          autoTransitioned: true
        };
      } catch (error) {
        console.error(`Error handling ${checklistType} approval:`, error);
        throw error;
      }
    }

async autoCompletePreChecklist(
  checklistId: string,
  userId?: string
): Promise<{
  checklist: PreChecklist;
  autoApproved: boolean;
  nextStage?: string;
}> {
  try {
    // Get the checklist
    const checklist = await preChecklistService.getPreChecklistById(checklistId);
    
    // Auto-approve the checklist
    const approvedChecklist = await preChecklistService.updatePreChecklist(checklistId, {
      approved: true,
      approvedBy: userId || 'system-auto',
      approvedAt: new Date().toISOString(),
      clientSignature: checklist.clientSignature || 'auto-approved-no-signature-required',
      remarks: checklist.remarks ? `${checklist.remarks} (Auto-approved)` : 'Auto-approved by system'
    });
    
    // Return the auto-approved checklist
    return {
      checklist: approvedChecklist,
      autoApproved: true,
      nextStage: 'jobcard'
    };
  } catch (error) {
    console.error('Error auto-completing pre-checklist:', error);
    throw error;
  }
}

  // Method to validate checklist completion before stage transition
  async validateChecklistForStageTransition(
    opportunityId: string,
    checklistType: 'prechecklist' | 'postchecklist'
  ): Promise<{
    isValid: boolean;
    checklists: any[];
    requirements: string[];
    missing: string[];
  }> {
    try {
      const requirements: string[] = [];
      const missing: string[] = [];
      
      // Get checklists for the opportunity
      let checklists: any[] = [];
      
      if (checklistType === 'prechecklist') {
        const preChecklistService = require('./preChecklistService').preChecklistService;
        checklists = await preChecklistService.getPreChecklistsByOpportunity(opportunityId);
      } else {
        const postChecklistService = require('./postChecklistService').postChecklistService;
        checklists = await postChecklistService.getPostChecklistsByOpportunity(opportunityId);
      }
      
      // Check if we have at least one checklist
      if (checklists.length === 0) {
        requirements.push(`${checklistType} is required`);
        missing.push('checklist');
      }
      
      // Check if we have an approved checklist
      const approvedChecklists = checklists.filter(c => c.approved);
      if (approvedChecklists.length === 0) {
        requirements.push(`Approved ${checklistType} is required`);
        missing.push('approved-checklist');
      }
      
      // Check checklist completion status
      const completedChecklists = checklists.filter(c => {
        if (checklistType === 'prechecklist') {
          return c.inspectionItems.every((item: any) => item.status !== 'fault');
        } else {
          return c.inspectionItems.every((item: any) => 
            item.status === 'completed' || item.status === 'not_applicable'
          );
        }
      });
      
      if (completedChecklists.length === 0) {
        requirements.push(`Fully completed ${checklistType} is required`);
        missing.push('completed-checklist');
      }
      
      return {
        isValid: requirements.length === 0,
        checklists,
        requirements,
        missing
      };
    } catch (error) {
      console.error(`Error validating ${checklistType}:`, error);
      throw error;
    }
  }

  // Add this method to LifecycleIntegrationService
// Update the autoTransitionOnPreChecklistComplete method
async autoTransitionOnPreChecklistComplete(
  checklistId: string,
  userId?: string
): Promise<{
  success: boolean;
  message: string;
  nextStage: string;
}> {
  try {
    const checklist = await preChecklistService.getPreChecklistById(checklistId);
    
    const opportunityId = typeof checklist.opportunityId === 'object' 
      ? checklist.opportunityId._id 
      : checklist.opportunityId;
    
    if (!opportunityId) {
      throw new Error('Could not find opportunity for this checklist');
    }
    
    // Auto-approve the checklist
    await preChecklistService.updatePreChecklist(checklistId, {
      approved: true,
      approvedBy: userId || 'system-auto',
      approvedAt: new Date().toISOString()
    });
    
    // Get current lifecycle
    const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
    
    // If current stage is prechecklist, move to jobcard
    if (lifecycle.currentStage === 'prechecklist') {
      await this.transitionToStage(opportunityId, 'jobcard', {
        skipValidation: true,
        metadata: {
          autoTransition: true,
          checklistId,
          triggeredBy: 'pre-checklist-completion'
        }
      });
      
      return {
        success: true,
        message: 'Pre-checklist auto-approved and moved to Job Card stage',
        nextStage: 'jobcard'
      };
    }
    
    return {
      success: false,
      message: 'Not in pre-checklist stage',
      nextStage: lifecycle.currentStage
    };
  } catch (error) {
    console.error('Error in auto-transition:', error);
    throw error;
  }
}

  // Method to auto-create checklist if needed
  async autoCreateChecklistIfNeeded(
    opportunityId: string,
    checklistType: 'prechecklist' | 'postchecklist',
    userId?: string
  ): Promise<any> {
    try {
      // Get opportunity details
      const opportunity = await opportunityService.getOpportunityById(opportunityId);
      
      // Check if checklist already exists
      let existingChecklists: any[] = [];
      
      if (checklistType === 'prechecklist') {
        const preChecklistService = require('./preChecklistService').preChecklistService;
        existingChecklists = await preChecklistService.getPreChecklistsByOpportunity(opportunityId);
      } else {
        const postChecklistService = require('./postChecklistService').postChecklistService;
        existingChecklists = await postChecklistService.getPostChecklistsByOpportunity(opportunityId);
      }
      
      // If checklist already exists, return it
      if (existingChecklists.length > 0) {
        return existingChecklists[0];
      }
      
      // Get related information for checklist creation
      const jobCards = await jobCardService.getJobCardsByOpportunity(opportunityId);
      const jobCard = jobCards[0];
      
      const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
      const workOrder = workOrders[0];
      
      // Get vehicle ID
      let vehicleId = '';
      if (jobCard?.vehicleId) {
        vehicleId = typeof jobCard.vehicleId === 'object' ? jobCard.vehicleId._id : jobCard.vehicleId;
      } else if ((opportunity as any).vehicleId) {
        vehicleId = typeof (opportunity as any).vehicleId === 'object' 
          ? (opportunity as any).vehicleId._id 
          : (opportunity as any).vehicleId;
      } else if ((workOrder as any).vehicleId) {
        vehicleId = typeof (workOrder as any).vehicleId === 'object'
          ? (workOrder as any).vehicleId._id
          : (workOrder as any).vehicleId;
      }
      
      // Create checklist based on type
      if (checklistType === 'prechecklist') {
        const preChecklistService = require('./preChecklistService').preChecklistService;
        
        // Create default pre-checklist items
        const defaultItems = [
          { item: 'Vehicle Exterior', status: 'n/a', remarks: 'To be inspected' },
          { item: 'Vehicle Interior', status: 'n/a', remarks: 'To be inspected' },
          { item: 'Engine Bay', status: 'n/a', remarks: 'To be inspected' },
          { item: 'Tires & Wheels', status: 'n/a', remarks: 'To be inspected' },
          { item: 'Lights & Signals', status: 'n/a', remarks: 'To be inspected' },
          { item: 'Fluid Levels', status: 'n/a', remarks: 'To be checked' },
          { item: 'Brake System', status: 'n/a', remarks: 'To be checked' },
          { item: 'Suspension', status: 'n/a', remarks: 'To be checked' }
        ];
        
        const checklistData = {
          opportunityId,
          vehicleId,
          inspectionItems: defaultItems,
          remarks: `Pre-service inspection for ${opportunity.subject}`,
          approved: false
        };
        
        return await preChecklistService.createPreChecklist(checklistData, userId);
      } else {
        const postChecklistService = require('./postChecklistService').postChecklistService;
        
        // Create default post-checklist items
        const defaultItems = [
          { 
            item: 'Work Quality Verification', 
            status: 'incomplete', 
            required: true,
            category: 'quality' 
          },
          { 
            item: 'Safety Inspection', 
            status: 'incomplete', 
            required: true,
            category: 'safety' 
          },
          { 
            item: 'Cleanliness Check', 
            status: 'incomplete', 
            required: true,
            category: 'cleanliness' 
          },
          { 
            item: 'Test Drive', 
            status: 'incomplete', 
            required: false,
            category: 'testing' 
          },
          { 
            item: 'Customer Walkthrough', 
            status: 'incomplete', 
            required: true,
            category: 'customer' 
          },
          { 
            item: 'Documentation Review', 
            status: 'incomplete', 
            required: true,
            category: 'documentation' 
          }
        ];
        
        const checklistData = {
          opportunityId,
          vehicleId,
          jobCardId: jobCard?._id || jobCard?.id || '',
          inspectedBy: userId,
          inspectionItems: defaultItems,
          notes: `Post-service quality check for ${opportunity.subject}`,
          overallCondition: 'pending'
        };
        
        return await postChecklistService.createPostChecklist(checklistData, userId);
      }
    } catch (error) {
      console.error(`Error auto-creating ${checklistType}:`, error);
      throw error;
    }
  }

  // Add to LifecycleIntegrationService class
  async completeChecklistAndTransition(
    checklistId: string,
    checklistType: 'prechecklist' | 'postchecklist',
    userId?: string,
    options?: { skipApproval?: boolean }
  ): Promise<{
    checklistCompleted: boolean;
    stageTransitioned: boolean;
    nextStage?: string;
    message: string;
  }> {
    try {
      // Get checklist to find opportunity
      let opportunityId: string;
      
      if (checklistType === 'prechecklist') {
        const preChecklistService = require('./preChecklistService').preChecklistService;
        const checklist = await preChecklistService.getPreChecklistById(checklistId);
        opportunityId = typeof checklist.opportunityId === 'object' 
          ? checklist.opportunityId._id 
          : checklist.opportunityId;
        
        // If skipApproval is true, auto-approve without requiring client signature
        if (options?.skipApproval) {
          await preChecklistService.updatePreChecklist(checklistId, {
            approved: true,
            approvedBy: userId || 'system',
            approvedAt: new Date().toISOString(),
            clientSignature: checklist.clientSignature || 'auto-approved-no-signature-required'
          });
        }
      } else {
        const postChecklistService = require('./postChecklistService').postChecklistService;
        const checklist = await postChecklistService.getPostChecklistById(checklistId);
        opportunityId = typeof checklist.opportunityId === 'object' 
          ? checklist.opportunityId._id 
          : checklist.opportunityId;
      }
      
      if (!opportunityId) {
        throw new Error('Could not find opportunity for this checklist');
      }
      
      // Get current lifecycle state
      const lifecycleUI = await this.getWorkOrderLifecycleUI(opportunityId);
      const currentStage = lifecycleUI.progress.currentStage;
      
      // Verify this checklist belongs to current stage
      if (currentStage !== checklistType) {
        return {
          checklistCompleted: false,
          stageTransitioned: false,
          message: `Checklist is not for current stage. Current stage is ${currentStage}`
        };
      }
      
      // Mark checklist as completed/approved
      if (checklistType === 'prechecklist') {
        const preChecklistService = require('./preChecklistService').preChecklistService;
        await preChecklistService.approvePreChecklist(checklistId, userId);
      } else {
        const postChecklistService = require('./postChecklistService').postChecklistService;
        await postChecklistService.approvePostChecklist(checklistId, userId);
      }
      
      // Mark stage as completed
      await this.markStageAsCompleted(opportunityId, checklistType, {
        documentId: checklistId,
        completedBy: userId,
        notes: `${checklistType} completed${options?.skipApproval ? ' (auto-approved)' : ''}`
      });
      
      // Check if we should auto-transition
      const pattern = lifecycleUI.pattern;
      const currentIndex = pattern.indexOf(currentStage);
      
      if (currentIndex < pattern.length - 1) {
        const nextStage = pattern[currentIndex + 1];
        
        // Auto-transition to next stage without validation
        await this.transitionToStage(opportunityId, nextStage, {
          skipValidation: true,
          metadata: {
            triggeredBy: 'checklist-completion-auto',
            checklistId,
            completedBy: userId,
            autoTransition: true
          }
        });
        
        // If transitioning to jobcard stage, auto-create job card
        if (nextStage === 'jobcard') {
          await this.autoCreateJobCard(opportunityId);
        }
        
        return {
          checklistCompleted: true,
          stageTransitioned: true,
          nextStage,
          message: `${checklistType} completed and auto-transitioned to ${nextStage}${nextStage === 'jobcard' ? ' (job card auto-created)' : ''}`
        };
      }
      
      return {
        checklistCompleted: true,
        stageTransitioned: false,
        message: `${checklistType} completed (final stage)`
      };
      
    } catch (error) {
      console.error('Error completing checklist and transition:', error);
      throw error;
    }
  }

  public async fetchDocumentsForStages(opportunityId: string, stages: string[]): Promise<Record<string, any>> {
    const documents: Record<string, any> = {};
    
    try {
      // Fetch quotes
      if (stages.includes('quote')) {
        const quotes = await quoteService.getQuotesByOpportunity(opportunityId);
        if (quotes.length > 0) {
          documents.quote = quotes[0];
        }
      }
      
      // Fetch invoices
      if (stages.includes('invoice')) {
        const invoices = await invoiceService.getInvoicesByOpportunity(opportunityId);
        if (invoices.length > 0) {
          documents.invoice = invoices[0];
        }
      }
      
      // Fetch job cards (for work orders)
      if (stages.includes('jobcard')) {
        const jobCards = await jobCardService.getJobCardsByOpportunity(opportunityId);
        if (jobCards.length > 0) {
          documents.jobcard = jobCards[0];
        }
      }

      if (stages.includes('prechecklist')) {
      try {
        const preChecklistService = require('./preChecklistService').preChecklistService;
        const preChecklists = await preChecklistService.getPreChecklistsByOpportunity(opportunityId);
        if (preChecklists.length > 0) {
          // Sort by date and take the most recent one
          documents.prechecklist = preChecklists.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
        }
      } catch (error) {
        console.error('Error fetching pre-checklists:', error);
      }
    }
    
    // Fetch post-checklists
    if (stages.includes('postchecklist')) {
      try {
        const postChecklistService = require('./postChecklistService').postChecklistService;
        const postChecklists = await postChecklistService.getPostChecklistsByOpportunity(opportunityId);
        if (postChecklists.length > 0) {
          // Sort by date and take the most recent one
          documents.postchecklist = postChecklists.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
        }
      } catch (error) {
        console.error('Error fetching post-checklists:', error);
      }
    }
      
      // Note: Add other document types here (waivers, etc.)
      
      return documents;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return documents;
    }
  }

  private getStageDependencies(stage: string, pattern: string[]): string[] {
    const index = pattern.indexOf(stage);
    if (index > 0) {
      return [pattern[index - 1]]; // Depends on previous stage
    }
    return [];
  }
  
  private getStageDescription(stage: string, packageType: string): string {
    const descriptions: Record<string, string> = {
      'prechecklist': 'Complete pre-service inspection checklist',
      'jobcard': 'Create work instructions for technicians',
      'postchecklist': 'Complete post-service quality checklist',
      'invoice': 'Generate and send invoice for payment',
      'quote': 'Create and approve quotation'
    };
    
    if (packageType === 'sales_order') {
      const salesDescriptions: Record<string, string> = {
        'quote': 'Sales quotation for customer approval',
        'invoice': 'Sales invoice and track payment'
      };
      return salesDescriptions[stage] || descriptions[stage] || 'Process stage';
    }
    
    return descriptions[stage] || 'Process stage';
  }
  
  private getStageIcon(stage: string): string {
    const icons: Record<string, string> = {
      'quote': '📄',
      'waiver': '📝',
      'jobcard': '🔧',
      'prechecklist': '✅',
      'postchecklist': '📋',
      'invoice': '💰',
      'payment': '💳',
      'delivery': '🚚',
      'completion': '🏁'
    };
    return icons[stage] || '📌';
  }
  
  private getDocumentType(stage: string): string {
    const types: Record<string, string> = {
      'quote': 'Quote',
      'waiver': 'Waiver',
      'jobcard': 'Job Card',
      'prechecklist': 'Pre-Checklist',
      'postchecklist': 'Post-Checklist',
      'invoice': 'Invoice',
      'salesOrder': 'Sales Order',
      'workOrder': 'Work Order'
    };
    return types[stage] || 'Document';
  }
  
   private getWorkOrderStageConfig(stage: string): any {
    const configs: Record<string, any> = {
      'prechecklist': {
        label: 'Pre-Checklist',
        description: 'Complete pre-service inspection',
        icon: '✅',
        required: true,
        skippable: false,
        mandatory: true
      },
      'jobcard': {
        label: 'Job Card',
        description: 'Create detailed work instructions',
        icon: '🔧',
        required: true,
        skippable: false,
        mandatory: true
      },
      'postchecklist': {
        label: 'Post-Checklist',
        description: 'Quality check after service completion',
        icon: '📋',
        required: true,
        skippable: false,
        mandatory: true
      },
      'invoice': {
        label: 'Invoice',
        description: 'Generate final invoice',
        icon: '💰',
        required: true,
        skippable: false,
        mandatory: true
      }
    };
    return configs[stage] || { label: stage, description: '', icon: '📌', required: true, skippable: false, mandatory: true };
  }
  
  private getSalesOrderStageConfig(stage: string): any {
    const configs: Record<string, any> = {
      'quote': {
        label: 'Sales Quote',
        description: 'Sales quotation',
        icon: '📄',
        skippable: false
      },
      'invoice': {
        label: 'Sales Invoice',
        description: 'Sales invoice',
        icon: '💰',
        skippable: false
      }
    };
    return configs[stage] || { label: stage, description: '', icon: '📌', required: true, skippable: false };
  }
  
  private canTransitionToStage(stage: string, currentStage: string, pattern: string[], document?: any): boolean {
    // Can transition if this is the current stage and has required document
    if (stage !== currentStage) return false;
    
    // Check if document exists for this stage
    if (!document) return false;
    
    // Stage-specific validation
    switch (stage) {
      case 'quote':
        return document.status === 'approved';
      case 'jobcard':
        return document.status === 'active' || document.status === 'in_progress';
      case 'invoice':
        return document.status === 'draft' || document.status === 'sent';
      default:
        return true;
    }
  }
  
  private canWorkOrderTransition(stage: string, currentStage: string, document?: any): boolean {
    if (stage !== currentStage) return false;
    
    switch (stage) {
      case 'prechecklist':
        return document?.approved === true || 
               document?.inspectionItems?.every((item: any) => 
                 item.status === 'ok' || item.status === 'n/a'
               );
      case 'jobcard':
        return document?.status === 'completed' || document?.status === 'closed';
      case 'postchecklist':
        return document?.approved === true || 
               document?.inspectionItems?.every((item: any) => 
                 !item.required || item.status === 'completed' || item.status === 'n/a'
               );
      case 'invoice':
        return document?.status === 'sent' || document?.status === 'paid';
      default:
        return !!document;
    }
  }
  
  private canSalesOrderTransition(stage: string, currentStage: string, document?: any): boolean {
    if (stage !== currentStage) return false;
    
    // Sales-order specific transition rules
    switch (stage) {
      case 'quote':
        return document?.status === 'approved';
      case 'invoice':
        return document?.status === 'draft' || document?.status === 'sent';
      default:
        return !!document;
    }
  }

  
  
  private getStageActions(
    stage: string,
    completed: boolean,
    isCurrent: boolean,
    document: any,
    packageType: string
  ): any[] {
    const actions: any[] = [];
    const isWaiver = stage === 'waiver';
    
    // Check if we have a real document (not just a stage marked as complete)
    const hasRealDocument = document && document._id;
    
    // For completed stages with documents
    if (completed && hasRealDocument) {
      actions.push({
        label: 'View',
        action: 'view',
        color: 'blue',
        icon: 'eye'
      });
      
      // Show update option for certain stages that can be updated
      if (['jobcard', 'prechecklist', 'postchecklist', 'waiver'].includes(stage)) {
        actions.push({
          label: 'Update',
          action: 'update',
          color: 'yellow',
          icon: 'edit'
        });
      }
    } 
    // For current stage (not completed)
    else if (isCurrent) {
      
      // ============ WAIVER STAGE SPECIFIC LOGIC ============
      if (isWaiver) {
        // Always show create option for waiver when no document exists
        if (!hasRealDocument) {
          actions.push({
            label: 'Create Waiver',
            action: 'create',
            color: 'green',
            icon: 'file-plus',
            description: 'Generate and send waiver document'
          });
        } else {
          // If document exists, show view instead
          actions.push({
            label: 'View Waiver',
            action: 'view',
            color: 'blue',
            icon: 'eye'
          });
          
          // Show update option if waiver document exists
          actions.push({
            label: 'Update Waiver',
            action: 'update',
            color: 'yellow',
            icon: 'edit'
          });
        }
        
        // Show skip option for waiver when no document exists
        if (!hasRealDocument) {
          actions.push({
            label: 'Skip Waiver',
            action: 'skip',
            color: 'orange',
            icon: 'arrow-right',
            description: 'Continue without waiver document'
          });
        }
        
        // Show complete button - waiver can be marked complete with or without document
        if (this.isStageReadyForCompletion(stage, document, completed)) { // Fixed: added this.
          actions.push({
            label: hasRealDocument ? 'Mark Complete' : 'Skip & Complete',
            action: 'complete',
            color: hasRealDocument ? 'green' : 'gray',
            icon: 'check-circle',
            description: hasRealDocument ? 'Mark waiver as completed' : 'Skip and move to next stage'
          });
        }
      } 
      // ============ NON-WAIVER STAGES LOGIC ============
      else {
        // For other stages, show create button if no document exists
        if (!hasRealDocument) {
          actions.push({
            label: 'Create',
            action: 'create',
            color: 'green',
            icon: 'file-plus'
          });
        } else {
          // If document exists, show view
          actions.push({
            label: 'View',
            action: 'view',
            color: 'blue',
            icon: 'eye'
          });
          
          // Show update for certain document types
          if (['jobcard', 'prechecklist', 'postchecklist'].includes(stage)) {
            actions.push({
              label: 'Update',
              action: 'update',
              color: 'yellow',
              icon: 'edit'
            });
          }
        }
        
        // Show complete button only if stage is ready for completion
        if (this.isStageReadyForCompletion(stage, document, completed)) { // Fixed: added this.
          actions.push({
            label: 'Mark Complete',
            action: 'complete',
            color: 'green',
            icon: 'check-circle'
          });
        }
        
        // Special actions for specific stages
        if (stage === 'jobcard' && hasRealDocument) {
          if (document.status !== 'completed') {
            actions.push({
              label: 'Complete Details',
              action: 'completeDetails',
              color: 'purple',
              icon: 'wrench'
            });
          }
        }
        
        if ((stage === 'prechecklist' || stage === 'postchecklist') && hasRealDocument) {
          if (!document.completed) {
            actions.push({
              label: 'Mark Checklist Complete',
              action: 'markChecklistComplete',
              color: 'green',
              icon: 'check-square'
            });
          }
        }
      }
      
      // Show transition/next button if stage is ready
      if (hasRealDocument && this.isStageReadyForTransition(stage, document)) { // Fixed: added this.
        actions.push({
          label: 'Next Stage',
          action: 'transition',
          color: 'purple',
          icon: 'arrow-right'
        });
      }
    }
    
    // For non-current, non-completed stages with documents
    if (!isCurrent && !completed && hasRealDocument) {
      actions.push({
        label: 'View',
        action: 'view',
        color: 'gray',
        icon: 'eye'
      });
    }
    
    return actions;
  }

  private isStageReadyForCompletion(stage: string, document: any, completed: boolean): boolean {
    if (stage === 'waiver') {
      // Waiver can be marked complete even without document
      return true;
    }
    
    // For other stages, need a real document
    const hasRealDocument = document && document._id;
    if (!hasRealDocument) {
      return false;
    }
    
    // Check stage-specific completion criteria
    switch (stage) {
      case 'quote':
        return document.status === 'approved';
      case 'jobcard':
        return document.status === 'completed' || document.status === 'closed';
      case 'prechecklist':
      case 'postchecklist':
        return document.completed === true;
      case 'invoice':
        return document.status === 'sent' || document.status === 'paid';
      default:
        return !!document;
    }
  }

  private isStageReadyForTransition(stage: string, document: any): boolean {
    if (stage === 'waiver') {
      // Waiver is optional, so it's always ready for transition
      return true;
    }
    
    if (!document) {
      return false; // Other stages need a document
    }
    
    // Check stage-specific readiness
    switch (stage) {
      case 'quote':
        return document.status === 'approved';
      case 'jobcard':
        return document.status === 'completed' || document.status === 'closed';
      case 'prechecklist':
      case 'postchecklist':
        return document.completed === true;
      case 'invoice':
        return document.status === 'sent' || document.status === 'paid';
      default:
        return !!document;
    }
  }

  private getWorkOrderStageActions(
    stage: string,
    completed: boolean,
    isCurrent: boolean,
    document: any
  ): any[] {
    const actions = [];
    
    // Add debug logging
    console.log(`Stage: ${stage}, Completed: ${completed}, IsCurrent: ${isCurrent}, HasDoc: ${!!document}`);
    
    // For completed stages
    if (completed && document) {
      actions.push({
        label: 'View',
        action: 'view',
        color: 'blue',
        icon: 'eye',
        variant: 'outline'
      });
      
      // Allow updates for certain stages
      if (['prechecklist', 'postchecklist', 'jobcard'].includes(stage)) {
        actions.push({
          label: 'Update',
          action: 'update',
          color: 'yellow',
          icon: 'edit',
          variant: 'outline'
        });
      }
    }
    
    // For current stage (not completed)
    if (isCurrent) {
      // Create button if no document exists
      if (!document) {
        actions.push({
          label: this.getCreateButtonLabel(stage),
          action: 'create',
          color: 'green',
          icon: 'plus',
          variant: 'primary'
        });
      } else {
        // View/Edit for existing document
        actions.push({
          label: 'View',
          action: 'view',
          color: 'blue',
          icon: 'eye',
          variant: 'outline'
        });
        
        // Edit for certain stages
        if (['prechecklist', 'postchecklist', 'jobcard'].includes(stage)) {
          actions.push({
            label: 'Edit',
            action: 'edit',
            color: 'yellow',
            icon: 'edit',
            variant: 'outline'
          });
        }
        
        // Complete button if ready
        if (this.canWorkOrderTransition(stage, stage, document)) {
          actions.push({
            label: 'Complete',
            action: 'complete',
            color: 'green',
            icon: 'check-circle',
            variant: 'success'
          });
        }
        
        // Transition button for completed stages
        if (this.isStageReadyForTransition(stage, document)) {
          const nextStage = this.getNextStage(stage);
          actions.push({
            label: `Next: ${this.getStageLabel(nextStage)}`,
            action: 'transition',
            color: 'purple',
            icon: 'arrow-right',
            variant: 'primary'
          });
        }
      }
    }
    
    // Add approval-specific actions
    if (isCurrent && document && ['prechecklist', 'postchecklist'].includes(stage)) {
      if (!document.approved) {
        actions.push({
          label: 'Approve',
          action: 'approve',
          color: 'green',
          icon: 'check',
          variant: 'success'
        });
      }
    }
    
    return actions;
  }

  private getCreateButtonLabel(stage: string): string {
    const labels = {
      'prechecklist': 'Create Pre-Checklist',
      'jobcard': 'Create Job Card',
      'postchecklist': 'Create Post-Checklist',
      'invoice': 'Create Invoice'
    };
    return labels[stage] || `Create ${this.getStageLabel(stage)}`;
  }

  private getNextStage(stage: string): string {
    const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
    const index = pattern.indexOf(stage);
    return index < pattern.length - 1 ? pattern[index + 1] : '';
  }
    
  private getSalesOrderStageActions(
    stage: string,
    completed: boolean,
    isCurrent: boolean,
    document: any
  ): any[] {
    const actions = [];
    if (completed && document) {
      actions.push({
        label: 'View',
        action: 'view',
        color: 'blue'
      });
      
      if (stage === 'quote' && document.status !== 'approved') {
        actions.push({
          label: 'Approve',
          action: 'approve',
          color: 'green'
        });
      }
    } else if (isCurrent) {
      actions.push({
        label: 'Create',
        action: 'create',
        color: 'green'
      });
    }
    
    if (isCurrent && document) {
      // Check if ready for transition
      if (this.isStageReadyForTransition(stage, document)) { // Fixed: added this.
        actions.push({
          label: 'Next',
          action: 'transition',
          color: 'purple'
        });
      }
    }
    
    return actions;
  }
  
  private async validateCurrentStage(opportunityId: string, currentStage: string, documents: Record<string, any>): Promise<any> {
    const requirements = [];
    
    // Check if current stage has document
    if (!documents[currentStage]) {
      requirements.push(`${this.getStageLabel(currentStage)} document required`);
    } else {
      // Stage-specific validation
      switch (currentStage) {
        case 'quote':
          if (documents.quote?.status !== 'approved') {
            requirements.push('Quote needs approval');
          }
          break;
        case 'jobcard':
          if (!documents.jobcard?.assignedTo) {
            requirements.push('Job card needs technician assignment');
          }
          break;
        case 'invoice':
          if (documents.invoice?.status === 'unpaid') {
            requirements.push('Invoice payment pending');
          }
          break;
      }
    }
    
    return {
      isValid: requirements.length === 0,
      requirements
    };
  }
  
  private async validateWorkOrderStage(opportunityId: string, currentStage: string, documents: Record<string, any>): Promise<any> {
    const requirements = [];
    
    // Skip validation ONLY for waiver stage
    if (currentStage === 'waiver') {
      return {
        isValid: true,
        requirements: []
      };
    }
    
    // For all other stages, require document
    if (!documents[currentStage]) {
      requirements.push(`${this.getStageLabel(currentStage)} required`);
    } else {
      switch (currentStage) {
        case 'quote':
          if (documents.quote?.status !== 'approved') {
            requirements.push('Quote must be approved');
          }
          break;
        case 'jobcard':
          if (!documents.jobcard?.assignedTo) {
            requirements.push('Technician must be assigned');
          }
          if (documents.jobcard?.status === 'pending') {
            requirements.push('Job card must be started');
          }
          break;
        case 'prechecklist':
          if (!documents.prechecklist?.completed) {
            requirements.push('Pre-checklist must be completed');
          }
          break;
        case 'postchecklist':
          if (!documents.postchecklist?.completed) {
            requirements.push('Post-checklist must be completed');
          }
          break;
        case 'invoice':
          if (documents.invoice?.status === 'draft') {
            requirements.push('Invoice must be sent to customer');
          }
          break;
      }
    }
    
    return {
      isValid: requirements.length === 0,
      requirements
    };
  }
  
  public async validateStageCompletion(
    opportunityId: string, 
    stage: string, 
    document: any
  ): Promise<{ isValid: boolean; message?: string; requirements?: string[] }> {
    switch (stage) {
      case 'prechecklist':
        if (!document) {
          return { 
            isValid: false, 
            message: 'Pre-checklist document not found',
            requirements: ['Create pre-checklist document']
          };
        }
        
        const preChecklist = document;
        const isApproved = preChecklist.approved === true;
        const allItemsOk = preChecklist.inspectionItems?.every((item: any) => 
          item.status === 'ok' || item.status === 'n/a'
        ) || false;
        
        return {
          isValid: isApproved || allItemsOk,
          message: isApproved ? 'Checklist approved' : 
                   allItemsOk ? 'All items OK/N/A' : 'Items require attention',
          requirements: isApproved ? [] : ['Need approval or all items OK/N/A']
        };

      case 'jobcard':
        if (!document) {
          return { 
            isValid: false, 
            message: 'Job card not found',
            requirements: ['Create job card document']
          };
        }
        
        const jobCard = document;
        const isCompleted = jobCard.status === 'completed' || jobCard.status === 'closed';
        
        return {
          isValid: isCompleted,
          message: isCompleted ? 'Job card completed' : 'Job card in progress',
          requirements: isCompleted ? [] : ['Complete job card tasks']
        };

      case 'postchecklist':
        if (!document) {
          return { 
            isValid: false, 
            message: 'Post-checklist not found',
            requirements: ['Create post-checklist document']
          };
        }
        
        const postChecklist = document;
        const postApproved = postChecklist.approved === true;
        const allRequiredCompleted = postChecklist.inspectionItems?.every((item: any) => 
          !item.required || item.status === 'completed' || item.status === 'n/a'
        ) || false;
        
        return {
          isValid: postApproved || allRequiredCompleted,
          message: postApproved ? 'Checklist approved' : 
                   allRequiredCompleted ? 'Required items completed' : 'Required items pending',
          requirements: postApproved ? [] : ['Need approval or complete required items']
        };

      case 'invoice':
        if (!document) {
          return { 
            isValid: false, 
            message: 'Invoice not found',
            requirements: ['Create invoice document']
          };
        }
        
        const invoice = document;
        const isSentOrPaid = invoice.status === 'sent' || invoice.status === 'paid';
        
        return {
          isValid: isSentOrPaid,
          message: isSentOrPaid ? 'Invoice sent/paid' : 'Invoice pending',
          requirements: isSentOrPaid ? [] : ['Send or mark invoice as paid']
        };

      default:
        return { 
          isValid: false, 
          message: `Unknown stage: ${stage}`,
          requirements: ['Valid stage required']
        };
    }
  }

  async autoTransitionOnApproval(
  checklistId: string,
  checklistType: 'prechecklist' | 'postchecklist',
  approvedBy?: string
): Promise<{
  success: boolean;
  message: string;
  transition?: {
    fromStage: string;
    toStage: string;
    opportunityId: string;
  };
  errors?: string[];
}> {
  try {
    // 1. Get checklist and opportunity
    const checklist = checklistType === 'prechecklist' 
      ? await preChecklistService.getPreChecklistById(checklistId)
      : await postChecklistService.getPostChecklistById(checklistId);
    
    const opportunityId = typeof checklist.opportunityId === 'object' 
      ? checklist.opportunityId._id 
      : checklist.opportunityId;
    
    if (!opportunityId) {
      return {
        success: false,
        message: 'Opportunity not found',
        errors: ['No opportunity linked to checklist']
      };
    }

    // 2. Approve the checklist
    if (checklistType === 'prechecklist') {
      await preChecklistService.updatePreChecklist(checklistId, {
        approved: true,
        approvedBy: approvedBy || 'system',
        approvedAt: new Date().toISOString(),
        // Remove clientSignature if it doesn't exist in PostChecklist
        ...(checklistType === 'prechecklist' && { 
          clientSignature: (checklist as any).clientSignature || 'auto-approved' 
        })
      });
    } else {
      await postChecklistService.approvePostChecklist(checklistId, approvedBy);
    }

    // 3. Get current lifecycle state
    const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
    const currentStage = lifecycle.currentStage;
    
    // 4. Validate we're at the right stage
    if (currentStage !== checklistType) {
      return {
        success: false,
        message: `Not in ${checklistType} stage`,
        errors: [`Current stage is ${currentStage}`]
      };
    }

    // 5. Determine next stage
    const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
    const currentIndex = pattern.indexOf(currentStage);
    
    if (currentIndex >= pattern.length - 1) {
      return {
        success: false,
        message: 'Already at final stage',
        errors: ['No next stage available']
      };
    }

    const nextStage = pattern[currentIndex + 1];

    // 6. Perform transition
    await lifecycleService.transitionToStage(opportunityId, nextStage, {
      metadata: {
        triggeredBy: 'auto-approval',
        checklistId,
        checklistType,
        approvedBy,
        transitionedAt: new Date().toISOString()
      }
    });

    // 7. Auto-create documents for next stage if needed
    let autoCreatedDoc = null;
    if (nextStage === 'jobcard') {
      try {
        autoCreatedDoc = await jobCardService.createJobCard({
          opportunityId,
          jobTitle: `Job Card from ${checklistType}`,
          jobDescription: `Auto-generated from ${checklistType} approval`,
          status: 'pending', // Fixed: Use valid status
          priority: 'medium'
        });
      } catch (error) {
        console.warn('Failed to auto-create job card:', error);
      }
    }

    // 8. Update work order status - Fixed type error
    const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
    if (workOrders.length > 0) {
      const workOrder = workOrders[0];
      
      // Map stage names correctly
      let mappedStage: 'pre_checklist' | 'job_card' | 'post_checklist' | 'invoice';
      switch (nextStage) {
        case 'prechecklist': mappedStage = 'pre_checklist'; break;
        case 'jobcard': mappedStage = 'job_card'; break;
        case 'postchecklist': mappedStage = 'post_checklist'; break;
        case 'invoice': mappedStage = 'invoice'; break;
        default: mappedStage = 'pre_checklist';
      }
      
      await workOrderService.updateWorkOrder(workOrder._id, {
        currentStage: mappedStage,
        updatedAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      message: `Successfully approved ${checklistType} and transitioned to ${nextStage}`,
      transition: {
        fromStage: currentStage,
        toStage: nextStage,
        opportunityId
      }
    };

  } catch (error) {
    console.error(`Error in auto-transition for ${checklistType}:`, error);
    return {
      success: false,
      message: `Failed to process ${checklistType} approval`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

  // services/lifecycleIntegrationService.ts - ADD THESE METHODS TO THE CLASS

// Add these private methods to LifecycleIntegrationService class
  private async autoTransitionOnDocumentUpdate(
    documentType: string,
    documentId: string,
    updates: any
  ): Promise<{ success: boolean; nextStage?: string }> {
    try {
      let document: any;
      let opportunityId: string;
      
      // Get document and opportunity ID
      switch (documentType) {
        case 'prechecklist':
          document = await preChecklistService.getPreChecklistById(documentId);
          opportunityId = typeof document.opportunityId === 'object' 
            ? document.opportunityId._id 
            : document.opportunityId;
          break;
        case 'jobcard':
          document = await jobCardService.getJobCardById(documentId);
          opportunityId = typeof document.opportunityId === 'object'
            ? document.opportunityId._id
            : document.opportunityId;
          break;
        case 'postchecklist':
          document = await postChecklistService.getPostChecklistById(documentId);
          opportunityId = typeof document.opportunityId === 'object'
            ? document.opportunityId._id
            : document.opportunityId;
          break;
        case 'invoice':
          document = await invoiceService.getInvoiceById(documentId);
          opportunityId = typeof document.opportunityId === 'object'
            ? document.opportunityId._id
            : document.opportunityId;
          break;
        default:
          return { success: false };
      }
      
      if (!opportunityId) {
        return { success: false };
      }
      
      // Get current lifecycle state
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const currentStage = lifecycle.currentStage;
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      
      // Check if document triggers auto-transition
      const shouldTransition = await this.shouldAutoTransition(
        documentType,
        document,
        updates,
        currentStage
      );
      
      if (!shouldTransition) {
        return { success: false };
      }
      
      // Determine next stage
      const currentIndex = pattern.indexOf(currentStage);
      if (currentIndex < pattern.length - 1) {
        const nextStage = pattern[currentIndex + 1];
        
        // Perform transition
        await this.transitionToStage(opportunityId, nextStage, {
          skipValidation: true,
          metadata: {
            autoTransition: true,
            triggeredBy: `${documentType}-update`,
            documentId,
            documentType
          }
        });
        
        // Auto-create next document if needed
        await this.autoCreateNextDocument(opportunityId, nextStage, document);
        
        // Update work order current stage
        await this.updateWorkOrderStage(opportunityId, nextStage);
        
        return {
          success: true,
          nextStage
        };
      }
      
      // If at last stage (invoice), complete the work order
      if (currentStage === 'invoice' && updates.status === 'paid') {
        await this.completeWorkOrder(opportunityId);
        return {
          success: true,
          nextStage: 'complete'
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Auto-transition error:', error);
      return { success: false };
    }
  }

  private async shouldAutoTransition(
    documentType: string,
    document: any,
    updates: any,
    currentStage: string
  ): Promise<boolean> {
    // Only auto-transition if we're at the right stage
    if (currentStage !== documentType) {
      return false;
    }
    
    // Check document-specific conditions
    switch (documentType) {
      case 'prechecklist':
        // Auto-transition when prechecklist is approved OR all items are OK/N/A
        const isApproved = updates.approved === true || document.approved === true;
        const allItemsOk = document.inspectionItems?.every((item: any) => 
          item.status === 'ok' || item.status === 'n/a'
        ) || false;
        return isApproved || allItemsOk;
        
      case 'jobcard':
        // Auto-transition when job card is completed
        const isCompleted = updates.status === 'completed' || 
                          updates.status === 'closed' || 
                          document.status === 'completed' ||
                          document.status === 'closed';
        return isCompleted;
        
      case 'postchecklist':
        // Auto-transition when postchecklist is approved OR all required items completed
        const postApproved = updates.approved === true || document.approved === true;
        const allRequiredCompleted = document.inspectionItems?.every((item: any) => 
          !item.required || item.status === 'completed' || item.status === 'n/a'
        ) || false;
        return postApproved || allRequiredCompleted;
        
      case 'invoice':
        // Auto-transition when invoice is paid
        const isPaid = updates.status === 'paid' || 
                      updates.paid === true || 
                      document.status === 'paid';
        return isPaid;
        
      default:
        return false;
    }
  }

  private async autoCreateNextDocument(
    opportunityId: string,
    nextStage: string,
    previousDocument?: any
  ): Promise<void> {
    try {
      switch (nextStage) {
        case 'jobcard':
          // Check if job card already exists
          const existingJobCards = await jobCardService.getJobCardsByOpportunity(opportunityId);
          if (existingJobCards.length === 0) {
            await this.autoCreateJobCard(opportunityId);
          }
          break;
          
        case 'postchecklist':
          // Check if post-checklist already exists
          const existingPostChecklists = await postChecklistService.getPostChecklistsByOpportunity(opportunityId);
          if (existingPostChecklists.length === 0) {
            await this.autoCreateChecklistIfNeeded(opportunityId, 'postchecklist');
          }
          break;
          
        case 'invoice':
          // Check if invoice already exists
          const existingInvoices = await invoiceService.getInvoicesByOpportunity(opportunityId);
          if (existingInvoices.length === 0) {
            await this.autoCreateInvoice(opportunityId);
          }
          break;
      }
    } catch (error) {
      console.error('Auto-create document error:', error);
      // Don't throw - continue even if auto-creation fails
    }
  }

  private async autoCreateInvoice(opportunityId: string): Promise<void> {
  try {
    // Check if invoice already exists
    const existingInvoices = await invoiceService.getInvoicesByOpportunity(opportunityId);
    if (existingInvoices.length > 0) {
      return;
    }
    
    // Get work order details
    const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
    const workOrder = workOrders[0];
    
    if (!workOrder) {
      return;
    }
    
    // Get opportunity for customer info
    const opportunity = await opportunityService.getOpportunityById(opportunityId);
    
    // Get customer ID from work order or opportunity
    let customerId: string | undefined;
    
    // Check work order for customer info
    if ((workOrder as any).customerId) {
      customerId = typeof (workOrder as any).customerId === 'object' 
        ? (workOrder as any).customerId._id 
        : (workOrder as any).customerId;
    }
    // Check opportunity for customer info
    else if (typeof opportunity === 'object' && opportunity.customer) {
      customerId = typeof opportunity.customer === 'object' 
        ? opportunity.customer._id 
        : opportunity.customer;
    }
    
    // Create invoice data
    const invoiceData = {
      opportunityId,
      workOrderId: workOrder._id,
      customerId: customerId || '',
      amount: workOrder.totalCost || 0,
      status: 'draft' as const,
      items: [
        {
          description: `Labor - ${workOrder.workOrderNumber || 'Work order'}`,
          quantity: 1,
          unitPrice: workOrder.laborCost || 0,
          total: workOrder.laborCost || 0
        },
        {
          description: 'Parts and materials',
          quantity: 1,
          unitPrice: workOrder.partsCost || 0,
          total: workOrder.partsCost || 0
        }
      ]
    };
    
    await invoiceService.createInvoice(invoiceData);
  } catch (error) {
    console.error('Error auto-creating invoice:', error);
  }
}

  private async updateWorkOrderStage(opportunityId: string, stage: string): Promise<void> {
  try {
    const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
    if (workOrders.length > 0) {
      const workOrder = workOrders[0];
      
      // Map stage names to work order stage format
      let mappedStage: 'pre_checklist' | 'job_card' | 'post_checklist' | 'invoice';
      switch (stage) {
        case 'prechecklist': mappedStage = 'pre_checklist'; break;
        case 'jobcard': mappedStage = 'job_card'; break;
        case 'postchecklist': mappedStage = 'post_checklist'; break;
        case 'invoice': mappedStage = 'invoice'; break;
        default: mappedStage = 'pre_checklist';
      }
      
      await workOrderService.updateWorkOrder(workOrder._id, {
        currentStage: mappedStage,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating work order stage:', error);
  }
}

  // Public method to handle document updates with auto-transition
  public async handleDocumentUpdateWithAutoTransition(
    documentType: 'prechecklist' | 'jobcard' | 'postchecklist' | 'invoice',
    documentId: string,
    updates: any
  ): Promise<{
    documentUpdated: boolean;
    autoTransitioned: boolean;
    nextStage?: string;
    message: string;
  }> {
    try {
      // Update the document first
      let updatedDocument: any;
      switch (documentType) {
        case 'prechecklist':
          updatedDocument = await preChecklistService.updatePreChecklist(documentId, updates);
          break;
        case 'jobcard':
          updatedDocument = await jobCardService.updateJobCard(documentId, updates);
          break;
        case 'postchecklist':
          updatedDocument = await postChecklistService.updatePostChecklist(documentId, updates);
          break;
        case 'invoice':
          updatedDocument = await invoiceService.updateInvoice(documentId, updates);
          break;
      }
      
      // Check for auto-transition
      const transitionResult = await this.autoTransitionOnDocumentUpdate(
        documentType,
        documentId,
        updates
      );
      
      return {
        documentUpdated: true,
        autoTransitioned: transitionResult.success,
        nextStage: transitionResult.nextStage,
        message: transitionResult.success
          ? `Document updated and auto-transitioned to ${transitionResult.nextStage}`
          : 'Document updated'
      };
    } catch (error) {
      console.error('Error handling document update:', error);
      throw error;
    }
  }

  // One-click completion methods
  public async oneClickCompleteStage(
    opportunityId: string,
    stage: string,
    userId?: string
  ): Promise<{
    success: boolean;
    message: string;
    nextStage?: string;
    autoCreatedDocument?: any;
  }> {
    try {
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const currentIndex = pattern.indexOf(stage);
      
      if (currentIndex === -1) {
        throw new Error(`Invalid stage: ${stage}`);
      }
      
      // Get current documents
      const documents = await this.fetchDocumentsForStages(opportunityId, [stage]);
      const document = documents[stage];
      
      if (!document) {
        // Auto-create document if it doesn't exist
        const createdDoc = await this.autoCreateDocumentForStage(opportunityId, stage, userId);
        
        // For prechecklist and postchecklist, auto-approve
        if (stage === 'prechecklist' || stage === 'postchecklist') {
          await this.autoApproveChecklist(createdDoc._id, stage, userId);
        }
        
        // For jobcard, mark as completed
        if (stage === 'jobcard') {
          await jobCardService.updateJobCard(createdDoc._id, {
            status: 'completed',
            completedAt: new Date().toISOString()
          });
        }
        
        // For invoice, mark as paid
        if (stage === 'invoice') {
          await invoiceService.updateInvoice(createdDoc._id, {
            paymentStatus: 'paid',
            paidAt: new Date().toISOString()
          });
        }
      } else {
        // Update existing document to completed state
        await this.markDocumentAsCompleted(document._id, stage, userId);
      }
      
      // Auto-transition to next stage
      const nextStage = currentIndex < pattern.length - 1 ? pattern[currentIndex + 1] : null;
      
      if (nextStage) {
        await this.transitionToStage(opportunityId, nextStage, {
          skipValidation: true,
          metadata: {
            oneClickComplete: true,
            completedStage: stage,
            completedBy: userId || 'system'
          }
        });
        
        // Auto-create next document
        let autoCreatedDoc = null;
        if (nextStage === 'jobcard' || nextStage === 'postchecklist' || nextStage === 'invoice') {
          autoCreatedDoc = await this.autoCreateDocumentForStage(opportunityId, nextStage, userId);
        }
        
        return {
          success: true,
          message: `Stage ${stage} completed and moved to ${nextStage}`,
          nextStage,
          autoCreatedDocument: autoCreatedDoc
        };
      } else {
        // Complete the lifecycle
        await this.completeWorkOrder(opportunityId);
        return {
          success: true,
          message: 'Work order completed',
          nextStage: 'complete'
        };
      }
    } catch (error) {
      console.error('One-click completion error:', error);
      throw error;
    }
  }

  private async autoCreateDocumentForStage(
    opportunityId: string,
    stage: string,
    userId?: string
  ): Promise<any> {
    switch (stage) {
      case 'prechecklist':
        return await this.autoCreateChecklistIfNeeded(opportunityId, 'prechecklist', userId);
      case 'jobcard':
        return await this.autoCreateJobCard(opportunityId);
      case 'postchecklist':
        return await this.autoCreateChecklistIfNeeded(opportunityId, 'postchecklist', userId);
      case 'invoice':
        return await this.autoCreateInvoice(opportunityId);
      default:
        throw new Error(`Cannot auto-create document for stage: ${stage}`);
    }
  }

  private async autoApproveChecklist(
    checklistId: string,
    checklistType: 'prechecklist' | 'postchecklist',
    userId?: string
  ): Promise<void> {
    if (checklistType === 'prechecklist') {
      await preChecklistService.updatePreChecklist(checklistId, {
        approved: true,
        approvedBy: userId || 'system-auto',
        approvedAt: new Date().toISOString(),
        clientSignature: 'auto-approved'
      });
    } else {
      await postChecklistService.updatePostChecklist(checklistId, {
        approved: true,
        approvedBy: userId || 'system-auto',
        approvedAt: new Date().toISOString()
      });
    }
  }

  private async markDocumentAsCompleted(
    documentId: string,
    documentType: string,
    userId?: string
  ): Promise<void> {
    switch (documentType) {
      case 'prechecklist':
        await preChecklistService.updatePreChecklist(documentId, {
          approved: true,
          approvedBy: userId || 'system',
          approvedAt: new Date().toISOString()
        });
        break;
      case 'jobcard':
        await jobCardService.updateJobCard(documentId, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        break;
      case 'postchecklist':
        await postChecklistService.updatePostChecklist(documentId, {
          approved: true,
          approvedBy: userId || 'system',
          approvedAt: new Date().toISOString()
        });
        break;
      case 'invoice':
        await invoiceService.updateInvoice(documentId, {
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
        });
        break;
    }
  }

  // Method to get enhanced workflow UI with auto-transition status
  public async getEnhancedWorkflowUIWithAutoTransition(opportunityId: string): Promise<any> {
    const workflowUI = await this.getEnhancedWorkflowUI(opportunityId);
    
    // Add auto-transition information to each stage
    const enhancedStages = workflowUI.stages.map((stage: any) => {
      const canAutoTransition = this.canStageAutoTransition(stage);
      const willAutoTransition = this.willStageAutoTransition(stage);
      
      return {
        ...stage,
        canAutoTransition,
        willAutoTransition,
        autoTransitionDescription: this.getAutoTransitionDescription(stage),
        autoTransitionTime: this.getAutoTransitionTime(stage)
      };
    });
    
    return {
      ...workflowUI,
      stages: enhancedStages
    };
  }

  private canStageAutoTransition(stage: any): boolean {
    if (!stage.document) return false;
    
    switch (stage.stage) {
      case 'prechecklist':
        return stage.document.approved || 
              stage.document.inspectionItems?.every((item: any) => 
                item.status === 'ok' || item.status === 'n/a'
              );
      case 'jobcard':
        return stage.document.status === 'completed' || stage.document.status === 'closed';
      case 'postchecklist':
        return stage.document.approved || 
              stage.document.inspectionItems?.every((item: any) => 
                !item.required || item.status === 'completed' || item.status === 'n/a'
              );
      case 'invoice':
        return stage.document.status === 'paid';
      default:
        return false;
    }
  }

  private willStageAutoTransition(stage: any): boolean {
    // Returns true if auto-transition is enabled for this stage type
    const autoTransitionStages = ['prechecklist', 'jobcard', 'postchecklist', 'invoice'];
    return autoTransitionStages.includes(stage.stage) && stage.isCurrent;
  }

  private getAutoTransitionDescription(stage: any): string {
    switch (stage.stage) {
      case 'prechecklist':
        return 'Will auto-transition to Job Card when approved';
      case 'jobcard':
        return 'Will auto-transition to Post-Checklist when completed';
      case 'postchecklist':
        return 'Will auto-transition to Invoice when approved';
      case 'invoice':
        return 'Will auto-complete work order when paid';
      default:
        return '';
    }
  }

  private getAutoTransitionTime(stage: any): string {
    switch (stage.stage) {
      case 'prechecklist':
      case 'postchecklist':
        return 'Immediately upon approval';
      case 'jobcard':
        return 'Immediately upon completion';
      case 'invoice':
        return 'Immediately upon payment';
      default:
        return '';
    }
  }

  async getEnhancedWorkflowUI(opportunityId: string) {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      if (lifecycle.packageType !== 'work_order') {
        throw new Error('Not a work order');
      }

      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern);
      
      const stages = await Promise.all(pattern.map(async (stageName, index) => {
        const lifecycleStage = lifecycle.stages?.find((s: any) => s.stage === stageName);
        const document = documents[stageName];
        
        // Get validation status
        const validation = await this.validateStageCompletion(opportunityId, stageName, document);
        
        // Determine if stage is truly completed
        const isCompleted = this.isStageCompleted(stageName, document, lifecycleStage);
        
        // Determine if stage is current
        const isCurrent = lifecycle.currentStage === stageName;
        
        // Get stage-specific configuration
        const stageConfig = this.getWorkOrderStageConfig(stageName);
        
        // Build actions based on status
        const actions = this.buildStageActions(
          stageName, 
          isCompleted, 
          isCurrent, 
          document, 
          validation.isValid
        );

        return {
          stage: stageName,
          label: stageConfig.label,
          description: stageConfig.description,
          icon: stageConfig.icon,
          completed: isCompleted,
          isCurrent,
          canTransition: validation.isValid,
          document,
          documentId: document?._id || document?.id || '',
          documentType: this.getDocumentType(stageName),
          actions,
          required: stageConfig.required,
          skippable: stageConfig.skippable,
          validation,
          progress: this.calculateStageProgress(stageName, document),
          status: this.determineStageStatus(isCompleted, isCurrent, validation.isValid),
          statusColor: this.getStatusColor(stageName, isCompleted, isCurrent, validation.isValid),
          nextAction: this.getNextAction(stageName, isCompleted, document),
          dependencies: this.getStageDependencies(stageName, pattern),
          index: index + 1,
          totalStages: pattern.length
        };
      }));

      // Calculate overall progress
      const completedStages = stages.filter(s => s.completed).length;
      const totalStages = stages.length;
      const progressPercentage = Math.round((completedStages / totalStages) * 100);

      // Find next actionable stage
      const currentStage = stages.find(s => s.isCurrent);
      const nextStage = stages.find(s => !s.completed && s.index > (currentStage?.index || 0));

      return {
        stages,
        progress: {
          percentage: progressPercentage,
          completedStages,
          totalStages,
          currentStage: lifecycle.currentStage,
          nextStage: nextStage?.stage,
          isComplete: lifecycle.currentStage === 'invoice' && 
                     stages.every(s => s.completed || s.stage === 'invoice')
        },
        currentStageDetails: currentStage,
        canTransition: stages.some(s => s.isCurrent && s.canTransition),
        packageType: 'work_order',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting enhanced workflow UI:', error);
      throw error;
    }
  }

  private isStageCompleted(stageName: string, document: any, lifecycleStage: any): boolean {
    const lifecycleCompleted = lifecycleStage?.completed || false;
    
    if (!lifecycleCompleted) return false;
    
    switch (stageName) {
      case 'prechecklist':
        return document?.approved || 
               document?.inspectionItems?.every((item: any) => 
                 item.status === 'ok' || item.status === 'n/a'
               ) || false;
      case 'jobcard':
        return document?.status === 'completed' || document?.status === 'closed';
      case 'postchecklist':
        return document?.approved || 
               document?.inspectionItems?.every((item: any) => 
                 !item.required || item.status === 'completed' || item.status === 'n/a'
               ) || false;
      case 'invoice':
        return document?.status === 'sent' || document?.status === 'paid';
      default:
        return !!document;
    }
  }

  private determineStageStatus(
    completed: boolean, 
    isCurrent: boolean, 
    canTransition: boolean
  ): string {
    if (completed) return 'completed';
    if (isCurrent && canTransition) return 'ready';
    if (isCurrent && !canTransition) return 'in_progress';
    return 'pending';
  }

  private getStatusColor(
    stage: string, 
    completed: boolean, 
    isCurrent: boolean, 
    canTransition: boolean
  ): string {
    if (completed) return 'green';
    if (isCurrent && canTransition) return 'blue';
    if (isCurrent && !canTransition) return 'yellow';
    return 'gray';
  }

  private buildStageActions(
    stage: string,
    completed: boolean,
    isCurrent: boolean,
    document: any,
    canTransition: boolean
  ): Array<{
    label: string;
    action: string;
    color: string;
    description: string;
    disabled?: boolean;
    icon?: string;
  }> {
    const actions = [];

    // Common actions for all stages
    if (document) {
      actions.push({
        label: 'View',
        action: 'view',
        color: 'blue',
        description: `View ${this.getStageLabel(stage)} document`,
        icon: 'eye'
      });

      if (['prechecklist', 'postchecklist', 'jobcard'].includes(stage) && !completed) {
        actions.push({
          label: 'Edit',
          action: 'edit',
          color: 'yellow',
          description: `Edit ${this.getStageLabel(stage)}`,
          icon: 'edit'
        });
      }
    }

    // Current stage specific actions
    if (isCurrent) {
      if (!document) {
        actions.push({
          label: 'Create',
          action: 'create',
          color: 'green',
          description: `Create ${this.getStageLabel(stage)}`,
          icon: 'plus'
        });
      }

      if (document && canTransition && !completed) {
        actions.push({
          label: 'Complete & Next',
          action: 'complete_and_next',
          color: 'purple',
          description: `Complete ${this.getStageLabel(stage)} and move to next stage`,
          icon: 'arrow-right'
        });
      }

      // Approval actions for checklists
      if ((stage === 'prechecklist' || stage === 'postchecklist') && document && !document.approved) {
        actions.push({
          label: 'Approve',
          action: 'approve',
          color: 'green',
          description: `Approve ${this.getStageLabel(stage)}`,
          icon: 'check-circle'
        });
      }
    }

    // Add transition action if current stage can transition
    if (isCurrent && canTransition && completed) {
      actions.push({
        label: 'Next Stage',
        action: 'transition',
        color: 'purple',
        description: 'Move to next workflow stage',
        icon: 'arrow-right'
      });
    }

    return actions;
  }

  private calculateStageProgress(stage: string, document: any): number {
    if (!document) return 0;

    switch (stage) {
      case 'prechecklist':
        const preItems = document.inspectionItems || [];
        const preCompleted = preItems.filter((item: any) => 
          item.status === 'ok' || item.status === 'n/a'
        ).length;
        return preItems.length > 0 ? Math.round((preCompleted / preItems.length) * 100) : 0;

      case 'jobcard':
        return document.status === 'completed' ? 100 : 
               document.status === 'in_progress' ? 50 : 0;

      case 'postchecklist':
        const postItems = document.inspectionItems || [];
        const postRequired = postItems.filter((item: any) => item.required);
        const postCompleted = postRequired.filter((item: any) => 
          item.status === 'completed' || item.status === 'n/a'
        ).length;
        return postRequired.length > 0 ? Math.round((postCompleted / postRequired.length) * 100) : 0;

      case 'invoice':
        return document.status === 'paid' ? 100 : 
               document.status === 'sent' ? 75 : 0;

      default:
        return document ? 50 : 0;
    }
  }

  private getNextAction(stage: string, completed: boolean, document: any): string {
    if (completed) {
      switch (stage) {
        case 'prechecklist': return 'Create Job Card';
        case 'jobcard': return 'Create Post-Checklist';
        case 'postchecklist': return 'Create Invoice';
        case 'invoice': return 'Complete Work Order';
        default: return 'Move to Next Stage';
      }
    }

    if (!document) {
      return `Create ${this.getStageLabel(stage)}`;
    }

    switch (stage) {
      case 'prechecklist':
        return document.approved ? 'Ready for Job Card' : 'Approve Checklist';
      case 'jobcard':
        return document.status === 'completed' ? 'Ready for Post-Checklist' : 'Complete Job Card';
      case 'postchecklist':
        return document.approved ? 'Ready for Invoice' : 'Approve Checklist';
      case 'invoice':
        return document.status === 'paid' ? 'Complete Work Order' : 
               document.status === 'sent' ? 'Mark as Paid' : 'Send Invoice';
      default:
        return 'Continue';
    }
  }

  async initializeWorkOrderLifecycle(opportunityId: string): Promise<any> {
    try {
      return await lifecycleService.initializeOpportunity(opportunityId, {
        packageType: 'work_order'
      });
    } catch (error) {
      console.error('Error initializing work order lifecycle:', error);
      throw error;
    }
  }
  
  private isStageSkippable(stage: string, packageType: string): boolean {
    if (packageType === 'work_order') {
      return stage === 'waiver';
    }
    return false;
  }
  
  private async autoCreateJobCard(opportunityId: string): Promise<void> {
    try {
      // Check if job card already exists
      const existingJobCards = await jobCardService.getJobCardsByOpportunity(opportunityId);
      if (existingJobCards.length > 0) {
        return;
      }

      // Get opportunity details
      const opportunity = await opportunityService.getOpportunityById(opportunityId);

      // Get work order
      const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
      const workOrder = workOrders[0];

      if (!workOrder) {
        throw new Error('No work order found for opportunity');
      }

      // Get vehicle ID from opportunity or work order
      let vehicleId = '';
      if ((opportunity as any).vehicleId) {
        vehicleId = typeof (opportunity as any).vehicleId === 'object' 
          ? (opportunity as any).vehicleId._id 
          : (opportunity as any).vehicleId;
      } else if ((workOrder as any).vehicleId) {
        vehicleId = typeof (workOrder as any).vehicleId === 'object'
          ? (workOrder as any).vehicleId._id
          : (workOrder as any).vehicleId;
      }

      // Get assignedTo from work order
      let assignedTo = '';
      if (workOrder.assignedTo) {
        assignedTo = typeof workOrder.assignedTo === 'object' 
          ? workOrder.assignedTo._id 
          : workOrder.assignedTo;
      }

      // Create job card with correct data structure
      const jobCardData = {
        opportunityId,
        vehicleId: vehicleId || '',
        jobTitle: `Job Card for ${(opportunity as any).subject || 'Work Order'}`,
        jobDescription: (opportunity as any).notes || 'Service work required',
        assignedTo: assignedTo || '',
        priority: ((workOrder as any).priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        estimatedHours: workOrder.estimatedHours || 0,
        status: 'pending' as const // Use valid status
      };

      await jobCardService.createJobCard(jobCardData);
    } catch (error) {
      console.error('Error auto-creating job card:', error);
      // Don't throw error - this shouldn't block the transition
    }
  }
}

export const lifecycleIntegrationService = new LifecycleIntegrationService();