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
  BanknoteIcon,
  FileText,
  Shield,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  Copy,
  ExternalLink,
  AlertCircle,
  Heart,
  BookOpen,
  GraduationCap,
  Globe,
  CreditCard,
  Stethoscope,
  Car,
  Home,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { profileService, Profile, EmergencyContact, GovernmentDocument } from '@/services/settings/profileService';

interface ProfileDetailProps {
  profileId: string;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: string;
}

export default function ProfileDetailsPage({ profileId }: ProfileDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'leaves' | 'emergency'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (profileId) {
      loadProfileData();
    }
  }, [profileId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile(profileId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile', 'error');
      router.push('/settings/profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!profile) return;
    
    try {
      const updatedProfile = profile.active !== false
        ? await profileService.deactivateProfile(profile.id)
        : await profileService.activateProfile(profile.id);
      
      setProfile(updatedProfile);
      showToast(`Profile ${profile.active !== false ? 'deactivated' : 'activated'} successfully`, 'success');
    } catch (error: any) {
      console.error('Error toggling profile status:', error);
      showToast(error.message || 'Failed to update profile status', 'error');
    }
  };

  const handleDeleteProfile = async () => {
    if (!profile) return;
    
    try {
      await profileService.deleteProfile(profile.id);
      showToast('Profile deleted successfully', 'success');
      router.push('/settings/profiles');
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      showToast(error.message || 'Failed to delete profile', 'error');
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

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getAge = (dateOfBirth?: string | Date) => {
    if (!dateOfBirth) return 'N/A';
    
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  const getInitials = (profile: Profile): string => {
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    
    if (!firstName && !lastName) {
      return '??';
    }
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const statCards: StatCard[] = [
    {
      title: 'Leave Balance',
      value: profile?.currentLeaveBalance || 0,
      icon: Calendar,
      color: 'text-blue-600 bg-blue-100',
      trend: 'days available'
    },
    {
      title: 'Years of Service',
      value: profile?.dateStarted ? 
        new Date().getFullYear() - new Date(profile.dateStarted).getFullYear() : 0,
      icon: Clock,
      color: 'text-green-600 bg-green-100',
      trend: 'years'
    },
    {
      title: 'Documents',
      value: profile?.governmentDocuments?.length || 0,
      icon: FileText,
      color: 'text-purple-600 bg-purple-100',
      trend: 'uploaded'
    },
    {
      title: 'Emergency Contacts',
      value: profile?.emergencyContacts?.length || 0,
      icon: Users,
      color: 'text-red-600 bg-red-100',
      trend: 'on file'
    }
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

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/settings/profiles')}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Back to list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Profile Details</h1>
              <p className="text-gray-600 text-sm">View and manage employee information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/settings/profiles/${profileId}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-8">
            {/* Profile Avatar */}
            <div className="text-center mb-5">
              <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-2xl">
                  {getInitials(profile)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base">
                {profileService.getFullName(profile)}
              </h3>
              <p className="text-sm text-gray-600">{profile.position}</p>
              <p className="text-xs text-gray-500">{profile.department}</p>
              
              <div className="mt-3 space-y-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.active !== false
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profile.active !== false ? 'Active' : 'Inactive'}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.employmentStatus === 'permanent' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.employmentStatus || 'Not specified'}
                </span>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="space-y-3">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{stat.title}</span>
                      <Icon className={`h-4 w-4 ${stat.color.split(' ')[0]}`} />
                    </div>
                    <p className="text-base font-semibold text-gray-900 mt-0.5">{stat.value}</p>
                    {stat.trend && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{stat.trend}</p>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-5 pt-4 border-t border-gray-200 space-y-1.5">
              <button
                onClick={() => setActiveTab('documents')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                View Documents
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" />
                Leave Records
              </button>
              <button
                onClick={() => setActiveTab('emergency')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                Emergency Contacts
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(profile.employeeId)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Employee ID
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Profile
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 border-b border-gray-200">
              {(['overview', 'documents', 'leaves', 'emergency'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Full Name</div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profileService.getFullName(profile)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Date of Birth</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {formatDate(profile.dateOfBirth)} ({getAge(profile.dateOfBirth)} years)
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Gender</div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 capitalize">{profile.gender || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Nationality</div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile.nationality || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Phone Number</div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile.personalPhone}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Email</div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile.personalEmail || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Residential Address</div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile.residentialAddress || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Marital Status</div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 capitalize">{profile.maritalStatus || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Employment Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Employee ID</div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 font-mono">{profile.employeeId}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Position</div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile.position}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Department</div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile.department}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Date Started</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{formatDate(profile.dateStarted)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Employment Status</div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 capitalize">{profile.employmentStatus || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Contract Type</div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 capitalize">{profile.contractType || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Contract Dates</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {profile.contractStartDate ? formatDate(profile.contractStartDate) : 'N/A'} - 
                          {profile.contractEndDate ? formatDate(profile.contractEndDate) : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Reporting Manager</div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {typeof profile.reportingManager === 'object' 
                            ? profile.reportingManager.name 
                            : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              {profile.bankName && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Bank Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Bank Name</div>
                      <div className="flex items-center gap-2">
                        <BanknoteIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile.bankName}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Account Number</div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 font-mono">{profile.bankAccountNumber}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Bank Branch</div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile.bankBranch}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills & Qualifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(profile.skills?.length > 0 || profile.qualifications?.length > 0) && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Skills</h3>
                    {profile.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No skills added</p>
                    )}
                  </div>
                )}
                
                {(profile.certifications?.length > 0 || profile.languages?.length > 0) && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Certifications</h3>
                    {profile.certifications?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.certifications.map((cert, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No certifications added</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Government Documents</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {profile.governmentDocuments?.length || 0} document{profile.governmentDocuments?.length !== 1 ? 's' : ''} on file
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/settings/profiles/edit?id=${profile.id}&tab=documents`)}
                  className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                >
                  Add Document
                </button>
              </div>
              
              {profile.governmentDocuments && profile.governmentDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profile.governmentDocuments.map((doc, index) => {
                    const Icon = getDocumentIcon(doc.type);
                    return (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {getDocumentName(doc.type)}
                            </h4>
                            <p className="text-xs text-gray-600 mt-0.5">Number: {doc.number}</p>
                            {doc.expiryDate && (
                              <p className="text-xs text-gray-600 mt-0.5">
                                Expires: {formatDate(doc.expiryDate)}
                              </p>
                            )}
                            {doc.active && (
                              <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-gray-700 font-medium text-sm">No Documents Uploaded</h4>
                  <p className="text-gray-500 text-xs mt-1">
                    No government documents have been added to this profile.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Leave Records</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Current balance: {profile.currentLeaveBalance || 0} days
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/settings/profiles/edit?id=${profile.id}&tab=leaves`)}
                  className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                >
                  Add Leave Record
                </button>
              </div>
              
              {profile.leaveRecords && profile.leaveRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Year</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Accrued</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Used</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Balance</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.leaveRecords.map((record, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="px-4 py-3 text-sm text-gray-900">{record.year}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.totalAccrued} days</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.used} days</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.totalAccrued - record.used} days</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.lastUpdated ? formatDate(record.lastUpdated) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-gray-700 font-medium text-sm">No Leave Records</h4>
                  <p className="text-gray-500 text-xs mt-1">
                    No leave records have been added for this employee.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Emergency Contacts</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {profile.emergencyContacts?.length || 0} contact{profile.emergencyContacts?.length !== 1 ? 's' : ''} on file
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/settings/profiles/edit?id=${profile.id}&tab=emergency`)}
                  className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                >
                  Add Contact
                </button>
              </div>
              
              {profile.emergencyContacts && profile.emergencyContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profile.emergencyContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <PhoneCall className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{contact.name}</h4>
                          <p className="text-xs text-gray-600 mt-0.5 capitalize">
                            {contact.relationship}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phoneNumber}
                          </p>
                          {contact.email && (
                            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-gray-700 font-medium text-sm">No Emergency Contacts</h4>
                  <p className="text-gray-500 text-xs mt-1">
                    No emergency contacts have been added to this profile.
                  </p>
                </div>
              )}

              {/* Next of Kin */}
              {profile.nextOfKinName && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Next of Kin</h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{profile.nextOfKinName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Relationship</p>
                        <p className="font-medium text-gray-900 capitalize">{profile.nextOfKinRelationship}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{profile.nextOfKinPhone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{profile.nextOfKinAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full">
            <div className="flex items-start gap-2.5 mb-4">
              <div className="p-1.5 bg-red-100 rounded-lg mt-0.5">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Delete Profile</h3>
                <p className="text-gray-600 text-xs mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-5">
              Are you sure you want to delete <strong>{profileService.getFullName(profile)}</strong>?
              All associated data will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}