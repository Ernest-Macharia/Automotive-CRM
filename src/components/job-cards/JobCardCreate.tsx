'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, ArrowLeft, Save, X, Loader2,
  Calendar, Clock, AlertTriangle, User, Car,
  FileText, Plus, Trash2, DollarSign, Package,
  ChevronDown, Search
} from 'lucide-react';
import { jobCardService, CreateJobCardData } from '@/services/jobCardService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface FormData {
  // Required fields
  opportunityId: string;
  vehicleId: string;
  jobTitle: string;
  jobDescription: string;
  assignedTo: string;
  
  // Optional fields
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  actualHours: number;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  startDate: string;
  endDate: string;
  completedDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
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

export default function JobCardCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    opportunityId: '',
    vehicleId: '',
    jobTitle: '',
    jobDescription: '',
    assignedTo: '',
    priority: 'medium',
    estimatedHours: 1,
    actualHours: 0,
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    completedDate: '',
    status: 'pending',
    notes: [],
    newNote: '',
    partsUsed: []
  });

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<{ value: string; label: string; opportunity: Opportunity }[]>([]);
  const [vehicles, setVehicles] = useState<{ value: string; label: string }[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Fetch dropdown data on component mount
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch vehicles when opportunity changes
  useEffect(() => {
    if (formData.opportunityId) {
      fetchVehiclesForOpportunity(formData.opportunityId);
    } else {
      setVehicles([]);
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [formData.opportunityId]);

  const fetchDropdownData = async () => {
    try {
      // Fetch technicians
      setTechnicians([
        { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        { _id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com' },
      ]);
      
      // Fetch parts
      setParts([
        { _id: '1', partNumber: 'BRK-001', name: 'Brake Pads', unitPrice: 45.99 },
        { _id: '2', partNumber: 'OIL-002', name: 'Engine Oil 5W-30', unitPrice: 32.50 },
        { _id: '3', partNumber: 'FIL-003', name: 'Oil Filter', unitPrice: 12.75 },
        { _id: '4', partNumber: 'SPK-004', name: 'Spark Plugs', unitPrice: 8.99 },
      ]);
      
      // Fetch opportunities
      await fetchOpportunities();
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showToast('Failed to load dropdown data', 'error');
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoadingOpportunities(true);
      const response = await opportunityService.getAllOpportunities({
        page: 1,
        limit: 100,
        sort: '-createdAt'
      });
      
      const opportunityOptions = (response.data || []).map(opp => ({
        value: opp._id,
        label: `${opp.subject} - ${opp.customer?.name}`,
        opportunity: opp
      }));
      
      setOpportunities(opportunityOptions);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      showToast('Failed to load opportunities', 'error');
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const fetchVehiclesForOpportunity = async (opportunityId: string) => {
    try {
      setLoadingVehicles(true);
      
      // Find the selected opportunity from our list
      const opportunityOption = opportunities.find(opt => opt.value === opportunityId);
      
      if (opportunityOption) {
        setSelectedOpportunity(opportunityOption.opportunity);
        
        // If the opportunity has vehicles in its data
        if (opportunityOption.opportunity.vehicles && opportunityOption.opportunity.vehicles.length > 0) {
          const vehicleOptions = opportunityOption.opportunity.vehicles.map((vehicle: any) => ({
            value: vehicle._id || vehicle.id,
            label: `${vehicle.registrationNumber || vehicle.licensePlate || 'No Plate'} - ${vehicle.make} ${vehicle.model}`
          }));
          setVehicles(vehicleOptions);
        } else {
          // If no vehicles in opportunity data, fetch the full opportunity to get vehicles
          const fullOpportunity = await opportunityService.getOpportunityById(opportunityId);
          setSelectedOpportunity(fullOpportunity);
          
          if (fullOpportunity.vehicles && fullOpportunity.vehicles.length > 0) {
            const vehicleOptions = fullOpportunity.vehicles.map((vehicle: any) => ({
              value: vehicle._id || vehicle.id,
              label: `${vehicle.registrationNumber || vehicle.licensePlate || 'No Plate'} - ${vehicle.make} ${vehicle.model}`
            }));
            setVehicles(vehicleOptions);
          } else {
            setVehicles([]);
            showToast('No vehicles found for this opportunity', 'warning');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showToast('Failed to load vehicles', 'error');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      newValue = value ? parseFloat(value) : 0;
    }
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Recalculate totals if needed
      if (['laborCost', 'partsCost'].includes(name)) {
        updated.totalCost = (updated.laborCost || 0) + (updated.partsCost || 0);
      }
      
      return updated;
    });
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

  const handlePartChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
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
    setFormData(prev => ({
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
    setFormData(prev => ({
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

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.opportunityId) errors.push('Opportunity is required');
    if (!formData.vehicleId) errors.push('Vehicle is required');
    if (!formData.jobTitle.trim()) errors.push('Job title is required');
    if (!formData.jobDescription.trim()) errors.push('Job description is required');
    
    if (errors.length > 0) {
      showToast(errors.join(', '), 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare create data - only include fields that backend expects
      const createData: CreateJobCardData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        assignedTo: formData.assignedTo || undefined,
        
        // Optional fields
        priority: formData.priority,
        estimatedHours: formData.estimatedHours,
        actualHours: formData.actualHours > 0 ? formData.actualHours : undefined,
        laborCost: formData.laborCost > 0 ? formData.laborCost : undefined,
        partsCost: formData.partsCost > 0 ? formData.partsCost : undefined,
        totalCost: formData.totalCost > 0 ? formData.totalCost : undefined,
        startDate: formData.startDate ? `${formData.startDate}T00:00:00.000Z` : undefined,
        endDate: formData.endDate ? `${formData.endDate}T00:00:00.000Z` : undefined,
        completedDate: formData.completedDate ? `${formData.completedDate}T00:00:00.000Z` : undefined,
        status: formData.status,
        notes: formData.notes.length > 0 ? formData.notes : undefined,
        partsUsed: formData.partsUsed.length > 0 ? formData.partsUsed : undefined
      };
      
      console.log('Creating job card with data:', createData);
      
      const newJobCard = await jobCardService.createJobCard(createData);
      showToast('Job card created successfully!', 'success');
      router.push(`/job-cards/${newJobCard._id}`);
      
    } catch (error: any) {
      console.error('Error creating job card:', error);
      
      if (error.response?.data?.message) {
        showToast(`Failed to create job card: ${error.response.data.message}`, 'error');
      } else if (error.message) {
        showToast(`Failed to create job card: ${error.message}`, 'error');
      } else {
        showToast('Failed to create job card. Please check the data and try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/job-cards');
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
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
      <div className="max-w-7xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Basic Information</h2>
            
            <div className="space-y-5">
              {/* Opportunity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opportunity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="opportunityId"
                    value={formData.opportunityId}
                    onChange={handleChange}
                    disabled={loadingOpportunities}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select an opportunity</option>
                    {loadingOpportunities ? (
                      <option value="" disabled>Loading opportunities...</option>
                    ) : opportunities.length === 0 ? (
                      <option value="" disabled>No opportunities found</option>
                    ) : (
                      opportunities.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Selected Opportunity Info */}
                {selectedOpportunity && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Customer</p>
                        <p className="text-gray-800">{selectedOpportunity.customer?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Contact</p>
                        <p className="text-gray-800">
                          {selectedOpportunity.customer?.phone || selectedOpportunity.customer?.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Type</p>
                        <p className="text-gray-800">{selectedOpportunity.opportunityType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedOpportunity.status === 'won' ? 'bg-green-100 text-green-800' :
                          selectedOpportunity.status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedOpportunity.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Vehicle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    disabled={!formData.opportunityId || loadingVehicles}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">
                      {!formData.opportunityId 
                        ? 'Select an opportunity first' 
                        : loadingVehicles 
                        ? 'Loading vehicles...' 
                        : vehicles.length === 0
                        ? 'No vehicles found'
                        : 'Select a vehicle'}
                    </option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.value} value={vehicle.value}>
                        {vehicle.label}
                      </option>
                    ))}
                  </select>
                  <Car className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
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
              
              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the work to be performed in detail..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors resize-none"
                  required
                />
              </div>
              
              {/* Technician Assignment & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assign Technician
                  </label>
                  <div className="relative">
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white appearance-none"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map(tech => (
                        <option key={tech._id} value={tech._id}>
                          {tech.firstName} {tech.lastName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white appearance-none"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time & Cost Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Time & Cost Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Dates */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </h3>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
                
                {formData.status === 'completed' && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Completed Date
                    </label>
                    <input
                      type="date"
                      name="completedDate"
                      value={formData.completedDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
              
              {/* Hours */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hours
                </h3>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                    min="0.5"
                    step="0.5"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Actual Hours
                  </label>
                  <input
                    type="number"
                    name="actualHours"
                    value={formData.actualHours}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              {/* Costs */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Costs (KES)
                </h3>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Labor Cost
                  </label>
                  <input
                    type="number"
                    name="laborCost"
                    value={formData.laborCost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Parts Cost
                  </label>
                  <input
                    type="number"
                    name="partsCost"
                    value={formData.partsCost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {jobCardService.formatCurrency(formData.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parts Used Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
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
            
            {formData.partsUsed.length === 0 ? (
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
                    {formData.partsUsed.map((part, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="relative">
                            <select
                              value={part.partId}
                              onChange={(e) => handleSelectPart(index, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white appearance-none"
                            >
                              <option value="">Select Part</option>
                              {parts.map(p => (
                                <option key={p._id} value={p._id}>
                                  {p.partNumber} - {p.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={part.name}
                            onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                            placeholder="Part description"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={part.quantity}
                            onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-24 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={part.unitPrice}
                            onChange={(e) => handlePartChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
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
                </table>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Notes & Instructions</h2>
            
            <div className="space-y-3">
              {formData.notes.map((note, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50/40 rounded-lg border border-blue-100">
                  <span className="text-gray-700">{note}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNote(index)}
                    className="p-1 hover:bg-red-100 rounded text-red-500"
                    aria-label="Remove note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={formData.newNote}
                  onChange={(e) => setFormData(prev => ({ ...prev, newNote: e.target.value }))}
                  placeholder="Add a note or instruction..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
                  aria-label="Add note"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p className="font-medium">Required fields are marked with <span className="text-red-500">*</span></p>
                <p className="mt-1">Make sure all required information is filled before submitting.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
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
          </div>
        </form>
      </div>
    </div>
  );
}