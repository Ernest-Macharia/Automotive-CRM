// app/my-profile/[id]/page.tsx
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
  BanknoteIcon,
  FileText,
  Shield,
  Users,
  Clock,
  Edit,
  CheckCircle,
  XCircle,
  Heart,
  Globe,
  CreditCard,
  Stethoscope,
  Car,
  PhoneCall,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { profileService, Profile } from '@/services/settings/profileService';

export default function EmployeeProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    //   const userStr = sessionStorage.getItem('user');
    //   if (userStr) {
    //     const user = JSON.parse(userStr);
    //     const profileUserId = typeof profileData.user === 'string' 
    //       ? profileData.user 
    //       : profileData.user?.id;
        
    //     // if (profileUserId !== user.id) {
    //     //   setError('You do not have permission to view this profile');
    //     //   return;
    //     // }
    //   }
      
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
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
    } catch {
      return 'Invalid Date';
    }
  };

  const getInitials = (profile: Profile): string => {
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
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
          <div className="text-red-600 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load profile</h2>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">View your personal and employment information</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/my-profile/${profileId}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {getInitials(profile)}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                profile.active !== false
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {profile.active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="h-4 w-4" />
                <span>{profile.position}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Building className="h-4 w-4" />
                <span>{profile.department}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Started {formatDate(profile.dateStarted)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                <p className="text-gray-900">
                  {profile.firstName} {profile.middleName} {profile.lastName}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                <p className="text-gray-900 font-mono">{profile.employeeId}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                <p className="text-gray-900">{formatDate(profile.dateOfBirth)}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Gender</p>
                <p className="text-gray-900 capitalize">{profile.gender || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Nationality</p>
                <p className="text-gray-900">{profile.nationality || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Marital Status</p>
                <p className="text-gray-900 capitalize">{profile.maritalStatus || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Personal Phone</p>
                  <p className="text-gray-900">{profile.personalPhone}</p>
                </div>
              </div>
              
              {profile.workPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Work Phone</p>
                    <p className="text-gray-900">{profile.workPhone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Personal Email</p>
                  <p className="text-gray-900">{profile.personalEmail || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Residential Address</p>
                  <p className="text-gray-900">{profile.residentialAddress || 'Not specified'}</p>
                  {profile.county && (
                    <p className="text-sm text-gray-600">
                      {profile.county}{profile.subCounty ? `, ${profile.subCounty}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Languages */}
          {(profile.skills?.length > 0 || profile.languages?.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Languages</h3>
              
              <div className="space-y-4">
                {profile.skills?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {profile.languages?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((lang, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Employment & Bank */}
        <div className="space-y-6">
          {/* Employment Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  profile.employmentStatus === 'permanent' 
                    ? 'bg-green-100 text-green-700'
                    : profile.employmentStatus === 'contract'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {profile.employmentStatus || 'Not specified'}
                </span>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Contract Type</p>
                <p className="text-gray-900 capitalize">{profile.contractType || 'Not specified'}</p>
              </div>
              
              {profile.contractStartDate && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Contract Period</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(profile.contractStartDate)} - {profile.contractEndDate ? formatDate(profile.contractEndDate) : 'Ongoing'}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Leave Balance</p>
                <p className="text-xl font-semibold text-gray-900">{profile.currentLeaveBalance || 0} days</p>
              </div>
            </div>
          </div>

          {/* Bank Information */}
          {profile.bankName && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Information</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                  <p className="text-gray-900">{profile.bankName}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">Account Number</p>
                  <p className="text-gray-900 font-mono">{profile.bankAccountNumber}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">Branch</p>
                  <p className="text-gray-900">{profile.bankBranch}</p>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contacts */}
          {profile.emergencyContacts && profile.emergencyContacts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
              
              <div className="space-y-4">
                {profile.emergencyContacts.map((contact, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <PhoneCall className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-600 capitalize">{contact.relationship}</p>
                      <p className="text-xs text-gray-600 mt-1">{contact.phoneNumber}</p>
                      {contact.email && (
                        <p className="text-xs text-gray-600">{contact.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}