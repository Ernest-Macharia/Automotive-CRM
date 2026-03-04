'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  User,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Users,
  Shield,
  Edit,
  Trash2,
  Ban,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Settings,
  CreditCard,
  TrendingUp,
  Activity,
  Clock,
  Download,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Eye,
  EyeOff,
  Plus,
  Mail as MailIcon,
  MessageSquare,
  FileText,
  BarChart,
  PieChart,
  Database,
  Server,
  HardDrive,
  Zap,
  Sparkles,
  DollarSign,
  Percent,
  Award,
  Target,
  Briefcase,
  UserPlus,
  UserMinus,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { 
  organizationService, 
  Organization, 
  OrganizationStats,
  CanAddUserResponse,
  ORGANIZATION_STATUS,
  ORGANIZATION_TIERS
} from '@/services/settings/organizationService';

interface OrganizationDetailsPageProps {
  organizationId: string;
}

export default function OrganizationDetailsPage({ organizationId }: OrganizationDetailsPageProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [userLimit, setUserLimit] = useState<CanAddUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings' | 'billing' | 'activity'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('details');

  useEffect(() => {
    if (organizationId) {
      loadOrganizationData();
      loadOrganizationStats();
      checkUserLimit();
    }
  }, [organizationId]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getOrganizationById(organizationId);
      setOrganization(data);
    } catch (error) {
      console.error('Error loading organization:', error);
      showToast('Failed to load organization', 'error');
      router.push('/settings/organizations');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationStats = async () => {
    try {
      setStatsLoading(true);
      const data = await organizationService.getOrganizationStats(organizationId);
      setStats(data);
    } catch (error) {
      console.error('Error loading organization stats:', error);
      // Don't show error toast for stats - optional feature
    } finally {
      setStatsLoading(false);
    }
  };

  const checkUserLimit = async () => {
    try {
      const data = await organizationService.canAddUser(organizationId);
      setUserLimit(data);
    } catch (error) {
      console.error('Error checking user limit:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!organization) return;
    
    try {
      if (organization.status === 'active') {
        setShowSuspendConfirm(true);
      } else if (organization.status === 'suspended') {
        const updatedOrg = await organizationService.activateOrganization(organization.id);
        setOrganization(updatedOrg);
        showToast('Organization activated successfully', 'success');
      }
    } catch (error: any) {
      console.error('Error toggling organization status:', error);
      showToast(error.message || 'Failed to update organization status', 'error');
    }
  };

  const handleSuspendOrganization = async () => {
    if (!organization) return;
    
    try {
      const updatedOrg = await organizationService.suspendOrganization(
        organization.id,
        { reason: suspendReason || 'No reason provided' }
      );
      setOrganization(updatedOrg);
      showToast('Organization suspended successfully', 'success');
      setShowSuspendConfirm(false);
      setSuspendReason('');
    } catch (error: any) {
      console.error('Error suspending organization:', error);
      showToast(error.message || 'Failed to suspend organization', 'error');
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organization) return;
    
    try {
      await organizationService.deleteOrganization(organization.id);
      showToast('Organization deleted successfully', 'success');
      router.push('/settings/organizations');
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      showToast(error.message || 'Failed to delete organization', 'error');
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(organization?.id || '');
    showToast('Organization ID copied to clipboard', 'success');
  };

  const handleCopySlug = () => {
    navigator.clipboard.writeText(organization?.slug || '');
    showToast('Organization slug copied to clipboard', 'success');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'suspended':
        return <Ban className="h-5 w-5 text-red-500" />;
      case 'inactive':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'basic':
        return <Building2 className="h-5 w-5 text-gray-500" />;
      case 'pro':
        return <Sparkles className="h-5 w-5 text-blue-500" />;
      case 'enterprise':
        return <Award className="h-5 w-5 text-purple-500" />;
      case 'premium':
        return <Target className="h-5 w-5 text-amber-500" />;
      default:
        return <Building2 className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return '??';
    
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const usagePercentage = organization 
    ? organizationService.getOrganizationUsagePercentage(organization)
    : 0;
  
  const availableSlots = organization
    ? organizationService.getAvailableUserSlots(organization)
    : 0;
  
  const isAtLimit = organization
    ? organizationService.isAtUserLimit(organization)
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/settings/organizations')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back to organizations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600 text-sm mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {organization.email}
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {organization.slug}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copy ID</span>
            </button>
            <button
              onClick={() => router.push(`/settings/organizations/${organization.id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => router.push(`/settings/organizations/${organization.id}/settings`)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-xl border mb-6 flex items-center justify-between ${getStatusColor(organization.status)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(organization.status)}
            <div>
              <p className="font-medium">
                Organization is {organization.status}
              </p>
              {organization.status === 'suspended' && (
                <p className="text-sm opacity-75">
                  All users have been temporarily locked out of the system
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              organization.status === 'active'
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {organization.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="lg:w-80">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-8 shadow-sm">
            {/* Organization Avatar */}
            <div className="text-center mb-6">
              <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-3xl">
                  {getInitials(organization.name)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{organization.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${organizationService.getStatusBadgeColor(organization.status)}`}>
                  {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${organizationService.getTierBadgeColor(organization.tier)}`}>
                  {organization.tier?.charAt(0).toUpperCase() + organization.tier?.slice(1) || 'Basic'}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">User Limit</span>
                  <span className="text-sm font-medium text-gray-900">
                    {organization.currentUsers || 0} / {organization.maxUsers}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      usagePercentage >= 90 ? 'bg-red-500' : 
                      usagePercentage >= 75 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-600">{usagePercentage}% utilized</span>
                  <span className="text-xs font-medium text-gray-700">
                    {availableSlots} slots available
                  </span>
                </div>
                {isAtLimit && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      At user limit. Upgrade plan to add more users.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-gray-600">Total Users</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <Activity className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{stats?.activeUsers || 0}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </div>
            </div>

            {/* Organization Info */}
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Organization Details</h3>
              
              {organization.owner && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Owner</p>
                    <p className="text-sm font-medium text-gray-900">{organization.owner.name}</p>
                    <p className="text-xs text-gray-600">{organization.owner.email}</p>
                  </div>
                </div>
              )}

              {organization.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{organization.phone}</p>
                  </div>
                </div>
              )}

              {(organization.address || organization.city || organization.country) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">
                      {[organization.address, organization.city, organization.state, organization.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {organization.website && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {organization.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {organization.industry && (
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Industry</p>
                    <p className="text-sm text-gray-900">{organization.industry}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">{formatDate(organization.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-1.5">
              <button
                onClick={() => router.push(`/settings/organizations/${organization.id}/users`)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="h-4 w-4" />
                Manage Users
              </button>
              <button
                onClick={() => router.push(`/settings/organizations/${organization.id}/invite`)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Invite Users
              </button>
              <button
                onClick={() => router.push(`/settings/organizations/${organization.id}/upgrade`)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade Plan
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Organization
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Tabs */}
          <div className="bg-white border border-gray-200 rounded-xl mb-6 p-1 shadow-sm">
            <div className="flex space-x-1">
              {(['overview', 'users', 'settings', 'billing', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
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
              {/* Welcome Card */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-xl font-semibold mb-2">
                  Welcome, {organization.name}!
                </h3>
                <p className="text-blue-100 mb-4">
                  Your organization is set up and ready to go. Here's a quick overview of your current status.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => router.push(`/settings/organizations/${organization.id}/users`)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Manage Users
                  </button>
                  <button
                    onClick={() => router.push(`/settings/organizations/${organization.id}/settings`)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Configure Settings
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="text-green-600">{stats?.activeUsers || 0} active</span>
                    {' '}· {stats?.inactiveUsers || 0} inactive
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Work Orders</h3>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalWorkOrders || 0}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="text-green-600">{stats?.completedWorkOrders || 0} completed</span>
                    {' '}· {stats?.openWorkOrders || 0} open
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Quotes</h3>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalQuotes || 0}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="text-green-600">{stats?.approvedQuotes || 0} approved</span>
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Leads</h3>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalLeads || 0}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="text-green-600">{stats?.conversionRate || 0}% conversion</span>
                  </p>
                </div>
              </div>

              {/* Storage & Usage */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Storage & Usage</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View Details
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Storage Used</span>
                      <span className="text-sm font-medium text-gray-900">
                        {stats?.storageUsed || '0 GB'} / {organization.tier === 'basic' ? '10 GB' : 
                         organization.tier === 'pro' ? '50 GB' : 
                         organization.tier === 'enterprise' ? '200 GB' : '1 TB'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '35%' }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">35% of storage capacity used</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">API Calls</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatNumber(stats?.apiCalls)} / 100,000
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 rounded-full" style={{ width: '15%' }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">15% of monthly quota</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button 
                    onClick={() => setActiveTab('activity')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New user added</p>
                      <p className="text-xs text-gray-600">Sarah Johnson joined as Technician</p>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Work order completed</p>
                      <p className="text-xs text-gray-600">WO-2024-1234 - HVAC maintenance</p>
                      <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Settings updated</p>
                      <p className="text-xs text-gray-600">Two-factor authentication enabled</p>
                      <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Organization Users</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage users and their access levels
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/settings/organizations/${organization.id}/invite`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite User
                </button>
              </div>
              
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-gray-900 font-medium mb-2">User management coming soon</h4>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  You'll be able to view and manage all users in this organization here.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Organization Settings</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure organization-wide settings
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/settings/organizations/${organization.id}/settings`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Configure
                </button>
              </div>
              
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-gray-900 font-medium mb-2">Settings configuration coming soon</h4>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  You'll be able to configure branding, security, and other organization settings here.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Billing & Subscription</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage plan, payment methods, and invoices
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/settings/organizations/${organization.id}/upgrade`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Upgrade Plan
                </button>
              </div>
              
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-gray-900 font-medium mb-2">Billing information coming soon</h4>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  You'll be able to view and manage your subscription, payment methods, and invoices here.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Track all activities across the organization
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
              
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-gray-900 font-medium mb-2">Activity log coming soon</h4>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  You'll be able to view detailed audit logs of all activities in this organization.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
                Are you sure you want to suspend <span className="font-semibold">{organization.name}</span>?
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for suspension
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
                  setShowSuspendConfirm(false);
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
                Are you sure you want to delete <span className="font-semibold">{organization.name}</span>?
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
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrganization}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
