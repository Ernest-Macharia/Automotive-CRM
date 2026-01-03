import { lifecycleService, LifecycleStatus, WorkflowDefinition } from './lifecycleService';
import { workOrderService, WorkOrder } from './workOrderService';
import { salesOrderService, SalesOrder } from './salesOrderService';
import { opportunityService, Opportunity } from './opportunityService';
import { quoteService, Quote } from './quoteService';
import { invoiceService, Invoice } from './invoiceService';
import { jobCardService, JobCard } from './jobCardService';
import { preChecklistService, PreChecklist } from './preChecklistService';
import { postChecklistService, PostChecklist } from './postChecklistService';

// If your services don't export these types, define them locally
export interface LifecycleStageUI {
  stage: string;
  label: string;
  description: string;
  icon: string;
  completed: boolean;
  isCurrent: boolean;
  canTransition: boolean;
  document: any | null;
  documentId?: string;
  documentType?: string;
  actions: Array<{
    label: string;
    action: string;
    icon: string;
    disabled: boolean;
    color: string;
  }>;
}

export interface LifecycleProgress {
  percentage: number;
  completedStages: number;
  totalStages: number;
  currentStage: string;
  nextStage: string | null;
  isComplete: boolean;
}

export interface StageTransitionOptions {
  metadata?: Record<string, any>;
  skipValidation?: boolean;
  force?: boolean;
}

export interface LifecycleAnalytics {
  totalDuration: number;
  stageDurations: Record<string, number>;
  bottlenecks: string[];
  efficiencyScore: number;
}

export interface LifecycleContext {
  opportunityId: string;
  packageType: 'work_order' | 'sales_order';
  currentStage: string;
  stages: Array<{
    stage: string;
    label: string;
    description: string;
    completed: boolean;
    canTransition: boolean;
    document: any;
    required: boolean;
  }>;
  metadata: {
    workOrder?: any;
    salesOrder?: any;
    quote?: any;
    invoice?: any;
    jobcard?: any;
    prechecklist?: any;
    postchecklist?: any;
  };
}

// Define types for service responses if needed
interface ValidationResponse {
  isValid: boolean;
  missingRequirements: string[];
  warnings?: string[];
}

interface DurationData {
  totalDuration: number;
  averageStageDuration: number;
  stages: Array<{
    stage: string;
    duration: number;
    completed: boolean;
  }>;
}

class LifecycleIntegrationService {
  
  // Initialize lifecycle for opportunity
  async initializeOpportunityLifecycle(
    opportunityId: string, 
    packageType: 'work_order' | 'sales_order'
  ): Promise<LifecycleStatus> {
    try {
      // Initialize lifecycle
      const result = await lifecycleService.initializeOpportunity(
        opportunityId, 
        { packageType }
      );
      
      return await lifecycleService.getOpportunityLifecycle(opportunityId);
    } catch (error) {
      console.error('Error initializing lifecycle:', error);
      throw error;
    }
  }

  async getWorkOrderLifecycleUI(opportunityId: string): Promise<{
    stages: LifecycleStageUI[];
    progress: LifecycleProgress;
    canTransition: boolean;
    validation: {
      isValid: boolean;
      requirements: string[];
    };
  }> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const workflow = await lifecycleService.getWorkflowStages(lifecycle.packageType);
      
      // Get all related documents
      const documents = await this.fetchAllDocuments(opportunityId, lifecycle.packageType);
      
      // Define work order stages in correct order
      const workOrderStages = ['quote', 'waiver', 'jobcard', 'prechecklist', 'postchecklist', 'invoice'];
      
      // Build UI stages
      const stages = workOrderStages.map((stageName: string) => {
        const lifecycleStage = lifecycle.stages.find((s: any) => s.stage === stageName);
        const document = documents[stageName];
        const workflowStage = workflow.stages.find((s: any) => s.stage === stageName) || { 
          label: this.formatStageLabel(stageName),
          description: this.getStageDescription(stageName, lifecycle.packageType)
        };
        
        return {
          stage: stageName,
          label: workflowStage.label,
          description: workflowStage.description,
          icon: this.getStageIcon(stageName, lifecycle.packageType),
          completed: lifecycleStage?.completed || false,
          isCurrent: lifecycle.currentStage === stageName,
          canTransition: lifecycleStage?.canTransition || false,
          document: document || null,
          documentId: document?._id || document?.id,
          documentType: this.getDocumentType(stageName),
          actions: this.getWorkOrderStageActions(
            stageName,
            lifecycleStage?.completed || false,
            lifecycle.currentStage === stageName,
            document,
            lifecycle.packageType
          )
        };
      });
      
