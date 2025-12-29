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
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { userService, User, USER_ROLES } from '@/services/settings/userService';

interface UserFilters {
  role: string;
  status: string;
  search: string;
}

interface UserManagementPageProps {
  onViewDetails?: (userId: string) => void;
  onEditUser?: (userId: string) => void;
  onCreateUser?: () => void;
}

export default function UserManagementPage({ 
  onViewDetails, 
  onEditUser, 
  onCreateUser 
}: UserManagementPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    status: 'all',
    search: '',
  });

  const usersPerPage = 10;
  const roles = Object.values(USER_ROLES);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(user => {
        const userName = user.name?.toLowerCase() || '';
        const userEmail = user.email.toLowerCase();
        const userRole = userService.getUserRoleName(user).toLowerCase();
        
        return (
          userName.includes(searchTerm) ||
          userEmail.includes(searchTerm) ||
          userRole.includes(searchTerm)
        );
      });
    }

    if (filters.role !== 'all') {
      result = result.filter(user => userService.getUserRoleName(user) === filters.role);
    }

    if (filters.status !== 'all') {
      result = result.filter(user =>
        filters.status === 'active' ? user.active : !user.active
      );
    }

    setFilteredUsers(result);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updatedUser = await userService.updateUser(user.id, { active: !user.active });
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      showToast(`User ${user.active ? 'deactivated' : 'activated'} successfully`, 'success');
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('Failed to update user status', 'error');
    }
  };

  const handleToggleSummaryAccess = async (user: User) => {
    try {
      const updatedUser = await userService.updateSummaryAccess(user.id, !user.canViewSummary);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      showToast(
        `Summary access ${user.canViewSummary ? 'revoked' : 'granted'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling summary access:', error);
      showToast('Failed to update summary access', 'error');
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      await userService.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast('User deleted successfully', 'success');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const handleSelectAll = () => {
    const currentUsers = getCurrentUsers();
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(user => user.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const getCurrentUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  };
  const currentUsers = getCurrentUsers();
  const indexOfFirstUser = (currentPage - 1) * usersPerPage + 1;
  const indexOfLastUser = Math.min(currentPage * usersPerPage, filteredUsers.length);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.active).length,
    inactive: users.filter(u => !u.active).length,
    admins: users.filter(u => userService.getUserRoleName(u) === USER_ROLES.ADMIN).length,
    withSummaryAccess: users.filter(u => u.canViewSummary).length,
    recent: users.filter(u => {
      if (!u.createdAt) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.createdAt) > weekAgo;
    }).length,
  }), [users]);

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      [USER_ROLES.ADMIN]: 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      [USER_ROLES.MANAGEMENT]: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      [USER_ROLES.TECHNICIAN]: 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      [USER_ROLES.SALES_REPRESENTATIVE]: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
      'customer_success': 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
      'finance': 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      'operations': 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600',
      [USER_ROLES.SUPPORT]: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      [USER_ROLES.CUSTOMER]: 'bg-stone-500/10 text-stone-700 border-stone-200 dark:bg-stone-900/30 dark:text-stone-400 dark:border-stone-800',
      [USER_ROLES.DEVELOPER]: 'bg-violet-500/10 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
  };

  const getInitials = (name: string | null | undefined): string => {
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

  const getRoleDisplayName = (role: string): string => {
    if (!role || typeof role !== 'string') {
      return 'Unknown';
    }
    
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString?: string) => {
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

  const UserTableRow = ({ user }: { user: User }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selectedUsers.includes(user.id)}
          onChange={() => handleSelectUser(user.id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">
              {getInitials(user.name)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white text-sm truncate" title={user.name || 'No Name'}>
              {user.name || 'No Name'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]" title={user.email}>
              {user.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userService.getUserRoleName(user))} whitespace-nowrap`}>
          {getRoleDisplayName(userService.getUserRoleDisplayName(user))}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          {user.active ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className="text-xs">{user.active ? 'Active' : 'Inactive'}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          {user.canViewSummary ? (
            <Eye className="h-3.5 w-3.5 text-blue-500" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-gray-400" />
          )}
          <span className="text-xs">{user.canViewSummary ? 'Yes' : 'No'}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end">
          <div className="relative group">
            <button className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 rounded-md transition-colors">
              <EllipsisVertical className="h-4 w-4" />
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-150">
              <div className="py-1">
                <button
                  onClick={() => router.push(`/settings/users/${user.id}`)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </button>
                <button
                  onClick={() => router.push(`/settings/users/${user.id}/edit`)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit User
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(user)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-b-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 truncate">Manage system users and access permissions</p>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all whitespace-nowrap"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => router.push('/settings/users/create')}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              <UserPlus className="h-5 w-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Summary Access</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.withSummaryAccess}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inactive}</p>
              </div>
              <UserX className="h-8 w-8 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Recent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.recent}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent truncate"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 truncate"
                >
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 truncate"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setFilters({ role: 'all', status: 'all', search: '' })}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No users found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {filters.search ? 'Try adjusting your search query' : 'Add your first user to get started'}
          </p>
          <button
            onClick={() => router.push('/settings/users/create')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap"
          >
            <UserPlus className="h-5 w-5" />
            Add First User
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px]">User</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Summary</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Created</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentUsers.map((user, index) => {
                  const key = user.id 
                    ? `${user.id}-${user.email}-${index}`
                    : `user-${user.email}-${index}`;
                  return <UserTableRow key={key} user={user} />;
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {indexOfFirstUser} to {indexOfLastUser} of {filteredUsers.length} users
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (totalPages <= 5) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }

                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }

                  if (pageNum === 2 && currentPage > 3) {
                    return <span key="ellipsis-start" className="px-2">...</span>;
                  }
                  if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="ellipsis-end" className="px-2">...</span>;
                  }

                  return null;
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete User</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{showDeleteConfirm.name || showDeleteConfirm.email}</strong>?
              All associated data will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}