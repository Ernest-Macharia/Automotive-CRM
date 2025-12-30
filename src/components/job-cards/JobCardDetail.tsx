'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, ArrowLeft, Calendar, User, Car, Clock,
  Edit, Printer, Download, CheckCircle, XCircle,
  Play, Pause, AlertTriangle, DollarSign, Package,
  FileText, RefreshCw, MapPin, Phone, Mail
} from 'lucide-react';
import { jobCardService } from '@/services/jobCardService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface JobCardDetailProps {
  jobCardId: string;
}

export default function JobCardDetail({ jobCardId }: JobCardDetailProps) {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [jobCard, setJobCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchJobCard();
  }, [jobCardId]);

  const fetchJobCard = async () => {
    try {
      setLoading(true);
      const data = await jobCardService.getJobCardById(jobCardId);
      setJobCard(data);
    } catch (error) {
      console.error('Error fetching job card:', error);
      showToast('Failed to load job card details', 'error');
      router.push('/job-cards');
    } finally {
      setLoading(false);
    }
  };

  // Remove 'assigned' and 'on_hold' status updates if not in your model
const handleStatusUpdate = async (status: string) => {
  // Only allow statuses that exist in the service
  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    showToast('Invalid status', 'error');
    return;
  }
  
  try {
    setUpdating(true);
    await jobCardService.updateJobCard(jobCardId, { status: status as any });
    showToast(`Job card marked as ${status.replace('_', ' ')}`, 'success');
    fetchJobCard();
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Failed to update status', 'error');
  } finally {
    setUpdating(false);
  }
};

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatDuration = (hours: number) => {
    if (!hours) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!jobCard) return null;

  // Safe access helpers
  const getTechnicianName = () => {
    if (!jobCard.assignedTo) return 'Unassigned';
    if (typeof jobCard.assignedTo === 'string') return 'Loading...';
    return `${jobCard.assignedTo.firstName || ''} ${jobCard.assignedTo.lastName || ''}`.trim() || 'Unassigned';
  };

  const getVehicleInfo = () => {
    const v = jobCard.vehicleId;
    if (!v || typeof v === 'string') return 'Vehicle info loading...';
    return `${v.make || ''} ${v.model || ''} (${v.registrationNumber || 'No reg'})`.trim();
  };

  const getCustomerName = () => {
    const opp = jobCard.opportunityId;
    if (!opp || typeof opp === 'string') return 'Loading customer...';
    return opp.customer?.name || 'No customer';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header – Blue to Purple Gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/job-cards')}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{jobCard.jobTitle || 'Untitled Job'}</h1>
                <p className="text-blue-100 text-sm">Job Card #{jobCard.jobNumber || 'N/A'}</p>
                <p className="text-blue-200 text-xs mt-1">Customer: {getCustomerName()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchJobCard}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Refresh"
                aria-label="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              <Link
                href={`/job-cards/${jobCard._id}/edit`}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                title="Edit"
                aria-label="Edit job card"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Actions Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Job Status</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${jobCardService.getStatusColor(jobCard.status)}`}>
                    {jobCard.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{jobCardService.calculateCompletionPercentage(jobCard)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${jobCardService.calculateCompletionPercentage(jobCard)}%` }}
                    />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {jobCard.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate('assigned')}
                      disabled={updating}
                      className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 font-medium transition-all disabled:opacity-60"
                    >
                      Assign
                    </button>
                  )}
                  
                  {['pending', 'assigned'].includes(jobCard.status) && (
                    <button
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={updating}
                      className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-700 font-medium transition-all disabled:opacity-60"
                    >
                      Start
                    </button>
                  )}
                  
                  {jobCard.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate('on_hold')}
                        disabled={updating}
                        className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-orange-700 font-medium transition-all disabled:opacity-60"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={updating}
                        className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 font-medium transition-all disabled:opacity-60"
                      >
                        Complete
                      </button>
                    </>
                  )}
                  
                  {jobCard.status === 'on_hold' && (
                    <button
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={updating}
                      className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 font-medium transition-all disabled:opacity-60"
                    >
                      Resume
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updating}
                    className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 font-medium transition-all disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Job Description</h2>
              </div>
              
              <div className="p-5">
                <p className="text-gray-700 whitespace-pre-line">{jobCard.jobDescription || 'No description provided.'}</p>
                
                {jobCard.notes && jobCard.notes.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Notes</h3>
                    <div className="space-y-2">
                      {jobCard.notes.map((note: string, index: number) => (
                        <div key={index} className="p-3 bg-blue-50/30 rounded-lg border border-blue-100">
                          <p className="text-gray-700">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Parts Used */}
            {jobCard.partsUsed && jobCard.partsUsed.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Parts Used
                  </h2>
                </div>
                
                <div className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-600">
                          <th className="py-2 px-3 text-left">Part #</th>
                          <th className="py-2 px-3 text-left">Name</th>
                          <th className="py-2 px-3 text-left">Qty</th>
                          <th className="py-2 px-3 text-left">Unit</th>
                          <th className="py-2 px-3 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobCard.partsUsed.map((part: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 px-3">{part.partNumber || '—'}</td>
                            <td className="py-2 px-3">{part.name || 'Unnamed'}</td>
                            <td className="py-2 px-3">{part.quantity || 0}</td>
                            <td className="py-2 px-3">{jobCardService.formatCurrency(part.unitPrice)}</td>
                            <td className="py-2 px-3 font-medium">
                              {jobCardService.formatCurrency(part.totalCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="py-2 px-3 text-right font-medium">
                            Total Parts Cost:
                          </td>
                          <td className="py-2 px-3 font-bold text-purple-600">
                            {jobCardService.formatCurrency(jobCard.partsCost || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Vehicle Info */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Vehicle</h2>
              </div>
              
              <div className="p-5">
                {jobCard.vehicleId && typeof jobCard.vehicleId === 'object' ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 mt-0.5">
                      <Car className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{jobCard.vehicleId.registrationNumber || 'No reg'}</h3>
                      <p className="text-gray-600 text-sm">
                        {jobCard.vehicleId.make || '—'} {jobCard.vehicleId.model || ''} ({jobCard.vehicleId.year || '?'})
                      </p>
                      {jobCard.vehicleId.vin && (
                        <p className="text-gray-500 text-xs mt-1">VIN: {jobCard.vehicleId.vin}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No vehicle assigned</p>
                )}
              </div>
            </div>

            {/* Technician Info – FIXED: Safely handles null */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Technician</h2>
              </div>
              
              <div className="p-5">
                {jobCard.assignedTo && typeof jobCard.assignedTo === 'object' ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-100 to-blue-100 mt-0.5">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {jobCard.assignedTo.firstName} {jobCard.assignedTo.lastName}
                      </h3>
                      <p className="text-gray-600 text-sm">{jobCard.assignedTo.role || 'Technician'}</p>
                      <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {jobCard.assignedTo.email || 'No email'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Not assigned</p>
                )}
              </div>
            </div>

            {/* Time & Cost Summary */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Time & Cost</h2>
              </div>
              
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Estimated:
                  </span>
                  <span className="font-medium">{formatDuration(jobCard.estimatedHours || 0)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual:</span>
                  <span className="font-medium">{formatDuration(jobCard.actualHours || 0)}</span>
                </div>
                
                {(jobCard.laborCost || jobCard.partsCost) && (
                  <>
                    <div className="pt-2.5 border-t border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor:</span>
                        <span className="font-medium">
                          {jobCardService.formatCurrency(jobCard.laborCost || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parts:</span>
                        <span className="font-medium">
                          {jobCardService.formatCurrency(jobCard.partsCost || 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-2.5 border-t border-gray-100">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>Total Cost:</span>
                        <span className="text-lg text-purple-600 font-bold">
                          {jobCardService.formatCurrency(jobCard.totalCost || 0)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Timeline</h2>
              </div>
              
              <div className="p-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{formatDate(jobCard.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span>{formatDate(jobCard.updatedAt)}</span>
                </div>
                {jobCard.startDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span>{formatDate(jobCard.startDate)}</span>
                  </div>
                )}
                {jobCard.completedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span>{formatDate(jobCard.completedDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}