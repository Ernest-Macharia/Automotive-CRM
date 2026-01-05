// services/lifecycleIntegrationService.ts

import { lifecycleService, LifecycleStatus } from './lifecycleService';
import { workOrderService } from './workOrderService';
import { salesOrderService } from './salesOrderService';
import { quoteService } from './quoteService';
import { invoiceService } from './invoiceService';
import { jobCardService } from './jobCardService';
import { opportunityService } from './opportunityService';

// Define the correct workflow patterns
export const WORKFLOW_PATTERNS = {
  SALES_ORDER: ['quote', 'invoice'],
  WORK_ORDER: ['quote', 'waiver', 'jobcard', 'prechecklist', 'postchecklist', 'invoice']
};

// Add this interface to the lifecycleIntegrationService.ts file
export interface LifecycleStageUI {
  stage: string;
  label: string;
  description: string;
  icon: string;
  completed: boolean;
  isCurrent: boolean;
  canTransition: boolean;
  document: any;
  documentId: string;
  documentType: string;
  actions: Array<{
    label: string;
    action: string;
    color: string;
  }>;
  required: boolean;
  skippable: boolean;
  index: number;
  totalStages: number;
}

export class LifecycleIntegrationService {
  
  // Get lifecycle UI for any opportunity type
  async getLifecycleUI(opportunityId: string): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      // Determine which pattern to use
      const pattern = lifecycle.packageType === 'work_order' 
        ? WORKFLOW_PATTERNS.WORK_ORDER 
        : WORKFLOW_PATTERNS.SALES_ORDER;
      
      // Get current stage from lifecycle
      const currentStage = lifecycle.currentStage;
      
