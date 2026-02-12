'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, FileText } from 'lucide-react';
import { LeaveRequest } from '@/services/settings/hrService';

interface LeaveApprovalModalProps {
  leaveRequest: LeaveRequest;
  onClose: () => void;
  onApprove: (data: { action: 'approved'; comments: string; days: number }) => Promise<void>;
  onDeny: (data: { action: 'denied'; comments: string }) => Promise<void>;
}

export default function LeaveApprovalModal({ 
  leaveRequest, 
  onClose, 
  onApprove, 
  onDeny 
}: LeaveApprovalModalProps) {
  const [action, setAction] = useState<'approved' | 'denied'>('approved');
  const [comments, setComments] = useState('');
  const [days, setDays] = useState(leaveRequest.days);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!comments.trim()) {
      setError('Please provide comments for this action');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (action === 'approved') {
        await onApprove({ action, comments, days });
      } else {
        await onDeny({ action, comments });
      }
      onClose();
    } catch (err) {
      setError('Failed to process leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${
              action === 'approved' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {action === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {action === 'approved' ? 'Approve Leave Request' : 'Deny Leave Request'}
              </h3>
              <p className="text-sm text-gray-600">
                {leaveRequest.employeeName} • {leaveRequest.leaveType}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Request Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Leave Period</span>
              <span className="font-medium text-gray-900">
                {new Date(leaveRequest.startDate).toLocaleDateString()} - {new Date(leaveRequest.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Days</span>
              <span className="font-medium text-gray-900">{leaveRequest.days} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Reason</span>
              <span className="font-medium text-gray-900">{leaveRequest.reason}</span>
            </div>
            {leaveRequest.leaveBalance && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Balance</span>
                <span className="font-medium text-gray-900">{leaveRequest.leaveBalance} days</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setAction('approved')}
              className={`flex-1 py-2.5 px-4 rounded-lg border transition-colors ${
                action === 'approved'
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Approve
            </button>
            <button
              onClick={() => setAction('denied')}
              className={`flex-1 py-2.5 px-4 rounded-lg border transition-colors ${
                action === 'denied'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Deny
            </button>
          </div>

          {/* Days Input - Only for approval */}
          {action === 'approved' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days to Approve
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  min="0.5"
                  max={leaveRequest.days}
                  step="0.5"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                <span className="text-sm text-gray-600">
                  of {leaveRequest.days} days requested
                </span>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows={3}
              placeholder={`Provide reason for ${action}...`}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              action === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                {action === 'approved' ? 'Approve Leave' : 'Deny Leave'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}