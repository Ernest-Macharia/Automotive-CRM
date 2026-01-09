'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  Download,
  CheckCircle,
  Printer,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  XCircle,
  AlertCircle,
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
  Tag
} from 'lucide-react';
import { preChecklistService, PreChecklist } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

interface PreChecklistDetailPageProps {
  id: string;
}

export default function PreChecklistDetailPage({ id }: PreChecklistDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [checklist, setChecklist] = useState<PreChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadChecklist(id);
    }
  }, [id]);

  const loadChecklist = async (id: string) => {
    try {
      setLoading(true);
      const data = await preChecklistService.getPreChecklistById(id);
      setChecklist(data);
    } catch (error) {
      console.error('Error loading pre-checklist:', error);
      showToast('Failed to load pre-checklist', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- helpers ---------------- */

  const renderVehicle = (vehicle: any) => {
    if (!vehicle) return '-';
    if (typeof vehicle === 'string') return vehicle;
    return `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.registrationNumber ? `(${vehicle.registrationNumber})` : ''}`.trim() || vehicle._id || '—';
  };

  const renderCustomer = (opportunity: any) => {
    if (!opportunity) return '-';
    if (typeof opportunity === 'string') return opportunity;
    
    if (opportunity.customer) {
      return opportunity.customer.name || opportunity.customer.companyName || 'Customer';
    }
    
    return opportunity.subject || opportunity._id || '—';
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

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'fault': return 'bg-red-100 text-red-800';
      case 'n/a': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'fault': return <AlertCircle className="h-4 w-4" />;
      case 'n/a': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
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
      const approvedChecklist = await preChecklistService.approvePreChecklist(checklist._id, approvedBy);
      setChecklist(approvedChecklist);
      showToast('Pre-checklist approved successfully', 'success');
    } catch (error) {
      console.error('Error approving pre-checklist:', error);
      showToast('Failed to approve pre-checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveWithLifecycle = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      
      const result = await preChecklistService.approvePreChecklistWithLifecycle(
        checklist._id, 
        approvedBy
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
      console.error('Error approving pre-checklist:', error);
      showToast('Failed to approve checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!checklist) return;
    if (!confirm('Are you sure you want to delete this pre-checklist? This action cannot be undone.')) return;

    try {
      setUpdating(true);
      await preChecklistService.deletePreChecklist(checklist._id);
      showToast('Pre-checklist deleted successfully', 'success');
      router.push('/orders/work-orders');
    } catch (error) {
      console.error('Error deleting pre-checklist:', error);
      showToast('Failed to delete pre-checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const htmlContent = await preChecklistService.exportPreChecklistToPdf(checklist._id);
      
      // Create a new window with the HTML content for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
      
      showToast('Pre-checklist exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting pre-checklist:', error);
      showToast('Failed to export pre-checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: 'ok' | 'fault' | 'n/a') => {
    if (!checklist || checklist.approved) return;
    
    try {
      setUpdating(true);
      await preChecklistService.updateInspectionItem(checklist._id, itemId, { status });
      const updatedChecklist = await preChecklistService.getPreChecklistById(checklist._id);
      setChecklist(updatedChecklist);
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
      const clonedChecklist = await preChecklistService.clonePreChecklist(checklist._id, userId);
      showToast('Pre-checklist cloned successfully', 'success');
      router.push(`/prechecklists/${clonedChecklist._id}`);
    } catch (error) {
      console.error('Error cloning pre-checklist:', error);
      showToast('Failed to clone pre-checklist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  /* ---------------- UI states ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Pre-checklist not found</p>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  const faultItems = checklist.inspectionItems.filter(item => item.status === 'fault');
  const okItems = checklist.inspectionItems.filter(item => item.status === 'ok');
  const completionPercentage = checklist.inspectionItems.length > 0 
    ? Math.round((okItems.length / checklist.inspectionItems.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-600 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders/work-orders" className="p-2 hover:bg-white/20 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Pre-Service Checklist #{checklist._id.slice(-8)}</h1>
              <p className="text-blue-100">Vehicle Inspection Details</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
              checklist.approved
            )} text-white`}
          >
            {getStatusIcon(checklist.approved)}
            {getStatusText(checklist.approved)}
          </span>
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
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                Inspection Information
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportPDF} 
                  className="btn-soft-blue flex items-center gap-2"
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

                {typeof checklist.vehicleId === 'object' && checklist.vehicleId.mileage && (
                  <>
                    <p className="label mt-4">Mileage</p>
                    <p className="value">{checklist.vehicleId.mileage.toLocaleString()} km</p>
                  </>
                )}
              </div>

              <div>
                <p className="label flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Customer/Opportunity
                </p>
                <p className="value">{renderCustomer(checklist.opportunityId)}</p>

                {checklist.inspectedBy && (
                  <>
                    <p className="label mt-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Inspected By
                    </p>
                    <p className="value">
                      {typeof checklist.inspectedBy === 'object' 
                        ? `${checklist.inspectedBy.firstName} ${checklist.inspectedBy.lastName}`
                        : 'Technician'
                      }
                    </p>
                  </>
                )}

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
              </div>
            </div>

            {/* Remarks */}
            {checklist.remarks && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="label flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Remarks
                </p>
                <p className="value mt-2 text-gray-700">{checklist.remarks}</p>
              </div>
            )}
          </div>

          {/* Inspection Items */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wrench className="h-6 w-6 text-blue-600" />
                Inspection Items ({checklist.inspectionItems.length})
              </h2>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{okItems.length}</div>
                  <div className="text-xs text-gray-600">OK</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{faultItems.length}</div>
                  <div className="text-xs text-gray-600">Faults</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                  <div className="text-xs text-gray-600">Complete</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {checklist.inspectionItems.map((item, index) => (
                <div key={item._id || index} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">
                        {index + 1}. {item.item}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                        {getItemStatusIcon(item.status)}
                        <span className="capitalize">{item.status}</span>
                      </span>
                    </div>
                    {item.remarks && (
                      <p className="text-sm text-gray-600">{item.remarks}</p>
                    )}
                  </div>
                  
                  {!checklist.approved && (
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleUpdateItemStatus(item._id!, 'ok')}
                        className={`p-2 rounded-full ${
                          item.status === 'ok' 
                            ? 'bg-green-100 text-green-600 border border-green-300' 
                            : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                        }`}
                        title="Mark as OK"
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateItemStatus(item._id!, 'fault')}
                        className={`p-2 rounded-full ${
                          item.status === 'fault' 
                            ? 'bg-red-100 text-red-600 border border-red-300' 
                            : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                        }`}
                        title="Mark as Fault"
                        disabled={updating}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateItemStatus(item._id!, 'n/a')}
                        className={`p-2 rounded-full ${
                          item.status === 'n/a' 
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
              {!checklist.approved && (
                <button 
                  onClick={handleApproveWithLifecycle} 
                  className="btn-primary-green w-full flex items-center justify-center gap-2"
                  disabled={updating}
                >
                  {updating ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
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
              <h3 className="font-medium text-gray-900 mb-3">Quick Stats</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">{completionPercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-700">{okItems.length}</div>
                    <div className="text-xs text-green-600">OK</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-red-700">{faultItems.length}</div>
                    <div className="text-xs text-red-600">Faults</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xl font-bold text-gray-700">
                      {checklist.inspectionItems.length - okItems.length - faultItems.length}
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
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Opportunity</span>
                  </div>
                  <ArrowLeft className="h-4 w-4 transform rotate-180 text-gray-400" />
                </Link>
              )}

              {typeof checklist.vehicleId === 'object' && checklist.vehicleId._id && (
                <Link
                  href={`/vehicles/${checklist.vehicleId._id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Vehicle Details</span>
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