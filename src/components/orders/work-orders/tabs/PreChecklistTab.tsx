'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Eye, CheckCircle, ArrowRight,
  Loader2, AlertCircle, RefreshCw, Clock,
  FileCheck, ShieldCheck, Users, Calendar
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { preChecklistService } from '@/services/preChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import PreChecklistTypeModal from '@/components/pre-checklist/PreChecklistTypeModal';

interface PreChecklistTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

export default function PreChecklistTab({ 
  workOrder, 
  isTransitioning, 
  onAction 
}: PreChecklistTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = useState({
    hasPreChecklist: false,
    isApproved: false,
    isPending: false,
    preChecklistId: '',
    lastChecked: null as Date | null,
    details: null as any
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPreChecklistModal, setShowPreChecklistModal] = useState(false);

  useEffect(() => {
    loadStatus();
    // Poll every 20 seconds if pending approval
    const interval = setInterval(() => {
      if (status.isPending && !refreshing) {
        loadStatus();
      }
    }, 20000);
    
    return () => clearInterval(interval);
  }, [workOrder._id]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await workOrderService.getPreChecklistApprovalStatus(workOrder._id);
      setStatus({
        hasPreChecklist: response.hasPreChecklist,
        isApproved: response.isApproved,
        isPending: response.needsApproval,
        preChecklistId: response.preChecklistId || '',
        lastChecked: new Date(),
        details: response.details
      });
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
    showToast('Status refreshed', 'success');
  };

  const handleCreatePreChecklist = () => {
    // Open modal instead of direct navigation
    setShowPreChecklistModal(true);
  };

  const handleViewPreChecklist = () => {
    if (status.preChecklistId) {
      window.open(`/pre-checklist/${status.preChecklistId}`, '_blank');
    }
  };

  const handleApprovePreChecklist = async () => {
    await onAction(async () => {
      const userId = sessionStorage.getItem('userId');
      await workOrderService.approvePreChecklistManually(workOrder._id, userId);
      await loadStatus();
      showToast('Pre-checklist approved successfully', 'success');
    });
  };

  const getOpportunityId = (workOrder: WorkOrder): string => {
    if (!workOrder.opportunityId) return '';
    
    // If it's a string, return it directly
    if (typeof workOrder.opportunityId === 'string') {
      return workOrder.opportunityId;
    }
    
    // If it's an object with _id property, return that
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId?._id) {
      return workOrder.opportunityId._id;
    }
    
    return '';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleProceedToJobCard = () => {
    const query = new URLSearchParams({
      workOrderId: workOrder._id,
      source: 'workflow'
    });

    const opportunityId = getOpportunityId(workOrder);
    if (opportunityId) {
      query.set('opportunityId', opportunityId);
    }

    if (status.preChecklistId) {
      query.set('preChecklistId', status.preChecklistId);
    }

    router.push(`/job-cards/create?${query.toString()}`);
  };

  const StatusCard = () => {
    if (status.hasPreChecklist) {
      if (status.isApproved) {
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-emerald-800">Approved & Verified</h3>
                <p className="text-emerald-700">Ready for service execution</p>
                <div className="flex items-center gap-3 mt-3 text-sm text-emerald-600">
                  <Clock className="h-4 w-4" />
                  <span>Last checked: {status.lastChecked ? formatTime(status.lastChecked) : 'Just now'}</span>
                </div>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </motion.div>
        );
      }

      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-800">Awaiting Approval</h3>
              <p className="text-amber-700">Review required before proceeding</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Auto-refreshing every 20s</span>
                </div>
              </div>
            </div>
            <button
              onClick={refreshStatus}
              disabled={refreshing}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-amber-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
        <div className="p-4 bg-white rounded-2xl inline-block mb-4">
          <ClipboardCheck className="h-12 w-12 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-blue-900 mb-2">Start with Pre-Service Checklist</h3>
        <p className="text-blue-700 mb-6 max-w-md mx-auto">
          Document initial inspection, validate requirements, and set expectations before service work begins
        </p>
        <button
          onClick={handleCreatePreChecklist}
          disabled={isTransitioning}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          <ClipboardCheck className="h-5 w-5" />
          Create Pre-Checklist
        </button>
      </div>
    );
  };

  const ActionButtons = () => {
    if (!status.hasPreChecklist) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <button
          onClick={handleViewPreChecklist}
          className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900">View Details</h4>
              <p className="text-sm text-gray-600">Inspect pre-service checklist</p>
            </div>
          </div>
        </button>

        {status.isApproved ? (
          <button
            onClick={handleProceedToJobCard}
            disabled={isTransitioning}
            className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5" />
                <div className="text-left">
                  <h4 className="font-semibold">Next: Service Execution</h4>
                  <p className="text-sm text-emerald-100">Proceed to create job cards</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ) : (
          <button
            onClick={handleApprovePreChecklist}
            disabled={isTransitioning}
            className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5" />
                <div className="text-left">
                  <h4 className="font-semibold">Approve Checklist</h4>
                  <p className="text-sm text-amber-100">Verify and authorize</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            </div>
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pre-checklist status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pre-Service Checklist</h2>
          <p className="text-gray-600">Initial validation and requirements gathering</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>Team Collaboration</span>
        </div>
      </div>

      <StatusCard />
      
      <AnimatePresence mode="wait">
        {status.hasPreChecklist && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mt-6">
              <ActionButtons />
              
              {/* Progress Timeline */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Progress Timeline</h4>
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
                  <div className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-10 transition-all duration-500"
                       style={{ width: status.isApproved ? '100%' : '50%' }} />
                  
                  {['Created', 'Reviewed', 'Approved'].map((step, index) => (
                    <div key={step} className="relative z-20 text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        (index === 0) ? 'bg-emerald-500 text-white' :
                        (index === 1 && status.hasPreChecklist) ? 'bg-emerald-500 text-white' :
                        (index === 2 && status.isApproved) ? 'bg-emerald-500 text-white' :
                        'bg-white border-2 border-gray-300 text-gray-400'
                      }`}>
                        {index === 0 && <ClipboardCheck className="h-5 w-5" />}
                        {index === 1 && <Eye className="h-5 w-5" />}
                        {index === 2 && <CheckCircle className="h-5 w-5" />}
                      </div>
                      <span className="text-sm font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PreChecklistTypeModal
        isOpen={showPreChecklistModal}
        onClose={() => setShowPreChecklistModal(false)}
        workOrderId={workOrder._id}
        opportunityId={getOpportunityId(workOrder)}
      />
    </div>
  );
}
