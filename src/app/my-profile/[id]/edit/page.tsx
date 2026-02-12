// app/my-profile/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { profileService, Profile, EmergencyContact } from '@/services/settings/profileService';

export default function EmployeeProfileEditPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const profileId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    personalPhone: '',
    workPhone: '',
    personalEmail: '',
    residentialAddress: '',
    postalAddress: '',
    county: '',
    subCounty: '',
    emergencyContacts: [] as EmergencyContact[],
    skills: [] as string[],
    languages: [] as string[],
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [newEmergencyContact, setNewEmergencyContact] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    address: '',
  });
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile(profileId);
      
      // Verify this profile belongs to the current user
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const profileUserId = typeof profileData.user === 'string' 
          ? profileData.user 
          : profileData.user?.id;
        
        if (profileUserId !== user.id) {
          setError('You do not have permission to edit this profile');
          return;
        }
      }
      
      setProfile(profileData);
      
      // Populate form with existing data
      setFormData({
        personalPhone: profileData.personalPhone || '',
        workPhone: profileData.workPhone || '',
        personalEmail: profileData.personalEmail || '',
        residentialAddress: profileData.residentialAddress || '',
        postalAddress: profileData.postalAddress || '',
        county: profileData.county || '',
        subCounty: profileData.subCounty || '',
        emergencyContacts: profileData.emergencyContacts || [],
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        bankName: profileData.bankName || '',
        bankAccountNumber: profileData.bankAccountNumber || '',
        bankBranch: profileData.bankBranch || '',
      });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      const skills = [...formData.skills, newSkill.trim()];
      setFormData(prev => ({ ...prev, skills }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    const skills = [...formData.skills];
    skills.splice(index, 1);
    setFormData(prev => ({ ...prev, skills }));
  };

    const addEmergencyContact = async () => {
    if (newEmergencyContact.name && newEmergencyContact.phoneNumber && newEmergencyContact.relationship) {
        try {
        // Use the self-service endpoint for adding emergency contacts
        const updatedProfile = await profileService.addEmergencyContact(newEmergencyContact);
        
        // Update the form data with the new emergency contacts from the response
        setFormData(prev => ({ 
            ...prev, 
            emergencyContacts: updatedProfile.emergencyContacts || [] 
        }));
        
        // Reset the form
        setNewEmergencyContact({
            name: '',
            relationship: '',
            phoneNumber: '',
            email: '',
            address: '',
        });
        setShowEmergencyForm(false);
        
        showToast('Emergency contact added successfully', 'success');
        } catch (error) {
        console.error('Error adding emergency contact:', error);
        showToast('Failed to add emergency contact', 'error');
        }
    } else {
        showToast('Please fill in required fields: Name, Relationship, and Phone Number', 'error');
    }
    };

  const removeEmergencyContact = (index: number) => {
    const contacts = [...formData.emergencyContacts];
    contacts.splice(index, 1);
    setFormData(prev => ({ ...prev, emergencyContacts: contacts }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.personalPhone.trim()) {
      newErrors.personalPhone = 'Personal phone is required';
    }
    
    if (formData.personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail)) {
      newErrors.personalEmail = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    const handleSubmit = async () => {
    if (!validateForm()) {
        showToast('Please fix the errors in the form', 'error');
        return;
    }
    
    setSaving(true);
    
    try {
        const updateData = {
        personalPhone: formData.personalPhone.trim(),
        workPhone: formData.workPhone?.trim() || undefined,
        personalEmail: formData.personalEmail?.trim() || undefined,
        residentialAddress: formData.residentialAddress.trim() || undefined,
        postalAddress: formData.postalAddress?.trim() || undefined,
        county: formData.county?.trim() || undefined,
        subCounty: formData.subCounty?.trim() || undefined,
        emergencyContacts: formData.emergencyContacts.length > 0 ? formData.emergencyContacts : undefined,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        languages: formData.languages.length > 0 ? formData.languages : undefined,
        bankName: formData.bankName?.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
        bankBranch: formData.bankBranch?.trim() || undefined,
        };
        
        // Use the self-service endpoint
        await profileService.updateMyProfile(updateData);
        
        showToast('Profile updated successfully!', 'success');
        
        setTimeout(() => {
        router.push(`/my-profile/${profileId}`);
        }, 1500);
        
    } catch (error: any) {
        console.error('Error updating profile:', error);
        showToast(error.message || 'Failed to update profile', 'error');
    } finally {
        setSaving(false);
    }
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to edit profile</h2>
          <p className="text-gray-600 mb-6">{error || 'Profile not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/my-profile/${profileId}`)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit My Profile</h1>
            <p className="text-gray-600 mt-1">
              Update your personal information and contact details
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.personalPhone}
                  onChange={(e) => handleInputChange('personalPhone', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.personalPhone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+254 700 000 000"
                />
              </div>
              {errors.personalPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.personalPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.workPhone}
                  onChange={(e) => handleInputChange('workPhone', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.personalEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="john.doe@example.com"
                />
              </div>
              {errors.personalEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.personalEmail}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Residential Address
              </label>
              <textarea
                value={formData.residentialAddress}
                onChange={(e) => handleInputChange('residentialAddress', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Street address, building, apartment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                County
              </label>
              <input
                type="text"
                value={formData.county}
                onChange={(e) => handleInputChange('county', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nairobi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-County
              </label>
              <input
                type="text"
                value={formData.subCounty}
                onChange={(e) => handleInputChange('subCounty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Westlands"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
          
          <div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add a skill (e.g., Project Management)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Languages</h2>
          
          <div>
            <input
              type="text"
              value={formData.languages.join(', ')}
              onChange={(e) => handleInputChange('languages', e.target.value.split(', ').filter(Boolean))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="English, Swahili, French"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate languages with commas
            </p>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Emergency Contacts</h2>
            <button
              type="button"
              onClick={() => setShowEmergencyForm(!showEmergencyForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </button>
          </div>

          {showEmergencyForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">New Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newEmergencyContact.name}
                    onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    value={newEmergencyContact.relationship}
                    onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Spouse, Parent, Sibling"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newEmergencyContact.phoneNumber}
                    onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newEmergencyContact.email}
                    onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEmergencyForm(false)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addEmergencyContact}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Contact
                </button>
              </div>
            </div>
          )}

          {formData.emergencyContacts.length > 0 ? (
            <div className="space-y-3">
              {formData.emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-600">
                      {contact.relationship} • {contact.phoneNumber}
                      {contact.email && ` • ${contact.email}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No emergency contacts added yet.</p>
          )}
        </div>

        {/* Bank Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Equity Bank"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Branch
              </label>
              <input
                type="text"
                value={formData.bankBranch}
                onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Westlands Branch"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push(`/my-profile/${profileId}`)}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
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
      </form>
    </div>
  );
}