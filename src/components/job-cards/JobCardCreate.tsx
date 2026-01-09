'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, ArrowLeft, Save, Plus, Trash2,
  Loader2, Calendar, Clock, User as UserIcon, 
  Car, FileText, DollarSign, Package, ChevronDown,
  CheckCircle, Briefcase, Shield, Tag,
  Search, Mail, Phone
} from 'lucide-react';
import { jobCardService, CreateJobCardData } from '@/services/jobCardService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { userService, User } from '@/services/settings/userService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';

interface FormData {
  opportunityId: string;
  jobTitle: string;
  jobDescription: string;
  assignedTo: string;
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
    description?: string;
  }>;
}

interface QuickTemplate {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  parts: Array<{
    name: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export default function JobCardCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    opportunityId: '',
    jobTitle: '',
    jobDescription: '',
    assignedTo: '',
    priority: 'medium',
    estimatedHours: 2,
    actualHours: 0,
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    completedDate: '',
    status: 'pending',
    notes: [],
    newNote: '',
    partsUsed: []
  });

  const [technicians, setTechnicians] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<Vehicle | null>(null);
  
  // Dropdown visibility
  const [showOpportunityDropdown, setShowOpportunityDropdown] = useState(false);
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>([]);
  
  // Search terms
  const [opportunitySearch, setOpportunitySearch] = useState('');
  
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔵' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
  ];

  const [templates] = useState<QuickTemplate[]>([
    {
      id: '1',
      title: 'Basic Service',
      description: 'Oil change, filter replacement, and basic inspection',
      estimatedHours: 1.5,
      parts: [
        { name: 'Engine Oil 5W-30', partNumber: 'OIL-001', quantity: 1, unitPrice: 32.50 },
        { name: 'Oil Filter', partNumber: 'FIL-001', quantity: 1, unitPrice: 12.75 }
      ]
    },
    {
      id: '2',
      title: 'Brake Service',
      description: 'Brake pad replacement and rotor inspection',
      estimatedHours: 2.5,
      parts: [
        { name: 'Brake Pads (Front)', partNumber: 'BRK-001', quantity: 1, unitPrice: 45.99 },
        { name: 'Brake Fluid', partNumber: 'BRK-FLUID', quantity: 1, unitPrice: 18.50 }
      ]
    },
    {
      id: '3',
      title: 'Tire Rotation & Balance',
      description: 'Four-tire rotation and wheel balancing',
      estimatedHours: 1,
      parts: [
        { name: 'Tire Balancing Weights', partNumber: 'TIR-WT', quantity: 8, unitPrice: 2.50 }
      ]
    }
  ]);

  // Fetch dropdown data on component mount
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      await Promise.all([
        fetchTechnicians(),
        fetchParts()
      ]);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showToast('Failed to load dropdown data', 'error');
    }
  };
  const loadOpportunities = async (search = '', forceReload = false) => {
    try {
      setSearching(true);
      
      let opportunitiesData: Opportunity[] = [];
      
      // For dropdown search, use the optimized autocomplete endpoint
      if (search.trim()) {
        try {
          opportunitiesData = await opportunityService.searchAutocomplete(
            search.trim(),
            50  // ✅ Fixed: Added limit parameter
          );
        } catch (autocompleteError) {
          console.warn('Autocomplete failed, falling back to filter:', autocompleteError);
          // Fallback to filter endpoint
          const response = await opportunityService.filterOpportunities({
            search: search.trim(),
            page: 1,
            limit: 50,
            sort: '-createdAt',
          });
          opportunitiesData = response?.data || [];
        }
      } else {
        // When no search term, load recent opportunities
        const response = await opportunityService.filterOpportunities({
          page: 1,
          limit: 20, // Smaller limit for recent
          sort: '-createdAt',
        });
        opportunitiesData = response?.data || [];
      }
      
      setOpportunities(opportunitiesData);
      
    } catch (error) {
      console.error('❌ Error loading opportunities:', error);
      showToast('Failed to load opportunities', 'error');
      setOpportunities([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectOpportunity = async (opportunity: Opportunity) => {
    try {
      setSelectedOpportunity(opportunity);
      
      // ✅ Fixed: Pass vehicle ID correctly
      if (opportunity.vehicles?.[0]?._id) {
        await fetchVehicleDetails(opportunity.vehicles[0]._id);
      } else if (opportunity.vehicles?.[0]) {
        // If vehicle object already has details, use them
        setVehicleDetails(opportunity.vehicles[0] as Vehicle);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        opportunityId: opportunity._id || '',
        jobTitle: prev.jobTitle || opportunity.subject || '',
        jobDescription: prev.jobDescription || opportunity.notes || ''
      }));
      setShowOpportunityDropdown(false);
      setOpportunitySearch('');
      
      // Clear dropdown to show fresh results next time
      setTimeout(() => setOpportunities([]), 100);
      
    } catch (error) {
      console.error('Error selecting opportunity:', error);
      showToast('Failed to load opportunity details', 'error');
    }
  };

  // Update the debounced search to pass forceReload flag
  const debouncedSearchOpportunities = useCallback(
    debounce((searchTerm: string) => {
      const forceReload = searchTerm.trim() === '';
      loadOpportunities(searchTerm, forceReload);
    }, 300), // Reduced debounce time for better UX
    []
  );

  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const users = await userService.getAllUsers();
      const technicianUsers = users.filter(user => 
        userService.getUserRoleName(user) === 'technician' && user.active
      );
      setTechnicians(technicianUsers);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      showToast('Failed to load technicians', 'error');
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const fetchParts = async () => {
    // Mock parts data - in production, fetch from parts service
    setParts([
      { _id: '1', partNumber: 'BRK-001', name: 'Brake Pads', description: 'Premium Ceramic Brake Pads', unitPrice: 45.99, category: 'Brakes', stock: 42 },
      { _id: '2', partNumber: 'OIL-002', name: 'Engine Oil 5W-30', description: 'Full Synthetic Motor Oil', unitPrice: 32.50, category: 'Fluids', stock: 150 },
      { _id: '3', partNumber: 'FIL-003', name: 'Oil Filter', description: 'Premium Oil Filter', unitPrice: 12.75, category: 'Filters', stock: 89 },
      { _id: '4', partNumber: 'SPK-004', name: 'Spark Plugs', description: 'Iridium Spark Plugs (Set of 4)', unitPrice: 8.99, category: 'Ignition', stock: 56 },
      { _id: '5', partNumber: 'BAT-005', name: 'Car Battery', description: '12V 60Ah Maintenance-Free', unitPrice: 120.00, category: 'Electrical', stock: 24 },
    ]);
  };

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const vehicle = await vehicleService.getVehicleById(vehicleId);
      setVehicleDetails(vehicle);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      setVehicleDetails(null);
    }
  };

  const applyTemplate = (template: QuickTemplate) => {
    setFormData(prev => ({
      ...prev,
      jobTitle: template.title,
      jobDescription: template.description,
      estimatedHours: template.estimatedHours,
      partsUsed: template.parts.map(part => ({
        partId: '',
        partNumber: part.partNumber,
        name: part.name,
        quantity: part.quantity,
        unitPrice: part.unitPrice,
        totalCost: part.quantity * part.unitPrice
      }))
    }));
    showToast(`Applied template: ${template.title}`, 'success');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      newValue = value ? parseFloat(value) : 0;
    }
    
    if (name === 'assignedTo') {
      const tech = technicians.find(t => t.id === value);
      setSelectedTechnician(tech || null);
      setFormData(prev => ({ ...prev, [name]: newValue }));
    } else {
      setFormData(prev => {
        const updated = { ...prev, [name]: newValue };
        
        if (['laborCost'].includes(name)) {
          const partsTotal = updated.partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0);
          updated.totalCost = (updated.laborCost || 0) + partsTotal;
        }
        
        return updated;
      });
    }
  };

  const handleAddNote = () => {
    if (formData.newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        notes: [...prev.notes, `${format(new Date(), 'HH:mm')}: ${prev.newNote.trim()}`],
        newNote: ''
      }));
      showToast('Note added', 'success');
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
          [field]: typeof value === 'string' && !['name', 'partNumber', 'description'].includes(field)
            ? parseFloat(value) || 0
            : value
        };
        
        if (field === 'quantity' || field === 'unitPrice') {
          updatedPart.totalCost = updatedPart.quantity * updatedPart.unitPrice;
        }
        
        partsUsed[index] = updatedPart;
      }
      
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
          description: '',
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
      handlePartChange(index, 'description', selectedPart.description || '');
      handlePartChange(index, 'unitPrice', selectedPart.unitPrice);
      showToast(`Added part: ${selectedPart.name}`, 'success');
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.opportunityId) errors.push('Opportunity is required');
    if (!formData.jobTitle.trim()) errors.push('Job title is required');
    if (!formData.jobDescription.trim()) errors.push('Job description is required');
    if (!formData.startDate) errors.push('Start date is required');
    
    if (errors.length > 0) {
      showToast(errors.join(', '), 'error');
      return false;
    }
    
    return true;
  };

  const calculateTotals = () => {
    const partsTotal = formData.partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0);
    const laborCost = formData.laborCost || 0;
    const totalCost = partsTotal + laborCost;
    
    return { partsTotal, laborCost, totalCost };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const createData: CreateJobCardData = {
        opportunityId: formData.opportunityId,
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        assignedTo: formData.assignedTo || undefined
      };
      
      const newJobCard = await jobCardService.createJobCard(createData);
      showToast('Job card created successfully!', 'success');
      
      setTimeout(() => {
        router.push(`/job-cards/`);
      }, 100);
      
    } catch (error: any) {
      console.error('Error creating job card:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create job card: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      router.push('/job-cards');
    }
  };

  useEffect(() => {
    if (showOpportunityDropdown && opportunities.length === 0) {
      loadOpportunities('', true);
    }
  }, [showOpportunityDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOpportunityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

// Fetch recent opportunities on mount (for better UX)
  useEffect(() => {
    const fetchRecentOpportunities = async () => {
      try {
        const response = await opportunityService.filterOpportunities({
          page: 1,
          limit: 20,
          sort: '-createdAt',
        });
        
        if (response?.data) {
          setRecentOpportunities(response.data);
        }
      } catch (error) {
        console.error('Error fetching recent opportunities:', error);
      }
    };
    
    fetchRecentOpportunities();
  }, []);

  const OpportunityDropdown = () => (
    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-auto">
      <div className="p-3 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={opportunitySearch}
            onChange={(e) => {
              const value = e.target.value;
              setOpportunitySearch(value);
              debouncedSearchOpportunities(value);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type to search opportunities by customer, vehicle, or subject..."
            autoFocus
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
          )}
        </div>
      </div>
      
      {searching && opportunities.length === 0 ? (
        <div className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-sm text-gray-600">Searching opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-6 text-center">
          {opportunitySearch ? (
            <>
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No matching opportunities found</p>
              <p className="text-sm text-gray-500">Try searching by customer name, vehicle registration, or subject</p>
            </>
          ) : (
            <>
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">No recent opportunities found</p>
              <button
                type="button"
                onClick={() => loadOpportunities('', true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Load Opportunities
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="py-2">
          {opportunities.map((opp) => (
            <button
              key={opp._id}
              type="button"
              onClick={() => handleSelectOpportunity(opp)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-blue-700 truncate">
                    {opp.subject || 'Untitled Opportunity'}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {opp.customer?.name || 'No customer'}
                    {opp.customer?.companyName && ` • ${opp.customer.companyName}`}
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {opp.createdAt ? format(new Date(opp.createdAt), 'MMM d') : 'N/A'}
                </div>
              </div>
              
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {opp.vehicles?.[0]?.registrationNumber && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                    <Car className="h-3 w-3" />
                    {opp.vehicles[0].registrationNumber}
                  </span>
                )}
                
                {opp.opportunityType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                    <Tag className="h-3 w-3" />
                    {opp.opportunityType}
                  </span>
                )}
                
                {opp.status && (
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    opp.status === 'won' ? 'bg-green-100 text-green-800' :
                    opp.status === 'lost' ? 'bg-red-100 text-red-800' :
                    opp.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {opp.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              
              {opp.customer?.email || opp.customer?.phone ? (
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  {opp.customer?.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" />
                      {opp.customer.email}
                    </span>
                  )}
                  {opp.customer?.phone && (
                    <span className="flex items-center gap-1 truncate">
                      <Phone className="h-3 w-3" />
                      {opp.customer.phone}
                    </span>
                  )}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 shadow-xl">
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
                <h1 className="text-2xl font-bold text-white">Create Job Card</h1>
                <p className="text-blue-100 text-sm">
                  Create a new work order for service tasks
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {loading ? 'Creating...' : 'Create Job Card'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - FIXED: Removed grid and simplified to single column */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Quick Templates */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all hover:scale-[1.02] bg-white"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{template.title}</h4>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{template.estimatedHours} hrs</span>
                      <span className="text-blue-600 font-medium">
                        {template.parts.length} part{template.parts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Opportunity Selection - FIXED */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Select Opportunity</h2>
              <div className="space-y-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOpportunityDropdown(!showOpportunityDropdown);
                      if (!showOpportunityDropdown && opportunities.length === 0) {
                        loadOpportunities('', true);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors flex items-center justify-between bg-white"
                    disabled={searching}
                  >
                    {selectedOpportunity ? (
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{selectedOpportunity.subject}</div>
                        <div className="text-sm text-gray-600">
                          {selectedOpportunity.customer?.name}
                          {selectedOpportunity.customer?.companyName && ` • ${selectedOpportunity.customer.companyName}`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        {searching ? 'Searching opportunities...' : 'Search and select an opportunity...'}
                      </span>
                    )}
                    {searching ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {showOpportunityDropdown && <OpportunityDropdown />}
                </div>

                {/* Customer & Vehicle Information */}
                {selectedOpportunity && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          Customer Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{selectedOpportunity.customer?.name || 'N/A'}</span>
                          </div>
                          {selectedOpportunity.customer?.companyName && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Company:</span>
                              <span className="font-medium">{selectedOpportunity.customer.companyName}</span>
                            </div>
                          )}
                          {selectedOpportunity.customer?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{selectedOpportunity.customer.email}</span>
                            </div>
                          )}
                          {selectedOpportunity.customer?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{selectedOpportunity.customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Vehicle Details
                        </h4>
                        {vehicleDetails ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Vehicle:</span>
                              <span className="font-medium">
                                {vehicleDetails.make} {vehicleDetails.model}
                              </span>
                            </div>
                            {vehicleDetails.registrationNumber && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Reg No:</span>
                                <span className="font-medium">{vehicleDetails.registrationNumber}</span>
                              </div>
                            )}
                            {vehicleDetails.year && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Year:</span>
                                <span className="font-medium">{vehicleDetails.year}</span>
                              </div>
                            )}
                            {vehicleDetails.vin && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">VIN:</span>
                                <span className="font-medium text-xs">{vehicleDetails.vin}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No vehicle details available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rest of the form remains the same... */}
            {/* Job Details Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="e.g., Front Brake Replacement & Inspection"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Provide detailed description of work to be performed..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Completion Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment & Settings */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Assignment & Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment Section */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Assignment</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Technician
                      </label>
                      <div className="relative">
                        <select
                          name="assignedTo"
                          value={formData.assignedTo}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none appearance-none"
                          disabled={loadingTechnicians}
                        >
                          <option value="">Unassigned</option>
                          {technicians.map(tech => (
                            <option key={tech.id} value={tech.id}>
                              {tech.name} ({tech.email})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {selectedTechnician && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {selectedTechnician.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{selectedTechnician.name}</div>
                            <div className="text-sm text-gray-600">{selectedTechnician.email}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings Section */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {priorityOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priority: option.value as any }))}
                            className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              formData.priority === option.value
                                ? `${option.color} border-blue-500 ring-2 ring-blue-200`
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
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
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none appearance-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Parts & Cost */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Parts & Cost</h2>
                <button
                  type="button"
                  onClick={addPart}
                  className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:from-blue-100 hover:to-blue-200 shadow-sm border border-blue-200 hover:border-blue-300 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Part
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.partsUsed.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h4 className="text-gray-700 font-medium mb-2">No parts added</h4>
                    <p className="text-gray-500 mb-4">Add parts that will be used for this job</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Part Number</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Qty</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Unit Price</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Total</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.partsUsed.map((part, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <select
                                value={part.partId}
                                onChange={(e) => handleSelectPart(index, e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white appearance-none min-w-[120px]"
                              >
                                <option value="">Select Part</option>
                                {parts.map(p => (
                                  <option key={p._id} value={p._id}>
                                    {p.partNumber}
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
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none min-w-[200px]"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={part.quantity}
                                onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                min="1"
                                className="w-20 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
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
                              {jobCardService.formatCurrency(part.totalCost)}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => removePart(index)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-end">
                        <div className="w-64 space-y-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Labor Cost (KES)
                            </label>
                            <input
                              type="number"
                              name="laborCost"
                              value={formData.laborCost}
                              onChange={handleChange}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Parts Total:</span>
                            <span className="font-medium">{jobCardService.formatCurrency(totals.partsTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Labor Cost:</span>
                            <span className="font-medium">{jobCardService.formatCurrency(formData.laborCost)}</span>
                          </div>
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between font-semibold">
                              <span>Total Estimate:</span>
                              <span className="text-blue-600">{jobCardService.formatCurrency(totals.totalCost)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Section */}
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
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Job Card
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}