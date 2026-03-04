'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Building,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Globe,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  BarChart,
  Download,
  Settings,
  Power,
  Play,
  Pause,
  Ban,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { 
  organizationService, 
  Organization, 
  OrganizationFilters,
  ORGANIZATION_STATUS,
  ORGANIZATION_TIERS,
  DEFAULT_ORGANIZATION_TIERS
} from '@/services/settings/organizationService';

interface OrganizationManagementPageProps {
  onViewDetails?: (organizationId: string) => void;
  onEditOrganization?: (organizationId: string) => void;
  onCreateOrganization?: () => void;
}

export default function OrganizationManagementPage({ 
  onViewDetails, 
  onEditOrganization, 
  onCreateOrganization 
}: OrganizationManagementPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Organization | null>(null);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState<Organization | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statsExpanded, setStatsExpanded] = useState(true);
  
  const [filters, setFilters] = useState<OrganizationFilters>({
    status: 'active',
    tier: 'all',
    industry: '',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const organizationsPerPage = 10;
  const tiers = Object.values(ORGANIZATION_TIERS);
  const statuses = Object.values(ORGANIZATION_STATUS);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
    setCurrentPage(1);
  }, [organizations, filters]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationService.getAllOrganizations();
      setOrganizations(response.organizations);
    } catch (error) {
      console.error('Error loading organizations:', error);
      showToast('Failed to load organizations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let result = [...organizations];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(org => {
        const orgName = org.name?.toLowerCase() || '';
        const orgEmail = org.email?.toLowerCase() || '';
        const orgSlug = org.slug?.toLowerCase() || '';
        const orgIndustry = org.industry?.toLowerCase() || '';
        
        return (
          orgName.includes(searchTerm) ||
          orgEmail.includes(searchTerm) ||
          orgSlug.includes(searchTerm) ||
          orgIndustry.includes(searchTerm)
        );
      });
    }

    if (filters.status && filters.status !== 'active') {
      result = result.filter(org => org.status === filters.status);
    }

    if (filters.tier && filters.tier !== 'all') {
      result = result.filter(org => org.tier === filters.tier);
    }

    if (filters.industry) {
      result = result.filter(org => 
        org.industry?.toLowerCase().includes(filters.industry!.toLowerCase())
      );
    }

    // Sort
    if (filters.sortBy) {
      result.sort((a, b) => {
        let aVal = a[filters.sortBy as keyof Organization];
        let bVal = b[filters.sortBy as keyof Organization];
        
        if (filters.sortBy === 'createdAt' || filters.sortBy === 'updatedAt') {
          aVal = aVal ? new Date(aVal as string).getTime() : 0;
          bVal = bVal ? new Date(bVal as string).getTime() : 0;
        }
        
        if (filters.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    setFilteredOrganizations(result);
  };

  const handleToggleStatus = async (organization: Organization) => {
    try {
      if (organization.status === 'active') {
        setShowSuspendConfirm(organization);
      } else if (organization.status === 'suspended') {
        const updatedOrg = await organizationService.activateOrganization(organization.id);
        setOrganizations(prev => prev.map(org => 
          org.id === organization.id ? updatedOrg : org
        ));
        showToast('Organization activated successfully', 'success');
      }
    } catch (error) {
      console.error('Error toggling organization status:', error);
      showToast('Failed to update organization status', 'error');
    }
  };

  const handleSuspendOrganization = async () => {
    if (!showSuspendConfirm) return;
    
    try {
      const updatedOrg = await organizationService.suspendOrganization(
        showSuspendConfirm.id, 
        { reason: suspendReason || 'No reason provided' }
      );
      setOrganizations(prev => prev.map(org => 
        org.id === showSuspendConfirm.id ? updatedOrg : org
      ));
      showToast('Organization suspended successfully', 'success');
      setShowSuspendConfirm(null);
      setSuspendReason('');
    } catch (error) {
      console.error('Error suspending organization:', error);
      showToast('Failed to suspend organization', 'error');
    }
  };

  const handleDeleteOrganization = async (organization: Organization) => {
    try {
      await organizationService.deleteOrganization(organization.id);
      setOrganizations(prev => prev.filter(org => org.id !== organization.id));
      showToast('Organization deleted successfully', 'success');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting organization:', error);
      showToast('Failed to delete organization', 'error');
    }
  };

  const handleSelectAll = () => {
    const currentOrgs = getCurrentOrganizations();
    if (selectedOrganizations.length === currentOrgs.length) {
      setSelectedOrganizations([]);
    } else {
      setSelectedOrganizations(currentOrgs.map(org => org.id));
    }
  };

  const handleSelectOrganization = (organizationId: string) => {
    setSelectedOrganizations(prev =>
      prev.includes(organizationId)
        ? prev.filter(id => id !== organizationId)
        : [...prev, organizationId]
    );
  };

  const handleRefresh = () => {
    loadOrganizations();
    showToast('Organizations refreshed', 'success');
  };

  const clearFilters = () => {
    setFilters({
      status: 'active',
      tier: 'all',
      industry: '',
      search: '',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    showToast('Filters cleared', 'info');
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOrganizations.length / organizationsPerPage);
  const getCurrentOrganizations = () => {
    const startIndex = (currentPage - 1) * organizationsPerPage;
    return filteredOrganizations.slice(startIndex, startIndex + organizationsPerPage);
  };
  const currentOrganizations = getCurrentOrganizations();
  const indexOfFirstOrg = (currentPage - 1) * organizationsPerPage + 1;
  const indexOfLastOrg = Math.min(currentPage * organizationsPerPage, filteredOrganizations.length);

  // Statistics
  const stats = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter(org => org.status === 'active').length,
    suspended: organizations.filter(org => org.status === 'suspended').length,
    inactive: organizations.filter(org => org.status === 'inactive').length,
    basic: organizations.filter(org => org.tier === ORGANIZATION_TIERS.BASIC).length,
    pro: organizations.filter(org => org.tier === ORGANIZATION_TIERS.PRO).length,
    enterprise: organizations.filter(org => org.tier === ORGANIZATION_TIERS.ENTERPRISE).length,
    premium: organizations.filter(org => org.tier === ORGANIZATION_TIERS.PREMIUM).length,
    totalUsers: organizations.reduce((sum, org) => sum + (org.currentUsers || 0), 0),
    avgUsersPerOrg: organizations.length ? 
      Math.round(organizations.reduce((sum, org) => sum + (org.currentUsers || 0), 0) / organizations.length) : 0,
    atLimit: organizations.filter(org => organizationService.isAtUserLimit(org)).length,
    recent: organizations.filter(org => {
      if (!org.createdAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(org.createdAt) > weekAgo;
    }).length
  }), [organizations]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'suspended':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'inactive':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'basic':
        return <Building className="h-4 w-4 text-gray-500" />;
      case 'pro':
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case 'enterprise':
        return <Building2 className="h-4 w-4 text-purple-500" />;
      case 'premium':
        return <Building2 className="h-4 w-4 text-amber-500" />;
      default:
        return <Building className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') {
      return '??';
    }
    
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const OrganizationTableRow = ({ organization }: { organization: Organization }) => {
    const isExpanded = expandedRow === organization.id;
    const usagePercentage = organizationService.getOrganizationUsagePercentage(organization);
    const availableSlots = organizationService.getAvailableUserSlots(organization);
    const isAtLimit = organizationService.isAtUserLimit(organization);
    
    return (
      <>
        <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <td className="px-4 py-4">
            <input
              type="checkbox"
              checked={selectedOrganizations.includes(organization.id)}
              onChange={() => handleSelectOrganization(organization.id)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(organization.name)}
              </div>
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {organization.name}
                  {organization.tier && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${organizationService.getTierBadgeColor(organization.tier)}`}>
                      {organization.tier}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[180px]">{organization.email}</span>
                </div>
                {organization.slug && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    ID: {organization.slug}
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(organization.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${organizationService.getStatusBadgeColor(organization.status)}`}>
                  {organization.status?.charAt(0).toUpperCase() + organization.status?.slice(1) || 'Unknown'}
                </span>
              </div>
              {organization.industry && (
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <span>{organization.industry}</span>
                </div>
              )}
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {organization.currentUsers || 0} / {organization.maxUsers}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      usagePercentage >= 90 ? 'bg-red-500' : 
                      usagePercentage >= 75 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{usagePercentage}%</span>
              </div>
              {isAtLimit && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                  At limit
                </span>
              )}
              {availableSlots > 0 && availableSlots < 5 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                  {availableSlots} slots left
                </span>
              )}
            </div>
          </td>
          <td className="px-4 py-4">
            {organization.owner ? (
              <div className="text-sm">
                <div className="font-medium text-gray-900">{organization.owner.name}</div>
                <div className="text-gray-600 text-xs">{organization.owner.email}</div>
              </div>
            ) : (
              <span className="text-sm text-gray-500">No owner</span>
            )}
          </td>
          <td className="px-4 py-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              {formatDate(organization.createdAt)}
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="relative">
              <button
                onClick={() => setExpandedRow(isExpanded ? null : organization.id)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isExpanded && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setExpandedRow(null)}
                  />
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                    <button
                      onClick={() => router.push(`/settings/organizations/${organization.id}`)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/settings/organizations/${organization.id}/edit`)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Organization
                    </button>
                    <button
                      onClick={() => router.push(`/settings/organizations/${organization.id}/users`)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Manage Users
                    </button>
                    <button
                      onClick={() => router.push(`/settings/organizations/${organization.id}/settings`)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    {organization.status === 'active' ? (
                      <button
                        onClick={() => handleToggleStatus(organization)}
                        className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <Ban className="h-4 w-4" />
                        Suspend Organization
                      </button>
                    ) : organization.status === 'suspended' && (
                      <button
                        onClick={() => handleToggleStatus(organization)}
                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Activate Organization
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(organization)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Organization
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => navigator.clipboard.writeText(organization.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy ID
                    </button>
                  </div>
                </>
              )}
            </div>
          </td>
        </tr>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
            <p className="text-gray-600 mt-1">Manage all organizations and their subscriptions</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => router.push('/settings/organizations/create')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Add Organization</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
          >
            {statsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium">Organization Statistics</span>
          </button>
          
          {statsExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">Total Orgs</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="text-green-600">+{stats.recent}</span> this week
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">Active</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">Suspended</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.suspended}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Ban className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Avg: {stats.avgUsersPerOrg} per org
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">At User Limit</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats.atLimit}</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">Pro+ Plans</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.pro + stats.enterprise + stats.premium}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, slug, industry..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          
          {selectedOrganizations.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedOrganizations.length} selected
              </span>
              <button
                onClick={() => setSelectedOrganizations([])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tier</label>
                <select
                  value={filters.tier}
                  onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Tiers</option>
                  {tiers.map(tier => (
                    <option key={tier} value={tier}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                <input
                  type="text"
                  value={filters.industry}
                  onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                    <option value="tier">Tier</option>
                    <option value="updatedAt">Updated Date</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Organizations Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading organizations...</p>
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            {filters.search || filters.status !== 'active' || filters.tier !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Get started by creating your first organization.'}
          </p>
          <div className="flex gap-4 justify-center">
            {(filters.search || filters.status !== 'active' || filters.tier !== 'all') && (
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => router.push('/settings/organizations/create')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
            >
              Create Organization
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedOrganizations.length === currentOrganizations.length && currentOrganizations.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">
                    Users
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentOrganizations.map((organization, index) => {
                  const key = organization.id 
                    ? `${organization.id}-${organization.slug}-${index}`
                    : `org-${organization.email}-${index}`;
                  return <OrganizationTableRow key={key} organization={organization} />;
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 gap-3">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{indexOfFirstOrg}</span> to{' '}
                <span className="font-medium">{indexOfLastOrg}</span> of{' '}
                <span className="font-medium">{filteredOrganizations.length}</span> organizations
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Organization</h3>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 text-sm">
                Are you sure you want to delete <span className="font-semibold">{showDeleteConfirm.name}</span>?
              </p>
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    This will permanently delete the organization, all its users, and associated data.
                    This action is irreversible.
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrganization(showDeleteConfirm)}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Ban className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Suspend Organization</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will temporarily disable access for all users
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 text-sm mb-3">
                Are you sure you want to suspend <span className="font-semibold">{showSuspendConfirm.name}</span>?
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for suspension (optional)
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g., Payment overdue, policy violation..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSuspendConfirm(null);
                  setSuspendReason('');
                }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendOrganization}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all font-medium shadow-md"
              >
                Suspend Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
