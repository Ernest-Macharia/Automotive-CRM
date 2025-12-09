import React, { useState } from 'react';
import { 
  X, AlertTriangle, User, Mail, Shield, 
  Trash2, ArrowLeft, CheckCircle
} from 'lucide-react';
import { User as UserType } from '@/services/userService';
import { toast } from 'react-hot-toast';

interface DeleteUserModalProps {
  user: UserType | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ 
  user, 
  onClose, 
  onDelete 
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');

  if (!user) return null;

  const handleDelete = async () => {
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }

    if (confirmationText !== user.email) {
      toast.error('Please type the email address correctly');
      return;
    }

    setLoading(true);
    try {
      await onDelete(user.id);
      toast.success('User deleted successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
      setConfirmStep(1);
    } finally {
      setLoading(false);
    }
  };

  const formatRoleName = (role: string | any): string => {
    if (typeof role === 'string') {
      return role.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    if (typeof role === 'object') {
      return role.display_name || role.name || 'Unknown';
    }
    
    return String(role);
  };

  const getImpactDetails = () => {
    const impacts = [];
    
    if (user.active) {
      impacts.push('Active user account');
    }
    
    if (user.canViewSummary) {
      impacts.push('Has summary access');
    }
    
    if (user.permissions && user.permissions.length > 0) {
      impacts.push(`${user.permissions.length} assigned permissions`);
    }
    
    return impacts;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className={`p-6 ${confirmStep === 1 ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-amber-600 to-orange-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                {confirmStep === 1 ? (
                  <Trash2 className="h-6 w-6 text-white" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {confirmStep === 1 ? 'Delete User' : 'Confirm Deletion'}
                </h2>
                <p className="text-red-100 text-sm">
                  {confirmStep === 1 ? 'Permanently remove user account' : 'Final confirmation required'}
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

        {/* Modal Content */}
        <div className="p-6">
          {confirmStep === 1 ? (
            <>
              {/* User Summary */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-900">
                      User to be deleted
                    </h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" />
                        {formatRoleName(user.role)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900 mb-2">
                      This action cannot be undone
                    </h3>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                        User account will be permanently deleted
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                        All associated data will be removed
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                        User will lose access to all systems immediately
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Impact Details */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Impact Summary
                </h4>
                <div className="space-y-2">
                  {getImpactDetails().map((impact, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                      {impact}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Final Confirmation */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900 mb-2">
                      Final Confirmation Required
                    </h3>
                    <p className="text-sm text-amber-800">
                      To confirm deletion, please type the user's email address:
                    </p>
                    <p className="text-sm font-medium text-amber-900 mt-2">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "{user.email}" to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all"
                  placeholder="Enter email address"
                  autoFocus
                />
              </div>

              {/* Additional Warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  This is your last chance to cancel. Deletion is immediate and permanent.
                </div>
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3">
            {confirmStep === 2 ? (
              <button
                type="button"
                onClick={() => setConfirmStep(1)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
            
            <button
              type="button"
              onClick={handleDelete}
              disabled={(confirmStep === 2 && confirmationText !== user.email) || loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                confirmStep === 1 
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                  : 'bg-gradient-to-r from-red-700 to-red-800 text-white hover:from-red-800 hover:to-red-900'
              }`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : confirmStep === 1 ? (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete User
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirm Permanent Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;