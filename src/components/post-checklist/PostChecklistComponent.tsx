'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ClipboardList, CheckCircle, XCircle, AlertTriangle, 
  FileText, Edit, Download, Printer, Eye, Trash2,
  RefreshCw, PlusCircle, Filter, Search, ChevronDown,
  ChevronUp, Clock, User, Car, Building, Tag,
  Calendar, Wrench, BarChart3, ThumbsUp, Loader2
} from 'lucide-react';
import { postChecklistService, PostChecklist, ChecklistItemStatus } from '@/services/postChecklistService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface PostChecklistComponentProps {
  workOrderId?: string;
  opportunityId?: string;
  vehicleId?: string;
  jobCardId?: string;
  readOnly?: boolean;
}

export default function PostChecklistComponent({ 
  workOrderId, 
  opportunityId, 
  vehicleId,
  jobCardId,
  readOnly = false 
}: PostChecklistComponentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [postChecklists, setPostChecklists] = useState<PostChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState<PostChecklist | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    completionRate: 0
  });

  useEffect(() => {
    fetchPostChecklists();
  }, [opportunityId, vehicleId, jobCardId]);

  const fetchPostChecklists = async () => {
    try {
      setLoading(true);
      let checklists: PostChecklist[] = [];

      if (opportunityId) {
        checklists = await postChecklistService.getPostChecklistsByOpportunity(opportunityId);
      } else if (jobCardId) {
        checklists = await postChecklistService.getPostChecklistsByJobCard(jobCardId);
      } else if (vehicleId) {
        checklists = await postChecklistService.getPostChecklistsByVehicle(vehicleId);
      } else {
        try {
          checklists = await postChecklistService.getAllPostChecklists();
        } catch {
          // If endpoint not available, use workaround
          checklists = [];
        }
      }

      setPostChecklists(checklists);
      calculateStats(checklists);
    } catch (error) {
      console.error('Error fetching post-checklists:', error);
      showToast('Failed to load post-checklists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (checklists: PostChecklist[]) => {
    const total = checklists.length;
    const approved = checklists.filter(c => c.approved).length;
    const pending = total - approved;
    
    // Calculate average completion rate
    let totalCompletion = 0;
    for (const checklist of checklists) {
      const completion = await getCompletionRate(checklist);
      totalCompletion += completion;
    }
    const completionRate = total > 0 ? Math.round(totalCompletion / total) : 0;

    setStats({ total, approved, pending, completionRate });
  };

  const getCompletionRate = async (checklist: PostChecklist): Promise<number> => {
    try {
      const completion = await postChecklistService.getChecklistCompletionRate(checklist._id);
      return completion.completionPercentage;
    } catch (error) {
      console.error('Error getting completion rate:', error);
      return 0;
    }
  };

  const handleCreateChecklist = async () => {
    if (!opportunityId || !vehicleId || !jobCardId) {
      showToast('Opportunity ID, Vehicle ID, and Job Card ID are required', 'error');
      return;
    }

    try {
      const userId = sessionStorage.getItem('userId') || 'system';
      const newChecklist = await postChecklistService.createQuickPostChecklist(
        opportunityId,
        vehicleId,
        jobCardId,
        userId,
        'Post-service quality inspection'
      );

      showToast('Post-checklist created successfully', 'success');
      fetchPostChecklists();
      setSelectedChecklist(newChecklist);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating post-checklist:', error);
      showToast('Failed to create post-checklist', 'error');
    }
  };

  const handleApproveChecklist = async (checklistId: string) => {
    try {
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      await postChecklistService.approvePostChecklist(checklistId, approvedBy);
      showToast('Checklist approved successfully', 'success');
      fetchPostChecklists();
    } catch (error) {
      console.error('Error approving checklist:', error);
      showToast('Failed to approve checklist', 'error');
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!confirm('Are you sure you want to delete this post-checklist?')) {
      return;
    }

    try {
      await postChecklistService.deletePostChecklist(checklistId);
      showToast('Checklist deleted successfully', 'success');
      fetchPostChecklists();
      if (selectedChecklist?._id === checklistId) {
        setSelectedChecklist(null);
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
      showToast('Failed to delete checklist', 'error');
    }
  };

  const handleUpdateItemStatus = async (
    checklistId: string, 
    itemIndex: number, 
    status: ChecklistItemStatus,
    remarks?: string
  ) => {
    try {
      const userId = sessionStorage.getItem('userId') || undefined;
      await postChecklistService.markItemAsComplete(checklistId, itemIndex, remarks, userId);
      showToast('Item updated successfully', 'success');
      fetchPostChecklists();
    } catch (error) {
      console.error('Error updating item:', error);
      showToast('Failed to update item', 'error');
    }
  };

  const filteredChecklists = postChecklists.filter(checklist => {
    if (filterStatus === 'approved' && !checklist.approved) return false;
    if (filterStatus === 'pending' && checklist.approved) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        checklist.notes?.toLowerCase().includes(searchLower) ||
        checklist.inspectionItems.some(item => 
          item.item.toLowerCase().includes(searchLower) ||
          item.remarks?.toLowerCase().includes(searchLower)
        );
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  const formatDate = (date: string | Date) => {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return format(parsedDate, 'MMM dd, yyyy HH:mm');
  };


  const getStatusBadge = (approved: boolean) => {
    return approved ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const getItemStatusBadge = (status: ChecklistItemStatus) => {
    const config: Record<ChecklistItemStatus, { bg: string; text: string; icon: React.ReactNode }> = {
      [ChecklistItemStatus.COMPLETED]: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-3 h-3" />
      },
      [ChecklistItemStatus.INCOMPLETE]: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertTriangle className="w-3 h-3" />
      },
      [ChecklistItemStatus.NOT_APPLICABLE]: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <FileText className="w-3 h-3" />
      }
    };
    
    const configItem = config[status];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.bg} ${configItem.text}`}>
        {configItem.icon}
        <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const handleExportToHtml = async (checklistId: string) => {
    try {
      const htmlContent = await postChecklistService.exportPostChecklistToHtml(checklistId);
      
      // Open a new window with the HTML content for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error exporting checklist:', error);
      showToast('Failed to export checklist', 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Post-Service Checklists</h2>
              <p className="text-sm text-gray-600">Quality inspection after service</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPostChecklists()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
            
            {!readOnly && opportunityId && vehicleId && jobCardId && (
              <button
                onClick={handleCreateChecklist}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                New Checklist
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-xs text-gray-600">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.completionRate}%</div>
              <div className="text-xs text-gray-600">Avg. Completion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search checklists, items, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Checklists</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading post-checklists...</p>
        </div>
      ) : filteredChecklists.length === 0 ? (
        <div className="p-8 text-center">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Post-Checklists Found</h3>
          <p className="text-gray-600 mb-4">
            {opportunityId || vehicleId 
              ? 'No post-service checklists have been created yet.'
              : 'No post-checklists available for the current filters.'}
          </p>
          {!readOnly && opportunityId && vehicleId && jobCardId && (
            <button
              onClick={handleCreateChecklist}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Create Your First Checklist
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {filteredChecklists.map((checklist) => {
            const isExpanded = expandedChecklist === checklist._id;
            const completedItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.COMPLETED).length;
            const incompleteItems = checklist.inspectionItems.filter(item => item.status === ChecklistItemStatus.INCOMPLETE).length;
            const completionPercentage = checklist.inspectionItems.length > 0 
              ? Math.round((completedItems / checklist.inspectionItems.length) * 100) 
              : 0;
            
            return (
              <div key={checklist._id} className="hover:bg-gray-50 transition-colors">
                {/* Checklist Header */}
                <div 
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => setExpandedChecklist(isExpanded ? null : checklist._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        checklist.approved ? 'bg-green-100 text-green-600' : 'bg-teal-100 text-teal-600'
                      }`}>
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            Post-Service Inspection #{checklist._id.slice(-6)}
                          </h3>
                          {getStatusBadge(checklist.approved)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            checklist.overallCondition === 'satisfactory' ? 'bg-green-100 text-green-800' :
                            checklist.overallCondition === 'needs_attention' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {checklist.overallCondition?.replace('_', ' ') || 'Not Rated'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(checklist.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {typeof checklist.inspectedBy === 'object' 
                              ? `${checklist.inspectedBy.firstName} ${checklist.inspectedBy.lastName}`
                              : 'Inspected'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {completedItems}/{checklist.inspectionItems.length} Completed
                        </div>
                        <div className="text-xs text-gray-500">
                          {completionPercentage}% Complete
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-4 border-t border-gray-200 pt-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{checklist.inspectionItems.length}</div>
                        <div className="text-sm text-gray-600">Total Items</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{completedItems}</div>
                        <div className="text-sm text-green-700">Completed</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{incompleteItems}</div>
                        <div className="text-sm text-red-700">Incomplete</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                        <div className="text-sm text-blue-700">Progress</div>
                      </div>
                    </div>

                    {/* Notes and Recommendations */}
                    {(checklist.notes || checklist.recommendations) && (
                      <div className="mb-4 space-y-3">
                        {checklist.notes && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Notes</span>
                            </div>
                            <p className="text-sm text-blue-700">{checklist.notes}</p>
                          </div>
                        )}
                        
                        {checklist.recommendations && (
                          <div className="p-3 bg-teal-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Wrench className="h-4 w-4 text-teal-600" />
                              <span className="text-sm font-medium text-teal-800">Recommendations</span>
                            </div>
                            <p className="text-sm text-teal-700">{checklist.recommendations}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inspection Items */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Inspection Items</h4>
                      <div className="space-y-2">
                        {checklist.inspectionItems.map((item, index) => (
                          <div key={index} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {item.required && <span className="text-red-500 mr-1">*</span>}
                                  {item.item}
                                </span>
                                {getItemStatusBadge(item.status)}
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
                                </div>
                              )}
                            </div>
                            
                            {!readOnly && !checklist.approved && (
                              <div className="flex items-center gap-1 ml-4">
                                <button
                                  onClick={() => handleUpdateItemStatus(
                                    checklist._id, 
                                    index, 
                                    ChecklistItemStatus.COMPLETED,
                                    'Item completed'
                                  )}
                                  className={`p-1 rounded ${
                                    item.status === ChecklistItemStatus.COMPLETED
                                      ? 'bg-green-100 text-green-600' 
                                      : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                                  }`}
                                  title="Mark as Completed"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateItemStatus(
                                    checklist._id, 
                                    index, 
                                    ChecklistItemStatus.INCOMPLETE,
                                    'Needs attention'
                                  )}
                                  className={`p-1 rounded ${
                                    item.status === ChecklistItemStatus.INCOMPLETE
                                      ? 'bg-red-100 text-red-600' 
                                      : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                                  }`}
                                  title="Mark as Incomplete"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateItemStatus(
                                    checklist._id, 
                                    index, 
                                    ChecklistItemStatus.NOT_APPLICABLE,
                                    'Not applicable'
                                  )}
                                  className={`p-1 rounded ${
                                    item.status === ChecklistItemStatus.NOT_APPLICABLE
                                      ? 'bg-gray-100 text-gray-600' 
                                      : 'hover:bg-gray-50 text-gray-400 hover:text-gray-600'
                                  }`}
                                  title="Mark as N/A"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExportToHtml(checklist._id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Printer className="h-4 w-4" />
                          Print
                        </button>
                        <button
                          onClick={() => window.open(`/postchecklists/${checklist._id}`, '_blank')}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Full
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!readOnly && !checklist.approved && completionPercentage === 100 && (
                          <button
                            onClick={() => handleApproveChecklist(checklist._id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Approve Checklist
                          </button>
                        )}
                        
                        {!readOnly && (
                          <button
                            onClick={() => handleDeleteChecklist(checklist._id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}