      // Get documents for each stage
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern);
      
      // Build UI stages
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
          documentId: document?._id || document?.id,
          documentType: this.getDocumentType(stageName),
          actions: this.getStageActions(
            stageName,
            lifecycleStage?.completed || false,
            currentStage === stageName,
            document,
            lifecycle.packageType
          ),
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
      
      // Check if can transition
      const canTransition = stages.some(s => s.isCurrent && s.canTransition);
      
      // Validation
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
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      
      if (lifecycle.packageType !== 'work_order') {
        throw new Error('This opportunity is not a work order');
      }
      
      // Use work order pattern
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const currentStage = lifecycle.currentStage;
      
      // Get documents
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern);
      
      // Build stages with work-order specific logic
      const stages = pattern.map((stageName: string, index: number) => {
        const lifecycleStage = lifecycle.stages?.find((s: any) => s.stage === stageName);
        const document = documents[stageName];
        
        const stageConfig = this.getWorkOrderStageConfig(stageName);
        
        return {
          stage: stageName,
          label: stageConfig.label,
          description: stageConfig.description,
          icon: stageConfig.icon,
          completed: lifecycleStage?.completed || false,
          isCurrent: currentStage === stageName,
          canTransition: this.canWorkOrderTransition(stageName, currentStage, document),
          document: document || null,
          documentId: document?._id || document?.id,
          documentType: this.getDocumentType(stageName),
          actions: this.getWorkOrderStageActions(
            stageName,
            lifecycleStage?.completed || false,
            currentStage === stageName,
            document
          ),
          required: stageConfig.required,
          skippable: stageConfig.skippable,
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
      
      // Work order specific validation
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
          documentId: document?._id || document?.id,
          documentType: this.getDocumentType(stageName),
          actions: this.getSalesOrderStageActions(
            stageName,
            lifecycleStage?.completed || false,
            currentStage === stageName,
            document
          ),
          required: true,
          skippable: false,
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
  
  // Transition to next stage
  async transitionToNextStage(opportunityId: string, options?: any): Promise<any> {
    try {
      const lifecycle = await lifecycleService.getOpportunityLifecycle(opportunityId);
      const currentStage = lifecycle.currentStage;
      const packageType = lifecycle.packageType;
      
      // Determine pattern
      const pattern = packageType === 'work_order' 
        ? WORKFLOW_PATTERNS.WORK_ORDER 
        : WORKFLOW_PATTERNS.SALES_ORDER;
      
      // Get current index
      const currentIndex = pattern.indexOf(currentStage);
      
      if (currentIndex === -1 || currentIndex >= pattern.length - 1) {
        throw new Error('Cannot transition: Already at final stage');
      }
      
      // Get next stage
      const nextStage = pattern[currentIndex + 1];
      
      // Validate current stage completion
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern.slice(0, currentIndex + 1));
      const isValid = await this.validateStageCompletion(opportunityId, currentStage, documents[currentStage]);
      
      if (!isValid && !options?.skipValidation) {
        throw new Error(`Cannot transition: Current stage "${currentStage}" not completed`);
      }
      
      // Perform transition
      const result = await lifecycleService.transitionToStage(opportunityId, nextStage, options);
      
      // If this is a work order and we're transitioning to jobcard, create it automatically
      if (packageType === 'work_order' && nextStage === 'jobcard' && options?.autoCreateJobCard !== false) {
        await this.autoCreateJobCard(opportunityId);
      }
      
      return {
        success: true,
        message: `Transitioned from ${currentStage} to ${nextStage}`,
        currentStage: nextStage,
        previousStage: currentStage
      };
    } catch (error) {
      console.error('Error transitioning to next stage:', error);
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
      
      if (targetIndex < currentIndex && !options?.allowBackwards) {
        throw new Error('Cannot move backwards in workflow');
      }
      
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

  // Add this method to the LifecycleIntegrationService class
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
          await workOrderService.updateWorkOrder(workOrder._id || workOrder.id, {
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
  
  private async fetchDocumentsForStages(opportunityId: string, stages: string[]): Promise<Record<string, any>> {
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
      
      // Note: Add other document types here (waivers, checklists, etc.)
      
      return documents;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return documents;
    }
  }
  
  private getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
      'quote': 'Quote',
      'waiver': 'Waiver',
      'jobcard': 'Job Card',
      'prechecklist': 'Pre-Checklist',
      'postchecklist': 'Post-Checklist',
      'invoice': 'Invoice',
      'payment': 'Payment',
      'delivery': 'Delivery',
      'completion': 'Completion'
    };
    return labels[stage] || stage.charAt(0).toUpperCase() + stage.slice(1);
  }
  
  private getStageDescription(stage: string, packageType: string): string {
    const descriptions: Record<string, string> = {
      'quote': 'Create and approve quotation',
      'waiver': 'Sign required waivers and approvals',
      'jobcard': 'Create work instructions for technicians',
      'prechecklist': 'Complete pre-service inspection checklist',
      'postchecklist': 'Complete post-service quality checklist',
      'invoice': 'Generate and send invoice for payment',
      'payment': 'Process payment and update records',
      'delivery': 'Schedule and complete delivery',
      'completion': 'Finalize order and archive documentation'
    };
    
    if (packageType === 'sales_order') {
      const salesDescriptions: Record<string, string> = {
        'quote': 'Prepare sales quotation for customer approval',
        'invoice': 'Generate sales invoice and track payment',
        'payment': 'Confirm payment receipt and update accounts',
        'delivery': 'Arrange product shipment and delivery',
        'completion': 'Complete sales order and customer follow-up'
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
      'quote': {
        label: 'Quotation',
        description: 'Create and approve work quotation',
        icon: '📄',
        required: true,
        skippable: false
      },
      'waiver': {
        label: 'Waiver',
        description: 'Customer signs required waivers',
        icon: '📝',
        required: true,
        skippable: true
      },
      'jobcard': {
        label: 'Job Card',
        description: 'Create detailed work instructions',
        icon: '🔧',
        required: true,
        skippable: false
      },
      'prechecklist': {
        label: 'Pre-Checklist',
        description: 'Complete pre-service inspection',
        icon: '✅',
        required: true,
        skippable: true
      },
      'postchecklist': {
        label: 'Post-Checklist',
        description: 'Quality check after service completion',
        icon: '📋',
        required: true,
        skippable: true
      },
      'invoice': {
        label: 'Invoice',
        description: 'Generate final invoice',
        icon: '💰',
        required: true,
        skippable: false
      }
    };
    return configs[stage] || { label: stage, description: '', icon: '📌', required: true, skippable: false };
  }
  
  private getSalesOrderStageConfig(stage: string): any {
    const configs: Record<string, any> = {
      'quote': {
        label: 'Sales Quote',
        description: 'Prepare sales quotation',
        icon: '📄',
        required: true,
        skippable: false
      },
      'invoice': {
        label: 'Sales Invoice',
        description: 'Generate sales invoice',
        icon: '💰',
        required: true,
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
    
    // Work-order specific transition rules
    switch (stage) {
      case 'quote':
        return document?.status === 'approved';
      case 'waiver':
        return document?.signed === true;
      case 'jobcard':
        return document?.status === 'assigned' || document?.status === 'in_progress';
      case 'prechecklist':
        return document?.completed === true;
      case 'postchecklist':
        return document?.completed === true;
      case 'invoice':
        return document?.status === 'draft' || document?.status === 'sent';
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
    const actions = [];
    
    if (completed && document) {
      actions.push({
        label: 'View',
        action: 'view',
        color: 'blue'
      });
    } else if (isCurrent) {
      actions.push({
        label: 'Create',
        action: 'create',
        color: 'green'
      });
    }
    
    if (isCurrent && document) {
      actions.push({
        label: 'Next',
        action: 'transition',
        color: 'purple'
      });
    }
    
    return actions;
  }
  
  private getWorkOrderStageActions(
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
      
      if (stage === 'jobcard' && document.status !== 'completed') {
        actions.push({
          label: 'Update',
          action: 'update',
          color: 'yellow'
        });
      }
    } else if (isCurrent) {
      actions.push({
        label: 'Create',
        action: 'create',
        color: 'green'
      });
      
      // Allow skipping for certain stages
      if (['waiver', 'prechecklist', 'postchecklist'].includes(stage)) {
        actions.push({
          label: 'Skip',
          action: 'skip',
          color: 'gray'
        });
      }
    }
    
    if (isCurrent && document) {
      actions.push({
        label: 'Continue',
        action: 'transition',
        color: 'purple'
      });
    }
    
    return actions;
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
      actions.push({
        label: 'Next',
        action: 'transition',
        color: 'purple'
      });
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
    
    if (!documents[currentStage]) {
      requirements.push(`${this.getStageLabel(currentStage)} required`);
    } else {
      switch (currentStage) {
        case 'quote':
          if (documents.quote?.status !== 'approved') {
            requirements.push('Quote must be approved');
          }
          break;
        case 'waiver':
          if (!documents.waiver?.signed) {
            requirements.push('Waiver must be signed');
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
  
  private async validateStageCompletion(opportunityId: string, stage: string, document?: any): Promise<boolean> {
    if (!document) return false;
    
    switch (stage) {
      case 'quote':
        return document.status === 'approved';
      case 'waiver':
        return document.signed === true;
      case 'jobcard':
        return document.status === 'completed' || document.status === 'closed';
      case 'prechecklist':
        return document.completed === true;
      case 'postchecklist':
        return document.completed === true;
      case 'invoice':
        return document.status === 'sent' || document.status === 'paid';
      default:
        return true;
    }
  }
  
  private isStageSkippable(stage: string, packageType: string): boolean {
    if (packageType === 'work_order') {
      return ['waiver', 'prechecklist', 'postchecklist'].includes(stage);
    }
    return false; // Sales order stages are not skippable
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

      // You need to get the vehicle ID from somewhere
      // This depends on your data model - you might need to:
      // 1. Get it from the opportunity
      // 2. Get it from the quote
      // 3. Have it as a separate parameter
      
      // Assuming opportunity has vehicleId
      const vehicleId = (opportunity as any).vehicleId || 
                        (opportunity as any).vehicle?._id || 
                        'unknown-vehicle-id';

      // Create job card with correct data structure
      const jobCardData = {
        opportunityId,
        vehicleId: vehicleId,
        jobTitle: `Job Card for ${opportunity.subject}`,
        jobDescription: opportunity.notes || 'Service work required',
        assignedTo: typeof workOrder.assignedTo === 'object' ? 
                  workOrder.assignedTo._id : 
                  workOrder.assignedTo,
        priority: (workOrder as any).priority || 'medium',
        estimatedHours: workOrder.estimatedHours || 0,
        status: 'assigned'
      };

      await jobCardService.createJobCard(jobCardData);
    } catch (error) {
      console.error('Error auto-creating job card:', error);
      // Don't throw error - this shouldn't block the transition
    }
  }
}

export const lifecycleIntegrationService = new LifecycleIntegrationService();