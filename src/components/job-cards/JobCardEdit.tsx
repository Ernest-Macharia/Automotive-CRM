'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Wrench, ArrowLeft, Save, X, Loader2,
  Calendar, Clock, AlertTriangle, User, Car,
  FileText, Plus, Trash2, DollarSign, Package,
  ChevronDown, CheckCircle, Truck, Play, Pause
} from 'lucide-react';
import { jobCardService, JobCard, UpdateJobCardData } from '@/services/jobCardService';
import { useToast } from '@/contexts/ToastContext';

interface JobCardFormData {
  jobTitle: string;
  jobDescription: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  estimatedHours: number;
  actualHours?: number;
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  notes: string[];
  newNote: string;
  partsUsed: Array<{
    partId: string;
    partNumber: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
  }>;
}

interface JobCardEditProps {
  jobCardId: string;
}

export default function JobCardEdit({ jobCardId }: JobCardEditProps) {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobCard, setJobCard] = useState<JobCardFormData>({
    jobTitle: '',
    jobDescription: '',
    status: 'pending',
    priority: 'medium',
    assignedTo: '',
    estimatedHours: 1,
    actualHours: 0,
    startDate: '',
    endDate: '',
    completedDate: '',
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    notes: [],
    newNote: '',
    partsUsed: []
  });

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchJobCard(params.id as string);
    }
    fetchDropdownData();
  }, [params.id]);

  const fetchJobCard = async (id: string) => {
    try {
      setLoading(true);
      const data = await jobCardService.getJobCardById(id);
      
      // Transform the API response to match our form data
      const formData: JobCardFormData = {
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        status: data.status,
        priority: data.priority,
        assignedTo: typeof data.assignedTo === 'string' ? data.assignedTo : data.assignedTo?._id,
        estimatedHours: data.estimatedHours || 1,
        actualHours: data.actualHours || 0,
        startDate: data.startDate?.split('T')[0],
        endDate: data.endDate?.split('T')[0],
        completedDate: data.completedDate?.split('T')[0],
        laborCost: data.laborCost || 0,
        partsCost: data.partsCost || 0,
        totalCost: data.totalCost || 0,
        notes: data.notes || [],
        newNote: '',
        partsUsed: data.partsUsed || []
      };
      
      setJobCard(formData);
    } catch (error) {
      console.error('Error fetching job card:', error);
      showToast('Failed to load job card', 'error');
      router.push('/job-cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    // These are placeholder fetches - implement actual API calls
    setTechnicians([
      { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      { _id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com' },
    ]);
    
    setParts([
      { _id: '1', partNumber: 'BRK-001', name: 'Brake Pads', unitPrice: 45.99 },
      { _id: '2', partNumber: 'OIL-002', name: 'Engine Oil 5W-30', unitPrice: 32.50 },
      { _id: '3', partNumber: 'FIL-003', name: 'Oil Filter', unitPrice: 12.75 },
      { _id: '4', partNumber: 'SPK-004', name: 'Spark Plugs', unitPrice: 8.99 },
    ]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setJobCard(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Recalculate total if cost fields change
      if (['laborCost', 'partsCost'].includes(name)) {
        updated.totalCost = (updated.laborCost || 0) + (updated.partsCost || 0);
      }
      
      return updated;
    });
  };

  const handleStatusChange = (status: JobCardFormData['status']) => {
    const now = new Date().toISOString().split('T')[0];
    const updatedJobCard = { ...jobCard, status };
    
    // Set completed date if marking as completed
    if (status === 'completed' && !jobCard.completedDate) {
      updatedJobCard.completedDate = now;
    }
    
    // Clear completed date if moving from completed
    if (jobCard.status === 'completed' && status !== 'completed') {
      updatedJobCard.completedDate = '';
    }
    
    setJobCard(updatedJobCard);
  };

  const handleAddNote = () => {
    if (jobCard.newNote.trim()) {
      setJobCard(prev => ({
        ...prev,
        notes: [...prev.notes, prev.newNote.trim()],
        newNote: ''
      }));
    }
  };

  const handleRemoveNote = (index: number) => {
    setJobCard(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index)
    }));
  };

  const handlePartChange = (index: number, field: string, value: string | number) => {
    setJobCard(prev => {
      const partsUsed = [...prev.partsUsed];
      
      if (partsUsed[index]) {
        const updatedPart = {
          ...partsUsed[index],
          [field]: typeof value === 'string' && field !== 'name' && field !== 'partNumber' && field !== 'partId'
            ? parseFloat(value) || 0
            : value
        };
        
        // Recalculate line total
        if (field === 'quantity' || field === 'unitPrice') {
          updatedPart.totalCost = updatedPart.quantity * updatedPart.unitPrice;
        }
        
        partsUsed[index] = updatedPart;
      }
      
      // Recalculate parts cost and total
      const partsCost = partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0);
      const totalCost = partsCost + (prev.laborCost || 0);
      
      return {
        ...prev,
        partsUsed,
        partsCost,
        totalCost
      };
    });
  };

  const addPart = () => {
    setJobCard(prev => ({
      ...prev,
      partsUsed: [
        ...prev.partsUsed,
        {
          partId: '',
          partNumber: '',
          name: '',
          quantity: 1,
          unitPrice: 0,
          totalCost: 0
        }
      ]
    }));
  };

  const removePart = (index: number) => {
    setJobCard(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index)
    }));
  };

  const handleSelectPart = (index: number, partId: string) => {
    const selectedPart = parts.find(p => p._id === partId);
    if (selectedPart) {
      handlePartChange(index, 'partId', selectedPart._id);
      handlePartChange(index, 'partNumber', selectedPart.partNumber);
      handlePartChange(index, 'name', selectedPart.name);
      handlePartChange(index, 'unitPrice', selectedPart.unitPrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Prepare update data
      const updateData: UpdateJobCardData = {
        jobTitle: jobCard.jobTitle,
        jobDescription: jobCard.jobDescription,
        status: jobCard.status,
        priority: jobCard.priority,
        assignedTo: jobCard.assignedTo,
        estimatedHours: jobCard.estimatedHours,
        actualHours: jobCard.actualHours,
        startDate: jobCard.startDate ? `${jobCard.startDate}T00:00:00.000Z` : undefined,
        endDate: jobCard.endDate ? `${jobCard.endDate}T00:00:00.000Z` : undefined,
        completedDate: jobCard.completedDate ? `${jobCard.completedDate}T00:00:00.000Z` : undefined,
        laborCost: jobCard.laborCost,
        partsCost: jobCard.partsCost,
        totalCost: jobCard.totalCost,
        notes: jobCard.notes,
        partsUsed: jobCard.partsUsed
      };
      
      await jobCardService.updateJobCard(params.id as string, updateData);
      showToast('Job card updated successfully!', 'success');
      router.push(`/job-cards/${params.id}`);
      
    } catch (error) {
      console.error('Error updating job card:', error);
      showToast('Failed to update job card', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/job-cards/${params.id}`);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-gray-100 text-gray-700' },
    { value: 'assigned', label: 'Assigned', icon: User, color: 'bg-blue-100 text-blue-700' },
    { value: 'in_progress', label: 'In Progress', icon: Play, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'bg-orange-100 text-orange-700' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { value: 'cancelled', label: 'Cancelled', icon: X, color: 'bg-red-100 text-red-700' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-blue-800 p-6 shadow-lg">
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
                <h1 className="text-2xl font-bold text-white">Edit Job Card</h1>
                <p className="text-gray-200 text-sm">Editing: {jobCard.jobTitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          {/* Job Status & Priority */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Job Status & Priority</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => handleStatusChange(status.value as JobCardFormData['status'])}
                        className={`px-3 py-3 rounded-xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                          jobCard.status === status.value
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${status.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium text-center">{status.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Priority</h3>
                <div className="grid grid-cols-4 gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setJobCard(prev => ({ ...prev, priority: option.value as any }))}
                      className={`px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        jobCard.priority === option.value
                          ? `border-blue-500 ${option.color}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Job Information */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Job Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={jobCard.jobTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      name="jobDescription"
                      value={jobCard.jobDescription}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors resize-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Technician *
                    </label>
                    <div className="relative">
                      <select
                        name="assignedTo"
                        value={jobCard.assignedTo}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors appearance-none bg-white"
                        required
                      >
                        <option value="">Select Technician</option>
                        {technicians.map(tech => (
                          <option key={tech._id} value={tech._id}>
                            {tech.firstName} {tech.lastName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Tracking */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  Time Tracking
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        name="estimatedHours"
                        value={jobCard.estimatedHours}
                        onChange={handleChange}
                        min="0.5"
                        step="0.5"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Actual Hours
                      </label>
                      <input
                        type="number"
                        name="actualHours"
                        value={jobCard.actualHours || 0}
                        onChange={handleChange}
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={jobCard.startDate || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {jobCard.status === 'completed' ? 'Completed Date' : 'End Date'}
                      </label>
                      <input
                        type="date"
                        name={jobCard.status === 'completed' ? 'completedDate' : 'endDate'}
                        value={jobCard.status === 'completed' ? jobCard.completedDate || '' : jobCard.endDate || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Financial & Notes */}
            <div className="space-y-6">
              {/* Cost Information */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  Cost Information
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Labor Cost (KES)
                      </label>
                      <input
                        type="number"
                        name="laborCost"
                        value={jobCard.laborCost || 0}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parts Cost (KES)
                      </label>
                      <input
                        type="number"
                        name="partsCost"
                        value={jobCard.partsCost || 0}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Cost:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {jobCardService.formatCurrency(jobCard.totalCost || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Notes & Instructions</h2>
                
                <div className="space-y-3">
                  {jobCard.notes.map((note, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{note}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNote(index)}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={jobCard.newNote}
                      onChange={(e) => setJobCard(prev => ({ ...prev, newNote: e.target.value }))}
                      placeholder="Add a note..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parts Used */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parts Used
              </h2>
              <button
                type="button"
                onClick={addPart}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Part
              </button>
            </div>
            
            {jobCard.partsUsed.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No parts added. Click "Add Part" to add parts used for this job.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Part</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Unit Price</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Total</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobCard.partsUsed.map((part, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <select
                            value={part.partId}
                            onChange={(e) => handleSelectPart(index, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white"
                          >
                            <option value="">Select Part</option>
                            {parts.map(p => (
                              <option key={p._id} value={p._id}>
                                {p.partNumber} - {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={part.name}
                            onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                            placeholder="Part description"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={part.quantity}
                            onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-24 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={part.unitPrice}
                            onChange={(e) => handlePartChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {jobCardService.formatCurrency(part.totalCost || 0)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => removePart(index)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="py-3 px-4 text-right font-medium">
                        Total Parts Cost:
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600">
                        {jobCardService.formatCurrency(jobCard.partsCost || 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
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
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
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