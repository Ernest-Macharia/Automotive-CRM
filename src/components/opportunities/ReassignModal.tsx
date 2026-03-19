'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, User, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { opportunityService } from '@/services/opportunityService';
import { userService } from '@/services/userService';
import { useToast } from '@/contexts/ToastContext';

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReassign: (userId: string, notes?: string) => Promise<void>;
  currentAssignee: any;
  opportunityId: string;
}

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role?: string | { name?: string; display_name?: string };
  department?: string;
}

export default function ReassignModal({
  isOpen,
  onClose,
  onReassign,
  currentAssignee,
  opportunityId
}: ReassignModalProps) {
  const { showToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSalesUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId('');
      setNotes('');
      setSearchTerm('');
      setShowDropdown(false);
    }
  }, [isOpen]);

  const isSalesPerson = (user: User): boolean => {
    if (typeof user.role === 'string') {
      const lowerRole = user.role.toLowerCase();
      return lowerRole.includes('sales') || lowerRole.includes('representative');
    } else if (user.role && typeof user.role === 'object') {
      const roleName = user.role.name?.toLowerCase() || user.role.display_name?.toLowerCase() || '';
      return roleName.includes('sales') || roleName.includes('representative');
    }
    return false;
  };

  const fetchSalesUsers = async () => {
    try {
      setLoadingUsers(true);

      // Primary source: backend-scoped endpoint for available sales reps
      const repsData = await opportunityService.getAvailableSalesReps();
      const repsArray = Array.isArray(repsData) ? repsData : [];
      const normalizedReps: User[] = repsArray
        .map((rep: any) => ({
          id: rep?.id || rep?._id || rep?.userId || '',
          _id: rep?._id || rep?.id || rep?.userId || '',
          name: rep?.name || rep?.fullName || rep?.displayName || rep?.email || 'Unknown User',
          email: rep?.email || '',
          role: rep?.role || rep?.displayName || 'sales_representative',
          department: rep?.department,
        }))
        .filter((rep: User) => Boolean(rep.id || rep._id));

      if (normalizedReps.length > 0) {
        setUsers(normalizedReps);
        return;
      }

      // Fallback source: all users then local sales-role filtering
      const usersData = await userService.getAllUsers();

      let usersArray: User[] = [];
      if (!usersData) {
        usersArray = [];
      } else if (Array.isArray(usersData)) {
        usersArray = usersData;
      } else if (typeof usersData === 'object') {
        if ('data' in usersData && Array.isArray((usersData as any).data)) {
          usersArray = (usersData as any).data;
        } else if ('users' in usersData && Array.isArray((usersData as any).users)) {
          usersArray = (usersData as any).users;
        } else if ('items' in usersData && Array.isArray((usersData as any).items)) {
          usersArray = (usersData as any).items;
        }
      }

      const salesPeople = usersArray.filter((user) => isSalesPerson(user));
      setUsers(salesPeople || []);

      if (salesPeople.length === 0) {
        console.warn('No sales representatives found');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load sales representatives', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const getUserDisplayInfo = (user: User) => {
    return {
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      roleName: getUserRoleName(user),
      isSales: isSalesPerson(user),
      email: user.email || '',
      department: user.department || '',
    };
  };

  const getUserRoleName = (user: User): string => {
    if (typeof user.role === 'string') {
      return user.role;
    } else if (user.role && typeof user.role === 'object') {
      return user.role.name || user.role.display_name || 'User';
    }
    return 'User';
  };

  const filteredUsers = users
    .filter(user => {
      // Exclude current assignee
      if (currentAssignee && (
        user.id === currentAssignee._id ||
        user._id === currentAssignee._id ||
        user.id === currentAssignee.id ||
        user._id === currentAssignee.id
      )) {
        return false;
      }
      
      if (!searchTerm) return true;
      
      const displayInfo = getUserDisplayInfo(user);
      return (
        displayInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        displayInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        displayInfo.roleName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

  const handleSubmit = async () => {
    if (!selectedUserId) {
      showToast('Please select a sales representative', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await onReassign(selectedUserId, notes);
      onClose();
    } catch (error: any) {
      console.error('Error reassigning:', error);
      showToast(error.message || 'Failed to reassign opportunity', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Reassign Opportunity</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select a new sales representative to handle this opportunity
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Current Assignee */}
              {currentAssignee && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-800 mb-2">Currently Assigned To</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {(currentAssignee.name || currentAssignee.email?.split('@')[0] || 'Unassigned').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{currentAssignee.name || currentAssignee.email?.split('@')[0] || 'Unassigned'}</p>
                      <p className="text-sm text-gray-600">{currentAssignee.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Selection - Matches Create Page */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Sales Representative
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedUserId ? 
                        users.find(u => u.id === selectedUserId || u._id === selectedUserId)?.name || 
                        'Selected user' : 
                        searchTerm
                      }
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (selectedUserId) setSelectedUserId('');
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search for sales representative..."
                      className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showDropdown ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                              Loading sales team...
                            </div>
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">No sales representatives found</p>
                            <p className="text-xs mt-1">Add sales team members in user management</p>
                          </div>
                        ) : (
                          filteredUsers.map((user) => {
                            const displayInfo = getUserDisplayInfo(user);
                            const userId = user._id || user.id;
                            
                            return (
                              <button
                                key={userId}
                                type="button"
                                onClick={() => {
                                  setSelectedUserId(userId);
                                  setSearchTerm(displayInfo.name);
                                  setShowDropdown(false);
                                }}
                                className={`w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                                  selectedUserId === userId ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {displayInfo.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {displayInfo.name}
                                    </p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      displayInfo.roleName.toLowerCase().includes('sales') ? 
                                      'bg-orange-100 text-orange-800' : 
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {displayInfo.roleName}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{displayInfo.email}</p>
                                  {displayInfo.department && (
                                    <p className="text-xs text-gray-400 mt-1">{displayInfo.department}</p>
                                  )}
                                </div>
                                {selectedUserId === userId && (
                                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reassignment Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or context for the new assignee..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Reassigning this opportunity will notify the new assignee and update ownership permissions. 
                  This action will be logged in the opportunity history.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedUserId || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Reassigning...
                  </>
                ) : (
                  'Confirm Reassignment'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
