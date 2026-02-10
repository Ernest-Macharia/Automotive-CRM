// components/services/ServiceCreate.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, ArrowLeft, Save, Plus, Trash2,
  Loader2, Tag, AlertTriangle, FileText,
  Wrench, Shield, Zap, Search, CheckCircle
} from 'lucide-react';
import { serviceService, CreateServiceData, SERVICE_TYPES } from '@/services/serviceService';
import { useToast } from '@/contexts/ToastContext';

interface FormData {
  serviceCode: string;
  name: string;
  description: string;
  type: 'repair' | 'maintenance' | 'inspection' | 'installation' | 'custom';
  tags: string[];
  newTag: string;
  internalNotes: string;
  status: 'active' | 'inactive';
}

export default function ServiceCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    serviceCode: '',
    name: '',
    description: '',
    type: 'custom',
    tags: [],
    newTag: '',
    internalNotes: '',
    status: 'active'
  });

  const serviceTypes = [
    { value: 'repair', label: 'Repair', icon: Wrench, color: 'bg-orange-100 text-orange-700', description: 'Fix or restore to working condition' },
    { value: 'maintenance', label: 'Maintenance', icon: Settings, color: 'bg-blue-100 text-blue-700', description: 'Routine upkeep and preventive care' },
    { value: 'inspection', label: 'Inspection', icon: Search, color: 'bg-purple-100 text-purple-700', description: 'Diagnostic and assessment services' },
    { value: 'installation', label: 'Installation', icon: Shield, color: 'bg-green-100 text-green-700', description: 'Setup and configuration services' },
    { value: 'custom', label: 'Custom', icon: Zap, color: 'bg-indigo-100 text-indigo-700', description: 'Tailored or specialized services' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (type: FormData['type']) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleAddTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const RequiredField = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Service name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    
    if (errors.length > 0) {
      showToast(errors.join('. '), 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const createData: CreateServiceData = {
        // serviceCode: formData.serviceCode.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        tags: formData.tags,
        internalNotes: formData.internalNotes.trim() || undefined
      };
      
      const newService = await serviceService.createService(createData);
      showToast('Service created successfully!', 'success');
      
      router.push(`/services/${newService._id}`);
      
    } catch (error: any) {
      console.error('Error creating service:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create service: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/services');
  };

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
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Service</h1>
                <p className="text-blue-100 text-sm">
                  Add a new service to your catalog
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
                className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Service
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
            {/* Service Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">     
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name <RequiredField />
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Oil Change Service"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Service Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Type <RequiredField />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {serviceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeSelect(type.value as FormData['type'])}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`p-3 rounded-lg ${type.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-800">{type.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Disclaimer) <RequiredField />
              </label>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter service description including any disclaimers. Example: 'Disclaimer: This service requires proper tools and trained personnel. Customer assumes all risks.'"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                  required
                />
                <div className="absolute bottom-2 right-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        description: prev.description + ' ⚠️ Disclaimer: This service requires proper tools and trained personnel.'
                      }));
                    }}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    Add Disclaimer
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  <strong>Important:</strong> Include clear disclaimers about risks, requirements, and limitations. Use the ⚠️ symbol for emphasis.
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={formData.newTag}
                  onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag (e.g., quick-service, monthly-special)"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {formData.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <Tag className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No tags added. Add tags to help categorize and search for this service.</p>
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Add internal notes, special instructions, or reminders for your team..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes are only visible to your team, not to customers.
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
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Service...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Service
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