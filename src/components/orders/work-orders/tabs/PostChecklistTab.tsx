'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ClipboardList, Plus, Eye, Check, Loader2, 
  CheckCircle, ArrowRight, AlertTriangle,
  FileCheck, AlertCircle, FileText,
  Sparkles, Calendar
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { workOrderService } from '@/services/workOrderService';
import { postChecklistService } from '@/services/postChecklistService';
import { format } from 'date-fns';
import { useToast } from '@/contexts/ToastContext';

interface PostChecklistTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

export default function PostChecklistTab({ workOrder, isTransitioning, onAction }: PostChecklistTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [localLoading, setLocalLoading] = useState(false);
  const [postChecklistStatus, setPostChecklistStatus] = useState({
    hasPostChecklist: false,
    isApproved: false,
    needsApproval: false,
    postChecklistId: '',
    canGenerateInvoice: false
  });

  useEffect(() => {
    loadPostChecklistStatus();
  }, [workOrder]);

  const loadPostChecklistStatus = async () => {
    if (!workOrder._id) return;
    
    try {
      const hasPostChecklist = !!workOrder.postChecklistId;
      let isApproved = false;
      
      if (hasPostChecklist && workOrder.postChecklistId) {
        try {
          const checklist = await postChecklistService.getPostChecklistById(workOrder.postChecklistId);
          isApproved = checklist.approved || false;
        } catch (error) {
          console.error('Error loading post-checklist details:', error);
        }
      }
      
      setPostChecklistStatus({
        hasPostChecklist,
        isApproved,
        needsApproval: hasPostChecklist && !isApproved,
        postChecklistId: workOrder.postChecklistId || '',
        canGenerateInvoice: hasPostChecklist && isApproved && !workOrder.invoiceId
      });
    } catch (error) {
      console.error('Error loading post-checklist status:', error);
    }
  };

  const handleCreatePostChecklist = () => {
    router.push(`/post-checklist/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}&source=workflow`);
  };

  const handleViewPostChecklist = () => {
    if (postChecklistStatus.postChecklistId) {
      window.open(`/post-checklist/${postChecklistStatus.postChecklistId}`, '_blank');
    }
  };

  const handleApprovePostChecklist = async () => {
    setLocalLoading(true);
    try {
      await onAction(async () => {
        if (!postChecklistStatus.postChecklistId) {
          throw new Error('No post-checklist found to approve');
        }

        // Approve the post-checklist
        await postChecklistService.approvePostChecklist(
          postChecklistStatus.postChecklistId,
          sessionStorage.getItem('userId') || undefined
        );

        // Update work order stage approvals and move to invoice stage
        await workOrderService.updateWorkOrder(workOrder._id, {
          stageApprovals: {
            ...workOrder.stageApprovals,
            post_checklist: {
              ...workOrder.stageApprovals?.post_checklist,
              approved: true,
              approvedAt: new Date().toISOString(),
              approvedBy: sessionStorage.getItem('userId') || 'manual'
            }
          },
          postChecklistCompletionDate: new Date().toISOString(),
          currentStage: 'invoice', // Move to invoice stage after approval
          updatedAt: new Date().toISOString()
        });

        showToast('Post-checklist approved successfully', 'success');
        await loadPostChecklistStatus();
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to approve post-checklist', 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setLocalLoading(true);
    try {
      await onAction(async () => {
        const invoiceResult = await workOrderService.generateInvoice(workOrder._id);
        await workOrderService.updateWorkOrder(workOrder._id, {
          invoiceId: invoiceResult.invoice._id,
          currentStage: 'invoice',
          status: 'ready_for_invoice',
          updatedAt: new Date().toISOString()
        });
        showToast('Invoice generated successfully', 'success');
        await loadPostChecklistStatus();
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to generate invoice', 'error');
    } finally {
      setLocalLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const handleCreateInvoice = () => {
    if (workOrder.invoiceId) {
      router.push(`/invoices/${workOrder.invoiceId}`);
    } else {
      router.push(`/invoices/create?workOrderId=${workOrder._id}&opportunityId=${workOrder.opportunityId}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Post-Checklist</h3>
          <p className="text-sm text-gray-600">Post-service quality verification</p>
        </div>
        
        {/* Dynamic button based on status */}
        {!postChecklistStatus.hasPostChecklist && (
          <button
            onClick={handleCreatePostChecklist}
            disabled={isTransitioning || localLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create Post-Checklist
          </button>
        )}
      </div>
      
      {postChecklistStatus.hasPostChecklist ? (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`rounded-xl p-6 ${
            postChecklistStatus.isApproved 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
          }`}>
            <div className="flex items-center gap-4">
              {postChecklistStatus.isApproved ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-600" />
              )}
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900">
                  {postChecklistStatus.isApproved ? 'Post-Checklist Approved' : 'Post-Checklist Created'}
                </h4>
                <p className="text-gray-600">
                  {postChecklistStatus.isApproved 
                    ? 'Ready to proceed to Invoice generation' 
                    : 'Needs approval before proceeding to Invoice'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleViewPostChecklist}
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
                Review or modify the post-checklist details
              </p>
              <button
                onClick={handleViewPostChecklist}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
              >
                Open Post-Checklist
              </button>
            </div>
            
            {/* Approval/Next Step Button */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                {postChecklistStatus.isApproved ? (
                  <FileText className="h-5 w-5 text-green-600" />
                ) : (
                  <Check className="h-5 w-5 text-amber-600" />
                )}
                <h5 className="font-medium text-gray-900">
                  {postChecklistStatus.isApproved ? 'Next Step' : 'Approval'}
                </h5>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {postChecklistStatus.isApproved 
                  ? 'Proceed to create Invoice' 
                  : 'Approve the post-checklist to continue'}
              </p>
              <button
                onClick={postChecklistStatus.isApproved ? handleGenerateInvoice : handleApprovePostChecklist}
                disabled={isTransitioning || localLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(isTransitioning || localLoading) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {postChecklistStatus.isApproved ? (
                      <>
                        Generate Invoice
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Approve Post-Checklist
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
                postChecklistStatus.hasPostChecklist ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <ClipboardList className={`h-5 w-5 ${
                  postChecklistStatus.hasPostChecklist ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <span className="text-sm font-medium">Created</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            
            <div className="text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                postChecklistStatus.isApproved ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Check className={`h-5 w-5 ${
                  postChecklistStatus.isApproved ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <span className="text-sm font-medium">Approved</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            
            <div className="text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                postChecklistStatus.isApproved ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <FileText className={`h-5 w-5 ${
                  postChecklistStatus.isApproved ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <span className="text-sm font-medium">Next: Invoice</span>
            </div>
          </div>
          
          {/* Invoice Status */}
          {postChecklistStatus.isApproved && workOrder.invoiceId && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Invoice Generated</h4>
                    <p className="text-sm text-gray-600">
                      Invoice #{workOrder.invoiceId?.slice(-6)} created successfully
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/invoices/${workOrder.invoiceId}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // No post-checklist state
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
          <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-900 mb-2">No Post-Checklist Created</h4>
          <p className="text-gray-600 mb-6">
            Create a post-service quality verification checklist.
          </p>
          <button
            onClick={handleCreatePostChecklist}
            disabled={isTransitioning || localLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create Post-Checklist
          </button>
        </div>
      )}
    </div>
  );
}