// app/my-profile/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BanknoteIcon,
  GraduationCap,
  Users,
  FileText,
  CreditCard,
  Globe,
  Car,
  Stethoscope,
  Shield,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { profileService, EmergencyContact, GovernmentDocument } from '@/services/settings/profileService';

export default function EmployeeCreateProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form data for creating a new profile
  const [formData, setFormData] = useState({
    // Personal Information - ALL REQUIRED
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male' as const,
    nationality: '',
    citizenship: '',
    
    // Contact Information - ALL REQUIRED
    personalPhone: '',
    workPhone: '',
    personalEmail: '',
    residentialAddress: '',
    postalAddress: '',
    county: '',
    subCounty: '',
    estate: '',
    
    // Bank Information - Optional
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    
    // Skills & Qualifications - Optional
    skills: [] as string[],
    qualifications: [] as string[],
    certifications: [] as string[],
    languages: [] as string[],
    
    // Emergency Contacts - Optional
    emergencyContacts: [] as EmergencyContact[],
    
    // Government Documents - Optional
    governmentDocuments: [] as GovernmentDocument[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Dynamic form fields
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [newCertification, setNewCertification] = useState('');
  
  const [newEmergencyContact, setNewEmergencyContact] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    address: '',
  });
  
  const [newDocument, setNewDocument] = useState<GovernmentDocument>({
    type: 'id_card',
    number: '',
    expiryDate: '',
    documentUrl: '',
    active: true,
  });
  
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  // Get user from session
  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // Pre-fill from user account
      setFormData(prev => ({
        ...prev,
        personalEmail: userData.email || '',
        firstName: userData.name?.split(' ')[0] || '',
        lastName: userData.name?.split(' ').slice(1).join(' ') || '',
      }));
    }
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Skills
  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Languages
  const addLanguage = () => {
    if (newLanguage.trim()) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  // Qualifications
  const addQualification = () => {
    if (newQualification.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, newQualification.trim()]
      }));
      setNewQualification('');
    }
  };

  const removeQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  // Certifications
  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  // Emergency Contacts
  const addEmergencyContact = () => {
    if (newEmergencyContact.name && newEmergencyContact.phoneNumber && newEmergencyContact.relationship) {
      setFormData(prev => ({
        ...prev,
        emergencyContacts: [...prev.emergencyContacts, { ...newEmergencyContact }]
      }));
      setNewEmergencyContact({
        name: '',
        relationship: '',
        phoneNumber: '',
        email: '',
        address: '',
      });
      setShowEmergencyForm(false);
      showToast('Emergency contact added', 'success');
    } else {
      showToast('Please fill in required fields: Name, Relationship, and Phone Number', 'error');
    }
  };

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
    }));
  };

  // Government Documents
  const addGovernmentDocument = () => {
    if (newDocument.type && newDocument.number) {
      setFormData(prev => ({
        ...prev,
        governmentDocuments: [...prev.governmentDocuments, { ...newDocument }]
      }));
      setNewDocument({
        type: 'id_card',
        number: '',
        expiryDate: '',
        documentUrl: '',
        active: true,
      });
      setShowDocumentForm(false);
      showToast('Document added successfully', 'success');
    } else {
      showToast('Please fill in required fields: Document Type and Number', 'error');
    }
  };

  const removeGovernmentDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      governmentDocuments: prev.governmentDocuments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Personal Information - Required
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    
    // Contact Information - Required
    if (!formData.personalPhone.trim()) newErrors.personalPhone = 'Personal phone is required';
    if (!formData.personalEmail.trim()) {
      newErrors.personalEmail = 'Personal email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail)) {
      newErrors.personalEmail = 'Please enter a valid email address';
    }
    if (!formData.residentialAddress.trim()) newErrors.residentialAddress = 'Residential address is required';
    
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
        // FIXED: Return undefined instead of empty string
        const formatDate = (date: string) => {
        if (!date) return undefined; // ← CRITICAL: return undefined, NOT empty string
        return new Date(date).toISOString().split('T')[0];
        };

        const profileData = {
        // Personal Information
        firstName: formData.firstName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        lastName: formData.lastName.trim(),
        dateOfBirth: formatDate(formData.dateOfBirth), // Now returns undefined when empty
        gender: formData.gender,
        nationality: formData.nationality?.trim() || undefined,
        citizenship: formData.citizenship?.trim() || undefined,
        
        // Contact Information
        personalPhone: formData.personalPhone.trim(),
        workPhone: formData.workPhone?.trim() || undefined,
        personalEmail: formData.personalEmail.trim(),
        residentialAddress: formData.residentialAddress.trim(),
        postalAddress: formData.postalAddress?.trim() || undefined,
        county: formData.county?.trim() || undefined,
        subCounty: formData.subCounty?.trim() || undefined,
        estate: formData.estate?.trim() || undefined,
        
        // Bank Information
        bankName: formData.bankName?.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
        bankBranch: formData.bankBranch?.trim() || undefined,
        
        // Skills & Qualifications
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        qualifications: formData.qualifications.length > 0 ? formData.qualifications : undefined,
        certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
        languages: formData.languages.length > 0 ? formData.languages : undefined,
        
        // Emergency Contacts
        emergencyContacts: formData.emergencyContacts.length > 0 ? formData.emergencyContacts : undefined,
        
        // Government Documents
        governmentDocuments: formData.governmentDocuments.length > 0 ? formData.governmentDocuments : undefined,
        
        active: true,
        };
        
        console.log('Submitting profile data:', JSON.stringify(profileData, null, 2));
        
        const newProfile = await profileService.createProfile(profileData);
        
        showToast('Profile created successfully!', 'success');
        
        setTimeout(() => {
        router.push(`/my-profile/${newProfile.id || newProfile._id}`);
        }, 1500);
        
    } catch (error: any) {
        console.error('Error creating profile:', error);
        
        if (error?.status === 409) {
        showToast('You already have a profile. Redirecting...', 'error');
        router.push('/my-profile');
        } else {
        // Try to get more detailed error message
        const errorMessage = error?.data?.message || error?.message || 'Failed to create profile';
        showToast(errorMessage, 'error');
        }
    } finally {
        setSaving(false);
    }
    };

  const RequiredField = () => <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Your Profile</h1>
            <p className="text-gray-600 mt-1">
              Please provide your personal information to set up your employee profile
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <RequiredField />
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="John"
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Middle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <RequiredField />
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Doe"
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <RequiredField />
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value as 'male' | 'female' | 'other')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Kenyan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Citizenship
              </label>
              <input
                type="text"
                value={formData.citizenship}
                onChange={(e) => handleInputChange('citizenship', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Kenyan"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-gray-500" />
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Phone <RequiredField />
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
              {errors.personalPhone && <p className="mt-1 text-sm text-red-600">{errors.personalPhone}</p>}
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
                Personal Email <RequiredField />
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
              {errors.personalEmail && <p className="mt-1 text-sm text-red-600">{errors.personalEmail}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Residential Address <RequiredField />
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.residentialAddress}
                  onChange={(e) => handleInputChange('residentialAddress', e.target.value)}
                  rows={2}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.residentialAddress ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Street address, building, apartment"
                />
              </div>
              {errors.residentialAddress && <p className="mt-1 text-sm text-red-600">{errors.residentialAddress}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Address
              </label>
              <input
                type="text"
                value={formData.postalAddress}
                onChange={(e) => handleInputChange('postalAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="P.O. Box 12345"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estate
              </label>
              <input
                type="text"
                value={formData.estate}
                onChange={(e) => handleInputChange('estate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Lavington"
              />
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BanknoteIcon className="h-5 w-5 text-gray-500" />
            Bank Information
          </h2>
          <p className="text-sm text-gray-500 mb-4">Optional - for payroll processing</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Skills & Qualifications */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-gray-500" />
            Skills & Qualifications
          </h2>
          <p className="text-sm text-gray-500 mb-4">Optional - add your skills and qualifications</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {skill}
                    <button onClick={() => removeSkill(index)} className="text-blue-700 hover:text-blue-900">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Languages
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a language"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                />
                <button
                  type="button"
                  onClick={addLanguage}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {lang}
                    <button onClick={() => removeLanguage(index)} className="text-green-700 hover:text-green-900">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualifications
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add qualification"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                />
                <button
                  type="button"
                  onClick={addQualification}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.qualifications.map((qual, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {qual}
                    <button onClick={() => removeQualification(index)} className="text-purple-700 hover:text-purple-900">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certifications
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add certification"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <button
                  type="button"
                  onClick={addCertification}
                  className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                    {cert}
                    <button onClick={() => removeCertification(index)} className="text-amber-700 hover:text-amber-900">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              Emergency Contacts
            </h2>
            <button
              type="button"
              onClick={() => setShowEmergencyForm(!showEmergencyForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Optional - add emergency contacts</p>

          {showEmergencyForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">New Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmergencyContact.name}
                    onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmergencyContact.relationship}
                    onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Spouse, Parent, Sibling"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newEmergencyContact.phoneNumber}
                    onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={newEmergencyContact.address}
                    onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Physical address"
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
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Phone className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">
                        {contact.relationship} • {contact.phoneNumber}
                      </p>
                      {contact.email && (
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      )}
                    </div>
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

        {/* Government Documents */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Government Documents
            </h2>
            <button
              type="button"
              onClick={() => setShowDocumentForm(!showDocumentForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Add Document
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Optional - add your identification documents</p>

          {showDocumentForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">New Government Document</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value as GovernmentDocument['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="id_card">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="kra_pin">KRA PIN</option>
                    <option value="nssf">NSSF</option>
                    <option value="nhif">NHIF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDocument.number}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="A12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newDocument.expiryDate as string || ''}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDocumentForm(false)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addGovernmentDocument}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Document
                </button>
              </div>
            </div>
          )}

          {formData.governmentDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.governmentDocuments.map((doc, index) => {
                const getIcon = (type: string) => {
                  switch(type) {
                    case 'id_card': return CreditCard;
                    case 'passport': return Globe;
                    case 'driving_license': return Car;
                    case 'kra_pin': return FileText;
                    case 'nssf': return Shield;
                    case 'nhif': return Stethoscope;
                    default: return FileText;
                  }
                };
                const Icon = getIcon(doc.type);
                
                return (
                  <div key={index} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {doc.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600">Number: {doc.number}</p>
                        {doc.expiryDate && (
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGovernmentDocument(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No government documents added yet.</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}