import React, { useState } from 'react';
import { X, User, Mail, Key, Shield, Phone, Building, Lock, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CreateUserModalProps {
  onClose: () => void;
  onCreate: (userData: any) => void;
  onRegister?: (userData: any) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onCreate, onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'technician',
    phone: '',
    department: '',
    permissions: [] as string[],
  });

  const [isAdminRegister, setIsAdminRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'management', label: 'Management', description: 'Management access' },
    { value: 'technician', label: 'Technician', description: 'Technical operations' },
    { value: 'sales_representative', label: 'Sales Representative', description: 'Sales and customer management' },
  ];

  const permissionsOptions = [
    'jobs.read',
    'jobs.create',
    'jobs.update',
    'jobs.delete',
    'users.read',
    'users.create',
    'users.update',
    'invoices.read',
    'invoices.create',
    'opportunities.read',
    'opportunities.create',
    'opportunities.update',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      // Prepare user data
      const userData = {
        name: formData.name || formData.email.split('@')[0],
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.department && { department: formData.department }),
        ...(formData.permissions.length > 0 && { permissions: formData.permissions }),
      };

      // Call appropriate function based on mode
      if (isAdminRegister && onRegister) {
        await onRegister(userData);
      } else {
        await onCreate(userData);
      }

      toast.success(`User ${isAdminRegister ? 'registered' : 'created'} successfully!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isAdminRegister ? 'register' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getRoleDescription = (roleValue: string) => {
    const role = roles.find(r => r.value === roleValue);
    return role?.description || '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                {isAdminRegister ? (
                  <Lock className="h-6 w-6 text-white" />
                ) : (
                  <UserPlus className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isAdminRegister ? 'Register New User (Admin)' : 'Create New User'}
                </h2>
                <p className="text-indigo-100 text-sm">
                  {isAdminRegister 
                    ? 'Admin-only registration with full permissions' 
                    : 'Create a new user account'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Admin Register Toggle */}
        {onRegister && (
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Registration Mode</p>
                <p className="text-xs text-gray-600">
                  {isAdminRegister 
                    ? 'Admin registration provides full system access' 
                    : 'Standard user creation'
                  }
                </p>
              </div>
              <button
                onClick={() => setIsAdminRegister(!isAdminRegister)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAdminRegister ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAdminRegister ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </div>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                placeholder="john@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password
                </div>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Confirm Password
                </div>
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                placeholder="••••••••"
                minLength={8}
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </div>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-600">
                {getRoleDescription(formData.role)}
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </div>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Department
                </div>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                placeholder="Engineering"
              />
            </div>
          </div>

          {/* Permissions Section (only for admin register mode) */}
          {isAdminRegister && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissionsOptions.map(permission => (
                  <label
                    key={permission}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isAdminRegister ? 'Registering...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isAdminRegister ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Register User
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create User
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;