'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ClipboardCheck, CheckCircle, XCircle, AlertCircle, 
  FileText, Edit, Download, Printer, Eye, Trash2,
  RefreshCw, PlusCircle, Filter, Search, ChevronDown,
  ChevronUp, Clock, User, Car, Building, Tag,
  Calendar, Wrench, FileSignature, Loader2
} from 'lucide-react';
import { preChecklistService, PreChecklist } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface PreChecklistComponentProps {
  workOrderId?: string;
  opportunityId?: string;
  vehicleId?: string;
  readOnly?: boolean;
}

export default function PreChecklistComponent({ 
  workOrderId, 
  opportunityId, 
  vehicleId,
  readOnly = false 
}: PreChecklistComponentProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [preChecklists, setPreChecklists] = useState<PreChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState<PreChecklist | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    withFaults: 0
  });

  useEffect(() => {
    fetchPreChecklists();
  }, [opportunityId, vehicleId]);

  const fetchPreChecklists = async () => {
    try {
      setLoading(true);
      let checklists: PreChecklist[] = [];

      if (opportunityId) {
        checklists = await preChecklistService.getPreChecklistsByOpportunity(opportunityId);
      } else if (vehicleId) {
        checklists = await preChecklistService.getPreChecklistsByVehicle(vehicleId);
      } else {
        checklists = await preChecklistService.getAllPreChecklists();
      }

      setPreChecklists(checklists);
      calculateStats(checklists);
    } catch (error) {
      console.error('Error fetching pre-checklists:', error);
      showToast('Failed to load pre-checklists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (checklists: PreChecklist[]) => {
    const total = checklists.length;
    const approved = checklists.filter(c => c.approved).length;
    const pending = total - approved;
    const withFaults = checklists.filter(c => 
      c.inspectionItems.some(item => item.status === 'fault')
    ).length;

    setStats({ total, approved, pending, withFaults });
  };

  const handleCreateChecklist = async () => {
    if (!opportunityId || !vehicleId) {
      showToast('Opportunity ID and Vehicle ID are required', 'error');
      return;
    }

    try {
      const userId = sessionStorage.getItem('userId') || 'system';
      const newChecklist = await preChecklistService.createQuickPreChecklist(
        opportunityId,
        vehicleId,
        userId,
        'Pre-service inspection'
      );

      showToast('Pre-checklist created successfully', 'success');
      fetchPreChecklists();
      setSelectedChecklist(newChecklist);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating pre-checklist:', error);
      showToast('Failed to create pre-checklist', 'error');
    }
  };

  const handleApproveChecklist = async (checklistId: string) => {
    try {
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      await preChecklistService.approvePreChecklist(checklistId, approvedBy);
      showToast('Checklist approved successfully', 'success');
      fetchPreChecklists();
    } catch (error) {
      console.error('Error approving checklist:', error);
      showToast('Failed to approve checklist', 'error');
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!confirm('Are you sure you want to delete this pre-checklist?')) {
      return;
    }

    try {
      await preChecklistService.deletePreChecklist(checklistId);
      showToast('Checklist deleted successfully', 'success');
      fetchPreChecklists();
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
    itemId: string, 
    status: 'ok' | 'fault' | 'n/a',
    remarks?: string
  ) => {
    try {
      await preChecklistService.updateInspectionItem(checklistId, itemId, { status, remarks });
      showToast('Item updated successfully', 'success');
      fetchPreChecklists();
    } catch (error) {
      console.error('Error updating item:', error);
      showToast('Failed to update item', 'error');
    }
  };

  const filteredChecklists = preChecklists.filter(checklist => {
    if (filterStatus === 'approved' && !checklist.approved) return false;
    if (filterStatus === 'pending' && checklist.approved) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        checklist.remarks?.toLowerCase().includes(searchLower) ||
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

  const getItemStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      ok: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-3 h-3" />
      },
      fault: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle className="w-3 h-3" />
      },
      'n/a': {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <FileText className="w-3 h-3" />
      }
    };
    
    const configItem = config[status] || config['n/a'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${configItem.bg} ${configItem.text}`}>
        {configItem.icon}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };

  const handleExportToPdf = async (checklistId: string) => {
    try {
      const htmlContent = await preChecklistService.exportPreChecklistToPdf(checklistId);
      
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
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pre-Service Checklists</h2>
              <p className="text-sm text-gray-600">Vehicle inspection before service</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPreChecklists()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
            
            {!readOnly && opportunityId && vehicleId && (
              <button
                onClick={handleCreateChecklist}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <div className="text-2xl font-bold text-red-600">{stats.withFaults}</div>
              <div className="text-xs text-gray-600">With Faults</div>
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
                placeholder="Search checklists, items, or remarks..."
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
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading pre-checklists...</p>
        </div>
      ) : filteredChecklists.length === 0 ? (
        <div className="p-8 text-center">
          <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pre-Checklists Found</h3>
          <p className="text-gray-600 mb-4">
            {opportunityId || vehicleId 
              ? 'No pre-service checklists have been created yet.'
              : 'No pre-checklists available for the current filters.'}
          </p>
          {!readOnly && opportunityId && vehicleId && (
            <button
              onClick={handleCreateChecklist}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            const faultItems = checklist.inspectionItems.filter(item => item.status === 'fault');
            const okItems = checklist.inspectionItems.filter(item => item.status === 'ok');
            
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
                        checklist.approved ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            Pre-Service Inspection #{checklist._id.slice(-6)}
                          </h3>
                          {getStatusBadge(checklist.approved)}
                          {faultItems.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {faultItems.length} Fault{faultItems.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(checklist.createdAt)}
                          </span>
                          {checklist.inspectedBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {typeof checklist.inspectedBy === 'object' 
                                ? `${checklist.inspectedBy.firstName} ${checklist.inspectedBy.lastName}`
                                : 'Inspected'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {okItems.length}/{checklist.inspectionItems.length} Items OK
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round((okItems.length / checklist.inspectionItems.length) * 100)}% Complete
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
                        <div className="text-2xl font-bold text-green-600">{okItems.length}</div>
                        <div className="text-sm text-green-700">OK</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{faultItems.length}</div>
                        <div className="text-sm text-red-700">Faults</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round((okItems.length / checklist.inspectionItems.length) * 100)}%
                        </div>
                        <div className="text-sm text-blue-700">Completion</div>
                      </div>
                    </div>

                    {/* Remarks */}
                    {checklist.remarks && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Remarks</span>
                        </div>
                        <p className="text-sm text-yellow-700">{checklist.remarks}</p>
                      </div>
                    )}

                    {/* Inspection Items */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Inspection Items</h4>
                      <div className="space-y-2">
                        {checklist.inspectionItems.map((item, index) => (
                          <div key={item._id || index} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{item.item}</span>
                                {getItemStatusBadge(item.status)}
                              </div>
                              {item.remarks && (
                                <p className="text-sm text-gray-600">{item.remarks}</p>
                              )}
                            </div>
                            
                            {!readOnly && !checklist.approved && (
                              <div className="flex items-center gap-1 ml-4">
                                <button
                                  onClick={() => handleUpdateItemStatus(checklist._id, item._id!, 'ok', item.remarks)}
                                  className={`p-1 rounded ${
                                    item.status === 'ok' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                                  }`}
                                  title="Mark as OK"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateItemStatus(checklist._id, item._id!, 'fault', item.remarks)}
                                  className={`p-1 rounded ${
                                    item.status === 'fault' 
                                      ? 'bg-red-100 text-red-600' 
                                      : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                                  }`}
                                  title="Mark as Fault"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateItemStatus(checklist._id, item._id!, 'n/a', item.remarks)}
                                  className={`p-1 rounded ${
                                    item.status === 'n/a' 
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
                          onClick={() => handleExportToPdf(checklist._id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Printer className="h-4 w-4" />
                          Print
                        </button>
                        <button
                          onClick={() => window.open(`/prechecklists/${checklist._id}`, '_blank')}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Full
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!readOnly && !checklist.approved && (
                          <button
                            onClick={() => handleApproveChecklist(checklist._id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
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