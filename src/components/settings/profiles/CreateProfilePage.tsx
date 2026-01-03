'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Building,
  FileText,
  Users,
  Shield,
  CreditCard,
  Globe,
  Car,
  Stethoscope,
  Check,
  X,
  UserPlus,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { profileService, CreateProfileData, EmergencyContact } from '@/services/settings/profileService';
import { userService } from '@/services/settings/userService';

interface FormData extends Omit<CreateProfileData, 'emergencyContacts' | 'governmentDocuments'> {
  userId: string;
  emergencyContacts: EmergencyContact[];
  governmentDocuments: [];
  active: boolean;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CreateProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [formStep, setFormStep] = useState(1);
  
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    nationality: '',
    citizenship: '',
    employeeId: '',
    position: '',
    department: '',
    dateStarted: '',
    contractType: 'Permanent',
    contractStartDate: '',
    contractEndDate: '',
    reportingManager: '',
    employmentStatus: 'Active',
    personalPhone: '',
    workPhone: '',
    personalEmail: '',
    residentialAddress: '',
    postalAddress: '',
    county: '',
    subCounty: '',
    estate: '',
    governmentDocuments: [],
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    emergencyContacts: [],
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: '',
    nextOfKinAddress: '',
    maritalStatus: '',
    spouseName: '',
    childrenCount: 0,
    skills: [],
    qualifications: [],
    certifications: [],
    languages: [],
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSkill, setNewSkill] = useState('');
  const [newEmergencyContact, setNewEmergencyContact] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    address: '',
  });
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await userService.getAllUsers();
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name || 'Unnamed User',
        email: user.email,
        role: (user.role as string) || 'user', // Cast to string
      }));
      
      setAvailableUsers(formattedUsers);
      setUsersLoaded(true);
      
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
      setAvailableUsers([]);
      setUsersLoaded(true);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayInputChange = (field: keyof FormData, value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      const currentSkills = formData.skills || [];
      const skills = [...currentSkills, newSkill.trim()];
      setFormData(prev => ({ ...prev, skills }));
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    const currentSkills = formData.skills || [];
    const skills = [...currentSkills];
    skills.splice(index, 1);
    setFormData(prev => ({ ...prev, skills }));
  };

  const addEmergencyContact = () => {
    if (newEmergencyContact.name && newEmergencyContact.phoneNumber && newEmergencyContact.relationship) {
      const contacts = [...formData.emergencyContacts, { ...newEmergencyContact }];
      setFormData(prev => ({ ...prev, emergencyContacts: contacts }));
      setNewEmergencyContact({
        name: '',
        relationship: '',
        phoneNumber: '',
        email: '',
        address: '',
      });
      setShowEmergencyForm(false);
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
    
    if (formStep === 1) {
      if (!formData.firstName?.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName?.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      }
      if (!formData.employeeId?.trim()) {
        newErrors.employeeId = 'Employee ID is required';
      }
      if (!formData.position?.trim()) {
        newErrors.position = 'Position is required';
      }
      if (!formData.department?.trim()) {
        newErrors.department = 'Department is required';
      }
      if (!formData.dateStarted) {
        newErrors.dateStarted = 'Date started is required';
      }
      if (!formData.personalPhone?.trim()) {
        newErrors.personalPhone = 'Personal phone is required';
      }
      if (!formData.personalEmail?.trim()) {
        newErrors.personalEmail = 'Personal email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail)) {
        newErrors.personalEmail = 'Please enter a valid email address';
      }
      if (!formData.residentialAddress?.trim()) {
        newErrors.residentialAddress = 'Residential address is required';
      }
    }
    
    if (formStep === 2 && !formData.userId) {
      newErrors.userId = 'Please select a user account';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Format dates properly
      const formatDateForAPI = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      const profileData: CreateProfileData = {
        firstName: formData.firstName?.trim() || '',
        middleName: formData.middleName?.trim(),
        lastName: formData.lastName?.trim() || '',
        dateOfBirth: formatDateForAPI(formData.dateOfBirth as string),
        gender: formData.gender,
        nationality: formData.nationality,
        citizenship: formData.citizenship,
        employeeId: formData.employeeId?.trim() || '',
        position: formData.position?.trim() || '',
        department: formData.department?.trim() || '',
        dateStarted: formatDateForAPI(formData.dateStarted as string),
        contractType: formData.contractType,
        contractStartDate: formData.contractStartDate ? formatDateForAPI(formData.contractStartDate as string) : undefined,
        contractEndDate: formData.contractEndDate ? formatDateForAPI(formData.contractEndDate as string) : undefined,
        reportingManager: formData.reportingManager,
        employmentStatus: formData.employmentStatus,
        personalPhone: formData.personalPhone?.trim() || '',
        workPhone: formData.workPhone?.trim(),
        personalEmail: formData.personalEmail?.trim(),
        residentialAddress: formData.residentialAddress?.trim() || '', // Fixed here
        postalAddress: formData.postalAddress?.trim(),
        county: formData.county,
        subCounty: formData.subCounty,
        estate: formData.estate,
        governmentDocuments: formData.governmentDocuments,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankBranch: formData.bankBranch,
        emergencyContacts: formData.emergencyContacts,
        nextOfKinName: formData.nextOfKinName,
        nextOfKinRelationship: formData.nextOfKinRelationship,
        nextOfKinPhone: formData.nextOfKinPhone,
        nextOfKinAddress: formData.nextOfKinAddress,
        maritalStatus: formData.maritalStatus,
        spouseName: formData.spouseName,
        childrenCount: formData.childrenCount,
        skills: (formData.skills || []).length > 0 ? formData.skills : undefined, // Fixed here
        qualifications: (formData.qualifications || []).length > 0 ? formData.qualifications : undefined, // Fixed here
        certifications: (formData.certifications || []).length > 0 ? formData.certifications : undefined, // Fixed here
        languages: (formData.languages || []).length > 0 ? formData.languages : undefined, // Fixed here
      };
      
      console.log('Creating profile with data:', profileData);
      console.log('For user ID:', formData.userId);
      
      const newProfile = await profileService.createProfile(formData.userId, profileData);
      
      showToast('Profile created successfully!', 'success');
      
      setTimeout(() => {
        router.push('/settings/profiles');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error creating profile:', error);
      
      let errorMessage = 'Failed to create profile';
      
      if (error.message) {
        errorMessage = error.message;
        
        if (error.message.includes('already exists')) {
          errorMessage = 'A profile with this employee ID already exists';
        } else if (error.message.includes('Invalid user')) {
          errorMessage = 'Selected user does not exist or is invalid';
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = 'Please check all required fields are filled correctly';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'You do not have permission to create profiles';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateForm()) {
      setFormStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setFormStep(prev => prev - 1);
  };

  const departments = [
    'Human Resources',
    'Engineering',
    'Sales',
    'Marketing',
    'Finance',
    'Operations',
    'Customer Support',
    'IT',
    'Research & Development',
    'Administration'
  ];

  const positions = [
    'Software Engineer',
    'Product Manager',
    'Sales Executive',
    'Marketing Specialist',
    'HR Manager',
    'Finance Analyst',
    'Operations Manager',
    'Customer Support Representative',
    'System Administrator',
    'Research Scientist'
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings/profiles')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Profile</h1>
              <p className="text-gray-600 mt-1">Add a new employee profile</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                formStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {formStep > step ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-20 h-1 mx-2 ${
                  formStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
          <div className="text-sm text-gray-600">
            Step {formStep} of 3
          </div>
        </div>
      </div>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {/* Step 1: Basic Info */}
        {formStep === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Personal Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Middle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth as string}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kenyan"
                  />
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Employment Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.employeeId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="EMP001"
                  />
                  {errors.employeeId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.employeeId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.position ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Position</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                  {formData.position === 'other' && (
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                      placeholder="Enter custom position"
                    />
                  )}
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.position}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.department ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                  {formData.department === 'other' && (
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                      placeholder="Enter custom department"
                    />
                  )}
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.department}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Started *
                  </label>
                  <input
                    type="date"
                    value={formData.dateStarted as string}
                    onChange={(e) => handleInputChange('dateStarted', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.dateStarted ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateStarted && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dateStarted}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.personalPhone}
                    onChange={(e) => handleInputChange('personalPhone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.personalPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+254 700 000 000"
                  />
                  {errors.personalPhone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.personalPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Email *
                  </label>
                  <input
                    type="email"
                    value={formData.personalEmail || ''}
                    onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.personalEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="john.doe@example.com"
                  />
                  {errors.personalEmail && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.personalEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.workPhone || ''}
                    onChange={(e) => handleInputChange('workPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+254 700 000 000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Residential Address *
                  </label>
                  <textarea
                    value={formData.residentialAddress}
                    onChange={(e) => handleInputChange('residentialAddress', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.residentialAddress ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={3}
                    placeholder="Street address, building, apartment"
                  />
                  {errors.residentialAddress && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.residentialAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Account & Additional Info */}
        {formStep === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Account & Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Account */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">User Account</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link to User Account *
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.userId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!usersLoaded}
                  >
                    <option value="">Select User Account</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {!usersLoaded && (
                    <p className="text-sm text-gray-500 mt-1">Loading users...</p>
                  )}
                  {errors.userId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.userId}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Select the user account this profile will be linked to
                  </p>
                </div>

                {/* Address Information */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Address Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Address
                    </label>
                    <textarea
                      value={formData.postalAddress || ''}
                      onChange={(e) => handleInputChange('postalAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="P.O. Box"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        County
                      </label>
                      <input
                        type="text"
                        value={formData.county || ''}
                        onChange={(e) => handleInputChange('county', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nairobi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub-County
                      </label>
                      <input
                        type="text"
                        value={formData.subCounty || ''}
                        onChange={(e) => handleInputChange('subCounty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Westlands"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract & Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Contract & Status</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Type
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => handleInputChange('contractType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Probation">Probation</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Start
                    </label>
                    <input
                      type="date"
                      value={formData.contractStartDate as string || ''}
                      onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract End
                    </label>
                    <input
                      type="date"
                      value={formData.contractEndDate as string || ''}
                      onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Status
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="active" className="text-sm text-gray-700">
                      Active Profile
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Emergency Contacts</h4>
                <button
                  type="button"
                  onClick={() => setShowEmergencyForm(!showEmergencyForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Plus className="h-4 w-4" />
                  Add Contact
                </button>
              </div>

              {showEmergencyForm && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-gray-900 mb-3">New Emergency Contact</h5>
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={newEmergencyContact.address}
                        onChange={(e) => setNewEmergencyContact(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={2}
                        placeholder="Physical address"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowEmergencyForm(false)}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addEmergencyContact}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Contact
                    </button>
                  </div>
                </div>
              )}

              {formData.emergencyContacts.length > 0 ? (
                <div className="space-y-2">
                  {formData.emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
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
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {formStep === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Review & Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Skills & Languages</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  {formData.skills && formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Languages
                  </label>
                  <input
                    type="text"
                    value={(formData.languages || []).join(', ')}
                    onChange={(e) => handleArrayInputChange('languages', e.target.value.split(', ').filter(Boolean))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="English, Swahili, French"
                  />
                </div>
              </div>

              {/* Bank & Family */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Bank & Family Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Equity Bank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    value={formData.bankBranch || ''}
                    onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Westlands Branch"
                  />
                </div>
              </div>
            </div>

            {/* Review Summary */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Review Summary</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Employee Name</p>
                    <p className="font-medium text-gray-900">
                      {formData.firstName} {formData.middleName} {formData.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Employee ID</p>
                    <p className="font-medium text-gray-900">{formData.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Position</p>
                    <p className="font-medium text-gray-900">{formData.position}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Department</p>
                    <p className="font-medium text-gray-900">{formData.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Date Started</p>
                    <p className="font-medium text-gray-900">{formData.dateStarted as string}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <p className="font-medium text-green-600">{formData.active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          {formStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/settings/profiles')}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}

          {formStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700"
            >
              Next
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Profile
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}