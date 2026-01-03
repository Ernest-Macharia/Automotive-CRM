'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  BanknoteIcon,
  Heart,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { profileService, Profile, UpdateProfileData, EmergencyContact, GovernmentDocument } from '@/services/settings/profileService';
import { userService, User as UserType, USER_ROLES } from '@/services/settings/userService';

// Fix the type definitions
interface FormData {
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  citizenship?: string;
  employeeId: string;
  position: string;
  department: string;
  dateStarted?: string;
  contractType?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractDocumentUrl?: string;
  reportingManager?: string;
  employmentStatus?: string;
  personalPhone: string;
  workPhone?: string;
  personalEmail?: string;
  residentialAddress: string;
  postalAddress?: string;
  county?: string;
  subCounty?: string;
  estate?: string;
  governmentDocuments: GovernmentDocument[];
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  emergencyContacts: EmergencyContact[];
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinAddress?: string;
  maritalStatus?: string;
  spouseName?: string;
  childrenCount?: number;
  skills: string[];
  qualifications?: string[];
  certifications?: string[];
  languages: string[];
  active?: boolean;
}

// Fix UserOption type
interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  
  const profileId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Initialize with proper default values for required fields
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
    contractDocumentUrl: '',
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
  const [newGovernmentDocument, setNewGovernmentDocument] = useState<GovernmentDocument>({
    type: 'id_card',
    number: '',
    expiryDate: '',
    documentUrl: '',
    active: true,
  });
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  useEffect(() => {
    if (profileId) {
      loadProfile();
      loadUsers();
    }
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile(profileId);
      setProfile(profileData);
      
      // Format dates for input fields (YYYY-MM-DD)
      const formatDateForInput = (dateString?: string | Date): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Populate form with existing profile data
      setFormData({
        userId: typeof profileData.user === 'string' ? profileData.user : profileData.user?.id || '',
        firstName: profileData.firstName || '',
        middleName: profileData.middleName || '',
        lastName: profileData.lastName || '',
        dateOfBirth: formatDateForInput(profileData.dateOfBirth),
        gender: profileData.gender || 'male',
        nationality: profileData.nationality || '',
        citizenship: profileData.citizenship || '',
        employeeId: profileData.employeeId || '',
        position: profileData.position || '',
        department: profileData.department || '',
        dateStarted: formatDateForInput(profileData.dateStarted),
        contractType: profileData.contractType || 'Permanent',
        contractStartDate: formatDateForInput(profileData.contractStartDate),
        contractEndDate: formatDateForInput(profileData.contractEndDate),
        contractDocumentUrl: profileData.contractDocumentUrl || '',
        reportingManager: typeof profileData.reportingManager === 'string' 
          ? profileData.reportingManager 
          : profileData.reportingManager?.id || '',
        employmentStatus: profileData.employmentStatus || 'Active',
        personalPhone: profileData.personalPhone || '',
        workPhone: profileData.workPhone || '',
        personalEmail: profileData.personalEmail || '',
        residentialAddress: profileData.residentialAddress || '',
        postalAddress: profileData.postalAddress || '',
        county: profileData.county || '',
        subCounty: profileData.subCounty || '',
        estate: profileData.estate || '',
        governmentDocuments: profileData.governmentDocuments || [],
        bankName: profileData.bankName || '',
        bankAccountNumber: profileData.bankAccountNumber || '',
        bankBranch: profileData.bankBranch || '',
        emergencyContacts: profileData.emergencyContacts || [],
        nextOfKinName: profileData.nextOfKinName || '',
        nextOfKinRelationship: profileData.nextOfKinRelationship || '',
        nextOfKinPhone: profileData.nextOfKinPhone || '',
        nextOfKinAddress: profileData.nextOfKinAddress || '',
        maritalStatus: profileData.maritalStatus || '',
        spouseName: profileData.spouseName || '',
        childrenCount: profileData.childrenCount || 0,
        skills: profileData.skills || [],
        qualifications: profileData.qualifications || [],
        certifications: profileData.certifications || [],
        languages: profileData.languages || [],
        active: profileData.active !== false,
      });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile', 'error');
      router.push('/settings/profiles');
    } finally {
      setLoading(false);
    }
  };

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

  const addGovernmentDocument = () => {
    if (newGovernmentDocument.type && newGovernmentDocument.number) {
      const docs = [...formData.governmentDocuments, { ...newGovernmentDocument }];
      setFormData(prev => ({ ...prev, governmentDocuments: docs }));
      setNewGovernmentDocument({
        type: 'id_card',
        number: '',
        expiryDate: '',
        documentUrl: '',
        active: true,
      });
      setShowDocumentForm(false);
    } else {
      showToast('Please fill in required fields: Document Type and Number', 'error');
    }
  };

  const removeGovernmentDocument = (index: number) => {
    const docs = [...formData.governmentDocuments];
    docs.splice(index, 1);
    setFormData(prev => ({ ...prev, governmentDocuments: docs }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }
    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (!formData.dateStarted) {
      newErrors.dateStarted = 'Date started is required';
    }
    if (!formData.personalPhone.trim()) {
      newErrors.personalPhone = 'Personal phone is required';
    }
    if (!formData.personalEmail?.trim()) {
      newErrors.personalEmail = 'Personal email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail)) {
      newErrors.personalEmail = 'Please enter a valid email address';
    }
    if (!formData.residentialAddress.trim()) {
      newErrors.residentialAddress = 'Residential address is required';
    }
    if (!formData.userId) {
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
    
    setSaving(true);
    
    try {
      // Format dates properly
      const formatDateForAPI = (dateString: string): string | undefined => {
        if (!dateString) return undefined;
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      const updateData: UpdateProfileData = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        lastName: formData.lastName.trim(),
        dateOfBirth: formatDateForAPI(formData.dateOfBirth!),
        gender: formData.gender,
        nationality: formData.nationality || undefined,
        citizenship: formData.citizenship || undefined,
        employeeId: formData.employeeId.trim(),
        position: formData.position.trim(),
        department: formData.department.trim(),
        dateStarted: formatDateForAPI(formData.dateStarted!),
        contractType: formData.contractType || undefined,
        contractStartDate: formData.contractStartDate ? formatDateForAPI(formData.contractStartDate) : undefined,
        contractEndDate: formData.contractEndDate ? formatDateForAPI(formData.contractEndDate) : undefined,
        contractDocumentUrl: formData.contractDocumentUrl || undefined,
        reportingManager: formData.reportingManager || undefined,
        employmentStatus: formData.employmentStatus || undefined,
        personalPhone: formData.personalPhone.trim(),
        workPhone: formData.workPhone?.trim() || undefined,
        personalEmail: formData.personalEmail?.trim(),
        residentialAddress: formData.residentialAddress.trim(),
        postalAddress: formData.postalAddress?.trim() || undefined,
        county: formData.county || undefined,
        subCounty: formData.subCounty || undefined,
        estate: formData.estate || undefined,
        governmentDocuments: formData.governmentDocuments.length > 0 ? formData.governmentDocuments : undefined,
        bankName: formData.bankName || undefined,
        bankAccountNumber: formData.bankAccountNumber || undefined,
        bankBranch: formData.bankBranch || undefined,
        emergencyContacts: formData.emergencyContacts.length > 0 ? formData.emergencyContacts : undefined,
        nextOfKinName: formData.nextOfKinName || undefined,
        nextOfKinRelationship: formData.nextOfKinRelationship || undefined,
        nextOfKinPhone: formData.nextOfKinPhone || undefined,
        nextOfKinAddress: formData.nextOfKinAddress || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        spouseName: formData.spouseName || undefined,
        childrenCount: formData.childrenCount || undefined,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        qualifications: formData.qualifications && formData.qualifications.length > 0 ? formData.qualifications : undefined,
        certifications: formData.certifications && formData.certifications.length > 0 ? formData.certifications : undefined,
        languages: formData.languages.length > 0 ? formData.languages : undefined,
      };
      
      console.log('Updating profile with data:', updateData);
      
      const updatedProfile = await profileService.updateProfile(profileId, updateData);
      
      showToast('Profile updated successfully!', 'success');
      
      setTimeout(() => {
        router.push(`/settings/profiles/${profileId}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Failed to update profile';
      
      if (error.message) {
        errorMessage = error.message;
        
        if (error.message.includes('already exists')) {
          errorMessage = 'A profile with this employee ID already exists';
        } else if (error.message.includes('Invalid user')) {
          errorMessage = 'Selected user does not exist or is invalid';
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = 'Please check all required fields are filled correctly';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'You do not have permission to update profiles';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getDocumentName = (type: string) => {
    switch (type) {
      case 'id_card': return 'National ID';
      case 'passport': return 'Passport';
      case 'driving_license': return 'Driving License';
      case 'kra_pin': return 'KRA PIN';
      case 'nssf': return 'NSSF';
      case 'nhif': return 'NHIF';
      default: return type;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'id_card': return CreditCard;
      case 'passport': return Globe;
      case 'driving_license': return Car;
      case 'kra_pin': return FileText;
      case 'nssf': return Shield;
      case 'nhif': return Stethoscope;
      default: return FileText;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/settings/profiles/${profileId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600 mt-1">
                Update profile for {profile && profileService.getFullName(profile)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {/* Personal & Employment Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal & Employment Information</h3>
          
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
                  value={formData.dateOfBirth}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Citizenship
                </label>
                <input
                  type="text"
                  value={formData.citizenship}
                  onChange={(e) => handleInputChange('citizenship', e.target.value)}
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
                  User Account *
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
              </div>

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
                  value={formData.dateStarted}
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
        </div>

        {/* Contact & Contract Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact & Contract Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Contact Information</h4>
              
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Phone
                </label>
                <input
                  type="tel"
                  value={formData.workPhone}
                  onChange={(e) => handleInputChange('workPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+254 700 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Email *
                </label>
                <input
                  type="email"
                  value={formData.personalEmail}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Address
                </label>
                <textarea
                  value={formData.postalAddress}
                  onChange={(e) => handleInputChange('postalAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="P.O. Box"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    County
                  </label>
                  <input
                    type="text"
                    value={formData.county}
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
                    value={formData.subCounty}
                    onChange={(e) => handleInputChange('subCounty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Westlands"
                  />
                </div>
              </div>
            </div>

            {/* Contract & Family Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Contract & Family Information</h4>
              
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
                    value={formData.contractStartDate}
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
                    value={formData.contractEndDate}
                    onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Document URL
                </label>
                <input
                  type="text"
                  value={formData.contractDocumentUrl}
                  onChange={(e) => handleInputChange('contractDocumentUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/contract.pdf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reporting Manager ID
                </label>
                <input
                  type="text"
                  value={formData.reportingManager}
                  onChange={(e) => handleInputChange('reportingManager', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Manager's user ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marital Status
                </label>
                <input
                  type="text"
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Married, Single, Divorced"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spouse Name
                </label>
                <input
                  type="text"
                  value={formData.spouseName}
                  onChange={(e) => handleInputChange('spouseName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Children
                </label>
                <input
                  type="number"
                  value={formData.childrenCount}
                  onChange={(e) => handleInputChange('childrenCount', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Bank Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
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
                value={formData.bankAccountNumber}
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
                value={formData.bankBranch}
                onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Westlands Branch"
              />
            </div>
          </div>
        </div>

        {/* Next of Kin */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Next of Kin Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next of Kin Name
              </label>
              <input
                type="text"
                value={formData.nextOfKinName}
                onChange={(e) => handleInputChange('nextOfKinName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Jane Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={formData.nextOfKinRelationship}
                onChange={(e) => handleInputChange('nextOfKinRelationship', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Spouse, Parent, Sibling"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.nextOfKinPhone}
                onChange={(e) => handleInputChange('nextOfKinPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="+254 700 000 000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.nextOfKinAddress}
                onChange={(e) => handleInputChange('nextOfKinAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="123 Main St, Nairobi"
              />
            </div>
          </div>
        </div>

        {/* Skills & Languages */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Skills & Languages</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Skills</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Skill
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
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
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
                  Qualifications
                </label>
                <input
                  type="text"
                  value={formData.qualifications?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('qualifications', e.target.value.split(', ').filter(Boolean))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Bachelor of Science, Master of Business"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Certifications & Languages</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certifications
                </label>
                <input
                  type="text"
                  value={formData.certifications?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('certifications', e.target.value.split(', ').filter(Boolean))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="AWS Certified, PMP, Scrum Master"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Languages
                </label>
                <input
                  type="text"
                  value={formData.languages.join(', ')}
                  onChange={(e) => handleArrayInputChange('languages', e.target.value.split(', ').filter(Boolean))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="English, Swahili, French"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Emergency Contacts</h3>
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
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
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
            <div className="space-y-3">
              {formData.emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Users className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{contact.name}</h4>
                        <p className="text-sm text-gray-600 mt-0.5 capitalize">
                          {contact.relationship}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phoneNumber}
                          </span>
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                          )}
                          {contact.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {contact.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-gray-700 font-medium text-sm">No Emergency Contacts</h4>
              <p className="text-gray-500 text-xs mt-1">
                No emergency contacts have been added to this profile.
              </p>
            </div>
          )}
        </div>

        {/* Government Documents */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Government Documents</h3>
            <button
              type="button"
              onClick={() => setShowDocumentForm(!showDocumentForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              <Plus className="h-4 w-4" />
              Add Document
            </button>
          </div>

          {showDocumentForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h5 className="font-medium text-gray-900 mb-3">New Government Document</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type *
                  </label>
                  <select
                    value={newGovernmentDocument.type}
                    onChange={(e) => setNewGovernmentDocument(prev => ({ ...prev, type: e.target.value as GovernmentDocument['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    Document Number *
                  </label>
                  <input
                    type="text"
                    value={newGovernmentDocument.number}
                    onChange={(e) => setNewGovernmentDocument(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="A12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newGovernmentDocument.expiryDate as string || ''}
                    onChange={(e) => setNewGovernmentDocument(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document URL
                  </label>
                  <input
                    type="text"
                    value={newGovernmentDocument.documentUrl || ''}
                    onChange={(e) => setNewGovernmentDocument(prev => ({ ...prev, documentUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://example.com/doc.pdf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="docActive"
                      checked={newGovernmentDocument.active}
                      onChange={(e) => setNewGovernmentDocument(prev => ({ ...prev, active: e.target.checked }))}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="docActive" className="text-sm text-gray-700">
                      Active Document
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDocumentForm(false)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addGovernmentDocument}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Document
                </button>
              </div>
            </div>
          )}

          {formData.governmentDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.governmentDocuments.map((doc, index) => {
                const Icon = getDocumentIcon(doc.type);
                return (
                  <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg relative">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {getDocumentName(doc.type)}
                        </h4>
                        <p className="text-sm text-gray-600 mt-0.5">Number: {doc.number}</p>
                        {doc.expiryDate && (
                          <p className="text-sm text-gray-600 mt-0.5">
                            Expires: {formatDate(doc.expiryDate as string)}
                          </p>
                        )}
                        {doc.active && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGovernmentDocument(index)}
                      className="absolute top-3 right-3 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-gray-700 font-medium text-sm">No Government Documents</h4>
              <p className="text-gray-500 text-xs mt-1">
                No government documents have been added to this profile.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push(`/settings/profiles/${profileId}`)}
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/settings/profiles/${profileId}`)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}