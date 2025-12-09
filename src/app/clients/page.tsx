'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Download,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserStats from '@/components/users/UserStats';
import UsersTable from '@/components/users/UsersTable';
import DeleteUserModal from '@/components/users/DeleteUserModal';
import UserFilters from '@/components/users/UserFilters';
import { userService, User as UserType } from '@/services/userService';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const router = useRouter();
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  // Available roles for dropdowns
  const [availableRoles, setAvailableRoles] = useState<
    Array<{ value: string; label: string; description?: string }>
  >([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data);
      setFilteredUsers(response.data);
      
      // Extract unique roles for filters
      const roles = Array.from(new Set(response.data.map(user => {
        const role = user.role;
        if (!role) return null;
        
        if (typeof role === 'string') {
          return role;
        }
        
        if (typeof role === 'object') {
          return role.name || role.display_name;
        }
        
        return String(role);
      }))).filter(Boolean) as string[];
      
      setAvailableRoles(roles.map(role => ({
        value: role,
        label: role.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      })));
      
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userRole = typeof user.role === 'string' ? user.role : user.role?.name;
        return userRole === roleFilter;
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.active : !user.active
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, statusFilter, users]);

  const handleToggleStatus = async (id: string, active: boolean) => {
    try {
      const updatedUser = await userService.toggleUserStatus(id, !active);
      setUsers(users.map(user => 
        user.id === id ? updatedUser : user
      ));
      toast.success(`User ${!active ? 'activated' : 'deactivated'} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const handleToggleSummaryAccess = async (id: string, currentAccess: boolean) => {
    try {
      const updatedUser = await userService.updateSummaryAccess(id, !currentAccess);
      setUsers(users.map(user => 
        user.id === id ? updatedUser : user
      ));
      toast.success(`Summary access ${!currentAccess ? 'granted' : 'revoked'} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update summary access');
    }
  };

  const handleExportUsers = async () => {
    try {
      const blob = await userService.exportUsers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Users exported successfully!');
    } catch (error) {
      toast.error('Failed to export users');
    }
  };

  const handleViewDetails = async (user: UserType) => {
    router.push(`/clients/users/details?id=${user.id}`);
  };

  const handleEditUser = async (user: UserType) => {
    router.push(`/clients/users/edit?id=${user.id}`);
  };

  const handleDeleteUser = async (user: UserType) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await userService.deleteUser(id);
      setUsers(users.filter(user => user.id !== id));
      toast.success('User deleted successfully!');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
      throw error;
    }
  };

  // Get unique roles for filters
  const roles = Array.from(new Set(users.map(user => {
    const role = user.role;
    
    if (!role) return 'Unknown';
    
    if (typeof role === 'string') {
      return role;
    }
    
    if (typeof role === 'object') {
      return role.name || role.display_name || 'Unknown';
    }
    
    return String(role);
  }))).filter(Boolean);

  // Handle bulk actions (future implementation)
  const handleBulkAction = (action: string, selectedIds: string[]) => {
    // Implement bulk actions like delete, activate, deactivate
    toast('Bulk actions coming soon!');
  };

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
        {/* Fixed Header */}
        <div className="h-16 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Users Management</h1>
                <p className="text-indigo-100 text-sm">Manage user accounts, roles, and permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchUsers()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium shadow-sm transition-all"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <button 
                onClick={handleExportUsers}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium shadow-sm transition-all"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button 
                onClick={() => router.push('/clients/users/create')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-indigo-600 text-sm font-medium shadow-lg transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 space-y-6 overflow-auto">
          {/* User Stats */}
          <UserStats users={users} loading={loading} />

          {/* Search and Filter Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users by name, email, phone, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                  disabled={loading}
                />
              </div>
              
              <div className="lg:w-auto">
                <UserFilters
                  roles={roles}
                  roleFilter={roleFilter}
                  statusFilter={statusFilter}
                  onRoleFilterChange={setRoleFilter}
                  onStatusFilterChange={setStatusFilter}
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Quick Stats */}
            {!loading && users.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">
                  Total: {users.length} users
                </span>
                <span className="text-xs text-green-600">
                  Active: {users.filter(u => u.active).length}
                </span>
                <span className="text-xs text-red-600">
                  Inactive: {users.filter(u => !u.active).length}
                </span>
                <span className="text-xs text-indigo-600">
                  With Summary Access: {users.filter(u => u.canViewSummary).length}
                </span>
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200/50 bg-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                  {!loading && users.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {filteredUsers.length} of {users.length} users
                      {searchQuery && ` for "${searchQuery}"`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                      Loading users...
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {filteredUsers.length} users found
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <UsersTable
              users={filteredUsers}
              loading={loading}
              onToggleStatus={handleToggleStatus}
              onToggleSummaryAccess={handleToggleSummaryAccess}
              onEditUser={handleEditUser}
              onViewDetails={handleViewDetails}
              onDeleteUser={handleDeleteUser}
            />
            
            {/* Empty State */}
            {!loading && filteredUsers.length === 0 && (
              <div className="py-12 text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {users.length === 0 ? 'No users found' : 'No matching users'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {users.length === 0 
                    ? 'Get started by creating your first user account.'
                    : 'Try adjusting your search or filter to find what you\'re looking for.'
                  }
                </p>
                {users.length === 0 && (
                  <button 
                    onClick={() => router.push('/clients/users/create')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-indigo-600 text-sm font-medium shadow-lg transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add User
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {showDeleteModal && selectedUser && (
          <DeleteUserModal
            user={selectedUser}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onDelete={handleConfirmDelete}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}