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
  ArrowLeft,
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
  // ✅ Keep all your existing state, logic, and functions unchanged
  const router = useRouter();
  const { showToast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null); // ✅ for kebab menu

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
    setCurrentPage(1);
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
  const UserTableRow = ({ user }: { user: User }) => {
    const isActive = expandedRow === user.id;
    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={selectedUsers.includes(user.id)}
            onChange={() => handleSelectUser(user.id)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {getInitials(user.name)}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{user.name || 'No Name'}</div>
              <div className="text-sm text-gray-600 truncate max-w-[160px]">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            getRoleBadgeColor(userService.getUserRoleName(user)).split(' ')[0]
          }`}>
            {getRoleDisplayName(userService.getUserRoleDisplayName(user))}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {user.active ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">{user.active ? 'Active' : 'Inactive'}</span>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {user.canViewSummary ? (
              <Eye className="h-4 w-4 text-blue-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm">{user.canViewSummary ? 'Yes' : 'No'}</span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-gray-600">
          {formatDate(user.createdAt)}
        </td>
        <td className="px-4 py-4">
          {/* ✅ KEBAB MENU WITH TEXT ACTIONS */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedRow(expandedRow === user.id ? null : user.id);
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
                    onClick={() => router.push(`/settings/users/${user.id}`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => router.push(`/settings/users/${user.id}/edit`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit User
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(user)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete User
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
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and access permissions</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => router.push('/settings/users/create')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <UserPlus className="h-5 w-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Total Users', value: stats.total, icon: Users },
            { label: 'Active', value: stats.active, icon: UserCheck },
            { label: 'Admins', value: stats.admins, icon: Shield },
            { label: 'Summary Access', value: stats.withSummaryAccess, icon: Eye },
            { label: 'Inactive', value: stats.inactive, icon: UserX },
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
                placeholder="Search users..."
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({ role: 'all', status: 'all', search: '' })}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {filters.search ? 'Try a different search term' : 'Add your first user to get started'}
          </p>
          <button
            onClick={() => router.push('/settings/users/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Select</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Summary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, index) => {
                  const key = user.id 
                    ? `${user.id}-${user.email}-${index}`
                    : `user-${user.email}-${index}`;
                  return <UserTableRow key={key} user={user} />;
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 gap-3">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstUser} to {indexOfLastUser} of {filteredUsers.length} users
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
                <h3 className="font-semibold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-5">
              Are you sure you want to delete <strong>{showDeleteConfirm.name || showDeleteConfirm.email}</strong>?
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
                onClick={() => handleDeleteUser(showDeleteConfirm)}
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