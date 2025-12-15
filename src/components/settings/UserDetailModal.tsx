'use client';

import { X, Mail, Phone, Calendar, Shield, Users, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { User } from '@/services/settingsService';

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatRole(user.role)}
                    </span>
                    {user.active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Email Address</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">User ID</p>
                    <p className="text-sm text-gray-900 font-mono">{user.id}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Account Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {user.active ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-700">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {user.createdAt && (
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions & Access */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Permissions & Access
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Summary Access</p>
                    <div className="flex items-center gap-2 mt-1">
                      {user.canViewSummary ? (
                        <>
                          <Eye className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700">Granted</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Not Granted</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Role Permissions</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.permissions?.slice(0, 5).map((permission, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {permission}
                        </span>
                      ))}
                      {user.permissions && user.permissions.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{user.permissions.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">
                  Recent Activity
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {[
                      { action: 'Logged in', time: 'Today, 09:30 AM', status: 'success' },
                      { action: 'Updated profile', time: 'Yesterday, 02:15 PM', status: 'info' },
                      { action: 'Created new lead', time: 'Dec 14, 2024, 11:20 AM', status: 'success' },
                      { action: 'Modified permissions', time: 'Dec 13, 2024, 04:45 PM', status: 'warning' },
                    ].map((activity, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${
                              activity.status === 'success' ? 'bg-green-500' :
                              activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <span className="text-sm text-gray-800">{activity.action}</span>
                          </div>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-blue-600 font-medium text-sm">Send Reset Link</div>
                </button>
                <button className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-purple-600 font-medium text-sm">Edit Permissions</div>
                </button>
                <button className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-green-600 font-medium text-sm">View Logs</div>
                </button>
                <button className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-red-600 font-medium text-sm">Deactivate</div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}