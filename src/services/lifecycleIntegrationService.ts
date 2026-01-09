// services/lifecycleIntegrationService.ts

import { lifecycleService, LifecycleStatus, LifecycleStage } from './lifecycleService';
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

// Update this interface with all the properties we need
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
  // Add the missing properties we're using
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
          documentId: document?._id || document?.id || '',
          documentType: this.getDocumentType(stageName),
          actions: this.getStageActions(
            stageName,
            lifecycleStage?.completed || false,
            currentStage === stageName,
            document,
            lifecycle.packageType
          ),
          // Add the new properties
          canSkip: this.isStageSkippable(stageName, lifecycle.packageType),
          mandatory: !this.isStageSkippable(stageName, lifecycle.packageType),
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
      
      const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
      const currentStage = lifecycle.currentStage;
      
      const documents = await this.fetchDocumentsForStages(opportunityId, pattern);
      
      const stages = pattern.map((stageName: string, index: number) => {
        const lifecycleStage = lifecycle.stages?.find((s: any) => s.stage === stageName);
        const document = documents[stageName];
        
        const stageConfig = this.getWorkOrderStageConfig(stageName);
        
        // Check if stage is truly completed
        const isCompleted = this.isStageTrulyCompleted(stageName, lifecycleStage, document);
        
        return {
          stage: stageName,
          label: stageConfig.label,
          description: stageConfig.description,
          icon: stageConfig.icon,
          completed: isCompleted, // Use the new check
          isCurrent: currentStage === stageName,
          canTransition: this.canWorkOrderTransition(stageName, currentStage, document),
          document: document || null,
          documentId: document?._id || document?.id || '',
          documentType: this.getDocumentType(stageName),
          actions: this.getWorkOrderStageActions(
            stageName,
            isCompleted, // Use the new check
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
          dependencies: [],
          index: index + 1,
          totalStages: pattern.length
        };
      });
      
      // Calculate progress based on truly completed stages
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
    // First check if lifecycle marks it as completed
    const lifecycleCompleted = lifecycleStage?.completed || false;
    
    // If lifecycle says it's not completed, return false immediately
    if (!lifecycleCompleted) {
      return false;
    }
    
    // Special handling for waiver stage
    if (stageName === 'waiver') {
      // Waiver is optional - consider it completed if:
      // 1. It has a signed document, OR
      // 2. It was skipped (no document but lifecycle marks it as completed)
      if (document?.signed) {
        return true; // Waiver document exists and is signed
      }
      // If lifecycle says it's completed but no document exists, it was skipped
      // This should return true because waiver can be skipped
      return true;
    }
    
    // For all other stages, they must have a document to be considered completed
    if (!document) {
      return false; // No document, not completed
    }
    
    // Check stage-specific completion criteria
    switch (stageName) {
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
        return !!document; // Default: has document = completed
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
      
      // Find the stage
      const stageIndex = lifecycle.stages?.findIndex((s: any) => s.stage === stage);
      if (stageIndex === -1) {
        throw new Error(`Stage ${stage} not found in lifecycle`);
      }
      
      // Since we can't directly update the lifecycle, we'll transition to the next stage
      // after marking current as complete in our local state
      const pattern = lifecycle.packageType === 'work_order' 
        ? WORKFLOW_PATTERNS.WORK_ORDER 
        : WORKFLOW_PATTERNS.SALES_ORDER;
      
      const currentIndex = pattern.indexOf(stage);
      
      // If this is the current stage and we should auto-transition
      if (lifecycle.currentStage === stage && currentIndex < pattern.length - 1) {
        const nextStage = pattern[currentIndex + 1];
        return await this.transitionToStage(opportunityId, nextStage, { 
          skipValidation: true,
          metadata: {
            ...data,
            previousStageCompleted: stage,
            completedAt: new Date().toISOString()
          }
        });
      }
      
      // If we're not auto-transitioning, just update our local understanding
      // In a real app, you'd want to save this to your database
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

  // Add to your LifecycleIntegrationService class

// Integration for checklist approval and stage completion
  async handleChecklistApproval(
    checklistId: string,
    checklistType: 'prechecklist' | 'postchecklist',
    approvedBy?: string
  ): Promise<{
    checklistApproved: boolean;
    stageCompleted: boolean;
    nextStage?: string;
    workflowProgress: any;
  }> {
    try {
      // 1. Get opportunity from checklist
      let opportunityId: string;
      
      if (checklistType === 'prechecklist') {
        const preChecklistService = require('./preChecklistService').preChecklistService;
        const checklist = await preChecklistService.getPreChecklistById(checklistId);
        opportunityId = typeof checklist.opportunityId === 'object' 
          ? checklist.opportunityId._id 
          : checklist.opportunityId;
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
      
      // 2. Get current lifecycle state
      const lifecycleUI = await this.getWorkOrderLifecycleUI(opportunityId);
      
      // 3. Determine which stage should be completed
      const currentStage = lifecycleUI.progress.currentStage;
      const shouldCompleteStage = currentStage === checklistType;
      
      if (shouldCompleteStage) {
        // 4. Mark the stage as completed in lifecycle
        const stageCompletion = await this.markStageAsCompleted(opportunityId, currentStage, {
          documentId: checklistId,
          completedBy: approvedBy,
          notes: `${checklistType} approved`
        });
        
        // 5. Check if we should auto-transition to next stage
        const pattern = WORKFLOW_PATTERNS.WORK_ORDER;
        const currentIndex = pattern.indexOf(currentStage);
        
        if (currentIndex < pattern.length - 1) {
          const nextStage = pattern[currentIndex + 1];
          
          // Check if ready to transition
          const documents = await this.fetchDocumentsForStages(opportunityId, [currentStage]);
          const canTransition = await this.validateStageCompletion(opportunityId, currentStage, documents[currentStage]);
          
          if (canTransition) {
            // Auto-transition to next stage
            await this.transitionToStage(opportunityId, nextStage, {
              skipValidation: true,
              metadata: {
                triggeredBy: `${checklistType}-approval`,
                checklistId,
                approvedBy
              }
            });
            
            return {
              checklistApproved: true,
              stageCompleted: true,
              nextStage,
              workflowProgress: await this.getWorkOrderLifecycleUI(opportunityId)
            };
          }
        }
        
        return {
          checklistApproved: true,
          stageCompleted: true,
          nextStage: null, // No next stage (already at last stage)
          workflowProgress: await this.getWorkOrderLifecycleUI(opportunityId)
        };
      }
      
      // If checklist isn't for current stage, just approve it
      return {
        checklistApproved: true,
        stageCompleted: false,
        workflowProgress: lifecycleUI
      };
    } catch (error) {
      console.error(`Error handling ${checklistType} approval:`, error);
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
    userId?: string
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
        notes: `${checklistType} completed`
      });
      
      // Check if we should auto-transition
      const pattern = lifecycleUI.pattern;
      const currentIndex = pattern.indexOf(currentStage);
      
      if (currentIndex < pattern.length - 1) {
        const nextStage = pattern[currentIndex + 1];
        
        // Validate current stage completion
        const documents = await this.fetchDocumentsForStages(opportunityId, [currentStage]);
        const isValid = await this.validateStageCompletion(opportunityId, currentStage, documents[currentStage]);
        
        if (isValid) {
          // Auto-transition to next stage
          await this.transitionToStage(opportunityId, nextStage, {
            skipValidation: true,
            metadata: {
              triggeredBy: 'checklist-completion',
              checklistId,
              completedBy: userId
            }
          });
          
          return {
            checklistCompleted: true,
            stageTransitioned: true,
            nextStage,
            message: `${checklistType} completed and auto-transitioned to ${nextStage}`
          };
        } else {
          return {
            checklistCompleted: true,
            stageTransitioned: false,
            message: `${checklistType} completed but not ready for auto-transition`
          };
        }
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
        skippable: false,
        mandatory: true
      },
      'waiver': {
        label: 'Waiver',
        description: 'Customer signs required waivers (Optional)',
        icon: '📝',
        required: false,
        skippable: true,
        mandatory: false
      },
      'jobcard': {
        label: 'Job Card',
        description: 'Create detailed work instructions',
        icon: '🔧',
        required: true,
        skippable: false,
        mandatory: true
      },
      'prechecklist': {
        label: 'Pre-Checklist',
        description: 'Complete pre-service inspection',
        icon: '✅',
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
        // Waiver is optional - can transition even without document
        return true; // Always allow transition from waiver
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
    // Delegate to the main getStageActions method for consistency
    return this.getStageActions(stage, completed, isCurrent, document, 'work_order');
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
  
  private async validateStageCompletion(opportunityId: string, stage: string, document?: any): Promise<boolean> {
    // ONLY waiver stage is optional
    if (stage === 'waiver') {
      return true; // Always valid - waiver is optional
    }
    
    // All other stages require a document
    if (!document) return false;
    
    switch (stage) {
      case 'quote':
        return document.status === 'approved';
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