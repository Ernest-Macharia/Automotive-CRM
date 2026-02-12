'use client';

import { X, CheckCircle2, AlertTriangle, Clock, RefreshCw, Calendar } from 'lucide-react';

interface SLAStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  slaStatus?: {
    compliant: boolean;
    breaches?: Array<{
      type: string;
      deadline: string;
      breachedAt: string;
    }>;
    deadlines?: Array<{
      type: string;
      dueDate: string;
      status: 'pending' | 'approaching' | 'breached';
    }>;
  };
  opportunityId: string;
  onCheck: () => Promise<void>;
}

export default function SLAStatusModal({
  isOpen,
  onClose,
  slaStatus,
  opportunityId,
  onCheck
}: SLAStatusModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const diff = due - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">SLA Status Details</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Overall Status */}
              <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
                slaStatus?.compliant === undefined ? 'bg-gray-100' :
                slaStatus.compliant ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {slaStatus?.compliant === undefined ? (
                  <Clock className="h-6 w-6 text-gray-600" />
                ) : slaStatus.compliant ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className={`font-semibold ${
                    slaStatus?.compliant === undefined ? 'text-gray-600' :
                    slaStatus.compliant ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {slaStatus?.compliant === undefined ? 'Not Checked' :
                     slaStatus.compliant ? 'SLA Compliant' : 'SLA Breached'}
                  </p>
                </div>
              </div>

              {/* Deadlines */}
              {slaStatus?.deadlines && slaStatus.deadlines.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Upcoming Deadlines</h3>
                  <div className="space-y-3">
                    {slaStatus.deadlines.map((deadline, index) => {
                      const daysRemaining = getDaysRemaining(deadline.dueDate);
                      return (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{deadline.type}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              deadline.status === 'breached' ? 'bg-red-100 text-red-700' :
                              deadline.status === 'approaching' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {deadline.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(deadline.dueDate)}
                          </div>
                          {deadline.status === 'approaching' && (
                            <p className="text-xs text-amber-600 mt-2">
                              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Breaches */}
              {slaStatus?.breaches && slaStatus.breaches.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">SLA Breaches</h3>
                  <div className="space-y-3">
                    {slaStatus.breaches.map((breach, index) => (
                      <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">{breach.type}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Deadline: {formatDate(breach.deadline)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Breached: {formatDate(breach.breachedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={async () => {
                  await onCheck();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Check SLA Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}