'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Wrench, ArrowLeft, Calendar, DollarSign, 
  Clock, Users, CheckCircle, AlertCircle,
  Save, X, Loader2, Plus, Trash2,
  FileText, ChevronDown
} from 'lucide-react';
import { workOrderService, WorkOrder, CreateWorkOrderData, UpdateWorkOrderData } from '@/services/workOrderService';
import { useToast } from '@/contexts/ToastContext';

interface WorkOrderFormData {
  workOrderNumber: string;
  status: 'draft' | 'pre_checklist' | 'in_progress' | 'job_card' | 'post_checklist' | 'ready_for_invoice' | 'completed' | 'cancelled' | 'delayed';
  startDate: string;
  estimatedCompletionDate: string;
  actualCompletionDate: string;
  estimatedHours: number;
  actualHours: number;
  laborCost: number;
  partsCost: number;
  assignedTo: string;
  notes: string;
  jobCards: string[];
  opportunityId?: string;
  quoteId?: string;
}

export default function WorkOrderEdit() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workOrder, setWorkOrder] = useState<WorkOrderFormData>({
    workOrderNumber: workOrderService.generateWorkOrderNumber(),
    status: 'draft',
    startDate: new Date().toISOString().slice(0, 16),
    estimatedCompletionDate: '',
    actualCompletionDate: '',
    estimatedHours: 0,
    actualHours: 0,
    laborCost: 0,
    partsCost: 0,
    assignedTo: '',
    notes: '',
    jobCards: []
  });

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchWorkOrder(params.id as string);
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const fetchWorkOrder = async (id: string) => {
    try {
      setLoading(true);
      const data = await workOrderService.getWorkOrderById(id);
      
      // Extract job card IDs from the data
      const jobCardsIds = Array.isArray(data.jobCards)
        ? data.jobCards.map(jobCard => 
            typeof jobCard === 'object' ? jobCard._id || '' : jobCard
          ).filter(Boolean)
        : [];
      
      const formData: WorkOrderFormData = {
        workOrderNumber: data.workOrderNumber,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '',
        estimatedCompletionDate: data.estimatedCompletionDate ? new Date(data.estimatedCompletionDate).toISOString().slice(0, 16) : '',
        actualCompletionDate: data.actualCompletionDate ? new Date(data.actualCompletionDate).toISOString().slice(0, 16) : '',
        estimatedHours: data.estimatedHours || 0,
        actualHours: data.actualHours || 0,
        laborCost: data.laborCost || 0,
        partsCost: data.partsCost || 0,
        assignedTo: typeof data.assignedTo === 'string' ? data.assignedTo : data.assignedTo?._id || '',
        notes: data.notes || '',
        jobCards: jobCardsIds, // Use extracted IDs
        opportunityId: typeof data.opportunityId === 'string' ? data.opportunityId : data.opportunityId?._id,
        quoteId: typeof data.quoteId === 'string' ? data.quoteId : data.quoteId?._id
      };
      
      setWorkOrder(formData);
    } catch (error) {
      console.error('Error fetching work order:', error);
      showToast('Failed to load work order', 'error');
      router.push('/orders/work-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setWorkOrder(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setWorkOrder(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (status: WorkOrderFormData['status']) => {
    setWorkOrder(prev => ({ ...prev, status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const extractJobCardIds = (jobCards: any[]): string[] => {
      return jobCards
        .map(jobCard => {
          if (jobCard && typeof jobCard === 'object') {
            return jobCard._id || '';
          }
          return jobCard || '';
        })
        .filter(Boolean);
    };
    try {
      setSaving(true);
      if (params.id && params.id !== 'new') {
        // Ensure jobCards is always string array
        const jobCardsIds = Array.isArray(workOrder.jobCards) 
          ? extractJobCardIds(workOrder.jobCards)
          : [];
        
        const updateData: UpdateWorkOrderData = {
          status: workOrder.status,
          assignedTo: workOrder.assignedTo || undefined,
          startDate: workOrder.startDate ? `${workOrder.startDate}:00.000Z` : undefined,
          estimatedCompletionDate: workOrder.estimatedCompletionDate ? `${workOrder.estimatedCompletionDate}:00.000Z` : undefined,
          actualCompletionDate: workOrder.actualCompletionDate ? `${workOrder.actualCompletionDate}:00.000Z` : undefined,
          estimatedHours: workOrder.estimatedHours,
          actualHours: workOrder.actualHours,
          laborCost: workOrder.laborCost,
          partsCost: workOrder.partsCost,
          totalCost: workOrder.laborCost + workOrder.partsCost,
          notes: workOrder.notes,
          jobCards: jobCardsIds // Ensure it's string array
        };
        await workOrderService.updateWorkOrder(params.id as string, updateData);
        showToast('Work order updated successfully!', 'success');
        router.push(`/orders/work-orders/${params.id}`);
      } else {
        // Ensure jobCards is always string array for create
        const jobCardsIds = Array.isArray(workOrder.jobCards) 
          ? extractJobCardIds(workOrder.jobCards)
          : [];
        
        const createData: CreateWorkOrderData = {
          opportunityId: workOrder.opportunityId || 'default-opportunity-id',
          quoteId: workOrder.quoteId || 'default-quote-id',
          // workOrderNumber is removed - backend should generate it
          status: workOrder.status,
          assignedTo: workOrder.assignedTo || undefined,
          startDate: workOrder.startDate ? `${workOrder.startDate}:00.000Z` : undefined,
          estimatedCompletionDate: workOrder.estimatedCompletionDate ? `${workOrder.estimatedCompletionDate}:00.000Z` : undefined,
          estimatedHours: workOrder.estimatedHours,
          laborCost: workOrder.laborCost,
          partsCost: workOrder.partsCost,
          notes: workOrder.notes,
          jobCards: jobCardsIds
        };
        const newOrder = await workOrderService.createWorkOrder(createData);
        showToast('Work order created successfully!', 'success');
        router.push(`/orders/work-orders/${newOrder._id}`);
      }
    } catch (error) {
      console.error('Error saving work order:', error);
      showToast('Failed to save work order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (params.id && params.id !== 'new') {
      router.push(`/orders/work-orders/${params.id}`);
    } else {
      router.push('/orders/work-orders');
    }
  };

  const handleAddJobCard = () => {
    const newJobCard = prompt('Enter Job Card ID:');
    if (newJobCard && newJobCard.trim()) {
      setWorkOrder(prev => ({
        ...prev,
        jobCards: [...prev.jobCards, newJobCard.trim()]
      }));
    }
  };

  const handleRemoveJobCard = (index: number) => {
    setWorkOrder(prev => ({
      ...prev,
      jobCards: prev.jobCards.filter((_, i) => i !== index)
    }));
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: FileText, color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', icon: Wrench, color: 'bg-blue-100 text-blue-700' },
    { value: 'on_hold', label: 'On Hold', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { value: 'cancelled', label: 'Cancelled', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  ];

  const totalCost = workOrder.laborCost + workOrder.partsCost;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🟢🟦 Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {params.id === 'new' ? 'Create New Work Order' : 'Edit Work Order'}
                </h1>
                <p className="text-green-100 text-xs sm:text-sm">
                  {params.id === 'new' ? 'Fill in the work order details' : `Editing ${workOrder.workOrderNumber}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 text-white border border-white rounded-lg hover:bg-white/10 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
                  saving
                    ? 'bg-green-400 text-white'
                    : 'bg-white text-green-600 hover:bg-gray-100'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleStatusChange(status.value as WorkOrderFormData['status'])}
                    className={`px-3 py-2.5 rounded-lg flex flex-col items-center justify-center gap-1.5 text-xs border transition-colors ${
                      workOrder.status === status.value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${status.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Schedule Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Schedule
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={workOrder.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Estimated Completion
                    </label>
                    <input
                      type="datetime-local"
                      value={workOrder.estimatedCompletionDate}
                      onChange={(e) => handleDateChange('estimatedCompletionDate', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        name="estimatedHours"
                        value={workOrder.estimatedHours}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Actual Hours
                      </label>
                      <input
                        type="number"
                        name="actualHours"
                        value={workOrder.actualHours}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Technician */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  Technician
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assigned Technician
                  </label>
                  <div className="relative">
                    <select
                      name="assignedTo"
                      value={workOrder.assignedTo}
                      onChange={handleChange}
                      className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">Select Technician</option>
                      <option value="tech1">John Smith</option>
                      <option value="tech2">Sarah Johnson</option>
                      <option value="tech3">Mike Wilson</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Cost Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Costs
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Labor Cost (KES)
                    </label>
                    <input
                      type="number"
                      name="laborCost"
                      value={workOrder.laborCost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Parts Cost (KES)
                    </label>
                    <input
                      type="number"
                      name="partsCost"
                      value={workOrder.partsCost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Total Cost:</span>
                      <span className="text-lg font-bold text-green-600">
                        KES {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <textarea
                  name="notes"
                  value={workOrder.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Add notes or special instructions..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>

              {/* Job Cards */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Job Cards</h2>
                  <button
                    type="button"
                    onClick={handleAddJobCard}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
                
                {workOrder.jobCards.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No job cards added yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workOrder.jobCards.map((jobCard, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded">
                        <span className="text-sm font-medium">#{index + 1} • {jobCard}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveJobCard(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          aria-label="Remove job card"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              <X className="h-4 w-4 inline mr-1.5" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  {params.id === 'new' ? 'Create Order' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}