      // Calculate progress
      const completedStages = stages.filter(s => s.completed).length;
      const nextStage = this.getNextStage(lifecycle.currentStage, lifecycle.packageType);
      const progress: LifecycleProgress = {
        percentage: Math.round((completedStages / stages.length) * 100),
        completedStages,
        totalStages: stages.length,
        currentStage: lifecycle.currentStage,
        nextStage,
        isComplete: lifecycle.currentStage === stages[stages.length - 1].stage
      };
      
      // Validation
      const validation = await lifecycleService.validateOpportunityForTransition(opportunityId) as ValidationResponse;
      
      return {
        stages,
        progress,
        canTransition: stages.some(s => s.canTransition),
        validation: {
          isValid: validation.isValid,
          requirements: validation.missingRequirements || []
        }
      };
    } catch (error) {
      console.error('Error getting work order lifecycle UI:', error);
      throw error;
    }
  }

  private getWorkOrderStageActions(
    stage: string, 
    completed: boolean, 
    isCurrent: boolean, 
    document: any,
    packageType: 'work_order' | 'sales_order'
  ): Array<{
    label: string;
    action: string;
    icon: string;
    disabled: boolean;
    color: string;
  }> {
    const actions = [];
    
    if (completed && document) {
      actions.push({
        label: 'View',
        action: 'view',
        icon: '👁️',
        disabled: false,
        color: 'blue'
      });
      
      if (stage === 'jobcard' && document.status !== 'completed') {
        actions.push({
          label: 'Update',
          action: 'update',
          icon: '✏️',
          disabled: false,
          color: 'yellow'
        });
      }
    } else if (isCurrent) {
      actions.push({
        label: 'Create',
        action: 'create',
        icon: '➕',
        disabled: false,
        color: 'green'
      });
      
      // Allow skipping certain stages (except quote and invoice)
      if (['waiver', 'prechecklist', 'postchecklist'].includes(stage)) {
        actions.push({
          label: 'Skip',
          action: 'skip',
          icon: '⏭️',
          disabled: false,
          color: 'gray'
        });
      }
    }
    
    // Add transition action for current stage if document exists
    if (isCurrent && document) {
      actions.push({
        label: 'Next',
        action: 'transition',
        icon: '➡️',
        disabled: false,
        color: 'purple'
      });
    }
    
    return actions;
  }
  
  // Get enhanced lifecycle UI data for display
  async getLifecycleUI(opportunityId: string): Promise<{
    stages: LifecycleStageUI[];
    progress: LifecycleProgress;
    canTransition: boolean;
    validation: {
      isValid: boolean;
      requirements: string[];
    };
  }> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const workflow = await lifecycleService.getWorkflowStages(lifecycle.packageType);
      
      // Get all related documents
      const documents = await this.fetchAllDocuments(opportunityId, lifecycle.packageType);
      
      // Build UI stages
      const stages = workflow.stages.map((workflowStage: any) => {
        const lifecycleStage = lifecycle.stages.find((s: any) => s.stage === workflowStage.stage);
        const document = documents[workflowStage.stage];
        
        return {
          stage: workflowStage.stage,
          label: workflowStage.label || this.formatStageLabel(workflowStage.stage),
          description: workflowStage.description || this.getStageDescription(workflowStage.stage, lifecycle.packageType),
          icon: this.getStageIcon(workflowStage.stage, lifecycle.packageType),
          completed: lifecycleStage?.completed || false,
          isCurrent: lifecycle.currentStage === workflowStage.stage,
          canTransition: lifecycleStage?.canTransition || false,
          document: document || null,
          documentId: document?._id || document?.id,
          documentType: this.getDocumentType(workflowStage.stage),
          actions: this.getStageActions(
            workflowStage.stage, 
            lifecycleStage?.completed || false, 
            lifecycle.currentStage === workflowStage.stage, 
            document,
            lifecycle.packageType
          )
        };
      });
      
      // Calculate progress
      const completedStages = stages.filter(s => s.completed).length;
      const nextStage = this.getNextStage(lifecycle.currentStage, lifecycle.packageType);
      const progress: LifecycleProgress = {
        percentage: Math.round((completedStages / stages.length) * 100),
        completedStages,
        totalStages: stages.length,
        currentStage: lifecycle.currentStage,
        nextStage,
        isComplete: lifecycle.currentStage === stages[stages.length - 1].stage
      };
      
      // Validation
      const validation = await lifecycleService.validateOpportunityForTransition(opportunityId) as ValidationResponse;
      
      return {
        stages,
        progress,
        canTransition: stages.some(s => s.canTransition),
        validation: {
          isValid: validation.isValid,
          requirements: validation.missingRequirements || []
        }
      };
    } catch (error) {
      console.error('Error getting lifecycle UI:', error);
      throw error;
    }
  }
  
  // Get enhanced sales order lifecycle UI
  async getSalesOrderLifecycleUI(opportunityId: string): Promise<{
    stages: LifecycleStageUI[];
    progress: LifecycleProgress;
    canTransition: boolean;
    validation: {
      isValid: boolean;
      requirements: string[];
    };
    nextActions: Array<{
      label: string;
      action: () => Promise<void>;
      icon: string;
    }>;
  }> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const workflow = await lifecycleService.getWorkflowStages('sales_order');
      
      // Get related documents
      const documents = await this.fetchAllDocuments(opportunityId, 'sales_order');
      
      // Build UI stages
      const stages = workflow.stages.map((workflowStage: any) => {
        const lifecycleStage = lifecycle.stages.find((s: any) => s.stage === workflowStage.stage);
        const document = documents[workflowStage.stage];
        
        return {
          stage: workflowStage.stage,
          label: workflowStage.label || this.formatStageLabel(workflowStage.stage),
          description: workflowStage.description || this.getSalesOrderStageDescription(workflowStage.stage),
          icon: this.getSalesOrderStageIcon(workflowStage.stage),
          completed: lifecycleStage?.completed || false,
          isCurrent: lifecycle.currentStage === workflowStage.stage,
          canTransition: lifecycleStage?.canTransition || false,
          document: document || null,
          documentId: document?._id || document?.id,
          documentType: this.getDocumentType(workflowStage.stage),
          actions: this.getSalesOrderStageActions(
            workflowStage.stage,
            lifecycleStage?.completed || false,
            lifecycle.currentStage === workflowStage.stage,
            document
          )
        };
      });
      
      // Calculate progress
      const completedStages = stages.filter(s => s.completed).length;
      const nextStage = this.getNextStage(lifecycle.currentStage, 'sales_order');
      const progress: LifecycleProgress = {
        percentage: Math.round((completedStages / stages.length) * 100),
        completedStages,
        totalStages: stages.length,
        currentStage: lifecycle.currentStage,
        nextStage,
        isComplete: lifecycle.currentStage === stages[stages.length - 1].stage
      };
      
      // Validation
      const validation = await lifecycleService.validateOpportunityForTransition(opportunityId) as ValidationResponse;
      
      // Next actions
      const nextActions = this.getSalesOrderNextActions(lifecycle.currentStage, documents);
      
      return {
        stages,
        progress,
        canTransition: stages.some(s => s.canTransition),
        validation: {
          isValid: validation.isValid,
          requirements: validation.missingRequirements || []
        },
        nextActions
      };
    } catch (error) {
      console.error('Error getting sales order lifecycle UI:', error);
      throw error;
    }
  }
  
  // Transition to next stage with automatic document creation
  async transitionToNextStage(opportunityId: string, options?: StageTransitionOptions): Promise<{
    success: boolean;
    nextStage: string;
    createdDocument?: any;
  }> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const currentStage = lifecycle.currentStage;
      
      // Check if we can transition
      const validation = await lifecycleService.validateOpportunityForTransition(opportunityId) as ValidationResponse;
      if (!validation.isValid && !options?.skipValidation) {
        throw new Error(`Cannot transition: ${validation.missingRequirements?.join(', ')}`);
      }
      
      // Create document if needed
      let createdDocument = null;
      if (lifecycle.packageType === 'work_order') {
        createdDocument = await this.createDocumentForStage(opportunityId, currentStage, options);
      }
      
      // Perform transition
      const result = await lifecycleService.transitionToNextStage(
        opportunityId,
        { metadata: options?.metadata }
      );
      
      return {
        success: true,
        nextStage: result.currentStage,
        createdDocument
      };
    } catch (error) {
      console.error('Error transitioning to next stage:', error);
      throw error;
    }
  }
  
  // Transition sales order stage
  async transitionSalesOrderStage(opportunityId: string, stage: string, options?: StageTransitionOptions): Promise<{
    success: boolean;
    message: string;
    nextStage?: string;
  }> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      if (lifecycle.packageType !== 'sales_order') {
        throw new Error('This is not a sales order opportunity');
      }
      
      // Check if we can transition to this stage
      const currentStage = lifecycle.currentStage;
      const salesOrderStages = ['quote', 'invoice'];
      const currentIndex = salesOrderStages.indexOf(currentStage);
      const targetIndex = salesOrderStages.indexOf(stage);
      
      if (targetIndex < currentIndex) {
        throw new Error('Cannot move to previous stage');
      }
      
      // Create document if needed
      if (stage === 'invoice' && !options?.skipValidation) {
        const quotes = await quoteService.getQuotesByOpportunity(opportunityId);
        if (quotes.length === 0 || quotes[0].status !== 'approved') {
          throw new Error('Cannot create invoice without an approved quote');
        }
      }
      
      // Perform transition
      const result = await lifecycleService.transitionToStage(
        opportunityId,
        stage,
        { metadata: options?.metadata }
      );
      
      return {
        success: true,
        message: `Moved to ${stage} stage`,
        nextStage: result.currentStage
      };
    } catch (error) {
      console.error('Error transitioning sales order stage:', error);
      throw error;
    }
  }
  
  // Get current lifecycle context
  async getLifecycleContext(opportunityId: string): Promise<LifecycleContext> {
    try {
      const status = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const workflow = await lifecycleService.getWorkflowStages(status.packageType);
      const metadata = await this.fetchAllDocuments(opportunityId, status.packageType);
      
      return {
        opportunityId,
        packageType: status.packageType,
        currentStage: status.currentStage,
        stages: workflow.stages.map((stage: any) => ({
          stage: stage.stage,
          label: stage.label,
          description: stage.description,
          completed: status.stages.find((s: any) => s.stage === stage.stage)?.completed || false,
          canTransition: status.stages.find((s: any) => s.stage === stage.stage)?.canTransition || false,
          document: status.stages.find((s: any) => s.stage === stage.stage)?.document || null,
          required: true
        })),
        metadata
      };
    } catch (error) {
      console.error('Error getting lifecycle context:', error);
      throw error;
    }
  }
  
  // Get all related documents for display
  async getAllRelatedDocuments(opportunityId: string): Promise<Record<string, any>> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      return await this.fetchAllDocuments(opportunityId, lifecycle.packageType);
    } catch (error) {
      console.error('Error getting related documents:', error);
      throw error;
    }
  }
  
  // Fast forward through stages (for admin/testing)
  async fastForwardStages(
    opportunityId: string,
    targetStage: string,
    metadata?: Record<string, any>
  ): Promise<LifecycleStatus> {
    try {
      const result = await lifecycleService.fastForwardToStage(opportunityId, targetStage, metadata);
      return await lifecycleService.getOpportunityLifecycle(opportunityId);
    } catch (error) {
      console.error('Error fast forwarding to stage:', error);
      throw error;
    }
  }
  
  // Get lifecycle analytics
  async getLifecycleAnalytics(opportunityId: string): Promise<LifecycleAnalytics> {
    try {
      const duration = await lifecycleService.getLifecycleDuration(opportunityId) as DurationData;
      const summary = await lifecycleService.getLifecycleSummary(opportunityId);
      
      // Calculate efficiency score (0-100)
      const efficiencyScore = this.calculateEfficiencyScore(duration);
      
      // Identify bottlenecks
      const bottlenecks = this.identifyBottlenecks(duration);
      
      return {
        totalDuration: duration.totalDuration,
        stageDurations: duration.stages.reduce((acc: Record<string, number>, stage: any) => ({
          ...acc,
          [stage.stage]: stage.duration
        }), {}),
        bottlenecks,
        efficiencyScore
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }
  
  // Export lifecycle report
  async exportLifecycleReport(
    opportunityId: string,
    format: 'pdf' | 'csv' | 'json' = 'pdf'
  ): Promise<Blob> {
    try {
      const report = await lifecycleService.exportLifecycleReport(opportunityId, format as any);
      
      if (format === 'json') {
        return new Blob([JSON.stringify(report)], { type: 'application/json' });
      } else if (format === 'csv') {
        return new Blob([report], { type: 'text/csv' });
      } else {
        // For PDF, you would typically use a PDF generation library
        // This is a placeholder
        return new Blob([report], { type: 'application/pdf' });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
  
  // Validate stage completion
  async validateStageCompletion(
    opportunityId: string,
    stage: string
  ): Promise<{
    valid: boolean;
    requirements: Array<{
      requirement: string;
      satisfied: boolean;
      message: string;
    }>;
  }> {
    const context = await this.getLifecycleContext(opportunityId);
    const stageInfo = context.stages.find(s => s.stage === stage);
    
    if (!stageInfo) {
      throw new Error(`Stage ${stage} not found`);
    }
    
    const requirements = [];
    
    // Check if document exists for this stage
    requirements.push({
      requirement: 'document',
      satisfied: !!stageInfo.document,
      message: stageInfo.document 
        ? `${stageInfo.label} document exists` 
        : `No ${stageInfo.label} document found`
    });
    
    // Stage-specific requirements
    switch (stage) {
      case 'quote':
        requirements.push({
          requirement: 'quote_approved',
          satisfied: stageInfo.document?.status === 'approved',
          message: stageInfo.document?.status === 'approved'
            ? 'Quote is approved'
            : 'Quote needs approval'
        });
        break;
        
      case 'jobcard':
        requirements.push({
          requirement: 'jobcard_assignments',
          satisfied: stageInfo.document?.assignedTo,
          message: stageInfo.document?.assignedTo
            ? 'Job card has assigned technician'
            : 'Job card needs technician assignment'
        });
        break;
        
      case 'invoice':
        requirements.push({
          requirement: 'invoice_paid',
          satisfied: stageInfo.document?.status === 'paid',
          message: stageInfo.document?.status === 'paid'
            ? 'Invoice is paid'
            : 'Invoice is pending payment'
        });
        break;
    }
    
    return {
      valid: requirements.every(r => r.satisfied),
      requirements
    };
  }
  
  // Complete sales order workflow
  async completeSalesOrder(opportunityId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      if (lifecycle.packageType !== 'sales_order') {
        throw new Error('This is not a sales order opportunity');
      }
      
      // Check if all stages are complete
      const allStagesComplete = lifecycle.stages.every((stage: any) => stage.completed);
      if (!allStagesComplete) {
        throw new Error('Cannot complete: Not all stages are finished');
      }
      
      // Update sales order status
      const salesOrder = (lifecycle as any).salesOrder;
      if (salesOrder) {
        await salesOrderService.updateSalesOrder(salesOrder._id, {
          status: 'delivered'
        });
      }
      
      return {
        success: true,
        message: 'Sales order completed successfully'
      };
    } catch (error) {
      console.error('Error completing sales order:', error);
      throw error;
    }
  }
  
  // Private helper methods
  
  private async fetchAllDocuments(opportunityId: string, packageType: 'work_order' | 'sales_order'): Promise<Record<string, any>> {
    const documents: Record<string, any> = {};
    
    try {
      // Fetch quotes
      const quotes = await quoteService.getQuotesByOpportunity(opportunityId);
      if (quotes.length > 0) {
        documents.quote = quotes[0];
      }
      
      // Fetch invoices
      const invoices = await invoiceService.getInvoicesByOpportunity(opportunityId);
      if (invoices.length > 0) {
        documents.invoice = invoices[0];
      }
      
      if (packageType === 'work_order') {
        // Fetch work order specific documents
        const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
        if (workOrders.length > 0) {
          documents.workOrder = workOrders[0];
        }
        
        const jobCards = await jobCardService.getAllJobCards({ opportunityId });
        if (jobCards.length > 0) {
          documents.jobcard = jobCards[0];
        }
        
        const preChecklists = await (preChecklistService.getPreChecklistsByOpportunity?.(opportunityId) || []);
        if (preChecklists.length > 0) {
          documents.prechecklist = preChecklists[0];
        }
        
        const postChecklists = await (postChecklistService.getPostChecklistsByOpportunity?.(opportunityId) || []);
        if (postChecklists.length > 0) {
          documents.postchecklist = postChecklists[0];
        }
        
        // Note: Waiver service would be added here
      } else if (packageType === 'sales_order') {
        // Fetch sales orders
        const salesOrders = await salesOrderService.getSalesOrdersByOpportunity(opportunityId);
        if (salesOrders.length > 0) {
          documents.salesOrder = salesOrders[0];
        }
      }
      
      return documents;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return documents;
    }
  }
  
  private formatStageLabel(stage: string): string {
    return stage
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('_', ' ');
  }
  
  private getStageDescription(stage: string, packageType: 'work_order' | 'sales_order'): string {
    if (packageType === 'sales_order') {
      return this.getSalesOrderStageDescription(stage);
    }
    
    const descriptions: Record<string, string> = {
      'quote': 'Create and approve quotation',
      'waiver': 'Sign required waivers',
      'jobcard': 'Create job card for technicians',
      'prechecklist': 'Complete pre-service inspection',
      'postchecklist': 'Complete post-service quality check',
      'invoice': 'Generate invoice for payment',
      'payment': 'Process payment',
      'delivery': 'Deliver service/product',
      'completion': 'Mark opportunity as complete'
    };
    return descriptions[stage] || 'Process stage';
  }
  
  private getSalesOrderStageDescription(stage: string): string {
    const descriptions: Record<string, string> = {
      'quote': 'Create and approve quotation for customer',
      'invoice': 'Generate invoice and process payment',
      'payment': 'Confirm payment received',
      'delivery': 'Arrange for product delivery',
      'completion': 'Mark sales order as complete'
    };
    return descriptions[stage] || 'Process stage';
  }
  
  private getStageIcon(stage: string, packageType: 'work_order' | 'sales_order'): string {
    if (packageType === 'sales_order') {
      return this.getSalesOrderStageIcon(stage);
    }
    
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
  
  private getSalesOrderStageIcon(stage: string): string {
    const icons: Record<string, string> = {
      'quote': '📄',
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
  
  private getStageActions(
    stage: string, 
    completed: boolean, 
    isCurrent: boolean, 
    document: any,
    packageType: 'work_order' | 'sales_order'
  ): Array<{
    label: string;
    action: string;
    icon: string;
    disabled: boolean;
    color: string;
  }> {
    if (packageType === 'sales_order') {
      return this.getSalesOrderStageActions(stage, completed, isCurrent, document);
    }
    
    const actions = [];
    
    if (completed && document) {
      actions.push({
        label: 'View',
        action: 'view',
        icon: '👁️',
        disabled: false,
        color: 'blue'
      });
    } else if (isCurrent) {
      actions.push({
        label: 'Create',
        action: 'create',
        icon: '➕',
        disabled: false,
        color: 'green'
      });
      
      if (packageType === 'work_order') {
        actions.push({
          label: 'Skip',
          action: 'skip',
          icon: '⏭️',
          disabled: false,
          color: 'yellow'
        });
      }
    }
    
    return actions;
  }
  
  private getSalesOrderStageActions(
    stage: string, 
    completed: boolean, 
    isCurrent: boolean, 
    document: any
  ): Array<{
    label: string;
    action: string;
    icon: string;
    disabled: boolean;
    color: string;
  }> {
    const actions = [];
    
    if (completed && document) {
      actions.push({
        label: 'View',
        action: 'view',
        icon: '👁️',
        disabled: false,
        color: 'blue'
      });
      
      // Allow editing if not invoiced yet
      if (stage === 'quote' && document.status !== 'approved') {
        actions.push({
          label: 'Edit',
          action: 'edit',
          icon: '✏️',
          disabled: false,
          color: 'yellow'
        });
      }
    } else if (isCurrent) {
      actions.push({
        label: 'Create',
        action: 'create',
        icon: '➕',
        disabled: false,
        color: 'green'
      });
    }
    
    // Add transition action for current stage
    if (isCurrent && document) {
      actions.push({
        label: 'Next',
        action: 'transition',
        icon: '➡️',
        disabled: false,
        color: 'purple'
      });
    }
    
    return actions;
  }
  
  private getNextStage(currentStage: string, packageType: 'work_order' | 'sales_order'): string | null {
    const workOrderStages = ['quote', 'waiver', 'jobcard', 'prechecklist', 'postchecklist', 'invoice'];
    const salesOrderStages = ['quote', 'invoice'];
    
    const stages = packageType === 'work_order' ? workOrderStages : salesOrderStages;
    const currentIndex = stages.indexOf(currentStage);
    
    if (currentIndex < stages.length - 1) {
      return stages[currentIndex + 1];
    }
    
    return null;
  }
  
  private getSalesOrderNextActions(
    currentStage: string, 
    documents: Record<string, any>
  ): Array<{
    label: string;
    action: () => Promise<void>;
    icon: string;
  }> {
    const actions = [];
    
    switch (currentStage) {
      case 'quote':
        if (!documents.quote) {
          actions.push({
            label: 'Create Quote',
            action: async () => {
              // Navigate to quote creation
              window.location.href = '/quotes/create';
            },
            icon: '📄'
          });
        } else if (documents.quote.status === 'approved') {
          actions.push({
            label: 'Create Invoice',
            action: async () => {
              // Navigate to invoice creation
              window.location.href = '/invoices/create';
            },
            icon: '💰'
          });
        } else {
          actions.push({
            label: 'Approve Quote',
            action: async () => {
              // Approve quote logic
            },
            icon: '✅'
          });
        }
        break;
        
      case 'invoice':
        if (documents.invoice) {
          if (documents.invoice.paymentStatus === 'unpaid') {
            actions.push({
              label: 'Mark as Paid',
              action: async () => {
                // Mark invoice as paid
              },
              icon: '💳'
            });
          }
        }
        break;
    }
    
    return actions;
  }
  
  private async createDocumentForStage(opportunityId: string, stage: string, options?: StageTransitionOptions): Promise<any> {
    try {
      const opportunity = await opportunityService.getOpportunityById(opportunityId);
      
      switch (stage) {
        case 'quote':
          return await this.createQuote(opportunity, options);
        case 'waiver':
          return await this.createWaiver(opportunity, options);
        case 'jobcard':
          return await this.createJobCard(opportunity, options);
        case 'prechecklist':
          return await this.createPreChecklist(opportunity, options);
        case 'postchecklist':
          return await this.createPostChecklist(opportunity, options);
        case 'invoice':
          return await this.createInvoice(opportunity, options);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error creating document for stage ${stage}:`, error);
      throw error;
    }
  }
  
  private async createQuote(opportunity: Opportunity, options?: any): Promise<Quote> {
    try {
      const quoteData = {
        opportunityId: opportunity._id,
        items: opportunity.servicesProducts?.map((sp: any) => ({
          description: sp.title,
          quantity: sp.quantity,
          unitPrice: sp.unitPrice,
          total: sp.total
        })) || [],
        totalAmount: opportunity.total || 0,
        notes: options?.notes || `Quote for ${opportunity.subject}`
      };
      
      return await quoteService.createQuote(quoteData);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }
  
  private async createWaiver(opportunity: Opportunity, options?: any): Promise<any> {
    // Waiver creation logic - you'll need to implement your waiver service
    try {
      const waiverData = {
        opportunityId: opportunity._id,
        type: options?.type || 'standard',
        reason: options?.reason || 'Service waiver',
        notes: options?.notes
      };
      
      // This would call your actual waiver service
      // return await waiverService.createWaiver(waiverData);
      return { _id: `waiver-${Date.now()}`, ...waiverData };
    } catch (error) {
      console.error('Error creating waiver:', error);
      throw error;
    }
  }
  
  private async createJobCard(opportunity: Opportunity, options?: any): Promise<JobCard> {
    try {
      const jobCardData = {
        opportunityId: opportunity._id,
        vehicleId: opportunity.vehicles?.[0]?._id || '',
        jobTitle: options?.jobTitle || `Service for ${opportunity.subject}`,
        jobDescription: options?.jobDescription || opportunity.notes,
        assignedTo: options?.assignedTo
      };
      
      return await jobCardService.createJobCard(jobCardData);
    } catch (error) {
      console.error('Error creating job card:', error);
      throw error;
    }
  }
  
  private async createPreChecklist(opportunity: Opportunity, options?: any): Promise<PreChecklist> {
    try {
      const preChecklistData = {
        opportunityId: opportunity._id,
        vehicleId: opportunity.vehicles?.[0]?._id || '',
        inspectionItems: [
          { item: 'Vehicle Exterior', status: 'ok', remarks: 'Pre-service check' },
          { item: 'Vehicle Interior', status: 'ok', remarks: 'Pre-service check' },
          { item: 'Engine Check', status: 'ok', remarks: 'Pre-service check' },
          { item: 'Safety Features', status: 'ok', remarks: 'Pre-service check' }
        ],
        remarks: options?.remarks || 'Pre-service inspection completed',
        approved: false
      };
      
      return await preChecklistService.createPreChecklist(preChecklistData);
    } catch (error) {
      console.error('Error creating pre-checklist:', error);
      throw error;
    }
  }
  
  private async createPostChecklist(opportunity: Opportunity, options?: any): Promise<PostChecklist> {
    try {
      // First get the job card for this opportunity
      const jobCards = await jobCardService.getAllJobCards({ opportunityId: opportunity._id });
      const jobCard = jobCards[0];
      
      const postChecklistData = {
        opportunityId: opportunity._id,
        vehicleId: opportunity.vehicles?.[0]?._id || '',
        jobCardId: jobCard?._id || '',
        inspectedBy: options?.inspectedBy,
        inspectionItems: [
          { item: 'Work Quality', status: 'completed', required: true, category: 'quality' },
          { item: 'Cleanliness', status: 'completed', required: true, category: 'cleanliness' },
          { item: 'Safety Check', status: 'completed', required: true, category: 'safety' },
          { item: 'Documentation', status: 'completed', required: true, category: 'documentation' }
        ],
        notes: options?.notes || 'Post-service inspection completed',
        overallCondition: 'satisfactory'
      };
      
      return await postChecklistService.createPostChecklist(postChecklistData);
    } catch (error) {
      console.error('Error creating post-checklist:', error);
      throw error;
    }
  }
  
  private async createInvoice(opportunity: Opportunity, options?: any): Promise<Invoice> {
    try {
      // Get the quote for this opportunity
      const quotes = await quoteService.getQuotesByOpportunity(opportunity._id);
      const quote = quotes[0];
      
      const invoiceData = {
        opportunityId: opportunity._id,
        quoteId: quote?._id,
        items: quote?.items || opportunity.servicesProducts?.map((sp: any) => ({
          description: sp.title,
          quantity: sp.quantity,
          unitPrice: sp.unitPrice,
          total: sp.total
        })) || [],
        dueDate: options?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        paymentMethod: options?.paymentMethod || 'cash',
        notes: options?.notes || `Invoice for ${opportunity.subject}`
      };
      
      return await invoiceService.createInvoice(invoiceData);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }
  
  private calculateEfficiencyScore(duration: DurationData): number {
    const totalStages = duration.stages.length;
    const completedStages = duration.stages.filter((s: any) => s.completed).length;
    
    if (totalStages === 0) return 100;
    
    const completionRatio = completedStages / totalStages;
    
    // Calculate time efficiency (lower duration = higher score)
    const maxExpectedDuration = totalStages * 24; // 24 hours per stage max
    const timeEfficiency = Math.max(0, 100 - (duration.totalDuration / maxExpectedDuration) * 100);
    
    // Weighted score (70% completion, 30% time)
    return Math.round((completionRatio * 70) + (timeEfficiency * 0.3));
  }
  
  private identifyBottlenecks(duration: DurationData): string[] {
    const bottlenecks: string[] = [];
    const avgDuration = duration.averageStageDuration;
    
    duration.stages.forEach((stage: any) => {
      if (stage.duration > avgDuration * 2) { // 2x longer than average
        bottlenecks.push(`${stage.stage} (${stage.duration.toFixed(1)}h)`);
      }
    });
    
    return bottlenecks;
  }
}

export const lifecycleIntegrationService = new LifecycleIntegrationService();