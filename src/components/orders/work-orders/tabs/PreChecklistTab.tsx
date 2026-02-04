// src/components/orders/work-orders/tabs/PreChecklistTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Plus, Eye, Check, 
  Loader2, ArrowRight, CheckCircle,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { preChecklistService } from '@/services/preChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

interface PreChecklistTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

export default function PreChecklistTab({ workOrder, isTransitioning, onAction }: PreChecklistTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localLoading, setLocalLoading] = useState(false);
  const [preChecklistStatus, setPreChecklistStatus] = useState({
    hasPreChecklist: false,
    isApproved: false,
    needsApproval: false,
    preChecklistId: ''
  });

  useEffect(() => {
    loadPreChecklistStatus();
  }, [workOrder]);

  const loadPreChecklistStatus = async () => {
    if (!workOrder._id) return;
    
    try {
      const status = await workOrderService.getPreChecklistApprovalStatus(workOrder._id);
      setPreChecklistStatus({
        hasPreChecklist: status.hasPreChecklist,
        isApproved: status.isApproved,
        needsApproval: status.needsApproval,
        preChecklistId: status.preChecklistId || ''
      });
    } catch (error) {
      console.error('Error loading pre-checklist status:', error);
    }
  };

  const handleCreatePreChecklist = async () => {
    try {
      // Redirect to pre-checklist creation page
      router.push(`/pre-checklist/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}&source=workflow`);
    } catch (error) {
      console.error('Error creating pre-checklist:', error);
      showToast('Failed to create pre-checklist', 'error');
    }
  };

  const handleViewPreChecklist = () => {
    if (preChecklistStatus.preChecklistId) {
      window.open(`/pre-checklist/${preChecklistStatus.preChecklistId}`, '_blank');
    }
  };

  const handleApprovePreChecklist = async () => {
    setLocalLoading(true);
    try {
      // Use the onAction prop which is now handleStageTransition
      await onAction(async () => {
        const userId = sessionStorage.getItem('userId') || undefined;
        const result = await workOrderService.approvePreChecklistManually(
          workOrder._id,
          userId
        );
        
        if (result.success) {
          showToast(result.message, 'success');
          // Reload status
          await loadPreChecklistStatus();
        } else {
          throw new Error(result.message);
        }
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to approve pre-checklist', 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCreateJobCard = () => {
    // Redirect to job card creation page
    router.push(`/job-cards/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pre-Checklist</h3>
          <p className="text-sm text-gray-600">Pre-service inspection document</p>
        </div>
        
        {/* Dynamic button based on status */}
        {!preChecklistStatus.hasPreChecklist && (
          <button
            onClick={handleCreatePreChecklist}
            disabled={isTransitioning || localLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create Pre-Checklist
          </button>
        )}
      </div>
      
      {preChecklistStatus.hasPreChecklist ? (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`rounded-xl p-6 ${
            preChecklistStatus.isApproved 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
          }`}>
            <div className="flex items-center gap-4">
              {preChecklistStatus.isApproved ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-600" />
              )}
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900">
                  {preChecklistStatus.isApproved ? 'Pre-Checklist Approved' : 'Pre-Checklist Created'}
                </h4>
                <p className="text-gray-600">
                  {preChecklistStatus.isApproved 
                    ? 'Ready to proceed to Job Card creation' 
                    : 'Needs approval before proceeding'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleViewPreChecklist}
                  className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* View/Edit Button */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <h5 className="font-medium text-gray-900">View/Edit</h5>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Review or modify the pre-checklist details
              </p>
              <button
                onClick={handleViewPreChecklist}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
              >
                Open Pre-Checklist
              </button>
            </div>
            
            {/* Approval/Next Step Button */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                {preChecklistStatus.isApproved ? (
                  <FileCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <Check className="h-5 w-5 text-amber-600" />
                )}
                <h5 className="font-medium text-gray-900">
                  {preChecklistStatus.isApproved ? 'Next Step' : 'Approval'}
                </h5>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {preChecklistStatus.isApproved 
                  ? 'Proceed to create Job Card' 
                  : 'Approve the pre-checklist to continue'}
              </p>
              <button
                onClick={preChecklistStatus.isApproved ? handleCreateJobCard : handleApprovePreChecklist}
                disabled={isTransitioning || localLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(isTransitioning || localLoading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {preChecklistStatus.isApproved ? (
                      <>
                        Create Job Card
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Approve Pre-Checklist
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center justify-center space-x-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                preChecklistStatus.hasPreChecklist ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <ClipboardCheck className={`h-5 w-5 ${
                  preChecklistStatus.hasPreChecklist ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <span className="text-sm font-medium">Created</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            
            <div className="text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                preChecklistStatus.isApproved ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Check className={`h-5 w-5 ${
                  preChecklistStatus.isApproved ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <span className="text-sm font-medium">Approved</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            
            <div className="text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                preChecklistStatus.isApproved ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <FileCheck className={`h-5 w-5 ${
                  preChecklistStatus.isApproved ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <span className="text-sm font-medium">Next: Job Card</span>
            </div>
          </div>
        </div>
      ) : (
        // No pre-checklist state
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
          <ClipboardCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-900 mb-2">No Pre-Checklist Created</h4>
          <p className="text-gray-600 mb-6">
            Create a pre-service inspection checklist to start the workflow.
          </p>
          <button
            onClick={handleCreatePreChecklist}
            disabled={isTransitioning || localLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create Pre-Checklist
          </button>
        </div>
      )}
    </div>
  );
}