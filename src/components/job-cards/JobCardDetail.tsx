'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  ArrowLeft,
  Edit,
  RefreshCw,
  AlertTriangle,
  Package,
  Trash2,
  Loader2,
  User,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

import { jobCardService, JobCard, type UpdateJobCardData, type UserRef } from '@/services/jobCardService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface JobCardDetailProps {
  jobCardId: string;
}

export default function JobCardDetail({ jobCardId }: JobCardDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workOrderId = searchParams.get('workOrderId');
  const source = searchParams.get('source');
  const { showToast } = useToast();

  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchJobCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getUserId = (u?: string | UserRef | null) =>
    typeof u === 'string' ? u : (u?._id ?? u?.id ?? '');

  const handleStatusUpdate = async (status: string) => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
    if (!validStatuses.includes(status as any)) {
      showToast('Invalid status', 'error');
      return;
    }

    try {
      setUpdating(true);

      const payload: UpdateJobCardData = {
        status: status as any,
      };

      if (status === 'completed') {
        payload.completedDate = new Date().toISOString();
        payload.actualHours = jobCard?.actualHours || jobCard?.estimatedHours || 2;
      }

      // Update the job card
      await jobCardService.updateJobCard(jobCardId, payload);

      showToast(`Job card marked as ${status.replace('_', ' ')}`, 'success');

      // If job card was completed and we have workOrderId, redirect back
      if (status === 'completed' && workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
        return;
      }

      // Otherwise refresh the page
      await fetchJobCard();

    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update job card status', 'error');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleBackToWorkOrder = () => {
    if (workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
    } else {
      router.push('/job-cards');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDuration = (hours?: number) => {
    if (!hours || hours === 0) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  const getTechnicianName = () => {
    if (!jobCard?.assignedTo) return 'Unassigned';
    if (typeof jobCard.assignedTo === 'string') {
      // If it's just an ID, we don't have the name
      return 'Technician Assigned';
    }
    const userRef: any = jobCard.assignedTo;
    return userRef.name || userRef.email || 'Technician';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOpportunityInfo = () => {
    if (!jobCard?.opportunityId) return null;
    
    if (typeof jobCard.opportunityId === 'object') {
      return {
        id: jobCard.opportunityId._id || jobCard.opportunityId.id,
        name: jobCard.opportunityId.subject || 'Opportunity'
      };
    }
    
    return {
      id: jobCard.opportunityId,
      name: `Opportunity ID: ${jobCard.opportunityId}`
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!jobCard) return null;

  const opportunityInfo = getOpportunityInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/job-cards')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-white">{jobCard.jobTitle || 'Untitled Job'}</h1>
              <p className="text-blue-100 text-sm">Job Card #{jobCard.jobNumber || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchJobCard}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-white" />
            </button>

            <Link
              href={`/job-cards/${jobCard._id}/edit`}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Edit"
            >
              <Edit className="h-5 w-5 text-white" />
            </Link>
            
            {workOrderId && (
              <button
                onClick={handleBackToWorkOrder}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Work Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <h2 className="text-base font-semibold text-gray-900">Job Status</h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(
                      jobCard.priority
                    )}`}
                  >
                    {(jobCard.priority || 'MEDIUM').toUpperCase()}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(
                      jobCard.status
                    )}`}
                  >
                    {jobCard.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>
                    {jobCard.status === 'completed' ? 100 : 
                     jobCard.status === 'in_progress' ? 50 : 
                     jobCard.status === 'pending' ? 0 : 0}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ 
                      width: `${jobCard.status === 'completed' ? 100 : 
                              jobCard.status === 'in_progress' ? 50 : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {jobCard.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                    Start Job
                  </button>
                )}

                {jobCard.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center gap-1"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Complete Job
                  </button>
                )}

                {jobCard.status !== 'completed' && jobCard.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updating}
                    className="px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60 flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>
                )}

                <Link
                  href={`/job-cards/${jobCard._id}/edit`}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit Details
                </Link>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Job Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Job Title</p>
                  <p className="text-gray-900 font-medium">{jobCard.jobTitle || 'No title provided'}</p>
                </div>

                {jobCard.jobDescription && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700 whitespace-pre-line">
                      {jobCard.jobDescription}
                    </p>
                  </div>
                )}

                {jobCard.notes && jobCard.notes.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Additional Notes</p>
                    <div className="space-y-2">
                      {jobCard.notes.map((note: string, index: number) => (
                        <div
                          key={index}
                          className="p-2 bg-blue-50 rounded border border-blue-100 text-sm"
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Parts Used (if any) */}
            {jobCard.partsUsed && jobCard.partsUsed.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  Parts Used
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 px-3">Part #</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Unit Price</th>
                        <th className="py-2 px-3">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {jobCard.partsUsed.map((part: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3">{part.partNumber || '—'}</td>
                          <td className="py-2 px-3">{part.name || 'Unnamed'}</td>
                          <td className="py-2 px-3">{part.quantity || 0}</td>
                          <td className="py-2 px-3">KES {(part.unitPrice || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 font-medium">KES {(part.totalCost || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="py-2 px-3 text-right font-medium">
                          Total Parts Cost:
                        </td>
                        <td className="py-2 px-3 font-bold text-purple-600">
                          KES {jobCard.partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Sidebar Info */}
          <div className="space-y-6">
            {/* Opportunity Info */}
            {opportunityInfo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Related Opportunity</h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{opportunityInfo.name}</p>
                  <button
                    onClick={() => router.push(`/opportunities/${opportunityInfo.id}`)}
                    className="w-full text-sm px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Opportunity
                  </button>
                </div>
              </div>
            )}

            {/* Technician */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Technician
              </h2>
              
              {jobCard.assignedTo ? (
                <div>
                  <p className="font-medium">{getTechnicianName()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeof jobCard.assignedTo === 'object' && jobCard.assignedTo.email}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No technician assigned</p>
              )}
            </div>

            {/* Time & Cost */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Time & Cost</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Hours:</span>
                  <span className="font-medium">{formatDuration(jobCard.estimatedHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual Hours:</span>
                  <span className="font-medium">{formatDuration(jobCard.actualHours)}</span>
                </div>

                {(jobCard.laborCost || 0) > 0 && (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor Cost:</span>
                        <span className="font-medium">KES {(jobCard.laborCost || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between font-bold">
                        <span>Total Cost:</span>
                        <span className="text-purple-600">
                          KES {((jobCard.laborCost || 0) + (jobCard.partsCost || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Timeline</h2>
              <div className="space-y-2 text-sm">
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