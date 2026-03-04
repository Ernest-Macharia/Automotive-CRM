import { useCallback, useState } from 'react';
import { opportunityService } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';

// Define the status type
export type OpportunityStatus = 
  | 'new' 
  | 'attempted_to_contact' 
  | 'prospecting' 
  | 'appointment_scheduled' 
  | 'non_progressive' 
  | 'lost' 
  | 'won';

export function useOpportunityRefresh(opportunityId: string) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const refreshOpportunity = useCallback(async () => {
    try {
      setLoading(true);
      const data = await opportunityService.getOpportunityById(opportunityId);
      return data;
    } catch (error) {
      console.error('Error refreshing opportunity:', error);
      showToast('Failed to refresh opportunity data', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [opportunityId, showToast]);

  const recalculateScore = useCallback(async () => {
    try {
      setLoading(true);
      await opportunityService.recalculateLeadScore(opportunityId);
      showToast('Lead score recalculated', 'success');
      return await refreshOpportunity();
    } catch (error: any) {
      console.error('Error recalculating score:', error);
      showToast(error.message || 'Failed to recalculate score', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [opportunityId, refreshOpportunity, showToast]);

  const refreshLIS = useCallback(async () => {
    try {
      setLoading(true);
      await opportunityService.refreshLISValidation(opportunityId);
      showToast('LIS validation refreshed', 'success');
      return await refreshOpportunity();
    } catch (error: any) {
      console.error('Error refreshing LIS:', error);
      showToast(error.message || 'Failed to refresh LIS', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [opportunityId, refreshOpportunity, showToast]);

  // Fixed: Use the correct status type
  const updateStatus = useCallback(async (newStatus: OpportunityStatus) => {
    try {
      setLoading(true);
      await opportunityService.updateOpportunity(opportunityId, { status: newStatus });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('opportunity-status-updated', {
            detail: {
              opportunityId,
              newStatus,
              updatedAt: new Date().toISOString(),
            },
          })
        );
      }
      showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
      return await refreshOpportunity();
    } catch (error: any) {
      console.error('Error updating status:', error);
      showToast(error.message || 'Failed to update status', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [opportunityId, refreshOpportunity, showToast]);

  return {
    loading,
    refreshOpportunity,
    recalculateScore,
    refreshLIS,
    updateStatus
  };
}
