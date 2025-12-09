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
import CreateUserModal from '@/components/users/CreateUserModal';
import UserFilters from '@/components/users/UserFilters';
import { userService, User as UserType } from '@/services/userService';
import { toast } from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data);
      setFilteredUsers(response.data);
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
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.active : !user.active
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, statusFilter, users]);

  const handleCreateUser = async (userData: any) => {
    try {
      const newUser = await userService.createUser(userData);
      setUsers([...users, newUser]);
      toast.success('User created successfully!');
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleRegisterUser = async (userData: any) => {
    try {
      const newUser = await userService.registerUser(userData);
      setUsers([...users, newUser]);
      toast.success('User registered successfully!');
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to register user');
    }
  };

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

  const handleEditUser = async (user: UserType) => {
    try {
      setSelectedUser(user);
      // For now, show a toast. You can implement edit modal later
      toast('Edit functionality coming soon!');
    } catch (error) {
      console.error('Error handling edit:', error);
    }
  };

  const handleViewDetails = async (user: UserType) => {
    try {
      setSelectedUser(user);
      toast('View details functionality coming soon!');
    } catch (error) {
      console.error('Error handling view details:', error);
    }
  };

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
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button 
                onClick={handleExportUsers}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium shadow-sm transition-all"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
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
                  className="pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                />
              </div>
              
              <div className="lg:w-auto">
                <UserFilters
                  roles={roles}
                  roleFilter={roleFilter}
                  statusFilter={statusFilter}
                  onRoleFilterChange={setRoleFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200/50 bg-white/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {filteredUsers.length} users found
                  </span>
                  {loading && (
                    <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
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
            />
          </div>
        </div>

        {/* Create/Register User Modal */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateUser}
            onRegister={handleRegisterUser}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}