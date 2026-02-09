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
    } catch (error: any) {
      console.error('Error loading pre-checklist:', error);
      
      // Check if it's a 500 server error
      if (error.message && (error.message.includes('500') || error.message.includes('Internal server error'))) {
        // Create a fallback checklist object
        const fallbackChecklist: PreChecklist = {
          _id: id,
          id: id,
          opportunityId: 'unknown',
          vehicleId: 'unknown',
          inspectionItems: [],
          remarks: 'Pre-checklist loaded in limited mode due to server error',
          approved: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: ''
        };
        
        setChecklist(fallbackChecklist);
        showToast('Pre-checklist loaded with limited data', 'warning');
      } else {
        showToast('Failed to load pre-checklist', 'error');
        router.push('/orders/work-orders');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- helpers ---------------- */

  const renderVehicle = (vehicle: any) => {
    if (!vehicle) return '-';
    if (typeof vehicle === 'string') return vehicle.slice(0, 8) || 'Unknown';
    
    // Handle object with fallbacks
    const make = vehicle.make || '';
    const model = vehicle.model || '';
    const reg = vehicle.registrationNumber || '';
    
    if (make || model || reg) {
      return `${make} ${model} ${reg ? `(${reg})` : ''}`.trim();
    }
    
    return vehicle._id ? vehicle._id.slice(0, 8) : 'Unknown Vehicle';
  };

  const renderCustomer = (opportunity: any) => {
    if (!opportunity) return '-';
    if (typeof opportunity === 'string') return opportunity.slice(0, 8) || 'Unknown';
    
    // Handle object with fallbacks
    if (opportunity.customer) {
      return opportunity.customer.name || opportunity.customer.companyName || 'Customer';
    }
    
    return opportunity.subject || opportunity._id?.slice(0, 8) || '—';
  };

  const getStatusColor = (approved: boolean) => {
    return approved 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
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

  // const handleApproveWithLifecycle = async () => {
  //   if (!checklist) return;
  //   try {
  //     setUpdating(true);
  //     const approvedBy = sessionStorage.getItem('userId') || undefined;
      
  //     const result = await preChecklistService.approvePreChecklistWithLifecycle(
  //       checklist._id, 
  //       approvedBy
  //     );
      
  //     setChecklist(result.checklist);
      
  //     if (result.lifecycleUpdate.stageCompleted) {
  //       if (result.lifecycleUpdate.nextStage) {
  //         showToast(`Checklist approved! Auto-advanced to ${result.lifecycleUpdate.nextStage} stage`, 'success');
  //       } else {
  //         showToast('Checklist approved! Stage marked as complete.', 'success');
  //       }
  //     } else {
  //       showToast('Checklist approved!', 'success');
  //     }
  //   } catch (error) {
  //     console.error('Error approving pre-checklist:', error);
  //     showToast('Failed to approve checklist', 'error');
  //   } finally {
  //     setUpdating(false);
  //   }
  // };

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
    if (!checklist) return;
    
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Zoho Style */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/orders/work-orders" className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Pre-Service Checklist #{checklist._id.slice(-8)}
              </h1>
              <p className="text-sm text-gray-500">Vehicle Inspection Details</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
              checklist.approved
            )}`}
          >
            {getStatusIcon(checklist.approved)}
            {getStatusText(checklist.approved)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <h2 className="text-base font-semibold flex items-center gap-2 text-gray-800">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  Inspection Information
                </h2>
                <div className="flex gap-2 mt-3 sm:mt-0">
                  <button 
                    onClick={handleExportPDF} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    disabled={updating}
                  >
                    {updating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4" />
                    )}
                    Print
                  </button>
                  <button 
                    onClick={handleClone} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    disabled={updating}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Clone
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Created Date
                  </p>
                  <p className="text-sm text-gray-800">{formatDate(checklist.createdAt as string)}</p>

                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-4 mb-1">
                    <Car className="h-3.5 w-3.5" />
                    Vehicle
                  </p>
                  <p className="text-sm text-gray-800">{renderVehicle(checklist.vehicleId)}</p>

                  {typeof checklist.vehicleId === 'object' && checklist.vehicleId.mileage && (
                    <>
                      <p className="text-xs text-gray-500 mt-4 mb-1">Mileage</p>
                      <p className="text-sm text-gray-800">{checklist.vehicleId.mileage.toLocaleString()} km</p>
                    </>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                    <Building className="h-3.5 w-3.5" />
                    Customer / Opportunity
                  </p>
                  <p className="text-sm text-gray-800">{renderCustomer(checklist.opportunityId)}</p>

                  {checklist.inspectedBy && checklist.inspectedBy !== 'null' && typeof checklist.inspectedBy === 'string' && (
                    <>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-4 mb-1">
                        <User className="h-3.5 w-3.5" />
                        Inspected By
                      </p>
                      <p className="text-sm text-gray-800">
                        Technician ({checklist.inspectedBy.slice(0, 8)})
                      </p>
                    </>
                  )}

                  {checklist.approvedBy && checklist.approvedAt && (
                    <>
                      <p className="text-xs text-gray-500 mt-4 mb-1">Approved By</p>
                      <p className="text-sm text-gray-800">
                        {typeof checklist.approvedBy === 'object' 
                          ? `${checklist.approvedBy.firstName} ${checklist.approvedBy.lastName}`
                          : checklist.approvedBy
                        } on {formatDate(checklist.approvedAt as string)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {checklist.remarks && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5" />
                    Remarks
                  </p>
                  <p className="text-sm text-gray-700">{checklist.remarks}</p>
                </div>
              )}
            </div>

            {/* Inspection Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <h2 className="text-base font-semibold flex items-center gap-2 text-gray-800">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Inspection Items ({checklist.inspectionItems.length})
                </h2>
                
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <div className="text-center">
                    <div className="text-base font-bold text-green-600">{okItems.length}</div>
                    <div className="text-xs text-gray-500">OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-red-600">{faultItems.length}</div>
                    <div className="text-xs text-gray-500">Faults</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-blue-600">{completionPercentage}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {checklist.inspectionItems.map((item, index) => (
                  <div key={item._id || index} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {index + 1}. {item.item}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                          {getItemStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                      {item.remarks && (
                        <p className="text-xs text-gray-600 mt-1">{item.remarks}</p>
                      )}
                    </div>
                    
                    {!checklist.approved && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleUpdateItemStatus(item._id || index.toString(), 'ok')}
                          className={`p-1.5 rounded ${item.status === 'ok' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-green-700 hover:bg-green-50'}`}
                          title="Mark as OK"
                          disabled={updating}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateItemStatus(item._id!, 'fault')}
                          className={`p-1.5 rounded ${item.status === 'fault' ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:text-red-700 hover:bg-red-50'}`}
                          title="Mark as Fault"
                          disabled={updating}
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateItemStatus(item._id!, 'n/a')}
                          className={`p-1.5 rounded ${item.status === 'n/a' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                          title="Mark as N/A"
                          disabled={updating}
                        >
                          <FileText className="h-3.5 w-3.5" />
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
            {/* Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Actions</h2>

              <div className="space-y-3">
                {!checklist.approved && (
                  <button 
                    // onClick={handleApproveWithLifecycle} 
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    disabled={updating}
                  >
                    {updating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Approve Checklist
                  </button>
                )}

                <button 
                  onClick={handleDelete} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-60"
                  disabled={updating}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Checklist
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Completion Summary</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{completionPercentage}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-green-700">{okItems.length}</div>
                      <div className="text-xs text-green-600">OK</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-red-700">{faultItems.length}</div>
                      <div className="text-xs text-red-600">Faults</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-gray-700">
                        {checklist.inspectionItems.length - okItems.length - faultItems.length}
                      </div>
                      <div className="text-xs text-gray-600">N/A</div>
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
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-600" />
                      <span>Opportunity</span>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-gray-400 transform rotate-180" />
                  </Link>
                )}

                {typeof checklist.vehicleId === 'object' && checklist.vehicleId._id && (
                  <Link
                    href={`/vehicles/${checklist.vehicleId._id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-600" />
                      <span>Vehicle Details</span>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-gray-400 transform rotate-180" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}