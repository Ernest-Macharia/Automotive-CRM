'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Building, Target, MapPin, Calendar, FileText, Check, Loader2, Sparkles, CreditCard, Tag, Users } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { leadService, CreateLeadData } from '@/services/leadService';
import CreateLeadConfirmationModal from '@/components/leads/CreateLeadConfirmationModal';

interface CreateLeadFormProps {
  opportunityId?: string;
}

export default function CreateLeadForm({ opportunityId }: CreateLeadFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [formData, setFormData] = useState<CreateLeadData>({
    // Required fields
    name: '',
    email: '',
    phone: '',
    source: 'website',
    type: 'individual',
    status: 'new',
    
    // Optional but important fields
    firstName: '',
    lastName: '',
    company: '',
    notes: '',
    address: '',
    city: '',
    stage: 'new',
    sourceDetails: '',
    prospectingReason: '',
    gender: '',
    purposeOfEnquiry: '',
    interestLevel: 'medium',
    vehicleOfInterest: '',
    budgetRange: '',
    customerSegment: 'b2c',
    branch: '',
    nationalId: '',
    
    ...(opportunityId && { opportunityId }),
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateLeadData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Auto-generate full name from first and last name
    if (field === 'firstName' || field === 'lastName') {
      const firstName = field === 'firstName' ? value : formData.firstName;
      const lastName = field === 'lastName' ? value : formData.lastName;
      setFormData(prev => ({
        ...prev,
        name: `${firstName || ''} ${lastName || ''}`.trim()
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Backend required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.source) {
      newErrors.source = 'Lead source is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Lead type is required';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    
    // Show confirmation modal
    setShowConfirmation(true);
  };

  const handleCreateLead = async () => {
    setLoading(true);
    
    try {
      const finalData: CreateLeadData = {
        ...formData,
        // Ensure required fields have values
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        source: formData.source,
        type: formData.type,
        status: formData.status,
        // Clean up optional fields
        company: formData.company?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        stage: formData.stage || 'new',
        sourceDetails: formData.sourceDetails?.trim() || undefined,
        prospectingReason: formData.prospectingReason?.trim() || undefined,
        gender: formData.gender?.trim() || undefined,
        purposeOfEnquiry: formData.purposeOfEnquiry?.trim() || undefined,
        interestLevel: formData.interestLevel || 'medium',
        vehicleOfInterest: formData.vehicleOfInterest?.trim() || undefined,
        budgetRange: formData.budgetRange?.trim() || undefined,
        customerSegment: formData.customerSegment || 'b2c',
        branch: formData.branch?.trim() || undefined,
        nationalId: formData.nationalId?.trim() || undefined,
      };
      
      const createdLead = await leadService.createLead(finalData);
      
      setShowConfirmation(false);
      showToast('Lead created successfully!', 'success');
      
      // Redirect to the new lead's page
      router.push(`/leads/details?id=${createdLead._id}`);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      showToast(
        error.message || 'Failed to create lead. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmation = () => {
    if (!loading) {
      setShowConfirmation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                disabled={loading}
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Create New Lead</h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Add a new lead to your CRM pipeline
                    {opportunityId && ' (from opportunity)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Required Information Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 via-blue-100/30 to-purple-50/20">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Required Information *
              </h2>
              <p className="text-sm text-gray-600 mt-1">These fields are required for lead creation</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                    disabled={loading}
                  />
                  <div className="text-xs text-gray-500">
                    Or fill first & last name below
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="john.doe@example.com"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+254712345678"
                    disabled={loading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
                
                {/* Lead Source */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Lead Source *
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.source ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="email">Email Campaign</option>
                    <option value="event">Event/Trade Show</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.source && (
                    <p className="text-sm text-red-600">{errors.source}</p>
                  )}
                </div>
                
                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Lead Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="individual"
                        checked={formData.type === 'individual'}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="text-gray-700">Individual</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="organization"
                        checked={formData.type === 'organization'}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                        disabled={loading}
                      />
                      <span className="text-gray-700">Organization</span>
                    </label>
                  </div>
                  {errors.type && (
                    <p className="text-sm text-red-600">{errors.type}</p>
                  )}
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.status ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <option value="new">New</option>
                    <option value="attempted_to_contact">Attempted to Contact</option>
                    <option value="prospecting">Prospecting</option>
                    <option value="appointment_scheduled">Appointment Scheduled</option>
                    <option value="non_progressive">Non Progressive</option>
                    <option value="lost">Lost</option>
                    <option value="won">Won</option>
                  </select>
                  {errors.status && (
                    <p className="text-sm text-red-600">{errors.status}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-purple-50/50 via-purple-100/30 to-blue-50/20">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Additional Information
              </h2>
              <p className="text-sm text-gray-600 mt-1">Optional but helpful details for better lead management</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John"
                    disabled={loading}
                  />
                </div>
                
                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Doe"
                    disabled={loading}
                  />
                </div>
                
                {/* Company */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-500" />
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Acme Corporation"
                    disabled={loading}
                  />
                </div>
                
                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="123 Main Street"
                      disabled={loading}
                    />
                  </div>
                  
                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nairobi"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Lead Details */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Lead Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Source Details */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Source Details
                    </label>
                    <input
                      type="text"
                      value={formData.sourceDetails || ''}
                      onChange={(e) => handleInputChange('sourceDetails', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Google Ads, LinkedIn Post"
                      disabled={loading}
                    />
                  </div>
                  
                  {/* Prospecting Reason */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Prospecting Reason
                    </label>
                    <input
                      type="text"
                      value={formData.prospectingReason || ''}
                      onChange={(e) => handleInputChange('prospectingReason', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Why are you prospecting this lead?"
                      disabled={loading}
                    />
                  </div>
                  
                  {/* Purpose of Enquiry */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Purpose of Enquiry
                    </label>
                    <input
                      type="text"
                      value={formData.purposeOfEnquiry || ''}
                      onChange={(e) => handleInputChange('purposeOfEnquiry', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Personal use, Business fleet"
                      disabled={loading}
                    />
                  </div>
                  
                  {/* Vehicle of Interest */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Vehicle of Interest
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleOfInterest || ''}
                      onChange={(e) => handleInputChange('vehicleOfInterest', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Toyota Camry 2023"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Budget Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      value={formData.budgetRange || ''}
                      onChange={(e) => handleInputChange('budgetRange', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., $30,000 - $40,000"
                      disabled={loading}
                    />
                  </div>
                  
                  {/* Interest Level */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Interest Level
                    </label>
                    <select
                      value={formData.interestLevel || 'medium'}
                      onChange={(e) => handleInputChange('interestLevel', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={loading}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Add any additional notes about this lead..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <CreateLeadConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        onConfirm={handleCreateLead}
        formData={formData}
        loading={loading}
      />
    </div>
  );
}