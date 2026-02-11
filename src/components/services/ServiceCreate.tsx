// components/services/ServiceCreate.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, ArrowLeft, Save, Plus, Trash2,
  Loader2, Tag, AlertTriangle, FileText,
  Wrench, Shield, Zap, Search, CheckCircle,
  Info, AlertCircle, Hash, ClipboardCheck
} from 'lucide-react';
import { serviceService, CreateServiceData, SERVICE_TYPES } from '@/services/serviceService';
import { useToast } from '@/contexts/ToastContext';

interface FormData {
  serviceCode: string; // Added if required
  name: string;
  description: string; // For opportunities
  type: 'repair' | 'maintenance' | 'inspection' | 'installation' | 'custom';
  tags: string[];
  newTag: string;
  internalNotes: string; // Repurposed for Must-Know/Pre-checklist info
  status: 'active' | 'inactive';
}

export default function ServiceCreate() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    serviceCode: '', // Added if required
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

  // Generate a default service code based on timestamp
  const generateServiceCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SVC-${timestamp}-${randomChars}`;
  };

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
    
    // Add serviceCode validation if required
    // if (!formData.serviceCode.trim()) errors.push('Service Code is required');
    
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
        serviceCode: formData.serviceCode.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(), // For opportunities
        type: formData.type,
        tags: formData.tags,
        internalNotes: formData.internalNotes.trim() || undefined // For pre-checklists
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="serviceCode"
                    value={formData.serviceCode}
                    onChange={handleChange}
                    placeholder="Enter service code"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, serviceCode: generateServiceCode() }))}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Unique identifier for this service</p>
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

            {/* Service Description - For Opportunities */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Service Description <RequiredField />
                </label>
              </div>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe what this service includes, what it does, and what customers can expect. This description appears when creating opportunities.

Example: 'This service includes changing the engine oil, replacing the oil filter, and performing a basic engine inspection to ensure optimal vehicle performance.'"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                  required
                />
                <div className="absolute bottom-2 right-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        description: prev.description + ' This service helps improve engine performance and longevity.'
                      }));
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Add Benefit
                  </button>
                </div>
              </div>
            </div>

            {/* Must-Know Information & Disclaimers - For Pre-Checklists (using internalNotes) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Must-Know Information
                </label>
              </div>
              <div className="relative">
                <textarea
                  name="internalNotes"
                  value={formData.internalNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Include important information that technicians need during pre-checklists, such as:
                    • Requirements to check before starting
                    • Safety warnings and precautions
                    • Special tools or equipment needed
                    • Customer requirements or preparations
                    • Time estimates and procedures
                    • Quality standards and checkpoints"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        internalNotes: prev.internalNotes + '• Check customer requirements\n'
                      }));
                    }}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    Add Requirement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        internalNotes: prev.internalNotes + '⚠️ Safety warning: \n'
                      }));
                    }}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Add Safety
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        internalNotes: prev.internalNotes + '⏰ Estimated time: \n'
                      }));
                    }}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Add Time
                  </button>
                </div>
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