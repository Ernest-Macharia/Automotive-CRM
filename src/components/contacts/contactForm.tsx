// components/contacts/ContactForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Save,
  X,
  Mail,
  Phone,
  Building,
  FileText,
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { contactService, Contact, CreateContactDto, UpdateContactDto } from '@/services/contactService';
import { useToast } from '@/contexts/ToastContext';

interface ContactFormProps {
  contactId?: string;
  mode: 'create' | 'edit';
}

// Create a type that includes all possible fields for the form
type FormDataType = CreateContactDto | (UpdateContactDto & { active?: boolean });

export default function ContactForm({ contactId, mode }: ContactFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  
  // Initialize with proper type that includes active field
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    type: 'customer',
    notes: '',
    whatsappEnabled: true,
    whatsappStatus: 'active',
    customFields: {},
    active: true, // Add active field with default value
  });

  const typeOptions = [
    { value: 'customer', label: 'Customer', color: 'bg-blue-100 text-blue-800' },
    { value: 'lead', label: 'Lead', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'partner', label: 'Partner', color: 'bg-green-100 text-green-800' },
    { value: 'vendor', label: 'Vendor', color: 'bg-purple-100 text-purple-800' },
    { value: 'employee', label: 'Employee', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    if (mode === 'edit' && contactId) {
      loadContact();
    }
  }, [contactId, mode]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const contactData = await contactService.getContactById(contactId!);
      setContact(contactData);
      setFormData({
        name: contactData.name,
        email: contactData.email || '',
        phone: contactData.phone || '',
        companyName: contactData.companyName || '',
        type: contactData.type || 'customer',
        notes: contactData.notes || '',
        whatsappEnabled: contactData.whatsappEnabled,
        whatsappStatus: contactData.whatsappStatus,
        customFields: contactData.customFields || {},
        active: contactData.active,
      });
    } catch (error) {
      console.error('Error loading contact:', error);
      showToast('Failed to load contact', 'error');
      router.push('/contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use non-null assertion since we know name is required
    if (!formData.name!.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        // For create mode, exclude active field since it's not in CreateContactDto
        const { active, ...createData } = formData;
        const newContact = await contactService.createContact(createData as CreateContactDto);
        showToast('Contact created successfully', 'success');
        router.push(`/contacts/${newContact._id}`);
      } else {
        // For edit mode, include all fields including active
        await contactService.updateContact(contactId!, formData as UpdateContactDto);
        showToast('Contact updated successfully', 'success');
        router.push(`/contacts/${contactId}`);
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      showToast(`Failed to ${mode} contact`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Update the handleChange function to handle all possible fields
  const handleChange = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [field]: value
      }
    }));
  };

  const removeCustomField = (field: string) => {
    const newCustomFields = { ...formData.customFields };
    delete newCustomFields[field];
    setFormData(prev => ({
      ...prev,
      customFields: newCustomFields
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {mode === 'create' ? 'Create New Contact' : 'Edit Contact'}
                </h1>
                <p className="text-blue-100 text-sm">
                  {mode === 'create' ? 'Add a new contact to your CRM' : 'Update contact information'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-white hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2"
            >
              <X className="h-5 w-5" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-xl hover:bg-white/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {saving ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.companyName || ''}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Contact Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {typeOptions.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleChange('type', type.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.type === type.value
                            ? `${type.color} border-2 border-current`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('active', true)}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        (formData as any).active !== false
                          ? 'bg-green-100 text-green-800 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('active', false)}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        (formData as any).active === false
                          ? 'bg-red-100 text-red-800 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <XCircle className="h-5 w-5" />
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Settings Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">WhatsApp Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">WhatsApp Enabled</label>
                      <p className="text-sm text-gray-500">Allow sending WhatsApp messages to this contact</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('whatsappEnabled', !formData.whatsappEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.whatsappEnabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.whatsappEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {formData.whatsappEnabled && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">WhatsApp Status</label>
                      <select
                        value={formData.whatsappStatus || 'active'}
                        onChange={(e) => handleChange('whatsappStatus', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="opted-out">Opted Out</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-6 w-6 text-blue-500" />
                      <div>
                        <h4 className="font-medium text-gray-800">WhatsApp Features</h4>
                        <p className="text-sm text-gray-600">
                          {formData.whatsappEnabled
                            ? 'This contact can receive WhatsApp messages and broadcasts'
                            : 'Enable WhatsApp to send messages and templates'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Notes</h2>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:outline-none min-h-[120px]"
                    placeholder="Add any notes about this contact..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Custom Fields Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Custom Fields</h2>
                <button
                  type="button"
                  onClick={() => {
                    const fieldName = prompt('Enter field name:');
                    if (fieldName) {
                      const value = prompt(`Enter value for ${fieldName}:`);
                      if (value !== null) {
                        handleCustomFieldChange(fieldName, value);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 text-sm font-medium"
                >
                  Add Custom Field
                </button>
              </div>
              
              {formData.customFields && Object.keys(formData.customFields).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(formData.customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">{key}</div>
                        <input
                          type="text"
                          value={String(value)}
                          onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomField(key)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No custom fields added yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add custom fields to store additional information about this contact
                  </p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formData.name!.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : mode === 'create' ? (
                  <>
                    <Save className="h-5 w-5" />
                    Create Contact
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}