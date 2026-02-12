// components/settings/organizations/EditOrganizationPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Save,
  X,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  Building,
  Users,
  CreditCard,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Trash2,
  Key,
  Eye,
  EyeOff,
  User,
  Shield,
  Info,
  CheckCircle,
  XCircle,
  Ban,
  Play,
  Pause,
  Loader2,
  Edit,
  Settings,
  Palette,
  Bell,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { 
  organizationService, 
  Organization, 
  UpdateOrganizationData,
  OrganizationSettings,
  ORGANIZATION_STATUS,
  ORGANIZATION_TIERS,
  DEFAULT_ORGANIZATION_TIERS
} from '@/services/settings/organizationService';

interface EditOrganizationPageProps {
  organizationId: string;
}

interface FormData {
  // Basic Information
  name: string;
  email: string;
  description: string;
  phone: string;
  website: string;
  industry: string;
  logo?: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  
  // Status & Tier
  status: 'active' | 'suspended' | 'inactive';
  tier: string;
  plan: string;
  maxUsers: number;
  
  // Settings
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  customDomain: string;
  
  // Branding
  primaryColor: string;
  secondaryColor: string;
  
  // Notifications
  emailNotifications: boolean;
  slackWebhook: string;
}

interface Industry {
  id: string;
  name: string;
  icon: string;
}

