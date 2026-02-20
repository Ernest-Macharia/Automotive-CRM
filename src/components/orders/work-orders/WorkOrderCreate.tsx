// components/workorders/WorkOrderCreate.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench, ArrowLeft, Save, Plus, Trash2,
  Loader2, AlertTriangle, FileText, Calendar,
  User, Package, Clock, DollarSign, CheckCircle,
  Search, X, Info, AlertCircle, Layers, Shield,
  Building2, Phone, Mail, MapPin, Car, FileCheck,
  ClipboardList, Settings, Users, Tag
} from 'lucide-react';
import { workOrderService, CreateWorkOrderData } from '@/services/workOrderService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { quoteService } from '@/services/quoteService';
import { useToast } from '@/contexts/ToastContext';

interface FormData {
  opportunityId: string;
  quoteId: string;
  waiverId: string;
  vehicleId: string;
  assignedTo: string;
  status: 'draft' | 'pre_checklist' | 'in_progress' | 'job_card' | 'post_checklist' | 'ready_for_invoice' | 'completed' | 'cancelled' | 'delayed';
  currentStage: 'pre_checklist' | 'job_card' | 'post_checklist' | 'invoice';
  startDate: string;
  estimatedCompletionDate: string;
  estimatedHours: number;
  laborCost: number;
  partsCost: number;
  notes: string;
  // Additional fields for better UX
  searchOpportunity: string;
  selectedOpportunity: Opportunity | null;
  loadingOpportunity: boolean;
  assignedTechnicians: Array<{
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | string>;
  newTechnician: string;
  // Job cards
  jobCards: Array<{ id: string; title: string; status: string }>;
}

interface SalesRep {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export default function WorkOrderCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [searchingOpportunity, setSearchingOpportunity] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [showOpportunitySearch, setShowOpportunitySearch] = useState(false);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loadingSalesReps, setLoadingSalesReps] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    opportunityId: '',
    quoteId: '',
    waiverId: '',
    vehicleId: '',
    assignedTo: '',
    status: 'draft',
    currentStage: 'pre_checklist',
    startDate: new Date().toISOString().split('T')[0],
    estimatedCompletionDate: '',
    estimatedHours: 2,
    laborCost: 0,
    partsCost: 0,
    notes: '',
    searchOpportunity: '',
    selectedOpportunity: null,
    loadingOpportunity: false,
    assignedTechnicians: [],
    newTechnician: '',
    jobCards: []
  });

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: FileText, color: 'bg-gray-100 text-gray-700' },
    { value: 'pre_checklist', label: 'Pre-Checklist', icon: ClipboardList, color: 'bg-purple-100 text-purple-700' },
    { value: 'in_progress', label: 'In Progress', icon: Settings, color: 'bg-blue-100 text-blue-700' },
    { value: 'job_card', label: 'Job Card', icon: FileCheck, color: 'bg-indigo-100 text-indigo-700' },
    { value: 'post_checklist', label: 'Post-Checklist', icon: CheckCircle, color: 'bg-teal-100 text-teal-700' },
    { value: 'ready_for_invoice', label: 'Ready for Invoice', icon: DollarSign, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { value: 'cancelled', label: 'Cancelled', icon: X, color: 'bg-red-100 text-red-700' },
    { value: 'delayed', label: 'Delayed', icon: Clock, color: 'bg-orange-100 text-orange-700' }
  ];

  const stageOptions = [
    { value: 'pre_checklist', label: 'Pre-Checklist' },
    { value: 'job_card', label: 'Job Card' },
    { value: 'post_checklist', label: 'Post-Checklist' },
    { value: 'invoice', label: 'Invoice' }
  ];

  // Load sales reps on mount
  useEffect(() => {
    loadSalesReps();
  }, []);

  const loadSalesReps = async () => {
    try {
      setLoadingSalesReps(true);
      const reps = await opportunityService.getAvailableSalesReps();
      setSalesReps(reps);
    } catch (error) {
      console.error('Error loading sales reps:', error);
    } finally {
      setLoadingSalesReps(false);
    }
  };

  const searchOpportunities = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setOpportunities([]);
      return;
    }

    try {
      setSearchingOpportunity(true);
      const response = await opportunityService.searchOpportunities(searchTerm);
      setOpportunities(response.data || []);
    } catch (error) {
      console.error('Error searching opportunities:', error);
      showToast('Failed to search opportunities', 'error');
    } finally {
      setSearchingOpportunity(false);
    }
  };

  const loadOpportunityQuotes = async (opportunityId: string) => {
    try {
      setLoadingQuotes(true);
      // Assuming you have a method to get quotes by opportunity
      const response = await quoteService.getQuotesByOpportunity(opportunityId);
      setQuotes(response || []);
      
      // Auto-select the latest quote if available
      if (response && response.length > 0) {
        const latestQuote = response[response.length - 1];
        setFormData(prev => ({
          ...prev,
          quoteId: latestQuote._id || latestQuote.id
        }));
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      showToast('Failed to load quotes', 'error');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleSelectOpportunity = async (opportunity: Opportunity) => {
    setFormData(prev => ({
      ...prev,
      opportunityId: opportunity._id,
      selectedOpportunity: opportunity,
      searchOpportunity: opportunity.subject,
      // Auto-populate from opportunity
      assignedTo: opportunity.assignedTo?._id || opportunity.assignedTo?.id || '',
      notes: `Work order for: ${opportunity.subject}\nCustomer: ${opportunity.customer?.name || ''}`
    }));
    setShowOpportunitySearch(false);
    
    // Load quotes for this opportunity
    await loadOpportunityQuotes(opportunity._id);
    
    // If opportunity has vehicles, suggest the first one
    if (opportunity.vehicles && opportunity.vehicles.length > 0) {
      const firstVehicle = opportunity.vehicles[0];
      setFormData(prev => ({
        ...prev,
        vehicleId: firstVehicle._id || firstVehicle.id
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTechnician = () => {
    if (formData.newTechnician.trim()) {
      setFormData(prev => ({
        ...prev,
        assignedTechnicians: [...prev.assignedTechnicians, prev.newTechnician.trim()],
        newTechnician: ''
      }));
    }
  };

  const handleRemoveTechnician = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignedTechnicians: prev.assignedTechnicians.filter((_, i) => i !== index)
    }));
  };

  const RequiredField = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.opportunityId) errors.push('Please select an opportunity');
    if (!formData.quoteId) errors.push('Please select a quote');
    if (formData.estimatedHours < 0) errors.push('Estimated hours cannot be negative');
    if (formData.laborCost < 0) errors.push('Labor cost cannot be negative');
    if (formData.partsCost < 0) errors.push('Parts cost cannot be negative');
    
    if (errors.length > 0) {
      showToast(errors.join('. '), 'error');
      return false;
    }
    
    return true;
  };

  const calculateTotalCost = () => {
    return (formData.laborCost || 0) + (formData.partsCost || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const createData: CreateWorkOrderData = {
        opportunityId: formData.opportunityId,
        quoteId: formData.quoteId,
        waiverId: formData.waiverId || undefined,
        vehicleId: formData.vehicleId || undefined,
        assignedTo: formData.assignedTo || undefined,
        status: formData.status,
        currentStage: formData.currentStage,
        startDate: formData.startDate,
        estimatedCompletionDate: formData.estimatedCompletionDate || undefined,
        estimatedHours: formData.estimatedHours,
        laborCost: formData.laborCost,
        partsCost: formData.partsCost,
        notes: formData.notes || undefined
      };
      
      console.log('Submitting work order data:', createData);
      
      const newWorkOrder = await workOrderService.createWorkOrder(createData);
      showToast('Work order created successfully!', 'success');
      
      router.push(`/workorders/${newWorkOrder._id}`);
      
    } catch (error: any) {
      console.error('Error creating work order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create work order: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/workorders');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Work Order</h1>
                <p className="text-blue-100 text-sm">
                  Create a work order for service, repair, or maintenance
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 border border-white text-white font-semibold rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Work Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
            
            {/* Opportunity Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Select Opportunity <RequiredField />
              </h2>
              
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={formData.searchOpportunity}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, searchOpportunity: e.target.value }));
                        searchOpportunities(e.target.value);
                      }}
                      onFocus={() => setShowOpportunitySearch(true)}
                      placeholder="Search for an opportunity by subject, customer name, or ID..."
                      className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/opportunities/create')}
                    className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Opportunity
                  </button>
                </div>
                
                {/* Search Results Dropdown */}
                {showOpportunitySearch && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                    {searchingOpportunity ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p>Searching...</p>
                      </div>
                    ) : opportunities.length > 0 ? (
                      opportunities.map((opp) => (
                        <button
                          key={opp._id}
                          type="button"
                          onClick={() => handleSelectOpportunity(opp)}
                          className="w-full p-4 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{opp.subject}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Customer: {opp.customer?.name || 'N/A'}
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  {opp.opportunityType || 'SERVICE'}
                                </span>
                                {opp.leadScore && (
                                  <span className={`px-2 py-1 rounded-full ${
                                    opp.leadScore.tier === 'hot' ? 'bg-red-100 text-red-700' :
                                    opp.leadScore.tier === 'warm' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {opp.leadScore.tier}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(opp.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : formData.searchOpportunity ? (
                      <div className="p-4 text-center text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No opportunities found</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              {/* Selected Opportunity Summary */}
              {formData.selectedOpportunity && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {formData.selectedOpportunity.subject}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{formData.selectedOpportunity.customer?.name || 'No customer'}</span>
                          </div>
                          {formData.selectedOpportunity.customer?.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{formData.selectedOpportunity.customer.email}</span>
                            </div>
                          )}
                          {formData.selectedOpportunity.customer?.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{formData.selectedOpportunity.customer.phone}</span>
                            </div>
                          )}
                          {formData.selectedOpportunity.customer?.companyName && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building2 className="h-4 w-4" />
                              <span>{formData.selectedOpportunity.customer.companyName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        selectedOpportunity: null, 
                        opportunityId: '',
                        searchOpportunity: '',
                        quoteId: '',
                        vehicleId: ''
                      }))}
                      className="p-1 hover:bg-indigo-200 rounded"
                    >
                      <X className="h-4 w-4 text-indigo-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quote Selection */}
            {formData.opportunityId && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Select Quote <RequiredField />
                </h2>
                
                {loadingQuotes ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading quotes...</p>
                  </div>
                ) : quotes.length > 0 ? (
                  <div className="space-y-2">
                    {quotes.map((quote) => (
                      <label
                        key={quote._id || quote.id}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.quoteId === (quote._id || quote.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="quoteId"
                            value={quote._id || quote.id}
                            checked={formData.quoteId === (quote._id || quote.id)}
                            onChange={handleChange}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                Quote #{quote.quoteNumber || 'N/A'}
                              </span>
                              <span className="text-indigo-600 font-semibold">
                                {formatCurrency(quote.totalAmount || 0)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {quote.items?.length || 0} items • Created: {new Date(quote.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No quotes found for this opportunity</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/quotes/create?opportunityId=${formData.opportunityId}`)}
                      className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Create a quote first
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                Work Order Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stage
                  </label>
                  <select
                    name="currentStage"
                    value={formData.currentStage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  >
                    {stageOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {loadingSalesReps ? (
                      <option disabled>Loading...</option>
                    ) : (
                      salesReps.map(rep => (
                        <option key={rep._id} value={rep._id}>
                          {rep.firstName} {rep.lastName} - {rep.role || 'Sales Rep'}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Dates & Schedule */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Schedule
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Completion Date
                  </label>
                  <input
                    type="date"
                    name="estimatedCompletionDate"
                    value={formData.estimatedCompletionDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Hours <RequiredField />
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Costs */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                Cost Breakdown
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labor Cost (KES)
                  </label>
                  <input
                    type="number"
                    name="laborCost"
                    value={formData.laborCost}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parts Cost (KES)
                  </label>
                  <input
                    type="number"
                    name="partsCost"
                    value={formData.partsCost}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                  <label className="block text-sm font-medium text-indigo-700 mb-2">
                    Total Cost
                  </label>
                  <div className="text-2xl font-bold text-indigo-800">
                    {formatCurrency(calculateTotalCost())}
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Selection (if available) */}
            {formData.selectedOpportunity?.vehicles && formData.selectedOpportunity.vehicles.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Car className="h-5 w-5 text-indigo-600" />
                  Select Vehicle
                </h2>
                
                <div className="space-y-2">
                  {formData.selectedOpportunity.vehicles.map((vehicle: any, index: number) => (
                    <label
                      key={index}
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.vehicleId === (vehicle._id || vehicle.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="vehicleId"
                          value={vehicle._id || vehicle.id}
                          checked={formData.vehicleId === (vehicle._id || vehicle.id)}
                          onChange={handleChange}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {vehicle.vin && <span className="mr-3">VIN: {vehicle.vin}</span>}
                            {vehicle.licensePlate && <span>Plate: {vehicle.licensePlate}</span>}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Technicians */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Assigned Technicians
              </h2>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={formData.newTechnician}
                  onChange={(e) => setFormData(prev => ({ ...prev, newTechnician: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnician())}
                  placeholder="Enter technician name or ID"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTechnician}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.assignedTechnicians.length > 0 ? (
                <div className="space-y-2">
                  {formData.assignedTechnicians.map((tech, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{typeof tech === 'string' ? tech : `${tech.firstName} ${tech.lastName}`}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTechnician(index)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No technicians assigned yet.</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Enter any additional notes, special instructions, or customer requests..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes will be visible to technicians and staff working on this order.
              </p>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !formData.opportunityId || !formData.quoteId}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Work Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Work Order
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