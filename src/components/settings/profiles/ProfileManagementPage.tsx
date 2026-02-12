'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  Activity,
  TrendingUp,
  CalendarDays,
  EllipsisVertical,
  Briefcase,
  Building,
  Phone,
  MapPin,
  FileText,
  BanknoteIcon,
  Stethoscope,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { profileService, Profile } from '@/services/settings/profileService';

interface ProfileFilters {
  department: string;
  employmentStatus: string;
  search: string;
}

interface ProfileManagementPageProps {
  onViewDetails?: (profileId: string) => void;
  onEditProfile?: (profileId: string) => void;
  onCreateProfile?: () => void;
}

export default function ProfileManagementPage({ 
  onViewDetails, 
  onEditProfile, 
  onCreateProfile 
}: ProfileManagementPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProfileFilters>({
    department: 'all',
    employmentStatus: 'all',
    search: '',
  });

  const profilesPerPage = 10;

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
    setCurrentPage(1);
  }, [profiles, filters]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
      showToast('Failed to load profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    let result = [...profiles];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(profile => {
        const fullName = profileService.getFullName(profile).toLowerCase();
        const employeeId = profile.employeeId.toLowerCase();
        const position = profile.position.toLowerCase();
        const department = profile.department.toLowerCase();
        
        return (
          fullName.includes(searchTerm) ||
          employeeId.includes(searchTerm) ||
          position.includes(searchTerm) ||
          department.includes(searchTerm)
        );
      });
    }

    if (filters.department !== 'all') {
      result = result.filter(profile => profile.department === filters.department);
    }

    if (filters.employmentStatus !== 'all') {
      result = result.filter(profile => profile.employmentStatus === filters.employmentStatus);
    }

    setFilteredProfiles(result);
  };

  const handleToggleStatus = async (profile: Profile) => {
    try {
      const updatedProfile = profile.active 
        ? await profileService.deactivateProfile(profile.id)
        : await profileService.activateProfile(profile.id);
      
      setProfiles(prev => prev.map(p => p.id === profile.id ? updatedProfile : p));
      showToast(`Profile ${profile.active ? 'deactivated' : 'activated'} successfully`, 'success');
    } catch (error) {
      console.error('Error toggling profile status:', error);
      showToast('Failed to update profile status', 'error');
    }
  };

  const handleDeleteProfile = async (profile: Profile) => {
    try {
      await profileService.deleteProfile(profile.id);
      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      showToast('Profile deleted successfully', 'success');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
      showToast('Failed to delete profile', 'error');
    }
  };

  const handleSelectAll = () => {
    const currentProfiles = getCurrentProfiles();
    if (selectedProfiles.length === currentProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(currentProfiles.map(profile => profile.id));
    }
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = profiles.map(p => p.department).filter(Boolean);
    return Array.from(new Set(depts));
  }, [profiles]);

  // Get unique employment statuses for filter
  const employmentStatuses = useMemo(() => {
    const statuses = profiles.map(p => p.employmentStatus).filter(Boolean);
    return Array.from(new Set(statuses));
  }, [profiles]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProfiles.length / profilesPerPage);
  const getCurrentProfiles = () => {
    const startIndex = (currentPage - 1) * profilesPerPage;
    return filteredProfiles.slice(startIndex, startIndex + profilesPerPage);
  };
  const currentProfiles = getCurrentProfiles();
  const indexOfFirstProfile = (currentPage - 1) * profilesPerPage + 1;
  const indexOfLastProfile = Math.min(currentPage * profilesPerPage, filteredProfiles.length);

  const stats = useMemo(() => ({
    total: profiles.length,
    active: profiles.filter(p => p.active !== false).length,
    inactive: profiles.filter(p => p.active === false).length,
    departments: departments.length,
    onContract: profiles.filter(p => p.contractType === 'contract').length,
    permanent: profiles.filter(p => p.contractType === 'permanent').length,
    recent: profiles.filter(p => {
      if (!p.createdAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(p.createdAt) > weekAgo;
    }).length,
  }), [profiles, departments]);

  const getEmploymentBadgeColor = (status?: string) => {
    const colors: Record<string, string> = {
      'permanent': 'bg-green-500/10 text-green-700 border-green-200',
      'contract': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'probation': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      'intern': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'terminated': 'bg-red-500/10 text-red-700 border-red-200',
      'resigned': 'bg-gray-500/10 text-gray-700 border-gray-200',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (active?: boolean) => {
    return active !== false 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getInitials = (profile: Profile): string => {
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    
    if (!firstName && !lastName) {
      return '??';
    }
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const ProfileTableRow = ({ profile }: { profile: Profile }) => {
    const isActive = expandedRow === profile.id;
    
    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={selectedProfiles.includes(profile.id)}
            onChange={() => handleSelectProfile(profile.id)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {getInitials(profile)}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {profileService.getFullName(profile)}
              </div>
              <div className="text-sm text-gray-600">{profile.employeeId}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-900">{profile.position}</span>
            <span className="text-xs text-gray-600">{profile.department}</span>
          </div>
        </td>
        <td className="px-4 py-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
            getEmploymentBadgeColor(profile.employmentStatus)
          }`}>
            {profile.employmentStatus || 'Not specified'}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {profile.active !== false ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">{profile.active !== false ? 'Active' : 'Inactive'}</span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-gray-600">
          {formatDate(profile.dateStarted)}
        </td>
        <td className="px-4 py-4">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedRow(expandedRow === profile.id ? null : profile.id);
              }}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              aria-haspopup="true"
              aria-expanded={isActive}
              aria-label="More actions"
            >
              <EllipsisVertical className="h-4 w-4" />
            </button>

            {isActive && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExpandedRow(null)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <button
                    onClick={() => router.push(`/settings/profiles/${profile.id}`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => router.push(`/settings/profiles/${profile.id}/edit`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(profile)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Profile
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
            <p className="text-gray-600 mt-1">Manage employee profiles and information</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadProfiles}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Total Profiles', value: stats.total, icon: Users },
            { label: 'Active', value: stats.active, icon: UserCheck },
            { label: 'Departments', value: stats.departments, icon: Building },
            { label: 'On Contract', value: stats.onContract, icon: FileText },
            { label: 'Permanent', value: stats.permanent, icon: UserCheck },
            { label: 'Recent', value: stats.recent, icon: TrendingUp },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search profiles..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}  
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Status</label>
                <select
                  value={filters.employmentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, employmentStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  {employmentStatuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({ department: 'all', employmentStatus: 'all', search: '' })}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profiles Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No profiles found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {filters.search ? 'Try a different search term' : 'Add your first profile to get started'}
          </p>
          <button
            onClick={() => router.push('/settings/profiles/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            <UserPlus className="h-4 w-4" />
            Add Profile
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Select</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Position/Dept</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Active</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Date Started</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProfiles.map((profile, index) => (
                  <ProfileTableRow key={`${profile.id}-${index}`} profile={profile} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 gap-3">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstProfile} to {indexOfLastProfile} of {filteredProfiles.length} profiles
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-1.5 bg-red-100 rounded-lg mt-0.5">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Profile</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-5">
              Are you sure you want to delete <strong>{profileService.getFullName(showDeleteConfirm)}</strong>?
              All associated data will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProfile(showDeleteConfirm)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg"
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