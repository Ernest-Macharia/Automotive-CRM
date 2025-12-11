'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { opportunityService } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Save, X, Building, User, Phone, Mail, Globe,
  Users, Heart, Calendar, Target, Briefcase, Car, FileText,
  DollarSign, Shield, CheckCircle, AlertCircle, Loader2,
  Plus, Trash2, Eye, EyeOff, MapPin, MessageSquare, ExternalLink,
  Clock, ChevronDown, ChevronUp, Tag, Hash, Award, Sparkles,
  PhoneCall, Mail as MailIcon, MessageCircle, Upload, Download
} from 'lucide-react';

interface Customer {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
}

interface Vehicle {
  _id?: string;
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
}

interface ExtendedOpportunity {
  _id: string;
  subject: string;
  type: 'individual' | 'organization';
  source: string;
  status: 'new' | 'attempted_to_contact' | 'prospecting' | 'appointment_scheduled' | 'non_progressive' | 'lost';
  customer: Customer;
  vehicles?: Vehicle[];
  assignedTo?: string;
  isNurturing?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-600' },
  { value: 'attempted_to_contact', label: 'Attempted to Contact', color: 'bg-purple-100 text-purple-600' },
  { value: 'prospecting', label: 'Prospecting', color: 'bg-amber-100 text-amber-600' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled', color: 'bg-orange-100 text-orange-600' },
  { value: 'non_progressive', label: 'Non Progressive', color: 'bg-gray-100 text-gray-600' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-600' }
];

const sourceOptions = [
  { value: 'walk_in', label: 'Walk In', icon: Users },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'referral', label: 'Referral', icon: Heart },
  { value: 'manual', label: 'Manual', icon: User },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'email', label: 'Email', icon: MailIcon }
];

const typeOptions = [
  { value: 'individual' as 'individual' | 'organization', label: 'Individual' },
  { value: 'organization' as 'individual' | 'organization', label: 'Organization' }
];

// Define the status type
type StatusType = 'new' | 'attempted_to_contact' | 'prospecting' | 'appointment_scheduled' | 'non_progressive' | 'lost';

