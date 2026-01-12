'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Download,
  CheckCircle,
  Printer,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  XCircle,
  AlertTriangle,
  User,
  Car,
  FileText,
  Eye,
  Share2,
  RefreshCw,
  PlusCircle,
  Wrench,
  Calendar,
  Building,
  Tag,
  ThumbsUp,
  BarChart3,
  Loader2,
  AlertCircle,
  ArrowRight,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  CheckSquare,
  XSquare,
  GitCompare,
  History,
  ShieldCheck,
  FileCheck,
  FileSearch,
  Check,
  X
} from 'lucide-react';
import { postChecklistService, PostChecklist, ChecklistItemStatus } from '@/services/postChecklistService';
import { preChecklistService, PreChecklist } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

interface PostChecklistDetailPageProps {
  id: string;
}

export default function PostChecklistDetailPage({ id }: PostChecklistDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [checklist, setChecklist] = useState<PostChecklist | null>(null);
  const [preChecklist, setPreChecklist] = useState<PreChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [completionStats, setCompletionStats] = useState({
    completionPercentage: 0,
    completedItems: 0,
    totalItems: 0,
    requiredItems: 0,
    completedRequiredItems: 0,
    approvalProgress: 0
  });
  const [canApprove, setCanApprove] = useState(false);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{
    success: boolean;
    stageCompleted?: boolean;
    nextStage?: string;
    message?: string;
  } | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (id) {
      loadChecklist(id);
    }
  }, [id]);

  const loadChecklist = async (id: string) => {
    try {
      setLoading(true);
      let data = await postChecklistService.getPostChecklistById(id);
      setChecklist(data);

      // Load pre-checklist
      try {
        const opportunityId = typeof data.opportunityId === 'object'
          ? data.opportunityId._id
          : data.opportunityId;
        if (opportunityId) {
          const preChecklists = await preChecklistService.getPreChecklistsByOpportunity(opportunityId);
          if (preChecklists.length > 0) {
            const approvedPreChecklists = preChecklists.filter(pc => pc.approved);
            if (approvedPreChecklists.length > 0) {
              const latestPreChecklist = approvedPreChecklists.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              setPreChecklist(latestPreChecklist);
              if (data.inspectionItems.length <= 5) {
                await autoPopulateFromPreChecklist(data._id, latestPreChecklist);
                const updatedData = await postChecklistService.getPostChecklistById(id);
                setChecklist(updatedData);
                data = updatedData;
              }
            } else {
              const latestPreChecklist = preChecklists.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              setPreChecklist(latestPreChecklist);
            }
          }
        }
      } catch (preError) {
        console.warn('Could not load pre-checklist:', preError);
      }

      // Stats
      const stats = await postChecklistService.getChecklistCompletionRate(id);
      const requiredItems = data.inspectionItems.filter(item => item.required !== false);
      const completedRequiredItems = requiredItems.filter(item =>
        item.status === ChecklistItemStatus.COMPLETED ||
        item.status === ChecklistItemStatus.NOT_APPLICABLE
      );
      const approvalProgress = requiredItems.length > 0
        ? Math.round((completedRequiredItems.length / requiredItems.length) * 100)
        : 0;

      setCompletionStats({
        completionPercentage: stats.completionPercentage,
        completedItems: stats.completedItems,
        totalItems: stats.totalItems,
        requiredItems: requiredItems.length,
        completedRequiredItems: completedRequiredItems.length,
        approvalProgress
      });

      setCanApprove(!data.approved && approvalProgress === 100);
    } catch (error) {
      console.error('Error loading post-checklist:', error);
      showToast('Failed to load post-checklist', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateFromPreChecklist = async (postChecklistId: string, preChecklist: PreChecklist) => {
    try {
      const faultItems = preChecklist.inspectionItems.filter(item => item.status === 'fault');
      if (faultItems.length > 0) {
        const postChecklistItems = faultItems.map(item => ({
          item: `Fix: ${item.item}`,
          status: ChecklistItemStatus.INCOMPLETE,
          remarks: `Pre-checklist fault: ${item.remarks || 'No remarks'}`,
          required: true,
          category: 'repair'
        }));

        const qualityItems = [
          { item: 'Work Quality Verification', status: ChecklistItemStatus.INCOMPLETE, remarks: '', required: true, category: 'quality' },
          { item: 'Safety Systems Check', status: ChecklistItemStatus.INCOMPLETE, remarks: '', required: true, category: 'safety' },
          { item: 'Vehicle Cleanliness', status: ChecklistItemStatus.INCOMPLETE, remarks: '', required: true, category: 'cleanliness' }
        ];

        const allItems = [...qualityItems, ...postChecklistItems];
        await postChecklistService.updatePostChecklist(postChecklistId, {
          inspectionItems: allItems,
          notes: `Auto-generated based on pre-checklist #${preChecklist._id.slice(-8)}`
        });
      }
    } catch (error) {
      console.error('Error auto-populating from pre-checklist:', error);
    }
  };

  /* ---------------- helpers ---------------- */

  const renderVehicle = (vehicle: any) => {
    if (!vehicle) return '-';
    if (typeof vehicle === 'string') return vehicle;
    return `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.licensePlate ? `(${vehicle.licensePlate})` : ''}`.trim() || vehicle._id || '—';
  };

  const renderJobCard = (jobCard: any) => {
    if (!jobCard) return '-';
    if (typeof jobCard === 'string') return jobCard;
    return jobCard.jobTitle || jobCard._id || '—';
  };

  const getStatusColor = (approved: boolean) => {
    return approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (approved: boolean) => {
    return approved ? 'Approved' : 'Pending Approval';
  };

  const getStatusIcon = (approved: boolean) => {
    return approved ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const getItemStatusColor = (status: ChecklistItemStatus) => {
    switch (status) {
      case ChecklistItemStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case ChecklistItemStatus.INCOMPLETE: return 'bg-red-100 text-red-800';
      case ChecklistItemStatus.NOT_APPLICABLE: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemStatusIcon = (status: ChecklistItemStatus) => {
    switch (status) {
      case ChecklistItemStatus.COMPLETED: return <CheckSquare className="h-4 w-4" />;
      case ChecklistItemStatus.INCOMPLETE: return <XSquare className="h-4 w-4" />;
      case ChecklistItemStatus.NOT_APPLICABLE: return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPreChecklistStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'fault': return 'bg-red-100 text-red-800';
      case 'n/a': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPreChecklistStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <Check className="h-4 w-4" />;
      case 'fault': return <X className="h-4 w-4" />;
      case 'n/a': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'excellent': return 'bg-emerald-100 text-emerald-800';
      case 'satisfactory': return 'bg-green-100 text-green-800';
      case 'needs_attention': return 'bg-amber-100 text-amber-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /* ---------------- actions ---------------- */

  const handleApprove = async () => {
    if (!checklist) return;
    try {
      setApproving(true);
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      const currentUserName = sessionStorage.getItem('userName') || 'User';

      if (preChecklist) {
        const unresolvedFaults = preChecklist.inspectionItems.filter(item => item.status === 'fault');
        if (unresolvedFaults.length > 0) {
          const allFaultsAddressed = unresolvedFaults.every(fault => {
            const correspondingItem = checklist.inspectionItems.find(item =>
              item.item.includes(fault.item) || item.remarks?.includes(fault.item)
            );
            return correspondingItem?.status === ChecklistItemStatus.COMPLETED;
          });
          if (!allFaultsAddressed) {
            showToast('Some pre-checklist faults are not yet addressed.', 'warning');
            setApproving(false);
            setShowApprovalConfirm(false);
            return;
          }
        }
      }

      const approvedChecklist = await postChecklistService.approvePostChecklist(
        checklist._id,
        approvedBy,
        `Approved by ${currentUserName}`
      );
      setChecklist(approvedChecklist);
      setApprovalResult({
        success: true,
        stageCompleted: false,
        message: 'Post-checklist approved successfully!'
      });
      setCanApprove(false);
      showToast('Post-checklist approved!', 'success');
    } catch (error: any) {
      console.error('Error approving:', error);
      setApprovalResult({
        success: false,
        message: error.message || 'Failed to approve'
      });
      showToast('Failed to approve', 'error');
    } finally {
      setApproving(false);
      setShowApprovalConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!checklist) return;
    if (!confirm('Are you sure you want to delete this post-checklist? This action cannot be undone.')) return;
    try {
      setUpdating(true);
      await postChecklistService.deletePostChecklist(checklist._id);
      showToast('Post-checklist deleted successfully', 'success');
      router.push('/orders/work-orders');
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('Failed to delete', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportHTML = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const htmlContent = await postChecklistService.exportPostChecklistToHtml(checklist._id);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
      showToast('Exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting:', error);
      showToast('Export failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateItemStatus = async (itemIndex: number, status: ChecklistItemStatus) => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const userId = sessionStorage.getItem('userId') || undefined;
      const remarks = status === ChecklistItemStatus.COMPLETED
        ? 'Item completed and verified'
        : status === ChecklistItemStatus.INCOMPLETE
        ? 'Needs attention'
        : 'Not applicable';
      await postChecklistService.checkItem(checklist._id, itemIndex, { status, remarks }, userId);
      await loadChecklist(id);
      showToast('Item status updated', 'success');
    } catch (error) {
      console.error('Error updating item:', error);
      showToast('Failed to update item', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleClone = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const userId = sessionStorage.getItem('userId') || 'system';
      const clonedChecklist = await postChecklistService.clonePostChecklist(checklist._id, userId);
      showToast('Cloned successfully', 'success');
      router.push(`/postchecklists/${clonedChecklist._id}`);
    } catch (error) {
      console.error('Error cloning:', error);
      showToast('Clone failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleGoToWorkflow = () => {
    if (checklist && typeof checklist.opportunityId === 'object' && checklist.opportunityId._id) {
      router.push(`/orders/work-orders?opportunityId=${checklist.opportunityId._id}`);
    } else if (checklist) {
      const opportunityId = typeof checklist.opportunityId === 'string' ? checklist.opportunityId : '';
      router.push(`/orders/work-orders?opportunityId=${opportunityId}`);
    }
  };

  const handleViewPreChecklist = () => {
    if (preChecklist && preChecklist._id) {
      router.push(`/pre-checklist/${preChecklist._id}`);
    }
  };

  /* ---------------- UI states ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading post-checklist...</p>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Post-checklist Not Found</h3>
          <p className="text-gray-600 text-sm mb-4">The checklist you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/orders/work-orders')}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Back to Work Orders
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  const completedItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.COMPLETED).length;
  const incompleteItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.INCOMPLETE).length;
  const requiredItems = checklist.inspectionItems.filter(item => item.required !== false);
  const completedRequiredItems = requiredItems.filter(item =>
    item.status === ChecklistItemStatus.COMPLETED ||
    item.status === ChecklistItemStatus.NOT_APPLICABLE
  );
  const isReadyForApproval = !checklist.approved;

  const preFaultItems = preChecklist ? preChecklist.inspectionItems.filter(item => item.status === 'fault') : [];
  const preOkItems = preChecklist ? preChecklist.inspectionItems.filter(item => item.status === 'ok') : [];
  const addressedFaults = preFaultItems.filter(fault => {
    return checklist.inspectionItems.some(item =>
      (item.item.includes(fault.item) || item.remarks?.includes(fault.item)) &&
      item.status === ChecklistItemStatus.COMPLETED
    );
  });
  const pendingFaults = preFaultItems.filter(fault => !addressedFaults.includes(fault));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/orders/work-orders" className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Post-Service Verification #{checklist._id.slice(-8)}
              </h1>
              <p className="text-sm text-gray-500">Quality Assurance & Pre-Checklist Resolution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(checklist.approved)}`}>
              {getStatusIcon(checklist.approved)}
              {getStatusText(checklist.approved)}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getConditionColor(checklist.overallCondition)}`}>
              {checklist.overallCondition?.replace('_', ' ') || 'Not Rated'}
            </span>
          </div>
        </div>

        {/* Pre-Checklist Banner */}
        {preChecklist && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Based on Pre-Checklist #{preChecklist._id.slice(-8)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {preFaultItems.length} faults • {addressedFaults.length} resolved
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowComparison(true)}
                  className="text-xs px-2.5 py-1 border border-blue-300 text-blue-700 rounded hover:bg-blue-100"
                >
                  <GitCompare className="h-3.5 w-3.5 inline mr-1" />
                  Compare
                </button>
                <button
                  onClick={handleViewPreChecklist}
                  className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Eye className="h-3.5 w-3.5 inline mr-1" />
                  View Pre
                </button>
              </div>
            </div>
            {preFaultItems.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Fault Resolution</span>
                  <span>{addressedFaults.length}/{preFaultItems.length}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${preFaultItems.length > 0 ? (addressedFaults.length / preFaultItems.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approval Banner */}
        {!checklist.approved && (
          <div className={`mt-4 p-3 rounded-lg ${isReadyForApproval ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2">
                {isReadyForApproval ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {isReadyForApproval ? 'Ready for Approval!' : 'Approval Required'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {isReadyForApproval
                      ? preFaultItems.length > 0
                        ? `All ${preFaultItems.length} faults resolved.`
                        : 'All required items complete.'
                      : `${completedRequiredItems.length}/${requiredItems.length} required items done.`}
                  </p>
                </div>
              </div>
              {isReadyForApproval && (
                <button
                  onClick={() => setShowApprovalConfirm(true)}
                  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <ThumbsUp className="h-3.5 w-3.5 inline mr-1" />
                  Approve
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pre-Checklist Summary */}
            {preChecklist && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <FileSearch className="h-4 w-4 text-blue-600" />
                    Pre-Checklist Reference
                  </h2>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      preChecklist.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {preChecklist.approved ? 'Approved' : 'Pending'}
                    </span>
                    <button
                      onClick={handleViewPreChecklist}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Created
                    </p>
                    <p className="text-sm text-gray-800">{formatDate(preChecklist.createdAt as string)}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-3 mb-1">
                      <User className="h-3.5 w-3.5" />
                      Inspected By
                    </p>
                    <p className="text-sm text-gray-800">
                      {typeof preChecklist.inspectedBy === 'object'
                        ? `${preChecklist.inspectedBy.firstName} ${preChecklist.inspectedBy.lastName}`
                        : 'Technician'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Inspection Summary</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-50 p-2 text-center rounded">
                        <div className="text-sm font-bold text-green-700">{preOkItems.length}</div>
                        <div className="text-xs text-green-600">OK</div>
                      </div>
                      <div className="bg-red-50 p-2 text-center rounded">
                        <div className="text-sm font-bold text-red-700">{preFaultItems.length}</div>
                        <div className="text-xs text-red-600">Faults</div>
                      </div>
                      <div className="bg-blue-50 p-2 text-center rounded">
                        <div className="text-sm font-bold text-blue-700">{addressedFaults.length}</div>
                        <div className="text-xs text-blue-600">Resolved</div>
                      </div>
                    </div>
                  </div>
                </div>

                {preFaultItems.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-800 mb-2">Identified Faults ({preFaultItems.length})</h3>
                    <div className="space-y-2">
                      {preFaultItems.map((fault, index) => {
                        const isAddressed = addressedFaults.includes(fault);
                        return (
                          <div key={index} className={`p-2.5 rounded border ${
                            isAddressed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isAddressed ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                )}
                                <span className="text-sm text-gray-800">{fault.item}</span>
                              </div>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                isAddressed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isAddressed ? 'Resolved' : 'Pending'}
                              </span>
                            </div>
                            {fault.remarks && (
                              <p className="text-xs text-gray-600 mt-1">{fault.remarks}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Post-Checklist Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-teal-600" />
                  Verification Items ({checklist.inspectionItems.length})
                </h2>
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">{completedItems}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-red-600">{incompleteItems}</div>
                    <div className="text-xs text-gray-500">Incomplete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">{completionStats.completionPercentage}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
              </div>

              <div className="mb-5 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-800">Verification Progress</span>
                  <span className="text-xs font-bold text-blue-700">
                    {completedRequiredItems.length}/{requiredItems.length}
                  </span>
                </div>
                <div className="h-1.5 bg-blue-200 rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      completionStats.approvalProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${completionStats.approvalProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {completionStats.approvalProgress === 100
                    ? '✓ Ready for approval!'
                    : preFaultItems.length > 0 && pendingFaults.length > 0
                    ? `Resolve ${pendingFaults.length} faults to approve.`
                    : 'Complete all required items to approve.'}
                </p>
              </div>

              <div className="space-y-3">
                {checklist.inspectionItems.map((item, index) => {
                  const isRequired = item.required !== false;
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        isRequired ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-800">
                              {isRequired && <span className="text-red-500">*</span>}
                              {index + 1}. {item.item}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                              {getItemStatusIcon(item.status)}
                              <span className="capitalize">{item.status.replace('_', ' ')}</span>
                            </span>
                            {isRequired && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full">
                                Required
                              </span>
                            )}
                            {item.category && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                item.category === 'repair' ? 'bg-red-100 text-red-800' :
                                item.category === 'quality' ? 'bg-green-100 text-green-800' :
                                item.category === 'safety' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.category}
                              </span>
                            )}
                          </div>
                          {item.remarks && (
                            <p className="text-xs text-gray-600 mt-1">{item.remarks}</p>
                          )}
                          {item.checkedAt && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              Verified: {formatDate(item.checkedAt as string)}
                            </div>
                          )}
                        </div>

                        {!checklist.approved && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleUpdateItemStatus(index, ChecklistItemStatus.COMPLETED)}
                              className={`p-1.5 rounded ${
                                item.status === ChecklistItemStatus.COMPLETED
                                  ? 'bg-green-100 text-green-700'
                                  : 'text-gray-400 hover:text-green-700 hover:bg-green-50'
                              }`}
                              disabled={updating}
                            >
                              <CheckSquare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateItemStatus(index, ChecklistItemStatus.INCOMPLETE)}
                              className={`p-1.5 rounded ${
                                item.status === ChecklistItemStatus.INCOMPLETE
                                  ? 'bg-red-100 text-red-700'
                                  : 'text-gray-400 hover:text-red-700 hover:bg-red-50'
                              }`}
                              disabled={updating}
                            >
                              <XSquare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateItemStatus(index, ChecklistItemStatus.NOT_APPLICABLE)}
                              className={`p-1.5 rounded ${
                                item.status === ChecklistItemStatus.NOT_APPLICABLE
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                              disabled={updating}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Actions</h2>
              <div className="space-y-3">
                {!checklist.approved && isReadyForApproval && (
                  <button
                    onClick={() => setShowApprovalConfirm(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    disabled={approving}
                  >
                    {approving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Approve Verification
                      </>
                    )}
                  </button>
                )}

                {!checklist.approved && !isReadyForApproval && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="font-medium">Approval Requirements</span>
                    </div>
                    {preFaultItems.length > 0 && pendingFaults.length > 0
                      ? `Resolve ${pendingFaults.length} faults to approve.`
                      : `Complete all required items (${completedRequiredItems.length}/${requiredItems.length}).`}
                  </div>
                )}

                {checklist.approved && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Award className="h-3.5 w-3.5" />
                      <span className="font-medium">Verification Approved</span>
                    </div>
                    <button
                      onClick={handleGoToWorkflow}
                      className="mt-2 w-full text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Go to Workflow
                    </button>
                  </div>
                )}

                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-red-600 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-60"
                  disabled={updating}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Verification
                </button>
              </div>

              {/* Stats */}
              <div className="mt-5 pt-5 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Progress Summary</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Overall Completion</span>
                      <span className="font-medium">{completionStats.completionPercentage}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${completionStats.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {preFaultItems.length > 0 && (
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="flex justify-between text-xs font-medium text-blue-800 mb-1">
                        <span>Fault Resolution</span>
                        <span>{addressedFaults.length}/{preFaultItems.length}</span>
                      </div>
                      <div className="h-1.5 bg-blue-200 rounded-full">
                        <div
                          className={`h-full rounded-full ${
                            addressedFaults.length === preFaultItems.length ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${preFaultItems.length > 0 ? (addressedFaults.length / preFaultItems.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 p-2 text-center rounded">
                      <div className="text-sm font-bold text-green-700">{completedItems}</div>
                      <div className="text-xs text-green-600">Completed</div>
                    </div>
                    <div className="bg-red-50 p-2 text-center rounded">
                      <div className="text-sm font-bold text-red-700">{incompleteItems}</div>
                      <div className="text-xs text-red-600">Incomplete</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Related Records</h2>
              <div className="space-y-2">
                {typeof checklist.opportunityId === 'object' && checklist.opportunityId._id && (
                  <Link
                    href={`/opportunities/${checklist.opportunityId._id}`}
                    className="flex items-center justify-between p-2.5 rounded hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-600" />
                      <span>Opportunity</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                )}
                {typeof checklist.vehicleId === 'object' && checklist.vehicleId._id && (
                  <Link
                    href={`/vehicles/${checklist.vehicleId._id}`}
                    className="flex items-center justify-between p-2.5 rounded hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-600" />
                      <span>Vehicle</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                )}
                {typeof checklist.jobCardId === 'object' && checklist.jobCardId._id && (
                  <Link
                    href={`/jobcards/${checklist.jobCardId._id}`}
                    className="flex items-center justify-between p-2.5 rounded hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-600" />
                      <span>Job Card</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                )}
                {preChecklist && (
                  <div
                    onClick={handleViewPreChecklist}
                    className="flex items-center justify-between p-2.5 rounded hover:bg-gray-50 text-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileSearch className="h-4 w-4 text-blue-600" />
                      <span>Pre-Checklist</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Verification Guidelines
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-700">
                <li className="flex items-start gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  Mark as "Completed" only when fully verified.
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  Address all pre-checklist faults before approval.
                </li>
                {pendingFaults.length > 0 && (
                  <li className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-700">{pendingFaults.length} fault(s) need attention.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showApprovalConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Approve Verification</h3>
                  <p className="text-xs text-gray-600">Confirm approval of this post-checklist.</p>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-700">
                    {preFaultItems.length > 0
                      ? `All ${preFaultItems.length} faults have been resolved.`
                      : 'All required items are complete.'}
                  </p>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Items</span>
                    <span>{checklist.inspectionItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <span className="text-green-700">{completedItems}</span>
                  </div>
                  {preFaultItems.length > 0 && (
                    <div className="flex justify-between">
                      <span>Faults Resolved</span>
                      <span className="text-green-700">{addressedFaults.length}/{preFaultItems.length}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowApprovalConfirm(false)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  disabled={approving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                  disabled={approving}
                >
                  {approving ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showComparison && preChecklist && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-semibold">Pre vs Post Comparison</h3>
                </div>
                <button onClick={() => setShowComparison(false)} className="p-1.5 rounded hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-3">Pre-Checklist Issues</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {preChecklist.inspectionItems.map((item, i) => (
                    <div key={i} className={`p-2.5 rounded border ${
                      item.status === 'fault' ? 'bg-red-50 border-red-200' :
                      item.status === 'ok' ? 'bg-green-50 border-green-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getPreChecklistStatusColor(item.status)}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{item.item}</p>
                      {item.remarks && <p className="text-xs text-gray-600 mt-1">{item.remarks}</p>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-3">Post-Checklist Resolutions</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {checklist.inspectionItems.map((item, i) => (
                    <div key={i} className={`p-2.5 rounded border ${
                      item.status === ChecklistItemStatus.COMPLETED ? 'bg-green-50 border-green-200' :
                      item.status === ChecklistItemStatus.INCOMPLETE ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getItemStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{item.item}</p>
                      {item.remarks && <p className="text-xs text-gray-600 mt-1">{item.remarks}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex justify-end">
              <button
                onClick={() => setShowComparison(false)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {approvalResult && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <div className="text-center">
              {approvalResult.success ? (
                <div className="p-3 bg-green-100 rounded-full inline-block mb-3">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <div className="p-3 bg-red-100 rounded-full inline-block mb-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {approvalResult.success ? 'Approved!' : 'Approval Failed'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{approvalResult.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setApprovalResult(null)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
                {approvalResult.success && (
                  <button
                    onClick={() => {
                      setApprovalResult(null);
                      handleGoToWorkflow();
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Workflow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}