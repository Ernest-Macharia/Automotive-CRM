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
} from 'lucide-react';

import { jobCardService, JobCard, type UpdateJobCardData, type UserRef } from '@/services/jobCardService';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { workOrderService } from '@/services/workOrderService';

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

  // Keep these if you still want the right-side Opportunity/Vehicle panels
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<Vehicle | null>(null);

  useEffect(() => {
    fetchJobCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobCardId]);

  const fetchJobCard = async () => {
    try {
      setLoading(true);
      const data = await jobCardService.getJobCardById(jobCardId);
      setJobCard(data);

      // Load opportunity + vehicle details for the sidebar (optional, but kept)
      if (data?.opportunityId) {
        const oppId =
          typeof data.opportunityId === 'object'
            ? (data.opportunityId as any)._id
            : data.opportunityId;

        if (oppId) {
          const opp = await opportunityService.getOpportunityById(oppId);
          setSelectedOpportunity(opp);

          const vehicleId = opp?.vehicles?.[0]?._id;
          if (vehicleId) {
            const vehicle = await vehicleService.getVehicleById(vehicleId);
            setVehicleDetails(vehicle);
          } else {
            setVehicleDetails(null);
          }
        }
      } else {
        setSelectedOpportunity(null);
        setVehicleDetails(null);
      }
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
      const updatedJobCard = await jobCardService.updateJobCard(jobCardId, payload);

      showToast(`Job card marked as ${status.replace('_', ' ')}`, 'success');

      // If job card was completed, handle workflow transition
      if (status === 'completed') {
        if (workOrderId) {
          try {
            // Update work order stage (optional, keep your current logic)
            await workOrderService.updateWorkOrder(workOrderId, {
              currentStage: 'post_checklist',
              updatedAt: new Date().toISOString(),
            });

            showToast('Job completed! Ready for post-checklist quality verification.', 'success');

            setTimeout(() => {
              if (window.confirm('Create post-checklist for quality verification?')) {
                router.push(`/post-checklist/create?workOrderId=${workOrderId}&jobCardId=${jobCardId}`);
              } else {
                // ✅ redirect back to work order it came from
                router.push(`/orders/work-orders/${workOrderId}`);
              }
            }, 700);

          } catch (workflowError) {
            console.error('Workflow transition error:', workflowError);
            showToast('Job completed!', 'success');

            // ✅ even if workflow update fails, go back to work order
            router.push(`/orders/work-orders/${workOrderId}`);
          }
        } else {
          // fallback: if no workOrderId in URL
          showToast('Job completed!', 'success');
          router.push('/job-cards');
        }
      }

      // Refresh local screen state
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDuration = (hours: number) => {
    if (!hours || hours === 0) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  const getTechnicianName = () => {
    if (!jobCard?.assignedTo) return 'Unassigned';
    if (typeof jobCard.assignedTo === 'string') return 'Loading...';
    const userRef: any = jobCard.assignedTo;
    return userRef.name || userRef.email || 'Technician';
  };

  const getPriorityColor = (priority: string) => {
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

  const calculateTotals = () => {
    const partsTotal =
      (jobCard?.partsUsed?.reduce((sum, part: any) => sum + (part.totalCost || 0), 0) as number) || 0;
    const laborCost = jobCard?.laborCost || 0;
    const totalCost = partsTotal + laborCost;
    return { partsTotal, laborCost, totalCost };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!jobCard) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Blue to Purple Theme */}
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
            <button
              onClick={handleBackToWorkOrder}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              Go to Work Order
            </button>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Optional reminder banner (NO modal now) */}
        {(jobCard.status === 'pending' && (!jobCard.assignedTo || !jobCard.startDate)) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Missing job details</h3>
                  <p className="text-sm text-gray-600">
                    This job card is missing key details (e.g. technician or start date). You can edit it anytime.
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/job-cards/${jobCard._id}/edit`)}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
              >
                Edit Now
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <h2 className="text-base font-semibold text-gray-900">Job Status</h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(
                      jobCard.priority || 'medium'
                    )}`}
                  >
                    {(jobCard.priority || 'MEDIUM').toUpperCase()}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${jobCardService.getStatusColor(
                      jobCard.status
                    )}`}
                  >
                    {jobCard.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Progress (kept) */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{jobCardService.calculateCompletionPercentage(jobCard)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${jobCardService.calculateCompletionPercentage(jobCard)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {jobCard.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={updating}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-60"
                  >
                    Start Job
                  </button>
                )}

                {jobCard.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={updating}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60"
                  >
                    Complete
                  </button>
                )}

                {jobCard.status !== 'completed' && jobCard.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updating}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}

                <button
                  onClick={() => router.push(`/job-cards/${jobCard._id}/edit`)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                >
                  Edit Details
                </button>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Job Title</p>
                  <p className="text-gray-900">{jobCard.jobTitle || 'No title provided'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-line">
                    {jobCard.jobDescription || 'No description.'}
                  </p>
                </div>

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

            {/* Parts Used */}
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
                          {jobCardService.formatCurrency(totals.partsTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Opportunity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Opportunity</h2>
              {selectedOpportunity ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Subject</p>
                    <p className="font-medium">{selectedOpportunity.subject || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium">{selectedOpportunity.customer?.name || '—'}</p>
                  </div>

                  <button
                    onClick={() => router.push(`/opportunities/${selectedOpportunity._id}`)}
                    className="mt-3 w-full text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Opportunity
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No opportunity linked</p>
              )}
            </div>

            {/* Vehicle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Vehicle</h2>
              {vehicleDetails ? (
                <div className="text-sm">
                  <p className="font-medium">{vehicleDetails.registrationNumber || '—'}</p>
                  <p className="text-gray-600">
                    {vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.year})
                  </p>
                </div>
              ) : selectedOpportunity?.vehicles?.[0] ? (
                <div className="text-sm">
                  <p className="font-medium">{(selectedOpportunity.vehicles as any)[0].registrationNumber || '—'}</p>
                  <p className="text-gray-600">
                    {(selectedOpportunity.vehicles as any)[0].make} {(selectedOpportunity.vehicles as any)[0].model}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No vehicle assigned</p>
              )}
            </div>

            {/* Technician */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Technician</h2>
              {jobCard.assignedTo && typeof jobCard.assignedTo === 'object' ? (
                <div className="text-sm">
                  <p className="font-medium">{getTechnicianName()}</p>
                  <button
                    onClick={() => router.push(`/job-cards/${jobCard._id}/edit`)}
                    className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Change Technician
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 mb-2">No technician assigned</p>
                  <button
                    onClick={() => router.push(`/job-cards/${jobCard._id}/edit`)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Assign Technician
                  </button>
                </div>
              )}
            </div>

            {/* Time & Cost */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Time & Cost</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated:</span>
                  <span className="font-medium">{formatDuration(jobCard.estimatedHours || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual:</span>
                  <span className="font-medium">{formatDuration(jobCard.actualHours || 0)}</span>
                </div>

                {(jobCard.laborCost || totals.partsTotal > 0) && (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor:</span>
                        <span className="font-medium">
                          {jobCardService.formatCurrency(jobCard.laborCost || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parts:</span>
                        <span className="font-medium">
                          {jobCardService.formatCurrency(totals.partsTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between font-bold">
                        <span>Total Cost:</span>
                        <span className="text-purple-600 font-bold">
                          {jobCardService.formatCurrency(totals.totalCost)}
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
                  <span>{formatDate(jobCard.createdAt || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span>{formatDate(jobCard.updatedAt || '')}</span>
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
