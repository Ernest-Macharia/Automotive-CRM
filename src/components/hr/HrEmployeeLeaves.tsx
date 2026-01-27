'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Filter, Search, ChevronDown, User, Mail, Phone } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, LeaveBalance, LeaveActionData } from '@/services/settings/hrService';

interface HREmployeeLeavesProps {
  profileId?: string;
}

export default function HREmployeeLeaves({ profileId }: HREmployeeLeavesProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [leaveData, setLeaveData] = useState<LeaveBalance | null>(null);
  const [allLeaves, setAllLeaves] = useState<LeaveBalance[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approved' | 'denied'>('approved');
  const [actionComments, setActionComments] = useState('');
  const [actionDays, setActionDays] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profileId) {
      loadEmployeeLeaves();
    } else {
      loadAllLeaves();
    }
  }, [profileId]);

  const loadEmployeeLeaves = async () => {
    try {
      setLoading(true);
      const details = await hrService.getEmployeeDetails(profileId!);
      // Transform employee details to leave balance format
      const leaveBalance: LeaveBalance = {
        employeeId: details.profile.employeeId,
        name: `${details.profile.firstName} ${details.profile.lastName}`,
        department: details.profile.department,
        position: details.profile.position,
        email: details.profile.personalEmail || '',
        leaveRecords: [],
        pendingActions: details.hrData.leaveHistory || [],
        totalLeaveAccrued: details.profile.totalLeaveAccrued || 0,
        totalLeaveUsed: details.profile.totalLeaveUsed || 0,
        currentLeaveBalance: details.profile.currentLeaveBalance || 0,
        profileId: details.profile.id,
      };
      setLeaveData(leaveBalance);
    } catch (error) {
      console.error('Error loading employee leaves:', error);
      showToast('Failed to load leave data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllLeaves = async () => {
    try {
      setLoading(true);
      const data = await hrService.getLeaveBalances();
      setAllLeaves(data);
    } catch (error) {
      console.error('Error loading all leaves:', error);
      showToast('Failed to load leave data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (employeeProfileId: string) => {
    try {
      const actionData: LeaveActionData = {
        action: selectedAction,
        comments: actionComments,
        days: selectedAction === 'approved' ? actionDays : undefined,
      };

      await hrService.handleLeaveAction(employeeProfileId, actionData);
      showToast(`Leave request ${selectedAction} successfully`, 'success');
      setShowActionModal(false);
      setActionComments('');
      
      if (profileId) {
        loadEmployeeLeaves();
      } else {
        loadAllLeaves();
      }
    } catch (error) {
      console.error('Error handling leave action:', error);
      showToast('Failed to process leave action', 'error');
    }
  };

  const calculateLeaveDays = (balance: LeaveBalance) => {
    return hrService.calculateTotalLeaveDays(balance);
  };

  const getBalanceColor = (days: number) => {
    if (days < 5) return 'text-red-600 bg-red-100';
    if (days < 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredLeaves = allLeaves.filter(leave => {
    const matchesSearch = searchTerm === '' || 
      leave.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const days = calculateLeaveDays(leave);
    if (filterStatus === 'critical') return matchesSearch && days.remaining < 5;
    if (filterStatus === 'low') return matchesSearch && days.remaining < 10;
    if (filterStatus === 'sufficient') return matchesSearch && days.remaining >= 10;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading leave data...</p>
      </div>
    );
  }

  if (profileId && leaveData) {
    const leaveDays = calculateLeaveDays(leaveData);
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Leave Management</h2>
            <p className="text-gray-600 mt-1">{leaveData.name}</p>
          </div>
          <button
            onClick={() => setShowActionModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Process Leave
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Accrued</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{leaveDays.accrued} days</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Current Balance</p>
                <p className={`text-2xl font-bold mt-1 ${getBalanceColor(leaveDays.remaining)}`}>
                  {leaveDays.remaining} days
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Used</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{leaveDays.used} days</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Pending Actions</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{leaveDays.pending} days</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {leaveData.pendingActions && leaveData.pendingActions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Leave Actions</h3>
            <div className="space-y-3">
              {leaveData.pendingActions.map((action, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {action.action === 'approved' ? 'Approval' : 'Denial'} Request
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {action.comments || 'No comments provided'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        action.action === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {action.action}
                      </span>
                      <span className="text-sm text-gray-600">{formatDate(action.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Leave Request</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedAction('approved')}
                      className={`flex-1 py-2 rounded-lg border ${
                        selectedAction === 'approved'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setSelectedAction('denied')}
                      className={`flex-1 py-2 rounded-lg border ${
                        selectedAction === 'denied'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      Deny
                    </button>
                  </div>
                </div>

                {selectedAction === 'approved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Days
                    </label>
                    <input
                      type="number"
                      value={actionDays}
                      onChange={(e) => setActionDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                      max={leaveDays.remaining}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments
                  </label>
                  <textarea
                    value={actionComments}
                    onChange={(e) => setActionComments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add comments about this leave action..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLeaveAction(profileId!)}
                  className={`px-4 py-2 text-white rounded-lg ${
                    selectedAction === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {selectedAction === 'approved' ? 'Approve Leave' : 'Deny Leave'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // All leaves view
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Employee Leave Balances</h2>
            <p className="text-gray-600 mt-1">Manage and monitor employee leave balances</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Balances</option>
              <option value="critical">Critical (&lt;5 days)</option>
              <option value="low">Low (&lt;10 days)</option>
              <option value="sufficient">Sufficient (10+ days)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Accrued</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Used</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pending</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((leave, index) => {
              const days = calculateLeaveDays(leave);
              const isCritical = days.remaining < 5;
              const isLow = days.remaining < 10;
              
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{leave.name}</p>
                        <p className="text-sm text-gray-600">{leave.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{leave.department}</p>
                      <p className="text-sm text-gray-600">{leave.position}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {leave.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium text-gray-900">{days.accrued}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium text-gray-900">{days.used}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBalanceColor(days.remaining)}`}>
                      {days.remaining} days
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium text-gray-900">{days.pending}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isCritical ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 text-sm">Critical</span>
                        </>
                      ) : isLow ? (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-600 text-sm">Low</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 text-sm">Sufficient</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => router.push(`/hr/leaves/${leave.profileId}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredLeaves.length === 0 && (
        <div className="py-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-700 font-medium">No leave data found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'No employee leave records available'}
          </p>
        </div>
      )}
    </div>
  );
}