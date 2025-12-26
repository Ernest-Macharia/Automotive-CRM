'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, ArrowLeft, Save, X, Loader2,
  Calendar, Clock, AlertTriangle, User, Car,
  FileText, Plus, Trash2, DollarSign
} from 'lucide-react';
import { jobCardService, CreateJobCardData } from '@/services/jobCardService';
import { useToast } from '@/contexts/ToastContext';

interface FormData {
  opportunityId: string;
  vehicleId: string;
  jobTitle: string;
  jobDescription: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  startDate: string;
  endDate?: string;
  notes: string[];
  newNote: string;
}

export default function JobCardCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    opportunityId: '',
    vehicleId: '',
    jobTitle: '',
    jobDescription: '',
    assignedTo: '',
    priority: 'medium',
    estimatedHours: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: [],
    newNote: ''
  });

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  // Fetch dropdown data
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    // Placeholder data — replace with real API calls
    setTechnicians([
      { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    ]);
    
    setVehicles([
      { _id: '1', registrationNumber: 'KAA 123A', make: 'Toyota', model: 'Corolla', year: 2020 },
      { _id: '2', registrationNumber: 'KAB 456B', make: 'Honda', model: 'Civic', year: 2021 },
    ]);
    
    setOpportunities([
      { _id: '1', subject: 'Brake Service', customer: { name: 'Alice Johnson' } },
      { _id: '2', subject: 'Oil Change', customer: { name: 'Bob Williams' } },
    ]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? (value ? parseFloat(value) : 0) : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleAddNote = () => {
    if (formData.newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        notes: [...prev.notes, prev.newNote.trim()],
        newNote: ''
      }));
    }
  };

  const handleRemoveNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.opportunityId || !formData.vehicleId || !formData.jobTitle) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      const createData: CreateJobCardData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        estimatedHours: formData.estimatedHours,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes
      };
      
      const newJobCard = await jobCardService.createJobCard(createData);
      showToast('Job card created successfully!', 'success');
      router.push(`/job-cards/${newJobCard._id}`);
      
    } catch (error) {
      console.error('Error creating job card:', error);
      showToast('Failed to create job card', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/job-cards');
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-300' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header – Blue to Purple Gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Job Card</h1>
                <p className="text-blue-100 text-sm">Set up a new work order for service tasks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Job Details</h2>
            
            <div className="space-y-5">
              {/* Job Title & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="e.g., Front Brake Replacement"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {priorityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority: option.value as any }))}
                        className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-all ${
                          formData.priority === option.value
                            ? `border-blue-500 ${option.color}`
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the work to be performed..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors resize-none"
                  required
                />
              </div>
              
              {/* Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white"
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.registrationNumber} – {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Opportunity <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="opportunityId"
                    value={formData.opportunityId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white"
                    required
                  >
                    <option value="">Select Opportunity</option>
                    {opportunities.map(opp => (
                      <option key={opp._id} value={opp._id}>
                        {opp.subject} – {opp.customer?.name || 'Customer'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assign To
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white"
                  >
                    <option value="">Unassigned</option>
                    {technicians.map(tech => (
                      <option key={tech._id} value={tech._id}>
                        {tech.firstName} {tech.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Dates & Hours */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                    min="0.5"
                    step="0.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes & Instructions
                </label>
                <div className="space-y-2.5">
                  {formData.notes.map((note, index) => (
                    <div key={index} className="flex items-start justify-between p-2.5 bg-blue-50/40 rounded-lg border border-blue-100">
                      <span className="text-gray-700 text-sm">{note}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNote(index)}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                        aria-label="Remove note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={formData.newNote}
                      onChange={(e) => setFormData(prev => ({ ...prev, newNote: e.target.value }))}
                      placeholder="Add a note (press Enter or click +)"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      className="px-3.5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                      aria-label="Add note"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Job Card
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