export default function EditOrganizationPage({ organizationId }: EditOrganizationPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [availableTiers, setAvailableTiers] = useState(DEFAULT_ORGANIZATION_TIERS);
  const [formStep, setFormStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusChangeConfirm, setShowStatusChangeConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'inactive' | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    description: '',
    phone: '',
    website: '',
    industry: '',
    logo: '',
    
    address: '',
    city: '',
    state: '',
    country: 'United States',
    zipCode: '',
    
    status: 'active',
    tier: ORGANIZATION_TIERS.BASIC,
    plan: 'basic',
    maxUsers: 25,
    
    allowUserRegistration: true,
    requireEmailVerification: false,
    twoFactorAuth: false,
    sessionTimeout: 24,
    customDomain: '',
    
    primaryColor: '#1890ff',
    secondaryColor: '#52c41a',
    
    emailNotifications: true,
    slackWebhook: '',
  });

  useEffect(() => {
    if (organizationId) {
      loadOrganization();
      loadTiers();
    }
  }, [organizationId]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const org = await organizationService.getOrganizationById(organizationId);
      setOrganization(org);
      
      // Populate form with organization data
      setFormData({
        name: org.name || '',
        email: org.email || '',
        description: org.description || '',
        phone: org.phone || '',
        website: org.website || '',
        industry: org.industry || '',
        logo: org.logo || '',
        
        address: org.address || '',
        city: org.city || '',
        state: org.state || '',
        country: org.country || 'United States',
        zipCode: '', // Add if your API supports this
        
        status: org.status || 'active',
        tier: org.tier || ORGANIZATION_TIERS.BASIC,
        plan: org.plan || org.tier || 'basic',
        maxUsers: org.maxUsers || 25,
        
        allowUserRegistration: org.settings?.allowUserRegistration ?? true,
        requireEmailVerification: org.settings?.requireEmailVerification ?? false,
        twoFactorAuth: org.settings?.twoFactorAuth ?? false,
        sessionTimeout: org.settings?.sessionTimeout ?? 24,
        customDomain: org.settings?.customDomain || '',
        
        primaryColor: org.settings?.branding?.primaryColor || '#1890ff',
        secondaryColor: org.settings?.branding?.secondaryColor || '#52c41a',
        
        emailNotifications: org.settings?.notifications?.email ?? true,
        slackWebhook: org.settings?.notifications?.webhook || '',
      });

      if (org.logo) {
        setLogoPreview(org.logo);
      }
      
    } catch (error) {
      console.error('Error loading organization:', error);
      showToast('Failed to load organization', 'error');
      router.push('/settings/organizations');
    } finally {
      setLoading(false);
    }
  };

  const loadTiers = async () => {
    try {
      const tiers = await organizationService.getAvailableTiers();
      if (tiers && tiers.length > 0) {
        setAvailableTiers(tiers);
      }
    } catch (error) {
      console.error('Error loading tiers:', error);
      // Use default tiers
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        handleInputChange('logo', base64);
      };
      reader.readAsDataURL(file);
    }
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.maxUsers < 1) {
      newErrors.maxUsers = 'Maximum users must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    return true; // Settings are optional
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      showToast('Please fix the errors in the form', 'error');
      setFormStep(1);
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare update data
      const updateData: UpdateOrganizationData = {
        name: formData.name,
        email: formData.email,
        description: formData.description || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        industry: formData.industry || undefined,
        logo: formData.logo || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        status: formData.status,
        tier: formData.tier,
        plan: formData.plan,
        maxUsers: formData.maxUsers,
      };
      
      // Update organization
      const updatedOrg = await organizationService.updateOrganization(organizationId, updateData);
      
      // Update settings separately if changed
      const settings: OrganizationSettings = {
        allowUserRegistration: formData.allowUserRegistration,
        requireEmailVerification: formData.requireEmailVerification,
        twoFactorAuth: formData.twoFactorAuth,
        sessionTimeout: formData.sessionTimeout,
        customDomain: formData.customDomain || undefined,
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl: formData.logo || undefined,
        },
        notifications: {
          email: formData.emailNotifications,
          webhook: formData.slackWebhook || undefined,
        },
      };
      
      await organizationService.updateOrganizationSettings(organizationId, settings);
      
      showToast('Organization updated successfully!', 'success');
      
      // Navigate back to organization details
      setTimeout(() => {
        router.push(`/settings/organizations/${organizationId}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating organization:', error);
      
      let errorMessage = 'Failed to update organization';
      
      if (error.message) {
        if (error.message.includes('Superadmin')) {
          errorMessage = 'You need super administrator privileges to update organizations';
        } else if (error.message.includes('already exists')) {
          errorMessage = 'An organization with this email already exists';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Organization not found';
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    try {
      await organizationService.deleteOrganization(organizationId);
      showToast('Organization deleted successfully', 'success');
      router.push('/settings/organizations');
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      showToast(error.message || 'Failed to delete organization', 'error');
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    
    try {
      let updatedOrg;
      
      if (newStatus === 'active') {
        updatedOrg = await organizationService.activateOrganization(organizationId);
        showToast('Organization activated successfully', 'success');
      } else if (newStatus === 'suspended') {
        updatedOrg = await organizationService.suspendOrganization(organizationId, { 
          reason: statusReason || 'No reason provided' 
        });
        showToast('Organization suspended successfully', 'success');
      } else if (newStatus === 'inactive') {
        // You might need to implement a deactivate endpoint
        updatedOrg = await organizationService.updateOrganization(organizationId, { 
          status: 'inactive' 
        });
        showToast('Organization deactivated successfully', 'success');
      }
      
      setOrganization(updatedOrg || null);
      setFormData(prev => ({ ...prev, status: newStatus }));
      setShowStatusChangeConfirm(false);
      setNewStatus(null);
      setStatusReason('');
      
    } catch (error: any) {
      console.error('Error changing organization status:', error);
      showToast(error.message || 'Failed to change organization status', 'error');
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
        showToast('Please fix the errors', 'error');
      }
    } else if (formStep === 3) {
      setFormStep(4);
    }
  };

  const prevStep = () => {
    setFormStep(prev => prev - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/settings/organizations/${organizationId}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Organization</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Update organization details and settings
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Organization Info Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              {logoPreview ? (
                <img src={logoPreview} alt={organization.name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">
                  {organization.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{organization.name}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
                  ID: {organization.id.slice(-8)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {organization.currentUsers || 0} / {organization.maxUsers} users
                </span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              formData.status === 'active' ? 'bg-green-100 text-green-700' :
              formData.status === 'suspended' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
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
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Subscription'}
                  {step === 3 && 'Settings'}
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
        {/* Step 1: Basic Information */}
        {formStep === 1 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Update organization details and contact information
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-24 w-24 rounded-xl object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">Organization Logo</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Upload a square image, recommended size 256x256px
                  </p>
                </div>
              </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                  >
                    <option value="">Select industry</option>
                    {industries.map(industry => (
                      <option key={industry.id} value={industry.name}>
                        {industry.icon} {industry.name}
                      </option>
                    ))}
                  </select>
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
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="ZIP Code"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Subscription & Limits */}
        {formStep === 2 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Subscription & Limits</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage plan, user limits, and subscription details
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscription Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {availableTiers.map((tier) => (
                    <div
                      key={tier.name}
                      onClick={() => {
                        handleInputChange('tier', tier.name);
                        handleInputChange('plan', tier.name);
                        handleInputChange('maxUsers', tier.maxUsers);
                      }}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.tier === tier.name
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {tier.name === ORGANIZATION_TIERS.PRO && (
                        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium rounded-full">
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
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {tier.displayName}
                        </h3>
                        <div className="mt-2">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            ${tier.price}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">/mo</span>
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Up to {tier.maxUsers} users
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Users *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) => handleInputChange('maxUsers', parseInt(e.target.value))}
                      min={1}
                      max={10000}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 ${
                        errors.maxUsers ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {errors.maxUsers && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.maxUsers}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Current usage: {organization.currentUsers || 0} users
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plan ID
                  </label>
                  <input
                    type="text"
                    value={formData.plan}
                    onChange={(e) => handleInputChange('plan', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    placeholder="basic"
                  />
                </div>
              </div>

              {/* Status Management */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Organization Status</h3>
                
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                    formData.status === 'active' ? 'bg-green-100 text-green-700' :
                    formData.status === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {formData.status === 'active' && <CheckCircle className="h-5 w-5" />}
                    {formData.status === 'suspended' && <Ban className="h-5 w-5" />}
                    {formData.status === 'inactive' && <Pause className="h-5 w-5" />}
                    <span className="font-medium">
                      Currently {formData.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {formData.status !== 'active' && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewStatus('active');
                          setShowStatusChangeConfirm(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        <Play className="h-4 w-4 inline mr-1" />
                        Activate
                      </button>
                    )}
                    {formData.status !== 'suspended' && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewStatus('suspended');
                          setShowStatusChangeConfirm(true);
                        }}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                      >
                        <Ban className="h-4 w-4 inline mr-1" />
                        Suspend
                      </button>
                    )}
                    {formData.status !== 'inactive' && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewStatus('inactive');
                          setShowStatusChangeConfirm(true);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                      >
                        <Pause className="h-4 w-4 inline mr-1" />
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Settings & Configuration */}
        {formStep === 3 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings & Configuration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure organization-wide settings and preferences
                </p>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Security Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  Security Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <label htmlFor="allowUserRegistration" className="font-medium text-gray-900 dark:text-white">
                        Allow User Registration
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Users can register themselves without invitation
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="allowUserRegistration"
                        checked={formData.allowUserRegistration}
                        onChange={(e) => handleInputChange('allowUserRegistration', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <label htmlFor="requireEmailVerification" className="font-medium text-gray-900 dark:text-white">
                        Require Email Verification
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Users must verify their email address before accessing the system
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="requireEmailVerification"
                        checked={formData.requireEmailVerification}
                        onChange={(e) => handleInputChange('requireEmailVerification', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <label htmlFor="twoFactorAuth" className="font-medium text-gray-900 dark:text-white">
                        Two-Factor Authentication
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Require 2FA for all users in this organization
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="twoFactorAuth"
                        checked={formData.twoFactorAuth}
                        onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <label className="block font-medium text-gray-900 dark:text-white mb-2">
                      Session Timeout (hours)
                    </label>
                    <input
                      type="number"
                      value={formData.sessionTimeout}
                      onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                      min={1}
                      max={720}
                      className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Users will be logged out after this period of inactivity
                    </p>
                  </div>
                </div>
              </div>

              {/* Branding Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-gray-500" />
                  Branding
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Color
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                        placeholder="#1890ff"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="h-10 w-10 p-1 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                        placeholder="#52c41a"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Domain
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.customDomain}
                        onChange={(e) => handleInputChange('customDomain', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                        placeholder="custom.acme.com"
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Configure DNS settings separately
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gray-500" />
                  Notifications
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <label htmlFor="emailNotifications" className="font-medium text-gray-900 dark:text-white">
                        Email Notifications
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Send system notifications via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Slack Webhook URL
                    </label>
                    <input
                      type="url"
                      value={formData.slackWebhook}
                      onChange={(e) => handleInputChange('slackWebhook', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review Changes */}
        {formStep === 4 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Changes</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review the changes before updating the organization
                </p>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Organization Changes */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Organization Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.name}</p>
                    {formData.name !== organization.name && (
                      <span className="text-xs text-blue-600">Changed from: {organization.name}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.email}</p>
                    {formData.email !== organization.email && (
                      <span className="text-xs text-blue-600">Changed from: {organization.email}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Industry</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.industry || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.phone || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Subscription Changes */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Subscription & Limits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Plan</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{formData.tier}</p>
                    {formData.tier !== organization.tier && (
                      <span className="text-xs text-purple-600">Upgrading from: {organization.tier}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Max Users</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.maxUsers}</p>
                    {formData.maxUsers !== organization.maxUsers && (
                      <span className="text-xs text-purple-600">Changed from: {organization.maxUsers}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                    <p className={`font-medium capitalize ${
                      formData.status === 'active' ? 'text-green-600' :
                      formData.status === 'suspended' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {formData.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Changes Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Settings Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.allowUserRegistration ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      User Registration: {formData.allowUserRegistration ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.twoFactorAuth ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      2FA: {formData.twoFactorAuth ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.emailNotifications ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Email Notifications: {formData.emailNotifications ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Session Timeout: {formData.sessionTimeout} hours
                    </span>
                  </div>
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
              onClick={() => router.push(`/settings/organizations/${organizationId}`)}
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
              disabled={saving}
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Organization</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Are you sure you want to delete <span className="font-semibold">{organization.name}</span>?
              </p>
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    This will permanently delete the organization, all its users, and associated data.
                    This action is irreversible.
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrganization}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusChangeConfirm && newStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-xl ${
                newStatus === 'active' ? 'bg-green-100 dark:bg-green-500/20' :
                newStatus === 'suspended' ? 'bg-amber-100 dark:bg-amber-500/20' :
                'bg-gray-100 dark:bg-gray-700'
              }`}>
                {newStatus === 'active' && <Play className="h-6 w-6 text-green-600 dark:text-green-400" />}
                {newStatus === 'suspended' && <Ban className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                {newStatus === 'inactive' && <Pause className="h-6 w-6 text-gray-600 dark:text-gray-400" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {newStatus} Organization
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {newStatus === 'active' && 'This will restore access for all users'}
                  {newStatus === 'suspended' && 'This will temporarily disable access for all users'}
                  {newStatus === 'inactive' && 'This will deactivate the organization'}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                Are you sure you want to change status to <span className="font-semibold capitalize">{newStatus}</span>?
              </p>
              
              {newStatus === 'suspended' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Reason for suspension
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="e.g., Payment overdue, policy violation..."
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                    rows={3}
                  />
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusChangeConfirm(false);
                  setNewStatus(null);
                  setStatusReason('');
                }}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className={`px-4 py-2.5 text-white rounded-xl font-medium shadow-md ${
                  newStatus === 'active' ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' :
                  newStatus === 'suspended' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700' :
                  'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                }`}
              >
                Confirm {newStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}