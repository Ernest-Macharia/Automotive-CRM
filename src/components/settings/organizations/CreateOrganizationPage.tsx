'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Globe,
  Building,
  Briefcase,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
  ChevronRight,
  ChevronLeft,
  Info,
  Shield,
  Users,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { 
  organizationService, 
  CreateOrganizationData, 
  ORGANIZATION_TIERS,
  DEFAULT_ORGANIZATION_TIERS
} from '@/services/settings/organizationService';

interface FormData {
  // Organization details
  name: string;
  email: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string;
  industry: string;
  
  // Owner details
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  confirmPassword: string;
  
  // Subscription
  tier: string;
  plan: string;
  
  // Settings
  generatePassword: boolean;
  sendWelcomeEmail: boolean;
}

interface Industry {
  id: string;
  name: string;
  icon: string;
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [availableTiers, setAvailableTiers] = useState(DEFAULT_ORGANIZATION_TIERS);
  const [selectedTierDetails, setSelectedTierDetails] = useState(DEFAULT_ORGANIZATION_TIERS[0]);
  const [formStep, setFormStep] = useState(1);
  const [tiersLoaded, setTiersLoaded] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    website: '',
    industry: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    confirmPassword: '',
    tier: ORGANIZATION_TIERS.BASIC,
    plan: 'basic',
    generatePassword: false,
    sendWelcomeEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const industries: Industry[] = [
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'retail', name: 'Retail', icon: '🛍️' },
    { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
    { id: 'construction', name: 'Construction', icon: '🏗️' },
    { id: 'real_estate', name: 'Real Estate', icon: '🏢' },
    { id: 'transportation', name: 'Transportation', icon: '🚚' },
    { id: 'hospitality', name: 'Hospitality', icon: '🏨' },
    { id: 'legal', name: 'Legal', icon: '⚖️' },
    { id: 'marketing', name: 'Marketing', icon: '📱' },
    { id: 'consulting', name: 'Consulting', icon: '📊' },
    { id: 'other', name: 'Other', icon: '🔧' },
  ];

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
    'France', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 'Other'
  ];

  useEffect(() => {
    loadTiers();
  }, []);

  useEffect(() => {
    const tierDetails = availableTiers.find(t => t.name === formData.tier);
    if (tierDetails) {
      setSelectedTierDetails(tierDetails);
    }
  }, [formData.tier, availableTiers]);

  const loadTiers = async () => {
    try {
      const tiers = await organizationService.getAvailableTiers();
      if (tiers && tiers.length > 0) {
        setAvailableTiers(tiers);
      }
      setTiersLoaded(true);
    } catch (error) {
      console.error('Error loading tiers:', error);
      // Use default tiers if API fails
      setTiersLoaded(true);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    if (field === 'generatePassword' && value) {
      const generatedPassword = generateSecurePassword();
      setFormData(prev => ({
        ...prev,
        ownerPassword: generatedPassword,
        confirmPassword: generatedPassword
      }));
    } else if (field === 'generatePassword' && !value) {
      setFormData(prev => ({
        ...prev,
        ownerPassword: '',
        confirmPassword: ''
      }));
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const length = 12;
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Organization email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    
    if (!formData.ownerEmail) {
      newErrors.ownerEmail = 'Owner email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Please enter a valid email address';
    }
    
    if (!formData.generatePassword) {
      if (!formData.ownerPassword) {
        newErrors.ownerPassword = 'Password is required';
      } else if (formData.ownerPassword.length < 8) {
        newErrors.ownerPassword = 'Password must be at least 8 characters';
      }
      
      if (formData.ownerPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.tier) {
      newErrors.tier = 'Please select a subscription tier';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      showToast('Please select a subscription tier', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const organizationData: CreateOrganizationData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        ownerName: formData.ownerName.trim(),
        ownerEmail: formData.ownerEmail.trim().toLowerCase(),
        ownerPassword: formData.generatePassword ? formData.ownerPassword : formData.ownerPassword,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        website: formData.website || undefined,
        industry: formData.industry,
        tier: formData.tier,
        plan: formData.tier, // Use tier as plan by default
        description: formData.description || undefined,
      };
      
      const result = await organizationService.createOrganization(organizationData);
      
      showToast('Organization created successfully!', 'success');

      if (formData.generatePassword && !formData.sendWelcomeEmail) {
        setTimeout(() => {
          showToast(`Owner password: ${organizationData.ownerPassword}`, 'info', 10000);
        }, 1000);
      }
      
      // Navigate to the new organization details page
      setTimeout(() => {
        router.push(`/settings/organizations/${result.organization.id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error creating organization:', error);
      
      let errorMessage = 'Failed to create organization';
      
      if (error.message) {
        errorMessage = error.message;
        
        if (errorMessage.includes('Superadmin')) {
          errorMessage = 'You need super administrator privileges to create organizations';
        } else if (errorMessage.includes('already exists')) {
          errorMessage = 'An organization with this email or owner already exists';
        } else if (errorMessage.includes('Organization')) {
          errorMessage = 'Organization name already taken';
        } else if (errorMessage.includes('Missing required')) {
          errorMessage = 'Please fill in all required fields';
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (formStep === 1) {
      if (validateStep1()) {
        setFormStep(2);
      } else {
        showToast('Please fill in all required fields', 'error');
      }
    } else if (formStep === 2) {
      if (validateStep2()) {
        setFormStep(3);
      } else {
        showToast('Please complete owner information', 'error');
      }
    } else if (formStep === 3) {
      setFormStep(4);
    }
  };

  const prevStep = () => {
    setFormStep(prev => prev - 1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings/organizations')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Organization</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Set up a new organization and its administrator
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex flex-col items-center`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  formStep >= step 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {formStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                <span className={`text-xs mt-2 ${
                  formStep >= step ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'
                }`}>
                  {step === 1 && 'Organization'}
                  {step === 2 && 'Owner'}
                  {step === 3 && 'Subscription'}
                  {step === 4 && 'Review'}
                </span>
              </div>
              {step < 4 && (
                <div className={`w-16 sm:w-24 h-1 mx-2 ${
                  formStep > step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Step 1: Organization Details */}
        {formStep === 1 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Organization Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Basic information about the organization
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                        errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="e.g., Acme Corporation"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                        errors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="contact@organization.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    placeholder="Brief description of the organization..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                      placeholder="123 Main St"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                  >
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry *
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                      errors.industry ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select industry</option>
                    {industries.map(industry => (
                      <option key={industry.id} value={industry.name}>
                        {industry.icon} {industry.name}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.industry}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Owner Details */}
        {formStep === 2 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Organization Owner</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  The administrator who will manage this organization
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                        errors.ownerName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.ownerName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.ownerName}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                        errors.ownerEmail ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="owner@organization.com"
                    />
                  </div>
                  {errors.ownerEmail && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.ownerEmail}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-800">
                    <input
                      type="checkbox"
                      id="generatePassword"
                      checked={formData.generatePassword}
                      onChange={(e) => handleInputChange('generatePassword', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="generatePassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto-generate secure password
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        A strong password will be automatically generated
                      </p>
                    </div>
                  </div>
                </div>
                
                {!formData.generatePassword && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.ownerPassword}
                          onChange={(e) => handleInputChange('ownerPassword', e.target.value)}
                          className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                            errors.ownerPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="Enter password (min 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errors.ownerPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.ownerPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                            errors.confirmPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="Confirm password"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </>
                )}
                
                {formData.generatePassword && formData.ownerPassword && (
                  <div className="md:col-span-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <p className="text-sm font-medium text-green-800 dark:text-green-400">
                            Generated Password
                          </p>
                        </div>
                        <p className="text-lg font-mono text-gray-900 dark:text-white mt-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-green-200">
                          {formData.ownerPassword}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          This password will be displayed only once. Make sure to save it.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(formData.ownerPassword)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  The organization owner will have full administrative access and can manage users, settings, and subscriptions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Subscription & Tier */}
        {formStep === 3 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Subscription Plan</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose the right plan for your organization
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availableTiers.map((tier) => (
                  <div
                    key={tier.name}
                    onClick={() => handleInputChange('tier', tier.name)}
                    className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.tier === tier.name
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tier.name === ORGANIZATION_TIERS.PRO && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium rounded-full shadow-sm">
                        Popular
                      </span>
                    )}
                    <div className="text-center">
                      <div className={`text-2xl mb-2 ${
                        formData.tier === tier.name ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {tier.name === ORGANIZATION_TIERS.BASIC && '🚀'}
                        {tier.name === ORGANIZATION_TIERS.PRO && '💼'}
                        {tier.name === ORGANIZATION_TIERS.ENTERPRISE && '🏢'}
                        {tier.name === ORGANIZATION_TIERS.PREMIUM && '👑'}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tier.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {tier.description}
                      </p>
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${tier.price}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">/mo</span>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Up to {tier.maxUsers} users
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Tier Details */}
              {selectedTierDetails && (
                <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {selectedTierDetails.displayName} Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTierDetails.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Info className="h-4 w-4" />
                      <span>Storage: {selectedTierDetails.maxStorage || 'Unlimited'}</span>
                    </div>
                  </div>
                </div>
              )}

              {errors.tier && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.tier}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {formStep === 4 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review & Confirm</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review the information before creating the organization
                </p>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Organization Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Organization Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Industry</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.industry}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.phone || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Address</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {[formData.address, formData.city, formData.state, formData.country]
                        .filter(Boolean)
                        .join(', ') || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Website</p>
                    <p className="font-medium text-gray-900 dark:text-white break-all">
                      {formData.website || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Owner Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Owner Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.ownerEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Password</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.generatePassword 
                        ? '✓ Auto-generated (secure)' 
                        : '✓ Manually set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Welcome Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.sendWelcomeEmail ? 'Will be sent' : 'Will not be sent'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Subscription Plan</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Plan</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {formData.tier}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Max Users</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedTierDetails?.maxUsers || 25} users
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Price</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${selectedTierDetails?.price || 0}/month
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Storage</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedTierDetails?.maxStorage || '10GB'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Settings */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-800">
                <input
                  type="checkbox"
                  id="sendWelcomeEmail"
                  checked={formData.sendWelcomeEmail}
                  onChange={(e) => handleInputChange('sendWelcomeEmail', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <label htmlFor="sendWelcomeEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Send welcome email to organization owner
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Owner will receive login credentials and organization setup instructions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {formStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/settings/organizations')}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}

          {formStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5" />
                  Create Organization
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
