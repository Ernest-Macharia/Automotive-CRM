'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardList, Eye, CheckCircle, ArrowRight, 
  Loader2, AlertCircle, RefreshCw, Clock,
  ShieldCheck, FileCheck, TrendingUp, BarChart3
} from 'lucide-react';
import { WorkOrder } from '@/services/workOrderService';
import { postChecklistService } from '@/services/postChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import PostChecklistTypeModal from '@/components/post-checklist/PostChecklistTypeModal';

interface PostChecklistTabProps {
  workOrder: WorkOrder;
  isTransitioning: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}

export default function PostChecklistTab({ 
  workOrder, 
  isTransitioning, 
  onAction 
}: PostChecklistTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = useState({
    hasPostChecklist: false,
    isApproved: false,
    isPending: false,
    postChecklistId: '',
    qualityScore: 0,
    lastChecked: null as Date | null,
    details: null as any
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostChecklistModal, setShowPostChecklistModal] = useState(false);

  useEffect(() => {
    loadStatus();
    // Auto-refresh if pending
    const interval = setInterval(() => {
      if (status.isPending && !refreshing) {
        loadStatus();
      }
    }, 8000);
    
    return () => clearInterval(interval);
  }, [workOrder._id]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const hasPostChecklist = !!workOrder.postChecklistId;
      let isApproved = false;
      let qualityScore = 0;
      let details = null;

      if (hasPostChecklist && workOrder.postChecklistId) {
        try {
          const checklist = await postChecklistService.getPostChecklistById(workOrder.postChecklistId);
          isApproved = checklist.approved || false;
          qualityScore = checklist.qualityScore || 95;
          details = checklist;
        } catch (error) {
          console.error('Error loading details:', error);
        }
      }

      setStatus({
        hasPostChecklist,
        isApproved,
        isPending: hasPostChecklist && !isApproved,
        postChecklistId: workOrder.postChecklistId || '',
        qualityScore,
        lastChecked: new Date(),
        details
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
    showToast('Quality status refreshed', 'success');
  };

  const handleCreatePostChecklist = () => {
    setShowPostChecklistModal(true);
  };

  const handleViewPostChecklist = () => {
    if (status.postChecklistId) {
      window.open(`/post-checklist/${status.postChecklistId}`, '_blank');
    }
  };

  const handleApprovePostChecklist = async () => {
    await onAction(async () => {
      await postChecklistService.approvePostChecklist(
        status.postChecklistId,
        sessionStorage.getItem('userId')
      );
      await workOrderService.updateWorkOrder(workOrder._id, {
        stageApprovals: {
          ...workOrder.stageApprovals,
          post_checklist: { approved: true, approvedAt: new Date().toISOString() }
        }
      });
      await loadStatus();
      showToast('Quality check approved', 'success');
    });
  };

  const handleGenerateInvoice = async () => {
    await onAction(async () => {
      const result = await workOrderService.generateInvoice(workOrder._id);
      await workOrderService.updateWorkOrder(workOrder._id, {
        invoiceId: result.invoice._id,
        currentStage: 'invoice'
      });
      showToast('Invoice generated successfully', 'success');
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOpportunityId = (workOrder: WorkOrder): string => {
    if (!workOrder.opportunityId) return '';
    if (typeof workOrder.opportunityId === 'string') {
      return workOrder.opportunityId;
    }
    if (typeof workOrder.opportunityId === 'object' && workOrder.opportunityId?._id) {
      return workOrder.opportunityId._id;
    }
    return '';
  };

  const QualityScoreCard = () => (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-purple-900">Quality Score</h4>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-purple-700">{status.qualityScore}</span>
            <span className="text-purple-600">/100</span>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl shadow-sm">
          <TrendingUp className="h-6 w-6 text-purple-600" />
        </div>
      </div>
      <div className="mt-3">
        <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000"
            style={{ width: `${status.qualityScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-purple-600 mt-1">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </div>
    </div>
  );

  const StatusCard = () => {
    if (status.hasPostChecklist) {
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
                <h3 className="text-xl font-bold text-emerald-800">Quality Verified ✓</h3>
                <p className="text-emerald-700">Service quality meets all standards</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <Clock className="h-4 w-4" />
                    <span>Verified: {status.lastChecked ? formatTime(status.lastChecked) : 'Just now'}</span>
                  </div>
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
              <h3 className="text-xl font-bold text-amber-800">Quality Review Required</h3>
              <p className="text-amber-700">Final verification needed before invoicing</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Auto-refreshing every 8s</span>
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
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-8 text-center">
        <div className="p-4 bg-white rounded-2xl inline-block mb-4">
          <ClipboardList className="h-12 w-12 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-purple-900 mb-2">Complete Quality Assurance</h3>
        <p className="text-purple-700 mb-6 max-w-md mx-auto">
          Verify service completion, document results, and ensure customer satisfaction
        </p>
        <button
          onClick={handleCreatePostChecklist}
          disabled={isTransitioning}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          <ClipboardList className="h-5 w-5" />
          Create Quality Report
        </button>
      </div>
    );
  };

  const ActionButtons = () => {
    if (!status.hasPostChecklist) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button
          onClick={handleViewPostChecklist}
          className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900">View Report</h4>
              <p className="text-sm text-gray-600">Inspect quality verification</p>
            </div>
          </div>
        </button>

        {!status.isApproved ? (
          <button
            onClick={handleApprovePostChecklist}
            disabled={isTransitioning}
            className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5" />
                <div className="text-left">
                  <h4 className="font-semibold">Approve Quality</h4>
                  <p className="text-sm text-amber-100">Verify service completion</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            </div>
          </button>
        ) : (
          <button
            onClick={handleGenerateInvoice}
            disabled={isTransitioning || !!workOrder.invoiceId}
            className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5" />
                <div className="text-left">
                  <h4 className="font-semibold">Generate Invoice</h4>
                  <p className="text-sm text-emerald-100">Proceed to billing</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        )}

        <QualityScoreCard />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quality assurance status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quality Assurance</h2>
          <p className="text-gray-600">Post-service verification and sign-off</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BarChart3 className="h-4 w-4" />
          <span>Quality Metrics</span>
        </div>
      </div>

      <StatusCard />
      
      <AnimatePresence mode="wait">
        {status.hasPostChecklist && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mt-6">
              <ActionButtons />
              
              {/* Progress Steps */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Quality Verification Steps</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: <ClipboardList />, label: 'Documentation', status: status.hasPostChecklist },
                    { icon: <Eye />, label: 'Review', status: status.hasPostChecklist },
                    { icon: <ShieldCheck />, label: 'Approval', status: status.isApproved }
                  ].map((step, index) => (
                    <div key={step.label} className={`p-4 rounded-xl border-2 ${step.status ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${step.status ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {step.icon}
                      </div>
                      <h5 className="font-semibold text-gray-900">{step.label}</h5>
                      <div className={`mt-2 text-sm ${step.status ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {step.status ? '✓ Completed' : 'Pending'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PostChecklistTypeModal
        isOpen={showPostChecklistModal}
        onClose={() => setShowPostChecklistModal(false)}
        workOrderId={workOrder._id}
        opportunityId={getOpportunityId(workOrder)}
      />
    </div>
  );
}