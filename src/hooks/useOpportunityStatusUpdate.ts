// hooks/useOpportunityStatusUpdate.ts
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { opportunityService } from '@/services/opportunityService';
import { leadService } from '@/services/leadService';

export function useOpportunityStatusUpdate() {
  const router = useRouter();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showGenericConfirm, setShowGenericConfirm] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [pendingOpportunity, setPendingOpportunity] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [callback, setCallback] = useState<((success: boolean) => void) | null>(null);

  // Helper: get readable status label
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'New',
      attempted_to_contact: 'Attempted to Contact',
      prospecting: 'Prospecting',
      appointment_scheduled: 'Appointment Scheduled',
      non_progressive: 'Non Progressive',
      lost: 'Lost'
    };
    return labels[status] || status;
  };

  // STEP 1: Request status change → show generic confirmation
  const handleStatusUpdate = async (
    opportunity: any,
    newStatus: string,
    onComplete?: (success: boolean) => void
  ): Promise<{ success: boolean; needsLead?: boolean }> => {
    if (!opportunity || updatingStatus || opportunity.status === newStatus) {
      if (onComplete) onComplete(false);
      return { success: false };
    }

    // Show generic "move from X to Y?" modal
    setPendingOpportunity(opportunity);
    setTargetStatus(newStatus);
    setCallback(() => onComplete || null);
    setShowGenericConfirm(true);
    return { success: false }; // Wait for user confirmation
  };

  // STEP 2: User confirms generic modal → proceed with validation
  const handleGenericConfirm = async () => {
    if (!pendingOpportunity || !targetStatus) {
      if (callback) callback(false);
      resetState();
      return;
    }

    setUpdatingStatus(true);
    setShowGenericConfirm(false);

    try {
      // Special case: moving from 'new' to 'attempted_to_contact' requires lead
      if (
        pendingOpportunity.status === 'new' &&
        targetStatus === 'attempted_to_contact'
      ) {
        const hasLead = await checkIfLeadExists(pendingOpportunity._id);
        if (!hasLead || !(await checkIfOpportunityCanProgress(pendingOpportunity._id))) {
          // Show "Create Lead?" modal
          setShowCreateLeadModal(true);
          setUpdatingStatus(false);
          return;
        }
      }

      // Proceed with status update
      await updateOpportunityStatus(pendingOpportunity._id, targetStatus);
      
      // Call the callback with success
      if (callback) callback(true);
      
      setUpdatingStatus(false);
      resetState();
    } catch (error: any) {
      setUpdatingStatus(false);
      if (callback) callback(false);
      resetState();
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  const handleGenericCancel = () => {
    if (callback) callback(false);
    setShowGenericConfirm(false);
    resetState();
  };

  // STEP 3: User confirms "Create Lead" → redirect
  const handleCreateLeadConfirm = () => {
    setShowCreateLeadModal(false);
    router.push(
      `/leads/create?opportunityId=${pendingOpportunity._id}&redirectStatus=${targetStatus}`
    );
    resetState();
  };

  const handleCreateLeadCancel = () => {
    setShowCreateLeadModal(false);
    if (callback) callback(false);
    resetState();
  };

  const resetState = () => {
    setPendingOpportunity(null);
    setTargetStatus('');
    setCallback(null);
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
      console.error('Error checking progress:', error);
      return false;
    }
  };

  const updateOpportunityStatus = async (opportunityId: string, newStatus: string) => {
    await opportunityService.updateOpportunity(opportunityId, { status: newStatus as any });
  };

  return {
    updatingStatus,
    // Generic confirmation
    showGenericConfirm,
    genericMessage: pendingOpportunity
      ? `Are you sure you want to move from "${getStatusLabel(pendingOpportunity.status)}" to "${getStatusLabel(targetStatus)}"?`
      : '',
    onGenericConfirm: handleGenericConfirm,
    onGenericCancel: handleGenericCancel,
    // Create lead modal
    showCreateLeadModal,
    onCreateLeadConfirm: handleCreateLeadConfirm,
    onCreateLeadCancel: handleCreateLeadCancel,
    // For special-case handling (if needed)
    pendingOpportunity,
    targetStatus,
    handleStatusUpdate
  };
}