'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Settings, ArrowLeft, Save, X, Loader2,
  Tag, AlertTriangle, FileText, Plus, Trash2,
  Wrench, Shield, Zap, Search, CheckCircle,
  ChevronDown, AlertCircle
} from 'lucide-react';
import { serviceService, Service, UpdateServiceData, SERVICE_TYPES } from '@/services/serviceService';
import { useToast } from '@/contexts/ToastContext';

interface ServiceEditProps {
  serviceId: string;
}

// Define proper types for form data
type ServiceType = 'repair' | 'maintenance' | 'inspection' | 'installation' | 'custom';
type ServiceStatus = 'active' | 'inactive' | 'discontinued';

interface ServiceFormData {
  name: string;
  description: string;
  type: ServiceType;
  status: ServiceStatus;
  tags: string[];
  newTag: string;
  internalNotes: string;
  serviceNotes: string[];
  newServiceNote: string;
}

export default function ServiceEdit({ serviceId }: ServiceEditProps) {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    type: 'custom',
    status: 'active',
    tags: [],
    newTag: '',
    internalNotes: '',
    serviceNotes: [],
    newServiceNote: ''
  });

  const serviceTypes = [
    { value: 'repair' as ServiceType, label: 'Repair', icon: Wrench, color: 'bg-orange-100 text-orange-700' },
    { value: 'maintenance' as ServiceType, label: 'Maintenance', icon: Settings, color: 'bg-blue-100 text-blue-700' },
    { value: 'inspection' as ServiceType, label: 'Inspection', icon: Search, color: 'bg-purple-100 text-purple-700' },
    { value: 'installation' as ServiceType, label: 'Installation', icon: Shield, color: 'bg-green-100 text-green-700' },
    { value: 'custom' as ServiceType, label: 'Custom', icon: Zap, color: 'bg-indigo-100 text-indigo-700' },
  ];

  const statusOptions = [
    { value: 'active' as ServiceStatus, label: 'Active', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { value: 'inactive' as ServiceStatus, label: 'Inactive', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'discontinued' as ServiceStatus, label: 'Discontinued', icon: X, color: 'bg-red-100 text-red-700' },
  ];

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchService(params.id as string);
    }
  }, [params.id]);

  const fetchService = async (id: string) => {
    try {
      setLoading(true);
      const data = await serviceService.getServiceById(id);
      setService(data);
      
      setFormData({
        name: data.name,
        description: data.description,
        type: data.type,
        status: data.status,
        tags: data.tags || [],
        newTag: '',
        internalNotes: data.internalNotes || '',
        serviceNotes: data.serviceNotes || [],
        newServiceNote: ''
      });
    } catch (error) {
      console.error('Error fetching service:', error);
      showToast('Failed to load service', 'error');
      router.push('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type' || name === 'status') {
      // For type and status, we need to assert the type
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as ServiceType | ServiceStatus 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeSelect = (type: ServiceType) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleStatusSelect = (status: ServiceStatus) => {
    setFormData(prev => ({ ...prev, status }));
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

  const handleAddServiceNote = () => {
    if (formData.newServiceNote.trim()) {
      setFormData(prev => ({
        ...prev,
        serviceNotes: [...prev.serviceNotes, prev.newServiceNote.trim()],
        newServiceNote: ''
      }));
    }
  };

  const handleRemoveServiceNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      serviceNotes: prev.serviceNotes.filter((_, i) => i !== index)
    }));
  };

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
      setSaving(true);
      
      const updateData: UpdateServiceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        status: formData.status,
        tags: formData.tags,
        internalNotes: formData.internalNotes.trim() || undefined,
        serviceNotes: formData.serviceNotes
      };
      
      await serviceService.updateService(serviceId, updateData);
      showToast('Service updated successfully!', 'success');
      router.push(`/services/${serviceId}`);
      
    } catch (error) {
      console.error('Error updating service:', error);
      showToast('Failed to update service', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/services/${serviceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-blue-800 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Service</h1>
                <p className="text-gray-200 text-sm">Editing: {service.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-white text-white font-semibold rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* Basic Information */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Code (Read-only)
                  </label>
                  <input
                    type="text"
                    value={service.serviceCode}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Service code cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Service Type & Status */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Service Type *</h3>
                  <div className="space-y-2">
                    {serviceTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeSelect(type.value)}
                          className={`w-full px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                            formData.type === type.value
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${type.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Service Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Service Status *</h3>
                  <div className="space-y-2">
                    {statusOptions.map((status) => {
                      const Icon = status.icon;
                      return (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => handleStatusSelect(status.value)}
                          className={`w-full px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                            formData.status === status.value
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${status.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{status.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Disclaimer) *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors resize-none"
                required
              />
              <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  Include clear disclaimers about risks, requirements, and limitations. Use the ⚠️ symbol for emphasis.
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
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
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
                  <p className="text-sm">No tags added</p>
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

            {/* Service Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Notes
              </label>
              
              <div className="space-y-3 mb-3">
                {formData.serviceNotes.map((note, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{note}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceNote(index)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.newServiceNote}
                  onChange={(e) => setFormData(prev => ({ ...prev, newServiceNote: e.target.value }))}
                  placeholder="Add a service note..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddServiceNote())}
                />
                <button
                  type="button"
                  onClick={handleAddServiceNote}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </div>
    </div>
  );
}
