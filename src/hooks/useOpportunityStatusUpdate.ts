import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { opportunityService } from '@/services/opportunityService';
import { leadService } from '@/services/leadService';

export function useOpportunityStatusUpdate() {
  const router = useRouter();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingOpportunity, setPendingOpportunity] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');

  const handleStatusUpdate = async (opportunity: any, newStatus: string): Promise<{success: boolean; needsLead?: boolean}> => {
    if (!opportunity || updatingStatus) return { success: false };

    // Check if moving from 'new' to 'attempted_to_contact'
    if (opportunity.status === 'new' && newStatus === 'attempted_to_contact') {
      try {
        setUpdatingStatus(true);
        const hasLead = await checkIfLeadExists(opportunity._id);
        
        if (!hasLead) {
          setPendingOpportunity(opportunity);
          setTargetStatus(newStatus);
          setShowConfirmationModal(true);
          setUpdatingStatus(false);
          return { success: false, needsLead: true };
        }
        
        // If lead exists, check if it can progress
        const canProgress = await checkIfOpportunityCanProgress(opportunity._id);
        
        if (!canProgress) {
          setPendingOpportunity(opportunity);
          setTargetStatus(newStatus);
          setShowConfirmationModal(true);
          setUpdatingStatus(false);
          return { success: false, needsLead: true }; // Needs lead, modal shown
        }
        
        // If all checks pass, update status
        await updateOpportunityStatus(opportunity._id, newStatus);
        setUpdatingStatus(false);
        return { success: true }; // Status updated successfully
        
      } catch (error) {
        console.error('Error checking lead:', error);
        setUpdatingStatus(false);
        
        // Check if it's a LIS validation error
        if (error instanceof Error && error.message.includes('LIS validation failed')) {
          throw error;
        }
        
        // Fall back to regular status update attempt
        try {
          await updateOpportunityStatus(opportunity._id, newStatus);
          return { success: true };
        } catch (updateError) {
          throw updateError;
        }
      }
    } else {
      // For other status changes, proceed directly
      try {
        setUpdatingStatus(true);
        await updateOpportunityStatus(opportunity._id, newStatus);
        setUpdatingStatus(false);
        return { success: true };
      } catch (error) {
        setUpdatingStatus(false);
        throw error;
      }
    }
  };

  const checkIfLeadExists = async (opportunityId: string): Promise<boolean> => {
    try {
      const response = await leadService.getLeadsByOpportunity(opportunityId);
      return response.data && response.data.length > 0;
    } catch (error) {
      console.error('Error checking lead existence:', error);
      return false;
    }
  };

  const checkIfOpportunityCanProgress = async (opportunityId: string): Promise<boolean> => {
    try {
      const response = await leadService.checkOpportunityCanProgress(opportunityId);
      return response.canProgress;
    } catch (error) {
      console.error('Error checking if opportunity can progress:', error);
      return false;
    }
  };

  const updateOpportunityStatus = async (opportunityId: string, newStatus: string) => {
    try {
      await opportunityService.updateOpportunity(opportunityId, { status: newStatus as any });
    } catch (err: any) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  const handleConfirmation = () => {
    if (!pendingOpportunity) return;
    
    setShowConfirmationModal(false);
    router.push(`/leads/create?opportunityId=${pendingOpportunity._id}&redirectStatus=${targetStatus}`);
    
    // Reset state
    setPendingOpportunity(null);
    setTargetStatus('');
  };

  const handleConfirmationCancel = () => {
    setShowConfirmationModal(false);
    setPendingOpportunity(null);
    setTargetStatus('');
  };

  return {
    updatingStatus,
    showConfirmationModal,
    handleStatusUpdate,
    handleConfirmation,
    handleConfirmationCancel,
    pendingOpportunity,
    targetStatus
  };
}