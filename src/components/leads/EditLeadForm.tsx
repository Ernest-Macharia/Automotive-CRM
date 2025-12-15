'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Trash2,
  Loader2, AlertCircle, Sparkles,
  Check
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { leadService, Lead, CreateLeadData } from '@/services/leadService';
import DeleteModal from '@/components/leads/DeleteModal';

interface EditLeadFormProps {
  leadId: string;
  onBack: () => void;
  onSave: () => void;
}

export default function EditLeadForm({ leadId, onBack, onSave }: EditLeadFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<Partial<CreateLeadData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const data = await leadService.getLeadById(leadId);
      setLead(data);
      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: data.source,
        type: data.type,
        status: data.status,
        companyName: data.companyName,
        notes: data.notes,
        address: data.address,
        city: data.city,
        stage: data.stage,
        sourceDetails: data.sourceDetails,
        prospectingReason: data.prospectingReason,
        gender: data.gender,
        leadOwner: data.leadOwner,
      });
    } catch (error) {
      console.error('Failed to fetch lead:', error);
      showToast('Failed to load lead data', 'error');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateLeadData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      await leadService.updateLead(leadId, formData);
      showToast('Lead updated successfully!', 'success');
      onSave();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      showToast(
        error.message || 'Failed to update lead. Please try again.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await leadService.deleteLead(leadId);
      showToast('Lead deleted successfully!', 'success');
      setShowDeleteModal(false);
      router.push('/leads');
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      showToast(
        error.message || 'Failed to delete lead. Please try again.',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Gradient Header */}
      <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Edit Lead</h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Editing: {lead.name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50"
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
      </div>

      {/* Main Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Basic Information Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 via-blue-100/30 to-purple-50/20">
              <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
              <p className="text-sm text-gray-600 mt-1">Primary contact details</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
                
                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Acme Corporation"
                  />
                </div>
                
                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Type
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
                      />
                      <span className="text-gray-700">Organization</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100/50 bg-gradient-to-r from-purple-50/50 via-purple-100/30 to-blue-50/20">
              <h2 className="text-lg font-semibold text-gray-800">Lead Details</h2>
              <p className="text-sm text-gray-600 mt-1">Classification and source information</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lead Source */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Lead Source
                  </label>
                  <select
                    value={formData.source || ''}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="email">Email Campaign</option>
                    <option value="event">Event/Trade Show</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Status
                    </label>
                    <select
                        value={formData.status || ''}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                        <option value="new">New</option>
                        <option value="attempted_to_contact">Attempted to Contact</option>
                        <option value="prospecting">Prospecting</option>
                        <option value="appointment_scheduled">Appointment Scheduled</option>
                        <option value="non_progressive">Non Progressive</option>
                        <option value="lost">Lost</option>
                        <option value="won">Won</option>
                    </select>
                </div>
                
                {/* Stage */}
                <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Stage
                </label>
                <select
                    value={formData.status || ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                    <option value="new">New</option>
                    <option value="attempted_to_contact">Attempted to Contact</option>
                    <option value="prospecting">Prospecting</option>
                    <option value="appointment_scheduled">Appointment Scheduled</option>
                    <option value="non_progressive">Non Progressive</option>
                    <option value="lost">Lost</option>
                    <option value="won">Won</option>
                </select>
                </div>
                
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
                    placeholder="e.g., LinkedIn Ad, Google Search"
                  />
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
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        description="Are you sure you want to delete this lead?"
        itemName={lead.name}
        loading={deleting}
      />
    </div>
  );
}