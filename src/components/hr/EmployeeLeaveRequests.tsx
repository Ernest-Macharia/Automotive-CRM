'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle, XCircle, Clock, Plus, Search, Filter, FileText, User, Building } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { hrService, LeaveRequest } from '@/services/settings/hrService';

export default function EmployeeLeaveRequests() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
    supportingDocumentUrl: '',
    isEmergencyLeave: false,
    emergencyContact: '',
    contactDuringLeave: '',
  });

  useEffect(() => {
    loadMyLeaveRequests();
  }, [filterStatus]);

  const loadMyLeaveRequests = async () => {
    try {
      setLoading(true);
      const data = await hrService.getEmployeeLeaveRequests(filterStatus !== 'all' ? filterStatus : undefined);
      setLeaveRequests(data);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      showToast('Failed to load leave requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLeaveRequest = async () => {
    try {
      await hrService.submitLeaveRequest(newRequest);
      showToast('Leave request submitted successfully', 'success');
      setShowNewRequestModal(false);
      setNewRequest({
        leaveType: 'annual',
        startDate: '',
        endDate: '',
        days: 1,
        reason: '',
        supportingDocumentUrl: '',
        isEmergencyLeave: false,
        emergencyContact: '',
        contactDuringLeave: '',
      });
      loadMyLeaveRequests();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showToast('Failed to submit leave request', 'error');
    }
  };

  const calculateDays = () => {
    if (newRequest.startDate && newRequest.endDate) {
      const start = new Date(newRequest.startDate);
      const end = new Date(newRequest.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setNewRequest(prev => ({ ...prev, days: diffDays }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'denied': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (filterStatus !== 'all' && request.status !== filterStatus) return false;
    if (searchTerm && !request.reason.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading leave requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Leave Requests</h2>
            <p className="text-gray-600 mt-1">View and submit leave requests</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
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
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
            
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Request
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Leave Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Days</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request, index) => {
              const StatusIcon = getStatusIcon(request.status);
              
              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{request.leaveType.toUpperCase()} Leave</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{request.reason}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-900">
                      <Calendar className="h-3 w-3" />
                      {hrService.formatDate(request.startDate)} to {hrService.formatDate(request.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{request.days} days</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-900">
                      <Calendar className="h-3 w-3" />
                      {hrService.formatDate(request.submittedDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    {request.reviewedDate && (
                      <p className="text-xs text-gray-600 mt-1">
                        Reviewed on {hrService.formatDate(request.reviewedDate)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          // View details
                          showToast('Viewing request details', 'info');
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => {
                            // Cancel request
                            showToast('Request cancelled', 'success');
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Cancel Request"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredRequests.length === 0 && (
        <div className="py-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-700 font-medium">No leave requests found</h3>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'You have no leave requests'}
          </p>
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit Your First Request
          </button>
        </div>
      )}

      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Leave Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <select
                  value={newRequest.leaveType}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, leaveType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="compassionate">Compassionate Leave</option>
                  <option value="study">Study Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newRequest.startDate}
                    onChange={(e) => {
                      setNewRequest(prev => ({ ...prev, startDate: e.target.value }));
                      calculateDays();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newRequest.endDate}
                    onChange={(e) => {
                      setNewRequest(prev => ({ ...prev, endDate: e.target.value }));
                      calculateDays();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min={newRequest.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days
                </label>
                <input
                  type="number"
                  value={newRequest.days}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Leave
                </label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Please provide details about your leave request..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Document URL (Optional)
                </label>
                <input
                  type="text"
                  value={newRequest.supportingDocumentUrl}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, supportingDocumentUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/document.pdf"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emergencyLeave"
                  checked={newRequest.isEmergencyLeave}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, isEmergencyLeave: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="emergencyLeave" className="ml-2 text-sm text-gray-700">
                  This is an emergency leave request
                </label>
              </div>

              {newRequest.isEmergencyLeave && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={newRequest.emergencyContact}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Emergency contact person and phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact During Leave
                    </label>
                    <input
                      type="text"
                      value={newRequest.contactDuringLeave}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, contactDuringLeave: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="How you can be contacted during leave"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitLeaveRequest}
                disabled={!newRequest.startDate || !newRequest.endDate || !newRequest.reason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