export default function EditOpportunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const opportunityId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opportunity, setOpportunity] = useState<ExtendedOpportunity | null>(null);
  
  const [formData, setFormData] = useState({
    subject: '',
    type: 'individual' as 'individual' | 'organization',
    source: 'website',
    status: 'new' as StatusType,
    customer: {
      name: '',
      email: '',
      phone: '',
      companyName: ''
    } as Customer,
    vehicles: [] as Vehicle[],
    assignedTo: '',
    isNurturing: false,
    notes: ''
  });
  
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Vehicle>({
    vin: '',
    registrationNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: ''
  });

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunity();
    } else {
      setError('No opportunity ID provided');
      setLoading(false);
      showToast('No opportunity ID provided', 'error', 3000);
      router.push('/opportunities');
    }
  }, [opportunityId]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await opportunityService.getOpportunityById(opportunityId!);
      setOpportunity(data as ExtendedOpportunity);
      
      setFormData({
        subject: data.subject || '',
        type: (data.type as 'individual' | 'organization') || 'individual',
        source: data.source || 'website',
        status: (data.status as StatusType) || 'new',
        customer: {
          name: data.customer?.name || '',
          email: data.customer?.email || '',
          phone: data.customer?.phone || '',
          companyName: data.customer?.companyName || ''
        },
        vehicles: data.vehicles || [],
        assignedTo: data.assignedTo || '',
        isNurturing: data.isNurturing || false,
        notes: data.notes || ''
      });
      
    } catch (err: any) {
      console.error('Error fetching opportunity:', err);
      setError(err.message || 'Failed to load opportunity');
      showToast('Failed to load opportunity', 'error', 3000);
      router.push('/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('customer.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          [field]: value
        }
      }));
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        [name]: value as 'individual' | 'organization'
      }));
    } else if (name === 'status') {
      setFormData(prev => ({
        ...prev,
        [name]: value as StatusType
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddVehicle = () => {
    if (!newVehicle.vin || !newVehicle.registrationNumber || !newVehicle.make || !newVehicle.model) {
      showToast('Please fill in all required vehicle fields', 'warning', 3000);
      return;
    }

    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, { ...newVehicle }]
    }));

    setNewVehicle({
      vin: '',
      registrationNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: ''
    });
    setShowVehicleForm(false);
    showToast('Vehicle added successfully', 'success', 2000);
  };

  const handleRemoveVehicle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }));
    showToast('Vehicle removed', 'info', 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer.name || !formData.subject) {
      showToast('Please fill in all required fields', 'warning', 3000);
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        subject: formData.subject,
        type: formData.type,
        source: formData.source,
        status: formData.status,
        customer: formData.customer,
        vehicles: formData.vehicles,
        assignedTo: formData.assignedTo || undefined,
        isNurturing: formData.isNurturing,
        notes: formData.notes
      };

      await opportunityService.updateOpportunity(opportunityId!, updateData);
      
      showToast('Opportunity updated successfully', 'success', 3000);
      router.push(`/opportunities/details?id=${opportunityId}`);
      
    } catch (err: any) {
      console.error('Error updating opportunity:', err);
      const errorMessage = err.message || 'Failed to update opportunity';
      setError(errorMessage);
      showToast(errorMessage, 'error', 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to discard changes?')) {
      router.push(`/opportunities/details?id=${opportunityId}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/30 rounded-full animate-pulse"></div>
              <div className="h-6 w-48 bg-white/30 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-gray-200/50 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/opportunities')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <h1 className="text-xl font-bold text-white">Edit Opportunity</h1>
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {error ? 'Error Loading Opportunity' : 'Opportunity Not Found'}
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'The opportunity you are looking for does not exist or has been removed.'}
              </p>
              <button
                onClick={() => router.push('/opportunities')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Back to Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/opportunities/details?id=${opportunityId}`)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Edit Opportunity</h1>
              <p className="text-blue-100 text-sm mt-1">
                Update opportunity details for {opportunity.subject}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-white/30 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-white to-white/90 text-blue-600 rounded-lg text-sm font-medium hover:from-white hover:to-white transition-all disabled:opacity-50 flex items-center gap-2"
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
      </div>

      {/* Scrollable Content */}
      <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Basic Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opportunity Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Car Service Request - Honda Civic"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {typeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: option.value }))}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            formData.type === option.value
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border border-transparent'
                              : 'bg-white/50 text-gray-600 hover:bg-white border border-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {sourceOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter team member name"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isNurturing"
                    name="isNurturing"
                    checked={formData.isNurturing}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isNurturing" className="text-sm text-gray-700">
                    Mark as nurturing lead (requires follow-up)
                  </label>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-purple-500" />
                Customer Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customer.name"
                    value={formData.customer.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter customer full name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="customer.email"
                      value={formData.customer.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="customer@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="customer.phone"
                      value={formData.customer.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="customer.companyName"
                    value={formData.customer.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name (if applicable)"
                  />
                </div>
              </div>
            </div>

            {/* Vehicles Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-500" />
                  Vehicles
                  {formData.vehicles.length > 0 && (
                    <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-600 text-xs font-medium rounded">
                      {formData.vehicles.length} vehicle(s)
                    </span>
                  )}
                </h2>
                
                <button
                  type="button"
                  onClick={() => setShowVehicleForm(!showVehicleForm)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </button>
              </div>
              
              {/* Vehicle Form */}
              {showVehicleForm && (
                <div className="mb-6 p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-200/30 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-blue-800">Add New Vehicle</h3>
                    <button
                      type="button"
                      onClick={() => setShowVehicleForm(false)}
                      className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 text-blue-600" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        VIN <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newVehicle.vin}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, vin: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Vehicle Identification Number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Registration Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newVehicle.registrationNumber}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, registrationNumber: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., ABC123"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Make <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newVehicle.make}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Honda"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Civic"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={newVehicle.year}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2023"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={newVehicle.color}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Blue"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleAddVehicle}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                      Add Vehicle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVehicleForm(false)}
                      className="flex-1 px-4 py-2 bg-white/50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Vehicles List */}
              {formData.vehicles.length > 0 ? (
                <div className="space-y-3">
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={index} className="border border-gray-200/50 rounded-xl p-4 bg-white/50 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                            <Car className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-sm text-gray-600">{vehicle.color}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVehicle(index)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">VIN</p>
                          <p className="font-medium text-gray-800">{vehicle.vin}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Registration</p>
                          <p className="font-medium text-gray-800">{vehicle.registrationNumber}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No vehicles added yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add vehicles associated with this opportunity
                  </p>
                </div>
              )}
            </div>

            {/* Additional Notes Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Additional Notes
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes & Comments
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add any additional notes, comments, or special instructions..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  These notes will be visible to team members working on this opportunity
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <p>Make sure all required fields are filled before saving</p>
                  <p className="mt-1 text-xs">
                    Last updated: {new Date(opportunity.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 border border-gray-200 bg-white/50 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}