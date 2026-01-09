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
  BarChart3
} from 'lucide-react';
import { postChecklistService, PostChecklist, ChecklistItemStatus } from '@/services/postChecklistService';
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [completionStats, setCompletionStats] = useState({
    completionPercentage: 0,
    completedItems: 0,
    totalItems: 0
  });

  useEffect(() => {
    if (id) {
      loadChecklist(id);
    }
  }, [id]);

  const loadChecklist = async (id: string) => {
    try {
      setLoading(true);
      const data = await postChecklistService.getPostChecklistById(id);
      setChecklist(data);
      
      // Load completion stats
      const stats = await postChecklistService.getChecklistCompletionRate(id);
      setCompletionStats({
        completionPercentage: stats.completionPercentage,
        completedItems: stats.completedItems,
        totalItems: stats.totalItems
      });
    } catch (error) {
      console.error('Error loading post-checklist:', error);
      showToast('Failed to load post-checklist', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
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
    return approved 
      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
      : 'bg-gradient-to-r from-yellow-500 to-amber-500';
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
      case ChecklistItemStatus.COMPLETED: return <CheckCircle className="h-4 w-4" />;
      case ChecklistItemStatus.INCOMPLETE: return <AlertTriangle className="h-4 w-4" />;
      case ChecklistItemStatus.NOT_APPLICABLE: return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  /* ---------------- actions ---------------- */

  const handleApprove = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      const approvedChecklist = await postChecklistService.approvePostChecklist(checklist._id, approvedBy);
      setChecklist(approvedChecklist);
      showToast('Post-checklist approved successfully', 'success');
    } catch (error) {
      console.error('Error approving post-checklist:', error);
      showToast('Failed to approve post-checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveWithLifecycle = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      
      const result = await postChecklistService.approvePostChecklistWithLifecycle(
        checklist._id, 
        approvedBy,
        'Post-service quality inspection approved'
      );
      
      setChecklist(result.checklist);
      
      if (result.lifecycleUpdate.stageCompleted) {
        if (result.lifecycleUpdate.nextStage) {
          showToast(`Checklist approved! Auto-advanced to ${result.lifecycleUpdate.nextStage} stage`, 'success');
        } else {
          showToast('Checklist approved! Stage marked as complete.', 'success');
        }
      } else {
        showToast('Checklist approved!', 'success');
      }
    } catch (error) {
      console.error('Error approving post-checklist:', error);
      showToast('Failed to approve checklist', 'error');
    } finally {
      setUpdating(false);
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
      console.error('Error deleting post-checklist:', error);
      showToast('Failed to delete post-checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportHTML = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const htmlContent = await postChecklistService.exportPostChecklistToHtml(checklist._id);
      
      // Create a new window with the HTML content for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
      
      showToast('Post-checklist exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting post-checklist:', error);
      showToast('Failed to export post-checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateItemStatus = async (itemIndex: number, status: ChecklistItemStatus) => {
    if (!checklist || checklist.approved) return;
    
    try {
      setUpdating(true);
      const userId = sessionStorage.getItem('userId') || undefined;
      const remarks = status === ChecklistItemStatus.COMPLETED 
        ? 'Item completed' 
        : status === ChecklistItemStatus.INCOMPLETE 
          ? 'Needs attention' 
          : 'Not applicable';
      
      await postChecklistService.checkItem(checklist._id, itemIndex, { status, remarks }, userId);
      
      // Reload checklist to get updated data
      const updatedChecklist = await postChecklistService.getPostChecklistById(checklist._id);
      setChecklist(updatedChecklist);
      
      // Update completion stats
      const stats = await postChecklistService.getChecklistCompletionRate(checklist._id);
      setCompletionStats({
        completionPercentage: stats.completionPercentage,
        completedItems: stats.completedItems,
        totalItems: stats.totalItems
      });
      
      showToast('Item status updated successfully', 'success');
    } catch (error) {
      console.error('Error updating item status:', error);
      showToast('Failed to update item status', 'error');
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
      showToast('Post-checklist cloned successfully', 'success');
      router.push(`/postchecklists/${clonedChecklist._id}`);
    } catch (error) {
      console.error('Error cloning post-checklist:', error);
      showToast('Failed to clone post-checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  /* ---------------- UI states ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Post-checklist not found</p>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  const completedItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.COMPLETED).length;
  const incompleteItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.INCOMPLETE).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-blue-600 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders/work-orders" className="p-2 hover:bg-white/20 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Post-Service Checklist #{checklist._id.slice(-8)}</h1>
              <p className="text-teal-100">Quality Inspection Details</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                checklist.approved
              )} text-white`}
            >
              {getStatusIcon(checklist.approved)}
              {getStatusText(checklist.approved)}
            </span>
            
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              checklist.overallCondition === 'satisfactory' ? 'bg-green-500' :
              checklist.overallCondition === 'needs_attention' ? 'bg-yellow-500' :
              'bg-gray-500'
            } text-white`}>
              {checklist.overallCondition?.replace('_', ' ') || 'Not Rated'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-teal-600" />
                Inspection Information
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportHTML} 
                  className="btn-soft-teal flex items-center gap-2"
                  disabled={updating}
                >
                  {updating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Print/Export
                </button>
                <button 
                  onClick={handleClone} 
                  className="btn-soft-purple flex items-center gap-2"
                  disabled={updating}
                >
                  <PlusCircle className="h-4 w-4" />
                  Clone
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="label flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created Date
                </p>
                <p className="value">{formatDate(checklist.createdAt as string)}</p>

                <p className="label mt-4 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle
                </p>
                <p className="value">{renderVehicle(checklist.vehicleId)}</p>

                <p className="label mt-4 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Job Card
                </p>
                <p className="value">{renderJobCard(checklist.jobCardId)}</p>
              </div>

              <div>
                <p className="label flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Inspected By
                </p>
                <p className="value">
                  {typeof checklist.inspectedBy === 'object' 
                    ? `${checklist.inspectedBy.firstName} ${checklist.inspectedBy.lastName}`
                    : 'Technician'
                  }
                </p>

                {checklist.approvedBy && checklist.approvedAt && (
                  <>
                    <p className="label mt-4">Approved By</p>
                    <p className="value">
                      {typeof checklist.approvedBy === 'object' 
                        ? `${checklist.approvedBy.firstName} ${checklist.approvedBy.lastName}`
                        : checklist.approvedBy
                      } on {formatDate(checklist.approvedAt as string)}
                    </p>
                  </>
                )}

                <p className="label mt-4">Status</p>
                <p className="value">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(checklist.approved)} text-white`}>
                    {getStatusIcon(checklist.approved)}
                    {getStatusText(checklist.approved)}
                  </span>
                </p>
              </div>
            </div>

            {/* Notes & Recommendations */}
            <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
              {checklist.notes && (
                <div>
                  <p className="label flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </p>
                  <p className="value mt-2 text-gray-700">{checklist.notes}</p>
                </div>
              )}
              
              {checklist.recommendations && (
                <div>
                  <p className="label flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Recommendations
                  </p>
                  <p className="value mt-2 text-gray-700">{checklist.recommendations}</p>
                </div>
              )}
            </div>
          </div>

          {/* Inspection Items */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-teal-600" />
                Quality Inspection Items ({checklist.inspectionItems.length})
              </h2>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedItems}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{incompleteItems}</div>
                  <div className="text-xs text-gray-600">Incomplete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{completionStats.completionPercentage}%</div>
                  <div className="text-xs text-gray-600">Completion</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {checklist.inspectionItems.map((item, index) => (
                <div key={index} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">
                        {item.required && <span className="text-red-500 mr-1">*</span>}
                        {index + 1}. {item.item}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                        {getItemStatusIcon(item.status)}
                        <span className="capitalize">{item.status.replace('_', ' ')}</span>
                      </span>
                      {item.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.remarks && (
                      <p className="text-sm text-gray-600">{item.remarks}</p>
                    )}
                    {item.checkedAt && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        Checked: {formatDate(item.checkedAt as string)}
                        {item.checkedBy && typeof item.checkedBy === 'object' && (
                          <> by {item.checkedBy.firstName} {item.checkedBy.lastName}</>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!checklist.approved && (
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleUpdateItemStatus(index, ChecklistItemStatus.COMPLETED)}
                        className={`p-2 rounded-full ${
                          item.status === ChecklistItemStatus.COMPLETED
                            ? 'bg-green-100 text-green-600 border border-green-300' 
                            : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                        }`}
                        title="Mark as Completed"
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateItemStatus(index, ChecklistItemStatus.INCOMPLETE)}
                        className={`p-2 rounded-full ${
                          item.status === ChecklistItemStatus.INCOMPLETE
                            ? 'bg-red-100 text-red-600 border border-red-300' 
                            : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                        }`}
                        title="Mark as Incomplete"
                        disabled={updating}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateItemStatus(index, ChecklistItemStatus.NOT_APPLICABLE)}
                        className={`p-2 rounded-full ${
                          item.status === ChecklistItemStatus.NOT_APPLICABLE
                            ? 'bg-gray-100 text-gray-600 border border-gray-300' 
                            : 'hover:bg-gray-50 text-gray-400 hover:text-gray-600'
                        }`}
                        title="Mark as N/A"
                        disabled={updating}
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold mb-6">Actions</h2>

            <div className="space-y-4">
              {!checklist.approved && completionStats.completionPercentage === 100 && (
                <button 
                  onClick={handleApproveWithLifecycle} 
                  className="btn-primary-green w-full flex items-center justify-center gap-2"
                  disabled={updating}
                >
                  {updating ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-5 w-5" />
                  )}
                  Approve Checklist
                </button>
              )}

              <button 
                onClick={handleDelete} 
                className="btn-soft-red w-full flex items-center justify-center gap-2"
                disabled={updating}
              >
                <Trash2 className="h-4 w-4" />
                Delete Checklist
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Completion Progress</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">{completionStats.completionPercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionStats.completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-700">{completedItems}</div>
                    <div className="text-xs text-green-600">Completed</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-700">{incompleteItems}</div>
                    <div className="text-xs text-red-600">Incomplete</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-gray-700">
                      {checklist.inspectionItems.length - completedItems - incompleteItems}
                    </div>
                    <div className="text-xs text-gray-600">N/A</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Information */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold mb-6">Related Information</h2>
            
            <div className="space-y-4">
              {typeof checklist.opportunityId === 'object' && checklist.opportunityId._id && (
                <Link
                  href={`/opportunities/${checklist.opportunityId._id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">Opportunity</span>
                  </div>
                  <ArrowLeft className="h-4 w-4 transform rotate-180 text-gray-400" />
                </Link>
              )}

              {typeof checklist.vehicleId === 'object' && checklist.vehicleId._id && (
                <Link
                  href={`/vehicles/${checklist.vehicleId._id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">Vehicle Details</span>
                  </div>
                  <ArrowLeft className="h-4 w-4 transform rotate-180 text-gray-400" />
                </Link>
              )}

              {typeof checklist.jobCardId === 'object' && checklist.jobCardId._id && (
                <Link
                  href={`/jobcards/${checklist.jobCardId._id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">Job Card</span>
                  </div>
                  <ArrowLeft className="h-4 w-4 transform rotate-180 text-gray-400" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}