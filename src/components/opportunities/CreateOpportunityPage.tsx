'use client';

import { useState, useEffect } from 'react';
import { 
  X, User, Building, Mail, Phone, Car, Plus, Trash2, FileText, 
  DollarSign, Calendar, Tag, AlertCircle, Check, ChevronDown,
  Upload, Clock, Shield, Briefcase, Sparkles, ChevronRight,
  ArrowRight, ChevronLeft, Save, Package, Settings, ShoppingBag,
  Layers, Box, Wrench, Zap, AlertTriangle, Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { opportunityService } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import SuccessModal from '@/components/opportunities/SuccessModal';
import { Opportunity } from '@/services/opportunityService';
import React from 'react';

interface Vehicle {
  id: string;
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
}

interface ServiceProduct {
  id: string;
  title: string;
  description: string;
  type: 'SERVICE' | 'PRODUCT';
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Waiver {
  id: string;
  type: string;
  description: string;
}

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

interface OpportunityFormData {
  accountType: 'individual' | 'organization';
  source: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  phoneCode: string;
  vehicles: Vehicle[];
  servicesProducts: ServiceProduct[];
  waivers: Waiver[];
  notes: string;
  currentStep: number;
  opportunityType: 'SERVICE' | 'PRODUCT';
}

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OpportunityFormData>({
    accountType: 'individual',
    source: 'walk_in',
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    phoneCode: '+254',
    vehicles: [{
      id: '1',
      vin: '',
      registrationNumber: '',
      make: '',
      model: '',
      year: '',
      color: ''
    }],
    servicesProducts: [],
    waivers: [{
      id: '1',
      type: 'Service Waiver',
      description: ''
    }],
    notes: '',
    currentStep: 1,
    opportunityType: 'SERVICE'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOpportunity, setCreatedOpportunity] = useState<Opportunity | null>(null);

  const accountTypes = [
    { value: 'individual', label: 'Individual', icon: User },
    { value: 'organization', label: 'Organization', icon: Building }
  ];

  const sources = [
    { value: 'walk_in', label: 'Walk In' },
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'manual', label: 'Manual' },
    { value: 'test', label: 'Test' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'social_media', label: 'Social Media' }
  ];

  const opportunityTypes = [
    { value: 'SERVICE', label: 'Service', icon: Settings, color: 'bg-blue-100 text-blue-600' },
    { value: 'PRODUCT', label: 'Product', icon: Package, color: 'bg-green-100 text-green-600' }
  ];

  const totalSteps = 3;

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags,idd');
        const data = await response.json();
        
        const formattedCountries = data
          .filter((country: any) => country.idd?.root && country.idd?.suffixes?.[0])
          .map((country: any) => {
            // Try to get the flag emoji from country code
            const getFlagEmojiFromCode = (code: string) => {
              return code
                .toUpperCase()
                .split('')
                .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
                .join('');
            };
            
            return {
              code: country.cca2,
              name: country.name.common,
              flag: getFlagEmojiFromCode(country.cca2),
              dialCode: `${country.idd.root}${country.idd.suffixes[0]}`
            };
          })
          .sort((a: CountryCode, b: CountryCode) => a.name.localeCompare(b.name));
        
        setCountryCodes(formattedCountries);
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Fallback to a few common countries
        setCountryCodes([
          { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
          { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
          { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
          { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
          { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
          { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
          { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
          { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
          { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
          { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
        ]);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const handleInputChange = (field: keyof OpportunityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [field]: value };
    setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleServiceProductChange = (index: number, field: keyof ServiceProduct, value: any) => {
    const updatedServicesProducts = [...formData.servicesProducts];
    updatedServicesProducts[index] = { 
      ...updatedServicesProducts[index], 
      [field]: value,
      ...(field === 'quantity' || field === 'unitPrice' || field === 'discount' ? {
        total: calculateServiceProductTotal(updatedServicesProducts[index], field, value)
      } : {})
    };
    setFormData(prev => ({ ...prev, servicesProducts: updatedServicesProducts }));
  };

  const handleWaiverChange = (index: number, field: keyof Waiver, value: string) => {
    const updatedWaivers = [...formData.waivers];
    updatedWaivers[index] = { ...updatedWaivers[index], [field]: value };
    setFormData(prev => ({ ...prev, waivers: updatedWaivers }));
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

  const addServiceProduct = () => {
    setFormData(prev => ({
      ...prev,
      servicesProducts: [...prev.servicesProducts, {
        id: Date.now().toString(),
        title: '',
        description: '',
        type: formData.opportunityType,
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        total: 0
      }]
    }));
  };

  const removeServiceProduct = (index: number) => {
    if (formData.servicesProducts.length > 0) {
      const updatedServicesProducts = formData.servicesProducts.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, servicesProducts: updatedServicesProducts }));
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

  const calculateServiceProductTotal = (item: ServiceProduct, changedField?: keyof ServiceProduct, newValue?: any) => {
    const quantity = changedField === 'quantity' ? (newValue || 1) : item.quantity;
    const unitPrice = changedField === 'unitPrice' ? (newValue || 0) : item.unitPrice;
    const discount = changedField === 'discount' ? (newValue || 0) : item.discount;
    
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const calculateTotal = () => {
    return formData.servicesProducts.reduce((total, item) => {
      return total + (item.total || 0);
    }, 0);
  };

  const selectCountryCode = (code: string) => {
    setFormData(prev => ({ ...prev, phoneCode: code }));
    setShowCountryCodes(false);
    setCountrySearch('');
  };

  const filteredCountries = countryCodes.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.dialCode.includes(countrySearch)
  );

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      const phoneRegex = /^\d+$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number (digits only)';
      }
    }

    if (step === 2) {
      const hasValidVehicle = formData.vehicles.some(vehicle => 
        vehicle.make.trim() && vehicle.model.trim()
      );
      if (!hasValidVehicle) {
        newErrors.vehicles = 'At least one vehicle with make and model is required';
      }
    }

    if (step === 3) {
      if (formData.servicesProducts.length === 0) {
        newErrors.servicesProducts = 'At least one service or product is required';
      } else {
        const hasValidItem = formData.servicesProducts.some(item => 
          item.title.trim() && item.type
        );
        if (!hasValidItem) {
          newErrors.servicesProducts = 'Each service/product must have a title and valid type';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < totalSteps) {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveDraft = () => {
    localStorage.setItem('opportunityDraft', JSON.stringify(formData));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleSubmit = async () => {
    if (validateStep()) {
      setIsSubmitting(true);
      try {
        const title = `${formData.firstName} ${formData.lastName}'s ${formData.opportunityType.toLowerCase()} request`;

        const apiFormData = {
          type: formData.accountType,
          source: formData.source,
          status: 'new' as const,
          subject: title,
          opportunityType: formData.opportunityType,
          customer: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            ...(formData.email && { email: formData.email }),
            phone: `${formData.phoneCode}${formData.phone}`,
            ...(formData.companyName && { companyName: formData.companyName }),
          },
          ...(formData.vehicles.length > 0 && {
            vehicles: formData.vehicles.map(vehicle => ({
              ...(vehicle.vin && { vin: vehicle.vin }),
              ...(vehicle.registrationNumber && { registrationNumber: vehicle.registrationNumber }),
              make: vehicle.make,
              model: vehicle.model,
              ...(vehicle.year && { year: vehicle.year }),
              ...(vehicle.color && { color: vehicle.color }),
            }))
          }),
          servicesProducts: formData.servicesProducts.map(item => ({
            title: item.title,
            description: item.description,
            type: item.type,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total
          })),
          ...(formData.waivers.length > 0 && {
            waivers: formData.waivers.map(waiver => ({
              type: waiver.type,
              description: waiver.description
            }))
          }),
          ...(formData.notes && { notes: formData.notes }),
          total: calculateTotal(),
        };
        
        // Submit to API
        const result = await opportunityService.createOpportunity(apiFormData);
        
        // Set the created opportunity and show success modal
        setCreatedOpportunity(result);
        setShowSuccessModal(true);
        
        // Clear draft
        localStorage.removeItem('opportunityDraft');
        
        showToast('Opportunity created successfully!', 'success', 3000);
        
      } catch (error: any) {
        console.error('Error creating opportunity:', error);
        showToast(
          error.message || 'Failed to create opportunity. Please try again.', 
          'error', 
          5000
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleViewOpportunityDetails = () => {
    if (createdOpportunity) {
      showToast(`Redirecting to opportunity ${createdOpportunity.subject}`, 'info', 2000);
      setShowSuccessModal(false);
      router.push(`/opportunities/${createdOpportunity._id}`);
    }
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    // Reset form for new opportunity
    setFormData({
      accountType: 'individual',
      source: 'walk_in',
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      phoneCode: '+254',
      vehicles: [{
        id: '1',
        vin: '',
        registrationNumber: '',
        make: '',
        model: '',
        year: '',
        color: ''
      }],
      servicesProducts: [],
      waivers: [{
        id: '1',
        type: 'Service Waiver',
        description: ''
      }],
      notes: '',
      currentStep: 1,
      opportunityType: 'SERVICE'
    });
    setStep(1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // const handleAssignToTeam = () => {
  //   if (createdOpportunity) {
  //     showToast(`Assigning opportunity to team...`, 'info', 2000);
  //     setShowSuccessModal(false);
  //   }
  // };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/opportunities');
  };

  useEffect(() => {
    const savedDraft = localStorage.getItem('opportunityDraft');
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
    }
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, currentStep: step }));
  }, [step]);

  const stepTitles = [
    'Account Information',
    'Vehicle Details',
    'Services & Products'
  ];

  const stepDescriptions = [
    'Enter customer and basic opportunity information',
    'Add vehicle(s) for this opportunity',
    'Select services, products, and create quotes'
  ];


  const getFlagEmoji = (countryCode: string) => {
    // If it already looks like an emoji, return it
    if (countryCode.includes('🇦') || countryCode.includes('🇧') || countryCode.includes('🇨') || countryCode.includes('🇩')) {
      return countryCode;
    }
    
    // Try to find in our countryCodes list
    const country = countryCodes.find(c => c.dialCode === countryCode || c.code === countryCode.replace('+', ''));
    if (country) {
      return country.flag;
    }
    
    // Fallback: try to convert code to emoji
    try {
      const code = countryCode.replace('+', '').toUpperCase().slice(0, 2);
      const codePoints = Array.from(code)
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🏳️';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Create New Opportunity</h1>
                  <p className="text-blue-100 text-sm">{stepTitles[step - 1]}</p>
                  <p className="text-blue-200 text-xs mt-1">{stepDescriptions[step - 1]}</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/opportunities')}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      step === stepNumber 
                        ? 'bg-white border-white text-blue-600 scale-110 shadow-lg' 
                        : step > stepNumber 
                          ? 'bg-white/30 border-white/30 text-white'
                          : 'bg-transparent border-white/30 text-white'
                    }`}>
                      {step > stepNumber ? <Check className="h-5 w-5" /> : stepNumber}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-medium transition-all ${
                        step >= stepNumber ? 'text-white' : 'text-white/60'
                      }`}>
                        Step {stepNumber}
                      </div>
                      <div className={`text-xs transition-all ${
                        step >= stepNumber ? 'text-white' : 'text-white/40'
                      }`}>
                        {stepNumber === 1 && 'Account'}
                        {stepNumber === 2 && 'Vehicles'}
                        {stepNumber === 3 && 'Services'}
                      </div>
                    </div>
                    {stepNumber < 3 && (
                      <div className={`h-0.5 w-16 md:w-24 mx-4 transition-all ${
                        step > stepNumber ? 'bg-white/50' : 'bg-white/20'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Current Step Content */}
            <div className="p-6 md:p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Account Information</h2>
                  
                  {/* Account Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Account Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {accountTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange('accountType', type.value)}
                            className={`p-4 rounded-xl border transition-all duration-200 ${
                              formData.accountType === type.value
                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 ring-2 ring-blue-200'
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {sources.map((source) => (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() => handleInputChange('source', source.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            formData.source === source.value
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => setShowCountryCodes(!showCountryCodes)}
                              className="flex items-center justify-between w-full px-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
                                {loadingCountries ? (
                                  <>
                                    <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
                                    <span className="text-gray-500">Loading...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-lg">
                                      {formData.phoneCode.startsWith('+') ? 
                                        getFlagEmoji(formData.phoneCode) : 
                                        getFlagEmoji(formData.phoneCode.replace('+', ''))
                                      }
                                    </span>
                                    <span>{formData.phoneCode}</span>
                                  </>
                                )}
                              </div>
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>
                            
                            {showCountryCodes && (
                              <div className="absolute bottom-full mb-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                <div className="sticky top-0 bg-white p-2 border-b">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      placeholder="Search countries..."
                                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {filteredCountries.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                      No countries found
                                    </div>
                                  ) : (
                                    filteredCountries.map((country) => (
                                      <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => selectCountryCode(country.dialCode)}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                                      >
                                        <span className="text-lg">{getFlagEmoji(country.code)}</span>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{country.name}</div>
                                          <div className="text-xs text-gray-500">{country.dialCode}</div>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="700123456"
                            className={`flex-1 pl-4 pr-4 py-3 rounded-xl border ${
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
                        <p className="text-xs text-gray-500 mt-1">
                          Phone: {formData.phoneCode}{formData.phone || '_______'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Vehicle Details</h2>
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
                      <div key={vehicle.id} className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 text-sm font-medium transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Vehicle
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Services & Products</h2>
                  <p className="text-gray-500 text-sm mb-6">Select services or products and create quotes</p>

                  {/* Opportunity Type Selection - MOVED HERE */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Opportunity Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {opportunityTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => {
                              handleInputChange('opportunityType', type.value);
                              // Update all items to match the selected type
                              const updatedItems = formData.servicesProducts.map(item => ({
                                ...item,
                                type: type.value as 'SERVICE' | 'PRODUCT'
                              }));
                              setFormData(prev => ({ ...prev, servicesProducts: updatedItems }));
                            }}
                            className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 ${
                              formData.opportunityType === type.value
                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-3 rounded-lg ${type.color}`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-gray-800">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Opportunity Type Display */}
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          opportunityTypes.find(t => t.value === formData.opportunityType)?.color
                        }`}>
                          {React.createElement(opportunityTypes.find(t => t.value === formData.opportunityType)?.icon || Settings, { className: "h-5 w-5" })}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {opportunityTypes.find(t => t.value === formData.opportunityType)?.label} Opportunity
                          </h3>
                          <p className="text-sm text-gray-500">
                            Adding {formData.opportunityType.toLowerCase()} items to quote
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          KES {calculateTotal().toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formData.servicesProducts.length} item{formData.servicesProducts.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services/Products Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Items List</h3>
                      <button
                        type="button"
                        onClick={addServiceProduct}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 text-sm font-medium transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </button>
                    </div>

                    {/* Empty State */}
                    {formData.servicesProducts.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50">
                        <div className="max-w-md mx-auto">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                            <Package className="h-8 w-8 text-gray-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            No {formData.opportunityType.toLowerCase()} items added yet
                          </h3>
                          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Start by adding custom items to build your quote.
                          </p>
                          <button
                            type="button"
                            onClick={addServiceProduct}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 text-sm font-medium shadow-sm transition-all"
                          >
                            <Plus className="h-4 w-4" />
                            Add First Item
                          </button>
                        </div>
                      </div>
                    )}

                    {errors.servicesProducts && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.servicesProducts}
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {formData.servicesProducts.map((item, index) => (
                        <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${
                                item.type === 'SERVICE' ? 'bg-blue-100 text-blue-600' : 
                                'bg-green-100 text-green-600'
                              }`}>
                                {item.type === 'SERVICE' ? (
                                  <Settings className="h-4 w-4" />
                                ) : (
                                  <Package className="h-4 w-4" />
                                )}
                              </div>
                              <span className="font-medium text-gray-800">Item {index + 1}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.type === 'SERVICE' ? 'bg-blue-100 text-blue-600' : 
                                'bg-green-100 text-green-600'
                              }`}>
                                {item.type}
                              </span>
                            </div>
                            {formData.servicesProducts.length > 0 && (
                              <button
                                type="button"
                                onClick={() => removeServiceProduct(index)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title/Description *
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleServiceProductChange(index, 'title', e.target.value)}
                                placeholder="e.g., Oil Change Service, Brake Pads, Fog Light Installation"
                                className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Detailed Description
                              </label>
                              <textarea
                                value={item.description}
                                onChange={(e) => handleServiceProductChange(index, 'description', e.target.value)}
                                placeholder="e.g., Full synthetic oil change and filter replacement, including labor..."
                                rows={2}
                                className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow empty value or numbers
                                    if (value === '') {
                                      handleServiceProductChange(index, 'quantity', 0);
                                    } else {
                                      const numValue = parseInt(value);
                                      handleServiceProductChange(index, 'quantity', isNaN(numValue) ? 0 : numValue);
                                    }
                                  }}
                                  className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Unit Price (KES)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow empty value or numbers
                                    if (value === '') {
                                      handleServiceProductChange(index, 'unitPrice', 0);
                                    } else {
                                      const numValue = parseFloat(value);
                                      handleServiceProductChange(index, 'unitPrice', isNaN(numValue) ? 0 : numValue);
                                    }
                                  }}
                                  className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Discount (%)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.discount}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '') {
                                      handleServiceProductChange(index, 'discount', 0);
                                    } else {
                                      const numValue = parseFloat(value);
                                      handleServiceProductChange(index, 'discount', isNaN(numValue) ? 0 : numValue);
                                    }
                                  }}
                                  className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                />
                              </div>
                            </div>
                            
                            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Item Total</span>
                                <div className="text-right">
                                  <div className="font-medium text-gray-800">
                                    KES {(item.total || 0).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.quantity} × KES {item.unitPrice.toLocaleString()}
                                    {item.discount > 0 && ` - ${item.discount}% discount`}
                                  </div>
                                </div>
                              </div>
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
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 text-sm font-medium transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        Add Waiver
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.waivers.map((waiver, index) => (
                        <div key={waiver.id} className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
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
                              placeholder="e.g., Standard service waiver for maintenance work..."
                              rows={3}
                              className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                            />
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

                  {/* Summary Section */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Opportunity Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Customer Information</h4>
                        <div className="space-y-1">
                          <p className="text-sm"><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
                          <p className="text-sm"><span className="font-medium">Email:</span> {formData.email}</p>
                          <p className="text-sm"><span className="font-medium">Phone:</span> {formData.phoneCode}{formData.phone}</p>
                          {formData.companyName && (
                            <p className="text-sm"><span className="font-medium">Company:</span> {formData.companyName}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Opportunity Details</h4>
                        <div className="space-y-1">
                          <p className="text-sm"><span className="font-medium">Type:</span> {formData.opportunityType}</p>
                          <p className="text-sm"><span className="font-medium">Source:</span> {sources.find(s => s.value === formData.source)?.label}</p>
                          <p className="text-sm"><span className="font-medium">Vehicles:</span> {formData.vehicles.length}</p>
                          <p className="text-sm"><span className="font-medium">Items:</span> {formData.servicesProducts.length}</p>
                          <p className="text-sm"><span className="font-medium">Total Value:</span> KES {calculateTotal().toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Draft
                  </button>
                  {draftSaved && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Draft saved!
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/opportunities')}
                    className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {step < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Create Opportunity
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        opportunity={createdOpportunity}
        onViewDetails={handleViewOpportunityDetails}
        onCreateAnother={handleCreateAnother}
        // onAssignToTeam={handleAssignToTeam}
      />
    </>
  );
}

// Circle icon component
function Circle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
    </svg>
  );
}