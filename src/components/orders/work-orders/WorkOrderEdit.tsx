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
  status: 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
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
    startDate: new Date().toISOString().slice(0, 16), // Format for datetime-local
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
      
      // Transform the API response to match our form data
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
        jobCards: data.jobCards || [],
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
    
    try {
      setSaving(true);
      
      if (params.id && params.id !== 'new') {
        // Prepare update data
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
          jobCards: workOrder.jobCards
        };
        
        await workOrderService.updateWorkOrder(params.id as string, updateData);
        showToast('Work order updated successfully!', 'success');
        router.push(`/orders/work-orders/${params.id}`);
      } else {
        // Prepare create data
        const createData: CreateWorkOrderData = {
          opportunityId: workOrder.opportunityId || 'default-opportunity-id', // You should get this from props or context
          quoteId: workOrder.quoteId || 'default-quote-id', // You should get this from props or context
          workOrderNumber: workOrder.workOrderNumber,
          status: workOrder.status,
          assignedTo: workOrder.assignedTo || undefined,
          startDate: workOrder.startDate ? `${workOrder.startDate}:00.000Z` : undefined,
          estimatedCompletionDate: workOrder.estimatedCompletionDate ? `${workOrder.estimatedCompletionDate}:00.000Z` : undefined,
          estimatedHours: workOrder.estimatedHours,
          laborCost: workOrder.laborCost,
          partsCost: workOrder.partsCost,
          notes: workOrder.notes,
          jobCards: workOrder.jobCards
        };
        
        const newOrder = await workOrderService.createWorkOrder(createData);
        showToast('Work order created successfully!', 'success');
        router.push(`/orders/work-orders/${newOrder._id}`);
        return;
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {params.id === 'new' ? 'Create New Work Order' : `Edit Work Order`}
                </h1>
                <p className="text-green-100 text-sm">
                  {params.id === 'new' ? 'Create a new work order' : `Editing ${workOrder.workOrderNumber}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-white text-green-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-white text-white font-semibold rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-7xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleStatusChange(status.value as WorkOrderFormData['status'])}
                    className={`px-4 py-3 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                      workOrder.status === status.value
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${status.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{status.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              {/* Schedule Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  Schedule Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={workOrder.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Completion Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="estimatedCompletionDate"
                      value={workOrder.estimatedCompletionDate}
                      onChange={(e) => handleDateChange('estimatedCompletionDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        name="estimatedHours"
                        value={workOrder.estimatedHours}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Actual Hours
                      </label>
                      <input
                        type="number"
                        name="actualHours"
                        value={workOrder.actualHours}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Technician */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  Assigned Technician
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technician ID or Name
                  </label>
                  <div className="relative">
                    <select
                      name="assignedTo"
                      value={workOrder.assignedTo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors appearance-none bg-white"
                    >
                      <option value="">Select Technician</option>
                      <option value="tech1">John Smith</option>
                      <option value="tech2">Sarah Johnson</option>
                      <option value="tech3">Mike Wilson</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Cost & Notes */}
            <div className="space-y-6">
              {/* Cost Breakdown */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  Cost Breakdown
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Labor Cost (KES)
                    </label>
                    <input
                      type="number"
                      name="laborCost"
                      value={workOrder.laborCost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parts Cost (KES)
                    </label>
                    <input
                      type="number"
                      name="partsCost"
                      value={workOrder.partsCost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Cost:</span>
                      <span className="text-2xl font-bold text-green-600">
                        KES {totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Notes & Instructions</h2>
                
                <div>
                  <textarea
                    name="notes"
                    value={workOrder.notes}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Add any notes, instructions, or special requirements for this work order..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Job Cards */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Job Cards</h2>
                
                <div className="space-y-3">
                  {workOrder.jobCards.map((jobCard, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-800">Job Card #{index + 1}</p>
                        <p className="text-sm text-gray-500">{jobCard}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWorkOrder(prev => ({
                            ...prev,
                            jobCards: prev.jobCards.filter((_, i) => i !== index)
                          }));
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newJobCard = prompt('Enter Job Card ID:');
                      if (newJobCard) {
                        setWorkOrder(prev => ({
                          ...prev,
                          jobCards: [...prev.jobCards, newJobCard]
                        }));
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-500 hover:text-green-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Add Job Card
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-teal-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {params.id === 'new' ? 'Create Work Order' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}