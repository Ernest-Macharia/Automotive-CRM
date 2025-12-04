'use client';

import { useState } from 'react';
import { 
  X, User, Building, Mail, Phone, Car, Plus, Trash2, FileText, 
  DollarSign, Calendar, Tag, AlertCircle, Check, ChevronDown,
  Upload, Clock, Shield, Briefcase, Sparkles, ChevronRight,
  ArrowRight
} from 'lucide-react';

interface Vehicle {
  id: string;
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
}

interface Waiver {
  id: string;
  type: string;
  description: string;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface Quote {
  id: string;
  items: QuoteItem[];
}

interface OpportunityFormData {
  accountType: 'individual' | 'organization';
  source: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  subject: string;
  opportunityId: string;
  vehicles: Vehicle[];
  services: Service[];
  waivers: Waiver[];
  quotes: Quote[];
  notes: string;
}

// This is what will be sent to the API
export interface OpportunityFormDataForAPI {
  accountType: 'individual' | 'organization';
  source: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  subject: string;
  opportunityId: string;
  vehicles: Vehicle[];
  notes: string;
}

interface CreateOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OpportunityFormDataForAPI) => void;
}

export default function CreateOpportunityModal({ isOpen, onClose, onSubmit }: CreateOpportunityModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OpportunityFormData>({
    accountType: 'individual',
    source: 'walk_in',
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    subject: '',
    opportunityId: '',
    vehicles: [{
      id: '1',
      vin: '',
      registrationNumber: '',
      make: '',
      model: '',
      year: '',
      color: ''
    }],
    services: [{
      id: '1',
      title: '',
      description: ''
    }],
    waivers: [{
      id: '1',
      type: 'Service Waiver',
      description: ''
    }],
    quotes: [{
      id: '1',
      items: [{
        id: '1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0
      }]
    }],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const accountTypes = [
    { value: 'individual', label: 'Individual', icon: User },
    { value: 'organization', label: 'Organization', icon: Building }
  ];

  const sources = [
    { value: 'walk_in', label: 'Walk In' },
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'manual', label: 'Manual' },
    { value: 'test', label: 'Test' }
  ];

  const totalSteps = 4;

  const handleInputChange = (field: keyof OpportunityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [field]: value };
    setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleServiceChange = (index: number, field: keyof Service, value: string) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const handleWaiverChange = (index: number, field: keyof Waiver, value: string) => {
    const updatedWaivers = [...formData.waivers];
    updatedWaivers[index] = { ...updatedWaivers[index], [field]: value };
    setFormData(prev => ({ ...prev, waivers: updatedWaivers }));
  };

  const handleQuoteItemChange = (quoteIndex: number, itemIndex: number, field: keyof QuoteItem, value: any) => {
    const updatedQuotes = [...formData.quotes];
    updatedQuotes[quoteIndex].items[itemIndex] = {
      ...updatedQuotes[quoteIndex].items[itemIndex],
      [field]: value
    };
    setFormData(prev => ({ ...prev, quotes: updatedQuotes }));
  };

  const addVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, {
        id: Date.now().toString(),
        vin: '',
        registrationNumber: '',
        make: '',
        model: '',
        year: '',
        color: ''
      }]
    }));
  };

  const removeVehicle = (index: number) => {
    if (formData.vehicles.length > 1) {
      const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
    }
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, {
        id: Date.now().toString(),
        title: '',
        description: ''
      }]
    }));
  };

  const removeService = (index: number) => {
    if (formData.services.length > 1) {
      const updatedServices = formData.services.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, services: updatedServices }));
    }
  };

  const addWaiver = () => {
    setFormData(prev => ({
      ...prev,
      waivers: [...prev.waivers, {
        id: Date.now().toString(),
        type: 'Service Waiver',
        description: ''
      }]
    }));
  };

  const removeWaiver = (index: number) => {
    if (formData.waivers.length > 1) {
      const updatedWaivers = formData.waivers.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, waivers: updatedWaivers }));
    }
  };

  const addQuote = () => {
    setFormData(prev => ({
      ...prev,
      quotes: [...prev.quotes, {
        id: Date.now().toString(),
        items: [{
          id: '1',
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0
        }]
      }]
    }));
  };

  const addQuoteItem = (quoteIndex: number) => {
    const updatedQuotes = [...formData.quotes];
    updatedQuotes[quoteIndex].items.push({
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0
    });
    setFormData(prev => ({ ...prev, quotes: updatedQuotes }));
  };

  const removeQuoteItem = (quoteIndex: number, itemIndex: number) => {
    const updatedQuotes = [...formData.quotes];
    if (updatedQuotes[quoteIndex].items.length > 1) {
      updatedQuotes[quoteIndex].items = updatedQuotes[quoteIndex].items.filter((_, i) => i !== itemIndex);
      setFormData(prev => ({ ...prev, quotes: updatedQuotes }));
    }
  };

  const calculateQuoteTotal = (quoteIndex: number) => {
    const quote = formData.quotes[quoteIndex];
    return quote.items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = itemTotal * (item.discount / 100);
      return total + itemTotal - discountAmount;
    }, 0);
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      // Phone validation (basic)
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (step === 2) {
      // Check if at least one vehicle has basic info
      const hasValidVehicle = formData.vehicles.some(vehicle => 
        vehicle.make.trim() && vehicle.model.trim()
      );
      if (!hasValidVehicle) {
        newErrors.vehicles = 'At least one vehicle with make and model is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < totalSteps) {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep()) {
      // Create data object with only the fields needed for the API
      const apiFormData: OpportunityFormDataForAPI = {
        accountType: formData.accountType,
        source: formData.source,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        opportunityId: formData.opportunityId,
        vehicles: formData.vehicles.map(vehicle => ({
          ...vehicle,
          // Ensure all vehicle properties are included
          vin: vehicle.vin || '',
          registrationNumber: vehicle.registrationNumber || '',
          make: vehicle.make || '',
          model: vehicle.model || '',
          year: vehicle.year || '',
          color: vehicle.color || ''
        })),
        notes: formData.notes,
      };
      
      onSubmit(apiFormData);
    }
  };

  if (!isOpen) return null;

  // Step titles for better UX
  const stepTitles = [
    'Account Information',
    'Vehicle Details',
    'Services & Waivers',
    'Quotes & Review'
  ];

  // Step descriptions
  const stepDescriptions = [
    'Enter customer and basic opportunity information',
    'Add vehicle(s) for this opportunity',
    'Define services needed and required waivers',
    'Create quotes and review all information'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create New Opportunity</h2>
                  <p className="text-blue-100 text-sm">{stepTitles[step - 1]}</p>
                  <p className="text-blue-200 text-xs mt-1">{stepDescriptions[step - 1]}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                      step === stepNumber 
                        ? 'bg-white border-white text-blue-600 scale-110' 
                        : step > stepNumber 
                          ? 'bg-white/30 border-white/30 text-white'
                          : 'bg-transparent border-white/30 text-white'
                    }`}>
                      {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
                    </div>
                    <div className={`ml-2 text-sm font-medium transition-all ${
                      step >= stepNumber ? 'text-white' : 'text-white/60'
                    }`}>
                      {stepNumber === 1 && 'Account'}
                      {stepNumber === 2 && 'Vehicles'}
                      {stepNumber === 3 && 'Services'}
                      {stepNumber === 4 && 'Quotes'}
                    </div>
                    {stepNumber < 4 && (
                      <div className={`h-0.5 w-16 mx-4 transition-all ${
                        step > stepNumber ? 'bg-white/50' : 'bg-white/20'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                  
                  {/* Account Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {accountTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange('accountType', type.value)}
                            className={`p-4 rounded-xl border transition-all duration-200 ${
                              formData.accountType === type.value
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                formData.accountType === type.value
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <span className="font-medium text-gray-800">{type.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Source Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Where did this lead come from?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {sources.map((source) => (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() => handleInputChange('source', source.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            formData.source === source.value
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {source.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Personal/Company Information */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="e.g., John"
                            className={`pl-10 pr-4 py-3 w-full rounded-xl border ${
                              errors.firstName ? 'border-red-300' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                          />
                        </div>
                        {errors.firstName && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="e.g., Doe"
                          className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>

                    {formData.accountType === 'organization' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            placeholder="e.g., Doe Enterprises"
                            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="e.g., john.doe@example.com"
                            className={`pl-10 pr-4 py-3 w-full rounded-xl border ${
                              errors.email ? 'border-red-300' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="e.g., +254700123456"
                            className={`pl-10 pr-4 py-3 w-full rounded-xl border ${
                              errors.phone ? 'border-red-300' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opportunity Subject *
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="e.g., Car Service Request - Honda Civic"
                        className={`pl-4 pr-4 py-3 w-full rounded-xl border ${
                          errors.subject ? 'border-red-300' : 'border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                      />
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.subject}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opportunity ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.opportunityId}
                        onChange={(e) => handleInputChange('opportunityId', e.target.value)}
                        placeholder="e.g., 6901e1b1813162deba7e462c"
                        className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Details</h3>
                  <p className="text-gray-500 text-sm mb-6">Add vehicle(s) for this opportunity</p>

                  {errors.vehicles && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.vehicles}
                      </p>
                    </div>
                  )}

                  {/* Vehicles Section */}
                  <div className="space-y-4">
                    {formData.vehicles.map((vehicle, index) => (
                      <div key={vehicle.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-gray-600" />
                            <span className="font-medium text-gray-800">Vehicle {index + 1}</span>
                          </div>
                          {formData.vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVehicle(index)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              VIN
                            </label>
                            <input
                              type="text"
                              value={vehicle.vin}
                              onChange={(e) => handleVehicleChange(index, 'vin', e.target.value)}
                              placeholder="e.g., 1HGCM82633A123456"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Registration Number
                            </label>
                            <input
                              type="text"
                              value={vehicle.registrationNumber}
                              onChange={(e) => handleVehicleChange(index, 'registrationNumber', e.target.value)}
                              placeholder="e.g., ABC123"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Make *
                            </label>
                            <input
                              type="text"
                              value={vehicle.make}
                              onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                              placeholder="e.g., Honda"
                              className={`pl-3 pr-3 py-2 w-full rounded-lg border ${
                                errors.vehicles && !vehicle.make.trim() ? 'border-red-300' : 'border-gray-200'
                              } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors`}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Model *
                            </label>
                            <input
                              type="text"
                              value={vehicle.model}
                              onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                              placeholder="e.g., Civic"
                              className={`pl-3 pr-3 py-2 w-full rounded-lg border ${
                                errors.vehicles && !vehicle.model.trim() ? 'border-red-300' : 'border-gray-200'
                              } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors`}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Year
                            </label>
                            <input
                              type="text"
                              value={vehicle.year}
                              onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                              placeholder="e.g., 2025"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Color
                            </label>
                            <input
                              type="text"
                              value={vehicle.color}
                              onChange={(e) => handleVehicleChange(index, 'color', e.target.value)}
                              placeholder="e.g., Blue"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addVehicle}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Vehicle
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Services & Waivers</h3>
                  <p className="text-gray-500 text-sm mb-6">Define services needed and required waivers</p>

                  {/* Services Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Service Request</h3>
                      <button
                        type="button"
                        onClick={addService}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Another Service
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.services.map((service, index) => (
                        <div key={service.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-5 w-5 text-gray-600" />
                              <span className="font-medium text-gray-800">Service {index + 1}</span>
                            </div>
                            {formData.services.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeService(index)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Title
                              </label>
                              <input
                                type="text"
                                value={service.title}
                                onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                                placeholder="e.g., Oil Change Service"
                                className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <textarea
                                value={service.description}
                                onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                                placeholder="e.g., Full synthetic oil change and filter replacement"
                                rows={3}
                                className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Waivers Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Waivers</h3>
                      <button
                        type="button"
                        onClick={addWaiver}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Another Waiver
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.waivers.map((waiver, index) => (
                        <div key={waiver.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-gray-600" />
                              <span className="font-medium text-gray-800">{waiver.type}</span>
                            </div>
                            {formData.waivers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeWaiver(index)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Waiver Description
                            </label>
                            <textarea
                              value={waiver.description}
                              onChange={(e) => handleWaiverChange(index, 'description', e.target.value)}
                              placeholder="e.g., Standard service waiver for maintenance work"
                              rows={3}
                              className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quotes & Review</h3>
                  <p className="text-gray-500 text-sm mb-6">Create quotes and review all information</p>

                  {/* Quotes Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Quote Information</h3>
                      <button
                        type="button"
                        onClick={addQuote}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Another Quote
                      </button>
                    </div>

                    <div className="space-y-6">
                      {formData.quotes.map((quote, quoteIndex) => (
                        <div key={quote.id} className="p-6 rounded-xl border border-gray-200 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <FileText className="h-6 w-6 text-gray-600" />
                              <div>
                                <h4 className="font-semibold text-gray-800">Quote #{quoteIndex + 1}</h4>
                                <p className="text-sm text-gray-500">Items and pricing</p>
                              </div>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                              KES {calculateQuoteTotal(quoteIndex).toLocaleString()}
                            </div>
                          </div>

                          <div className="space-y-4">
                            {quote.items.map((item, itemIndex) => (
                              <div key={item.id} className="p-4 rounded-lg border border-gray-200 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="font-medium text-gray-800">Item {itemIndex + 1}</span>
                                  {quote.items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeQuoteItem(quoteIndex, itemIndex)}
                                      className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Description
                                    </label>
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => handleQuoteItemChange(quoteIndex, itemIndex, 'description', e.target.value)}
                                      placeholder="e.g., Oil Change Service"
                                      className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Quantity
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => handleQuoteItemChange(quoteIndex, itemIndex, 'quantity', parseInt(e.target.value) || 1)}
                                      className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Unit Price (KES)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.unitPrice}
                                      onChange={(e) => handleQuoteItemChange(quoteIndex, itemIndex, 'unitPrice', parseFloat(e.target.value) || 0)}
                                      className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Discount (%)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={item.discount}
                                      onChange={(e) => handleQuoteItemChange(quoteIndex, itemIndex, 'discount', parseFloat(e.target.value) || 0)}
                                      className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Item Total</span>
                                    <span className="font-medium text-gray-800">
                                      KES {(item.quantity * item.unitPrice * (1 - item.discount / 100)).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addQuoteItem(quoteIndex)}
                              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus className="h-5 w-5 text-gray-400" />
                              <span className="text-sm font-medium text-gray-600">Add Item</span>
                            </button>
                          </div>

                          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-blue-600" />
                                <span className="font-semibold text-gray-800">Quote Total</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-800">
                                  KES {calculateQuoteTotal(quoteIndex).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Notes</h3>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Add any additional notes or special instructions..."
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Back
                  </button>
                )}
                <div className="text-sm text-gray-500">
                  Step {step} of {totalSteps} • {stepTitles[step - 1]}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                
                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Create Opportunity
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}